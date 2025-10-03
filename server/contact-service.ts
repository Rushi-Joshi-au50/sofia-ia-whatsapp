import { db } from "../db";
import { sql } from "drizzle-orm";
import { startWhatsAppConnection } from "./connection";
import { addLogEntry } from "./storage";
import { WebSocketServer } from "ws";

// Adicionar a declaração para o global wss
declare global {
  var wss: WebSocketServer;
}

// Interfaces para tipagem
export interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  status: "pending" | "contacted" | "responded" | "scheduled" | "completed";
  lastMessage?: string | null;
  lastContact?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
  phoneNumber: string;
  name?: string;
}

export interface SendMessageRequest {
  contactIds: string[];
  message: string;
  useBusinessTemplate?: boolean; // Opção para usar o template de horário comercial
}

// Cache para controlar limites de envio (taxa de envio)
const messageQueue: {contactId: string, message: string, timestamp: number}[] = [];
let processingQueue = false;
const RATE_LIMIT_MS = 1000; // 1 segundo entre mensagens para evitar bloqueio

// Serviço para gerenciar contatos
export class ContactService {
  // Retorna todos os contatos
  static async getAllContacts(): Promise<Contact[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM contacts ORDER BY "createdAt" DESC
      `);
      
      // Transformar os resultados em objetos Contact
      return (result.rows as Record<string, unknown>[]).map(row => ({
        id: row.id as string,
        phoneNumber: row.phoneNumber as string,
        name: row.name as string | null,
        status: row.status as "pending" | "contacted" | "responded" | "scheduled" | "completed",
        lastMessage: row.lastMessage as string | null,
        lastContact: row.lastContact as Date | null,
        notes: row.notes as string | null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date
      }));
    } catch (error) {
      addLogEntry(`Erro ao buscar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return [];
    }
  }

  // Retorna um contato específico por ID
  static async getContactById(id: string): Promise<Contact | null> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM contacts WHERE id = ${id} LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0] as Record<string, unknown>;
      return {
        id: row.id as string,
        phoneNumber: row.phoneNumber as string,
        name: row.name as string | null,
        status: row.status as "pending" | "contacted" | "responded" | "scheduled" | "completed",
        lastMessage: row.lastMessage as string | null,
        lastContact: row.lastContact as Date | null,
        notes: row.notes as string | null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date
      };
    } catch (error) {
      addLogEntry(`Erro ao buscar contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return null;
    }
  }

  // Cria vários contatos de uma vez
  static async createContacts(contacts: CreateContactRequest[]): Promise<{success: boolean, count: number}> {
    try {
      if (contacts.length === 0) {
        return { success: true, count: 0 };
      }

      // Preparar valores para inserção
      const values = contacts.map(contact => `(
        '${generateId()}', 
        '${contact.phoneNumber}', 
        ${contact.name ? `'${contact.name}'` : 'NULL'}, 
        'pending', 
        NOW(), 
        NOW()
      )`).join(', ');

      // Executar inserção em massa
      await db.execute(sql`
        INSERT INTO contacts (id, "phoneNumber", name, status, "createdAt", "updatedAt")
        VALUES ${sql.raw(values)}
      `);

      return { success: true, count: contacts.length };
    } catch (error) {
      addLogEntry(`Erro ao criar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return { success: false, count: 0 };
    }
  }

  // Atualiza o status de um contato
  static async updateContactStatus(id: string, status: Contact['status']): Promise<boolean> {
    try {
      await db.execute(sql`
        UPDATE contacts 
        SET status = ${status}, "updatedAt" = NOW()
        WHERE id = ${id}
      `);
      return true;
    } catch (error) {
      addLogEntry(`Erro ao atualizar status do contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return false;
    }
  }

  // Envia mensagem para uma lista de contatos
  static async sendMessageToContacts(request: SendMessageRequest): Promise<{success: boolean, count: number}> {
    try {
      // Buscar os contatos no banco de dados
      const placeholders = request.contactIds.map(id => `'${id}'`).join(',');
      const result = await db.execute(sql`
        SELECT * FROM contacts WHERE id IN (${sql.raw(placeholders)})
      `);
      
      // Transformar resultados em objetos Contact
      const contacts = (result.rows as Record<string, unknown>[]).map(row => ({
        id: row.id as string,
        phoneNumber: row.phoneNumber as string,
        name: row.name as string | null,
        status: row.status as "pending" | "contacted" | "responded" | "scheduled" | "completed",
        lastMessage: row.lastMessage as string | null,
        lastContact: row.lastContact as Date | null,
        notes: row.notes as string | null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date
      }));
      
      if (contacts.length === 0) {
        return { success: false, count: 0 };
      }

      // Template padrão para mensagens comerciais
      const businessTemplate = "Bom dia tudo bem? Será programado no primeiro horário comercial até 18h30.";

      // Adicionar mensagens à fila
      contacts.forEach((contact, index) => {
        // Substituir os placeholders no template
        let personalizedMessage = request.message;
        personalizedMessage = personalizedMessage.replace(/{name}/g, contact.name || "");
        personalizedMessage = personalizedMessage.replace(/{date}/g, new Date().toLocaleDateString());
        personalizedMessage = personalizedMessage.replace(/{time}/g, new Date().toLocaleTimeString());
        
        // Se a opção de template comercial estiver ativada, aplicar o template
        if (request.useBusinessTemplate) {
          personalizedMessage = businessTemplate + "\n\n" + personalizedMessage;
        }

        // Adicionar à fila com prioridade baseada na posição
        messageQueue.push({
          contactId: contact.id,
          message: personalizedMessage,
          timestamp: Date.now()
        });
      });

      // Iniciar processamento da fila se não estiver em execução
      if (!processingQueue) {
        this.processMessageQueue();
      }

      // Atualizar o status e a última mensagem no banco de dados
      const updateValues = contacts.map(contact => `(
        '${contact.id}', 
        'contacted', 
        ${request.message ? `'${request.message.replace(/'/g, "''")}'` : 'NULL'}, 
        NOW()
      )`).join(', ');

      await db.execute(sql`
        UPDATE contacts AS c
        SET 
          status = v.status,
          "lastMessage" = v.last_message,
          "lastContact" = v.last_contact,
          "updatedAt" = NOW()
        FROM (VALUES ${sql.raw(updateValues)}) AS v(id, status, last_message, last_contact)
        WHERE c.id = v.id
      `);

      return { success: true, count: contacts.length };
    } catch (error) {
      addLogEntry(`Erro ao enviar mensagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return { success: false, count: 0 };
    }
  }

  // Processa a fila de mensagens com limite de taxa
  private static async processMessageQueue() {
    if (messageQueue.length === 0) {
      processingQueue = false;
      return;
    }

    processingQueue = true;
    const item = messageQueue.shift();
    
    if (!item) {
      processingQueue = false;
      return;
    }

    try {
      // Buscar o contato no banco de dados
      const result = await db.execute(sql`
        SELECT * FROM contacts WHERE id = ${item.contactId} LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        // Contato não encontrado, prosseguir para o próximo
        setTimeout(() => this.processMessageQueue(), RATE_LIMIT_MS);
        return;
      }

      // Transformar resultado em objeto Contact
      const row = result.rows[0] as Record<string, unknown>;
      const contact: Contact = {
        id: row.id as string,
        phoneNumber: row.phoneNumber as string,
        name: row.name as string | null,
        status: row.status as "pending" | "contacted" | "responded" | "scheduled" | "completed",
        lastMessage: row.lastMessage as string | null,
        lastContact: row.lastContact as Date | null,
        notes: row.notes as string | null,
        createdAt: row.createdAt as Date,
        updatedAt: row.updatedAt as Date
      };
      
      // Enviar mensagem através da conexão WhatsApp
      if (global.wss) {
        const whatsapp = await startWhatsAppConnection(global.wss);
        await whatsapp.sendMessage(contact.phoneNumber, item.message);
        addLogEntry(`Mensagem enviada para ${contact.phoneNumber}`, "success");
      } else {
        addLogEntry(`WebSocketServer não inicializado`, "error");
      }
    } catch (error) {
      addLogEntry(`Erro ao processar mensagem na fila: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
    }

    // Agendar processamento do próximo item
    setTimeout(() => this.processMessageQueue(), RATE_LIMIT_MS);
  }
}

// Função auxiliar para gerar IDs únicos
function generateId(): string {
  return `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
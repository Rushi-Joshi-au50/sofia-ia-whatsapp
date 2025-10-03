import { addLogEntry } from "./storage";
import { startWhatsAppConnection } from "./connection";
import { Contact } from "../shared/schema";

// Armazenamento em memória para contatos
const contactStore: Contact[] = [];

// Cache para controlar limites de envio (taxa de envio)
const messageQueue: {contactId: string, message: string, timestamp: number, priority?: number}[] = [];
let processingQueue = false;
const RATE_LIMIT_MS = 8000; // 8 segundos entre mensagens para evitar bloqueio do WhatsApp
const BATCH_SIZE = 10; // Número máximo de mensagens a serem enviadas antes de uma pausa maior
const BATCH_PAUSE_MS = 30000; // 30 segundos de pausa após enviar um lote de mensagens

export interface CreateContactRequest {
  phoneNumber: string;
  name?: string;
}

export interface SendMessageRequest {
  contactIds: string[];
  message: string;
  useBusinessTemplate?: boolean; // Opção para usar a mensagem padrão para empresas
}

// Serviço de contatos com armazenamento em memória
export const ContactStore = {
  // Retorna todos os contatos
  getAll: async (): Promise<Contact[]> => {
    return contactStore;
  },

  // Retorna um contato específico por ID
  getById: async (id: string): Promise<Contact | null> => {
    const contact = contactStore.find(c => c.id === id);
    return contact || null;
  },

  // Cria vários contatos de uma vez
  create: async (contacts: CreateContactRequest[]): Promise<{success: boolean, count: number}> => {
    try {
      if (contacts.length === 0) {
        return { success: true, count: 0 };
      }

      const newContacts = contacts.map(contact => ({
        id: generateId(),
        phoneNumber: contact.phoneNumber,
        name: contact.name || null,
        status: "pending" as const,
        lastMessage: null,
        lastContact: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Adicionar ao armazenamento em memória
      contactStore.push(...newContacts);

      return { success: true, count: contacts.length };
    } catch (error) {
      addLogEntry(`Erro ao criar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return { success: false, count: 0 };
    }
  },

  // Atualiza o status de um contato
  updateStatus: async (id: string, status: Contact['status']): Promise<boolean> => {
    try {
      const contactIndex = contactStore.findIndex(c => c.id === id);
      
      if (contactIndex === -1) return false;
      
      contactStore[contactIndex].status = status;
      contactStore[contactIndex].updatedAt = new Date();
      
      return true;
    } catch (error) {
      addLogEntry(`Erro ao atualizar status do contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return false;
    }
  },

  // Envia mensagem para uma lista de contatos
  sendMessage: async (request: SendMessageRequest): Promise<{success: boolean, count: number}> => {
    try {
      // Buscar os contatos no armazenamento em memória
      const contacts = contactStore.filter(c => request.contactIds.includes(c.id));
      
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

        // Adicionar à fila com prioridade baseada na posição (para preservar a ordem original)
        messageQueue.push({
          contactId: contact.id,
          message: personalizedMessage,
          timestamp: Date.now(),
          priority: contacts.length - index // Maior prioridade para os primeiros da lista
        });
      });

      // Iniciar processamento da fila se não estiver em execução
      if (!processingQueue) {
        processMessageQueue();
      }

      // Atualizar status e última mensagem no armazenamento será feito durante o processamento da fila
      // para garantir que apenas contatos que realmente receberam mensagens sejam atualizados

      return { success: true, count: contacts.length };
    } catch (error) {
      addLogEntry(`Erro ao enviar mensagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
      return { success: false, count: 0 };
    }
  }
};

// Contador para acompanhar o número de mensagens enviadas em um lote
let batchCounter = 0;
let lastMessageTime = 0;

// Processa a fila de mensagens com limite de taxa
async function processMessageQueue() {
  if (messageQueue.length === 0) {
    processingQueue = false;
    batchCounter = 0;
    return;
  }

  processingQueue = true;
  
  // Verificar se precisamos fazer uma pausa entre lotes
  const now = Date.now();
  if (batchCounter >= BATCH_SIZE && now - lastMessageTime < BATCH_PAUSE_MS) {
    addLogEntry(`Pausa entre lotes de mensagens (${batchCounter} mensagens enviadas). Aguardando ${Math.round((BATCH_PAUSE_MS - (now - lastMessageTime)) / 1000)} segundos...`, "info");
    
    // Agendar verificação novamente após o tempo completo
    setTimeout(() => processMessageQueue(), BATCH_PAUSE_MS - (now - lastMessageTime));
    return;
  } else if (batchCounter >= BATCH_SIZE) {
    // Reset do contador após pausa completa
    batchCounter = 0;
    addLogEntry(`Retomando o processamento de mensagens após pausa entre lotes`, "info");
  }
  
  // Obter o próximo item da fila (ordenando por prioridade se disponível)
  // messageQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const item = messageQueue.shift();
  
  if (!item) {
    processingQueue = false;
    return;
  }

  try {
    // Buscar o contato no armazenamento em memória
    const contact = contactStore.find(c => c.id === item.contactId);
    
    if (!contact) {
      // Contato não encontrado, prosseguir para o próximo
      setTimeout(() => processMessageQueue(), RATE_LIMIT_MS);
      return;
    }

    // Enviar mensagem através da conexão WhatsApp
    if (global.wss) {
      const whatsapp = await startWhatsAppConnection(global.wss);
      await whatsapp.sendMessage(contact.phoneNumber, item.message);
      
      // Atualizar o contador de lote e o timestamp da última mensagem
      batchCounter++;
      lastMessageTime = Date.now();
      
      // Registrar o envio
      addLogEntry(`Mensagem enviada para ${contact.phoneNumber} (${contact.name || 'Sem nome'}) [${batchCounter}/${BATCH_SIZE}]`, "success");
      
      // Atualizar o status do contato
      const contactIndex = contactStore.findIndex(c => c.id === contact.id);
      if (contactIndex !== -1) {
        contactStore[contactIndex].status = "contacted";
        contactStore[contactIndex].lastMessage = item.message;
        contactStore[contactIndex].lastContact = new Date();
        contactStore[contactIndex].updatedAt = new Date();
      }
    } else {
      addLogEntry(`WebSocketServer não inicializado`, "error");
    }
  } catch (error) {
    addLogEntry(`Erro ao processar mensagem na fila: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "error");
  }

  // Agendar processamento do próximo item
  setTimeout(() => processMessageQueue(), RATE_LIMIT_MS);
}

// Função auxiliar para gerar IDs únicos
function generateId(): string {
  return `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
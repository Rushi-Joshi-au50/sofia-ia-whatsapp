import { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { addLogEntry, LogLevel, getWebhookSettings } from "./storage";
import axios from "axios";
import { queueWebhookPayload } from "./webhook-queue";
import { addMessage } from "./message-store";
import { ContactStore } from "./contact-store";

// Importar processIncomingMessage de forma condicional para evitar erros de inicialização
let processIncomingMessage: (message: string, phoneNumber: string, contactName?: string) => Promise<string>;

try {
  // Tentar importar o serviço OpenAI
  import("./openai-service").then(module => {
    processIncomingMessage = module.processIncomingMessage;
    console.log("Serviço OpenAI carregado com sucesso");
  }).catch(error => {
    console.error("Erro ao carregar o serviço OpenAI:", error);
    // Fallback para uma função simples no caso de falha
    processIncomingMessage = async (message) => `Resposta automática: Recebemos sua mensagem "${message.substring(0, 30)}...". Um atendente entrará em contato em breve.`;
  });
} catch (error) {
  console.error("Erro ao importar serviço OpenAI:", error);
  // Fallback para uma função simples no caso de falha
  processIncomingMessage = async (message) => `Resposta automática: Recebemos sua mensagem "${message.substring(0, 30)}...". Um atendente entrará em contato em breve.`;
}

// Create auth directory if it doesn't exist
const AUTH_DIR = path.join(process.cwd(), "auth");
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR);
}

// Keep track of clients
let clients: Set<WebSocket> = new Set();

// Connection state
let connectionState = {
  isConnected: false,
  phoneNumber: null as string | null,
  qrCode: null as string | null,
  qrTimer: 0,
};

// Implement connection management
export async function startWhatsAppConnection(wss: WebSocketServer) {
  log("Starting WhatsApp connection...", "info");

  // Initialize auth state
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  // Create WhatsApp socket
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.ubuntu("Chrome"),
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);
  
  // Cache para rastrear mensagens processadas e evitar duplicação
  const processedMessages = new Map<string, number>();
  
  // Limpar mensagens antigas do cache a cada hora
  setInterval(() => {
    const now = Date.now();
    // Remover mensagens mais antigas que 1 hora
    for (const [id, timestamp] of processedMessages.entries()) {
      if (now - timestamp > 60 * 60 * 1000) {
        processedMessages.delete(id);
      }
    }
  }, 30 * 60 * 1000); // Executar a cada 30 minutos
  
  // Handle incoming messages
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type === "notify") {
      const messages = m.messages;
      
      for (const msg of messages) {
        // Only process new messages from others (not from us)
        if (!msg.key.fromMe && msg.message) {
          try {
            // Criar um ID único para a mensagem
            const messageId = msg.key.id || 'unknown';
            const remoteJid = msg.key.remoteJid || 'unknown';
            const timestamp = msg.messageTimestamp || Date.now() / 1000;
            const uniqueId = `${remoteJid}_${messageId}_${timestamp}`;
            
            // Verificar se já processamos esta mensagem
            if (processedMessages.has(uniqueId)) {
              // Mensagem já foi processada, pular
              log(`Mensagem duplicada detectada, ignorando: ${uniqueId}`, "info");
              continue;
            }
            
            // Marcar como processada
            processedMessages.set(uniqueId, Date.now());
            
            const sender = msg.key.remoteJid?.split('@')[0] || 'unknown';
            const messageContent = msg.message.conversation || 
                                 msg.message.extendedTextMessage?.text || 
                                 'Media message';

            // Store message in memory
            addMessage(sender, messageContent);
            
            log(`Received message from ${sender}: ${messageContent}`, "info");
            
            // Processar com Sofia AI (OpenAI)
            try {
              // Tentar encontrar o contato para personalização
              let contactName: string | undefined = undefined;
              try {
                // Se o contato existir no armazenamento, usar o nome dele
                const contacts = await ContactStore.getAll();
                const contact = contacts.find(c => c.phoneNumber.includes(sender));
                if (contact?.name) {
                  contactName = contact.name;
                }
              } catch (contactError) {
                log(`Erro ao buscar contato: ${contactError instanceof Error ? contactError.message : 'Unknown error'}`, "warning");
              }
              
              // Processar mensagem e gerar resposta
              let aiReply = "Olá! Recebemos sua mensagem. Estamos processando e retornaremos em breve.";
              
              try {
                if (typeof processIncomingMessage === 'function') {
                  aiReply = await processIncomingMessage(messageContent, sender, contactName);
                } else {
                  log("Serviço de IA ainda não inicializado completamente, usando resposta padrão", "warning");
                }
              } catch (iaError) {
                log(`Erro ao processar resposta de IA: ${iaError instanceof Error ? iaError.message : 'Unknown error'}`, "error");
              }
              
              // Enviar resposta da IA
              await sock.sendMessage(msg.key.remoteJid!, {
                text: aiReply
              });
              
              log(`Resposta enviada para ${sender}: ${aiReply.substring(0, 50)}...`, "success");
            } catch (aiError) {
              log(`Erro ao processar com IA: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`, "error");
            }
            
            // Forward to external webhook if configured
            const webhookSettings = getWebhookSettings();
            const webhookUrl = process.env.WHATSAPP_BOT_WEBHOOK || webhookSettings.webhookUrl;
            
            if ((webhookSettings.active || process.env.WHATSAPP_BOT_WEBHOOK) && webhookUrl) {
              const webhookPayload = {
                sender,
                message: messageContent,
                timestamp: msg.messageTimestamp,
                messageId: msg.key.id,
                raw: msg
              };
              
              log(`Adding message to webhook queue`, "info");
              queueWebhookPayload(webhookPayload);
            }
          } catch (error) {
            log(`Error processing message: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`, "error");
          }
        }
      }
    }
  });

  // Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log("QR code generated for authentication", "info");
      connectionState.qrCode = qr;
      connectionState.qrTimer = 60; // QR expires in 60 seconds

      // Send QR code to all connected clients
      broadcastToClients({
        type: "qr",
        qrCode: qr,
        timeout: 60,
      });

      // Start QR timer countdown
      startQRTimer();
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      log(`Connection closed: ${(lastDisconnect?.error as Boom)?.output?.payload?.message || "Unknown error"}`, "error");
      connectionState.isConnected = false;
      connectionState.phoneNumber = null;
      
      broadcastToClients({
        type: "connection",
        connected: false,
        phoneNumber: null,
      });

      if (shouldReconnect) {
        log("Reconnecting to WhatsApp...", "info");
        setTimeout(() => startWhatsAppConnection(wss), 5000);
      } else {
        log("Logged out, clearing auth data", "warning");
        clearAuthData();
      }
    } else if (connection === "open") {
      // Get the connected phone number
      const phoneNumber = sock.user?.id.split(":")[0];
      
      log(`Successfully connected to WhatsApp as ${phoneNumber}`, "success");
      connectionState.isConnected = true;
      connectionState.phoneNumber = phoneNumber || null;
      connectionState.qrCode = null;
      
      broadcastToClients({
        type: "connection",
        connected: true,
        phoneNumber,
      });
    }
  });

  // Handle client connections to WebSocket
  wss.on("connection", (ws) => {
    log("New client connected to WebSocket", "info");
    clients.add(ws);

    // Send current state to the new client
    ws.send(JSON.stringify({
      type: "connection",
      connected: connectionState.isConnected,
      phoneNumber: connectionState.phoneNumber,
    }));

    if (connectionState.qrCode && !connectionState.isConnected) {
      ws.send(JSON.stringify({
        type: "qr",
        qrCode: connectionState.qrCode,
        timeout: connectionState.qrTimer,
      }));
    }

    // Handle client messages (like refresh QR request)
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "refresh_qr" && !connectionState.isConnected) {
          log("Refreshing QR code at client request", "info");
          // There's no direct way to refresh QR in Baileys
          // We need to restart the connection
          sock.logout();
          setTimeout(() => startWhatsAppConnection(wss), 1000);
        } else if (data.type === "clear_logs") {
          // This would typically clear logs in a database
          // For now we'll just notify clients
          broadcastToClients({
            type: "log",
            message: "Logs cleared",
            level: "info",
          });
        }
      } catch (error) {
        console.error("Error parsing client message:", error);
      }
    });

    // Handle client disconnection
    ws.on("close", () => {
      clients.delete(ws);
      log("Client disconnected from WebSocket", "info");
    });
  });

  // Ping periódico para manter o webhook ativo
  setInterval(() => {
    const settings = getWebhookSettings();
    const webhookUrl = process.env.WHATSAPP_BOT_WEBHOOK || settings.webhookUrl;
    
    if ((settings.active || process.env.WHATSAPP_BOT_WEBHOOK) && webhookUrl && connectionState.isConnected) {
      log("Sending keepalive ping to webhook", "info");
      queueWebhookPayload({
        type: "keepalive",
        timestamp: Date.now(),
        status: "connected",
        phoneNumber: connectionState.phoneNumber
      });
    }
  }, 60000); // A cada minuto

  // Export the function to send messages
  return {
    async sendMessage(to: string, message: string) {
      try {
        if (!connectionState.isConnected) {
          throw new Error("Not connected to WhatsApp");
        }

        // Format to phone number and add the WhatsApp suffix
        const formattedNumber = `${to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
        
        log(`Sending message to ${to}...`, "info");
        
        // Send the message
        await sock.sendMessage(formattedNumber, { text: message });
        
        log(`Message sent successfully to ${to}`, "success");
        return { success: true, message: "Message sent successfully" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log(`Error sending message: ${errorMessage}`, "error");
        return { success: false, message: errorMessage };
      }
    },

    async disconnect() {
      try {
        await sock.logout();
        log("Manually disconnected from WhatsApp", "info");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log(`Error disconnecting: ${errorMessage}`, "error");
        return { success: false, message: errorMessage };
      }
    },

    // Get connection status
    getConnectionStatus() {
      return {
        isConnected: connectionState.isConnected,
        phoneNumber: connectionState.phoneNumber,
      };
    }
  };
}

// Helper function to log and broadcast
function log(message: string, level: LogLevel) {
  console.log(`[WhatsApp] ${message}`);
  
  // Add to the database
  addLogEntry(message, level);
  
  // Broadcast to clients
  broadcastToClients({
    type: "log",
    message,
    level,
  });
}

// Broadcast message to all connected WebSocket clients
function broadcastToClients(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// QR code timer countdown
function startQRTimer() {
  if (connectionState.qrTimer <= 0) return;
  
  const interval = setInterval(() => {
    connectionState.qrTimer--;
    
    if (connectionState.qrTimer <= 0) {
      clearInterval(interval);
      if (!connectionState.isConnected) {
        connectionState.qrCode = null;
        broadcastToClients({
          type: "qr_timeout",
        });
        log("QR code has expired", "warning");
      }
    }
  }, 1000);
}

// Clear auth data
function clearAuthData() {
  try {
    fs.rmdirSync(AUTH_DIR, { recursive: true });
    fs.mkdirSync(AUTH_DIR);
    log("Auth data cleared successfully", "info");
  } catch (error) {
    log(`Error clearing auth data: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
  }
}

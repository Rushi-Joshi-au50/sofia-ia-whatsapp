import axios from "axios";
import { getWebhookSettings, addLogEntry } from "./storage";

// Interfaces para a fila
interface WebhookQueueItem {
  payload: any;
  retries: number;
  lastAttempt: number;
}

// Configurações da fila
const webhookQueue: WebhookQueueItem[] = [];
const MAX_RETRIES = 3; // Definido para 3 tentativas máximas conforme solicitado
const RETRY_INTERVAL = 5000; // 5 segundos
let webhookProcessorRunning = false;

// Função para processar a fila de webhook
export async function processWebhookQueue() {
  if (webhookProcessorRunning) return;
  
  webhookProcessorRunning = true;
  
  try {
    while (webhookQueue.length > 0) {
      const settings = getWebhookSettings();
      const webhookUrl = process.env.WHATSAPP_BOT_WEBHOOK || settings.webhookUrl;
      
      // Verifique se o webhook está ativo e configurado
      if (!settings.active || !webhookUrl) {
        // Se webhook está desativado, limpe a fila
        webhookQueue.length = 0;
        break;
      }
      
      const item = webhookQueue[0]; // Pegue o primeiro item sem remover
      const now = Date.now();
      
      // Verifique se está na hora de tentar novamente
      if (item.lastAttempt > 0 && now - item.lastAttempt < RETRY_INTERVAL) {
        // Muito cedo para tentar novamente
        break;
      }
      
      // Tente enviar para o webhook
      try {
        item.lastAttempt = now;
        
        addLogEntry(`Tentativa de webhook ${item.retries + 1}/${MAX_RETRIES + 1}`, "info");
        
        const response = await axios({
          method: 'post',
          url: webhookUrl,
          data: item.payload,
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000, // 8 segundos timeout
          validateStatus: () => true // Aceita qualquer código de status
        });
        
        if (response.status >= 200 && response.status < 300) {
          addLogEntry(`Webhook entregue com sucesso: ${response.status}`, "success");
          webhookQueue.shift(); // Remove se bem-sucedido
        } else {
          addLogEntry(`Resposta de erro do webhook: ${response.status}`, "warning");
          
          item.retries++;
          if (item.retries > MAX_RETRIES) {
            addLogEntry(`Máximo de tentativas atingido (${MAX_RETRIES}), descartando item da fila`, "error");
            webhookQueue.shift(); // Remove após max tentativas
          }
        }
      } catch (error) {
        addLogEntry(`Erro ao enviar webhook: ${error instanceof Error ? error.message : 'Desconhecido'}`, "error");
        
        item.retries++;
        if (item.retries > MAX_RETRIES) {
          addLogEntry(`Máximo de tentativas atingido (${MAX_RETRIES}) após erro, descartando item da fila`, "error");
          webhookQueue.shift(); // Remove após max tentativas
        }
      }
      
      // Pausa pequena entre solicitações para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally {
    webhookProcessorRunning = false;
    
    // Se ainda houver itens na fila, agende para processar novamente
    if (webhookQueue.length > 0) {
      setTimeout(processWebhookQueue, RETRY_INTERVAL);
    }
  }
}

// Função auxiliar para adicionar à fila de webhook
export function queueWebhookPayload(payload: any) {
  webhookQueue.push({
    payload,
    retries: 0, 
    lastAttempt: 0
  });
  
  // Inicie o processador se não estiver rodando
  if (!webhookProcessorRunning) {
    processWebhookQueue();
  }
}
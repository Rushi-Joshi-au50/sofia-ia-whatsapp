import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { startWhatsAppConnection } from "./connection";
import { addLogEntry, getLatestLogs, clearLogs, getWebhookSettings, updateWebhookSettings } from "./storage";
import hybridRoutes from "./hybrid-routes.js";
// Usar armazenamento em memória em vez do banco de dados
import { ContactStore, CreateContactRequest, SendMessageRequest } from "./contact-store";
import { ExcelService } from "./excel-service";
// Removendo importações de rotas que estão causando problemas
// import vapiCallRoute from "./vapi-call";
// import vapiTesterRoute from "./vapi-tester";
// import vapiDirectTestRoute from "./vapi-direct-test";
import * as vapiService from './vapi-call';
import bulkCallsRouter from './bulk-calls';
import { enviarLeads } from './enviar-leads';
import { importContactsFromJson } from "./import-contacts";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time communication with path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws"
  });
  
  // Armazenar o WSS globalmente para acesso em outros módulos
  global.wss = wss;
  
  // Comentando as rotas da Vapi que estão causando problemas
  // app.use('/api', vapiCallRoute);
  // app.use('/api', vapiTesterRoute);
  // app.use('/api', vapiDirectTestRoute);
  
  // Registrar rota para chamadas em massa
  app.use('/api', bulkCallsRouter);
  
  // Registrar rotas híbridas (admin/cliente + HubSpot)
  app.use('/api/hybrid', hybridRoutes);
  
  // Nova rota para fazer chamadas Vapi
  app.post('/api/vapi-call', async (req, res) => {
    try {
      const { phoneNumber, message, assistantId, voice } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "Número de telefone é obrigatório"
        });
      }
      
      const result = await vapiService.processVapiCall(
        phoneNumber, 
        message, 
        assistantId, 
        voice
      );
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro ao processar chamada Vapi:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Rota simples para testar a API Vapi diretamente (formato alternativo)
  app.get("/api/vapi-tester", (req, res) => {
    // Criando uma interface simples para testar a API Vapi
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Testador da API Vapi</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #6b21a8;
              text-align: center;
            }
            .form-group {
              margin-bottom: 15px;
            }
            label {
              display: block;
              font-weight: bold;
              margin-bottom: 5px;
            }
            input, textarea {
              width: 100%;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 16px;
            }
            textarea {
              height: 100px;
            }
            button {
              background-color: #7e22ce;
              color: white;
              border: none;
              padding: 12px 20px;
              font-size: 16px;
              border-radius: 4px;
              cursor: pointer;
              width: 100%;
            }
            button:hover {
              background-color: #6b21a8;
            }
            .result {
              margin-top: 20px;
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 4px;
              background-color: #f5f5f5;
              display: none;
            }
            .alert {
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 15px;
            }
            .alert-success {
              background-color: #d1fae5;
              border: 1px solid #34d399;
              color: #065f46;
            }
            .alert-error {
              background-color: #fee2e2;
              border: 1px solid #f87171;
              color: #b91c1c;
            }
            .logo {
              text-align: center;
              margin-bottom: 20px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
          </style>
        </head>
        <body>
          <div class="logo">
            <h1>Sofia DED Company</h1>
            <p>Sistema de Chamadas para Eventos Alternativos</p>
          </div>
          
          <div class="card">
            <h2>Fazer Chamada com a Sofia</h2>
            <div class="form-group">
              <label for="phone">Número de Telefone (formato internacional):</label>
              <input type="text" id="phone" placeholder="+5548XXXXXXXX" required>
            </div>
            
            <div class="form-group">
              <label for="message">Mensagem Inicial (opcional):</label>
              <textarea id="message" placeholder="Olá! Aqui é a Sofia da DED Company..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="voice">Voz:</label>
              <select id="voice">
                <option value="nova" selected>Nova (Português BR)</option>
                <option value="alloy">Alloy</option>
                <option value="shimmer">Shimmer</option>
              </select>
            </div>
            
            <button id="callButton">Iniciar Chamada</button>
          </div>
          
          <div id="result" class="result">
            <h3>Resultado</h3>
            <pre id="resultContent"></pre>
          </div>
          
          <script>
            document.getElementById('callButton').addEventListener('click', async function() {
              const phoneNumber = document.getElementById('phone').value;
              const message = document.getElementById('message').value;
              const voice = document.getElementById('voice').value;
              
              if (!phoneNumber) {
                alert('Por favor, insira um número de telefone');
                return;
              }
              
              const resultElement = document.getElementById('result');
              const resultContentElement = document.getElementById('resultContent');
              
              resultElement.style.display = 'block';
              resultContentElement.innerHTML = 'Iniciando chamada...';
              resultElement.className = 'result';
              
              try {
                const response = await fetch('/api/vapi-call', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    phoneNumber,
                    message,
                    voice
                  }),
                });
                
                const data = await response.json();
                
                if (data.success) {
                  resultElement.className = 'result alert-success';
                  resultContentElement.innerHTML = 'Chamada iniciada com sucesso! ID: ' + data.callId;
                } else {
                  resultElement.className = 'result alert-error';
                  resultContentElement.innerHTML = 'Erro ao iniciar chamada: ' + (data.error || 'Erro desconhecido');
                }
              } catch (error) {
                resultElement.className = 'result alert-error';
                resultContentElement.innerHTML = 'Erro: ' + error.message;
              }
            });
          </script>
        </body>
      </html>
    `);
  });
  
  // Start WhatsApp connection
  const whatsapp = await startWhatsAppConnection(wss);
  
  // Endpoint to send a message
  app.post("/api/send", async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "Both 'to' and 'message' are required" 
        });
      }
      
      const result = await whatsapp.sendMessage(to, message);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send message" 
      });
    }
  });
  
  // Endpoint to disconnect from WhatsApp
  app.post("/api/disconnect", async (req, res) => {
    try {
      const result = await whatsapp.disconnect();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to disconnect" 
      });
    }
  });
  
  // Endpoint to get the connection status
  app.get("/api/status", (req, res) => {
    const status = whatsapp.getConnectionStatus();
    res.status(200).json(status);
  });
  
  // Endpoint to get logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await getLatestLogs(limit);
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to get logs" 
      });
    }
  });
  
  // Endpoint to clear logs
  app.post("/api/logs/clear", async (req, res) => {
    try {
      const result = await clearLogs();
      
      if (result) {
        res.status(200).json({ success: true, message: "Logs cleared successfully" });
      } else {
        res.status(400).json({ success: false, message: "Failed to clear logs" });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to clear logs" 
      });
    }
  });
  
  // Endpoint to get webhook settings
  app.get("/api/webhook-settings", (req, res) => {
    const settings = getWebhookSettings();
    res.status(200).json(settings);
  });
  
  // Endpoint to get stored messages
  app.get("/messages", (req, res) => {
    const { messageStore } = require('./message-store');
    res.send(`
      <html>
        <head><title>Mensagens WhatsApp</title></head>
        <body>
          <h1>Mensagens Recebidas</h1>
          <ul>
            ${messageStore.map((msg: {timestamp: number, from: string, body: string}) => `
              <li>${new Date(msg.timestamp).toLocaleString()} - ${msg.from}: ${msg.body}</li>
            `).join('')}
          </ul>
          <script>
            setInterval(() => location.reload(), 5000);
          </script>
        </body>
      </html>
    `);
  });
  
  // Endpoint to update webhook settings
  app.post("/api/webhook-settings", (req, res) => {
    try {
      const { active, port, webhookUrl } = req.body;
      const settings = updateWebhookSettings({ 
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(typeof port === 'number' ? { port } : {}),
        ...(webhookUrl ? { webhookUrl } : {})
      });
      
      res.status(200).json(settings);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to update webhook settings" 
      });
    }
  });
  
  // Endpoint for webhook
  app.post("/api/webhook", (req, res) => {
    try {
      const settings = getWebhookSettings();
      
      if (!settings.active) {
        return res.status(503).json({ success: false, message: "Webhook is not active" });
      }
      
      // Process webhook data (not implemented in this demo)
      // You would typically parse the request body and perform actions based on the webhook data
      
      // Log webhook receipt
      addLogEntry("Received webhook call", "info");
      
      res.status(200).json({ success: true, message: "Webhook received" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to process webhook" 
      });
    }
  });

  // === ROTAS DE GERENCIAMENTO DE CONTATOS ===
  
  // Obter todos os contatos
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await ContactStore.getAll();
      res.status(200).json(contacts);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao buscar contatos" 
      });
    }
  });
  
  // Obter um contato específico por ID
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await ContactStore.getById(req.params.id);
      
      if (!contact) {
        return res.status(404).json({ 
          success: false, 
          message: "Contato não encontrado" 
        });
      }
      
      res.status(200).json(contact);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao buscar contato" 
      });
    }
  });
  
  // Criar novos contatos
  app.post("/api/contacts", async (req, res) => {
    try {
      const contactsToCreate = req.body;
      
      if (!Array.isArray(contactsToCreate) || contactsToCreate.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados de contato inválidos. Forneça um array de contatos." 
        });
      }
      
      // Validar cada contato
      for (const contact of contactsToCreate) {
        if (!contact.phoneNumber) {
          return res.status(400).json({ 
            success: false, 
            message: "Cada contato deve ter um número de telefone" 
          });
        }
      }
      
      const result = await ContactStore.create(contactsToCreate as CreateContactRequest[]);
      
      if (result.success) {
        res.status(201).json({ 
          success: true, 
          message: `${result.count} contatos criados com sucesso` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Falha ao criar contatos" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao criar contatos" 
      });
    }
  });
  
  // Atualizar o status de um contato
  app.patch("/api/contacts/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status || !["pending", "contacted", "responded", "scheduled", "completed"].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Status inválido" 
        });
      }
      
      const result = await ContactStore.updateStatus(req.params.id, status);
      
      if (result) {
        res.status(200).json({ 
          success: true, 
          message: "Status atualizado com sucesso" 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Falha ao atualizar status" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao atualizar status" 
      });
    }
  });
  
  // Enviar mensagens para contatos
  app.post("/api/contacts/send-message", async (req, res) => {
    try {
      const { contactIds, message, useBusinessTemplate } = req.body as SendMessageRequest;
      
      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "IDs de contato inválidos" 
        });
      }
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: "Mensagem é obrigatória" 
        });
      }
      
      // Incluir a opção de template comercial
      const result = await ContactStore.sendMessage({ 
        contactIds, 
        message,
        useBusinessTemplate
      });
      
      if (result.success) {
        res.status(200).json({ 
          success: true, 
          message: `Mensagem enviada para ${result.count} contatos`,
          count: result.count 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Falha ao enviar mensagens" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao enviar mensagens" 
      });
    }
  });
  
  // Listar planilhas Excel disponíveis
  app.get("/api/excel/files", (req, res) => {
    try {
      const files = ExcelService.getAvailableExcelFiles();
      
      const fileInfo = files.map(file => ({
        path: file,
        name: file.split('/').pop() || ''
      }));
      
      res.status(200).json(fileInfo);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao listar arquivos Excel" 
      });
    }
  });
  
  // Importar contatos de uma planilha Excel
  app.post("/api/excel/import", async (req, res) => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ 
          success: false, 
          message: "Caminho do arquivo é obrigatório" 
        });
      }
      
      // Processar a planilha
      const contacts = await ExcelService.processExcelFile(filePath);
      
      if (contacts.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Nenhum contato válido encontrado na planilha" 
        });
      }
      
      // Criar os contatos
      const result = await ContactStore.create(contacts);
      
      if (result.success) {
        res.status(200).json({ 
          success: true, 
          message: `${result.count} contatos importados com sucesso`,
          count: result.count 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Falha ao importar contatos" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao importar contatos da planilha" 
      });
    }
  });
  
  // Endpoint para simular envio de mensagem para um número específico
  app.post("/api/simulate-message", async (req, res) => {
    try {
      const { phoneNumber, message, useBusinessTemplate } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "Número de telefone e mensagem são obrigatórios" 
        });
      }
      
      // Normalizar número de telefone (adicionar prefixo do país se necessário)
      let normalizedNumber = phoneNumber;
      if (!normalizedNumber.startsWith("+")) {
        if (!normalizedNumber.startsWith("55")) {
          normalizedNumber = "55" + normalizedNumber;
        }
      }
      
      // Remover caracteres não numéricos, exceto o sinal de +
      normalizedNumber = normalizedNumber.startsWith("+") 
        ? "+" + normalizedNumber.substring(1).replace(/\D/g, '')
        : normalizedNumber.replace(/\D/g, '');
      
      // Adicionar @ para formato de Baileys
      const formattedNumber = normalizedNumber + "@s.whatsapp.net";
      
      // Preparar mensagem com template de horário comercial se solicitado
      let finalMessage = message;
      if (useBusinessTemplate) {
        finalMessage = "Bom dia tudo bem? Será programado no primeiro horário comercial até 18h30\n\n" + message;
      }
      
      // Enviar mensagem usando o Baileys
      const result = await whatsapp.sendMessage(formattedNumber, finalMessage);
      
      // Registrar no log
      await addLogEntry(`Mensagem simulada para ${phoneNumber}: ${result.success ? 'Sucesso' : 'Falha'}`, 
                   result.success ? "success" : "error");
      
      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
        phoneNumber: phoneNumber,
        timestamp: new Date()
      });
      
    } catch (error) {
      // Registrar erro no log
      await addLogEntry(`Erro ao simular mensagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`, "error");
      
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao simular envio de mensagem",
        phoneNumber: req.body.phoneNumber,
        timestamp: new Date()
      });
    }
  });
  
  // Endpoint para exportar contatos em formato CSV/Excel
  app.post("/api/export", async (req, res) => {
    try {
      const { exportType, format, statusFilter, startDate, endDate, includeTimestamps } = req.body;
      
      // Buscar todos os contatos
      const contacts = await ContactStore.getAll();
      
      // Aplicar filtros
      let filteredContacts = [...contacts];
      
      // Filtrar por status
      if (statusFilter && statusFilter !== "all") {
        filteredContacts = filteredContacts.filter(
          contact => contact.status === statusFilter
        );
      }
      
      // Filtrar por data inicial
      if (startDate) {
        const fromDate = new Date(startDate);
        fromDate.setHours(0, 0, 0, 0);
        
        filteredContacts = filteredContacts.filter(contact => {
          if (!contact.updatedAt) return true;
          const contactDate = new Date(contact.updatedAt);
          return contactDate >= fromDate;
        });
      }
      
      // Filtrar por data final
      if (endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        
        filteredContacts = filteredContacts.filter(contact => {
          if (!contact.updatedAt) return true;
          const contactDate = new Date(contact.updatedAt);
          return contactDate <= toDate;
        });
      }
      
      // Verificar se há dados para exportar
      if (filteredContacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Não há contatos que correspondam aos filtros selecionados"
        });
      }
      
      // Preparar objeto de resposta
      res.status(200).json({
        success: true,
        message: `${filteredContacts.length} registros exportados com sucesso`,
        count: filteredContacts.length,
        data: filteredContacts,
        exportInfo: {
          type: exportType,
          format: format,
          statusFilter: statusFilter,
          includeTimestamps: includeTimestamps,
          timestamp: new Date()
        }
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao exportar dados" 
      });
    }
  });
  
  // Endpoint para importar contatos da Sofia de um arquivo JSON
  app.post("/api/import-sofia-contacts", async (req, res) => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: "Caminho do arquivo é obrigatório"
        });
      }
      
      await addLogEntry(`Solicitação de importação de contatos Sofia do arquivo: ${filePath}`, "info");
      
      // Importar contatos do arquivo JSON
      const importResult = await importContactsFromJson(filePath);
      
      if (importResult.success) {
        res.status(200).json({
          success: true,
          message: `${importResult.imported} contatos importados com sucesso de ${importResult.total} contatos no arquivo`,
          total: importResult.total,
          imported: importResult.imported,
          failed: importResult.failed,
          summary: importResult.summary
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Falha ao importar contatos",
          errors: importResult.errors,
          total: importResult.total,
          imported: importResult.imported,
          failed: importResult.failed
        });
      }
      
    } catch (error) {
      await addLogEntry(`Erro ao importar contatos Sofia: ${error instanceof Error ? error.message : "Erro desconhecido"}`, "error");
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Falha ao importar contatos Sofia"
      });
    }
  });
  
  // Endpoint para iniciar chamadas via Vapi
  app.post("/api/start-call", async (req, res) => {
    try {
      const { to, from, assistant_id } = req.body;
      
      // Validar parâmetros
      if (!to || !from) {
        return res.status(400).json({
          success: false,
          message: "Parâmetros 'to' e 'from' são obrigatórios"
        });
      }
      
      // Verificar se a chave da Vapi está configurada
      const vapiApiKey = process.env.VAPI_API_KEY;
      if (!vapiApiKey) {
        return res.status(400).json({
          success: false,
          message: "VAPI_API_KEY não está configurada no ambiente"
        });
      }
      
      // Normalizar número de telefone de destino
      let normalizedTo = to;
      if (!normalizedTo.startsWith("+")) {
        normalizedTo = "+" + normalizedTo.replace(/\D/g, '');
      }
      
      // Preparar payload para a API da Vapi
      const payload = {
        to: normalizedTo,
        from: from,
        assistant_id: assistant_id || "0c6644fb-3b97-42bb-a739-02e176968e41" // ID padrão da Sofia
      };
      
      // Registrar no log
      await addLogEntry(`Iniciando chamada telefônica via Vapi para ${normalizedTo}`, "info");
      
      // Fazer requisição para a API da Vapi
      const response = await fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${vapiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await addLogEntry(`Chamada iniciada com sucesso: ${data.call_id || "ID não disponível"}`, "success");
        
        res.status(200).json({
          success: true,
          message: "Chamada iniciada com sucesso",
          call_id: data.call_id,
          status: data.status || "initiated"
        });
      } else {
        await addLogEntry(`Erro ao iniciar chamada: ${data.message || data.error || "Erro desconhecido"}`, "error");
        
        res.status(response.status).json({
          success: false,
          message: data.message || data.error || "Erro ao iniciar chamada",
          error_code: data.code || response.status
        });
      }
      
    } catch (error) {
      // Registrar erro no log
      await addLogEntry(`Exceção ao tentar iniciar chamada: ${error instanceof Error ? error.message : "Erro desconhecido"}`, "error");
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Falha ao iniciar chamada"
      });
    }
  });

  // Endpoint para envio de leads da Sofia
  app.post("/api/enviar-leads", async (req, res) => {
    try {
      await addLogEntry("Solicitação de envio de leads recebida", "info");
      
      // Executar o script de envio de leads
      const resultado = await enviarLeads();
      
      if (resultado.success) {
        res.status(200).json({
          success: true,
          message: resultado.message,
          log: resultado.log
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.message,
          error: resultado.error,
          log: resultado.log
        });
      }
    } catch (error) {
      await addLogEntry(`Erro ao processar envio de leads: ${error instanceof Error ? error.message : "Erro desconhecido"}`, "error");
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Falha ao enviar leads"
      });
    }
  });
  
  // 🤖 Endpoint GPT Analytics
  app.get("/api/gpt-analytics", async (req, res) => {
    try {
      const { generateGPTInsights } = await import('./openai-service');
      const insights = await generateGPTInsights();
      res.status(200).json(insights);
    } catch (error) {
      res.status(500).json({
        insight: "Análise temporariamente indisponível",
        stats: { total: 0, frios: 0, mornos: 0, quentes: 0, conversoes: 0 }
      });
    }
  });

  // Endpoint para obter logs de mensagens do sistema Sofia
  app.get("/api/sofia/logs", async (req, res) => {
    try {
      // Tenta ler o arquivo de logs
      const fs = require('fs');
      const path = require('path');
      
      // Verifica se existe o arquivo de logs
      const logPath = path.join(process.cwd(), 'mensagens_whatsapp.txt');
      
      if (fs.existsSync(logPath)) {
        // Lê o conteúdo do arquivo
        const logContent = fs.readFileSync(logPath, 'utf8');
        res.send(logContent);
      } else {
        // Se o arquivo não existir, cria um vazio
        fs.writeFileSync(logPath, 'Sistema Sofia - Logs de mensagens iniciado.\n');
        res.send('Nenhum log de mensagem disponível. Sistema iniciado agora.');
      }
    } catch (error) {
      console.error('Erro ao ler logs do sistema Sofia:', error);
      res.status(500).send('Erro ao ler logs do sistema.');
    }
  });

  // Endpoint para exportar relatório
  app.get("/api/export/report", async (req, res) => {
    try {
      // Aqui deveria haver uma função de exportação de relatório
      // Como não temos acesso à implementação original, vamos retornar um erro por enquanto
      res.status(501).json({
        success: false,
        message: "Funcionalidade de exportação de relatório não implementada"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Falha ao exportar relatório" 
      });
    }
  });

  return httpServer;
}

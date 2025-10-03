import express from 'express';
import { addLogEntry } from './storage';

const router = express.Router();

// Rota para mostrar um formulário HTML que permite testar diferentes variações da API Vapi
router.get('/vapi-tester', (req, res) => {
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
          }
          h1 {
            color: #333;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input, select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }
          button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 4px;
            white-space: pre-wrap;
            word-break: break-all;
          }
          .success {
            background-color: #dff0d8;
            color: #3c763d;
          }
          .error {
            background-color: #f2dede;
            color: #a94442;
          }
        </style>
      </head>
      <body>
        <h1>Testador da API Vapi</h1>
        <div>
          <form id="vapiForm">
            <div class="form-group">
              <label for="apiUrl">URL da API:</label>
              <input type="text" id="apiUrl" name="apiUrl" value="https://api.vapi.ai/v1/calls" required>
            </div>
            <div class="form-group">
              <label for="phone">Número de Telefone:</label>
              <input type="text" id="phone" name="phone" value="+5548998205960" required>
            </div>
            <div class="form-group">
              <label for="assistant">ID da Assistente:</label>
              <input type="text" id="assistant" name="assistant" value="0c6644fb-3b97-42bb-a739-02e176968e41" required>
            </div>
            <div class="form-group">
              <label for="voice">Voz:</label>
              <select id="voice" name="voice">
                <option value="nova">Nova</option>
                <option value="dawn">Dawn</option>
                <option value="onyx">Onyx</option>
                <option value="sage">Sage</option>
                <option value="shimmer">Shimmer</option>
              </select>
            </div>
            <div class="form-group">
              <label for="firstMessage">Mensagem Inicial:</label>
              <textarea id="firstMessage" name="firstMessage" rows="4" required>Olá! Aqui é a Sofia, consultora virtual. Estou entrando em contato para falar sobre oportunidades na área de eventos. Tudo bem conversarmos agora?</textarea>
            </div>
            <div class="form-group">
              <label for="extraFields">Campos Adicionais (JSON):</label>
              <textarea id="extraFields" name="extraFields" rows="4">{}</textarea>
            </div>
            <button type="submit">Iniciar Chamada</button>
          </form>
        </div>
        
        <div id="result" class="result" style="display: none;"></div>
        
        <script>
          document.getElementById('vapiForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const resultDiv = document.getElementById('result');
            resultDiv.className = 'result';
            resultDiv.style.display = 'block';
            resultDiv.textContent = 'Enviando requisição...';
            
            const apiUrl = document.getElementById('apiUrl').value;
            const phone = document.getElementById('phone').value;
            const assistant = document.getElementById('assistant').value;
            const voice = document.getElementById('voice').value;
            const firstMessage = document.getElementById('firstMessage').value;
            let extraFields = {};
            
            try {
              extraFields = JSON.parse(document.getElementById('extraFields').value);
            } catch (error: any) {
              resultDiv.className = 'result error';
              resultDiv.textContent = 'Erro nos campos adicionais: ' + (error?.message || 'Erro de parseamento JSON');
              return;
            }
            
            // Montar payload
            const payload = {
              phone,
              assistant,
              voice,
              firstMessage,
              ...extraFields
            };
            
            try {
              // Enviar requisição para o backend
              const response = await fetch('/api/direct-vapi-call', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  apiUrl,
                  payload
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                resultDiv.className = 'result success';
                resultDiv.innerHTML = '<h3>✅ Chamada iniciada com sucesso!</h3>' +
                                     '<p>ID da chamada: ' + (data.callId || 'N/A') + '</p>' +
                                     '<h4>Resposta completa:</h4>' +
                                     '<pre>' + JSON.stringify(data.response, null, 2) + '</pre>';
              } else {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = '<h3>❌ Erro ao iniciar chamada</h3>' +
                                     '<p>' + data.error + '</p>' +
                                     '<h4>Detalhes:</h4>' +
                                     '<pre>' + JSON.stringify(data.details, null, 2) + '</pre>';
              }
            } catch (error: any) {
              resultDiv.className = 'result error';
              resultDiv.textContent = 'Erro na requisição: ' + (error?.message || 'Erro desconhecido');
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Endpoint para fazer chamada direta para API da Vapi
router.post('/direct-vapi-call', async (req, res) => {
  const { apiUrl, payload } = req.body;
  
  if (!apiUrl || !payload) {
    return res.status(400).json({
      success: false,
      error: 'URL da API e payload são obrigatórios'
    });
  }
  
  try {
    // Registrar tentativa
    await addLogEntry(`Testando API Vapi diretamente: ${apiUrl}`, "info");
    
    // Buscar API key do ambiente
    const vapiKey = process.env.VAPI_API_KEY;
    if (!vapiKey) {
      return res.status(500).json({
        success: false,
        error: 'Chave da API Vapi não configurada'
      });
    }
    
    // Log do payload
    console.log('Payload para Vapi:', JSON.stringify(payload));
    
    // Fazer requisição à API usando fetch nativo
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Obter dados da resposta
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }
    
    // Se a requisição falhou
    if (!response.ok) {
      await addLogEntry(`Erro no teste da API Vapi: ${response.status} ${response.statusText}`, "error");
      
      return res.status(500).json({
        success: false,
        error: `${response.status} ${response.statusText}`,
        details: responseData
      });
    }
    
    // Requisição bem-sucedida
    await addLogEntry(`Teste da API Vapi bem-sucedido: ${responseData.id || responseData.call_id || 'ID não disponível'}`, "success");
    
    return res.json({
      success: true,
      callId: responseData.id || responseData.call_id || 'ID não disponível',
      response: responseData
    });
    
  } catch (error: any) {
    // Log do erro
    console.error('Erro ao testar API Vapi:', error);
    await addLogEntry(`Erro ao testar API Vapi: ${error?.message || 'Erro desconhecido'}`, "error");
    
    // Retornar erro
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro desconhecido',
      details: error
    });
  }
});

export default router;
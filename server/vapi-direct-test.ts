import axios from 'axios';
import { addLogEntry } from './storage';

/**
 * Função para testar diferentes configurações da API Vapi
 * Este arquivo pode ser executado diretamente para testar sem depender da interface web
 */
export async function testVapiCall(phoneNumber: string): Promise<any> {
  try {
    // Configuração da API
    const VAPI_KEY = process.env.VAPI_API_KEY;
    const ASSISTANT_ID = '0c6644fb-3b97-42bb-a739-02e176968e41'; // ID da Sofia na Vapi
    
    // Verificar se a chave API está configurada
    if (!VAPI_KEY) {
      throw new Error('Chave da API Vapi não configurada');
    }
    
    // Normalizar número de telefone
    let normalizedPhone = phoneNumber;
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone.replace(/\D/g, '');
    }
    
    // Log
    await addLogEntry(`Iniciando teste direto da API Vapi para ${normalizedPhone}`, "info");
    
    // Opções de URL para tentar
    // Possíveis URLs para a API da Vapi
    const urlOptions = [
      'https://api.vapi.ai/v1/calls',
      'https://api.vapi.ai/calls',
      'https://api.vapi.ai/v1/call',
      'https://api.vapi.ai/api/v1/calls',
      'https://api.vapi.ai/api/calls'
    ];
    
    // Variações de payload para tentar
    const payloadOptions = [
      // Opção 1: padrão que estamos usando
      {
        assistant: ASSISTANT_ID,
        phone: normalizedPhone,
        voice: "nova",
        firstMessage: "Olá! Aqui é a Sofia, consultora virtual. Estou entrando em contato para falar sobre oportunidades na área de eventos. Tudo bem conversarmos agora?"
      },
      
      // Opção 2: formato alternativo
      {
        assistant_id: ASSISTANT_ID,
        to: normalizedPhone,
        voice: "nova",
        first_message: "Olá! Aqui é a Sofia, consultora virtual. Estou entrando em contato para falar sobre oportunidades na área de eventos. Tudo bem conversarmos agora?"
      },
      
      // Opção 3: formato simplificado
      {
        assistant: ASSISTANT_ID,
        phone: normalizedPhone,
      }
    ];
    
    // Tentar todas as combinações de URL e payload
    const results = [];
    
    for (const url of urlOptions) {
      for (let index = 0; index < payloadOptions.length; index++) {
        const payload = payloadOptions[index];
        try {
          console.log(`Tentativa ${results.length + 1}: URL=${url}, Payload=${JSON.stringify(payload)}`);
          
          const response = await axios.post(url, payload, {
            headers: {
              'Authorization': `Bearer ${VAPI_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Se chegou aqui, a requisição foi bem-sucedida
          const result = {
            success: true,
            url,
            payload,
            payloadIndex: index,
            response: response.data,
            status: response.status
          };
          
          await addLogEntry(`Teste direto bem-sucedido: ${url} com payload ${index}`, "success");
          console.log('✅ Sucesso:', result);
          
          // Adicionar aos resultados e retornar imediatamente se for bem-sucedido
          results.push(result);
          return result;
          
        } catch (error: any) {
          // Log do erro
          const errorResult = {
            success: false,
            url,
            payload,
            payloadIndex: index,
            error: error?.response?.data || error?.message || 'Erro desconhecido',
            status: error?.response?.status
          };
          
          console.log('❌ Erro:', errorResult);
          await addLogEntry(`Teste direto falhou: ${url} com payload ${index}`, "error");
          
          // Adicionar aos resultados
          results.push(errorResult);
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    await addLogEntry(`Todos os testes diretos da API Vapi falharam`, "error");
    
    // Retornar todos os resultados para análise
    return {
      success: false,
      message: 'Todas as tentativas falharam',
      results
    };
    
  } catch (error: any) {
    // Erro geral
    await addLogEntry(`Erro no teste direto da API Vapi: ${error?.message || 'Erro desconhecido'}`, "error");
    console.error('Erro no teste direto:', error);
    
    return {
      success: false,
      message: error?.message || 'Erro desconhecido',
      error
    };
  }
}

// Função para adicionar rota de teste à API
import express from 'express';

const router = express.Router();

// Endpoint para testar API Vapi diretamente
router.get('/vapi-direct-test', async (req, res) => {
  try {
    // Extrair número de telefone da query string
    const phone = req.query.phone as string || '+5548998205960';
    
    // Executar o teste
    const result = await testVapiCall(phone);
    
    // Renderizar resultado como HTML para fácil visualização
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teste Direto da API Vapi</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .success { background-color: #dff0d8; color: #3c763d; padding: 15px; border-radius: 4px; }
            .error { background-color: #f2dede; color: #a94442; padding: 15px; border-radius: 4px; }
            .result { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 4px; }
            pre { white-space: pre-wrap; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>Teste Direto da API Vapi</h1>
          
          <div class="${result.success ? 'success' : 'error'}">
            <h2>${result.success ? '✅ Teste bem-sucedido!' : '❌ Teste falhou'}</h2>
            <p>${result.message || (result.success ? 'Chamada iniciada com sucesso' : 'Todas as tentativas falharam')}</p>
          </div>
          
          <div class="result">
            <h3>Resultado detalhado:</h3>
            <pre>${JSON.stringify(result, null, 2)}</pre>
          </div>
          
          <p><a href="/">Voltar para o aplicativo</a></p>
        </body>
      </html>
    `);
    
  } catch (error: any) {
    // Erro ao renderizar
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro no Teste da API Vapi</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .error { color: #721c24; background: #f8d7da; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Teste da API Vapi</h1>
          <div class="error">
            <h2>❌ Erro ao executar teste</h2>
            <p>${error?.message || 'Erro desconhecido'}</p>
          </div>
          <p><a href="/">Voltar para o aplicativo</a></p>
        </body>
      </html>
    `);
  }
});

export default router;
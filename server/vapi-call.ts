import axios from 'axios';

// ID do assistente Sofia na Vapi
const VAPI_ASSISTANT_ID = "0c6644fb-3b97-42bb-a739-02e176968e41";

// Script padrão para chamadas com abordagem assertiva para eventos
const DEFAULT_SCRIPT = `Olá! Aqui é a Sofia da DED Company. Estamos oferecendo uma consultoria gratuita para casas e eventos que querem aumentar suas vendas sem depender só do Instagram — especialmente para quem sofre com bloqueios por causa do conteúdo mais ousado. Nós já geramos resultados impressionantes: um cliente investiu R$9 mil e retornou R$1,8 milhão. Você tem dois minutos para conversarmos sobre isso agora?`;

// Opções de voz disponíveis
export const VOICE_OPTIONS = {
  NOVA: "nova", // Voz feminina português brasileiro
  ALLOY: "alloy", 
  SHIMMER: "shimmer",
  DEFAULT: "nova"
};

/**
 * Função para processar uma chamada Vapi
 * @param phoneNumber Número de telefone no formato internacional (+5548XXXXXXXX)
 * @param message Mensagem inicial a ser falada pelo assistente
 * @param assistantId ID do assistente na Vapi (opcional, usa padrão Sofia se não fornecido)
 * @param voice Voz a ser usada pelo assistente (usa "nova" - português BR por padrão)
 */
export async function processVapiCall(
  phoneNumber: string, 
  message: string = DEFAULT_SCRIPT,
  assistantId: string = VAPI_ASSISTANT_ID,
  voice: string = VOICE_OPTIONS.NOVA
): Promise<{ 
  success: boolean; 
  callId?: string; 
  error?: any;
  rawResponse?: any;
}> {
  try {
    // Verificar e formatar o número de telefone
    if (!phoneNumber) {
      return { 
        success: false, 
        error: "Número de telefone não fornecido" 
      };
    }
    
    // Formatar número se necessário para garantir o prefixo internacional
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber.replace(/\D/g, '');
    }
    
    // Verificar se o número tem formato válido (+xx...)
    if (!/^\+\d{10,15}$/.test(formattedNumber)) {
      return { 
        success: false, 
        error: `Formato de número inválido: ${formattedNumber}. Use formato internacional (+5548XXXXXXXX)` 
      };
    }
    
    // Dados para a requisição
    const body = {
      assistant: assistantId,
      phone: formattedNumber,
      voice: voice,
      firstMessage: message || DEFAULT_SCRIPT
    };
    
    // Configurar os headers
    const headers = {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // URL da API Vapi
    const apiUrl = 'https://api.vapi.ai/v1/calls';
    
    // Log para debug
    console.log(`Iniciando chamada para ${formattedNumber} usando assistente ${assistantId}`);
    
    // Fazer a requisição para a API Vapi
    const response = await axios.post(apiUrl, body, { headers });
    
    // Se a requisição for bem-sucedida
    if (response.status >= 200 && response.status < 300 && response.data.id) {
      console.log(`Chamada iniciada com sucesso para ${formattedNumber}. ID: ${response.data.id}`);
      return {
        success: true,
        callId: response.data.id,
        rawResponse: response.data
      };
    } else {
      console.error(`Erro ao iniciar chamada para ${formattedNumber}:`, response.data);
      return {
        success: false,
        error: response.data,
        rawResponse: response.data
      };
    }
  } catch (error) {
    // Lidar com erros da API
    console.error(`Erro ao processar chamada para ${phoneNumber}:`, error);
    
    let errorMessage = 'Erro desconhecido ao iniciar chamada';
    
    // Extrair mensagem de erro detalhada (se disponível)
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      rawResponse: error.response ? error.response.data : null
    };
  }
}

/**
 * Obtém o status de uma chamada
 * @param callId ID da chamada
 */
export async function getCallStatus(callId: string): Promise<{
  success: boolean;
  status?: string;
  duration?: number;
  error?: any;
  rawResponse?: any;
}> {
  try {
    if (!callId) {
      return { success: false, error: "ID de chamada não fornecido" };
    }
    
    // Configurar os headers
    const headers = {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // URL da API Vapi
    const apiUrl = `https://api.vapi.ai/v1/calls/${callId}`;
    
    // Fazer a requisição para a API Vapi
    const response = await axios.get(apiUrl, { headers });
    
    // Se a requisição for bem-sucedida
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        status: response.data.status,
        duration: response.data.duration,
        rawResponse: response.data
      };
    } else {
      return {
        success: false,
        error: response.data,
        rawResponse: response.data
      };
    }
  } catch (error) {
    console.error(`Erro ao obter status da chamada ${callId}:`, error);
    
    let errorMessage = 'Erro desconhecido ao obter status da chamada';
    
    // Extrair mensagem de erro detalhada
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      rawResponse: error.response ? error.response.data : null
    };
  }
}

// Exportar funções e constantes
export default {
  processVapiCall,
  getCallStatus,
  VOICE_OPTIONS,
  DEFAULT_SCRIPT
};
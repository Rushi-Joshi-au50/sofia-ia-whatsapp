import OpenAI from "openai";
import { addLogEntry } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Inicializar o cliente OpenAI apenas se a API key estiver disponível
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("OpenAI client inicializado com sucesso");
  } else {
    console.log("OPENAI_API_KEY não configurada, respostas de IA não estarão disponíveis");
  }
} catch (error) {
  console.error("Erro ao inicializar OpenAI client:", error);
}

/**
 * Gera uma resposta baseada em IA usando o OpenAI
 */
export async function generateAIResponse(
  userMessage: string,
  phoneNumber: string,
  contactName?: string
): Promise<string> {
  try {
    // Verificar se o cliente OpenAI está disponível
    if (!openai) {
      await addLogEntry(
        "Cliente OpenAI não inicializado. Usando respostas automáticas simples.",
        "warning"
      );
      return getFallbackResponse(userMessage, contactName);
    }

    // Contexto para o assistente
    const systemPrompt = `Você é a Sofia, uma assistente virtual da D.E.D Company especializada em marketing para eventos.

Fatos importantes:
- Já ajudamos parceiros a faturarem mais de 100 milhões nos últimos 3 anos
- Oferecemos consultoria gratuita personalizada
- Analisamos funil de vendas e estratégias de marketing

Objetivos principais:
1. Agendar consultorias gratuitas
2. Demonstrar credibilidade através dos casos de sucesso
3. Manter comunicação profissional e objetiva

Ao responder:
- Seja concisa e profissional
- Mantenha respostas curtas (máx 2 parágrafos)
- Sempre mencione a consultoria gratuita
- Use emojis com moderação
- Personalize a mensagem usando o nome do cliente quando disponível 
    Você está conversando com ${contactName || "um cliente"} pelo WhatsApp.
    Seu objetivo é agendar uma ligação para apresentar os serviços de produção de eventos.
    Seja amigável, profissional e concisa. Limite suas respostas a no máximo 2 parágrafos curtos.
    Mantenha um tom cordial e demonstre credibilidade através de nossos casos de sucesso.
    Já faturamos mais de 100 milhões nos últimos 3 anos!

    Se o cliente demonstrar interesse, mencione brevemente um caso de sucesso relevante e sugira agendar uma chamada:
    "Recentemente organizamos um evento corporativo para 500 pessoas que superou todas as expectativas do cliente. Podemos agendar uma chamada rápida para discutir como podemos fazer o mesmo pelo seu evento? Que tal amanhã às 15h?"

    Nossos casos de sucesso incluem:
    - Eventos corporativos com mais de 1000 participantes
    - Conferências internacionais com palestrantes renomados
    - Festas exclusivas para marcas de luxo
    - Eventos híbridos com transmissão ao vivo

    Se perguntado sobre os serviços, mencione:
    - Organização completa de eventos corporativos
    - Produção de conferências e seminários 
    - Eventos sociais e festas particulares
    - Gestão de palestrantes e convidados VIP`;

    // Non-null assertion porque já verificamos a existência acima
    const response = await openai!.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content || 
      "Desculpe, não consegui processar sua mensagem. Posso ajudar com algo específico sobre nossos serviços de eventos?";

    await addLogEntry(`Resposta da IA gerada para ${phoneNumber}: ${aiResponse}`, "info");
    return aiResponse;

  } catch (error) {
    console.error("Erro ao gerar resposta da IA:", error);
    await addLogEntry(
      `Erro ao gerar resposta da IA: ${error instanceof Error ? error.message : String(error)}`,
      "error"
    );
    return getFallbackResponse(userMessage, contactName);
  }
}

/**
 * Fornece respostas alternativas quando a IA não está disponível
 */
function getFallbackResponse(message: string, contactName?: string): string {
  const lowerMessage = message.toLowerCase();
  const greeting = contactName ? `Olá ${contactName}` : "Olá";

  // Respostas básicas para perguntas comuns
  if (lowerMessage.includes("preço") || lowerMessage.includes("custo") || lowerMessage.includes("valor")) {
    return `${greeting}! Os preços dos nossos serviços de eventos variam conforme suas necessidades específicas. Podemos agendar uma ligação para discutir os detalhes e fornecer um orçamento personalizado. Qual seria o melhor horário para você?`;
  }

  if (lowerMessage.includes("local") || lowerMessage.includes("onde") || lowerMessage.includes("espaço")) {
    return `${greeting}! Trabalhamos com diversos espaços para eventos em toda a cidade. Temos parcerias com hotéis, casas de festas e espaços ao ar livre. Podemos ajudar a encontrar o local perfeito para o seu evento. Gostaria de conversar sobre as opções disponíveis?`;
  }

  if (lowerMessage.includes("serviço") || lowerMessage.includes("oferecem")) {
    return `${greeting}! Oferecemos uma gama completa de serviços para eventos, incluindo:
- Organização completa de eventos corporativos
- Produção de conferências e seminários
- Eventos sociais e festas particulares
- Gestão de palestrantes e convidados VIP

Podemos conversar mais sobre qual desses serviços melhor atende às suas necessidades?`;
  }

  // Resposta padrão para outras mensagens
  return `${greeting}! Sou a Sofia, assistente virtual da nossa empresa de eventos. Agradeço seu contato! Como posso ajudar com seus planos de evento hoje? Estou aqui para responder perguntas sobre nossos serviços, locais disponíveis ou para agendar uma consulta com nossa equipe.`;
}

/**
 * Analisa uma mensagem do usuário e determina uma resposta adequada
 */
/**
 * Gera insights inteligentes sobre leads usando GPT
 */
export async function generateGPTInsights(): Promise<any> {
  try {
    if (!openai) {
      return {
        insight: "Configure OPENAI_API_KEY para habilitar insights inteligentes",
        stats: { total: 0, frios: 0, mornos: 0, quentes: 0, conversoes: 0 }
      };
    }

    // Simular dados (em produção, buscar do banco)
    const mockData = {
      totalLeads: 47,
      leadsFrios: 12,
      leadsMornos: 18,
      leadsQuentes: 14,
      conversoes: 3
    };

    const prompt = `Analise estes dados de leads e forneça um insight estratégico em 1 frase:
    
Total: ${mockData.totalLeads}
Frios (0-29pts): ${mockData.leadsFrios}
Mornos (30-59pts): ${mockData.leadsMornos}
Quentes (60-79pts): ${mockData.leadsQuentes}
Conversões (80-100pts): ${mockData.conversoes}

Dê uma recomendação clara e objetiva.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "Você é um analista de dados de vendas experiente." },
        { role: "user", content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const insight = response.choices[0].message.content || 
      "Foque nos leads mornos e quentes para aumentar conversões";

    return {
      insight,
      stats: {
        total: mockData.totalLeads,
        frios: mockData.leadsFrios,
        mornos: mockData.leadsMornos,
        quentes: mockData.leadsQuentes,
        conversoes: mockData.conversoes
      }
    };
  } catch (error) {
    console.error("Erro ao gerar insights GPT:", error);
    return {
      insight: "Seus leads estão sendo processados. Continue acompanhando!",
      stats: { total: 0, frios: 0, mornos: 0, quentes: 0, conversoes: 0 }
    };
  }
}

export async function processIncomingMessage(
  message: string,
  phoneNumber: string,
  contactName?: string
): Promise<string> {
  try {
    // Mensagens simples que não precisam de IA
    const lowerMessage = message.toLowerCase();

    // Respostas rápidas para mensagens comuns
    if (/^olá|oi|ei|hey/i.test(lowerMessage)) {
      return `Olá${contactName ? " " + contactName : ""}! Sou a Sofia, assistente virtual da nossa empresa de eventos. Como posso ajudar você hoje?`;
    }

    if (/obrigad[ao]/i.test(lowerMessage)) {
      return `Por nada${contactName ? " " + contactName : ""}! Estou aqui para ajudar. Posso fazer mais alguma coisa por você?`;
    }

    if (/tchau|até mais|até logo/i.test(lowerMessage)) {
      return `Até mais${contactName ? " " + contactName : ""}! Tenha um ótimo dia. Estamos à disposição quando precisar.`;
    }

    // Para todas as outras mensagens, tentar usar a IA se disponível
    // Se não estiver, usará respostas pré-configuradas na função generateAIResponse
    return await generateAIResponse(message, phoneNumber, contactName);
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    return getFallbackResponse(message, contactName);
  }
}
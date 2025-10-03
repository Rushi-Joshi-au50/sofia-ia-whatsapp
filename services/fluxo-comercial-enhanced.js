
import axios from 'axios'

export default class FluxoComercialEnhanced {
    constructor() {
        this.contextos = new Map()
        this.scoreLeads = new Map()
    }

    async processar(mensagem, numero) {
        const contexto = this.obterContexto(numero)
        const mensagemLower = mensagem.toLowerCase()

        // 🎯 Sistema de Scoring
        this.atualizarScore(numero, mensagemLower)

        // 🔄 Máquina de Estados Neural
        if (!contexto.etapa) {
            return this.inicioConversa(numero)
        }

        // Detectar intenções
        if (this.detectarAgendamento(mensagemLower)) {
            return this.processarAgendamento(numero, mensagem)
        }

        if (this.detectarTrial(mensagemLower)) {
            return this.processarTrial(numero)
        }

        if (this.detectarDemo(mensagemLower)) {
            return this.processarDemo(numero)
        }

        if (this.detectarComercial(mensagemLower)) {
            return this.processarComercial(numero)
        }

        if (this.detectarSuporte(mensagemLower)) {
            return this.processarSuporte(numero)
        }

        // Resposta contextual padrão
        return this.respostaContextual(numero, mensagem)
    }

    obterContexto(numero) {
        if (!this.contextos.has(numero)) {
            this.contextos.set(numero, {
                etapa: null,
                ultimaInteracao: Date.now(),
                dados: {}
            })
        }
        return this.contextos.get(numero)
    }

    atualizarScore(numero, mensagem) {
        const score = this.scoreLeads.get(numero) || 0
        let novoScore = score

        // Palavras-chave que aumentam score
        if (/agendar|marcar|reunião/i.test(mensagem)) novoScore += 70
        if (/preço|valor|custo/i.test(mensagem)) novoScore += 50
        if (/demo|demonstração/i.test(mensagem)) novoScore += 40
        if (/trial|teste/i.test(mensagem)) novoScore += 30
        if (/ajuda|suporte/i.test(mensagem)) novoScore += 20

        this.scoreLeads.set(numero, Math.min(novoScore, 100))
    }

    obterScore(numero) {
        return this.scoreLeads.get(numero) || 0
    }

    detectarAgendamento(msg) {
        return /agendar|marcar|reunião|consulta|horário|calendário/i.test(msg)
    }

    detectarTrial(msg) {
        return /trial|teste|grátis|7 dias/i.test(msg)
    }

    detectarDemo(msg) {
        return /demo|demonstração|tour|vídeo/i.test(msg)
    }

    detectarComercial(msg) {
        return /preço|valor|custo|plano|assinatura/i.test(msg)
    }

    detectarSuporte(msg) {
        return /ajuda|suporte|problema|erro|qr|bug/i.test(msg)
    }

    inicioConversa(numero) {
        const contexto = this.obterContexto(numero)
        contexto.etapa = 'inicio'
        
        return `👋 Olá! Sou a Sofia, assistente virtual da consultoria.

Posso ajudar com:

1️⃣ Trial 7 dias grátis
2️⃣ Ver demo guiada
3️⃣ Falar sobre preços
4️⃣ Suporte técnico
5️⃣ Agendar consultoria

Digite o número ou me conte o que precisa! 😊`
    }

    processarTrial(numero) {
        const contexto = this.obterContexto(numero)
        contexto.etapa = 'trial'
        
        return `🎉 Perfeito! O trial de 7 dias inclui:

✅ Acesso completo à plataforma
✅ Exemplos prontos de fluxos
✅ Relatório de interações
✅ Suporte via WhatsApp

Deseja ativar agora ou conhecer a demo primeiro?

Digite:
• "ATIVAR" para começar já
• "DEMO" para ver antes`
    }

    processarDemo(numero) {
        const contexto = this.obterContexto(numero)
        contexto.etapa = 'demo'
        
        return `🎬 Na demo, mostro como a Sofia funciona:

📊 Painel de controle
🤖 IA conversacional
📈 Análise de conversões
📅 Agendamento automático

Prefere:
• "VÍDEO" - assistir demonstração (3min)
• "TOUR" - tour guiado em chamada
• "VOLTAR" - retornar ao menu`
    }

    processarComercial(numero) {
        const contexto = this.obterContexto(numero)
        contexto.etapa = 'comercial'
        
        return `💰 Planos Sofia IA:

📦 **Trial** - Grátis por 7 dias
🚀 **Inicial** - R$ 97/mês
⭐ **Pro** - R$ 297/mês
🏢 **Enterprise** - Sob consulta

Deseja proposta detalhada ou estimativa rápida?`
    }

    processarSuporte(numero) {
        const contexto = this.obterContexto(numero)
        contexto.etapa = 'suporte'
        
        return `🛠️ Suporte Sofia - Como posso ajudar?

Problemas comuns:

1️⃣ QR Code não aparece
2️⃣ WhatsApp desconectou
3️⃣ Integração Google
4️⃣ Erro ao enviar mensagens
5️⃣ Outro problema

Digite o número ou descreva sua dúvida!`
    }

    async processarAgendamento(numero, mensagem) {
        const contexto = this.obterContexto(numero)
        contexto.etapa = 'agendamento'
        
        // Tentar extrair data/hora da mensagem
        const dataHora = this.extrairDataHora(mensagem)
        
        if (dataHora) {
            // Criar evento no Google Calendar
            try {
                const evento = await this.criarEventoCalendar(numero, dataHora)
                
                return `✅ **Agendamento Confirmado!**

📅 Data: ${dataHora.data}
🕐 Horário: ${dataHora.hora}
🔗 Google Meet: ${evento.meetLink}

📋 **Prepare-se:**
• Objetivos do seu negócio
• Dúvidas sobre a plataforma
• Materiais de referência

⏰ Enviarei lembrete 1h antes!

Tudo certo?`
            } catch (error) {
                console.error('Erro ao criar evento:', error)
                return 'Houve um erro ao agendar. Pode tentar novamente?'
            }
        } else {
            return `📅 Vamos agendar sua consultoria!

Tem preferência de dia e horário?

Exemplos:
• "amanhã às 14h"
• "quarta-feira 10h"
• "sexta 15:30"

Ou escolha:

🗓️ Amanhã 10h
🗓️ Amanhã 15h  
🗓️ Sexta 11h

Qual prefere?`
        }
    }

    extrairDataHora(mensagem) {
        // Lógica simples de extração (pode ser melhorada com NLP)
        const hoje = new Date()
        
        if (/amanhã.*14h|14:00|14h00/i.test(mensagem)) {
            const amanha = new Date(hoje)
            amanha.setDate(amanha.getDate() + 1)
            return {
                data: amanha.toLocaleDateString('pt-BR'),
                hora: '14:00',
                datetime: amanha
            }
        }
        
        // Adicionar mais padrões conforme necessário
        return null
    }

    async criarEventoCalendar(numero, dataHora) {
        // Integração com Google Calendar API
        // Aqui você implementaria a chamada real
        return {
            meetLink: 'https://meet.google.com/xxx-yyyy-zzz',
            eventId: 'event123'
        }
    }

    respostaContextual(numero, mensagem) {
        const contexto = this.obterContexto(numero)
        
        // Resposta genérica baseada na etapa
        return `Entendi! ${contexto.etapa === 'inicio' ? 'Como posso ajudar?' : 'Pode me dar mais detalhes?'}`
    }
}

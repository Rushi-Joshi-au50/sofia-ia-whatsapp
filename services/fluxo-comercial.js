
/**
 * Sofia - Fluxo Comercial Inteligente
 * Sistema de conversação com etapas de conversão demo → full
 */

class FluxoComercialSofia {
    constructor() {
        this.conversas = new Map();
        this.etapas = {
            'descoberta': {
                objetivo: 'Identificar necessidade e qualificar lead',
                duracaoMaxima: 5, // mensagens
                proximaEtapa: 'apresentacao'
            },
            'apresentacao': {
                objetivo: 'Apresentar serviços e casos de sucesso',
                duracaoMaxima: 8,
                proximaEtapa: 'agendamento'
            },
            'agendamento': {
                objetivo: 'Agendar consultoria gratuita',
                duracaoMaxima: 6,
                proximaEtapa: 'confirmacao'
            },
            'confirmacao': {
                objetivo: 'Confirmar agendamento e preparar reunião',
                duracaoMaxima: 3,
                proximaEtapa: 'pos_agendamento'
            },
            'pos_agendamento': {
                objetivo: 'Follow-up e suporte até reunião',
                duracaoMaxima: 10,
                proximaEtapa: 'fechamento'
            },
            'fechamento': {
                objetivo: 'Converter em cliente full',
                duracaoMaxima: 15,
                proximaEtapa: null
            }
        };
    }

    async processarMensagemComercial(numero, mensagem, tipoUsuario = 'demo') {
        const contexto = this.obterContextoComercial(numero);
        const etapaAtual = contexto.etapa || 'descoberta';
        
        // Simular digitação natural
        await this.simularDigitacao(mensagem.length);
        
        // Processar baseado na etapa comercial
        let resposta;
        
        switch (etapaAtual) {
            case 'descoberta':
                resposta = await this.etapaDescoberta(numero, mensagem, contexto, tipoUsuario);
                break;
            case 'apresentacao':
                resposta = await this.etapaApresentacao(numero, mensagem, contexto, tipoUsuario);
                break;
            case 'agendamento':
                resposta = await this.etapaAgendamento(numero, mensagem, contexto, tipoUsuario);
                break;
            case 'confirmacao':
                resposta = await this.etapaConfirmacao(numero, mensagem, contexto, tipoUsuario);
                break;
            case 'pos_agendamento':
                resposta = await this.etapaPosAgendamento(numero, mensagem, contexto, tipoUsuario);
                break;
            case 'fechamento':
                resposta = await this.etapaFechamento(numero, mensagem, contexto, tipoUsuario);
                break;
            default:
                resposta = await this.etapaDescoberta(numero, mensagem, contexto, tipoUsuario);
        }

        // Atualizar contexto
        this.avancarEtapa(numero, contexto);
        
        return resposta;
    }

    async etapaDescoberta(numero, mensagem, contexto, tipoUsuario) {
        const respostasDescoberta = {
            primeira_interacao: [
                "👋 Olá! Sou a Sofia, especialista em transformar ideias em eventos inesquecíveis! ✨\n\n🎯 Em 3 anos, já ajudamos nossos parceiros a faturarem mais de **R$ 100 milhões** em eventos.\n\n🤔 Me conte: que tipo de evento você está planejando?",
                
                "😊 Oi! Sofia aqui! Adoro quando alguém pensa em criar algo especial! 🎉\n\n💡 Já organizamos desde casamentos íntimos até conferências com 2.000+ pessoas.\n\n📝 Qual é sua ideia de evento? Me conte mais!",
                
                "🌟 Olá! Sou a Sofia e estou aqui para tornar seu evento um sucesso absoluto!\n\n🏆 Nossos últimos clientes tiveram ROI de 300% em seus eventos corporativos.\n\n🎪 Que tipo de celebração ou evento você tem em mente?"
            ],
            
            qualificacao: [
                "Interessante! Para eventos desse tipo, normalmente trabalhamos com:\n\n✅ Orçamentos de R$ 10k a R$ 500k+\n✅ Público de 50 a 2.000+ pessoas\n✅ Produção completa em 30-90 dias\n\n💰 Qual faixa de investimento você está considerando?",
                
                "Perfeito! Esse tipo de evento é nossa especialidade! 🎯\n\n📊 Para te dar uma proposta certeira, preciso saber:\n• Quantas pessoas esperadas?\n• Orçamento aproximado?\n• Prazo para realização?\n\n🗓️ Podemos agendar 15min para conversar?"
            ]
        };

        if (contexto.mensagens === 0) {
            const resposta = respostasDescoberta.primeira_interacao[Math.floor(Math.random() * 3)];
            if (tipoUsuario === 'demo') {
                return resposta + "\n\n⭐ *Você tem 7 dias de acesso demo gratuito para explorar nossos serviços!*";
            }
            return resposta;
        } else {
            return respostasDescoberta.qualificacao[Math.floor(Math.random() * 2)];
        }
    }

    async etapaApresentacao(numero, mensagem, contexto, tipoUsuario) {
        const casosSuccesso = [
            "🏆 **Caso Real - Festival Tech 2024:**\n• 1.200 participantes\n• R$ 2.3M em negócios fechados\n• ROI de 340% para o cliente\n• 98% satisfação dos convidados",
            
            "💼 **Evento Corporativo Recente:**\n• Multinacional farmacêutica\n• 800 executivos internacionais\n• R$ 15M em contratos firmados\n• Cobertura em 12 países",
            
            "💒 **Casamento Premium:**\n• 350 convidados VIP\n• Transmissão ao vivo para 2.000+ pessoas\n• 100% das fotos viralizaram no Instagram\n• Casal referência no setor"
        ];

        const proposta = `${casosSuccesso[Math.floor(Math.random() * 3)]}

🎯 **O que fazemos por você:**
• Planejamento estratégico completo
• Gestão de fornecedores premium
• Coordenação no dia do evento
• Pós-evento com relatórios detalhados

💡 **Consultoria Gratuita de 45min:**
Análise completa do seu projeto + proposta personalizada

📅 Que tal agendarmos para esta semana?`;

        if (tipoUsuario === 'demo') {
            return proposta + "\n\n⏰ *Restam " + this.calcularDiasDemo(numero) + " dias do seu acesso demo*";
        }
        return proposta;
    }

    async etapaAgendamento(numero, mensagem, contexto, tipoUsuario) {
        if (this.detectarDataHora(mensagem)) {
            // Processar agendamento via Google Calendar
            const agendamento = await this.criarAgendamento(numero, mensagem);
            
            return `✅ **Agendamento Confirmado!**

📅 Data: ${agendamento.data}
🕐 Horário: ${agendamento.hora}
🔗 Google Meet: ${agendamento.meetLink}

📋 **Prepare-se para nossa conversa:**
• Briefing do evento (objetivos, público, orçamento)
• Referências visuais se houver
• Datas preferidas para realização

🚀 Vou te enviar um lembrete 1h antes!

Alguma dúvida específica que posso esclarecer até lá?`;
        }

        return `📅 **Horários Disponíveis Esta Semana:**

🗓️ Segunda: 14h, 16h
🗓️ Terça: 10h, 15h, 17h  
🗓️ Quarta: 9h, 14h, 16h
🗓️ Quinta: 11h, 15h
🗓️ Sexta: 10h, 14h

⏰ Consultoria dura 45min + 15min para dúvidas

💬 Me fale o dia e horário que prefere!
(Ex: "Quarta às 14h")`;
    }

    async simularDigitacao(tamanhoTexto) {
        // Simular tempo natural de digitação
        const tempoBase = Math.min(tamanhoTexto * 50, 3000); // Max 3 segundos
        const variacao = Math.random() * 1000; // Variação humana
        
        return new Promise(resolve => {
            setTimeout(resolve, tempoBase + variacao);
        });
    }

    detectarDataHora(mensagem) {
        const padroes = [
            /(\w+)\s+às?\s+(\d{1,2}h?\d{0,2})/i,
            /(\d{1,2}\/\d{1,2})\s+às?\s+(\d{1,2}h?\d{0,2})/i,
            /(amanhã|hoje)\s+às?\s+(\d{1,2}h?\d{0,2})/i
        ];
        
        return padroes.some(padrao => padrao.test(mensagem));
    }

    calcularDiasDemo(numero) {
        // Calcular dias restantes do demo (implementar lógica real)
        return 5; // Placeholder
    }

    obterContextoComercial(numero) {
        if (!this.conversas.has(numero)) {
            this.conversas.set(numero, {
                etapa: 'descoberta',
                mensagens: 0,
                iniciadoEm: new Date(),
                qualificado: false,
                interesseAlto: false,
                agendamentoTentativas: 0
            });
        }
        
        const contexto = this.conversas.get(numero);
        contexto.mensagens++;
        return contexto;
    }

    avancarEtapa(numero, contexto) {
        const etapaAtual = this.etapas[contexto.etapa];
        
        if (contexto.mensagens >= etapaAtual.duracaoMaxima && etapaAtual.proximaEtapa) {
            contexto.etapa = etapaAtual.proximaEtapa;
            contexto.mensagens = 0;
        }
    }

    async criarAgendamento(numero, mensagem) {
        // Placeholder - integrar com Google Calendar real
        return {
            data: "25/01/2025",
            hora: "14:00",
            meetLink: "https://meet.google.com/abc-defg-hij"
        };
    }
}

module.exports = { FluxoComercialSofia };

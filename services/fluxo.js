
/**
 * Sofia - Fluxo de Conversação
 * Gerencia o fluxo de mensagens e respostas da assistente
 */

const { servicoAgenda } = require('./agenda');

class FluxoSofia {
    constructor() {
        this.conversas = new Map();
        this.contextos = new Map();
    }

    /**
     * Processa uma mensagem recebida
     */
    async processarMensagem(numero, mensagem) {
        try {
            console.log(`📩 Mensagem de ${numero}: ${mensagem}`);

            // Obter ou criar contexto da conversa
            const contexto = this.obterContexto(numero);
            
            // Analisar intenção da mensagem
            const intencao = this.analisarIntencao(mensagem);
            
            // Processar baseado na intenção e contexto
            let resposta;
            
            switch (intencao.tipo) {
                case 'agendamento':
                    resposta = await this.processarAgendamento(numero, mensagem, contexto, intencao);
                    break;
                
                case 'saudacao':
                    resposta = this.processarSaudacao(contexto);
                    break;
                
                case 'informacao':
                    resposta = this.processarInformacao(mensagem, contexto);
                    break;
                
                case 'cancelamento':
                    resposta = await this.processarCancelamento(numero, mensagem, contexto);
                    break;
                
                case 'confirmacao':
                    resposta = await this.processarConfirmacao(numero, contexto);
                    break;
                
                default:
                    resposta = this.processarPadrao(mensagem, contexto);
            }

            // Atualizar contexto
            this.atualizarContexto(numero, { ultimaMensagem: mensagem, ultimaResposta: resposta });
            
            console.log(`📤 Resposta para ${numero}: ${resposta}`);
            return resposta;

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error.message);
            return "Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.";
        }
    }

    /**
     * Analisa a intenção da mensagem
     */
    analisarIntencao(mensagem) {
        const texto = mensagem.toLowerCase();
        
        // Palavras-chave para agendamento
        const palavrasAgendamento = [
            'agendar', 'marcar', 'reunião', 'consulta', 'consultoria', 
            'horário', 'appointment', 'meeting', 'schedule'
        ];

        // Palavras-chave para saudação
        const palavrasSaudacao = [
            'oi', 'olá', 'hello', 'hi', 'bom dia', 'boa tarde', 
            'boa noite', 'tudo bem', 'como vai'
        ];

        // Palavras-chave para informação
        const palavrasInformacao = [
            'que', 'como', 'onde', 'quando', 'por que', 'quanto', 
            'info', 'informação', 'serviço', 'preço', 'valor'
        ];

        // Palavras-chave para cancelamento
        const palavrasCancelamento = [
            'cancelar', 'desmarcar', 'não posso', 'não consigo', 
            'impedimento', 'cancel'
        ];

        // Palavras-chave para confirmação
        const palavrasConfirmacao = [
            'sim', 'ok', 'está bom', 'perfeito', 'confirmo', 
            'yes', 'certo', 'pode ser'
        ];

        // Extrair data/hora
        const dataHora = this.extrairDataHora(mensagem);
        
        // Extrair email
        const email = this.extrairEmail(mensagem);

        // Determinar intenção principal
        let tipo = 'padrao';
        let confianca = 0;

        if (palavrasAgendamento.some(palavra => texto.includes(palavra))) {
            tipo = 'agendamento';
            confianca = 0.9;
        } else if (palavrasSaudacao.some(palavra => texto.includes(palavra))) {
            tipo = 'saudacao';
            confianca = 0.8;
        } else if (palavrasInformacao.some(palavra => texto.includes(palavra))) {
            tipo = 'informacao';
            confianca = 0.7;
        } else if (palavrasCancelamento.some(palavra => texto.includes(palavra))) {
            tipo = 'cancelamento';
            confianca = 0.8;
        } else if (palavrasConfirmacao.some(palavra => texto.includes(palavra))) {
            tipo = 'confirmacao';
            confianca = 0.6;
        }

        return {
            tipo,
            confianca,
            dataHora,
            email,
            textoOriginal: mensagem
        };
    }

    /**
     * Processa solicitação de agendamento
     */
    async processarAgendamento(numero, mensagem, contexto, intencao) {
        try {
            // Verificar se já temos dados suficientes
            const dadosAgendamento = this.coletarDadosAgendamento(contexto, intencao);
            
            if (dadosAgendamento.completo) {
                // Criar agendamento
                const agendamento = await servicoAgenda.processarAgendamento({
                    nome: dadosAgendamento.nome || 'Cliente',
                    telefone: numero,
                    email: dadosAgendamento.email,
                    data: dadosAgendamento.data,
                    hora: dadosAgendamento.hora,
                    servico: 'Consultoria Sofia'
                });

                // Atualizar contexto
                contexto.agendamento = agendamento;
                contexto.etapa = 'concluido';

                return servicoAgenda.formatarResposta(agendamento);

            } else {
                // Solicitar dados faltantes
                return this.solicitarDadosFaltantes(dadosAgendamento, contexto);
            }

        } catch (error) {
            console.error('❌ Erro no agendamento:', error.message);
            return "Desculpe, houve um problema ao processar seu agendamento. Vamos tentar novamente?\n\nPor favor, me informe o dia e horário desejados.";
        }
    }

    /**
     * Coleta dados necessários para agendamento
     */
    coletarDadosAgendamento(contexto, intencao) {
        const dados = {
            nome: contexto.nome || null,
            email: intencao.email || contexto.email || null,
            data: intencao.dataHora?.data || contexto.data || null,
            hora: intencao.dataHora?.hora || contexto.hora || null,
            completo: false
        };

        // Verificar se todos os dados obrigatórios estão presentes
        dados.completo = dados.data && dados.hora;

        return dados;
    }

    /**
     * Solicita dados faltantes para o agendamento
     */
    solicitarDadosFaltantes(dados, contexto) {
        if (!dados.data) {
            contexto.etapa = 'aguardando_data';
            return "📅 Para agendar sua consultoria, preciso saber qual dia você prefere.\n\nExemplos:\n• Amanhã\n• Segunda-feira\n• 25/12/2024\n• Próxima sexta";
        }

        if (!dados.hora) {
            contexto.etapa = 'aguardando_hora';
            return "🕐 Perfeito! Agora me informe qual horário você prefere.\n\nExemplos:\n• 14h\n• 14:30\n• 2 da tarde\n• 15h30";
        }

        return "Vou processar seu agendamento...";
    }

    /**
     * Processa saudação
     */
    processarSaudacao(contexto) {
        const saudacoes = [
            "👋 Olá! Sou a Sofia, assistente virtual da DED Company!\n\n🎯 Especialistas em assessoria para organização de eventos.\n\n📅 Posso agendar uma consultoria gratuita para você. Que tal?",
            "😊 Oi! Que bom te ver por aqui!\n\nSou a Sofia e estou aqui para ajudar com seus eventos.\n\n💡 Quer agendar uma conversa para discutirmos suas ideias?",
            "🌟 Olá! Sofia aqui!\n\nAjudo pessoas a organizarem eventos incríveis.\n\n📞 Gostaria de agendar uma consultoria gratuita comigo?"
        ];

        const saudacao = saudacoes[Math.floor(Math.random() * saudacoes.length)];
        contexto.etapa = 'saudacao_enviada';
        
        return saudacao;
    }

    /**
     * Processa solicitação de informação
     */
    processarInformacao(mensagem, contexto) {
        const texto = mensagem.toLowerCase();
        
        if (texto.includes('preço') || texto.includes('valor') || texto.includes('quanto custa')) {
            return "💰 Nossa consultoria inicial é *100% GRATUITA*!\n\nNela conversamos sobre:\n• Seus objetivos para o evento\n• Opções de locais e fornecedores\n• Cronograma e orçamento\n• Próximos passos\n\n📅 Gostaria de agendar?";
        }

        if (texto.includes('serviço') || texto.includes('que vocês fazem')) {
            return "🎪 *Assessoria Completa para Eventos:*\n\n✅ Planejamento estratégico\n✅ Seleção de fornecedores\n✅ Gestão de cronograma\n✅ Coordenação do evento\n✅ Suporte pós-evento\n\n🎯 Desde casamentos até eventos corporativos!\n\n📞 Quer saber mais? Vamos conversar!";
        }

        if (texto.includes('como funciona')) {
            return "📋 *Como funciona:*\n\n1️⃣ Consultoria gratuita (online)\n2️⃣ Proposta personalizada\n3️⃣ Planejamento detalhado\n4️⃣ Execução do evento\n\n⏰ Todo o processo é acompanhado por nossa equipe especializada.\n\n🗓️ Que tal agendarmos sua consultoria?";
        }

        return "📞 Ficarei feliz em esclarecer suas dúvidas em nossa consultoria gratuita!\n\n🎯 Lá posso explicar tudo detalhadamente e entender melhor suas necessidades.\n\n📅 Vamos agendar?";
    }

    /**
     * Processa cancelamento
     */
    async processarCancelamento(numero, mensagem, contexto) {
        if (contexto.agendamento) {
            try {
                await servicoAgenda.cancelarAgendamento(contexto.agendamento.id);
                contexto.agendamento = null;
                contexto.etapa = 'cancelado';
                
                return "✅ Agendamento cancelado com sucesso.\n\n😊 Quando quiser reagendar, é só me avisar!\n\nEstou sempre aqui para ajudar.";
            } catch (error) {
                return "⚠️ Houve um problema ao cancelar. Entre em contato conosco pelo telefone para mais ajuda.";
            }
        } else {
            return "🤔 Não encontrei nenhum agendamento ativo para cancelar.\n\nPrecisa de ajuda com algo específico?";
        }
    }

    /**
     * Processa confirmação
     */
    async processarConfirmacao(numero, contexto) {
        if (contexto.etapa === 'aguardando_confirmacao' && contexto.agendamentoPendente) {
            try {
                const agendamento = await servicoAgenda.processarAgendamento(contexto.agendamentoPendente);
                contexto.agendamento = agendamento;
                contexto.etapa = 'confirmado';
                
                return servicoAgenda.formatarResposta(agendamento);
            } catch (error) {
                return "❌ Erro ao confirmar agendamento. Vamos tentar novamente?";
            }
        }

        return "👍 Entendi! Em que posso ajudar você hoje?";
    }

    /**
     * Processa mensagem padrão
     */
    processarPadrao(mensagem, contexto) {
        const respostas = [
            "🤔 Não entendi bem. Você gostaria de agendar uma consultoria ou tem alguma dúvida específica?",
            "😊 Posso ajudar você a organizar um evento incrível! Que tal conversarmos sobre isso?",
            "🎯 Estou aqui para ajudar com planejamento de eventos. O que você tem em mente?"
        ];

        return respostas[Math.floor(Math.random() * respostas.length)];
    }

    /**
     * Extrai data e hora da mensagem
     */
    extrairDataHora(mensagem) {
        const texto = mensagem.toLowerCase();
        let data = null;
        let hora = null;

        // Padrões de data
        const padraoData = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
        const matchData = texto.match(padraoData);

        if (matchData) {
            const [, dia, mes, ano] = matchData;
            data = `${ano.length === 2 ? '20' + ano : ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        } else {
            // Verificar datas relativas
            const hoje = new Date();
            if (texto.includes('amanhã')) {
                const amanha = new Date(hoje);
                amanha.setDate(hoje.getDate() + 1);
                data = amanha.toISOString().split('T')[0];
            } else if (texto.includes('depois de amanhã')) {
                const depoisAmanha = new Date(hoje);
                depoisAmanha.setDate(hoje.getDate() + 2);
                data = depoisAmanha.toISOString().split('T')[0];
            }
        }

        // Padrões de hora
        const padraoHora = /(\d{1,2})[h:]?(\d{0,2})/;
        const matchHora = texto.match(padraoHora);

        if (matchHora) {
            const [, h, m] = matchHora;
            hora = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
        }

        return data && hora ? { data, hora } : null;
    }

    /**
     * Extrai email da mensagem
     */
    extrairEmail(mensagem) {
        const padraoEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const match = mensagem.match(padraoEmail);
        return match ? match[0] : null;
    }

    /**
     * Obtém contexto da conversa
     */
    obterContexto(numero) {
        if (!this.contextos.has(numero)) {
            this.contextos.set(numero, {
                etapa: 'inicial',
                iniciado: new Date(),
                mensagens: 0
            });
        }

        const contexto = this.contextos.get(numero);
        contexto.mensagens++;
        contexto.ultimaInteracao = new Date();

        return contexto;
    }

    /**
     * Atualiza contexto da conversa
     */
    atualizarContexto(numero, dados) {
        const contexto = this.contextos.get(numero);
        if (contexto) {
            Object.assign(contexto, dados);
        }
    }

    /**
     * Limpa contextos antigos (mais de 24h)
     */
    limparContextosAntigos() {
        const agora = new Date();
        const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

        for (const [numero, contexto] of this.contextos.entries()) {
            if (contexto.ultimaInteracao < umDiaAtras) {
                this.contextos.delete(numero);
                console.log(`🧹 Contexto removido para ${numero}`);
            }
        }
    }
}

// Instância singleton
const fluxoSofia = new FluxoSofia();

// Limpar contextos antigos a cada hora
setInterval(() => {
    fluxoSofia.limparContextosAntigos();
}, 60 * 60 * 1000);

module.exports = {
    FluxoSofia,
    fluxoSofia
};

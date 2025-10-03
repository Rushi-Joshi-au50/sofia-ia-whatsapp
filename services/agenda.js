
/**
 * Sofia - Serviço de Agendamento
 * Gerencia criação e administração de agendamentos
 */

const { sofiaCalendar } = require('../google_calendar');

class ServicoAgenda {
    constructor() {
        this.agendamentos = new Map();
    }

    /**
     * Processa solicitação de agendamento
     */
    async processarAgendamento(dados) {
        try {
            const {
                nome = 'Cliente',
                telefone,
                email,
                data,
                hora,
                servico = 'Consultoria'
            } = dados;

            // Validar dados obrigatórios
            if (!telefone || !data || !hora) {
                throw new Error('Dados obrigatórios não fornecidos');
            }

            // Preparar dados para o Google Calendar
            const dadosEvento = {
                titulo: `${servico} - ${nome}`,
                descricao: `Agendamento via WhatsApp\n\nCliente: ${nome}\nTelefone: ${telefone}\nEmail: ${email || 'Não informado'}\nServiço: ${servico}`,
                dataInicio: data,
                horaInicio: hora,
                duracao: 60,
                emailCliente: email
            };

            // Criar evento no Google Calendar
            const evento = await sofiaCalendar.criarEventoComMeet(dadosEvento);

            // Salvar localmente
            const agendamento = {
                id: evento.eventoId,
                nome,
                telefone,
                email,
                data,
                hora,
                servico,
                meetLink: evento.meetLink,
                status: 'agendado',
                criadoEm: new Date().toISOString()
            };

            this.agendamentos.set(evento.eventoId, agendamento);

            console.log('✅ Agendamento criado:', agendamento.id);
            return agendamento;

        } catch (error) {
            console.error('❌ Erro ao processar agendamento:', error.message);
            throw error;
        }
    }

    /**
     * Lista todos os agendamentos
     */
    async listarAgendamentos() {
        try {
            // Buscar do Google Calendar
            const eventosGoogle = await sofiaCalendar.listarProximosEventos(50);
            
            // Filtrar apenas eventos da Sofia
            const agendamentosSofia = eventosGoogle.filter(evento => 
                evento.titulo && (
                    evento.titulo.includes('Consultoria') || 
                    evento.titulo.includes('Sofia')
                )
            );

            return agendamentosSofia.map(evento => ({
                id: evento.id,
                titulo: evento.titulo,
                inicio: evento.inicio,
                fim: evento.fim,
                meetLink: evento.meetLink,
                descricao: evento.descricao
            }));

        } catch (error) {
            console.error('❌ Erro ao listar agendamentos:', error.message);
            return Array.from(this.agendamentos.values());
        }
    }

    /**
     * Cancela um agendamento
     */
    async cancelarAgendamento(id) {
        try {
            await sofiaCalendar.cancelarEvento(id);
            this.agendamentos.delete(id);
            console.log('✅ Agendamento cancelado:', id);
            return true;
        } catch (error) {
            console.error('❌ Erro ao cancelar agendamento:', error.message);
            throw error;
        }
    }

    /**
     * Obter horários disponíveis
     */
    async obterHorariosDisponiveis(dias = 7) {
        try {
            return await sofiaCalendar.gerarHorariosDisponiveis(dias);
        } catch (error) {
            console.error('❌ Erro ao obter horários:', error.message);
            return [];
        }
    }

    /**
     * Validar dados de agendamento
     */
    validarDados(dados) {
        const erros = [];

        if (!dados.telefone) {
            erros.push('Telefone é obrigatório');
        }

        if (!dados.data) {
            erros.push('Data é obrigatória');
        }

        if (!dados.hora) {
            erros.push('Hora é obrigatória');
        }

        if (dados.email && !this.validarEmail(dados.email)) {
            erros.push('Email inválido');
        }

        return {
            valido: erros.length === 0,
            erros
        };
    }

    /**
     * Validar formato de email
     */
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Formatar resposta de agendamento
     */
    formatarResposta(agendamento) {
        const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
        
        let resposta = `✅ *Agendamento Confirmado!*\n\n`;
        resposta += `📅 *Data:* ${dataFormatada}\n`;
        resposta += `🕐 *Horário:* ${agendamento.hora}\n`;
        resposta += `🎯 *Serviço:* ${agendamento.servico}\n\n`;

        if (agendamento.meetLink) {
            resposta += `🔗 *Link da Reunião:*\n${agendamento.meetLink}\n\n`;
        }

        resposta += `📝 *Instruções:*\n`;
        resposta += `• O link estará ativo no horário agendado\n`;
        resposta += `• Você receberá um lembrete por email\n`;
        resposta += `• Para reagendar, entre em contato conosco\n\n`;
        resposta += `Obrigado por escolher nossos serviços! 😊`;

        return resposta;
    }

    /**
     * Gerar relatório de agendamentos
     */
    async gerarRelatorio(periodo = 30) {
        try {
            const agendamentos = await this.listarAgendamentos();
            const agora = new Date();
            const inicoPeriodo = new Date();
            inicoPeriodo.setDate(agora.getDate() - periodo);

            const agendamentosPeriodo = agendamentos.filter(ag => {
                const dataAgendamento = new Date(ag.inicio);
                return dataAgendamento >= inicoPeriodo;
            });

            return {
                total: agendamentosPeriodo.length,
                periodo: `${periodo} dias`,
                agendamentos: agendamentosPeriodo,
                geradoEm: agora.toISOString()
            };

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        }
    }
}

// Instância singleton
const servicoAgenda = new ServicoAgenda();

module.exports = {
    ServicoAgenda,
    servicoAgenda
};

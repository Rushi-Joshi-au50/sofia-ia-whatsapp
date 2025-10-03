
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import P from 'pino'
import { createRequire } from 'module'
import axios from 'axios'
import qrcode from 'qrcode-terminal'

const require = createRequire(import.meta.url)

// Estado global para controle de reconexão e QR
let currentSocket = null
let reconnectAttempts = 0
let qrRefreshInterval = null
let wss = null // WebSocket server para UI

async function baileysProvider(webSocketServer = null) {
    wss = webSocketServer
    console.log('🚀 Iniciando provider Baileys...')
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys')
        
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false, // Controlamos manualmente
            logger: P({ level: 'silent' }),
            browser: ['Sofia Bot', 'Chrome', '1.0.0'],
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000
        })

        currentSocket = sock

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            
            // Gerenciar QR Code
            if (qr) {
                console.log('📱 QR Code gerado:')
                qrcode.generate(qr, { small: true })
                
                // Enviar QR para WebSocket (UI)
                if (wss) {
                    broadcastToClients({ type: 'qr', qrCode: qr })
                }
                
                // Auto-refresh do QR a cada 60 segundos
                if (qrRefreshInterval) clearInterval(qrRefreshInterval)
                qrRefreshInterval = setInterval(() => {
                    console.log('🔄 Refreshing QR Code...')
                    sock.logout().catch(() => {})
                    setTimeout(() => baileysProvider(wss), 2000)
                }, 60000)
            }
            
            if (connection === 'close') {
                if (qrRefreshInterval) {
                    clearInterval(qrRefreshInterval)
                    qrRefreshInterval = null
                }
                
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
                console.log('⚠️ Conexão fechada. Reconectando:', shouldReconnect)
                
                if (wss) {
                    broadcastToClients({ type: 'connection', status: 'disconnected' })
                }
                
                if (shouldReconnect && reconnectAttempts < 5) {
                    reconnectAttempts++
                    console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/5`)
                    setTimeout(() => baileysProvider(wss), 5000)
                } else if (reconnectAttempts >= 5) {
                    console.log('❌ Máximo de tentativas de reconexão atingido')
                    reconnectAttempts = 0
                }
            } else if (connection === 'open') {
                reconnectAttempts = 0
                if (qrRefreshInterval) {
                    clearInterval(qrRefreshInterval)
                    qrRefreshInterval = null
                }
                
                console.log('✅ Sofia conectada ao WhatsApp!')
                
                if (wss) {
                    broadcastToClients({ 
                        type: 'connection', 
                        status: 'connected',
                        phoneNumber: sock.user?.id.split(':')[0] 
                    })
                }
            }
        })

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return

            const from = msg.key.remoteJid
            const messageText = msg.message.conversation || 
                               msg.message.extendedTextMessage?.text || ''

            const fromNumber = from.split('@')[0]
            console.log(`📱 Mensagem de ${fromNumber}: ${messageText}`)

            // Log para WebSocket
            if (wss) {
                broadcastToClients({
                    type: 'message',
                    direction: 'received',
                    from: fromNumber,
                    text: messageText,
                    timestamp: new Date().toISOString()
                })
            }

            try {
                // 🧠 Processar com Fluxo Neural Sofia
                const { default: FluxoComercial } = await import('../services/fluxo-comercial-enhanced.js')
                const fluxo = new FluxoComercial()
                const resposta = await fluxo.processar(messageText, fromNumber)
                
                // 📊 Enviar score do lead para dashboard
                const leadScore = fluxo.obterScore(fromNumber)
                if (wss) {
                    broadcastToClients({
                        type: 'lead_score',
                        phoneNumber: fromNumber,
                        score: leadScore,
                        timestamp: new Date().toISOString()
                    })
                }
                
                if (resposta) {
                    await sock.sendMessage(from, { text: resposta })
                    console.log(`✅ Resposta enviada para ${fromNumber} (Score: ${leadScore})`)
                    
                    // Log resposta para WebSocket
                    if (wss) {
                        broadcastToClients({
                            type: 'message',
                            direction: 'sent',
                            to: fromNumber,
                            text: resposta,
                            timestamp: new Date().toISOString()
                        })
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error)
                const errorResponse = '😅 Desculpe, tive um problema técnico. Tente novamente em alguns instantes.'
                
                await sock.sendMessage(from, { text: errorResponse })
                
                if (wss) {
                    broadcastToClients({
                        type: 'error',
                        message: `Erro ao processar mensagem de ${fromNumber}: ${error.message}`,
                        timestamp: new Date().toISOString()
                    })
                }
            }
        })

        // Função para enviar mensagem (para uso externo)
        global.sendWhatsAppMessage = async (to, message) => {
            try {
                const formattedTo = to.includes('@') ? to : `${to}@s.whatsapp.net`
                await sock.sendMessage(formattedTo, { text: message })
                return { success: true }
            } catch (error) {
                console.error('❌ Erro ao enviar mensagem:', error)
                return { success: false, error: error.message }
            }
        }

        return sock
    } catch (error) {
        console.error('❌ Erro ao inicializar Baileys:', error)
        if (wss) {
            broadcastToClients({
                type: 'error',
                message: `Erro ao inicializar: ${error.message}`,
                timestamp: new Date().toISOString()
            })
        }
        throw error
    }
}

// Função para comunicação com Sofia IA (Python)
async function askSofia(message, phoneNumber) {
    try {
        const response = await axios.post('http://127.0.0.1:5000/api/process-message', {
            message: message,
            phone_number: phoneNumber,
            timestamp: new Date().toISOString()
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        return response.data.response || response.data.message
    } catch (error) {
        console.error('❌ Erro na comunicação com Sofia IA:', error.message)
        
        // Fallback para resposta básica
        return getFallbackResponse(message)
    }
}

// Resposta de fallback quando a IA não está disponível
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('agendar') || lowerMessage.includes('consulta')) {
        return `👋 Olá! Sou a Sofia, assistente da DED Company.

📅 Perfeito! Vou te ajudar a agendar sua consultoria gratuita.

Para prosseguir, preciso saber:
• Que dia você prefere?
• Qual horário é melhor para você?

Exemplos:
- "Amanhã às 14h"
- "Segunda-feira às 10h30"

Aguardo sua resposta! 😊`
    }
    
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi')) {
        return `👋 Olá! Muito prazer!

Sou a Sofia, assistente virtual da DED Company.

🎯 Especializada em assessoria para eventos, posso te ajudar com uma consultoria gratuita.

Como posso te ajudar hoje? Digite "agendar" para marcarmos sua consultoria! 😊`
    }
    
    return `👋 Olá! Sou a Sofia, assistente virtual da DED Company.

🎯 Posso ajudá-lo a agendar uma consultoria gratuita sobre assessoria para eventos.

📅 Basta me dizer quando você gostaria de conversar!

Digite "agendar" para começarmos! 😊`
}

// Função para broadcast WebSocket
function broadcastToClients(data) {
    if (!wss || !wss.clients) return
    
    const message = JSON.stringify(data)
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message)
        }
    })
}

// Função básica de processamento de mensagem
async function processarMensagem(texto, numero) {
    try {
        // Lógica básica de resposta da Sofia
        if (texto.toLowerCase().includes('agendar') || 
            texto.toLowerCase().includes('consulta') ||
            texto.toLowerCase().includes('reunião')) {
            
            return `👋 Olá! Sou a Sofia, assistente da DED Company.

📅 Perfeito! Vou te ajudar a agendar sua consultoria gratuita.

Para prosseguir, preciso saber:
• Que dia você prefere?
• Qual horário é melhor para você?

Exemplos:
- "Amanhã às 14h"
- "Segunda-feira às 10h30"
- "25/12/2024 às 15h"

Aguardo sua resposta! 😊`
        }
        
        if (texto.toLowerCase().includes('olá') || 
            texto.toLowerCase().includes('oi') ||
            texto.toLowerCase().includes('bom dia') ||
            texto.toLowerCase().includes('boa tarde')) {
            
            return `👋 Olá! Muito prazer!

Sou a Sofia, assistente virtual da DED Company.

🎯 Especializada em assessoria para eventos, posso te ajudar com uma consultoria gratuita.

Como posso te ajudar hoje?
• Agendar uma consultoria
• Tirar dúvidas sobre nossos serviços
• Falar sobre planejamento de eventos

Digite "agendar" para marcarmos sua consultoria! 😊`
        }

        // Resposta padrão
        return `👋 Olá! Sou a Sofia, assistente virtual da DED Company.

🎯 Posso ajudá-lo a agendar uma consultoria gratuita sobre assessoria para eventos.

📅 Basta me dizer quando você gostaria de conversar!

Digite "agendar" para começarmos! 😊`
        
    } catch (error) {
        console.error('Erro ao processar mensagem:', error)
        return 'Desculpe, houve um erro. Tente novamente.'
    }
}

export default baileysProvider

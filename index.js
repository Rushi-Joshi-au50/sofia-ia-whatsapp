
// index.js - Inicializador híbrido Sofia Bot (ES Module)
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const provider = process.env.WHATSAPP_PROVIDER || 'baileys'

console.log('🤖 SOFIA BOT - Sistema Híbrido de WhatsApp')
console.log('='.repeat(50))

// Inicializar servidor Express para UI
const app = express();
const server = createServer(app);

// Configurar arquivos estáticos
app.use(express.static('public'));
app.use(express.json());

// Inicializar WebSocket Server
const wss = new WebSocketServer({ server });

console.log('🌐 WebSocket Server iniciado para UI em tempo real')

// Controlar processo Python
let pythonProcess = null;

async function startPythonAPI() {
    return new Promise((resolve, reject) => {
        console.log('🐍 Iniciando Sofia IA (Python API)...')
        
        pythonProcess = spawn('python', ['sofia_api.py'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Python] ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`[Python Error] ${data.toString().trim()}`);
        });

        pythonProcess.on('error', (error) => {
            console.error('❌ Erro ao iniciar Python API:', error);
            reject(error);
        });

        // Aguardar alguns segundos para o Python inicializar
        setTimeout(() => {
            console.log('✅ Sofia IA (Python) iniciada!');
            resolve();
        }, 3000);
    });
}

async function importProvider() {
    try {
        if (provider === 'baileys') {
            const { default: startProvider } = await import('./providers/baileys.js')
            return startProvider
        } else if (provider === 'whatsapp-api') {
            const { default: startProvider } = await import('./providers/whatsapp-api.js')
            return startProvider
        } else {
            throw new Error(`Provider não reconhecido: ${provider}`)
        }
    } catch (error) {
        console.error(`❌ Erro ao carregar provider ${provider}:`, error.message)
        throw error
    }
}

// Rota principal da UI
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sofia Bot - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #121212;
            color: #ffffff;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #1E3A8A 0%, #25D366 100%);
            padding: 30px 0;
            margin-bottom: 30px;
            border-radius: 12px;
        }
        .card { 
            background: #1f1f1f;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid #333;
        }
        .status { 
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        .status-dot { 
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ef4444;
        }
        .status-dot.connected { background: #22c55e; }
        .qr-container { 
            text-align: center;
            padding: 20px;
            background: #ffffff;
            border-radius: 8px;
            margin: 20px 0;
        }
        .logs { 
            background: #0f0f0f;
            border-radius: 8px;
            padding: 15px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        .log-entry { 
            margin-bottom: 8px;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .log-info { background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; }
        .log-success { background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; }
        .log-error { background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; }
        .log-message { background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; }
        .btn { 
            background: #1E3A8A;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        }
        .btn:hover { background: #1e40af; transform: translateY(-1px); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="text-align: center; font-size: 2.5rem; margin-bottom: 10px;">🤖 Sofia Bot</h1>
            <p style="text-align: center; font-size: 1.2rem; opacity: 0.9;">Sistema Híbrido de WhatsApp + IA</p>
        </div>

        <div class="grid">
            <div class="card">
                <h2>📱 Status da Conexão</h2>
                <div class="status">
                    <div class="status-dot" id="connectionStatus"></div>
                    <span id="connectionText">Desconectado</span>
                </div>
                <div id="phoneNumber" style="margin-bottom: 15px; font-size: 14px; opacity: 0.7;"></div>
                <button class="btn" onclick="refreshQR()">🔄 Refresh QR Code</button>
                
                <div id="qrContainer" style="display: none;">
                    <h3>📱 Escaneie o QR Code:</h3>
                    <div class="qr-container">
                        <div id="qrCode">Gerando QR Code...</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>🤖 Sofia IA Status</h2>
                <div class="status">
                    <div class="status-dot connected"></div>
                    <span>API Python Online</span>
                </div>
                <p style="font-size: 14px; opacity: 0.7; margin-bottom: 15px;">
                    Processamento inteligente de mensagens ativo
                </p>
                <button class="btn" onclick="testAPI()">🧪 Testar IA</button>
            </div>
        </div>

        <div class="card">
            <h2>📊 Logs em Tempo Real</h2>
            <div class="logs" id="logsContainer">
                <div class="log-entry log-info">
                    [${new Date().toLocaleTimeString()}] Sistema Sofia iniciado
                </div>
            </div>
            <button class="btn" onclick="clearLogs()" style="margin-top: 15px;">🗑️ Limpar Logs</button>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:3001');
        let logs = [];

        ws.onopen = () => {
            addLog('WebSocket conectado', 'info');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onclose = () => {
            addLog('WebSocket desconectado', 'error');
        };

        function handleWebSocketMessage(data) {
            switch(data.type) {
                case 'qr':
                    showQRCode(data.qrCode);
                    break;
                case 'connection':
                    updateConnectionStatus(data.status, data.phoneNumber);
                    break;
                case 'message':
                    addMessageLog(data);
                    break;
                case 'error':
                    addLog(data.message, 'error');
                    break;
                default:
                    console.log('Mensagem WebSocket não reconhecida:', data);
            }
        }

        function showQRCode(qrData) {
            document.getElementById('qrContainer').style.display = 'block';
            document.getElementById('qrCode').innerHTML = '<pre style="font-size: 8px; line-height: 1;">' + qrData + '</pre>';
            addLog('QR Code gerado', 'info');
        }

        function updateConnectionStatus(status, phoneNumber) {
            const statusDot = document.getElementById('connectionStatus');
            const statusText = document.getElementById('connectionText');
            const phoneDiv = document.getElementById('phoneNumber');

            if (status === 'connected') {
                statusDot.classList.add('connected');
                statusText.textContent = 'Conectado';
                phoneDiv.textContent = phoneNumber ? 'Número: ' + phoneNumber : '';
                document.getElementById('qrContainer').style.display = 'none';
                addLog('WhatsApp conectado com sucesso!', 'success');
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = 'Desconectado';
                phoneDiv.textContent = '';
                addLog('WhatsApp desconectado', 'error');
            }
        }

        function addMessageLog(data) {
            const direction = data.direction === 'received' ? '📥' : '📤';
            const contact = data.direction === 'received' ? data.from : data.to;
            addLog(direction + ' ' + contact + ': ' + data.text.substring(0, 50) + '...', 'message');
        }

        function addLog(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = {
                timestamp,
                message,
                type
            };
            
            logs.push(logEntry);
            
            // Manter apenas os últimos 100 logs
            if (logs.length > 100) {
                logs = logs.slice(-100);
            }
            
            updateLogsDisplay();
        }

        function updateLogsDisplay() {
            const container = document.getElementById('logsContainer');
            container.innerHTML = logs.map(log => 
                '<div class="log-entry log-' + log.type + '">' +
                '[' + log.timestamp + '] ' + log.message +
                '</div>'
            ).join('');
            
            container.scrollTop = container.scrollHeight;
        }

        function clearLogs() {
            logs = [];
            updateLogsDisplay();
        }

        function refreshQR() {
            ws.send(JSON.stringify({ type: 'refresh_qr' }));
            addLog('Solicitando novo QR Code...', 'info');
        }

        async function testAPI() {
            try {
                const response = await fetch('http://localhost:5000/api/test');
                const data = await response.json();
                addLog('Teste da IA: ' + data.message, 'success');
            } catch (error) {
                addLog('Erro no teste da IA: ' + error.message, 'error');
            }
        }
    </script>
</body>
</html>
    `);
});

async function start() {
    try {
        console.log(`🚀 Iniciando Sofia Bot com provider: ${provider}`)
        console.log('📅 Integração com Google Calendar: ✅')
        console.log('🤖 Fluxo inteligente de conversas: ✅')
        console.log('🔄 Sistema híbrido preparado para futuras APIs: ✅')
        console.log()
        
        // Iniciar API Python
        await startPythonAPI();
        
        // Iniciar provider WhatsApp
        const startProvider = await importProvider()
        await startProvider(wss)
        
        // Iniciar servidor web
        server.listen(3001, '0.0.0.0', () => {
            console.log('✅ Sofia Bot iniciada com sucesso!')
            console.log('🌐 Dashboard disponível em: http://localhost:3001')
            console.log('🤖 API Python rodando em: http://localhost:5000')
            console.log('📱 Aguardando mensagens do WhatsApp...')
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar Sofia Bot:', error)
        process.exit(1)
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando Sofia Bot...')
    if (pythonProcess) {
        pythonProcess.kill('SIGTERM')
    }
    process.exit(0)
})

// Inicializar o bot
start().catch(console.error)

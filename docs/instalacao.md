
# 📋 Guia de Instalação Detalhado - Sofia IA

Este guia fornece instruções passo a passo para instalar e configurar o Sofia IA em diferentes ambientes.

## 🎯 Pré-requisitos

### Sistemas Suportados
- ✅ **Windows 10/11**
- ✅ **macOS 12+**
- ✅ **Linux (Ubuntu 20.04+)**
- ✅ **Replit (Recomendado)**

### Softwares Necessários
- **Node.js 18+** ([Download](https://nodejs.org))
- **Python 3.11+** ([Download](https://python.org))
- **Git** ([Download](https://git-scm.com))
- **Conta Google** (para APIs)

## 🚀 Instalação no Replit (Recomendado)

### Método 1: Fork Direto
1. Acesse: https://replit.com/new/github/prongnose2022/sofia-ia
2. Clique em **"Fork Repl"**
3. Aguarde a importação automática
4. Pule para [Configuração das Credenciais](#-configuração-das-credenciais)

### Método 2: Import Manual
```bash
# No terminal do Replit
git clone https://github.com/prongnose2022/sofia-ia.git
cd sofia-ia
```

## 💻 Instalação Local

### 1. Clone o Repositório
```bash
git clone https://github.com/prongnose2022/sofia-ia.git
cd sofia-ia
```

### 2. Configurar Node.js
```bash
# Verificar versão
node --version  # Deve ser 18+
npm --version

# Instalar dependências
npm install --legacy-peer-deps
```

### 3. Configurar Python
```bash
# Verificar versão
python --version  # Deve ser 3.11+

# Criar ambiente virtual (opcional para local)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

## 🔑 Configuração das Credenciais

### 1. Google Cloud Console

#### Passo 1: Criar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **"Criar Projeto"**
3. Nome: `Sofia IA - [Seu Nome]`
4. Clique em **"Criar"**

#### Passo 2: Ativar APIs
```bash
# APIs necessárias:
- Google Calendar API
- Google Docs API  
- Google Sheets API
- Google Drive API
```

1. No menu lateral: **"APIs e Serviços" > "Biblioteca"**
2. Pesquise e ative cada API acima
3. Clique em **"Ativar"** para cada uma

#### Passo 3: Criar Conta de Serviço
1. **"APIs e Serviços" > "Credenciais"**
2. **"Criar Credenciais" > "Conta de Serviço"**
3. Nome: `sofia-ia-service`
4. **"Criar e Continuar"**
5. Papel: **"Editor"** (ou roles específicas)
6. **"Concluir"**

#### Passo 4: Gerar Chave JSON
1. Clique na conta de serviço criada
2. Aba **"Chaves"**
3. **"Adicionar Chave" > "Criar Nova Chave"**
4. Tipo: **JSON**
5. **"Criar"** - arquivo será baixado

#### Passo 5: Upload da Chave
```bash
# Renomeie o arquivo baixado para:
credentials.json

# Coloque na raiz do projeto
sofia-ia/
├── credentials.json  ← Aqui!
├── .env
└── ...
```

### 2. OpenAI API Key

#### Obter Chave
1. Acesse [OpenAI Platform](https://platform.openai.com)
2. **"API Keys"** > **"Create new secret key"**
3. Nome: `Sofia IA`
4. Copie a chave (sk-...)

### 3. VAPI API Key (Opcional)

#### Para Chamadas de Voz
1. Acesse [VAPI](https://vapi.ai)
2. Crie conta e projeto
3. Copie a API Key

### 4. Configurar .env

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# APIs Obrigatórias
OPENAI_API_KEY=sk-sua_chave_openai_aqui
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# APIs Opcionais
VAPI_API_KEY=sua_chave_vapi_aqui

# Configurações WhatsApp
WHATSAPP_PROVIDER=baileys

# Configurações do Sistema
NODE_ENV=development
PORT=5000

# Configurações Google Calendar
CALENDAR_ID=primary
TIMEZONE=America/Sao_Paulo

# Login Administrativo
ADMIN_USER=admin
ADMIN_PASSWORD=sofia2024
```

## ▶️ Primeira Execução

### 1. Testar Configuração
```bash
# Verificar credenciais Google
python test_google_credentials.py

# Deve mostrar:
# ✅ Google Calendar API: OK
# ✅ Google Docs API: OK
# ✅ Credenciais válidas!
```

### 2. Iniciar Sistema

#### Opção A: Sistema Híbrido (Recomendado)
```bash
npm run dev
# ou
node index.js
```

#### Opção B: Sistema Flask
```bash
python main.py
```

### 3. Conectar WhatsApp
1. QR Code aparecerá no terminal
2. Abra WhatsApp no celular
3. **"Dispositivos Conectados" > "Conectar Dispositivo"**
4. Escaneie o QR Code
5. Aguarde conexão: `✅ WhatsApp conectado!`

### 4. Acessar Interface
- **Dashboard**: http://localhost:5000
- **Login**: admin / sofia2024
- **Logs**: http://localhost:5000/logs

## 🧪 Testar Funcionamento

### 1. Teste Básico
Envie no WhatsApp conectado:
```
Oi Sofia!
```

Resposta esperada:
```
Olá! Sou a Sofia, sua assistente virtual.
Como posso ajudar você hoje?
```

### 2. Teste de Agendamento
```
Quero agendar uma consultoria para amanhã às 14h
```

Resposta esperada:
```
Perfeito! Vou agendar sua consultoria.
📅 Data: [amanhã]
🕐 Horário: 14:00
📋 Tipo: Consultoria

Link do Google Meet: https://meet.google.com/xxx-xxxx-xxx
```

### 3. Verificar Google Calendar
1. Acesse [Google Calendar](https://calendar.google.com)
2. Verifique se o evento foi criado
3. Confirme se o link do Meet está incluído

## 🔧 Solução de Problemas

### Erro: "Module not found"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Para Python
pip install -r requirements.txt --force-reinstall
```

### Erro: "Credenciais inválidas"
1. Verifique se `credentials.json` está na raiz
2. Confirme se as APIs estão ativadas
3. Teste com `python test_google_credentials.py`

### QR Code não aparece
```bash
# Verificar provider
echo $WHATSAPP_PROVIDER
# Deve mostrar: baileys

# Reinstalar Baileys
npm uninstall @whiskeysockets/baileys
npm install @whiskeysockets/baileys@latest
```

### Erro de Porta
```bash
# Verificar se porta 5000 está livre
lsof -i :5000

# Matar processo se necessário
kill -9 PID

# Ou usar porta alternativa
PORT=3000 npm run dev
```

## 📱 Configuração Avançada

### WhatsApp Multi-Device
- Sofia suporta conexão multi-device
- Pode conectar em até 4 dispositivos
- Logs sincronizados em todos

### Webhook Externa
```bash
# Para receber webhooks externos
ngrok http 5000

# Ou usar localtunnel
npx localtunnel --port 5000
```

### SSL/HTTPS Local
```bash
# Gerar certificados
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurar no .env
HTTPS=true
SSL_KEY=./key.pem
SSL_CERT=./cert.pem
```

## 🚀 Deploy Produção

### Replit (Recomendado)
1. Configure as variáveis no Secrets
2. Clique em **"Run"**
3. Sofia estará online 24/7

### VPS/Servidor
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar auto-start
pm2 startup
pm2 save
```

## 📞 Suporte

### Problemas Comuns
- [FAQ](faq.md)
- [Issues no GitHub](https://github.com/prongnose2022/sofia-ia/issues)

### Contato
- **Email**: suporte@sofia-ia.com
- **GitHub**: [@prongnose2022](https://github.com/prongnose2022)

---

**✅ Instalação completa! Sofia IA está pronta para usar! 🎉**


# 🧠 Sofia Sales & Support Flow - Organograma Neural

## 📊 Visão Geral do Fluxo

```
                    ┌─────────────┐
                    │   INÍCIO    │
                    │  (Score: 0) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────┐
                    │   QUALIFICAÇÃO      │
                    │    (Score: +10)     │
                    └──────┬──────────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────┐
        │                  │                  │              │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐  ┌─────▼─────┐
   │  TRIAL  │      │   DEMO    │     │ COMERCIAL │  │  SUPORTE  │
   │(+30pts) │      │  (+40pts) │     │  (+50pts) │  │  (+20pts) │
   └────┬────┘      └─────┬─────┘     └─────┬─────┘  └─────┬─────┘
        │                  │                  │              │
        └──────────────────┼──────────────────┴──────────────┘
                           │
                    ┌──────▼──────────┐
                    │  AGENDAMENTO    │
                    │   (+70 pts)     │
                    └──────┬──────────┘
                           │
                    ┌──────▼──────────┐
                    │  CONFIRMAÇÃO    │
                    │   (+80 pts)     │
                    │  [Google Meet]  │
                    └──────┬──────────┘
                           │
                    ┌──────▼──────────┐
                    │ PÓS-AGENDAMENTO │
                    │   (+90 pts)     │
                    └──────┬──────────┘
                           │
                    ┌──────▼──────────┐
                    │   FECHAMENTO    │
                    │   (100 pts)     │
                    │  💰 CLIENTE!    │
                    └─────────────────┘
```

## 🎯 Sistema de Scoring de Leads

| Score | Nível | Ação Recomendada |
|-------|-------|------------------|
| 0-29  | 🧊 Frio | Nurturing com conteúdo |
| 30-59 | 🌡️ Morno | Oferecer trial/demo |
| 60-79 | 🔥 Quente | Agendar consultoria |
| 80-100| 🔥🔥 Muito Quente | Fechamento ativo |

## 📱 Fluxo Detalhado por Etapa

### 1️⃣ INÍCIO (Score: 0)
**Mensagem:**
```
Olá {nome}! 👋 Sou a Sofia, assistente virtual da consultoria.

Posso ajudar com:

1️⃣ Trial 7 dias grátis
2️⃣ Ver demo guiada
3️⃣ Falar sobre preços
4️⃣ Suporte técnico
5️⃣ Agendar consultoria

Digite o número ou me conte o que precisa! 😊
```

**Typing Delay:** 1.8s  
**Palavras-chave:** "oi", "olá", "ajuda", "início"

---

### 2️⃣ TRIAL (Score: +30)
**Mensagem:**
```
🎉 Perfeito! O trial de 7 dias inclui:

✅ Acesso completo à plataforma
✅ Exemplos prontos de fluxos
✅ Relatório de interações
✅ Suporte via WhatsApp

Deseja ativar agora ou conhecer a demo primeiro?

Digite:
• "ATIVAR" para começar já
• "DEMO" para ver antes
```

**Typing Delay:** 2.0s  
**Palavras-chave:** "trial", "teste", "grátis", "7 dias"

---

### 3️⃣ DEMO (Score: +40)
**Mensagem:**
```
🎬 Na demo, mostro como a Sofia funciona:

📊 Painel de controle
🤖 IA conversacional
📈 Análise de conversões
📅 Agendamento automático

Prefere:
• "VÍDEO" - assistir demonstração (3min)
• "TOUR" - tour guiado em chamada
• "VOLTAR" - retornar ao menu
```

**Typing Delay:** 2.2s  
**Palavras-chave:** "demo", "demonstração", "tour", "vídeo"

---

### 4️⃣ COMERCIAL/FINANCEIRO (Score: +50)
**Mensagem:**
```
💰 Planos Sofia IA:

📦 **Trial** - Grátis por 7 dias
🚀 **Inicial** - R$ 97/mês
⭐ **Pro** - R$ 297/mês
🏢 **Enterprise** - Sob consulta

Deseja proposta detalhada ou estimativa rápida?
```

**Typing Delay:** 2.0s  
**Palavras-chave:** "preço", "valor", "custo", "plano"

---

### 5️⃣ SUPORTE (Score: +20)
**Mensagem:**
```
🛠️ Suporte Sofia - Como posso ajudar?

Problemas comuns:

1️⃣ QR Code não aparece
2️⃣ WhatsApp desconectou
3️⃣ Integração Google
4️⃣ Erro ao enviar mensagens
5️⃣ Outro problema

Digite o número ou descreva sua dúvida!
```

**Typing Delay:** 1.6s  
**Palavras-chave:** "ajuda", "suporte", "erro", "problema", "qr"

---

### 6️⃣ AGENDAMENTO (Score: +70)
**Mensagem:**
```
📅 Vamos agendar sua consultoria!

Tem preferência de dia e horário?

Exemplos:
• "amanhã às 14h"
• "quarta-feira 10h"
• "sexta 15:30"

Ou escolha:

🗓️ Amanhã 10h
🗓️ Amanhã 15h  
🗓️ Sexta 11h

Qual prefere?
```

**Typing Delay:** 2.5s  
**Ação:** Criar evento Google Calendar + Meet  
**Palavras-chave:** "agendar", "marcar", "reunião", "horário"

---

### 7️⃣ CONFIRMAÇÃO (Score: +80)
**Mensagem:**
```
✅ **Agendamento Confirmado!**

📅 Data: {data}
🕐 Horário: {hora}
🔗 Google Meet: {link_meet}

📋 **Prepare-se:**
• Objetivos do seu negócio
• Dúvidas sobre a plataforma
• Materiais de referência

⏰ Enviarei lembrete 1h antes!

Tudo certo?
```

**Typing Delay:** 2.0s  
**Integração:** Google Calendar API

---

## 🔄 Follow-Up Automático

| Tempo | Ação |
|-------|------|
| +12h sem resposta | "Olá! Ficou alguma dúvida?" |
| +24h sem resposta | "Ainda posso ajudar com {último_interesse}" |
| -1h antes reunião | "Lembrete: reunião em 1h - {link_meet}" |

## 🎨 Delays por Tamanho de Mensagem

```javascript
// Fórmula: 50-150ms por caractere, máx 3.5s
const delay = Math.min(texto.length * (50 + Math.random() * 100), 3500);
```

## 📊 Integração com Dashboard Admin

### Analytics em Tempo Real
- Total de conversas ativas
- Score médio dos leads
- Taxa de conversão por etapa
- Horários de maior engajamento

### GPT Insights
```
"32% dos leads estão na etapa de demo
Recomendação: criar vídeo curto (30s) 
para aumentar conversão"
```

## 🔐 Palavras-chave de Controle

| Comando | Ação |
|---------|------|
| "MENU" | Voltar ao início |
| "PARAR" | Encerrar conversa |
| "HUMANO" | Transferir para atendente |
| "AJUDA" | Mostrar comandos |

## 🚀 Próximos Passos de Implementação

1. ✅ Código do fluxo criado
2. ⏳ Integrar com index.js (Baileys)
3. ⏳ Conectar Google Calendar API
4. ⏳ Criar dashboard de analytics
5. ⏳ Configurar GitHub público

---

**Versão:** 1.0 - Sofia Sales & Support Flow  
**Última atualização:** Janeiro 2025

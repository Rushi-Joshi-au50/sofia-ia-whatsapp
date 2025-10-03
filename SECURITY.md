# 🔒 Política de Segurança

[![GitHub](https://img.shields.io/badge/GitHub-sofia--ia--whatsapp-blue?style=flat-square&logo=github)](https://github.com/prognose2022/sofia-ia-whatsapp)

## Reportar Vulnerabilidades

**Encontrou uma vulnerabilidade de segurança?** Por favor, **NÃO** abra uma issue pública.

📧 Envie um email para: **security@dedcompany.com** com:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestões de correção (se houver)

## Versões Suportadas

## ⚠️ IMPORTANTE - Configuração Obrigatória

Este sistema requer configuração de variáveis de ambiente para funcionar.

### 1. Configure no Replit Secrets:

```
GOOGLE_KEY_JSON={"type":"service_account","project_id":"seu-projeto"...}
OPENAI_API_KEY=sk-...
VAPI_API_KEY=vapi_...
HUBSPOT_ACCESS_TOKEN=pat-na1-...
WEBHOOK_SECRET=seu-secret-webhook
CLOUDFLARE_ZONE_ID=sua-zone-id
CLOUDFLARE_API_TOKEN=seu-token-cloudflare
AUTHORIZED_IPS=127.0.0.1,seu-ip-autorizado
```

### 2. Crie arquivo .env local (apenas desenvolvimento):

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Configure credenciais Google:

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie projeto e ative APIs necessárias
3. Gere chave de conta de serviço
4. Adicione o JSON completo em GOOGLE_KEY_JSON no Secrets

### 4. Zero Trust Security:

O sistema implementa segurança Zero Trust:
- Verificação de IP de origem
- Rate limiting
- Auditoria de acessos
- Alertas automáticos

### 5. Para produção com Cloudflare:

1. Configure domínio no Cloudflare
2. Ative Zero Trust
3. Configure regras de acesso
4. Adicione tokens nos Secrets

## 🚨 Nunca commite credenciais reais!
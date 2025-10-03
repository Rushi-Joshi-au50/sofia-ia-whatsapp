# 🤝 Guia de Contribuição - Sofia IA

[![GitHub](https://img.shields.io/badge/GitHub-sofia--ia--whatsapp-blue?style=flat-square&logo=github)](https://github.com/prognose2022/sofia-ia-whatsapp)

Obrigado por considerar contribuir com o Sofia IA! Este documento fornece diretrizes para contribuir com o projeto.

🔗 **[Ver Projeto no GitHub](https://github.com/prognose2022/sofia-ia-whatsapp)**

## 🎯 Como Contribuir

### 🐛 Reportando Bugs
1. Verifique se o bug já foi reportado em [Issues](https://github.com/prognose2022/sofia-ia-whatsapp/issues)
2. Se não, crie uma nova issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Informações do ambiente

### 💡 Sugerindo Funcionalidades
1. Abra uma issue com o label "enhancement"
2. Descreva a funcionalidade em detalhes
3. Explique o caso de uso
4. Forneça exemplos se possível

### 🔧 Enviando Código

#### Setup do Ambiente de Desenvolvimento
```bash
# Clone o repositório
git clone https://github.com/prognose2022/sofia-ia-whatsapp.git
cd sofia-ia-whatsapp

# Instale dependências
npm install --legacy-peer-deps
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais
```

#### Processo de Pull Request
1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Faça commit das mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### 📝 Padrões de Código

#### Python
- Use PEP 8
- Docstrings para funções públicas
- Type hints quando possível
- Testes unitários

#### JavaScript/TypeScript
- Use ESLint e Prettier
- Componentes funcionais no React
- TypeScript para tipagem
- Comentários JSDoc

#### Commits
- Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- Seja descritivo mas conciso
- Uma funcionalidade por commit

## 🏗️ Estrutura do Projeto

```
sofia-ia-whatsapp/
├── client/           # Frontend React + TypeScript
├── server/           # Backend Node.js + Express
├── providers/        # Providers WhatsApp (Baileys/API)
├── services/         # Serviços de negócio
├── templates/        # Templates Flask
├── logs/            # Logs e relatórios
├── docs/            # Documentação
└── tests/           # Testes automatizados
```

## 🧪 Testes

### Executar Testes
```bash
# Testes Python
python -m pytest tests/

# Testes Node.js
npm test

# Testes E2E
npm run test:e2e
```

### Cobertura de Testes
- Mantenha cobertura acima de 80%
- Teste funcionalidades críticas
- Inclua testes para novos recursos

## 📚 Documentação

### Atualizando Docs
- README.md para mudanças gerais
- Docstrings para funções
- Comentários para código complexo
- Changelog para releases

### Exemplos de Código
- Inclua exemplos práticos
- Use casos reais
- Mantenha atualizados

## 🚀 Deploy e Release

### Versionamento
- Use Semantic Versioning (SemVer)
- Major: mudanças breaking
- Minor: novas funcionalidades
- Patch: bug fixes

### Process de Release
1. Atualizar versão no package.json
2. Atualizar CHANGELOG.md
3. Criar tag: `git tag v1.2.3`
4. Push: `git push origin v1.2.3`

## 🛡️ Segurança

### Reportando Vulnerabilidades
- **NÃO** abra issues públicas para vulnerabilidades
- Envie email para: security@sofia-ia.com
- Inclua descrição detalhada
- Aguarde resposta antes de divulgar

### Boas Práticas
- Nunca commite credenciais
- Use variáveis de ambiente
- Valide todas as entradas
- Sanitize dados do usuário

## 💬 Comunicação

### Canais
- **Issues**: Bugs e funcionalidades
- **Discussions**: Perguntas gerais
- **Email**: Contato direto

### Código de Conduta
- Seja respeitoso e inclusivo
- Critique código, não pessoas
- Ajude outros desenvolvedores
- Mantenha discussões construtivas

## 🏆 Reconhecimento

Contribuidores serão reconhecidos em:
- README.md
- CONTRIBUTORS.md
- Release notes
- Agradecimentos especiais

## 📋 Checklist para PRs

- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Changelog atualizado (se necessário)
- [ ] Commit messages seguem convenção
- [ ] PR descreve as mudanças claramente
- [ ] Screenshots incluídas (se UI)

## 🆘 Precisa de Ajuda?

- 📖 Leia a [documentação](docs/)
- 💬 Participe das [discussões](https://github.com/prognose2022/sofia-ia-whatsapp/discussions)
- 📧 Entre em contato: dev@sofia-ia.com

---

**Obrigado por contribuir para o Sofia IA! 🚀**
import express from 'express';
import axios from 'axios';
import { addLogEntry } from './storage';

// Fluxo padrão de agendamento para Sofia
const sofiaAgendamentoFlow = {
  "name": "Sofia - Agendamento de Consultoria",
  "description": "Fluxo de ligação da Sofia para despertar interesse e agendar consultoria gratuita.",
  "global_prompt": "Você é Sofia, uma assistente virtual simpática e consultiva. Seu papel é entrar em contato com empresas da área de eventos para entender suas necessidades e oferecer uma consultoria gratuita com nosso agente comercial.",
  "nodes": [
    {
      "type": "conversation",
      "id": "inicio",
      "name": "Início da Ligação",
      "message": "Olá! Aqui é a Sofia, consultora virtual. Estou entrando em contato com empresas da área de eventos para oferecer uma consultoria gratuita com nosso agente comercial. Você teria 1 minutinho agora para conversarmos?",
      "transitions": {
        "yes": "descoberta",
        "no": "encerrar"
      }
    },
    {
      "type": "conversation",
      "id": "descoberta",
      "name": "Descobrir Necessidade",
      "message": "Perfeito! Antes de agendarmos, posso te perguntar: hoje vocês já realizam eventos com frequência? Ou estão considerando isso para os próximos meses?",
      "transitions": {
        "sim_eventos": "valor",
        "nao_eventos": "interesse_futuro"
      }
    },
    {
      "type": "conversation",
      "id": "valor",
      "name": "Gerar Valor",
      "message": "Entendi. Nós temos ajudado diversas empresas como a sua a aumentar a presença em eventos com estratégias sob medida. Podemos te mostrar um plano gratuito adaptado à sua realidade. Podemos agendar?",
      "transitions": {
        "sim": "agendamento",
        "duvida": "esclarecer"
      }
    },
    {
      "type": "conversation",
      "id": "interesse_futuro",
      "name": "Explorar Interesse Futuro",
      "message": "Sem problemas! Às vezes o momento ainda não está certo. Mas posso deixar uma ideia preparada com base no seu perfil para quando for oportuno. Posso anotar um horário para te enviar?",
      "transitions": {
        "sim": "agendamento",
        "nao": "encerrar"
      }
    },
    {
      "type": "conversation",
      "id": "esclarecer",
      "name": "Esclarecer Dúvidas",
      "message": "A consultoria é 100% gratuita, sem compromisso. Nosso agente irá entender melhor seu negócio e sugerir ideias práticas. Podemos agendar?",
      "transitions": {
        "sim": "agendamento",
        "nao": "encerrar"
      }
    },
    {
      "type": "conversation",
      "id": "agendamento",
      "name": "Confirmar Agendamento",
      "message": "Ótimo! Qual seria o melhor dia e horário para essa consultoria? Anotando aqui...",
      "transitions": {
        "ok": "confirmado"
      }
    },
    {
      "type": "conversation",
      "id": "confirmado",
      "name": "Confirmado",
      "message": "Consultoria gratuita agendada com sucesso! Caso deseje alterar, cancelar ou tirar dúvidas, você pode me chamar novamente ou ligar para nós. Obrigada!"
    },
    {
      "type": "conversation",
      "id": "encerrar",
      "name": "Encerrar Contato",
      "message": "Sem problemas. Obrigada por ouvir! Se quiser conversar em outro momento, estou à disposição."
    }
  ]
};

// Fluxo de WhatsApp para Sofia
const sofiaWhatsAppFlow = {
  "name": "Sofia - Agendamento via WhatsApp",
  "description": "Fluxo de WhatsApp da Sofia para despertar interesse e agendar consultoria gratuita.",
  "global_prompt": "Você é Sofia, uma assistente virtual simpática e consultiva. Seu papel é contatar empresas da área de eventos por WhatsApp para entender suas necessidades e oferecer uma consultoria gratuita com nosso agente comercial.",
  "nodes": [
    {
      "type": "conversation",
      "id": "inicio",
      "name": "Início da Conversa",
      "message": "Olá! Aqui é a Sofia da Agência de Eventos. Estou entrando em contato para oferecer uma consultoria gratuita personalizada para sua empresa. Podemos conversar brevemente sobre isso?",
      "transitions": {
        "sim": "descoberta",
        "não": "encerrar",
        "talvez": "esclarecer"
      }
    },
    {
      "type": "conversation",
      "id": "descoberta",
      "name": "Descobrir Necessidade",
      "message": "Ótimo! Me conte um pouco sobre sua empresa. Vocês já realizam eventos com frequência ou estão planejando começar?",
      "transitions": {
        "já_realiza": "valor",
        "planejando": "interesse_futuro",
        "não_realiza": "interesse_futuro"
      }
    },
    {
      "type": "conversation",
      "id": "valor",
      "name": "Gerar Valor",
      "message": "Entendi! Temos ajudado empresas como a sua a potencializar resultados com eventos estratégicos. Nosso consultor pode apresentar um plano personalizado sem compromisso. Qual o melhor horário para essa conversa?",
      "transitions": {
        "informar_horário": "agendamento",
        "dúvida": "esclarecer"
      }
    },
    {
      "type": "conversation",
      "id": "interesse_futuro",
      "name": "Explorar Interesse Futuro",
      "message": "Compreendo! Podemos preparar algumas ideias iniciais para quando for o momento certo. Nosso consultor pode fazer uma análise rápida sem compromisso. Posso agendar um horário para essa conversa?",
      "transitions": {
        "sim": "agendamento",
        "não": "encerrar"
      }
    },
    {
      "type": "conversation",
      "id": "esclarecer",
      "name": "Esclarecer Dúvidas",
      "message": "A consultoria é totalmente gratuita e personalizada para seu negócio. Nosso especialista vai entender suas necessidades e apresentar possibilidades para sua empresa. Podemos agendar esse bate-papo?",
      "transitions": {
        "sim": "agendamento",
        "não": "encerrar"
      }
    },
    {
      "type": "conversation",
      "id": "agendamento",
      "name": "Confirmar Agendamento",
      "message": "Excelente! Qual seria o melhor dia e horário para essa consultoria gratuita? Nossa equipe está disponível em horário comercial.",
      "transitions": {
        "informar_horário": "confirmado"
      }
    },
    {
      "type": "conversation",
      "id": "confirmado",
      "name": "Confirmado",
      "message": "Perfeito! Sua consultoria gratuita está agendada. Enviarei uma confirmação por aqui na véspera. Caso precise reagendar, é só me avisar. Agradeço seu interesse e disponibilidade!"
    },
    {
      "type": "conversation",
      "id": "encerrar",
      "name": "Encerrar Contato",
      "message": "Entendo! Agradeço seu tempo e atenção. Se mudar de ideia ou precisar de informações sobre eventos no futuro, estou à disposição. Tenha um ótimo dia!"
    }
  ]
};

// Configurar rotas para o importador de fluxos
const router = express.Router();

// Rota para exibir interface do importador
router.get('/vapi-flow-import', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Importador de Fluxos para Vapi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #333;
          }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #f9f9f9;
          }
          .card h2 {
            margin-top: 0;
            color: #2c62c8;
          }
          button {
            background-color: #2c62c8;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background-color: #1e4ba3;
          }
          .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 4px;
            display: none;
          }
          .success {
            background-color: #d4edda;
            color: #155724;
          }
          .error {
            background-color: #f8d7da;
            color: #721c24;
          }
          textarea {
            width: 100%;
            height: 150px;
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
          }
          .hidden {
            display: none;
          }
          .tabs {
            display: flex;
            margin-bottom: 20px;
          }
          .tab {
            padding: 10px 15px;
            cursor: pointer;
            background-color: #eee;
            border: 1px solid #ddd;
            border-radius: 4px 4px 0 0;
            margin-right: 5px;
          }
          .tab.active {
            background-color: #fff;
            border-bottom: 1px solid #fff;
          }
          #customFlowContainer {
            display: none;
          }
        </style>
      </head>
      <body>
        <h1>Importador de Fluxos para Vapi</h1>
        <p>Importe fluxos pré-configurados para a Sofia na plataforma Vapi.</p>
        
        <div class="tabs">
          <div class="tab active" onclick="showTab('predefined')">Fluxos Pré-definidos</div>
          <div class="tab" onclick="showTab('custom')">Fluxo Personalizado</div>
        </div>
        
        <div id="predefinedFlowContainer">
          <div class="card">
            <h2>Sofia - Agendamento de Consultoria (Ligação)</h2>
            <p>Fluxo para chamadas telefônicas onde a Sofia conversa com potenciais clientes para agendar uma consultoria gratuita.</p>
            <button onclick="copyFlow('call')">Copiar JSON</button>
            <textarea id="callFlowJson" class="hidden">${JSON.stringify(sofiaAgendamentoFlow, null, 2)}</textarea>
          </div>
          
          <div class="card">
            <h2>Sofia - Agendamento via WhatsApp</h2>
            <p>Fluxo adaptado para WhatsApp onde a Sofia conversa com potenciais clientes para agendar uma consultoria gratuita.</p>
            <button onclick="copyFlow('whatsapp')">Copiar JSON</button>
            <textarea id="whatsappFlowJson" class="hidden">${JSON.stringify(sofiaWhatsAppFlow, null, 2)}</textarea>
          </div>
        </div>
        
        <div id="customFlowContainer">
          <div class="card">
            <h2>Importar Fluxo Personalizado</h2>
            <p>Cole aqui o JSON do seu fluxo personalizado:</p>
            <textarea id="customFlowJson" placeholder="Cole aqui o JSON do fluxo personalizado..."></textarea>
            <button onclick="copyCustomFlow()" style="margin-top: 10px;">Copiar JSON</button>
          </div>
        </div>
        
        <div id="result" class="result"></div>
        
        <div class="card">
          <h2>Como Importar</h2>
          <ol>
            <li>Clique em "Copiar JSON" para o fluxo desejado</li>
            <li>Acesse sua assistente Sofia no Vapi</li>
            <li>Cole o JSON e envie a mensagem "Importar este fluxo para a minha conta Vapi"</li>
          </ol>
        </div>
        
        <script>
          function copyFlow(type) {
            const element = document.getElementById(type === 'call' ? 'callFlowJson' : 'whatsappFlowJson');
            element.classList.remove('hidden');
            element.select();
            document.execCommand('copy');
            element.classList.add('hidden');
            
            const result = document.getElementById('result');
            result.textContent = 'JSON copiado para a área de transferência! Cole na interface da Sofia na Vapi.';
            result.className = 'result success';
            result.style.display = 'block';
            
            setTimeout(function() {
              result.style.display = 'none';
            }, 5000);
          }
          
          function copyCustomFlow() {
            const element = document.getElementById('customFlowJson');
            if (!element.value.trim()) {
              const result = document.getElementById('result');
              result.textContent = 'Por favor, insira um JSON válido primeiro.';
              result.className = 'result error';
              result.style.display = 'block';
              
              setTimeout(function() {
                result.style.display = 'none';
              }, 5000);
              return;
            }
            
            element.select();
            document.execCommand('copy');
            
            const result = document.getElementById('result');
            result.textContent = 'JSON personalizado copiado! Cole na interface da Sofia na Vapi.';
            result.className = 'result success';
            result.style.display = 'block';
            
            setTimeout(function() {
              result.style.display = 'none';
            }, 5000);
          }
          
          function showTab(tabName) {
            // Atualizar abas
            var tabs = document.querySelectorAll('.tab');
            for (var i = 0; i < tabs.length; i++) {
              tabs[i].classList.remove('active');
            }
            
            var tabIndex = tabName === 'predefined' ? 0 : 1;
            var clickedTab = document.querySelectorAll('.tab')[tabIndex];
            clickedTab.classList.add('active');
            
            // Mostrar/ocultar containers
            if (tabName === 'predefined') {
              document.getElementById('predefinedFlowContainer').style.display = 'block';
              document.getElementById('customFlowContainer').style.display = 'none';
            } else {
              document.getElementById('predefinedFlowContainer').style.display = 'none';
              document.getElementById('customFlowContainer').style.display = 'block';
            }
          }
        </script>
      </body>
    </html>
  `);
});

export default router;

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminGuide {
  category: string;
  questions: string[];
  actions: string[];
}

export default function AdminDashboard() {
  const [currentGuide, setCurrentGuide] = useState<string>("sistema");
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [gptInsights, setGptInsights] = useState<string>("");
  const [leadStats, setLeadStats] = useState({
    total: 0,
    frios: 0,
    mornos: 0,
    quentes: 0,
    conversoes: 0
  });

  // 🤖 GPT Analytics em Tempo Real
  useEffect(() => {
    const fetchGPTInsights = async () => {
      try {
        const response = await fetch('/api/gpt-analytics');
        const data = await response.json();
        setGptInsights(data.insight);
        setLeadStats(data.stats);
      } catch (error) {
        console.error('Erro ao buscar insights GPT:', error);
      }
    };

    fetchGPTInsights();
    const interval = setInterval(fetchGPTInsights, 30000); // A cada 30s
    return () => clearInterval(interval);
  }, []);

  const adminGuides: AdminGuide[] = [
    {
      category: "sistema",
      questions: [
        "🔧 O sistema está funcionando corretamente?",
        "📱 O WhatsApp está conectado e respondendo?",
        "🤖 A IA está processando mensagens adequadamente?",
        "📊 Quantos usuários estão ativos no momento?"
      ],
      actions: [
        "Verificar status das conexões",
        "Testar resposta da IA",
        "Reiniciar serviços se necessário",
        "Verificar logs de erro"
      ]
    },
    {
      category: "usuarios",
      questions: [
        "👥 Quantos usuários demo vs full temos?",
        "⏰ Algum usuário demo está próximo do vencimento?",
        "📈 Qual a taxa de conversão demo → full?",
        "🎯 Quais usuários precisam de follow-up?"
      ],
      actions: [
        "Criar novos usuários demo",
        "Converter demos em full",
        "Enviar lembretes de vencimento",
        "Analisar métricas de conversão"
      ]
    },
    {
      category: "conversas",
      questions: [
        "💬 A Sofia está respondendo naturalmente?",
        "🎯 Os clientes estão chegando ao agendamento?",
        "📋 Quantos agendamentos foram criados hoje?",
        "🔄 Alguma conversa precisa de intervenção manual?"
      ],
      actions: [
        "Revisar fluxo de conversação",
        "Melhorar respostas da IA",
        "Intervir em conversas problemáticas",
        "Atualizar scripts comerciais"
      ]
    },
    {
      category: "tecnicos",
      questions: [
        "🔐 As credenciais estão seguras e funcionando?",
        "☁️ O Google Calendar está sincronizando?",
        "📊 O HubSpot está recebendo dados?",
        "🚀 O deploy está estável?"
      ],
      actions: [
        "Renovar tokens de API",
        "Testar integrações",
        "Fazer backup dos dados",
        "Monitorar performance"
      ]
    }
  ];

  const generateAILog = () => {
    const timestamp = new Date().toLocaleTimeString();
    const logTypes = [
      `[${timestamp}] ✅ IA processou mensagem: "Quero agendar" → Resposta: Agendamento iniciado`,
      `[${timestamp}] 📊 Análise de sentimento: Cliente demonstra interesse alto`,
      `[${timestamp}] 🎯 Conversão detectada: Demo → Agendamento de reunião`,
      `[${timestamp}] 💬 Fluxo comercial: Etapa 'descoberta' → 'apresentacao'`,
      `[${timestamp}] ⚠️ Cliente inativo há 2 dias - Sugestão: Enviar follow-up`,
    ];
    
    const newLog = logTypes[Math.floor(Math.random() * logTypes.length)];
    setAiLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    // Simular logs da IA a cada 10 segundos
    const interval = setInterval(generateAILog, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sofia Admin - Painel Inteligente</h1>
        <div className="flex gap-2">
          <Badge variant="outline">Sistema Híbrido</Badge>
          <Badge variant="secondary">IA Ativa</Badge>
        </div>
      </div>

      {/* Guia Administrativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧭 Guia Administrativo - O que verificar agora?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentGuide} onValueChange={setCurrentGuide}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="sistema">🔧 Sistema</TabsTrigger>
              <TabsTrigger value="usuarios">👥 Usuários</TabsTrigger>
              <TabsTrigger value="conversas">💬 Conversas</TabsTrigger>
              <TabsTrigger value="tecnicos">⚙️ Técnico</TabsTrigger>
            </TabsList>

            {adminGuides.map((guide) => (
              <TabsContent key={guide.category} value={guide.category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-3">❓ Perguntas Importantes:</h3>
                    <ul className="space-y-2">
                      {guide.questions.map((question, idx) => (
                        <li key={idx} className="text-sm p-2 bg-blue-50 rounded">
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">⚡ Ações Recomendadas:</h3>
                    <ul className="space-y-2">
                      {guide.actions.map((action, idx) => (
                        <li key={idx} className="text-sm p-2 bg-green-50 rounded flex items-center justify-between">
                          {action}
                          <Button size="sm" variant="outline">Executar</Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code History & IA Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Histórico de QR Codes
              <Badge variant="outline">Últimos 10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { timestamp: "2025-01-20 14:30", status: "conectado", session: "abc123" },
                { timestamp: "2025-01-20 10:15", status: "expirado", session: "def456" },
                { timestamp: "2025-01-19 16:45", status: "desconectado", session: "ghi789" },
              ].map((qr, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{qr.timestamp}</div>
                      <div className="text-xs text-gray-500">Sessão: {qr.session}</div>
                    </div>
                    <Badge 
                      variant={
                        qr.status === "conectado" ? "default" : 
                        qr.status === "expirado" ? "secondary" : 
                        "destructive"
                      }
                    >
                      {qr.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button size="sm" variant="outline">
                📷 Gerar Novo QR
              </Button>
              <Button size="sm" variant="outline">
                🔄 Reconectar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 IA Sofia - Logs Inteligentes
              <Badge variant="secondary">GPT-4</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {aiLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aguardando atividade da IA...
                </p>
              ) : (
                aiLogs.map((log, idx) => (
                  <div key={idx} className="text-xs p-2 bg-gray-100 rounded font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
            <Button onClick={generateAILog} className="w-full mt-4" variant="outline">
              🔄 Simular Log IA
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📞 Suporte & Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Suporte Técnico Avançado:</strong><br/>
                Para análises técnicas detalhadas ou customizações específicas, 
                entre em contato com o desenvolvedor.
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold">📧 Contato do Desenvolvedor:</h4>
              <p className="text-sm mt-2">
                <strong>Emanuel - Arquiteto Sofia IA</strong><br/>
                📧 emanuel.dev@sofia-ia.com.br<br/>
                💼 Especialista em IA Conversacional<br/>
                🚀 Disponível para melhorias e customizações
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                📱 Chat Direto
              </Button>
              <Button variant="outline" size="sm">
                📧 Email Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🤖 GPT Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧠 GPT Insights - Análise Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">{gptInsights || "Analisando dados em tempo real..."}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{leadStats.frios}</div>
              <div className="text-xs">🧊 Frios</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">{leadStats.mornos}</div>
              <div className="text-xs">🌡️ Mornos</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{leadStats.quentes}</div>
              <div className="text-xs">🔥 Quentes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{leadStats.conversoes}</div>
              <div className="text-xs">💰 Conversões</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">87%</div>
            <div className="text-sm text-gray-600">Taxa Conversão</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">24</div>
            <div className="text-sm text-gray-600">Usuários Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">156</div>
            <div className="text-sm text-gray-600">Conversas IA</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">12</div>
            <div className="text-sm text-gray-600">Agendamentos</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

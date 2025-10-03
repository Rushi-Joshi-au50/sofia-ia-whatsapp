import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { contactsApi } from "@/lib/contact-api";
import { apiRequest } from "@/lib/queryClient";

export function MessageSimulator() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [simulationSpeed, setSimulationSpeed] = useState("normal");
  const [simulationStatus, setSimulationStatus] = useState<string>("idle");
  const [progress, setProgress] = useState(0);
  const [useBusinessTemplate, setUseBusinessTemplate] = useState(false);
  const [results, setResults] = useState<{ 
    phoneNumber: string, 
    success: boolean, 
    message: string,
    timestamp: Date 
  }[]>([]);
  
  const { toast } = useToast();

  // Valores de atraso (em ms) para diferentes velocidades de simulação
  const speedDelays = {
    slow: 5000,    // 5 segundos
    normal: 2000,  // 2 segundos
    fast: 800      // 0.8 segundos
  };

  // Gerar contatos para teste
  const generateTestContacts = (count: number) => {
    const contacts = [];
    const ddds = ["11", "21", "31", "41", "47", "48", "51", "62", "71", "81", "91"];
    
    for (let i = 0; i < count; i++) {
      const ddd = ddds[Math.floor(Math.random() * ddds.length)];
      const randomPart = Math.floor(10000000 + Math.random() * 90000000);
      const phoneNum = `55${ddd}${randomPart}`;
      
      contacts.push({
        id: `sim_${Date.now()}_${i}`,
        phoneNumber: phoneNum,
        name: `Contato Simulado ${i + 1}`
      });
    }
    
    return contacts;
  };

  // Simular envio de mensagens
  const simulateMessaging = async () => {
    try {
      if (!message.trim()) {
        toast({
          title: "Mensagem vazia",
          description: "Por favor, digite uma mensagem para simular o envio.",
          variant: "destructive"
        });
        return;
      }

      setSimulationStatus("running");
      setProgress(0);
      setResults([]);
      
      // Determinar se vamos usar contatos gerados ou o número específico
      let contacts = [];
      
      if (phoneNumber.trim()) {
        // Se número específico fornecido, criar apenas um contato
        const cleanedNumber = phoneNumber.trim().replace(/\D/g, '');
        
        // Validar número
        if (!/^\d{10,15}$/.test(cleanedNumber)) {
          toast({
            title: "Número inválido",
            description: "O número deve ter entre 10 e 15 dígitos numéricos.",
            variant: "destructive"
          });
          setSimulationStatus("error");
          return;
        }
        
        contacts = [{
          id: `sim_${Date.now()}`,
          phoneNumber: cleanedNumber,
          name: "Contato Específico"
        }];
      } else {
        // Gerar contatos aleatórios
        contacts = generateTestContacts(5);
      }
      
      // Obter atraso correspondente à velocidade selecionada
      const delay = speedDelays[simulationSpeed as keyof typeof speedDelays];
      const newResults = [];
      
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        
        // Atualizar progresso
        setProgress(Math.round(((i + 1) / contacts.length) * 100));
        
        try {
          // Enviar mensagem real via API para simulação de envio
          const response = await fetch("/api/simulate-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: contact.phoneNumber,
              message: message,
              useBusinessTemplate: useBusinessTemplate
            }),
          });
          
          // Adicionar um pequeno atraso para simular tempo de rede
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const data = await response.json();
          
          const result = {
            phoneNumber: contact.phoneNumber,
            success: data.success,
            message: data.message,
            timestamp: new Date(data.timestamp || Date.now())
          };
          
          newResults.push(result);
          setResults([...newResults]);
          
          // Notificar resultado
          if (data.success) {
            toast({
              title: "Mensagem enviada",
              description: `Enviado para ${contact.phoneNumber}`,
            });
          } else {
            toast({
              title: "Falha ao enviar",
              description: `${data.message}`,
              variant: "destructive"
            });
          }
        } catch (error) {
          // Em caso de erro na API
          const result = {
            phoneNumber: contact.phoneNumber,
            success: false,
            message: error instanceof Error ? error.message : "Erro na comunicação com servidor",
            timestamp: new Date()
          };
          
          newResults.push(result);
          setResults([...newResults]);
          
          toast({
            title: "Erro na comunicação",
            description: `Falha ao tentar enviar para ${contact.phoneNumber}`,
            variant: "destructive"
          });
        }
      }
      
      setSimulationStatus("completed");
      toast({
        title: "Simulação concluída",
        description: `${contacts.length} mensagens simuladas. ${newResults.filter(r => r.success).length} com sucesso.`
      });
      
    } catch (error) {
      setSimulationStatus("error");
      toast({
        title: "Erro na simulação",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante a simulação",
        variant: "destructive"
      });
    }
  };

  // Cancelar simulação
  const cancelSimulation = () => {
    setSimulationStatus("idle");
    toast({
      title: "Simulação cancelada",
      description: "A simulação foi interrompida."
    });
  };

  // Exportar resultados para CSV
  const exportResults = () => {
    if (results.length === 0) {
      toast({
        title: "Nada para exportar",
        description: "Execute uma simulação primeiro antes de exportar resultados.",
        variant: "destructive"
      });
      return;
    }
    
    const csv = [
      // Cabeçalho
      ["Telefone", "Status", "Mensagem", "Data", "Hora"].join(","),
      // Linhas de dados
      ...results.map(r => [
        r.phoneNumber,
        r.success ? "Sucesso" : "Falha",
        r.message,
        r.timestamp.toLocaleDateString(),
        r.timestamp.toLocaleTimeString()
      ].join(","))
    ].join("\n");
    
    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `simulacao_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
    
    toast({
      title: "Exportação concluída",
      description: "Resultados da simulação exportados com sucesso."
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simulador de Envio</CardTitle>
        <CardDescription>
          Simule o envio de mensagens para contatos, testando diferentes cenários sem enviar mensagens reais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phoneNumber">Número de telefone (opcional)</Label>
              <Input
                id="phoneNumber"
                placeholder="5548999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Se não for inserido, serão gerados contatos aleatórios
              </p>
            </div>
            
            <div>
              <Label htmlFor="simulationSpeed">Velocidade da simulação</Label>
              <Select value={simulationSpeed} onValueChange={setSimulationSpeed}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a velocidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Lento (5s por mensagem)</SelectItem>
                  <SelectItem value="normal">Normal (2s por mensagem)</SelectItem>
                  <SelectItem value="fast">Rápido (0.8s por mensagem)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="message">Mensagem para simulação</Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem para simular o envio..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-32"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="businessTemplate"
              checked={useBusinessTemplate}
              onCheckedChange={setUseBusinessTemplate}
            />
            <Label htmlFor="businessTemplate" className="cursor-pointer">
              Usar template de horário comercial
            </Label>
          </div>
          
          {simulationStatus === "running" && (
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Progresso da simulação</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Resultados da simulação</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportResults}
                >
                  Exportar CSV
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 border-b">
                    <span>{result.phoneNumber}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Enviado" : "Falha"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {simulationStatus === "running" ? (
          <Button 
            variant="destructive" 
            onClick={cancelSimulation}
          >
            Cancelar Simulação
          </Button>
        ) : (
          <Button 
            onClick={simulateMessaging}
            disabled={simulationStatus === "running"}
          >
            Iniciar Simulação
          </Button>
        )}
        
        {results.length > 0 && simulationStatus !== "running" && (
          <Button 
            variant="outline" 
            onClick={() => {
              setResults([]);
              setSimulationStatus("idle");
              setProgress(0);
            }}
          >
            Limpar Resultados
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
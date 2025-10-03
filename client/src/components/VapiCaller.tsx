import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InfoIcon, Loader2Icon, PhoneCallIcon, UploadIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Script padrão da Sofia para eventos alternativos
const DEFAULT_SCRIPT = `Olá! Aqui é a Sofia da DED Company. Estamos oferecendo uma consultoria gratuita para casas e eventos que querem aumentar suas vendas sem depender só do Instagram — especialmente para quem sofre com bloqueios por causa do conteúdo mais ousado. Nós já geramos resultados impressionantes: um cliente investiu R$9 mil e retornou R$1,8 milhão. Você tem dois minutos para conversarmos sobre isso agora?`;

// Opções de voz disponíveis
const VOICE_OPTIONS = [
  { id: "nova", name: "Nova (Português BR)" },
  { id: "alloy", name: "Alloy" },
  { id: "shimmer", name: "Shimmer" }
];

// Interface para fazer chamadas individuais e em massa
export function VapiCaller() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("individual");
  
  // Estado para chamada individual
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState(DEFAULT_SCRIPT);
  const [voice, setVoice] = useState("nova");
  
  // Estado para chamada em massa
  const [file, setFile] = useState<File | null>(null);
  const [batchSize, setBatchSize] = useState("5");
  const [interval, setInterval] = useState("30");
  const [useDefaultScript, setUseDefaultScript] = useState(true);
  const [bulkMessage, setBulkMessage] = useState(DEFAULT_SCRIPT);
  
  // Estado para exibir resultados
  const [callResult, setCallResult] = useState<any>(null);
  
  // Mutation para fazer chamada individual
  const individualCallMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/vapi-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          voice
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCallResult(data);
      toast({
        title: "Chamada iniciada",
        description: `Chamada para ${phoneNumber} iniciada com sucesso.`,
      });
    },
    onError: (error) => {
      setCallResult({ success: false, error: error.message });
      toast({
        title: "Erro ao iniciar chamada",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para fazer chamadas em massa
  const bulkCallMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Selecione um arquivo para upload");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchSize', batchSize);
      formData.append('interval', interval);
      formData.append('message', useDefaultScript ? DEFAULT_SCRIPT : bulkMessage);
      
      const response = await fetch('/api/bulk-calls', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCallResult(data);
      toast({
        title: "Processamento iniciado",
        description: `Iniciando chamadas para ${data.totalAttempted} números.`,
      });
    },
    onError: (error) => {
      setCallResult({ success: false, error: error.message });
      toast({
        title: "Erro ao processar chamadas",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Manipular envio do formulário individual
  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número de telefone válido",
        variant: "destructive",
      });
      return;
    }
    
    individualCallMutation.mutate();
  };
  
  // Manipular envio do formulário em massa
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Arquivo obrigatório",
        description: "Selecione um arquivo Excel ou CSV",
        variant: "destructive",
      });
      return;
    }
    
    bulkCallMutation.mutate();
  };
  
  // Manipular alteração de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sofia Voice AI</CardTitle>
        <CardDescription>
          Faça chamadas telefônicas automatizadas para eventos alternativos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Chamada Individual</TabsTrigger>
            <TabsTrigger value="bulk">Chamadas em Massa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual">
            <form onSubmit={handleIndividualSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone</Label>
                <Input 
                  id="phone" 
                  placeholder="+5548XXXXXXXX" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Digite o número com código do país (+55)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voice">Voz</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Selecione a voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem Inicial</Label>
                <Textarea 
                  id="message" 
                  rows={5} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMessage(DEFAULT_SCRIPT)}
                  className="mt-2"
                >
                  Restaurar Padrão
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={individualCallMutation.isPending}
              >
                {individualCallMutation.isPending ? (
                  <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Processando</>
                ) : (
                  <><PhoneCallIcon className="mr-2 h-4 w-4" /> Iniciar Chamada</>
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="bulk">
            <form onSubmit={handleBulkSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="file">Planilha de Contatos</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadIcon className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para carregar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">
                        Excel, CSV ou TXT (máx. 10MB)
                      </p>
                    </div>
                    <input
                      id="file"
                      type="file"
                      accept=".xlsx,.csv,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {file && (
                  <p className="text-sm font-medium text-green-600">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Tamanho do Lote</Label>
                  <Select value={batchSize} onValueChange={setBatchSize}>
                    <SelectTrigger id="batchSize">
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 chamada por vez</SelectItem>
                      <SelectItem value="3">3 chamadas por vez</SelectItem>
                      <SelectItem value="5">5 chamadas por vez</SelectItem>
                      <SelectItem value="10">10 chamadas por vez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo (segundos)</Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger id="interval">
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">1 minuto</SelectItem>
                      <SelectItem value="300">5 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Script da Chamada</Label>
                <RadioGroup 
                  value={useDefaultScript ? "default" : "custom"}
                  onValueChange={(value) => setUseDefaultScript(value === "default")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default" className="cursor-pointer">Usar script padrão (eventos alternativos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer">Usar script personalizado</Label>
                  </div>
                </RadioGroup>
                
                {!useDefaultScript && (
                  <Textarea 
                    rows={5} 
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Digite sua mensagem personalizada aqui..."
                    className="mt-2"
                  />
                )}
              </div>
              
              <Alert className="bg-blue-50 border-blue-300">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  O processamento em massa fará chamadas para todos os números na planilha.
                  Para evitar bloqueios, utilize lotes pequenos e intervalos maiores.
                </AlertDescription>
              </Alert>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={bulkCallMutation.isPending}
              >
                {bulkCallMutation.isPending ? (
                  <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Processando</>
                ) : (
                  <><PhoneCallIcon className="mr-2 h-4 w-4" /> Iniciar Chamadas em Massa</>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        {callResult && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">
              {callResult.success ? "Operação realizada com sucesso" : "Erro na operação"}
            </h3>
            
            {callResult.success ? (
              <div className="text-green-600">
                {callResult.callId && (
                  <p>ID da Chamada: <span className="font-mono">{callResult.callId}</span></p>
                )}
                {callResult.totalAttempted && (
                  <>
                    <p>Total de chamadas: {callResult.totalAttempted}</p>
                    <p>Sucessos: {callResult.successCount}</p>
                    <p>Falhas: {callResult.failedCount}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                <p>{callResult.error || "Ocorreu um erro ao processar a requisição"}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-gray-500">
          Powered by Vapi &amp; Sofia Voice AI
        </div>
        <div className="text-xs text-gray-500">
          DED Company
        </div>
      </CardFooter>
    </Card>
  );
}

export default VapiCaller;
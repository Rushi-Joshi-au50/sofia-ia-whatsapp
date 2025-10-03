import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Contact, CreateContactRequest, SendMessageRequest, ExcelFile, contactsApi } from "@/lib/contact-api";

export function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<string>("");
  const [useBusinessTemplate, setUseBusinessTemplate] = useState(false);
  const { toast } = useToast();
  
  // Buscar contatos e arquivos Excel ao carregar o componente
  useEffect(() => {
    fetchContacts();
    fetchExcelFiles();
  }, []);
  
  // Função para buscar contatos
  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await apiRequest("GET", "/api/contacts");
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      toast({
        title: "Erro ao buscar contatos",
        description: error instanceof Error ? error.message : "Falha ao carregar contatos do servidor",
        variant: "destructive"
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  // Função para buscar arquivos Excel disponíveis
  const fetchExcelFiles = async () => {
    try {
      const files = await contactsApi.getExcelFiles();
      setExcelFiles(files);
    } catch (error) {
      toast({
        title: "Erro ao buscar arquivos Excel",
        description: error instanceof Error ? error.message : "Falha ao carregar arquivos do servidor",
        variant: "destructive"
      });
    }
  };
  
  // Função para importar contatos de uma planilha Excel
  const handleExcelImport = async () => {
    if (!selectedExcelFile) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo para importar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingExcel(true);
      
      const result = await contactsApi.importFromExcel(selectedExcelFile);
      
      if (result.success) {
        toast({
          title: "Contatos importados",
          description: `${result.count} contatos foram importados com sucesso da planilha.`
        });
        
        // Atualizar a lista de contatos
        fetchContacts();
      } else {
        toast({
          title: "Erro ao importar",
          description: "Falha ao importar contatos da planilha.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Falha ao processar a planilha",
        variant: "destructive"
      });
    } finally {
      setLoadingExcel(false);
    }
  };

  // This would come from an API call in a real implementation
  const messageTemplates = [
    {
      id: "intro",
      name: "Introdução",
      text: `Olá {name}! Sou Emanuel da D.E.D Company, especializada em Assessoria de Marketing e Vendas para casas noturnas e eventos.

Já ajudamos nossos parceiros a faturar mais de 100 milhões nos últimos 3 anos! 

Estamos oferecendo uma consultoria gratuita onde analisamos seu funil de vendas, posicionamento no Instagram e atendimento para montar um plano de ação personalizado.

Podemos conversar sobre como ajudar seu negócio a escalar com mais controle e previsibilidade?`
    },
    {
      id: "scheduling",
      name: "Agendamento",
      text: `Excelente! Podemos agendar uma consultoria gratuita via Google Meet?

Temos horários disponíveis:
- Amanhã às 10h
- Terça-feira às 14h

Qual horário seria melhor para você?`
    },
    {
      id: "confirmation",
      name: "Confirmação",
      text: `Perfeito! Confirmando nossa reunião para {date} às {time}.

Nosso especialista entrará em contato 1h antes para enviar o link do Google Meet.

Poderia me confirmar seu e-mail para enviarmos mais informações sobre a consultoria?`
    },
    {
      id: "reminder",
      name: "Lembrete",
      text: `Olá {name}, só lembrando da nossa consultoria gratuita amanhã às {time}.

Estamos preparando uma análise personalizada para o seu negócio. Preparamos um checklist que pode ajudar nossa conversa:

✓ Seu site ou perfil no Instagram
✓ Histórico de eventos recentes
✓ Principais desafios de marketing atuais

Nos vemos amanhã!`
    }
  ];

  const handleCSVUpload = async () => {
    if (!csvInput.trim()) {
      toast({
        title: "Entrada vazia",
        description: "Por favor, insira dados para importar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const lines = csvInput.trim().split("\n");
      const contactsToImport: CreateContactRequest[] = [];
      const errors: string[] = [];
      
      lines.forEach((line, index) => {
        // Pular linhas vazias
        if (!line.trim()) return;
        
        // Detectar o separador (vírgula, ponto e vírgula, barra vertical ou tabulação)
        let separator = ',';
        if (line.includes(';')) separator = ';';
        else if (line.includes('|')) separator = '|';
        else if (line.includes('\t')) separator = '\t';
        
        // Dividir a linha usando o separador detectado
        const parts = line.split(separator);
        let phoneNumber = parts[0]?.trim() || '';
        let name = parts[1]?.trim() || '';
        
        // Remover espaços extras do número de telefone
        phoneNumber = phoneNumber.replace(/\s+/g, '');
        
        // Validar número de telefone (deve começar com 55 e ter de 10 a 13 dígitos após isso)
        const phoneRegex = /^55\d{10,13}$/;
        
        if (!phoneNumber) {
          errors.push(`Linha ${index + 1}: Número de telefone ausente`);
          return;
        }
        
        if (!phoneRegex.test(phoneNumber)) {
          errors.push(`Linha ${index + 1}: Formato de telefone inválido (${phoneNumber}). Use o formato 55DDDNÚMERO.`);
          return;
        }
        
        // Adicionar o novo contato
        contactsToImport.push({
          phoneNumber,
          name: name || `Contato ${index + 1}`
        });
      });
      
      // Verificar se houve erros
      if (errors.length > 0) {
        const errorMessage = errors.length === 1 
          ? errors[0] 
          : `${errors.length} erros encontrados:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`;
          
        throw new Error(errorMessage);
      }
      
      // Adicionar os contatos
      if (contactsToImport.length === 0) {
        toast({
          title: "Nenhum contato válido",
          description: "Nenhum contato válido foi encontrado nos dados fornecidos.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      
      // Enviar contatos para o servidor
      try {
        const response = await apiRequest("POST", "/api/contacts", contactsToImport);
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Contatos importados",
            description: `${result.count} contatos foram importados com sucesso.`
          });
          
          // Atualizar a lista de contatos
          fetchContacts();
          setCsvInput("");
        } else {
          toast({
            title: "Erro ao importar",
            description: "Falha ao criar contatos no servidor.",
            variant: "destructive"
          });
        }
      } catch (apiError) {
        toast({
          title: "Erro ao importar",
          description: apiError instanceof Error ? apiError.message : "Falha ao enviar dados para o servidor",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Formato de dados inválido",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, insira uma mensagem para enviar.",
        variant: "destructive"
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "Nenhum contato selecionado",
        description: "Por favor, selecione pelo menos um contato para enviar a mensagem.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Enviar mensagem através da API
      const payload: SendMessageRequest = {
        contactIds: selectedContacts,
        message: message,
        useBusinessTemplate: useBusinessTemplate // Incluir a opção de template comercial
      };
      
      const response = await apiRequest("POST", "/api/contacts/send-message", payload);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Mensagens enviadas",
          description: `Mensagem enviada para ${result.count} contatos.`
        });
        
        // Atualizar a lista de contatos para mostrar status atualizado
        fetchContacts();
        
        // Limpar a seleção
        setSelectedContacts([]);
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Falha ao enviar mensagens. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar as mensagens.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.text);
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const getStatusBadge = (status: Contact["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      case "contacted":
        return <Badge variant="secondary">Contatado</Badge>;
      case "responded":
        return <Badge variant="default">Respondeu</Badge>;
      case "scheduled":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Agendado</Badge>;
      case "completed":
        return <Badge variant="destructive">Concluído</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6">Gerenciador de Contatos</h2>
      
      <Tabs defaultValue="contacts">
        <TabsList className="mb-4">
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="message">Enviar Mensagem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Contatos</CardTitle>
              <CardDescription>
                {contacts.length} contatos no total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingContacts ? (
                <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Carregando contatos...</p>
                </div>
              ) : (
                <ScrollArea className="h-[50vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedContacts.length === contacts.length && contacts.length > 0}
                            onChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último Contato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map(contact => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <input 
                              type="checkbox" 
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => handleSelectContact(contact.id)}
                            />
                          </TableCell>
                          <TableCell>{contact.name || "Sem nome"}</TableCell>
                          <TableCell>{contact.phoneNumber}</TableCell>
                          <TableCell>{getStatusBadge(contact.status)}</TableCell>
                          <TableCell>
                            {contact.lastContact 
                              ? new Date(contact.lastContact).toLocaleString() 
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loadingContacts && contacts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Nenhum contato importado. Vá para a aba "Importar" para adicionar contatos.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Importar Contatos</CardTitle>
              <CardDescription>
                Cole uma lista de contatos da sua planilha de eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Instruções de importação:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Copie e cole dados diretamente de sua planilha (Excel, Google Sheets, etc.)</li>
                  <li>Certifique-se que a primeira coluna contenha o número de telefone (com DDD e país)</li>
                  <li>A segunda coluna deve conter o nome do contato ou da empresa</li>
                  <li>Números de telefone devem estar no formato: 55(DDD)(número) - ex: 5548999999999</li>
                  <li>Podem ser incluídas colunas adicionais, mas apenas telefone e nome serão importados</li>
                </ul>
              </div>
              
              <Textarea 
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="5548999999999,Casa de Festas Alegria&#10;5511988888888,Buffet Maria Eventos&#10;5521987776666,Espaço Balada Carioca"
                className="h-64 font-mono"
              />
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-sm font-semibold text-amber-700 mb-2">Exemplos de formatos aceitos:</h4>
                <div className="text-xs text-amber-800 font-mono">
                  <p>5548999999999,Casa de Festas Alegria</p>
                  <p>5548999999999    Casa de Festas Alegria</p>
                  <p>5548999999999 | Casa de Festas Alegria | Santa Catarina</p>
                  <p>5548999999999;Casa de Festas Alegria;outro_dado</p>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  A ferramenta automaticamente detecta separadores como vírgulas, pontos e vírgulas, barras verticais e tabulações.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCsvInput("")} disabled={loading}>Limpar</Button>
              <Button 
                onClick={handleCSVUpload}
                disabled={loading || !csvInput.trim()}
                className="relative"
              >
                {loading ? (
                  <>
                    <span className="opacity-0">Importar Contatos</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </span>
                  </>
                ) : (
                  "Importar Contatos"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="message">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem</CardTitle>
              <CardDescription>
                {selectedContacts.length} contatos selecionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="template">Modelo de Mensagem</Label>
                <Select onValueChange={handleSelectTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  className="h-48"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Use {"{name}"} para o nome do contato, {"{date}"} para a data, {"{time}"} para o horário.
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mb-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
                <input
                  type="checkbox"
                  id="useBusinessTemplate"
                  checked={useBusinessTemplate}
                  onChange={(e) => setUseBusinessTemplate(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="useBusinessTemplate" className="text-sm text-amber-800 cursor-pointer">
                  Adicionar modelo de horário comercial no início da mensagem: 
                  <span className="font-bold block">
                    "Bom dia tudo bem? Será programado no primeiro horário comercial até 18h30."
                  </span>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button 
                onClick={handleSendMessage} 
                disabled={loading || selectedContacts.length === 0}
                className="relative"
              >
                {loading ? (
                  <>
                    <span className="opacity-0">Enviar Mensagem</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </span>
                  </>
                ) : (
                  "Enviar Mensagem"
                )}
              </Button>
              {selectedContacts.length > 0 && (
                <span className="text-sm text-gray-500 my-auto">
                  {selectedContacts.length} contato(s) selecionado(s)
                </span>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
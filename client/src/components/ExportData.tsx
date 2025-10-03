import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { contactsApi, Contact } from "@/lib/contact-api";
import { FileDown, Calendar } from "lucide-react";

type ExportFormat = "csv" | "excel" | "json";
type ExportType = "contacts" | "messages" | "all";

export function ExportData() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportType, setExportType] = useState<ExportType>("all");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const result = await contactsApi.getAll();
      setContacts(result);
    } catch (error) {
      toast({
        title: "Erro ao carregar contatos",
        description: error instanceof Error ? error.message : "Falha ao buscar contatos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      // Filtrar contatos por status se necessário
      let filteredContacts = [...contacts];
      
      if (statusFilter !== "all") {
        filteredContacts = filteredContacts.filter(
          contact => contact.status === statusFilter
        );
      }

      // Filtrar por data se as datas estiverem definidas
      if (startDate) {
        const fromDate = new Date(startDate);
        fromDate.setHours(0, 0, 0, 0);
        
        filteredContacts = filteredContacts.filter(contact => {
          if (!contact.updatedAt) return true;
          const contactDate = new Date(contact.updatedAt);
          return contactDate >= fromDate;
        });
      }
      
      if (endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        
        filteredContacts = filteredContacts.filter(contact => {
          if (!contact.updatedAt) return true;
          const contactDate = new Date(contact.updatedAt);
          return contactDate <= toDate;
        });
      }

      if (filteredContacts.length === 0) {
        toast({
          title: "Sem dados para exportar",
          description: "Não há contatos que correspondam aos filtros selecionados.",
          variant: "destructive"
        });
        return;
      }

      // Preparar dados para exportação baseado no tipo
      let data: any[] = [];
      let headers: string[] = [];
      
      switch (exportType) {
        case "contacts":
          headers = ["ID", "Nome", "Telefone", "Status"];
          if (includeTimestamps) {
            headers.push("Criado em", "Atualizado em");
          }
          
          data = filteredContacts.map(contact => {
            const row: any = {
              ID: contact.id,
              Nome: contact.name || "",
              Telefone: contact.phoneNumber,
              Status: contact.status
            };
            
            if (includeTimestamps) {
              row["Criado em"] = contact.createdAt ? new Date(contact.createdAt).toLocaleString() : "";
              row["Atualizado em"] = contact.updatedAt ? new Date(contact.updatedAt).toLocaleString() : "";
            }
            
            return row;
          });
          break;
          
        case "messages":
          headers = ["ID", "Nome", "Telefone", "Status", "Última Mensagem"];
          if (includeTimestamps) {
            headers.push("Último Contato");
          }
          
          data = filteredContacts.map(contact => {
            const row: any = {
              ID: contact.id,
              Nome: contact.name || "",
              Telefone: contact.phoneNumber,
              Status: contact.status,
              "Última Mensagem": contact.lastMessage || ""
            };
            
            if (includeTimestamps) {
              row["Último Contato"] = contact.lastContact ? new Date(contact.lastContact).toLocaleString() : "";
            }
            
            return row;
          });
          break;
          
        case "all":
        default:
          headers = ["ID", "Nome", "Telefone", "Status", "Última Mensagem", "Notas"];
          if (includeTimestamps) {
            headers.push("Criado em", "Atualizado em", "Último Contato");
          }
          
          data = filteredContacts.map(contact => {
            const row: any = {
              ID: contact.id,
              Nome: contact.name || "",
              Telefone: contact.phoneNumber,
              Status: contact.status,
              "Última Mensagem": contact.lastMessage || "",
              "Notas": contact.notes || ""
            };
            
            if (includeTimestamps) {
              row["Criado em"] = contact.createdAt ? new Date(contact.createdAt).toLocaleString() : "";
              row["Atualizado em"] = contact.updatedAt ? new Date(contact.updatedAt).toLocaleString() : "";
              row["Último Contato"] = contact.lastContact ? new Date(contact.lastContact).toLocaleString() : "";
            }
            
            return row;
          });
          break;
      }

      // Gerar o arquivo de exportação dependendo do formato
      switch (exportFormat) {
        case "csv":
          exportCSV(data, headers);
          break;
        case "json":
          exportJSON(data);
          break;
        case "excel":
          // Para Excel, usamos uma abordagem simplificada que o navegador abrirá como Excel
          exportCSV(data, headers, true);
          break;
      }

      toast({
        title: "Exportação concluída",
        description: `${filteredContacts.length} registros exportados com sucesso no formato ${exportFormat.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Falha ao exportar dados",
        variant: "destructive"
      });
    }
  };

  const exportCSV = (data: any[], headers: string[], forExcel = false) => {
    // Criar conteúdo CSV
    const csvRows = [];
    
    // Adicionar cabeçalho
    csvRows.push(headers.join(','));
    
    // Adicionar linhas de dados
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Unir todas as linhas com quebras de linha
    const csvContent = csvRows.join('\n');
    
    // Criar objeto Blob
    const BOM = '\uFEFF'; // BOM para suporte a caracteres especiais
    const blob = new Blob([BOM + csvContent], { 
      type: forExcel 
        ? 'application/vnd.ms-excel;charset=utf-8' 
        : 'text/csv;charset=utf-8'
    });
    
    // Criar link de download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos_${new Date().toISOString().slice(0, 10)}.${forExcel ? 'xls' : 'csv'}`);
    link.click();
  };

  const exportJSON = (data: any[]) => {
    // Criar objeto Blob para o JSON
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    // Criar link de download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos_${new Date().toISOString().slice(0, 10)}.json`);
    link.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Exportar Dados</CardTitle>
        <CardDescription>
          Exporte contatos, mensagens e status para análise e relatórios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="exportType">Tipo de Exportação</Label>
              <Select value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
                <SelectTrigger id="exportType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">Apenas Contatos</SelectItem>
                  <SelectItem value="messages">Contatos e Mensagens</SelectItem>
                  <SelectItem value="all">Dados Completos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="exportFormat">Formato</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger id="exportFormat">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel (.xls)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="statusFilter">Filtrar por Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="responded">Respondido</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Intervalo de Datas</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <Label htmlFor="startDate" className="text-xs">Data Inicial</Label>
                  <input
                    type="date"
                    id="startDate"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs">Data Final</Label>
                  <input
                    type="date"
                    id="endDate"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="includeTimestamps"
              checked={includeTimestamps}
              onCheckedChange={setIncludeTimestamps}
            />
            <Label htmlFor="includeTimestamps" className="cursor-pointer">
              Incluir informações de data e hora
            </Label>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Resumo da Exportação</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500">Total de Contatos</span>
                <span className="font-medium">{contacts.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">Filtro de Status</span>
                <span className="font-medium capitalize">{statusFilter === "all" ? "Todos" : statusFilter}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">Formato</span>
                <span className="font-medium">{exportFormat.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={fetchContacts}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar Dados"}
        </Button>
        <Button
          onClick={handleExport}
          disabled={loading || contacts.length === 0}
        >
          {loading ? "Carregando..." : "Exportar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
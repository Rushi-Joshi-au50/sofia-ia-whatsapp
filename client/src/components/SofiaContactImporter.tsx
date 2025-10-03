import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Users, ListCheck, Import, CheckCircle, XCircle, Phone } from "lucide-react";

interface Contact {
  name: string;
  phone: string;
  nicho: string;
}

export function SofiaContactImporter() {
  const [filePath, setFilePath] = useState("./attached_assets/contatos_sofia.json");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    total: number;
    imported: number;
    failed: number;
    summary: Contact[];
  } | null>(null);

  const { toast } = useToast();

  // Função para importar contatos da Sofia
  const importContacts = async () => {
    try {
      if (!filePath.trim()) {
        toast({
          title: "Caminho inválido",
          description: "Por favor, forneça o caminho do arquivo JSON com os contatos",
          variant: "destructive"
        });
        return;
      }

      setIsImporting(true);
      
      const response = await fetch("/api/import-sofia-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      });
      
      const data = await response.json();
      
      setIsImporting(false);
      
      if (data.success) {
        setImportResult({
          success: data.success,
          total: data.total,
          imported: data.imported,
          failed: data.failed,
          summary: data.summary || []
        });
        
        toast({
          title: "Importação concluída",
          description: `${data.imported} contatos importados com sucesso de ${data.total}`,
        });
      } else {
        setImportResult({
          success: false,
          total: data.total || 0,
          imported: data.imported || 0,
          failed: data.failed || 0,
          summary: data.summary || []
        });
        
        toast({
          title: "Falha na importação",
          description: data.message || "Erro ao importar contatos",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsImporting(false);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro ao importar contatos",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span>Importar Contatos da Sofia</span>
        </CardTitle>
        <CardDescription>
          Importe contatos do arquivo JSON para envio de mensagens e chamadas telefônicas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="filePath">Caminho do arquivo JSON</Label>
            <div className="flex gap-2">
              <Input
                id="filePath"
                placeholder="./attached_assets/contatos_sofia.json"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={importContacts}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Import className="h-4 w-4" />
                    <span>Importar</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Forneça o caminho para o arquivo contato_sofia_import.json
            </p>
          </div>
          
          {importResult && (
            <div className="border rounded-md p-4 bg-gray-50 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold">Resumo da Importação</h3>
                <div className="flex gap-2">
                  <Badge variant={importResult.success ? "default" : "destructive"} className="py-1">
                    {importResult.success ? "Sucesso" : "Falha"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Total de Contatos</span>
                  <span className="font-semibold">{importResult.total}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Importados</span>
                  <span className="font-semibold text-green-600">{importResult.imported}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Falhas</span>
                  <span className="font-semibold text-red-600">{importResult.failed}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Contatos Importados:</h4>
                <div className="max-h-60 overflow-y-auto border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nicho</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importResult.summary.map((contact, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{contact.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{contact.phone}</td>
                          <td className="px-3 py-2 text-sm truncate max-w-xs">{contact.nicho}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        {importResult && importResult.success && (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.location.href = '#/contacts'}
          >
            <Users className="h-4 w-4" />
            <span>Ver Contatos</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
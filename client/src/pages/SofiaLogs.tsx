import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

/**
 * Página para visualização de logs do sistema Sofia
 */
export default function SofiaLogs() {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Função para carregar logs
  const carregarLogs = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/sofia/logs');
      
      if (response.ok) {
        const data = await response.text();
        setLogs(data || 'Nenhum log disponível.');
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os logs do sistema',
          variant: 'destructive'
        });
        setLogs('Erro ao carregar logs. Tente novamente mais tarde.');
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setLogs('Erro ao carregar logs. Tente novamente mais tarde.');
      
      toast({
        title: 'Erro',
        description: 'Falha na comunicação com o servidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar logs quando a página for montada
  useEffect(() => {
    carregarLogs();
  }, []);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sistema Sofia - Logs</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={carregarLogs}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          <Link href="/sofia-leads">
            <Button variant="secondary">Voltar para Envio de Leads</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="messages">
        <TabsList className="mb-4">
          <TabsTrigger value="messages">Mensagens WhatsApp</TabsTrigger>
          <TabsTrigger value="system">Logs do Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Mensagens do WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-zinc-950 text-zinc-100 rounded-md p-4 font-mono text-sm overflow-auto max-h-[600px]">
                  {logs.split('\n').map((line, i) => (
                    <div key={i} className="py-0.5">
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 text-zinc-100 rounded-md p-4 font-mono text-sm overflow-auto max-h-[600px]">
                <p>Os logs do sistema serão exibidos aqui quando disponíveis.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Sobre o Sistema de Logs</h3>
        <p className="text-blue-700">
          O sistema de logs permite visualizar o histórico de interações do WhatsApp e operações do sistema Sofia.
          Isto é útil para depurar problemas, auditar conversas e verificar o status do envio de leads.
        </p>
      </div>
    </div>
  );
}
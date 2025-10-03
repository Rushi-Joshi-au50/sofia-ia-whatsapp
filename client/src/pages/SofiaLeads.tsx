import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Interface para a resposta da API
interface LeadsResponse {
  success: boolean;
  message: string;
  log?: string;
  error?: string;
}

/**
 * Página para envio de leads do Sistema Sofia
 */
export default function SofiaLeads() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    log?: string;
  } | null>(null);
  
  const { toast } = useToast();

  // Função para enviar leads
  const enviarLeads = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Fazendo a requisição para o endpoint
      const response = await fetch('/api/enviar-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      // Convertendo a resposta para JSON
      const data = await response.json() as LeadsResponse;
      
      setResult({
        success: data.success,
        message: data.message,
        log: data.log
      });
      
      toast({
        title: data.success ? 'Sucesso!' : 'Erro',
        description: data.message,
        variant: data.success ? 'default' : 'destructive'
      });
      
    } catch (error) {
      console.error('Erro ao enviar leads:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar leads'
      });
      
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar os leads. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Sistema Sofia</h1>
            <p className="text-muted-foreground mt-1">
              Automação de Envio de Leads e Atendimento via WhatsApp
            </p>
          </div>
          <Link href="/sofia-logs">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Visualizar Logs
            </Button>
          </Link>
        </div>
        
        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded mb-8">
          <h2 className="text-xl font-semibold mb-2">Recursos do Sistema</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
              <span>Envio automatizado de mensagens para leads em lote</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
              <span>Integração com WhatsApp via Vapi</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
              <span>Personalização de mensagens com IA</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
              <span>Agendamento automático no Google Calendar</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
              <span>Registro de conversas no Google Docs</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
              <span>Seguimento automático de leads não respondidos</span>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-center mb-8">
          <Button 
            size="lg" 
            onClick={enviarLeads} 
            disabled={loading}
            className="text-lg py-6 px-8"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              'Iniciar Envio de Leads'
            )}
          </Button>
        </div>
        
        {loading && (
          <div className="text-center my-6">
            <p className="text-muted-foreground animate-pulse">
              Processando envio de leads, por favor aguarde...
            </p>
          </div>
        )}
        
        {result && (
          <div className={`border rounded-md p-4 mt-6 ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <h3 className={`font-semibold ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </h3>
            </div>
            
            {result.log && (
              <div className="mt-4 bg-black/90 text-white p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                {result.log.split('\n').map((line, i) => (
                  <div key={i} className="py-0.5">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Desenvolvido para automatizar o atendimento a leads via WhatsApp.</p>
        <p>Integrado com Google Calendar, Google Docs e WhatsApp.</p>
      </div>
    </div>
  );
}
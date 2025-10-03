/**
 * Serviço de envio de leads para o Sistema Sofia
 * Executa o script Python de envio de leads como um processo separado
 */
import { spawn } from 'child_process';
import path from 'path';
import { addLogEntry } from './storage';

/**
 * Executa o script de envio de leads e retorna os resultados
 */
export async function enviarLeads(): Promise<{
  success: boolean;
  message: string;
  log?: string;
  error?: string;
}> {
  try {
    // Registrar início da operação
    await addLogEntry('Iniciando processo de envio de leads...', 'info');
    
    // Caminho para o script Python
    const scriptPath = path.join(process.cwd(), 'scripts', 'enviar_leads.py');
    
    return new Promise((resolve, reject) => {
      // Executar o script Python como processo separado
      const pythonProcess = spawn('python3', [scriptPath]);
      
      let stdout = '';
      let stderr = '';
      
      // Capturar saída padrão
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      // Capturar erros
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Quando o processo terminar
      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          // Sucesso
          await addLogEntry(`Envio de leads concluído com sucesso`, 'success');
          resolve({
            success: true,
            message: 'Leads enviados com sucesso',
            log: stdout
          });
        } else {
          // Erro
          const errorMessage = `Falha ao enviar leads. Código de saída: ${code}`;
          await addLogEntry(errorMessage, 'error');
          await addLogEntry(stderr, 'error');
          resolve({
            success: false,
            message: errorMessage,
            log: stdout,
            error: stderr
          });
        }
      });
      
      // Em caso de erro na execução do processo
      pythonProcess.on('error', async (error) => {
        const errorMessage = `Erro ao executar script de envio de leads: ${error.message}`;
        await addLogEntry(errorMessage, 'error');
        resolve({
          success: false,
          message: errorMessage,
          error: error.message
        });
      });
    });
    
  } catch (error) {
    // Capturar qualquer erro não tratado
    const errorMessage = `Erro inesperado no serviço de envio de leads: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    await addLogEntry(errorMessage, 'error');
    
    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
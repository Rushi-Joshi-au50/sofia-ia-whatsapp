import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import vapiService from './vapi-call';

// Configurações
const DEFAULT_SCRIPT = `Olá! Aqui é a Sofia da DED Company. Estamos oferecendo uma consultoria gratuita para casas e eventos que querem aumentar suas vendas sem depender só do Instagram — especialmente para quem sofrem com bloqueios por causa do conteúdo mais ousado. Nós já geramos resultados impressionantes: um cliente investiu R$9 mil e retornou R$1,8 milhão. Você tem dois minutos para conversarmos sobre isso agora?`;

// Função para normalizar número de telefone
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Converter para string caso seja número
  const phoneStr = String(phone);
  
  // Remover caracteres não numéricos exceto +
  let cleaned = phoneStr.replace(/[^\d+]/g, '');
  
  // Garantir formato internacional
  if (cleaned) {
    // Se começa com 55 sem +, adicionar +
    if (cleaned.startsWith('55') && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    } 
    // Se não tem indicativo internacional, adicionar +55
    else if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+55' + cleaned.slice(1);
      } else {
        cleaned = '+55' + cleaned;
      }
    }
  }
  
  return cleaned;
}

// Função para ler e processar arquivo Excel
export async function processExcelFile(filePath: string, script: string = DEFAULT_SCRIPT): Promise<{
  success: boolean;
  totalProcessed: number;
  validNumbers: string[];
  errorMessage?: string;
}> {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        totalProcessed: 0,
        validNumbers: [],
        errorMessage: `Arquivo não encontrado: ${filePath}`
      };
    }
    
    // Ler o arquivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(sheet);
    
    if (!data || data.length === 0) {
      return {
        success: false,
        totalProcessed: 0,
        validNumbers: [],
        errorMessage: 'Nenhum dado encontrado na planilha'
      };
    }
    
    console.log(`Processando ${data.length} registros da planilha`);
    
    // Extrair e normalizar números de telefone (primeira coluna)
    const validNumbers: string[] = [];
    
    for (const row of data) {
      // Obter valor da primeira coluna/propriedade
      const firstColumnKey = Object.keys(row)[0];
      const phoneRaw = row[firstColumnKey];
      
      if (phoneRaw) {
        const phone = normalizePhoneNumber(phoneRaw);
        if (phone) {
          validNumbers.push(phone);
        }
      }
    }
    
    console.log(`Encontrados ${validNumbers.length} números válidos`);
    
    return {
      success: true,
      totalProcessed: data.length,
      validNumbers
    };
    
  } catch (error) {
    console.error('Erro ao processar arquivo Excel:', error);
    return {
      success: false,
      totalProcessed: 0,
      validNumbers: [],
      errorMessage: `Erro: ${error.message}`
    };
  }
}

// Função para fazer chamadas em lote com intervalo
export async function makeBulkCalls(
  phoneNumbers: string[], 
  script: string = DEFAULT_SCRIPT,
  batchSize: number = 5,
  intervalBetweenBatches: number = 30000
): Promise<{
  totalAttempted: number;
  successCount: number;
  failedCount: number;
  results: { phone: string; success: boolean; message?: string; error?: any }[];
}> {
  const results: { phone: string; success: boolean; message?: string; error?: any }[] = [];
  let successCount = 0;
  let failedCount = 0;
  
  // Processar em lotes para evitar sobrecarga da API
  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    // Extrair lote atual
    const batch = phoneNumbers.slice(i, i + batchSize);
    console.log(`Processando lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(phoneNumbers.length/batchSize)}, com ${batch.length} números`);
    
    // Processar cada número no lote
    const batchPromises = batch.map(async (phone) => {
      try {
        const result = await vapiService.processVapiCall(phone, script);
        
        if (result.success) {
          successCount++;
          results.push({
            phone,
            success: true,
            message: `Chamada iniciada com sucesso: ${phone}`
          });
        } else {
          failedCount++;
          results.push({
            phone,
            success: false,
            message: `Falha ao iniciar chamada: ${phone}`,
            error: result.error || 'Erro desconhecido'
          });
        }
        
        return result;
      } catch (error) {
        failedCount++;
        results.push({
          phone,
          success: false,
          message: `Erro ao processar chamada: ${phone}`,
          error: error.message || error
        });
        
        return { success: false, error };
      }
    });
    
    // Aguardar conclusão do lote atual
    await Promise.all(batchPromises);
    
    // Aguardar intervalo antes de processar o próximo lote (se não for o último)
    if (i + batchSize < phoneNumbers.length) {
      console.log(`Aguardando ${intervalBetweenBatches/1000} segundos antes do próximo lote...`);
      await new Promise(resolve => setTimeout(resolve, intervalBetweenBatches));
    }
  }
  
  return {
    totalAttempted: phoneNumbers.length,
    successCount,
    failedCount,
    results
  };
}

// Exportar funções principais
export default {
  processExcelFile,
  makeBulkCalls,
  normalizePhoneNumber
};
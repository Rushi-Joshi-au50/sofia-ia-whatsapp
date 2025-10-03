import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { addLogEntry } from './storage';
import { CreateContactRequest } from './contact-store';

/**
 * Classe que fornece métodos para processamento de planilhas Excel
 */
export class ExcelService {
  
  /**
   * Converte uma planilha Excel em uma lista de contatos
   * @param filePath Caminho para o arquivo Excel
   * @returns Lista de contatos
   */
  static async processExcelFile(filePath: string): Promise<CreateContactRequest[]> {
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      
      // Ler o arquivo Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Planilha vazia ou formato inválido');
      }
      
      // Tentar identificar as colunas de número de telefone e nome
      const firstRow = jsonData[0] as Record<string, any>;
      const columns = Object.keys(firstRow);
      
      // Encontrar a coluna que pode conter o número de telefone
      const phoneColumns = columns.filter(col => 
        col.toLowerCase().includes('telefone') || 
        col.toLowerCase().includes('phone') ||
        col.toLowerCase().includes('celular') ||
        col.toLowerCase().includes('contato') ||
        col.toLowerCase().includes('whatsapp')
      );
      
      // Encontrar a coluna que pode conter o nome
      const nameColumns = columns.filter(col => 
        col.toLowerCase().includes('nome') || 
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('contato') ||
        col.toLowerCase().includes('responsável') ||
        col.toLowerCase().includes('responsavel')
      );
      
      if (phoneColumns.length === 0) {
        // Se não encontrarmos uma coluna específica, tentar algumas comuns
        addLogEntry('Não foi possível identificar a coluna de telefone automaticamente. Tentando colunas comuns...', 'warning');
        
        // Verificar se há alguma coluna que pode conter números de telefone
        for (const col of columns) {
          const firstValue = String(firstRow[col]);
          if (/^[0-9+\s\-()]{8,}$/.test(firstValue) || 
              firstValue.includes('55') || 
              firstValue.includes('+55')) {
            phoneColumns.push(col);
            break;
          }
        }
      }
      
      if (phoneColumns.length === 0) {
        throw new Error('Não foi possível identificar a coluna de telefone');
      }
      
      // Extrair contatos
      const contacts: CreateContactRequest[] = [];
      
      for (const row of jsonData as Record<string, any>[]) {
        // Tentar obter o telefone
        let phone = '';
        for (const phoneCol of phoneColumns) {
          if (row[phoneCol]) {
            phone = String(row[phoneCol]);
            break;
          }
        }
        
        // Pular se não houver telefone
        if (!phone) continue;
        
        // Limpar o número de telefone (remover caracteres especiais)
        phone = phone.replace(/[^0-9]/g, '');
        
        // Garantir que o telefone tem o formato adequado (Brasil: 55 + DDD + número)
        if (!phone.startsWith('55')) {
          // Se tiver 10 ou 11 dígitos, é provável que seja um número brasileiro sem o código do país
          if (phone.length >= 10 && phone.length <= 11) {
            phone = '55' + phone;
          }
        }
        
        // Validar o telefone final (deve ter entre 12 e 13 dígitos para números brasileiros completos)
        if (phone.length < 12 || phone.length > 13) {
          addLogEntry(`Número de telefone inválido: ${phone}. Pulando...`, 'warning');
          continue;
        }
        
        // Tentar obter o nome
        let name = '';
        for (const nameCol of nameColumns) {
          if (row[nameCol]) {
            name = String(row[nameCol]);
            break;
          }
        }
        
        // Se não encontrou nome em colunas específicas, tentar a primeira coluna não telefônica
        if (!name) {
          for (const col of columns) {
            if (!phoneColumns.includes(col) && row[col]) {
              name = String(row[col]);
              break;
            }
          }
        }
        
        // Adicionar à lista de contatos
        contacts.push({
          phoneNumber: phone,
          name: name || 'Contato'
        });
      }
      
      addLogEntry(`Processados ${contacts.length} contatos da planilha: ${path.basename(filePath)}`, 'success');
      return contacts;
      
    } catch (error) {
      addLogEntry(`Erro ao processar planilha Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      throw error;
    }
  }
  
  /**
   * Lista todos os arquivos Excel disponíveis no diretório de assets
   * @returns Lista de caminhos de arquivos
   */
  static getAvailableExcelFiles(): string[] {
    try {
      const assetDir = path.join(process.cwd(), 'attached_assets');
      
      // Verificar se o diretório existe
      if (!fs.existsSync(assetDir)) {
        return [];
      }
      
      // Listar todos os arquivos .xlsx e .xls
      const files = fs.readdirSync(assetDir)
        .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
        .map(file => path.join(assetDir, file));
      
      return files;
    } catch (error) {
      addLogEntry(`Erro ao listar arquivos Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      return [];
    }
  }
}
import fs from 'fs';
import path from 'path';
import { ContactStore } from './contact-store';
import { addLogEntry } from './storage';

interface SofiaContact {
  nome: string;
  telefone: string;
  nicho: string | number;
}

/**
 * Importa contatos do arquivo JSON para o sistema
 * @param filePath Caminho do arquivo JSON
 * @returns Um resumo da importação
 */
export async function importContactsFromJson(filePath: string): Promise<{
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  summary: Array<{ name: string; phone: string; nicho: string }>;
  errors?: string[];
}> {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Ler e fazer parse do arquivo JSON
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const contacts = JSON.parse(fileContent) as SofiaContact[];
    
    if (!Array.isArray(contacts)) {
      throw new Error('O arquivo não contém um array de contatos válido');
    }
    
    await addLogEntry(`Iniciando importação de ${contacts.length} contatos Sofia do arquivo ${path.basename(filePath)}`, 'info');
    
    // Validar e normalizar os contatos
    const validContacts = [];
    const errors = [];
    const summary = [];
    
    for (const contact of contacts) {
      try {
        if (!contact.nome || !contact.telefone) {
          errors.push(`Contato inválido (faltando nome ou telefone): ${JSON.stringify(contact)}`);
          continue;
        }
        
        // Normalizar telefone
        let phone = contact.telefone.replace(/\s/g, '');
        
        // Validar formato do telefone
        if (!/^\+?[0-9]{10,15}$/.test(phone)) {
          errors.push(`Telefone inválido para ${contact.nome}: ${contact.telefone}`);
          continue;
        }
        
        // Adicionar ao resumo (limitar a 100 para não sobrecarregar)
        if (summary.length < 100) {
          summary.push({
            name: contact.nome,
            phone: phone,
            nicho: typeof contact.nicho === 'string' ? contact.nicho : 'Sem nicho'
          });
        }
        
        // Adicionar aos contatos válidos para importação
        validContacts.push({
          phoneNumber: phone,
          name: contact.nome,
          notes: typeof contact.nicho === 'string' ? `Nicho: ${contact.nicho}` : 'Sem informação de nicho'
        });
      } catch (err) {
        errors.push(`Erro ao processar contato: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
      }
    }
    
    // Importar contatos válidos
    let importResult = { success: false, count: 0 };
    if (validContacts.length > 0) {
      importResult = await ContactStore.create(validContacts);
      await addLogEntry(`Importação concluída: ${importResult.count} contatos importados com sucesso de ${contacts.length} contatos no arquivo`, 
                   importResult.success ? 'success' : 'warning');
    } else {
      await addLogEntry('Falha na importação: nenhum contato válido encontrado no arquivo', 'error');
    }
    
    return {
      success: importResult.success,
      total: contacts.length,
      imported: importResult.count,
      failed: contacts.length - importResult.count,
      summary,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    await addLogEntry(`Erro ao importar contatos: ${errorMessage}`, 'error');
    
    return {
      success: false,
      total: 0,
      imported: 0,
      failed: 0,
      summary: [],
      errors: [errorMessage]
    };
  }
}
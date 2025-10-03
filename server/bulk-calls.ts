import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as importExcel from './import-excel';
import { addLogEntry } from './storage';

const router = express.Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Criar pasta de uploads se não existir
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${extension}`);
  }
});

// Filtro para permitir apenas Excel, CSV e TXT
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.xlsx', '.csv', '.txt'];
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use .xlsx, .csv ou .txt'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Rota para upload e processamento de arquivos para chamadas em massa
router.post('/bulk-calls', upload.single('file'), async (req, res) => {
  try {
    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    
    // Obter parâmetros da requisição
    const filePath = req.file.path;
    const batchSize = parseInt(req.body.batchSize || '5');
    const intervalSeconds = parseInt(req.body.interval || '30');
    const message = req.body.message || '';
    
    // Logar início do processamento
    await addLogEntry(`Iniciando processamento de chamadas em massa. Arquivo: ${req.file.originalname}`, 'info');
    
    // Ler arquivo e extrair números de telefone
    const result = await importExcel.processExcelFile(filePath);
    
    if (!result.success || result.validNumbers.length === 0) {
      // Limpar arquivo temporário
      try { fs.unlinkSync(filePath); } catch (e) { /* ignorar erro */ }
      
      return res.status(400).json({
        success: false,
        error: result.errorMessage || 'Nenhum número válido encontrado no arquivo'
      });
    }
    
    // Iniciar processo de chamadas em lote (em segundo plano)
    const phoneNumbers = result.validNumbers;
    
    // Responder imediatamente, mas continuar o processamento em background
    res.status(200).json({
      success: true,
      message: 'Processamento iniciado',
      totalAttempted: phoneNumbers.length,
      batchSize,
      intervalSeconds
    });
    
    // Iniciar chamadas em background
    importExcel.makeBulkCalls(
      phoneNumbers, 
      message, 
      batchSize, 
      intervalSeconds * 1000
    ).then(async (bulkResult) => {
      // Logar resultados ao finalizar
      await addLogEntry(`Processamento de chamadas em massa finalizado. Total: ${bulkResult.totalAttempted}, Sucesso: ${bulkResult.successCount}, Falhas: ${bulkResult.failedCount}`, 'info');
      
      // Limpar arquivo temporário
      try { fs.unlinkSync(filePath); } catch (e) { /* ignorar erro */ }
    }).catch(async (error) => {
      // Logar erro
      await addLogEntry(`Erro no processamento de chamadas em massa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      
      // Limpar arquivo temporário
      try { fs.unlinkSync(filePath); } catch (e) { /* ignorar erro */ }
    });
    
  } catch (error) {
    // Logar erro
    await addLogEntry(`Erro ao processar chamadas em massa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    
    // Limpar arquivo temporário se existir
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignorar erro */ }
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao processar chamadas'
    });
  }
});

export default router;
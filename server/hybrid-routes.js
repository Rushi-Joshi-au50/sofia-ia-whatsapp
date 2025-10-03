
import express from "express";
import { createUser, listUsers, getUserStats, cleanupExpiredUsers } from "./users.js";
import { authMiddleware, adminOnly, requirePermission, generateToken } from "./auth.js";
import { createOrUpdateContact, getContactStats, createActivity } from "./hubspot.js";
import { addLogEntry } from "./storage.js";

const router = express.Router();

/**
 * Rota de login unificada
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuário e senha obrigatórios"
      });
    }
    
    // Usar middleware de auth para verificar credenciais
    req.body = { username, password };
    authMiddleware(req, res, () => {
      const token = generateToken(req.user);
      
      // Log do login
      addLogEntry(`Login realizado: ${req.user.username} (${req.user.role})`, "info");
      
      res.json({
        success: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          permissions: req.user.permissions
        },
        token,
        redirectTo: req.user.role === "admin" ? "/admin" : "/dashboard"
      });
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

/**
 * Dashboard administrativo
 */
router.get("/admin/dashboard", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userStats = getUserStats();
    const hubspotStats = await getContactStats();
    
    res.json({
      success: true,
      data: {
        users: userStats,
        hubspot: hubspotStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          lastUpdate: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error("❌ Erro no dashboard admin:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Criar novo usuário (admin only)
 */
router.post("/admin/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, role = "demo", durationDays = 7, customUsername } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email obrigatório"
      });
    }
    
    const user = await createUser(email, role, durationDays, customUsername);
    
    addLogEntry(`Usuário criado por admin: ${user.username} (${role})`, "info");
    
    res.json({
      success: true,
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        expires: user.expires,
        hubspotContactId: user.hubspotContactId
      }
    });
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Listar usuários (admin only)
 */
router.get("/admin/users", authMiddleware, adminOnly, (req, res) => {
  try {
    const { role, status } = req.query;
    const filters = {};
    
    if (role) filters.role = role;
    if (status) filters.status = status;
    
    const users = listUsers(filters);
    
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        loginCount: u.loginCount,
        expires: u.expires,
        isExpired: u.isExpired,
        daysRemaining: u.daysRemaining,
        hubspotContactId: u.hubspotContactId
      }))
    });
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Dashboard do cliente
 */
router.get("/client/dashboard", authMiddleware, requirePermission("viewDashboard"), async (req, res) => {
  try {
    const user = req.user;
    
    // Dados personalizados baseados no role
    const dashboardData = {
      user: {
        username: user.username,
        role: user.role,
        expires: user.expires,
        permissions: user.permissions
      },
      stats: {
        messagesCount: user.role === "demo" ? Math.min(50, 50) : 234,
        contactsCount: user.role === "demo" ? Math.min(25, 50) : 156,
        appointmentsCount: user.role === "demo" ? 3 : 12
      },
      features: user.permissions.features || []
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("❌ Erro no dashboard cliente:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Webhook para processar mensagens WhatsApp
 */
router.post("/webhook/whatsapp", async (req, res) => {
  try {
    const data = req.body;
    
    // Extrair informações da mensagem
    let phoneNumber = null;
    let messageText = null;
    
    // Suporte a múltiplos formatos de webhook
    if (data.messages && data.messages[0]) {
      const msg = data.messages[0];
      phoneNumber = msg.from;
      messageText = msg.text?.body || msg.body;
    } else if (data.from && data.text) {
      phoneNumber = data.from;
      messageText = data.text;
    }
    
    if (!phoneNumber || !messageText) {
      return res.status(400).json({
        success: false,
        message: "Formato de mensagem inválido"
      });
    }
    
    // Log da mensagem
    addLogEntry(`Mensagem WhatsApp de ${phoneNumber}: ${messageText}`, "info");
    
    // Criar/atualizar contato no HubSpot
    const email = `${phoneNumber}@whatsapp.sofia`;
    try {
      const contact = await createOrUpdateContact(email, {
        phone: phoneNumber,
        lifecyclestage: "lead",
        lead_status: "new",
        last_message: messageText,
        last_contact_date: new Date().toISOString()
      });
      
      if (contact?.id) {
        await createActivity(contact.id, "whatsapp_message", messageText);
      }
    } catch (hubspotError) {
      console.warn("⚠️ Erro HubSpot no webhook:", hubspotError.message);
    }
    
    // Resposta automática (personalizar conforme necessário)
    const autoResponse = "Olá! Sou a Sofia, assistente virtual da DED Company. Em breve nosso time entrará em contato!";
    
    res.json({
      success: true,
      message: "Mensagem processada",
      response: autoResponse,
      contactCreated: true
    });
  } catch (error) {
    console.error("❌ Erro no webhook WhatsApp:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Limpeza de usuários expirados (admin only)
 */
router.post("/admin/cleanup", authMiddleware, adminOnly, (req, res) => {
  try {
    const removedCount = cleanupExpiredUsers();
    
    addLogEntry(`Limpeza executada: ${removedCount} usuários removidos`, "info");
    
    res.json({
      success: true,
      message: `Limpeza concluída: ${removedCount} usuários expirados removidos`,
      removedCount
    });
  } catch (error) {
    console.error("❌ Erro na limpeza:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Status do sistema
 */
router.get("/status", async (req, res) => {
  try {
    const userStats = getUserStats();
    const hubspotStats = await getContactStats();
    
    res.json({
      success: true,
      status: "operational",
      timestamp: new Date().toISOString(),
      data: {
        users: userStats,
        hubspot: hubspotStats,
        system: {
          uptime: process.uptime(),
          version: "2.0-hybrid"
        }
      }
    });
  } catch (error) {
    res.json({
      success: false,
      status: "error",
      message: error.message
    });
  }
});

export default router;


import fs from "fs";
import crypto from "crypto";
import { createOrUpdateContact, createDeal } from "./hubspot.js";

const USERS_FILE = "./data/users.json";
const LOGS_DIR = "./logs";

// Criar diretórios se não existirem
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

/**
 * Carregar usuários do arquivo
 */
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const initialData = {
      users: [],
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialData, null, 2));
    return initialData.users;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    return data.users || [];
  } catch (error) {
    console.error("❌ Erro ao carregar usuários:", error.message);
    return [];
  }
}

/**
 * Salvar usuários no arquivo
 */
function saveUsers(users) {
  try {
    const data = {
      users,
      lastUpdate: new Date().toISOString(),
      total: users.length,
      active: users.filter(u => !isUserExpired(u)).length,
      demo: users.filter(u => u.role === "demo").length,
      full: users.filter(u => u.role === "full").length
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    
    // Log da operação
    logUserOperation("SAVE", `Total: ${data.total}, Ativos: ${data.active}`);
  } catch (error) {
    console.error("❌ Erro ao salvar usuários:", error.message);
  }
}

/**
 * Gerar senha aleatória
 */
function generatePassword(length = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Gerar username único
 */
function generateUsername(baseName = "cliente") {
  const users = loadUsers();
  let counter = 1;
  let username = `${baseName}${counter}`;
  
  while (users.find(u => u.username === username)) {
    counter++;
    username = `${baseName}${counter}`;
  }
  
  return username;
}

/**
 * Verificar se usuário está expirado
 */
function isUserExpired(user) {
  if (!user.expires) return false; // usuários full não expiram
  return new Date(user.expires) < new Date();
}

/**
 * Criar novo usuário
 */
async function createUser(email, role = "demo", durationDays = 7, customUsername = null) {
  try {
    const users = loadUsers();
    
    // Verificar se email já existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      throw new Error(`Usuário com email ${email} já existe`);
    }
    
    const username = customUsername || generateUsername();
    const password = generatePassword();
    const createdAt = new Date().toISOString();
    const expires = role === "demo" ? 
      new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() : 
      null;
    
    const newUser = {
      id: crypto.randomUUID(),
      username,
      password,
      email,
      role,
      expires,
      createdAt,
      lastLogin: null,
      loginCount: 0,
      status: "active",
      hubspotContactId: null,
      permissions: getDefaultPermissions(role)
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Registrar no HubSpot
    try {
      const hubspotContact = await createOrUpdateContact(email, {
        firstname: username,
        lastname: "Sofia Client",
        phone: "N/A",
        lifecyclestage: "lead",
        lead_status: role === "demo" ? "trial" : "customer",
        sofia_role: role,
        sofia_username: username,
        sofia_created: createdAt,
        sofia_expires: expires || "never"
      });
      
      if (hubspotContact?.id) {
        newUser.hubspotContactId = hubspotContact.id;
        
        // Criar negócio se for full
        if (role === "full") {
          await createDeal(hubspotContact.id, `Sofia Full - ${username}`, 497);
        }
      }
    } catch (hubspotError) {
      console.warn("⚠️ Erro ao registrar no HubSpot:", hubspotError.message);
    }
    
    // Atualizar com ID do HubSpot
    const userIndex = users.findIndex(u => u.id === newUser.id);
    if (userIndex >= 0) {
      users[userIndex] = newUser;
      saveUsers(users);
    }
    
    logUserOperation("CREATE", `${username} (${role}) - ${email}`);
    console.log("✅ Usuário criado:", { username, email, role, expires });
    
    return newUser;
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error.message);
    throw error;
  }
}

/**
 * Verificar login
 */
function checkLogin(username, password) {
  try {
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      logUserOperation("LOGIN_FAILED", `${username} - credenciais inválidas`);
      return null;
    }
    
    // Verificar se expirado
    if (isUserExpired(user)) {
      logUserOperation("LOGIN_EXPIRED", `${username} - conta expirada`);
      return null;
    }
    
    // Atualizar último login
    user.lastLogin = new Date().toISOString();
    user.loginCount = (user.loginCount || 0) + 1;
    
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex >= 0) {
      users[userIndex] = user;
      saveUsers(users);
    }
    
    logUserOperation("LOGIN_SUCCESS", `${username} - login #${user.loginCount}`);
    return user;
  } catch (error) {
    console.error("❌ Erro ao verificar login:", error.message);
    return null;
  }
}

/**
 * Obter permissões padrão por role
 */
function getDefaultPermissions(role) {
  const basePermissions = {
    viewDashboard: true,
    viewMessages: true,
    viewContacts: false,
    exportData: false,
    viewReports: false,
    maxContacts: 0,
    maxMessages: 0,
    features: []
  };
  
  switch (role) {
    case "demo":
      return {
        ...basePermissions,
        viewContacts: true,
        maxContacts: 50,
        maxMessages: 100,
        features: ["basic_dashboard", "message_history"]
      };
    
    case "full":
      return {
        ...basePermissions,
        viewContacts: true,
        exportData: true,
        viewReports: true,
        maxContacts: 10000,
        maxMessages: 10000,
        features: ["full_dashboard", "message_history", "advanced_reports", "data_export", "integrations"]
      };
    
    default:
      return basePermissions;
  }
}

/**
 * Listar usuários (com filtros)
 */
function listUsers(filters = {}) {
  try {
    let users = loadUsers();
    
    // Aplicar filtros
    if (filters.role) {
      users = users.filter(u => u.role === filters.role);
    }
    
    if (filters.status) {
      if (filters.status === "active") {
        users = users.filter(u => !isUserExpired(u));
      } else if (filters.status === "expired") {
        users = users.filter(u => isUserExpired(u));
      }
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return users.map(u => ({
      ...u,
      isExpired: isUserExpired(u),
      daysRemaining: u.expires ? 
        Math.max(0, Math.ceil((new Date(u.expires) - new Date()) / (1000 * 60 * 60 * 24))) : 
        null
    }));
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error.message);
    return [];
  }
}

/**
 * Obter estatísticas de usuários
 */
function getUserStats() {
  try {
    const users = loadUsers();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      total: users.length,
      active: users.filter(u => !isUserExpired(u)).length,
      expired: users.filter(u => isUserExpired(u)).length,
      demo: users.filter(u => u.role === "demo").length,
      full: users.filter(u => u.role === "full").length,
      newThisMonth: users.filter(u => new Date(u.createdAt) >= thisMonth).length,
      totalLogins: users.reduce((sum, u) => sum + (u.loginCount || 0), 0)
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error.message);
    return { total: 0, active: 0, expired: 0, demo: 0, full: 0, newThisMonth: 0, totalLogins: 0 };
  }
}

/**
 * Log de operações de usuário
 */
function logUserOperation(operation, details) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${operation}: ${details}\n`;
    fs.appendFileSync(`${LOGS_DIR}/users.log`, logEntry);
  } catch (error) {
    console.error("❌ Erro ao escrever log:", error.message);
  }
}

/**
 * Limpar usuários expirados (manutenção)
 */
function cleanupExpiredUsers() {
  try {
    const users = loadUsers();
    const activeUsers = users.filter(u => !isUserExpired(u));
    const removedCount = users.length - activeUsers.length;
    
    if (removedCount > 0) {
      saveUsers(activeUsers);
      logUserOperation("CLEANUP", `Removidos ${removedCount} usuários expirados`);
      console.log(`✅ Limpeza concluída: ${removedCount} usuários expirados removidos`);
    }
    
    return removedCount;
  } catch (error) {
    console.error("❌ Erro na limpeza:", error.message);
    return 0;
  }
}

export { 
  createUser, 
  checkLogin, 
  listUsers, 
  getUserStats,
  cleanupExpiredUsers,
  isUserExpired
};

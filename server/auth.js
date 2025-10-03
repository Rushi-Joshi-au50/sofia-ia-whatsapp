
import { checkLogin } from "./users.js";

// Credenciais administrativas
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "sofia2024"
};

/**
 * Middleware de autenticação
 */
function authMiddleware(req, res, next) {
  const { username, password } = req.body || req.query;
  
  if (!username || !password) {
    return res.status(401).json({
      success: false,
      message: "Credenciais obrigatórias",
      requiresAuth: true
    });
  }
  
  // Verificar admin
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    req.user = {
      id: "admin",
      username: "admin",
      role: "admin",
      permissions: getAdminPermissions()
    };
    return next();
  }
  
  // Verificar cliente
  const user = checkLogin(username, password);
  if (user) {
    req.user = user;
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: "Credenciais inválidas ou conta expirada"
  });
}

/**
 * Middleware apenas para admin
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado - apenas administradores"
    });
  }
  next();
}

/**
 * Middleware para verificar permissões específicas
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado"
      });
    }
    
    if (req.user.role === "admin") {
      return next(); // Admin tem todas as permissões
    }
    
    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permissão negada: ${permission}`
      });
    }
    
    next();
  };
}

/**
 * Verificar se usuário pode acessar recurso
 */
function canAccess(user, resource, action = "read") {
  if (!user) return false;
  if (user.role === "admin") return true;
  
  const permissions = user.permissions || {};
  
  switch (resource) {
    case "dashboard":
      return permissions.viewDashboard;
    
    case "messages":
      return permissions.viewMessages;
    
    case "contacts":
      return permissions.viewContacts;
    
    case "reports":
      return permissions.viewReports;
    
    case "export":
      return permissions.exportData && action === "read";
    
    default:
      return false;
  }
}

/**
 * Permissões de administrador
 */
function getAdminPermissions() {
  return {
    viewDashboard: true,
    viewMessages: true,
    viewContacts: true,
    viewReports: true,
    exportData: true,
    manageUsers: true,
    systemConfig: true,
    viewLogs: true,
    maxContacts: -1, // ilimitado
    maxMessages: -1, // ilimitado
    features: ["all"]
  };
}

/**
 * Gerar token JWT simples (para sessões web)
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  };
  
  // Em produção, usar biblioteca JWT real
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verificar token JWT
 */
function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (payload.exp < Date.now()) {
      return null; // Token expirado
    }
    
    return payload;
  } catch (error) {
    return null; // Token inválido
  }
}

/**
 * Middleware para verificar token JWT
 */
function jwtMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token não fornecido"
    });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado"
    });
  }
  
  req.user = payload;
  next();
}

export {
  authMiddleware,
  adminOnly,
  requirePermission,
  canAccess,
  generateToken,
  verifyToken,
  jwtMiddleware
};

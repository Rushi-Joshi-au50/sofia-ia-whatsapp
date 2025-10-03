
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
  expires: string | null;
  isExpired: boolean;
  daysRemaining: number | null;
  hubspotContactId: string | null;
}

interface DashboardStats {
  users: {
    total: number;
    active: number;
    expired: number;
    demo: number;
    full: number;
    newThisMonth: number;
    totalLogins: number;
  };
  hubspot: {
    total: number;
    new_this_month: number;
    qualified_leads: number;
  };
  system: {
    uptime: number;
    memory: any;
    lastUpdate: string;
  };
}

export default function HybridAdmin() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    role: "demo",
    durationDays: 7,
    customUsername: ""
  });
  const { toast } = useToast();

  // Carregar dados do dashboard
  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/hybrid/admin/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  // Carregar lista de usuários
  const loadUsers = async () => {
    try {
      const response = await fetch("/api/hybrid/admin/users");
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  // Criar novo usuário
  const createUser = async () => {
    if (!newUserForm.email) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch("/api/hybrid/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Usuário ${data.user.username} criado com sucesso!`
        });
        
        // Limpar formulário
        setNewUserForm({
          email: "",
          role: "demo",
          durationDays: 7,
          customUsername: ""
        });
        
        // Recarregar dados
        loadUsers();
        loadDashboard();
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive"
      });
    }
  };

  // Limpeza de usuários expirados
  const cleanupUsers = async () => {
    try {
      const response = await fetch("/api/hybrid/admin/cleanup", {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Limpeza Concluída",
          description: data.message
        });
        
        loadUsers();
        loadDashboard();
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro na limpeza",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadDashboard(), loadUsers()]);
      setLoading(false);
    };

    loadData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sofia Admin - Sistema Híbrido</h1>
        <Badge variant="outline" className="text-sm">
          Replit ↔ HubSpot
        </Badge>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.users.total}</div>
              <div className="text-sm text-gray-600">Total de Usuários</div>
              <div className="text-xs mt-1">
                {stats.users.active} ativos • {stats.users.expired} expirados
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.users.demo}</div>
              <div className="text-sm text-gray-600">Usuários Demo</div>
              <div className="text-xs mt-1 text-purple-600">
                {stats.users.full} usuários Full
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.users.newThisMonth}</div>
              <div className="text-sm text-gray-600">Novos Este Mês</div>
              <div className="text-xs mt-1">
                {stats.users.totalLogins} logins totais
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.hubspot.total}</div>
              <div className="text-sm text-gray-600">Contatos HubSpot</div>
              <div className="text-xs mt-1">
                {stats.hubspot.qualified_leads} qualificados
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="create">Criar Usuário</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        {/* Lista de Usuários */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        <Badge variant={user.role === "demo" ? "secondary" : "default"}>
                          {user.role}
                        </Badge>
                        {user.isExpired && (
                          <Badge variant="destructive">Expirado</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.email} • Criado: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      {user.daysRemaining !== null && (
                        <div className="text-xs text-orange-600">
                          {user.daysRemaining > 0 
                            ? `${user.daysRemaining} dias restantes`
                            : "Expirado"
                          }
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        Logins: {user.loginCount}
                      </div>
                      {user.lastLogin && (
                        <div className="text-xs text-gray-500">
                          Último: {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      )}
                      {user.hubspotContactId && (
                        <Badge variant="outline" className="text-xs">
                          HubSpot
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Criar Usuário */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="cliente@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Conta</label>
                  <Select
                    value={newUserForm.role}
                    onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo (7 dias)</SelectItem>
                      <SelectItem value="full">Full (Ilimitado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newUserForm.role === "demo" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Duração (dias)</label>
                    <Input
                      type="number"
                      value={newUserForm.durationDays}
                      onChange={(e) => setNewUserForm({ ...newUserForm, durationDays: parseInt(e.target.value) })}
                      min="1"
                      max="30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username Personalizado (opcional)</label>
                <Input
                  value={newUserForm.customUsername}
                  onChange={(e) => setNewUserForm({ ...newUserForm, customUsername: e.target.value })}
                  placeholder="Será gerado automaticamente se vazio"
                />
              </div>

              <Button onClick={createUser} className="w-full">
                Criar Usuário
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manutenção */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas de Manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Limpeza de Usuários Expirados</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Remove usuários demo que expiraram há mais de 7 dias.
                </p>
                <Button variant="outline" onClick={cleanupUsers}>
                  Executar Limpeza
                </Button>
              </div>

              {stats && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Status do Sistema</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Uptime:</strong> {Math.floor(stats.system.uptime / 3600)}h
                    </div>
                    <div>
                      <strong>Memória:</strong> {Math.round(stats.system.memory.used / 1024 / 1024)}MB
                    </div>
                    <div>
                      <strong>Última Atualização:</strong> {new Date(stats.system.lastUpdate).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

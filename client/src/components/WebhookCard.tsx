import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WebhookSettings {
  active: boolean;
  port: number;
  startTime: string;
  webhookUrl?: string;
}

export function WebhookCard() {
  const [baseUrl, setBaseUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  
  // Get the base URL for the webhook
  useEffect(() => {
    const url = window.location.origin;
    setBaseUrl(url);
  }, []);
  
  // Get webhook settings from API
  const { data: webhookSettings } = useQuery<WebhookSettings>({
    queryKey: ["/api/webhook-settings"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Update local state when webhook settings change
  useEffect(() => {
    if (webhookSettings?.webhookUrl) {
      setWebhookUrl(webhookSettings.webhookUrl);
    }
  }, [webhookSettings]);
  
  // Toggle webhook active state
  const toggleWebhook = useMutation({
    mutationFn: async (active: boolean) => {
      return apiRequest("POST", "/api/webhook-settings", { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook-settings"] });
    },
  });
  
  // Change webhook port
  const changePort = useMutation({
    mutationFn: async (port: number) => {
      return apiRequest("POST", "/api/webhook-settings", { port });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook-settings"] });
    },
  });
  
  // Change webhook URL
  const changeWebhookUrl = useMutation({
    mutationFn: async (webhookUrl: string) => {
      return apiRequest("POST", "/api/webhook-settings", { webhookUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook-settings"] });
    },
  });
  
  // Handle copying webhook URL to clipboard
  const handleCopyUrl = () => {
    const webhookUrl = `${baseUrl}/api/webhook`;
    navigator.clipboard.writeText(webhookUrl);
  };
  
  // Calculate the uptime
  const getUptime = (startTime: string) => {
    if (!startTime) return "Just started";
    
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Running for ${hours}h ${minutes}m`;
    }
    
    return `Running for ${minutes}m`;
  };
  
  const [isChangePortOpen, setIsChangePortOpen] = useState(false);
  const [newPort, setNewPort] = useState("");
  
  const handleChangePort = () => {
    const port = parseInt(newPort, 10);
    if (port && port >= 1000 && port <= 65535) {
      changePort.mutate(port);
      setIsChangePortOpen(false);
      setNewPort("");
    }
  };
  
  return (
    <Card>
      <CardHeader className="bg-primary-dark text-white p-5 rounded-t-lg flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="material-icons mr-2 text-xl">webhook</span>
          Webhook Configuration
        </CardTitle>
        <div className="flex items-center">
          <Switch 
            id="webhook-toggle" 
            checked={webhookSettings?.active ?? true}
            onCheckedChange={(checked) => toggleWebhook.mutate(checked)}
            className="mr-2"
          />
          <label htmlFor="webhook-toggle" className="text-sm font-medium text-white">
            Active
          </label>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 border-t">
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-600 mb-1">Webhook URL (Your Server Endpoint)</label>
          <div className="flex items-center">
            <Input 
              type="text" 
              value={`${baseUrl}/api/webhook`} 
              className="rounded-r-none"
              readOnly
            />
            <Button 
              className="rounded-l-none bg-primary text-white"
              onClick={handleCopyUrl}
            >
              <span className="material-icons text-sm">content_copy</span>
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-600 mb-1">External Webhook URL (Send To)</label>
          <div className="flex items-center">
            <Input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="rounded-r-none"
              placeholder="https://example.com/webhook/endpoint"
            />
            <Button 
              className="rounded-l-none bg-primary text-white"
              onClick={() => changeWebhookUrl.mutate(webhookUrl)}
              disabled={changeWebhookUrl.isPending}
            >
              {changeWebhookUrl.isPending ? (
                <span className="material-icons text-sm animate-spin">refresh</span>
              ) : (
                <span className="material-icons text-sm">save</span>
              )}
            </Button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Enter the URL where you want to receive webhook notifications
          </p>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-neutral-600">Current Port</label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary text-xs h-6"
              onClick={() => setIsChangePortOpen(true)}
            >
              Change
            </Button>
          </div>
          
          {isChangePortOpen ? (
            <div className="flex space-x-2">
              <Input
                type="number"
                value={newPort}
                onChange={(e) => setNewPort(e.target.value)}
                className="text-sm"
                placeholder="Enter new port (1000-65535)"
              />
              <Button 
                size="sm" 
                onClick={handleChangePort}
                disabled={changePort.isPending}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsChangePortOpen(false);
                  setNewPort("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50">
              {webhookSettings?.port || 3000}
            </div>
          )}
        </div>
        
        <div className="flex justify-between text-xs text-neutral-500">
          <span className="flex items-center">
            <span className={`w-2 h-2 rounded-full ${webhookSettings?.active ? "bg-success" : "bg-error"} mr-1`}></span>
            {webhookSettings?.active ? "Webhook active" : "Webhook inactive"}
          </span>
          <span>
            {webhookSettings?.startTime ? getUptime(webhookSettings.startTime) : "Just started"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

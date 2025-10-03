import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocket } from "@/lib/socket-raw";
import { disconnectWhatsApp } from "@/lib/whatsapp";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import React, { useEffect } from "react";
import { getTimeAgo } from "@/lib/utils";

export function ConnectionCard() {
  const { connectionState, refreshQrCode } = useSocket();
  const { isConnected, qrCode, phoneNumber, connectedAt, qrTimer } = connectionState;

  // Mutation for disconnecting from WhatsApp
  const disconnectMutation = useMutation({
    mutationFn: disconnectWhatsApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
    },
  });

  // Handle disconnect button click
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  // Convert qrCode string to a data URL for display
  const qrDataUrl = React.useMemo(() => {
    if (!qrCode) return null;
    return `data:image/png;base64,${qrCode}`;
  }, [qrCode]);

  return (
    <Card>
      <CardHeader className="bg-primary-dark text-white p-5 rounded-t-lg flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="material-icons mr-2 text-xl">phonelink_ring</span>
          Connection Status
        </CardTitle>
        <div className={`px-3 py-1 rounded-full ${isConnected ? "bg-success" : "bg-destructive"} text-white text-sm font-medium`}>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </CardHeader>
      <CardContent className="p-5 border-t">
        {!isConnected ? (
          <div className="flex flex-col items-center py-2">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Scan this QR code with your WhatsApp to connect
            </p>
            <div className="p-2 border-2 border-neutral-300 rounded-lg mb-4 bg-white">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-52 h-52" />
              ) : (
                <div className="w-52 h-52 bg-neutral-100 flex items-center justify-center">
                  <span className="material-icons text-5xl text-neutral-400">qr_code_2</span>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-2">
              QR code will expire in <span id="qr-timer" className="font-medium">{qrTimer}</span> seconds
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary flex items-center"
              onClick={refreshQrCode}
            >
              <span className="material-icons text-sm mr-1">refresh</span>
              Refresh QR Code
            </Button>
          </div>
        ) : (
          <div className="py-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-600">Connected to WhatsApp</span>
              <span className="text-success flex items-center text-sm">
                <span className="material-icons text-sm mr-1">check_circle</span>
                Active
              </span>
            </div>
            
            <div className="bg-neutral-100 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-neutral-500">Phone Number</span>
                <span className="text-xs text-neutral-500">
                  {connectedAt ? `Connected ${getTimeAgo(connectedAt)}` : "Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{phoneNumber}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-primary"
                  onClick={() => {
                    if (phoneNumber) {
                      navigator.clipboard.writeText(phoneNumber);
                    }
                  }}
                >
                  <span className="material-icons text-sm">content_copy</span>
                </Button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-white"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <>
                  <span className="material-icons text-sm mr-1 animate-spin">refresh</span>
                  Disconnecting...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm mr-1">logout</span>
                  Disconnect
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";

// Types for TypeScript
const initialConnectionState = {
  isConnected: false,
  qrCode: null,
  phoneNumber: null,
  connectedAt: null,
  qrTimer: 60,
  logs: [],
};

const SocketContext = createContext({
  connectionState: initialConnectionState,
  refreshQrCode: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = function({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState(initialConnectionState);

  // Generate the socket URL from the window location
  const getSocketUrl = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  };

  // Function to add logs
  const addLog = (message, type) => {
    const now = new Date();
    const timeString = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    
    setConnectionState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        { time: timeString, message, type },
      ].slice(-100), // Keep only last 100 logs
    }));
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(getSocketUrl());

    ws.onopen = () => {
      addLog("WebSocket connection established", "info");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case "connection":
            setConnectionState((prev) => {
              const newState = {
                ...prev,
                isConnected: data.connected,
                phoneNumber: data.phoneNumber || null,
                connectedAt: data.connected ? new Date() : null,
              };
              
              if (data.connected) {
                addLog("Successfully connected to WhatsApp", "success");
              } else if (prev.isConnected) {
                addLog("Disconnected from WhatsApp", "error");
              }
              
              return newState;
            });
            break;
            
          case "qr":
            setConnectionState((prev) => ({
              ...prev,
              qrCode: data.qrCode,
              qrTimer: data.timeout || 60,
            }));
            addLog("QR code generated for authentication", "info");
            break;
            
          case "qr_timeout":
            addLog("QR code has expired", "warning");
            break;
            
          case "log":
            addLog(data.message, data.level || "info");
            break;
            
          default:
            console.log("Unknown message type:", data);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      addLog("WebSocket connection closed", "info");
      // Attempt to reconnect after a delay
      setTimeout(() => setSocket(null), 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      addLog("WebSocket connection error", "error");
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  // QR code timer countdown
  useEffect(() => {
    if (!connectionState.qrCode || connectionState.isConnected) return;
    
    const interval = setInterval(() => {
      setConnectionState((prev) => ({
        ...prev,
        qrTimer: Math.max(0, prev.qrTimer - 1),
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [connectionState.qrCode, connectionState.isConnected]);

  // Function to refresh QR code
  const refreshQrCode = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "refresh_qr" }));
      addLog("Requesting QR code refresh", "info");
    }
  };

  return React.createElement(
    SocketContext.Provider,
    { 
      value: {
        connectionState,
        refreshQrCode
      }
    },
    children
  );
};

// Export connection state interface for TypeScript
export const ConnectionState = {};
export const LogEntry = {};

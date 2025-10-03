import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/lib/socket-raw";
import { useRef, useState, useEffect } from "react";

export function LogViewer() {
  const { connectionState } = useSocket();
  const { logs } = connectionState;
  const logRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Auto-scroll to bottom of logs if enabled
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  // Color mapping for different log types
  const getColorClass = (type: string) => {
    switch (type) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      case "warning": return "text-yellow-300";
      default: return "text-blue-300";
    }
  };
  
  // Clear logs functionality
  const clearLogs = () => {
    // We can't directly modify the state in the socket context
    // Instead, we'll send a clear logs message via WebSocket
    if (window.confirm("Are you sure you want to clear all logs?")) {
      const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "clear_logs" }));
        ws.close();
      };
    }
  };
  
  // Download logs as a text file
  const downloadLogs = () => {
    const logContent = logs.map(log => `${log.time} ${log.message}`).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-primary-dark text-white p-5 rounded-t-lg flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="material-icons mr-2 text-xl">receipt_long</span>
          Connection Logs
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={clearLogs}
            title="Clear logs"
          >
            <span className="material-icons text-sm">delete</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white"
            onClick={downloadLogs}
            title="Download logs"
          >
            <span className="material-icons text-sm">file_download</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 border-t flex-grow flex flex-col">
        <div
          ref={logRef}
          className="terminal rounded-lg p-3 text-xs overflow-y-auto flex-grow h-96"
        >
          {logs.length === 0 ? (
            <div className="text-neutral-400 text-center py-4">No logs available</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start mb-2">
                <span className="text-neutral-400 w-16 inline-block">{log.time}</span>
                <span className={getColorClass(log.type)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-neutral-500">{logs.length} log entries</span>
          <div className="flex space-x-2">
            <Button
              variant={autoScroll ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 py-1 text-xs"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              Auto-scroll
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 py-1 text-xs"
              onClick={() => {
                if (logRef.current) {
                  logRef.current.scrollTop = logRef.current.scrollHeight;
                }
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

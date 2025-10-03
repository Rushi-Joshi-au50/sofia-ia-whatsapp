// WebSocket message types
export type SocketMessageType = 
  | "connection" 
  | "qr" 
  | "qr_timeout"
  | "log"
  | "refresh_qr"
  | "clear_logs";

// Connection status message
export interface ConnectionStatusMessage {
  type: "connection";
  connected: boolean;
  phoneNumber: string | null;
}

// QR code message
export interface QRCodeMessage {
  type: "qr";
  qrCode: string;
  timeout: number;
}

// QR timeout message
export interface QRTimeoutMessage {
  type: "qr_timeout";
}

// Log message
export interface LogMessage {
  type: "log";
  message: string;
  level: "info" | "success" | "error" | "warning";
}

// Union type for all WebSocket messages
export type SocketMessage = 
  | ConnectionStatusMessage
  | QRCodeMessage
  | QRTimeoutMessage
  | LogMessage;

// Message request/response types
export interface SendMessageRequest {
  to: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
}

// WebSocket client message types
export interface RefreshQRMessage {
  type: "refresh_qr";
}

export interface ClearLogsMessage {
  type: "clear_logs";
}

// Union type for all client messages
export type ClientMessage =
  | RefreshQRMessage
  | ClearLogsMessage;

import { apiRequest } from "./queryClient";

// Interface for the message request
export interface SendMessageRequest {
  to: string;
  message: string;
}

// Interface for the message response
export interface SendMessageResponse {
  success: boolean;
  message: string;
}

// Send a message via the WhatsApp API
export async function sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
  const response = await apiRequest("POST", "/api/send", data);
  return response.json();
}

// Refresh QR code
export async function refreshQRCode(): Promise<Response> {
  return apiRequest("POST", "/api/refresh-qr", {});
}

// Disconnect from WhatsApp
export async function disconnectWhatsApp(): Promise<Response> {
  return apiRequest("POST", "/api/disconnect", {});
}

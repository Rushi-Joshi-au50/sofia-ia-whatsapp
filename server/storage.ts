import { db } from "@db";
import { logs } from "@shared/schema";
import { eq } from "drizzle-orm";

// Log entry levels
export type LogLevel = "info" | "success" | "warning" | "error";

// Interface for webhook settings
export interface WebhookSettings {
  active: boolean;
  port: number;
  startTime: string;
  webhookUrl?: string;
}

// Default webhook settings (desativado por padrão para evitar erros constantes)
let webhookSettings: WebhookSettings = {
  active: false, // Desativado para usar a integração nativa com OpenAI
  port: 3000,
  startTime: new Date().toISOString(),
  webhookUrl: "",  // URL vazia para evitar tentativas de conexão
};

// Add log entry to database
export async function addLogEntry(message: string, level: LogLevel) {
  try {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return true;
  } catch (error) {
    console.error("Error logging:", error);
    return false;
  }
}

// Get the latest log entries
export async function getLatestLogs(limit = 100) {
  try {
    const results = await db.query.logs.findMany({
      orderBy: (logs, { desc }) => [desc(logs.timestamp)],
      limit,
    });
    return results.reverse(); // Show oldest logs first
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
}

// Clear all logs
export async function clearLogs() {
  try {
    await db.delete(logs);
    return true;
  } catch (error) {
    console.error("Error clearing logs:", error);
    return false;
  }
}

// Get webhook settings
export function getWebhookSettings(): WebhookSettings {
  return webhookSettings;
}

// Update webhook settings
export function updateWebhookSettings(settings: Partial<WebhookSettings>): WebhookSettings {
  webhookSettings = {
    ...webhookSettings,
    ...settings,
  };
  return webhookSettings;
}

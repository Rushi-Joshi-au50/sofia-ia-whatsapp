import { apiRequest } from "./queryClient";

// Interface para contatos
export interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  status: "pending" | "contacted" | "responded" | "scheduled" | "completed";
  lastMessage?: string | null;
  lastContact?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContactRequest {
  phoneNumber: string;
  name?: string;
}

export interface SendMessageRequest {
  contactIds: string[];
  message: string;
  useBusinessTemplate?: boolean; // Opção para usar o template de horário comercial
}

// Interface para arquivo Excel
export interface ExcelFile {
  path: string;
  name: string;
}

// API para contatos
export const contactsApi = {
  getAll: async (): Promise<Contact[]> => {
    const res = await apiRequest("GET", "/api/contacts");
    return await res.json();
  },
  
  getById: async (id: string): Promise<Contact> => {
    const res = await apiRequest("GET", `/api/contacts/${id}`);
    return await res.json();
  },
  
  create: async (contacts: CreateContactRequest[]): Promise<{success: boolean, count: number}> => {
    const res = await apiRequest("POST", "/api/contacts", contacts);
    return await res.json();
  },
  
  updateStatus: async (id: string, status: string): Promise<{success: boolean}> => {
    const res = await apiRequest("PATCH", `/api/contacts/${id}/status`, { status });
    return await res.json();
  },
  
  sendMessages: async (request: SendMessageRequest): Promise<{success: boolean, count: number}> => {
    const res = await apiRequest("POST", "/api/contacts/send-message", request);
    return await res.json();
  },
  
  getExcelFiles: async (): Promise<ExcelFile[]> => {
    const res = await apiRequest("GET", "/api/excel/files");
    return await res.json();
  },
  
  importFromExcel: async (filePath: string): Promise<{success: boolean, count: number}> => {
    const res = await apiRequest("POST", "/api/excel/import", { filePath });
    return await res.json();
  }
};
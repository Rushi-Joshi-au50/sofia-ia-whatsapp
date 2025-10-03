import { ConnectionCard } from "@/components/ConnectionCard";
import { WebhookCard } from "@/components/WebhookCard";
import { MessageSender } from "@/components/MessageSender";
import { APIUsage } from "@/components/APIUsage";
import { LogViewer } from "@/components/LogViewer";
import { StatusNotifications } from "@/components/StatusNotifications";
import { ContactManager } from "@/components/ContactManager";
import { MessageSimulator } from "@/components/MessageSimulator";
import { ExportData } from "@/components/ExportData";
import { VapiCaller } from "@/components/VapiCaller";
import { SofiaContactImporter } from "@/components/SofiaContactImporter";
import { useSocket } from "@/lib/socket";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const { connectionState } = useSocket();
  const { isConnected } = connectionState;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'tools'>('dashboard');
  
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-primary-dark text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="material-icons text-2xl">message</span>
            <h1 className="text-xl font-medium">WhatsApp API Integration</h1>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-4 mr-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-1 px-3 rounded ${activeTab === 'dashboard' ? 'bg-white text-primary-dark' : 'text-white hover:bg-primary/20'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-1 px-3 rounded ${activeTab === 'contacts' ? 'bg-white text-primary-dark' : 'text-white hover:bg-primary/20'}`}
              >
                Contatos
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-1 px-3 rounded ${activeTab === 'tools' ? 'bg-white text-primary-dark' : 'text-white hover:bg-primary/20'}`}
              >
                Ferramentas
              </button>
            </nav>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? "bg-success" : "bg-error"}`}></span>
              <span className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-6">
                <ConnectionCard />
                <WebhookCard />
              </div>
              
              {/* Middle Column */}
              <div className="lg:col-span-1 space-y-6">
                <MessageSender />
                <APIUsage />
              </div>
              
              {/* Right Column */}
              <div className="lg:col-span-1 space-y-6 flex flex-col">
                <LogViewer />
              </div>
            </div>
            
            {/* Status Notifications */}
            <StatusNotifications />
          </>
        ) : activeTab === 'contacts' ? (
          <ContactManager />
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4">Ferramentas e Utilidades</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simulador de Envio */}
              <div>
                <MessageSimulator />
              </div>
              
              {/* Exportação de Dados */}
              <div>
                <ExportData />
              </div>
              
              {/* Chamadas por Voz com Vapi */}
              <div className="lg:col-span-2 mt-6">
                <VapiCaller />
              </div>
              
              {/* Importador de Contatos da Sofia */}
              <div className="lg:col-span-2 mt-6">
                <SofiaContactImporter />
              </div>
              
              {/* Sistema Sofia - Envio de Leads */}
              <div className="lg:col-span-2 mt-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-primary-dark flex items-center">
                    <span className="material-icons mr-2 text-primary">send</span>
                    Sistema Sofia - Envio de Leads
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Acesse o sistema de envio de leads da Sofia para automatizar o envio de mensagens para potenciais clientes via WhatsApp.
                    O sistema utiliza a API da Vapi para integração com o WhatsApp e permite o envio em lote para múltiplos contatos.
                  </p>
                  <Link href="/sofia-leads" className="block">
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center w-full md:w-auto">
                      <span className="material-icons mr-2">rocket_launch</span>
                      Acessar Sistema de Envio de Leads
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

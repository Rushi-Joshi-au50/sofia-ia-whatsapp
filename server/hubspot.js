
import fetch from "node-fetch";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const HUBSPOT_API = "https://api.hubapi.com";

if (!HUBSPOT_TOKEN) {
  console.warn("⚠️ HUBSPOT_TOKEN não configurado. Funcionalidades HubSpot desabilitadas.");
}

/**
 * Criar ou atualizar contato no HubSpot
 */
async function createOrUpdateContact(email, properties = {}) {
  if (!HUBSPOT_TOKEN) {
    console.log("HubSpot não configurado - simulando criação de contato:", email);
    return { id: "mock_" + Date.now(), properties: { email, ...properties } };
  }

  try {
    // Primeiro tenta buscar contato existente
    const existing = await getContactByEmail(email);
    
    if (existing) {
      // Atualizar contato existente
      return await updateContact(existing.id, properties);
    } else {
      // Criar novo contato
      const url = `${HUBSPOT_API}/crm/v3/objects/contacts`;
      const headers = {
        "Authorization": `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json"
      };
      const body = { 
        properties: { 
          email, 
          ...properties,
          source: "Sofia WhatsApp Bot",
          created_date: new Date().toISOString()
        } 
      };
      
      const res = await fetch(url, { 
        method: "POST", 
        headers, 
        body: JSON.stringify(body) 
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`HubSpot API Error: ${res.status} - ${error}`);
      }
      
      const contact = await res.json();
      console.log("✅ Contato criado no HubSpot:", email);
      return contact;
    }
  } catch (error) {
    console.error("❌ Erro ao criar contato HubSpot:", error.message);
    throw error;
  }
}

/**
 * Buscar contato por email
 */
async function getContactByEmail(email) {
  if (!HUBSPOT_TOKEN) return null;

  try {
    const url = `${HUBSPOT_API}/crm/v3/objects/contacts/search`;
    const headers = { 
      "Authorization": `Bearer ${HUBSPOT_TOKEN}`, 
      "Content-Type": "application/json" 
    };
    const body = {
      filterGroups: [{ 
        filters: [{ 
          propertyName: "email", 
          operator: "EQ", 
          value: email 
        }] 
      }],
      properties: ["email", "firstname", "lastname", "phone", "lifecyclestage", "lead_status"]
    };
    
    const res = await fetch(url, { 
      method: "POST", 
      headers, 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      throw new Error(`HubSpot Search Error: ${res.status}`);
    }
    
    const data = await res.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error("❌ Erro ao buscar contato HubSpot:", error.message);
    return null;
  }
}

/**
 * Atualizar contato existente
 */
async function updateContact(contactId, properties) {
  if (!HUBSPOT_TOKEN) return null;

  try {
    const url = `${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`;
    const headers = {
      "Authorization": `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json"
    };
    const body = { 
      properties: {
        ...properties,
        last_update: new Date().toISOString()
      }
    };
    
    const res = await fetch(url, { 
      method: "PATCH", 
      headers, 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      throw new Error(`HubSpot Update Error: ${res.status}`);
    }
    
    const contact = await res.json();
    console.log("✅ Contato atualizado no HubSpot:", contactId);
    return contact;
  } catch (error) {
    console.error("❌ Erro ao atualizar contato HubSpot:", error.message);
    throw error;
  }
}

/**
 * Registrar atividade/evento no timeline do contato
 */
async function createActivity(contactId, activityType, details) {
  if (!HUBSPOT_TOKEN) return null;

  try {
    const url = `${HUBSPOT_API}/crm/v3/objects/communications`;
    const headers = {
      "Authorization": `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json"
    };
    const body = {
      properties: {
        hs_communication_channel_type: "WHATSAPP",
        hs_communication_logged_from: "CRM",
        hs_communication_body: details,
        hs_timestamp: new Date().toISOString()
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 81 }]
        }
      ]
    };
    
    const res = await fetch(url, { 
      method: "POST", 
      headers, 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.warn("⚠️ Erro ao criar atividade HubSpot:", error);
      return null;
    }
    
    const activity = await res.json();
    console.log("✅ Atividade registrada no HubSpot");
    return activity;
  } catch (error) {
    console.error("❌ Erro ao registrar atividade:", error.message);
    return null;
  }
}

/**
 * Criar negócio (deal) para agendamento
 */
async function createDeal(contactId, dealName, amount = 0) {
  if (!HUBSPOT_TOKEN) return null;

  try {
    const url = `${HUBSPOT_API}/crm/v3/objects/deals`;
    const headers = {
      "Authorization": `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json"
    };
    const body = {
      properties: {
        dealname: dealName,
        amount: amount,
        dealstage: "appointmentscheduled",
        pipeline: "default",
        source: "Sofia WhatsApp Bot"
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }]
        }
      ]
    };
    
    const res = await fetch(url, { 
      method: "POST", 
      headers, 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      throw new Error(`HubSpot Deal Error: ${res.status}`);
    }
    
    const deal = await res.json();
    console.log("✅ Negócio criado no HubSpot:", dealName);
    return deal;
  } catch (error) {
    console.error("❌ Erro ao criar negócio HubSpot:", error.message);
    return null;
  }
}

/**
 * Obter estatísticas de contatos
 */
async function getContactStats() {
  if (!HUBSPOT_TOKEN) {
    return {
      total: 0,
      new_this_month: 0,
      qualified_leads: 0
    };
  }

  try {
    // Buscar contatos criados este mês
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const url = `${HUBSPOT_API}/crm/v3/objects/contacts/search`;
    const headers = { 
      "Authorization": `Bearer ${HUBSPOT_TOKEN}`, 
      "Content-Type": "application/json" 
    };
    const body = {
      filterGroups: [{ 
        filters: [{ 
          propertyName: "createdate", 
          operator: "GTE", 
          value: thisMonth.getTime()
        }] 
      }],
      limit: 100
    };
    
    const res = await fetch(url, { 
      method: "POST", 
      headers, 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      throw new Error(`HubSpot Stats Error: ${res.status}`);
    }
    
    const data = await res.json();
    
    return {
      total: data.total || 0,
      new_this_month: data.results?.length || 0,
      qualified_leads: data.results?.filter(c => 
        c.properties.lifecyclestage === "qualifiedtolead" || 
        c.properties.lead_status === "qualified"
      ).length || 0
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas HubSpot:", error.message);
    return { total: 0, new_this_month: 0, qualified_leads: 0 };
  }
}

export { 
  createOrUpdateContact, 
  getContactByEmail, 
  updateContact,
  createActivity,
  createDeal,
  getContactStats
};

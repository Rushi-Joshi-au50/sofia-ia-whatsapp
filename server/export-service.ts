
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Parser } from 'json2csv';
import { addLogEntry } from './storage';

export async function exportActivityReport() {
  try {
    const result = await db.execute(sql`
      SELECT 
        m.id,
        m.from as phone_number,
        m.content as message,
        m.timestamp,
        m.type,
        c.status as contact_status,
        c.name as contact_name
      FROM messages m
      LEFT JOIN contacts c ON c.phone_number = m.from
      ORDER BY m.timestamp DESC
    `);

    const fields = ['id', 'phone_number', 'contact_name', 'message', 'timestamp', 'type', 'contact_status'];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    return csv;
  } catch (error) {
    addLogEntry(`Erro ao exportar relatório: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    throw error;
  }
}

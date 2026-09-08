import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const dbDir = path.join(process.cwd(), 'data');
const localDbPath = path.join(dbDir, 'jiyu.db');

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  return createClient({ url: `file:${localDbPath}` });
}

const client = getClient();

let schemaReady: Promise<void> | null = null;

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        request TEXT DEFAULT '',
        consent1 INTEGER NOT NULL DEFAULT 0,
        consent2 INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        request TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT '신규상담',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customer_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        note TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS chatbot_leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_type TEXT NOT NULL,
        stage TEXT NOT NULL,
        size_range TEXT NOT NULL,
        timing TEXT NOT NULL,
        extra_request TEXT DEFAULT '',
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '신규상담',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return schemaReady;
}

export async function createLead(lead: {
  name: string;
  address: string;
  phone: string;
  request: string;
  consent1: boolean;
  consent2: boolean;
  created_at: string;
}) {
  await ensureSchema();
  const result = await client.execute({
    sql: `
      INSERT INTO leads (name, address, phone, request, consent1, consent2, created_at)
      VALUES (:name, :address, :phone, :request, :consent1, :consent2, :created_at)
    `,
    args: {
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      request: lead.request,
      consent1: lead.consent1 ? 1 : 0,
      consent2: lead.consent2 ? 1 : 0,
      created_at: lead.created_at,
    },
  });
  return Number(result.lastInsertRowid);
}

export async function upsertCustomerFromLead(lead: {
  id: number;
  name: string;
  address: string;
  phone: string;
  request: string;
  created_at: string;
}) {
  await ensureSchema();
  const existing = await client.execute({
    sql: 'SELECT * FROM customers WHERE lead_id = :lead_id',
    args: { lead_id: lead.id },
  });

  const now = new Date().toISOString();

  if (existing.rows.length > 0) {
    await client.execute({
      sql: `
        UPDATE customers
        SET name = :name, address = :address, phone = :phone, request = :request, updated_at = :updated_at
        WHERE lead_id = :lead_id
      `,
      args: {
        name: lead.name,
        address: lead.address,
        phone: lead.phone,
        request: lead.request,
        updated_at: now,
        lead_id: lead.id,
      },
    });
  } else {
    await client.execute({
      sql: `
        INSERT INTO customers (lead_id, name, address, phone, request, status, created_at, updated_at)
        VALUES (:lead_id, :name, :address, :phone, :request, '신규상담', :created_at, :updated_at)
      `,
      args: {
        lead_id: lead.id,
        name: lead.name,
        address: lead.address,
        phone: lead.phone,
        request: lead.request,
        created_at: lead.created_at,
        updated_at: now,
      },
    });
  }

  const result = await client.execute({
    sql: 'SELECT * FROM customers WHERE lead_id = :lead_id',
    args: { lead_id: lead.id },
  });
  return result.rows[0] as any;
}

export async function getCustomers() {
  await ensureSchema();
  const result = await client.execute('SELECT * FROM customers ORDER BY id DESC');
  return result.rows as any[];
}

export async function getCustomerById(id: number) {
  await ensureSchema();
  const result = await client.execute({
    sql: 'SELECT * FROM customers WHERE id = :id',
    args: { id },
  });
  return result.rows[0] as any;
}

export async function createCustomerNote(customerId: number, note: string) {
  await ensureSchema();
  await client.execute({
    sql: `
      INSERT INTO customer_notes (customer_id, note, created_at)
      VALUES (:customerId, :note, :created_at)
    `,
    args: { customerId, note, created_at: new Date().toISOString() },
  });
}

export async function updateCustomerStatus(customerId: number, status: string) {
  await ensureSchema();
  await client.execute({
    sql: 'UPDATE customers SET status = :status, updated_at = :updated_at WHERE id = :customerId',
    args: { status, updated_at: new Date().toISOString(), customerId },
  });
}

export async function createChatbotLead(lead: {
  hospitalType: string;
  stage: string;
  sizeRange: string;
  timing: string;
  extraRequest: string;
  name: string;
  phone: string;
}) {
  await ensureSchema();
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: `
      INSERT INTO chatbot_leads (hospital_type, stage, size_range, timing, extra_request, name, phone, status, created_at, updated_at)
      VALUES (:hospital_type, :stage, :size_range, :timing, :extra_request, :name, :phone, '신규상담', :created_at, :updated_at)
    `,
    args: {
      hospital_type: lead.hospitalType,
      stage: lead.stage,
      size_range: lead.sizeRange,
      timing: lead.timing,
      extra_request: lead.extraRequest,
      name: lead.name,
      phone: lead.phone,
      created_at: now,
      updated_at: now,
    },
  });
  return Number(result.lastInsertRowid);
}

export async function getChatbotLeads() {
  await ensureSchema();
  const result = await client.execute('SELECT * FROM chatbot_leads ORDER BY id DESC');
  return result.rows as any[];
}

export async function updateChatbotLeadStatus(id: number, status: string) {
  await ensureSchema();
  await client.execute({
    sql: 'UPDATE chatbot_leads SET status = :status, updated_at = :updated_at WHERE id = :id',
    args: { status, updated_at: new Date().toISOString(), id },
  });
}

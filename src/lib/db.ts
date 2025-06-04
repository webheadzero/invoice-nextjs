import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface InvoiceDB extends DBSchema {
  clients: {
    key: number;
    value: {
      id?: number;
      name: string;
      company: string;
      email: string;
      phone: string;
      address: string;
    };
    indexes: { 'by-name': string };
  };
  invoices: {
    key: number;
    value: {
      id?: number;
      number: string;
      date: string;
      dueDate: string;
      clientId: number;
      items: {
        description: string;
        quantity: number;
        rate: number;
        amount: number;
      }[];
      subtotal: number;
      tax: number;
      total: number;
      status: 'draft' | 'sent' | 'paid' | 'overdue';
      notes?: string;
    };
    indexes: { 'by-number': string; 'by-client': number; 'by-date': string };
  };
  settings: {
    key: string;
    value: {
      companyName: string;
      email: string;
      bankAccounts: {
        bankName: string;
        accountNumber: string;
        accountName: string;
      }[];
    };
  };
}

class DatabaseService {
  private db: IDBPDatabase<InvoiceDB> | null = null;
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async init() {
    if (!this.db) {
      this.db = await openDB<InvoiceDB>('invoice-app', 1, {
        upgrade(db) {
          // Create clients store
          if (!db.objectStoreNames.contains('clients')) {
            const clientStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
            clientStore.createIndex('by-name', 'name');
          }

          // Create invoices store
          if (!db.objectStoreNames.contains('invoices')) {
            const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
            invoiceStore.createIndex('by-number', 'number');
            invoiceStore.createIndex('by-client', 'clientId');
            invoiceStore.createIndex('by-date', 'date');
          }

          // Create settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });
    }
    return this.db;
  }

  // Client operations
  async getClients() {
    const db = await this.init();
    return db.getAll('clients');
  }

  async getClient(id: number) {
    const db = await this.init();
    return db.get('clients', id);
  }

  async addClient(client: Omit<InvoiceDB['clients']['value'], 'id'>) {
    const db = await this.init();
    return db.add('clients', client);
  }

  async updateClient(client: InvoiceDB['clients']['value']) {
    const db = await this.init();
    if (client.id) {
      return db.put('clients', client);
    }
    throw new Error('Client ID is required for update');
  }

  async deleteClient(id: number) {
    const db = await this.init();
    return db.delete('clients', id);
  }

  // Invoice operations
  async getInvoices() {
    const db = await this.init();
    return db.getAll('invoices');
  }

  async getInvoice(id: number) {
    const db = await this.init();
    return db.get('invoices', id);
  }

  async addInvoice(invoice: Omit<InvoiceDB['invoices']['value'], 'id'>) {
    const db = await this.init();
    return db.add('invoices', invoice);
  }

  async updateInvoice(invoice: InvoiceDB['invoices']['value']) {
    const db = await this.init();
    if (invoice.id) {
      return db.put('invoices', invoice);
    }
    throw new Error('Invoice ID is required for update');
  }

  async deleteInvoice(id: number) {
    const db = await this.init();
    return db.delete('invoices', id);
  }

  // Settings operations
  async getSettings() {
    const db = await this.init();
    return db.get('settings', 'company');
  }

  async updateSettings(settings: InvoiceDB['settings']['value']) {
    const db = await this.init();
    return db.put('settings', settings, 'company');
  }

  // Backup and Restore
  async backup() {
    const db = await this.init();
    const backup = {
      clients: await this.getClients(),
      invoices: await this.getInvoices(),
      settings: await this.getSettings(),
    };
    return JSON.stringify(backup);
  }

  async restore(backupData: string) {
    const db = await this.init();
    const backup = JSON.parse(backupData);

    // Clear existing data
    await db.clear('clients');
    await db.clear('invoices');
    await db.clear('settings');

    // Restore data
    if (backup.clients) {
      for (const client of backup.clients) {
        await db.add('clients', client);
      }
    }

    if (backup.invoices) {
      for (const invoice of backup.invoices) {
        await db.add('invoices', invoice);
      }
    }

    if (backup.settings) {
      await db.put('settings', backup.settings, 'company');
    }
  }
}

export const db = DatabaseService.getInstance(); 
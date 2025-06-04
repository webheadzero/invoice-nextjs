import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface SettingsRecord {
  key: string;
  companyName: string;
  email: string;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
  bankAccounts: BankAccount[];
  currency: string;
}

interface Invoice {
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
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

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
    value: Invoice;
    indexes: { 'by-number': string; 'by-client': number; 'by-date': string };
  };
  settings: {
    key: string;
    value: SettingsRecord;
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
      console.log('Initializing database...');
      this.db = await openDB<InvoiceDB>('invoice-app', 1, {
        upgrade(db) {
          console.log('Upgrading database...');
          // Create clients store
          if (!db.objectStoreNames.contains('clients')) {
            console.log('Creating clients store...');
            const clientStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
            clientStore.createIndex('by-name', 'name');
          }

          // Create invoices store
          if (!db.objectStoreNames.contains('invoices')) {
            console.log('Creating invoices store...');
            const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
            invoiceStore.createIndex('by-number', 'number');
            invoiceStore.createIndex('by-client', 'clientId');
            invoiceStore.createIndex('by-date', 'date');
          }

          // Create settings store
          if (!db.objectStoreNames.contains('settings')) {
            console.log('Creating settings store...');
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            // Initialize default settings
            const defaultSettings: SettingsRecord = {
              key: 'company',
              companyName: 'My Company',
              email: 'contact@mycompany.com',
              companyAddress: '123 Business St, City',
              companyPhone: '+1234567890',
              companyWebsite: 'www.mycompany.com',
              bankAccounts: [{
                bankName: 'Bank Name',
                accountNumber: '1234567890',
                accountHolder: 'My Company'
              }],
              currency: 'Rp'
            };
            settingsStore.add(defaultSettings);
          }
        },
      });

      // Initialize with sample data if empty
      await this.initializeSampleData();
    }
    return this.db;
  }

  private async initializeSampleData() {
    if (!this.db) return;

    console.log('Checking for existing data...');
    // Check if we already have data
    const [clients, invoices] = await Promise.all([
      this.db.getAll('clients'),
      this.db.getAll('invoices')
    ]);

    console.log('Existing clients:', clients.length);
    console.log('Existing invoices:', invoices.length);

    if (clients.length === 0) {
      console.log('Adding sample clients...');
      // Add sample clients
      await Promise.all([
        this.db.add('clients', {
          name: 'John Doe',
          company: 'ABC Corp',
          email: 'john@abccorp.com',
          phone: '+1234567890',
          address: '123 Main St, City'
        }),
        this.db.add('clients', {
          name: 'Jane Smith',
          company: 'XYZ Ltd',
          email: 'jane@xyzltd.com',
          phone: '+0987654321',
          address: '456 Business Ave, Town'
        })
      ]);
    }

    if (invoices.length === 0) {
      console.log('Adding sample invoice...');
      // Add sample invoice
      await this.db.add('invoices', {
        number: 'INV-202401-001',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clientId: 1,
        items: [{
          description: 'Web Development',
          quantity: 1,
          rate: 1000000,
          amount: 1000000
        }],
        total: 1000000,
        status: 'draft'
      });
    }
  }

  // Client operations
  async getClients() {
    console.log('Getting clients...');
    const db = await this.init();
    const clients = await db.getAll('clients');
    console.log('Retrieved clients:', clients);
    return clients;
  }

  async getClient(id: number) {
    const db = await this.init();
    return db.get('clients', id);
  }

  async addClient(client: Omit<InvoiceDB['clients']['value'], 'id'>) {
    console.log('Adding client:', client);
    const db = await this.init();
    const id = await db.add('clients', client);
    console.log('Added client with ID:', id);
    return id;
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
    console.log('Getting invoices...');
    const db = await this.init();
    const invoices = await db.getAll('invoices');
    console.log('Retrieved invoices:', invoices);
    return invoices;
  }

  async getInvoice(id: number) {
    const db = await this.init();
    return db.get('invoices', id);
  }

  async addInvoice(invoice: Omit<InvoiceDB['invoices']['value'], 'id'>) {
    console.log('Adding invoice:', invoice);
    const db = await this.init();
    try {
      // Calculate total
      const total = invoice.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.rate;
        return sum + itemTotal;
      }, 0);
      
      // Add invoice with calculated total
      const newInvoice = {
        ...invoice,
        total
      };
      
      const id = await db.add('invoices', newInvoice);
      console.log('Added invoice with ID:', id);
      return id;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  }

  async updateInvoice(invoice: Invoice) {
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
  async getSettings(): Promise<SettingsRecord> {
    const db = await this.init();
    const settings = await db.get('settings', 'company');
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings;
  }

  async updateSettings(settings: Omit<SettingsRecord, 'key'>): Promise<SettingsRecord> {
    const db = await this.init();
    const updatedSettings: SettingsRecord = {
      key: 'company',
      ...settings
    };
    await db.put('settings', updatedSettings);
    return updatedSettings;
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
      const updatedSettings: SettingsRecord = {
        key: 'company',
        ...backup.settings
      };
      await db.put('settings', updatedSettings);
    }
  }
}

export const db = DatabaseService.getInstance(); 
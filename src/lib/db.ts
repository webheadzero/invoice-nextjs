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
  subtotal: number;
  discount: number;
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
    console.log('Initializing sample data...');
    const db = await this.init();

    // Check if we already have data
    const clients = await this.getClients();
    const invoices = await this.getInvoices();
    const settings = await this.getSettings();

    if (clients.length === 0) {
      console.log('Adding sample clients...');
      const sampleClients = [
        {
          name: 'John Doe',
          company: 'Acme Corp',
          email: 'john@acmecorp.com',
          phone: '+1234567890',
          address: '123 Business St, City'
        },
        {
          name: 'Jane Smith',
          company: 'Tech Solutions',
          email: 'jane@techsolutions.com',
          phone: '+0987654321',
          address: '456 Tech Ave, Town'
        }
      ];

      for (const client of sampleClients) {
        await db.add('clients', client);
      }
    }

    if (invoices.length === 0) {
      console.log('Adding sample invoices...');
      const sampleInvoices = [
        {
          number: 'INV-202403-001',
          date: '2024-03-01',
          dueDate: '2024-03-15',
          clientId: 1,
          items: [
            {
              description: 'Web Development',
              quantity: 1,
              rate: 1000000,
              amount: 1000000
            }
          ],
          subtotal: 1000000,
          discount: 0,
          total: 1000000,
          status: 'paid' as const
        },
        {
          number: 'INV-202403-002',
          date: '2024-03-05',
          dueDate: '2024-03-20',
          clientId: 2,
          items: [
            {
              description: 'Mobile App Development',
              quantity: 1,
              rate: 2000000,
              amount: 2000000
            }
          ],
          subtotal: 2000000,
          discount: 0,
          total: 2000000,
          status: 'sent' as const
        }
      ];

      for (const invoice of sampleInvoices) {
        await db.add('invoices', invoice);
      }
    }

    if (!settings) {
      console.log('Adding sample settings...');
      const defaultSettings: SettingsRecord = {
        key: 'company',
        companyName: 'My Company',
        email: 'contact@mycompany.com',
        companyAddress: '123 Business St, City',
        companyPhone: '+1234567890',
        companyWebsite: 'www.mycompany.com',
        bankAccounts: [
          {
            bankName: 'Bank Central Asia',
            accountNumber: '1234567890',
            accountHolder: 'My Company'
          },
          {
            bankName: 'Bank Mandiri',
            accountNumber: '0987654321',
            accountHolder: 'My Company'
          }
        ],
        currency: 'Rp'
      };
      await db.add('settings', defaultSettings);
    }

    console.log('Sample data initialization completed');
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

  async addInvoice(invoice: Invoice) {
    const db = await this.init();
    
    // Calculate subtotal and total
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal - (invoice.discount || 0);

    const newInvoice = {
      ...invoice,
      subtotal,
      total,
    };

    const id = await db.add('invoices', newInvoice);
    return { ...newInvoice, id };
  }

  async updateInvoice(id: number, invoice: Invoice) {
    const db = await this.init();
    const existingInvoice = await db.get('invoices', id);
    
    if (!existingInvoice) {
      throw new Error('Invoice not found');
    }

    // Calculate subtotal and total
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal - (invoice.discount || 0);

    const updatedInvoice = {
      ...invoice,
      id,
      subtotal,
      total,
    };

    await db.put('invoices', updatedInvoice);
    return updatedInvoice;
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
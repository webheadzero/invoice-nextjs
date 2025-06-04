import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface InvoiceDB extends DBSchema {
  clients: {
    key: number;
    value: {
      id?: number;
      name: string;
      company: string;
    };
  };
  invoices: {
    key: number;
    value: {
      id?: number;
      invoiceNumber: string;
      date: string;
      clientId: number;
      items: {
        description: string;
        quantity: number;
        price: number;
      }[];
    };
  };
  settings: {
    key: number;
    value: {
      id?: number;
      companyName: string;
      email: string;
      bankAccounts: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
      }[];
    };
  };
}

interface Client {
  id?: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id?: number;
  invoiceNumber: string;
  date: string;
  clientId: number;
  items: InvoiceItem[];
}

interface Settings {
  companyName: string;
  email: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }[];
}

class DatabaseService {
  private dbName = 'invoiceDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('invoices')) {
          db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  // Client methods
  async addClient(client: Omit<Client, 'id'>): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readwrite');
      const store = tx.objectStore('clients');
      const request = store.add(client);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getClients(): Promise<Client[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readonly');
      const store = tx.objectStore('clients');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateClient(client: Client): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readwrite');
      const store = tx.objectStore('clients');
      const request = store.put(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteClient(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readwrite');
      const store = tx.objectStore('clients');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getClient(id: number): Promise<Client | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readonly');
      const store = tx.objectStore('clients');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Invoice methods
  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('invoices', 'readwrite');
      const store = tx.objectStore('invoices');
      const request = store.add(invoice);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getInvoices(): Promise<Invoice[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('invoices', 'readonly');
      const store = tx.objectStore('invoices');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getInvoice(id: number): Promise<Invoice | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('invoices', 'readonly');
      const store = tx.objectStore('invoices');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateInvoice(invoice: Invoice): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('invoices', 'readwrite');
      const store = tx.objectStore('invoices');
      const request = store.put(invoice);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInvoice(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('invoices', 'readwrite');
      const store = tx.objectStore('invoices');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings methods
  async getSettings(): Promise<Settings | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSettings(settings: Settings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ ...settings, id: 1 });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Backup and Restore
  async backup() {
    if (!this.db) await this.init();
    const backup = {
      clients: await this.getClients(),
      invoices: await this.getInvoices(),
      settings: await this.getSettings(),
    };
    return JSON.stringify(backup);
  }

  async restore(backupData: string) {
    if (!this.db) await this.init();
    const data = JSON.parse(backupData);
    
    // Clear existing data
    await this.db!.clear('clients');
    await this.db!.clear('invoices');
    await this.db!.clear('settings');

    // Restore data
    for (const client of data.clients) {
      await this.addClient(client);
    }
    for (const invoice of data.invoices) {
      await this.addInvoice(invoice);
    }
    if (data.settings) {
      await this.updateSettings(data.settings);
    }
  }
}

export const db = new DatabaseService(); 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

interface Client {
  id?: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
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
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

interface Settings {
  currency: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState<Invoice>({
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    clientId: 0,
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    discount: 0,
    total: 0,
    status: 'draft' as const,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading clients and settings...');
        const [clientsData, settingsData] = await Promise.all([
          db.getClients(),
          db.getSettings()
        ]);
        console.log('Loaded clients:', clientsData);
        console.log('Loaded settings:', settingsData);
        setClients(clientsData);
        setSettings(settingsData);

        // Set default client if available
        if (clientsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            clientId: clientsData[0].id || 0
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const generateInvoiceNumber = async () => {
      try {
        console.log('Generating invoice number...');
        const invoices = await db.getInvoices();
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        
        // Filter invoices for current month and year
        const currentMonthInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          return invoiceDate.getFullYear() === year && 
                 invoiceDate.getMonth() + 1 === currentDate.getMonth() + 1;
        });

        // Generate new invoice number
        const sequence = currentMonthInvoices.length + 1;
        const newInvoiceNumber = `INV-${year}${month}-${String(sequence).padStart(3, '0')}`;
        console.log('Generated invoice number:', newInvoiceNumber);
        
        setFormData(prev => ({
          ...prev,
          number: newInvoiceNumber,
        }));
      } catch (error) {
        console.error('Error generating invoice number:', error);
      }
    };

    generateInvoiceNumber();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting invoice:', formData);
      
      // Calculate subtotal and total
      const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
      const total = subtotal - formData.discount;
      
      const newInvoice = {
        number: formData.number,
        date: formData.date,
        dueDate: formData.dueDate,
        clientId: parseInt(formData.clientId.toString()),
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        subtotal,
        discount: formData.discount,
        total,
        status: 'draft' as const
      };
      
      console.log('Adding invoice:', newInvoice);
      await db.addInvoice(newInvoice);
      console.log('Invoice added successfully');
      
      router.push('/invoices');
    } catch (error) {
      console.error('Error submitting invoice:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // Recalculate totals when discount changes
      if (name === 'discount') {
        const subtotal = newData.items.reduce((sum, item) => sum + item.amount, 0);
        newData.subtotal = subtotal;
        newData.total = subtotal - Number(value);
      }
      
      return newData;
    });
  };

  const handleItemChange = (index: number, field: 'description' | 'quantity' | 'rate', value: string | number) => {
    const newItems = [...formData.items];
    const quantity = field === 'quantity' ? Number(value) : Number(newItems[index].quantity);
    const rate = field === 'rate' ? Number(value) : Number(newItems[index].rate);
    
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      amount: quantity * rate
    };

    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal - formData.discount;
    
    setFormData(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      total
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
      const total = subtotal - prev.discount;
      
      return {
        ...prev,
        items: newItems,
        subtotal,
        total
      };
    });
  };

  const formatCurrency = (amount: number) => {
    if (!settings) return amount.toString();
    
    const currencyMap: { [key: string]: string } = {
      'Rp': 'IDR',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'SGD': 'SGD'
    };
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currencyMap[settings.currency] || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            New Invoice
          </h2>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="number"
                    id="number"
                    required
                    value={formData.number}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    required
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client
                </label>
                <div className="mt-1">
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    value={formData.clientId}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items
              </label>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-col space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Description"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex space-x-4 items-center">
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Quantity"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Rate"
                          required
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                >
                  Add Item
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(formData.subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="discount" className="text-sm text-gray-500 dark:text-gray-400">
                    Discount:
                  </label>
                  <input
                    type="number"
                    name="discount"
                    id="discount"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-32 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(formData.discount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(formData.total)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { TrashIcon } from '@heroicons/react/24/outline';

interface Client {
  id?: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface InvoiceItem {
  id?: number;
  invoiceId: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id?: number;
  number: string;
  date: string;
  dueDate: string;
  clientId: number;
  items: InvoiceItem[];
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  subtotal: number;
  discount: number;
}

interface Settings {
  currency: string;
}

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState<Invoice>({
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    clientId: 0,
    items: [{ description: '', quantity: 1, rate: 0, amount: 0, invoiceId: 0 }],
    total: 0,
    status: 'draft' as const,
    subtotal: 0,
    discount: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading invoice, clients and settings...');
        const [invoice, clientsData, settingsData] = await Promise.all([
          db.getInvoice(parseInt(params.id)),
          db.getClients(),
          db.getSettings()
        ]);
        console.log('Loaded invoice:', invoice);
        console.log('Loaded clients:', clientsData);
        console.log('Loaded settings:', settingsData);
        
        if (invoice) {
          setFormData(invoice);
        }
        setClients(clientsData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invoiceData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          amount: item.quantity * item.rate
        }))
      };

      if (params.id) {
        await db.updateInvoice(parseInt(params.id), invoiceData);
      } else {
        await db.addInvoice(invoiceData);
      }
      router.push('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
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
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0, invoiceId: 0 }],
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

  const handleDiscountChange = (value: number) => {
    const total = formData.subtotal - value;
    setFormData(prev => ({
      ...prev,
      discount: value,
      total
    }));
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
            Edit Invoice
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

            <div className="space-y-6">
              {/* Invoice Items */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Item
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          placeholder="Qty"
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Price
                        </label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                          placeholder="Rate"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total
                        </label>
                        <input
                          type="number"
                          value={item.amount}
                          readOnly
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                      </div>
                      <div className="col-span-1 self-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Subtotal
                    </label>
                    <input
                      type="number"
                      value={formData.subtotal}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Discount
                    </label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => handleDiscountChange(parseFloat(e.target.value))}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total
                    </label>
                    <input
                      type="number"
                      value={formData.total}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Add any additional notes here..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Cancel
              </button>
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
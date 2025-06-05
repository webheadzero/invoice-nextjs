'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import Select from 'react-select';

interface Client {
  id?: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface Settings {
  companyName: string;
  email: string;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
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
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
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

  useEffect(() => {
    // Check for duplicate data
    const duplicateData = sessionStorage.getItem('duplicateInvoiceData');
    if (duplicateData) {
      const data = JSON.parse(duplicateData);
      
      // Set form data with duplicate data
      setFormData(prev => ({
        ...prev,
        clientId: data.clientId,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        notes: data.notes,
        date: data.date,
        dueDate: data.dueDate
      }));
      
      // Clear the duplicate data
      sessionStorage.removeItem('duplicateInvoiceData');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invoice = await db.addInvoice(formData);
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      amount: field === 'quantity' || field === 'rate'
        ? Number(newItems[index].quantity) * Number(newItems[index].rate)
        : newItems[index].amount
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
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal - formData.discount;

    setFormData(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      total
    }));
  };

  const handleDiscountChange = (value: string) => {
    const discount = Number(value) || 0;
    setFormData(prev => ({
      ...prev,
      discount,
      total: prev.subtotal - discount
    }));
  };

  // Format clients for react-select
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: `${client.name} - ${client.company}`,
    client: client
  }));

  // Custom styles for react-select
  const customStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'white',
      borderColor: '#e5e7eb',
      '&:hover': {
        borderColor: '#d1d5db'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'white',
      zIndex: 9999
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
      color: '#1f2937',
      '&:hover': {
        backgroundColor: '#f3f4f6'
      }
    })
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client
                </label>
                <Select
                  id="client"
                  options={clientOptions}
                  value={clientOptions.find(option => option.value === formData.clientId)}
                  onChange={(option: any) => {
                    setFormData(prev => ({
                      ...prev,
                      clientId: option.value
                    }));
                  }}
                  styles={customStyles}
                  placeholder="Search client..."
                  isSearchable
                  className="mt-1"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Number
                </label>
                <input
                  type="text"
                  id="number"
                  value={formData.number}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                >
                  Add Item
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      min="1"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                      placeholder="Rate"
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.amount}
                      readOnly
                      className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex space-x-4 pt-4">
                <div className="w-48">
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discount
                  </label>
                  <input
                    type="number"
                    id="discount"
                    value={formData.discount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  />
                </div>
                <div className="w-48">
                  <label htmlFor="total" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total
                  </label>
                  <input
                    type="number"
                    id="total"
                    value={formData.total}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { usePDF } from 'react-to-pdf';
import '@/app/print.css';

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

interface Client {
  id?: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface Settings {
  companyName?: string;
  email?: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  currency: string;
  companyPhone?: string;
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toPDF, targetRef } = usePDF({ 
    filename: invoice ? `invoice-${invoice.number}.pdf` : `invoice-${params.id}.pdf` 
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Validate invoice ID
        const invoiceId = parseInt(params.id);
        if (isNaN(invoiceId)) {
          throw new Error('Invalid invoice ID');
        }
        
        // Initialize database first
        await db.init();
        
        console.log('Loading invoice with ID:', invoiceId);
        // Load invoice data
        const invoiceData = await db.getInvoice(invoiceId);
        console.log('Loaded invoice data:', invoiceData);
        if (!invoiceData) {
          throw new Error('Invoice not found');
        }
        setInvoice(invoiceData);

        // Load client data
        console.log('Loading client with ID:', invoiceData.clientId);
        const clientData = await db.getClient(invoiceData.clientId);
        console.log('Loaded client data:', clientData);
        if (!clientData) {
          throw new Error('Client not found');
        }
        setClient(clientData);

        // Load settings
        console.log('Loading settings...');
        const settingsData = await db.getSettings();
        console.log('Loaded settings data:', settingsData);
        if (!settingsData) {
          throw new Error('Settings not found');
        }
        setSettings(settingsData);
      } catch (err) {
        console.error('Error loading invoice data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice data');
        // Don't redirect immediately, let the error UI handle it
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  useEffect(() => {
    if (searchParams.get('print') === 'true') {
      window.print();
    } else if (searchParams.get('download') === 'true') {
      toPDF();
    }
  }, [searchParams, toPDF]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!invoice) return;

    try {
      const updatedInvoice = { ...invoice, status: newStatus };
      await db.updateInvoice(invoice.id!, updatedInvoice);
      setInvoice(updatedInvoice);
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await db.deleteInvoice(invoice.id!);
        router.push('/invoices');
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium">{error}</p>
          <button
            onClick={() => router.push('/invoices')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice || !client || !settings) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6 print:hidden">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Invoice #{invoice.number}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/invoices/${params.id}?print=true`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            type="button"
            onClick={() => router.push(`/invoices/${params.id}?download=true`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
          >
            Delete
          </button>
        </div>
      </div>

      <div ref={targetRef} className="bg-white dark:bg-gray-800 shadow sm:rounded-lg print-content">
        <div className="px-4 py-5 sm:p-6">
          {/* Company Header */}
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{settings.companyName}</h1>
            <div className="mt-2 space-y-1">
              {settings.companyPhone && <p className="text-sm text-gray-500 dark:text-gray-400">{settings.companyPhone}</p>}
              {settings.email && <p className="text-sm text-gray-500 dark:text-gray-400">{settings.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Client Information</h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>{client.name}</p>
                <p>{client.company}</p>
                <p>{client.email}</p>
                <p>{client.phone}</p>
                <p>{client.address}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Details</h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
                <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Items</h3>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {invoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                              {formatCurrency(item.rate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            Subtotal:
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            {formatCurrency(invoice.subtotal)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            Discount:
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            {formatCurrency(invoice.discount)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            Total:
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            {formatCurrency(invoice.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notes</h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {invoice.notes}
              </div>
            </div>
          )}

          {/* Bank Information */}
          {settings.bankAccounts && settings.bankAccounts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Please transfer to:</h3>
              <div className="mt-4 space-y-4">
                {settings.bankAccounts.map((account, index) => (
                  <div key={index} className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="font-medium text-gray-900 dark:text-white">{account.bankName}</p>
                    <p>Account Number: {account.accountNumber}</p>
                    <p>Account Holder: {account.accountHolder}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => router.push('/invoices')}
              className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
            >
              Back
            </button>
            <button
              onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
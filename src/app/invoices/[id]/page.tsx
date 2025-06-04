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
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
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
  companyName: string;
  email: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }[];
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toPDF, targetRef } = usePDF({ filename: `invoice-${params.id}.pdf` });
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load invoice data
        const invoiceData = await db.getInvoice(parseInt(params.id));
        if (!invoiceData) {
          throw new Error('Invoice not found');
        }
        setInvoice(invoiceData);

        // Load client data
        const clientData = await db.getClient(invoiceData.clientId);
        if (clientData) {
          setClient(clientData);
        }

        // Load settings
        const settingsData = await db.getSettings();
        if (settingsData) {
          setSettings(settingsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice data');
        console.error('Error loading invoice data:', err);
        router.push('/invoices');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id, router]);

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

  const calculateTotal = () => {
    if (!invoice) return 0;
    return invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!invoice) return;

    try {
      const updatedInvoice = { ...invoice, status: newStatus };
      await db.updateInvoice(updatedInvoice);
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
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Invoice #{invoice.number}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/invoices/${params.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
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

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
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
                <p>Status: {invoice.status}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                        ${item.rate.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                        ${item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                      Subtotal
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                      ${invoice.subtotal.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                      Tax (11%)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                      ${invoice.tax.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                      Total
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                      ${invoice.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notes</h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {invoice.notes}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status</h3>
            <div className="mt-4 flex space-x-3">
              {(['draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    invoice.status === status
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
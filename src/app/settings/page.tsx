'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountHolder: string;
}

interface Settings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  bankAccounts: BankAccount[];
  taxId: string;
  currency: string;
  logo?: string;
}

interface DbSettings {
  companyName: string;
  email: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    bankAccounts: [],
    taxId: '',
    currency: 'IDR',
  });

  const [newBankAccount, setNewBankAccount] = useState<BankAccount>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    accountHolder: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const data = await db.getSettings() as DbSettings;
      if (data) {
        // Transform data to match Settings interface
        const transformedData: Settings = {
          companyName: data.companyName,
          companyAddress: '',
          companyPhone: '',
          companyEmail: data.email,
          companyWebsite: '',
          bankAccounts: data.bankAccounts.map(account => ({
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            accountHolder: account.accountName
          })),
          taxId: '',
          currency: 'IDR'
        };
        setSettings(transformedData);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Transform data back to match database schema
    const dataToSave: DbSettings = {
      companyName: settings.companyName,
      email: settings.companyEmail,
      bankAccounts: settings.bankAccounts.map(account => ({
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountHolder
      }))
    };
    await db.updateSettings(dataToSave);
  };

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBankAccount(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addBankAccount = () => {
    if (newBankAccount.bankName && newBankAccount.accountNumber && newBankAccount.accountName && newBankAccount.accountHolder) {
      setSettings(prev => ({
        ...prev,
        bankAccounts: [...prev.bankAccounts, newBankAccount],
      }));
      setNewBankAccount({
        bankName: '',
        accountNumber: '',
        accountName: '',
        accountHolder: '',
      });
    }
  };

  const removeBankAccount = (index: number) => {
    setSettings(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((_, i) => i !== index),
    }));
  };

  const handleBackup = async () => {
    const backupData = await db.backup();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = event.target?.result as string;
          await db.restore(backupData);
          alert('Data restored successfully!');
          window.location.reload();
        } catch (error) {
          alert('Error restoring data. Please make sure the backup file is valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Settings
          </h2>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  required
                  value={settings.companyName}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="companyAddress"
                  id="companyAddress"
                  required
                  value={settings.companyAddress}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Phone
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  name="companyPhone"
                  id="companyPhone"
                  required
                  value={settings.companyPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="companyEmail"
                  id="companyEmail"
                  required
                  value={settings.companyEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Website
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  name="companyWebsite"
                  id="companyWebsite"
                  value={settings.companyWebsite}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyWebsite: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tax ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="taxId"
                  id="taxId"
                  value={settings.taxId}
                  onChange={(e) => setSettings(prev => ({ ...prev, taxId: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency
              </label>
              <div className="mt-1">
                <select
                  name="currency"
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bank Accounts
              </label>
              <div className="mt-2 space-y-4">
                {settings.bankAccounts.map((account, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{account.bankName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{account.accountNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{account.accountHolder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBankAccount(index)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Bank Account</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    id="bankName"
                    value={newBankAccount.bankName}
                    onChange={handleBankAccountChange}
                    className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    id="accountNumber"
                    value={newBankAccount.accountNumber}
                    onChange={handleBankAccountChange}
                    className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    id="accountName"
                    value={newBankAccount.accountName}
                    onChange={handleBankAccountChange}
                    className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    id="accountHolder"
                    value={newBankAccount.accountHolder}
                    onChange={handleBankAccountChange}
                    className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addBankAccount}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                >
                  Add Bank Account
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
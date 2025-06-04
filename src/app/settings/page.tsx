'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Settings {
  id?: number;
  companyName: string;
  email: string;
  bankAccounts: BankAccount[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    email: '',
    bankAccounts: [],
  });

  useEffect(() => {
    const loadSettings = async () => {
      const data = await db.getSettings();
      if (data) {
        setSettings(data);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.updateSettings(settings);
    alert('Settings saved successfully!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBankAccountChange = (index: number, field: keyof BankAccount, value: string) => {
    setSettings(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((account, i) => 
        i === index ? { ...account, [field]: value } : account
      ),
    }));
  };

  const addBankAccount = () => {
    setSettings(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, { bankName: '', accountNumber: '', accountHolder: '' }],
    }));
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
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bank Accounts
              </label>
              <div className="mt-2 space-y-4">
                {settings.bankAccounts.map((account, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Bank Name"
                        value={account.bankName}
                        onChange={(e) => {
                          const newAccounts = [...settings.bankAccounts];
                          newAccounts[index] = { ...account, bankName: e.target.value };
                          setSettings({ ...settings, bankAccounts: newAccounts });
                        }}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={account.accountNumber}
                        onChange={(e) => {
                          const newAccounts = [...settings.bankAccounts];
                          newAccounts[index] = { ...account, accountNumber: e.target.value };
                          setSettings({ ...settings, bankAccounts: newAccounts });
                        }}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Account Name"
                        value={account.accountName}
                        onChange={(e) => {
                          const newAccounts = [...settings.bankAccounts];
                          newAccounts[index] = { ...account, accountName: e.target.value };
                          setSettings({ ...settings, bankAccounts: newAccounts });
                        }}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newAccounts = settings.bankAccounts.filter((_, i) => i !== index);
                        setSettings({ ...settings, bankAccounts: newAccounts });
                      }}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      bankAccounts: [...settings.bankAccounts, { bankName: '', accountNumber: '', accountName: '' }]
                    });
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
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
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Settings {
  companyName: string;
  email: string;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
  bankAccounts: BankAccount[];
  currency: string;
}

interface DbSettings {
  companyName?: string;
  email?: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
  }[];
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    email: '',
    companyAddress: '',
    companyPhone: '',
    companyWebsite: '',
    bankAccounts: [],
    currency: 'Rp'
  });

  const [newBankAccount, setNewBankAccount] = useState<BankAccount>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await db.getSettings();
        console.log('Loaded settings from DB:', data);
        if (data) {
          setSettings({
            companyName: data.companyName || '',
            email: data.email || '',
            companyAddress: data.companyAddress || '',
            companyPhone: data.companyPhone || '',
            companyWebsite: data.companyWebsite || '',
            bankAccounts: data.bankAccounts || [],
            currency: data.currency || 'Rp'
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Saving settings:', settings);
      await db.updateSettings(settings);
      alert('Settings saved successfully!');
      
      // Reload settings after save
      const updatedData = await db.getSettings();
      console.log('Reloaded settings after save:', updatedData);
      if (updatedData) {
        setSettings({
          companyName: updatedData.companyName || '',
          email: updatedData.email || '',
          companyAddress: updatedData.companyAddress || '',
          companyPhone: updatedData.companyPhone || '',
          companyWebsite: updatedData.companyWebsite || '',
          bankAccounts: updatedData.bankAccounts || [],
          currency: updatedData.currency || 'Rp'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBankAccount(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addBankAccount = () => {
    if (newBankAccount.bankName && newBankAccount.accountNumber && newBankAccount.accountHolder) {
      setSettings(prev => ({
        ...prev,
        bankAccounts: [...prev.bankAccounts, newBankAccount],
      }));
      setNewBankAccount({
        bankName: '',
        accountNumber: '',
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
                  onChange={handleChange}
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
                  value={settings.companyAddress}
                  onChange={handleChange}
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
                  value={settings.companyPhone}
                  onChange={handleChange}
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
                  name="email"
                  id="companyEmail"
                  required
                  value={settings.email}
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  id="currency"
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="Rp">Indonesian Rupiah (Rp)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                  <option value="SGD">Singapore Dollar (S$)</option>
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
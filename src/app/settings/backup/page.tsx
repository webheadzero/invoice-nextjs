'use client';

import { useState } from 'react';
import { db } from '@/lib/db';

export default function BackupPage() {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    try {
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
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup. Please try again.');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsRestoring(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const backupData = event.target?.result as string;
            await db.restore(backupData);
            alert('Data restored successfully!');
            window.location.reload();
          } catch (error) {
            console.error('Error restoring data:', error);
            alert('Error restoring data. Please make sure the backup file is valid.');
          } finally {
            setIsRestoring(false);
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Error reading backup file:', error);
        alert('Error reading backup file. Please try again.');
        setIsRestoring(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Backup & Restore
          </h2>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Download Backup</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Create a backup of all your data including clients, invoices, and settings.
              </p>
              <button
                type="button"
                onClick={handleBackup}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Download Backup
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Restore Backup</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Restore your data from a previously created backup file. This will replace all current data.
              </p>
              <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 cursor-pointer">
                {isRestoring ? 'Restoring...' : 'Restore Backup'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  disabled={isRestoring}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
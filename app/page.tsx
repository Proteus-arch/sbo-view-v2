'use client';

import React, { useState, useEffect } from 'react';
import SBOView from './components/SBOView';
import CPAView from './components/CPAView';
import FranchiseView from './components/FranchiseView';
import SampleDataDashboard from './components/SampleDataDashboard';
import { LayoutDashboard, Users, Store, Activity, Database } from 'lucide-react';

// ---------- QuickBooks Connect Component ----------
function QuickBooksConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setIsConnected(data.connected);
        setCompanyName(data.companyName || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/connect';
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
        Checking connection...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-red-500 flex items-center gap-2 text-sm">
        ⚠️ {error}
        <button
          onClick={() => window.location.reload()}
          className="underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md flex items-center gap-2 shadow-sm border border-emerald-200 dark:border-emerald-800 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Connected{companyName ? ` to ${companyName}` : ''}</span>
      </div>
    );
  }

  return (
    <a
      href="/api/connect"
      onClick={(e) => {
        e.preventDefault();
        handleConnect();
      }}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2 shadow-sm text-sm"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      Connect to QuickBooks
    </a>
  );
}
// -------------------------------------------------

export default function Home() {
  const [activeView, setActiveView] = useState<'SBO' | 'CPA' | 'Franchise' | 'Comparisons'>('CPA');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Activity className="text-emerald-500" size={32} />
          <h1 className="text-3xl font-bold tracking-tight">Cashew</h1>
          {/* Demo Data Badge */}
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            Demo Data
          </span>
          <QuickBooksConnect />
        </div>

        <nav className="flex bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
          <button 
            onClick={() => setActiveView('SBO')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeView === 'SBO' ? 'bg-emerald-500 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <LayoutDashboard size={18} />
            Decision Makers
          </button>
          <button 
            onClick={() => setActiveView('CPA')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeView === 'CPA' ? 'bg-emerald-500 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Users size={18} />
            Finance and Accounting
          </button>
          <button 
            onClick={() => setActiveView('Franchise')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeView === 'Franchise' ? 'bg-emerald-500 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Store size={18} />
            Franchise
          </button>
          <button 
            onClick={() => setActiveView('Comparisons')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeView === 'Comparisons' ? 'bg-emerald-500 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Database size={18} />
            Comparisons Over Time
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="transition-opacity duration-300">
          {activeView === 'SBO' && <SBOView />}
          {activeView === 'CPA' && <CPAView />}
          {activeView === 'Franchise' && <FranchiseView />}
          {activeView === 'Comparisons' && <SampleDataDashboard />}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 text-sm">
        <p>Cashew Platform © {new Date().getFullYear()} - Clarity and Control for your Finances</p>
      </footer>
    </div>
  );
}
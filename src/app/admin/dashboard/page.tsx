'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Poppins } from 'next/font/google';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Stats from './components/Stats';
import License from './components/License';
import Settings from './components/Settings';
import Plans from './components/Plans';

// Font configuration
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <Users />;
      case 'stats':
        return <Stats />;
      case 'license':
        return <License />;
      case 'settings':
        return <Settings />;
      case 'plans':
        return <Plans />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-black text-white flex ${poppins.className}`}>
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <div className="flex-1 p-10">
        <header className="flex items-center justify-between mb-10">
          <button className="lg:hidden text-white" onClick={toggleSidebar}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="hidden lg:block">
            <Link href="/admin/login">
              <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                Logout
              </button>
            </Link>
          </div>
        </header>

        <main>{renderContent()}</main>
      </div>
    </div>
  );
}
import Link from 'next/link';
import { Home, Users, BarChart, Settings, Key, X, CreditCard } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ isSidebarOpen, toggleSidebar, activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:w-64 p-6 flex flex-col justify-between z-50`}
    >
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <button className="lg:hidden text-white" onClick={toggleSidebar}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'dashboard' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'users' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'stats' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
            }`}
          >
            <BarChart className="w-5 h-5" />
            Stats
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'license' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
            }`}
          >
            <Key className="w-5 h-5" />
            License Codes
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'plans' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Plans
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'settings' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
      </div>
      <Link href="/admin/login">
        <button className="w-full bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
          Logout
        </button>
      </Link>
    </aside>
  );
}
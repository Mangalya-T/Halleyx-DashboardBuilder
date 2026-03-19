import React from 'react';
import { useStore } from '../store/useStore';
import { Search, Bell, Calendar, User, LogOut } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { user, dateFilter, setDateFilter, logout } = useStore();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search analytics, orders, or widgets..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:bg-white transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <Calendar size={16} className="text-blue-600" />
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer uppercase tracking-widest"
          >
            <option>All Time</option>
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>

        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl relative transition-all group">
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center space-x-4 pl-6 border-l border-slate-100">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-black text-slate-900 tracking-tight">{user?.displayName || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'Administrator'}</p>
          </div>
          <div className="group relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 border-2 border-white ring-1 ring-slate-100 cursor-pointer">
              {user?.displayName?.[0] || <User size={20} />}
            </div>
            
            {/* Simple logout dropdown on hover or click */}
            <div className="absolute right-0 top-full mt-2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-2 min-w-[160px]">
                <button 
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

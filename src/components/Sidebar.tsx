import React from 'react';
import { cn } from '../utils/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  BarChart3
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { setUser, logout } = useStore();
  const [isOpen, setIsOpen] = React.useState(true);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'builder', label: 'Configure Dashboard', icon: BarChart3 },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingCart },
  ];

  return (
    <div className={cn(
      "h-screen bg-white border-r border-slate-200 transition-all duration-500 ease-in-out flex flex-col z-40 relative group/sidebar",
      isOpen ? "w-72" : "w-20"
    )}>
      {/* Header - Fixed */}
      <div className={cn(
        "p-6 flex items-center shrink-0",
        isOpen ? "justify-between" : "justify-center"
      )}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-slate-100"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                <BarChart3 className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">Halleyx</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items - Scrollable */}
      <div className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-all duration-200 shrink-0",
              activeTab === item.id ? "text-white" : "group-hover:text-slate-900",
              !isOpen && "mx-auto"
            )} />
            {isOpen && (
              <span className={cn(
                "ml-3 font-semibold text-sm tracking-tight",
                activeTab === item.id ? "text-white" : "text-slate-600 group-hover:text-slate-900"
              )}>
                {item.label}
              </span>
            )}
            {activeTab === item.id && isOpen && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute right-2 w-1.5 h-1.5 bg-white/40 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Footer - Fixed */}
      <div className="p-4 mt-auto border-t border-slate-50 shrink-0">
        <button 
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group",
            !isOpen && "justify-center"
          )}
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform shrink-0" />
          {isOpen && <span className="ml-3 font-semibold text-sm tracking-tight">Logout</span>}
        </button>
      </div>
    </div>
  );
};

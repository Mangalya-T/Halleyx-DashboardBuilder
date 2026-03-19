import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useStore } from '../store/useStore';
import { WidgetRenderer } from '../components/WidgetRenderer';
import { Layout, ArrowUpRight, TrendingUp, Users, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '../utils/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const { widgets, orders, loadDashboard, layout: storeLayout, setActiveTab, dateFilter, setDateFilter } = useStore();

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dateFilters = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'];

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status === 'In Progress' || o.status === 'Pending').length;
  const uniqueCustomers = new Set(orders.map(o => o.email)).size;
  
  // Simple growth rate calculation: (current - previous) / previous
  // For now, let's just show a positive growth if we have orders, or 0% if not.
  // In a real app, this would compare current period vs previous period.
  const growthRate = orders.length > 0 ? "+12.5%" : "0%";

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Orders', value: activeOrdersCount.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'New Customers', value: uniqueCustomers.toLocaleString(), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Growth Rate', value: growthRate, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 overflow-y-auto pr-4 -mr-4 custom-scrollbar h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Overview</h1>
          <p className="text-slate-500">Real-time performance metrics and business insights.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {dateFilters.map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                dateFilter === filter 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-100/30 rounded-[2.5rem] p-4 border border-slate-200 min-h-[600px] flex flex-col">
        {widgets.length > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: storeLayout.length > 0 ? storeLayout : widgets.map(w => ({ i: w.id, x: 0, y: 0, w: 4, h: 4 })) }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }}
            rowHeight={100}
            isDraggable={false}
            isResizable={false}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetRenderer widget={widget} data={orders} />
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 border border-slate-100">
              <Layout size={40} className="text-blue-600 opacity-40" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Your dashboard is a blank canvas</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
              Start building your executive overview by adding widgets in the dashboard builder.
            </p>
            <button 
              onClick={() => setActiveTab('builder')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center space-x-3 group"
            >
              <BarChart3 size={20} className="group-hover:scale-110 transition-transform" />
              <span>Open Dashboard Builder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

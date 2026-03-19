import React from 'react';
import { useStore } from '../store/useStore';
import { Plus, MoreVertical, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight, ShoppingCart, Download } from 'lucide-react';
import { OrderModal } from '../components/OrderModal';
import { formatCurrency, formatDate, cn } from '../utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { toast } from 'react-hot-toast';

export default function Orders() {
  const { orders, deleteOrder } = useStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<any>(null);
  const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [showFilters, setShowFilters] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.product || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Email', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Status', 'Order Date', 'Created By'];
    const csvRows = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order._id || order.id,
        `"${order.firstName} ${order.lastName}"`,
        order.email,
        `"${order.product}"`,
        order.quantity,
        order.unitPrice,
        order.totalAmount,
        order.status,
        formatDate(order.orderDate),
        order.createdBy
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!orderToDelete) return;
    
    try {
      await deleteOrder(orderToDelete);
      toast.success('Order deleted successfully');
      setOrderToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete order');
    }
  };

  const openEdit = (order: any) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  return (
    <div className="space-y-6 overflow-y-auto pr-4 -mr-4 custom-scrollbar h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Orders</h1>
          <p className="text-slate-500">Manage and track all customer orders in one place.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Order</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 font-medium rounded-xl transition-all border",
                  showFilters || statusFilter !== 'All' 
                    ? "bg-blue-50 border-blue-200 text-blue-600" 
                    : "text-slate-600 hover:bg-slate-50 border-slate-200"
                )}
              >
                <Filter size={18} />
                <span>Filters {statusFilter !== 'All' && `(${statusFilter})`}</span>
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                  >
                    <div className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Status</div>
                    {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilters(false);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          statusFilter === status ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {paginatedOrders.map((order) => (
                  <motion.tr 
                    key={order.id || order._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold">
                          {(order.firstName || '?')[0]}{(order.lastName || '?')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{order.firstName} {order.lastName}</p>
                          <p className="text-xs text-slate-500">{order.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{order.product}</p>
                      <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        order.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                        order.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.createdBy}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(order)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => setOrderToDelete(order.id || order._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={40} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
              <p className="text-slate-500">Try adjusting your search or create a new order.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">{paginatedOrders.length}</span> of <span className="text-slate-900">{filteredOrders.length}</span> orders
          </p>
          <div className="flex items-center space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                    currentPage === i + 1 ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-white"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <OrderModal 
        isOpen={isModalOpen} 
        onClose={closeForm} 
        editOrder={editingOrder} 
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Order</h3>
              <p className="text-slate-500 mb-8">Are you sure you want to delete this order? This action cannot be undone.</p>
              <div className="flex items-center justify-center space-x-4">
                <button 
                  onClick={() => setOrderToDelete(null)}
                  className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-8 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

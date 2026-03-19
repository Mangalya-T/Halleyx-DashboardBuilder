import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OrderSchema, OrderFormData, Order } from '../types/dashboard';
import { useStore } from '../store/useStore';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editOrder?: Order | null;
}

import { toast } from 'react-hot-toast';

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, editOrder }) => {
  const { user, addOrder, updateOrder } = useStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: editOrder || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      quantity: 1,
      unitPrice: 0,
      status: 'Pending',
      country: 'United States',
      product: 'Fiber Internet 300 Mbps',
      createdBy: 'Mr. Michael Harris'
    }
  });

  const quantity = watch('quantity') || 0;
  const unitPrice = watch('unitPrice') || 0;
  const totalAmount = quantity * unitPrice;

  const onSubmit = async (data: OrderFormData) => {
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }
    setIsSubmitting(true);
    try {
      const orderData: any = {
        ...data,
        totalAmount,
        orderDate: editOrder?.orderDate || new Date().toISOString(),
        uid: user.uid
      };

      if (editOrder) {
        await updateOrder(editOrder._id || editOrder.id, orderData);
        toast.success('Order updated successfully');
      } else {
        await addOrder(orderData);
        toast.success('Order created successfully');
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      const message = error.message || (editOrder ? 'Failed to update order' : 'Failed to create order');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{editOrder ? 'Edit Order' : 'Create New Order'}</h2>
            <p className="text-sm text-slate-500">Fill in the details below to {editOrder ? 'update' : 'create'} an order.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-slate-600 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-auto p-8 space-y-8">
          <section>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">First Name</label>
                <input {...register('firstName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="John" />
                {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Last Name</label>
                <input {...register('lastName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Doe" />
                {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input {...register('email')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="john@example.com" />
                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input {...register('phone')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="+1 (555) 000-0000" />
                {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Street Address</label>
                <input {...register('address')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="123 Main St" />
                {errors.address && <p className="text-xs text-red-500 font-medium">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">City</label>
                  <input {...register('city')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="New York" />
                  {errors.city && <p className="text-xs text-red-500 font-medium">{errors.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">State / Province</label>
                  <input {...register('state')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="NY" />
                  {errors.state && <p className="text-xs text-red-500 font-medium">{errors.state.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Zip / Postal Code</label>
                  <input {...register('zipCode')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="10001" />
                  {errors.zipCode && <p className="text-xs text-red-500 font-medium">{errors.zipCode.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Country</label>
                  <select {...register('country')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Australia</option>
                    <option>Singapore</option>
                    <option>Hong Kong</option>
                  </select>
                  {errors.country && <p className="text-xs text-red-500 font-medium">{errors.country.message}</p>}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Product</label>
                <select {...register('product')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                  <option>Fiber Internet 300 Mbps</option>
                  <option>5G Unlimited Mobile Plan</option>
                  <option>Fiber Internet 1 Gbps</option>
                  <option>Business Internet 500 Mbps</option>
                  <option>VoIP Corporate Package</option>
                </select>
                {errors.product && <p className="text-xs text-red-500 font-medium">{errors.product.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Quantity</label>
                <input type="number" {...register('quantity', { valueAsNumber: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" min="1" />
                {errors.quantity && <p className="text-xs text-red-500 font-medium">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Unit Price ($)</label>
                <input type="number" step="0.01" {...register('unitPrice', { valueAsNumber: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                {errors.unitPrice && <p className="text-xs text-red-500 font-medium">{errors.unitPrice.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select {...register('status')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
                {errors.status && <p className="text-xs text-red-500 font-medium">{errors.status.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Created By</label>
                <select {...register('createdBy')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                  <option>Mr. Michael Harris</option>
                  <option>Mr. Ryan Cooper</option>
                  <option>Ms. Olivia Carter</option>
                  <option>Mr. Lucas Martin</option>
                </select>
                {errors.createdBy && <p className="text-xs text-red-500 font-medium">{errors.createdBy.message}</p>}
              </div>
            </div>
          </section>

          <div className="bg-blue-50 p-6 rounded-2xl flex items-center justify-between border border-blue-100">
            <span className="text-blue-900 font-bold">Total Amount</span>
            <span className="text-2xl font-black text-blue-600">${totalAmount.toFixed(2)}</span>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/50">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-white hover:shadow-sm rounded-xl transition-all">Cancel</button>
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            <span>{editOrder ? 'Update Order' : 'Create Order'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

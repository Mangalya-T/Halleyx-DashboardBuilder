import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WidgetConfig, Order, DashboardLayout } from '../types/dashboard';

const API_URL = '/api';

interface DashboardState {
  widgets: WidgetConfig[];
  orders: Order[];
  layout: DashboardLayout[];
  user: any | null;
  isLoading: boolean;
  dateFilter: string;
  activeTab: string;
  
  // History for undo/redo
  past: { widgets: WidgetConfig[]; layout: DashboardLayout[] }[];
  future: { widgets: WidgetConfig[]; layout: DashboardLayout[] }[];
  
  setUser: (user: any) => void;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  setOrders: (orders: Order[]) => void;
  setWidgets: (widgets: WidgetConfig[]) => void;
  setLayout: (layout: DashboardLayout[]) => void;
  setDateFilter: (filter: string) => void;
  setActiveTab: (tab: string) => void;
  
  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  fetchOrders: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (id: string, order: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  
  saveDashboard: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  getHeaders: () => Record<string, string>;
}

export const useStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: [],
      orders: [],
      layout: [],
      user: null,
      isLoading: true,
      dateFilter: 'All Time',
      activeTab: 'dashboard',
      past: [],
      future: [],

      setUser: (user) => {
        if (user) {
          // Ensure uid is set correctly from backend response
          const uid = user.id || user._id || user.uid;
          const userWithUid = { ...user, uid };
          localStorage.setItem('halleyx-user', JSON.stringify(userWithUid));
          set({ user: userWithUid });
        } else {
          set({ user: null });
        }
      },
      
      login: async (credentials) => {
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Login failed');
          }
          
          const user = await res.json();
          get().setUser(user);
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      signup: async (userData) => {
        try {
          const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Signup failed');
          }
          
          const user = await res.json();
          get().setUser(user);
        } catch (error) {
          console.error('Signup error:', error);
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('halleyx-user');
        set({ 
          user: null, 
          activeTab: 'dashboard',
          widgets: [],
          layout: [],
          orders: [],
          past: [],
          future: []
        });
      },
      setOrders: (orders) => set({ orders }),
      setWidgets: (widgets) => {
        get().pushHistory();
        set({ widgets });
      },
      setLayout: (layout) => {
        // We don't push history for every layout change (dragging) 
        // because it's too frequent. We'll push it on drag stop in the component.
        set({ layout });
      },
      setDateFilter: (dateFilter) => {
        set({ dateFilter });
        get().fetchOrders();
      },
      setActiveTab: (activeTab) => set({ activeTab }),
      
      getHeaders: () => {
        const { user } = get();
        return {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || ''
        };
      },

      pushHistory: () => {
        const { widgets, layout, past } = get();
        const currentState = { widgets: JSON.parse(JSON.stringify(widgets)), layout: JSON.parse(JSON.stringify(layout)) };
        
        // Don't push if the state is identical to the last one
        if (past.length > 0) {
          const lastState = past[past.length - 1];
          if (JSON.stringify(lastState) === JSON.stringify(currentState)) {
            return;
          }
        }
        
        // Limit history to 50 steps
        const newPast = [...past, currentState].slice(-50);
        set({ past: newPast, future: [] });
      },

      undo: () => {
        const { past, future, widgets, layout } = get();
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        
        set({
          widgets: previous.widgets,
          layout: previous.layout,
          past: newPast,
          future: [{ widgets: JSON.parse(JSON.stringify(widgets)), layout: JSON.parse(JSON.stringify(layout)) }, ...future].slice(0, 50)
        });
      },

      redo: () => {
        const { past, future, widgets, layout } = get();
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        set({
          widgets: next.widgets,
          layout: next.layout,
          past: [...past, { widgets: JSON.parse(JSON.stringify(widgets)), layout: JSON.parse(JSON.stringify(layout)) }].slice(-50),
          future: newFuture
        });
      },

      addWidget: (widget) => {
        get().pushHistory();
        set((state) => ({ widgets: [...state.widgets, widget] }));
      },
      removeWidget: (id) => {
        get().pushHistory();
        set((state) => ({ 
          widgets: state.widgets.filter(w => w.id !== id),
          layout: state.layout.filter(l => l.i !== id)
        }));
      },
      updateWidget: (id, updates) => {
        get().pushHistory();
        set((state) => ({
          widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
        }));
      },

      fetchOrders: async () => {
        try {
          const { dateFilter, user } = get();
          if (!user) return;

          let query = '';
          
          if (dateFilter !== 'All Time') {
            const now = new Date();
            const start = new Date();
            if (dateFilter === 'Today') {
              start.setHours(0, 0, 0, 0);
            } else if (dateFilter === 'Last 7 Days') {
              start.setDate(now.getDate() - 7);
            } else if (dateFilter === 'Last 30 Days') {
              start.setDate(now.getDate() - 30);
            } else if (dateFilter === 'Last 90 Days') {
              start.setDate(now.getDate() - 90);
            }
            
            query = `?startDate=${start.toISOString()}&endDate=${now.toISOString()}`;
          }

          const res = await fetch(`${API_URL}/orders${query}`, {
            headers: { 'X-User-ID': user.uid }
          });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          set({ orders: Array.isArray(data) ? data : [] });
        } catch (error) {
          console.error('Error fetching orders:', error);
          set({ orders: [] });
        }
      },

      addOrder: async (order) => {
        try {
          const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: get().getHeaders(),
            body: JSON.stringify(order)
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
          }
          const newOrder = await res.json();
          set((state) => ({ orders: [newOrder, ...state.orders] }));
          // Refresh to ensure we have correct IDs from backend
          get().fetchOrders();
        } catch (error) {
          console.error('Error adding order:', error);
          throw error;
        }
      },

      updateOrder: async (id, updatedOrder) => {
        try {
          const res = await fetch(`${API_URL}/orders/${id}`, {
            method: 'PUT',
            headers: get().getHeaders(),
            body: JSON.stringify(updatedOrder)
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          set((state) => ({
            orders: state.orders.map(o => o._id === id || o.id === id ? data : o)
          }));
          // Refresh to ensure we have correct IDs and calculated fields from backend
          get().fetchOrders();
        } catch (error) {
          console.error('Error updating order:', error);
          throw error;
        }
      },

      deleteOrder: async (id) => {
        if (!id) throw new Error('Order ID is required');
        try {
          const { user } = get();
          const res = await fetch(`${API_URL}/orders/${id}`, { 
            method: 'DELETE',
            headers: { 'X-User-ID': user?.uid || '' }
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
          }
          
          set((state) => ({
            orders: state.orders.filter(o => {
              const orderId = o.id || o._id;
              return orderId !== id;
            })
          }));
          
          // Optional: refresh from server to be sure
          // get().fetchOrders();
        } catch (error) {
          console.error('Error deleting order:', error);
          throw error;
        }
      },

      saveDashboard: async () => {
        try {
          const { widgets, layout } = get();
          const res = await fetch(`${API_URL}/dashboard/save`, {
            method: 'POST',
            headers: get().getHeaders(),
            body: JSON.stringify({ widgets, layout })
          });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        } catch (error) {
          console.error('Error saving dashboard:', error);
        }
      },

      loadDashboard: async () => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/dashboard`, {
            headers: { 'X-User-ID': user.uid }
          });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          set({ 
            widgets: data.widgets || [], 
            layout: data.layout || [],
            past: [],
            future: [],
            isLoading: false 
          });
        } catch (error) {
          console.error('Error loading dashboard:', error);
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'halleyx-storage',
      partialize: (state) => ({ widgets: state.widgets, layout: state.layout }),
    }
  )
);

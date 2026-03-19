import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/halleyx_dashboard';

let isConnected = false;

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('No MONGO_URI provided. Starting in-memory fallback mode.');
    isConnected = false;
    return;
  }

  try {
    // Set timeout for connection attempt to avoid hanging
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to in-memory storage.');
    isConnected = false;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'user'], default: 'user' },
  name: { type: String, required: true },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true },
  createdBy: { type: String, required: true },
  orderDate: { type: String, required: true },
  uid: { type: String, required: true },
}, { timestamps: true });

const OrderModel = mongoose.model('Order', orderSchema);

// Dashboard Schema
const dashboardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, default: 'default' },
  widgets: { type: Array, default: [] },
  layout: { type: Array, default: [] },
}, { timestamps: true });

const DashboardModel = mongoose.model('Dashboard', dashboardSchema);

// In-memory storage for fallback
const memoryUsers: any[] = [];
const memoryOrders: any[] = [
  {
    id: 'ord-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-0101',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    product: 'Fiber Internet 300 Mbps',
    quantity: 1,
    unitPrice: 59.99,
    totalAmount: 59.99,
    status: 'Completed',
    createdBy: 'Mr. Michael Harris',
    orderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    uid: 'default-user'
  },
  {
    id: 'ord-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '555-0102',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'United States',
    product: '5G Unlimited Mobile Plan',
    quantity: 2,
    unitPrice: 45.00,
    totalAmount: 90.00,
    status: 'In Progress',
    createdBy: 'Ms. Olivia Carter',
    orderDate: new Date(Date.now() - 86400000).toISOString(),
    uid: 'default-user'
  },
  {
    id: 'ord-3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    phone: '555-0103',
    address: '789 Pine Rd',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'United States',
    product: 'Fiber Internet 1 Gbps',
    quantity: 1,
    unitPrice: 89.99,
    totalAmount: 89.99,
    status: 'Pending',
    createdBy: 'Mr. Ryan Cooper',
    orderDate: new Date().toISOString(),
    uid: 'default-user'
  }
];
const memoryDashboards: Record<string, any> = {
  'default': { userId: 'default', widgets: [], layout: [] }
};

export const UserStore = {
  findByEmail: async (email: string) => {
    if (isConnected) {
      return await UserModel.findOne({ email });
    } else {
      return memoryUsers.find(u => u.email === email);
    }
  },

  create: async (userData: any) => {
    if (isConnected) {
      const newUser = new UserModel(userData);
      const saved = await newUser.save();
      const obj = saved.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const newUser = {
        ...userData,
        password: hashedPassword,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      memoryUsers.push(newUser);
      return newUser;
    }
  },

  verifyPassword: async (user: any, password: string) => {
    if (isConnected) {
      // If it's a Mongoose document, use the method
      if (user.comparePassword) {
        return await user.comparePassword(password);
      }
      // If it's a plain object from toObject()
      return await bcrypt.compare(password, user.password);
    } else {
      return await bcrypt.compare(password, user.password);
    }
  }
};

export const OrderStore = {
  getAll: async (uid: string, startDate?: string, endDate?: string) => {
    if (isConnected) {
      let query: any = { uid };
      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = startDate;
        if (endDate) query.orderDate.$lte = endDate;
      }
      const orders = await OrderModel.find(query).sort({ orderDate: -1 });
      return orders.map(order => {
        const obj = order.toObject();
        return { ...obj, id: obj._id.toString() };
      });
    } else {
      let filtered = memoryOrders.filter(o => o.uid === uid);
      if (startDate) filtered = filtered.filter(o => o.orderDate >= startDate);
      if (endDate) filtered = filtered.filter(o => o.orderDate <= endDate);
      return filtered.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
    }
  },
  
  create: async (uid: string, order: any) => {
    const { _id, id, ...cleanOrder } = order;
    const totalAmount = (Number(cleanOrder.quantity) || 0) * (Number(cleanOrder.unitPrice) || 0);
    if (isConnected) {
      const newOrder = new OrderModel({
        ...cleanOrder,
        uid,
        totalAmount,
        orderDate: cleanOrder.orderDate || new Date().toISOString()
      });
      const saved = await newOrder.save();
      const obj = saved.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      const newOrder = {
        ...cleanOrder,
        uid,
        id: Math.random().toString(36).substr(2, 9),
        totalAmount,
        orderDate: cleanOrder.orderDate || new Date().toISOString()
      };
      memoryOrders.push(newOrder);
      return newOrder;
    }
  },
  
  update: async (uid: string, id: string, updates: any) => {
    // Strip IDs from updates to prevent Mongoose errors
    const { _id, id: idField, ...cleanUpdates } = updates;
    
    // Recalculate total amount if quantity or unitPrice is provided
    if (cleanUpdates.quantity !== undefined || cleanUpdates.unitPrice !== undefined) {
      const currentOrder = isConnected 
        ? await OrderModel.findOne({ _id: id, uid }) 
        : memoryOrders.find(o => o.id === id && o.uid === uid);
        
      if (!currentOrder) return null;

      const quantity = cleanUpdates.quantity !== undefined ? cleanUpdates.quantity : (currentOrder?.quantity || 0);
      const unitPrice = cleanUpdates.unitPrice !== undefined ? cleanUpdates.unitPrice : (currentOrder?.unitPrice || 0);
      cleanUpdates.totalAmount = (Number(quantity) || 0) * (Number(unitPrice) || 0);
    }

    if (isConnected) {
      const updated = await OrderModel.findOneAndUpdate({ _id: id, uid }, cleanUpdates, { new: true });
      if (!updated) return null;
      const obj = updated.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      const index = memoryOrders.findIndex(o => o.id === id && o.uid === uid);
      if (index === -1) return null;
      memoryOrders[index] = { ...memoryOrders[index], ...cleanUpdates };
      return memoryOrders[index];
    }
  },
  
  delete: async (uid: string, id: string) => {
    if (isConnected) {
      await OrderModel.findOneAndDelete({ _id: id, uid });
    } else {
      const index = memoryOrders.findIndex(o => o.id === id && o.uid === uid);
      if (index !== -1) memoryOrders.splice(index, 1);
    }
  }
};

export const DashboardStore = {
  get: async (userId: string = 'default') => {
    if (isConnected) {
      let dashboard = await DashboardModel.findOne({ userId });
      if (!dashboard) {
        dashboard = new DashboardModel({ userId, widgets: [], layout: [] });
        await dashboard.save();
      }
      const obj = dashboard.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      if (!memoryDashboards[userId]) {
        memoryDashboards[userId] = { userId, widgets: [], layout: [] };
      }
      return { ...memoryDashboards[userId], id: userId };
    }
  },
  
  save: async (userId: string = 'default', data: any) => {
    const { _id, id, ...cleanData } = data;
    if (isConnected) {
      const updated = await DashboardModel.findOneAndUpdate(
        { userId },
        { ...cleanData },
        { new: true, upsert: true }
      );
      const obj = updated.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      memoryDashboards[userId] = { ...memoryDashboards[userId], ...cleanData };
      return { ...memoryDashboards[userId], id: userId };
    }
  }
};


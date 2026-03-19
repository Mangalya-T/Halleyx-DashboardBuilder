import express from 'express';
import { 
  getOrders, createOrder, updateOrder, deleteOrder,
  getDashboard, saveDashboard,
  getWidgets, createWidget 
} from '../controllers/dashboardController.ts';
import { signup, login } from '../controllers/authController.ts';

const router = express.Router();

// Auth
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Orders
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.put('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);

// Dashboard
router.get('/dashboard', getDashboard);
router.post('/dashboard/save', saveDashboard);
router.put('/dashboard/update', saveDashboard);

// Widgets
router.get('/widgets', getWidgets);
router.post('/widgets', createWidget);

export default router;

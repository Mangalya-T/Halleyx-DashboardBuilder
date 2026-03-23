import type { Request, Response } from 'express';
import { OrderStore, DashboardStore } from '../models/schemas.ts';

// Orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const orders = await OrderStore.getAll(
      "default",
      startDate as string,
      endDate as string
    );

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const newOrder = await OrderStore.create("default", req.body);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      message: 'Error creating order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const updatedOrder = await OrderStore.update("default", id, req.body);

    if (updatedOrder) {
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({
      message: 'Error updating order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    await OrderStore.delete("default", id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order' });
  }
};

// Dashboard
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await DashboardStore.get("default");
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
};

export const saveDashboard = async (req: Request, res: Response) => {
  try {
    const { widgets, layout } = req.body;

    const dashboard = await DashboardStore.save("default", {
      widgets,
      layout
    });

    res.json(dashboard);
  } catch (error) {
    res.status(400).json({ message: 'Error saving dashboard' });
  }
};

// Widgets
export const getWidgets = async (req: Request, res: Response) => {
  try {
    const dashboard = await DashboardStore.get("default");
    res.json(dashboard.widgets || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching widgets' });
  }
};

export const createWidget = async (req: Request, res: Response) => {
  try {
    const dashboard = await DashboardStore.get("default");

    const newWidget = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9)
    };

    dashboard.widgets.push(newWidget);

    await DashboardStore.save("default", dashboard);

    res.status(201).json(newWidget);
  } catch (error) {
    res.status(400).json({ message: 'Error creating widget' });
  }
};
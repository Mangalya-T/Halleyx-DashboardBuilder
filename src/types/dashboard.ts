import { z } from 'zod';

export type WidgetType = 'BAR' | 'LINE' | 'AREA' | 'SCATTER' | 'PIE' | 'KPI' | 'TABLE';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  settings: {
    metric?: string;
    aggregation?: 'sum' | 'avg' | 'count';
    xAxis?: string;
    yAxis?: string;
    color?: string;
    showLabels?: boolean;
    showXAxisLabels?: boolean;
    showLegend?: boolean;
    dataLimit?: number;
    columns?: string[];
    pageSize?: number;
    fontSize?: number;
    headerBgColor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    precision?: number;
    format?: 'number' | 'currency';
    filters?: {
      id: string;
      field: string;
      operator: 'equals' | 'contains' | 'gt' | 'lt';
      value: string;
    }[];
  };
}

export interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export const OrderSchema = z.object({
  firstName: z.string().min(1, "Please fill the field"),
  lastName: z.string().min(1, "Please fill the field"),
  email: z.string().email("Invalid email").min(1, "Please fill the field"),
  phone: z.string().min(1, "Please fill the field"),
  address: z.string().min(1, "Please fill the field"),
  city: z.string().min(1, "Please fill the field"),
  state: z.string().min(1, "Please fill the field"),
  zipCode: z.string().min(1, "Please fill the field"),
  country: z.enum(['United States', 'Canada', 'Australia', 'Singapore', 'Hong Kong'], {
    error: "Please fill the field"
  } as any),
  product: z.enum([
    'Fiber Internet 300 Mbps',
    '5G Unlimited Mobile Plan',
    'Fiber Internet 1 Gbps',
    'Business Internet 500 Mbps',
    'VoIP Corporate Package'
  ], {
    error: "Please fill the field"
  } as any),
  quantity: z.number({ message: "Please fill the field" }).min(1, "Minimum = 1"),
  unitPrice: z.number({ message: "Please fill the field" }).min(0),
  status: z.enum(['Pending', 'In Progress', 'Completed'], {
    error: "Please fill the field"
  } as any),
  createdBy: z.enum(['Mr. Michael Harris', 'Mr. Ryan Cooper', 'Ms. Olivia Carter', 'Mr. Lucas Martin'], {
    error: "Please fill the field"
  } as any),
});

export type OrderFormData = z.infer<typeof OrderSchema>;

export interface Order extends OrderFormData {
  id: string;
  _id?: string;
  totalAmount: number;
  orderDate: string;
  uid: string; // Firebase User ID
}

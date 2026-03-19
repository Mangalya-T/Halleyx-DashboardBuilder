import React from 'react';
import { WidgetConfig, Order } from '../types/dashboard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency, formatDate } from '../utils/utils';
import { Trash2, Settings, GripVertical, Loader2, Info } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface WidgetRendererProps {
  widget: WidgetConfig;
  data: Order[];
  onDelete?: (id: string) => void;
  onEdit?: (widget: WidgetConfig) => void;
}

const CHART_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, data, onDelete, onEdit }) => {
  const { title, description, settings } = widget;

  // Only show loading if data is explicitly null/undefined
  // If it's an empty array, it means data has been fetched but there are no records yet.
  if (data === undefined || data === null) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full items-center justify-center p-6 group relative overflow-hidden">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <div className="mt-4 text-center">
          <h3 className="font-bold text-slate-900 tracking-tight leading-none">{title}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Fetching Data...</p>
        </div>
      </div>
    );
  }

  const processData = () => {
    if (!Array.isArray(data)) {
      console.warn('WidgetRenderer: data is not an array', data);
      return widget.type === 'KPI' ? 0 : [];
    }

    // Apply filters
    let filteredData = [...data];
    if (settings.filters && settings.filters.length > 0) {
      filteredData = filteredData.filter(item => {
        return settings.filters.every((filter: any) => {
          const val = item[filter.field as keyof Order];
          const filterVal = filter.value;
          
          if (filterVal === undefined || filterVal === '') return true;

          switch (filter.operator) {
            case 'equals':
              return String(val).toLowerCase() === String(filterVal).toLowerCase();
            case 'contains':
              return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
            case 'gt':
              return Number(val) > Number(filterVal);
            case 'lt':
              return Number(val) < Number(filterVal);
            default:
              return true;
          }
        });
      });
    }

    if (widget.type === 'KPI') {
      const metric = settings.metric as keyof Order;
      const isNumericMetric = ['totalAmount', 'unitPrice', 'quantity'].includes(metric as string);
      const aggregation = settings.aggregation || 'count';

      if (!isNumericMetric || aggregation === 'count') {
        return filteredData.length;
      }

      const values = filteredData.map(d => Number(d[metric]) || 0);
      
      let result = 0;
      if (aggregation === 'sum') result = values.reduce((a, b) => a + b, 0);
      if (aggregation === 'avg') result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      
      const precision = settings.precision !== undefined ? settings.precision : 2;
      return Number(result.toFixed(precision));
    }

    if (widget.type === 'TABLE') {
      // Sorting
      const sortBy = settings.sortBy as keyof Order || 'orderDate';
      const sortOrder = settings.sortOrder || 'desc';

      filteredData.sort((a, b) => {
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';

        if (valA === valB) return 0;
        
        const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      return filteredData;
    }

    if (widget.type === 'SCATTER') {
      const xAxis = settings.xAxis as keyof Order;
      const yAxis = settings.yAxis as keyof Order;
      if (!xAxis || !yAxis) return [];

      const result = filteredData.map(item => ({
        x: item[xAxis],
        y: Number(item[yAxis]) || 0,
        z: 100, // Size of the point
        name: `${item.firstName} ${item.lastName}`,
        product: item.product
      }));

      if (settings.dataLimit) {
        return result.slice(0, settings.dataLimit);
      }
      return result;
    }

    // Chart data processing
    const groups: Record<string, any> = {};
    const xAxis = settings.xAxis as keyof Order;
    const yAxis = settings.yAxis as keyof Order;

    if (!xAxis || !yAxis) {
      return [];
    }

    filteredData.forEach(item => {
      const xValue = String(item[xAxis] || 'N/A');
      const yValue = Number(item[yAxis]) || 0;
      
      if (!groups[xValue]) {
        groups[xValue] = { name: xValue, value: 0, count: 0 };
      }
      groups[xValue].value += yValue;
      groups[xValue].count += 1;
    });

    const result = Object.values(groups);
    if (settings.dataLimit) {
      return result.slice(0, settings.dataLimit);
    }
    return result;
  };

  const chartData = processData();

  const renderChart = () => {
    const color = settings.color || '#2563eb';

    if (['BAR', 'LINE', 'AREA', 'PIE', 'SCATTER'].includes(widget.type) && (chartData as any[]).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
          <div className="text-sm font-medium">No data to display</div>
          <div className="text-xs">Configure X and Y axis in settings</div>
        </div>
      );
    }

    switch (widget.type) {
      case 'BAR':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData as any[]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={settings.showXAxisLabels !== false ? { fontSize: 10, fill: '#64748b' } : false} 
                height={settings.showXAxisLabels !== false ? 30 : 0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'LINE':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData as any[]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={settings.showXAxisLabels !== false ? { fontSize: 10, fill: '#64748b' } : false} 
                height={settings.showXAxisLabels !== false ? 30 : 0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'AREA':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData as any[]}>
              <defs>
                <linearGradient id={`gradient-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={settings.showXAxisLabels !== false ? { fontSize: 10, fill: '#64748b' } : false} 
                height={settings.showXAxisLabels !== false ? 30 : 0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#gradient-${widget.id})`} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'PIE':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData as any[]}
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={5}
                dataKey="value"
              >
                {(chartData as any[]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              {settings.showLegend && <Legend verticalAlign="bottom" height={36} iconType="circle" />}
            </PieChart>
          </ResponsiveContainer>
        );
      case 'SCATTER':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                type={Array.isArray(chartData) && chartData.length > 0 && typeof (chartData as any[])[0]?.x === 'number' ? 'number' : 'category'}
                dataKey="x" 
                name={settings.xAxis}
                axisLine={false} 
                tickLine={false} 
                tick={settings.showXAxisLabels !== false ? { fontSize: 10, fill: '#64748b' } : false} 
                allowDuplicatedCategory={false}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={settings.yAxis}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
                        <p className="font-bold text-slate-900 mb-1">{data.name}</p>
                        <p className="text-slate-500 mb-1">{data.product}</p>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-50">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block">X: {settings.xAxis}</span>
                            <span className="font-bold text-blue-600">{data.x}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block">Y: {settings.yAxis}</span>
                            <span className="font-bold text-blue-600">{data.y}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Orders" data={chartData as any[]} fill={color} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'KPI':
        return <KPIWidget value={chartData as number} settings={settings} />;
      case 'TABLE':
        return <TableWidget data={chartData as Order[]} settings={settings} />;
      default:
        return <div className="flex items-center justify-center h-full text-slate-400">Unsupported widget type</div>;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 flex flex-col h-full group relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300/60">
      {/* Widget Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="drag-handle cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 -ml-1 hover:bg-slate-100 rounded-md">
            <GripVertical size={14} className="text-slate-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate">{title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div 
            className="text-slate-300 hover:text-blue-500 transition-colors cursor-help p-1"
            data-tooltip-id={`tooltip-${widget.id}`}
            data-tooltip-content={`${title}${description ? `: ${description}` : ''}`}
            data-tooltip-place="top"
          >
            <Info size={14} />
          </div>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit?.(widget)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Settings size={14} />
            </button>
            <button onClick={() => onDelete?.(widget.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          {renderChart()}
        </div>
      </div>
      <ReactTooltip 
        id={`tooltip-${widget.id}`}
        style={{ 
          backgroundColor: '#1e293b', 
          color: '#fff', 
          borderRadius: '8px', 
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: '500',
          zIndex: 100,
          maxWidth: '240px'
        }}
      />
    </div>
  );
};

const KPIWidget = ({ value, settings }: { value: number, settings: any }) => {
  const isCurrency = settings.format === 'currency' || ((settings.metric?.includes('Amount') || settings.metric?.includes('Price')) && settings.aggregation !== 'count');
  const precision = settings.precision !== undefined ? settings.precision : 2;
  
  const formattedValue = isCurrency 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: precision, maximumFractionDigits: precision }).format(value)
    : value.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{formattedValue}</div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-100">
          {settings.aggregation === 'avg' ? 'Average' : (settings.aggregation || 'count').charAt(0).toUpperCase() + (settings.aggregation || 'count').slice(1)}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          of {settings.metric}
        </span>
      </div>
    </div>
  );
};

const TableWidget = ({ data, settings }: { data: Order[], settings: any }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = settings.pageSize || 10;
  const columns = settings.columns || ['firstName', 'lastName', 'product', 'totalAmount', 'status'];
  const fontSize = settings.fontSize || 13;
  const headerBgColor = settings.headerBgColor || '#f8fafc';

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1 border border-slate-100 rounded-2xl">
        <table className="w-full text-left border-collapse" style={{ fontSize: `${fontSize}px` }}>
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: headerBgColor }} className="text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              {columns.map((col: string) => (
                <th key={col} className="px-4 py-3 whitespace-nowrap text-[10px]">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col: string) => (
                  <td key={col} className="px-4 py-3 text-slate-600 whitespace-nowrap font-medium">
                    {col === 'totalAmount' || col === 'unitPrice' ? (
                      <span className="font-mono text-slate-900">{formatCurrency(item[col as keyof Order] as number)}</span>
                    ) : col === 'orderDate' ? (
                      formatDate(item[col as keyof Order] as string)
                    ) : col === 'status' ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        item.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        {item.status}
                      </span>
                    ) : (
                      String(item[col as keyof Order] || '')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors"
            >
              Prev
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useStore } from '../store/useStore';
import { WidgetRenderer } from '../components/WidgetRenderer';
import { WidgetConfigPanel } from '../components/WidgetConfigPanel';
import { WidgetConfig, WidgetType } from '../types/dashboard';
import { Plus, Save, Layout, BarChart3, Type, Table as TableIcon, PieChart as PieIcon, Activity, Info, Undo, Redo, ChevronRight, ChevronLeft, ScatterChart as ScatterIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { cn } from '../utils/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

import { toast } from 'react-hot-toast';

export default function Builder() {
  const widgets = useStore(state => state.widgets);
  const storeAddWidget = useStore(state => state.addWidget);
  const storeRemoveWidget = useStore(state => state.removeWidget);
  const saveDashboard = useStore(state => state.saveDashboard);
  const loadDashboard = useStore(state => state.loadDashboard);
  const storeLayout = useStore(state => state.layout);
  const setStoreLayout = useStore(state => state.setLayout);
  const orders = useStore(state => state.orders);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const past = useStore(state => state.past);
  const future = useStore(state => state.future);
  const pushHistory = useStore(state => state.pushHistory);

  const [layout, setLayout] = React.useState<any[]>([]);
  const [editingWidget, setEditingWidget] = React.useState<WidgetConfig | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(true);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Sync layout from store whenever it changes (e.g., undo/redo)
  React.useEffect(() => {
    if (storeLayout.length > 0) {
      setLayout(storeLayout);
    }
  }, [storeLayout]);

  const addWidget = (type: WidgetType) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newWidget: WidgetConfig = {
      id,
      type,
      title: `New ${type} Widget`,
      description: '',
      settings: {
        metric: 'totalAmount',
        aggregation: 'sum',
        xAxis: 'product',
        yAxis: 'totalAmount',
        color: '#2563eb',
        pageSize: 10,
        fontSize: 14,
        headerBgColor: '#54bd95',
        showLegend: type === 'PIE',
        filters: []
      }
    };

    storeAddWidget(newWidget);
    const nextLayout = [...layout, { i: id, x: 0, y: Infinity, w: 4, h: 4 }];
    setLayout(nextLayout);
    setStoreLayout(nextLayout);
    toast.success(`${type} widget added`);
  };

  const removeWidget = (id: string) => {
    if (window.confirm('Are you sure you want to remove this widget?')) {
      storeRemoveWidget(id);
      setLayout(prev => prev.filter(l => l.i !== id));
      toast.success('Widget removed');
    }
  };

  const updateWidget = React.useCallback((updates: Partial<WidgetConfig>, shouldClose = true) => {
    if (!editingWidget) return;
    
    const storeUpdateWidget = useStore.getState().updateWidget;
    storeUpdateWidget(editingWidget.id, updates);

    if (!shouldClose) {
      const updatedWidget = useStore.getState().widgets.find(w => w.id === editingWidget.id);
      if (updatedWidget) setEditingWidget(updatedWidget);
    }

    if (shouldClose) {
      setEditingWidget(null);
      toast.success('Widget settings updated');
    }
  }, [editingWidget]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setStoreLayout(layout);
      await saveDashboard();
      toast.success('Dashboard configuration saved successfully!');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save dashboard configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const onDrop = (layout: any, layoutItem: any, _event: any) => {
    const type = _event.dataTransfer.getData('widgetType') as WidgetType;
    if (!type) {
      console.warn('No widget type found in dataTransfer');
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newWidget: WidgetConfig = {
      id,
      type,
      title: `New ${type} Widget`,
      description: '',
      settings: {
        metric: 'totalAmount',
        aggregation: 'sum',
        xAxis: 'product',
        yAxis: 'totalAmount',
        color: '#2563eb',
        pageSize: 10,
        fontSize: 14,
        headerBgColor: '#54bd95',
        showLegend: type === 'PIE',
        filters: []
      }
    };

    // Update widgets first
    storeAddWidget(newWidget);
    
    // Update layout by replacing the 'dropping' placeholder with the new widget ID
    const newLayoutItem = { ...layoutItem, i: id };
    const nextLayout = [...layout.filter(l => l.i !== 'dropping'), newLayoutItem];
    setLayout(nextLayout);
    setStoreLayout(nextLayout);
    
    toast.success(`${type} widget added`);
  };

  const widgetOptions: { type: WidgetType, label: string, icon: any }[] = [
    { type: 'KPI', label: 'KPI Card', icon: Activity },
    { type: 'BAR', label: 'Bar Chart', icon: BarChart3 },
    { type: 'LINE', label: 'Line Chart', icon: Activity },
    { type: 'AREA', label: 'Area Chart', icon: Activity },
    { type: 'SCATTER', label: 'Scatter Plot', icon: ScatterIcon },
    { type: 'PIE', label: 'Pie Chart', icon: PieIcon },
    { type: 'TABLE', label: 'Data Table', icon: TableIcon },
  ];

  return (
    <div className={cn(
      "h-[calc(100vh-8rem)] flex overflow-hidden relative transition-all duration-500",
      isLibraryOpen ? "gap-8" : "gap-0"
    )}>
      {/* Main Builder Area - Scrollable */}
      <div 
        className="flex-1 flex flex-col min-w-0 h-full"
      >
        <header className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Builder</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full">v2.4.0</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <p className="text-sm text-slate-500 font-medium">Workspace: Production Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
              <button
                onClick={undo}
                disabled={past.length === 0}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                data-tooltip-id="sidebar-tooltip"
                data-tooltip-content="Undo (Ctrl+Z)"
              >
                <Undo size={18} />
              </button>
              <div className="w-px h-6 bg-slate-100 mx-1" />
              <button
                onClick={redo}
                disabled={future.length === 0}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                data-tooltip-id="sidebar-tooltip"
                data-tooltip-content="Redo (Ctrl+Shift+Z)"
              >
                <Redo size={18} />
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center space-x-3 disabled:opacity-50 active:scale-95 group"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} className="group-hover:scale-110 transition-transform" />
              )}
              <span>Publish Changes</span>
            </button>
          </div>
        </header>

        <div 
          className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4"
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Dashboard Canvas */}
          <div 
            className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl min-h-full relative overflow-hidden p-8 bg-grid-slate-100"
          >
            <ResponsiveGridLayout
              className="layout"
              layouts={{ 
                lg: layout,
                md: layout,
                sm: layout,
                xs: layout,
                xxs: layout
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }}
              rowHeight={100}
              onLayoutChange={(currentLayout) => setLayout(currentLayout)}
              onDragStart={() => pushHistory()}
              onResizeStart={() => pushHistory()}
              onDragStop={(currentLayout) => setStoreLayout(currentLayout)}
              onResizeStop={(currentLayout) => setStoreLayout(currentLayout)}
              onDrop={onDrop}
              isDroppable={true}
              droppingItem={{ i: 'dropping', w: 4, h: 4 }}
              draggableHandle=".drag-handle"
              margin={[24, 24]}
              useCSSTransforms={true}
              style={{ minHeight: '1000px' }}
            >
              {widgets.map((widget) => (
                <div key={widget.id} className="group">
                  <WidgetRenderer
                    widget={widget}
                    data={orders}
                    onDelete={removeWidget}
                    onEdit={setEditingWidget}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>

            {widgets.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 pointer-events-none z-0">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 border border-slate-100">
                  <Plus size={40} className="text-blue-600 opacity-40" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Start Building Your View</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                  Drag widgets from the right sidebar onto this canvas to begin designing your professional dashboard.
                </p>
                <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">1</div>
                    <span>Drag Widgets</span>
                  </div>
                  <div className="w-12 h-px bg-slate-200" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">2</div>
                    <span>Configure Data</span>
                  </div>
                  <div className="w-12 h-px bg-slate-200" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">3</div>
                    <span>Publish</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Fixed Right */}
      <aside className={cn(
        "flex flex-col gap-6 shrink-0 transition-all duration-500 ease-in-out relative",
        isLibraryOpen ? "w-80" : "w-12"
      )}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsLibraryOpen(!isLibraryOpen)}
          className={cn(
            "absolute top-10 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-slate-50 transition-all duration-500",
            isLibraryOpen ? "-left-4" : "-left-4"
          )}
        >
          {isLibraryOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={cn(
          "bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col h-full overflow-hidden transition-all duration-500",
          !isLibraryOpen && "opacity-0 pointer-events-none translate-x-full"
        )}>
          <div className={cn(
            "p-8 border-b border-slate-50 bg-slate-50/30 transition-all",
            !isLibraryOpen && "p-4 items-center"
          )}>
            <h2 className={cn(
              "text-xl font-black text-slate-900 tracking-tight flex items-center gap-3",
              !isLibraryOpen && "flex-col"
            )}>
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <Layout className="w-5 h-5 text-white" />
              </div>
              {isLibraryOpen && <span>Widget Library</span>}
            </h2>
            {isLibraryOpen && <p className="text-xs text-slate-400 mt-3 font-bold uppercase tracking-widest">Drag to Canvas</p>}
          </div>
          
          <div className={cn(
            "flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8",
            !isLibraryOpen && "p-2"
          )}>
            {/* Charts Section */}
            <section>
              {isLibraryOpen && <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Visualization</h3>}
              <div className={cn(
                "grid gap-3",
                isLibraryOpen ? "grid-cols-2" : "grid-cols-1"
              )}>
                {widgetOptions.filter(opt => opt.type !== 'KPI' && opt.type !== 'TABLE').map((opt) => (
                  <div
                    key={opt.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('widgetType', opt.type);
                    }}
                    className="group cursor-grab active:cursor-grabbing"
                    data-tooltip-id="sidebar-tooltip"
                    data-tooltip-content={isLibraryOpen ? `Drag to add a ${opt.label} to your dashboard` : opt.label}
                  >
                    <div className={cn(
                      "bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1",
                      isLibraryOpen ? "p-4" : "p-2"
                    )}>
                      <div className={cn(
                        "bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors border border-slate-100 group-hover:border-blue-100",
                        isLibraryOpen ? "w-12 h-12" : "w-10 h-10"
                      )}>
                        <opt.icon className={cn(
                          "text-slate-400 group-hover:text-blue-600 transition-colors",
                          isLibraryOpen ? "w-6 h-6" : "w-5 h-5"
                        )} />
                      </div>
                      {isLibraryOpen && <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{opt.label}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Metrics Section */}
            <section>
              {isLibraryOpen && <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Data & Metrics</h3>}
              <div className={cn(
                "grid gap-3",
                isLibraryOpen ? "grid-cols-2" : "grid-cols-1"
              )}>
                {widgetOptions.filter(opt => opt.type === 'KPI' || opt.type === 'TABLE').map((opt) => (
                  <div
                    key={opt.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('widgetType', opt.type);
                    }}
                    className="group cursor-grab active:cursor-grabbing"
                    data-tooltip-id="sidebar-tooltip"
                    data-tooltip-content={isLibraryOpen ? `Drag to add a ${opt.label} to your dashboard` : opt.label}
                  >
                    <div className={cn(
                      "bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1",
                      isLibraryOpen ? "p-4" : "p-2"
                    )}>
                      <div className={cn(
                        "bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors border border-slate-100 group-hover:border-blue-100",
                        isLibraryOpen ? "w-12 h-12" : "w-10 h-10"
                      )}>
                        <opt.icon className={cn(
                          "text-slate-400 group-hover:text-blue-600 transition-colors",
                          isLibraryOpen ? "w-6 h-6" : "w-5 h-5"
                        )} />
                      </div>
                      {isLibraryOpen && <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{opt.label}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {isLibraryOpen && (
            <div className="p-6 bg-slate-50/50 border-t border-slate-50">
              <div className="bg-blue-600/5 rounded-2xl p-4 border border-blue-600/10">
                <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                  Tip: Use the right panel to customize widget data and appearance.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Sidebar - Widget Config */}
      <AnimatePresence mode="wait">
        {editingWidget && (
          <motion.div
            key="config-panel"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 w-80 h-screen z-[60] bg-white shadow-2xl"
          >
            <WidgetConfigPanel
              widget={editingWidget}
              onUpdate={(updates, shouldClose) => updateWidget(updates, shouldClose)}
              onClose={() => setEditingWidget(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <ReactTooltip 
        id="sidebar-tooltip"
        style={{ 
          backgroundColor: '#1e293b', 
          color: '#fff', 
          borderRadius: '8px', 
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: '500',
          zIndex: 100
        }}
      />
    </div>
  );
}

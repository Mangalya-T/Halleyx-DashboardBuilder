import React from 'react';
import { WidgetConfig } from '../types/dashboard';
import { X, Save, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface WidgetConfigPanelProps {
  widget: WidgetConfig;
  onUpdate: (updates: Partial<WidgetConfig>, shouldClose?: boolean) => void;
  onClose: () => void;
}

const metrics = ['totalAmount', 'unitPrice', 'quantity', 'product', 'status', 'firstName', 'lastName', 'city', 'state', 'country', 'createdBy', 'orderDate'];
const numericMetrics = ['totalAmount', 'unitPrice', 'quantity'];
const aggregations = ['sum', 'avg', 'count'];

const isNumeric = (metric: string) => numericMetrics.includes(metric);

export const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({ widget, onUpdate, onClose }) => {
  const [localWidget, setLocalWidget] = React.useState({
    title: widget.title,
    description: widget.description,
    settings: widget.settings
  });
  const widgetRef = React.useRef(localWidget);

  React.useEffect(() => {
    setLocalWidget({
      title: widget.title,
      description: widget.description,
      settings: widget.settings
    });
  }, [widget.id, widget.title, widget.description, widget.settings]);

  React.useEffect(() => {
    widgetRef.current = localWidget;
  }, [localWidget]);

  // Auto-save when switching widgets or closing
  React.useEffect(() => {
    return () => {
      const hasChanged = 
        widgetRef.current.title !== widget.title ||
        widgetRef.current.description !== widget.description ||
        JSON.stringify(widgetRef.current.settings) !== JSON.stringify(widget.settings);

      if (hasChanged) {
        onUpdate(widgetRef.current, false);
      }
    };
  }, [widget.id, onUpdate, widget.title, widget.description, widget.settings]);

  const handleTopLevelChange = (field: 'title' | 'description', value: string) => {
    setLocalWidget(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setLocalWidget(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, [field]: value } 
    }));
  };

  const handleMetricChange = (metric: string) => {
    const settingsUpdates: any = { metric };
    if (!numericMetrics.includes(metric) && localWidget.settings.aggregation !== 'count') {
      settingsUpdates.aggregation = 'count';
    }
    setLocalWidget(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, ...settingsUpdates } 
    }));
  };

  const handleApply = () => {
    onUpdate(localWidget, true);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="w-80 h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20 shrink-0"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-900">Widget Settings</h3>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* General Section */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">General Info</h4>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Title</label>
              <input 
                type="text" 
                value={localWidget.title}
                onChange={(e) => handleTopLevelChange('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
              <textarea 
                value={localWidget.description || ''}
                onChange={(e) => handleTopLevelChange('description', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-medium h-24 resize-none"
                placeholder="Briefly describe what this widget shows..."
              />
            </div>
          </div>
        </section>

        {/* Data Configuration Section */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Data Config</h4>
          <div className="space-y-4">
            {widget.type === 'KPI' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Metric</label>
                  <select 
                    value={localWidget.settings.metric}
                    onChange={(e) => handleMetricChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    {metrics.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Aggregation</label>
                  <select 
                    value={localWidget.settings.aggregation}
                    onChange={(e) => handleSettingsChange('aggregation', e.target.value)}
                    disabled={!isNumeric(localWidget.settings.metric || '')}
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer ${!isNumeric(localWidget.settings.metric || '') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isNumeric(localWidget.settings.metric || '') ? (
                      aggregations.map(a => (
                        <option key={a} value={a}>
                          {a === 'avg' ? 'Average' : a.charAt(0).toUpperCase() + a.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="count">Count</option>
                    )}
                  </select>
                  {!isNumeric(localWidget.settings.metric || '') && (
                    <p className="text-[10px] text-amber-600 font-medium px-1">Only 'count' is available for non-numeric fields.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Format</label>
                    <select 
                      value={localWidget.settings.format || 'number'}
                      onChange={(e) => handleSettingsChange('format', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                    >
                      <option value="number">Number</option>
                      <option value="currency">Currency ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Precision</label>
                    <input 
                      type="number" 
                      min="0"
                      max="5"
                      value={localWidget.settings.precision !== undefined ? localWidget.settings.precision : 2}
                      onChange={(e) => handleSettingsChange('precision', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            {widget.type === 'TABLE' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Columns</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {metrics.map(m => (
                      <label key={m} className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={(localWidget.settings.columns || []).includes(m)}
                          onChange={(e) => {
                            const currentCols = localWidget.settings.columns || [];
                            const newCols = e.target.checked 
                              ? [...currentCols, m]
                              : currentCols.filter(c => c !== m);
                            handleSettingsChange('columns', newCols);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Sort By</label>
                    <select 
                      value={localWidget.settings.sortBy || 'orderDate'}
                      onChange={(e) => handleSettingsChange('sortBy', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                    >
                      {metrics.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Order</label>
                    <select 
                      value={localWidget.settings.sortOrder || 'desc'}
                      onChange={(e) => handleSettingsChange('sortOrder', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Rows Per Page</label>
                  <select 
                    value={localWidget.settings.pageSize || 10}
                    onChange={(e) => handleSettingsChange('pageSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="5">5 rows</option>
                    <option value="10">10 rows</option>
                    <option value="15">15 rows</option>
                    <option value="20">20 rows</option>
                  </select>
                </div>
              </>
            )}

            {(widget.type === 'BAR' || widget.type === 'LINE' || widget.type === 'AREA' || widget.type === 'SCATTER' || widget.type === 'PIE') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {widget.type === 'SCATTER' ? 'X-Axis' : 'X-Axis / Category'}
                  </label>
                  <select 
                    value={localWidget.settings.xAxis}
                    onChange={(e) => handleSettingsChange('xAxis', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    {metrics.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {widget.type === 'SCATTER' ? 'Y-Axis' : 'Y-Axis / Value'}
                  </label>
                  <select 
                    value={localWidget.settings.yAxis}
                    onChange={(e) => handleSettingsChange('yAxis', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    {metrics.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 ml-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Limit</label>
                    <span title="Limits the number of data points displayed on the chart" className="cursor-help">
                      <Info size={12} className="text-slate-400" />
                    </span>
                  </div>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    placeholder="No limit"
                    value={localWidget.settings.dataLimit || ''}
                    onChange={(e) => handleSettingsChange('dataLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Appearance</h4>
          <div className="space-y-4">
            {(widget.type === 'BAR' || widget.type === 'LINE' || widget.type === 'AREA' || widget.type === 'SCATTER' || widget.type === 'PIE') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={localWidget.settings.color}
                      onChange={(e) => handleSettingsChange('color', e.target.value)}
                      className="w-12 h-12 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer shrink-0"
                    />
                    <input 
                      type="text"
                      value={localWidget.settings.color}
                      onChange={(e) => handleSettingsChange('color', e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-mono uppercase"
                    />
                  </div>
                </div>
                {widget.type !== 'PIE' && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Show X-Axis Labels</label>
                    <input 
                      type="checkbox" 
                      checked={localWidget.settings.showXAxisLabels !== false}
                      onChange={(e) => handleSettingsChange('showXAxisLabels', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                )}
                {widget.type === 'PIE' && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Show Legend</label>
                    <input 
                      type="checkbox" 
                      checked={localWidget.settings.showLegend === true}
                      onChange={(e) => handleSettingsChange('showLegend', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                )}
              </>
            )}

            {widget.type === 'TABLE' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Font Size (px)</label>
                  <input 
                    type="number" 
                    min="8"
                    max="32"
                    value={localWidget.settings.fontSize || 14}
                    onChange={(e) => handleSettingsChange('fontSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Header Background</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={localWidget.settings.headerBgColor}
                      onChange={(e) => handleSettingsChange('headerBgColor', e.target.value)}
                      className="w-12 h-12 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer shrink-0"
                    />
                    <input 
                      type="text"
                      value={localWidget.settings.headerBgColor}
                      onChange={(e) => handleSettingsChange('headerBgColor', e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-sm font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Filters Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Filters</h4>
            <button 
              onClick={() => {
                const newFilters = [...(localWidget.settings.filters || []), { field: 'status', operator: 'equals', value: '' }];
                handleSettingsChange('filters', newFilters);
              }}
              className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
            >
              + Add Filter
            </button>
          </div>
          
          <div className="space-y-3">
            {(localWidget.settings.filters || []).map((filter: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group/filter">
                <button 
                  onClick={() => {
                    const newFilters = localWidget.settings.filters.filter((_: any, i: number) => i !== index);
                    handleSettingsChange('filters', newFilters);
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover/filter:opacity-100 transition-opacity p-1 hover:bg-white rounded-lg"
                >
                  <X size={14} />
                </button>
                
                <div className="space-y-2">
                  <select 
                    value={filter.field}
                    onChange={(e) => {
                      const newFilters = [...localWidget.settings.filters];
                      newFilters[index].field = e.target.value;
                      handleSettingsChange('filters', newFilters);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                  >
                    {metrics.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  
                  <select 
                    value={filter.operator}
                    onChange={(e) => {
                      const newFilters = [...localWidget.settings.filters];
                      newFilters[index].operator = e.target.value as any;
                      handleSettingsChange('filters', newFilters);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="gt">Greater Than</option>
                    <option value="lt">Less Than</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Value..."
                    value={filter.value}
                    onChange={(e) => {
                      const newFilters = [...localWidget.settings.filters];
                      newFilters[index].value = e.target.value;
                      handleSettingsChange('filters', newFilters);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            ))}
            
            {(!localWidget.settings.filters || localWidget.settings.filters.length === 0) && (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No filters applied</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={handleApply}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center space-x-2"
        >
          <Save size={18} />
          <span>Apply Changes</span>
        </button>
      </div>
    </motion.div>
  );
};

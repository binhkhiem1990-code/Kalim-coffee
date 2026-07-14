import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Layers, 
  HelpCircle,
  Activity,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  supplierId: string;
  usagePerOrder?: number;
}

interface InventoryChartsProps {
  inventoryItems: InventoryItem[];
}

export function InventoryCharts({ inventoryItems = [] }: InventoryChartsProps) {
  const [selectedTrendItems, setSelectedTrendItems] = useState<string[]>(['Coffee Beans', 'Oat Milk', 'Fresh Milk', 'Paper Cups']);
  const [timeframe, setTimeframe] = useState<30 | 7>(30);

  // Filter to only display key top coffee shop ingredients on stock level chart to avoid cluttering
  const topIngredients = useMemo(() => {
    const importantIds = ['i1', 'i2', 'i4', 'i12', 'i3', 'i5', 'i11'];
    return inventoryItems.filter(item => importantIds.includes(item.id));
  }, [inventoryItems]);

  // Generate simulated 30 days usage based on date with realistic weekly variance (weekend coffee peaks)
  const masterTrendData = useMemo(() => {
    const data = [];
    const now = new Date('2026-06-15T00:00:00'); // Consistent reference point based on metadata
    
    // Generate trend points
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayOfWeek = d.getDay();
      // Sunday (0) and Saturday (6) have higher coffee shop traffic (peaks)
      const multiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.55 : 0.95;
      
      // Standard random variance +/- 15%
      const randomFactor = (seed: number) => {
        const x = Math.sin(seed + i) * 10000;
        return 0.85 + (x - Math.floor(x)) * 0.3;
      };
      
      const entry: any = {
        date: dateStr,
        key: i,
      };
      
      // Calculate usage for each top item
      inventoryItems.forEach((item, index) => {
        let baseDailyUsage = 1;
        switch (item.id) {
          case 'i1': // Coffee Beans (bags)
            baseDailyUsage = 1.8;
            break;
          case 'i2': // Oat Milk (bottles)
            baseDailyUsage = 4.2;
            break;
          case 'i4': // Paper Cups (pcs)
            baseDailyUsage = 135;
            break;
          case 'i12': // Fresh Milk (bottles)
            baseDailyUsage = 6.4;
            break;
          case 'i3': // Sugar (packets)
            baseDailyUsage = 95;
            break;
          case 'i5': // Caramel Syrup (bottles)
            baseDailyUsage = 0.55;
            break;
          case 'i11': // Lactose-Free Milk (bottles)
            baseDailyUsage = 2.1;
            break;
          default:
            baseDailyUsage = 0.5;
        }
        
        // Add random variation to reflect real-world sales
        const usageVal = Number((baseDailyUsage * multiplier * randomFactor(index)).toFixed(1));
        entry[item.name] = usageVal;
      });
      
      data.push(entry);
    }
    return data;
  }, [inventoryItems]);

  // Handle slice according to timeframes (7 days or 30 days)
  const currentTrendData = useMemo(() => {
    return timeframe === 30 ? masterTrendData : masterTrendData.slice(23);
  }, [masterTrendData, timeframe]);

  // Color mapping to keep style cohesive
  const colorPalette: { [key: string]: string } = {
    'Coffee Beans': '#78350F', // deep brown
    'Oat Milk': '#D97706',    // golden/amber
    'Fresh Milk': '#059669',   // emerald/milk fresh mint
    'Paper Cups': '#1E3A8A',   // royal dark blue
    'Sugar': '#EC4899',        // rose/candy pink
    'Caramel Syrup': '#B45309',// caramel amber outline
    'Lactose Free Milk': '#6366F1' // indigo
  };

  const toggleItemTrend = (itemName: string) => {
    if (selectedTrendItems.includes(itemName)) {
      if (selectedTrendItems.length > 1) {
        setSelectedTrendItems(prev => prev.filter(name => name !== itemName));
      }
    } else {
      setSelectedTrendItems(prev => [...prev, itemName]);
    }
  };

  // Calculate quick stats
  const lowStockCount = inventoryItems.filter(item => item.stock <= item.minStock).length;
  const criticalItem = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => {
      const accRatio = acc ? (acc.stock / acc.minStock) : 999;
      const currRatio = curr.minStock > 0 ? (curr.stock / curr.minStock) : 999;
      return currRatio < accRatio ? curr : acc;
    }, inventoryItems[0]);
  }, [inventoryItems]);

  // Formatting tooltips
  const CustomTooltipTrend = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5 font-sans text-xs">
          <p className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
            <Calendar size={13} className="text-black/40" />
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((pld: any) => (
              <div key={pld.name} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 font-medium text-black/60">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.stroke || pld.fill }} />
                  {pld.name}
                </span>
                <span className="font-mono font-bold text-[#1A1A1A]">
                  {pld.value} {inventoryItems.find(i => i.name === pld.name)?.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-black/5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-[#F8F7F4] rounded-2xl flex items-center justify-center text-black">
            <Package size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Total Items tracked</span>
            <h4 className="text-xl font-black">{inventoryItems.length} Ingredients</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60">Low Stock Warning</span>
            <h4 className={`text-xl font-black ${lowStockCount > 0 ? 'text-rose-600' : 'text-black'}`}>
              {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'} need ordering
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">Most Critical Resource</span>
            <h4 className="text-xl font-black truncate max-w-[180px]">
              {criticalItem ? `${criticalItem.name}` : 'N/A'}
            </h4>
          </div>
        </div>
      </div>

      {/* Bento Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Current Stock Levels (2 Cols equivalent) */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[40px] border border-black/5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-black tracking-tight text-[#1A1A1A]">Ingredient Stock Levels</h3>
              <p className="text-xs text-black/40">Current capacity vs. reorder warning levels</p>
            </div>
            <span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Real-time
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topIngredients}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isLow = data.stock <= data.minStock;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5 font-sans text-xs space-y-1.5">
                          <p className="font-bold text-[#1A1A1A]">{data.name}</p>
                          <div className="flex justify-between gap-4">
                            <span className="text-black/50">Current Stock:</span>
                            <span className="font-bold font-mono text-[#1A1A1A]">{data.stock} {data.unit}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-black/50">Restock Threshold:</span>
                            <span className="font-semibold text-[#1A1A1A]">{data.minStock} {data.unit}</span>
                          </div>
                          <div className="pt-1.5 border-t border-black/5 flex items-center gap-1">
                            {isLow ? (
                              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                <AlertTriangle size={12} /> Under Safety Minimum
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Safe Reserve Level
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="stock" radius={[8, 8, 0, 0]}>
                  {topIngredients.map((entry, index) => {
                    const isLow = entry.stock <= entry.minStock;
                    const baseColor = colorPalette[entry.name] || '#6B7280';
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isLow ? '#EF4444' : baseColor} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] items-center pt-2 justify-center border-t border-black/5">
            <span className="text-black/40 font-bold">LEGEND:</span>
            <div className="flex items-center gap-1.5 text-black/70 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" /> Critical (Stock ≤ Min)
            </div>
            <div className="flex items-center gap-1.5 text-black/70 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-black" /> Safe Threshold Active
            </div>
          </div>
        </div>

        {/* Right Side: Usage Trend Lines (3 Cols equivalent) */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[40px] border border-black/5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp size={20} className="text-amber-500" />
                Consumption & Usage Trends
              </h3>
              <p className="text-xs text-black/40">Continuous stock deduction trends over past weeks</p>
            </div>
            
            {/* Filter Timeframes */}
            <div className="flex p-0.5 bg-black/5 rounded-2xl w-fit self-start sm:self-auto">
              <button 
                onClick={() => setTimeframe(7)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${timeframe === 7 ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeframe(30)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${timeframe === 30 ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Interactive filter checkboxes */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest mr-1">Visible lines:</span>
            {['Coffee Beans', 'Oat Milk', 'Fresh Milk', 'Paper Cups'].map(name => {
              const isSelected = selectedTrendItems.includes(name);
              const color = colorPalette[name];
              return (
                <button
                  key={name}
                  onClick={() => toggleItemTrend(name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isSelected 
                      ? 'bg-black text-white border-black shadow-sm' 
                      : 'bg-white border-black/10 text-black/60 hover:border-black/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? color : 'rgba(0,0,0,0.2)' }} />
                  {name}
                </button>
              );
            })}
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {selectedTrendItems.map(name => (
                    <linearGradient key={`grad-${name}`} id={`color-${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colorPalette[name]} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={colorPalette[name]} stopOpacity={0.0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltipTrend />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }}
                />
                
                {selectedTrendItems.includes('Coffee Beans') && (
                  <Area 
                    type="monotone" 
                    dataKey="Coffee Beans" 
                    stroke={colorPalette['Coffee Beans']} 
                    fillOpacity={1} 
                    fill="url(#color-CoffeeBeans)" 
                    strokeWidth={2.5}
                  />
                )}
                {selectedTrendItems.includes('Oat Milk') && (
                  <Area 
                    type="monotone" 
                    dataKey="Oat Milk" 
                    stroke={colorPalette['Oat Milk']} 
                    fillOpacity={1} 
                    fill="url(#color-OatMilk)" 
                    strokeWidth={2.5}
                  />
                )}
                {selectedTrendItems.includes('Fresh Milk') && (
                  <Area 
                    type="monotone" 
                    dataKey="Fresh Milk" 
                    stroke={colorPalette['Fresh Milk']} 
                    fillOpacity={1} 
                    fill="url(#color-FreshMilk)" 
                    strokeWidth={2.5}
                  />
                )}
                {selectedTrendItems.includes('Paper Cups') && (
                  <Area 
                    type="monotone" 
                    dataKey="Paper Cups" 
                    stroke={colorPalette['Paper Cups']} 
                    fillOpacity={1} 
                    fill="url(#color-PaperCups)" 
                    strokeWidth={2.5}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

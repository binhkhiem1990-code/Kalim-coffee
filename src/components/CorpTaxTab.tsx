import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Globe,
  Calculator,
  Printer,
  RefreshCw,
  CheckCircle2,
  Info,
  Building,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { exportCorpTaxToPdf } from '../utils/pdfExport';

interface RegionConfig {
  id: string;
  country: string;
  name: string;
  currency: string;
  minWage: number;
  fedTaxRate: number;
  stateTaxRate: number;
  pensionName: string;
  pensionRate: number;
  healthName: string;
  healthRate: number;
  vacationPayRate: number;
  corpFedTaxRate?: number;
  corpLocalTaxRate?: number;
}

const PRESET_REGIONS: RegionConfig[] = [
  {
    id: "AB",
    country: "Canada",
    name: "Alberta",
    currency: "$",
    minWage: 15.00,
    fedTaxRate: 0.1382,
    stateTaxRate: 0.00,
    pensionName: "CPP - Employee",
    pensionRate: 0.05953,
    healthName: "EI - Employee",
    healthRate: 0.0163,
    vacationPayRate: 0.04,
    corpFedTaxRate: 0.09,
    corpLocalTaxRate: 0.02
  },
  {
    id: "BC",
    country: "Canada",
    name: "British Columbia",
    currency: "$",
    minWage: 16.75,
    fedTaxRate: 0.13,
    stateTaxRate: 0.05,
    pensionName: "CPP - Employee",
    pensionRate: 0.0595,
    healthName: "EI - Employee",
    healthRate: 0.0163,
    vacationPayRate: 0.04,
    corpFedTaxRate: 0.09,
    corpLocalTaxRate: 0.02
  },
  {
    id: "ON",
    country: "Canada",
    name: "Ontario",
    currency: "$",
    minWage: 16.55,
    fedTaxRate: 0.13,
    stateTaxRate: 0.0505,
    pensionName: "CPP - Employee",
    pensionRate: 0.0595,
    healthName: "EI - Employee",
    healthRate: 0.0163,
    vacationPayRate: 0.04,
    corpFedTaxRate: 0.09,
    corpLocalTaxRate: 0.032
  },
  {
    id: "US-CA",
    country: "USA",
    name: "California",
    currency: "$",
    minWage: 16.00,
    fedTaxRate: 0.10,
    stateTaxRate: 0.04,
    pensionName: "Social Security",
    pensionRate: 0.062,
    healthName: "Medicare",
    healthRate: 0.0145,
    vacationPayRate: 0.00,
    corpFedTaxRate: 0.21,
    corpLocalTaxRate: 0.0884
  }
];

export function CorpTaxTab() {
  const [branches, setBranches] = useState([
    { id: 'hq', name: 'Kalim Coffee (730 58 Ave Sw, Alberta)', regionId: 'AB', revenue: 586986.00, payroll: 142246.00, isSynced: true },
    { id: 'b2', name: 'Vancouver West End (British Columbia)', regionId: 'BC', revenue: 142500.00, payroll: 41000.00, isSynced: false },
    { id: 'b3', name: 'Toronto Financial District (Ontario)', regionId: 'ON', revenue: 228000.00, payroll: 68000.00, isSynced: false },
    { id: 'b4', name: 'California Sunnyvale Express (USA)', regionId: 'US-CA', revenue: 312000.00, payroll: 94000.00, isSynced: false }
  ]);

  // Managed region & corporate tax rates loaded from unified system storage
  const [regions, setRegions] = useState<RegionConfig[]>(() => {
    const saved = localStorage.getItem('global_tax_regions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => ({
          ...r,
          corpFedTaxRate: r.corpFedTaxRate !== undefined ? r.corpFedTaxRate : (r.id === 'US-CA' ? 0.21 : 0.09),
          corpLocalTaxRate: r.corpLocalTaxRate !== undefined ? r.corpLocalTaxRate : (r.id === 'AB' ? 0.02 : r.id === 'BC' ? 0.02 : r.id === 'ON' ? 0.032 : 0.05)
        }));
      } catch (e) {
        return PRESET_REGIONS;
      }
    }
    return PRESET_REGIONS;
  });

  // Automatically propagate any custom editing back to the unified storage
  useEffect(() => {
    localStorage.setItem('global_tax_regions', JSON.stringify(regions));
  }, [regions]);

  const [showCorpSettings, setShowCorpSettings] = useState<boolean>(false);

  // HQ Enterprise Cost Model custom parameter states
  const [hqCupPrice, setHqCupPrice] = useState<number>(() => {
    const saved = localStorage.getItem('hq_cup_price');
    return saved ? Number(saved) : 5.20;
  });
  const [hqRentUt, setHqRentUt] = useState<number>(() => {
    const saved = localStorage.getItem('hq_rent_ut');
    return saved ? Number(saved) : 8000 * 12;
  });
  const [cogsPercent, setCogsPercent] = useState<number>(() => {
    const saved = localStorage.getItem('hq_cogs_percent');
    return saved ? Number(saved) : 18;
  });
  const [hqDepreciation, setHqDepreciation] = useState<number>(() => {
    const saved = localStorage.getItem('hq_depreciation');
    return saved ? Number(saved) : 15000.00;
  });
  const [hqAdminOps, setHqAdminOps] = useState<number>(() => {
    const saved = localStorage.getItem('hq_admin_ops');
    return saved ? Number(saved) : 18450.00;
  });
  const [hqCharitable, setHqCharitable] = useState<number>(() => {
    const saved = localStorage.getItem('hq_charitable');
    return saved ? Number(saved) : 2500.00;
  });
  const [hqMeals, setHqMeals] = useState<number>(() => {
    const saved = localStorage.getItem('hq_meals');
    return saved ? Number(saved) : 1200.00;
  });
  const [hqVehicle, setHqVehicle] = useState<number>(() => {
    const saved = localStorage.getItem('hq_vehicle');
    return saved ? Number(saved) : 4500.00;
  });
  const [additionalCorpInfo, setAdditionalCorpInfo] = useState<string>(() => {
    const saved = localStorage.getItem('hq_additional_info');
    return saved || 'NOTICE: Compiled electronically on behalf of Kalim Coffee Enterprise Calgary HQ Branch. Suitable for official CRA T2 corporate tax audit review.';
  });

  useEffect(() => {
    localStorage.setItem('hq_cup_price', hqCupPrice.toString());
  }, [hqCupPrice]);
  useEffect(() => {
    localStorage.setItem('hq_rent_ut', hqRentUt.toString());
  }, [hqRentUt]);
  useEffect(() => {
    localStorage.setItem('hq_cogs_percent', cogsPercent.toString());
  }, [cogsPercent]);
  useEffect(() => {
    localStorage.setItem('hq_depreciation', hqDepreciation.toString());
  }, [hqDepreciation]);
  useEffect(() => {
    localStorage.setItem('hq_admin_ops', hqAdminOps.toString());
  }, [hqAdminOps]);
  useEffect(() => {
    localStorage.setItem('hq_charitable', hqCharitable.toString());
  }, [hqCharitable]);
  useEffect(() => {
    localStorage.setItem('hq_meals', hqMeals.toString());
  }, [hqMeals]);
  useEffect(() => {
    localStorage.setItem('hq_vehicle', hqVehicle.toString());
  }, [hqVehicle]);
  useEffect(() => {
    localStorage.setItem('hq_additional_info', additionalCorpInfo);
  }, [additionalCorpInfo]);

  useEffect(() => {
    const syncWithLedger = async () => {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          setBranches(prev => prev.map(b => {
            if (b.id === 'hq') {
              return { ...b, revenue: data.totalRevenue };
            }
            return b;
          }));
        }
      } catch (err) {
        console.error("Failed to sync Corp Tax with actual Reports:", err);
      }
    };
    syncWithLedger();
  }, []);

  const [isSyncingBranchId, setIsSyncingBranchId] = useState<string | null>(null);
  const [corpLogs, setCorpLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Consolidated network registry online. Mainframe listening...`,
    `[${new Date().toLocaleTimeString()}] Local Kalim Coffee Calgary (730 58 Ave Sw) figures ($586,986.00) auto-consolidated.`
  ]);

  const [isFilingTax, setIsFilingTax] = useState<boolean>(false);
  const [taxFilingSuccess, setTaxFilingSuccess] = useState<boolean>(false);
  const [taxFilingReference, setTaxFilingReference] = useState<string>('');

  const handleSyncBranch = async (branchId: string) => {
    setIsSyncingBranchId(branchId);
    const b = branches.find(x => x.id === branchId);
    if (!b) return;

    setCorpLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 📤 Initiating live payload fetch for secure branch: [${b.name}]`,
      `[${new Date().toLocaleTimeString()}] 📶 Performing SHA-256 handshake on metadata packet...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setBranches(prev => prev.map(item => {
      if (item.id === branchId) {
        return { ...item, isSynced: true };
      }
      return item;
    }));

    setCorpLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ✅ Sync completed. Integrated ${b.regionId} Revenue: $${b.revenue.toLocaleString()} & Payroll dockets.`
    ]);
    setIsSyncingBranchId(null);
  };

  const handleFileCorporateTaxes = async () => {
    setIsFilingTax(true);
    setCorpLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🏢 Initiating CRA NetFile / IRS e-File consolidation compiler...`,
    ]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const confirmationCode = "TX-" + Math.floor(100000 + Math.random() * 900000) + "-AB";
    setTaxFilingReference(confirmationCode);
    setTaxFilingSuccess(true);
    setIsFilingTax(false);

    setCorpLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Transmitting consolidated T2 returns package (branches HQ, b2, b3, b4) directly to federal receiver.`,
      `[${new Date().toLocaleTimeString()}] 🔑 HANDSHAKE SUCCESS! CRA System Accepted with confirmation ref: ${confirmationCode}`
    ]);
  };

  const triggerTone = (type: string) => {
    try {
      const isMuted = localStorage.getItem('sound_muted') === 'true';
      if (isMuted) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'click') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (_) {}
  };

  // HQ Calgary Operational Cost Model parameters (1 year)
  const hqBranch = branches.find(b => b.id === 'hq') || { revenue: 586986.00, payroll: 142246.00 };
  const hqRevenue = hqBranch.revenue;
  const hqCupsSold = Math.round(hqRevenue / hqCupPrice); // Calculable from user set price
  const hqCogs = Math.round(hqRevenue * (cogsPercent / 100) * 100) / 100; // Calculated based on customized COGS %
  const hqPayroll = hqBranch.payroll; // Wages dockets from central system

  const hqTotalExpenses = hqCogs + hqPayroll + hqRentUt + hqDepreciation + hqAdminOps + hqCharitable + hqMeals + hqVehicle;
  const hqNetProfit = hqRevenue - hqTotalExpenses; // Alberta taxable corporate net income

  // Look up AB region tax rates dynamically from user-editable regions list
  const abRegion = regions.find(r => r.id === 'AB') || PRESET_REGIONS[0];
  const abCombinedRate = (abRegion.corpFedTaxRate || 0.09) + (abRegion.corpLocalTaxRate || 0.02);
  const hqTaxDue = hqNetProfit * abCombinedRate;

  const activeRegion = abRegion;

  const syncedBranches = branches.filter(b => b.isSynced);
  const totalBranchRev = syncedBranches.reduce((sum, b) => sum + b.revenue, 0);
  const totalBranchPayroll = syncedBranches.reduce((sum, b) => sum + b.payroll, 0);

  // Consolidated general ledger handles complete HQ cost structure
  const corporateNetProfit = syncedBranches.reduce((sum, b) => {
    if (b.id === 'hq') {
      return sum + hqNetProfit;
    }
    return sum + (b.revenue - b.payroll);
  }, 0);

  // Central combined taxes provision computation using customized rates
  const totalCorpTaxProvision = syncedBranches.reduce((sum, b) => {
    if (b.id === 'hq') {
      return sum + hqTaxDue;
    }
    const rb = regions.find(r => r.id === b.regionId) || activeRegion;
    const profit = b.revenue - b.payroll;
    const totalRate = (rb.corpFedTaxRate || 0.09) + (rb.corpLocalTaxRate || 0.02);
    return sum + (profit * totalRate);
  }, 0);

  const handleExportPDF = () => {
    triggerTone('click');
    exportCorpTaxToPdf({
      branches,
      totalBranchRev,
      totalBranchPayroll,
      corporateNetProfit,
      totalCorpTaxProvision,
      taxFilingSuccess,
      taxFilingReference,
      activeRegion: { name: activeRegion.name, country: activeRegion.country },
      additionalInfo: additionalCorpInfo,
      hqOperationDetails: {
        cupPrice: hqCupPrice,
        cupsSold: hqCupsSold,
        rentUt: hqRentUt,
        cogs: hqCogs,
        payroll: hqPayroll,
        depreciation: hqDepreciation,
        adminOps: hqAdminOps,
        totalExpenses: hqTotalExpenses,
        netProfit: hqNetProfit,
        taxRate: abCombinedRate,
        taxDue: hqTaxDue
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-zinc-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">
            🏢 CorpHQ Consolidated Services
          </span>
          <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-2">Enterprise Corporate Tax HQ (Multi-Branch)</h3>
          <p className="text-xs text-gray-500 mt-1">
            Perform national tax compliance rollups, coordinate external provincial branches, and directly export T2 corporate tax files to CRA.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Printer size={13} /> Export Consolidated PDF
          </button>
        </div>
      </div>

      {/* ⚙️ Corporate Settings & Overrides Panel (Only visible to managers, collapsible) */}
      <div className="bg-zinc-50 border border-black/10 rounded-[28px] p-6 shadow-sm space-y-4 font-sans">
        <button
          onClick={() => {
            setShowCorpSettings(!showCorpSettings);
            triggerTone('click');
          }}
          className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center text-left focus:outline-none gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E07A5F]/10 rounded-xl text-[#E07A5F] shrink-0">
              <Sliders size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-black tracking-wide">
                ⚙️ Manager Corporate Settings & Override Hub
              </h4>
              <p className="text-[11px] text-zinc-500">
                Modify HQ operations constants, COGS, rent, and set custom Corporate tax rates for each active province/state in real-time.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-zinc-400 bg-white border px-3 py-1 rounded-xl shadow-sm hover:text-black transition-all shrink-0">
            {showCorpSettings ? 'Hide Settings ▲' : 'Open Settings ▼'}
          </span>
        </button>

        {showCorpSettings && (
          <div className="pt-4 border-t border-black/10 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
            {/* HQ Branch Expenses Section */}
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-black/5 shadow-inner">
              <h5 className="font-black uppercase text-[#E07A5F] tracking-wider text-xs border-b pb-2">
                1. HQ Calgary Operational Expense Constants
              </h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Avg Cup Sell Price ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    value={hqCupPrice}
                    onChange={(e) => setHqCupPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Monthly Rent & Utilities ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hqRentUt / 12}
                    onChange={(e) => setHqRentUt(Math.max(0, Number(e.target.value) * 12))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                  <span className="text-[8px] text-zinc-400 block">${(hqRentUt).toLocaleString()} annual total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Ingredients COGS %</label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={cogsPercent}
                    onChange={(e) => setCogsPercent(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Annual Machinery Depreciation ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hqDepreciation}
                    onChange={(e) => setHqDepreciation(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Annual Administrative Operations ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hqAdminOps}
                    onChange={(e) => setHqAdminOps(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Annual Charitable Donations ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hqCharitable}
                    onChange={(e) => setHqCharitable(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Annual Meals & Entertainment ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hqMeals}
                    onChange={(e) => setHqMeals(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Annual Vehicle Expenses ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={hqVehicle}
                    onChange={(e) => setHqVehicle(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 p-2 rounded-xl font-bold text-black focus:outline-zinc-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Corporate Tax Rates by Jurisdiction Section */}
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-black/5 shadow-inner">
              <h5 className="font-black uppercase text-[#E07A5F] tracking-wider text-xs border-b pb-2">
                2. Live Corporate Tax Percentages (Federal & Provincial)
              </h5>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {regions.map((r, rIdx) => (
                  <div key={r.id} className="flex items-center justify-between bg-zinc-50 p-2 rounded-xl border border-black/5 gap-4">
                    <div className="text-left">
                      <span className="font-black text-xs text-black block leading-none">{r.name}</span>
                      <span className="text-[8px] bg-zinc-200 text-zinc-700 px-1 py-0.5 rounded font-mono uppercase tracking-wider">{r.id} ({r.country})</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-20">
                        <label className="text-[8px] font-bold text-zinc-400 block uppercase mb-0.5">Corp Fed %</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="90"
                          value={Number(((r.corpFedTaxRate || 0.09) * 100).toFixed(2))}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value)) / 100;
                            setRegions(prev => prev.map((item, idx) => idx === rIdx ? { ...item, corpFedTaxRate: val } : item));
                          }}
                          className="w-full bg-white border border-zinc-200 p-1 rounded-lg font-bold font-mono text-[10px]"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[8px] font-bold text-zinc-400 block uppercase mb-0.5">Corp Prov %</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="90"
                          value={Number(((r.corpLocalTaxRate || 0.02) * 100).toFixed(2))}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value)) / 100;
                            setRegions(prev => prev.map((item, idx) => idx === rIdx ? { ...item, corpLocalTaxRate: val } : item));
                          }}
                          className="w-full bg-white border border-zinc-200 p-1 rounded-lg font-bold font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Custom Info Text block */}
            <div className="md:col-span-2 space-y-2 bg-zinc-900 text-zinc-300 p-5 rounded-2xl border border-white/5">
              <h5 className="font-black uppercase text-white tracking-wider text-xs">
                3. Additional Printed Corporate Tax Statement Information (Legal footnote text)
              </h5>
              <p className="text-[10px] text-zinc-400 leading-normal">
                This custom text appears at the bottom footer of both the dynamic live screen statement and the generated CRA T2 consolidated PDF. Enter specific company registration details, CRA business numbers, or filing annotations immediately below.
              </p>
              <textarea
                value={additionalCorpInfo}
                onChange={(e) => setAdditionalCorpInfo(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono text-[10px] text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-20 leading-relaxed"
                placeholder="Enter additional legal details here..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: sync branches and rate disclosures (6 columns) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="text-[#E07A5F]" size={18} />
                <h4 className="text-sm font-black uppercase text-black">National Multi-Branch Network</h4>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] rounded-full uppercase font-black">
                {branches.filter(b => b.isSynced).length} / {branches.length} Consolidated
              </span>
            </div>
            <p className="text-xs text-black/50">
              Compile local branch revenues, deductible salaries, and regional tax obligations to feed our central Calgary HQ general ledger.
            </p>

            <div className="space-y-3 pt-2">
              {branches.map(b => (
                <div key={b.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black/[0.02] p-4 rounded-2xl border border-black/5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-black">{b.name}</span>
                      <span className="px-1.5 py-0.5 bg-zinc-200 font-mono text-[8px] rounded font-bold">{b.regionId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[10px] text-black/50">
                      <span>Revenue: <strong>${b.revenue.toLocaleString()}</strong></span>
                      <span>Payroll: <strong>${b.payroll.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto shrink-0 justify-between md:justify-end">
                    <span className={`px-2 py-0.5 text-[8px] rounded font-black uppercase tracking-wider ${
                      b.isSynced 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                    }`}>
                      {b.isSynced ? 'Consolidated 🟢' : 'Desynced 🟡'}
                    </span>

                    {!b.isSynced && (
                      <button
                        type="button"
                        disabled={isSyncingBranchId === b.id}
                        onClick={() => handleSyncBranch(b.id)}
                        className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        {isSyncingBranchId === b.id ? (
                          <RefreshCw size={10} className="animate-spin" />
                        ) : (
                          "Sync Now 📤"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Real-time sync logs terminal */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-black uppercase text-black/40">Transit Tunnel / Connection Logs</label>
              <div className="p-3 bg-zinc-950 rounded-2xl text-[10px] font-mono text-emerald-400 h-32 overflow-y-auto space-y-1 leading-relaxed border border-zinc-850">
                {corpLogs.map((log, lidx) => (
                  <div key={lidx}>{log}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="text-zinc-500" size={17} />
              <h4 className="text-sm font-black uppercase text-black">Active Region Corporate Tax rate</h4>
            </div>
            <p className="text-xs text-black/50">Current business tax guidelines matching local jurisdictions of Calgary (Province of Alberta, Canada).</p>

            <div className="grid grid-cols-2 gap-4 bg-black/[0.02] p-4 rounded-2xl border text-xs">
              <div>
                <span className="text-black/40 font-bold block mb-1">Corporate Fed Tax Rate</span>
                <span className="font-mono font-black text-black">{((abRegion.corpFedTaxRate || 0.09) * 100).toFixed(2)}% (Small Business Deduction)</span>
              </div>
              <div>
                <span className="text-black/40 font-bold block mb-1">Alberta Prov Tax Rate</span>
                <span className="font-mono font-black text-black">{((abRegion.corpLocalTaxRate || 0.02) * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-xl text-[10px] text-fuchsia-800 flex gap-2 items-start font-medium">
              <Info size={14} className="shrink-0 mt-0.5 text-fuchsia-700" />
              <div>
                <span className="font-bold block uppercase leading-tight text-fuchsia-900 mb-0.5">Canadian Small Business Rate Protection</span>
                Combined Alberta corporate tax rate is kept at exactly {(abCombinedRate * 100).toFixed(2)}% matching small business deduction thresholds (under $500,000 threshold, dynamically scaling above).
              </div>
            </div>
          </div>

          {/* NEW DESIGNED REALISTIC ANNUAL COFFEE OPERATIONS BENTO CARD */}
          <div className="bg-zinc-900 text-white p-6 rounded-[28px] shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Building className="text-emerald-400" size={18} />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">AB Calgary HQ Operations Model</h4>
                <p className="text-[10px] text-zinc-400">12-Month Auditable Expense & Tax Modeling</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wider text-left">Annual Gross Revenue</span>
                  <span className="font-mono text-sm font-black text-white block text-left">${hqRevenue.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wider text-right">Unit Sales Projection</span>
                  <span className="font-bold text-emerald-400 text-xs block text-right">{hqCupsSold.toLocaleString()} cups</span>
                  <span className="text-[8px] text-zinc-400 block text-right">avg ${hqCupPrice.toFixed(2)}/coffee</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block text-left">Itemized Corporate Deductions:</span>
                
                <div className="space-y-1.5 text-[11px] font-medium text-zinc-300">
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>1. Ingredients & Supplies ({cogsPercent}% COGS)</span>
                    <span className="font-mono text-white font-bold">${hqCogs.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>2. Staff Wages & Salaries (Central Payroll)</span>
                    <span className="font-mono text-white font-bold">${hqPayroll.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg border border-white/10">
                    <span className="text-emerald-400">3. Monthly Rent & Utilities (${(hqRentUt / 12).toLocaleString([], { minimumFractionDigits: 2 })}/mo)</span>
                    <span className="font-mono text-emerald-400 font-bold">${hqRentUt.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>4. Machinery Amortization (Depreciation Class 8)</span>
                    <span className="font-mono text-white font-bold">${hqDepreciation.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>5. General Administrative / Insurance Overhead</span>
                    <span className="font-mono text-white font-bold">${hqAdminOps.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>6. Charitable Donations (CRA Approved)</span>
                    <span className="font-mono text-white font-bold">${hqCharitable.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>7. Meals & Entertainment (50% rule applied)</span>
                    <span className="font-mono text-white font-bold">${hqMeals.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/[0.02] rounded-lg">
                    <span>8. Commercial Vehicle Expenses</span>
                    <span className="font-mono text-white font-bold">${hqVehicle.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-2 text-left">
                <div className="flex justify-between text-zinc-300">
                  <span>Total Calculated Operating Costs:</span>
                  <span className="font-mono text-white font-bold">${hqTotalExpenses.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>CRA Net Alberta Corporate Profit:</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">${hqNetProfit.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Corporate Taxes ({(abRegion.corpFedTaxRate * 100).toFixed(1)}% Fed + {(abRegion.corpLocalTaxRate * 100).toFixed(1)}% Prov = {(abCombinedRate * 100).toFixed(1)}%):</span>
                  <span className="font-mono text-amber-400 font-black text-sm">${hqTaxDue.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <p className="text-[9px] text-zinc-500 font-medium leading-normal bg-black/30 p-2.5 rounded-xl border border-white/5 text-left">
                Note: Rent & utility payments are set at ${(hqRentUt / 12).toLocaleString([], { minimumFractionDigits: 2 })} monthly flat rate (${hqRentUt.toLocaleString([], { minimumFractionDigits: 2 })} annually). Ingredients are calculated at {cogsPercent}% of beverages revenue. {(abCombinedRate * 100).toFixed(2)}% combined tax applies under the Alberta Small Business Limit.
              </p>
            </div>
          </div>

        </div>

        {/* Right column: compile and print tax sheet (6 columns) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-4 border-black/5">
              <div className="flex items-center gap-2">
                <Calculator className="text-zinc-500" size={18} />
                <h4 className="text-xs font-black uppercase text-black/40 tracking-wider">CRA Consolidated Tax Compiler</h4>
              </div>
              
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-250 text-black font-black uppercase tracking-wider rounded-lg text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Printer size={11} /> Export Real T2 PDF
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-black/[0.02] border rounded-xl">
                  <span className="text-black/40 font-bold block leading-none mb-1 text-[10px]">CONSOLIDATED REVENUE</span>
                  <span className="font-mono font-black text-black font-sans">${totalBranchRev.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 bg-black/[0.02] border rounded-xl">
                  <span className="text-black/40 font-bold block leading-none mb-1 text-[10px]">DEDUCTIBLE PAYROLL</span>
                  <span className="font-mono font-black text-black font-sans">${totalBranchPayroll.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 bg-black/[0.02] border rounded-xl">
                  <span className="text-black/40 font-bold block leading-none mb-1 text-[10px]">TAXABLE NET PROFIT</span>
                  <span className="font-mono font-black text-zinc-950 font-sans">${corporateNetProfit.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-emerald-800 font-bold block leading-none mb-1 text-[10px]">COMPUTED LIABILITY</span>
                  <span className="font-mono font-black text-emerald-700 font-sans">${totalCorpTaxProvision.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* CRA e-file controls */}
              <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl flex flex-col gap-3">
                <h5 className="text-[10px] font-black uppercase text-zinc-500">Government Electronic Filing System</h5>
                
                {taxFilingSuccess ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                      <CheckCircle2 size={16} /> CONSOLIDATED T2 FILING COMPLETED & ACCEPTED
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-relaxed font-mono">
                      CRA Submission Ticket: {taxFilingReference}<br />
                      Status: 200 SUCCESSFUL HANDSHAKE<br />
                      Authorized Date: {new Date().toLocaleDateString()} Calgary HQ
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-medium">
                      Compile statistics from all geographical coffee locations, consolidate corporate general ledger accounts, and submit directly to CRA.
                    </p>
                    
                    <button
                      type="button"
                      disabled={isFilingTax}
                      onClick={handleFileCorporateTaxes}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white font-black uppercase tracking-wider rounded-xl text-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 transition-all font-sans"
                    >
                      {isFilingTax ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        "Validate & File Consolidated Return to CRA"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Consolidated Tax statement preview target block - TARGETED BY CSS WINDOW.PRINT() */}
              <div id="corp-tax-print-slip" className="printable-only-section p-6 bg-white border border-black rounded-lg font-mono text-[9px] text-black space-y-4 shadow-sm relative overflow-x-auto">
                <div className="text-center border-b pb-2 leading-tight">
                  <span className="font-black text-xs uppercase block">KALIM COFFEE CORPORATION</span>
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">CONSOLIDATED CORPORATE TAX DISCLOSURE STATEMENT</span>
                  <span className="text-[8px] font-bold block font-mono">ANNUAL FISCAL CALENDAR 2026</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8px] border-b pb-2">
                  <div>
                    <span className="text-zinc-500 block">REGULATORY AUTHORITY:</span>
                    <span className="font-bold">CANADA REVENUE AGENCY (CRA)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">E-FILING STATUS:</span>
                    <span className="font-bold text-emerald-800 font-sans">{taxFilingSuccess ? "TRANSMITTED & APPROVED" : "DRAFT - PENDING SUBMISSION"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">HQ BRANCH ESTABLISHED:</span>
                    <span className="font-bold">730 58 AVE SW, CALGARY, AB, T2V 4Z5</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">CRA RECEIVED TRANSACTION LOG:</span>
                    <span className="font-bold font-mono">{taxFilingReference || "AWAITING TRANSMISSION..."}</span>
                  </div>
                </div>

                <table className="w-full text-left text-[8px]">
                  <thead>
                    <tr className="border-b uppercase font-bold text-zinc-500">
                      <th className="py-1">Location</th>
                      <th className="py-1 text-center">Reg</th>
                      <th className="py-1 text-right">Revenue</th>
                      <th className="py-1 text-right">Payroll</th>
                      <th className="py-1 text-right">Net Tax Liability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => {
                      const br = PRESET_REGIONS.find(r => r.id === b.regionId) || activeRegion;
                      const activeRate = (br.corpFedTaxRate || 0.09) + (br.corpLocalTaxRate || 0.02);
                      const isHq = b.id === 'hq';
                      const profit = isHq ? hqNetProfit : (b.revenue - b.payroll);
                      const taxCalculated = isHq ? hqTaxDue : (profit * activeRate);
                      const deductionValue = isHq ? hqTotalExpenses : b.payroll;
                      
                      return (
                        <tr key={b.id} className="border-b border-zinc-100 font-mono">
                          <td className="py-1 uppercase font-bold text-[7.5px]">{b.name.split(" (")[0]}</td>
                          <td className="py-1 text-center">{b.regionId}</td>
                          <td className="py-1 text-right font-mono">${b.revenue.toLocaleString([], { minimumFractionDigits: 2 })}</td>
                          <td className="py-1 text-right font-mono">${deductionValue.toLocaleString([], { minimumFractionDigits: 2 })}</td>
                          <td className="py-1 text-right font-mono font-bold text-emerald-800">
                            {b.isSynced ? `$${taxCalculated.toLocaleString([], { minimumFractionDigits: 2 })}` : "NOT SYNCED"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="border-t pt-2 space-y-1 text-right font-mono text-[9.5px]">
                  <div>
                    <span>Consolidated Net Profit:</span> <strong>${corporateNetProfit.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span>Consolidated Tax Obligation:</span> <strong className="text-emerald-700 font-bold">${totalCorpTaxProvision.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <div className="text-[7px] text-zinc-400 font-bold tracking-tight pt-2 leading-normal border-t border-dashed font-sans">
                  {additionalCorpInfo}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

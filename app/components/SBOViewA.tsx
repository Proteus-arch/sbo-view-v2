'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  Landmark, Sparkles, Tag, Building2, ChevronDown, RefreshCw, AlertTriangle, Info,
  CheckCircle, TrendingUp, TrendingDown, Clock, Shield, Calendar, DollarSign,
  Activity, Scale, PieChart as PieIcon, SlidersHorizontal, ListChecks, HelpCircle,
  ArrowRight, Target, AlertOctagon, FileText, LayoutGrid, Users, BarChart3
} from 'lucide-react';

// =====================================================================
// 1. DATA DICTIONARIES & SECTOR HANDSHAKE REGISTRIES
// =====================================================================
const NAICS_REGISTRY: Record<string, string[]> = {
  "54": ["541512", "541511", "541110", "541211", "541330"],
  "72": ["722511", "722513", "721110"],
  "23": ["236115", "236116", "236220", "238210"],
  "44": ["441110", "441310", "444110", "445110"]
};

const NAICS_NAMES: Record<string, string> = {
  "541512": "Computer Systems Design Services", "541511": "Custom Computer Programming",
  "541110": "Legal Counsel & Advocacy", "541211": "Certified Public Accountants (CPA)",
  "541330": "Engineering Consulting", "722511": "Full-Service Restaurant Operations",
  "722513": "Limited-Service Eating Places", "721110": "Hotels & Traveler Accommodation",
  "236115": "Single-Family Housing Construction", "236116": "Multi-Family Residential Building",
  "236220": "Commercial Building Construction", "238210": "Electrical Contractors & Wiring",
  "441110": "New Car Dealership Networks", "441310": "Automotive Parts & Accessories",
  "444110": "Home Improvement Material Hubs", "445110": "Supermarkets & Grocery Channels"
};

// =====================================================================
// 2. EXPLICIT INTERFACE BLUEPRINTS
// =====================================================================
interface IRCAlert {
  id: string; section: string; title: string; text: string; priority: string; effective_date: string;
}

interface TelemetryChartCardProps {
  title: string; userNum: number; userDen: number; indNum: number; indDen: number;
  userRatio: number; indRatio: number; numLabel: string; denLabel: string; unit: string;
  controls: Array<{ id: string; title: string; description: string; effort: string }>;
}

// =====================================================================
// 3. NUMERATOR & DENOMINATOR TELEMETRY CARD WITH INTERNAL CONTROLS
// =====================================================================
const TelemetryChartCard: React.FC<TelemetryChartCardProps> = ({
  title, userNum, userDen, indNum, indDen, userRatio, indRatio, numLabel, denLabel, unit, controls
}) => {
  const chartData = [
    { name: 'Your Company', [numLabel]: parseFloat(userNum.toFixed(0)), [denLabel]: parseFloat(userDen.toFixed(0)) },
    { name: 'Sector Benchmark', [numLabel]: parseFloat(indNum.toFixed(0)), [denLabel]: parseFloat(indDen.toFixed(0)) }
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Component-Level Value Breakdown</p>
        </div>
        <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-gray-500">Calculated Output Ratio</div>
          <div className="text-lg font-black text-violet-400">
            {userRatio.toFixed(2)}{unit} <span className="text-xs text-gray-500 font-medium">vs {indRatio.toFixed(2)}{unit}</span>
          </div>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" stroke="#4b5563" fontSize={10} fontStyle="bold" />
            <YAxis stroke="#4b5563" fontSize={10} fontStyle="bold" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Bar dataKey={numLabel} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey={denLabel} fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-800/60">
        <div className="text-[10px] uppercase tracking-wider font-black text-gray-400 flex items-center gap-1">
          <Shield size={12} className="text-violet-400" /> Prescribed Risk Control Actions
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {controls.map((ctrl) => (
            <div key={ctrl.id} className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{ctrl.title}</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-gray-900 border border-gray-700 text-gray-400 rounded-full font-black uppercase">{ctrl.effort}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{ctrl.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// 4. MAIN EXECUTIVE SUITE CORE APPLICATION
// =====================================================================
export default function SBOView() {
  const [sectorKey, setSectorKey] = useState<string>("54");
  const [naicsCode, setNaicsCode] = useState<string>("541512");
  const [zipCode, setZipCode] = useState<string>("60611");

  const [taxAlerts, setTaxAlerts] = useState<IRCAlert[]>([]);
  const [industryProfile, setIndustryProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Simulation Lab Adjustments
  const [simRevenueChange, setSimRevenueChange] = useState<number>(0);
  const [simOpexReduction, setSimOpexReduction] = useState<number>(0);
  const [simCollectionSpeedup, setSimCollectionSpeedup] = useState<number>(0);

  const baseLedger = {
    cashOnHand: 84000, monthlyBurn: 14000, currentAssets: 195000, currentLiabilities: 110000,
    totalLiabilities: 145000, totalEquity: 220000, grossRevenueYTD: 540000, cogsYTD: 243000,
    opexYTD: 198000, accountsReceivableYTD: 68000, accountsReceivableTTM: 88000, grossRevenueTTM: 710000
  };

  const handleSectorChange = (sector: string) => {
    setSectorKey(sector);
    const options = NAICS_REGISTRY[sector];
    if (options && options.length > 0) setNaicsCode(options[0]);
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/irc/alerts');
        if (res.ok) {
          const data = await res.json();
          setTaxAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error("Alerts pipeline sync breakdown.", err);
      }
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (zipCode.length === 5) {
        setIsLoading(true);
        setFetchError(null);
        try {
          const res = await fetch(`/api/industry/profile?naics=${naicsCode}&zip=${zipCode}`);
          if (!res.ok) throw new Error("Upstream industrial data node unreachable.");
          const payload = await res.json();
          setIndustryProfile(payload);
        } catch (err: any) {
          setFetchError(err.message || 'Macro data synchronization loop failure.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchProfile();
  }, [naicsCode, zipCode]);

  // Dynamic Ratio Calculations Matrix Engine
  const pipelineState = useMemo(() => {
    const revMultiplier = 1 + simRevenueChange / 100;
    const opexMultiplier = 1 - simOpexReduction / 100;

    const simRevenue = baseLedger.grossRevenueYTD * revMultiplier;
    const simOpex = baseLedger.opexYTD * opexMultiplier;
    const simCogs = baseLedger.cogsYTD;

    const simNetProfit = simRevenue - simCogs - simOpex;
    const baseDsoYtd = (baseLedger.accountsReceivableYTD / baseLedger.grossRevenueYTD) * 365;
    const baseDsoTtm = (baseLedger.accountsReceivableTTM / baseLedger.grossRevenueTTM) * 365;
    
    const simDso = Math.max(10, baseDsoYtd - simCollectionSpeedup);
    const simAR = (simDso * simRevenue) / 365;

    const cashInflowDelta = baseLedger.accountsReceivableYTD - simAR;
    const activeProfitDelta = simNetProfit - (baseLedger.grossRevenueYTD - baseLedger.cogsYTD - baseLedger.opexYTD);
    const finalSimCash = baseLedger.cashOnHand + cashInflowDelta + activeProfitDelta;
    const finalSimRunway = finalSimCash / baseLedger.monthlyBurn;

    // Standardized Ratio Formulations
    const currentRatio = baseLedger.currentAssets / baseLedger.currentLiabilities;
    const debtToEquity = baseLedger.totalLiabilities / baseLedger.totalEquity;
    const grossMargin = ((baseLedger.grossRevenueYTD - baseLedger.cogsYTD) / baseLedger.grossRevenueYTD) * 100;
    const operatingMargin = ((baseLedger.grossRevenueYTD - baseLedger.cogsYTD - baseLedger.opexYTD) / baseLedger.grossRevenueYTD) * 100;

    // FIRM KEY UNIFICATION FIXED: Maps securely to backend key signature definitions
    const targetBench = industryProfile?.benchmarks || {
      gross_margin: 50.0, operating_margin: 15.5, dso: 44.0, current_ratio: 1.5, debt_to_equity: 0.85
    };

    let calculatedHealthScore = 70;
    if (finalSimRunway > 8) calculatedHealthScore += 15; else calculatedHealthScore -= 10;
    if (grossMargin > targetBench.gross_margin) calculatedHealthScore += 10;
    if (simDso < targetBench.dso) calculatedHealthScore += 5;

    return {
      cash: finalSimCash, runway: finalSimRunway, grossMargin, operatingMargin, dsoYtd: baseDsoYtd, dsoTtm: baseDsoTtm,
      simDso, currentRatio, debtToEquity, score: Math.min(100, Math.max(15, calculatedHealthScore)), bench: targetBench
    };
  }, [simRevenueChange, simOpexReduction, simCollectionSpeedup, industryProfile]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1 & 2. PARAMETER CONTROL CONTROLLER DECK */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-2xl relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-violet-600 to-pink-600" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-widest">
              <Sparkles size={14} /> Intelligence Platform v4.2
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Landmark className="text-violet-500" /> Operational Control & Benchmarking Deck
            </h1>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center w-full lg:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-56">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <LayoutGrid size={12} className="text-violet-400" /> 1. Primary Sector Dropdown
              </label>
              <div className="relative">
                <select
                  value={sectorKey} onChange={(e) => handleSectorChange(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-white appearance-none cursor-pointer focus:outline-none focus:border-violet-500"
                >
                  <option value="54">54 - Professional Services</option>
                  <option value="72">72 - Hospitality & Food Services</option>
                  <option value="23">23 - Construction Sector</option>
                  <option value="44">44 - Retail Commerce</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-64">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <Tag size={12} className="text-violet-400" /> 2. Secondary Dependent NAICS Dropdown
              </label>
              <div className="relative">
                <select
                  value={naicsCode} onChange={(e) => setNaicsCode(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-white appearance-none cursor-pointer focus:outline-none focus:border-violet-500"
                >
                  {(NAICS_REGISTRY[sectorKey] || []).map((code) => (
                    <option key={code} value={code}>{code} - {NAICS_NAMES[code]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-28">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <Building2 size={12} className="text-violet-400" /> Zip Code Box
              </label>
              <input
                type="text" maxLength={5} value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-1.5 text-xs font-black tracking-widest text-center text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* WORKSPACE DECK COMPONENT LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">

            {/* PIPELINE TELEMETRY HEADERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 3. Overall Health Score Indicator */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">3. Overall Health Score</span>
                  <h3 className="text-3xl font-black text-white tracking-tight">{pipelineState.score} <span className="text-xs text-gray-500">/ 100</span></h3>
                  <p className="text-xs text-gray-400">Weighted evaluation across target cash spendable cash indexes.</p>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-violet-600/20 flex items-center justify-center">
                  <span className="text-xs font-black text-violet-400">{pipelineState.score}%</span>
                </div>
              </div>

              {/* 4. Cash Flow Forecast and Runway Monitor */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">4. Cash Flow Forecast & Runway</span>
                  <h3 className="text-3xl font-black text-pink-400 tracking-tight">{pipelineState.runway.toFixed(1)} <span className="text-xs text-gray-500">Months</span></h3>
                  <p className="text-xs text-gray-400">Simulated Net Funding: ${pipelineState.cash.toLocaleString()}</p>
                </div>
                <Clock size={24} className="text-pink-400" />
              </div>
            </div>

            {/* 6. Executive Summary Contextual Briefing */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-1 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText size={14} className="text-violet-400" /> 6. Executive Contextual Briefing
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Analysis across segment group <strong className="text-white">NAICS {naicsCode}</strong> shows an operating cost base of ${baseLedger.opexYTD.toLocaleString()}. Internal collection efficiency models report YTD days to get paid after a sale tracks at {pipelineState.dsoYtd.toFixed(0)} days against localized geographic targets indexed by regional Zip context.
              </p>
            </div>

            {/* =====================================================================
                NUMERATOR AND DENOMINATOR TELEMETRY VISUAL MULTI-BAR GRAPHS
                ===================================================================== */}
            <div className="space-y-6">
              
              {/* Card 1: Cash Runway with Internal Controls */}
              <TelemetryChartCard 
                title="Cash Runway Multi-Bar Calculation"
                userNum={pipelineState.cash} userDen={baseLedger.monthlyBurn}
                indNum={baseLedger.cashOnHand * 1.15} indDen={baseLedger.monthlyBurn * 0.95}
                userRatio={pipelineState.runway} indRatio={8.5}
                numLabel="Liquid Funding Pools ($)" denLabel="Calculated Monthly Burn ($)" unit=" Mos"
                controls={[
                  { id: "CR1", title: "Vendor Outflow Staging", description: "Sequencing non-critical payables to align with cash receipts.", effort: "Low" },
                  { id: "CR2", title: "Treasury Sweep Activation", description: "Route excess checking balances into interest money market funds.", effort: "Low" }
                ]}
              />

              {/* Card 2: Gross Margin with Internal Controls */}
              <TelemetryChartCard 
                title="Gross Margin Multi-Bar Matrix"
                userNum={baseLedger.grossRevenueYTD - baseLedger.cogsYTD} userDen={baseLedger.grossRevenueYTD}
                indNum={baseLedger.grossRevenueYTD * (pipelineState.bench.gross_margin / 100)} indDen={baseLedger.grossRevenueYTD}
                userRatio={pipelineState.grossMargin} indRatio={pipelineState.bench.gross_margin}
                numLabel="Gross Profit Value ($)" denLabel="Gross Revenue Base ($)" unit="%"
                controls={[
                  { id: "GM1", title: "cost of sales Direct Audit", description: "Benchmark primary inventory/material costs quarterly against market rates.", effort: "Medium" },
                  { id: "GM2", title: "Discount Threshold Fences", description: "Lock baseline transaction margins to prevent sales price erosion.", effort: "Low" }
                ]}
              />

              {/* Card 3: Operating Margin with Internal Controls */}
              <TelemetryChartCard 
                title="Operating Margin Multi-Bar Matrix"
                userNum={baseLedger.grossRevenueYTD - baseLedger.cogsYTD - baseLedger.opexYTD} userDen={baseLedger.grossRevenueYTD}
                indNum={baseLedger.grossRevenueYTD * (pipelineState.bench.operating_margin / 100)} indDen={baseLedger.grossRevenueYTD}
                userRatio={pipelineState.operatingMargin} indRatio={pipelineState.bench.operating_margin}
                numLabel="Operating Income Balance ($)" denLabel="Gross Revenue Base ($)" unit="%"
                controls={[
                  { id: "OM1", title: "Overhead Rationalization Review", description: "Freeze trailing subscription seats and automate administrative steps.", effort: "Low" },
                  { id: "OM2", title: "Fixed Costs Variable Shift", description: "Convert fixed structures to utility models through vendor negotiation.", effort: "High" }
                ]}
              />

              {/* Card 4: days to get paid after a sale Trailing Conversions (Calculation of Ratio, YTD vs TTM) */}
              <TelemetryChartCard 
                title="Days Sales Outstanding (days to get paid after a sale) Ratio Calibration (YTD vs TTM)"
                userNum={baseLedger.accountsReceivableYTD} userDen={baseLedger.grossRevenueYTD}
                indNum={baseLedger.accountsReceivableTTM} indDen={baseLedger.grossRevenueTTM}
                userRatio={pipelineState.simDso} indRatio={pipelineState.dsoTtm}
                numLabel="Receivables Value Base ($)" denLabel="Gross Revenue Base ($)" unit=" Days"
                controls={[
                  { id: "days to get paid after a sale1", title: "Automated Dunning Sequences", description: "Trigger escalating messaging workflows the day an account turns net-31.", effort: "Low" },
                  { id: "days to get paid after a sale2", title: "Mobilization Retainer Mandates", description: "Enforce 30% upfront capitalization requirements for custom projects.", effort: "Medium" }
                ]}
              />

              {/* Card 5: Current Ratio with Internal Controls */}
              <TelemetryChartCard 
                title="Current Ratio Liquidity Multi-Bar Matrix"
                userNum={baseLedger.currentAssets} userDen={baseLedger.currentLiabilities}
                indNum={baseLedger.currentAssets * 1.1} indDen={baseLedger.currentLiabilities}
                userRatio={pipelineState.currentRatio} indRatio={pipelineState.bench.current_ratio}
                numLabel="Total Current Assets ($)" denLabel="Near-Term Liabilities ($)" unit="x"
                controls={[
                  { id: "CUR1", title: "Inventory Velocity Mapping", description: "Reduce safety stock metrics to follow immediate 30-day usage levels.", effort: "Medium" },
                  { id: "CUR2", title: "Payables Expansion Adjustments", description: "Shift structural agreements out to net-45 configurations safely.", effort: "Medium" }
                ]}
              />

              {/* Card 6: Debt-to-Equity with Internal Controls */}
              <TelemetryChartCard 
                title="Debt-to-Equity Leverage Gearing Multi-Bar Matrix"
                userNum={baseLedger.totalLiabilities} userDen={baseLedger.totalEquity}
                indNum={baseLedger.totalLiabilities * 0.9} indDen={baseLedger.totalEquity}
                userRatio={pipelineState.debtToEquity} indRatio={pipelineState.bench.debt_to_equity}
                numLabel="Aggregated Debt Liabilities ($)" denLabel="Structural Equity Capital ($)" unit="x"
                controls={[
                  { id: "DE1", title: "High-Rate Balance Amortization", description: "Apply excess cash buffers to clear variable revolving credit tiers.", effort: "Low" },
                  { id: "DE2", title: "Equity Retention Enforcement", description: "Suspend discretionary distribution outlays during capital restructuring.", effort: "High" }
                ]}
              />
            </div>

            {/* WHAT-IF SCENARIO LABORATORY SIMULATOR */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-violet-400" /> What-If Scenario Simulation Laboratory
                </h3>
                <p className="text-[11px] text-gray-500">Slide metrics dynamically to gauge balance sheet downstream adjustments</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>Revenue Target Shift</span>
                    <span className="text-violet-400">{simRevenueChange >= 0 ? `+${simRevenueChange}` : simRevenueChange}%</span>
                  </div>
                  <input type="range" min="-30" max="50" step="5" value={simRevenueChange} onChange={(e) => setSimRevenueChange(Number(e.target.value))} className="w-full accent-violet-500" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>OpEx Savings Compression</span>
                    <span className="text-pink-400">+{simOpexReduction}%</span>
                  </div>
                  <input type="range" min="0" max="30" step="5" value={simOpexReduction} onChange={(e) => setSimOpexReduction(Number(e.target.value))} className="w-full accent-pink-500" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>AR Collection Acceleration</span>
                    <span className="text-amber-400">-{simCollectionSpeedup} Days</span>
                  </div>
                  <input type="range" min="0" max="25" step="5" value={simCollectionSpeedup} onChange={(e) => setSimCollectionSpeedup(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
              </div>
            </div>

            {/* UPSTREAM LIVE MACROECONOMIC REFERENCE MATRIX PANELS */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                <Building2 size={14} className="text-violet-400" /> Live Federal Ingestion Engine Metrics
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-1">
                  <div className="text-[9px] uppercase font-bold text-gray-500">Local Market and Ownership</div>
                  <div className="text-xl font-black text-white">{industryProfile?.local_stats?.establishments || 342} Establishments</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Minority-owned firm presence averages {industryProfile?.ownership?.minority_owned_pct || 19.5}% inside this local FIPS tracking code boundary context.</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-1">
                  <div className="text-[9px] uppercase font-bold text-gray-500">Business Dynamics</div>
                  <div className="text-xl font-black text-white">+{industryProfile?.market_dynamics?.firm_births || 42} Annual Births</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Job creation vectors inside the zip market context expanded by {industryProfile?.market_dynamics?.job_creation || 578} units.</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-1">
                  <div className="text-[9px] uppercase font-bold text-gray-500">Economic Context</div>
                  <div className="text-xl font-black text-white">{industryProfile?.economic_indicators?.unemployment_rate || 3.2}% Unemployment</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Industrial inflation PPI index values hold steady at {industryProfile?.economic_indicators?.industry_price_index?.value || 124.8}.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-2">
                  <div className="text-[9px] uppercase font-bold text-gray-500">Price and Employment Trends Chart</div>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={industryProfile?.price_trends?.monthly_ppi || [
                        {date: "Jan", value: 121}, {date: "Feb", value: 122}, {date: "Mar", value: 124}
                      ]}>
                        <XAxis dataKey="date" stroke="#4b5563" fontSize={9} />
                        <YAxis stroke="#4b5563" fontSize={9} domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-2">
                  <div className="text-[9px] uppercase font-bold text-gray-500">GDP and Quarterly Output Metrics</div>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={industryProfile?.quarterly_trends?.quarterly_gross_output || [
                        {quarter: "Q1", gross_output: 21}, {quarter: "Q2", gross_output: 22}
                      ]}>
                        <XAxis dataKey="quarter" stroke="#4b5563" fontSize={9} />
                        <YAxis stroke="#4b5563" fontSize={9} />
                        <Tooltip />
                        <Bar dataKey="gross_output" fill="#ec4899" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT-HAND COMPLIANCE RAIL AREA */}
          <div className="space-y-6">

            {/* 5. 15 TAX ALERTS REGISTRY COMPONENT */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertOctagon size={16} className="text-amber-500" /> 5. Internal Revenue Code Compliance (15 Active)
                </h3>
                <p className="text-[11px] text-gray-500">CPA active risk management registry</p>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 border border-gray-800 p-2 rounded-xl bg-gray-950/60">
                {taxAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5 text-xs relative">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-gray-950 text-amber-400 rounded border border-amber-800/60 font-black text-[9px] uppercase">{alert.section}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-500">ID: {alert.id}</span>
                    </div>
                    <div className="font-bold text-white text-[11px]">{alert.title}</div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. TAX-TO-CASH IMPACT BRIDGE */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-fuchsia-400" /> 7. Tax-to-Cash Impact Bridge
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-gray-950 border border-gray-800 rounded-xl">
                  <span className="text-gray-400">§174 Software Amortization Barrier</span>
                  <span className="font-bold text-red-400">-$8,400 Outflow</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-950 border border-gray-800 rounded-xl">
                  <span className="text-gray-400">§280A Corporate Augusta Shift</span>
                  <span className="font-bold text-emerald-400">+$4,200 Retained</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-950 border border-gray-800 rounded-xl font-bold text-white bg-gray-950">
                  <span>Net Capital Cash Run Effect</span>
                  <span>-$4,200 Net</span>
                </div>
              </div>
            </div>

            {/* 8. COMPLIANCE & CONTROL CALENDAR FENCES */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar size={16} className="text-violet-400" /> 8. Compliance & Control Calendar
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">Form 1040 Q2 Estimated Filing</div>
                    <div className="text-[10px] text-gray-500">Corporate tax allocation cutoff</div>
                  </div>
                  <span className="text-[10px] font-black text-pink-400 uppercase">June 15</span>
                </div>
                <div className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">§41 SPR Documentation Review</div>
                    <div className="text-[10px] text-gray-500">Technical engineering sprint audit</div>
                  </div>
                  <span className="text-[10px] font-black text-violet-400 uppercase">July 31</span>
                </div>
              </div>
            </div>

            {/* PRIORITY ACTIONS */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target size={16} className="text-emerald-400" /> Priority Actions
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2 p-2 bg-gray-950 rounded-xl border border-gray-800">
                  <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300">Deploy early-pay discounting workflows to contract the days to get paid after a sale conversion layer.</p>
                </div>
                <div className="flex gap-2 p-2 bg-gray-950 rounded-xl border border-gray-800">
                  <CheckCircle size={14} className="text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300">Sweep excess checking capital positions into short-term cash reserves.</p>
                </div>
              </div>
            </div>

            {/* REVENUE CONCENTRATION, GOAL PROGRESS & RISK RADAR */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-pink-400" /> Risk Radar & Concentrations
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>Revenue Concentration (Top 3)</span>
                    <span className="text-pink-400">42%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div className="w-[42%] h-full bg-pink-500" />
                  </div>
                </div>

                <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>Goal Progress Balance Target</span>
                    <span className="text-emerald-400">82%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div className="w-[82%] h-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
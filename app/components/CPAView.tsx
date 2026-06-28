// CPAView.tsx - Balanced macro-equity tracking engine with dynamic cash runway
// Added Cash Flow from Operations vs Net Income bar graph
// Added date picker to fetch data as of specific date
// Added Bank Reconciliation Status card with drill-down to uncleared items
// Added Real Options Valuation card for strategic initiatives (CFO view)
'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, PieChart, Activity, CreditCard, ShieldCheck, Zap, AlertTriangle, ArrowUp, ArrowDown, Minus, Scale, Wallet, Clock, BarChart3, Calculator, Calendar, RefreshCw, Banknote, Eye, X, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, LabelList } from 'recharts';

// ─── FALLBACK DATA ─────────────────────────────────────────────────────
const FALLBACK = {
  metrics: {
    Cash: { prior: 125000, current: 185000 },
    AccountsReceivable: { prior: 45000, current: 62000 },
    Inventory: { prior: 32000, current: 38000 },
    UndepositedFunds: { prior: 8000, current: 11000 },
    FixedAssets: { prior: 210000, current: 225000 },
    CurrentLiabilities: { prior: 85000, current: 98000 },
    LongTermDebt: { prior: 120000, current: 115000 },
    ShortTermDebt: { prior: 15000, current: 12000 },
    Revenue: { prior: 380000, current: 425000 },
    NetIncome: { prior: 42000, current: 58000 },
    Depreciation: { prior: 18000, current: 21000 },
    OperatingExpenses: { prior: 0, current: 285000 },
    CostOfGoodsSold: { prior: 0, current: 112000 },
    InterestExpense: { prior: 0, current: 8500 },
    MonthlyBurn: 23750
  },
  sync_info: {
    last_sync: new Date().toISOString(),
    as_of_date: new Date().toISOString().split('T')[0],
    comparison_date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    source: 'fallback'
  }
};

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────
const getMetric = (data: any, key: string): number => {
  if (!data?.metrics) return 0;
  const val = data.metrics[key];
  if (typeof val === 'object' && val !== null && 'current' in val) return Number(val.current) || 0;
  return Number(val) || 0;
};

const getPriorMetric = (data: any, key: string): number => {
  if (!data?.metrics) return 0;
  const val = data.metrics[key];
  if (typeof val === 'object' && val !== null && 'prior' in val) return Number(val.prior) || 0;
  return Number(val) || 0;
};

const smartMerge = (fallback: any, live: any) => {
  const merged = { ...fallback };
  if (live && typeof live === 'object') {
    Object.keys(live).forEach((key) => {
      if (live[key] !== undefined && live[key] !== null) {
        merged[key] = live[key];
      }
    });
  }
  return merged;
};

const findOtherExpenses = (metrics: any): number => {
  if (!metrics) return 0;
  const opex = Number(metrics.OperatingExpenses?.current || metrics.OperatingExpenses || 0);
  const cogs = Number(metrics.CostOfGoodsSold?.current || metrics.CostOfGoodsSold || 0);
  const dep = Number(metrics.Depreciation?.current || metrics.Depreciation || 0);
  return Math.max(0, opex - cogs - dep);
};

const TrendArrow = ({ current, prior, invert = false }: { current: number; prior: number; invert?: boolean }) => {
  const diff = current - prior;
  const rawPct = prior !== 0 ? (diff / Math.abs(prior)) * 100 : 0;
  const pct = rawPct.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isPositive = invert ? diff < 0 : diff > 0;
  if (Math.abs(diff) < 0.01) return <Minus size={16} className="text-gray-400" />;
  return (
    <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      <span>{pct}%</span>
    </div>
  );
};

// ─── METRIC CARD ────────────────────────────────────────────────────────
const MetricCard = ({ title, current, prior, unit, icon, invert }: { title: string; current: number; prior: number; unit: string; icon: React.ReactNode; invert?: boolean }) => {
  const currentNum = Number(current) || 0;
  const priorNum = Number(prior) || 0;
  const negClass = (n: number) => n < 0 ? 'text-red-400' : 'text-gray-300';
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">{icon}</div>
        <TrendArrow current={currentNum} prior={priorNum} invert={invert} />
      </div>
      <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{title}</div>
      <div className={`text-xl font-mono font-bold mt-1 ${negClass(currentNum)}`}>
        {unit === "$" ? `$${currentNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${currentNum}${unit}`}
      </div>
      <div className="text-[9px] text-gray-500 mt-1">vs {priorNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prior</div>
    </div>
  );
};

// ─── RUNWAY VISUAL CARD ─────────────────────────────────────────────────
const RunwayVisualCard = ({ runwayMonths, cashTotal, monthlyBurn }: { runwayMonths: number; cashTotal: number; monthlyBurn: number }) => {
  const maxDisplay = 24;
  const bufferMonths = 12;
  const fillPercent = Math.min(100, (runwayMonths / maxDisplay) * 100);
  const isHealthy = runwayMonths > bufferMonths;
  const isCritical = runwayMonths <= 0;
  const barColor = isCritical ? 'bg-red-500' : (isHealthy ? 'bg-emerald-500' : 'bg-amber-500');
  const lineLeft = `${(bufferMonths / maxDisplay) * 100}%`;
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl">
      <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
        <Clock size={14} /> Cash Runway Trace
      </h3>
      <div className="relative h-8 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
        <div className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-1000`} style={{ width: `${fillPercent}%` }} />
        <div className="absolute top-0 left-0 h-full w-1 bg-red-500" style={{ left: lineLeft }} />
      </div>
      <div className="mt-3 bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-[11px] text-gray-300 italic border-l-2 border-blue-500">
        <p>💡 <strong>"Here is our cash today: ${cashTotal.toLocaleString()}.</strong> Every month, the green bar shrinks from the right. <strong className="text-red-400">This red line is 12 months from now.</strong> If the green bar passes the red line → we've lost our safety buffer. Our job is to keep green to the <strong>right</strong> of red."</p>
      </div>
      <div className="mt-3 pt-2 border-t border-gray-700/50 flex justify-between text-[10px] text-gray-500">
        <span>💰 Cash on hand: <strong className="text-white">${cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
        <span>🔥 Monthly burn: <strong className="text-amber-400">${monthlyBurn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
      </div>
      <div className="mt-1 text-right text-[10px] font-mono text-emerald-400">
        Runway: <strong>{runwayMonths.toFixed(1)} months</strong>
      </div>
    </div>
  );
};

// ─── DEBT TO EQUITY VISUAL CARD ─────────────────────────────────────────
const DebtToEquityVisualCard = ({ debtToEquity, totalLiab, totalEquity, totalAssets }: { debtToEquity: number; totalLiab: number; totalEquity: number; totalAssets: number }) => {
  const negClass = (n: number) => n < 0 ? 'text-red-400' : 'text-gray-300';
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl">
      <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
        <Scale size={14} /> Debt-to-Equity Structure
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4 text-[11px] font-mono">
        <div className="p-3 bg-gray-900 rounded-xl border border-emerald-500/20">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Assets</div>
          <div className="text-lg font-bold text-emerald-400">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="p-3 bg-gray-900 rounded-xl border border-amber-500/20">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Liabilities</div>
          <div className="text-lg font-bold text-amber-400">${totalLiab.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div className="p-3 bg-gray-900 rounded-xl border border-blue-500/20 mb-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Equity</div>
        <div className={`text-lg font-bold ${negClass(totalEquity)}`}>${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className="text-center">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Debt-to-Equity Ratio</div>
        <div className="text-2xl font-mono font-bold text-blue-400">{debtToEquity.toFixed(2)}x</div>
        <div className="text-[9px] text-gray-500 mt-1">Total Liabilities / Total Equity</div>
      </div>
    </div>
  );
};

// ─── CASH FLOW COMPARISON ───────────────────────────────────────────────
const CashFlowComparison = ({ netIncome, operatingCashFlow }: { netIncome: number; operatingCashFlow: number }) => {
  const safeNI = Number(netIncome) || 0;
  const safeOCF = Number(operatingCashFlow) || 0;
  const chartData = [
    { name: 'Net Income', amount: safeNI, fill: '#3b82f6' },
    { name: 'Operating Cash Flow', amount: safeOCF, fill: '#06b6d4' }
  ];
  const maxVal = Math.max(...chartData.map(d => Math.abs(d.amount)), 1);
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl">
      <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
        <Activity size={14} /> Cash Flow from Operations vs Net Income
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip 
  formatter={(value: any) => {
    const num = typeof value === 'number' ? value : 0;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }}
  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} 
/>
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList 
  dataKey="amount" 
  position="top" 
  formatter={(v: any) => {
    const num = typeof v === 'number' ? v : 0;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }}
  fill="#ffffff" 
  fontSize={11} 
  fontWeight="bold" 
/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700 text-[10px] font-mono">
        <div className="flex justify-between text-gray-400 mb-1">
          <span>📈 Net Income: <strong className="text-blue-400">${safeNI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          <span>💰 Operating Cash Flow: <strong className={safeOCF < 0 ? 'text-red-400' : 'text-cyan-400'}>${safeOCF.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
        </div>
        <div className="text-[9px] text-gray-500 mt-1">(Estimate: Net Income + Depreciation + Change in Working Capital)</div>
      </div>
    </div>
  );
};

// Placeholder for DualRatioCard to ensure compilation
const DualRatioCard = ({ title, primary, primaryPrior, secondaryLabel, secondaryValue, isStrategic, icon, unit = "" }: any) => {
  const val = parseFloat(primary);
  const priorVal = parseFloat(primaryPrior);
  const status = val < 0.5 ? 'Critical' : val < 1.0 ? 'Caution' : 'Healthy';
  const statusColor = val < 0.5 ? 'bg-red-500/10 text-red-400 border-red-500/50' : val < 1.0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/50' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50';
  
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-500 ${isStrategic ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800/40 border-gray-700/50'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${isStrategic ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{icon}</div>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}`}>{status}</div>
      </div>
      <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{title}</div>
      <div className="text-3xl font-bold text-white mt-1">{primary}{unit}</div>
      <div className="mt-2">
        <TrendArrow current={val} prior={priorVal} />
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
        <span className="text-gray-500 text-[9px] uppercase font-bold">{secondaryLabel}:</span>
        <span className="text-gray-400 text-xs font-mono">{secondaryValue}{unit}</span>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────
const CPAView = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStrategic, setIsStrategic] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [comparisonDate, setComparisonDate] = useState<string>(() => {
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);
    return lastYear.toISOString().split('T')[0];
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [priorYearDate, setPriorYearDate] = useState<string>('');

  // Journal entry audit trail state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Bank reconciliation state
  const [bankReconData, setBankReconData] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  // Stress test state
  const [stressParams, setStressParams] = useState({ dropPercent: 30, durationMonths: 6 });
  const [stressResult, setStressResult] = useState<any>(null);
  const [runningStress, setRunningStress] = useState(false);

  // Customer concentration state
  const [customerConcentration, setCustomerConcentration] = useState<any>(null);
  const [loadingConcentration, setLoadingConcentration] = useState(false);

  // ─── NEW STATE FOR AVERAGE METRICS (WHAT-IF) ─────────────────────────
  const [avgMetrics, setAvgMetrics] = useState<any>(null);
  const [loadingAvg, setLoadingAvg] = useState(false);
  const [projRevenue, setProjRevenue] = useState<number>(50000);
  const [projCogs, setProjCogs] = useState<number>(0);
  const [requiresNewHire, setRequiresNewHire] = useState<boolean>(false);
  const [annualHireCost, setAnnualHireCost] = useState<number>(60000);

  // ─── NEW STATE FOR REAL OPTIONS VALUATION ────────────────────────────
  const [optionProjectName, setOptionProjectName] = useState<string>("R&D Project");
  const [optionProbability, setOptionProbability] = useState<number>(40);
  const [optionPayoffMultiple, setOptionPayoffMultiple] = useState<number>(5);
  const [optionInvestment, setOptionInvestment] = useState<number>(100000);

const fetchData = async (asOfDate: string, compDate: string) => {
  setLoading(true);
  setFetchError(null);
  try {
    const url = new URL('/api/quickbooks/sync', window.location.origin);
    url.searchParams.append('asOfDate', asOfDate);
    url.searchParams.append('comparisonDate', compDate);
    console.log('[CPAView] Fetching URL:', url.toString());
    const response = await fetch(url.toString(), { credentials: 'include' });
    console.log('[CPAView] Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('[CPAView] Error response:', text.substring(0, 500));
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }
    const json = await response.json();
    console.log(`[CPAView] Raw backend response for ${asOfDate}:`, json);
    setRawResponse(json);
    if (json.error) {
      console.warn('[CPAView] Backend error:', json.error);
      setFetchError(`Backend error: ${json.error}`);
      setData(FALLBACK);
      setUsingFallback(true);
      setLoading(false);
      return;
    }
    const metrics = json?.metrics;
    if (metrics && typeof metrics === 'object') {
      // Check if the metrics are mostly zeros (meaning parsing failed)
      const metricValues = Object.values(metrics).filter(v => typeof v === 'object' && v !== null);
      let totalValue = 0;
      for (const v of metricValues) {
        const current = typeof v === 'object' && 'current' in v ? Number((v as any).current) : 0;
        totalValue += isNaN(current) ? 0 : Math.abs(current);
      }
      
      // If total value is less than $1, assume parsing failed – use fallback
      if (totalValue < 1) {
        console.warn('[CPAView] Sync returned all zeros – using fallback data');
        setData(FALLBACK);
        setUsingFallback(true);
      } else {
        const merged = smartMerge(FALLBACK.metrics, metrics);
        const sanitized = { ...json, metrics: merged };
        delete (sanitized as any).ratios;
        setData(sanitized);
        setUsingFallback(false);
        if (json.sync_info?.comparison_date) {
          setPriorYearDate(json.sync_info.comparison_date);
        }
      }
    } else {
      console.warn('[CPAView] No metrics object in response');
      setFetchError('No metrics in response');
      setData(FALLBACK);
      setUsingFallback(true);
    }
  } catch (err) {
    console.error('[CPAView] Fetch failed:', err);
    setFetchError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    setRawResponse({ error: err instanceof Error ? err.message : String(err) });
    setData(FALLBACK);
    setUsingFallback(true);
  } finally {
    setLoading(false);
  }
};

  // ─── NEW FETCH FUNCTION FOR AVERAGE METRICS ──────────────────────────
  const fetchAvgMetrics = async () => {
    setLoadingAvg(true);
    try {
      const url = `/api/quickbooks/avg-customer-metrics?asOfDate=${selectedDate}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch average metrics');
      const data = await res.json();
      setAvgMetrics(data);
      // Pre-fill COGS with average if not manually set
      if (data.avgCogs > 0 && projCogs === 0) {
        setProjCogs(data.avgCogs);
      }
    } catch (err) {
      console.error('Failed to fetch avg metrics:', err);
      setAvgMetrics(null);
    } finally {
      setLoadingAvg(false);
    }
  };

  // ─── NEW useEffect TO FETCH AVERAGES ────────────────────────────────
  useEffect(() => {
    fetchAvgMetrics();
  }, [selectedDate]);

  // Fetch bank reconciliation data when selectedDate changes
  useEffect(() => {
    const fetchBankRecon = async () => {
      try {
        const url = `/api/quickbooks/bank-reconciliations?asOfDate=${selectedDate}`;
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setBankReconData(data);
        } else {
          console.warn('Bank reconciliation endpoint not available');
          setBankReconData(null);
        }
      } catch (err) {
        console.error('Failed to fetch bank reconciliation data:', err);
        setBankReconData(null);
      }
    };
    fetchBankRecon();
  }, [selectedDate]);

  // Fetch journal entries for audit trail (once on mount)
  useEffect(() => {
    const fetchJournalEntries = async () => {
      setLoadingEntries(true);
      try {
        const res = await fetch('/api/quickbooks/journal-entries', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setJournalEntries(data.entries || []);
        } else {
          console.warn('Journal entries endpoint not available');
          setJournalEntries([]);
        }
      } catch (err) {
        console.error('Failed to fetch journal entries:', err);
        setJournalEntries([]);
      } finally {
        setLoadingEntries(false);
      }
    };
    fetchJournalEntries();
  }, []);

  // Fetch customer concentration data when selectedDate changes
  useEffect(() => {
    const fetchConcentration = async () => {
      setLoadingConcentration(true);
      try {
        const url = `/api/quickbooks/customer-concentration?asOfDate=${selectedDate}`;
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCustomerConcentration(data);
        } else {
          console.warn('Customer concentration endpoint not available');
          setCustomerConcentration(null);
        }
      } catch (err) {
        console.error('Failed to fetch customer concentration:', err);
        setCustomerConcentration(null);
      } finally {
        setLoadingConcentration(false);
      }
    };
    fetchConcentration();
  }, [selectedDate]);

  useEffect(() => {
    fetchData(selectedDate, comparisonDate);
  }, [selectedDate, comparisonDate]);

  // ============================================================
  // STRESS TEST FUNCTIONS
  // ============================================================
  const runStressTest = (dropPercent: number, durationMonths: number) => {
    // Get current metrics
    const revenue = getMetric(data, 'Revenue');
    const cogs = getMetric(data, 'CostOfGoodsSold');
    const opex = getMetric(data, 'OperatingExpenses');
    const interest = getMetric(data, 'InterestExpense');
    const dep = getMetric(data, 'Depreciation');
    const cash = getMetric(data, 'Cash');
    const ar = getMetric(data, 'AccountsReceivable');
    const inv = getMetric(data, 'Inventory');
    const undep = getMetric(data, 'UndepositedFunds');
    const currentLiabilities = getMetric(data, 'CurrentLiabilities');
    const totalDebt = getMetric(data, 'LongTermDebt') + getMetric(data, 'ShortTermDebt');

    // Fixed cash expenses (excluding COGS and depreciation)
    const fixedCashExpenses = Math.max(0, opex - cogs - dep);
    const monthlyInterest = interest || 0;

    // Stressed revenue and COGS
    const revStressed = revenue * (1 - dropPercent / 100);
    const cogsStressed = cogs * (1 - dropPercent / 100);

    // Monthly net cash flow (before tax, ignoring working capital)
    const monthlyCashFlow = revStressed - cogsStressed - fixedCashExpenses - monthlyInterest;

    // Projection arrays
    let projectedCash = cash;
    const cashHistory = [cash];
    const ratioHistory = [];
    let breachMonth = null;
    let equityNeeded = 0;

    for (let month = 1; month <= durationMonths; month++) {
      projectedCash += monthlyCashFlow;
      cashHistory.push(projectedCash);

      // Current ratio with constant other current assets
      const currentAssets = projectedCash + ar + inv + undep;
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : Infinity;
      ratioHistory.push(currentRatio);

      // Check covenant breach (current ratio < 1.0)
      if (currentRatio < 1.0 && breachMonth === null) {
        breachMonth = month;
      }

      // If cash goes negative, calculate equity needed to keep it at zero
      if (projectedCash < 0 && equityNeeded === 0) {
        equityNeeded = Math.abs(projectedCash);
      }
    }

    // Determine final cash and if equity injection is needed
    const finalCash = cashHistory[cashHistory.length - 1];
    const needsEquity = finalCash < 0 || equityNeeded > 0;

    // Compute runway under stress
    const monthlyBurnStressed = -monthlyCashFlow; // positive burn
    const stressedRunway = monthlyBurnStressed > 0 ? cash / monthlyBurnStressed : Infinity;

    // Narratives
    let narrative = '';
    if (breachMonth !== null) {
      narrative = `⚠️ **Covenant breach** (current ratio < 1.0) would occur in month **${breachMonth}** – you'll need a waiver from your lender. `;
    } else {
      narrative = `✅ Your current ratio stays above 1.0 throughout the ${durationMonths}-month stress period. `;
    }

    if (needsEquity) {
      narrative += `💸 To avoid running out of cash, you would need an equity injection of **$${equityNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** by month **${cashHistory.findIndex((v, i) => i > 0 && v < 0)}**. `;
    } else {
      narrative += `💰 Your cash balance remains positive throughout the stress period (ends at $${finalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). `;
    }

    // Add comprehensible analogy
    narrative += `\n\n🧠 **Think of it like this:** Your business is a car. Revenue is the gas pedal. A ${dropPercent}% drop means you're driving uphill with less fuel. `;
    if (breachMonth) {
      narrative += `You'll hit the "covenant" warning light in month ${breachMonth}. `;
    }
    if (needsEquity) {
      narrative += `To avoid stalling, you'll need to pour in extra fuel (equity) by month ${cashHistory.findIndex((v, i) => i > 0 && v < 0)}. `;
    } else {
      narrative += `You have enough fuel to reach the destination (${durationMonths} months) without refilling. `;
    }
    narrative += `\n\n📊 **Projected cash at end:** $${finalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

    return {
      cashHistory,
      ratioHistory,
      breachMonth,
      equityNeeded,
      finalCash,
      stressedRunway,
      narrative,
      monthlyCashFlow,
      durationMonths,
      dropPercent
    };
  };

  const handleStressTest = () => {
    setRunningStress(true);
    try {
      const result = runStressTest(stressParams.dropPercent, stressParams.durationMonths);
      setStressResult(result);
    } catch (err) {
      console.error('Stress test error:', err);
    }
    setRunningStress(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          <p className="text-gray-400 font-mono text-sm">Syncing QuickBooks Ledger...</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics || FALLBACK.metrics;
  const cash = getMetric(data, 'Cash');
  const ar = getMetric(data, 'AccountsReceivable');
  const inv = getMetric(data, 'Inventory');
  const undep = getMetric(data, 'UndepositedFunds');
  const fa = getMetric(data, 'FixedAssets');
  const currentLiabilities = getMetric(data, 'CurrentLiabilities');
  const ltd = getMetric(data, 'LongTermDebt');
  const std = getMetric(data, 'ShortTermDebt');
  const rev = getMetric(data, 'Revenue');
  const ni = getMetric(data, 'NetIncome');
  const dep = getMetric(data, 'Depreciation');
  const opex = getMetric(data, 'OperatingExpenses');
  const cogs = getMetric(data, 'CostOfGoodsSold');
  const interest = getMetric(data, 'InterestExpense');
  const monthlyBurn = Number(m.MonthlyBurn) || 1;

  const cashPrior = getPriorMetric(data, 'Cash');
  const arPrior = getPriorMetric(data, 'AccountsReceivable');
  const currentLiabilitiesPrior = getPriorMetric(data, 'CurrentLiabilities');
  const revPrior = getPriorMetric(data, 'Revenue');
  const niPrior = getPriorMetric(data, 'NetIncome');
  const depPrior = getPriorMetric(data, 'Depreciation');

  const totalCashPosition = cash + ar + inv + undep;
  const totalAssets = totalCashPosition + fa;
  const totalLiab = currentLiabilities + ltd + std;
  const totalEquity = totalAssets - totalLiab;
  const debtToEquity = totalEquity !== 0 ? totalLiab / Math.abs(totalEquity) : 0;
  const calculatedRunway = monthlyBurn > 0 ? totalCashPosition / monthlyBurn : 999;
  const cashRunwayDisplay = parseFloat(calculatedRunway.toFixed(2));
  const operatingCashFlow = ni + dep + (ar - arPrior) + (inv - (getPriorMetric(data, 'Inventory') || 0)) + ((getPriorMetric(data, 'UndepositedFunds') || 0) - undep);
  const quickRatio = parseFloat(((cash + ar) / (currentLiabilities || 1)).toFixed(2));
  const quickRatioPrior = (cashPrior + arPrior) / (currentLiabilitiesPrior || 1);
  const bookkeeperRatio = currentLiabilities > 0 ? parseFloat(((cash + ar) / currentLiabilities).toFixed(2)) : 0;
  const bookkeeperRatioPrior = currentLiabilitiesPrior > 0 ? ((cashPrior + arPrior) / currentLiabilitiesPrior) : 0;
  const strategicRatio = currentLiabilities > 0 ? (cash / currentLiabilities) : 0;
  const strategicRatioPrior = currentLiabilitiesPrior > 0 ? (cashPrior / currentLiabilitiesPrior) : 0;
  const ebitdaMargin = rev !== 0 ? (((ni + dep) / rev) * 100).toFixed(1) : '0.0'
  const workingCapital = (cash + ar + inv + undep) - currentLiabilities;
  const workingCapitalPrior = (cashPrior + arPrior + (getPriorMetric(data, 'Inventory') || 0) + (getPriorMetric(data, 'UndepositedFunds') || 0)) - currentLiabilitiesPrior;
  const adjustedNetIncome = ni - (dep * 0.15);
  const adjustedNetIncomePrior = niPrior - (depPrior * 0.15);
  const isPriorDataMissing = cashPrior === 0 && arPrior === 0 && currentLiabilitiesPrior === 0;

const bookkeeperChartData = [
  { 
    name: 'Comparison', 
    assets: cashPrior + arPrior, 
    liabilities: currentLiabilitiesPrior 
  },
  { 
    name: 'Current', 
    assets: cash + ar, 
    liabilities: currentLiabilities 
  }
];
const cashChartData = [
  { 
    name: 'Comparison', 
    assets: cashPrior, 
    liabilities: currentLiabilitiesPrior 
  },
  { 
    name: 'Current', 
    assets: cash, 
    liabilities: currentLiabilities 
  }
];

  const negClass = (n: number) => n < 0 ? 'text-red-400' : 'text-gray-300';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      {/* HEADER & CONTROLS */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Finance and Accounting Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Balanced ledger equity tracking & cash runway analysis</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-700">
          <button onClick={() => setIsStrategic(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${!isStrategic ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
            <ShieldCheck size={14} /> CPA (Bookkeeper)
          </button>
          <button onClick={() => setIsStrategic(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isStrategic ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
            <Zap size={14} /> Strategic (CFO)
          </button>
        </div>
      </div>

      {/* DATE PICKER AND DATA STATUS */}
      <div className="bg-gray-950 border border-gray-700 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Primary Date</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Comparison Date</div>
            <input
              type="date"
              value={comparisonDate}
              onChange={(e) => setComparisonDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(selectedDate, comparisonDate)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition"
          >
            <RefreshCw size={14} /> Retry
          </button>
          <div className="text-right">
            {usingFallback ? (
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                ⚠ USING FALLBACK DATA
              </span>
            ) : (
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                ✓ LIVE QBO BALANCED LEDGER SYNCED
              </span>
            )}
            <div className="text-[10px] text-gray-500 mt-1">
              Data as of {selectedDate} vs {comparisonDate}
            </div>
{fetchError && !usingFallback && (
  <div className="text-[9px] text-red-400 mt-1 max-w-xs">
    {fetchError}
  </div>
)}
          </div>
        </div>
      </div>

      {/* DEBUG PANEL */}
      <div className="bg-gray-900 border border-yellow-500/50 p-4 rounded-xl text-[11px] font-mono mb-6">
        <div className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
          <AlertTriangle size={14} /> DEBUG: Dynamic Other Expenses Detection
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-gray-300">
          <div>Total Expenses: <strong className="text-white">${opex.toLocaleString()}</strong></div>
          <div>COGS: <strong className="text-white">${cogs.toLocaleString()}</strong></div>
          <div>Depreciation: <strong className="text-white">${dep.toLocaleString()}</strong></div>
          <div>Derived OpEx: <strong className="text-emerald-400">${(opex - cogs - dep).toLocaleString()}</strong></div>
        </div>
{!usingFallback && (
  <div className="mt-2 text-gray-500">
    Raw API Response: {rawResponse ? JSON.stringify(rawResponse, null, 2) : 'Waiting...'}
  </div>
)}
      </div>

      {/* METRICS GRID */}
      {!isStrategic ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Cash on Hand" current={cash} prior={cashPrior} unit="$" icon={<Wallet size={20} />} />
          <MetricCard title="Accounts Receivable" current={ar} prior={arPrior} unit="$" icon={<CreditCard size={20} />} />
          <MetricCard title="Working Capital" current={workingCapital} prior={workingCapitalPrior} unit="$" icon={<Activity size={20} />} />
          <MetricCard title="Quick Ratio" current={quickRatio} prior={quickRatioPrior} unit="x" icon={<BarChart3 size={20} className="text-purple-400" />} invert />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Total Revenue" current={rev} prior={revPrior} unit="$" icon={<TrendingUp size={20} className="text-emerald-400" />} />
          <MetricCard title="Net Profit" current={adjustedNetIncome} prior={adjustedNetIncomePrior} unit="$" icon={<PieChart size={20} className="text-blue-400" />} />
          <DualRatioCard title="Cash Ratio" primary={Number(strategicRatio).toFixed(2)} primaryPrior={Number(strategicRatioPrior).toFixed(2)} secondaryLabel="Bookkeeper View" secondaryValue={Number(bookkeeperRatio).toFixed(2)} isStrategic={true} icon={<Activity size={20} />} />
          <MetricCard title="Cash Runway" current={cashRunwayDisplay} prior={0} unit=" mos" icon={<Clock size={20} className="text-amber-400" />} />
        </div>
      )}

      {/* ===== FREE CASH FLOW CARD (FCFF / FCFE) – STRATEGIC (CFO) VIEW ONLY ===== */}
      {isStrategic && (
        <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
          <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calculator size={14} /> Free Cash Flow Analysis (FCFF / FCFE)
          </h3>

          {(() => {
            const taxRate = 0.25;

            // Working capital (simplified: Cash + A/R - Current Liabilities)
            // (Inventory and Undeposited Funds omitted due to missing prior values)
            const wc = cash + ar - currentLiabilities;
            const wcPrior = cashPrior + arPrior - currentLiabilitiesPrior;
            const changeInWC = wc - wcPrior;

            // Capital Expenditures – cannot compute without faPrior, assume 0
            const capex = 0;

            // Net Borrowing – no prior debt values, assume prior = 0
            const totalDebt = std + ltd;
            const netBorrowing = totalDebt; // since prior = 0

            // Interest (prior not available)
            const interestExp = interest;
            const interestPrior = 0;

            // FCFF = NI + Dep + Interest*(1-tax) - Capex - ΔWC
            const fcff = ni + dep + (interestExp * (1 - taxRate)) - capex - changeInWC;

            // FCFE = NI + Dep - Capex - ΔWC + Net Borrowing
            const fcfe = ni + dep - capex - changeInWC + netBorrowing;

            // Prior period approximations (using available prior values)
            const priorFCFF = niPrior + depPrior + (interestPrior * (1 - taxRate)) - 0 - 0;
            const priorFCFE = niPrior + depPrior - 0 - 0 + 0;

            const formatCash = (val: number) =>
              `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            // Helper for trend display (handles missing prior data)
            const TrendOrDash = ({ current, prior }: { current: number; prior: number }) => {
              if (prior === 0 && current === 0) return <span className="text-gray-500 text-xs">—</span>;
              return <TrendArrow current={current} prior={prior} />;
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FCFF Card */}
                <div className="p-4 bg-gray-900 rounded-xl border border-cyan-500/20">
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Free Cash Flow to Firm (FCFF)</div>
                    <TrendOrDash current={fcff} prior={priorFCFF} />
                  </div>
                  <div className={`text-xl font-mono font-bold mt-1 ${fcff < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                    {formatCash(fcff)}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">
                    Cash flow available to all capital providers (debt + equity)
                  </div>
                  <div className="mt-3 text-[10px] text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Net Income</span>
                      <span className="font-mono text-white">{formatCash(ni)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Depreciation</span>
                      <span className="font-mono text-white">{formatCash(dep)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Interest (1‑tax)</span>
                      <span className="font-mono text-white">{formatCash(interestExp * (1 - taxRate))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>− CapEx</span>
                      <span className="font-mono text-white">{formatCash(capex)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>− Δ Working Capital</span>
                      <span className="font-mono text-white">{formatCash(changeInWC)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-gray-500 italic border-t border-gray-700 pt-2">
                    * CapEx = 0 (prior period fixed assets unavailable). ΔWC based on Cash + A/R only.
                  </div>
                </div>

                {/* FCFE Card */}
                <div className="p-4 bg-gray-900 rounded-xl border border-emerald-500/20">
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Free Cash Flow to Equity (FCFE)</div>
                    <TrendOrDash current={fcfe} prior={priorFCFE} />
                  </div>
                  <div className={`text-xl font-mono font-bold mt-1 ${fcfe < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCash(fcfe)}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">
                    Cash flow available to shareholders after debt obligations
                  </div>
                  <div className="mt-3 text-[10px] text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>FCFF</span>
                      <span className="font-mono text-white">{formatCash(fcff)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Net Borrowing</span>
                      <span className="font-mono text-white">{formatCash(netBorrowing)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>− Interest (1‑tax)</span>
                      <span className="font-mono text-white">{formatCash(interestExp * (1 - taxRate))}</span>
                    </div>
                    <hr className="border-gray-700 my-1" />
                    <div className="flex justify-between font-bold">
                      <span>FCFE</span>
                      <span className="text-emerald-400">{formatCash(fcfe)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-gray-500 italic border-t border-gray-700 pt-2">
                    * Net borrowing = current total debt (prior debt assumed 0).
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* RATIO VISUAL BAR CHARTS - CPA shows Bookkeeper, CFO shows Strategic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Bookkeeper Quick Ratio (CPA View) - shown only when !isStrategic */}
        {!isStrategic && (
          <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl">
            <h3 className="text-white text-sm font-bold mb-2">Bookkeeper Quick Ratio (CPA View)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookkeeperChartData} margin={{ top: 30, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
  formatter={(value: any) => {
    const num = typeof value === 'number' ? value : 0;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }}
  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} 
/>
                  <Bar dataKey="assets" fill="#10b981" name="Quick Assets (Cash + A/R)" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="assets" position="top" formatter={(v: any) => {
                      const num = typeof v === 'number' ? v : 0;
                      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }} fill="#ffffff" fontSize={11} fontWeight="bold" />
                  </Bar>
                  <Bar dataKey="liabilities" fill="#ef4444" name="Current Liabilities" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="liabilities" position="top" formatter={(v: any) => {
                      const num = typeof v === 'number' ? v : 0;
                      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }} fill="#ffffff" fontSize={11} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">
              Comparison period is from {priorYearDate || comparisonDate}
              {isPriorDataMissing && (
                <span className="block text-yellow-500 mt-1">⚠ No historical data – comparison bars show zero</span>
              )}
            </div>
          </div>
        )}

        {/* Strategic Cash Ratio (CFO View) - shown only when isStrategic */}
        {isStrategic && (
          <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl">
            <h3 className="text-white text-sm font-bold mb-2">Strategic Cash Ratio (CFO View)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashChartData} margin={{ top: 30, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
  formatter={(value: any) => {
    const num = typeof value === 'number' ? value : 0;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }}
  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} 
/>
                  <Bar dataKey="assets" fill="#3b82f6" name="Cash Position" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="assets" position="top" formatter={(v: any) => {
                      const num = typeof v === 'number' ? v : 0;
                      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }} fill="#ffffff" fontSize={11} fontWeight="bold" />
                  </Bar>
                  <Bar dataKey="liabilities" fill="#f59e0b" name="Current Liabilities" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="liabilities" position="top" formatter={(v: any) => {
                      const num = typeof v === 'number' ? v : 0;
                      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }} fill="#ffffff" fontSize={11} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">
              Comparison period is from {priorYearDate || comparisonDate}
              {isPriorDataMissing && (
                <span className="block text-yellow-500 mt-1">⚠ No historical data – comparison bars show zero</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CASH FLOW COMPARISON - shown in both */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <CashFlowComparison netIncome={ni} operatingCashFlow={operatingCashFlow} />
      </div>

      {/* CUSTOMER CONCENTRATION CARD - shown in both */}
      <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
        <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users size={14} /> Customer Concentration Risk
        </h3>
        {loadingConcentration ? (
          <div className="text-center text-gray-400 text-xs py-6">
            <RefreshCw size={16} className="animate-spin inline mr-2" /> Loading customer data...
          </div>
        ) : !customerConcentration?.customers?.length ? (
          <div className="text-center text-gray-400 text-xs py-6">
            No customer revenue data available.
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-2">
              Total Revenue (period): <strong className="text-white">${customerConcentration.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              <span className="ml-2 text-gray-600">({customerConcentration.period})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2 font-medium">Customer</th>
                    <th className="text-right py-2 font-medium">Revenue</th>
                    <th className="text-right py-2 font-medium">% of Total</th>
                    <th className="text-right py-2 font-medium">A/R Balance</th>
                    <th className="text-right py-2 font-medium">DSO (days)</th>
                    <th className="text-center py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerConcentration.customers.map((cust: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-700/30 hover:bg-gray-800/20">
                      <td className="py-2 text-white">{cust.name}</td>
                      <td className="py-2 text-right font-mono text-emerald-400">
                        ${cust.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right font-mono text-blue-400">
                        {cust.percentOfTotal}%
                      </td>
                      <td className="py-2 text-right font-mono text-amber-400">
                        ${cust.arBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {cust.dso > 0 ? cust.dso : '—'}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                          ${cust.statusColor === 'green' ? 'bg-emerald-500/20 text-emerald-400' :
                            cust.statusColor === 'yellow' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'}`}>
                          {cust.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customerConcentration.customers.length === 5 && (
              <div className="text-[9px] text-gray-500 text-center mt-3 pt-2 border-t border-gray-700/50">
                Showing top 5 customers by revenue.
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== CUSTOMER ACQUISITION SIMULATOR - ONLY IN STRATEGIC VIEW ===== */}
      {isStrategic && (
        <div className="bg-gray-800/40 border border-blue-500/40 p-4 rounded-2xl mb-6">
          <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calculator size={14} /> What If? New Customer Acquisition Simulator
          </h3>

          {(() => {
            // Use avgMetrics if available and has customers, otherwise fallback to company-wide data
            const hasCustomerData = avgMetrics && avgMetrics.customerCount > 0;
            const baselineRev = hasCustomerData ? avgMetrics.avgRevenue : (rev || 0);
            const baselineCogs = hasCustomerData ? avgMetrics.avgCogs : (cogs || 0);
            const baselineMargin = hasCustomerData ? avgMetrics.avgMargin : (rev > 0 ? ((rev - cogs) / rev * 100) : 0);
            const customerCount = hasCustomerData ? avgMetrics.customerCount : 1; // placeholder

            if (loadingAvg) {
              return (
                <div className="text-center text-gray-400 text-xs py-6">
                  <RefreshCw size={16} className="animate-spin inline mr-2" /> Loading baseline metrics...
                </div>
              );
            }

            if (!rev || rev === 0) {
              return (
                <div className="text-center text-gray-400 text-xs py-6">
                  No revenue data available. Please sync your QuickBooks.
                </div>
              );
            }

            return (
              <>
                {/* Baseline stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-[11px]">
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="text-gray-500 text-[9px] uppercase">Current Customers</div>
                    <div className="text-white font-bold">{hasCustomerData ? customerCount : 'N/A'}</div>
                    {!hasCustomerData && <div className="text-[8px] text-gray-500">using company avg</div>}
                  </div>
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="text-gray-500 text-[9px] uppercase">Avg Revenue / Customer</div>
                    <div className="text-emerald-400 font-bold">${baselineRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="text-gray-500 text-[9px] uppercase">Avg COGS / Customer</div>
                    <div className="text-amber-400 font-bold">${baselineCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="text-gray-500 text-[9px] uppercase">Avg Gross Margin</div>
                    <div className="text-cyan-400 font-bold">{baselineMargin.toFixed(2)}%</div>
                  </div>
                </div>

                {!hasCustomerData && (
                  <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded text-[10px] text-yellow-400">
                    ⚠ Customer-level data not available – using company-wide revenue and COGS as baseline.
                  </div>
                )}

                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Projected Annual Revenue ($)</label>
                    <input
                      type="number"
                      value={projRevenue}
                      onChange={(e) => setProjRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Projected Annual COGS ($)</label>
                    <input
                      type="number"
                      value={projCogs}
                      onChange={(e) => setProjCogs(parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      min="0"
                    />
                    <button
                      onClick={() => setProjCogs(baselineCogs)}
                      className="text-[9px] text-blue-400 hover:underline mt-1"
                    >
                      Use baseline
                    </button>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-lg border border-gray-700">
                      <label className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={requiresNewHire}
                          onChange={(e) => setRequiresNewHire(e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        Requires new hire?
                      </label>
                      {requiresNewHire && (
                        <input
                          type="number"
                          value={annualHireCost}
                          onChange={(e) => setAnnualHireCost(parseFloat(e.target.value) || 0)}
                          className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs font-mono"
                          placeholder="$60,000"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const revProjected = projRevenue;
                  const cogsProjected = projCogs;
                  const grossProfit = revProjected - cogsProjected;
                  const margin = revProjected > 0 ? (grossProfit / revProjected) * 100 : 0;
                  const marginDelta = margin - baselineMargin;
                  const isBetter = marginDelta > 0;

                  const hireCost = requiresNewHire ? annualHireCost : 0;
                  const netIncrementalProfit = grossProfit - hireCost;
                  const monthlyProfit = netIncrementalProfit / 12;
                  const breakEvenMonths = monthlyProfit > 0 ? (hireCost / monthlyProfit) : Infinity;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="p-4 bg-gray-900 rounded-xl border border-blue-500/20">
                        <div className="text-[10px] text-gray-400 uppercase">Projected Gross Profit</div>
                        <div className={`text-xl font-mono font-bold ${grossProfit < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-900 rounded-xl border border-blue-500/20">
                        <div className="text-[10px] text-gray-400 uppercase">Projected Gross Margin</div>
                        <div className={`text-xl font-mono font-bold ${margin < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                          {margin.toFixed(2)}%
                        </div>
                        <div className={`text-[10px] font-mono ${isBetter ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isBetter ? '▲' : '▼'} {Math.abs(marginDelta).toFixed(2)}% vs baseline ({baselineMargin.toFixed(2)}%)
                        </div>
                      </div>
                      <div className="p-4 bg-gray-900 rounded-xl border border-amber-500/20">
                        <div className="text-[10px] text-gray-400 uppercase">Net Incremental Profit</div>
                        <div className={`text-xl font-mono font-bold ${netIncrementalProfit < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                          ${netIncrementalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {requiresNewHire && (
                          <div className="text-[9px] text-gray-500 mt-1">
                            Breakeven in {breakEvenMonths === Infinity ? '∞' : breakEvenMonths.toFixed(1)} months (vs ${annualHireCost.toLocaleString()} hire cost)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Interpretive Guidance */}
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-[11px] text-gray-300 italic">
                  <strong className="text-blue-400">🧠 Decision Insight:</strong> If the projected margin is <strong className="text-red-400">significantly below</strong> your baseline ({baselineMargin.toFixed(2)}%), 
                  this new customer will dilute your profitability. Check if they bring strategic value (e.g., entering a new market) or if you can raise prices / lower COGS.
                  {requiresNewHire && (
                    <span> Remember to account for the <strong className="text-amber-400">${annualHireCost.toLocaleString()}</strong> annual hire cost — the break-even window is critical.</span>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ===== REAL OPTIONS VALUATION CARD (CFO VIEW ONLY) ===== */}
      {isStrategic && (
        <div className="bg-gray-800/40 border border-purple-500/40 p-4 rounded-2xl mb-6">
          <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={14} /> Strategic Initiatives – Real Options Valuation
          </h3>
          <p className="text-gray-400 text-[10px] mb-4">
            Estimate the expected value of a risky strategic project using simplified real options thinking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Project Name</label>
              <input
                type="text"
                value={optionProjectName}
                onChange={(e) => setOptionProjectName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., New Product Launch"
              />
            </div>
            <div>
              <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Probability of Success (%)</label>
              <input
                type="number"
                value={optionProbability}
                onChange={(e) => setOptionProbability(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max="100"
                step="5"
              />
            </div>
            <div>
              <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Payoff Multiple (x)</label>
              <input
                type="number"
                value={optionPayoffMultiple}
                onChange={(e) => setOptionPayoffMultiple(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                step="0.5"
              />
              <div className="text-[9px] text-gray-500 mt-1">e.g., 5x means 5× investment if successful</div>
            </div>
            <div>
              <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Investment Cost ($)</label>
              <input
                type="number"
                value={optionInvestment}
                onChange={(e) => setOptionInvestment(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                step="10000"
              />
            </div>
          </div>

          {(() => {
            const inv = optionInvestment;
            const prob = optionProbability / 100;
            const multiple = optionPayoffMultiple;
            const payoff = inv * multiple;
            const expectedPayoff = payoff * prob;
            const expectedNetGain = expectedPayoff - inv;
            const roi = inv > 0 ? ((expectedPayoff - inv) / inv) * 100 : 0;
            const riskAdjustedReturn = prob * multiple - 1;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-900 rounded-xl border border-emerald-500/20 text-center">
                    <div className="text-[9px] text-gray-400 uppercase">Expected Payoff</div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                      ${expectedPayoff.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl border border-blue-500/20 text-center">
                    <div className="text-[9px] text-gray-400 uppercase">Expected Net Gain</div>
                    <div className={`text-xl font-mono font-bold ${expectedNetGain >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      ${expectedNetGain.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl border border-amber-500/20 text-center">
                    <div className="text-[9px] text-gray-400 uppercase">Expected ROI</div>
                    <div className={`text-xl font-mono font-bold ${roi >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {roi.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl border border-purple-500/20 text-center">
                    <div className="text-[9px] text-gray-400 uppercase">Risk‑Adjusted Return</div>
                    <div className={`text-xl font-mono font-bold ${riskAdjustedReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                      {riskAdjustedReturn.toFixed(2)}x
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1">= p × multiple − 1</div>
                  </div>
                </div>

                {/* Interpretation */}
                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg text-[11px] text-gray-300 italic">
                  <strong className="text-purple-400">🧠 Real‑Options Insight:</strong> 
                  {expectedNetGain >= 0 ? (
                    <span> This project has a <strong className="text-green-400">positive expected value</strong> (${expectedNetGain.toLocaleString(undefined, { minimumFractionDigits: 0 })}). 
                    With a {optionProbability}% chance of achieving a {multiple}x return, the risk‑adjusted return is <strong className="text-purple-400">{riskAdjustedReturn.toFixed(2)}x</strong>. 
                    Consider the strategic optionality – you can always abandon if early signs are poor.</span>
                  ) : (
                    <span> This project has a <strong className="text-red-400">negative expected value</strong> (${expectedNetGain.toLocaleString(undefined, { minimumFractionDigits: 0 })}). 
                    The probability ({optionProbability}%) and payoff ({multiple}x) are too low to justify the investment. 
                    You might negotiate a lower cost or improve the success odds before proceeding.</span>
                  )}
                </div>

                <div className="text-[9px] text-gray-500 border-t border-gray-700 pt-2">
                  * Assumes full loss of investment if project fails. Real options also include the value of waiting, expanding, or abandoning.
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== BANK RECONCILIATION STATUS - ONLY IN CPA VIEW ===== */}
      {!isStrategic && (
        <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
          <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Banknote size={14} /> Bank Reconciliation Status
          </h3>
          {!bankReconData?.accounts?.length ? (
            <div className="text-center text-gray-400 text-xs py-6">
              No bank account data available. Please connect your bank or check the backend endpoint.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2 font-medium">Account</th>
                    <th className="text-left py-2 font-medium">Last Reconciled</th>
                    <th className="text-left py-2 font-medium">Uncleared Items</th>
                    <th className="text-right py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {bankReconData.accounts.map((acc: any) => (
                    <tr key={acc.id} className="border-b border-gray-700/50 hover:bg-gray-800/20">
                      <td className="py-2 font-mono text-white">{acc.name}</td>
                      <td className="py-2 text-gray-300">{acc.lastReconciledDate || 'Never'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${acc.unclearedCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {acc.unclearedCount}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedAccount(acc);
                            setIsDrillDownOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 ml-auto text-[10px] font-bold"
                          disabled={!acc.unclearedItems?.length}
                        >
                          <Eye size={12} /> Drill down
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Drill‑down Modal for uncleared items */}
          {isDrillDownOpen && selectedAccount && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <h4 className="text-white font-bold text-sm">Uncleared Transactions – {selectedAccount.name}</h4>
                  <button onClick={() => setIsDrillDownOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <div className="overflow-auto p-4">
                  {!selectedAccount.unclearedItems?.length ? (
                    <p className="text-gray-400 text-center text-sm">No uncleared transactions for this account.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="text-gray-400 border-b border-gray-700">
                        <tr>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Description</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAccount.unclearedItems.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-700/30">
                            <td className="py-2 text-gray-300">{item.date}</td>
                            <td className="py-2 text-white">{item.description}</td>
                            <td className="py-2 text-gray-300 capitalize">{item.type}</td>
                            <td className="py-2 text-right font-mono text-amber-400">
                              ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="p-3 border-t border-gray-700 text-right">
                  <button
                    onClick={() => setIsDrillDownOpen(false)}
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== LIQUIDITY STRESS TEST - shown in both ===== */}
      <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
        <h3 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Liquidity Stress Test
        </h3>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Revenue Drop (%)</div>
            <input
              type="number"
              value={stressParams.dropPercent}
              onChange={(e) => setStressParams({ ...stressParams, dropPercent: parseFloat(e.target.value) || 0 })}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 w-24 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              min="0"
              max="100"
            />
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Stress Duration (months)</div>
            <input
              type="number"
              value={stressParams.durationMonths}
              onChange={(e) => setStressParams({ ...stressParams, durationMonths: parseInt(e.target.value) || 1 })}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 w-24 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              min="1"
              max="36"
            />
          </div>
          <button
            onClick={handleStressTest}
            disabled={runningStress}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition"
          >
            {runningStress ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            Run Stress Test
          </button>
        </div>

        {stressResult && (
          <div className="mt-4 space-y-4">
            {/* Projection Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stressResult.cashHistory.map((v: number, i: number) => ({ month: i, cash: v }))} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
  formatter={(value: any) => {
    const num = typeof value === 'number' ? value : 0;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }}
  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} 
/>
                  <Line type="monotone" dataKey="cash" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Zero Cash', fill: '#ef4444', fontSize: 10 }} />
                  {stressResult.breachMonth && (
                    <ReferenceLine x={stressResult.breachMonth} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Covenant Breach', fill: '#f59e0b', fontSize: 10 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Narrative Output */}
            <div className="p-4 bg-gray-900 rounded-xl border border-amber-500/20 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
              {stressResult.narrative}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-gray-900 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-500 text-[9px] uppercase">End Cash</div>
                <div className={`${stressResult.finalCash < 0 ? 'text-red-400' : 'text-emerald-400'} font-bold`}>
                  ${stressResult.finalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-2 bg-gray-900 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-500 text-[9px] uppercase">Monthly Burn (stress)</div>
                <div className="text-amber-400 font-bold">
                  ${(-stressResult.monthlyCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-2 bg-gray-900 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-500 text-[9px] uppercase">Runway (stress)</div>
                <div className="text-blue-400 font-bold">
                  {stressResult.stressedRunway === Infinity ? '∞' : stressResult.stressedRunway.toFixed(1) + ' mos'}
                </div>
              </div>
              <div className="p-2 bg-gray-900 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-500 text-[9px] uppercase">Equity Needed</div>
                <div className={`${stressResult.equityNeeded > 0 ? 'text-red-400' : 'text-green-400'} font-bold`}>
                  ${stressResult.equityNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== JOURNAL ENTRY AUDIT TRAIL - ONLY IN CPA VIEW ===== */}
      {!isStrategic && (
        <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
          <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calculator size={14} /> Journal Entry Audit Trail – Last 50 Manual Entries
          </h3>
          {loadingEntries ? (
            <div className="text-center text-gray-400 text-xs py-6">
              <RefreshCw size={16} className="animate-spin inline mr-2" /> Loading journal entries...
            </div>
          ) : !journalEntries.length ? (
            <div className="text-center text-gray-400 text-xs py-6">
              No manual journal entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Entry No.</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map((entry: any) => (
                    <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-800/20">
                      <td className="py-2 text-gray-300">{entry.txn_date}</td>
                      <td className="py-2 font-mono text-white">{entry.doc_number || '—'}</td>
                      <td className="py-2 text-gray-300 max-w-xs truncate" title={entry.private_note}>
                        {entry.private_note || 'No description'}
                      </td>
                      <td className="py-2 text-right font-mono text-amber-400">
                        ${entry.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.status === 'Approved' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {journalEntries.length === 50 && (
                <div className="text-[9px] text-gray-500 text-center mt-3 pt-2 border-t border-gray-700/50">
                  Showing last 50 entries. Use QuickBooks for full history.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== WACC CARD - ONLY IN STRATEGIC VIEW ===== */}
      {isStrategic && (
        <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
          <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calculator size={14} /> Weighted Average Cost of Capital (WACC)
          </h3>

          {(() => {
            const taxRate = 0.25;
            const marketRiskPremium = 0.05;
            const riskFreeRate = 0.04;
            const beta = 1.0;
            const costOfEquity = riskFreeRate + beta * marketRiskPremium;
            const totalDebt = std + ltd;
            const totalEquityBook = totalEquity;
            let costOfDebt = 0.06;
            if (totalDebt > 0 && interest > 0) {
              costOfDebt = interest / totalDebt;
            }
            const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
            const firmValue = totalDebt + totalEquityBook;
            const weightEquity = firmValue > 0 ? totalEquityBook / firmValue : 0;
            const weightDebt = firmValue > 0 ? totalDebt / firmValue : 0;
            const wacc = (weightEquity * costOfEquity) + (weightDebt * afterTaxCostOfDebt);

            const formatPercent = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-900 rounded-xl border border-purple-500/20 text-center">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Estimated WACC</div>
                    <div className="text-3xl font-mono font-bold text-purple-400 mt-1">
                      {formatPercent(wacc)}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1">
                      Minimum return required to cover all capital providers
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Capital Structure & Costs</div>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Equity (book value)</span>
                        <span className="font-mono text-white">${totalEquityBook.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Debt (total)</span>
                        <span className="font-mono text-white">${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                        <span className="text-gray-400">Equity weight</span>
                        <span className="font-mono text-purple-300">{formatPercent(weightEquity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Debt weight</span>
                        <span className="font-mono text-purple-300">{formatPercent(weightDebt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cost of equity (CAPM)</span>
                        <span className="font-mono text-emerald-400">{formatPercent(costOfEquity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cost of debt (after-tax)</span>
                        <span className="font-mono text-emerald-400">{formatPercent(afterTaxCostOfDebt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-[9px] text-gray-500 italic">
                  <strong className="text-gray-400">Assumptions:</strong> Risk-free rate = {formatPercent(riskFreeRate)}, Beta = {beta.toFixed(1)}, Market risk premium = {formatPercent(marketRiskPremium)}. 
                  Tax rate = {formatPercent(taxRate)}. Cost of debt uses interest expense / total debt {totalDebt > 0 && interest > 0 ? `($${interest.toLocaleString()} / $${totalDebt.toLocaleString()})` : '(default 6%)'}. 
                  Book values used as proxy for market values.
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== ROIC vs WACC - ONLY IN STRATEGIC VIEW ===== */}
      {isStrategic && (
        <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl mb-6">
          <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={14} /> Return on Invested Capital (ROIC) vs. WACC
          </h3>

          {(() => {
            const taxRate = 0.25;
            const nopat = ni + interest * (1 - taxRate);
            const investedCapital = totalEquity + std + ltd;
            const roic = investedCapital !== 0 ? (nopat / Math.abs(investedCapital)) * 100 : 0;

            // Recalculate WACC using same assumptions as in the WACC card
            const marketRiskPremium = 0.05;
            const riskFreeRate = 0.04;
            const beta = 1.0;
            const costOfEquity = riskFreeRate + beta * marketRiskPremium;
            const totalDebt = std + ltd;
            const totalEquityBook = totalEquity;
            let costOfDebt = 0.06;
            if (totalDebt > 0 && interest > 0) {
              costOfDebt = interest / totalDebt;
            }
            const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
            const firmValue = totalDebt + totalEquityBook;
            const weightEquity = firmValue > 0 ? totalEquityBook / firmValue : 0;
            const weightDebt = firmValue > 0 ? totalDebt / firmValue : 0;
            const wacc = (weightEquity * costOfEquity) + (weightDebt * afterTaxCostOfDebt);
            const waccPercent = wacc * 100;

            const spread = roic - waccPercent;
            const isValueCreating = spread > 0;

            const formatPercent = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900 rounded-xl border border-indigo-500/20 text-center">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">ROIC</div>
                  <div className={`text-2xl font-mono font-bold mt-1 ${roic < 0 ? 'text-red-400' : 'text-indigo-400'}`}>
                    {formatPercent(roic)}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">NOPAT / Invested Capital</div>
                </div>
                <div className="p-4 bg-gray-900 rounded-xl border border-purple-500/20 text-center">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">WACC</div>
                  <div className="text-2xl font-mono font-bold mt-1 text-purple-400">
                    {formatPercent(waccPercent)}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">Weighted Average Cost of Capital</div>
                </div>
                <div className="p-4 bg-gray-900 rounded-xl border border-emerald-500/20 text-center">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Economic Spread</div>
                  <div className={`text-2xl font-mono font-bold mt-1 ${isValueCreating ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercent(spread)}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">
                    {isValueCreating ? '✅ Creating value' : '⚠️ Destroying value'}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* BOTTOM CARDS (Runway & Debt-to-Equity) - shown in both */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <RunwayVisualCard runwayMonths={parseFloat(calculatedRunway.toFixed(1))} cashTotal={totalCashPosition} monthlyBurn={monthlyBurn} />
        <DebtToEquityVisualCard debtToEquity={debtToEquity} totalLiab={totalLiab} totalEquity={totalEquity} totalAssets={totalAssets} />
      </div>

      {/* MACRO EQUITY BRIEF - shown in both */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <Scale size={16} /> Macro Equity Brief
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] font-mono">
          <div className="p-4 bg-gray-950 rounded-xl border border-emerald-500/30">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Asset Quality</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{((cash + ar) / totalAssets * 100).toFixed(2)}%</div>
            <div className="text-[9px] text-gray-400 mt-1">Liquid assets / Total assets</div>
          </div>
          <div className="p-4 bg-gray-950 rounded-xl border border-blue-500/30">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Profit Retention</div>
            <div className="text-lg font-bold text-blue-400 mt-1">{(() => { const v = (ni / (rev || 1)) * 100; return Math.abs(v) >= 999.99 ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2); })()}%</div>
            <div className="text-[9px] text-gray-400 mt-1">Net income / Revenue</div>
          </div>
          <div className="p-4 bg-gray-950 rounded-xl border border-purple-500/30 text-right">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Total Derived Equity</div>
            <div className={`text-2xl font-mono font-bold mt-2 ${negClass(totalEquity)}`}>${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CPAView;
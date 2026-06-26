'use client';
import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {
  Factory,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Landmark,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Wallet,
  CreditCard,
  ShoppingCart,
  Banknote,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface IndustryProfile {
  naics?: string;
  zip_code?: string;
  local_stats?: { establishments?: number; employees?: number; level?: string; geocoder_status?: string };
  wage_data?: { avg_weekly_wage?: number; annual_wage_estimate?: number; employment_level?: number; year?: number; quarter?: number; industry_code?: string };
  economic_indicators?: {
    industry_price_index?: { value: number; series_id: string };
    unemployment_rate?: number;
    unemployment_rate_u6?: number;
    fed_funds_rate?: number;
    credit_spread_baa?: number;
    ten_year_treasury?: number;
    sloos_tightening?: number;
    sloos_tightening_yoy_change?: number;
  };
  price_trends?: { series_id?: string; monthly_ppi?: { date: string; value: number }[]; trend?: string; yoy_change?: number };
  employment_trends?: { series_id?: string; latest_employment?: number; monthly_employment?: { date: string; value: number }[] };
  gdp_data?: { value_added?: { year: string; value: number }[]; compensation?: { year: string; value: number }[] };
  retail_data?: { relevant?: boolean; category_code?: string; retail_sales_trend?: string; latest_monthly_sales_millions?: number; sales_change_pct_ytd?: number; monthly_sales?: { date: string; value: number }[] };
  sba_lending?: { loan_count?: number; total_amount_millions?: number; avg_loan_size?: number; latest_year?: string; state?: string };
  data_quality?: Record<string, string>;
  generated_at?: string;
}

interface SbaStatus {
  csv_cached: boolean;
  db_ready: boolean;
  needs_refresh: boolean;
  age_days: number | null;
  last_sync: string | null;
  refresh_threshold_days: number;
}

interface SbaDatasetInfo {
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
}

const SBA_DATASET_URL = 'https://data.sba.gov/dataset/7-a-504-foia';
const SBA_REFRESH_DAYS = 90;

const FALLBACK_PROFILE: IndustryProfile = {
  naics: "3118",
  local_stats: { establishments: 42, employees: 1150, level: "estimated" },
  wage_data: { avg_weekly_wage: 1150, annual_wage_estimate: 59800, employment_level: 0, year: 2025, quarter: 1, industry_code: "fallback" },
  economic_indicators: {
    industry_price_index: { value: 123.5, series_id: "PPI" },
    unemployment_rate: 3.9,
    unemployment_rate_u6: 7.3,
    fed_funds_rate: 5.33,
    credit_spread_baa: 1.8,
    ten_year_treasury: 4.2,
    sloos_tightening: 10.0,
  },
  price_trends: {
    series_id: "PCU31183118",
    monthly_ppi: [
      { date: "2024-01", value: 117.5 }, { date: "2024-02", value: 118.2 }, { date: "2024-03", value: 119.0 },
      { date: "2024-04", value: 120.1 }, { date: "2024-05", value: 121.3 }, { date: "2024-06", value: 122.4 },
      { date: "2024-07", value: 123.0 }, { date: "2024-08", value: 123.5 }, { date: "2024-09", value: 123.9 },
      { date: "2024-10", value: 124.2 }, { date: "2024-11", value: 124.6 }, { date: "2024-12", value: 125.0 },
    ],
    trend: "up",
    yoy_change: 1.4
  },
  employment_trends: {
    series_id: "CES3000000001",
    latest_employment: 141200,
    monthly_employment: [
      { date: "2024-01", value: 140500 }, { date: "2024-02", value: 140900 }, { date: "2024-03", value: 141300 },
      { date: "2024-04", value: 141600 }, { date: "2024-05", value: 141900 }, { date: "2024-06", value: 142200 },
      { date: "2024-07", value: 142400 }, { date: "2024-08", value: 142600 }, { date: "2024-09", value: 142800 },
      { date: "2024-10", value: 143000 }, { date: "2024-11", value: 143100 }, { date: "2024-12", value: 143200 },
    ]
  },
  gdp_data: {
    value_added: [
      { year: "2021", value: 228000 }, { year: "2022", value: 235000 }, { year: "2023", value: 242000 }, { year: "2024", value: 249000 },
    ],
    compensation: [
      { year: "2021", value: 162000 }, { year: "2022", value: 167000 }, { year: "2023", value: 172000 }, { year: "2024", value: 177000 },
    ]
  },
  retail_data: { relevant: false },
  sba_lending: { loan_count: 0, total_amount_millions: 0, avg_loan_size: 0, latest_year: "N/A", state: "N/A" },
  generated_at: new Date().toISOString()
};

const DynamicIndustryWidget = ({ naics, zipCode }: { naics: string; zipCode: string }) => {
  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [sbaStatus, setSbaStatus] = useState<SbaStatus | null>(null);
  const [refreshingSba, setRefreshingSba] = useState(false);
  const [sbaDatasetInfo, setSbaDatasetInfo] = useState<SbaDatasetInfo>({
    lastUpdated: null,
    loading: false,
    error: null,
  });

useEffect(() => {
  if (!zipCode || zipCode.length !== 5) {
    setLoading(false); // Add this to prevent stuck loading state
    return;
  }
  
  console.log('[DynamicWidget] Fetch triggered - NAICS:', naics, 'Zip:', zipCode);
  setLoading(true);
  const url = `http://localhost:5001/api/industry/profile/${naics}?zip_code=${zipCode}`;
  console.log("[DynamicWidget] Fetching: ", url);
  
  let cancelled = false; // Add cleanup flag
  
  const timer = setTimeout(() => {
    fetch(url, { credentials: 'include' })
    .then(res => {
      console.log("[DynamicWidget] Response status: ", res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (cancelled) return; // Check if cancelled
      
      console.log("[DynamicWidget] Received data: ", data);
      if (data && data.local_stats && 'establishments' in data.local_stats) {
        setProfile(data);
      } else {
        console.warn("[DynamicWidget] Data missing local_stats, using fallback");
        setProfile(FALLBACK_PROFILE);
      }
      setLoading(false);
    })
    .catch(err => {
      if (cancelled) return; // Check if cancelled
      
      console.error("[DynamicWidget] Fetch error: ", err);
      console.log("[DynamicWidget] Using fallback profile");
      setProfile(FALLBACK_PROFILE);
      setLoading(false);
    });
  }, 400);
  
  return () => {
    cancelled = true; // Cleanup on unmount or dependency change
    clearTimeout(timer);
  };
}, [naics, zipCode]); // Make sure these are stable values

  useEffect(() => {
    fetchSbaStatus();
    fetchSbaDatasetInfo();
  }, []);

  const fetchSbaStatus = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/sba/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSbaStatus(data);
      }
    } catch (err) {
      console.error('[DynamicWidget] SBA status fetch error:', err);
    }
  };

  const fetchSbaDatasetInfo = async () => {
    setSbaDatasetInfo(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('http://localhost:5001/api/sba/dataset-info', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Backend returned error');
      }

      setSbaDatasetInfo({
        lastUpdated: data.last_updated || null,
        loading: false,
        error: data.error || null,
      });
    } catch (err) {
      console.error('[DynamicWidget] SBA dataset info fetch error:', err);
      setSbaDatasetInfo({
        lastUpdated: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch dataset info',
      });
    }
  };

  const handleRefreshSba = async () => {
    setRefreshingSba(true);
    try {
      const res = await fetch('http://localhost:5001/api/sba/refresh', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSbaStatus(data.status);
      } else {
        console.error('[DynamicWidget] SBA refresh failed:', data.message);
      }
    } catch (err) {
      console.error('[DynamicWidget] SBA refresh error:', err);
    } finally {
      setRefreshingSba(false);
    }
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <div className="p-6 text-gray-400 text-sm animate-pulse">Loading industry intelligence...</div>;

  const activeProfile = profile || FALLBACK_PROFILE;
  const zipPrefix = zipCode.substring(0, 3);
  const nearbyZips = Array.from({ length: 15 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return `${zipPrefix}${num}`;
  }).filter(z => z !== zipCode);

  const SectionHeader = ({ icon: Icon, title, sectionKey }: { icon: React.ElementType; title: string; sectionKey: string }) => (
    <button onClick={() => toggleSection(sectionKey)} className="flex items-center justify-between w-full mb-4 group">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
      {collapsedSections[sectionKey] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
    </button>
  );

  const MetricCard = ({ label, value, unit, help, alert }: { label: string; value: string | number | null | undefined; unit: string; help: string; alert?: 'good' | 'warning' | 'danger' }) => {
    const displayValue = (() => {
      if (value === undefined || value === null) return 'N/A';
      if (typeof value === 'number') return value.toLocaleString('en-US');
      return value;
    })();
    return (
      <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</span>
          {alert === 'danger' && <AlertTriangle size={12} className="text-red-400" />}
          {alert === 'warning' && <AlertTriangle size={12} className="text-amber-400" />}
          {alert === 'good' && <CheckCircle size={12} className="text-emerald-400" />}
          {!alert && <HelpCircle size={12} className="text-gray-500 hover:text-cyan-400" />}
        </div>
        <div className="flex items-end gap-1">
          <span className="text-xl font-bold text-white">{displayValue}</span>
          {unit && <span className="text-[10px] text-gray-500 mb-1">{unit}</span>}
        </div>
      </div>
    );
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Unknown';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const sbaAgeText = sbaStatus?.age_days != null
    ? `${sbaStatus.age_days} day${sbaStatus.age_days !== 1 ? 's' : ''}`
    : 'unknown';

  const getSbaDataStatusMessage = () => {
    const updateFrequency = 'SBA updates the data once every three months.';
    if (sbaDatasetInfo.loading) {
      return 'Checking SBA dataset...';
    }
    if (sbaDatasetInfo.error) {
      return `SBA dataset info unavailable. ${updateFrequency}`;
    }
    if (sbaDatasetInfo.lastUpdated) {
      return `SBA Data last updated on ${sbaDatasetInfo.lastUpdated}. ${updateFrequency}`;
    }
    return `SBA dataset date unknown. ${updateFrequency}`;
  };

  const isSbaDataStale = () => {
    if (!sbaDatasetInfo.lastUpdated) return false;
    const parsed = new Date(sbaDatasetInfo.lastUpdated);
    if (isNaN(parsed.getTime())) return false;
    const daysSinceUpdate = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > SBA_REFRESH_DAYS;
  };

  return (
    <div className="space-y-6">
      {/* ── SBA Data Source Status ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {sbaDatasetInfo.loading ? (
              <>
                <RefreshCw size={14} className="animate-spin text-cyan-400" />
                <span>{getSbaDataStatusMessage()}</span>
              </>
            ) : sbaDatasetInfo.error ? (
              <>
                <AlertTriangle size={14} className="text-amber-400" />
                <span>
                  {getSbaDataStatusMessage()} ·
                  <a
                    href={SBA_DATASET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 ml-1 text-amber-300/70 hover:text-amber-300 transition-colors"
                  >
                    <ExternalLink size={10} />
                    View on SBA
                  </a>
                </span>
              </>
            ) : isSbaDataStale() ? (
              <>
                <AlertTriangle size={14} className="text-amber-400" />
                <span>
                  {getSbaDataStatusMessage()} ·
                  <a
                    href={SBA_DATASET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 ml-1 text-amber-300/70 hover:text-amber-300 transition-colors"
                  >
                    <ExternalLink size={10} />
                    Check SBA for updates
                  </a>
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={14} className="text-emerald-400" />
                <span>{getSbaDataStatusMessage()}</span>
              </>
            )}
          </div>
          {sbaStatus?.needs_refresh && (
            <button
              onClick={handleRefreshSba}
              disabled={refreshingSba}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-[10px] font-medium text-gray-300 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={10} className={refreshingSba ? 'animate-spin' : ''} />
              {refreshingSba ? 'Processing...' : 'Re-process'}
            </button>
          )}
        </div>
      </div>

      {/* ── Local Market ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <SectionHeader icon={Factory} title="Local Market" sectionKey="local" />
        {!collapsedSections['local'] && (
          <>
            {(activeProfile.local_stats?.level === 'fallback' || activeProfile.local_stats?.geocoder_status === 'default_fallback') ? (
              <>
                <div className="mb-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                  <div className="text-amber-300 text-xs leading-relaxed">
                    <p className="mb-3 font-medium">
                      Currently we don&apos;t have data for that combination of industry sector and ZIP Code. Please update your search with one of the following ZIP Codes within a 15-mile radius:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {nearbyZips.map(z => (
                        <span key={z} className="px-3 py-1.5 bg-gray-900/80 border border-amber-500/40 rounded-lg text-[11px] font-mono text-amber-200 shadow-sm">
                          {z}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
                  <MetricCard label="Establishments" value={undefined} unit="" help="Total active businesses in this sector locally." />
                  <MetricCard label="Employees" value={undefined} unit="" help="Total employed persons in this sector locally." />
                  <MetricCard label="Avg Weekly Wage" value={undefined} unit="" help="Average weekly wage in this sector locally." />
                  <MetricCard label="Annual Wage Est." value={undefined} unit="" help="Estimated annual wage (weekly x 52)." />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Establishments" value={activeProfile.local_stats?.establishments} unit="" help="Total active businesses in this sector locally." />
                <MetricCard label="Employees" value={activeProfile.local_stats?.employees} unit="" help="Total employed persons in this sector locally." />
                <MetricCard label="Avg Weekly Wage" value={activeProfile.wage_data?.avg_weekly_wage ? `$${activeProfile.wage_data.avg_weekly_wage.toLocaleString()}` : undefined} unit="" help="Average weekly wage in this sector locally (QCEW)." />
                <MetricCard label="Annual Wage Est." value={activeProfile.wage_data?.annual_wage_estimate ? `$${activeProfile.wage_data.annual_wage_estimate.toLocaleString()}` : undefined} unit="" help="Estimated annual wage (weekly x 52)." />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Economic Context & Credit ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <SectionHeader icon={DollarSign} title="Economic Context & Credit" sectionKey="economics" />
        {!collapsedSections['economics'] && (
          <>
            {/* 1. Inflation Banner */}
            {(() => {
              const yoy = activeProfile.price_trends?.yoy_change;
              let sentence = "Evaluating price trends compared to last year...";
              let cls = "bg-gray-700/30 border-gray-600/50 text-gray-300";
              if (yoy !== undefined && yoy !== null) {
                const abs = Math.abs(yoy).toFixed(1);
                if (yoy > 0) { sentence = `Average supplier prices are ${abs}% higher than last year.`; cls = "bg-red-500/10 border-red-500/30 text-red-300"; }
                else if (yoy < 0) { sentence = `Average supplier prices are ${abs}% lower than last year.`; cls = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"; }
                else { sentence = "Average supplier prices are unchanged from last year."; }
              }
              return (
                <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl border ${cls}`}>
                  <TrendingUp size={16} className={yoy && yoy > 0 ? "text-red-400" : yoy && yoy < 0 ? "text-emerald-400" : "text-gray-400"} />
                  <span className="text-sm font-medium">{sentence}</span>
                </div>
              );
            })()}

            {/* 2. Unemployment Banner */}
            {(() => {
              const u3 = activeProfile.economic_indicators?.unemployment_rate;
              const u6 = activeProfile.economic_indicators?.unemployment_rate_u6;
              if (u3 !== undefined && u6 !== undefined) {
                return (
                  <div className="mb-4 flex flex-col gap-1 p-4 rounded-xl border bg-indigo-500/10 border-indigo-500/30 text-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-300">Labor Market Reality</span>
                    </div>
                    <p className="text-sm leading-relaxed">The official unemployment rate of <span className="font-bold text-white">{u3}%</span> only counts people actively looking for a job.</p>
                    <p className="text-sm leading-relaxed">The 'real' rate of <span className="font-bold text-white">{u6}%</span> is higher because it also includes people who gave up or are stuck working part-time when they need full-time hours.</p>
                  </div>
                );
              }
              return null;
            })()}

            {/* 3. Fed Funds Banner */}
            {(() => {
              const fed = activeProfile.economic_indicators?.fed_funds_rate;
              let sentence = "The Federal Reserve's bank-to-bank interest rate is currently unavailable.";
              let cls = "bg-gray-700/30 border-gray-600/50 text-gray-300";
              if (fed !== undefined && fed !== null) {
                if (fed >= 4.5) { sentence = `The Federal Reserve's bank-to-bank interest rate is currently ${fed}%. This is historically high, meaning the cost of borrowing for business loans and credit cards is very expensive.`; cls = "bg-red-500/10 border-red-500/30 text-red-300"; }
                else if (fed >= 2.5) { sentence = `The Federal Reserve's bank-to-bank interest rate is currently ${fed}%. This is near historical averages, meaning the cost of borrowing for business loans and credit cards is priced normally.`; cls = "bg-amber-500/10 border-amber-500/30 text-amber-300"; }
                else { sentence = `The Federal Reserve's bank-to-bank interest rate is currently ${fed}%. This is historically low, meaning the cost of borrowing for business loans and credit cards is very cheap.`; cls = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"; }
              }
              return (
                <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl border ${cls}`}>
                  <DollarSign size={16} className={fed >= 4.5 ? "text-red-400" : fed >= 2.5 ? "text-amber-400" : "text-emerald-400"} />
                  <span className="text-sm font-medium">{sentence}</span>
                </div>
              );
            })()}

            {/* 4. Credit Spread Banner */}
            {(() => {
              const spread = activeProfile.economic_indicators?.credit_spread_baa;
              let sentence = "The credit market risk premium is currently unavailable.";
              let cls = "bg-gray-700/30 border-gray-600/50 text-gray-300";
              if (spread !== undefined && spread !== null) {
                if (spread <= 1.0) { sentence = `The gap between safe and risky loans is dangerously low (${spread}%). Investors are blind to risks, signaling a massive, unsustainable economic bubble. While it's easy to borrow right now, a sudden market pop could freeze credit instantly.`; cls = "bg-purple-500/10 border-purple-500/30 text-purple-300"; }
                else if (spread <= 2.0) { sentence = `The gap between safe and risky loans is very healthy (${spread}%). Banks are confident, making this a great time to borrow cash to expand your business or lock in good rates.`; cls = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"; }
                else if (spread <= 3.5) { sentence = `The gap between safe and risky loans is slightly elevated (${spread}%). This usually means banks are reacting to creeping inflation or gentle interest rate hikes by the Federal Reserve, making borrowing a bit more expensive.`; cls = "bg-amber-500/10 border-amber-500/30 text-amber-300"; }
                else if (spread <= 5.0) { sentence = `The gap between safe and risky loans is widening (${spread}%), which is a classic warning sign of a mild recession. Banks are getting nervous, so expect higher interest rates and stricter rules to get a business loan.`; cls = "bg-orange-500/10 border-orange-500/30 text-orange-300"; }
                else { sentence = `The gap between safe and risky loans is extremely high (${spread}%), signaling a systemic economic crisis. Banks are terrified of businesses going under, meaning credit is frozen and borrowing money is nearly impossible.`; cls = "bg-red-500/10 border-red-500/30 text-red-300"; }
              }
              return (
                <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl border ${cls}`}>
                  <CreditCard size={16} className={spread <= 1.0 ? "text-purple-400" : spread <= 2.0 ? "text-emerald-400" : spread <= 3.5 ? "text-amber-400" : spread <= 5.0 ? "text-orange-400" : "text-red-400"} />
                  <span className="text-sm font-medium">{sentence}</span>
                </div>
              );
            })()}

            {/* 5. 10Y Treasury Banner */}
            {(() => {
              const tenYear = activeProfile.economic_indicators?.ten_year_treasury;
              let sentence = "The baseline rate for long-term borrowing is currently unavailable.";
              let cls = "bg-gray-700/30 border-gray-600/50 text-gray-300";
              if (tenYear !== undefined && tenYear !== null) {
                if (tenYear >= 4.5) { sentence = `The baseline rate for long-term borrowing is currently ${tenYear}%. This is very high, meaning the interest rates on long-term business loans and commercial real estate mortgages are extremely expensive right now.`; cls = "bg-red-500/10 border-red-500/30 text-red-300"; }
                else if (tenYear >= 2.5) { sentence = `The baseline rate for long-term borrowing is currently ${tenYear}%. This is near historical averages, meaning the cost of financing long-term assets like equipment or real estate is priced normally.`; cls = "bg-amber-500/10 border-amber-500/30 text-amber-300"; }
                else { sentence = `The baseline rate for long-term borrowing is currently ${tenYear}%. This is historically low, making it a very cheap time to take out a long-term loan to buy equipment or commercial property.`; cls = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"; }
              }
              return (
                <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl border ${cls}`}>
                  <Landmark size={16} className={tenYear >= 4.5 ? "text-red-400" : tenYear >= 2.5 ? "text-amber-400" : "text-emerald-400"} />
                  <span className="text-sm font-medium">{sentence}</span>
                </div>
              );
            })()}

            {/* 6. SLOOS Banner */}
            {(() => {
              const sloos = activeProfile.economic_indicators?.sloos_tightening;
              let sentence = "The national bank lending mood survey is currently unavailable.";
              let cls = "bg-gray-700/30 border-gray-600/50 text-gray-300";
              let icon = <CreditCard size={16} className="text-gray-400" />;

              if (sloos !== undefined && sloos !== null) {
                if (sloos > 30) {
                  sentence = `Banks are making it very hard to get a loan right now. ${sloos}% of banks report they are strictly raising their lending rules. Expect heavy scrutiny, demands for more collateral, or even cuts to your existing credit lines.`;
                  cls = "bg-red-500/10 border-red-500/30 text-red-300";
                  icon = <AlertTriangle size={16} className="text-red-400" />;
                } else if (sloos > 10) {
                  sentence = `Banks are getting a bit cautious. ${sloos}% of banks report they are tightening their lending rules. It might require a higher credit score, more paperwork, or more profit history to get approved for a loan right now.`;
                  cls = "bg-amber-500/10 border-amber-500/30 text-amber-300";
                  icon = <TrendingUp size={16} className="text-amber-400" />;
                } else if (sloos > 0) {
                  sentence = `Banks are slightly cautious, but lending is mostly normal. Only ${sloos}% of banks report tightening their rules. You should still be able to get a loan, but shop around for the best terms.`;
                  cls = "bg-blue-500/10 border-blue-500/30 text-blue-300";
                  icon = <CreditCard size={16} className="text-blue-400" />;
                } else {
                  sentence = `Banks are actively competing to lend money. With ${Math.abs(sloos)}% of banks easing their rules, this is an excellent time to apply for a business loan, ask for a higher credit limit, or refinance existing debt.`;
                  cls = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
                  icon = <CheckCircle size={16} className="text-emerald-400" />;
                }
              }

              return (
                <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl border ${cls}`}>
                  {icon}
                  <span className="text-sm font-medium">{sentence}</span>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ── Price & Employment Trends ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <SectionHeader icon={TrendingUp} title="Price & Employment Trends" sectionKey="trends" />
        {!collapsedSections['trends'] && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProfile.price_trends?.monthly_ppi && activeProfile.price_trends.monthly_ppi.length > 0 && (
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400 mb-2 flex justify-between">
                  <span>Industry Price Index (Monthly)</span>
                  <span className={activeProfile.price_trends.trend === 'up' ? 'text-red-400' : 'text-emerald-400'}>
                    {activeProfile.price_trends.trend === 'up' ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />} Trend
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeProfile.price_trends.monthly_ppi}>
                      <defs> <linearGradient id="ppiGrad" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} /> <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /> </linearGradient> </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.slice(2)} />
                      <YAxis stroke="#6b7280" fontSize={10} />
                      <Tooltip 
  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
  formatter={(value: number) => Math.round(value).toLocaleString()}
/>
                      <Area type="monotone" dataKey="value" stroke="#f59e0b" fillOpacity={1} fill="url(#ppiGrad)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {activeProfile.employment_trends?.monthly_employment && activeProfile.employment_trends.monthly_employment.length > 0 && (
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400 mb-2">Industry Employment (Monthly)</div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeProfile.employment_trends.monthly_employment}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.slice(2)} />
                      <YAxis stroke="#6b7280" fontSize={10} />
                      <Tooltip 
  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
  formatter={(value: number) => Math.round(value).toLocaleString()}
/>
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─ Consumer Demand (Retail/Only) ── */}
{activeProfile.retail_data?.relevant && (
  <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
    <SectionHeader icon={ShoppingCart} title="Consumer Demand" sectionKey="retail" />
    {!collapsedSections['retail'] && (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard 
          label="Sales Trend" 
          value={activeProfile.retail_data?.retail_sales_trend || 'N/A'} 
          unit="" 
          help="Direction of monthly retail/food sales for this category." 
        />
<MetricCard 
  label="Latest Sales" 
  value={activeProfile.retail_data?.latest_monthly_sales_millions 
    ? `$${activeProfile.retail_data.latest_monthly_sales_millions.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}M` 
    : 'N/A'} 
  unit="" 
  help="Latest monthly sales volume (millions)." 
/>
        <MetricCard 
          label="Sales Change" 
          value={activeProfile.retail_data?.sales_change_pct_ytd 
            ? `${activeProfile.retail_data.sales_change_pct_ytd > 0 ? '+' : ''}${activeProfile.retail_data.sales_change_pct_ytd}%` 
            : 'N/A'} 
          unit="" 
          help="Year-to-date change in sales volume." 
        />
        {activeProfile.retail_data?.monthly_sales && activeProfile.retail_data.monthly_sales.length > 0 && (
          <div className="col-span-2 md:col-span-3 bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
            <div className="text-[10px] text-gray-400 mb-2">Monthly Sales Volume ($M)</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeProfile.retail_data.monthly_sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip 
  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
  formatter={(value: number) => Math.round(value).toLocaleString()}
/>
                  <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}

      {/* ── SBA Lending ── */}
      {activeProfile.sba_lending && activeProfile.sba_lending.loan_count !== undefined && activeProfile.sba_lending.loan_count > 0 && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
          <SectionHeader icon={Banknote} title="SBA 7(a) Lending" sectionKey="sba" />
          {!collapsedSections['sba'] && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Loan Count" value={activeProfile.sba_lending?.loan_count?.toLocaleString()} unit="" help={`Number of SBA 7(a) loans approved for NAICS ${activeProfile.naics} in ${activeProfile.sba_lending?.state || 'N/A'} (${activeProfile.sba_lending?.latest_year || 'N/A'}).`}  />
              <MetricCard label="Total Volume" value={activeProfile.sba_lending?.total_amount_millions ? `$${activeProfile.sba_lending.total_amount_millions.toFixed(1)}M` : undefined} unit="" help="Total loan amount approved." />
              <MetricCard label="Avg Loan Size" value={activeProfile.sba_lending?.avg_loan_size ? `$${activeProfile.sba_lending.avg_loan_size.toLocaleString()}` : undefined} unit="" help="Average loan size for this sector/state." />
              <MetricCard label="State" value={activeProfile.sba_lending?.state} unit="" help="State where loans were approved." />
            </div>
          )}
        </div>
      )}

      {/* ─ GDP & Value Added ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <SectionHeader icon={Landmark} title="GDP & Value Added" sectionKey="gdp" />
        {!collapsedSections['gdp'] && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProfile.gdp_data?.value_added && activeProfile.gdp_data.value_added.length > 0 && (
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400 mb-2">Value Added by Industry (Annual)</div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeProfile.gdp_data.value_added}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={10} />
                      <YAxis stroke="#6b7280" fontSize={10} />
                      <Tooltip 
  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
  formatter={(value: number) => Math.round(value).toLocaleString()}
/>
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {activeProfile.gdp_data?.compensation && activeProfile.gdp_data.compensation.length > 0 && (
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                <div className="text-[10px] text-gray-400 mb-2">Employee Compensation (Annual)</div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeProfile.gdp_data.compensation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="year" stroke="#6b7280" fontSize={10} />
                      <YAxis stroke="#6b7280" fontSize={10} />
                      <Tooltip 
  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
  formatter={(value: number) => Math.round(value).toLocaleString()}
/>
                      <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicIndustryWidget;
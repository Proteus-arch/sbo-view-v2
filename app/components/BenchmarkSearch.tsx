'use client';
import { useState, useEffect } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';

export default function BenchmarkSearch({ onSelectBenchmark }: { onSelectBenchmark: (benchmark: any) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/benchmarks/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (e) { console.error('Benchmark search failed:', e); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (match: any) => {
    setSelected(match);
    onSelectBenchmark(match);
    setResults([]);
    setQuery(match.industry_name);
  };

  return (
    <div className="relative w-full max-w-lg">
      <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-blue-500 transition">
        <Search size={16} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search industry (e.g., 'manufacturing', 'retail', 'construction')..."
          className="bg-transparent outline-none text-sm text-white w-full placeholder:text-gray-600"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <Loader2 size={14} className="animate-spin text-gray-500" />}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
          {results.map((r) => (
            <button
              key={r.naics_code + r.industry_name}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-800 flex justify-between items-center text-sm border-b border-gray-800 last:border-0"
            >
              <span className="text-gray-200 truncate">{r.industry_name}</span>
              <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-0.5 rounded">{r.naics_code}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <Check size={12} />
          <span>Comparing to: <span className="text-white font-medium">{selected.industry_name}</span> <span className="font-mono text-blue-400">({selected.naics_code})</span></span>
        </div>
      )}
    </div>
  );
}
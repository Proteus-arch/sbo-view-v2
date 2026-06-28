'use client';
import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Shield, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface IRCAlert {
  id: string;
  section: string;
  title: string;
  text: string;
  source_url: string;
  effective_date: string;
  priority: 'high' | 'medium' | 'low';
}

const IRCAlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<IRCAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/irc/alerts', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load tax alerts');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-gray-400 text-sm animate-pulse">Loading tax alerts...</div>;
  if (error) return <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>;

  const visible = alerts.filter(a => !dismissed.has(a.id));

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="text-cyan-400" size={20} />
        <div>
          <h3 className="text-white font-bold text-sm">Tax Alerts</h3>
          <p className="text-gray-500 text-[10px]">{visible.length} active {visible.length === 1 ? 'alert' : 'alerts'}</p>
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          <CheckCircle size={18} />
          No new tax law changes affect your business right now.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {visible.map(alert => (
            <div key={alert.id} className={`p-4 rounded-xl border ${alert.priority === 'high' ? 'border-red-500/30 bg-red-500/5' : alert.priority === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-500/30 bg-gray-500/5'}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alert.priority === 'high' ? <AlertTriangle size={16} className="text-red-400" /> : <Shield size={16} className="text-amber-400" />}
                    <span className="text-xs font-bold text-white">{alert.title}</span>
                  </div>
                  <div className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line">{alert.text}</div>
                  {alert.effective_date && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                      <Calendar size={10} /> Effective: {new Date(alert.effective_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button onClick={() => setDismissed(p => new Set(p).add(alert.id))} className="text-gray-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-700/50 text-[10px] text-gray-500 leading-relaxed">
        <span className="text-amber-400 font-semibold">⚠️ Disclaimer:</span> This information is for educational purposes only and does not constitute tax, legal, or accounting advice. IRS rules change frequently and may not apply to your specific type of company or your state/district. Always consult a qualified Certified Public Accountant (CPA) or tax attorney before making financial decisions.
      </div>
    </div>
  );
};

export default IRCAlertsPanel;
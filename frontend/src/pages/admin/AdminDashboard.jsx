import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Loader, SectionTitle } from '../../components/UI';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading stats..." />;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Total Athletes', value: stats.totalAthletes },
    { label: 'Total Events', value: stats.totalEvents },
    { label: 'Certificates Issued', value: stats.totalCertificates },
  ];

  return (
    <div>
      <SectionTitle subtitle="System-wide overview and activity.">Admin Dashboard</SectionTitle>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card text-center">
            <div className="text-3xl font-extrabold text-brand-700">{c.value}</div>
            <div className="text-sm text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">Users by Role</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.roleBreakdown.map((r) => (
            <div key={r._id} className="text-center p-3 rounded-lg bg-slate-50">
              <div className="text-xl font-bold text-slate-800">{r.count}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">{r._id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

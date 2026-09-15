import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Loader, StatusBadge, EmptyState, SectionTitle } from '../../components/UI';

export default function AthleteDashboard() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/athletes/me/history')
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;

  const stats = [
    { label: 'Registrations', value: history?.registrations?.length || 0 },
    { label: 'Achievements', value: history?.achievements?.length || 0 },
    { label: 'Certificates', value: history?.certificates?.length || 0 },
  ];

  return (
    <div>
      <SectionTitle subtitle="Your sports journey at a glance.">Athlete Dashboard</SectionTitle>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl font-extrabold text-brand-700">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Recent Registrations</h3>
          {history?.registrations?.length ? (
            <ul className="divide-y divide-slate-100">
              {history.registrations.slice(0, 5).map((r) => (
                <li key={r._id} className="py-2 flex items-center justify-between text-sm">
                  <span>{r.event?.name}</span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No registrations yet." />
          )}
          <Link to="/athlete/events" className="text-brand-700 text-sm font-medium mt-3 inline-block">
            Browse events →
          </Link>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Recent Certificates</h3>
          {history?.certificates?.length ? (
            <ul className="divide-y divide-slate-100">
              {history.certificates.slice(0, 5).map((c) => (
                <li key={c._id} className="py-2 flex items-center justify-between text-sm">
                  <span>{c.eventName}</span>
                  <span className="font-mono text-xs text-slate-400">{c.certificateId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No certificates issued yet." />
          )}
          <Link to="/athlete/certificates" className="text-brand-700 text-sm font-medium mt-3 inline-block">
            View all certificates →
          </Link>
        </div>
      </div>
    </div>
  );
}

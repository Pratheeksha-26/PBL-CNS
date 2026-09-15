import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Loader, StatusBadge, EmptyState, SectionTitle } from '../../components/UI';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/events'), api.get('/certificates')])
      .then(([ev, cert]) => {
        setEvents(ev.data.events);
        setCertificates(cert.data.certificates);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;

  return (
    <div>
      <SectionTitle subtitle="Manage events, registrations, results, and certificates.">
        Organizer Dashboard
      </SectionTitle>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-extrabold text-brand-700">{events.length}</div>
          <div className="text-sm text-slate-500 mt-1">Total Events</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-extrabold text-brand-700">{certificates.length}</div>
          <div className="text-sm text-slate-500 mt-1">Certificates Issued</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-extrabold text-brand-700">
            {events.filter((e) => e.status === 'upcoming').length}
          </div>
          <div className="text-sm text-slate-500 mt-1">Upcoming Events</div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link to="/organizer/events" className="btn-primary">Manage Events</Link>
        <Link to="/organizer/certificates" className="btn-secondary">All Certificates</Link>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">Recent Events</h3>
        {events.length ? (
          <ul className="divide-y divide-slate-100">
            {events.slice(0, 6).map((e) => (
              <li key={e._id} className="py-2 flex items-center justify-between text-sm">
                <Link to={`/organizer/events/${e._id}`} className="text-slate-800 hover:text-brand-700 font-medium">
                  {e.name}
                </Link>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No events created yet." />
        )}
      </div>
    </div>
  );
}

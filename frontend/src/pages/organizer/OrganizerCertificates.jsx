import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Loader, EmptyState, SectionTitle, StatusBadge } from '../../components/UI';

export default function OrganizerCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates').then((res) => setCertificates(res.data.certificates)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading certificates..." />;

  return (
    <div>
      <SectionTitle subtitle="All certificates issued across events.">Issued Certificates</SectionTitle>

      {!certificates.length ? (
        <EmptyState message="No certificates issued yet." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">Certificate ID</th>
                <th>Athlete</th>
                <th>Event</th>
                <th>Achievement</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => (
                <tr key={c._id} className="border-b border-slate-100">
                  <td className="py-2 font-mono text-xs">{c.certificateId}</td>
                  <td>{c.athleteName}</td>
                  <td>{c.eventName}</td>
                  <td>{c.achievement} {c.position && `(${c.position})`}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-right">
                    <Link to={`/verify/${c.certificateId}`} className="text-brand-700 text-xs font-medium">Verify</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

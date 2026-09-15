import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Loader, EmptyState, SectionTitle } from '../../components/UI';

export default function AthleteCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates/mine').then((res) => setCertificates(res.data.certificates)).finally(() => setLoading(false));
  }, []);

  const download = (certificateId) => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || '/api'}/certificates/${certificateId}/download`, '_blank');
  };

  if (loading) return <Loader label="Loading certificates..." />;

  return (
    <div>
      <SectionTitle subtitle="Your digitally signed, verifiable achievement certificates.">
        My Certificates
      </SectionTitle>

      {!certificates.length ? (
        <EmptyState message="No certificates issued yet. They'll appear here once an organizer issues one." />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {certificates.map((c) => (
            <div key={c._id} className="card">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.eventName}</h3>
                  <p className="text-xs text-slate-500">{c.sportName}</p>
                  <p className="text-sm text-slate-700 mt-2">
                    {c.achievement} {c.position && `— ${c.position}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{c.certificateId}</p>
                  <p className="text-xs text-slate-400">{c.eventDate}</p>
                </div>
                <img src={c.qrCodeDataUrl} alt="QR" className="w-16 h-16 border border-slate-200 rounded" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => download(c.certificateId)} className="btn-primary !py-1.5 text-sm">
                  Download PDF
                </button>
                <Link to={`/verify/${c.certificateId}`} className="btn-secondary !py-1.5 text-sm">
                  Verify
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

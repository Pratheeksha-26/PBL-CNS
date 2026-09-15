import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Loader, Alert, StatusBadge, EmptyState, SectionTitle } from '../../components/UI';
import { CryptoStepsList } from '../../components/CryptoInfo';

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resultForm, setResultForm] = useState({});
  const [certForm, setCertForm] = useState({});
  const [issuedCryptoSteps, setIssuedCryptoSteps] = useState(null);
  const [achForm, setAchForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [ev, regs, res] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/events/${id}/registrations`),
        api.get(`/results/event/${id}`),
      ]);
      setEvent(ev.data.event);
      setRegistrations(regs.data.registrations);
      setResults(res.data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateRegistration = async (regId, status) => {
    setError(''); setMessage('');
    try {
      await api.put(`/registrations/${regId}/status`, { status });
      setMessage(`Registration ${status}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const recordResult = async (registrationId) => {
    setError(''); setMessage('');
    const f = resultForm[registrationId] || {};
    try {
      await api.post('/results', { registrationId, position: f.position, scoreOrTime: f.scoreOrTime, remarks: f.remarks });
      setMessage('Result recorded.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record result');
    }
  };

  const recordAchievement = async (athleteId, resultId) => {
    setError(''); setMessage('');
    const f = achForm[resultId] || {};
    try {
      await api.post('/achievements', {
        athleteId, resultId, title: f.title, description: f.description, level: f.level || 'state', date: event.eventDate,
      });
      setMessage('Achievement recorded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record achievement');
    }
  };

  const issueCertificate = async (athleteId, resultId) => {
    setError(''); setMessage(''); setIssuedCryptoSteps(null);
    const f = certForm[resultId] || {};
    if (!f.achievement) {
      setError('Please enter the achievement text before issuing a certificate.');
      return;
    }
    try {
      const res = await api.post('/certificates', {
        athleteId, eventId: id, resultId, achievement: f.achievement, position: f.position,
      });
      setMessage(`Certificate ${res.data.certificate.certificateId} issued successfully.`);
      setIssuedCryptoSteps(res.data.cryptoSteps);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
    }
  };

  if (loading) return <Loader label="Loading event..." />;
  if (!event) return <EmptyState message="Event not found." />;

  const approved = registrations.filter((r) => r.status === 'approved');

  return (
    <div>
      <SectionTitle subtitle={`${event.sport?.name} · ${new Date(event.eventDate).toLocaleDateString()}`}>
        {event.name}
      </SectionTitle>

      {message && <div className="mb-4"><Alert type="success">{message}</Alert></div>}
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {issuedCryptoSteps && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">🔐 Certificate Issuance — Cryptographic Trace</h4>
          <CryptoStepsList steps={issuedCryptoSteps} />
        </div>
      )}

      <div className="card mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">Registrations</h3>
        {!registrations.length ? (
          <EmptyState message="No registrations yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">Athlete</th>
                <th>Email</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r._id} className="border-b border-slate-100">
                  <td className="py-2">{r.athlete?.user?.name}</td>
                  <td className="text-slate-500">{r.athlete?.user?.email}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="text-right space-x-2">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => updateRegistration(r._id, 'approved')} className="btn-primary !py-1 !px-2 text-xs">Approve</button>
                        <button onClick={() => updateRegistration(r._id, 'rejected')} className="btn-danger !py-1 !px-2 text-xs">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">Record Results, Achievements &amp; Issue Certificates</h3>
        {!approved.length ? (
          <EmptyState message="No approved athletes yet." />
        ) : (
          <div className="space-y-6">
            {approved.map((r) => {
              const existingResult = results.find((res) => String(res.registration) === String(r._id) || String(res.athlete?._id || res.athlete) === String(r.athlete?._id));
              return (
                <div key={r._id} className="border border-slate-200 rounded-lg p-4">
                  <p className="font-medium text-slate-800 mb-3">{r.athlete?.user?.name}</p>

                  {!existingResult ? (
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input placeholder="Position (e.g. 1st Place)" className="input"
                        onChange={(e) => setResultForm((f) => ({ ...f, [r._id]: { ...f[r._id], position: e.target.value } }))} />
                      <input placeholder="Score / Time" className="input"
                        onChange={(e) => setResultForm((f) => ({ ...f, [r._id]: { ...f[r._id], scoreOrTime: e.target.value } }))} />
                      <button onClick={() => recordResult(r._id)} className="btn-secondary text-sm">Save Result</button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 mb-3">
                      Result: <strong>{existingResult.position}</strong> — {existingResult.scoreOrTime}
                    </div>
                  )}

                  {existingResult && (
                    <div className="mt-3 border-t border-slate-100 pt-3 grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Add Achievement</p>
                        <input placeholder="Title e.g. Gold Medal - 100m" className="input mb-2"
                          onChange={(e) => setAchForm((f) => ({ ...f, [existingResult._id]: { ...f[existingResult._id], title: e.target.value } }))} />
                        <select className="input mb-2"
                          onChange={(e) => setAchForm((f) => ({ ...f, [existingResult._id]: { ...f[existingResult._id], level: e.target.value } }))}>
                          <option value="state">State</option>
                          <option value="school">School</option>
                          <option value="district">District</option>
                          <option value="national">National</option>
                          <option value="international">International</option>
                        </select>
                        <button onClick={() => recordAchievement(r.athlete?._id, existingResult._id)} className="btn-secondary text-sm w-full">
                          Save Achievement
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">🔐 Issue Digitally Signed Certificate</p>
                        <input placeholder="Achievement text on certificate" className="input mb-2"
                          onChange={(e) => setCertForm((f) => ({ ...f, [existingResult._id]: { ...f[existingResult._id], achievement: e.target.value } }))} />
                        <input placeholder="Position (optional)" className="input mb-2"
                          onChange={(e) => setCertForm((f) => ({ ...f, [existingResult._id]: { ...f[existingResult._id], position: e.target.value } }))} />
                        <button onClick={() => issueCertificate(r.athlete?._id, existingResult._id)} className="btn-primary text-sm w-full">
                          Issue Certificate (SHA-256 + RSA Sign)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

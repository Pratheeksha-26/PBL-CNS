import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader, Alert } from '../components/UI';
import { CryptoStepsList } from '../components/CryptoInfo';

const RESULT_STYLES = {
  VALID: {
    icon: '✅',
    title: 'AUTHENTIC / VALID',
    box: 'bg-emerald-50 border-emerald-300',
    heading: 'text-emerald-800',
    text: 'text-emerald-700',
  },
  TAMPERED: {
    icon: '⚠️',
    title: 'TAMPERED — DATA ALTERED',
    box: 'bg-red-50 border-red-300',
    heading: 'text-red-800',
    text: 'text-red-700',
  },
  INVALID: {
    icon: '❌',
    title: 'INVALID SIGNATURE',
    box: 'bg-red-50 border-red-300',
    heading: 'text-red-800',
    text: 'text-red-700',
  },
  REVOKED: {
    icon: '⛔',
    title: 'REVOKED',
    box: 'bg-amber-50 border-amber-300',
    heading: 'text-amber-800',
    text: 'text-amber-700',
  },
  NOT_FOUND: {
    icon: '❓',
    title: 'CERTIFICATE NOT FOUND',
    box: 'bg-slate-50 border-slate-300',
    heading: 'text-slate-800',
    text: 'text-slate-700',
  },
};

export default function VerifyPage() {
  const { certificateId: paramId } = useParams();
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState(paramId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const runVerification = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await api.get(`/verify/${encodeURIComponent(id)}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) runVerification(paramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/verify/${encodeURIComponent(certificateId.trim())}`);
  };

  const style = data ? RESULT_STYLES[data.result] || RESULT_STYLES.NOT_FOUND : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Certificate Verification</h1>
        <p className="text-slate-500 text-sm mt-1">
          Public tool — no login required. Enter a Certificate ID or scan a certificate's QR code.
          Only public certificate details are shown; no private athlete data is exposed.
        </p>
      </div>

      <form onSubmit={submit} className="card flex gap-2 mb-6">
        <input
          className="input"
          placeholder="e.g. CERT-2026-DEMO001"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
          required
        />
        <button className="btn-primary whitespace-nowrap" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {error && <Alert type="error">{error}</Alert>}

      {loading && <Loader label="Retrieving certificate and verifying cryptographic signature..." />}

      {data && style && (
        <div className="space-y-5">
          <div className={`rounded-xl border-2 p-5 text-center ${style.box}`}>
            <div className="text-4xl">{style.icon}</div>
            <div className={`mt-2 text-xl font-extrabold tracking-wide ${style.heading}`}>
              {style.title}
            </div>
            <p className={`mt-1 text-sm ${style.text}`}>{data.message}</p>
          </div>

          {data.certificate && (
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-3">Certificate Details</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-slate-500">Certificate ID</dt>
                <dd className="font-mono text-slate-900">{data.certificate.certificateId}</dd>
                <dt className="text-slate-500">Athlete</dt>
                <dd className="text-slate-900 font-medium">{data.certificate.athleteName}</dd>
                <dt className="text-slate-500">Event</dt>
                <dd className="text-slate-900">{data.certificate.eventName}</dd>
                <dt className="text-slate-500">Sport</dt>
                <dd className="text-slate-900">{data.certificate.sportName}</dd>
                <dt className="text-slate-500">Achievement</dt>
                <dd className="text-slate-900">
                  {data.certificate.achievement} {data.certificate.position && `(${data.certificate.position})`}
                </dd>
                <dt className="text-slate-500">Event Date</dt>
                <dd className="text-slate-900">{data.certificate.eventDate}</dd>
                <dt className="text-slate-500">Issuing Authority</dt>
                <dd className="text-slate-900">{data.certificate.issuingAuthority}</dd>
                <dt className="text-slate-500">Status</dt>
                <dd className="text-slate-900">{data.certificate.status}</dd>
              </dl>
            </div>
          )}

          {data.verification && (
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-3">🔐 Cryptographic Verification Trace</h3>
              <CryptoStepsList
                steps={[
                  'Retrieved stored certificate record by Certificate ID',
                  'Reconstructed canonical certificate data from stored fields',
                  `Recomputed SHA-256 hash: ${data.verification.recomputedHash}`,
                  `Stored SHA-256 hash:     ${data.verification.storedHash}`,
                  `Hash match: ${data.verification.hashMatches ? 'YES — data integrity intact' : 'NO — data has been altered'}`,
                  `RSA-SHA256 signature verified with public key (fingerprint ${data.verification.publicKeyFingerprint}): ${
                    data.verification.signatureValid ? 'VALID' : 'INVALID'
                  }`,
                  `Final verdict: ${data.result}`,
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

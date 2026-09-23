import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = { athlete: '/athlete', organizer: '/organizer', admin: '/admin', verifier: '/verify' };

export default function Home() {
  const { user } = useAuth();

  const roleCards = [
    { title: 'Athlete', key: 'athlete', desc: 'Register for events, track achievements, view and download verified certificates.', icon: '🏃' },
    { title: 'Organizer', key: 'organizer', desc: 'Create events, approve registrations, record results, and digitally issue certificates.', icon: '📋' },
    { title: 'Verifier / Recruiter', key: 'verifier', desc: 'Instantly verify any certificate via QR code or Certificate ID — no login needed.', icon: '🔍' },
    { title: 'Admin', key: 'admin', desc: 'Manage users, roles, events, and monitor system-wide activity.', icon: '🛡️' },
  ];

  return (
    <div className="py-10">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Digital Sports Records &amp; Credential Verification System
        </h1>
        <p className="mt-4 text-slate-600 text-lg">
          Cryptographically secure sports records — AES-256-GCM encryption, SHA-256 integrity
          hashing, and RSA digital signatures protect every certificate issued.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {user ? (
            <Link to={roleHome[user.role] || '/'} className="btn-primary text-base px-6 py-3">
              Go to my dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary text-base px-6 py-3">Get Started</Link>
              <Link to="/login" className="btn-secondary text-base px-6 py-3">Login</Link>
            </>
          )}
          <Link to="/verify" className="btn-secondary text-base px-6 py-3">Verify a Certificate</Link>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-4 gap-5">
        {roleCards.map((r) => {
          const target = r.key === 'verifier' ? '/verify' : `/login?role=${r.key}`;
          return (
            <Link key={r.title} to={target} className="card text-center hover:border-brand-300 transition-all hover:shadow-md no-underline">
              <div className="text-3xl">{r.icon}</div>
              <h3 className="font-semibold text-slate-900 mt-2">{r.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 card">
        <h3 className="font-bold text-slate-900 mb-3">How certificate security works</h3>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          <li>Organizer records a result and issues a certificate.</li>
          <li>A canonical (deterministic) representation of the certificate data is built.</li>
          <li>That data is hashed with <strong>SHA-256</strong> to produce a unique fingerprint.</li>
          <li>The hash is digitally signed with the issuing authority's <strong>RSA-2048 private key</strong>.</li>
          <li>A QR code is generated containing only a secure verification URL — never personal data.</li>
          <li>Anyone can scan the QR / enter the Certificate ID to re-verify authenticity instantly.</li>
        </ol>
      </div>
    </div>
  );
}

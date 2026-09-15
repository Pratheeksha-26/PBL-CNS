import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    approved: 'badge-green',
    valid: 'badge-green',
    VALID: 'badge-green',
    issued: 'badge-green',
    pending: 'badge-yellow',
    rejected: 'badge-red',
    invalid: 'badge-red',
    INVALID: 'badge-red',
    TAMPERED: 'badge-red',
    REVOKED: 'badge-red',
    revoked: 'badge-red',
    NOT_FOUND: 'badge-red',
    upcoming: 'badge-blue',
    ongoing: 'badge-yellow',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  };
  const cls = map[status] || 'badge-gray';
  return <span className={cls}>{String(status).replace(/_/g, ' ')}</span>;
}

export function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
      <svg className="animate-spin h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label}
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>{children}</div>;
}

export function EmptyState({ message }) {
  return <div className="text-center py-10 text-slate-400 text-sm">{message}</div>;
}

export function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-slate-900">{children}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

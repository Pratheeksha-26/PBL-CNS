import React from 'react';

/**
 * Displays which cryptographic operation is being performed, per the
 * assignment requirement: "Explain/show in the UI which cryptographic
 * operation is being performed."
 */
export function CryptoStepBadge({ label }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 text-emerald-300 rounded-md px-3 py-1.5 w-fit">
      <span className="animate-pulse">🔐</span> {label}
    </div>
  );
}

export function CryptoStepsList({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="bg-slate-900 text-emerald-300 rounded-lg p-4 text-xs font-mono space-y-1.5 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={i}>▸ {s}</div>
      ))}
    </div>
  );
}

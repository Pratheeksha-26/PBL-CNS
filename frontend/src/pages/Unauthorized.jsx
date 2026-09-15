import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
      <p className="text-slate-500 mt-2">
        Your account role does not have permission to view this page. This is enforced both in
        the UI and on the server.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
    </div>
  );
}

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  athlete: [
    { to: '/athlete', label: 'Dashboard' },
    { to: '/athlete/profile', label: 'Profile' },
    { to: '/athlete/events', label: 'Events' },
    { to: '/athlete/certificates', label: 'Certificates' },
  ],
  organizer: [
    { to: '/organizer', label: 'Dashboard' },
    { to: '/organizer/events', label: 'Events' },
    { to: '/organizer/certificates', label: 'Certificates' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
  ],
  verifier: [{ to: '/verify', label: 'Verify Certificate' }],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? NAV_BY_ROLE[user.role] || [] : [];

  return (
    <nav className="bg-brand-900 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
          <span className="text-brand-300">🛡️</span> SportsCred
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-brand-200 transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/verify" className="hover:text-brand-200 transition-colors">
            Public Verify
          </Link>
          {user ? (
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-brand-700">
              <span className="text-brand-200 hidden sm:inline">
                {user.name} <span className="uppercase text-xs text-brand-400">({user.role})</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="btn-secondary !bg-brand-800 !text-white !border-brand-700 hover:!bg-brand-700 !py-1.5"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2 ml-2">
              <Link to="/login" className="btn-secondary !bg-brand-800 !text-white !border-brand-700 !py-1.5">
                Login
              </Link>
              <Link to="/register" className="btn-primary !py-1.5">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

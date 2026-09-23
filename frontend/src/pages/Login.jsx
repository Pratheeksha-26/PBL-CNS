import React, { useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';

const roleHome = { athlete: '/athlete', organizer: '/organizer', admin: '/admin', verifier: '/verify' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = useMemo(() => {
    const role = searchParams.get('role');
    return role && ['athlete', 'organizer', 'admin'].includes(role) ? role : 'athlete';
  }, [searchParams]);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoCredentials = {
    athlete: { email: 'athlete@demo.com', password: 'Athlete@1234' },
    organizer: { email: 'organizer@demo.com', password: 'Organizer@1234' },
    admin: { email: 'admin@demo.com', password: 'Admin@1234' },
  };

  const fillDemoUser = () => {
    const demo = demoCredentials[defaultRole] || demoCredentials.athlete;
    setForm({ email: demo.email, password: demo.password });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(roleHome[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
        <p className="text-sm text-slate-500 mb-3">Log in to your SportsCred {defaultRole} account.</p>
        <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Demo {defaultRole} login: <span className="font-semibold">{demoCredentials[defaultRole]?.email || 'athlete@demo.com'}</span>
          <span className="text-sky-700"> / {demoCredentials[defaultRole]?.password || 'Athlete@1234'}</span>
        </div>

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in...' : `Login as ${defaultRole}`}
          </button>
        </form>

        <button type="button" onClick={fillDemoUser} className="mt-3 w-full rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100">
          Use demo {defaultRole} account
        </button>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Don't have an account? <Link to={`/register?role=${defaultRole}`} className="text-brand-700 font-medium">Register as {defaultRole}</Link>
        </p>

      </div>
    </div>
  );
}

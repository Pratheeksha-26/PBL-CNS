import React, { useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';

const roleHome = { athlete: '/athlete', organizer: '/organizer', admin: '/admin', verifier: '/verify' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = useMemo(() => {
    const role = searchParams.get('role');
    return role && ['athlete', 'organizer', 'admin'].includes(role) ? role : 'athlete';
  }, [searchParams]);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: defaultRole });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate(roleHome[form.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Create a {defaultRole} account</h2>
        <p className="text-sm text-slate-500 mb-5">
          Choose the role you want to register as. Athlete, organizer, and admin accounts can be created here.
        </p>

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="athlete">Athlete</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input type="password" required className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : `Register as ${form.role}`}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account? <Link to={`/login?role=${form.role}`} className="text-brand-700 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}

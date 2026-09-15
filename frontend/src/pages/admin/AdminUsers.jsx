import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Loader, Alert, StatusBadge, SectionTitle } from '../../components/UI';

const ROLES = ['athlete', 'organizer', 'verifier', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'organizer' });

  const load = () => {
    setLoading(true);
    api.get('/admin/users').then((res) => setUsers(res.data.users)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createUser = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await api.post('/admin/users', form);
      setMessage(`User created with role "${form.role}".`);
      setForm({ name: '', email: '', password: '', role: 'organizer' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const changeRole = async (userId, role) => {
    setError(''); setMessage('');
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setMessage('Role updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const toggleStatus = async (userId, isActive) => {
    setError(''); setMessage('');
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !isActive });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const removeUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    setError(''); setMessage('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage('User deleted.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <Loader label="Loading users..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle subtitle="Create accounts, manage roles, and activate/deactivate users.">User Management</SectionTitle>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">{showForm ? 'Cancel' : '+ New User'}</button>
      </div>

      {message && <div className="mb-4"><Alert type="success">{message}</Alert></div>}
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {showForm && (
        <form onSubmit={createUser} className="card mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input required type="password" minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Create User</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-100">
                <td className="py-2">{u.name}</td>
                <td className="text-slate-500">{u.email}</td>
                <td>
                  <select
                    className="input !py-1 !text-xs w-auto"
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td><StatusBadge status={u.isActive ? 'approved' : 'rejected'} /></td>
                <td className="text-right space-x-2">
                  <button onClick={() => toggleStatus(u._id, u.isActive)} className="btn-secondary !py-1 !px-2 text-xs">
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => removeUser(u._id)} className="btn-danger !py-1 !px-2 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

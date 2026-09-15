import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Loader, Alert, SectionTitle } from '../../components/UI';
import { CryptoStepBadge } from '../../components/CryptoInfo';

export default function AthleteProfile() {
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    bio: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    governmentId: '',
  });

  const load = () => {
    setLoading(true);
    api
      .get('/athletes/me')
      .then((res) => {
        setAthlete(res.data.athlete);
        setForm({
          bio: res.data.athlete.bio || '',
          dateOfBirth: res.data.athlete.dateOfBirth || '',
          phone: res.data.athlete.phone || '',
          address: res.data.athlete.address || '',
          governmentId: res.data.athlete.governmentId || '',
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/athletes/me', form);
      setAthlete(res.data.athlete);
      setMessage('Profile updated. Sensitive fields were re-encrypted with AES-256-GCM before saving.');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await api.post('/athletes/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAthlete((prev) => ({ ...prev, photoUrl: res.data.photoUrl }));
      setMessage('Photo uploaded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed');
    }
  };

  if (loading) return <Loader label="Loading profile..." />;

  return (
    <div className="max-w-2xl">
      <SectionTitle subtitle="Sensitive fields (DOB, phone, address, government ID) are encrypted at rest with AES-256-GCM.">
        My Profile
      </SectionTitle>

      {message && <div className="mb-4"><Alert type="success">{message}</Alert></div>}
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      <div className="card mb-6 flex items-center gap-5">
        <img
          src={athlete?.photoUrl ? athlete.photoUrl : 'https://api.dicebear.com/7.x/initials/svg?seed=' + (athlete?.user?.name || 'A')}
          alt="profile"
          className="w-20 h-20 rounded-full object-cover border border-slate-200"
        />
        <div>
          <p className="text-sm font-medium text-slate-800">{athlete?.user?.name}</p>
          <p className="text-xs text-slate-500 mb-2">{athlete?.user?.email}</p>
          <div className="flex items-center gap-2">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files[0])} className="text-xs" />
            <button onClick={uploadPhoto} className="btn-secondary !py-1 !px-3 text-xs">Upload</button>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <CryptoStepBadge label="AES-256-GCM active on: Date of Birth, Phone, Address, Government ID" />
      </div>

      <form onSubmit={save} className="card space-y-4">
        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Date of Birth 🔒</label>
            <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone 🔒</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Address 🔒</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label">Government ID 🔒</label>
          <input className="input" value={form.governmentId} onChange={(e) => setForm({ ...form, governmentId: e.target.value })} />
        </div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  );
}

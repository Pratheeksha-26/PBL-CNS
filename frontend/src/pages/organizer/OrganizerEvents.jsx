import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Loader, Alert, StatusBadge, EmptyState, SectionTitle } from '../../components/UI';

export default function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '', sport: '', description: '', venue: '', eventDate: '', registrationDeadline: '',
  });
  const [newSport, setNewSport] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [ev, sp] = await Promise.all([api.get('/events'), api.get('/sports')]);
      setEvents(ev.data.events);
      setSports(sp.data.sports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createSport = async () => {
    if (!newSport.trim()) return;
    try {
      const res = await api.post('/sports', { name: newSport.trim() });
      setSports((prev) => [...prev, res.data.sport]);
      setForm((f) => ({ ...f, sport: res.data.sport._id }));
      setNewSport('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create sport');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/events', form);
      setMessage('Event created successfully.');
      setShowForm(false);
      setForm({ name: '', sport: '', description: '', venue: '', eventDate: '', registrationDeadline: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  if (loading) return <Loader label="Loading events..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle subtitle="Create and manage sporting events.">Events</SectionTitle>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {message && <div className="mb-4"><Alert type="success">{message}</Alert></div>}
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {showForm && (
        <form onSubmit={submit} className="card mb-6 space-y-4">
          <div>
            <label className="label">Event Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Sport</label>
            <div className="flex gap-2">
              <select required className="input" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                <option value="">Select a sport</option>
                {sports.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <input placeholder="Or add new sport..." className="input" value={newSport} onChange={(e) => setNewSport(e.target.value)} />
              <button type="button" onClick={createSport} className="btn-secondary whitespace-nowrap">Add Sport</button>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Venue</label>
              <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div>
              <label className="label">Event Date</label>
              <input required type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Registration Deadline</label>
            <input type="date" className="input" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
          </div>
          <button className="btn-primary">Create Event</button>
        </form>
      )}

      {!events.length ? (
        <EmptyState message="No events yet. Create your first event above." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {events.map((ev) => (
            <Link to={`/organizer/events/${ev._id}`} key={ev._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-900">{ev.name}</h3>
                <StatusBadge status={ev.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{ev.sport?.name}</p>
              <p className="text-xs text-slate-400 mt-2">📅 {new Date(ev.eventDate).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Loader, Alert, StatusBadge, EmptyState, SectionTitle } from '../../components/UI';

export default function AthleteEvents() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);

    try {
      const [ev, reg] = await Promise.all([
        api.get('/events'),
        api.get('/registrations/mine')
      ]);

      setEvents(ev.data.events);
      setRegistrations(reg.data.registrations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Get today's date without the current time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Show only upcoming, non-completed events
  const visibleEvents = events.filter((ev) => {
    const eventDate = new Date(ev.eventDate);

    return (
      ev.status?.toLowerCase() !== 'completed' &&
      !isNaN(eventDate.getTime()) &&
      eventDate >= today
    );
  });

  const registeredEventIds = new Set(
    registrations.map((r) => r.event?._id)
  );

  const register = async (eventId) => {
    setMessage('');
    setError('');

    try {
      await api.post('/registrations', { eventId });

      setMessage('Registration submitted — awaiting organizer approval.');

      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (loading) {
    return <Loader label="Loading events..." />;
  }

  return (
    <div>
      <SectionTitle subtitle="Browse and register for upcoming events.">
        Events
      </SectionTitle>

      {message && (
        <div className="mb-4">
          <Alert type="success">{message}</Alert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {!visibleEvents.length ? (
        <EmptyState message="No upcoming events available." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {visibleEvents.map((ev) => {
            const isRegistered = registeredEventIds.has(ev._id);

            const regStatus = registrations.find(
              (r) => r.event?._id === ev._id
            )?.status;

            return (
              <div key={ev._id} className="card">

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {ev.name}
                    </h3>

                    <p className="text-xs text-slate-500">
                      {ev.sport?.name}
                    </p>
                  </div>

                  <StatusBadge status={ev.status} />
                </div>

                <p className="text-sm text-slate-600 mt-2">
                  {ev.description}
                </p>

                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>📍 {ev.venue || 'TBA'}</p>

                  <p>
                    📅 {new Date(ev.eventDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-3">
                  {isRegistered ? (
                    <StatusBadge status={regStatus} />
                  ) : (
                    <button
                      onClick={() => register(ev._id)}
                      className="btn-primary !py-1.5 text-sm"
                    >
                      Register
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
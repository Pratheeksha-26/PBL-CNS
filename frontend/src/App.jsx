import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import VerifyPage from './pages/VerifyPage';

import AthleteDashboard from './pages/athlete/AthleteDashboard';
import AthleteProfile from './pages/athlete/AthleteProfile';
import AthleteEvents from './pages/athlete/AthleteEvents';
import AthleteCertificates from './pages/athlete/AthleteCertificates';

import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEvents from './pages/organizer/OrganizerEvents';
import OrganizerEventDetail from './pages/organizer/OrganizerEventDetail';
import OrganizerCertificates from './pages/organizer/OrganizerCertificates';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:certificateId" element={<VerifyPage />} />

          {/* Athlete */}
          <Route path="/athlete" element={<ProtectedRoute roles={['athlete']}><AthleteDashboard /></ProtectedRoute>} />
          <Route path="/athlete/profile" element={<ProtectedRoute roles={['athlete']}><AthleteProfile /></ProtectedRoute>} />
          <Route path="/athlete/events" element={<ProtectedRoute roles={['athlete']}><AthleteEvents /></ProtectedRoute>} />
          <Route path="/athlete/certificates" element={<ProtectedRoute roles={['athlete']}><AthleteCertificates /></ProtectedRoute>} />

          {/* Organizer */}
          <Route path="/organizer" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerDashboard /></ProtectedRoute>} />
          <Route path="/organizer/events" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerEvents /></ProtectedRoute>} />
          <Route path="/organizer/events/:id" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerEventDetail /></ProtectedRoute>} />
          <Route path="/organizer/certificates" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerCertificates /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
        Digital Sports Records &amp; Credential Verification System — AES-256-GCM · SHA-256 · RSA-2048 Digital Signatures
      </footer>
    </div>
  );
}

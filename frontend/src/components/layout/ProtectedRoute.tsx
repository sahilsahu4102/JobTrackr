import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSlowNote, WAKING_NOTE } from '../../hooks/useSlowNote';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const slow = useSlowNote(isLoading);

  if (isLoading) {
    return (
      <main className="page loading-screen">
        <div role="status" aria-live="polite" style={{ maxWidth: '62ch' }}>
          <h1 className="page-title">JobTrackr</h1>
          <p className="lede">Checking your session…</p>
          {slow && <p className="wait-note">{WAKING_NOTE}</p>}
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

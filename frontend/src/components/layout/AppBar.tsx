import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

/** Top bar for every signed-in page, plus the guest notice when the session is a guest. */
export const AppBar: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const { logout, isGuest } = useAuth();

  return (
    <>
      <header className="appbar">
        <div className="appbar-inner">
          <div className="appbar-left">
            <Link to="/" className="wordmark" aria-label="JobTrackr, board">
              JobTrackr
            </Link>
            <nav className="nav" aria-label="Main">
              <NavLink to="/" end>Board</NavLink>
              <NavLink to="/dashboard">Analytics</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </nav>
          </div>
          <div className="appbar-right">
            {actions}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      {isGuest && (
        <div className="guest-strip" role="note">
          <div className="guest-strip-inner">
            <strong>Guest session</strong>
            <span>
              The applications and resume loaded at the start are sample data (made-up companies). This account is deleted 24 hours after it was created.
            </span>
            <Link to="/register">Create an account to keep your own</Link>
          </div>
        </div>
      )}
    </>
  );
};

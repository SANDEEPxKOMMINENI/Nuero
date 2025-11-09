import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Header.css';

function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-logo">
          <Link to="/">
            <h1>🚀 AI Resume Tailor</h1>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/">Home</Link>
          <Link to="/tailor">Tailor Resume</Link>
          <Link to="/history">History</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="header-user">
          {user && (
            <>
              <span className="user-info">
                {user.firstName} {user.lastName}
                {user.role === 'admin' && <span className="badge-admin">Admin</span>}
              </span>
              <span className="tailorings-info">
                {user.tailoringsUsed}/{user.tailoringsLimit}
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-small">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

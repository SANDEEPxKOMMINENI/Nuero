import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import './styles/App.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeTailorPage from './pages/ResumeTailorPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';

// Components
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Header />}
        <main className="app-main">
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tailor" element={<ResumeTailorPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminPage /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
        {isAuthenticated && <Footer />}
      </div>
    </Router>
  );
}

export default App;

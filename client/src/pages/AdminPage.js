import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './AdminPage.css';

function AdminPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/admin/stats/system',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
    } catch (err) {
      setError('Failed to load statistics');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/admin/users?limit=50',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/admin/logs?limit=20',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLogs(response.data.logs);
    } catch (err) {
      setError('Failed to load logs');
    }
  };

  const handleUpdateSubscription = async (userId, subscription) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/subscription`,
        { subscription },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchUsers();
    } catch (err) {
      setError('Failed to update subscription');
    }
  };

  const handleDeactivateUser = async (userId, isActive) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { isActive: !isActive },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">
          <div className="spinner" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>System management and user controls</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Audit Logs
        </button>
      </div>

      {activeTab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.users.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.users.active}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.resumes.total}</div>
            <div className="stat-label">Total Resumes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.resumes.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.tailoringsThisMonth}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Tailorings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <select
                      value={user.subscription}
                      onChange={(e) =>
                        handleUpdateSubscription(user._id, e.target.value)
                      }
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        user.isActive ? 'active' : 'inactive'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.tailoringsUsed}/{user.tailoringsLimit}
                  </td>
                  <td>
                    <button
                      className="btn btn-small btn-outline"
                      onClick={() =>
                        handleDeactivateUser(user._id, user.isActive)
                      }
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="logs-container">
          {logs.map((log) => (
            <div key={log._id} className="log-entry">
              <div className="log-action">{log.action}</div>
              <div className="log-user">
                {log.userId?.email || 'Unknown'}
              </div>
              <div className="log-time">
                {new Date(log.createdAt).toLocaleString()}
              </div>
              <span
                className={`badge badge-${log.success ? 'success' : 'error'}`}
              >
                {log.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;

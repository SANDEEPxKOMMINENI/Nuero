import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './HistoryPage.css';

function HistoryPage() {
  const { token } = useAuthStore();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/resume/history',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResumes(response.data.resumes);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`http://localhost:5000/api/resume/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResumes(resumes.filter((r) => r._id !== id));
      } catch (err) {
        setError('Failed to delete resume');
      }
    }
  };

  if (loading) {
    return (
      <div className="history-container">
        <h1>Resume History</h1>
        <div className="loading">
          <div className="spinner" />
          <span>Loading resumes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Your Resume History</h1>
        <p>{resumes.length} resume(s) tailored</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {resumes.length === 0 ? (
        <div className="empty-state">
          <p>No resumes yet. Start by tailoring your first resume!</p>
        </div>
      ) : (
        <div className="resumes-table">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Template</th>
                <th>LLM Used</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((resume) => (
                <tr key={resume._id}>
                  <td>{resume.jobTitle}</td>
                  <td className="capitalize">{resume.template}</td>
                  <td>{resume.selectedLLM || 'N/A'}</td>
                  <td>
                    <span
                      className={`badge badge-${resume.status}`}
                    >
                      {resume.status}
                    </span>
                  </td>
                  <td>{new Date(resume.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() =>
                        window.open(`/resume/${resume._id}`, '_blank')
                      }
                    >
                      View
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(resume._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;

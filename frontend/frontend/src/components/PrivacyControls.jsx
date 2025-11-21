import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PrivacyControls = () => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [open, setOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    setDeleteStatus('');
    try {
      const res = await axios.get(`${API_URL}/history`, { withCredentials: true });
      setHistory(res.data.history);
    } catch (e) {
      setError('Failed to fetch history.');
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async () => {
    if (!window.confirm('Are you sure you want to delete all your data? This cannot be undone.')) return;
    setLoading(true);
    setError('');
    setDeleteStatus('');
    try {
      await axios.delete(`${API_URL}/user-data`, { withCredentials: true });
      setDeleteStatus('All your data has been deleted.');
      setHistory(null);
    } catch (e) {
      setError('Failed to delete data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-controls card" style={{marginTop: 8, fontSize: 14}}>
      <button onClick={() => setOpen(o => !o)} style={{width: '100%', textAlign: 'left', background: '#f3f4f6', border: 'none', padding: 8, borderRadius: 4, fontWeight: 600}}>
        {open ? '▼' : '▶'} Privacy & Data Controls
      </button>
      {open && (
        <div style={{marginTop: 8}}>
          <button onClick={fetchHistory} disabled={loading} style={{marginRight: 8}}>
            Export Conversation History
          </button>
          <button onClick={deleteData} disabled={loading} style={{background: '#e11d48', color: 'white'}}>
            Delete All My Data
          </button>
          {loading && <div>Loading...</div>}
          {error && <div style={{color: 'red'}}>{error}</div>}
          {deleteStatus && <div style={{color: 'green'}}>{deleteStatus}</div>}
          {history && (
            <div style={{marginTop: 8, maxHeight: 120, overflow: 'auto', background: '#f9fafb', padding: 6, borderRadius: 4}}>
              <pre style={{fontSize: 11}}>{JSON.stringify(history, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivacyControls;

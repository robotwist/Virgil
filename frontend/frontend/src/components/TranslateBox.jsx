import React, { useState } from 'react';

const TranslateBox = () => {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('es');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    setLoading(true);
    setError('');
    setTranslated('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target })
      });
      if (res.ok) {
        const data = await res.json();
        setTranslated(data.translated);
      } else {
        setError('Translation failed.');
      }
    } catch (e) {
      setError('Error contacting translation service.');
    }
    setLoading(false);
  };

  return (
    <div className="translate-box">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Text to translate..."
        rows={2}
      />
      <select value={target} onChange={e => setTarget(e.target.value)}>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="zh">Chinese</option>
        <option value="ar">Arabic</option>
        <option value="en">English</option>
      </select>
      <button onClick={handleTranslate} disabled={loading || !text.trim()}>
        {loading ? 'Translating...' : 'Translate'}
      </button>
      {translated && <div className="translated-text">{translated}</div>}
      {error && <div className="translate-error">{error}</div>}
    </div>
  );
};

export default TranslateBox;

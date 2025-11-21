import React, { useState } from 'react';

const CalculatorBox = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.result.toString());
      } else {
        const data = await res.json();
        setError(data.detail || 'Calculation failed.');
      }
    } catch (e) {
      setError('Error contacting calculation service.');
    }
    setLoading(false);
  };

  return (
    <div className="calculator-box">
      <input
        type="text"
        value={expression}
        onChange={e => setExpression(e.target.value)}
        placeholder="Enter math expression (e.g. 2+2*sqrt(9))"
      />
      <button onClick={handleCalculate} disabled={loading || !expression.trim()}>
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
      {result && <div className="calc-result">Result: {result}</div>}
      {error && <div className="calc-error">{error}</div>}
    </div>
  );
};

export default CalculatorBox;

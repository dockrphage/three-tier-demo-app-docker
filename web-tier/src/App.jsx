import { useEffect, useState } from 'react';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Load all transactions
  const loadTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions');
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Submit new transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create transaction');
      }

      const newTx = await res.json();
      setTransactions((prev) => [newTx, ...prev]);
      setAmount('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Transaction Logger</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button style={{ padding: '8px 16px' }}>Add Transaction</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Transactions</h2>

      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table
          border="1"
          cellPadding="6"
          style={{ borderCollapse: 'collapse', width: '100%' }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.amount}</td>
                <td>{t.description}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

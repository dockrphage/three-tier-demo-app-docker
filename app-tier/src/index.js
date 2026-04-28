const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// GET all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, amount, description, created_at FROM transactions ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || !description) {
      return res.status(400).json({ error: 'amount and description are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO transactions (amount, description) VALUES (?, ?)',
      [amount, description]
    );

    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// DELETE a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM transactions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`App-tier running on ${port}`);
});


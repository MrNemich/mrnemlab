const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
const authenticateUser = require('./user').authenticateUser;

// Get user transactions
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const { id } = req.telegramUser;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT t.*, n.name as nft_name
      FROM transactions t
      LEFT JOIN nfts n ON t.nft_id = n.id
      JOIN users u ON t.user_id = u.id
      WHERE u.telegram_id = $1
    `;
    
    const params = [id];
    
    if (type) {
      query += ` AND t.type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const transactions = result.rows.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      nft_name: tx.nft_name,
      status: tx.status,
      tx_hash: tx.tx_hash,
      metadata: tx.metadata,
      created_at: tx.created_at
    }));
    
    // Get total count
    const countQuery = query.replace(/SELECT t\.\*, n\.name as nft_name/, 'SELECT COUNT(*)')
                           .replace(/ORDER BY.*/, '')
                           .replace(/LIMIT \$\d+ OFFSET \$\d+/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initiate Telegram payment
router.post('/initiate-payment', authenticateUser, async (req, res) => {
  try {
    const { id: telegramId } = req.telegramUser;
    const { amount, currency = 'TON' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Generate unique payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store payment in database
    await pool.query(
      `INSERT INTO telegram_payments (id, user_id, amount, currency, status, telegram_data)
       SELECT $1, u.id, $2, $3, 'pending', $4
       FROM users u
       WHERE u.telegram_id = $5`,
      [paymentId, amount, currency, JSON.stringify(req.telegramUser), telegramId]
    );
    
    res.json({
      success: true,
      payment_id: paymentId,
      amount,
      currency,
      telegram_payment_url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${paymentId}`
    });
    
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify payment (called by Telegram bot webhook)
router.post('/verify-payment', async (req, res) => {
  try {
    const { payment_id, status, telegram_payload } = req.body;
    
    // Verify the payment with Telegram
    // This would be called by your Telegram bot webhook
    
    const paymentResult = await pool.query(
      'SELECT * FROM telegram_payments WHERE id = $1',
      [payment_id]
    );
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const payment = paymentResult.rows[0];
    
    if (status === 'completed') {
      // Update payment status
      await pool.query(
        'UPDATE telegram_payments SET status = $1, telegram_data = $2 WHERE id = $3',
        ['completed', JSON.stringify(telegram_payload), payment_id]
      );
      
      // Update user balance
      await pool.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [payment.amount, payment.user_id]
      );
      
      // Create transaction record
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, status, telegram_payment_id)
         VALUES ($1, 'deposit', $2, 'completed', $3)`,
        [payment.user_id, payment.amount, payment_id]
      );
    } else {
      await pool.query(
        'UPDATE telegram_payments SET status = $1 WHERE id = $2',
        ['failed', payment_id]
      );
    }
    
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Withdraw request
router.post('/withdraw', authenticateUser, async (req, res) => {
  try {
    const { id: telegramId } = req.telegramUser;
    const { amount, wallet_address } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Get user with lock
    const userResult = await pool.query(
      'SELECT id, balance FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );
    
    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check balance
    if (parseFloat(user.balance) < parseFloat(amount)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Update balance
    await pool.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [amount, user.id]
    );
    
    // Create withdrawal transaction
    const txResult = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, status, metadata)
       VALUES ($1, 'withdraw', $2, 'pending', $3)
       RETURNING id`,
      [user.id, amount, JSON.stringify({ wallet_address })]
    );
    
    await pool.query('COMMIT');
    
    // In production, here you would:
    // 1. Process the TON transaction
    // 2. Update transaction with tx_hash
    // 3. Update status to completed
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      transaction_id: txResult.rows[0].id,
      new_balance: parseFloat(user.balance) - parseFloat(amount)
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verify Telegram WebApp Data
function verifyTelegramData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();
  
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

// Middleware to authenticate Telegram user
const authenticateUser = async (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData || !verifyTelegramData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }
    
    const params = new URLSearchParams(initData);
    const userData = JSON.parse(params.get('user'));
    
    req.telegramUser = userData;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Get or create user
router.post('/me', authenticateUser, async (req, res) => {
  try {
    const { id, username, first_name, last_name, photo_url } = req.telegramUser;
    
    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url, balance, total_volume, bought_count, sold_count)
       VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET 
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, username, first_name, last_name, photo_url]
    );
    
    const user = result.rows[0];
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegram_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        balance: parseFloat(user.balance),
        wallet_address: user.wallet_address,
        total_volume: parseFloat(user.total_volume),
        bought_count: user.bought_count,
        sold_count: user.sold_count
      },
      token
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user balance
router.get('/balance', authenticateUser, async (req, res) => {
  try {
    const { id } = req.telegramUser;
    
    const result = await pool.query(
      'SELECT balance FROM users WHERE telegram_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ balance: parseFloat(result.rows[0].balance) });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect TON wallet
router.post('/connect-wallet', authenticateUser, async (req, res) => {
  try {
    const { id } = req.telegramUser;
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const result = await pool.query(
      'UPDATE users SET wallet_address = $1 WHERE telegram_id = $2 RETURNING *',
      [walletAddress, id]
    );
    
    res.json({ 
      success: true, 
      wallet_address: result.rows[0].wallet_address 
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user inventory
router.get('/inventory', authenticateUser, async (req, res) => {
  try {
    const { id } = req.telegramUser;
    
    const result = await pool.query(
      `SELECT n.*, i.purchased_at, i.purchase_price
       FROM inventory i
       JOIN nfts n ON i.nft_id = n.id
       JOIN users u ON i.user_id = u.id
       WHERE u.telegram_id = $1
       ORDER BY i.purchased_at DESC`,
      [id]
    );
    
    const inventory = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      collection_id: item.collection_id,
      background_id: item.background_id,
      price: parseFloat(item.price),
      image_url: item.image_url,
      rarity: item.rarity,
      purchased_at: item.purchased_at,
      purchase_price: parseFloat(item.purchase_price)
    }));
    
    res.json({ inventory });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple admin auth (in production, use proper auth)
const adminAuth = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken === process.env.ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Add new NFT
router.post('/nfts/add', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      description,
      collection_id,
      background_id,
      price,
      rarity,
      attributes
    } = req.body;
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await pool.query(
      `INSERT INTO nfts (name, description, collection_id, background_id, price, image_url, rarity, attributes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, collection_id, background_id, price, image_url, rarity, JSON.parse(attributes || '{}')]
    );
    
    res.json({
      success: true,
      nft: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error adding NFT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk add NFTs
router.post('/nfts/bulk-add', adminAuth, async (req, res) => {
  try {
    const { nfts } = req.body;
    
    const results = [];
    
    for (const nft of nfts) {
      const result = await pool.query(
        `INSERT INTO nfts (name, description, collection_id, background_id, price, image_url, rarity, attributes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name`,
        [nft.name, nft.description, nft.collection_id, nft.background_id, 
         nft.price, nft.image_url, nft.rarity, JSON.stringify(nft.attributes || {})]
      );
      results.push(result.rows[0]);
    }
    
    res.json({
      success: true,
      added: results.length,
      nfts: results
    });
    
  } catch (error) {
    console.error('Error bulk adding NFTs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT id, telegram_id, username, first_name, last_name, 
              balance, total_volume, bought_count, sold_count, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all transactions
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT t.*, u.username, u.telegram_id, n.name as nft_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN nfts n ON t.nft_id = n.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM transactions');
    
    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update NFT price
router.put('/nfts/:id/price', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    
    const result = await pool.query(
      'UPDATE nfts SET price = $1 WHERE id = $2 RETURNING *',
      [price, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    
    res.json({
      success: true,
      nft: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating NFT price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      usersCount,
      nftsCount,
      listedNftsCount,
      totalVolume,
      todayVolume,
      transactionsCount
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM nfts'),
      pool.query('SELECT COUNT(*) FROM nfts WHERE is_listed = true'),
      pool.query('SELECT SUM(amount) FROM transactions WHERE status = \'completed\''),
      pool.query('SELECT SUM(amount) FROM transactions WHERE status = \'completed\' AND created_at >= CURRENT_DATE'),
      pool.query('SELECT COUNT(*) FROM transactions')
    ]);
    
    res.json({
      stats: {
        total_users: parseInt(usersCount.rows[0].count),
        total_nfts: parseInt(nftsCount.rows[0].count),
        listed_nfts: parseInt(listedNftsCount.rows[0].count),
        total_volume: parseFloat(totalVolume.rows[0].sum || 0),
        today_volume: parseFloat(todayVolume.rows[0].sum || 0),
        total_transactions: parseInt(transactionsCount.rows[0].count)
      }
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

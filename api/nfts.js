const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
const authenticateUser = require('./user').authenticateUser;

// Get all NFT collections
router.get('/collections', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description FROM collections ORDER BY name'
    );
    res.json({ collections: result.rows });
  } catch (error) {
    console.error('Error getting collections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all backgrounds
router.get('/backgrounds', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, color_code FROM backgrounds ORDER BY name'
    );
    res.json({ backgrounds: result.rows });
  } catch (error) {
    console.error('Error getting backgrounds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get NFTs with filters
router.get('/market', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'newest',
      collections = '',
      backgrounds = '',
      price_min = 0,
      price_max = 1000000,
      search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT n.*, c.name as collection_name, b.name as background_name
      FROM nfts n
      LEFT JOIN collections c ON n.collection_id = c.id
      LEFT JOIN backgrounds b ON n.background_id = b.id
      WHERE n.is_listed = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Price filter
    query += ` AND n.price >= $${++paramCount} AND n.price <= $${++paramCount}`;
    params.push(price_min, price_max);
    
    // Collections filter
    if (collections) {
      const collectionArray = collections.split(',');
      query += ` AND c.name IN (${collectionArray.map((_, i) => `$${++paramCount}`).join(',')})`;
      params.push(...collectionArray);
    }
    
    // Backgrounds filter
    if (backgrounds) {
      const backgroundArray = backgrounds.split(',');
      query += ` AND b.name IN (${backgroundArray.map((_, i) => `$${++paramCount}`).join(',')})`;
      params.push(...backgroundArray);
    }
    
    // Search filter
    if (search) {
      query += ` AND (n.name ILIKE $${++paramCount} OR n.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    // Sorting
    switch(sort) {
      case 'price-asc':
        query += ' ORDER BY n.price ASC';
        break;
      case 'price-desc':
        query += ' ORDER BY n.price DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY n.created_at DESC';
        break;
    }
    
    // Pagination
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = query.replace(/SELECT n\.\*, c\.name as collection_name, b\.name as background_name/, 'SELECT COUNT(*)')
                           .replace(/ORDER BY.*/, '')
                           .replace(/LIMIT \$\d+ OFFSET \$\d+/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    
    const nfts = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      collection: item.collection_name,
      background: item.background_name,
      price: parseFloat(item.price),
      image_url: item.image_url,
      rarity: item.rarity,
      owner_id: item.owner_id,
      created_at: item.created_at
    }));
    
    res.json({
      nfts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting NFTs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy NFT
router.post('/buy', authenticateUser, async (req, res) => {
  try {
    const { id: telegramId } = req.telegramUser;
    const { nft_id } = req.body;
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Get user
    const userResult = await pool.query(
      'SELECT id, balance FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );
    
    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get NFT
    const nftResult = await pool.query(
      'SELECT * FROM nfts WHERE id = $1 AND is_listed = true FOR UPDATE',
      [nft_id]
    );
    
    if (nftResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'NFT not available' });
    }
    
    const nft = nftResult.rows[0];
    
    // Check balance
    if (parseFloat(user.balance) < parseFloat(nft.price)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Update user balance
    await pool.query(
      'UPDATE users SET balance = balance - $1, bought_count = bought_count + 1, total_volume = total_volume + $1 WHERE id = $2',
      [nft.price, user.id]
    );
    
    // Update NFT ownership
    await pool.query(
      'UPDATE nfts SET owner_id = $1, is_listed = false WHERE id = $2',
      [user.id, nft.id]
    );
    
    // Add to inventory
    await pool.query(
      'INSERT INTO inventory (user_id, nft_id, purchase_price) VALUES ($1, $2, $3)',
      [user.id, nft.id, nft.price]
    );
    
    // Create transaction record
    await pool.query(
      `INSERT INTO transactions (user_id, type, amount, nft_id, status)
       VALUES ($1, 'buy', $2, $3, 'completed')`,
      [user.id, nft.price, nft.id]
    );
    
    // If NFT had previous owner, update their stats
    if (nft.owner_id) {
      await pool.query(
        'UPDATE users SET balance = balance + $1, sold_count = sold_count + 1 WHERE id = $2',
        [nft.price, nft.owner_id]
      );
      
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, nft_id, status)
         VALUES ($1, 'sell', $2, $3, 'completed')`,
        [nft.owner_id, nft.price, nft.id]
      );
    }
    
    await pool.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'NFT purchased successfully',
      new_balance: parseFloat(user.balance) - parseFloat(nft.price)
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error buying NFT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single NFT
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT n.*, c.name as collection_name, b.name as background_name,
              u.username as owner_username
       FROM nfts n
       LEFT JOIN collections c ON n.collection_id = c.id
       LEFT JOIN backgrounds b ON n.background_id = b.id
       LEFT JOIN users u ON n.owner_id = u.id
       WHERE n.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    
    const nft = result.rows[0];
    
    res.json({
      nft: {
        id: nft.id,
        name: nft.name,
        description: nft.description,
        collection: nft.collection_name,
        background: nft.background_name,
        price: parseFloat(nft.price),
        image_url: nft.image_url,
        rarity: nft.rarity,
        owner_id: nft.owner_id,
        owner_username: nft.owner_username,
        is_listed: nft.is_listed,
        attributes: nft.attributes,
        created_at: nft.created_at
      }
    });
  } catch (error) {
    console.error('Error getting NFT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

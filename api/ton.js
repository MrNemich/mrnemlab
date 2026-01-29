const express = require('express');
const axios = require('axios');
const router = express.Router();

// TON Center API integration
const TONCENTER_API = process.env.NODE_ENV === 'production' 
  ? process.env.TONCENTER_MAINNET_URL 
  : process.env.TONCENTER_TESTNET_URL;

const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY;

// Get TON balance for address
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const response = await axios.post(TONCENTER_API, {
      id: 1,
      jsonrpc: '2.0',
      method: 'getAddressBalance',
      params: { address }
    }, {
      headers: {
        'X-API-Key': TONCENTER_API_KEY
      }
    });
    
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    
    // Convert nanoton to TON
    const balanceInTON = (parseInt(response.data.result) / 1e9).toFixed(2);
    
    res.json({
      success: true,
      balance: balanceInTON,
      address
    });
    
  } catch (error) {
    console.error('Error getting TON balance:', error);
    res.status(500).json({ 
      error: 'Failed to get balance',
      details: error.message 
    });
  }
});

// Verify TON transaction
router.post('/verify-transaction', async (req, res) => {
  try {
    const { tx_hash, from_address, to_address, amount } = req.body;
    
    // Verify transaction on TON blockchain
    const response = await axios.post(TONCENTER_API, {
      id: 1,
      jsonrpc: '2.0',
      method: 'getTransaction',
      params: { 
        hash: tx_hash,
        address: from_address
      }
    }, {
      headers: {
        'X-API-Key': TONCENTER_API_KEY
      }
    });
    
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    
    const transaction = response.data.result;
    
    // Verify transaction details
    const isValid = transaction.out_msgs.some(msg => 
      msg.destination === to_address && 
      parseInt(msg.value) >= amount * 1e9
    );
    
    res.json({
      success: true,
      verified: isValid,
      transaction: transaction
    });
    
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({ 
      error: 'Failed to verify transaction',
      details: error.message 
    });
  }
});

// Get TON price in USD
router.get('/price', async (req, res) => {
  try {
    // Use CoinGecko or other API
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
    
    res.json({
      success: true,
      price: response.data['the-open-network'].usd
    });
    
  } catch (error) {
    console.error('Error getting TON price:', error);
    // Fallback price
    res.json({
      success: true,
      price: 2.5 // Fallback TON price
    });
  }
});

module.exports = router;

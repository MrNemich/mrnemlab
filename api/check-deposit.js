// api/check-deposit.js
export default async function handler(req, res) {
    // Настройка CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'POST') {
        try {
            const { userId, amount, walletAddress } = req.body;
            
            console.log(`🔍 Processing deposit for user ${userId}: ${amount} TON from ${walletAddress}`);
            
            if (!userId || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }
            
            // Симуляция успешного депозита
            return res.status(200).json({
                success: true,
                message: `✅ Баланс пополнен на ${amount} TON`,
                depositId: `deposit_${Date.now()}_${userId}`,
                newBalance: 0, // Клиент сам обновит баланс
                timestamp: Date.now(),
                details: {
                    userId,
                    amount,
                    transactionType: 'deposit',
                    status: 'completed'
                }
            });
            
        } catch (error) {
            console.error('❌ Error in check-deposit:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Server error. Please try again later.'
            });
        }
    } 
    else if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            message: 'BEAT CLUB Deposit API',
            version: '1.0.0',
            status: 'operational'
        });
    } 
    else {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }
}

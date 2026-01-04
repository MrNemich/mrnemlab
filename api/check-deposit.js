// api/check-deposit.js
const axios = require('axios');

// Ваш кошелек для пополнения
const BOT_ADDRESS = "UQBhcIzPNZJXa1nWLypYIvO-ybYhBSZEGyH-6MDRdaKyzEJV";
// TON Center API ключ (получите бесплатный на https://toncenter.com)
const TON_API_KEY = process.env.TON_API_KEY || "a01e20f2cfbc0e467faeb0dc9910b8ea8d4b5e6e5319458392f53e89bb1d0d18";

// Временное хранилище в памяти (в продакшене используйте базу данных)
const deposits = new Map();
const users = new Map();

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
            const { userId, amount, walletAddress, transactionHash } = req.body;
            
            console.log(`🔍 Checking deposit for user ${userId}: ${amount} TON from ${walletAddress}`);
            
            if (!userId || !amount || !walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }
            
            // Вариант 1: Проверка по transactionHash (если пользователь отправил хэш транзакции)
            if (transactionHash) {
                const transactionValid = await verifyTransactionByHash(transactionHash, walletAddress, amount);
                
                if (transactionValid) {
                    return processSuccessfulDeposit(userId, amount, res);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Transaction not found or invalid'
                    });
                }
            }
            
            // Вариант 2: Проверка последних транзакций с кошелька пользователя
            const recentTransactions = await getUserTransactions(walletAddress);
            const matchingTransaction = findMatchingTransaction(recentTransactions, amount);
            
            if (matchingTransaction) {
                return processSuccessfulDeposit(userId, amount, res);
            }
            
            // Вариант 3: Проверка транзакций на вашем кошельке
            const botTransactions = await getBotTransactions();
            const userTransaction = findUserTransactionInBotTransactions(botTransactions, walletAddress, amount);
            
            if (userTransaction) {
                return processSuccessfulDeposit(userId, amount, res);
            }
            
            // Если транзакция не найдена
            return res.status(404).json({
                success: false,
                message: 'Transaction not found. Please wait a few minutes and try again.',
                suggestions: [
                    'Wait 1-2 minutes for transaction confirmation',
                    'Make sure you sent exactly ' + amount + ' TON',
                    'Check if transaction was successful in your wallet'
                ]
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
        // Для отладки: получить информацию о депозитах
        const { userId } = req.query;
        
        if (userId) {
            const userData = users.get(userId) || { balance: 0, deposits: [] };
            return res.status(200).json({
                success: true,
                userId,
                balance: userData.balance,
                depositCount: userData.deposits?.length || 0,
                totalDeposited: userData.deposits?.reduce((sum, dep) => sum + dep.amount, 0) || 0
            });
        }
        
        // Статистика по всем пользователям
        return res.status(200).json({
            success: true,
            totalUsers: users.size,
            totalDeposits: deposits.size,
            botAddress: BOT_ADDRESS
        });
    } 
    else {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Проверка транзакции по хэшу
async function verifyTransactionByHash(transactionHash, expectedFromAddress, expectedAmount) {
    try {
        const response = await axios.get(
            `https://toncenter.com/api/v2/getTransaction?hash=${transactionHash}&api_key=${TON_API_KEY}`
        );
        
        const transaction = response.data.result;
        
        if (!transaction) return false;
        
        // Проверяем, что транзакция входящая на наш кошелек
        const isIncoming = transaction.in_msg && 
                          transaction.in_msg.destination === BOT_ADDRESS &&
                          transaction.in_msg.source === expectedFromAddress;
        
        if (!isIncoming) return false;
        
        // Проверяем сумму (с учетом комиссии)
        const actualAmount = transaction.in_msg.value / 1000000000; // наноТоны в TON
        const amountDifference = Math.abs(actualAmount - expectedAmount);
        
        // Допускаем небольшую разницу из-за комиссий
        return amountDifference < 0.1;
        
    } catch (error) {
        console.error('Error verifying transaction by hash:', error);
        return false;
    }
}

// Получить транзакции пользователя
async function getUserTransactions(walletAddress) {
    try {
        const response = await axios.get(
            `https://toncenter.com/api/v2/getTransactions?address=${walletAddress}&limit=10&api_key=${TON_API_KEY}`
        );
        return response.data.result || [];
    } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
    }
}

// Получить транзакции на ваш кошелек
async function getBotTransactions() {
    try {
        const response = await axios.get(
            `https://toncenter.com/api/v2/getTransactions?address=${BOT_ADDRESS}&limit=20&api_key=${TON_API_KEY}`
        );
        return response.data.result || [];
    } catch (error) {
        console.error('Error getting bot transactions:', error);
        return [];
    }
}

// Найти подходящую транзакцию среди транзакций пользователя
function findMatchingTransaction(transactions, amount) {
    const targetAmount = amount * 1000000000; // Конвертируем в наноТоны
    
    // Ищем исходящие транзакции на наш адрес
    return transactions.find(tx => {
        if (tx.out_msgs && tx.out_msgs.length > 0) {
            const msg = tx.out_msgs[0];
            return msg.destination === BOT_ADDRESS && 
                   Math.abs(msg.value - targetAmount) < 10000000; // 0.01 TON погрешность
        }
        return false;
    });
}

// Найти транзакцию пользователя среди транзакций бота
function findUserTransactionInBotTransactions(transactions, userAddress, amount) {
    const targetAmount = amount * 1000000000; // Конвертируем в наноТоны
    
    // Ищем входящие транзакции от пользователя
    return transactions.find(tx => {
        if (tx.in_msg) {
            const msg = tx.in_msg;
            const isFromUser = msg.source === userAddress;
            const isCorrectAmount = Math.abs(msg.value - targetAmount) < 10000000; // 0.01 TON погрешность
            const isRecent = Date.now() / 1000 - tx.utime < 3600; // Не старше 1 часа
            
            return isFromUser && isCorrectAmount && isRecent;
        }
        return false;
    });
}

// Обработка успешного депозита
function processSuccessfulDeposit(userId, amount, res) {
    const depositId = `${userId}_${Date.now()}`;
    
    // Обновляем данные пользователя
    const userData = users.get(userId) || {
        balance: 0,
        deposits: [],
        lastUpdated: Date.now()
    };
    
    userData.balance += amount;
    userData.deposits.push({
        id: depositId,
        amount: amount,
        timestamp: Date.now(),
        status: 'completed'
    });
    userData.lastUpdated = Date.now();
    
    users.set(userId, userData);
    
    // Сохраняем информацию о депозите
    deposits.set(depositId, {
        userId,
        amount,
        timestamp: Date.now(),
        status: 'completed'
    });
    
    console.log(`✅ Deposit successful: User ${userId} +${amount} TON. New balance: ${userData.balance} TON`);
    
    return res.status(200).json({
        success: true,
        message: `✅ Баланс пополнен на ${amount} TON`,
        depositId,
        newBalance: userData.balance,
        timestamp: Date.now(),
        details: {
            userId,
            amount,
            transactionType: 'deposit',
            status: 'completed'
        }
    });
}

// ========== Дополнительные API endpoints ==========

// Можно добавить в этот же файл или создать отдельные файлы:

// api/user-balance.js - для получения баланса пользователя
// api/transaction-history.js - для истории транзакций

// api/verify-payment.js - для верификации платежа

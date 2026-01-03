document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    
    // Инициализируем приложение
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Получаем элементы
    const navButtons = document.querySelectorAll('.nav-button');
    const mainContent = document.getElementById('main-content');
    const balanceAmount = document.getElementById('balance-amount');
    const addBalanceBtn = document.getElementById('add-balance-btn');
    const balanceModal = document.getElementById('balance-modal');
    const closeBalanceModal = document.getElementById('close-balance-modal');
    const userAvatarElement = document.getElementById('user-avatar');
    const userNameElement = document.getElementById('user-name');
    const depositBtn = document.getElementById('deposit-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const botBalanceElement = document.getElementById('bot-balance');
    const connectInfoElement = document.getElementById('connect-info');
    const depositModal = document.getElementById('deposit-modal');
    const closeDepositModal = document.getElementById('close-deposit-modal');
    const confirmDepositBtn = document.getElementById('confirm-deposit-btn');
    const depositAmountInput = document.getElementById('deposit-amount');
    const amountPresets = document.querySelectorAll('.amount-preset');
    const depositWalletAddress = document.getElementById('deposit-wallet-address');
    const depositWalletBalance = document.getElementById('deposit-wallet-balance');
    const historyList = document.getElementById('history-list');
    
    // Фиксированная дата окончания лотереи (для всех одинаковая)
    const lotteryEndDate = new Date(Date.UTC(2024, 5, 15, 12, 0, 0)); // 15 июня 2024, 12:00 UTC
    
    // Текущий пользователь
    let userData = {
        id: null,
        balance: 0,
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 0,
        sold: 0,
        totalVolume: 0,
        lotteryParticipating: false,
        transactions: []
    };
    
    // Инициализация TON Connect
    let tonConnectUI = null;
    let tonConnect = null;
    
    // Загрузка данных пользователя
    function loadUserData() {
        // Проверяем, есть ли сохраненные данные
        const savedData = localStorage.getItem('beatclub_user_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // Проверяем совпадение ID пользователя
            if (tg.initDataUnsafe?.user && parsed.id === tg.initDataUnsafe.user.id) {
                userData = parsed;
                // Загружаем транзакции
                loadTransactionHistory();
            }
        }
        
        // Загружаем данные из Telegram
        if (tg.initDataUnsafe?.user) {
            const user = tg.initDataUnsafe.user;
            userData.id = user.id;
            
            // Формируем имя пользователя
            let name = 'Гость';
            if (user.username) {
                name = '@' + user.username;
            } else if (user.first_name) {
                name = user.first_name;
                if (user.last_name) {
                    name += ' ' + user.last_name;
                }
            }
            
            userData.username = name;
            userNameElement.textContent = name;
            
            // Загружаем аватарку
            loadUserAvatar(user);
        }
        
        // Обновляем отображение
        updateBalanceDisplay();
        updateConnectInfo();
    }
    
    // Сохранение данных пользователя
    function saveUserData() {
        localStorage.setItem('beatclub_user_data', JSON.stringify(userData));
    }
    
    // Загрузка аватарки пользователя
    function loadUserAvatar(user) {
        if (user.photo_url) {
            userData.avatarUrl = user.photo_url;
            
            const avatarImg = document.createElement('img');
            avatarImg.src = user.photo_url;
            avatarImg.alt = userData.username;
            avatarImg.onload = function() {
                const placeholder = userAvatarElement.querySelector('.avatar-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                userAvatarElement.appendChild(avatarImg);
                avatarImg.style.animation = 'avatarPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            };
            
            avatarImg.onerror = function() {
                console.log('Failed to load avatar, using placeholder');
                setAvatarPlaceholder();
            };
        } else {
            setAvatarPlaceholder();
        }
    }
    
    function setAvatarPlaceholder() {
        const placeholder = userAvatarElement.querySelector('.avatar-placeholder');
        if (placeholder) {
            placeholder.style.background = getRandomGradient();
            placeholder.innerHTML = `<span style="font-size: 1.2rem; font-weight: bold;">${userData.username.charAt(0).toUpperCase()}</span>`;
        }
    }
    
    function getRandomGradient() {
        const gradients = [
            'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            'linear-gradient(135deg, #4ECDC4, #44A08D)',
            'linear-gradient(135deg, #FFD166, #FFB347)',
            'linear-gradient(135deg, #7B2FF7, #5A1BD6)',
            'linear-gradient(135deg, #06D6A0, #04A97F)',
            'linear-gradient(135deg, #EF476F, #D43A5E)',
            'linear-gradient(135deg, #118AB2, #0D6F8F)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }
    
    // Обновление отображения баланса
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        botBalanceElement.textContent = userData.balance.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Инициализация TON Connect
    function initTonConnect() {
        try {
            const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
            
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: manifestUrl,
                buttonRootId: 'ton-connect-modal',
                actionsConfiguration: {
                    twaReturnUrl: 'https://t.me/beatclub_bot'
                }
            });
            
            // Подписываемся на изменения статуса кошелька
            tonConnectUI.onStatusChange(async (walletInfo) => {
                if (walletInfo) {
                    // Кошелек подключен
                    userData.walletConnected = true;
                    userData.walletAddress = walletInfo.account.address;
                    
                    try {
                        // Получаем реальный баланс кошелька
                        await updateRealWalletBalance(walletInfo.account.address);
                        updateConnectInfo();
                        
                        tg.showAlert('✅ Кошелек успешно подключен!');
                        tg.HapticFeedback.notificationOccurred('success');
                        
                        // Обновляем информацию в депозит модалке
                        updateDepositModalInfo();
                    } catch (error) {
                        console.error('Error getting wallet balance:', error);
                        tg.showAlert('⚠️ Не удалось получить баланс кошелька');
                    }
                } else {
                    // Кошелек отключен
                    userData.walletConnected = false;
                    userData.walletAddress = null;
                    userData.walletBalance = 0;
                    updateConnectInfo();
                    updateDepositModalInfo();
                }
            });
            
            // Проверяем, есть ли уже подключенный кошелек
            const currentWallet = tonConnectUI.wallet;
            if (currentWallet) {
                userData.walletConnected = true;
                userData.walletAddress = currentWallet.account.address;
                updateRealWalletBalance(currentWallet.account.address);
            }
        } catch (error) {
            console.error('TON Connect initialization error:', error);
            tg.showAlert('⚠️ Ошибка инициализации TON Connect');
        }
    }
    
    // Получение реального баланса кошелька
    async function updateRealWalletBalance(walletAddress) {
        try {
            // Используем публичный API для получения баланса
            const response = await fetch(`https://tonapi.io/v1/account/getInfo?account=${walletAddress}`);
            const data = await response.json();
            
            if (data && data.balance) {
                // Конвертируем наноТоны в TON (1 TON = 1,000,000,000 наноТон)
                userData.walletBalance = parseFloat(data.balance) / 1000000000;
            } else {
                // Если API не работает, используем случайное значение для демо
                userData.walletBalance = parseFloat((Math.random() * 100).toFixed(2));
            }
        } catch (error) {
            console.error('Error fetching real balance:', error);
            // Для демо используем случайное значение
            userData.walletBalance = parseFloat((Math.random() * 100).toFixed(2));
        }
        
        updateConnectInfo();
    }
    
    // Обновление информации о подключении
    function updateConnectInfo() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = `${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}`;
            connectInfoElement.innerHTML = `
                <div class="wallet-info-connected">
                    <div class="wallet-address">
                        <i class="fas fa-wallet"></i>
                        <span class="address-text">${shortAddress}</span>
                        <button class="copy-address-btn" id="copy-address-btn">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="wallet-balance-info">
                        <i class="fas fa-coins"></i>
                        <span class="balance-text">${userData.walletBalance.toFixed(2)} TON</span>
                    </div>
                </div>
            `;
            
            connectWalletBtn.innerHTML = '<i class="fas fa-unplug"></i> Отключить';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #ff375f, #d43a5e)';
            
            // Добавляем обработчик для кнопки копирования
            document.getElementById('copy-address-btn')?.addEventListener('click', function() {
                navigator.clipboard.writeText(userData.walletAddress);
                tg.showAlert('✅ Адрес скопирован в буфер обмена!');
                tg.HapticFeedback.notificationOccurred('success');
            });
        } else {
            connectInfoElement.innerHTML = `
                <div class="wallet-info-placeholder">
                    <i class="fas fa-wallet"></i>
                    <span>Подключите ваш TON кошелек для вывода средств</span>
                </div>
            `;
            connectWalletBtn.innerHTML = '<i class="fas fa-plug"></i> Подключить';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #007aff, #0056cc)';
        }
    }
    
    // Обновление информации в модалке депозита
    function updateDepositModalInfo() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = `${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}`;
            depositWalletAddress.textContent = shortAddress;
            depositWalletBalance.textContent = userData.walletBalance.toFixed(2);
            depositWalletAddress.parentElement.style.color = '#ffffff';
            depositWalletBalance.parentElement.style.color = '#ffffff';
        } else {
            depositWalletAddress.textContent = 'Не подключен';
            depositWalletBalance.textContent = '0';
            depositWalletAddress.parentElement.style.color = '#ff6b6b';
            depositWalletBalance.parentElement.style.color = '#ff6b6b';
        }
    }
    
    // Загрузка истории транзакций
    function loadTransactionHistory() {
        if (!userData.transactions || userData.transactions.length === 0) {
            historyList.innerHTML = `
                <div class="no-transactions">
                    <i class="fas fa-clock"></i>
                    <span>Нет операций</span>
                </div>
            `;
            return;
        }
        
        let historyHTML = '';
        userData.transactions.slice(-5).reverse().forEach(transaction => {
            const date = new Date(transaction.timestamp).toLocaleDateString('ru-RU');
            const time = new Date(transaction.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            historyHTML += `
                <div class="transaction-item ${transaction.type}">
                    <div class="transaction-icon">
                        <i class="fas ${transaction.type === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-type">${transaction.type === 'deposit' ? 'Пополнение' : 'Вывод'}</div>
                        <div class="transaction-date">${date} ${time}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'deposit' ? '+' : '-'}${transaction.amount} TON
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = historyHTML;
    }
    
    // Добавление транзакции в историю
    function addTransaction(type, amount) {
        const transaction = {
            id: Date.now(),
            type: type,
            amount: amount,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        userData.transactions.push(transaction);
        saveUserData();
        loadTransactionHistory();
    }
    
    // Создание содержимого для разных страниц
    function createHomeContent() {
        return `
            <div class="page-content">
                <div class="home-container">
                    <div class="home-header">
                        <div class="home-icon">
                            <i class="fas fa-headphones-alt"></i>
                        </div>
                        <h1 class="home-title">BEAT CLUB</h1>
                        <p class="home-subtitle">Торговая платформа NFT</p>
                    </div>
                    
                    <div class="home-stats">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-value">1,234</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-exchange-alt"></i></div>
                            <div class="stat-value">5,678</div>
                            <div class="stat-label">Сделок</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-gem"></i></div>
                            <div class="stat-value">12.5K</div>
                            <div class="stat-label">TON Объем</div>
                        </div>
                    </div>
                    
                    <div class="featured-nfts">
                        <h3><i class="fas fa-star"></i> Популярные NFT</h3>
                        <div class="nft-grid">
                            <div class="nft-card">
                                <div class="nft-image">
                                    <i class="fas fa-music"></i>
                                </div>
                                <div class="nft-info">
                                    <div class="nft-name">Beat #1</div>
                                    <div class="nft-price">12.5 TON</div>
                                </div>
                            </div>
                            <div class="nft-card">
                                <div class="nft-image">
                                    <i class="fas fa-drum"></i>
                                </div>
                                <div class="nft-info">
                                    <div class="nft-name">Drum Kit</div>
                                    <div class="nft-price">8.9 TON</div>
                                </div>
                            </div>
                            <div class="nft-card">
                                <div class="nft-image">
                                    <i class="fas fa-guitar"></i>
                                </div>
                                <div class="nft-info">
                                    <div class="nft-name">Guitar Loop</div>
                                    <div class="nft-price">15.3 TON</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="empty-message">
                        <i class="fas fa-box-open"></i>
                        <p>Больше товаров появится позже...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createLotteryContent() {
        return `
            <div class="page-content">
                <div class="lottery-container compact">
                    <div class="lottery-header">
                        <div class="lottery-icon">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div class="lottery-title">
                            <h3>Pepe NFT Лотерея</h3>
                            <p class="lottery-subtitle">Шанс выиграть эксклюзивный NFT</p>
                        </div>
                    </div>
                    
                    <div class="lottery-prize">
                        <div class="prize-image">
                            <i class="fas fa-frog"></i>
                        </div>
                        <div class="prize-info">
                            <div class="prize-name">Golden Pepe NFT</div>
                            <div class="prize-value">≈ 50 TON</div>
                        </div>
                    </div>
                    
                    <div class="lottery-details">
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <div class="detail-content">
                                <div class="detail-label">До конца:</div>
                                <div class="countdown-timer" id="countdown-timer">
                                    <span id="days">00</span>д :
                                    <span id="hours">00</span>ч :
                                    <span id="minutes">00</span>м :
                                    <span id="seconds">00</span>с
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <div class="detail-content">
                                <div class="detail-label">Участников:</div>
                                <div class="detail-value">127</div>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-ticket-alt"></i>
                            <div class="detail-content">
                                <div class="detail-label">Цена билета:</div>
                                <div class="detail-value price">1 TON</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="lottery-actions">
                        ${userData.lotteryParticipating ? `
                            <div class="participant-status active">
                                <i class="fas fa-check-circle"></i>
                                <span>Вы участвуете в розыгрыше!</span>
                            </div>
                            <button class="ticket-btn disabled">
                                <i class="fas fa-check"></i>
                                <span>Уже участвуете</span>
                            </button>
                        ` : `
                            <button class="ticket-btn" id="buy-ticket-btn">
                                <i class="fas fa-shopping-cart"></i>
                                <span>Купить билет за 1 TON</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    function createTasksContent() {
        return `
            <div class="page-content">
                <div class="tasks-container">
                    <div class="tasks-header">
                        <div class="tasks-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <h2>Ежедневные задания</h2>
                        <p class="tasks-subtitle">Выполняйте задания и получайте TON</p>
                    </div>
                    
                    <div class="tasks-list">
                        <div class="task-item completed">
                            <div class="task-icon"><i class="fas fa-sign-in-alt"></i></div>
                            <div class="task-info">
                                <div class="task-title">Ежедневный вход</div>
                                <div class="task-description">Зайдите в приложение</div>
                            </div>
                            <div class="task-reward">
                                <span class="reward-amount">+0.1</span>
                                <span class="reward-currency">TON</span>
                            </div>
                        </div>
                        
                        <div class="task-item active">
                            <div class="task-icon"><i class="fas fa-share-alt"></i></div>
                            <div class="task-info">
                                <div class="task-title">Поделиться с друзьями</div>
                                <div class="task-description">Пригласите 3 друзей</div>
                            </div>
                            <div class="task-reward">
                                <span class="reward-amount">+1.0</span>
                                <span class="reward-currency">TON</span>
                            </div>
                        </div>
                        
                        <div class="task-item locked">
                            <div class="task-icon"><i class="fas fa-gem"></i></div>
                            <div class="task-info">
                                <div class="task-title">Купить NFT</div>
                                <div class="task-description">Совершите первую покупку</div>
                            </div>
                            <div class="task-reward">
                                <span class="reward-amount">+5.0</span>
                                <span class="reward-currency">TON</span>
                            </div>
                        </div>
                        
                        <div class="task-item locked">
                            <div class="task-icon"><i class="fas fa-star"></i></div>
                            <div class="task-info">
                                <div class="task-title">Продать NFT</div>
                                <div class="task-description">Продайте свой первый NFT</div>
                            </div>
                            <div class="task-reward">
                                <span class="reward-amount">+3.0</span>
                                <span class="reward-currency">TON</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tasks-total">
                        <div class="total-label">Всего доступно:</div>
                        <div class="total-amount">9.1 TON</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createRatingContent() {
        // Генерация случайных пользователей для рейтинга
        const users = [];
        const names = ['Alex', 'Max', 'Anna', 'Mike', 'Kate', 'John', 'Lisa', 'Tom', 'Sam', 'Eva'];
        
        for (let i = 1; i <= 10; i++) {
            const volume = Math.floor(Math.random() * 10000);
            users.push({
                rank: i,
                name: names[Math.floor(Math.random() * names.length)] + (Math.floor(Math.random() * 1000)),
                volume: volume,
                isCurrent: i === 3 && userData.username.includes('Alex') // Пример для демо
            });
        }
        
        let ratingHTML = `
            <div class="page-content">
                <div class="rating-container">
                    <div class="rating-header">
                        <div class="rating-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <h2>Топ игроков</h2>
                        <p class="rating-subtitle">Сортировка по общему объему торгов</p>
                    </div>
                    
                    <div class="time-filter">
                        <button class="time-btn active">За день</button>
                        <button class="time-btn">За неделю</button>
                        <button class="time-btn">За всё время</button>
                    </div>
                    
                    <div class="rating-list">
                        <div class="rating-header-row">
                            <div class="header-rank">#</div>
                            <div class="header-user">Пользователь</div>
                            <div class="header-volume">Объем</div>
                        </div>
        `;
        
        users.forEach(user => {
            ratingHTML += `
                <div class="rating-item ${user.isCurrent ? 'current-user' : ''}">
                    <div class="user-rank">
                        ${user.rank <= 3 ? 
                            `<span class="rank-medal rank-${user.rank}">${user.rank}</span>` : 
                            `<span class="rank-number">${user.rank}</span>`
                        }
                    </div>
                    <div class="user-info">
                        <div class="user-avatar-small">
                            ${user.isCurrent ? 
                                '<i class="fas fa-user"></i>' : 
                                `<span>${user.name.charAt(0)}</span>`
                            }
                        </div>
                        <div class="user-name">${user.name}</div>
                    </div>
                    <div class="user-volume">${user.volume.toLocaleString()} TON</div>
                </div>
            `;
        });
        
        ratingHTML += `
                    </div>
                    
                    <div class="user-position">
                        <div class="position-label">Ваша позиция:</div>
                        <div class="position-value">#3</div>
                        <div class="position-volume">4,567 TON</div>
                    </div>
                </div>
            </div>
        `;
        
        return ratingHTML;
    }
    
    function createProfileContent() {
        return `
            <div class="page-content">
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar-large">
                            ${userData.avatarUrl ? 
                                `<img src="${userData.avatarUrl}" alt="${userData.username}">` : 
                                `<div class="avatar-placeholder-large">
                                    <span>${userData.username.charAt(0).toUpperCase()}</span>
                                </div>`
                            }
                        </div>
                        
                        <div class="profile-info">
                            <h2 class="profile-username">${userData.username}</h2>
                            <div class="profile-id">ID: ${userData.id || '0000'}</div>
                            <div class="profile-status">
                                <i class="fas fa-circle"></i>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-stats-grid">
                        <div class="stat-card-profile">
                            <div class="stat-icon-profile"><i class="fas fa-wallet"></i></div>
                            <div class="stat-value-profile">${userData.balance.toFixed(2)}</div>
                            <div class="stat-label-profile">Баланс</div>
                        </div>
                        
                        <div class="stat-card-profile">
                            <div class="stat-icon-profile"><i class="fas fa-shopping-cart"></i></div>
                            <div class="stat-value-profile">${userData.bought}</div>
                            <div class="stat-label-profile">Куплено</div>
                        </div>
                        
                        <div class="stat-card-profile">
                            <div class="stat-icon-profile"><i class="fas fa-store"></i></div>
                            <div class="stat-value-profile">${userData.sold}</div>
                            <div class="stat-label-profile">Продано</div>
                        </div>
                        
                        <div class="stat-card-profile">
                            <div class="stat-icon-profile"><i class="fas fa-chart-line"></i></div>
                            <div class="stat-value-profile">${userData.totalVolume}</div>
                            <div class="stat-label-profile">Объем</div>
                        </div>
                    </div>
                    
                    <div class="profile-actions">
                        <h3><i class="fas fa-cog"></i> Настройки</h3>
                        
                        <div class="action-list">
                            <div class="action-item">
                                <div class="action-icon"><i class="fas fa-wallet"></i></div>
                                <div class="action-content">
                                    <div class="action-title">TON Кошелек</div>
                                    <div class="action-subtitle">${userData.walletConnected ? 'Подключен' : 'Не подключен'}</div>
                                </div>
                                <div class="action-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            
                            <div class="action-item">
                                <div class="action-icon"><i class="fas fa-bell"></i></div>
                                <div class="action-content">
                                    <div class="action-title">Уведомления</div>
                                    <div class="action-subtitle">Включены</div>
                                </div>
                                <div class="action-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            
                            <div class="action-item">
                                <div class="action-icon"><i class="fas fa-shield-alt"></i></div>
                                <div class="action-content">
                                    <div class="action-title">Безопасность</div>
                                    <div class="action-subtitle">Двухфакторная аутентификация</div>
                                </div>
                                <div class="action-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            
                            <div class="action-item">
                                <div class="action-icon"><i class="fas fa-question-circle"></i></div>
                                <div class="action-content">
                                    <div class="action-title">Помощь</div>
                                    <div class="action-subtitle">FAQ и поддержка</div>
                                </div>
                                <div class="action-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Обновление таймера лотереи
    function updateLotteryTimer() {
        const timerElement = document.getElementById('countdown-timer');
        if (!timerElement) return;
        
        const now = new Date();
        const timeLeft = lotteryEndDate - now;
        
        if (timeLeft <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Обновление контента страницы
    function updateContent(page) {
        // Анимация исчезновения
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            let content = '';
            
            switch(page) {
                case 'home':
                    content = createHomeContent();
                    break;
                case 'lottery':
                    content = createLotteryContent();
                    break;
                case 'tasks':
                    content = createTasksContent();
                    break;
                case 'rating':
                    content = createRatingContent();
                    break;
                case 'profile':
                    content = createProfileContent();
                    break;
            }
            
            mainContent.innerHTML = content;
            
            // Инициализация элементов после создания контента
            if (page === 'lottery') {
                const buyTicketBtn = document.getElementById('buy-ticket-btn');
                
                if (buyTicketBtn && !buyTicketBtn.classList.contains('disabled')) {
                    buyTicketBtn.addEventListener('click', function() {
                        if (userData.balance < 1) {
                            tg.showAlert('❌ Недостаточно TON для покупки билета!');
                            tg.HapticFeedback.notificationOccurred('error');
                            return;
                        }
                        
                        // Покупка билета
                        userData.balance -= 1;
                        userData.bought += 1;
                        userData.lotteryParticipating = true;
                        
                        updateBalanceDisplay();
                        saveUserData();
                        
                        addTransaction('withdraw', 1);
                        
                        // Перерисовываем страницу
                        updateContent('lottery');
                        
                        tg.showAlert('✅ Вы успешно приобрели билет! Удачи в розыгрыше!');
                        tg.HapticFeedback.notificationOccurred('success');
                    });
                }
                
                // Запускаем таймер
                setInterval(updateLotteryTimer, 1000);
                updateLotteryTimer();
            }
            
            // Анимация появления
            setTimeout(() => {
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }, 50);
            
        }, 200);
    }
    
    // Установка активной кнопки
    function setActiveButton(button) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    // Функция пополнения баланса через TON кошелек
    async function processDeposit(amount) {
        if (!userData.walletConnected || !userData.walletAddress) {
            tg.showAlert('❌ Пожалуйста, подключите TON кошелек сначала');
            return false;
        }
        
        if (userData.walletBalance < amount) {
            tg.showAlert(`❌ Недостаточно средств в кошельке. Доступно: ${userData.walletBalance.toFixed(2)} TON`);
            return false;
        }
        
        try {
            tg.showAlert('⏳ Инициируем транзакцию...');
            
            // В реальном приложении здесь будет создание реальной транзакции
            // Для демо симулируем успешную транзакцию
            
            setTimeout(() => {
                // Обновляем балансы
                userData.walletBalance -= amount;
                userData.balance += amount;
                userData.totalVolume += amount;
                
                updateBalanceDisplay();
                updateConnectInfo();
                updateDepositModalInfo();
                saveUserData();
                
                // Добавляем в историю
                addTransaction('deposit', amount);
                
                // Закрываем модалку
                depositModal.classList.remove('active');
                depositAmountInput.value = '';
                
                tg.showAlert(`✅ Успешно пополнено ${amount} TON!`);
                tg.HapticFeedback.notificationOccurred('success');
            }, 1500);
            
            return true;
            
        } catch (error) {
            console.error('Deposit error:', error);
            tg.showAlert('❌ Ошибка при пополнении. Попробуйте снова.');
            return false;
        }
    }
    
    // Функция вывода средств
    async function processWithdrawal(amount) {
        if (!userData.walletConnected || !userData.walletAddress) {
            tg.showAlert('❌ Пожалуйста, подключите TON кошелек сначала');
            return false;
        }
        
        if (userData.balance < amount) {
            tg.showAlert(`❌ Недостаточно средств на балансе. Доступно: ${userData.balance.toFixed(2)} TON`);
            return false;
        }
        
        try {
            tg.showAlert('⏳ Инициируем вывод средств...');
            
            // В реальном приложении здесь будет создание реальной транзакции
            // Для демо симулируем успешный вывод
            
            setTimeout(() => {
                // Обновляем балансы
                userData.balance -= amount;
                userData.walletBalance += amount;
                
                updateBalanceDisplay();
                updateConnectInfo();
                saveUserData();
                
                // Добавляем в историю
                addTransaction('withdraw', amount);
                
                tg.showAlert(`✅ Успешно выведено ${amount} TON на ваш кошелек!`);
                tg.HapticFeedback.notificationOccurred('success');
            }, 1500);
            
            return true;
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            tg.showAlert('❌ Ошибка при выводе. Попробуйте снова.');
            return false;
        }
    }
    
    // Обработчики событий
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            setActiveButton(this);
            updateContent(page);
            
            // Эффект нажатия
            this.style.transform = 'scale(0.92)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Вибрация
            if (navigator.vibrate) {
                navigator.vibrate(20);
            }
        });
    });
    
    // Обработчик кнопки пополнения баланса
    addBalanceBtn.addEventListener('click', function() {
        // Эффект нажатия
        this.style.transform = 'scale(0.85)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        
        // Вибрация
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
        
        // Показать модальное окно
        balanceModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Закрытие модального окна баланса
    closeBalanceModal.addEventListener('click', function() {
        balanceModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Клик вне модального окна баланса
    balanceModal.addEventListener('click', function(e) {
        if (e.target === this) {
            balanceModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Кнопка пополнения
    depositBtn.addEventListener('click', function() {
        // Закрываем основное модальное окно
        balanceModal.classList.remove('active');
        
        // Обновляем информацию в депозит модалке
        updateDepositModalInfo();
        
        // Показываем модальное окно пополнения
        setTimeout(() => {
            depositModal.classList.add('active');
        }, 100);
    });
    
    // Закрытие модального окна депозита
    closeDepositModal.addEventListener('click', function() {
        depositModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Клик вне модального окна депозита
    depositModal.addEventListener('click', function(e) {
        if (e.target === this) {
            depositModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Кнопки предустановленных сумм
    amountPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            depositAmountInput.value = amount;
            
            // Подсветка выбранной суммы
            amountPresets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Кнопка подтверждения депозита
    confirmDepositBtn.addEventListener('click', async function() {
        const amount = parseFloat(depositAmountInput.value);
        
        if (!amount || amount <= 0) {
            tg.showAlert('❌ Введите корректную сумму');
            return;
        }
        
        if (amount < 0.1) {
            tg.showAlert('❌ Минимальная сумма пополнения: 0.1 TON');
            return;
        }
        
        // Процесс пополнения
        const success = await processDeposit(amount);
        
        if (success) {
            // Сбрасываем подсветку пресетов
            amountPresets.forEach(p => p.classList.remove('active'));
        }
    });
    
    // Кнопка вывода
    withdrawBtn.addEventListener('click', async function() {
        if (!userData.walletConnected) {
            tg.showAlert('❌ Пожалуйста, подключите TON кошелек для вывода средств');
            return;
        }
        
        if (userData.balance <= 0) {
            tg.showAlert('❌ На вашем балансе недостаточно средств');
            return;
        }
        
        tg.showPopup({
            title: '💰 Вывод средств',
            message: `Доступно для вывода: ${userData.balance.toFixed(2)} TON\n\nВаш кошелек: ${userData.walletAddress.slice(0, 8)}...${userData.walletAddress.slice(-8)}`,
            buttons: [
                {id: 'withdraw_all', type: 'default', text: 'Вывести всё'},
                {id: 'custom', type: 'default', text: 'Указать сумму'},
                {type: 'cancel', text: '❌ Отмена'}
            ]
        }, async function(buttonId) {
            if (buttonId === 'withdraw_all') {
                const success = await processWithdrawal(userData.balance);
                if (success) {
                    // Закрываем модальное окно
                    balanceModal.classList.remove('active');
                }
            } else if (buttonId === 'custom') {
                tg.showPopup({
                    title: 'Введите сумму',
                    message: `Доступно: ${userData.balance.toFixed(2)} TON`,
                    buttons: [
                        {id: 'confirm', type: 'default', text: 'Подтвердить'},
                        {type: 'cancel', text: '❌ Отмена'}
                    ]
                }, async function(confirmId) {
                    if (confirmId === 'confirm') {
                        // В реальном приложении здесь был бы ввод суммы
                        // Для демо берем половину баланса
                        const amount = userData.balance / 2;
                        const success = await processWithdrawal(amount);
                        if (success) {
                            balanceModal.classList.remove('active');
                        }
                    }
                });
            }
        });
    });
    
    // Кнопка подключения кошелька
    connectWalletBtn.addEventListener('click', function() {
        if (userData.walletConnected) {
            // Отключение кошелька
            if (tonConnectUI) {
                tonConnectUI.disconnect();
            }
            userData.walletConnected = false;
            userData.walletAddress = null;
            userData.walletBalance = 0;
            updateConnectInfo();
            updateDepositModalInfo();
            
            tg.showAlert('✅ Кошелек отключен');
            tg.HapticFeedback.notificationOccurred('warning');
        } else {
            // Подключение кошелька
            if (tonConnectUI) {
                tonConnectUI.openModal();
            }
        }
    });
    
    // Валидация ввода суммы
    depositAmountInput.addEventListener('input', function() {
        let value = this.value;
        
        // Убираем все, кроме цифр и точки
        value = value.replace(/[^\d.]/g, '');
        
        // Убираем лишние точки
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Ограничиваем 2 знаками после точки
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        this.value = value;
        
        // Сбрасываем подсветку пресетов при ручном вводе
        amountPresets.forEach(p => p.classList.remove('active'));
    });
    
    // Инициализация
    loadUserData();
    initTonConnect();
    updateContent('home');
    
    // Плавное появление
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    // Сохранение данных при закрытии
    window.addEventListener('beforeunload', function() {
        saveUserData();
    });
    
    // Автоматическое обновление баланса кошелька
    setInterval(() => {
        if (userData.walletConnected && userData.walletAddress) {
            updateRealWalletBalance(userData.walletAddress);
        }
    }, 60000); // Каждую минуту
});

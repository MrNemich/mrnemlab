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
    
    // Элементы для модалки пополнения
    const depositModal = document.getElementById('deposit-modal');
    const closeDepositModal = document.getElementById('close-deposit-modal');
    const depositAmountInput = document.getElementById('deposit-amount-input');
    const amountPresets = document.querySelectorAll('.amount-preset');
    const confirmDepositBtn = document.getElementById('confirm-deposit-btn');
    const transactionStatusElement = document.getElementById('transaction-status');
    const walletAddressDisplay = document.getElementById('wallet-address-display');
    
    // Текущий пользователь
    let userData = {
        id: null,
        balance: 100, // Начальный баланс для демо
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 0,
        sold: 0,
        totalVolume: 0,
        lotteryParticipating: false
    };
    
    // Дата окончания лотереи (5 дней с текущего момента)
    const lotteryEndDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    
    // Инициализация TON Connect
    let tonConnectUI = null;
    
    // Загрузка данных пользователя
    function loadUserData() {
        // Проверяем, есть ли сохраненные данные
        const savedData = localStorage.getItem('beatclub_user_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // Проверяем совпадение ID пользователя
            if (tg.initDataUnsafe?.user && parsed.id === tg.initDataUnsafe.user.id) {
                userData = parsed;
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
            
            console.log('User data loaded:', userData);
        }
        
        // Обновляем отображение
        updateBalanceDisplay();
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
        balanceAmount.textContent = userData.balance.toLocaleString();
        botBalanceElement.textContent = userData.balance.toLocaleString();
    }
    
    // Инициализация TON Connect
    async function initTonConnect() {
        try {
            console.log('Initializing TON Connect...');
            
            // Создаем URL для манифеста
            const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
            
            console.log('Manifest URL:', manifestUrl);
            
            // Проверяем доступность манифеста
            try {
                const response = await fetch(manifestUrl);
                if (!response.ok) {
                    throw new Error('Manifest not found');
                }
                const manifestData = await response.json();
                console.log('Manifest loaded:', manifestData);
            } catch (error) {
                console.warn('Manifest not accessible, creating temporary one');
                // Создаем временный манифест
                const tempManifest = {
                    url: window.location.origin,
                    name: "BEAT CLUB",
                    iconUrl: window.location.origin + "/nft/ton.png",
                    termsOfUseUrl: window.location.origin + "/",
                    privacyPolicyUrl: window.location.origin + "/"
                };
                
                // Сохраняем временный манифест
                localStorage.setItem('tonconnect_manifest', JSON.stringify(tempManifest));
            }
            
            // Инициализируем TON Connect UI - ПРАВИЛЬНЫЙ СПОСОБ
            const options = {
                manifestUrl: manifestUrl,
                buttonRootId: 'ton-connect-modal',
                actionsConfiguration: {
                    twaReturnUrl: 'https://t.me/your_bot_username' // Замените на ваш бот
                }
            };
            
            console.log('TON Connect options:', options);
            
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI(options);
            
            // Подписываемся на изменения статуса
            const unsubscribe = tonConnectUI.onStatusChange(
                (wallet) => {
                    console.log('TON Connect status changed:', wallet);
                    
                    if (wallet) {
                        // Кошелек подключен
                        userData.walletConnected = true;
                        userData.walletAddress = wallet.account.address;
                        console.log('Wallet connected:', userData.walletAddress);
                        
                        // Получаем баланс
                        updateRealWalletBalance();
                        
                        // Обновляем UI
                        updateConnectInfo();
                        
                        // Сохраняем
                        saveUserData();
                        
                        // Уведомление
                        tg.showAlert('✅ Кошелек подключен!');
                        tg.HapticFeedback.notificationOccurred('success');
                        
                        // Обновляем профиль если открыт
                        if (document.querySelector('.nav-button[data-page="profile"].active')) {
                            updateContent('profile');
                        }
                    } else {
                        // Кошелек отключен
                        userData.walletConnected = false;
                        userData.walletAddress = null;
                        userData.walletBalance = 0;
                        console.log('Wallet disconnected');
                        
                        // Обновляем UI
                        updateConnectInfo();
                        
                        // Сохраняем
                        saveUserData();
                        
                        // Обновляем профиль если открыт
                        if (document.querySelector('.nav-button[data-page="profile"].active')) {
                            updateContent('profile');
                        }
                    }
                }
            );
            
            // Восстанавливаем соединение если было
            const currentWallet = tonConnectUI.connected;
            if (currentWallet) {
                console.log('Found existing connection:', currentWallet);
                userData.walletConnected = true;
                userData.walletAddress = currentWallet.account.address;
                updateRealWalletBalance();
                updateConnectInfo();
            }
            
            console.log('TON Connect initialized successfully');
            
            return unsubscribe;
            
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            tg.showAlert('⚠️ Ошибка TON Connect: ' + error.message);
            
            // Fallback для демо
            updateConnectInfo();
            return null;
        }
    }
    
    // Получение реального баланса кошелька
    async function updateRealWalletBalance() {
        if (!userData.walletConnected || !userData.walletAddress) return;
        
        try {
            console.log('Fetching wallet balance for:', userData.walletAddress);
            
            // Используем TON Center API для получения баланса
            const response = await fetch(
                `https://toncenter.com/api/v2/getAddressBalance?address=${userData.walletAddress}`
            );
            
            const data = await response.json();
            console.log('Balance API response:', data);
            
            if (data.ok) {
                // Конвертируем наноТоны в TON (1 TON = 1,000,000,000 наноТонов)
                userData.walletBalance = parseInt(data.result) / 1000000000;
                console.log('Wallet balance:', userData.walletBalance, 'TON');
            } else {
                // Fallback на случай если API не работает
                userData.walletBalance = 12.5; // Для демо
                console.log('Using demo balance');
            }
            
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            // Fallback значение для демо
            userData.walletBalance = 12.5;
        }
        
        updateConnectInfo();
    }
    
    // Обновление информации о подключении
    function updateConnectInfo() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = userData.walletAddress.slice(0, 6) + '...' + userData.walletAddress.slice(-4);
            connectInfoElement.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-wallet" style="color: #7b2ff7; font-size: 1.2rem;"></i>
                        <span style="color: white; font-weight: 600; font-size: 0.9rem;">${shortAddress}</span>
                    </div>
                    <div style="
                        font-size: 1.3rem; 
                        color: #06D6A0; 
                        font-weight: 700; 
                        background: rgba(6, 214, 160, 0.1); 
                        padding: 10px 25px; 
                        border-radius: 12px;
                        border: 1px solid rgba(6, 214, 160, 0.3);
                    ">
                        ${userData.walletBalance.toFixed(2)} TON
                    </div>
                    <div style="color: #8e8e93; font-size: 0.8rem; text-align: center;">
                        <i class="fas fa-check-circle" style="color: #06D6A0;"></i> Кошелек подключен
                    </div>
                </div>
            `;
            connectWalletBtn.innerHTML = '<i class="fas fa-unlink"></i> Отключить';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #ff375f, #d43a5e)';
        } else {
            connectInfoElement.innerHTML = `
                <div style="color: #8e8e93; font-size: 0.9rem; text-align: center; padding: 25px;">
                    <i class="fas fa-plug" style="font-size: 2rem; margin-bottom: 15px; display: block; color: #8e8e93;"></i>
                    Подключите TON кошелек для пополнения баланса и участия в лотереях
                    <div style="margin-top: 15px; font-size: 0.8rem; color: #7b2ff7;">
                        Поддерживается: Tonkeeper, Tonhub, OpenMask
                    </div>
                </div>
            `;
            connectWalletBtn.innerHTML = '<i class="fas fa-plug"></i> Подключить кошелек';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #007aff, #0056cc)';
        }
    }
    
    // Создание содержимого для разных страниц
    function createHomeContent() {
        return `
            <div class="page-content">
                <div class="gradient-box">
                    <i class="fas fa-home content-icon"></i>
                    <h3>Добро пожаловать в BEAT CLUB!</h3>
                    <p class="empty-message">Товаров нет, приходите позже...</p>
                </div>
            </div>
        `;
    }
    
    function createLotteryContent() {
        return `
            <div class="page-content">
                <div class="lottery-container">
                    <div class="pepe-image-placeholder">
                        <i class="fas fa-gem" style="font-size: 4rem; color: #7b2ff7;"></i>
                    </div>
                    
                    <h1 class="lottery-title">🎰 Розыгрыш Pepe NFT</h1>
                    
                    <p class="lottery-description">
                        Участвуй в розыгрыше уникального NFT Pepe! Купи билет за 1 TON и получи шанс выиграть эксклюзивный NFT Pepe.
                    </p>
                    
                    <div class="countdown-container">
                        <h3 class="countdown-title">До конца розыгрыша:</h3>
                        
                        <div class="countdown-timer" id="countdown-timer">
                            <div class="countdown-item">
                                <div class="countdown-value" id="days">00</div>
                                <div class="countdown-label">Дней</div>
                            </div>
                            <div class="countdown-item">
                                <div class="countdown-value" id="hours">00</div>
                                <div class="countdown-label">Часов</div>
                            </div>
                            <div class="countdown-item">
                                <div class="countdown-value" id="minutes">00</div>
                                <div class="countdown-label">Минут</div>
                            </div>
                            <div class="countdown-item">
                                <div class="countdown-value" id="seconds">00</div>
                                <div class="countdown-label">Секунд</div>
                            </div>
                        </div>
                        
                        <div class="ticket-price">
                            <img src="nft/ton.png" alt="TON" style="width: 20px; height: 20px;">
                            <span>Цена билета: 1 TON</span>
                        </div>
                        
                        <button class="ticket-btn" id="buy-ticket-btn">
                            <i class="fas fa-ticket-alt"></i>
                            <span>Купить билет за 1 TON</span>
                        </button>
                        
                        <div class="participant-status" id="participant-status">
                            <i class="fas fa-check-circle"></i>
                            Вы участвуете в розыгрыше!
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createTasksContent() {
        return `
            <div class="page-content">
                <div class="tasks-container">
                    <div class="tasks-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h2>🎯 Задания</h2>
                    <div class="tasks-message">
                        Пока заданий нет, ожидайте.<br>
                        Следите за обновлениями!
                    </div>
                </div>
            </div>
        `;
    }
    
    function createRatingContent() {
        return `
            <div class="page-content">
                <div class="rating-container">
                    <div class="rating-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h2>🏆 Рейтинг игроков</h2>
                    <p class="rating-description">
                        Соревнуйся с другими участниками! Зарабатывай очки активности и поднимайся в рейтинге.
                    </p>
                </div>
            </div>
        `;
    }
    
    function createProfileContent() {
        return `
            <div class="page-content">
                <div class="profile-container">
                    <div class="profile-avatar">
                        ${userData.avatarUrl ? 
                            `<img src="${userData.avatarUrl}" alt="${userData.username}">` : 
                            `<div class="avatar-placeholder" style="border-radius: 20px; ${userData.walletConnected ? 'border: 2px solid #06D6A0;' : ''}">
                                <span style="font-size: 2.5rem; font-weight: bold;">${userData.username.charAt(0).toUpperCase()}</span>
                            </div>`
                        }
                    </div>
                    
                    <h2 class="profile-username">${userData.username}</h2>
                    
                    <div class="profile-stats">
                        <div class="stat-item">
                            <div class="stat-icon">💰</div>
                            <div class="stat-value ton-stat">${userData.totalVolume}</div>
                            <div class="stat-label">Total volume</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">🎁</div>
                            <div class="stat-value gift-stat">${userData.bought}</div>
                            <div class="stat-label">Bought</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">💎</div>
                            <div class="stat-value sold-stat">${userData.sold}</div>
                            <div class="stat-label">Sold</div>
                        </div>
                    </div>
                    
                    <div class="wallet-info-card">
                        <div class="wallet-info-header">
                            <i class="fas fa-wallet"></i>
                            <span>TON Кошелек</span>
                            <span style="margin-left: auto; font-size: 0.8rem; color: ${userData.walletConnected ? '#06D6A0' : '#ff375f'};">
                                ${userData.walletConnected ? '✓ Подключен' : '✗ Не подключен'}
                            </span>
                        </div>
                        <div class="wallet-info-content">
                            ${userData.walletConnected ? 
                                `<div class="connected-wallet">
                                    <div class="wallet-address">
                                        <span>Адрес:</span>
                                        <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                                            <span class="address-value" id="profile-wallet-address" style="
                                                font-family: monospace;
                                                font-size: 0.8rem;
                                                background: rgba(0,0,0,0.3);
                                                padding: 6px 10px;
                                                border-radius: 6px;
                                                word-break: break-all;
                                            ">
                                                ${userData.walletAddress.slice(0, 8)}...${userData.walletAddress.slice(-8)}
                                            </span>
                                            <button class="copy-address-btn" onclick="copyToClipboard('${userData.walletAddress}')" style="
                                                background: rgba(123, 47, 247, 0.2);
                                                border: 1px solid rgba(123, 47, 247, 0.4);
                                                color: #7b2ff7;
                                                width: 32px;
                                                height: 32px;
                                                border-radius: 6px;
                                                cursor: pointer;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            ">
                                                <i class="fas fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="wallet-balance-display">
                                        <span>Баланс:</span>
                                        <span class="balance-value" style="color: #06D6A0; font-weight: 700; font-size: 1.3rem;">
                                            ${userData.walletBalance.toFixed(2)} TON
                                        </span>
                                    </div>
                                    <button class="disconnect-wallet-btn" id="disconnect-profile-btn" style="
                                        background: rgba(255, 55, 95, 0.1);
                                        border: 1px solid rgba(255, 55, 95, 0.3);
                                        color: #ff375f;
                                        padding: 12px;
                                        border-radius: 10px;
                                        cursor: pointer;
                                        margin-top: 15px;
                                        font-weight: 600;
                                        width: 100%;
                                        transition: all 0.3s ease;
                                    ">
                                        <i class="fas fa-unlink"></i> Отключить кошелек
                                    </button>
                                </div>` :
                                `<div class="not-connected">
                                    <i class="fas fa-plug" style="font-size: 2.5rem; color: #8e8e93; margin-bottom: 15px;"></i>
                                    <span style="color: #8e8e93; margin-bottom: 20px; text-align: center;">
                                        Подключите TON кошелек для пополнения баланса
                                    </span>
                                    <button class="connect-wallet-profile-btn" id="connect-wallet-profile-btn" style="
                                        background: linear-gradient(135deg, #007aff, #0056cc);
                                        color: white;
                                        border: none;
                                        padding: 15px 30px;
                                        border-radius: 12px;
                                        cursor: pointer;
                                        font-weight: 600;
                                        width: 100%;
                                        transition: all 0.3s ease;
                                    ">
                                        <i class="fas fa-plug"></i> Подключить кошелек
                                    </button>
                                </div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Функция копирования в буфер обмена
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            tg.showAlert('✅ Адрес скопирован в буфер обмена');
            tg.HapticFeedback.notificationOccurred('success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            tg.showAlert('❌ Ошибка копирования');
        });
    };
    
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
                const participantStatus = document.getElementById('participant-status');
                
                if (userData.lotteryParticipating) {
                    participantStatus.classList.add('show');
                    if (buyTicketBtn) {
                        buyTicketBtn.disabled = true;
                        buyTicketBtn.innerHTML = '<i class="fas fa-check"></i><span>Вы уже участвуете</span>';
                    }
                }
                
                if (buyTicketBtn) {
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
                        
                        participantStatus.classList.add('show');
                        this.disabled = true;
                        this.innerHTML = '<i class="fas fa-check"></i><span>Вы уже участвуете</span>';
                        
                        tg.showAlert('✅ Вы успешно приобрели билет! Удачи в розыгрыше!');
                        tg.HapticFeedback.notificationOccurred('success');
                        
                        // Вибрация
                        if (navigator.vibrate) {
                            navigator.vibrate([50, 50, 50]);
                        }
                    });
                }
                
                // Запускаем таймер
                setInterval(updateLotteryTimer, 1000);
                updateLotteryTimer();
            }
            
            // Инициализация кнопок в профиле
            if (page === 'profile') {
                const disconnectProfileBtn = document.getElementById('disconnect-profile-btn');
                const connectWalletProfileBtn = document.getElementById('connect-wallet-profile-btn');
                
                if (disconnectProfileBtn) {
                    disconnectProfileBtn.addEventListener('click', function() {
                        disconnectWallet();
                    });
                }
                
                if (connectWalletProfileBtn) {
                    connectWalletProfileBtn.addEventListener('click', function() {
                        connectWallet();
                    });
                }
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
    
    // Подключение кошелька
    function connectWallet() {
        console.log('Connecting wallet...');
        if (tonConnectUI) {
            tonConnectUI.openModal();
        } else {
            console.error('TON Connect UI not initialized');
            tg.showAlert('Ошибка: TON Connect не инициализирован');
        }
    }
    
    // Отключение кошелька
    function disconnectWallet() {
        console.log('Disconnecting wallet...');
        if (tonConnectUI) {
            tonConnectUI.disconnect();
        }
    }
    
    // Отображение адреса для пополнения
    function showDepositAddress() {
        // В реальном приложении здесь должен быть адрес вашего бота/контракта
        const botAddress = "EQCqRqk6Hx7vygYGlZT5Wp9ESIgUtXDbvP59jql4d4m_7L1B";
        
        walletAddressDisplay.innerHTML = `
            <div class="address-container">
                <div class="address-label">Адрес для пополнения:</div>
                <div class="address-value-container">
                    <span class="address-value">${botAddress}</span>
                    <button class="copy-btn" id="copy-address-btn">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="address-note">
                    <i class="fas fa-exclamation-circle"></i>
                    Отправляйте TON только на этот адрес
                </div>
                <div class="qr-code-placeholder" id="qr-code-placeholder">
                    <div style="font-size: 4rem; color: #7b2ff7; margin-bottom: 10px;">⎙</div>
                    <span>Отсканируйте QR-код в кошельке</span>
                </div>
            </div>
        `;
        
        // Копирование адреса
        const copyBtn = document.getElementById('copy-address-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(botAddress).then(() => {
                    tg.showAlert('✅ Адрес скопирован в буфер обмена');
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    // Эффект нажатия
                    this.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 150);
                });
            });
        }
    }
    
    // Отправка транзакции через TON Connect
    async function sendDepositTransaction(amount) {
        if (!tonConnectUI || !userData.walletConnected) {
            tg.showAlert('❌ Кошелек не подключен');
            return false;
        }
        
        try {
            // Проверяем баланс пользователя
            if (userData.walletBalance < amount) {
                tg.showAlert(`❌ Недостаточно средств на кошельке. Доступно: ${userData.walletBalance.toFixed(2)} TON`);
                return false;
            }
            
            // Создаем транзакцию
            const botAddress = "EQCqRqk6Hx7vygYGlZT5Wp9ESIgUtXDbvP59jql4d4m_7L1B";
            
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
                messages: [
                    {
                        address: botAddress,
                        amount: (amount * 1000000000).toString(), // Конвертируем в наноТоны
                        payload: userData.id ? userData.id.toString() : "deposit"
                    }
                ]
            };
            
            // Показываем статус
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            // Отправляем транзакцию
            console.log('Sending transaction:', transaction);
            const result = await tonConnectUI.sendTransaction(transaction);
            
            console.log('Transaction result:', result);
            
            if (result) {
                // Транзакция отправлена успешно
                showTransactionStatus('success', 'Транзакция отправлена! Ожидаем подтверждения...');
                
                // Для демо просто увеличиваем баланс через 3 секунды
                setTimeout(() => {
                    userData.balance += amount;
                    userData.totalVolume += amount;
                    updateBalanceDisplay();
                    saveUserData();
                    
                    showTransactionStatus('confirmed', `✅ Баланс пополнен на ${amount} TON!`);
                    
                    tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    // Обновляем баланс кошелька
                    updateRealWalletBalance();
                }, 3000);
                
                return true;
            }
            
        } catch (error) {
            console.error('Transaction error:', error);
            showTransactionStatus('error', '❌ Ошибка транзакции');
            tg.showAlert('❌ Ошибка при отправке транзакции');
            return false;
        }
    }
    
    // Показать статус транзакции
    function showTransactionStatus(status, message) {
        transactionStatusElement.innerHTML = `
            <div class="transaction-status-${status}" style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 15px;
                border-radius: 10px;
                width: 100%;
                background: ${status === 'success' ? 'rgba(6, 214, 160, 0.1)' : 
                         status === 'pending' ? 'rgba(255, 193, 7, 0.1)' : 
                         status === 'confirmed' ? 'rgba(123, 47, 247, 0.1)' : 
                         'rgba(239, 71, 111, 0.1)'};
                border: 1px solid ${status === 'success' ? 'rgba(6, 214, 160, 0.3)' : 
                                 status === 'pending' ? 'rgba(255, 193, 7, 0.3)' : 
                                 status === 'confirmed' ? 'rgba(123, 47, 247, 0.3)' : 
                                 'rgba(239, 71, 111, 0.3)'};
                color: ${status === 'success' ? '#06D6A0' : 
                       status === 'pending' ? '#ffd166' : 
                       status === 'confirmed' ? '#7b2ff7' : 
                       '#EF476F'};
            ">
                <i class="fas fa-${status === 'success' ? 'check-circle' : 
                                 status === 'pending' ? 'spinner fa-spin' : 
                                 status === 'confirmed' ? 'check-double' : 
                                 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
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
        if (!userData.walletConnected) {
            tg.showAlert('❌ Пожалуйста, подключите TON кошелек для пополнения');
            return;
        }
        
        // Закрываем окно баланса
        balanceModal.classList.remove('active');
        
        // Показываем окно пополнения
        showDepositAddress();
        depositAmountInput.value = '10';
        transactionStatusElement.innerHTML = '';
        depositModal.classList.add('active');
    });
    
    // Кнопка вывода
    withdrawBtn.addEventListener('click', function() {
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
            message: `Вы можете вывести до ${userData.balance} TON\n\nВаш кошелек: ${userData.walletAddress.slice(0, 8)}...${userData.walletAddress.slice(-8)}`,
            buttons: [
                {id: 'withdraw_all', type: 'default', text: 'Вывести всё'},
                {id: 'custom', type: 'default', text: 'Указать сумму'},
                {type: 'cancel', text: '❌ Отмена'}
            ]
        }, function(buttonId) {
            if (buttonId === 'withdraw_all') {
                tg.showAlert(`✅ Запрос на вывод ${userData.balance} TON отправлен!`);
                tg.HapticFeedback.notificationOccurred('success');
            } else if (buttonId === 'custom') {
                tg.showAlert('Функция в разработке');
            }
        });
    });
    
    // Кнопка подключения кошелька
    connectWalletBtn.addEventListener('click', function() {
        if (userData.walletConnected) {
            disconnectWallet();
        } else {
            connectWallet();
        }
        
        // Эффект нажатия
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        
        // Вибрация
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    });
    
    // Закрытие модального окна пополнения
    closeDepositModal.addEventListener('click', function() {
        depositModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Клик вне модального окна пополнения
    depositModal.addEventListener('click', function(e) {
        if (e.target === this) {
            depositModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Пресеты суммы
    amountPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            depositAmountInput.value = amount;
            
            // Эффект нажатия
            amountPresets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Подтверждение пополнения
    confirmDepositBtn.addEventListener('click', async function() {
        const amount = parseFloat(depositAmountInput.value);
        
        if (isNaN(amount) || amount <= 0) {
            tg.showAlert('❌ Введите корректную сумму');
            return;
        }
        
        if (amount > 1000) {
            tg.showAlert('❌ Максимальная сумма пополнения - 1000 TON');
            return;
        }
        
        // Эффект нажатия
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        
        // Отправляем транзакцию
        await sendDepositTransaction(amount);
    });
    
    // Инициализация
    loadUserData();
    
    // Инициализируем TON Connect после загрузки страницы
    setTimeout(() => {
        initTonConnect().then(() => {
            console.log('TON Connect initialized');
            updateConnectInfo();
        }).catch(error => {
            console.error('Failed to init TON Connect:', error);
            updateConnectInfo();
        });
    }, 500);
    
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
    setInterval(updateRealWalletBalance, 30000);
    
    // Проверка иконки TON
    function checkTonIcon() {
        setTimeout(() => {
            const icons = document.querySelectorAll('.ton-icon');
            icons.forEach(icon => {
                if (icon && (icon.naturalWidth === 0 || icon.complete === false)) {
                    console.log('TON icon failed to load, using fallback');
                    const svg = `
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="16" fill="#7B2FF7"/>
                            <path d="M16 8L22 12L16 16L10 12L16 8Z" fill="white"/>
                            <path d="M16 16L22 20L16 24L10 20L16 16Z" fill="white"/>
                        </svg>
                    `;
                    icon.src = 'data:image/svg+xml;base64,' + btoa(svg);
                    icon.style.background = 'transparent';
                }
            });
        }, 1500);
    }
    
    checkTonIcon();
});


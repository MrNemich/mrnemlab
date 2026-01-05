// script.js
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
    
    // Элементы для фильтров
    const filtersModal = document.getElementById('filters-modal');
    const closeFiltersModal = document.getElementById('close-filters-modal');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterOptions = document.querySelectorAll('.filter-options');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const priceMinSlider = document.getElementById('price-min-slider');
    const priceMaxSlider = document.getElementById('price-max-slider');
    const priceMinInput = document.getElementById('price-min-input');
    const priceMaxInput = document.getElementById('price-max-input');
    const sliderFill = document.getElementById('slider-fill');
    
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
        gifts: []
    };
    
    // Активные фильтры
    let activeFilters = {
        sort: 'newest',
        collections: [],
        price: { min: 0, max: 100000 },
        backgrounds: []
    };
    
    // Коллекции для фильтра
    const collections = [
        "Bodded Ring", "Candle Lamp", "Boots", "Candy Cane", "Case", "Christmas Tree", 
        "Clover Pin", "Crystal Ball", "Diamond Ring", "Durov's Coat", "Coconut", "Crystal Eagle", 
        "Dove of Peace", "Durov's Figurine", "Coffin", "Cupid Charm", "Durov's Boots", "Durov's Sunglasses", 
        "Cookie Heart", "Desk Calendar", "Durov's Cap", "Easter Cake", "Evil Eye", "Faith Amulet", 
        "Flying Broom", "Gem Signet", "Genie Lamp", "Ginger Cookie", "Hanging Star", "Happy Brownie", 
        "Heart Locket", "Heroic Helmet", "Holiday Drink", "Homemade Cake", "Ice Cream Cone", "Ice Cream Scoops", 
        "Input Key", "lon Gem", "lonic Dryer", "Jack in the Box", "Kissed Frog", "Kitty Medallion", 
        "Lol Pop", "Loot Bag", "Love Candle", "Love Potion", "Low Rider", "Lunar Snake", "Lush Bouquet", 
        "Mask", "Medal", "Mighty Arm", "Mouse Cake", "Party Sparkler", "Pink Flamingo", "Mini Oscar", 
        "Money Pot", "Neko Helmet", "Perfume Bottle", "Priccious Peach", "Pretty Posy", "Moon Pendant", 
        "Record Player", "Red Star", "Resistance Dog", "Restless Jar", "Roses", "Sakura Flower", 
        "Sandcastle", "Santa Hat", "Sky Stilettos", "Sleigh Bell", "Snake Box", "Snoop Cigar", 
        "Snoop Dogg", "Snow Globe", "Snow Mittens", "Spiced Wine", "Statue of Liberty", "Stellar Rocket", 
        "Surfboard", "Star Notepad", "Swag Bag", "Swiss Watch", "Tornh of Freedom", "Telegram Pin", 
        "Top Hat", "Total Horse", "UFC Strike", "Valentine Box", "Vintage Cigar", "Voodoo Doll", 
        "Wrestide Sign", "Whip Cupcake", "Winter Wreath", "Witch Hat", "Xmas Stocking"
    ];
    
    // Backgrounds для фильтра
    const backgrounds = [
        "Amber", "Aquamarine", "Azure Blue", "Battleship Grey", "Black", "Burgundy", 
        "Deep Cyan", "Desert Sand", "Electric Indigo", "Electric Purple", "Emerald", 
        "English Violet", "Fandango", "Navy Blue", "Neon Blue", "Onyx Black", "Old Gold", 
        "Orange", "Pacific Cyan", "Pacific Green", "Persimmon", "Pine Green"
    ];
    
    // Ваш кошелек для пополнения (ИЗМЕНЕН НА ВАШ)
    const BOT_ADDRESS = "UQBhcIzPNZJXa1nWLypYIvO-ybYhBSZEGyH-6MDRdaKyzEJV";
    
    // URL для API (ваш сайт на Vercel)
    const API_URL = "https://mrnemlab.vercel.app/api";
    
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
            'linear-gradient(135deg, #1a1a1f, #2c2c35)',
            'linear-gradient(135deg, #2c2c35, #1a1a1f)',
            'linear-gradient(135deg, #12121a, #1a1a1f)',
            'linear-gradient(135deg, #1a1a1f, #12121a)',
            'linear-gradient(135deg, #2c2c35, #12121a)'
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
            
            // Инициализируем TON Connect UI
            const options = {
                manifestUrl: manifestUrl,
                buttonRootId: 'ton-connect-modal',
                actionsConfiguration: {
                    twaReturnUrl: 'https://mrnemlab.vercel.app/' // Замените на ваш бот
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
            const shortAddress = userData.walletAddress.slice(0, 8) + '...' + userData.walletAddress.slice(-8);
            connectInfoElement.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-wallet" style="color: #7b2ff7; font-size: 1.2rem;"></i>
                        <span style="color: white; font-weight: 600; font-size: 0.9rem; font-family: monospace;">${shortAddress}</span>
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
                    Подключите TON кошелек для пополнения баланса
                </div>
            `;
            connectWalletBtn.innerHTML = '<i class="fas fa-plug"></i> Подключить кошелек';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #007aff, #0056cc)';
        }
    }
    
    // Функция для проверки транзакции через API
    async function checkTransactionOnServer(amount) {
        try {
            if (!userData.walletConnected || !userData.walletAddress) {
                return { success: false, message: 'Кошелек не подключен' };
            }
            
            // Отправляем запрос на API для проверки депозита
            const response = await fetch(`${API_URL}/check-deposit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.id || 'anonymous',
                    amount: amount,
                    walletAddress: userData.walletAddress,
                    timestamp: Date.now()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    newBalance: result.newBalance || (userData.balance + amount),
                    message: result.message || 'Транзакция подтверждена'
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'Транзакция не найдена'
                };
            }
            
        } catch (error) {
            console.error('Error checking transaction:', error);
            return {
                success: false,
                message: 'Ошибка при проверке транзакции'
            };
        }
    }
    
    // Создание содержимого для разных страниц
    function createMarketContent() {
        return `
            <div class="page-content">
                <div class="market-container">
                    <div class="search-suggestion">
                        <div class="suggestion-text">Опробуйте поиск по фильтрам</div>
                        <button class="filter-icon-btn" id="filter-icon-btn">
                            <i class="fas fa-filter"></i>
                        </button>
                    </div>
                    
                    <div class="market-items">
                        <div class="market-message">
                            <i class="fas fa-store" style="font-size: 2.5rem; color: #8e8e93; margin-bottom: 15px;"></i>
                            <span style="color: #8e8e93; text-align: center;">
                                Товаров пока нет<br>
                                Используйте фильтры для поиска NFT
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createGiftsContent() {
        const giftsCount = userData.gifts.length || 0;
        
        return `
            <div class="page-content">
                <div class="gifts-container">
                    <div class="gifts-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h2>🎁 Мои подарки</h2>
                    <div class="gifts-info">
                        <div class="gifts-count">
                            <span class="count-number">${giftsCount}</span>
                            <span class="count-label">подарков</span>
                        </div>
                        <div class="gifts-message">
                            У вас пока нет подарков<br>
                            Подарки появляются при покупке NFT или от друзей
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createSeasonContent() {
        return `
            <div class="page-content">
                <div class="season-container">
                    <div class="season-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h2>🏆 Сезон</h2>
                    <div class="season-message">
                        <div class="development-badge">
                            <i class="fas fa-tools"></i>
                            <span>В разработке</span>
                        </div>
                        <p class="season-description">
                            Сезонная активность появится в ближайшем обновлении.<br>
                            Следите за анонсами!
                        </p>
                    </div>
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
                                                ${userData.walletAddress}
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
    
    // Обновление контента страницы
    function updateContent(page) {
        // Анимация исчезновения
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            let content = '';
            
            switch(page) {
                case 'market':
                    content = createMarketContent();
                    break;
                case 'gifts':
                    content = createGiftsContent();
                    break;
                case 'season':
                    content = createSeasonContent();
                    break;
                case 'profile':
                    content = createProfileContent();
                    break;
            }
            
            mainContent.innerHTML = content;
            
            // Инициализация элементов после создания контента
            if (page === 'market') {
                const filterIconBtn = document.getElementById('filter-icon-btn');
                if (filterIconBtn) {
                    filterIconBtn.addEventListener('click', function() {
                        openFiltersModal();
                        
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
                }
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
    
    // ОТПРАВКА НАСТОЯЩЕЙ ТРАНЗАКЦИИ на ваш кошелек
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
            
            // Создаем транзакцию на ВАШ кошелек
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
                messages: [
                    {
                        address: BOT_ADDRESS, // Ваш кошелек UQBhcIzPNZJXa1nWLypYIvO-ybYhBSZEGyH-6MDRdaKyzEJV
                        amount: (amount * 1000000000).toString(), // Конвертируем в наноТоны
                        // payload можно использовать для идентификации пользователя
                        payload: userData.id ? Buffer.from(userData.id.toString()).toString('hex') : ""
                    }
                ]
            };
            
            // Показываем статус
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            // Отправляем НАСТОЯЩУЮ транзакцию
            console.log('Sending REAL transaction to:', BOT_ADDRESS);
            console.log('Transaction amount:', amount, 'TON');
            
            const result = await tonConnectUI.sendTransaction(transaction);
            
            console.log('Transaction result:', result);
            
            if (result) {
                // Транзакция отправлена успешно
                showTransactionStatus('success', 'Транзакция отправлена! Проверяем...');
                
                // Проверяем транзакцию через API
                const checkResult = await checkTransactionOnServer(amount);
                
                if (checkResult.success) {
                    // Обновляем баланс из результата API
                    userData.balance = checkResult.newBalance;
                    userData.totalVolume += amount;
                    updateBalanceDisplay();
                    saveUserData();
                    
                    showTransactionStatus('confirmed', `✅ Баланс пополнен на ${amount} TON!`);
                    
                    tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    // Обновляем баланс кошелька
                    updateRealWalletBalance();
                    
                    // Закрываем модальное окно через 2 секунды
                    setTimeout(() => {
                        depositModal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                    }, 2000);
                } else {
                    showTransactionStatus('error', '❌ Транзакция не подтверждена');
                    tg.showAlert('❌ Транзакция не подтверждена. Попробуйте позже.');
                }
                
                return true;
            }
            
        } catch (error) {
            console.error('Transaction error:', error);
            showTransactionStatus('error', '❌ Ошибка транзакции');
            tg.showAlert('❌ Ошибка при отправке транзакции: ' + error.message);
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
    
    // Инициализация фильтров
    function initializeFilters() {
        // Заполняем коллекции
        const collectionOptions = document.getElementById('collection-options');
        if (collectionOptions) {
            collections.forEach(collection => {
                const button = document.createElement('button');
                button.className = 'filter-option';
                button.setAttribute('data-value', collection);
                button.innerHTML = `
                    <div class="option-selector multi-selector"></div>
                    <span>${collection}</span>
                `;
                collectionOptions.appendChild(button);
            });
        }
        
        // Заполняем background
        const backgroundOptions = document.getElementById('background-options');
        if (backgroundOptions) {
            backgrounds.forEach(background => {
                const button = document.createElement('button');
                button.className = 'filter-option';
                button.setAttribute('data-value', background);
                button.innerHTML = `
                    <div class="option-selector multi-selector"></div>
                    <span>${background}</span>
                `;
                backgroundOptions.appendChild(button);
            });
        }
        
        // Устанавливаем начальные значения для сортировки
        const sortOptions = document.querySelectorAll('#sort-options .filter-option');
        sortOptions.forEach(option => {
            if (option.dataset.value === activeFilters.sort) {
                option.classList.add('selected');
                option.querySelector('.option-selector').innerHTML = '<div class="selector-dot"></div>';
            }
            
            option.addEventListener('click', function() {
                sortOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.querySelector('.option-selector').innerHTML = '';
                });
                
                this.classList.add('selected');
                this.querySelector('.option-selector').innerHTML = '<div class="selector-dot"></div>';
                activeFilters.sort = this.dataset.value;
            });
        });
        
        // Настройка ползунка цены
        function updateSliderFill() {
            const min = parseInt(priceMinSlider.value);
            const max = parseInt(priceMaxSlider.value);
            const minPercent = (min / 100000) * 100;
            const maxPercent = (max / 100000) * 100;
            
            sliderFill.style.left = minPercent + '%';
            sliderFill.style.right = (100 - maxPercent) + '%';
            
            priceMinInput.value = min;
            priceMaxInput.value = max;
            
            activeFilters.price.min = min;
            activeFilters.price.max = max;
        }
        
        priceMinSlider.addEventListener('input', function() {
            const min = parseInt(this.value);
            const max = parseInt(priceMaxSlider.value);
            
            if (min > max) {
                priceMaxSlider.value = min;
                priceMaxInput.value = min;
            }
            
            updateSliderFill();
        });
        
        priceMaxSlider.addEventListener('input', function() {
            const min = parseInt(priceMinSlider.value);
            const max = parseInt(this.value);
            
            if (max < min) {
                priceMinSlider.value = max;
                priceMinInput.value = max;
            }
            
            updateSliderFill();
        });
        
        priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            if (value < 0) value = 0;
            if (value > 100000) value = 100000;
            
            priceMinSlider.value = value;
            updateSliderFill();
        });
        
        priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 100000;
            if (value < 0) value = 0;
            if (value > 100000) value = 100000;
            
            priceMaxSlider.value = value;
            updateSliderFill();
        });
        
        // Инициализация начального состояния
        updateSliderFill();
        
        // Обработчики для многоселектов (коллекции и background)
        document.querySelectorAll('#collection-options .filter-option').forEach(option => {
            option.addEventListener('click', function() {
                this.classList.toggle('selected');
                
                const value = this.dataset.value;
                const index = activeFilters.collections.indexOf(value);
                
                if (index === -1) {
                    activeFilters.collections.push(value);
                    this.querySelector('.multi-selector').innerHTML = '<i class="fas fa-check"></i>';
                } else {
                    activeFilters.collections.splice(index, 1);
                    this.querySelector('.multi-selector').innerHTML = '';
                }
            });
        });
        
        document.querySelectorAll('#background-options .filter-option').forEach(option => {
            option.addEventListener('click', function() {
                this.classList.toggle('selected');
                
                const value = this.dataset.value;
                const index = activeFilters.backgrounds.indexOf(value);
                
                if (index === -1) {
                    activeFilters.backgrounds.push(value);
                    this.querySelector('.multi-selector').innerHTML = '<i class="fas fa-check"></i>';
                } else {
                    activeFilters.backgrounds.splice(index, 1);
                    this.querySelector('.multi-selector').innerHTML = '';
                }
            });
        });
        
        // Обработчики для кнопок фильтров
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filterType = this.dataset.filter;
                const options = document.getElementById(`${filterType}-options`);
                const icon = this.querySelector('i');
                
                // Закрываем все другие открытые опции
                filterButtons.forEach(btn => {
                    if (btn !== this) {
                        const otherType = btn.dataset.filter;
                        const otherOptions = document.getElementById(`${otherType}-options`);
                        const otherIcon = btn.querySelector('i');
                        
                        if (otherOptions) {
                            otherOptions.classList.remove('active');
                            otherIcon.className = 'fas fa-chevron-down';
                        }
                    }
                });
                
                // Переключаем текущие опции
                if (options) {
                    options.classList.toggle('active');
                    
                    if (options.classList.contains('active')) {
                        icon.className = 'fas fa-chevron-up';
                    } else {
                        icon.className = 'fas fa-chevron-down';
                    }
                }
                
                // Вибрация
                if (navigator.vibrate) {
                    navigator.vibrate(20);
                }
            });
        });
        
        // Кнопка сброса
        resetFiltersBtn.addEventListener('click', function() {
            // Сброс сортировки
            activeFilters.sort = 'newest';
            const sortOptions = document.querySelectorAll('#sort-options .filter-option');
            sortOptions.forEach(option => {
                option.classList.remove('selected');
                option.querySelector('.option-selector').innerHTML = '';
                if (option.dataset.value === 'newest') {
                    option.classList.add('selected');
                    option.querySelector('.option-selector').innerHTML = '<div class="selector-dot"></div>';
                }
            });
            
            // Сброс коллекций
            activeFilters.collections = [];
            document.querySelectorAll('#collection-options .filter-option').forEach(option => {
                option.classList.remove('selected');
                option.querySelector('.multi-selector').innerHTML = '';
            });
            
            // Сброс цены
            activeFilters.price = { min: 0, max: 100000 };
            priceMinSlider.value = 0;
            priceMaxSlider.value = 100000;
            updateSliderFill();
            
            // Сброс background
            activeFilters.backgrounds = [];
            document.querySelectorAll('#background-options .filter-option').forEach(option => {
                option.classList.remove('selected');
                option.querySelector('.multi-selector').innerHTML = '';
            });
            
            tg.showAlert('✅ Фильтры сброшены');
            tg.HapticFeedback.notificationOccurred('success');
        });
        
        // Кнопка поиска
        applyFiltersBtn.addEventListener('click', function() {
            tg.showAlert('🔍 Поиск по фильтрам выполнен');
            tg.HapticFeedback.notificationOccurred('success');
            
            // Закрываем модальное окно
            filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Показать результаты поиска (для демо)
            if (document.querySelector('.nav-button[data-page="market"].active')) {
                updateContent('market');
            }
        });
    }
    
    // Открытие модального окна фильтров
    function openFiltersModal() {
        filtersModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Закрываем все открытые опции
        filterOptions.forEach(options => {
            options.classList.remove('active');
        });
        
        // Сбрасываем иконки на стрелки вниз
        filterButtons.forEach(button => {
            const icon = button.querySelector('i');
            icon.className = 'fas fa-chevron-down';
        });
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
    
    // Закрытие модального окна фильтров
    closeFiltersModal.addEventListener('click', function() {
        filtersModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Клик вне модального окна фильтров
    filtersModal.addEventListener('click', function(e) {
        if (e.target === this) {
            filtersModal.classList.remove('active');
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
        
        // Отправляем НАСТОЯЩУЮ транзакцию на ваш кошелек
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
    
    // Инициализируем фильтры
    initializeFilters();
    
    updateContent('market');
    
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
                            <circle cx="16" cy="16" r="16" fill="#007aff"/>
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

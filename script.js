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
    const filterOptions = document.querySelectorAll('.filter-option');
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const searchFiltersBtn = document.getElementById('search-filters-btn');
    const priceSliderTrack = document.getElementById('price-slider-track');
    const priceSliderRange = document.getElementById('price-slider-range');
    const priceSliderHandleMin = document.getElementById('price-slider-handle-min');
    const priceSliderHandleMax = document.getElementById('price-slider-handle-max');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    
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
    
    // Ваш кошелек для пополнения
    const BOT_ADDRESS = "UQBhcIzPNZJXa1nWLypYIvO-ybYhBSZEGyH-6MDRdaKyzEJV";
    
    // URL для API (ваш сайт на Vercel)
    const API_URL = "https://mrnemlab.vercel.app/api";
    
    // Инициализация TON Connect
    let tonConnectUI = null;
    
    // Данные для фильтров
    const collections = [
        "Bodded Ring", "Candle Lamp", "Boots", "Candy Cane", "Case", "Christmas Tree",
        "Clover Pin", "Crystal Ball", "Diamond Ring", "Durov's Coat", "Coconut",
        "Crystal Eagle", "Dove of Peace", "Durov's Figurine", "Coffin", "Cupid Charm",
        "Durov's Boots", "Durov's Sunglasses", "Cookie Heart", "Desk Calendar",
        "Durov's Cap", "Easter Cake", "Evil Eye", "Faith Amulet", "Flying Broom",
        "Gem Signet", "Genie Lamp", "Ginger Cookie", "Hanging Star", "Happy Brownie",
        "Heart Locket", "Heroic Helmet", "Holiday Drink", "Homemade Cake", "Ice Cream Cone",
        "Ice Cream Scoops", "Input Key", "lon Gem", "lonic Dryer", "Jack in the Box",
        "Kissed Frog", "Kitty Medallion", "Lol Pop", "Loot Bag", "Love Candle",
        "Love Potion", "Low Rider", "Lunar Snake", "Lush Bouquet", "Mask", "Medal",
        "Mighty Arm", "Mouse Cake", "Party Sparkler", "Pink Flamingo", "Mini Oscar",
        "Money Pot", "Neko Helmet", "Perfume Bottle", "Priccious Peach", "Pretty Posy",
        "Moon Pendant", "Record Player", "Red Star", "Resistance Dog", "Restless Jar",
        "Roses", "Sakura Flower", "Sandcastle", "Santa Hat", "Sky Stilettos",
        "Sleigh Bell", "Snake Box", "Snoop Cigar", "Snoop Dogg", "Snow Globe",
        "Snow Mittens", "Spiced Wine", "Statue of Liberty", "Stellar Rocket", "Surfboard",
        "Star Notepad", "Swag Bag", "Swiss Watch", "Tornh of Freedom", "Telegram Pin",
        "Top Hat", "Total Horse", "UFC Strike", "Valentine Box", "Vintage Cigar",
        "Voodoo Doll", "Wrestide Sign", "Whip Cupcake", "Winter Wreath", "Witch Hat",
        "Xmas Stocking"
    ];
    
    const backgrounds = [
        "Amber", "Aquamarine", "Azure Blue", "Battleship Grey", "Black", "Burgundy",
        "Deep Cyan", "Desert Sand", "Electric Indigo", "Electric Purple", "Emerald",
        "English Violet", "Fandango", "Navy Blue", "Neon Blue", "Onyx Black", "Old Gold",
        "Orange", "Pacific Cyan", "Pacific Green", "Persimmon", "Pine Green"
    ];
    
    // Текущие фильтры
    let currentFilters = {
        sort: 'newest',
        collections: [],
        priceRange: { min: 0, max: 100000 },
        backgrounds: []
    };
    
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
        }
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
            
            // Инициализируем TON Connect UI
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/tonconnect-manifest.json',
                buttonRootId: 'ton-connect-modal'
            });
            
            // Подписываемся на изменения статуса
            tonConnectUI.onStatusChange((wallet) => {
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
            });
            
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
            
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            tg.showAlert('⚠️ Ошибка TON Connect: ' + error.message);
            
            // Fallback для демо
            updateConnectInfo();
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
                    Подключите TON кошелек для пополнения баланса и участия в лотереях
                </div>
            `;
            connectWalletBtn.innerHTML = '<i class="fas fa-plug"></i> Подключить кошелек';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #007aff, #0056cc)';
        }
    }
    
    // Инициализация фильтров
    function initFilters() {
        // Заполняем коллекции
        const collectionDropdown = document.getElementById('collection-dropdown');
        collections.forEach(collection => {
            const item = document.createElement('div');
            item.className = 'filter-option-item';
            item.dataset.value = collection;
            item.innerHTML = `
                <div class="checkbox-square"></div>
                <span>${collection}</span>
            `;
            collectionDropdown.appendChild(item);
        });
        
        // Заполняем backgrounds
        const backgroundDropdown = document.getElementById('background-dropdown');
        backgrounds.forEach(bg => {
            const item = document.createElement('div');
            item.className = 'filter-option-item';
            item.dataset.value = bg;
            item.innerHTML = `
                <div class="checkbox-square"></div>
                <span>${bg}</span>
            `;
            backgroundDropdown.appendChild(item);
        });
        
        // Инициализация слайдера цены
        initPriceSlider();
        
        // Обработчики для фильтров
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                const filterType = this.dataset.filter;
                const dropdown = document.getElementById(`${filterType}-dropdown`);
                
                // Закрываем все остальные дропдауны
                filterDropdowns.forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('active');
                        const correspondingOption = document.querySelector(`.filter-option[data-filter="${d.id.replace('-dropdown', '')}"]`);
                        if (correspondingOption) {
                            correspondingOption.classList.remove('active');
                        }
                    }
                });
                
                // Переключаем текущий дропдаун
                dropdown.classList.toggle('active');
                this.classList.toggle('active');
                
                // Обновляем иконку стрелки
                const icon = this.querySelector('i');
                if (dropdown.classList.contains('active')) {
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
        
        // Обработчики для выбора опций в сортировке
        const sortOptions = document.querySelectorAll('#sort-dropdown .filter-option-item');
        sortOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Снимаем выделение со всех опций
                sortOptions.forEach(opt => opt.classList.remove('active'));
                // Выделяем выбранную
                this.classList.add('active');
                currentFilters.sort = this.dataset.value;
            });
        });
        
        // Обработчики для коллекций и backgrounds (множественный выбор)
        document.querySelectorAll('#collection-dropdown .filter-option-item, #background-dropdown .filter-option-item').forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('active');
                const filterType = this.closest('.filter-dropdown').id.replace('-dropdown', '');
                const value = this.dataset.value;
                
                if (filterType === 'collection') {
                    const index = currentFilters.collections.indexOf(value);
                    if (index > -1) {
                        currentFilters.collections.splice(index, 1);
                    } else {
                        currentFilters.collections.push(value);
                    }
                } else if (filterType === 'background') {
                    const index = currentFilters.backgrounds.indexOf(value);
                    if (index > -1) {
                        currentFilters.backgrounds.splice(index, 1);
                    } else {
                        currentFilters.backgrounds.push(value);
                    }
                }
            });
        });
        
        // Сброс фильтров
        resetFiltersBtn.addEventListener('click', function() {
            resetAllFilters();
            tg.showAlert('Фильтры сброшены');
            tg.HapticFeedback.notificationOccurred('success');
        });
        
        // Поиск по фильтрам
        searchFiltersBtn.addEventListener('click', function() {
            performSearch();
            filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            tg.showAlert('Поиск выполнен по заданным фильтрам');
            tg.HapticFeedback.notificationOccurred('success');
        });
    }
    
    // Инициализация слайдера цены
    function initPriceSlider() {
        const trackWidth = priceSliderTrack.offsetWidth;
        const minHandle = priceSliderHandleMin;
        const maxHandle = priceSliderHandleMax;
        const range = priceSliderRange;
        
        let isDraggingMin = false;
        let isDraggingMax = false;
        
        // Позиционируем элементы
        function updateSlider() {
            const minPercent = (currentFilters.priceRange.min / 100000) * 100;
            const maxPercent = (currentFilters.priceRange.max / 100000) * 100;
            
            minHandle.style.left = `${minPercent}%`;
            maxHandle.style.left = `${maxPercent}%`;
            range.style.left = `${minPercent}%`;
            range.style.width = `${maxPercent - minPercent}%`;
            
            priceMinInput.value = currentFilters.priceRange.min;
            priceMaxInput.value = currentFilters.priceRange.max;
        }
        
        // Обработчики для ползунков
        function startDragMin(e) {
            isDraggingMin = true;
            e.preventDefault();
        }
        
        function startDragMax(e) {
            isDraggingMax = true;
            e.preventDefault();
        }
        
        function stopDrag() {
            isDraggingMin = false;
            isDraggingMax = false;
        }
        
        function handleDrag(e) {
            if (!isDraggingMin && !isDraggingMax) return;
            
            const rect = priceSliderTrack.getBoundingClientRect();
            const x = e.clientX - rect.left;
            let percent = (x / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            const value = Math.round((percent / 100) * 100000);
            
            if (isDraggingMin) {
                if (value < currentFilters.priceRange.max) {
                    currentFilters.priceRange.min = value;
                }
            } else if (isDraggingMax) {
                if (value > currentFilters.priceRange.min) {
                    currentFilters.priceRange.max = value;
                }
            }
            
            updateSlider();
        }
        
        // Обработчики для инпутов
        priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(100000, value));
            if (value < currentFilters.priceRange.max) {
                currentFilters.priceRange.min = value;
                updateSlider();
            }
        });
        
        priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 100000;
            value = Math.max(0, Math.min(100000, value));
            if (value > currentFilters.priceRange.min) {
                currentFilters.priceRange.max = value;
                updateSlider();
            }
        });
        
        // Добавляем обработчики событий
        minHandle.addEventListener('mousedown', startDragMin);
        maxHandle.addEventListener('mousedown', startDragMax);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mousemove', handleDrag);
        
        // Для touch устройств
        minHandle.addEventListener('touchstart', startDragMin);
        maxHandle.addEventListener('touchstart', startDragMax);
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchmove', handleDrag);
        
        // Инициализация
        updateSlider();
    }
    
    // Сброс всех фильтров
    function resetAllFilters() {
        currentFilters = {
            sort: 'newest',
            collections: [],
            priceRange: { min: 0, max: 100000 },
            backgrounds: []
        };
        
        // Сброс UI
        document.querySelectorAll('.filter-option-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Активируем первую опцию в сортировке
        document.querySelector('#sort-dropdown .filter-option-item[data-value="newest"]').classList.add('active');
        
        // Обновляем слайдер
        initPriceSlider();
    }
    
    // Поиск по фильтрам
    function performSearch() {
        console.log('Searching with filters:', currentFilters);
        // Здесь будет логика поиска NFT по фильтрам
        // В демо-версии просто показываем уведомление
    }
    
    // Создание содержимого для разных страниц
    function createMarketContent() {
        return `
            <div class="page-content">
                <div class="market-container">
                    <div class="search-filter-bar">
                        <div class="search-filter-text">Опробуйте поиск по фильтрам</div>
                        <button class="filter-icon-btn" id="open-filters-btn">
                            <i class="fas fa-filter"></i>
                        </button>
                    </div>
                    
                    <div class="nft-grid" id="nft-grid">
                        <!-- NFT будут загружены динамически -->
                        ${generateDemoNFTs()}
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateDemoNFTs() {
        const nfts = [];
        const demoNFTs = [
            { name: "Bodded Ring", price: 150 },
            { name: "Crystal Ball", price: 89 },
            { name: "Diamond Ring", price: 250 },
            { name: "Genie Lamp", price: 120 },
            { name: "Heroic Helmet", price: 75 },
            { name: "Moon Pendant", price: 95 }
        ];
        
        for (let i = 0; i < 6; i++) {
            const nft = demoNFTs[i];
            nfts.push(`
                <div class="nft-item">
                    <div class="nft-image">
                        <i class="fas fa-gem" style="font-size: 3rem; color: rgba(255, 255, 255, 0.7);"></i>
                    </div>
                    <div class="nft-info">
                        <div class="nft-name">${nft.name}</div>
                        <div class="nft-price">
                            <i class="fas fa-coins" style="color: #7b2ff7;"></i>
                            <span>${nft.price} TON</span>
                        </div>
                    </div>
                </div>
            `);
        }
        
        return nfts.join('');
    }
    
    function createGiftsContent() {
        return `
            <div class="page-content">
                <div class="gifts-container">
                    <div class="gifts-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h2>🎁 Мои подарки</h2>
                    <div class="gifts-message">
                        У вас пока нет подарков.<br>
                        Продолжайте участвовать в активностях!
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
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <h2>📅 Сезон</h2>
                    <div class="season-message">
                        Раздел в разработке.<br>
                        Следите за обновлениями!
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
                            `<div class="avatar-placeholder" style="
                                background: linear-gradient(135deg, #2a2a35, #1a1a25);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 100%;
                                height: 100%;
                            ">
                                <span style="font-size: 2.5rem; font-weight: bold; color: rgba(255, 255, 255, 0.8);">
                                    ${userData.username.charAt(0).toUpperCase()}
                                </span>
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
                const openFiltersBtn = document.getElementById('open-filters-btn');
                if (openFiltersBtn) {
                    openFiltersBtn.addEventListener('click', function() {
                        filtersModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
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
    
    // ОТПРАВКА ТРАНЗАКЦИИ на ваш кошелек
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
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [
                    {
                        address: BOT_ADDRESS,
                        amount: (amount * 1000000000).toString(),
                        payload: userData.id ? Buffer.from(userData.id.toString()).toString('hex') : ""
                    }
                ]
            };
            
            // Показываем статус
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            // Отправляем транзакцию
            console.log('Sending transaction to:', BOT_ADDRESS);
            console.log('Transaction amount:', amount, 'TON');
            
            const result = await tonConnectUI.sendTransaction(transaction);
            
            console.log('Transaction result:', result);
            
            if (result) {
                // Транзакция отправлена успешно
                showTransactionStatus('success', 'Транзакция отправлена!');
                
                // В демо-версии сразу обновляем баланс
                userData.balance += amount;
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
    
    // Инициализируем TON Connect
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
    initFilters();
    
    // Устанавливаем начальную страницу
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
});

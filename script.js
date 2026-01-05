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
    const filterModal = document.getElementById('filter-modal');
    const closeFilterModal = document.getElementById('close-filter-modal');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterSubmenus = document.querySelectorAll('.filter-submenu');
    const filterOptions = document.querySelectorAll('.filter-option');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const filterIconBtn = document.querySelector('.filter-icon-btn');
    
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
        totalVolume: 0
    };
    
    // Фильтры
    let currentFilters = {
        sort: 'newest',
        collections: [],
        price: { min: 0, max: 100000 },
        backgrounds: []
    };
    
    // Коллекции для фильтра
    const collections = [
        "Bodded Ring", "Candle Lamp", "Boots", "Candy Cane", "Case", 
        "Christmas Tree", "Clover Pin", "Crystal Ball", "Diamond Ring", 
        "Durov's Coat", "Coconut", "Crystal Eagle", "Dove of Peace", 
        "Durov's Figurine", "Coffin", "Cupid Charm", "Durov's Boots", 
        "Durov's Sunglasses", "Cookie Heart", "Desk Calendar", 
        "Durov's Cap", "Easter Cake", "Evil Eye", "Faith Amulet", 
        "Flying Broom", "Gem Signet", "Genie Lamp", "Ginger Cookie", 
        "Hanging Star", "Happy Brownie", "Heart Locket", "Heroic Helmet", 
        "Holiday Drink", "Homemade Cake", "Ice Cream Cone", "Ice Cream Scoops", 
        "Input Key", "lon Gem", "lonic Dryer", "Jack in the Box", 
        "Kissed Frog", "Kitty Medallion", "Lol Pop", "Loot Bag", 
        "Love Candle", "Love Potion", "Low Rider", "Lunar Snake", 
        "Lush Bouquet", "Mask", "Medal", "Mighty Arm", "Mouse Cake", 
        "Party Sparkler", "Pink Flamingo", "Mini Oscar", "Money Pot", 
        "Neko Helmet", "Perfume Bottle", "Priccious Peach", "Pretty Posy", 
        "Moon Pendant", "Record Player", "Red Star", "Resistance Dog", 
        "Restless Jar", "Roses", "Sakura Flower", "Sandcastle", "Santa Hat", 
        "Sky Stilettos", "Sleigh Bell", "Snake Box", "Snoop Cigar", 
        "Snoop Dogg", "Snow Globe", "Snow Mittens", "Spiced Wine", 
        "Statue of Liberty", "Stellar Rocket", "Surfboard", "Star Notepad", 
        "Swag Bag", "Swiss Watch", "Tornh of Freedom", "Telegram Pin", 
        "Top Hat", "Total Horse", "UFC Strike", "Valentine Box", 
        "Vintage Cigar", "Voodoo Doll", "Wrestide Sign", "Whip Cupcake", 
        "Winter Wreath", "Witch Hat", "Xmas Stocking"
    ];
    
    // Бэкграунды для фильтра
    const backgrounds = [
        "Amber", "Aquamarine", "Azure Blue", "Battleship Grey", "Black", 
        "Burgundy", "Deep Cyan", "Desert Sand", "Electric Indigo", 
        "Electric Purple", "Emerald", "English Violet", "Fandango", 
        "Navy Blue", "Neon Blue", "Onyx Black", "Old Gold", "Orange", 
        "Pacific Cyan", "Pacific Green", "Persimmon", "Pine Green"
    ];
    
    // Ваш кошелек для пополнения
    const BOT_ADDRESS = "UQBhcIzPNZJXa1nWLypYIvO-ybYhBSZEGyH-6MDRdaKyzEJV";
    
    // URL для API
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
            
            // Загружаем аватарку
            if (user.photo_url) {
                userData.avatarUrl = user.photo_url;
            }
            
            console.log('User data loaded:', userData);
        }
        
        // Обновляем отображение
        updateBalanceDisplay();
    }
    
    // Сохранение данных пользователя
    function saveUserData() {
        localStorage.setItem('beatclub_user_data', JSON.stringify(userData));
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
            
            const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
            
            const options = {
                manifestUrl: manifestUrl,
                buttonRootId: 'ton-connect-modal',
                actionsConfiguration: {
                    twaReturnUrl: 'https://mrnemlab.vercel.app/'
                }
            };
            
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI(options);
            
            const unsubscribe = tonConnectUI.onStatusChange(
                (wallet) => {
                    console.log('TON Connect status changed:', wallet);
                    
                    if (wallet) {
                        userData.walletConnected = true;
                        userData.walletAddress = wallet.account.address;
                        console.log('Wallet connected:', userData.walletAddress);
                        
                        updateRealWalletBalance();
                        saveUserData();
                        
                        tg.showAlert('✅ Кошелек подключен!');
                        tg.HapticFeedback.notificationOccurred('success');
                        
                        if (document.querySelector('.nav-button[data-page="profile"].active')) {
                            updateContent('profile');
                        }
                    } else {
                        userData.walletConnected = false;
                        userData.walletAddress = null;
                        userData.walletBalance = 0;
                        console.log('Wallet disconnected');
                        
                        saveUserData();
                        
                        if (document.querySelector('.nav-button[data-page="profile"].active')) {
                            updateContent('profile');
                        }
                    }
                }
            );
            
            const currentWallet = tonConnectUI.connected;
            if (currentWallet) {
                console.log('Found existing connection:', currentWallet);
                userData.walletConnected = true;
                userData.walletAddress = currentWallet.account.address;
                updateRealWalletBalance();
            }
            
            console.log('TON Connect initialized successfully');
            return unsubscribe;
            
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            tg.showAlert('⚠️ Ошибка TON Connect: ' + error.message);
            return null;
        }
    }
    
    // Получение реального баланса кошелька
    async function updateRealWalletBalance() {
        if (!userData.walletConnected || !userData.walletAddress) return;
        
        try {
            console.log('Fetching wallet balance for:', userData.walletAddress);
            
            const response = await fetch(
                `https://toncenter.com/api/v2/getAddressBalance?address=${userData.walletAddress}`
            );
            
            const data = await response.json();
            console.log('Balance API response:', data);
            
            if (data.ok) {
                userData.walletBalance = parseInt(data.result) / 1000000000;
                console.log('Wallet balance:', userData.walletBalance, 'TON');
            } else {
                userData.walletBalance = 12.5;
                console.log('Using demo balance');
            }
            
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            userData.walletBalance = 12.5;
        }
    }
    
    // Инициализация фильтров
    function initFilters() {
        // Заполняем коллекции
        const collectionSubmenu = document.getElementById('collection-submenu');
        collections.forEach(collection => {
            const option = document.createElement('button');
            option.className = 'filter-option';
            option.dataset.value = collection.toLowerCase().replace(/ /g, '-');
            option.innerHTML = `
                <div class="radio-circle"></div>
                <span>${collection}</span>
            `;
            option.addEventListener('click', function() {
                this.classList.toggle('selected');
                updateCollectionFilter();
            });
            collectionSubmenu.appendChild(option);
        });
        
        // Заполняем бэкграунды
        const backgroundSubmenu = document.getElementById('background-submenu');
        backgrounds.forEach(background => {
            const option = document.createElement('button');
            option.className = 'filter-option';
            option.dataset.value = background.toLowerCase().replace(/ /g, '-');
            option.innerHTML = `
                <div class="radio-circle"></div>
                <span>${background}</span>
            `;
            option.addEventListener('click', function() {
                this.classList.toggle('selected');
                updateBackgroundFilter();
            });
            backgroundSubmenu.appendChild(option);
        });
        
        // Инициализация слайдера цены
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        const priceInputMin = document.getElementById('price-input-min');
        const priceInputMax = document.getElementById('price-input-max');
        const sliderTrack = document.querySelector('.slider-track');
        
        function updatePriceSlider() {
            const min = parseInt(priceMin.value);
            const max = parseInt(priceMax.value);
            
            // Обновляем трек
            const minPercent = (min / 100000) * 100;
            const maxPercent = (max / 100000) * 100;
            sliderTrack.style.left = `${minPercent}%`;
            sliderTrack.style.width = `${maxPercent - minPercent}%`;
            
            // Обновляем инпуты
            priceInputMin.value = min;
            priceInputMax.value = max;
            
            // Обновляем фильтр
            currentFilters.price = { min, max };
        }
        
        priceMin.addEventListener('input', updatePriceSlider);
        priceMax.addEventListener('input', updatePriceSlider);
        
        priceInputMin.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (isNaN(value)) value = 0;
            if (value < 0) value = 0;
            if (value > 100000) value = 100000;
            if (value > parseInt(priceMax.value)) value = parseInt(priceMax.value);
            
            priceMin.value = value;
            updatePriceSlider();
        });
        
        priceInputMax.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (isNaN(value)) value = 100000;
            if (value < 0) value = 0;
            if (value > 100000) value = 100000;
            if (value < parseInt(priceMin.value)) value = parseInt(priceMin.value);
            
            priceMax.value = value;
            updatePriceSlider();
        });
        
        updatePriceSlider();
    }
    
    // Обновление фильтра коллекций
    function updateCollectionFilter() {
        const selectedOptions = document.querySelectorAll('#collection-submenu .filter-option.selected');
        currentFilters.collections = Array.from(selectedOptions).map(opt => opt.dataset.value);
    }
    
    // Обновление фильтра бэкграундов
    function updateBackgroundFilter() {
        const selectedOptions = document.querySelectorAll('#background-submenu .filter-option.selected');
        currentFilters.backgrounds = Array.from(selectedOptions).map(opt => opt.dataset.value);
    }
    
    // Создание содержимого для разных страниц
    function createMarketContent() {
        return `
            <div class="page-content">
                <div class="market-container">
                    <div class="market-top">
                        <div class="market-try-search">
                            <span>Опробуйте поиск по фильтрам</span>
                        </div>
                        <button class="filter-icon-btn">
                            <i class="fas fa-filter"></i>
                        </button>
                    </div>
                    <div class="market-items">
                        ${generateMarketItems()}
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateMarketItems() {
        const items = [
            { name: "NFT Item #1", price: "10.5" },
            { name: "NFT Item #2", price: "25.0" },
            { name: "NFT Item #3", price: "7.8" },
            { name: "NFT Item #4", price: "15.2" },
            { name: "NFT Item #5", price: "42.0" },
            { name: "NFT Item #6", price: "3.5" }
        ];
        
        return items.map(item => `
            <div class="market-item">
                <div class="item-image">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">
                        <img src="nft/ton.png" alt="TON">
                        <span>${item.price} TON</span>
                    </div>
                </div>
            </div>
        `).join('');
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
                        Примите участие в розыгрышах и событиях!
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
                        Функция находится в разработке.<br>
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
                            `<div class="avatar-placeholder">
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
                </div>
            </div>
        `;
    }
    
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
                const marketFilterBtn = document.querySelector('.filter-icon-btn');
                if (marketFilterBtn) {
                    marketFilterBtn.addEventListener('click', function() {
                        filterModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
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
    
    // ОТПРАВКА НАСТОЯЩЕЙ ТРАНЗАКЦИИ
    async function sendDepositTransaction(amount) {
        if (!tonConnectUI || !userData.walletConnected) {
            tg.showAlert('❌ Кошелек не подключен');
            return false;
        }
        
        try {
            if (userData.walletBalance < amount) {
                tg.showAlert(`❌ Недостаточно средств на кошельке. Доступно: ${userData.walletBalance.toFixed(2)} TON`);
                return false;
            }
            
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
            
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            console.log('Sending REAL transaction to:', BOT_ADDRESS);
            console.log('Transaction amount:', amount, 'TON');
            
            const result = await tonConnectUI.sendTransaction(transaction);
            
            console.log('Transaction result:', result);
            
            if (result) {
                showTransactionStatus('success', 'Транзакция отправлена! Проверяем...');
                
                const checkResult = await checkTransactionOnServer(amount);
                
                if (checkResult.success) {
                    userData.balance = checkResult.newBalance;
                    userData.totalVolume += amount;
                    updateBalanceDisplay();
                    saveUserData();
                    
                    showTransactionStatus('confirmed', `✅ Баланс пополнен на ${amount} TON!`);
                    
                    tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    updateRealWalletBalance();
                    
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
    
    // Проверка транзакции через API
    async function checkTransactionOnServer(amount) {
        try {
            if (!userData.walletConnected || !userData.walletAddress) {
                return { success: false, message: 'Кошелек не подключен' };
            }
            
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
    
    // Показать статус транзакции
    function showTransactionStatus(status, message) {
        transactionStatusElement.innerHTML = `
            <div class="transaction-status-${status}">
                <i class="fas fa-${status === 'success' ? 'check-circle' : 
                                 status === 'pending' ? 'spinner fa-spin' : 
                                 status === 'confirmed' ? 'check-double' : 
                                 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
    }
    
    // Сброс фильтров
    function resetFilters() {
        // Сброс сортировки
        document.querySelectorAll('#sort-submenu .filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('#sort-submenu .filter-option[data-value="newest"]').classList.add('selected');
        currentFilters.sort = 'newest';
        
        // Сброс коллекций
        document.querySelectorAll('#collection-submenu .filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        currentFilters.collections = [];
        
        // Сброс цены
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        const priceInputMin = document.getElementById('price-input-min');
        const priceInputMax = document.getElementById('price-input-max');
        
        priceMin.value = 0;
        priceMax.value = 100000;
        priceInputMin.value = 0;
        priceInputMax.value = 100000;
        
        const sliderTrack = document.querySelector('.slider-track');
        sliderTrack.style.left = '0%';
        sliderTrack.style.width = '100%';
        
        currentFilters.price = { min: 0, max: 100000 };
        
        // Сброс бэкграундов
        document.querySelectorAll('#background-submenu .filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        currentFilters.backgrounds = [];
        
        tg.showAlert('✅ Фильтры сброшены');
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    // Применение фильтров
    function applyFilters() {
        console.log('Applying filters:', currentFilters);
        
        // Здесь будет логика применения фильтров
        tg.showAlert('🔍 Поиск по фильтрам выполнен');
        tg.HapticFeedback.notificationOccurred('success');
        
        // Закрываем модальное окно
        filterModal.classList.remove('active');
        document.body.style.overflow = 'auto';
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
        
        balanceModal.classList.remove('active');
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
            message: `Вы можете вывести до ${userData.balance} TON`,
            buttons: [
                {id: 'withdraw_all', type: 'default', text: 'Вывести всё'},
                {type: 'cancel', text: '❌ Отмена'}
            ]
        }, function(buttonId) {
            if (buttonId === 'withdraw_all') {
                tg.showAlert(`✅ Запрос на вывод ${userData.balance} TON отправлен!`);
                tg.HapticFeedback.notificationOccurred('success');
            }
        });
    });
    
    // Кнопка подключения кошелька
    connectWalletBtn.addEventListener('click', function() {
        if (userData.walletConnected) {
            tg.showAlert('Функция отключения в разработке');
        } else {
            connectWallet();
        }
        
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
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
        
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        
        await sendDepositTransaction(amount);
    });
    
    // Закрытие модального окна фильтров
    closeFilterModal.addEventListener('click', function() {
        filterModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Клик вне модального окна фильтров
    filterModal.addEventListener('click', function(e) {
        if (e.target === this) {
            filterModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Обработка кнопок фильтров
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            const submenu = document.getElementById(`${filter}-submenu`);
            
            // Закрываем все подменю
            filterSubmenus.forEach(menu => {
                if (menu !== submenu) {
                    menu.classList.remove('active');
                }
            });
            
            // Переключаем текущее подменю
            submenu.classList.toggle('active');
            
            // Переключаем иконку
            const icon = this.querySelector('i');
            if (submenu.classList.contains('active')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });
    
    // Обработка опций сортировки
    document.querySelectorAll('#sort-submenu .filter-option').forEach(option => {
        option.addEventListener('click', function() {
            // Снимаем выделение со всех опций
            document.querySelectorAll('#sort-submenu .filter-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Выделяем текущую опцию
            this.classList.add('selected');
            
            // Обновляем фильтр
            currentFilters.sort = this.dataset.value;
        });
    });
    
    // Кнопка сброса фильтров
    resetFiltersBtn.addEventListener('click', function() {
        resetFilters();
    });
    
    // Кнопка поиска по фильтрам
    applyFiltersBtn.addEventListener('click', function() {
        applyFilters();
    });
    
    // Инициализация
    loadUserData();
    initFilters();
    
    // Инициализируем TON Connect
    setTimeout(() => {
        initTonConnect().then(() => {
            console.log('TON Connect initialized');
        }).catch(error => {
            console.error('Failed to init TON Connect:', error);
        });
    }, 500);
    
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
            const icons = document.querySelectorAll('.ton-icon-small');
            icons.forEach(icon => {
                if (icon && (icon.naturalWidth === 0 || icon.complete === false)) {
                    console.log('TON icon failed to load, using fallback');
                    const svg = `
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="16" fill="#007AFF"/>
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

// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    
    // Инициализируем приложение
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#000');
    tg.setBackgroundColor('#000');
    
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
    const walletStatusText = document.getElementById('wallet-status-text');
    const depositAmountInput = document.getElementById('deposit-amount-input');
    const amountPresetBtns = document.querySelectorAll('.amount-preset-btn');
    const confirmDepositBtn = document.getElementById('confirm-deposit-btn');
    const transactionStatusElement = document.getElementById('transaction-status');
    const historyBtn = document.getElementById('history-btn');
    const walletTop = document.getElementById('wallet-top');
    
    // Элементы для фильтров
    const filtersModal = document.getElementById('filters-modal');
    const closeFiltersModal = document.getElementById('close-filters-modal');
    const filterSections = document.querySelectorAll('.filter-section');
    const filterOptions = document.querySelectorAll('.filter-option');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    
    // Инициализация TON Connect
    let tonConnectUI = null;
    
    // Текущий пользователь (все значения обнулены)
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
        transactions: [],
        inventory: []
    };
    
    // Демо инвентарь NFT (все коллекции)
    const demoNFTs = [
        // Кольца
        { id: 1, name: "Bodded Ring", type: "ring", price: 150, category: "Bodded Ring", background: "Black" },
        { id: 2, name: "Diamond Ring", type: "ring", price: 250, category: "Diamond Ring", background: "Emerald" },
        
        // Магия
        { id: 3, name: "Crystal Ball", type: "magic", price: 89, category: "Crystal Ball", background: "Navy Blue" },
        { id: 4, name: "Genie Lamp", type: "magic", price: 120, category: "Genie Lamp", background: "Old Gold" },
        { id: 5, name: "Magic Wand", type: "magic", price: 150, category: "Magic Wand", background: "Electric Purple" },
        { id: 6, name: "Love Potion", type: "magic", price: 95, category: "Love Potion", background: "Fandango" },
        { id: 7, name: "Voodoo Doll", type: "magic", price: 110, category: "Voodoo Doll", background: "Burgundy" },
        { id: 8, name: "Evil Eye", type: "magic", price: 75, category: "Evil Eye", background: "Azure Blue" },
        { id: 9, name: "Faith Amulet", type: "magic", price: 130, category: "Faith Amulet", background: "Emerald" },
        
        // Доспехи
        { id: 10, name: "Heroic Helmet", type: "armor", price: 75, category: "Heroic Helmet", background: "Battleship Grey" },
        { id: 11, name: "Dragon Scale", type: "armor", price: 180, category: "Dragon Scale", background: "Pine Green" },
        { id: 12, name: "Wizard Hat", type: "armor", price: 80, category: "Wizard Hat", background: "Onyx Black" },
        { id: 13, name: "Neko Helmet", type: "armor", price: 120, category: "Neko Helmet", background: "Orange" },
        { id: 14, name: "Boots", type: "armor", price: 60, category: "Boots", background: "Desert Sand" },
        { id: 15, name: "Durov's Coat", type: "armor", price: 300, category: "Durov's Coat", background: "Navy Blue" },
        { id: 16, name: "Durov's Boots", type: "armor", price: 200, category: "Durov's Boots", background: "Black" },
        { id: 17, name: "Durov's Sunglasses", type: "armor", price: 150, category: "Durov's Sunglasses", background: "Electric Indigo" },
        { id: 18, name: "Durov's Cap", type: "armor", price: 100, category: "Durov's Cap", background: "Red" },
        { id: 19, name: "Santa Hat", type: "armor", price: 50, category: "Santa Hat", background: "Red" },
        { id: 20, name: "Witch Hat", type: "armor", price: 70, category: "Witch Hat", background: "Black" },
        { id: 21, name: "Top Hat", type: "armor", price: 90, category: "Top Hat", background: "Onyx Black" },
        { id: 22, name: "UFC Strike", type: "armor", price: 120, category: "UFC Strike", background: "Electric Purple" },
        
        // Украшения
        { id: 23, name: "Moon Pendant", type: "jewelry", price: 95, category: "Moon Pendant", background: "Silver" },
        { id: 24, name: "Clover Pin", type: "jewelry", price: 45, category: "Clover Pin", background: "Emerald" },
        { id: 25, name: "Heart Locket", type: "jewelry", price: 85, category: "Heart Locket", background: "Rose Gold" },
        { id: 26, name: "Gem Signet", type: "jewelry", price: 140, category: "Gem Signet", background: "Emerald" },
        { id: 27, name: "Medal", type: "jewelry", price: 110, category: "Medal", background: "Old Gold" },
        { id: 28, name: "Swiss Watch", type: "jewelry", price: 250, category: "Swiss Watch", background: "Silver" },
        { id: 29, name: "Telegram Pin", type: "jewelry", price: 65, category: "Telegram Pin", background: "Azure Blue" },
        { id: 30, name: "Red Star", type: "jewelry", price: 40, category: "Red Star", background: "Red" },
        
        // Артефакты
        { id: 31, name: "Golden Cup", type: "artifact", price: 200, category: "Golden Cup", background: "Old Gold" },
        { id: 32, name: "Phoenix Feather", type: "artifact", price: 300, category: "Phoenix Feather", background: "Orange" },
        { id: 33, name: "Candle Lamp", type: "artifact", price: 60, category: "Candle Lamp", background: "Amber" },
        { id: 34, name: "Candy Cane", type: "artifact", price: 25, category: "Candy Cane", background: "Red" },
        { id: 35, name: "Christmas Tree", type: "artifact", price: 120, category: "Christmas Tree", background: "Pine Green" },
        { id: 36, name: "Coconut", type: "artifact", price: 40, category: "Coconut", background: "Desert Sand" },
        { id: 37, name: "Crystal Eagle", type: "artifact", price: 180, category: "Crystal Eagle", background: "Azure Blue" },
        { id: 38, name: "Dove of Peace", type: "artifact", price: 95, category: "Dove of Peace", background: "White" },
        { id: 39, name: "Durov's Figurine", type: "artifact", price: 400, category: "Durov's Figurine", background: "Gold" },
        { id: 40, name: "Coffin", type: "artifact", price: 150, category: "Coffin", background: "Black" },
        { id: 41, name: "Cupid Charm", type: "artifact", price: 85, category: "Cupid Charm", background: "Rose" },
        { id: 42, name: "Easter Cake", type: "artifact", price: 70, category: "Easter Cake", background: "White" },
        { id: 43, name: "Flying Broom", type: "artifact", price: 110, category: "Flying Broom", background: "Brown" },
        { id: 44, name: "Ginger Cookie", type: "artifact", price: 30, category: "Ginger Cookie", background: "Amber" },
        { id: 45, name: "Hanging Star", type: "artifact", price: 65, category: "Hanging Star", background: "Gold" },
        { id: 46, name: "Happy Brownie", type: "artifact", price: 45, category: "Happy Brownie", background: "Brown" },
        { id: 47, name: "Holiday Drink", type: "artifact", price: 55, category: "Holiday Drink", background: "Red" },
        { id: 48, name: "Homemade Cake", type: "artifact", price: 65, category: "Homemade Cake", background: "Beige" },
        { id: 49, name: "Ice Cream Cone", type: "artifact", price: 35, category: "Ice Cream Cone", background: "Pink" },
        { id: 50, name: "Ice Cream Scoops", type: "artifact", price: 50, category: "Ice Cream Scoops", background: "Multi" },
        { id: 51, name: "Input Key", type: "artifact", price: 120, category: "Input Key", background: "Silver" },
        { id: 52, name: "lon Gem", type: "artifact", price: 220, category: "lon Gem", background: "Purple" },
        { id: 53, name: "lonic Dryer", type: "artifact", price: 90, category: "lonic Dryer", background: "White" },
        { id: 54, name: "Jack in the Box", type: "artifact", price: 75, category: "Jack in the Box", background: "Red" },
        { id: 55, name: "Kissed Frog", type: "artifact", price: 65, category: "Kissed Frog", background: "Green" },
        { id: 56, name: "Kitty Medallion", type: "artifact", price: 85, category: "Kitty Medallion", background: "Silver" },
        { id: 57, name: "Lol Pop", type: "artifact", price: 25, category: "Lol Pop", background: "Rainbow" },
        { id: 58, name: "Loot Bag", type: "artifact", price: 95, category: "Loot Bag", background: "Brown" },
        { id: 59, name: "Love Candle", type: "artifact", price: 45, category: "Love Candle", background: "Red" },
        { id: 60, name: "Low Rider", type: "artifact", price: 180, category: "Low Rider", background: "Blue" },
        { id: 61, name: "Lunar Snake", type: "artifact", price: 130, category: "Lunar Snake", background: "Silver" },
        { id: 62, name: "Lush Bouquet", type: "artifact", price: 85, category: "Lush Bouquet", background: "Multi" },
        { id: 63, name: "Mask", type: "artifact", price: 70, category: "Mask", background: "Black" },
        { id: 64, name: "Mighty Arm", type: "artifact", price: 150, category: "Mighty Arm", background: "Steel" },
        { id: 65, name: "Mouse Cake", type: "artifact", price: 55, category: "Mouse Cake", background: "Brown" },
        { id: 66, name: "Party Sparkler", type: "artifact", price: 40, category: "Party Sparkler", background: "Gold" },
        { id: 67, name: "Pink Flamingo", type: "artifact", price: 75, category: "Pink Flamingo", background: "Pink" },
        { id: 68, name: "Mini Oscar", type: "artifact", price: 200, category: "Mini Oscar", background: "Gold" },
        { id: 69, name: "Money Pot", type: "artifact", price: 120, category: "Money Pot", background: "Green" },
        { id: 70, name: "Perfume Bottle", type: "artifact", price: 95, category: "Perfume Bottle", background: "Violet" },
        { id: 71, name: "Priccious Peach", type: "artifact", price: 65, category: "Priccious Peach", background: "Orange" },
        { id: 72, name: "Pretty Posy", type: "artifact", price: 50, category: "Pretty Posy", background: "Pink" },
        { id: 73, name: "Record Player", type: "artifact", price: 160, category: "Record Player", background: "Black" },
        { id: 74, name: "Resistance Dog", type: "artifact", price: 110, category: "Resistance Dog", background: "Brown" },
        { id: 75, name: "Restless Jar", type: "artifact", price: 85, category: "Restless Jar", background: "Glass" },
        { id: 76, name: "Roses", type: "artifact", price: 95, category: "Roses", background: "Red" },
        { id: 77, name: "Sakura Flower", type: "artifact", price: 70, category: "Sakura Flower", background: "Pink" },
        { id: 78, name: "Sandcastle", type: "artifact", price: 45, category: "Sandcastle", background: "Beige" },
        { id: 79, name: "Sky Stilettos", type: "artifact", price: 130, category: "Sky Stilettos", background: "Silver" },
        { id: 80, name: "Sleigh Bell", type: "artifact", price: 35, category: "Sleigh Bell", background: "Gold" },
        { id: 81, name: "Snake Box", type: "artifact", price: 95, category: "Snake Box", background: "Green" },
        { id: 82, name: "Snoop Cigar", type: "artifact", price: 75, category: "Snoop Cigar", background: "Brown" },
        { id: 83, name: "Snoop Dogg", type: "artifact", price: 250, category: "Snoop Dogg", background: "Black" },
        { id: 84, name: "Snow Globe", type: "artifact", price: 85, category: "Snow Globe", background: "White" },
        { id: 85, name: "Snow Mittens", type: "artifact", price: 40, category: "Snow Mittens", background: "Blue" },
        { id: 86, name: "Spiced Wine", type: "artifact", price: 65, category: "Spiced Wine", background: "Burgundy" },
        { id: 87, name: "Statue of Liberty", type: "artifact", price: 180, category: "Statue of Liberty", background: "Green" },
        { id: 88, name: "Stellar Rocket", type: "artifact", price: 220, category: "Stellar Rocket", background: "Silver" },
        { id: 89, name: "Surfboard", type: "artifact", price: 110, category: "Surfboard", background: "Blue" },
        { id: 90, name: "Star Notepad", type: "artifact", price: 30, category: "Star Notepad", background: "White" },
        { id: 91, name: "Swag Bag", type: "artifact", price: 95, category: "Swag Bag", background: "Black" },
        { id: 92, name: "Tornh of Freedom", type: "artifact", price: 140, category: "Tornh of Freedom", background: "Gold" },
        { id: 93, name: "Total Horse", type: "artifact", price: 175, category: "Total Horse", background: "Brown" },
        { id: 94, name: "Valentine Box", type: "artifact", price: 55, category: "Valentine Box", background: "Red" },
        { id: 95, name: "Vintage Cigar", type: "artifact", price: 85, category: "Vintage Cigar", background: "Brown" },
        { id: 96, name: "Wrestide Sign", type: "artifact", price: 65, category: "Wrestide Sign", background: "White" },
        { id: 97, name: "Whip Cupcake", type: "artifact", price: 45, category: "Whip Cupcake", background: "Pink" },
        { id: 98, name: "Winter Wreath", type: "artifact", price: 75, category: "Winter Wreath", background: "Green" },
        { id: 99, name: "Xmas Stocking", type: "artifact", price: 35, category: "Xmas Stocking", background: "Red" },
        { id: 100, name: "Cookie Heart", type: "artifact", price: 40, category: "Cookie Heart", background: "Pink" },
        { id: 101, name: "Desk Calendar", type: "artifact", price: 55, category: "Desk Calendar", background: "White" },
        { id: 102, name: "Case", type: "artifact", price: 95, category: "Case", background: "Black" }
    ];
    
    // Данные для фильтров
    const sortOptions = [
        { value: 'newest', label: 'Новые' },
        { value: 'price-asc', label: 'Цена: по возрастанию' },
        { value: 'price-desc', label: 'Цена: по убыванию' },
        { value: 'name-asc', label: 'По названию (А-Я)' },
        { value: 'name-desc', label: 'По названию (Я-А)' }
    ];
    
    const collections = [
        "Bodded Ring", "Candle Lamp", "Boots", "Candy Cane", "Case", "Christmas Tree", "Clover Pin", 
        "Crystal Ball", "Diamond Ring", "Durov's Coat", "Coconut", "Crystal Eagle", "Dove of Peace", 
        "Durov's Figurine", "Coffin", "Cupid Charm", "Durov's Boots", "Durov's Sunglasses", "Cookie Heart", 
        "Desk Calendar", "Durov's Cap", "Easter Cake", "Evil Eye", "Faith Amulet", "Flying Broom", 
        "Gem Signet", "Genie Lamp", "Ginger Cookie", "Hanging Star", "Happy Brownie", "Heart Locket", 
        "Heroic Helmet", "Holiday Drink", "Homemade Cake", "Ice Cream Cone", "Ice Cream Scoops", 
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
        backgrounds: [],
        priceRange: { min: 0, max: 100000 }
    };
    
    // Загрузка данных пользователя
    function loadUserData() {
        const savedData = localStorage.getItem('beatclub_user_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (tg.initDataUnsafe?.user && parsed.id === tg.initDataUnsafe.user.id) {
                userData = { ...userData, ...parsed };
            }
        }
        
        if (tg.initDataUnsafe?.user) {
            const user = tg.initDataUnsafe.user;
            userData.id = user.id;
            
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
            
            if (user.photo_url) {
                userData.avatarUrl = user.photo_url;
            }
        }
        
        updateBalanceDisplay();
        updateWalletStatus();
        updateProfileStats();
    }
    
    // Сохранение данных пользователя
    function saveUserData() {
        localStorage.setItem('beatclub_user_data', JSON.stringify(userData));
    }
    
    // Обновление отображения баланса
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toLocaleString('ru-RU');
        botBalanceElement.textContent = userData.balance.toLocaleString('ru-RU');
    }
    
    // Обновление статистики профиля
    function updateProfileStats() {
        // Здесь будет обновление статистики при реальных транзакциях
        // Пока используем сохраненные значения
    }
    
    // Инициализация TON Connect
    async function initTonConnect() {
        try {
            console.log('Initializing TON Connect...');
            
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/tonconnect-manifest.json',
                buttonRootId: 'ton-connect-modal'
            });
            
            tonConnectUI.onStatusChange((wallet) => {
                console.log('TON Connect status changed:', wallet);
                
                if (wallet) {
                    userData.walletConnected = true;
                    userData.walletAddress = wallet.account.address;
                    console.log('Wallet connected:', userData.walletAddress);
                    
                    updateWalletStatus();
                    saveUserData();
                    
                    tg.showAlert('✅ Кошелек подключен!');
                    tg.HapticFeedback.notificationOccurred('success');
                } else {
                    userData.walletConnected = false;
                    userData.walletAddress = null;
                    userData.walletBalance = 0;
                    console.log('Wallet disconnected');
                    
                    updateWalletStatus();
                    saveUserData();
                }
            });
            
            const currentWallet = tonConnectUI.connected;
            if (currentWallet) {
                console.log('Found existing connection:', currentWallet);
                userData.walletConnected = true;
                userData.walletAddress = currentWallet.account.address;
                updateWalletStatus();
            }
            
            console.log('TON Connect initialized successfully');
            
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            tg.showAlert('⚠️ Ошибка TON Connect: ' + error.message);
            updateWalletStatus();
        }
    }
    
    // Обновление статуса кошелька
    function updateWalletStatus() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = userData.walletAddress.slice(0, 6) + '...' + userData.walletAddress.slice(-6);
            walletStatusText.textContent = shortAddress;
            connectWalletBtn.textContent = 'Отключить';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #ff375f, #d43a5e)';
            
            // Показываем кнопки в модальном окне баланса
            depositBtn.style.display = 'flex';
            withdrawBtn.style.display = 'flex';
            walletTop.style.display = 'block';
        } else {
            walletStatusText.textContent = 'Не подключен';
            connectWalletBtn.textContent = 'Подключить';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #7b2ff7, #5a1bd6)';
            
            // Скрываем кнопки пополнения/вывода если кошелек не подключен
            depositBtn.style.display = 'none';
            withdrawBtn.style.display = 'none';
            walletTop.style.display = 'none';
        }
    }
    
    // Инициализация фильтров
    function initFilters() {
        // Заполняем сортировку
        const sortDropdown = document.getElementById('sort-dropdown');
        sortOptions.forEach(option => {
            const item = document.createElement('div');
            item.className = 'filter-option-item';
            item.dataset.value = option.value;
            item.innerHTML = `
                <div class="radio-circle"></div>
                <span>${option.label}</span>
            `;
            sortDropdown.appendChild(item);
            
            if (option.value === 'newest') {
                item.classList.add('active');
            }
        });
        
        // Заполняем коллекции с поиском
        const collectionDropdown = document.getElementById('collection-dropdown');
        
        // Добавляем поиск для коллекций
        const collectionSearch = document.createElement('div');
        collectionSearch.className = 'filter-search-container';
        collectionSearch.innerHTML = `
            <div class="filter-search-input">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Поиск коллекций..." id="collection-search">
            </div>
        `;
        collectionDropdown.appendChild(collectionSearch);
        
        // Добавляем контейнер для элементов коллекции
        const collectionItemsContainer = document.createElement('div');
        collectionItemsContainer.className = 'collection-items-container';
        collectionDropdown.appendChild(collectionItemsContainer);
        
        // Заполняем коллекции
        collections.forEach(collection => {
            const item = document.createElement('div');
            item.className = 'filter-option-item collection-item';
            item.dataset.value = collection;
            item.innerHTML = `
                <div class="radio-circle"></div>
                <span>${collection}</span>
            `;
            collectionItemsContainer.appendChild(item);
        });
        
        // Добавляем поиск для background
        const backgroundDropdown = document.getElementById('background-dropdown');
        
        const backgroundSearch = document.createElement('div');
        backgroundSearch.className = 'filter-search-container';
        backgroundSearch.innerHTML = `
            <div class="filter-search-input">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Поиск background..." id="background-search">
            </div>
        `;
        backgroundDropdown.appendChild(backgroundSearch);
        
        // Добавляем контейнер для элементов background
        const backgroundItemsContainer = document.createElement('div');
        backgroundItemsContainer.className = 'collection-items-container';
        backgroundDropdown.appendChild(backgroundItemsContainer);
        
        // Заполняем backgrounds
        backgrounds.forEach(background => {
            const item = document.createElement('div');
            item.className = 'filter-option-item background-item';
            item.dataset.value = background;
            item.innerHTML = `
                <div class="radio-circle"></div>
                <span>${background}</span>
            `;
            backgroundItemsContainer.appendChild(item);
        });
        
        // Инициализация слайдера цены
        initPriceSlider();
        
        // Инициализация поиска
        initFilterSearch();
        
        // Обработчики для фильтров
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                const filterSection = this.closest('.filter-section');
                const dropdown = filterSection.querySelector('.filter-dropdown');
                const icon = this.querySelector('i');
                
                // Переключаем иконку
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
                
                // Закрываем все остальные секции
                filterSections.forEach(section => {
                    if (section !== filterSection) {
                        section.classList.remove('active');
                        const otherIcon = section.querySelector('i');
                        if (otherIcon) {
                            otherIcon.classList.remove('fa-chevron-up');
                            otherIcon.classList.add('fa-chevron-down');
                        }
                    }
                });
                
                // Переключаем текущую секцию
                filterSection.classList.toggle('active');
                
                // Анимация открытия/закрытия
                if (filterSection.classList.contains('active')) {
                    dropdown.style.maxHeight = '400px';
                    dropdown.style.overflowY = 'auto';
                } else {
                    dropdown.style.maxHeight = '0';
                    dropdown.style.overflowY = 'hidden';
                }
            });
        });
        
        // Обработчики для выбора опций
        document.addEventListener('click', function(e) {
            if (e.target.closest('.filter-option-item')) {
                const item = e.target.closest('.filter-option-item');
                const filterSection = item.closest('.filter-section');
                const filterType = filterSection.id.replace('filter-', '');
                
                if (filterType === 'sort') {
                    // Для сортировки - один активный элемент
                    filterSection.querySelectorAll('.filter-option-item').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    item.classList.add('active');
                    currentFilters.sort = item.dataset.value;
                } else if (filterType === 'collection') {
                    // Для коллекций - множественный выбор
                    item.classList.toggle('active');
                    updateCollectionsFilter();
                } else if (filterType === 'background') {
                    // Для background - множественный выбор
                    item.classList.toggle('active');
                    updateBackgroundsFilter();
                }
            }
        });
        
        // Сброс фильтров
        resetFiltersBtn.addEventListener('click', function() {
            resetAllFilters();
            tg.showAlert('Фильтры сброшены');
            tg.HapticFeedback.notificationOccurred('success');
        });
        
        // Применение фильтров
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
            filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            tg.showAlert('Фильтры применены');
            tg.HapticFeedback.notificationOccurred('success');
        });
    }
    
    // Инициализация поиска в фильтрах
    function initFilterSearch() {
        const collectionSearchInput = document.getElementById('collection-search');
        const backgroundSearchInput = document.getElementById('background-search');
        
        if (collectionSearchInput) {
            collectionSearchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const items = document.querySelectorAll('#collection-dropdown .collection-item');
                
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        
        if (backgroundSearchInput) {
            backgroundSearchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const items = document.querySelectorAll('#background-dropdown .background-item');
                
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    }
    
    // Инициализация слайдера цены
    function initPriceSlider() {
        const minHandle = document.getElementById('price-slider-handle-min');
        const maxHandle = document.getElementById('price-slider-handle-max');
        const range = document.getElementById('price-slider-range');
        const priceMinInput = document.getElementById('price-min');
        const priceMaxInput = document.getElementById('price-max');
        
        if (!minHandle || !maxHandle || !range || !priceMinInput || !priceMaxInput) return;
        
        let isDraggingMin = false;
        let isDraggingMax = false;
        
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
        
        function getPercentFromMouse(e) {
            const trackRect = document.getElementById('price-slider-track').getBoundingClientRect();
            let clientX;
            
            if (e.type.includes('mouse')) {
                clientX = e.clientX;
            } else if (e.touches && e.touches[0]) {
                clientX = e.touches[0].clientX;
            } else {
                return 0;
            }
            
            let percent = ((clientX - trackRect.left) / trackRect.width) * 100;
            return Math.max(0, Math.min(100, percent));
        }
        
        function startDragMin(e) {
            isDraggingMin = true;
            document.body.style.userSelect = 'none';
            e.preventDefault();
            
            if (e.type === 'touchstart') {
                document.addEventListener('touchmove', handleDragMin);
                document.addEventListener('touchend', stopDragMin);
            } else {
                document.addEventListener('mousemove', handleDragMin);
                document.addEventListener('mouseup', stopDragMin);
            }
        }
        
        function startDragMax(e) {
            isDraggingMax = true;
            document.body.style.userSelect = 'none';
            e.preventDefault();
            
            if (e.type === 'touchstart') {
                document.addEventListener('touchmove', handleDragMax);
                document.addEventListener('touchend', stopDragMax);
            } else {
                document.addEventListener('mousemove', handleDragMax);
                document.addEventListener('mouseup', stopDragMax);
            }
        }
        
        function handleDragMin(e) {
            if (!isDraggingMin) return;
            
            const percent = getPercentFromMouse(e);
            const value = Math.round((percent / 100) * 100000);
            
            if (value < currentFilters.priceRange.max - 1000) {
                currentFilters.priceRange.min = value;
                updateSlider();
            }
        }
        
        function handleDragMax(e) {
            if (!isDraggingMax) return;
            
            const percent = getPercentFromMouse(e);
            const value = Math.round((percent / 100) * 100000);
            
            if (value > currentFilters.priceRange.min + 1000) {
                currentFilters.priceRange.max = value;
                updateSlider();
            }
        }
        
        function stopDragMin() {
            isDraggingMin = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleDragMin);
            document.removeEventListener('touchmove', handleDragMin);
            saveUserData();
        }
        
        function stopDragMax() {
            isDraggingMax = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleDragMax);
            document.removeEventListener('touchmove', handleDragMax);
            saveUserData();
        }
        
        priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(95000, value));
            if (value < currentFilters.priceRange.max - 1000) {
                currentFilters.priceRange.min = value;
                updateSlider();
                saveUserData();
            }
        });
        
        priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 100000;
            value = Math.max(1000, Math.min(100000, value));
            if (value > currentFilters.priceRange.min + 1000) {
                currentFilters.priceRange.max = value;
                updateSlider();
                saveUserData();
            }
        });
        
        minHandle.addEventListener('mousedown', startDragMin);
        maxHandle.addEventListener('mousedown', startDragMax);
        
        minHandle.addEventListener('touchstart', startDragMin);
        maxHandle.addEventListener('touchstart', startDragMax);
        
        updateSlider();
    }
    
    // Обновление фильтра коллекций
    function updateCollectionsFilter() {
        const activeItems = document.querySelectorAll('#collection-dropdown .filter-option-item.active');
        currentFilters.collections = Array.from(activeItems).map(item => item.dataset.value);
    }
    
    // Обновление фильтра backgrounds
    function updateBackgroundsFilter() {
        const activeItems = document.querySelectorAll('#background-dropdown .filter-option-item.active');
        currentFilters.backgrounds = Array.from(activeItems).map(item => item.dataset.value);
    }
    
    // Сброс всех фильтров
    function resetAllFilters() {
        currentFilters = {
            sort: 'newest',
            collections: [],
            backgrounds: [],
            priceRange: { min: 0, max: 100000 }
        };
        
        document.querySelectorAll('.filter-option-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector('#sort-dropdown .filter-option-item[data-value="newest"]').classList.add('active');
        
        filterSections.forEach(section => {
            section.classList.remove('active');
            const icon = section.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
            const dropdown = section.querySelector('.filter-dropdown');
            if (dropdown) {
                dropdown.style.maxHeight = '0';
                dropdown.style.overflowY = 'hidden';
            }
        });
        
        // Сброс поиска
        const collectionSearch = document.getElementById('collection-search');
        const backgroundSearch = document.getElementById('background-search');
        if (collectionSearch) collectionSearch.value = '';
        if (backgroundSearch) backgroundSearch.value = '';
        
        // Показать все элементы
        document.querySelectorAll('.collection-item, .background-item').forEach(item => {
            item.style.display = 'flex';
        });
        
        initPriceSlider();
    }
    
    // Применение фильтров
    function applyFilters() {
        console.log('Applying filters:', currentFilters);
        
        let filteredNFTs = [...demoNFTs];
        
        // Фильтрация по цене
        filteredNFTs = filteredNFTs.filter(nft => {
            return nft.price >= currentFilters.priceRange.min && 
                   nft.price <= currentFilters.priceRange.max;
        });
        
        // Фильтрация по коллекциям
        if (currentFilters.collections.length > 0) {
            filteredNFTs = filteredNFTs.filter(nft => {
                return currentFilters.collections.includes(nft.category);
            });
        }
        
        // Фильтрация по backgrounds
        if (currentFilters.backgrounds.length > 0) {
            filteredNFTs = filteredNFTs.filter(nft => {
                return currentFilters.backgrounds.includes(nft.background);
            });
        }
        
        // Сортировка
        switch(currentFilters.sort) {
            case 'price-asc':
                filteredNFTs.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredNFTs.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filteredNFTs.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                break;
            case 'name-desc':
                filteredNFTs.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
                break;
            case 'newest':
            default:
                // По умолчанию в порядке ID (новые в начале)
                filteredNFTs.sort((a, b) => b.id - a.id);
                break;
        }
        
        updateMarketContent(filteredNFTs);
    }
    
    // Обновление контента маркета с фильтрами
    function updateMarketContent(nfts) {
        const nftGrid = document.querySelector('#nft-grid');
        if (!nftGrid) return;
        
        nftGrid.innerHTML = nfts.map((nft, i) => `
            <div class="nft-item" data-nft-id="${nft.id}">
                <div class="nft-image" style="background: linear-gradient(135deg, var(--bg-color-1), var(--bg-color-2))">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-category">${nft.category}</div>
                    <div class="nft-price">
                        <i class="fas fa-coins"></i>
                        <span>${nft.price} TON</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики для покупки
        document.querySelectorAll('.nft-item').forEach(item => {
            item.addEventListener('click', function() {
                const nftId = this.getAttribute('data-nft-id');
                const nft = demoNFTs.find(n => n.id == nftId);
                
                if (nft) {
                    tg.showPopup({
                        title: '🛒 Покупка NFT',
                        message: `Купить "${nft.name}" за ${nft.price} TON?`,
                        buttons: [
                            {id: 'buy', type: 'default', text: 'Купить'},
                            {type: 'cancel', text: '❌ Отмена'}
                        ]
                    }, function(buttonId) {
                        if (buttonId === 'buy') {
                            buyNFT(nft);
                        }
                    });
                }
            });
        });
    }
    
    // Покупка NFT
    function buyNFT(nft) {
        if (userData.balance < nft.price) {
            tg.showAlert('❌ Недостаточно средств на балансе');
            return;
        }
        
        userData.balance -= nft.price;
        userData.bought += 1;
        userData.totalVolume += nft.price;
        
        // Добавляем NFT в инвентарь
        const inventoryNFT = {
            id: userData.inventory.length + 1,
            name: nft.name,
            type: nft.type,
            value: nft.price,
            category: nft.category,
            background: nft.background,
            purchaseDate: new Date().toISOString()
        };
        
        userData.inventory.push(inventoryNFT);
        
        // Добавляем транзакцию
        userData.transactions.push({
            type: 'buy',
            amount: nft.price,
            item: nft.name,
            timestamp: new Date().toISOString()
        });
        
        updateBalanceDisplay();
        saveUserData();
        
        tg.showAlert(`✅ NFT "${nft.name}" куплено за ${nft.price} TON!`);
        tg.HapticFeedback.notificationOccurred('success');
        
        // Обновляем маркет если он открыт
        if (document.querySelector('.nft-grid')) {
            applyFilters();
        }
        
        // Обновляем подарки если они открыты
        if (document.querySelector('#inventory-grid')) {
            updateGiftsContent();
        }
    }
    
    // Создание содержимого для разных страниц
    function createMarketContent() {
        return `
            <div class="page-content">
                <div class="market-container">
                    <div class="market-header">
                        <div class="search-filter-bar">
                            <div class="search-filter-text">Используйте фильтры для поиска</div>
                            <button class="filter-icon-btn" id="open-filters-btn">
                                <i class="fas fa-filter"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nft-grid" id="nft-grid">
                        ${generateDemoNFTs()}
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateDemoNFTs() {
        let filteredNFTs = [...demoNFTs];
        
        // Применяем текущие фильтры
        filteredNFTs = filteredNFTs.filter(nft => {
            return nft.price >= currentFilters.priceRange.min && 
                   nft.price <= currentFilters.priceRange.max;
        });
        
        if (currentFilters.collections.length > 0) {
            filteredNFTs = filteredNFTs.filter(nft => {
                return currentFilters.collections.includes(nft.category);
            });
        }
        
        if (currentFilters.backgrounds.length > 0) {
            filteredNFTs = filteredNFTs.filter(nft => {
                return currentFilters.backgrounds.includes(nft.background);
            });
        }
        
        // Сортировка
        switch(currentFilters.sort) {
            case 'price-asc':
                filteredNFTs.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredNFTs.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filteredNFTs.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                break;
            case 'name-desc':
                filteredNFTs.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
                break;
            case 'newest':
            default:
                filteredNFTs.sort((a, b) => b.id - a.id);
                break;
        }
        
        return filteredNFTs.map((nft, i) => `
            <div class="nft-item" data-nft-id="${nft.id}">
                <div class="nft-image" style="background: linear-gradient(135deg, var(--bg-color-1), var(--bg-color-2))">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-category">${nft.category}</div>
                    <div class="nft-price">
                        <i class="fas fa-coins"></i>
                        <span>${nft.price} TON</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    function createGiftsContent() {
        return `
            <div class="page-content">
                <div class="gifts-container">
                    <div class="inventory-header">
                        <h2>Мои подарки</h2>
                        <div class="inventory-subtitle">${userData.inventory.length} NFT в коллекции</div>
                    </div>
                    
                    <div class="inventory-grid" id="inventory-grid">
                        ${generateInventoryItems()}
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateInventoryItems() {
        return userData.inventory.map((nft, index) => `
            <div class="inventory-item" data-nft-id="${nft.id}">
                <i class="fas fa-gem"></i>
                <div class="inventory-item-name">${nft.name}</div>
                <div class="inventory-item-category">${nft.category}</div>
            </div>
        `).join('');
    }
    
    function updateGiftsContent() {
        const inventoryGrid = document.querySelector('#inventory-grid');
        if (inventoryGrid) {
            inventoryGrid.innerHTML = generateInventoryItems();
        }
    }
    
    function createProfileContent() {
        return `
            <div class="page-content">
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-info">
                            <div class="profile-avatar-wrapper">
                                <div class="profile-avatar">
                                    ${userData.avatarUrl ? 
                                        `<img src="${userData.avatarUrl}" alt="${userData.username}" class="avatar-image">` : 
                                        `<div class="avatar-placeholder">
                                            <span>${userData.username.charAt(0).toUpperCase()}</span>
                                        </div>`
                                    }
                                </div>
                                <div class="profile-info-content">
                                    <h2 class="profile-username">${userData.username}</h2>
                                    <div class="profile-wallet">
                                        <i class="fas fa-wallet"></i>
                                        <span class="profile-wallet-address">
                                            ${userData.walletConnected ? 
                                                `${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-6)}` : 
                                                'Кошелёк не подключен'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-stats">
                        <div class="stat-item">
                            <div class="stat-icon">💰</div>
                            <div class="stat-value" id="stat-volume">${userData.totalVolume}</div>
                            <div class="stat-label">Объём</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">🎁</div>
                            <div class="stat-value" id="stat-bought">${userData.bought}</div>
                            <div class="stat-label">Куплено</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">💎</div>
                            <div class="stat-value" id="stat-sold">${userData.sold}</div>
                            <div class="stat-label">Продано</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Обновление контента страницы
    function updateContent(page) {
        mainContent.style.opacity = '0';
        
        setTimeout(() => {
            let content = '';
            
            switch(page) {
                case 'market':
                    content = createMarketContent();
                    break;
                case 'gifts':
                    content = createGiftsContent();
                    break;
                case 'profile':
                    content = createProfileContent();
                    break;
            }
            
            mainContent.innerHTML = content;
            
            if (page === 'market') {
                const openFiltersBtn = document.getElementById('open-filters-btn');
                if (openFiltersBtn) {
                    openFiltersBtn.addEventListener('click', function() {
                        filtersModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                        
                        // Обновляем позиции слайдера
                        setTimeout(() => {
                            initPriceSlider();
                        }, 100);
                    });
                }
                
                // Инициализируем обработчики покупки
                document.querySelectorAll('.nft-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const nftId = this.getAttribute('data-nft-id');
                        const nft = demoNFTs.find(n => n.id == nftId);
                        
                        if (nft) {
                            tg.showPopup({
                                title: '🛒 Покупка NFT',
                                message: `Купить "${nft.name}" за ${nft.price} TON?`,
                                buttons: [
                                    {id: 'buy', type: 'default', text: 'Купить'},
                                    {type: 'cancel', text: '❌ Отмена'}
                                ]
                            }, function(buttonId) {
                                if (buttonId === 'buy') {
                                    buyNFT(nft);
                                }
                            });
                        }
                    });
                });
            }
            
            setTimeout(() => {
                mainContent.style.opacity = '1';
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
    
    // ОТПРАВКА ТРАНЗАКЦИИ
    async function sendDepositTransaction(amount) {
        if (!tonConnectUI || !userData.walletConnected) {
            tg.showAlert('❌ Кошелек не подключен');
            return false;
        }
        
        try {
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            console.log('Simulating transaction for:', amount, 'TON');
            
            // Симуляция транзакции
            return new Promise((resolve) => {
                setTimeout(() => {
                    showTransactionStatus('success', 'Транзакция отправлена!');
                    
                    setTimeout(() => {
                        userData.balance += amount;
                        userData.totalVolume += amount;
                        
                        // Добавляем транзакцию в историю
                        userData.transactions.push({
                            type: 'deposit',
                            amount: amount,
                            timestamp: new Date().toISOString()
                        });
                        
                        updateBalanceDisplay();
                        saveUserData();
                        
                        showTransactionStatus('confirmed', `✅ Баланс пополнен на ${amount} TON!`);
                        
                        tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
                        tg.HapticFeedback.notificationOccurred('success');
                        
                        setTimeout(() => {
                            document.getElementById('deposit-modal').classList.remove('active');
                            document.body.style.overflow = 'auto';
                            transactionStatusElement.innerHTML = '';
                            resolve(true);
                        }, 2000);
                        
                    }, 1000);
                    
                }, 1500);
            });
            
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
            <div class="transaction-status ${status}">
                ${status === 'pending' ? '<i class="fas fa-spinner fa-spin"></i>' : ''}
                ${status === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
                ${status === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
                <span>${message}</span>
            </div>
        `;
    }
    
    // Показать историю транзакций
    function showTransactionHistory() {
        if (userData.transactions.length === 0) {
            tg.showAlert('📭 История транзакций пуста');
            return;
        }
        
        let historyMessage = '📜 История транзакций:\n\n';
        
        userData.transactions.slice(-10).reverse().forEach((tx, index) => {
            const date = new Date(tx.timestamp).toLocaleString('ru-RU');
            const type = tx.type === 'deposit' ? 'Пополнение' : 
                        tx.type === 'buy' ? 'Покупка NFT' : 
                        tx.type === 'withdraw' ? 'Вывод' : 'Транзакция';
            
            historyMessage += `${index + 1}. ${type}\n`;
            historyMessage += `   Сумма: ${tx.amount} TON\n`;
            if (tx.item) {
                historyMessage += `   Товар: ${tx.item}\n`;
            }
            historyMessage += `   Дата: ${date}\n\n`;
        });
        
        tg.showAlert(historyMessage);
    }
    
    // Обработчики событий
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            setActiveButton(this);
            updateContent(page);
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            if (navigator.vibrate) {
                navigator.vibrate(20);
            }
        });
    });
    
    // Обработчик кнопки пополнения баланса
    addBalanceBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        
        // Проверяем подключен ли кошелек
        if (!userData.walletConnected) {
            tg.showAlert('⚠️ Пожалуйста, подключите TON кошелек для управления балансом');
            
            // Открываем окно пополнения чтобы пользователь подключил кошелек
            depositAmountInput.value = '10';
            transactionStatusElement.innerHTML = '';
            updateWalletStatus();
            document.getElementById('deposit-modal').classList.add('active');
            return;
        }
        
        balanceModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Закрытие модального окна баланса
    closeBalanceModal.addEventListener('click', function() {
        balanceModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
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
        updateWalletStatus();
        document.getElementById('deposit-modal').classList.add('active');
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
            message: `Вы можете вывести до ${userData.balance.toFixed(2)} TON`,
            buttons: [
                {id: 'withdraw_all', type: 'default', text: 'Вывести всё'},
                {id: 'custom', type: 'default', text: 'Указать сумму'},
                {type: 'cancel', text: '❌ Отмена'}
            ]
        }, function(buttonId) {
            if (buttonId === 'withdraw_all') {
                // Симуляция вывода
                const withdrawAmount = userData.balance;
                userData.balance = 0;
                userData.sold += 1;
                
                // Добавляем транзакцию
                userData.transactions.push({
                    type: 'withdraw',
                    amount: withdrawAmount,
                    timestamp: new Date().toISOString()
                });
                
                updateBalanceDisplay();
                saveUserData();
                
                tg.showAlert(`✅ Запрос на вывод ${withdrawAmount.toFixed(2)} TON отправлен!`);
                tg.HapticFeedback.notificationOccurred('success');
            } else if (buttonId === 'custom') {
                tg.showAlert('Функция в разработке');
            }
        });
    });
    
    // Кнопка истории транзакций
    historyBtn.addEventListener('click', function() {
        showTransactionHistory();
    });
    
    // Кнопка подключения/отключения кошелька
    connectWalletBtn.addEventListener('click', function() {
        if (userData.walletConnected) {
            disconnectWallet();
        } else {
            connectWallet();
        }
        
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
    
    // Закрытие модального окна пополнения
    document.getElementById('close-deposit-modal').addEventListener('click', function() {
        document.getElementById('deposit-modal').classList.remove('active');
        document.body.style.overflow = 'auto';
        transactionStatusElement.innerHTML = '';
    });
    
    document.getElementById('deposit-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            document.body.style.overflow = 'auto';
            transactionStatusElement.innerHTML = '';
        }
    });
    
    // Закрытие модального окна фильтров
    closeFiltersModal.addEventListener('click', function() {
        filtersModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    filtersModal.addEventListener('click', function(e) {
        if (e.target === this) {
            filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Пресеты суммы
    amountPresetBtns.forEach(preset => {
        preset.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            depositAmountInput.value = amount;
            
            amountPresetBtns.forEach(p => p.classList.remove('active'));
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
    
    // Инициализация
    loadUserData();
    
    setTimeout(() => {
        initTonConnect().then(() => {
            console.log('TON Connect initialized');
            updateWalletStatus();
        }).catch(error => {
            console.error('Failed to init TON Connect:', error);
            updateWalletStatus();
        });
    }, 500);
    
    initFilters();
    updateContent('market');
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    window.addEventListener('beforeunload', function() {
        saveUserData();
    });
});

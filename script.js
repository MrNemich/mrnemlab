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
    const priceSliderTrack = document.getElementById('price-slider-track');
    const priceSliderRange = document.getElementById('price-slider-range');
    const priceSliderHandleMin = document.getElementById('price-slider-handle-min');
    const priceSliderHandleMax = document.getElementById('price-slider-handle-max');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    
    // Инициализация TON Connect
    let tonConnectUI = null;
    
    // Текущий пользователь
    let userData = {
        id: null,
        balance: 0, // НАЧИНАЕМ С 0
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 0, // НАЧИНАЕМ С 0
        sold: 0, // НАЧИНАЕМ С 0
        totalVolume: 0, // НАЧИНАЕМ С 0
        transactions: [],
        inventory: []
    };
    
    // Демо инвентарь NFT (12 элементов для 2 колонок x 4 ряда)
    const demoNFTs = [
        { id: 1, name: "Bodded Ring", type: "ring", price: 150, category: "Кольца" },
        { id: 2, name: "Crystal Ball", type: "magic", price: 89, category: "Магия" },
        { id: 3, name: "Diamond Ring", type: "ring", price: 250, category: "Кольца" },
        { id: 4, name: "Genie Lamp", type: "magic", price: 120, category: "Магия" },
        { id: 5, name: "Heroic Helmet", type: "armor", price: 75, category: "Доспехи" },
        { id: 6, name: "Moon Pendant", type: "jewelry", price: 95, category: "Украшения" },
        { id: 7, name: "Golden Cup", type: "artifact", price: 200, category: "Артефакты" },
        { id: 8, name: "Magic Wand", type: "magic", price: 150, category: "Магия" },
        { id: 9, name: "Silver Sword", type: "weapon", price: 110, category: "Оружие" },
        { id: 10, name: "Dragon Scale", type: "armor", price: 180, category: "Доспехи" },
        { id: 11, name: "Phoenix Feather", type: "artifact", price: 300, category: "Артефакты" },
        { id: 12, name: "Wizard Hat", type: "armor", price: 80, category: "Доспехи" }
    ];
    
    // Данные для фильтров
    const collections = [
        "Кольца", "Магия", "Доспехи", "Украшения", "Артефакты", "Оружие"
    ];
    
    // Текущие фильтры
    let currentFilters = {
        sort: 'newest',
        collections: [],
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
        // Заполняем коллекции
        const collectionDropdown = document.getElementById('collection-dropdown');
        collections.forEach(collection => {
            const item = document.createElement('div');
            item.className = 'filter-option-item';
            item.dataset.value = collection;
            item.innerHTML = `
                <div class="radio-circle"></div>
                <span>${collection}</span>
            `;
            collectionDropdown.appendChild(item);
        });
        
        // Инициализация слайдера цены
        initPriceSlider();
        
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
                    dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
                } else {
                    dropdown.style.maxHeight = '0';
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
    
    // Инициализация слайдера цены
    function initPriceSlider() {
        const minHandle = priceSliderHandleMin;
        const maxHandle = priceSliderHandleMax;
        const range = priceSliderRange;
        
        let isDraggingMin = false;
        let isDraggingMax = false;
        let trackRect = priceSliderTrack.getBoundingClientRect();
        
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
            trackRect = priceSliderTrack.getBoundingClientRect();
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
    
    // Сброс всех фильтров
    function resetAllFilters() {
        currentFilters = {
            sort: 'newest',
            collections: [],
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
            }
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
        
        // Сортировка
        switch(currentFilters.sort) {
            case 'price-asc':
                filteredNFTs.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredNFTs.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                // По умолчанию в порядке ID
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
                <div class="nft-image">
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
                const nft = nfts.find(n => n.id == nftId);
                
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
        return demoNFTs.map((nft, i) => `
            <div class="nft-item" data-nft-id="${nft.id}">
                <div class="nft-image">
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
            </div>
        `).join('');
    }
    
    function createProfileContent() {
        return `
            <div class="page-content">
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${userData.avatarUrl ? 
                                `<img src="${userData.avatarUrl}" alt="${userData.username}" class="avatar-image">` : 
                                `<div class="avatar-placeholder">
                                    <span>${userData.username.charAt(0).toUpperCase()}</span>
                                </div>`
                            }
                        </div>
                        <div class="profile-info">
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
                userData.balance = 0;
                userData.sold += 1;
                
                // Добавляем транзакцию
                userData.transactions.push({
                    type: 'withdraw',
                    amount: userData.balance,
                    timestamp: new Date().toISOString()
                });
                
                updateBalanceDisplay();
                saveUserData();
                
                tg.showAlert(`✅ Запрос на вывод ${userData.balance.toFixed(2)} TON отправлен!`);
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

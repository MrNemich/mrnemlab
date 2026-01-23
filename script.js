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
        balance: 100,
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 5,
        sold: 3,
        totalVolume: 2450,
        inventory: []
    };
    
    // Демо инвентарь NFT
    const demoInventory = [
        { id: 1, name: "Bodded Ring", type: "ring", value: 150 },
        { id: 2, name: "Crystal Ball", type: "magic", value: 89 },
        { id: 3, name: "Diamond Ring", type: "ring", value: 250 },
        { id: 4, name: "Genie Lamp", type: "magic", value: 120 },
        { id: 5, name: "Heroic Helmet", type: "armor", value: 75 }
    ];
    
    // Данные для фильтров
    const collections = [
        "Bodded Ring", "Crystal Ball", "Diamond Ring", "Genie Lamp", "Heroic Helmet",
        "Moon Pendant", "Golden Cup", "Magic Wand", "Silver Sword", "Dragon Scale"
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
            
            userData.inventory = demoInventory;
        }
        
        updateBalanceDisplay();
        updateWalletStatus();
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
        } else {
            walletStatusText.textContent = 'Не подключен';
            connectWalletBtn.textContent = 'Подключить';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #7b2ff7, #5a1bd6)';
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
                const filterType = this.dataset.filter;
                
                // Закрываем все остальные секции
                filterSections.forEach(section => {
                    if (section !== filterSection) {
                        section.classList.remove('active');
                    }
                });
                
                // Переключаем текущую секцию
                filterSection.classList.toggle('active');
                
                // Если секция открыта, перемещаем её в начало
                if (filterSection.classList.contains('active')) {
                    filterSections.forEach((section, index) => {
                        if (section !== filterSection && section.classList.contains('active')) {
                            section.style.order = index;
                        }
                    });
                    filterSection.style.order = '-1';
                } else {
                    filterSection.style.order = '';
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
            performSearch();
            filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            tg.showAlert('Фильтры применены');
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
        
        function startDragMin(e) {
            isDraggingMin = true;
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }
        
        function startDragMax(e) {
            isDraggingMax = true;
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }
        
        function stopDrag() {
            isDraggingMin = false;
            isDraggingMax = false;
            document.body.style.userSelect = '';
        }
        
        function handleDrag(e) {
            if (!isDraggingMin && !isDraggingMax) return;
            
            const rect = priceSliderTrack.getBoundingClientRect();
            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            let percent = ((x - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            const value = Math.round((percent / 100) * 100000);
            
            if (isDraggingMin) {
                if (value < currentFilters.priceRange.max - 1000) {
                    currentFilters.priceRange.min = value;
                }
            } else if (isDraggingMax) {
                if (value > currentFilters.priceRange.min + 1000) {
                    currentFilters.priceRange.max = value;
                }
            }
            
            updateSlider();
        }
        
        priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(95000, value));
            if (value < currentFilters.priceRange.max - 1000) {
                currentFilters.priceRange.min = value;
                updateSlider();
            }
        });
        
        priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 100000;
            value = Math.max(1000, Math.min(100000, value));
            if (value > currentFilters.priceRange.min + 1000) {
                currentFilters.priceRange.max = value;
                updateSlider();
            }
        });
        
        minHandle.addEventListener('mousedown', startDragMin);
        maxHandle.addEventListener('mousedown', startDragMax);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mousemove', handleDrag);
        
        minHandle.addEventListener('touchstart', startDragMin);
        maxHandle.addEventListener('touchstart', startDragMax);
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchmove', handleDrag);
        
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
            priceRange: { min: 0, max: 100000 },
            backgrounds: []
        };
        
        document.querySelectorAll('.filter-option-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector('#sort-dropdown .filter-option-item[data-value="newest"]').classList.add('active');
        
        filterSections.forEach(section => {
            section.classList.remove('active');
            section.style.order = '';
        });
        
        initPriceSlider();
    }
    
    // Поиск по фильтрам
    function performSearch() {
        console.log('Searching with filters:', currentFilters);
        // Здесь будет логика поиска NFT по фильтрам
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
        const demoNFTs = [
            { name: "Bodded Ring", price: 150 },
            { name: "Crystal Ball", price: 89 },
            { name: "Diamond Ring", price: 250 },
            { name: "Genie Lamp", price: 120 },
            { name: "Heroic Helmet", price: 75 },
            { name: "Moon Pendant", price: 95 }
        ];
        
        return demoNFTs.map((nft, i) => `
            <div class="nft-item" data-nft-id="${i}">
                <div class="nft-image">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
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
                                `<img src="${userData.avatarUrl}" alt="${userData.username}">` : 
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
                            <div class="stat-value">${userData.totalVolume}</div>
                            <div class="stat-label">Объём</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">🎁</div>
                            <div class="stat-value">${userData.bought}</div>
                            <div class="stat-label">Куплено</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">💎</div>
                            <div class="stat-value">${userData.sold}</div>
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
                    });
                }
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
            
            setTimeout(() => {
                showTransactionStatus('success', 'Транзакция отправлена!');
                
                setTimeout(() => {
                    userData.balance += amount;
                    userData.totalVolume += amount;
                    updateBalanceDisplay();
                    saveUserData();
                    
                    showTransactionStatus('confirmed', `✅ Баланс пополнен на ${amount} TON!`);
                    
                    tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    setTimeout(() => {
                        document.getElementById('deposit-modal').classList.remove('active');
                        document.body.style.overflow = 'auto';
                        transactionStatusElement.innerHTML = '';
                    }, 2000);
                    
                }, 1000);
                
            }, 1500);
            
            return true;
            
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
                tg.showAlert(`✅ Запрос на вывод ${userData.balance.toFixed(2)} TON отправлен!`);
                tg.HapticFeedback.notificationOccurred('success');
            } else if (buttonId === 'custom') {
                tg.showAlert('Функция в разработке');
            }
        });
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

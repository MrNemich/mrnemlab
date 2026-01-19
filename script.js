// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    
    // Инициализируем приложение
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Получаем элементы DOM
    const elements = {
        // Основные элементы
        navButtons: document.querySelectorAll('.nav-button'),
        mainContent: document.getElementById('main-content'),
        balanceAmount: document.getElementById('balance-amount'),
        addBalanceBtn: document.getElementById('add-balance-btn'),
        
        // Модальные окна
        balanceModal: document.getElementById('balance-modal'),
        depositModal: document.getElementById('deposit-modal'),
        filtersModal: document.getElementById('filters-modal'),
        
        // Кнопки закрытия
        closeBalanceModal: document.getElementById('close-balance-modal'),
        closeDepositModal: document.getElementById('close-deposit-modal'),
        closeFiltersModal: document.getElementById('close-filters-modal'),
        
        // Элементы баланса
        botBalanceElement: document.getElementById('bot-balance'),
        depositBtn: document.getElementById('deposit-btn'),
        withdrawBtn: document.getElementById('withdraw-btn'),
        
        // Элементы пополнения
        depositAmountInput: document.getElementById('deposit-amount-input'),
        amountPresets: document.querySelectorAll('.amount-preset'),
        confirmDepositBtn: document.getElementById('confirm-deposit-btn'),
        transactionStatus: document.getElementById('transaction-status'),
        
        // Элементы кошелька
        connectWalletBtn: document.getElementById('connect-wallet-btn'),
        disconnectWalletBtn: document.getElementById('disconnect-wallet-btn'),
        walletStatusIndicator: document.getElementById('wallet-status-indicator'),
        walletInfo: document.getElementById('wallet-info'),
        
        // Элементы фильтров
        filterSections: document.querySelectorAll('.filter-section'),
        filterOptions: document.querySelectorAll('.filter-option'),
        resetFiltersBtn: document.getElementById('reset-filters-btn'),
        applyFiltersBtn: document.getElementById('apply-filters-btn'),
        
        // Слайдер цены
        priceSliderTrack: document.getElementById('price-slider-track'),
        priceSliderRange: document.getElementById('price-slider-range'),
        priceSliderHandleMin: document.getElementById('price-slider-handle-min'),
        priceSliderHandleMax: document.getElementById('price-slider-handle-max'),
        priceMinInput: document.getElementById('price-min'),
        priceMaxInput: document.getElementById('price-max'),
        priceRangeMin: document.getElementById('price-range-min'),
        priceRangeMax: document.getElementById('price-range-max'),
        
        // Поиск коллекций
        collectionSearch: document.getElementById('collection-search'),
        collectionsList: document.querySelector('.collections-list'),
        
        // Кнопки редкости
        traitButtons: document.querySelectorAll('.trait-btn'),
        
        // Элементы выбранных значений
        sortSelected: document.getElementById('sort-selected'),
        priceSelected: document.getElementById('price-selected'),
        collectionSelected: document.getElementById('collection-selected'),
        traitsSelected: document.getElementById('traits-selected')
    };
    
    // Данные пользователя
    let userData = {
        id: null,
        balance: 1500,
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 12,
        sold: 8,
        totalVolume: 8450,
        inventory: []
    };
    
    // Демо инвентарь NFT
    const demoInventory = [
        { id: 1, name: "Bodded Ring", type: "ring", value: 150 },
        { id: 2, name: "Crystal Ball", type: "magic", value: 89 },
        { id: 3, name: "Diamond Ring", type: "ring", value: 250 },
        { id: 4, name: "Genie Lamp", type: "magic", value: 120 },
        { id: 5, name: "Heroic Helmet", type: "armor", value: 75 },
        { id: 6, name: "Moon Pendant", type: "jewelry", value: 95 }
    ];
    
    // Демо коллекции для фильтров
    const collections = [
        { id: 1, name: "Bodded Ring", count: 42 },
        { id: 2, name: "Crystal Ball", count: 28 },
        { id: 3, name: "Diamond Ring", count: 15 },
        { id: 4, name: "Genie Lamp", count: 31 },
        { id: 5, name: "Heroic Helmet", count: 56 },
        { id: 6, name: "Moon Pendant", count: 23 },
        { id: 7, name: "Golden Cup", count: 19 },
        { id: 8, name: "Magic Wand", count: 37 },
        { id: 9, name: "Silver Sword", count: 48 },
        { id: 10, name: "Dragon Egg", count: 12 },
        { id: 11, name: "Phoenix Feather", count: 7 },
        { id: 12, name: "Unicorn Horn", count: 5 }
    ];
    
    // Текущие фильтры
    let currentFilters = {
        sort: 'newest',
        priceRange: { min: 0, max: 10000 },
        collections: [],
        traits: []
    };
    
    // TON Connect UI
    let tonConnectUI = null;
    
    // Инициализация приложения
    function initApp() {
        loadUserData();
        setupEventListeners();
        initTONConnect();
        initFilters();
        updateContent('market');
        
        // Плавное появление
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
        
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
    }
    
    // Загрузка данных пользователя
    function loadUserData() {
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
            
            // Загружаем инвентарь
            userData.inventory = [...demoInventory];
            
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
        elements.balanceAmount.textContent = userData.balance.toLocaleString('ru-RU');
        elements.botBalanceElement.textContent = userData.balance.toLocaleString('ru-RU');
    }
    
    // Инициализация TON Connect
    async function initTONConnect() {
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
                    
                    // Обновляем UI
                    updateWalletDisplay();
                    
                    // Сохраняем
                    saveUserData();
                    
                    // Уведомление
                    tg.showAlert('✅ Кошелек подключен!');
                    tg.HapticFeedback.notificationOccurred('success');
                } else {
                    // Кошелек отключен
                    userData.walletConnected = false;
                    userData.walletAddress = null;
                    userData.walletBalance = 0;
                    console.log('Wallet disconnected');
                    
                    // Обновляем UI
                    updateWalletDisplay();
                    
                    // Сохраняем
                    saveUserData();
                }
            });
            
            // Восстанавливаем соединение если было
            const currentWallet = tonConnectUI.connected;
            if (currentWallet) {
                console.log('Found existing connection:', currentWallet);
                userData.walletConnected = true;
                userData.walletAddress = currentWallet.account.address;
                updateWalletDisplay();
            }
            
            console.log('TON Connect initialized successfully');
            
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            tg.showAlert('⚠️ Ошибка TON Connect: ' + error.message);
            
            // Fallback для демо
            updateWalletDisplay();
        }
    }
    
    // Обновление отображения кошелька
    function updateWalletDisplay() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = userData.walletAddress.slice(0, 6) + '...' + userData.walletAddress.slice(-6);
            
            // Обновляем статус
            elements.walletStatusIndicator.innerHTML = `
                <div class="status-dot connected"></div>
                <span>Подключен</span>
            `;
            
            // Обновляем информацию о кошельке
            elements.walletInfo.innerHTML = `
                <div class="wallet-details">
                    <div class="wallet-address">
                        <i class="fas fa-wallet"></i>
                        <div class="address-info">
                            <div class="address-label">Адрес кошелька</div>
                            <div class="address-value">${shortAddress}</div>
                        </div>
                    </div>
                    <div class="wallet-balance-display">
                        <div class="balance-label">Баланс кошелька</div>
                        <div class="balance-value">${userData.walletBalance.toFixed(2)} TON</div>
                    </div>
                </div>
            `;
            
            // Показываем кнопку отключения
            elements.connectWalletBtn.style.display = 'none';
            elements.disconnectWalletBtn.style.display = 'flex';
            
        } else {
            // Обновляем статус
            elements.walletStatusIndicator.innerHTML = `
                <div class="status-dot disconnected"></div>
                <span>Не подключен</span>
            `;
            
            // Сбрасываем информацию о кошельке
            elements.walletInfo.innerHTML = `
                <div class="wallet-placeholder">
                    <i class="fas fa-wallet"></i>
                    <p>Подключите TON кошелёк для пополнения баланса</p>
                </div>
            `;
            
            // Показываем кнопку подключения
            elements.connectWalletBtn.style.display = 'flex';
            elements.disconnectWalletBtn.style.display = 'none';
        }
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
    
    // Инициализация фильтров
    function initFilters() {
        // Заполняем коллекции
        renderCollections();
        
        // Инициализация слайдера цены
        initPriceSlider();
        
        // Устанавливаем обработчики для фильтров
        setupFilterHandlers();
    }
    
    // Рендер коллекций
    function renderCollections(filterText = '') {
        elements.collectionsList.innerHTML = '';
        
        const filteredCollections = collections.filter(collection =>
            collection.name.toLowerCase().includes(filterText.toLowerCase())
        );
        
        filteredCollections.forEach(collection => {
            const isActive = currentFilters.collections.includes(collection.id);
            const item = document.createElement('div');
            item.className = `collection-item ${isActive ? 'active' : ''}`;
            item.dataset.id = collection.id;
            item.innerHTML = `
                <div class="collection-checkbox">
                    ${isActive ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="collection-name">${collection.name}</div>
                <div class="collection-count">${collection.count}</div>
            `;
            elements.collectionsList.appendChild(item);
        });
        
        // Обновляем выбранное значение
        updateCollectionSelected();
    }
    
    // Инициализация слайдера цены
    function initPriceSlider() {
        const trackWidth = elements.priceSliderTrack.offsetWidth;
        let isDraggingMin = false;
        let isDraggingMax = false;
        
        // Позиционируем элементы
        function updateSlider() {
            const minPercent = (currentFilters.priceRange.min / 10000) * 100;
            const maxPercent = (currentFilters.priceRange.max / 10000) * 100;
            
            elements.priceSliderHandleMin.style.left = `${minPercent}%`;
            elements.priceSliderHandleMax.style.left = `${maxPercent}%`;
            elements.priceSliderRange.style.left = `${minPercent}%`;
            elements.priceSliderRange.style.width = `${maxPercent - minPercent}%`;
            
            // Обновляем инпуты
            elements.priceMinInput.value = currentFilters.priceRange.min;
            elements.priceMaxInput.value = currentFilters.priceRange.max;
            
            // Обновляем отображение
            elements.priceRangeMin.textContent = `${currentFilters.priceRange.min} TON`;
            elements.priceRangeMax.textContent = `${currentFilters.priceRange.max} TON`;
            
            // Обновляем выбранное значение
            updatePriceSelected();
        }
        
        // Обработчики для ползунков
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
            
            const rect = elements.priceSliderTrack.getBoundingClientRect();
            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            let percent = ((x - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            const value = Math.round((percent / 100) * 10000);
            
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
        
        // Обработчики для инпутов
        elements.priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(9000, value));
            if (value < currentFilters.priceRange.max - 1000) {
                currentFilters.priceRange.min = value;
                updateSlider();
            }
        });
        
        elements.priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 10000;
            value = Math.max(1000, Math.min(10000, value));
            if (value > currentFilters.priceRange.min + 1000) {
                currentFilters.priceRange.max = value;
                updateSlider();
            }
        });
        
        // Добавляем обработчики событий
        elements.priceSliderHandleMin.addEventListener('mousedown', startDragMin);
        elements.priceSliderHandleMax.addEventListener('mousedown', startDragMax);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mousemove', handleDrag);
        
        // Для touch устройств
        elements.priceSliderHandleMin.addEventListener('touchstart', startDragMin);
        elements.priceSliderHandleMax.addEventListener('touchstart', startDragMax);
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchmove', handleDrag);
        
        // Инициализация
        updateSlider();
    }
    
    // Настройка обработчиков фильтров
    function setupFilterHandlers() {
        // Обработчики для секций фильтров
        elements.filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                const filterSection = this.closest('.filter-section');
                const filterType = this.dataset.filter;
                
                // Если секция уже активна, закрываем её
                if (filterSection.classList.contains('active')) {
                    closeFilterSection(filterSection);
                    return;
                }
                
                // Открываем выбранную секцию
                openFilterSection(filterSection);
            });
        });
        
        // Обработчики для опций сортировки
        document.querySelectorAll('#sort-dropdown .filter-option-item').forEach(item => {
            item.addEventListener('click', function() {
                // Снимаем выделение со всех опций
                document.querySelectorAll('#sort-dropdown .filter-option-item').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                // Выделяем выбранную
                this.classList.add('active');
                currentFilters.sort = this.dataset.value;
                
                // Обновляем выбранное значение
                updateSortSelected();
                
                // Закрываем секцию
                closeFilterSection(this.closest('.filter-section'));
            });
        });
        
        // Обработчики для коллекций
        elements.collectionSearch.addEventListener('input', function() {
            renderCollections(this.value);
        });
        
        // Обработчик клика по коллекции
        elements.collectionsList.addEventListener('click', function(e) {
            const collectionItem = e.target.closest('.collection-item');
            if (!collectionItem) return;
            
            const collectionId = parseInt(collectionItem.dataset.id);
            const index = currentFilters.collections.indexOf(collectionId);
            
            if (index === -1) {
                // Добавляем коллекцию
                currentFilters.collections.push(collectionId);
                collectionItem.classList.add('active');
                collectionItem.querySelector('.collection-checkbox').innerHTML = '<i class="fas fa-check"></i>';
            } else {
                // Удаляем коллекцию
                currentFilters.collections.splice(index, 1);
                collectionItem.classList.remove('active');
                collectionItem.querySelector('.collection-checkbox').innerHTML = '';
            }
            
            // Обновляем выбранное значение
            updateCollectionSelected();
        });
        
        // Обработчики для редкости
        elements.traitButtons.forEach(button => {
            button.addEventListener('click', function() {
                const trait = this.dataset.trait;
                
                if (this.classList.contains('active')) {
                    // Удаляем редкость
                    this.classList.remove('active');
                    const index = currentFilters.traits.indexOf(trait);
                    if (index > -1) {
                        currentFilters.traits.splice(index, 1);
                    }
                } else {
                    // Добавляем редкость
                    this.classList.add('active');
                    currentFilters.traits.push(trait);
                }
                
                // Обновляем выбранное значение
                updateTraitsSelected();
            });
        });
        
        // Сброс фильтров
        elements.resetFiltersBtn.addEventListener('click', function() {
            resetAllFilters();
            tg.showAlert('Фильтры сброшены');
            tg.HapticFeedback.notificationOccurred('success');
        });
        
        // Применение фильтров
        elements.applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
            tg.showAlert('Фильтры применены');
            tg.HapticFeedback.notificationOccurred('success');
        });
    }
    
    // Открытие секции фильтра
    function openFilterSection(section) {
        // Закрываем все секции
        elements.filterSections.forEach(s => {
            s.classList.remove('active');
            s.style.order = '';
        });
        
        // Открываем выбранную секцию
        section.classList.add('active');
        section.style.order = '-1';
        
        // Прокручиваем к секции
        setTimeout(() => {
            section.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }
    
    // Закрытие секции фильтра
    function closeFilterSection(section) {
        section.classList.remove('active');
        section.style.order = '';
    }
    
    // Обновление выбранного значения сортировки
    function updateSortSelected() {
        const sortLabels = {
            'newest': 'Новые',
            'price-asc': 'Цена ↑',
            'price-desc': 'Цена ↓',
            'popular': 'Популярные'
        };
        elements.sortSelected.textContent = sortLabels[currentFilters.sort] || 'Новые';
    }
    
    // Обновление выбранного значения цены
    function updatePriceSelected() {
        if (currentFilters.priceRange.min === 0 && currentFilters.priceRange.max === 10000) {
            elements.priceSelected.textContent = 'Любая';
        } else {
            elements.priceSelected.textContent = `${currentFilters.priceRange.min} - ${currentFilters.priceRange.max} TON`;
        }
    }
    
    // Обновление выбранного значения коллекций
    function updateCollectionSelected() {
        if (currentFilters.collections.length === 0) {
            elements.collectionSelected.textContent = 'Все';
        } else if (currentFilters.collections.length === 1) {
            const collection = collections.find(c => c.id === currentFilters.collections[0]);
            elements.collectionSelected.textContent = collection?.name || '1 коллекция';
        } else {
            elements.collectionSelected.textContent = `${currentFilters.collections.length} коллекции`;
        }
    }
    
    // Обновление выбранного значения редкости
    function updateTraitsSelected() {
        if (currentFilters.traits.length === 0) {
            elements.traitsSelected.textContent = 'Любая';
        } else if (currentFilters.traits.length === 1) {
            elements.traitsSelected.textContent = currentFilters.traits[0];
        } else {
            elements.traitsSelected.textContent = `${currentFilters.traits.length} типа`;
        }
    }
    
    // Сброс всех фильтров
    function resetAllFilters() {
        currentFilters = {
            sort: 'newest',
            priceRange: { min: 0, max: 10000 },
            collections: [],
            traits: []
        };
        
        // Сброс UI
        document.querySelectorAll('.filter-option-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Активируем первую опцию в сортировке
        document.querySelector('#sort-dropdown .filter-option-item[data-value="newest"]').classList.add('active');
        
        // Сбрасываем коллекции
        renderCollections();
        
        // Сбрасываем редкость
        elements.traitButtons.forEach(btn => btn.classList.remove('active'));
        
        // Сбрасываем все активные секции
        elements.filterSections.forEach(section => {
            section.classList.remove('active');
            section.style.order = '';
        });
        
        // Обновляем выбранные значения
        updateSortSelected();
        updatePriceSelected();
        updateCollectionSelected();
        updateTraitsSelected();
        
        // Обновляем слайдер
        initPriceSlider();
    }
    
    // Применение фильтров
    function applyFilters() {
        console.log('Applying filters:', currentFilters);
        
        // Закрываем модальное окно
        elements.filtersModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Здесь будет логика применения фильтров к NFT
        // Пока просто обновляем маркет
        if (document.querySelector('.nav-button[data-page="market"].active')) {
            updateContent('market');
        }
    }
    
    // Создание содержимого для страниц
    function createMarketContent() {
        return `
            <div class="page-content">
                <div class="market-container">
                    <div class="market-header">
                        <div class="search-filter-bar" id="open-filters-btn">
                            <div class="search-filter-text">Поиск и фильтры</div>
                            <button class="filter-icon-btn">
                                <i class="fas fa-filter"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nft-grid">
                        ${generateNFTItems()}
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateNFTItems() {
        const nfts = [
            { name: "Bodded Ring", price: 150, rarity: "legendary" },
            { name: "Crystal Ball", price: 89, rarity: "epic" },
            { name: "Diamond Ring", price: 250, rarity: "mythical" },
            { name: "Genie Lamp", price: 120, rarity: "legendary" },
            { name: "Heroic Helmet", price: 75, rarity: "rare" },
            { name: "Moon Pendant", price: 95, rarity: "epic" },
            { name: "Golden Cup", price: 180, rarity: "legendary" },
            { name: "Magic Wand", price: 110, rarity: "epic" }
        ];
        
        return nfts.map((nft, index) => `
            <div class="nft-item" data-nft-id="${index}">
                <div class="nft-image">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-price">
                        <i class="fas fa-coins"></i>
                        <span>${nft.price} TON</span>
                        <button class="nft-buy-btn">Купить</button>
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
                        <div class="inventory-count">${userData.inventory.length} NFT</div>
                    </div>
                    
                    <div class="inventory-grid">
                        ${userData.inventory.map((nft, index) => `
                            <div class="inventory-item" data-nft-id="${nft.id}">
                                <i class="fas fa-gem"></i>
                                <div class="inventory-item-name">${nft.name}</div>
                            </div>
                        `).join('')}
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
                    <h2>Сезон</h2>
                    <div class="season-message">
                        Активный сезон скоро начнется!<br>
                        Готовьте свои NFT к новым испытаниям.
                    </div>
                </div>
            </div>
        `;
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
        // Анимация исчезновения
        elements.mainContent.style.opacity = '0';
        elements.mainContent.style.transform = 'translateY(20px) scale(0.98)';
        
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
            
            elements.mainContent.innerHTML = content;
            
            // Инициализация элементов после создания контента
            if (page === 'market') {
                const openFiltersBtn = document.getElementById('open-filters-btn');
                if (openFiltersBtn) {
                    openFiltersBtn.addEventListener('click', function() {
                        elements.filtersModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    });
                }
            }
            
            // Анимация появления
            setTimeout(() => {
                elements.mainContent.style.opacity = '1';
                elements.mainContent.style.transform = 'translateY(0) scale(1)';
            }, 50);
            
        }, 200);
    }
    
    // Установка активной кнопки навигации
    function setActiveButton(button) {
        elements.navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    // Отправка транзакции пополнения
    async function sendDepositTransaction(amount) {
        if (!tonConnectUI || !userData.walletConnected) {
            tg.showAlert('❌ Кошелек не подключен');
            return false;
        }
        
        try {
            // Показываем статус
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            // Создаем демо-транзакцию
            console.log('Simulating transaction for:', amount, 'TON');
            
            // Имитация задержки транзакции
            setTimeout(() => {
                showTransactionStatus('success', 'Транзакция отправлена!');
                
                // Успешная транзакция
                setTimeout(() => {
                    userData.balance += amount;
                    userData.totalVolume += amount;
                    updateBalanceDisplay();
                    saveUserData();
                    
                    showTransactionStatus('confirmed', `✅ Баланс пополнен на ${amount} TON!`);
                    
                    tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    // Закрываем модальное окно через 2 секунды
                    setTimeout(() => {
                        elements.depositModal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                        elements.transactionStatus.innerHTML = '';
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
        const statusIcons = {
            'pending': 'fas fa-spinner fa-spin',
            'success': 'fas fa-check-circle',
            'confirmed': 'fas fa-check-double',
            'error': 'fas fa-exclamation-circle'
        };
        
        elements.transactionStatus.innerHTML = `
            <div class="transaction-status-${status}">
                <i class="${statusIcons[status]}"></i>
                <span>${message}</span>
            </div>
        `;
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Навигация
        elements.navButtons.forEach(button => {
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
                tg.HapticFeedback.impactOccurred('light');
            });
        });
        
        // Кнопка пополнения баланса
        elements.addBalanceBtn.addEventListener('click', function() {
            // Эффект нажатия
            this.style.transform = 'scale(0.85)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Вибрация
            tg.HapticFeedback.impactOccurred('medium');
            
            // Показать модальное окно
            elements.balanceModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Закрытие модальных окон
        elements.closeBalanceModal.addEventListener('click', () => closeModal(elements.balanceModal));
        elements.closeDepositModal.addEventListener('click', () => closeModal(elements.depositModal));
        elements.closeFiltersModal.addEventListener('click', () => closeModal(elements.filtersModal));
        
        // Клик вне модальных окон
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this);
                }
            });
        });
        
        // Кнопка пополнения в окне баланса
        elements.depositBtn.addEventListener('click', function() {
            elements.balanceModal.classList.remove('active');
            updateWalletDisplay();
            elements.depositModal.classList.add('active');
        });
        
        // Кнопка вывода
        elements.withdrawBtn.addEventListener('click', function() {
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
                message: `Вы можете вывести до ${userData.balance.toFixed(2)} TON\n\nВаш кошелек: ${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-6)}`,
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
        
        // Подключение кошелька
        elements.connectWalletBtn.addEventListener('click', function() {
            connectWallet();
            tg.HapticFeedback.impactOccurred('light');
        });
        
        // Отключение кошелька
        elements.disconnectWalletBtn.addEventListener('click', function() {
            disconnectWallet();
            tg.HapticFeedback.impactOccurred('light');
        });
        
        // Пресеты суммы пополнения
        elements.amountPresets.forEach(preset => {
            preset.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                elements.depositAmountInput.value = amount;
                
                // Эффект нажатия
                elements.amountPresets.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                
                // Вибрация
                tg.HapticFeedback.impactOccurred('light');
            });
        });
        
        // Подтверждение пополнения
        elements.confirmDepositBtn.addEventListener('click', async function() {
            const amount = parseFloat(elements.depositAmountInput.value);
            
            if (isNaN(amount) || amount <= 0) {
                tg.showAlert('❌ Введите корректную сумму');
                return;
            }
            
            if (amount > 10000) {
                tg.showAlert('❌ Максимальная сумма пополнения - 10,000 TON');
                return;
            }
            
            if (!userData.walletConnected) {
                tg.showAlert('❌ Пожалуйста, подключите TON кошелек');
                return;
            }
            
            // Эффект нажатия
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Вибрация
            tg.HapticFeedback.impactOccurred('medium');
            
            // Отправляем транзакцию
            await sendDepositTransaction(amount);
        });
        
        // Обработка ввода суммы
        elements.depositAmountInput.addEventListener('input', function() {
            const amount = parseFloat(this.value);
            elements.amountPresets.forEach(preset => {
                preset.classList.remove('active');
                if (parseFloat(preset.dataset.amount) === amount) {
                    preset.classList.add('active');
                }
            });
        });
    }
    
    // Закрытие модального окна
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        if (modal === elements.depositModal) {
            elements.transactionStatus.innerHTML = '';
        }
    }
    
    // Сохранение данных при закрытии
    window.addEventListener('beforeunload', saveUserData);
    
    // Инициализация приложения
    initApp();
});

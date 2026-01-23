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
    const botBalanceElement = document.getElementById('bot-balance');
    const walletStatusElement = document.getElementById('wallet-status');
    const walletStatusText = document.getElementById('wallet-status-text');
    const walletConnectBtn = document.getElementById('connect-wallet-btn');
    const walletInfo = document.getElementById('wallet-info');
    
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
    const filterSections = document.querySelectorAll('.filter-section');
    const filterOptions = document.querySelectorAll('.filter-option');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const searchFiltersBtn = document.getElementById('search-filters-btn');
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
        balance: 100, // Начальный баланс для демо
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 0,
        sold: 0,
        totalVolume: 0,
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
    
    // Данные для фильтров
    const collections = [
        "Bodded Ring", "Candle Lamp", "Boots", "Candy Cane", "Case", "Christmas Tree",
        "Clover Pin", "Crystal Ball", "Diamond Ring", "Durov's Coat", "Coconut",
        "Crystal Eagle", "Dove of Peace", "Durov's Figurine", "Coffin", "Cupid Charm"
    ];
    
    // Текущие фильтры
    let currentFilters = {
        sort: 'newest',
        collections: [],
        priceRange: { min: 0, max: 100000 }
    };
    
    // Загрузка данных пользователя
    function loadUserData() {
        // Проверяем, есть ли сохраненные данные
        const savedData = localStorage.getItem('beatclub_user_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // Проверяем совпадение ID пользователя
            if (tg.initDataUnsafe?.user && parsed.id === tg.initDataUnsafe.user.id) {
                userData = { ...userData, ...parsed };
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
            
            // Загружаем инвентарь
            userData.inventory = demoInventory;
            
            console.log('User data loaded:', userData);
        }
        
        // Обновляем отображение
        updateBalanceDisplay();
        updateWalletInfo();
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
        balanceAmount.textContent = userData.balance.toLocaleString('ru-RU');
        botBalanceElement.textContent = userData.balance.toLocaleString('ru-RU');
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
                    
                    // Обновляем UI
                    updateWalletStatus();
                    updateWalletInfo();
                    
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
                    updateWalletStatus();
                    updateWalletInfo();
                    
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
                updateWalletStatus();
                updateWalletInfo();
            }
            
            console.log('TON Connect initialized successfully');
            
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            updateWalletStatus();
            updateWalletInfo();
        }
    }
    
    // Обновление статуса кошелька
    function updateWalletStatus() {
        if (userData.walletConnected && userData.walletAddress) {
            walletStatusElement.classList.add('connected');
            walletStatusElement.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Кошелёк подключен</span>
            `;
        } else {
            walletStatusElement.classList.remove('connected');
            walletStatusElement.innerHTML = `
                <i class="fas fa-wallet"></i>
                <span>Кошелёк не подключен</span>
            `;
        }
    }
    
    // Обновление информации о кошельке
    function updateWalletInfo() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = userData.walletAddress.slice(0, 6) + '...' + userData.walletAddress.slice(-4);
            walletInfo.innerHTML = `
                <div style="color: rgba(255, 255, 255, 0.9); font-size: 0.9rem; margin-bottom: 8px;">
                    Кошелёк подключен
                </div>
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; font-family: monospace;">
                    ${shortAddress}
                </div>
            `;
            walletConnectBtn.innerHTML = '<i class="fas fa-unlink"></i><span>Отключить кошелёк</span>';
        } else {
            walletInfo.innerHTML = `
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; text-align: center;">
                    Для пополнения баланса подключите TON кошелёк
                </div>
            `;
            walletConnectBtn.innerHTML = '<i class="fas fa-plug"></i><span>Подключить кошелёк</span>';
        }
    }
    
    // Инициализация фильтров
    function initFilters() {
        // Заполняем коллекции
        const collectionDropdown = document.getElementById('collection-dropdown');
        collections.slice(0, 8).forEach(collection => {
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
                const isActive = filterSection.classList.contains('active');
                
                // Закрываем все секции
                filterSections.forEach(section => {
                    section.classList.remove('active');
                });
                
                // Открываем выбранную секцию
                if (!isActive) {
                    filterSection.classList.add('active');
                    // Прокручиваем к секции
                    setTimeout(() => {
                        filterSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }, 100);
                }
            });
        });
        
        // Обработчики для выбора опций
        const sortOptions = document.querySelectorAll('#sort-dropdown .filter-option-item');
        const collectionOptions = document.querySelectorAll('#collection-dropdown .filter-option-item');
        
        // Сортировка
        sortOptions.forEach(option => {
            option.addEventListener('click', function() {
                sortOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                currentFilters.sort = this.dataset.value;
            });
        });
        
        // Коллекции
        collectionOptions.forEach(option => {
            option.addEventListener('click', function() {
                this.classList.toggle('active');
                const collection = this.dataset.value;
                
                if (this.classList.contains('active')) {
                    if (!currentFilters.collections.includes(collection)) {
                        currentFilters.collections.push(collection);
                    }
                } else {
                    currentFilters.collections = currentFilters.collections.filter(c => c !== collection);
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
        
        function updateSlider() {
            const minPercent = (currentFilters.priceRange.min / 100000) * 100;
            const maxPercent = (currentFilters.priceRange.max / 100000) * 100;
            
            priceSliderHandleMin.style.left = `${minPercent}%`;
            priceSliderHandleMax.style.left = `${maxPercent}%`;
            priceSliderRange.style.left = `${minPercent}%`;
            priceSliderRange.style.width = `${maxPercent - minPercent}%`;
            
            priceMinInput.value = currentFilters.priceRange.min;
            priceMaxInput.value = currentFilters.priceRange.max;
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
            
            const rect = priceSliderTrack.getBoundingClientRect();
            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            let percent = ((x - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            const value = Math.round((percent / 100) * 100000);
            
            if (isDraggingMin) {
                if (value < currentFilters.priceRange.max - 5000) {
                    currentFilters.priceRange.min = value;
                }
            } else if (isDraggingMax) {
                if (value > currentFilters.priceRange.min + 5000) {
                    currentFilters.priceRange.max = value;
                }
            }
            
            updateSlider();
        }
        
        // Обработчики для инпутов
        priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(95000, value));
            if (value < currentFilters.priceRange.max - 5000) {
                currentFilters.priceRange.min = value;
                updateSlider();
            }
        });
        
        priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 100000;
            value = Math.max(5000, Math.min(100000, value));
            if (value > currentFilters.priceRange.min + 5000) {
                currentFilters.priceRange.max = value;
                updateSlider();
            }
        });
        
        // Добавляем обработчики событий
        let isDraggingMin = false;
        let isDraggingMax = false;
        
        priceSliderHandleMin.addEventListener('mousedown', startDragMin);
        priceSliderHandleMax.addEventListener('mousedown', startDragMax);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mousemove', handleDrag);
        
        // Для touch устройств
        priceSliderHandleMin.addEventListener('touchstart', startDragMin);
        priceSliderHandleMax.addEventListener('touchstart', startDragMax);
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
            priceRange: { min: 0, max: 100000 }
        };
        
        // Сброс UI
        document.querySelectorAll('.filter-option-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Активируем первую опцию в сортировке
        document.querySelector('#sort-dropdown .filter-option-item[data-value="newest"]').classList.add('active');
        
        // Сбрасываем все активные секции
        filterSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Обновляем слайдер
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
                            <div class="search-filter-text">Поиск по фильтрам</div>
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
            `);
        }
        
        return nfts.join('');
    }
    
    function createGiftsContent() {
        return `
            <div class="page-content">
                <div class="gifts-container">
                    <div class="inventory-header">
                        <h2>🎁 Мои подарки</h2>
                        <div class="inventory-count">${userData.inventory.length} NFT</div>
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
                                        `${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}` : 
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
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(20px) scale(0.98)';
        
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
            
            // Анимация появления
            setTimeout(() => {
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0) scale(1)';
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
            // Показываем статус
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            // Создаем демо-транзакцию
            console.log('Simulating transaction for:', amount, 'TON');
            
            // Имитация задержки транзакции
            setTimeout(() => {
                // Успешная транзакция
                showTransactionStatus('success', 'Транзакция отправлена!');
                
                // В демо-версии обновляем баланс
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
                        depositModal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                        transactionStatusElement.innerHTML = '';
                    }, 2000);
                    
                }, 1000);
                
            }, 1500);
            
            return true;
            
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
            <div class="transaction-status-${status}">
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
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Вибрация
            tg.HapticFeedback.impactOccurred('light');
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
        tg.HapticFeedback.impactOccurred('medium');
        
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
        updateWalletStatus();
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
            message: `Вы можете вывести до ${userData.balance.toFixed(2)} TON\n\nВаш кошелек: ${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}`,
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
    
    // Кнопка подключения кошелька
    walletConnectBtn.addEventListener('click', function() {
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
        tg.HapticFeedback.impactOccurred('light');
    });
    
    // Закрытие модального окна пополнения
    closeDepositModal.addEventListener('click', function() {
        depositModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        transactionStatusElement.innerHTML = '';
    });
    
    // Клик вне модального окна пополнения
    depositModal.addEventListener('click', function(e) {
        if (e.target === this) {
            depositModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            transactionStatusElement.innerHTML = '';
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
            
            // Вибрация
            tg.HapticFeedback.impactOccurred('light');
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
        
        // Вибрация
        tg.HapticFeedback.impactOccurred('medium');
        
        // Отправляем транзакцию
        await sendDepositTransaction(amount);
    });
    
    // Инициализация
    loadUserData();
    
    // Инициализируем TON Connect
    setTimeout(() => {
        initTonConnect().then(() => {
            console.log('TON Connect initialized');
            updateWalletStatus();
            updateWalletInfo();
        }).catch(error => {
            console.error('Failed to init TON Connect:', error);
            updateWalletStatus();
            updateWalletInfo();
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
});

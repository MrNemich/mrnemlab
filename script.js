// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#000000');
    
    // ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
    let tonConnectUI = null;
    let currentFilters = {
        sort: 'newest',
        collections: [],
        priceRange: { min: 0, max: 100000 },
        backgrounds: []
    };
    let filterSections = [];
    
    // Данные пользователя
    let userData = {
        id: null,
        balance: 100,
        username: 'Гость',
        avatarUrl: null,
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        bought: 0,
        sold: 0,
        totalVolume: 0
    };
    
    // Демо NFT для маркета
    const demoNFTs = [
        { id: 1, name: "Bodded Ring", price: 150, type: "ring" },
        { id: 2, name: "Crystal Ball", price: 89, type: "magic" },
        { id: 3, name: "Diamond Ring", price: 250, type: "ring" },
        { id: 4, name: "Genie Lamp", price: 120, type: "magic" },
        { id: 5, name: "Heroic Helmet", price: 75, type: "armor" },
        { id: 6, name: "Moon Pendant", price: 95, type: "jewelry" },
        { id: 7, name: "Golden Cup", price: 180, type: "artifact" },
        { id: 8, name: "Magic Wand", price: 110, type: "magic" },
        { id: 9, name: "Silver Sword", price: 65, type: "weapon" },
        { id: 10, name: "Dragon Shield", price: 145, type: "armor" },
        { id: 11, name: "Phoenix Feather", price: 200, type: "artifact" },
        { id: 12, name: "Wizard Staff", price: 175, type: "magic" }
    ];
    
    // Демо коллекции для фильтров
    const collections = [
        "Bodded Ring", "Candle Lamp", "Boots", "Candy Cane", "Case", 
        "Christmas Tree", "Clover Pin", "Crystal Ball", "Diamond Ring", 
        "Durov's Coat", "Coconut", "Crystal Eagle", "Dove of Peace"
    ];
    
    // ===== ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ DOM =====
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
        walletStatus: document.getElementById('wallet-status'),
        walletStatusText: document.getElementById('wallet-status-text'),
        connectWalletBtn: document.getElementById('connect-wallet-btn'),
        walletAddressDisplay: document.getElementById('wallet-address-display'),
        depositAmountInput: document.getElementById('deposit-amount-input'),
        amountPresets: document.querySelectorAll('.amount-preset'),
        confirmDepositBtn: document.getElementById('confirm-deposit-btn'),
        transactionStatus: document.getElementById('transaction-status'),
        
        // Элементы фильтров
        filtersContainer: document.getElementById('filters-container'),
        filterSections: document.querySelectorAll('.filter-section'),
        resetFiltersBtn: document.getElementById('reset-filters-btn'),
        searchFiltersBtn: document.getElementById('search-filters-btn'),
        openFiltersBtn: null, // Будет установлен позже
        priceSliderTrack: document.getElementById('price-slider-track'),
        priceSliderRange: document.getElementById('price-slider-range'),
        priceSliderHandleMin: document.getElementById('price-slider-handle-min'),
        priceSliderHandleMax: document.getElementById('price-slider-handle-max'),
        priceMinInput: document.getElementById('price-min'),
        priceMaxInput: document.getElementById('price-max')
    };
    
    // ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
    function initApp() {
        loadUserData();
        initEventListeners();
        initTonConnect();
        updateContent('market');
        
        // Плавное появление
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }
    
    // ===== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
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
        updateWalletStatusDisplay();
    }
    
    function saveUserData() {
        localStorage.setItem('beatclub_user_data', JSON.stringify(userData));
    }
    
    // ===== ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ БАЛАНСА =====
    function updateBalanceDisplay() {
        elements.balanceAmount.textContent = userData.balance.toLocaleString('ru-RU');
        elements.botBalanceElement.textContent = userData.balance.toLocaleString('ru-RU');
    }
    
    // ===== ИНИЦИАЛИЗАЦИЯ TON CONNECT =====
    async function initTonConnect() {
        try {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/tonconnect-manifest.json',
                buttonRootId: 'ton-connect-modal'
            });
            
            tonConnectUI.onStatusChange((wallet) => {
                if (wallet) {
                    userData.walletConnected = true;
                    userData.walletAddress = wallet.account.address;
                    tg.showAlert('✅ Кошелек подключен!');
                    tg.HapticFeedback.notificationOccurred('success');
                } else {
                    userData.walletConnected = false;
                    userData.walletAddress = null;
                    userData.walletBalance = 0;
                }
                
                updateWalletStatusDisplay();
                saveUserData();
            });
            
            const currentWallet = tonConnectUI.connected;
            if (currentWallet) {
                userData.walletConnected = true;
                userData.walletAddress = currentWallet.account.address;
            }
            
            updateWalletStatusDisplay();
            
        } catch (error) {
            console.error('TON Connect error:', error);
            tg.showAlert('⚠️ Ошибка подключения кошелька');
        }
    }
    
    // ===== ОБНОВЛЕНИЕ СТАТУСА КОШЕЛЬКА =====
    function updateWalletStatusDisplay() {
        const walletStatus = elements.walletStatus;
        const walletStatusText = elements.walletStatusText;
        const connectBtn = elements.connectWalletBtn;
        const addressDisplay = elements.walletAddressDisplay;
        
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = userData.walletAddress.slice(0, 6) + '...' + userData.walletAddress.slice(-6);
            
            walletStatus.classList.add('connected');
            walletStatusText.textContent = `Кошелёк подключен: ${shortAddress}`;
            
            connectBtn.innerHTML = '<i class="fas fa-unlink"></i><span>Отключить кошелёк</span>';
            connectBtn.classList.add('disconnected');
            
            addressDisplay.innerHTML = `
                <div class="wallet-address-text">${shortAddress}</div>
                <div class="wallet-address-balance">${userData.walletBalance.toFixed(2)} TON</div>
            `;
            addressDisplay.classList.add('visible');
            
        } else {
            walletStatus.classList.remove('connected');
            walletStatusText.textContent = 'Кошелёк не подключен';
            
            connectBtn.innerHTML = '<i class="fas fa-plug"></i><span>Подключить кошелёк</span>';
            connectBtn.classList.remove('disconnected');
            
            addressDisplay.classList.remove('visible');
        }
    }
    
    // ===== УПРАВЛЕНИЕ КОШЕЛЬКОМ =====
    function connectWallet() {
        if (tonConnectUI) {
            if (userData.walletConnected) {
                tonConnectUI.disconnect();
            } else {
                tonConnectUI.openModal();
            }
        }
    }
    
    // ===== ПОПОЛНЕНИЕ БАЛАНСА =====
    async function processDeposit(amount) {
        if (!userData.walletConnected) {
            tg.showAlert('❌ Пожалуйста, подключите TON кошелек');
            return false;
        }
        
        try {
            showTransactionStatus('pending', 'Подтвердите транзакцию в кошельке...');
            
            // Имитация успешной транзакции (в реальном приложении здесь будет работа с TON Connect)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            userData.balance += amount;
            userData.totalVolume += amount;
            
            updateBalanceDisplay();
            saveUserData();
            
            showTransactionStatus('success', `✅ Баланс пополнен на ${amount} TON!`);
            tg.showAlert(`✅ Баланс успешно пополнен на ${amount} TON!`);
            tg.HapticFeedback.notificationOccurred('success');
            
            setTimeout(() => {
                elements.depositModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                elements.transactionStatus.innerHTML = '';
            }, 2000);
            
            return true;
            
        } catch (error) {
            console.error('Deposit error:', error);
            showTransactionStatus('error', '❌ Ошибка транзакции');
            tg.showAlert('❌ Ошибка при отправке транзакции');
            return false;
        }
    }
    
    function showTransactionStatus(type, message) {
        elements.transactionStatus.innerHTML = `
            <div class="transaction-status-${type}">
                ${type === 'pending' ? '<i class="fas fa-spinner fa-spin"></i>' : 
                  type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                  '<i class="fas fa-exclamation-circle"></i>'}
                <span>${message}</span>
            </div>
        `;
    }
    
    // ===== ФИЛЬТРЫ =====
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
        initFilterHandlers();
    }
    
    function initPriceSlider() {
        const track = elements.priceSliderTrack;
        const range = elements.priceSliderRange;
        const minHandle = elements.priceSliderHandleMin;
        const maxHandle = elements.priceSliderHandleMax;
        
        let isDraggingMin = false;
        let isDraggingMax = false;
        
        function updateSlider() {
            const minPercent = (currentFilters.priceRange.min / 100000) * 100;
            const maxPercent = (currentFilters.priceRange.max / 100000) * 100;
            
            minHandle.style.left = `${minPercent}%`;
            maxHandle.style.left = `${maxPercent}%`;
            range.style.left = `${minPercent}%`;
            range.style.width = `${maxPercent - minPercent}%`;
            
            elements.priceMinInput.value = currentFilters.priceRange.min;
            elements.priceMaxInput.value = currentFilters.priceRange.max;
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
            
            const rect = track.getBoundingClientRect();
            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            let percent = ((x - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            const value = Math.round((percent / 100) * 100000);
            
            if (isDraggingMin && value < currentFilters.priceRange.max - 5000) {
                currentFilters.priceRange.min = value;
            } else if (isDraggingMax && value > currentFilters.priceRange.min + 5000) {
                currentFilters.priceRange.max = value;
            }
            
            updateSlider();
        }
        
        // Обработчики для ползунков
        minHandle.addEventListener('mousedown', startDragMin);
        maxHandle.addEventListener('mousedown', startDragMax);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mousemove', handleDrag);
        
        // Обработчики для touch устройств
        minHandle.addEventListener('touchstart', startDragMin);
        maxHandle.addEventListener('touchstart', startDragMax);
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchmove', handleDrag);
        
        // Обработчики для инпутов
        elements.priceMinInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            value = Math.max(0, Math.min(95000, value));
            if (value < currentFilters.priceRange.max - 5000) {
                currentFilters.priceRange.min = value;
                updateSlider();
            }
        });
        
        elements.priceMaxInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 100000;
            value = Math.max(5000, Math.min(100000, value));
            if (value > currentFilters.priceRange.min + 5000) {
                currentFilters.priceRange.max = value;
                updateSlider();
            }
        });
        
        updateSlider();
    }
    
    function initFilterHandlers() {
        // Собираем все секции фильтров
        filterSections = Array.from(elements.filterSections);
        
        // Обработчик для кнопок фильтров
        filterSections.forEach(section => {
            const button = section.querySelector('.filter-option');
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const isActive = section.classList.contains('active');
                
                // Закрываем все секции
                filterSections.forEach(s => {
                    s.classList.remove('active');
                    s.style.order = '';
                });
                
                // Если секция была неактивной, открываем её
                if (!isActive) {
                    section.classList.add('active');
                    section.style.order = '-1';
                    
                    // Прокручиваем к активной секции
                    setTimeout(() => {
                        section.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }, 100);
                }
                
                tg.HapticFeedback.impactOccurred('light');
            });
        });
        
        // Обработчики для опций сортировки
        const sortOptions = document.querySelectorAll('#sort-dropdown .filter-option-item');
        sortOptions.forEach(option => {
            option.addEventListener('click', function() {
                sortOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                currentFilters.sort = this.dataset.value;
                tg.HapticFeedback.impactOccurred('light');
            });
        });
        
        // Обработчики для коллекций
        const collectionOptions = document.querySelectorAll('#collection-dropdown .filter-option-item');
        collectionOptions.forEach(option => {
            option.addEventListener('click', function() {
                this.classList.toggle('active');
                
                const collection = this.dataset.value;
                const index = currentFilters.collections.indexOf(collection);
                
                if (index === -1) {
                    currentFilters.collections.push(collection);
                } else {
                    currentFilters.collections.splice(index, 1);
                }
                
                tg.HapticFeedback.impactOccurred('light');
            });
        });
        
        // Сброс фильтров
        elements.resetFiltersBtn.addEventListener('click', function() {
            resetAllFilters();
            tg.showAlert('Фильтры сброшены');
            tg.HapticFeedback.notificationOccurred('success');
        });
        
        // Поиск по фильтрам
        elements.searchFiltersBtn.addEventListener('click', function() {
            applyFilters();
            elements.filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            tg.showAlert('Поиск выполнен по заданным фильтрам');
            tg.HapticFeedback.notificationOccurred('success');
        });
    }
    
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
        
        // Закрываем все секции
        filterSections.forEach(section => {
            section.classList.remove('active');
            section.style.order = '';
        });
        
        // Обновляем слайдер
        initPriceSlider();
    }
    
    function applyFilters() {
        console.log('Applying filters:', currentFilters);
        // Здесь будет логика применения фильтров
    }
    
    // ===== ГЕНЕРАЦИЯ КОНТЕНТА СТРАНИЦ =====
    function createMarketContent() {
        return `
            <div class="page-content">
                <div class="market-container">
                    <div class="market-header">
                        <div class="search-filter-bar">
                            <div class="search-filter-text">Маркет NFT</div>
                            <button class="filter-icon-btn" id="open-filters-btn">
                                <i class="fas fa-filter"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nft-grid" id="nft-grid">
                        ${generateNFTGrid()}
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateNFTGrid() {
        // Сортируем NFT в зависимости от выбранного фильтра
        let sortedNFTs = [...demoNFTs];
        
        switch(currentFilters.sort) {
            case 'price-asc':
                sortedNFTs.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sortedNFTs.sort((a, b) => b.price - a.price);
                break;
            default:
                sortedNFTs = demoNFTs;
        }
        
        // Фильтруем по цене
        sortedNFTs = sortedNFTs.filter(nft => 
            nft.price >= currentFilters.priceRange.min && 
            nft.price <= currentFilters.priceRange.max
        );
        
        // Фильтруем по коллекциям
        if (currentFilters.collections.length > 0) {
            sortedNFTs = sortedNFTs.filter(nft => 
                currentFilters.collections.includes(nft.name)
            );
        }
        
        // Генерируем HTML
        return sortedNFTs.map(nft => `
            <div class="nft-item" data-nft-id="${nft.id}">
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
                        Готовьтесь к новым достижениям и наградам.
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
    
    // ===== ОБНОВЛЕНИЕ КОНТЕНТА СТРАНИЦЫ =====
    function updateContent(page) {
        // Анимация исчезновения
        elements.mainContent.style.opacity = '0';
        elements.mainContent.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            let content = '';
            
            switch(page) {
                case 'market':
                    content = createMarketContent();
                    break;
                case 'season':
                    content = createSeasonContent();
                    break;
                case 'profile':
                    content = createProfileContent();
                    break;
                default:
                    content = createMarketContent();
            }
            
            elements.mainContent.innerHTML = content;
            
            // Инициализация элементов после создания контента
            if (page === 'market') {
                const openFiltersBtn = document.getElementById('open-filters-btn');
                if (openFiltersBtn) {
                    elements.openFiltersBtn = openFiltersBtn;
                    openFiltersBtn.addEventListener('click', function() {
                        elements.filtersModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    });
                }
            }
            
            // Анимация появления
            setTimeout(() => {
                elements.mainContent.style.opacity = '1';
                elements.mainContent.style.transform = 'translateY(0)';
            }, 50);
            
        }, 200);
    }
    
    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    function initEventListeners() {
        // Навигация
        elements.navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                
                elements.navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                updateContent(page);
                
                tg.HapticFeedback.impactOccurred('light');
            });
        });
        
        // Кнопка пополнения баланса
        elements.addBalanceBtn.addEventListener('click', function() {
            elements.balanceModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            tg.HapticFeedback.impactOccurred('medium');
        });
        
        // Закрытие модальных окон
        elements.closeBalanceModal.addEventListener('click', function() {
            elements.balanceModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        elements.closeDepositModal.addEventListener('click', function() {
            elements.depositModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            elements.transactionStatus.innerHTML = '';
        });
        
        elements.closeFiltersModal.addEventListener('click', function() {
            elements.filtersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        // Клик вне модальных окон
        elements.balanceModal.addEventListener('click', function(e) {
            if (e.target === this) {
                elements.balanceModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        elements.depositModal.addEventListener('click', function(e) {
            if (e.target === this) {
                elements.depositModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                elements.transactionStatus.innerHTML = '';
            }
        });
        
        elements.filtersModal.addEventListener('click', function(e) {
            if (e.target === this) {
                elements.filtersModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Кнопки в окне баланса
        elements.depositBtn.addEventListener('click', function() {
            elements.balanceModal.classList.remove('active');
            elements.depositModal.classList.add('active');
        });
        
        elements.withdrawBtn.addEventListener('click', function() {
            if (!userData.walletConnected) {
                tg.showAlert('❌ Пожалуйста, подключите TON кошелек');
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
                    {type: 'cancel', text: '❌ Отмена'}
                ]
            }, function(buttonId) {
                if (buttonId === 'withdraw_all') {
                    tg.showAlert(`✅ Запрос на вывод ${userData.balance.toFixed(2)} TON отправлен!`);
                    tg.HapticFeedback.notificationOccurred('success');
                }
            });
        });
        
        // Подключение кошелька
        elements.connectWalletBtn.addEventListener('click', function() {
            connectWallet();
            tg.HapticFeedback.impactOccurred('light');
        });
        
        // Пресеты суммы
        elements.amountPresets.forEach(preset => {
            preset.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                elements.depositAmountInput.value = amount;
                
                elements.amountPresets.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                
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
            
            if (amount > 1000) {
                tg.showAlert('❌ Максимальная сумма пополнения - 1000 TON');
                return;
            }
            
            tg.HapticFeedback.impactOccurred('medium');
            await processDeposit(amount);
        });
        
        // Сохранение данных при закрытии
        window.addEventListener('beforeunload', saveUserData);
    }
    
    // ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    initApp();
    initFilters();
});

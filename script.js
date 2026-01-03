document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    
    // Инициализация приложения
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Элементы DOM
    const elements = {
        navButtons: document.querySelectorAll('.nav-button'),
        mainContent: document.getElementById('main-content'),
        balanceAmount: document.getElementById('balance-amount'),
        addBalanceBtn: document.getElementById('add-balance-btn'),
        balanceModal: document.getElementById('balance-modal'),
        closeBalanceModal: document.getElementById('close-balance-modal'),
        userAvatarElement: document.getElementById('user-avatar'),
        userNameElement: document.getElementById('user-name'),
        depositBtn: document.getElementById('deposit-btn'),
        withdrawBtn: document.getElementById('withdraw-btn'),
        connectWalletBtn: document.getElementById('connect-wallet-btn'),
        botBalanceElement: document.getElementById('bot-balance'),
        connectInfoElement: document.getElementById('connect-info'),
        depositModal: document.getElementById('deposit-modal'),
        closeDepositModal: document.getElementById('close-deposit-modal'),
        depositAmountInput: document.getElementById('deposit-amount-input'),
        confirmDepositBtn: document.getElementById('confirm-deposit'),
        quickAmounts: document.querySelectorAll('.quick-amount'),
        depositWalletInfo: document.getElementById('deposit-wallet-info'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        closeSettingsModal: document.getElementById('close-settings-modal'),
        languageOptions: document.querySelectorAll('.language-option'),
        themeOptions: document.querySelectorAll('.theme-option'),
        notificationsToggle: document.getElementById('notifications-toggle')
    };
    
    // Глобальное состояние приложения
    const state = {
        userData: {
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
            lotteryParticipating: false,
            lotteryTickets: 0,
            settings: {
                language: 'ru',
                theme: 'dark',
                notifications: true
            }
        },
        lottery: {
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            totalPrize: 1000,
            participants: 0,
            ticketPrice: 1
        },
        tonConnectUI: null,
        currentPage: 'home',
        isInitialized: false
    };
    
    // Инициализация TON Connect
    function initTonConnect() {
        try {
            const manifest = {
                url: window.location.href,
                name: 'BEAT CLUB',
                iconUrl: 'https://ton.org/download/ton_symbol.svg',
                termsOfUseUrl: 'https://ton.org/terms',
                privacyPolicyUrl: 'https://ton.org/privacy'
            };
            
            state.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.href + '/tonconnect-manifest.json',
                buttonRootId: 'ton-connect-modal',
                uiPreferences: {
                    theme: 'DARK',
                    colorsSet: {
                        [TON_CONNECT_UI.THEME.DARK]: {
                            connectButton: {
                                background: '#007AFF',
                                foreground: '#FFFFFF'
                            }
                        }
                    }
                }
            });
            
            // Восстановление состояния подключения
            state.tonConnectUI.connectionRestored.then(() => {
                console.log('TON Connect connection restored');
            });
            
            // Подписка на изменения статуса кошелька
            state.tonConnectUI.onStatusChange(async (walletInfo) => {
                console.log('Wallet status changed:', walletInfo);
                
                if (walletInfo) {
                    state.userData.walletConnected = true;
                    state.userData.walletAddress = walletInfo.account.address;
                    
                    // Получение реального баланса кошелька
                    await updateWalletBalance();
                    
                    // Обновление интерфейса
                    updateConnectInfo();
                    updateDepositWalletInfo();
                    
                    showNotification('Кошелек успешно подключен!', 'success');
                } else {
                    state.userData.walletConnected = false;
                    state.userData.walletAddress = null;
                    state.userData.walletBalance = 0;
                    
                    updateConnectInfo();
                    updateDepositWalletInfo();
                }
                
                saveUserData();
            });
            
            console.log('TON Connect initialized successfully');
        } catch (error) {
            console.error('Error initializing TON Connect:', error);
            showNotification('Ошибка инициализации TON Connect', 'error');
        }
    }
    
    // Загрузка данных пользователя
    async function loadUserData() {
        try {
            const savedData = localStorage.getItem('beatclub_user_data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                // Проверяем совпадение ID пользователя
                if (tg.initDataUnsafe?.user && parsed.id === tg.initDataUnsafe.user.id) {
                    state.userData = { ...state.userData, ...parsed };
                }
            }
            
            // Загрузка данных из Telegram
            if (tg.initDataUnsafe?.user) {
                const user = tg.initDataUnsafe.user;
                state.userData.id = user.id;
                
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
                
                state.userData.username = name;
                elements.userNameElement.textContent = name;
                
                // Загрузка аватарки
                await loadUserAvatar(user);
            }
            
            // Применение настроек
            applySettings();
            
            // Обновление интерфейса
            updateBalanceDisplay();
            updateConnectInfo();
            updateDepositWalletInfo();
            
            console.log('User data loaded:', state.userData);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    // Сохранение данных пользователя
    function saveUserData() {
        try {
            localStorage.setItem('beatclub_user_data', JSON.stringify(state.userData));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }
    
    // Загрузка аватарки пользователя
    async function loadUserAvatar(user) {
        return new Promise((resolve) => {
            if (user.photo_url) {
                const avatarImg = new Image();
                avatarImg.src = user.photo_url;
                avatarImg.alt = state.userData.username;
                avatarImg.onload = () => {
                    state.userData.avatarUrl = user.photo_url;
                    updateAvatarDisplay();
                    resolve();
                };
                avatarImg.onerror = () => {
                    setAvatarPlaceholder();
                    resolve();
                };
            } else {
                setAvatarPlaceholder();
                resolve();
            }
        });
    }
    
    // Обновление отображения аватарки
    function updateAvatarDisplay() {
        const avatarContainer = elements.userAvatarElement;
        avatarContainer.innerHTML = '';
        
        if (state.userData.avatarUrl) {
            const img = document.createElement('img');
            img.src = state.userData.avatarUrl;
            img.alt = state.userData.username;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            avatarContainer.appendChild(img);
        } else {
            setAvatarPlaceholder();
        }
    }
    
    function setAvatarPlaceholder() {
        const avatarContainer = elements.userAvatarElement;
        const placeholder = document.createElement('div');
        placeholder.className = 'avatar-placeholder';
        placeholder.innerHTML = `<i class="fas fa-user"></i>`;
        avatarContainer.innerHTML = '';
        avatarContainer.appendChild(placeholder);
    }
    
    // Обновление отображения баланса
    function updateBalanceDisplay() {
        elements.balanceAmount.textContent = formatNumber(state.userData.balance);
        elements.botBalanceElement.textContent = formatNumber(state.userData.balance);
    }
    
    // Обновление информации о подключении кошелька
    function updateConnectInfo() {
        const container = elements.connectInfoElement;
        
        if (state.userData.walletConnected && state.userData.walletAddress) {
            const shortAddress = `${state.userData.walletAddress.slice(0, 6)}...${state.userData.walletAddress.slice(-4)}`;
            container.innerHTML = `
                <div class="wallet-connected">
                    <div class="wallet-address">
                        <i class="fas fa-wallet"></i>
                        <span>${shortAddress}</span>
                    </div>
                    <div class="wallet-balance-display">
                        <span class="balance-amount">${formatNumber(state.userData.walletBalance)}</span>
                        <span class="ton-symbol">TON</span>
                    </div>
                </div>
            `;
            elements.connectWalletBtn.textContent = 'Отключить';
            elements.connectWalletBtn.style.background = 'linear-gradient(135deg, #FF3B30, #FF2D55)';
        } else {
            container.innerHTML = `
                <div class="wallet-info-placeholder">
                    Подключите ваш TON кошелек для вывода средств
                </div>
            `;
            elements.connectWalletBtn.textContent = 'Подключить +';
            elements.connectWalletBtn.style.background = 'linear-gradient(135deg, #007AFF, #5856D6)';
        }
    }
    
    // Обновление информации о кошельке в модалке депозита
    function updateDepositWalletInfo() {
        const container = elements.depositWalletInfo;
        
        if (state.userData.walletConnected && state.userData.walletAddress) {
            const shortAddress = `${state.userData.walletAddress.slice(0, 6)}...${state.userData.walletAddress.slice(-4)}`;
            container.innerHTML = `
                <i class="fas fa-wallet"></i>
                <span>${shortAddress} • ${formatNumber(state.userData.walletBalance)} TON</span>
            `;
            container.classList.add('connected');
            elements.confirmDepositBtn.disabled = false;
        } else {
            container.innerHTML = `
                <i class="fas fa-wallet"></i>
                <span>Кошелек не подключен</span>
            `;
            container.classList.remove('connected');
            elements.confirmDepositBtn.disabled = true;
        }
    }
    
    // Обновление баланса кошелька через TON API
    async function updateWalletBalance() {
        if (!state.userData.walletConnected || !state.userData.walletAddress) {
            return;
        }
        
        try {
            // В реальном приложении здесь будет запрос к TON API
            // Для демо используем моковые данные
            const mockBalance = Math.random() * 1000;
            state.userData.walletBalance = parseFloat(mockBalance.toFixed(2));
            
            updateConnectInfo();
            updateDepositWalletInfo();
        } catch (error) {
            console.error('Error updating wallet balance:', error);
            showNotification('Ошибка обновления баланса кошелька', 'error');
        }
    }
    
    // Форматирование чисел
    function formatNumber(num) {
        return new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }
    
    // Показать уведомление
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
                </div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Создание содержимого для разных страниц
    function createHomeContent() {
        return `
            <div class="home-content">
                <div class="gradient-box">
                    <i class="fas fa-music content-icon"></i>
                    <h3>Добро пожаловать в BEAT CLUB!</h3>
                    <p class="empty-message">Товаров нет, приходите позже...</p>
                </div>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div class="feature-title">Быстро</div>
                        <div class="feature-desc">Мгновенные транзакции</div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="feature-title">Безопасно</div>
                        <div class="feature-desc">Защищенные платежи</div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="feature-title">Сообщество</div>
                        <div class="feature-desc">Активные участники</div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="feature-title">Награды</div>
                        <div class="feature-desc">Ежедневные бонусы</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function createLotteryContent() {
        return `
            <div class="lottery-content">
                <div class="lottery-card">
                    <div class="lottery-header">
                        <div class="lottery-icon">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div class="lottery-title">Розыгрыш Pepe NFT</div>
                    </div>
                    
                    <div class="lottery-prize">
                        <div class="prize-amount">${formatNumber(state.lottery.totalPrize)} TON</div>
                        <div class="prize-label">Общий призовой фонд</div>
                    </div>
                    
                    <div class="lottery-countdown" id="lottery-countdown">
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
                    
                    <div class="lottery-info">
                        <div class="info-item">
                            <span class="info-label">Цена билета</span>
                            <span class="info-value">${state.lottery.ticketPrice} TON</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Участников</span>
                            <span class="info-value">${state.lottery.participants}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ваши билеты</span>
                            <span class="info-value">${state.userData.lotteryTickets}</span>
                        </div>
                    </div>
                    
                    <button class="buy-ticket-btn" id="buy-ticket-btn">
                        <i class="fas fa-shopping-cart"></i>
                        Купить билет за ${state.lottery.ticketPrice} TON
                    </button>
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
                    <h2>Задания</h2>
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
                    <h2>Рейтинг игроков</h2>
                    <p class="rating-description">
                        Соревнуйся с другими участниками! Зарабатывай очки активности и поднимайся в рейтинге.
                    </p>
                </div>
            </div>
        `;
    }
    
    function createProfileContent() {
        return `
            <div class="profile-content">
                <div class="profile-avatar">
                    ${state.userData.avatarUrl ? 
                        `<img src="${state.userData.avatarUrl}" alt="${state.userData.username}">` : 
                        `<div class="avatar-placeholder">
                            <i class="fas fa-user"></i>
                        </div>`
                    }
                </div>
                
                <h2 class="profile-username">${state.userData.username}</h2>
                
                <div class="profile-stats">
                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-value">${state.userData.totalVolume}</div>
                            <div class="stat-label">Total volume</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-value">${state.userData.bought}</div>
                            <div class="stat-label">Bought</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-value">${state.userData.sold}</div>
                            <div class="stat-label">Sold</div>
                        </div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="profile-action-btn" id="invite-friends-btn">
                        <i class="fas fa-user-plus"></i>
                        Пригласить друзей
                    </button>
                    <button class="profile-action-btn" id="view-history-btn">
                        <i class="fas fa-history"></i>
                        История
                    </button>
                </div>
            </div>
        `;
    }
    
    // Обновление таймера лотереи
    function updateLotteryTimer() {
        const now = new Date();
        const timeLeft = state.lottery.endDate - now;
        
        if (timeLeft <= 0) {
            document.getElementById('days')?.textContent = '00';
            document.getElementById('hours')?.textContent = '00';
            document.getElementById('minutes')?.textContent = '00';
            document.getElementById('seconds')?.textContent = '00';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        const daysElement = document.getElementById('days');
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    // Обновление контента страницы
    function updateContent(page) {
        state.currentPage = page;
        
        // Анимация исчезновения
        elements.mainContent.style.opacity = '0';
        elements.mainContent.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            let content = '';
            
            switch(page) {
                case 'home':
                    content = createHomeContent();
                    break;
                case 'lottery':
                    content = createLotteryContent();
                    setupLotteryPage();
                    break;
                case 'tasks':
                    content = createTasksContent();
                    break;
                case 'rating':
                    content = createRatingContent();
                    break;
                case 'profile':
                    content = createProfileContent();
                    setupProfilePage();
                    break;
            }
            
            elements.mainContent.innerHTML = content;
            
            // Анимация появления
            setTimeout(() => {
                elements.mainContent.style.opacity = '1';
                elements.mainContent.style.transform = 'translateY(0)';
            }, 50);
            
        }, 200);
    }
    
    // Настройка страницы лотереи
    function setupLotteryPage() {
        const buyTicketBtn = document.getElementById('buy-ticket-btn');
        
        if (buyTicketBtn) {
            buyTicketBtn.addEventListener('click', async function() {
                if (state.userData.balance < state.lottery.ticketPrice) {
                    showNotification('Недостаточно средств на балансе!', 'error');
                    return;
                }
                
                // Симуляция покупки билета
                state.userData.balance -= state.lottery.ticketPrice;
                state.userData.lotteryTickets++;
                state.lottery.participants++;
                state.lottery.totalPrize += state.lottery.ticketPrice;
                
                updateBalanceDisplay();
                saveUserData();
                
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-check"></i> Билет куплен!';
                
                showNotification('Билет успешно куплен! Удачи в розыгрыше!', 'success');
                
                // Обновляем страницу через секунду
                setTimeout(() => {
                    updateContent('lottery');
                }, 1000);
            });
        }
        
        // Запускаем таймер
        updateLotteryTimer();
        const timerInterval = setInterval(updateLotteryTimer, 1000);
        
        // Очищаем интервал при смене страницы
        elements.mainContent.dataset.timerInterval = timerInterval;
    }
    
    // Настройка страницы профиля
    function setupProfilePage() {
        const inviteFriendsBtn = document.getElementById('invite-friends-btn');
        const viewHistoryBtn = document.getElementById('view-history-btn');
        
        if (inviteFriendsBtn) {
            inviteFriendsBtn.addEventListener('click', function() {
                tg.showPopup({
                    title: 'Пригласить друзей',
                    message: 'Поделитесь ссылкой с друзьями и получайте бонусы!',
                    buttons: [
                        {id: 'copy', type: 'default', text: 'Копировать ссылку'},
                        {type: 'cancel', text: 'Закрыть'}
                    ]
                }, function(buttonId) {
                    if (buttonId === 'copy') {
                        navigator.clipboard.writeText('https://t.me/BeatClubBot');
                        showNotification('Ссылка скопирована!', 'success');
                    }
                });
            });
        }
        
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', function() {
                showNotification('История транзакций скоро будет доступна', 'info');
            });
        }
    }
    
    // Применение настроек
    function applySettings() {
        const settings = state.userData.settings;
        
        // Применение языка
        document.documentElement.lang = settings.language;
        
        // Применение темы
        if (settings.theme === 'light') {
            document.documentElement.style.setProperty('--dark-bg', '#FFFFFF');
            document.documentElement.style.setProperty('--card-bg', '#F2F2F7');
            document.documentElement.style.setProperty('--text-primary', '#000000');
            document.documentElement.style.setProperty('--text-secondary', '#8E8E93');
        } else {
            document.documentElement.style.setProperty('--dark-bg', '#000000');
            document.documentElement.style.setProperty('--card-bg', '#1C1C1E');
            document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
            document.documentElement.style.setProperty('--text-secondary', '#8E8E93');
        }
        
        // Обновление активных кнопок настроек
        elements.languageOptions.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === settings.language);
        });
        
        elements.themeOptions.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });
        
        elements.notificationsToggle.checked = settings.notifications;
    }
    
    // Инициализация обработчиков событий
    function initEventListeners() {
        // Навигация
        elements.navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                
                // Установка активной кнопки
                elements.navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Обновление контента
                updateContent(page);
                
                // Эффект нажатия
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });
        });
        
        // Открытие модального окна баланса
        elements.addBalanceBtn.addEventListener('click', function() {
            elements.balanceModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Закрытие модальных окон
        elements.closeBalanceModal.addEventListener('click', function() {
            elements.balanceModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        elements.closeDepositModal.addEventListener('click', function() {
            elements.depositModal.classList.remove('active');
        });
        
        elements.closeSettingsModal.addEventListener('click', function() {
            elements.settingsModal.classList.remove('active');
        });
        
        // Клик вне модальных окон
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        });
        
        // Кнопка депозита
        elements.depositBtn.addEventListener('click', function() {
            elements.balanceModal.classList.remove('active');
            elements.depositModal.classList.add('active');
        });
        
        // Кнопка вывода
        elements.withdrawBtn.addEventListener('click', async function() {
            if (!state.userData.walletConnected) {
                showNotification('Пожалуйста, подключите TON кошелек', 'error');
                return;
            }
            
            if (state.userData.balance <= 0) {
                showNotification('На балансе нет средств для вывода', 'error');
                return;
            }
            
            tg.showPopup({
                title: 'Вывод средств',
                message: `Доступно для вывода: ${formatNumber(state.userData.balance)} TON\n\nВведите сумму для вывода:`,
                buttons: [
                    {id: 'withdraw_all', type: 'default', text: 'Вывести всё'},
                    {id: 'custom', type: 'default', text: 'Указать сумму'},
                    {type: 'cancel', text: 'Отмена'}
                ]
            }, async function(buttonId) {
                if (buttonId === 'withdraw_all') {
                    // Симуляция вывода через TON Connect
                    const amount = state.userData.balance;
                    
                    try {
                        // В реальном приложении здесь будет транзакция через TON Connect
                        state.userData.balance = 0;
                        updateBalanceDisplay();
                        saveUserData();
                        
                        showNotification(`Запрос на вывод ${formatNumber(amount)} TON отправлен!`, 'success');
                    } catch (error) {
                        console.error('Withdrawal error:', error);
                        showNotification('Ошибка при выводе средств', 'error');
                    }
                }
            });
        });
        
        // Подключение/отключение кошелька
        elements.connectWalletBtn.addEventListener('click', function() {
            if (state.userData.walletConnected) {
                // Отключение кошелька
                state.tonConnectUI.disconnect();
            } else {
                // Подключение кошелька
                state.tonConnectUI.openModal();
            }
        });
        
        // Быстрый выбор суммы депозита
        elements.quickAmounts.forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = this.dataset.amount;
                elements.depositAmountInput.value = amount;
            });
        });
        
        // Подтверждение депозита
        elements.confirmDepositBtn.addEventListener('click', async function() {
            const amount = parseFloat(elements.depositAmountInput.value);
            
            if (!amount || amount <= 0) {
                showNotification('Введите корректную сумму', 'error');
                return;
            }
            
            if (!state.userData.walletConnected) {
                showNotification('Подключите кошелек для депозита', 'error');
                return;
            }
            
            if (state.userData.walletBalance < amount) {
                showNotification('Недостаточно средств на кошельке', 'error');
                return;
            }
            
            // Симуляция депозита через TON Connect
            try {
                // В реальном приложении здесь будет транзакция через TON Connect
                state.userData.walletBalance -= amount;
                state.userData.balance += amount;
                state.userData.totalVolume += amount;
                
                updateBalanceDisplay();
                updateConnectInfo();
                updateDepositWalletInfo();
                saveUserData();
                
                elements.depositModal.classList.remove('active');
                showNotification(`Баланс пополнен на ${formatNumber(amount)} TON!`, 'success');
            } catch (error) {
                console.error('Deposit error:', error);
                showNotification('Ошибка при пополнении баланса', 'error');
            }
        });
        
        // Настройки
        elements.settingsBtn.addEventListener('click', function() {
            elements.settingsModal.classList.add('active');
        });
        
        // Выбор языка
        elements.languageOptions.forEach(btn => {
            btn.addEventListener('click', function() {
                const lang = this.dataset.lang;
                state.userData.settings.language = lang;
                applySettings();
                saveUserData();
                showNotification('Язык изменен', 'success');
            });
        });
        
        // Выбор темы
        elements.themeOptions.forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.dataset.theme;
                state.userData.settings.theme = theme;
                applySettings();
                saveUserData();
                showNotification('Тема изменена', 'success');
            });
        });
        
        // Уведомления
        elements.notificationsToggle.addEventListener('change', function() {
            state.userData.settings.notifications = this.checked;
            saveUserData();
            showNotification(
                this.checked ? 'Уведомления включены' : 'Уведомления выключены',
                'success'
            );
        });
    }
    
    // Основная инициализация
    async function initializeApp() {
        if (state.isInitialized) return;
        
        try {
            // Загрузка данных пользователя
            await loadUserData();
            
            // Инициализация TON Connect
            initTonConnect();
            
            // Настройка обработчиков событий
            initEventListeners();
            
            // Загрузка начальной страницы
            updateContent('home');
            
            // Периодическое обновление баланса кошелька
            setInterval(updateWalletBalance, 30000);
            
            state.isInitialized = true;
            
            // Плавное появление
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            showNotification('Ошибка инициализации приложения', 'error');
        }
    }
    
    // Сохранение данных при закрытии
    window.addEventListener('beforeunload', function() {
        saveUserData();
    });
    
    // Запуск приложения
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    initializeApp();
});

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
    
    // Текущий пользователь (все начинают с 0!)
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
        lotteryParticipating: false
    };
    
    // Дата окончания лотереи (5 дней с текущего момента)
    const lotteryEndDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    
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
        updateConnectInfo();
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
            'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            'linear-gradient(135deg, #4ECDC4, #44A08D)',
            'linear-gradient(135deg, #FFD166, #FFB347)',
            'linear-gradient(135deg, #7B2FF7, #5A1BD6)',
            'linear-gradient(135deg, #06D6A0, #04A97F)',
            'linear-gradient(135deg, #EF476F, #D43A5E)',
            'linear-gradient(135deg, #118AB2, #0D6F8F)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }
    
    // Обновление отображения баланса
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toLocaleString();
        botBalanceElement.textContent = userData.balance.toLocaleString();
    }
    
    // Инициализация TON Connect
    function initTonConnect() {
        const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
        
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: manifestUrl,
            buttonRootId: 'ton-connect-modal'
        });
        
        // Подписываемся на изменения
        tonConnectUI.onStatusChange(walletInfo => {
            if (walletInfo) {
                userData.walletConnected = true;
                userData.walletAddress = walletInfo.account.address;
                updateWalletBalance();
                updateConnectInfo();
                
                tg.showAlert('✅ Кошелек успешно подключен!');
                tg.HapticFeedback.notificationOccurred('success');
            } else {
                userData.walletConnected = false;
                userData.walletAddress = null;
                userData.walletBalance = 0;
                updateConnectInfo();
            }
        });
    }
    
    // Обновление информации о подключении
    function updateConnectInfo() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = `${userData.walletAddress.slice(0, 4)}...${userData.walletAddress.slice(-4)}`;
            connectInfoElement.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <span style="color: white; font-weight: 600;">👛 Your Wallet (${shortAddress})</span>
                    <span style="font-size: 1.1rem; color: #007aff; font-weight: 700;">${userData.walletBalance.toFixed(2)} TON ></span>
                </div>
            `;
            connectWalletBtn.textContent = 'Disconnect';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #ff375f, #d43a5e)';
        } else {
            connectInfoElement.innerHTML = `
                <div style="color: #8e8e93; font-size: 0.9rem;">
                    Подключите ваш TON кошелек для вывода средств
                </div>
            `;
            connectWalletBtn.textContent = 'Connect +';
            connectWalletBtn.style.background = 'linear-gradient(135deg, #007aff, #0056cc)';
        }
    }
    
    // Обновление баланса кошелька
    async function updateWalletBalance() {
        if (!userData.walletConnected) return;
        
        try {
            // Здесь должен быть реальный запрос к TON API
            // Для демо используем случайное значение
            userData.walletBalance = Math.random() * 100;
            updateConnectInfo();
        } catch (error) {
            console.error('Error updating wallet balance:', error);
        }
    }
    
    // Создание содержимого для разных страниц
    function createHomeContent() {
        return `
            <div class="page-content">
                <div class="gradient-box">
                    <i class="fas fa-home content-icon"></i>
                    <h3>Добро пожаловать в BEAT CLUB!</h3>
                    <p class="empty-message">Товаров нет, приходите позже...</p>
                </div>
            </div>
        `;
    }
    
    function createLotteryContent() {
        return `
            <div class="page-content">
                <div class="lottery-container">
                    <img src="nft/пепе.png" alt="Pepe NFT" class="pepe-image" onerror="this.onerror=null; this.src='https://i.imgur.com/Rh5D7bF.png';">
                    
                    <h1 class="lottery-title">🎰 Розыгрыш Pepe NFT</h1>
                    
                    <p class="lottery-description">
                        Участвуй в розыгрыше уникального NFT Pepe! Купи билет за 1 TON и получи шанс выиграть эксклюзивный NFT Pepe.
                    </p>
                    
                    <div class="countdown-container">
                        <h3 class="countdown-title">До конца розыгрыша:</h3>
                        
                        <div class="countdown-timer" id="countdown-timer">
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
                        
                        <div class="ticket-price">
                            <img src="nft/ton.png" alt="TON" style="width: 20px; height: 20px;">
                            <span>Цена билета: 1 TON</span>
                        </div>
                        
                        <button class="ticket-btn" id="buy-ticket-btn">
                            <i class="fas fa-ticket-alt"></i>
                            <span>Купить билет за 1 TON</span>
                        </button>
                        
                        <div class="participant-status" id="participant-status">
                            <i class="fas fa-check-circle"></i>
                            Вы участвуете в розыгрыше!
                        </div>
                    </div>
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
                    <h2>🎯 Задания</h2>
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
                    <h2>🏆 Рейтинг игроков</h2>
                    <p class="rating-description">
                        Соревнуйся с другими участниками! Зарабатывай очки активности и поднимайся в рейтинге.
                    </p>
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
                            `<div class="avatar-placeholder" style="border-radius: 20px;">
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
    
    // Обновление таймера лотереи
    function updateLotteryTimer() {
        const timerElement = document.getElementById('countdown-timer');
        if (!timerElement) return;
        
        const now = new Date();
        const timeLeft = lotteryEndDate - now;
        
        if (timeLeft <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Обновление контента страницы
    function updateContent(page) {
        // Анимация исчезновения
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            let content = '';
            
            switch(page) {
                case 'home':
                    content = createHomeContent();
                    break;
                case 'lottery':
                    content = createLotteryContent();
                    break;
                case 'tasks':
                    content = createTasksContent();
                    break;
                case 'rating':
                    content = createRatingContent();
                    break;
                case 'profile':
                    content = createProfileContent();
                    break;
            }
            
            mainContent.innerHTML = content;
            
            // Инициализация элементов после создания контента
            if (page === 'lottery') {
                const buyTicketBtn = document.getElementById('buy-ticket-btn');
                const participantStatus = document.getElementById('participant-status');
                
                if (userData.lotteryParticipating) {
                    participantStatus.classList.add('show');
                    buyTicketBtn.disabled = true;
                    buyTicketBtn.innerHTML = '<i class="fas fa-check"></i><span>Вы уже участвуете</span>';
                }
                
                buyTicketBtn.addEventListener('click', function() {
                    if (userData.balance < 1) {
                        tg.showAlert('❌ Недостаточно TON для покупки билета!');
                        tg.HapticFeedback.notificationOccurred('error');
                        return;
                    }
                    
                    // Покупка билета
                    userData.balance -= 1;
                    userData.bought += 1;
                    userData.lotteryParticipating = true;
                    
                    updateBalanceDisplay();
                    saveUserData();
                    
                    participantStatus.classList.add('show');
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-check"></i><span>Вы уже участвуете</span>';
                    
                    tg.showAlert('✅ Вы успешно приобрели билет! Удачи в розыгрыше!');
                    tg.HapticFeedback.notificationOccurred('success');
                    
                    // Вибрация
                    if (navigator.vibrate) {
                        navigator.vibrate([50, 50, 50]);
                    }
                });
                
                // Запускаем таймер
                setInterval(updateLotteryTimer, 1000);
                updateLotteryTimer();
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
    
    // Закрытие модального окна
    closeBalanceModal.addEventListener('click', function() {
        balanceModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Клик вне модального окна
    balanceModal.addEventListener('click', function(e) {
        if (e.target === this) {
            balanceModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Кнопка пополнения
    depositBtn.addEventListener('click', function() {
        tg.showPopup({
            title: '💰 Пополнение баланса',
            message: 'Выберите сумму для пополнения:',
            buttons: [
                {id: '10', type: 'default', text: '➕ 10 TON'},
                {id: '50', type: 'default', text: '➕ 50 TON'},
                {id: '100', type: 'default', text: '➕ 100 TON'},
                {type: 'cancel', text: '❌ Отмена'}
            ]
        }, function(buttonId) {
            if (buttonId === '10' || buttonId === '50' || buttonId === '100') {
                const amount = parseInt(buttonId);
                userData.balance += amount;
                updateBalanceDisplay();
                saveUserData();
                tg.showAlert(`✅ Баланс пополнен на ${amount} TON!`);
                tg.HapticFeedback.notificationOccurred('success');
            }
        });
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
                // В реальном приложении здесь была бы транзакция
                tg.showAlert(`✅ Запрос на вывод ${userData.balance} TON отправлен! Обработка займет до 24 часов.`);
                tg.HapticFeedback.notificationOccurred('success');
            } else if (buttonId === 'custom') {
                // Здесь можно добавить ввод суммы
                tg.showAlert('В разработке');
            }
        });
    });
    
    // Кнопка подключения кошелька
    connectWalletBtn.addEventListener('click', function() {
        if (userData.walletConnected) {
            // Отключение кошелька
            tonConnectUI.disconnect();
            userData.walletConnected = false;
            userData.walletAddress = null;
            userData.walletBalance = 0;
            updateConnectInfo();
        } else {
            // Подключение кошелька
            tonConnectUI.openModal();
        }
    });
    
    // Инициализация
    loadUserData();
    initTonConnect();
    updateContent('home');
    
    // Проверка иконки TON
    checkTonIcon();
    
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
    
    // Проверка иконки TON
    function checkTonIcon() {
        setTimeout(() => {
            const icons = document.querySelectorAll('.ton-icon');
            icons.forEach(icon => {
                if (icon && (icon.naturalWidth === 0 || icon.complete === false)) {
                    console.log('TON icon failed to load, using fallback');
                    const svg = `
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="16" fill="#7B2FF7"/>
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
    
    // Автоматическое обновление баланса кошелька
    setInterval(updateWalletBalance, 30000);
});

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    
    // Инициализация TON Connect
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: window.location.origin + '/tonconnect-manifest.json',
        buttonRootId: 'connect-wallet-btn'
    });
    
    // Инициализация приложения
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#000000');
    
    // Получаем элементы
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
    const navButtons = document.querySelectorAll('.nav-button');
    const depositModal = document.getElementById('deposit-modal');
    const closeDepositModal = document.getElementById('close-deposit-modal');
    const cancelDeposit = document.getElementById('cancel-deposit');
    const submitDeposit = document.getElementById('submit-deposit');
    const depositInput = document.getElementById('deposit-input');
    const quickAmounts = document.querySelectorAll('.quick-amount');
    const confirmDepositBtn = document.getElementById('confirm-deposit');
    const depositAmountInput = document.getElementById('deposit-amount');
    
    // Глобальная дата окончания лотереи (5 дней с момента создания)
    const LOTTERY_END_DATE = localStorage.getItem('lottery_end_date') || 
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    
    if (!localStorage.getItem('lottery_end_date')) {
        localStorage.setItem('lottery_end_date', LOTTERY_END_DATE);
    }
    
    // Данные пользователя
    let userData = {
        id: null,
        balance: parseFloat(localStorage.getItem('user_balance')) || 0,
        username: 'Гость',
        avatarUrl: null,
        walletConnected: localStorage.getItem('wallet_connected') === 'true',
        walletAddress: localStorage.getItem('wallet_address'),
        walletBalance: parseFloat(localStorage.getItem('wallet_balance')) || 0,
        bought: parseInt(localStorage.getItem('bought')) || 0,
        sold: parseInt(localStorage.getItem('sold')) || 0,
        totalVolume: parseFloat(localStorage.getItem('total_volume')) || 0,
        lotteryParticipating: localStorage.getItem('lottery_participating') === 'true'
    };
    
    // Инициализация
    initApp();
    
    async function initApp() {
        await loadUserData();
        initTonConnect();
        updateContent('home');
        setupEventListeners();
        startLotteryTimer();
    }
    
    async function loadUserData() {
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
            if (user.photo_url) {
                userData.avatarUrl = user.photo_url;
                const avatarImg = document.createElement('img');
                avatarImg.src = user.photo_url;
                avatarImg.alt = name;
                avatarImg.style.width = '100%';
                avatarImg.style.height = '100%';
                avatarImg.style.borderRadius = '50%';
                userAvatarElement.querySelector('.avatar-placeholder').remove();
                userAvatarElement.appendChild(avatarImg);
            }
        }
        
        updateBalanceDisplay();
        updateConnectInfo();
    }
    
    function initTonConnect() {
        tonConnectUI.onStatusChange(async (walletInfo) => {
            if (walletInfo) {
                userData.walletConnected = true;
                userData.walletAddress = walletInfo.account.address;
                localStorage.setItem('wallet_connected', 'true');
                localStorage.setItem('wallet_address', userData.walletAddress);
                
                // Получаем реальный баланс
                await updateRealWalletBalance();
                updateConnectInfo();
                
                tg.showAlert('✅ Кошелек успешно подключен!');
                tg.HapticFeedback.notificationOccurred('success');
            } else {
                userData.walletConnected = false;
                userData.walletAddress = null;
                userData.walletBalance = 0;
                localStorage.setItem('wallet_connected', 'false');
                localStorage.removeItem('wallet_address');
                updateConnectInfo();
            }
        });
        
        // Восстанавливаем соединение если было
        if (userData.walletConnected && userData.walletAddress) {
            updateConnectInfo();
        }
    }
    
    async function updateRealWalletBalance() {
        if (!userData.walletConnected || !userData.walletAddress) return;
        
        try {
            // Используем TON Center API для получения баланса
            const response = await fetch(
                `https://toncenter.com/api/v2/getAddressBalance?address=${userData.walletAddress}`
            );
            const data = await response.json();
            
            if (data.ok) {
                // Конвертируем наноТоны в TON (1 TON = 1e9 наноТон)
                const balanceInNano = parseInt(data.result);
                userData.walletBalance = balanceInNano / 1000000000;
                localStorage.setItem('wallet_balance', userData.walletBalance.toString());
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            // Используем старый баланс
        }
        
        updateConnectInfo();
    }
    
    function updateConnectInfo() {
        if (userData.walletConnected && userData.walletAddress) {
            const shortAddress = `${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}`;
            connectInfoElement.innerHTML = `
                <div class="connected-wallet">
                    <div class="wallet-address-display">${shortAddress}</div>
                    <div class="wallet-balance-display-small">
                        Баланс: <span>${userData.walletBalance.toFixed(2)} TON</span>
                    </div>
                </div>
            `;
            connectWalletBtn.textContent = 'Отключить';
            connectWalletBtn.style.background = '#ff3b30';
        } else {
            connectInfoElement.innerHTML = `
                <div class="connect-placeholder">
                    <i class="fas fa-wallet"></i>
                    <p>Подключите TON кошелек для вывода средств</p>
                </div>
            `;
            connectWalletBtn.textContent = 'Подключить';
            connectWalletBtn.style.background = '#007AFF';
        }
    }
    
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toFixed(2);
        botBalanceElement.textContent = userData.balance.toFixed(2);
        localStorage.setItem('user_balance', userData.balance.toString());
    }
    
    function updateContent(page) {
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
        
        // Инициализация элементов страницы
        if (page === 'lottery') {
            initLotteryPage();
        }
        
        if (page === 'profile') {
            initProfilePage();
        }
    }
    
    function createHomeContent() {
        return `
            <div class="home-container">
                <div class="home-icon">
                    <i class="fas fa-record-vinyl"></i>
                </div>
                <h1 class="home-title">BEAT CLUB</h1>
                <p class="home-description">
                    Торговая платформа для коллекционеров музыки.<br>
                    Покупайте, продавайте и коллекционируйте уникальные треки.
                </p>
            </div>
        `;
    }
    
    function createLotteryContent() {
        return `
            <div class="lottery-container">
                <div class="lottery-header">
                    <i class="fas fa-ticket-alt lottery-icon"></i>
                    <h2 class="lottery-title">Розыгрыш NFT</h2>
                </div>
                
                <img src="nft/пепе.png" alt="Pepe NFT" class="lottery-image" 
                     onerror="this.src='https://via.placeholder.com/400x200/000/fff?text=Pepe+NFT'">
                
                <div class="lottery-info">
                    <div class="info-item">
                        <span>Цена билета:</span>
                        <span class="info-value">1 TON</span>
                    </div>
                    <div class="info-item">
                        <span>Участников:</span>
                        <span class="info-value">${Math.floor(Math.random() * 100) + 50}</span>
                    </div>
                    <div class="info-item">
                        <span>Призовой фонд:</span>
                        <span class="info-value">150 TON</span>
                    </div>
                </div>
                
                <div class="countdown" id="countdown">
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
                
                <button class="buy-ticket-btn" id="buy-ticket-btn">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Купить билет за 1 TON</span>
                </button>
                
                <div class="participant-status" id="participant-status">
                    <i class="fas fa-check-circle"></i> Вы участвуете в розыгрыше!
                </div>
            </div>
        `;
    }
    
    function createTasksContent() {
        return `
            <div class="tasks-container">
                <div class="tasks-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <h2 class="tasks-title">Задания</h2>
                <p class="tasks-message">
                    Новые задания появятся скоро.<br>
                    Следите за обновлениями!
                </p>
            </div>
        `;
    }
    
    function createRatingContent() {
        return `
            <div class="rating-container">
                <div class="rating-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <h2 class="rating-title">Рейтинг</h2>
                <p class="rating-description">
                    Топ игроков появится в ближайшем обновлении
                </p>
            </div>
        `;
    }
    
    function createProfileContent() {
        return `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${userData.avatarUrl ? 
                            `<img src="${userData.avatarUrl}" alt="${userData.username}">` : 
                            `<i class="fas fa-user"></i>`
                        }
                    </div>
                    <h2 class="profile-username">${userData.username}</h2>
                </div>
                
                <div class="profile-stats">
                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-value">${userData.totalVolume}</div>
                            <div class="stat-label">Total volume</div>
                        </div>
                        <span class="stat-separator">|</span>
                        <div class="stat-item">
                            <div class="stat-value">${userData.bought}</div>
                            <div class="stat-label">Bought</div>
                        </div>
                        <span class="stat-separator">|</span>
                        <div class="stat-item">
                            <div class="stat-value">${userData.sold}</div>
                            <div class="stat-label">Sold</div>
                        </div>
                    </div>
                </div>
                
                <div class="wallet-info">
                    <h3>TON Кошелек</h3>
                    ${userData.walletConnected ? 
                        `<div class="wallet-address">${userData.walletAddress}</div>
                         <div class="wallet-balance-info">
                             <span>Баланс:</span>
                             <span class="wallet-balance-amount">${userData.walletBalance.toFixed(2)} TON</span>
                         </div>` :
                        `<p style="color: #888; text-align: center;">Кошелек не подключен</p>`
                    }
                </div>
            </div>
        `;
    }
    
    function initLotteryPage() {
        const buyTicketBtn = document.getElementById('buy-ticket-btn');
        const participantStatus = document.getElementById('participant-status');
        
        if (userData.lotteryParticipating) {
            participantStatus.classList.add('active');
            buyTicketBtn.disabled = true;
            buyTicketBtn.innerHTML = '<i class="fas fa-check"></i><span>Вы уже участвуете</span>';
        }
        
        buyTicketBtn.addEventListener('click', async function() {
            if (userData.balance < 1) {
                tg.showAlert('❌ Недостаточно TON для покупки билета!');
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }
            
            userData.balance -= 1;
            userData.bought += 1;
            userData.lotteryParticipating = true;
            
            updateBalanceDisplay();
            saveUserData();
            
            participantStatus.classList.add('active');
            buyTicketBtn.disabled = true;
            buyTicketBtn.innerHTML = '<i class="fas fa-check"></i><span>Вы уже участвуете</span>';
            
            tg.showAlert('✅ Вы успешно приобрели билет! Удачи в розыгрыше!');
            tg.HapticFeedback.notificationOccurred('success');
        });
    }
    
    function initProfilePage() {
        // Профиль уже загружен, можно добавить дополнительные обработчики
    }
    
    function startLotteryTimer() {
        function updateTimer() {
            const endDate = new Date(LOTTERY_END_DATE);
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft <= 0) {
                // Лотерея завершена
                document.querySelectorAll('.countdown-value').forEach(el => el.textContent = '00');
                return;
            }
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            // Обновляем на всех страницах, где есть таймер
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            
            if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
        }
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }
    
    function setupEventListeners() {
        // Навигация
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const page = this.getAttribute('data-page');
                updateContent(page);
            });
        });
        
        // Открытие модалки баланса
        addBalanceBtn.addEventListener('click', () => {
            balanceModal.classList.add('active');
        });
        
        // Закрытие модалки баланса
        closeBalanceModal.addEventListener('click', () => {
            balanceModal.classList.remove('active');
        });
        
        // Клик вне модалки
        balanceModal.addEventListener('click', (e) => {
            if (e.target === balanceModal) {
                balanceModal.classList.remove('active');
            }
        });
        
        // Кнопка пополнения
        depositBtn.addEventListener('click', () => {
            balanceModal.classList.remove('active');
            depositModal.classList.add('active');
        });
        
        // Кнопка вывода
        withdrawBtn.addEventListener('click', async () => {
            if (!userData.walletConnected) {
                tg.showAlert('❌ Подключите кошелек TON для вывода средств');
                return;
            }
            
            if (userData.balance <= 0) {
                tg.showAlert('❌ Недостаточно средств на балансе');
                return;
            }
            
            tg.showPopup({
                title: 'Вывод средств',
                message: `Доступно для вывода: ${userData.balance} TON\n\nАдрес: ${userData.walletAddress}`,
                buttons: [
                    {id: 'withdraw_all', type: 'default', text: 'Вывести все'},
                    {id: 'withdraw_custom', type: 'default', text: 'Указать сумму'},
                    {type: 'cancel', text: 'Отмена'}
                ]
            }, async (buttonId) => {
                if (buttonId === 'withdraw_all') {
                    // В реальном приложении здесь был бы запрос к боту
                    tg.showAlert(`✅ Заявка на вывод ${userData.balance} TON отправлена!`);
                }
            });
        });
        
        // Подключение кошелька
        connectWalletBtn.addEventListener('click', () => {
            if (userData.walletConnected) {
                tonConnectUI.disconnect();
            } else {
                tonConnectUI.openModal();
            }
        });
        
        // Депозит модалка
        closeDepositModal.addEventListener('click', () => {
            depositModal.classList.remove('active');
        });
        
        cancelDeposit.addEventListener('click', () => {
            depositModal.classList.remove('active');
        });
        
        depositModal.addEventListener('click', (e) => {
            if (e.target === depositModal) {
                depositModal.classList.remove('active');
            }
        });
        
        // Быстрые суммы
        quickAmounts.forEach(button => {
            button.addEventListener('click', () => {
                const amount = button.getAttribute('data-amount');
                depositInput.value = amount;
            });
        });
        
        // Подтверждение депозита
        submitDeposit.addEventListener('click', async () => {
            const amount = parseFloat(depositInput.value);
            
            if (!amount || amount <= 0) {
                tg.showAlert('❌ Введите корректную сумму');
                return;
            }
            
            if (!userData.walletConnected) {
                tg.showAlert('❌ Подключите кошелек TON');
                return;
            }
            
            if (userData.walletBalance < amount) {
                tg.showAlert(`❌ Недостаточно средств в кошельке. Доступно: ${userData.walletBalance.toFixed(2)} TON`);
                return;
            }
            
            // Создаем транзакцию через TON Connect
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, // 10 минут
                messages: [
                    {
                        address: "UQBj-73MvYMYXrkcndu_CnwzpKmtwR9nKexMjjX9ZcdXohro", // Адрес бота (замените на реальный)
                        amount: (amount * 1000000000).toString(), // Конвертируем в наноТоны
                    }
                ]
            };
            
            try {
                const result = await tonConnectUI.sendTransaction(transaction);
                
                if (result) {
                    // Успешная транзакция
                    userData.balance += amount;
                    userData.walletBalance -= amount;
                    updateBalanceDisplay();
                    updateConnectInfo();
                    saveUserData();
                    
                    depositModal.classList.remove('active');
                    tg.showAlert(`✅ Успешно пополнено на ${amount} TON!`);
                    tg.HapticFeedback.notificationOccurred('success');
                }
            } catch (error) {
                console.error('Transaction error:', error);
                tg.showAlert('❌ Ошибка при выполнении транзакции');
            }
        });
        
        // Депозит из главного окна
        confirmDepositBtn.addEventListener('click', () => {
            const amount = parseFloat(depositAmountInput.value);
            
            if (!amount || amount <= 0) {
                tg.showAlert('❌ Введите корректную сумму');
                return;
            }
            
            if (!userData.walletConnected) {
                tg.showAlert('❌ Подключите кошелек TON');
                return;
            }
            
            if (userData.walletBalance < amount) {
                tg.showAlert(`❌ Недостаточно средств в кошельке. Доступно: ${userData.walletBalance.toFixed(2)} TON`);
                return;
            }
            
            // Показываем модалку подтверждения
            depositInput.value = amount;
            balanceModal.classList.remove('active');
            depositModal.classList.add('active');
        });
    }
    
    function saveUserData() {
        localStorage.setItem('user_balance', userData.balance.toString());
        localStorage.setItem('bought', userData.bought.toString());
        localStorage.setItem('sold', userData.sold.toString());
        localStorage.setItem('total_volume', userData.totalVolume.toString());
        localStorage.setItem('lottery_participating', userData.lotteryParticipating.toString());
    }
});

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
    const contentDisplay = document.getElementById('content-display');
    const balanceAmount = document.querySelector('.balance-amount');
    const addBalanceBtn = document.querySelector('.add-balance-btn');
    const tonIcon = document.querySelector('.ton-icon');
    
    // Текущий пользователь
    let userData = {
        id: tg.initDataUnsafe?.user?.id || Date.now(),
        balance: 1250, // Стартовый баланс
        username: tg.initDataUnsafe?.user?.username || 'Гость'
    };
    
    // Проверяем загрузку иконки TON
    function checkTonIcon() {
        setTimeout(() => {
            const icon = document.querySelector('.ton-icon');
            if (icon && (icon.naturalWidth === 0 || icon.complete === false)) {
                console.log('TON icon failed to load, using fallback');
                // Создаем SVG иконку TON
                const svg = `
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="14" cy="14" r="14" fill="#7B2FF7"/>
                        <path d="M14 8L19.5 11.625L14 15.25L8.5 11.625L14 8Z" fill="white"/>
                        <path d="M14 15.25L19.5 18.875L14 22.5L8.5 18.875L14 15.25Z" fill="white"/>
                    </svg>
                `;
                icon.src = 'data:image/svg+xml;base64,' + btoa(svg);
                icon.style.background = 'transparent';
            }
        }, 1500);
    }
    
    // Обновляем баланс на экране
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toLocaleString();
    }
    
    // Контент для страниц
    const pageContent = {
        home: {
            icon: 'fas fa-home',
            title: 'Главная страница',
            description: 'Добро пожаловать в BEAT CLUB! Здесь музыка встречается с технологиями. Собирай TON, участвуй в лотереях, выполняй задания и стань частью музыкального комьюнити.'
        },
        lottery: {
            icon: 'fas fa-dice',
            title: '🎰 Музыкальная лотерея',
            description: 'Испытай удачу в нашей эксклюзивной лотерее! Участвуй за TON и выигрывай уникальные NFT, премиум-подписки и эксклюзивный мерч. Новый розыгрыш каждую неделю!'
        },
        tasks: {
            icon: 'fas fa-tasks',
            title: '🎯 Ежедневные задания',
            description: 'Выполняй задания и получай TON! Подписывайся на каналы, приглашай друзей, слушай треки. Новые задания обновляются каждый день. Не пропусти свой бонус!'
        },
        rating: {
            icon: 'fas fa-trophy',
            title: '🏆 Топ игроков',
            description: 'Соревнуйся с другими участниками! Зарабатывай очки активности, участвуй в событиях и поднимайся в рейтинге. Топ-10 игроков получают эксклюзивные награды.'
        },
        profile: {
            icon: 'fas fa-user',
            title: '👤 Твой профиль',
            description: `Привет, ${userData.username}! Здесь ты можешь настроить профиль, посмотреть статистику, историю операций и подключить кошелек TON для вывода средств.`
        }
    };
    
    // Устанавливаем активную кнопку
    function setActiveButton(button) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    // Обновляем контент
    function updateContent(page) {
        const content = pageContent[page];
        
        if (!content) return;
        
        // Анимация исчезновения
        contentDisplay.style.opacity = '0';
        contentDisplay.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            // Обновляем контент
            const iconElement = contentDisplay.querySelector('.content-icon');
            const titleElement = contentDisplay.querySelector('h3');
            const descElement = contentDisplay.querySelector('p');
            
            if (page === 'profile') {
                descElement.textContent = pageContent.profile.description.replace('Гость', userData.username);
            } else {
                descElement.textContent = content.description;
            }
            
            iconElement.className = content.icon + ' content-icon';
            titleElement.textContent = content.title;
            
            // Анимация появления
            contentDisplay.style.opacity = '1';
            contentDisplay.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // Добавляем обработчики для кнопок
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
            
            // Вибрация (если поддерживается)
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
        
        // Показать меню пополнения
        tg.showPopup({
            title: '💰 Пополнение баланса',
            message: 'Выберите сумму для пополнения:',
            buttons: [
                {id: '100', type: 'default', text: '➕ 100 TON'},
                {id: '500', type: 'default', text: '➕ 500 TON'},
                {id: '1000', type: 'default', text: '➕ 1000 TON'},
                {type: 'cancel', text: '❌ Отмена'}
            ]
        }, function(buttonId) {
            if (buttonId === '100' || buttonId === '500' || buttonId === '1000') {
                const amount = parseInt(buttonId);
                userData.balance += amount;
                updateBalanceDisplay();
                tg.showAlert(`✅ Баланс пополнен на ${amount} TON!`);
                tg.HapticFeedback.notificationOccurred('success');
            }
        });
    });
    
    // Имитация получения данных пользователя из Telegram
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        userData.username = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
        userData.id = user.id;
        
        console.log('User data loaded:', userData);
    }
    
    // Инициализация
    updateBalanceDisplay();
    updateContent('home');
    checkTonIcon();
    
    // Плавное появление
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    // Автоматическое обновление баланса (имитация активности)
    let balanceUpdateInterval = setInterval(() => {
        // Случайное обновление баланса
        if (Math.random() > 0.5) {
            const randomBonus = Math.floor(Math.random() * 15) + 1;
            userData.balance += randomBonus;
            updateBalanceDisplay();
            
            // Легкая вибрация при получении бонуса
            if (Math.random() > 0.8 && navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
    }, 45000); // Каждые 45 секунд
    
    // Имитация получения уведомлений
    setInterval(() => {
        // Случайное уведомление о задании
        if (Math.random() > 0.85) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }, 60000);
    
    // Обработка закрытия приложения
    tg.onEvent('viewportChanged', function() {
        if (tg.isExpanded) {
            console.log('App expanded to full screen');
        }
    });
    
    // Отправка данных в бота при закрытии
    window.addEventListener('beforeunload', function() {
        clearInterval(balanceUpdateInterval);
        
        // Можно отправить финальные данные
        tg.sendData(JSON.stringify({
            action: 'close',
            balance: userData.balance,
            userId: userData.id,
            timestamp: Date.now()
        }));
    });
    
    // Проверяем иконку TON при загрузке
    window.addEventListener('load', checkTonIcon);
    
    // Предзагрузка контента для быстрого переключения
    function preloadContent() {
        Object.values(pageContent).forEach(content => {
            const icon = document.createElement('i');
            icon.className = content.icon + ' content-icon';
            icon.style.display = 'none';
            document.body.appendChild(icon);
        });
    }
    
    preloadContent();
});

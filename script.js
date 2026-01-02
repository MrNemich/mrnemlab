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
    
    // Текущий пользователь
    let userData = {
        id: tg.initDataUnsafe?.user?.id || Date.now(),
        balance: 1000, // Стартовый баланс
        username: tg.initDataUnsafe?.user?.username || 'Гость'
    };
    
    // Обновляем баланс на экране
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toLocaleString();
    }
    
    // Контент для страниц
    const pageContent = {
        home: {
            icon: 'fas fa-home',
            title: 'Добро пожаловать в BEAT CLUB',
            description: 'Это твое музыкальное пространство! Собирай TON, участвуй в эксклюзивных лотереях, выполняй задания и становись лучшим в рейтинге. Музыка никогда не звучала так выгодно!'
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
            title: '🏆 Топ игроков BEAT CLUB',
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
        contentDisplay.style.transform = 'translateY(15px)';
        
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
                navigator.vibrate(30);
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
        
        // Показать меню пополнения
        tg.showPopup({
            title: 'Пополнение баланса',
            message: 'Выберите способ пополнения:',
            buttons: [
                {id: 'ton', type: 'default', text: 'Через TON'},
                {id: 'crypto', type: 'default', text: 'Криптовалютой'},
                {type: 'cancel'}
            ]
        }, function(buttonId) {
            if (buttonId === 'ton') {
                tg.showAlert('В разработке. Скоро можно будет пополнить через TON!');
            } else if (buttonId === 'crypto') {
                tg.showAlert('В разработке. Скоро будут доступны другие криптовалюты!');
            }
        });
    });
    
    // Имитация получения данных пользователя из Telegram
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        userData.username = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
        userData.id = user.id;
        
        // Можно отправить данные на сервер
        console.log('User data:', user);
    }
    
    // Инициализация
    updateBalanceDisplay();
    updateContent('home');
    
    // Анимация загрузки
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 50);
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease';
    
    // Имитация получения уведомлений
    setInterval(() => {
        // Случайное уведомление
        if (Math.random() > 0.7) {
            tg.HapticFeedback.impactOccurred('light');
            
            // Добавляем немного баланса за активность
            userData.balance += Math.floor(Math.random() * 10) + 1;
            updateBalanceDisplay();
        }
    }, 30000);
    
    // Обработка закрытия приложения
    tg.onEvent('viewportChanged', function() {
        if (tg.isExpanded) {
            console.log('App expanded');
        }
    });
    
    // Отправка данных в бота при закрытии
    window.addEventListener('beforeunload', function() {
        // Можно отправить финальные данные
        tg.sendData(JSON.stringify({
            action: 'close',
            balance: userData.balance,
            userId: userData.id
        }));
    });
    
    // Демонстрационный режим - обновление баланса
    setInterval(() => {
        userData.balance += Math.floor(Math.random() * 5);
        updateBalanceDisplay();
    }, 60000); // Каждую минуту добавляем немного баланса
});

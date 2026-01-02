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
    const userAvatarElement = document.getElementById('user-avatar');
    const userNameElement = document.getElementById('user-name');
    
    // Текущий пользователь
    let userData = {
        id: null,
        balance: 1250,
        username: 'Гость',
        avatarUrl: null
    };
    
    // Проверяем загрузку иконки TON
    function checkTonIcon() {
        setTimeout(() => {
            const icon = document.querySelector('.ton-icon');
            if (icon && (icon.naturalWidth === 0 || icon.complete === false)) {
                console.log('TON icon failed to load, using fallback');
                // Создаем SVG иконку TON
                const svg = `
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="13" cy="13" r="13" fill="#7B2FF7"/>
                        <path d="M13 7L18.5 10.625L13 14.25L7.5 10.625L13 7Z" fill="white"/>
                        <path d="M13 14.25L18.5 17.875L13 21.5L7.5 17.875L13 14.25Z" fill="white"/>
                    </svg>
                `;
                icon.src = 'data:image/svg+xml;base64,' + btoa(svg);
                icon.style.background = 'transparent';
            }
        }, 1500);
    }
    
    // Загружаем аватарку пользователя из Telegram
    function loadUserAvatar() {
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
            
            // Проверяем наличие фото профиля
            if (user.photo_url) {
                // Используем настоящую аватарку из Telegram
                userData.avatarUrl = user.photo_url;
                
                // Создаем элемент изображения для аватарки
                const avatarImg = document.createElement('img');
                avatarImg.src = user.photo_url;
                avatarImg.alt = name;
                avatarImg.onload = function() {
                    // Удаляем плейсхолдер и добавляем настоящую аватарку
                    const placeholder = userAvatarElement.querySelector('.avatar-placeholder');
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                    userAvatarElement.appendChild(avatarImg);
                    
                    // Добавляем анимацию
                    avatarImg.style.animation = 'avatarPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                };
                
                avatarImg.onerror = function() {
                    console.log('Failed to load avatar, using placeholder');
                    // Оставляем плейсхолдер если аватарка не загрузилась
                };
            } else {
                // Если нет аватарки, создаем градиентную инициалу
                const placeholder = userAvatarElement.querySelector('.avatar-placeholder');
                if (placeholder) {
                    // Создаем первую букву имени
                    const initial = name.charAt(0).toUpperCase();
                    placeholder.innerHTML = `<span style="font-size: 1.2rem; font-weight: bold;">${initial}</span>`;
                    placeholder.style.background = getRandomGradient();
                }
            }
            
            console.log('User data loaded:', userData);
        } else {
            // Если нет данных пользователя, создаем случайный градиент для плейсхолдера
            const placeholder = userAvatarElement.querySelector('.avatar-placeholder');
            if (placeholder) {
                placeholder.style.background = getRandomGradient();
            }
        }
    }
    
    // Генерирует случайный градиент для аватарки
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
    
    // Обновляем баланс на экране
    function updateBalanceDisplay() {
        balanceAmount.textContent = userData.balance.toLocaleString();
    }
    
    // Контент для страниц
    const pageContent = {
        home: {
            icon: 'fas fa-home',
            title: 'Главная страница',
            description: 'Товаров нет, приходите позже...',
            isEmpty: true
        },
        lottery: {
            icon: 'fas fa-dice',
            title: '🎰 Музыкальная лотерея',
            description: 'Испытай удачу в нашей эксклюзивной лотерее! Участвуй за TON и выигрывай уникальные NFT, премиум-подписки и эксклюзивный мерч.'
        },
        tasks: {
            icon: 'fas fa-tasks',
            title: '🎯 Ежедневные задания',
            description: 'Выполняй задания и получай TON! Подписывайся на каналы, приглашай друзей, слушай треки.'
        },
        rating: {
            icon: 'fas fa-trophy',
            title: '🏆 Топ игроков',
            description: 'Соревнуйся с другими участниками! Зарабатывай очки активности и поднимайся в рейтинге.'
        },
        profile: {
            icon: 'fas fa-user',
            title: '👤 Твой профиль',
            description: `Привет, ${userData.username}! Здесь ты можешь настроить профиль, посмотреть статистику и историю операций.`
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
                descElement.textContent = `Привет, ${userData.username}! Здесь ты можешь настроить профиль, посмотреть статистику и историю операций.`;
            } else {
                descElement.textContent = content.description;
            }
            
            // Добавляем класс для пустого сообщения
            if (page === 'home') {
                descElement.classList.add('empty-message');
            } else {
                descElement.classList.remove('empty-message');
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
    
    // Инициализация
    loadUserAvatar();
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
            username: userData.username,
            timestamp: Date.now()
        }));
    });
    
    // Проверяем иконку TON при загрузке
    window.addEventListener('load', checkTonIcon);
    
    // Обновляем профиль при загрузке аватарки
    setTimeout(() => {
        if (pageContent.profile) {
            pageContent.profile.description = `Привет, ${userData.username}! Здесь ты можешь настроить профиль, посмотреть статистику и историю операций.`;
        }
    }, 1000);
});

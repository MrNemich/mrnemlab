document.addEventListener('DOMContentLoaded', function() {
    // Получаем все элементы
    const navButtons = document.querySelectorAll('.nav-button');
    const contentDisplay = document.getElementById('content-display');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // Переменные для управления скроллом
    let lastScrollTop = 0;
    let scrollTimeout;
    
    // Контент для каждой страницы
    const pageContent = {
        home: {
            icon: 'fas fa-home',
            title: 'Добро пожаловать в GiftLab',
            description: 'GiftLab - это ваша лаборатория подарков и развлечений! Здесь вы найдете идеальные подарки, увлекательные игры и возможности для улучшения. Используйте нижнюю панель для навигации.'
        },
        games: {
            icon: 'fas fa-gamepad',
            title: 'Игровая лаборатория',
            description: 'Добро пожаловать в игровую лабораторию GiftLab! Здесь вы найдете увлекательные игры и развлечения. Скоро появятся новые эксклюзивные игры только для пользователей GiftLab.'
        },
        upgrade: {
            icon: 'fas fa-rocket',
            title: 'Апгрейд GiftLab',
            description: 'Улучшите свой GiftLab опыт! Откройте премиум функции, эксклюзивные подарки и расширенные возможности. Доступны различные планы подписки для максимального удовольствия.'
        },
        profile: {
            icon: 'fas fa-user-astronaut',
            title: 'Ваш профиль в GiftLab',
            description: 'Настройте свой профиль в GiftLab! Измените аватар, просмотрите историю подарков, настройте предпочтения и управляйте своей коллекцией.'
        }
    };
    
    // Функция для смены активной кнопки
    function setActiveButton(button) {
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        button.classList.add('active');
        
        // Показываем навигацию при нажатии
        showNavigation();
    }
    
    // Функция для обновления контента
    function updateContent(page) {
        const content = pageContent[page];
        
        // Анимация исчезновения
        contentDisplay.style.opacity = '0';
        contentDisplay.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            // Обновляем контент
            const iconElement = contentDisplay.querySelector('.content-icon');
            iconElement.className = content.icon + ' content-icon';
            
            const titleElement = contentDisplay.querySelector('h3');
            titleElement.textContent = content.title;
            
            const descElement = contentDisplay.querySelector('p');
            descElement.textContent = content.description;
            
            // Анимация появления
            contentDisplay.style.opacity = '1';
            contentDisplay.style.transform = 'translateY(0)';
            contentDisplay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        }, 200);
    }
    
    // Функция для показа навигации
    function showNavigation() {
        bottomNav.classList.remove('hidden');
        bottomNav.classList.add('visible');
        
        // Сбрасываем таймер скрытия
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // Автоматически скрываем через 3 секунды
        scrollTimeout = setTimeout(() => {
            if (!isAnyButtonHovered()) {
                hideNavigation();
            }
        }, 3000);
    }
    
    // Функция для скрытия навигации
    function hideNavigation() {
        bottomNav.classList.remove('visible');
        bottomNav.classList.add('hidden');
    }
    
    // Проверка наведения на кнопки
    function isAnyButtonHovered() {
        return Array.from(navButtons).some(button => 
            button.matches(':hover') || button.classList.contains('active')
        );
    }
    
    // Обработчик скролла для интеллектуального скрытия/показа навигации
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop) {
            // Прокрутка вниз - скрываем
            hideNavigation();
        } else {
            // Прокрутка вверх - показываем
            showNavigation();
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Обработчики для кнопок навигации
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
        });
        
        // Показывать навигацию при наведении
        button.addEventListener('mouseenter', showNavigation);
    });
    
    // Показывать навигацию при касании в мобильных устройствах
    document.addEventListener('touchstart', showNavigation);
    
    // Инициализация анимации
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
    
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    // Инициализация начального состояния
    updateContent('home');
    
    // Интерактивность для заголовка
    const titleElement = document.querySelector('.app-title');
    titleElement.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    titleElement.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Показываем навигацию при загрузке
    setTimeout(showNavigation, 1000);
});

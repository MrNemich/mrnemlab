document.addEventListener('DOMContentLoaded', function() {
    // Получаем все кнопки навигации
    const navButtons = document.querySelectorAll('.nav-button');
    const contentDisplay = document.getElementById('content-display');
    
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
        // Убираем активный класс со всех кнопок
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс к нажатой кнопке
        button.classList.add('active');
    }
    
    // Функция для обновления контента
    function updateContent(page) {
        const content = pageContent[page];
        
        // Обновляем иконку
        const iconElement = contentDisplay.querySelector('.content-icon');
        iconElement.className = content.icon + ' content-icon';
        
        // Обновляем заголовок
        const titleElement = contentDisplay.querySelector('h3');
        titleElement.textContent = content.title;
        
        // Обновляем описание
        const descElement = contentDisplay.querySelector('p');
        descElement.textContent = content.description;
        
        // Добавляем анимацию смены контента
        contentDisplay.style.opacity = '0';
        contentDisplay.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            contentDisplay.style.opacity = '1';
            contentDisplay.style.transform = 'translateY(0)';
        }, 150);
    }
    
    // Добавляем обработчики событий для каждой кнопки
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            // Устанавливаем активную кнопку
            setActiveButton(this);
            
            // Обновляем контент
            updateContent(page);
            
            // Добавляем небольшой эффект нажатия
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Добавляем анимацию при загрузке
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
    
    // Инициализация стилей для анимации
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    // Инициализация начального состояния
    updateContent('home');
    
    // Добавляем интерактивность для заголовка
    const titleElement = document.querySelector('.app-title');
    titleElement.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    titleElement.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});
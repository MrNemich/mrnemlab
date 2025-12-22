document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы
    const navButtons = document.querySelectorAll('.nav-button');
    const contentDisplay = document.getElementById('content-display');
    
    // Контент для страниц
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
            
            iconElement.className = content.icon + ' content-icon';
            titleElement.textContent = content.title;
            descElement.textContent = content.description;
            
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
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Инициализация
    updateContent('home');
    
    // Анимация загрузки
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 50);
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
});

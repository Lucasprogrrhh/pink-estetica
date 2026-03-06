const app = {
    currentScreen: 'login',
    currentUser: null, // Holds logged in user object: { name, email, phone, points, appointments: [], notifications: [] }
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    currentDate: new Date(),

    // Database Simulator using localStorage
    db: {
        getUsers: function () {
            return JSON.parse(localStorage.getItem('pink_users')) || [];
        },
        saveUsers: function (users) {
            localStorage.setItem('pink_users', JSON.stringify(users));
        },
        getUser: function (email) {
            return this.getUsers().find(u => u.email === email);
        },
        updateUser: function (user) {
            let users = this.getUsers();
            const index = users.findIndex(u => u.email === user.email);
            if (index !== -1) {
                users[index] = user;
                this.saveUsers(users);
            }
        },
        getReviews: function () {
            let reviews = JSON.parse(localStorage.getItem('pink_reviews'));
            if (!reviews) {
                // Initialize with some mock reviews
                reviews = [
                    { author: 'Sofia M', title: '¡Ojos increíbles! 😍', text: 'Milagros es una genia. Mis pestañas quedaron súper naturales pero con un volumen hermoso. La atención y la delicadeza son un 10.', rating: 5, date: 'Hace 2 días', service: 'Lifting de pestañas', photos: ['https://images.unsplash.com/photo-1512496015851-a9089ab24e2c'] }
                ];
                localStorage.setItem('pink_reviews', JSON.stringify(reviews));
            }
            return reviews;
        },
        saveReview: function (review) {
            let reviews = this.getReviews();
            reviews.unshift(review); // Add to the top
            localStorage.setItem('pink_reviews', JSON.stringify(reviews));
        },
        getServices: function () {
            let services = JSON.parse(localStorage.getItem('pink_services'));
            if (!services) {
                // Initialize defaults
                services = {
                    'uñas': { name: 'Uñas (Manicura)', img: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702', price: '$15.000 ARS', duration: '90 min', icon: '' },
                    'pies': { name: 'Pies (Pedicuria)', img: '', price: '$18.000 ARS', duration: '60 min', icon: '<i class="fa-solid fa-shoe-prints"></i>' },
                    'lifting': { name: 'Lifting de Pestañas', img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15', price: '$22.000 ARS', duration: '60 min', icon: '' },
                    'depilacion': { name: 'Depilación Definitiva', img: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8', price: '$25.000 ARS', duration: '30 min', icon: '' }
                };
                localStorage.setItem('pink_services', JSON.stringify(services));
            }
            return services;
        },
        updateServicePrice: function (id, newPrice) {
            let services = this.getServices();
            if (services[id]) {
                services[id].price = newPrice;
                localStorage.setItem('pink_services', JSON.stringify(services));
            }
        },
        addService: function (key, data) {
            let services = this.getServices();
            services[key] = data;
            localStorage.setItem('pink_services', JSON.stringify(services));
        },
        deleteService: function (key) {
            let services = this.getServices();
            delete services[key];
            localStorage.setItem('pink_services', JSON.stringify(services));
        },
        getSettings: function () {
            let settings = localStorage.getItem('pink_settings');
            if (settings) {
                return JSON.parse(settings);
            }
            const defaultSettings = {
                whatsapp: '5491100000000'
            };
            localStorage.setItem('pink_settings', JSON.stringify(defaultSettings));
            return defaultSettings;
        },
        updateSettings: function (key, value) {
            let settings = this.getSettings();
            settings[key] = value;
            localStorage.setItem('pink_settings', JSON.stringify(settings));
        }
    },

    // UI Elements
    screens: {
        login: document.getElementById('screen-login'),
        home: document.getElementById('screen-home'),
        services: document.getElementById('screen-services'),
        booking: document.getElementById('screen-booking'),
        turnos: document.getElementById('screen-turnos'),
        notifications: document.getElementById('screen-notifications'),
        rewards: document.getElementById('screen-rewards'),
        profile: document.getElementById('screen-profile'),
        professional: document.getElementById('screen-professional'),
        'review-form': document.getElementById('screen-review-form'),
        signup: document.getElementById('screen-signup'),
        'forgot-pwd': document.getElementById('screen-forgot-pwd'),
        admin: document.getElementById('screen-admin')
    },

    servicesMap: {
        'uñas': { name: 'Uñas (Manicura)', img: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702', price: '$15.000 ARS' },
        'pies': { name: 'Pies (Pedicuria)', img: 'pedicura.png', price: '$18.000 ARS' },
        'lifting': { name: 'Lifting de Pestañas', img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15', price: '$22.000 ARS' },
        'depilacion': { name: 'Depilación Definitiva', img: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8', price: '$25.000 ARS' }
    },

    init: function () {
        // Enforce DB init to make services available
        this.db.getServices();

        this.renderCalendar();
        document.getElementById('search-input').addEventListener('keyup', this.handleSearch.bind(this));

        // Check active session
        const session = localStorage.getItem('pink_session');
        if (session) {
            this.currentUser = JSON.parse(session);
            // Default global notifications to new users
            if (this.currentUser.notifications.length === 0) {
                this.currentUser.notifications = [
                    { id: 1, title: '¡Bienvenida a Pink!', date: 'Hoy', desc: 'Gracias por sumarte a nuestra comunidad estética.', icon: 'fa-heart', color: '#FFB6C1' }
                ];
                this.db.updateUser(this.currentUser);
            }
            this.navigate('home');
        } else {
            this.navigate('login');
        }
    },

    navigate: function (screenId) {
        // Protect routes from non-logged in users
        const authRoutes = ['home', 'services', 'booking', 'turnos', 'notifications', 'rewards', 'profile', 'professional', 'review-form'];
        if (authRoutes.includes(screenId) && !this.currentUser) {
            screenId = 'login';
        }

        // Protect admin route
        if (screenId === 'admin' && (!this.currentUser || this.currentUser.role !== 'admin')) {
            screenId = 'login';
        }

        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // Hide floating search results if they exist
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }

        // Show target screen
        if (this.screens[screenId]) {
            this.screens[screenId].classList.add('active');
            this.currentScreen = screenId;
        }

        // Specific Screen Render Hooks
        if (screenId === 'home') {
            const avatarUrl = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${this.currentUser.name.replace(' ', '+')}&background=fff&color=FF1493`;
            document.getElementById('home-avatar').src = avatarUrl;
            document.getElementById('home-greeting').innerText = `¡Hola, ${this.currentUser.name.split(' ')[0]}!`;
            // Reset Booking
            this.selectedService = null;
            this.selectedDate = null;
            this.selectedTime = null;
        }

        if (screenId === 'services') {
            this.renderServicesList();
        }

        // Reset state on navigation to home
        if (screenId === 'home') {
            this.selectedService = null;
            this.selectedDate = null;
            this.selectedTime = null;
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.day').forEach(el => el.classList.remove('active'));
            document.getElementById('client-name').value = '';
            document.getElementById('client-email').value = '';
            document.getElementById('time-slots').innerHTML = '';
        }

        if (screenId === 'booking') {
            this.renderCalendar();
        }

        if (screenId === 'turnos') {
            this.renderAppointments();
        }

        if (screenId === 'notifications') {
            this.renderNotifications();
        }

        if (screenId === 'rewards') {
            this.renderRewards();
        }

        if (screenId === 'profile') {
            this.renderProfile();
        }

        if (screenId === 'professional') {
            this.renderReviews('Todos');
        }

        if (screenId === 'admin') {
            this.renderAdminDashboard();
        }
    },

    // Authentication Logic
    registerUser: function () {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const pwd = document.getElementById('signup-password').value;

        if (!name || !email || !phone || !pwd) {
            alert("Por favor completa todos los campos del formulario.");
            return;
        }

        if (this.db.getUser(email)) {
            alert("Ya existe una cuenta con este correo electrónico.");
            return;
        }

        const newUser = {
            name, email, phone, password: pwd,
            points: 0, appointments: [], notifications: []
        };

        const users = this.db.getUsers();
        users.push(newUser);
        this.db.saveUsers(users);

        alert("¡Cuenta creada exitosamente!");

        // Auto-login
        this.currentUser = newUser;
        localStorage.setItem('pink_session', JSON.stringify(newUser));
        this.navigate('home');
    },

    loginUser: function () {
        const email = document.getElementById('login-email').value.trim();
        const pwd = document.getElementById('login-password').value;

        if (!email || !pwd) {
            alert("Ingresa correo y contraseña.");
            return;
        }

        // Secret Admin Bypass
        if (email === 'admin@pink.com' && pwd === 'admin123') {
            const adminUser = {
                name: 'Milagros (Admin)',
                email: 'admin@pink.com',
                role: 'admin',
                appointments: [],
                notifications: []
            };
            this.currentUser = adminUser;
            localStorage.setItem('pink_session', JSON.stringify(adminUser));
            this.navigate('admin');
            return;
        }

        const user = this.db.getUser(email);
        if (!user || user.password !== pwd) {
            alert("Correo o contraseña incorrectos.");
            return;
        }

        this.currentUser = user;
        localStorage.setItem('pink_session', JSON.stringify(user));
        this.navigate('home');
    },

    logout: function () {
        this.currentUser = null;
        localStorage.removeItem('pink_session');

        // Clear forms
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';

        this.navigate('login');
    },

    renderServicesList: function () {
        const container = document.getElementById('services-list-container');
        if (!container) return;

        const services = this.db.getServices();
        let html = '';

        for (const [key, service] of Object.entries(services)) {
            let imageContent = service.img
                ? `<img src="${service.img}" alt="${service.name}" class="service-img">`
                : `<div style="min-width: 80px; height: 80px; border-radius: 12px; background:#f0f0f0; display: flex; align-items:center; justify-content:center; color: var(--text-light); font-size: 24px;">${service.icon}</div>`;

            html += `
                <div class="service-card" onclick="app.selectService('${key}')">
                    ${imageContent}
                    <div class="service-info">
                        <h4 class="service-name">${service.name}</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span class="service-price">${service.price}</span>
                            <span class="service-duration"><i class="fa-regular fa-clock"></i> ${service.duration}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    selectService: function (serviceId) {
        const services = this.db.getServices();
        this.selectedService = services[serviceId];

        // Update booking screen UI before navigating
        if (this.selectedService) {
            document.getElementById('selected-service-img').src = this.selectedService.img;
            document.getElementById('selected-service-name').innerText = this.selectedService.name;
            document.querySelector('.service-price').innerText = this.selectedService.price;
        }

        this.navigate('booking');
    },

    // Calendar logic
    renderCalendar: function () {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();

        document.getElementById('current-month').innerText = `${monthNames[month]}, ${year}`;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';

        const today = new Date();

        let html = '';
        let currentDayToRender = (month === today.getMonth() && year === today.getFullYear()) ? today.getDate() : 1;

        // Show up to 7 days from the current viewed date
        for (let i = 0; i < 7; i++) {
            let loopDate = new Date(year, month, currentDayToRender + i);
            if (loopDate.getMonth() !== month) break; // End of month reached

            let dName = dayNames[loopDate.getDay()];
            let dNum = loopDate.getDate();

            let isActive = this.selectedDate && this.selectedDate.getDate() === dNum && this.selectedDate.getMonth() === month ? 'active' : '';

            html += `
                <div class="day ${isActive}" onclick="app.selectDay(this, ${dNum})">
                    <span class="day-name">${dName}</span>
                    <span class="day-num">${dNum}</span>
                </div>
            `;
        }

        calendarDays.innerHTML = html || '<div style="width: 100%; text-align: center; color: #777; font-size: 14px;">No hay fechas disponibles este mes</div>';

        // Clear time slots if month changed
        if (!this.selectedDate || this.selectedDate.getMonth() !== month) {
            document.getElementById('time-slots').innerHTML = '';
        }
    },

    changeMonth: function (direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    },

    selectDay: function (element, day) {
        document.querySelectorAll('.day').forEach(el => el.classList.remove('active'));
        element.classList.add('active');

        this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);

        this.renderTimeSlots();
    },

    renderTimeSlots: function () {
        const timeSlotsContainer = document.getElementById('time-slots');
        // Simulated available times
        const times = ['09:00', '10:00', '11:00', '14:00', '15:30', '17:00'];
        let html = '';

        times.forEach(time => {
            let isActive = this.selectedTime === time ? 'active' : '';
            html += `<div class="time-slot ${isActive}" onclick="app.selectTime(this, '${time}')">${time}</div>`;
        });

        timeSlotsContainer.innerHTML = html;
    },

    selectTime: function (element, time) {
        document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        this.selectedTime = time;
    },

    confirmBooking: function () {
        const name = document.getElementById('client-name').value;

        if (!this.selectedService) {
            alert('Por favor selecciona un servicio.');
            return;
        }
        if (!this.selectedDate) {
            alert('Por favor selecciona un día.');
            return;
        }
        if (!this.selectedTime) {
            alert('Por favor selecciona un horario.');
            return;
        }
        if (!name.trim()) {
            alert('Por favor ingresa tu nombre.');
            return;
        }

        const dateStr = this.selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        this.currentUser.appointments.push({
            service: this.selectedService,
            dateStr: dateStr,
            time: this.selectedTime,
            professional: 'Milagros'
        });

        // Add 10 points for booking as incentive
        this.currentUser.points += 10;

        // Add Notification
        this.currentUser.notifications.unshift({
            id: Date.now(),
            title: '¡Turno Confirmado!',
            date: 'Ahora',
            desc: `Has reservado ${this.selectedService.name} para el ${dateStr} a las ${this.selectedTime}.`,
            icon: 'fa-calendar-check',
            color: '#25D366'
        });

        this.db.updateUser(this.currentUser);
        localStorage.setItem('pink_session', JSON.stringify(this.currentUser));

        // Build success message
        document.getElementById('success-message').innerText =
            `Hola ${name}, tu turno de ${this.selectedService.name} con Milagros para el ${dateStr} a las ${this.selectedTime} ha sido reservado exitosamente.`;

        // Show overlay
        document.getElementById('success-overlay').style.display = 'flex';
    },

    closeSuccess: function () {
        document.getElementById('success-overlay').style.display = 'none';
        this.navigate('home');
    },

    sendWhatsApp: function () {
        const name = document.getElementById('client-name').value || 'Cliente';
        const dateStr = this.selectedDate ? this.selectedDate.toLocaleDateString('es-ES') : '';
        let text = `Hola Milagros, soy ${name}. Quería confirmar mi turno para ${this.selectedService.name} el día ${dateStr} a las ${this.selectedTime}.`;
        let encodedText = encodeURIComponent(text);

        const settings = this.db.getSettings();
        const phoneNumber = settings.whatsapp || '5491100000000';

        window.open(`https://wa.me/${phoneNumber}?text=${encodedText}`, '_blank');
    },

    sendEmail: function () {
        const name = document.getElementById('client-name').value || 'Cliente';
        const email = document.getElementById('client-email').value;
        const dateStr = this.selectedDate ? this.selectedDate.toLocaleDateString('es-ES') : '';

        let subject = encodeURIComponent(`Turno Confirmado - Pink Estetica`);
        let body = encodeURIComponent(`Hola ${name},\n\nTu turno de ${this.selectedService.name} está confirmado para el día ${dateStr} a las ${this.selectedTime}.\n\n¡Te esperamos en Pink Estetica!`);

        if (email.trim()) {
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
        } else {
            alert('Por favor ingresa tu correo electrónico en el formulario para poder enviarte el mail.');
        }
    },

    renderAppointments: function () {
        const container = document.getElementById('appointments-container');
        if (!container || !this.currentUser) return;

        if (!this.currentUser.appointments || this.currentUser.appointments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 50px; color: var(--text-light);">
                    <div style="font-size: 50px; color: var(--pale-pink); margin-bottom: 20px;">
                        <i class="fa-regular fa-calendar-xmark"></i>
                    </div>
                    <h3>No tienes turnos activos</h3>
                    <p class="mt-10">Reserva un servicio para verlo aquí.</p>
                    <button class="btn-primary mt-30" onclick="app.navigate('services')">Reservar un Turno</button>
                </div>
            `;
            return;
        }

        let html = '';
        this.currentUser.appointments.forEach((appnt, index) => {
            html += `
                <div class="selected-service-card mb-20" style="flex-direction: column; align-items: flex-start;">
                    <div style="display: flex; justify-content: space-between; width: 100%; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 10px;">
                        <div style="font-weight: 600; color: var(--primary-pink); font-size: 14px;">
                            <i class="fa-regular fa-calendar mr-10"></i> ${appnt.dateStr}
                        </div>
                        <div style="font-weight: 600; background: #FFF0F5; padding: 4px 8px; border-radius: 8px; color: var(--primary-pink); font-size: 12px;">
                            <i class="fa-regular fa-clock mr-10"></i> ${appnt.time}
                        </div>
                    </div>
                    <div class="service-preview" style="width: 100%; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${appnt.service.img}" alt="Service" style="width: 60px; height: 60px;">
                            <div>
                                <h4>${appnt.service.name}</h4>
                                <p style="font-size: 12px;">Profesional: ${appnt.professional}</p>
                            </div>
                        </div>
                        <button onclick="app.cancelAppointment(${index})" style="background: none; border: none; color: #ff4757; cursor: pointer; font-size: 18px; padding: 10px;">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    cancelAppointment: function (index) {
        if (confirm("¿Estás segura que deseas cancelar este turno?")) {
            // Remove the appointment from the array
            this.currentUser.appointments.splice(index, 1);

            // Save to DB and LocalStorage
            this.db.updateUser(this.currentUser);
            localStorage.setItem('pink_session', JSON.stringify(this.currentUser));

            // Re-render the list
            this.renderAppointments();

            // Optional visually notify the user
            alert("Turno cancelado exitosamente.");
        }
    },

    renderNotifications: function () {
        const container = document.getElementById('notifications-container');
        if (!container || !this.currentUser) return;

        if (!this.currentUser.notifications || this.currentUser.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 50px; color: var(--text-light);">
                    <i class="fa-regular fa-bell-slash" style="font-size: 50px; color: var(--pale-pink); margin-bottom: 20px;"></i>
                    <h3>No hay novedades</h3>
                </div>
            `;
            return;
        }

        let html = '';
        this.currentUser.notifications.forEach(notif => {
            html += `
                <div class="notification-card" style="background: white; border-radius: 16px; padding: 15px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0; display: flex; gap: 15px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${notif.color}20; color: ${notif.color}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                        <i class="fa-solid ${notif.icon}"></i>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                            <h4 style="font-size: 14px; color: var(--text-dark); margin:0;">${notif.title}</h4>
                            <span style="font-size: 10px; color: var(--text-light); white-space: nowrap; margin-left: 10px;">${notif.date}</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-light); margin:0; line-height: 1.4;">${notif.desc}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderRewards: function () {
        if (!this.currentUser) return;
        const p = this.currentUser.points || 0;
        let tierName = "Silver";
        let tierColor = "#a6a6a6"; // Silver grey
        let nextTier = "Gold";
        let nextTierPoints = 151;
        let progress = (p / 150) * 100;

        let benefits = `
            <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> Acumulas puntos</li>
            <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> Acceso a promos exclusivas</li>
        `;

        if (p >= 151 && p <= 400) {
            tierName = "Gold";
            tierColor = "#FFD700"; // Gold
            nextTier = "Platinum";
            nextTierPoints = 401;
            progress = ((p - 150) / 250) * 100;
            benefits = `
                <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> 10% permanente en servicios</li>
                <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> 1 regalo en tu cumpleaños</li>
            `;
        } else if (p >= 401) {
            tierName = "Platinum";
            tierColor = "#E5E4E2"; // Platinum
            progress = 100;
            nextTier = "Max";
            nextTierPoints = p;
            benefits = `
                <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> 15% permanente en servicios</li>
                <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> Turnos prioritarios</li>
                <li style="margin-bottom: 8px;"><i class="fa-solid fa-check text-pink mr-10"></i> Servicio mini regalo trimestral</li>
            `;
        }

        progress = Math.min(Math.max(progress, 5), 100); // Between 5% and 100% for UI

        const html = `
            <!-- Top Status Card -->
            <div style="background: linear-gradient(135deg, ${tierColor}, ${tierColor}dd); border-radius: 20px; padding: 25px; color: ${tierName === 'Gold' ? '#333' : 'white'}; text-align: center; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
                <i class="fa-solid fa-gem" style="position: absolute; right: -20px; top: -20px; font-size: 100px; opacity: 0.1;"></i>
                <img src="https://ui-avatars.com/api/?name=${this.currentUser.name.replace(' ', '+')}&background=fff&color=${tierColor.substring(1)}" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid white; margin-bottom: 15px;" alt="User">
                <h3 style="font-size: 24px; margin-bottom: 5px;">${p} <span style="font-size: 16px; font-weight: normal;">pts</span></h3>
                <div style="display: inline-block; background: rgba(255,255,255,0.3); padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                    Nivel ${tierName}
                </div>
                
                ${tierName !== 'Platinum' ? `
                <div style="margin-top: 25px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
                        <span>Nivel Actual</span>
                        <span>Faltan ${nextTierPoints - p} pts para ${nextTier}</span>
                    </div>
                    <div style="height: 6px; background: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden;">
                        <div style="height: 100%; width: ${progress}%; background: white; border-radius: 5px;"></div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Benefits -->
            <div class="section-header">
                <h3>Beneficios Nivel ${tierName}</h3>
            </div>
            <div class="specialist-card mb-20">
                <ul style="list-style: none; padding: 0; font-size: 14px; color: var(--text-dark);">
                    ${benefits}
                </ul>
            </div>

            <!-- Canje de puntos -->
            <div class="section-header mt-30">
                <h3>Canjear Puntos</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; border-radius: 16px; padding: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0;">
                    <div style="font-size: 24px; color: var(--primary-pink); margin-bottom: 10px;"><i class="fa-solid fa-ticket"></i></div>
                    <h4 style="font-size: 16px; margin-bottom: 5px;">5% OFF</h4>
                    <p style="font-size: 12px; margin-bottom: 10px;">En cualquier servicio</p>
                    <button class="btn-primary" style="padding: 8px; font-size: 12px; border-radius: 12px; background: ${p >= 50 ? 'var(--primary-pink)' : '#e0e0e0'}; ${p < 50 ? 'pointer-events:none;' : ''}">50 pts</button>
                </div>
                <div style="background: white; border-radius: 16px; padding: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0;">
                    <div style="font-size: 24px; color: var(--primary-pink); margin-bottom: 10px;"><i class="fa-solid fa-ticket"></i></div>
                    <h4 style="font-size: 16px; margin-bottom: 5px;">10% OFF</h4>
                    <p style="font-size: 12px; margin-bottom: 10px;">En cualquier servicio</p>
                    <button class="btn-primary" style="padding: 8px; font-size: 12px; border-radius: 12px; background: ${p >= 100 ? 'var(--primary-pink)' : '#e0e0e0'}; ${p < 100 ? 'pointer-events:none;' : ''}">100 pts</button>
                </div>
                <div style="background: white; border-radius: 16px; padding: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0;">
                    <div style="font-size: 24px; color: var(--primary-pink); margin-bottom: 10px;"><i class="fa-solid fa-ticket"></i></div>
                    <h4 style="font-size: 16px; margin-bottom: 5px;">15% OFF</h4>
                    <p style="font-size: 12px; margin-bottom: 10px;">En cualquier servicio</p>
                    <button class="btn-primary" style="padding: 8px; font-size: 12px; border-radius: 12px; background: ${p >= 150 ? 'var(--primary-pink)' : '#e0e0e0'}; ${p < 150 ? 'pointer-events:none;' : ''}">150 pts</button>
                </div>
                <div style="background: white; border-radius: 16px; padding: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0;">
                    <div style="font-size: 24px; color: var(--primary-pink); margin-bottom: 10px;"><i class="fa-solid fa-gift"></i></div>
                    <h4 style="font-size: 16px; margin-bottom: 5px;">Servicio Gratis</h4>
                    <p style="font-size: 12px; margin-bottom: 10px;">Servicio básico sin cargo</p>
                    <button class="btn-primary" style="padding: 8px; font-size: 12px; border-radius: 12px; background: ${p >= 250 ? 'var(--primary-pink)' : '#e0e0e0'}; ${p < 250 ? 'pointer-events:none;' : ''}">250 pts</button>
                </div>
            </div>

            <!-- How to earn -->
            <div class="promo-banner mt-30" style="background: linear-gradient(135deg, #FFB6C1, #FF69B4);">
                <div class="promo-content">
                    <h3 style="margin-bottom: 5px;"><i class="fa-solid fa-bolt text-white mr-10"></i>¿Cómo sumar más?</h3>
                    <ul style="list-style: none; padding: 0; font-size: 13px; margin-top: 10px;">
                        <li style="margin-bottom: 5px;">• \$1.000 gastados = 1 Punto</li>
                        <li style="margin-bottom: 5px;">• Mes de tu cumpleaños = 20 pts extra</li>
                        <li style="margin-bottom: 5px;">• Referir a una amiga = 30 pts</li>
                    </ul>
                </div>
            </div>
        `;
        document.getElementById('rewards-container').innerHTML = html;
    },

    renderProfile: function () {
        if (!this.currentUser) return;
        document.getElementById('profile-name').value = this.currentUser.name;
        document.getElementById('profile-email').value = this.currentUser.email;
        document.getElementById('profile-phone').value = this.currentUser.phone || '';

        const avatarUrl = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${this.currentUser.name.replace(' ', '+')}&background=fff&color=FF1493`;
        document.getElementById('profile-img').src = avatarUrl;
    },

    updateProfile: function () {
        const newName = document.getElementById('profile-name').value.trim();
        const newPhone = document.getElementById('profile-phone').value.trim();

        if (!newName) {
            alert("El nombre no puede estar vacío.");
            return;
        }

        this.currentUser.name = newName;
        this.currentUser.phone = newPhone;

        const users = this.db.getUsers();
        const index = users.findIndex(u => u.email === this.currentUser.email);
        if (index !== -1) {
            users[index] = this.currentUser;
            localStorage.setItem('pink_users', JSON.stringify(users));
            localStorage.setItem('pink_session', JSON.stringify(this.currentUser));

            // Re-render avatar if it was generated
            if (!this.currentUser.avatar) {
                document.getElementById('profile-img').src = `https://ui-avatars.com/api/?name=${this.currentUser.name.replace(' ', '+')}&background=fff&color=FF1493`;
            }
            alert("Perfil actualizado correctamente.");
        }
    },

    handleProfilePhotoUpload: function (input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Check size (max 2MB to not overflow localStorage randomly)
            if (file.size > 2 * 1024 * 1024) {
                alert("La imagen es demasiada pesada. Elige una de menos de 2MB por favor.");
                return;
            }

            const reader = new FileReader();

            reader.onload = function (e) {
                const base64Image = e.target.result;

                // Update UI visually
                document.getElementById('profile-img').src = base64Image;

                // Update LocalStorage Object
                app.currentUser.avatar = base64Image;

                const users = app.db.getUsers();
                const index = users.findIndex(u => u.email === app.currentUser.email);
                if (index !== -1) {
                    users[index] = app.currentUser;
                    localStorage.setItem('pink_users', JSON.stringify(users));
                    // Keep session synced
                    localStorage.setItem('pink_session', JSON.stringify(app.currentUser));
                }
            };

            reader.readAsDataURL(file);
        }
    },

    changePassword: function () {
        const currentPwd = document.getElementById('current-password').value;
        const newPwd = document.getElementById('new-password').value;

        if (!currentPwd || !newPwd) {
            alert("Por favor, ingresa tu contraseña actual y la nueva.");
            return;
        }

        if (currentPwd !== this.currentUser.password) {
            alert("La contraseña actual es incorrecta.");
            return;
        }

        if (newPwd.length < 6) {
            alert("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        // Update password
        this.currentUser.password = newPwd;
        this.db.updateUser(this.currentUser);
        localStorage.setItem('pink_session', JSON.stringify(this.currentUser));

        // Clear inputs
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';

        alert("¡Tu contraseña ha sido modificada con éxito!");
    },

    // Review System Logic
    currentRating: 0,
    reviewPhotos: [],

    setRating: function (rating) {
        this.currentRating = rating;
        const stars = document.querySelectorAll('#star-rating i');
        stars.forEach(star => {
            if (parseInt(star.dataset.val) <= rating) {
                star.style.color = '#FFD700'; // Gold
            } else {
                star.style.color = '#e0e0e0'; // Grey
            }
        });
    },

    handlePhotoUpload: function (input) {
        const files = input.files;
        if (files && files[0]) {
            if (this.reviewPhotos.length >= 3) {
                alert('Puedes subir hasta un máximo de 3 fotos.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.reviewPhotos.push(e.target.result);
                this.renderPhotoPreview();
            };
            reader.readAsDataURL(files[0]);
        }
    },

    renderPhotoPreview: function () {
        const container = document.getElementById('photo-preview');
        container.innerHTML = '';
        this.reviewPhotos.forEach((src, index) => {
            container.innerHTML += `
                <div style="position:relative; width:60px; height:60px; border-radius:8px; overflow:hidden;">
                    <img src="${src}" style="width:100%; height:100%; object-fit:cover;">
                    <div style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.5); color:white; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; cursor:pointer;" onclick="app.removeReviewPhoto(${index})">
                        <i class="fa-solid fa-times"></i>
                    </div>
                </div>
            `;
        });
    },

    removeReviewPhoto: function (index) {
        this.reviewPhotos.splice(index, 1);
        this.renderPhotoPreview();
    },

    submitReview: function () {
        if (this.currentRating === 0) {
            alert('Por favor selecciona una calificación de estrellas.');
            return;
        }

        const title = document.getElementById('review-title').value;
        const text = document.getElementById('review-text').value;

        if (!title || !text) {
            alert('Por favor completa el título y tu experiencia.');
            return;
        }

        // Calculate reward points
        let earnedPoints = 10; // Base points for review
        if (this.reviewPhotos.length > 0) {
            earnedPoints += 20; // Extra points for photos
        }

        // Construct literal review object
        const newReview = {
            author: this.currentUser ? this.currentUser.name.split(' ')[0] : 'Anónimo',
            title: title,
            text: text,
            rating: this.currentRating,
            date: 'Hoy',
            service: 'Servicio Pink', // Generic, would be linked to an appointment ideally
            photos: [...this.reviewPhotos]
        };

        // Save Review
        this.db.saveReview(newReview);

        // Add to user points and Notify
        if (this.currentUser) {
            this.currentUser.points = (this.currentUser.points || 0) + earnedPoints;

            this.currentUser.notifications.unshift({
                id: Date.now(),
                title: '¡Puntos Beauty!',
                date: 'Ahora',
                desc: `Ganaste +${earnedPoints} pts por dejar una reseña en el perfil.`,
                icon: 'fa-star',
                color: '#FFD700'
            });

            this.db.updateUser(this.currentUser);
            localStorage.setItem('pink_session', JSON.stringify(this.currentUser));
        }

        // Reset form
        document.getElementById('review-title').value = '';
        document.getElementById('review-text').value = '';
        this.currentRating = 0;
        this.setRating(0);
        this.reviewPhotos = [];
        this.renderPhotoPreview();

        // Update UI in overlay
        document.getElementById('review-points-earned').innerText = `+${earnedPoints} pts`;
        document.getElementById('review-success-overlay').style.display = 'flex';
    },

    renderReviews: function (filter = 'Todos') {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        const allReviews = this.db.getReviews();
        let filteredReviews = allReviews;

        if (filter !== 'Todos') {
            filteredReviews = allReviews.filter(r => r.service.toLowerCase().includes(filter.toLowerCase()));
        }

        // Update Score dynamically
        if (allReviews.length > 0) {
            const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = (sum / allReviews.length).toFixed(1);
            const scoreElements = document.querySelectorAll('.prof-score');
            scoreElements.forEach(el => el.innerText = avg);

            const countElements = document.querySelectorAll('.prof-review-count');
            countElements.forEach(el => el.innerText = allReviews.length);
        }

        if (filteredReviews.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Aún no hay reseñas en esta categoría.</p>';
            return;
        }

        let html = '';
        filteredReviews.forEach(rev => {
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= rev.rating ? '#FFD700' : '#e0e0e0'}"></i>`;
            }

            let photosHtml = '';
            if (rev.photos && rev.photos.length > 0) {
                photosHtml = '<div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">';
                rev.photos.forEach(photo => {
                    photosHtml += `
                        <div style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden;">
                            <img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    `;
                });
                photosHtml += '</div>';
            }

            html += `
                <div style="background: white; border-radius: 16px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 15px; border: 1px solid #f0f0f0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <img src="https://ui-avatars.com/api/?name=${rev.author.replace(' ', '+')}&background=f0f0f0&color=333" style="width: 36px; height: 36px; border-radius: 50%;">
                            <div>
                                <h4 style="font-size: 13px; margin: 0;">${rev.author}</h4>
                                <span style="font-size: 10px; color: var(--text-light);">${rev.date} • ${rev.service}</span>
                            </div>
                        </div>
                        <div style="font-size: 10px;">
                            ${starsHtml}
                        </div>
                    </div>
                    <h5 style="font-size: 14px; margin-bottom: 5px;">${rev.title}</h5>
                    <p style="font-size: 13px; color: var(--text-dark); margin-bottom: 0; line-height: 1.4;">${rev.text}</p>
                    ${photosHtml}
                </div>
            `;
        });

        container.innerHTML = html;

        // Update active filter button styling
        document.querySelectorAll('.filter-chip').forEach(btn => {
            if (btn.innerText.trim() === filter) {
                btn.style.background = 'var(--primary-pink)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--primary-pink)';
            } else {
                btn.style.background = 'white';
                btn.style.color = 'var(--text-dark)';
                btn.style.borderColor = '#e0e0e0';
            }
        });
    },

    closeReviewSuccess: function () {
        document.getElementById('review-success-overlay').style.display = 'none';
        this.navigate('professional');
    },

    shareToInstagram: function () {
        // Copy text to clipboard magically
        const textToCopy = "Mi experiencia en Pink Estetica fue increíble 💖✨\nServicio: Lifting de pestañas\n⭐⭐⭐⭐⭐\n¡Súper recomendable!";
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Texto copiado al portapapeles. Abriendo Instagram para que pegues el texto en tu Story...');
            window.open('https://instagram.com', '_blank');
        });
    },

    handleSearch: function (query) {
        const searchResults = document.getElementById('search-results') || this.createSearchResultsContainer();
        query = query.toLowerCase().trim();

        if (query.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        const services = this.db.getServices();

        const exactMatches = Object.entries(services).filter(([key, service]) => {
            return service.name.toLowerCase().includes(query) || key.toLowerCase().includes(query);
        });

        if (exactMatches.length > 0) {
            let html = '';
            exactMatches.forEach(([key, service]) => {
                html += `
                    <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f0f0f0; cursor: pointer;" onclick="app.selectService('${key}')">
                        <img src="${service.img}" style="width: 40px; height: 40px; border-radius: 8px; margin-right: 15px; object-fit: cover;">
                        <div>
                            <h4 style="font-size: 14px; margin: 0; color: var(--text-dark);">${service.name}</h4>
                            <span style="font-size: 12px; color: var(--primary-pink); font-weight: 600;">${service.price}</span>
                        </div>
                    </div>
                `;
            });
            searchResults.innerHTML = html;
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = `
                <div style="padding: 15px; text-align: center; color: var(--text-light); font-size: 14px;">
                    No se encontraron servicios para "${query}"
                </div>
            `;
            searchResults.style.display = 'block';
        }
    },

    createSearchResultsContainer: function () {
        const container = document.createElement('div');
        container.id = 'search-results';
        container.style.cssText = `
            position: absolute;
            top: 100%;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            z-index: 50;
            max-height: 300px;
            overflow-y: auto;
            display: none;
            margin-top: 10px;
            border: 1px solid #f0f0f0;
        `;

        // Append it relative to the header-pink which contains the search bar
        document.querySelector('.header-pink').style.position = 'relative';
        document.querySelector('.header-pink').appendChild(container);

        return container;
    },

    // --- ADMIN PANEL LOGIC --- //
    switchAdminTab: function (tabId) {
        document.getElementById('admin-content-turnos').style.display = 'none';
        document.getElementById('admin-content-clientes').style.display = 'none';
        document.getElementById('admin-content-servicios').style.display = 'none';

        document.getElementById(`admin-content-${tabId}`).style.display = 'block';

        document.getElementById('admin-tab-turnos').style.color = 'var(--text-light)';
        document.getElementById('admin-tab-turnos').style.borderColor = 'transparent';
        document.getElementById('admin-tab-clientes').style.color = 'var(--text-light)';
        document.getElementById('admin-tab-clientes').style.borderColor = 'transparent';
        document.getElementById('admin-tab-servicios').style.color = 'var(--text-light)';
        document.getElementById('admin-tab-servicios').style.borderColor = 'transparent';

        document.getElementById(`admin-tab-${tabId}`).style.color = 'var(--primary-pink)';
        document.getElementById(`admin-tab-${tabId}`).style.borderColor = 'var(--primary-pink)';
    },

    renderAdminDashboard: function () {
        this.renderAdminAppointments();
        this.renderAdminUsers();
        this.renderAdminServices();
    },

    renderAdminAppointments: function () {
        const container = document.getElementById('admin-appointments-container');
        if (!container) return;

        // Populate WhatsApp Config Field
        const waInput = document.getElementById('admin-whatsapp-input');
        if (waInput) {
            waInput.value = this.db.getSettings().whatsapp;
        }

        const users = this.db.getUsers();
        let allAppnts = [];

        // Extract all appointments from all users
        users.forEach(u => {
            if (u.appointments && u.appointments.length > 0) {
                u.appointments.forEach(ap => {
                    allAppnts.push({
                        ...ap,
                        clientName: u.name,
                        clientPhone: u.phone,
                        clientEmail: u.email
                    });
                });
            }
        });

        document.getElementById('admin-total-turnos').innerText = allAppnts.length;

        if (allAppnts.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">No hay turnos registrados en el sistema.</p>';
            return;
        }

        let html = '';
        allAppnts.forEach(ap => {
            html += `
                <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 15px; border-left: 4px solid var(--primary-pink); box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: var(--text-dark); font-size: 14px;">${ap.dateStr} - ${ap.time}</span>
                        <span style="background: #FFF0F5; color: var(--primary-pink); padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: bold;">${ap.service.name}</span>
                    </div>
                    <div>
                        <div style="font-size: 13px; font-weight: 600; color: #333;"><i class="fa-regular fa-user mr-10"></i>${ap.clientName}</div>
                        <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;"><i class="fa-solid fa-phone mr-10"></i>${ap.clientPhone}</div>
                    </div>
                    <div style="margin-top: 10px; text-align: right;">
                         <a href="https://wa.me/549${ap.clientPhone.replace(/\D/g, '')}" target="_blank" style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 5px 12px; border-radius: 15px; font-size: 11px; font-weight: 600;"><i class="fa-brands fa-whatsapp mr-10"></i>Contactar</a>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderAdminUsers: function () {
        const container = document.getElementById('admin-users-container');
        if (!container) return;

        const users = this.db.getUsers();
        document.getElementById('admin-total-clientes').innerText = users.length;

        if (users.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">No hay clientas registradas aún.</p>';
            return;
        }

        let html = '';
        users.forEach(u => {
            html += `
                <div style="background: white; border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02); border: 1px solid #f0f0f0;">
                    <img src="https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=f0f0f0&color=FF1493" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 14px; margin: 0; color: var(--text-dark);">${u.name}</h4>
                        <div style="font-size: 11px; color: var(--text-light); margin-top: 2px;">
                            ${u.email} <br> ${u.phone}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: bold; color: #FFD700;">${u.points || 0} pts</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderAdminServices: function () {
        const container = document.getElementById('admin-services-container');
        if (!container) return;

        const services = this.db.getServices();
        let html = '';

        for (const [key, service] of Object.entries(services)) {
            html += `
                <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.02); border: 1px solid #f0f0f0;">
                    <div>
                        <h4 style="font-size: 14px; margin: 0; color: var(--text-dark);">${service.name}</h4>
                        <span style="font-size: 10px; color: var(--text-light);"><i class="fa-regular fa-clock"></i> ${service.duration}</span>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="admin-price-${key}" value="${service.price}" style="width: 80px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 12px; text-align: right; outline: none;">
                        <button onclick="app.adminSavePrice('${key}')" style="background: var(--primary-pink); border: none; color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px; cursor: pointer;" title="Guardar">
                            <i class="fa-solid fa-save"></i>
                        </button>
                        <button onclick="app.adminDeleteService('${key}')" style="background: #ff4757; border: none; color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px; cursor: pointer;" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    adminSavePrice: function (key) {
        const input = document.getElementById(`admin-price-${key}`);
        if (!input) return;

        const newPrice = input.value.trim();
        if (!newPrice) return;

        this.db.updateServicePrice(key, newPrice);

        // Notify success briefly
        const orgColor = input.style.borderColor;
        input.style.borderColor = '#25D366';
        setTimeout(() => input.style.borderColor = orgColor, 1000);
    },

    adminAddService: function () {
        const nameInput = document.getElementById('admin-new-name');
        const priceInput = document.getElementById('admin-new-price');
        const durationInput = document.getElementById('admin-new-duration');

        const name = nameInput.value.trim();
        const price = priceInput.value.trim();
        const duration = durationInput.value.trim();

        if (!name || !price || !duration) {
            alert("Por favor completa Nombre, Precio y Duración para añadirlo.");
            return;
        }

        // Generate an ascii key for the ID (e.g. "Limpieza Facial" -> "limpieza-facial")
        const key = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const newService = {
            name: name,
            price: price,
            duration: duration,
            icon: '<i class="fa-solid fa-spa"></i>', // Default icon
            img: '' // Without image by default
        };

        this.db.addService(key, newService);

        // Reset fields
        nameInput.value = '';
        priceInput.value = '';
        durationInput.value = '';

        // Refresh UI
        this.renderAdminServices();
    },

    adminDeleteService: function (key) {
        if (confirm("¿Estás mil por ciento segura de que deseas ELIMINAR para siempre este servicio del catalogo?")) {
            this.db.deleteService(key);
            this.renderAdminServices();
        }
    },

    adminSaveWhatsApp: function () {
        const input = document.getElementById('admin-whatsapp-input');
        let val = input.value.trim();

        if (!val) {
            alert("El número no puede estar vacío");
            return;
        }

        // Auto-format basic mistakes
        val = val.replace(/\D/g, ''); // keep only numbers
        if (!val.startsWith('549')) {
            val = '549' + val; // assume Argentina
        }

        this.db.updateSettings('whatsapp', val);
        input.value = val;

        // Notify visual
        const orgColor = input.style.borderColor;
        input.style.borderColor = '#25D366';
        setTimeout(() => input.style.borderColor = orgColor, 1000);
    }
};

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Initialize active nav item highlighting
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function (e) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
    });
});

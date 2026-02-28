const app = {
    currentScreen: 'login',
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    currentDate: new Date(),

    appointments: [],
    notifications: [
        { id: 1, title: '¡Nuevo servicio de Lifting 3D!', date: 'Hace 2 horas', desc: 'Renovamos nuestros productos para un lifting aún más duradero. ¡Reserva tu turno ahora!', icon: 'fa-wand-magic-sparkles', color: '#FF69B4' },
        { id: 2, title: '15% OFF en Depilación', date: 'Ayer', desc: 'Promoción especial en todo el cuerpo durante este mes de octubre.', icon: 'fa-tag', color: '#FF1493' },
        { id: 3, title: 'Bienvenida a Pink', date: 'Hace 3 días', desc: 'Gracias por registrarte en nuestra nueva aplicación oficial.', icon: 'fa-heart', color: '#FFB6C1' }
    ],

    // User Rewards state
    userPoints: 120, // Start with some points for demo

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
        'forgot-pwd': document.getElementById('screen-forgot-pwd')
    },

    servicesMap: {
        'uñas': { name: 'Uñas (Manicura)', img: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702', price: '$15.000 ARS' },
        'pies': { name: 'Pies (Pedicuria)', img: 'pedicura.png', price: '$18.000 ARS' },
        'lifting': { name: 'Lifting de Pestañas', img: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15', price: '$22.000 ARS' },
        'depilacion': { name: 'Depilación Definitiva', img: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8', price: '$25.000 ARS' }
    },

    init: function () {
        this.renderCalendar();
        document.getElementById('search-input').addEventListener('keyup', this.handleSearch.bind(this));
    },

    navigate: function (screenId) {
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
    },

    selectService: function (serviceId) {
        this.selectedService = this.servicesMap[serviceId];

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

        this.appointments.push({
            service: this.selectedService,
            dateStr: dateStr,
            time: this.selectedTime,
            professional: 'Milagros'
        });

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
        window.open(`https://wa.me/5491100000000?text=${encodedText}`, '_blank');
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
        if (!container) return;

        if (this.appointments.length === 0) {
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
        this.appointments.forEach(appnt => {
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
                    <div class="service-preview" style="width: 100%;">
                        <img src="${appnt.service.img}" alt="Service" style="width: 60px; height: 60px;">
                        <div>
                            <h4>${appnt.service.name}</h4>
                            <p style="font-size: 12px;">Profesional: ${appnt.professional}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderNotifications: function () {
        const container = document.getElementById('notifications-container');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 50px; color: var(--text-light);">
                    <i class="fa-regular fa-bell-slash" style="font-size: 50px; color: var(--pale-pink); margin-bottom: 20px;"></i>
                    <h3>No hay novedades</h3>
                </div>
            `;
            return;
        }

        let html = '';
        this.notifications.forEach(notif => {
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
        const p = this.userPoints;
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
                <img src="https://ui-avatars.com/api/?name=Maria+Perez&background=fff&color=${tierColor.substring(1)}" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid white; margin-bottom: 15px;" alt="User">
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

        // Add to user points
        this.userPoints += earnedPoints;

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

        const exactMatches = Object.entries(this.servicesMap).filter(([key, service]) => {
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

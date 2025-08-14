const SUPABASE_URL = 'https://usipvnxjmvdhagllufqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXB2bnhqbXZkaGFnbGx1ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTIzOTIsImV4cCI6MjA3MDY2ODM5Mn0.T9Lwx-cEjpuw-6GAxVEZ8DhjToWD0jI4WMpYSK-X1I8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showSection(sectionName) {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const content = document.getElementById('content');
    const rightPanel = document.getElementById('right-panel');
    const pageTitle = document.querySelector('.page-title');

    navLinks.forEach(navLink => navLink.classList.remove('active'));
    const activeLink = Array.from(navLinks).find(link => link.textContent.trim().endsWith(sectionName));
    if (activeLink) {
        activeLink.classList.add('active');
    }

    pageTitle.textContent = sectionName;
    rightPanel.innerHTML = '';

    if (sectionName === 'Dashboard') {
        content.innerHTML = `<h1>Dashboard</h1><p>Ласкаво просимо до панелі управління!</p>`;
    } else if (sectionName === 'Психологи') {
        content.innerHTML = `
            <div class="content-header">
                <h1>Керування психологами</h1>
                <img src="https://cdn.jsdelivr.net/npm/heroicons@1.0.6/outline/plus-circle.svg" alt="Додати психолога" class="add-psychologist-icon">
            </div>
            <div id="psychologists-list"></div>
        `;
        fetchAndDisplayPsychologists();
        rightPanel.innerHTML = `<p style="color: var(--light-text-color);">Натисніть на "+" щоб додати психолога.</p>`;
    } else if (sectionName === 'Розклад психологів') {
        renderScheduleSection();
    } else if (sectionName === 'Записи на консультацію') {
        content.innerHTML = '<h1>Записи клієнтів</h1><p>Здесь будет список забронированных консультаций.</p>';
    } else if (sectionName === 'Статистика та аналітика') {
        content.innerHTML = '<h1>Статистика та аналітика</h1><p>Здесь будет статистика по оплатам и посещениям.</p>';
    } else {
        content.innerHTML = `<h1>Раздел "${sectionName}"</h1><p>Содержимое пока не готово.</p>`;
    }
}

async function fetchAndDisplayPsychologists() {
    const { data, error } = await supabase
        .from('psychologists')
        .select('*')
        .eq('is_deleted', false);

    if (error) {
        console.error('Ошибка при получении данных:', error.message);
        return;
    }

    const listContainer = document.getElementById('psychologists-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(psychologist => {
            const psychologistCard = document.createElement('div');
            psychologistCard.classList.add('psychologist-card');
            psychologistCard.innerHTML = `
                <img src="${psychologist.photo_url}" alt="${psychologist.name}" class="psychologist-photo">
                <h3>${psychologist.name}</h3>
                <p>${psychologist.specialization}</p>
                <p>Вартість: ${psychologist.price_per_session} грн.</p>
                <div class="card-actions">
                    <img src="https://cdn.jsdelivr.net/npm/heroicons@1.0.6/outline/pencil.svg" alt="Редактировать" class="edit-icon" data-id="${psychologist.id}">
                    <img src="https://cdn.jsdelivr.net/npm/heroicons@1.0.6/outline/trash.svg" alt="Удалить" class="delete-icon" data-id="${psychologist.id}">
                </div>
            `;
            listContainer.appendChild(psychologistCard);
        });
    } else {
        listContainer.innerHTML = '<p>Психологи пока не добавлены.</p>';
    }
}

async function setupAddPsychologistForm() {
    const form = document.getElementById('add-psychologist-form');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.getElementById('name').value;
            const specialization = document.getElementById('specialization').value;
            const bio = document.getElementById('bio').value;
            const price = document.getElementById('price').value;
            const photoFile = document.getElementById('photo').files[0];

            if (!photoFile) {
                alert('Пожалуйста, выберите файл с фото.');
                return;
            }

            const fileExtension = photoFile.name.split('.').pop();
            const filePath = `${Date.now()}.${fileExtension}`;
            let photo_url = '';

            const { error: uploadError } = await supabase.storage
                .from('psychologist-photos')
                .upload(filePath, photoFile);

            if (uploadError) {
                alert('Ошибка загрузки фото: ' + uploadError.message);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('psychologist-photos')
                .getPublicUrl(filePath);

            photo_url = publicUrlData.publicUrl;

            const { error: dbError } = await supabase
                .from('psychologists')
                .insert([
                    { name, specialization, bio, price_per_session: parseInt(price), photo_url }
                ]);

            if (dbError) {
                alert('Ошибка при добавлении психолога: ' + dbError.message);
            } else {
                alert('Психолога успішно додано!');
                form.reset();
                fetchAndDisplayPsychologists();
                document.getElementById('right-panel').innerHTML = `<p style="color: var(--light-text-color);">Психолога успішно додано</p>`;
            }
        });
    }
}

function showAddPsychologistForm() {
    const rightPanel = document.getElementById('right-panel');
    rightPanel.innerHTML = `
        <h2>Додати нового психолога</h2>
        <form id="add-psychologist-form">
            <label for="name">Ім'я:</label>
            <input type="text" id="name" name="name" required>
            <label for="specialization">Спеціалізація:</label>
            <input type="text" id="specialization" name="specialization" required>
            <label for="bio">Опис:</label>
            <textarea id="bio" name="bio" required></textarea>
            <label for="price">Вартість консультації:</label>
            <input type="number" id="price" name="price" required>
            <label for="photo">Фото:</label>
            <input type="file" id="photo" name="photo" accept="image/*" required>
            <div class="form-actions">
                <button type="submit">Додати</button>
                <button type="button" id="cancel-add-btn">Скасувати</button>
            </div>
        </form>
    `;
    setupAddPsychologistForm();

    const cancelButton = document.getElementById('cancel-add-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            document.getElementById('right-panel').innerHTML = `<p style="color: var(--light-text-color);">Натисніть на "+" щоб додати психолога.</p>`;
        });
    }
}

async function deletePsychologist(id) {
    if (confirm('Ви впевнені, що бажаєте видалити цього психолога?')) {
        const { error } = await supabase
            .from('psychologists')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) {
            console.error('Ошибка при удалении психолога:', error.message);
            alert('Ошибка при удалении психолога.');
        } else {
            alert('Психолога успішно видалено!');
            fetchAndDisplayPsychologists();
        }
    }
}

async function showEditPsychologistForm(id) {
    const { data, error } = await supabase
        .from('psychologists')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Ошибка при получении данных психолога для редактирования:', error.message);
        return;
    }

    const rightPanel = document.getElementById('right-panel');
    rightPanel.innerHTML = `
        <h2>Редагувати психолога</h2>
        <form id="edit-psychologist-form">
            <input type="hidden" id="psychologist-id" value="${data.id}">
            <label for="name-edit">Ім'я:</label>
            <input type="text" id="name-edit" name="name" value="${data.name}" required>
            <label for="specialization-edit">Спеціалізація:</label>
            <input type="text" id="specialization-edit" name="specialization" value="${data.specialization}" required>
            <label for="bio-edit">Опис:</label>
            <textarea id="bio-edit" name="bio" required>${data.bio}</textarea>
            <label for="price-edit">Вартість консультації:</label>
            <input type="number" id="price-edit" name="price" value="${data.price_per_session}" required>
            <label for="photo-edit">Фото:</label>
            <input type="file" id="photo-edit" name="photo" accept="image/*">
            <div class="form-actions">
                <button type="submit">Зберегти</button>
                <button type="button" id="cancel-edit-btn">Скасувати</button>
            </div>
        </form>
    `;

    const form = document.getElementById('edit-psychologist-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name-edit').value;
        const specialization = document.getElementById('specialization-edit').value;
        const bio = document.getElementById('bio-edit').value;
        const price = document.getElementById('price-edit').value;
        const photoFile = document.getElementById('photo-edit').files[0];
        const psychologistId = document.getElementById('psychologist-id').value;
        let photo_url = data.photo_url;

        if (photoFile) {
            const fileExtension = photoFile.name.split('.').pop();
            const filePath = `${Date.now()}.${fileExtension}`;
            const { error: uploadError } = await supabase.storage
                .from('psychologist-photos')
                .upload(filePath, photoFile);

            if (uploadError) {
                alert('Ошибка загрузки фото: ' + uploadError.message);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('psychologist-photos')
                .getPublicUrl(filePath);

            photo_url = publicUrlData.publicUrl;
        }

        const { error: dbError } = await supabase
            .from('psychologists')
            .update({ name, specialization, bio, price_per_session: parseInt(price), photo_url })
            .eq('id', psychologistId);

        if (dbError) {
            alert('Ошибка при обновлении психолога: ' + dbError.message);
        } else {
            alert('Дані психолога успішно оновлені!');
            document.getElementById('right-panel').innerHTML = `<p style="color: var(--light-text-color);">Дані психолога оновлені</p>`;
            fetchAndDisplayPsychologists();
        }
    });

    const cancelButton = document.getElementById('cancel-edit-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            document.getElementById('right-panel').innerHTML = `<p style="color: var(--light-text-color);">Натисніть на "+" щоб додати психолога.</p>`;
        });
    }
}

async function fetchAdminInfo() {
    const { data, error } = await supabase
        .from('admins')
        .select('name, photo_url')
        .limit(1);

    if (error) {
        console.error('Error fetching admin info:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const admin = data[0];
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = admin.name;
        }
        const userPhotoElement = document.querySelector('.user-photo');
        if (userPhotoElement) {
            userPhotoElement.src = admin.photo_url;
        }
    }
}

// ====== Функции для управления расписанием психологов ======

let allPsychologists = [];
let currentCalendarDate = new Date();
let selectedSchedule = {};
let hasUnsavedChanges = false;
let previousPsychologistId = '';


// <<< START: Добавленный код >>>
async function loadSchedule(psychologistId) {
    if (!psychologistId) {
        selectedSchedule = {};
    } else {
        const { data, error } = await supabase
            .from('psychologist_schedules')
            .select('date:start_time, time_slot:start_time')
            .eq('psychologist_id', psychologistId);

        if (error) {
            console.error('Ошибка загрузки расписания:', error.message);
        } else {
            selectedSchedule = {};
            if (data) {
                data.forEach(item => {
                    const date = item.date.split('T')[0];
                    const timeSlot = `${item.date.split('T')[1].substring(0, 5)} - ${new Date(new Date(item.date).getTime() + 60 * 60 * 1000).toISOString().split('T')[1].substring(0, 5)}`;
                    if (!selectedSchedule[date]) {
                        selectedSchedule[date] = [];
                    }
                    selectedSchedule[date].push(timeSlot);
                });
            }
        }
    }
    
    renderCalendar('schedule-grid', currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
    updateSummary();
    document.getElementById('time-slots-container').innerHTML = '';
}
// <<< END: Добавленный код >>>


async function fetchPsychologistsForSchedule() {
    const { data, error } = await supabase
        .from('psychologists')
        .select('id, name')
        .eq('is_deleted', false);

    if (error) {
        console.error('Ошибка при получении списка психологов:', error.message);
        return [];
    }

    allPsychologists = data;
    return data;
}

function renderScheduleSection() {
    const content = document.getElementById('content');
    const rightPanel = document.getElementById('right-panel');

    const psychologistsDropdown = `
        <div class="schedule-controls">
            <label for="psychologist-select">Виберіть психолога:</label>
            <select id="psychologist-select" class="schedule-select"></select>
        </div>
    `;

    const scheduleLayout = `
        <div class="schedule-layout">
            <div class="calendar-container" id="schedule-grid"></div>
            <div class="time-slots-container" id="time-slots-container"></div>
        </div>
    `;

    content.innerHTML = psychologistsDropdown + scheduleLayout;

    rightPanel.innerHTML = `
        <div class="schedule-summary">
            <h3>Попередній перегляд розкладу</h3>
            <div id="summary-content">
                <p>Розклад поки що порожній.</p>
            </div>
            <div class="form-actions">
                <button id="save-schedule-btn">Зберегти</button>
                <button id="cancel-schedule-btn" class="cancel-btn">Скасувати</button>
            </div>
        </div>
    `;

    fetchAndRenderScheduleUI();
}

async function fetchAndRenderScheduleUI() {
    const psychologists = await fetchPsychologistsForSchedule();
    const dropdown = document.getElementById('psychologist-select');
    dropdown.innerHTML = '<option value="">-- Виберіть --</option>';
    psychologists.forEach(psychologist => {
        const option = document.createElement('option');
        option.value = psychologist.id;
        option.textContent = psychologist.name;
        dropdown.appendChild(option);
    });
    
    renderCalendar('schedule-grid', currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
}

function renderCalendar(targetElementId, year, month) {
    const calendarEl = document.getElementById(targetElementId);
    if (!calendarEl) return;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let calendarHtml = `
        <div class="calendar-header">
            <button class="prev-month-btn">&lt;</button>
            <span>${firstDay.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}</span>
            <button class="next-month-btn">&gt;</button>
        </div>
        <div class="calendar-days">
            <div class="day-label">Пн</div><div class="day-label">Вт</div><div class="day-label">Ср</div>
            <div class="day-label">Чт</div><div class="day-label">Пт</div><div class="day-label">Сб</div>
            <div class="day-label">Нд</div>
        </div>
        <div class="calendar-dates">
    `;

    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarHtml += '<div></div>';
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isSelected = selectedSchedule[dateString];
        const isPast = date < new Date().setHours(0, 0, 0, 0);

        calendarHtml += `
            <div class="calendar-day ${isPast ? 'past-day' : ''} ${isSelected ? 'selected-day' : ''}" data-date="${dateString}">
                ${i}
            </div>
        `;
    }

    calendarHtml += `</div>`;
    calendarEl.innerHTML = calendarHtml;
}

function generateTimeSlots(startTime = 9, endTime = 18) {
    const slots = [];
    for (let i = startTime; i <= endTime; i++) {
        slots.push(`${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`);
    }
    return slots;
}

function renderTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const timeSlots = generateTimeSlots();

    const isCopyMode = !!document.querySelector('.calendar-day.copy-source');
    const buttonText = isCopyMode ? 'Завершити копіювання' : 'Копіювати розклад';
    
    let slotsHtml = `
        <div class="slots-header">
            <h3>Часові проміжки на: ${new Date(date).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            <button id="copy-schedule-btn" data-date="${date}">${buttonText}</button>
        </div>
        <ul class="time-slot-list">
    `;

    timeSlots.forEach(slot => {
        const isSelected = selectedSchedule[date] && selectedSchedule[date].includes(slot);
        slotsHtml += `
            <li class="time-slot-item ${isSelected ? 'selected' : ''}" data-slot="${slot}">
                ${slot}
            </li>
        `;
    });

    slotsHtml += `</ul>`;

    timeSlotsContainer.innerHTML = slotsHtml;

    document.querySelectorAll('.time-slot-item').forEach(item => {
        item.addEventListener('click', () => {
            const slot = item.dataset.slot;
            if (!selectedSchedule[date]) {
                selectedSchedule[date] = [];
            }

            if (selectedSchedule[date].includes(slot)) {
                selectedSchedule[date] = selectedSchedule[date].filter(s => s !== slot);
            } else {
                selectedSchedule[date].push(slot);
            }           
            hasUnsavedChanges = true;
            item.classList.toggle('selected');
            updateSummary();
        });
    });
}

function copySchedule(sourceDate) {
    document.querySelectorAll('.calendar-day').forEach(dayEl => {
        const date = dayEl.dataset.date;
        if (date !== sourceDate && !dayEl.classList.contains('past-day')) {
            dayEl.classList.add('copy-target');
        } else if (date === sourceDate) {
            dayEl.classList.add('copy-source');
        } else {
            dayEl.classList.remove('copy-target', 'copy-source');
        }
    });

    document.getElementById('time-slots-container').innerHTML = `
        <div class="slots-header">
            <h3>Оберіть дні для копіювання розкладу</h3>
        </div>
    `;
}

function updateSummary() {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) return;

    const psychologistId = document.getElementById('psychologist-select').value;
    const psychologistName = document.getElementById('psychologist-select').options[document.getElementById('psychologist-select').selectedIndex].text;

    if (!psychologistId || Object.keys(selectedSchedule).length === 0) {
        summaryContent.innerHTML = '<p>Розклад поки що порожній.</p>';
        return;
    }

    let summaryHtml = `
        <h4>Розклад для: <span class="psychologist-name-summary">${psychologistName}</span></h4>
        <ul class="summary-collapsible-list">
    `;

    const sortedDates = Object.keys(selectedSchedule).sort();

    sortedDates.forEach(date => {
        if (selectedSchedule[date] && selectedSchedule[date].length > 0) {
            summaryHtml += `
                <li class="summary-collapsible-item">
                    <div class="summary-item-header">
                        <span class="date-summary">${new Date(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</span>
                        <button class="expand-toggle">+</button>
                    </div>
                    <ul class="summary-slot-list hidden">
            `;
            selectedSchedule[date].forEach(slot => {
                summaryHtml += `
                    <li class="summary-slot-item">
                        <span>${slot}</span>
                        <button class="delete-slot-btn" data-date="${date}" data-slot="${slot}">x</button>
                    </li>
                `;
            });
            summaryHtml += `
                    </ul>
                </li>
            `;
        }
    });

    summaryHtml += `</ul>`;
    summaryContent.innerHTML = summaryHtml;
}

async function saveSchedule() {
    const psychologistId = document.getElementById('psychologist-select').value;
    if (!psychologistId) {
        alert('Будь ласка, виберіть психолога.');
        return;
    }

    const { error: deleteError } = await supabase
        .from('psychologist_schedules')
        .delete()
        .eq('psychologist_id', psychologistId);
    
    if (deleteError) {
        alert('Ошибка при очистке старого расписания: ' + deleteError.message);
        return;
    }

    const schedulesToInsert = [];
    for (const date in selectedSchedule) {
        selectedSchedule[date].forEach(slot => {
            const [start_time_str, end_time_str] = slot.split(' - ');
            schedulesToInsert.push({
                psychologist_id: psychologistId,
                start_time: `${date}T${start_time_str}:00Z`,
                end_time: `${date}T${end_time_str}:00Z`
            });
        });
    }

    if (schedulesToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('psychologist_schedules')
            .insert(schedulesToInsert);

        if (insertError) {
            alert('Ошибка при сохранении расписания: ' + insertError.message);
            return;
        }
    }

    alert('Розклад успішно збережено!');
    hasUnsavedChanges = false;
    selectedSchedule = {};
    document.getElementById('psychologist-select').value = '';
    renderScheduleSection();
}

function cancelSchedule() {
    selectedSchedule = {};
    document.querySelectorAll('.calendar-day').forEach(dayEl => {
        dayEl.classList.remove('selected-day', 'copy-source', 'copy-target', 'temp-copy-highlight');
    });
    document.getElementById('time-slots-container').innerHTML = '';
    updateSummary();
    hasUnsavedChanges = false;
}

document.addEventListener('DOMContentLoaded', () => {
    // В этом блоке будут обработчики, которые должны быть загружены сразу.
    fetchAdminInfo(); // Загрузка данных администратора при запуске
    showSection('Dashboard'); // Отображение начальной секции

    // Обработчик для навигации
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionName = event.target.textContent.trim();
            showSection(sectionName);
        });
    });

    // Главный обработчик событий
    document.addEventListener('click', (event) => {
    const target = event.target;

    const addPsychologistIcon = target.closest('.add-psychologist-icon');
    if (addPsychologistIcon) {
        showAddPsychologistForm();
    }

    const editIcon = target.closest('.edit-icon');
    if (editIcon) {
        const psychologistId = editIcon.getAttribute('data-id');
        showEditPsychologistForm(psychologistId);
    }

    const deleteIcon = target.closest('.delete-icon');
    if (deleteIcon) {
        const psychologistId = deleteIcon.getAttribute('data-id');
        deletePsychologist(psychologistId);
    }

    const saveBtn = target.closest('#save-schedule-btn');
    if (saveBtn) {
        saveSchedule();
    }

    const cancelBtn = target.closest('#cancel-schedule-btn');
    if (cancelBtn) {
        cancelSchedule();
    }

    const prevMonthBtn = target.closest('.prev-month-btn');
    if (prevMonthBtn) {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar('schedule-grid', currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
    }

    const nextMonthBtn = target.closest('.next-month-btn');
    if (nextMonthBtn) {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar('schedule-grid', currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
    }
    
    const toggleBtn = target.closest('.expand-toggle');
    if (toggleBtn) {
        const collapsibleItem = toggleBtn.closest('.summary-collapsible-item');
        const slotList = collapsibleItem.querySelector('.summary-slot-list');
        
        slotList.classList.toggle('hidden');
        collapsibleItem.classList.toggle('expanded');
        
        toggleBtn.textContent = slotList.classList.contains('hidden') ? '+' : 'x';
    }

    const deleteSlotBtn = target.closest('.delete-slot-btn');
    if (deleteSlotBtn) {
        const date = deleteSlotBtn.dataset.date;
        const slot = deleteSlotBtn.dataset.slot;

        selectedSchedule[date] = selectedSchedule[date].filter(s => s !== slot);

        if (selectedSchedule[date].length === 0) {
            delete selectedSchedule[date];
            const calendarDay = document.querySelector(`.calendar-day[data-date="${date}"]`);
            if (calendarDay) {
                calendarDay.classList.remove('selected-day');
            }
        }
        renderTimeSlots(date);
        updateSummary();
    }
    
    const copyBtn = target.closest('#copy-schedule-btn');
    if (copyBtn) {
        const date = copyBtn.dataset.date;
        const isCopyMode = !!document.querySelector('.calendar-day.copy-source');

        if (isCopyMode) {
            document.querySelectorAll('.calendar-day').forEach(d => {
                d.classList.remove('copy-target', 'copy-source', 'temp-copy-highlight');
            });
            renderTimeSlots(date);
        } else {
            copySchedule(date);
        }
        return;
    }

    const dayEl = target.closest('.calendar-day');
    if (dayEl && !dayEl.classList.contains('past-day')) {
        const date = dayEl.dataset.date;
        
        document.querySelectorAll('.calendar-day').forEach(d => {
            d.classList.remove('selected-day');
        });
        
        const sourceDay = document.querySelector('.calendar-day.copy-source');
        if (sourceDay) {
            if (dayEl.classList.contains('copy-target')) {
                const sourceDate = sourceDay.dataset.date;
                const sourceSlots = selectedSchedule[sourceDate] || [];
                selectedSchedule[date] = [...sourceSlots];
                dayEl.classList.add('temp-copy-highlight');
                updateSummary();
            }
            renderTimeSlots(date);
        } else {
            if (!target.closest('.time-slot-item') && !target.closest('#copy-schedule-btn')) {
                dayEl.classList.add('selected-day');
                renderTimeSlots(date);
            }
        }
    }
});
    
// <<< START: Измененный код >>>
    document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.id === 'psychologist-select') {
            const newPsychologistId = target.value;
            
            if (hasUnsavedChanges && previousPsychologistId && previousPsychologistId !== newPsychologistId) {
                const userConfirmed = confirm('У вас є незбережені зміни. Ви впевнені, що хочете змінити психолога?');
                if (!userConfirmed) {
                    target.value = previousPsychologistId;
                    return;
                }
            }
            
            previousPsychologistId = newPsychologistId;
            hasUnsavedChanges = false;
            
            loadSchedule(newPsychologistId);
        }
    });
// <<< END: Измененный код >>>

});
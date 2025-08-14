const SUPABASE_URL = 'https://usipvnxjmvdhagllufqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXB2bnhqbXZkaGFnbGx1ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTIzOTIsImV4cCI6MjA3MDY2ODM5Mn0.T9Lwx-cEjpuw-6GAxVEZ8DhjToWD0jI4WMpYSK-X1I8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showSection(sectionName) {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const content = document.getElementById('content');
    const rightPanel = document.getElementById('right-panel');
    const pageTitle = document.querySelector('.page-title');

    const sections = {
        'Dashboard': `
            <h1>Dashboard</h1>
            <p>Ласкаво просимо до панелі управління!</p>
        `,
        'Психологи': `
            <div class="content-header">
                <h1>Керування психологами</h1>
                <img src="https://cdn.jsdelivr.net/npm/heroicons@1.0.6/outline/plus-circle.svg" alt="Додати психолога" class="add-psychologist-icon">
            </div>
            <div id="psychologists-list"></div>
        `,
        'Расписание': '<h1>Керування розкладом</h1><p>Здесь будет расписание психологов на неделю.</p>',
        'Записи': '<h1>Записи клієнтів</h1><p>Здесь будет список забронированных консультаций.</p>',
        'Статистика': '<h1>Статистика та аналітика</h1><p>Здесь будет статистика по оплатам и посещениям.</p>'
    };

    navLinks.forEach(navLink => navLink.classList.remove('active'));
    const activeLink = Array.from(navLinks).find(link => link.textContent.trim().endsWith(sectionName));
    if (activeLink) {
        activeLink.classList.add('active');
    }

    pageTitle.textContent = sectionName;
    content.innerHTML = sections[sectionName] || `<h1>Раздел "${sectionName}"</h1><p>Содержимое пока не готово.</p>`;
    rightPanel.innerHTML = `<p style="color: var(--light-text-color);">Здесь может отображаться дополнительная информация или виджеты.</p>`;

    if (sectionName === 'Психологи') {
        fetchAndDisplayPsychologists();
        rightPanel.innerHTML = `<p style="color: var(--light-text-color);">Натисніть на "+" щоб додати психолога.</p>`;
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

document.addEventListener('DOMContentLoaded', () => {
    showSection('Dashboard');
    fetchAdminInfo();

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            let sectionName = '';
            const textNodes = Array.from(link.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
            if (textNodes.length > 0) {
                sectionName = textNodes[0].textContent.trim();
            } else {
                sectionName = link.textContent.trim().split('\n').pop().trim();
            }
            console.log('Извлеченное имя раздела:', sectionName); // Добавлена эта строка
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });

    document.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('add-psychologist-icon')) {
            showAddPsychologistForm();
            return;
        }

        const editIcon = target.closest('.edit-icon');
        if (editIcon) {
            const psychologistId = editIcon.getAttribute('data-id');
            showEditPsychologistForm(psychologistId);
            return;
        }

        const deleteIcon = target.closest('.delete-icon');
        if (deleteIcon) {
            const psychologistId = deleteIcon.getAttribute('data-id');
            deletePsychologist(psychologistId);
            return;
        }
    });
});
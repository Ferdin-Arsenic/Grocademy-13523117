const API_BASE_URL = 'http://localhost:3000';

// Tambahkan ini di dekat API_BASE_URL Anda
let currentSortBy = 'title'; // Default sorting
let currentSortOrder = 'desc';   // Default order

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
             });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Registrasi gagal');
            }

            localStorage.setItem('accessToken', result.accessToken);

            messageDiv.textContent = 'Registration succeed!';
            messageDiv.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);

        } catch (error) {
            messageDiv.style.color = 'red';
            if (error.message.toLowerCase().includes('already exists')) {
                messageDiv.innerHTML = `Email or Username is already exist. <a href="login.html">Login di sini</a>.`;
            } else {
                messageDiv.textContent = error.message;
            }
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login gagal');
            }

            localStorage.setItem('accessToken', result.accessToken);

            console.log('Token berhasil disimpan:', localStorage.getItem('accessToken'));
            
            messageDiv.textContent = 'Login succeed!';
            messageDiv.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'browse-courses.html';
            }, 1000);

        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('browse-page')) {
        setupBrowsePage();
    }
});

// Fungsi utama untuk setup halaman browse
function setupBrowsePage() {
    loadUserData();
    loadCourses(); // Muat course saat halaman pertama kali dibuka
    initializeCourseModal();
    
    const toggleBtn = document.getElementById('sidebar-toggle');
    const body = document.querySelector('body');

    if (toggleBtn && body) {
        toggleBtn.addEventListener('click', () => {
            // Toggle class 'sidebar-collapsed' pada elemen body
            body.classList.toggle('sidebar-collapsed');
        });
    }

    // Logika untuk tombol search
    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');

    if (searchButton && searchBox) {
        searchButton.addEventListener('click', () => {
            console.log('Search button clicked, query:', searchBox.value); // Debug
            loadCourses(1, 10, searchBox.value);
        });
        
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter pressed, query:', searchBox.value); // Debug
                loadCourses(1, 10, searchBox.value);
            }
        });
    }

    // Logika untuk tombol logout
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        });
    }

    // Setup sorting buttons
    setupSortingButtons();
}

function setupSortingButtons() {
    const sortTitleBtn = document.getElementById('sort-title-btn');
    const sortPriceBtn = document.getElementById('sort-price-btn');
    const sortOrderBtn = document.getElementById('sort-order-btn');
    
    if (sortTitleBtn) {
        sortTitleBtn.addEventListener('click', () => {
            console.log('Title sort clicked'); // Debug
            currentSortBy = 'title';
            
            // Update visual state
            sortTitleBtn.classList.add('active');
            if (sortPriceBtn) sortPriceBtn.classList.remove('active');
            
            // Get current search query
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            loadCourses(1, 10, currentQuery);
        });
    }

    if (sortPriceBtn) {
        sortPriceBtn.addEventListener('click', () => {
            console.log('Price sort clicked'); // Debug
            currentSortBy = 'price';
            
            // Update visual state
            sortPriceBtn.classList.add('active');
            if (sortTitleBtn) sortTitleBtn.classList.remove('active');
            
            // Get current search query
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            loadCourses(1, 10, currentQuery);
        });
    }

    if (sortOrderBtn) {
        sortOrderBtn.addEventListener('click', () => {
            console.log('Sort order clicked, current:', currentSortOrder); // Debug
            
            // Toggle sort order
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            
            // Update icon
            const icon = sortOrderBtn.querySelector('i');
            if (icon) {
                icon.className = currentSortOrder === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
            }
            
            console.log('New sort order:', currentSortOrder); // Debug
            
            // Get current search query
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            loadCourses(1, 10, currentQuery);
        });
    }
}

async function loadUserData() {
    const token = localStorage.getItem('accessToken');
    const userInfoDiv = document.getElementById('user-info');
    const userBalanceDiv = document.getElementById('user-balance');

    // Jika tidak ada token, paksa pengguna untuk login
    if (!token) {
        window.location.href = 'login.html';
        return; // Hentikan eksekusi fungsi
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/self`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            // Jika token tidak valid, hapus dan paksa login
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
            return;
        }

        const result = await response.json();
        const user = result.data;

        // Tampilkan info pengguna dan saldo secara dinamis
        document.getElementById('user-name').textContent = user.firstName;
        document.getElementById('balance-amount').textContent = user.balance.toLocaleString('id-ID');
        
        // Tampilkan elemen yang sebelumnya tersembunyi
        if(userInfoDiv) userInfoDiv.style.display = 'block';
        if(userBalanceDiv) userBalanceDiv.style.display = 'block';

    } catch (error) {
        console.error('Gagal mengambil data user:', error);
        // Jika ada error lain, paksa login
        window.location.href = 'login.html';
    }
}

async function loadCourses(page = 1, limit = 10, query = '') {
    const courseListContainer = document.getElementById('course-list-container');
    if (!courseListContainer) return;

    console.log('Loading courses with params:', { page, limit, query, sortBy: currentSortBy, sortOrder: currentSortOrder }); // Debug

    courseListContainer.innerHTML = '<p>Loading courses...</p>';

    try {
        const url = new URL(`${API_BASE_URL}/courses`);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);
        if (query) {
            url.searchParams.append('q', query);
        }

        url.searchParams.append('sortBy', currentSortBy);
        url.searchParams.append('sortOrder', currentSortOrder);

        console.log('API URL:', url.toString()); // Debug

        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal memuat data course');

        const result = await response.json();
        const { data, pagination } = result;
        
        courseListContainer.innerHTML = ''; 
        
        if (data && data.length > 0) {
            data.forEach(course => {
                console.log('Course data:', course);
                console.log('ThumbnailImage:', course.thumbnailImage);

                // PERBAIKAN: Penanganan URL gambar yang lebih robust
                let imageUrl = '../assets/placeholder.jpeg'; // Default fallback
                
                if (course.thumbnailImage) {
                    // Remove leading slash jika ada
                    const cleanPath = course.thumbnailImage.replace(/^\/+/, '');
                    imageUrl = `${API_BASE_URL}/${cleanPath}`;
                    console.log('Backend image URL:', imageUrl);
                }

                // Struktur HTML dengan penanganan error gambar yang lebih baik
                const courseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${imageUrl}" 
                                 alt="${course.title}" 
                                 style="width: 100%; height: 100%; object-fit: cover; display: block;"
                                 onerror="handleImageError(this)"
                                 onload="console.log('Image loaded successfully:', this.src)">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-instructor">by ${course.instructor}</p>
                            <div class="course-footer">
                                <span class="course-price">Rp ${course.price.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                `;
                courseListContainer.insertAdjacentHTML('beforeend', courseCardHTML);
            });

            setTimeout(() => {
                addCourseCardListeners();
            }, 100);
        } else {
            courseListContainer.innerHTML = '<p>Tidak ada course yang ditemukan.</p>';
        }
        
        // Panggil fungsi renderPagination setelah course dimuat
        renderPagination(pagination);

    } catch (error) {
        courseListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

function initializeCourseModal() {
    const modal = document.getElementById('courseModal');
    const closeBtn = document.getElementById('closeModal');
    
    // Close modal events
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}

async function showCourseModal(courseId) {
    const modal = document.getElementById('courseModal');
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
        if (!response.ok) throw new Error('Gagal mengambil detail course');
        
        const course = await response.json();
        
        // Mengisi data dasar modal
        document.getElementById('modalCourseTitle').textContent = course.title;
        document.getElementById('modalCourseInstructor').textContent = course.instructor;
        document.getElementById('modalCourseDescription').textContent = course.description;
        document.getElementById('modalCoursePrice').textContent = `Rp ${course.price.toLocaleString('id-ID')}`;
        
        // --- PERUBAHAN DIMULAI DI SINI ---

        // 1. Tampilkan jumlah modul di elemen yang sudah ada
        const modulesCountSpan = document.getElementById('modalCourseModules');
        modulesCountSpan.textContent = course.modules.length;

        // 2. Buat daftar judul modul secara dinamis
        const moduleListContainer = document.getElementById('modalModuleListContainer');
        moduleListContainer.innerHTML = ''; // Kosongkan daftar sebelumnya

        if (course.modules && course.modules.length > 0) {
            const moduleList = document.createElement('ul');
            moduleList.className = 'modal-module-list';
            
            course.modules.forEach(module => {
                const listItem = document.createElement('li');
                listItem.textContent = `${module.order}. ${module.title}`;
                moduleList.appendChild(listItem);
            });

            moduleListContainer.appendChild(moduleList);
        }

        // --- AKHIR PERUBAHAN ---
        
        // Set gambar thumbnail
        const modalImage = document.getElementById('modalCourseImage');
        const imageUrl = course.thumbnailImage 
            ? `${API_BASE_URL}${course.thumbnailImage}` 
            : '../assets/placeholder.jpeg';
        modalImage.style.backgroundImage = `url(${imageUrl})`;
        
        // Logika untuk tombol "Buy Now" dan pesan login
        const buyButton = document.getElementById('buyNowBtn');
        const loginNotice = document.querySelector('.login-notice');

        if (token) {
            buyButton.style.display = 'block';
            loginNotice.style.display = 'none';
        } else {
            buyButton.style.display = 'none';
            loginNotice.style.display = 'block';
        }

        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error memuat detail course:', error);
        alert('Gagal memuat detail course. Silakan coba lagi.');
    }
}

// Juga pastikan addCourseCardListeners dipanggil dengan benar:
function addCourseCardListeners() {
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        // Hapus event listener lama untuk menghindari duplikasi
        card.removeEventListener('click', handleCourseCardClick);
        card.addEventListener('click', handleCourseCardClick);
    });
}

function handleCourseCardClick(e) {
    e.preventDefault();
    const courseId = this.dataset.courseId;
    console.log('Course card clicked, ID:', courseId); // Debug log
    showCourseModal(courseId);
}

// Fungsi untuk menutup modal
function closeModal() {
    const modal = document.getElementById('courseModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Fungsi helper untuk menangani error gambar
function handleImageError(img) {
    console.log('Image failed to load:', img.src);
    if (img.src !== '../assets/placeholder.jpeg') {
        img.src = '../assets/placeholder.jpeg';
        console.log('Switched to placeholder image');
    } else {
        console.log('Even placeholder failed, hiding image');
        img.style.display = 'none';
        img.parentElement.innerHTML = '<div style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">No Image</div>';
    }
}

function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer || !pagination) return;
    
    paginationContainer.innerHTML = ''; // Selalu kosongkan dulu
    
    const { current_page, total_pages } = pagination;

    // Jangan tampilkan pagination jika hanya ada 1 halaman atau tidak ada sama sekali
    if (total_pages <= 1) {
        return;
    }

    // Tombol "Previous"
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn arrow';
    prevButton.innerHTML = '&#9664;'; 
    prevButton.disabled = current_page === 1;
    prevButton.addEventListener('click', () => {
        const searchBox = document.getElementById('search-box');
        const currentQuery = searchBox ? searchBox.value : '';
        loadCourses(current_page - 1, 10, currentQuery);
    });
    paginationContainer.appendChild(prevButton);

    // Teks "Page X of Y"
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${current_page} of ${total_pages}`;
    paginationContainer.appendChild(pageInfo);

    // Tombol "Next"
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn arrow';
    nextButton.innerHTML = '&#9654;'; 
    nextButton.disabled = current_page >= total_pages;
    nextButton.addEventListener('click', () => {
        const searchBox = document.getElementById('search-box');
        const currentQuery = searchBox ? searchBox.value : '';
        loadCourses(current_page + 1, 10, currentQuery);
    });
    paginationContainer.appendChild(nextButton);
}
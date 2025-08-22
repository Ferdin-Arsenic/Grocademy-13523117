const API_BASE_URL = 'http://localhost:3000';

let currentSortBy = 'title';
let currentSortOrder = 'desc';
let userBookmarks = new Set();

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
                throw new Error(result.message || 'Login failed');
            }

            localStorage.setItem('accessToken', result.accessToken);
            
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
    initializeSidebarToggle();

    if (document.body.classList.contains('browse-page')) {
        setupBrowsePage();
    }
    if (document.body.classList.contains('my-courses-page')) {
        setupMyCoursesPage();
    }
    if (document.body.classList.contains('course-module-page')) {
        setupCourseModulePage();
    }
    if (document.body.classList.contains('bookmarks-page')) {
        setupBookmarksPage();
    }
});

function setupBrowsePage() {
    loadUserData();
    loadCourses();
    loadUserBookmarks();
    initializeCourseModal();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');

    if (searchButton && searchBox) {
        searchButton.addEventListener('click', () => {
            loadCourses(1, 10, searchBox.value);
        });
        
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadCourses(1, 10, searchBox.value);
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        });
    }

    setupSortingButtons();
}

function setupSortingButtons() {
    const sortTitleBtn = document.getElementById('sort-title-btn');
    const sortPriceBtn = document.getElementById('sort-price-btn');
    const sortOrderBtn = document.getElementById('sort-order-btn');
    
    if (sortTitleBtn) {
        sortTitleBtn.addEventListener('click', () => {
            currentSortBy = 'title';
            sortTitleBtn.classList.add('active');
            if (sortPriceBtn) sortPriceBtn.classList.remove('active');
            
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            // TAMBAHKAN KONDISI INI
            if (document.body.classList.contains('bookmarks-page')) {
                loadBookmarks(1, 10, currentQuery);
            } else {
                loadCourses(1, 10, currentQuery);
            }
        });
    }

    if (sortPriceBtn) {
        sortPriceBtn.addEventListener('click', () => {
            currentSortBy = 'price';
            
            sortPriceBtn.classList.add('active');
            if (sortTitleBtn) sortTitleBtn.classList.remove('active');
            
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            // TAMBAHKAN KONDISI INI
            if (document.body.classList.contains('bookmarks-page')) {
                loadBookmarks(1, 10, currentQuery);
            } else {
                loadCourses(1, 10, currentQuery);
            }
        });
    }

    if (sortOrderBtn) {
        sortOrderBtn.addEventListener('click', () => {
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            
            const icon = sortOrderBtn.querySelector('i');
            if (icon) {
                icon.className = currentSortOrder === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
            }
            
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            // TAMBAHKAN KONDISI INI
            if (document.body.classList.contains('bookmarks-page')) {
                loadBookmarks(1, 10, currentQuery);
            } else {
                loadCourses(1, 10, currentQuery);
            }
        });
    }
}

function setupMyCoursesPage() {
    loadUserDataWithoutRedirect();
    loadMyCourses();
    initializeCourseModal();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');

    if (searchButton && searchBox) {
        const performSearch = () => {
            const query = searchBox.value;
            loadMyCourses(1, 10, query, currentSortBy, currentSortOrder); 
        };

        searchButton.addEventListener('click', performSearch);
        
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    const sortProgressBtn = document.getElementById('sort-progress-btn');
    const sortTitleBtn = document.getElementById('sort-title-btn');
    const sortOrderBtn = document.getElementById('sort-order-btn');
    const logoutButton = document.getElementById('logout-button');
    
    if (sortProgressBtn) {
        sortProgressBtn.addEventListener('click', () => {
            currentSortBy = 'progress';
            sortProgressBtn.classList.add('active');
            if (sortTitleBtn) sortTitleBtn.classList.remove('active');
            loadMyCourses(1, 10, '', currentSortBy, currentSortOrder);
        });
    }

    if (sortTitleBtn) {
        sortTitleBtn.addEventListener('click', () => {
            currentSortBy = 'title';
            sortTitleBtn.classList.add('active');
            if (sortProgressBtn) sortProgressBtn.classList.remove('active');
            loadMyCourses(1, 10, '', currentSortBy, currentSortOrder);
        });
    }

    if (sortOrderBtn) {
        sortOrderBtn.addEventListener('click', () => {
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            const icon = sortOrderBtn.querySelector('i');
            if (icon) {
                icon.className = currentSortOrder === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
            }
            loadMyCourses(1, 10, '', currentSortBy, currentSortOrder);
        });
    }

    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        });
    }
}

function setupBookmarksPage() {
    loadUserData();
    loadUserBookmarks(); // TAMBAHKAN INI
    loadBookmarks(); // GANTI loadCourses() dengan ini
    initializeCourseModal();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');

    if (searchButton && searchBox) {
        searchButton.addEventListener('click', () => {
            loadBookmarks(1, 10, searchBox.value); // GANTI dengan loadBookmarks
        });
        
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadBookmarks(1, 10, searchBox.value); // GANTI dengan loadBookmarks
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        });
    }

    setupSortingButtons();
}


function setupCourseModulePage() {
    loadUserDataWithoutRedirect();
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (courseId) {
        const navMyCourses = document.querySelector('a[href="my-course.html"]');
        const navCourseModule = document.getElementById('nav-course-module');

        if (navMyCourses) {
            navMyCourses.classList.remove('active');
        }
        if(navCourseModule) {
            navCourseModule.style.display = 'flex';
            navCourseModule.classList.add('active');
        }

        const logoutButton = document.getElementById('logout-button');
        if(logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('accessToken');
                window.location.href = 'login.html';
            });
        }

        
        loadCourseAndModules(courseId);
    } else {
        document.querySelector('.main-content').innerHTML = '<h1>Could not found Course ID.</h1>';
    }
}

async function loadMyCourses(page = 1, limit = 10, query = '', sortBy = 'progress', sortOrder = 'desc') {
    const courseListContainer = document.getElementById('course-list-container');
    const token = localStorage.getItem('accessToken');
    if (!courseListContainer || !token) return;

    courseListContainer.innerHTML = '<p>Loading your courses...</p>';

    try {
        const url = new URL(`${API_BASE_URL}/courses/user/my-courses`);
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat data kursus Anda');

        let courses = await response.json();

        if (query) {
            const lowercasedQuery = query.toLowerCase();
            courses = courses.filter(course => 
                course.title.toLowerCase().includes(lowercasedQuery) ||
                course.instructor.toLowerCase().includes(lowercasedQuery) ||
                (course.topics && course.topics.some(topic => topic.toLowerCase().includes(lowercasedQuery)))
            );
        }

        if (sortBy === 'progress') {
            courses.sort((a, b) => {
                return sortOrder === 'asc' 
                    ? a.progress_percentage - b.progress_percentage 
                    : b.progress_percentage - a.progress_percentage;
            });
        } else if (sortBy === 'title') {
            courses.sort((a, b) => {
                return sortOrder === 'asc' 
                    ? a.title.localeCompare(b.title) 
                    : b.title.localeCompare(a.title);
            });
        }
        
        courseListContainer.innerHTML = ''; 

        if (courses && courses.length > 0) {
            courses.forEach(course => {
                const myCourseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${course.thumbnailImage ? API_BASE_URL + course.thumbnailImage : '../assets/placeholder.jpeg'}" alt="${course.title}">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>

                            <p class="course-instructor">by ${course.instructor}</p>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${course.progress_percentage}%;"></div>
                            </div>
                            <p class="progress-text">${course.progress_percentage}% Complete</p>
                        </div>
                    </div>
                `;
                courseListContainer.insertAdjacentHTML('beforeend', myCourseCardHTML);
            });
            addCourseCardListeners();
        } else {
            courseListContainer.innerHTML = '<p class="no-courses-message">Your course is empty.</p>';
        }
    } catch (error) {
        courseListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

async function loadBookmarks(page = 1, limit = 10, query = '') {
    const courseListContainer = document.getElementById('course-list-container');
    const token = localStorage.getItem('accessToken');
    if (!courseListContainer || !token) return;

    courseListContainer.innerHTML = '<p>Loading bookmarked courses...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/bookmarks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load bookmarks');

        let courses = await response.json();

        // Filter by search query
        if (query) {
            const lowercasedQuery = query.toLowerCase();
            courses = courses.filter(course => 
                course.title.toLowerCase().includes(lowercasedQuery) ||
                course.instructor.toLowerCase().includes(lowercasedQuery) ||
                (course.topics && course.topics.some(topic => topic.toLowerCase().includes(lowercasedQuery)))
            );
        }

        // Sort courses
        if (currentSortBy === 'price') {
            courses.sort((a, b) => {
                return currentSortOrder === 'asc' 
                    ? a.price - b.price 
                    : b.price - a.price;
            });
        } else if (currentSortBy === 'title') {
            courses.sort((a, b) => {
                return currentSortOrder === 'asc' 
                    ? a.title.localeCompare(b.title) 
                    : b.title.localeCompare(a.title);
            });
        }
        
        courseListContainer.innerHTML = ''; 
        
        if (courses && courses.length > 0) {
            courses.forEach(course => {
                let imageUrl = '../assets/placeholder.jpeg'; 
                if (course.thumbnailImage) {
                    const cleanPath = course.thumbnailImage.replace(/^\/+/, '');
                    imageUrl = `${API_BASE_URL}/${cleanPath}`;
                }

                const courseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${imageUrl}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="handleImageError(this)">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-instructor">by ${course.instructor}</p>
                            <div class="course-footer">
                                <span class="course-price">Rp ${course.price.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <button class="bookmark-btn bookmarked" onclick="toggleBookmark('${course.id}', this)" title="Remove from bookmarks">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                `;
                courseListContainer.insertAdjacentHTML('beforeend', courseCardHTML);
            });

            setTimeout(() => {
                addCourseCardListeners();
            }, 100);
        } else {
            courseListContainer.innerHTML = '<p class="no-courses-message">No bookmarked courses found.</p>';
        }

    } catch (error) {
        courseListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}


async function loadUserBookmarks() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/bookmarks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const bookmarks = await response.json();
            userBookmarks = new Set(bookmarks.map(bookmark => bookmark.id));
        }
    } catch (error) {
        console.error('Failed to load user bookmarks:', error);
    }
}

async function loadUserData() {
    const token = localStorage.getItem('accessToken');
    const userInfoDiv = document.getElementById('user-info');
    const userBalanceDiv = document.getElementById('user-balance');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/self`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
            return;
        }

        const result = await response.json();
        const user = result.data;

        document.getElementById('user-name').textContent = user.firstName;
        document.getElementById('balance-amount').textContent = user.balance.toLocaleString('id-ID');
        
        if(userInfoDiv) userInfoDiv.style.display = 'block';
        if(userBalanceDiv) userBalanceDiv.style.display = 'block';

    } catch (error) {
        console.error('Gagal mengambil data user:', error);
        window.location.href = 'login.html';
    }
}

async function loadUserDataWithoutRedirect() {
    const token = localStorage.getItem('accessToken');
    const userInfoDiv = document.getElementById('user-info');

    if (!token) {
        if(userInfoDiv) userInfoDiv.innerHTML = '<a href="login.html">Login</a> to see your courses.';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/self`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('accessToken');
            if(userInfoDiv) userInfoDiv.innerHTML = '<a href="login.html">Your session has expired. Please log in again.</a>';
            return;
        }

        const result = await response.json();
        const user = result.data;

        document.getElementById('user-name').textContent = user.firstName;
        
        if(userInfoDiv) userInfoDiv.style.display = 'block';

    } catch (error) {
        console.error('Gagal mengambil data user:', error);
        if(userInfoDiv) userInfoDiv.innerHTML = 'Could not load user data.';
    }
}

async function loadCourses(page = 1, limit = 10, query = '') {
    const courseListContainer = document.getElementById('course-list-container');
    if (!courseListContainer) return;

    const token = localStorage.getItem('accessToken');
    let purchasedCourseIds = new Set(); 

    if (token) {
        try {
            const myCoursesResponse = await fetch(`${API_BASE_URL}/courses/user/my-courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myCoursesResponse.ok) {
                const myCourses = await myCoursesResponse.json();
                purchasedCourseIds = new Set(myCourses.map(course => course.id));
            }
        } catch (error) {
            console.error("Failed to get user course data for filtering: ", error);
        }
    }

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

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load the courses');

        const result = await response.json();
        let { data, pagination } = result;
        if (purchasedCourseIds.size > 0) {
            data = data.filter(course => !purchasedCourseIds.has(course.id));
        }
        
        courseListContainer.innerHTML = ''; 
        
        if (data && data.length > 0) {
            data.forEach(course => {
                let imageUrl = '../assets/placeholder.jpeg'; 
                if (course.thumbnailImage) {
                    const cleanPath = course.thumbnailImage.replace(/^\/+/, '');
                    imageUrl = `${API_BASE_URL}/${cleanPath}`;
                }

                const isBookmarked = userBookmarks.has(course.id);
                const bookmarkButtonHTML = token ? `
                    <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                            onclick="toggleBookmark('${course.id}', this, event)" 
                            title="${isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
                        <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                ` : '';

                const courseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${imageUrl}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="handleImageError(this)">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-instructor">by ${course.instructor}</p>
                            <div class="course-footer">
                                <span class="course-price">Rp ${course.price.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        ${bookmarkButtonHTML}
                    </div>
                `;
                courseListContainer.insertAdjacentHTML('beforeend', courseCardHTML);
            });

            setTimeout(() => {
                addCourseCardListeners();
            }, 100);
        } else {
            courseListContainer.innerHTML = '<p class="no-courses-message"> No course found</p>';
        }
        
        renderPagination(pagination);

    } catch (error) {
        courseListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

async function loadCourseAndModules(courseId) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const courseRes = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!courseRes.ok) throw new Error('Failed to load the course detail.');
        const course = await courseRes.json();

        const modulesRes = await fetch(`${API_BASE_URL}/courses/${courseId}/modules`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!modulesRes.ok) throw new Error('Failed to load module.');
        let modules = await modulesRes.json();

        displayCourseDetails(course, modules);
        displayModuleList(courseId, modules);

    } catch (error) {
        console.error(error);
        document.querySelector('.main-content').innerHTML = `<h1>Error: ${error.message}</h1>`;
    }
}

function displayCourseDetails(course, modules) {
    document.getElementById('course-title-header').textContent = course.title;
    document.getElementById('course-breadcrumb-title').textContent = course.title;


    const certificateButton = document.getElementById('download-certificate-btn');
    const completedCount = modules.filter(m => m.isCompleted).length;
    const totalModules = modules.length;
    const progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    if (progress === 100) {
        certificateButton.style.display = 'inline-flex';
        certificateButton.onclick = () => {
            const token = localStorage.getItem('accessToken');
            fetch(`${API_BASE_URL}/certificate/${course.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `sertifikat]-${course.title.replace(/\s+/g, '-')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => alert('Failed to download the certificate.'));
        };
    } else {
        certificateButton.style.display = 'none';
    }

    document.getElementById('course-progress-bar').style.width = `${progress}%`;
    document.getElementById('course-progress-text').textContent = `${progress}%`;
    document.getElementById('module-count').textContent = `(${completedCount}/${totalModules} Modules)`;
}

function displayModuleList(courseId, modules) {
    const moduleListEl = document.getElementById('module-list');
    moduleListEl.innerHTML = '';

    modules.forEach(module => {
        const li = document.createElement('li');
        li.className = 'module-item';
        li.dataset.moduleId = module.id;
        li.innerHTML = `
            <div class="module-item-info">
                <span class="module-item-order">Module ${module.order}</span>
                <span class="module-item-title">${module.title}</span>
            </div>
            ${module.isCompleted ? '<i class="fas fa-check-circle completed-icon"></i>' : ''}
        `;
        
        li.addEventListener('click', () => {
            document.querySelectorAll('.module-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            displayModuleContent(courseId, module);
        });
        
        moduleListEl.appendChild(li);
    });
}

function displayModuleContent(courseId, module) {
    document.getElementById('module-title').innerHTML = `${module.title}`;
    document.getElementById('module-description').innerHTML = module.description;

    const pdfContainer = document.getElementById('module-pdf-container');
    const videoContainer = document.getElementById('module-video-container');

    videoContainer.innerHTML = '';
    
    // Tampilkan Video jika ada
    if (module.videoContent) {
        const videoPlayer = document.createElement('video');
        videoPlayer.src = `${API_BASE_URL}${module.videoContent}`;
        videoPlayer.controls = true;
        videoPlayer.style.width = '100%';
        videoPlayer.style.borderRadius = '8px';
        videoContainer.appendChild(videoPlayer);
        videoContainer.style.display = 'block';
    } else {
        videoContainer.style.display = 'none';
    }

    if (module.pdfContent) {
        document.getElementById('module-pdf-link').href = `${API_BASE_URL}${module.pdfContent}`;
        document.getElementById('module-pdf-link').textContent = module.pdfOriginalName || module.pdfContent.split('/').pop(); 
        pdfContainer.style.display = 'flex';
    } else {
        pdfContainer.style.display = 'none';
    }

    const completeBtn = document.getElementById('complete-module-btn');
    completeBtn.style.display = 'block';
    
    if (module.isCompleted) {
        completeBtn.textContent = 'Completed';
        completeBtn.classList.add('completed');
        completeBtn.disabled = true;
    } else {
        completeBtn.textContent = 'Mark as Complete';
        completeBtn.classList.remove('completed');
        completeBtn.disabled = false;
        
        const newBtn = completeBtn.cloneNode(true);
        completeBtn.parentNode.replaceChild(newBtn, completeBtn);

        newBtn.addEventListener('click', () => markModuleAsComplete(courseId, module.id));
    }
}

async function markModuleAsComplete(courseId, moduleId) {
    const token = localStorage.getItem('accessToken');
    const btn = document.getElementById('complete-module-btn');
    btn.textContent = 'Loading...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/complete`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Gagal menandai modul selesai.');
        
        loadCourseAndModules(courseId);
        
    } catch(error) {
        alert(error.message);
        btn.textContent = 'Mark as Complete';
        btn.disabled = false;
    }
}

async function toggleBookmark(courseId, buttonElement, event) {
    
    const token = localStorage.getItem('accessToken');

    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (!token) {
        alert('You need to login to bookmark courses');
        return;
    }

    const isCurrentlyBookmarked = userBookmarks.has(courseId);
    const newBookmarkState = !isCurrentlyBookmarked;

    if (newBookmarkState) {
        userBookmarks.add(courseId);
    } else {
        userBookmarks.delete(courseId);
    }

    const cardButton = document.querySelector(`.course-card[data-course-id="${courseId}"] .bookmark-btn`);
    const modalButton = document.querySelector('.modal-bookmark-btn');

    if (cardButton) updateBookmarkButton(cardButton, newBookmarkState);
    if (modalButton) updateBookmarkButton(modalButton, newBookmarkState);

    try {
        const response = await fetch(`${API_BASE_URL}/bookmarks/${courseId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to toggle bookmark');

        if (document.body.classList.contains('bookmarks-page') && !newBookmarkState) {
            loadBookmarks();
        }

    } catch (error) {
        alert('Failed to update bookmark. Please try again.');
        if (newBookmarkState) {
            userBookmarks.delete(courseId);
        } else {
            userBookmarks.add(courseId);
        }
        if (cardButton) updateBookmarkButton(cardButton, isCurrentlyBookmarked);
        if (modalButton) updateBookmarkButton(modalButton, isCurrentlyBookmarked);
    }
}

function updateBookmarkButton(button, isBookmarked) {
    const icon = button.querySelector('i');
    if (isBookmarked) {
        icon.className = 'fas fa-bookmark';
        button.classList.add('bookmarked');
        button.title = 'Remove from bookmarks';
    } else {
        icon.className = 'far fa-bookmark';
        button.classList.remove('bookmarked');
        button.title = 'Add to bookmarks';
    }
}

function initializeSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const body = document.querySelector('body');

    if (toggleBtn && body) {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
        });
    }
}

function initializeCourseModal() {
    const modal = document.getElementById('courseModal');
    const closeBtn = document.getElementById('closeModal');
    
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
        if (!response.ok) throw new Error('Failed to get the course detail');
        
        const course = await response.json();
        
        document.getElementById('modalCourseTitle').textContent = course.title;
        document.getElementById('modalCourseInstructor').textContent = course.instructor;
        document.getElementById('modalCourseDescription').textContent = course.description;
        document.getElementById('modalCoursePrice').textContent = `Rp ${course.price.toLocaleString('id-ID')}`;
        const topicsContainer = document.getElementById('modalCourseTopics');
        topicsContainer.innerHTML = '';
        if (course.topics && course.topics.length > 0) {
            course.topics.forEach(topic => {
                const topicTag = document.createElement('span');
                topicTag.className = 'topic-tag';
                topicTag.textContent = topic;
                topicsContainer.appendChild(topicTag);
            });
        }
        document.getElementById('modalCourseModules').textContent = course.modules.length;
        const moduleListContainer = document.getElementById('modalModuleListContainer');
        moduleListContainer.innerHTML = '';
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
        const modalImage = document.getElementById('modalCourseImage');
        const imageUrl = course.thumbnailImage 
            ? `${API_BASE_URL}${course.thumbnailImage}` 
            : '../assets/placeholder.jpeg';
        modalImage.style.backgroundImage = `url(${imageUrl})`;

        const buyButton = document.getElementById('buyNowBtn');
        const loginNotice = document.querySelector('.login-notice');
        const priceElement = document.getElementById('modalCoursePrice').parentElement;
        const isMyCoursesPage = document.body.classList.contains('my-courses-page');

        if (isMyCoursesPage) {
            buyButton.textContent = 'Continue Learning';
            buyButton.onclick = () => { window.location.href = `course-module.html?id=${courseId}`; };
            priceElement.style.display = 'none';
            loginNotice.style.display = 'none';
            buyButton.style.display = 'block';
        } else if (token) {
            const myCoursesResponse = await fetch(`${API_BASE_URL}/courses/user/my-courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let isPurchased = false;
            if (myCoursesResponse.ok) {
                const myCourses = await myCoursesResponse.json();
                if (Array.isArray(myCourses)) {
                    isPurchased = myCourses.some(c => c.id === courseId);
                }
            } else {
                console.error("Could not fetch user's courses. Maybe token is expired.");
            }

            if (isPurchased) {
                buyButton.textContent = 'Continue Learning';
                buyButton.onclick = () => { window.location.href = `course-module.html?id=${courseId}`; };
            } else {
                buyButton.textContent = 'Buy Now';
                buyButton.onclick = () => handleBuyCourse(courseId);
            }

            priceElement.style.display = 'block';
            buyButton.style.display = 'block';
            loginNotice.style.display = 'none';
        } else {
            priceElement.style.display = 'block';
            buyButton.style.display = 'none';
            loginNotice.style.display = 'block';
        }

        const modalBookmarkBtn = document.createElement('button');
        modalBookmarkBtn.className = `modal-bookmark-btn ${userBookmarks.has(courseId) ? 'bookmarked' : ''}`;
        modalBookmarkBtn.onclick = (event) => {
            event.stopPropagation();
            toggleBookmark(courseId, modalBookmarkBtn, event);
        };
        modalBookmarkBtn.innerHTML = `<i class="${userBookmarks.has(courseId) ? 'fas' : 'far'} fa-bookmark"></i>`;
        modalBookmarkBtn.title = userBookmarks.has(courseId) ? 'Remove from bookmarks' : 'Add to bookmarks';

        const closeBtn = document.getElementById('closeModal');
        closeBtn.parentNode.insertBefore(modalBookmarkBtn, closeBtn);

        modal.classList.add('show');
        
    } catch (error) {
        console.error('error while loading the course detail:', error);
        alert('Failed to load the course detail. Please try again.');
    }
}

function addCourseCardListeners() {
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.removeEventListener('click', handleCourseCardClick);
        card.addEventListener('click', handleCourseCardClick);
    });
}

function handleCourseCardClick(e) {
    e.preventDefault();
    const courseId = this.dataset.courseId;
    showCourseModal(courseId);
}

async function handleBuyCourse(courseId) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert('You have to login to buy a course.');
        return;
    }

    const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`);
    const course = await courseResponse.json();

    const confirmModal = document.getElementById('confirmBuyModal');
    const confirmText = document.getElementById('confirmBuyText');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    const cancelBtn = document.getElementById('cancelBuyBtn');
    const closeConfirmBtn = document.getElementById('closeConfirmBtn');

    confirmText.textContent = `Are you sure to buy "${course.title}"?`;
    confirmModal.style.display = 'flex';

    const userConfirmation = new Promise((resolve) => {
        confirmBtn.onclick = () => {
            confirmModal.style.display = 'none';
            resolve(true);
        };
        cancelBtn.onclick = () => {
            confirmModal.style.display = 'none';
            resolve(false);
        };
        closeConfirmBtn.onclick = () => {
            confirmModal.style.display = 'none';
            resolve(false);
        };
    });

    const isConfirmed = await userConfirmation;
    if (!isConfirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/buy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Pembelian gagal. Cek saldo Anda.');
        }

        const successModal = document.getElementById('successModal');
        const successOkBtn = document.getElementById('successOkBtn');
        successModal.style.display = 'flex';
        successOkBtn.onclick = () => {
            successModal.style.display = 'none';
        };

        closeModal();
        loadUserData();
        loadCourses(); 
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

function closeModal() {
    const modal = document.getElementById('courseModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

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
    
    paginationContainer.innerHTML = '';
    
    const { current_page, total_pages } = pagination;

    if (total_pages <= 1) {
        return;
    }

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

    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${current_page} of ${total_pages}`;
    paginationContainer.appendChild(pageInfo);

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
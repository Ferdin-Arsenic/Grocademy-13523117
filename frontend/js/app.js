const API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL2 = 'http://localhost:3000/api';

let currentSortBy = 'title';
let currentSortOrder = 'desc';
let userBookmarks = new Set();
let lastCoursesData = null;
let currentPage = 1;
let currentLimit = 15;
let myCourseLimit = 10;
let bookmarksLimit = 10; 

let coursePollingIntervalId = null; 
let latestRequestTimestamp = 0;

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL2}/auth/register`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Registrasi gagal');
            }
            messageDiv.textContent = 'Registration succeed! Redirecting to login...';
            messageDiv.classList.add('show', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

        } catch (error) {
            messageDiv.classList.add('show', 'error');
            messageDiv.style.color = 'red';
            if (error.message.toLowerCase().includes('already exists')) {
                messageDiv.innerHTML = `Email or Username is already exist. <a href="login.html">Login di sini</a>.`;
            } else {
                messageDiv.textContent = error.message;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL2}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            localStorage.setItem('accessToken', result.data.token);
            
            messageDiv.textContent = 'Login succeed!';
            messageDiv.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'browse-courses.html';
            }, 1000);

        } catch (error) {
            messageDiv.classList.add('show', 'error');
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
            messageDiv.innerHTML = `Invalid credentials. <a href="register.html"> Register here</a> if you dont have an account.`;

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

function startCoursePolling() {
    stopCoursePolling();

    coursePollingIntervalId = setInterval(() => {
        const searchBox = document.getElementById('search-box');
        const currentQuery = searchBox ? searchBox.value : '';
        
        loadCourses(currentPage, currentLimit, currentQuery, true); 
    }, 1000);
}

function stopCoursePolling() {
    if (coursePollingIntervalId) {
        clearInterval(coursePollingIntervalId);
        coursePollingIntervalId = null;
    }
}

function setupBrowsePage() {
    loadUserData();
    loadCourses(1, currentLimit);
    loadUserBookmarks();
    initializeCourseModal();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');
    const itemsPerPageSelect = document.getElementById('items-per-page');

    if (searchButton && searchBox) {
        searchButton.addEventListener('click', () => {
            loadCourses(1, currentLimit, searchBox.value); 
        });
        
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadCourses(1, currentLimit, searchBox.value); 
            }
        });
    }

    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', async () => {
            stopCoursePolling();
            
            currentLimit = parseInt(itemsPerPageSelect.value, 10);
            const searchBox = document.getElementById('search-box');
            const currentQuery = searchBox ? searchBox.value : '';
            
            await loadCourses(1, currentLimit, currentQuery); 
            
            startCoursePolling();
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
    startCoursePolling();
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
    loadMyCourses(1, myCourseLimit);
    initializeCourseModal();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');
    const itemsPerPageSelect = document.getElementById('items-per-page-my-course');

    if (searchButton && searchBox) {
        const performSearch = () => {
            const query = searchBox.value;
            loadMyCourses(1, myCourseLimit, query, currentSortBy, currentSortOrder);
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
            loadMyCourses(1, myCourseLimit, query, currentSortBy, currentSortOrder);
        });
    }

    if (sortTitleBtn) {
        sortTitleBtn.addEventListener('click', () => {
            currentSortBy = 'title';
            sortTitleBtn.classList.add('active');
            if (sortProgressBtn) sortProgressBtn.classList.remove('active');
            loadMyCourses(1, myCourseLimit, query, currentSortBy, currentSortOrder);
        });
    }

    if (sortOrderBtn) {
        sortOrderBtn.addEventListener('click', () => {
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            const icon = sortOrderBtn.querySelector('i');
            if (icon) {
                icon.className = currentSortOrder === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
            }
            loadMyCourses(1, myCourseLimit, query, currentSortBy, currentSortOrder);
        });
    }

    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', () => {
            myCourseLimit = parseInt(itemsPerPageSelect.value, 10);
            const query = searchBox ? searchBox.value : '';
            loadMyCourses(1, myCourseLimit, query, currentSortBy, currentSortOrder);
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
    loadUserBookmarks();
    loadBookmarks(1, bookmarksLimit);
    initializeCourseModal();

    const searchButton = document.getElementById('search-button');
    const searchBox = document.getElementById('search-box');
    const itemsPerPageSelect = document.getElementById('items-per-page-bookmarks');

    if (searchButton && searchBox) {
        searchButton.addEventListener('click', () => {
            loadBookmarks(1, bookmarksLimit, searchBox.value); 
        });
        
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadBookmarks(1, bookmarksLimit, searchBox.value); 
            }
        });
    }

    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', () => {
            bookmarksLimit = parseInt(itemsPerPageSelect.value, 10);
            const query = searchBox ? searchBox.value : '';
            loadBookmarks(1, bookmarksLimit, query);
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
        const url = new URL(`${API_BASE_URL2}/courses/my-courses`);
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat data kursus Anda');

        const result = await response.json();
        let allCourses = result.data; 

        if (query) {
            const lowercasedQuery = query.toLowerCase();
            allCourses = allCourses.filter(course => 
                course.title.toLowerCase().includes(lowercasedQuery) ||
                course.instructor.toLowerCase().includes(lowercasedQuery) ||
                (course.topics && course.topics.some(topic => topic.toLowerCase().includes(lowercasedQuery)))
            );
        }

        if (sortBy === 'progress') {
            allCourses.sort((a, b) => {
                return sortOrder === 'asc' 
                    ? a.progress_percentage - b.progress_percentage 
                    : b.progress_percentage - a.progress_percentage;
            });
        } else if (sortBy === 'title') {
            allCourses.sort((a, b) => {
                return sortOrder === 'asc' 
                    ? a.title.localeCompare(b.title) 
                    : b.title.localeCompare(a.title);
            });
        }
        
        const totalItems = allCourses.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const courses = allCourses.slice(startIndex, endIndex);

        courseListContainer.innerHTML = ''; 

        if (courses && courses.length > 0) {
            courses.forEach(course => {
                let imageUrl = course.thumbnail_image || '../assets/placeholder.jpeg';

                const myCourseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${imageUrl}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="handleImageError(this)">
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

        renderPaginationForMyCourses(page, totalPages, query, sortBy, sortOrder);

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
        const response = await fetch(`${API_BASE_URL2}/bookmarks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load bookmarks');

        let allCourses = await response.json();

        if (query) {
            const lowercasedQuery = query.toLowerCase();
            allCourses = allCourses.filter(course => 
                course.title.toLowerCase().includes(lowercasedQuery) ||
                course.instructor.toLowerCase().includes(lowercasedQuery) ||
                (course.topics && course.topics.some(topic => topic.toLowerCase().includes(lowercasedQuery)))
            );
        }

        if (currentSortBy === 'price') {
            allCourses.sort((a, b) => {
                return currentSortOrder === 'asc' 
                    ? a.price - b.price 
                    : b.price - a.price;
            });
        } else if (currentSortBy === 'title') {
            allCourses.sort((a, b) => {
                return currentSortOrder === 'asc' 
                    ? a.title.localeCompare(b.title) 
                    : b.title.localeCompare(a.title);
            });
        }
        
        const totalItems = allCourses.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const courses = allCourses.slice(startIndex, endIndex);
        
        courseListContainer.innerHTML = ''; 
        
        if (courses && courses.length > 0) {
            courses.forEach(course => {
                let imageUrl = course.thumbnail_image || '../assets/placeholder.jpeg';

                const courseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${imageUrl}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="handleImageError(this)">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-instructor">by ${course.instructor}</p>
                            <div class="course-footer">
                                <span class="course-price">$ ${course.price.toLocaleString('id-ID')}</span>
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

        renderPaginationForBookmarks(page, totalPages, query);

    } catch (error) {
        courseListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}


async function loadUserBookmarks() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL2}/bookmarks`, {
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
        const response = await fetch(`${API_BASE_URL2}/auth/self`, {
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
        console.error('Failed to get user data:', error);
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
        const response = await fetch(`${API_BASE_URL2}/auth/self`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('accessToken');
            if(userInfoDiv) userInfoDiv.innerHTML = '<a href="login.html">Your session has expired. Please login again.</a>';
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

async function loadCourses(page = 1, limit = 15, query = '', silent = false) {
    const requestTimestamp = Date.now();
    latestRequestTimestamp = requestTimestamp;

    currentPage = page;
    currentLimit = limit;
    
    const courseListContainer = document.getElementById('course-list-container');
    if (!courseListContainer) return;

    const token = localStorage.getItem('accessToken');
    const endpoint = token ? `${API_BASE_URL2}/courses/for-user` : `${API_BASE_URL2}/courses`;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    if (!silent) {
        courseListContainer.innerHTML = '<p>Loading courses...</p>';
    }

    try {
        const url = new URL(endpoint);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);
        if (query) url.searchParams.append('q', query);
        url.searchParams.append('sortBy', currentSortBy);
        url.searchParams.append('sortOrder', currentSortOrder);

        const response = await fetch(url, { headers });

        if (requestTimestamp < latestRequestTimestamp) {
            return;
        }

        if (!response.ok) throw new Error('Failed to load the courses');

        const result = await response.json();
        
        const newCoursesData = JSON.stringify(result.data);
        if (newCoursesData === lastCoursesData && silent) {
            return;
        }
        lastCoursesData = newCoursesData;

        const { data, pagination } = result;
        courseListContainer.innerHTML = ''; 
        
        if (data && data.length > 0) {
            data.forEach(course => {
                const isBookmarked = userBookmarks.has(course.id);
                const bookmarkButtonHTML = token ? `
                    <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                            onclick="toggleBookmark('${course.id}', this, event)" 
                            title="${isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
                        <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                ` : '';

                let imageUrl = course.thumbnail_image || '../assets/placeholder.jpeg';
                const courseCardHTML = `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-image">
                            <img src="${imageUrl}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="handleImageError(this)">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-instructor">by ${course.instructor}</p>
                            <div class="course-footer">
                                <span class="course-price">$ ${course.price.toLocaleString('id-ID')}</span>
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
        
        if (!silent) {
            renderPagination(pagination);
        }

    } catch (error) {
        if (requestTimestamp < latestRequestTimestamp) {
            return;
        }
        if (!silent) {
            courseListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        } else {
            console.error("Polling failed silently:", error.message);
        }
    }
}

async function loadCourseAndModules(courseId) {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('No authentication token found');
        const modulesList = document.getElementById('modules-list');
        if (modulesList) {
            modulesList.innerHTML = '<li>Please login to access course modules.</li>';
        }
        return;
    }

    try {
        const courseResponse = await fetch(`${API_BASE_URL2}/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!courseResponse.ok) {
            throw new Error('Failed to fetch course details');
        }

        const courseResult = await courseResponse.json();
        const course = courseResult.data;

        const modulesResponse = await fetch(`${API_BASE_URL2}/courses/${courseId}/modules`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!modulesResponse.ok) {
            throw new Error('Failed to fetch course modules');
        }

        const modulesResult = await modulesResponse.json();
        const modules = modulesResult.data;

        const transformedModules = modules.map(module => ({
            id: module.id,
            title: module.title,
            description: module.description,
            order: module.order,
            videoContent: module.video_content,
            pdfContent: module.pdf_content,
            isCompleted: module.is_completed || false
        }));

        displayCourseDetails(course, transformedModules);
        displayModuleList(courseId, transformedModules);

        if (transformedModules.length > 0) {
            const firstModule = transformedModules[0];
            displayModuleContent(courseId, firstModule);
            
            setTimeout(() => {
                const firstModuleItem = document.querySelector('.module-item');
                if (firstModuleItem) {
                    firstModuleItem.classList.add('active');
                }
            }, 100);
        }

    } catch (error) {
        console.error('Error loading course and modules:', error);
        const modulesList = document.getElementById('modules-list');
        if (modulesList) {
            modulesList.innerHTML = `<li>Error: ${error.message}</li>`;
        }

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h2>Error Loading Course</h2>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">Try Again</button>
                </div>
            `;
        }
    }
}

function displayModules(modules) {
    const modulesList = document.getElementById('modules-list');
    if (!modulesList) return;

    modulesList.innerHTML = '';

    if (!modules || modules.length === 0) {
        modulesList.innerHTML = '<li>No modules available for this course.</li>';
        return;
    }

    modules.forEach(module => {
        const listItem = document.createElement('li');
        listItem.className = 'module-item';
        listItem.dataset.moduleId = module.id;
        
        listItem.innerHTML = `
            <div class="module-info">
                <span class="module-order">Module ${module.order}</span>
                <span class="module-title">${module.title}</span>
            </div>
            ${module.isCompleted ? '<i class="fas fa-check-circle completed-icon"></i>' : ''}
        `;
        
        listItem.addEventListener('click', () => {
            document.querySelectorAll('.module-item').forEach(item => 
                item.classList.remove('active')
            );
            listItem.classList.add('active');
            displayModuleContent(module.courseId, module);
        });
        
        modulesList.appendChild(listItem);
    });
}

function displayCourseDetails(course, modules) {
    const safelySetText = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text || '';
        }
    };
    safelySetText('course-title-header', course.title);
    safelySetText('course-breadcrumb-title', course.title);

    let completedCount = 0;
    let totalModules = 0;
    let progress = 0;
    
    if (Array.isArray(modules)) {
        totalModules = modules.length;
        completedCount = modules.filter(m => m.isCompleted).length;
        progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
    }

    const certificateButton = document.getElementById('download-certificate-btn');
    if (certificateButton) {
        if (progress === 100) {
            certificateButton.style.display = 'inline-flex';
            certificateButton.onclick = () => {
                const token = localStorage.getItem('accessToken');
                fetch(`${API_BASE_URL2}/certificate/${course.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => {
                    if (!res.ok) throw new Error('Certificate not available');
                    return res.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `certificate-${course.title.replace(/\s+/g, '-')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                })
                .catch(error => {
                    console.error('Certificate download failed:', error);
                    alert('Failed to download certificate. Please try again later.');
                });
            };
        } else {
            certificateButton.style.display = 'none';
        }
    }

    const progressBar = document.getElementById('course-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    safelySetText('course-progress-text', `${progress}%`);
    safelySetText('module-count', `(${completedCount}/${totalModules} Modules)`);
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

function displayModuleList(courseId, modules) {
    const moduleListEl = document.getElementById('module-list');
    if (!moduleListEl) {
        console.error('Module list element not found');
        return;
    }

    moduleListEl.innerHTML = '';

    if (!modules || modules.length === 0) {
        moduleListEl.innerHTML = '<li class="no-modules">No modules available</li>';
        return;
    }

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
            document.querySelectorAll('.module-item').forEach(item => 
                item.classList.remove('active')
            );
            li.classList.add('active');
            displayModuleContent(courseId, module);
        });
        
        moduleListEl.appendChild(li);
    });
}

function displayModuleContent(courseId, module) {
    document.getElementById('module-title').innerHTML = module.title;
    document.getElementById('module-description').innerHTML = module.description;

    const pdfContainer = document.getElementById('module-pdf-container');
    const videoContainer = document.getElementById('module-video-container');

    videoContainer.innerHTML = '';
    
    if (module.videoContent) {
        const videoPlayer = document.createElement('video');
        videoPlayer.src = module.videoContent.startsWith('http') 
            ? module.videoContent 
            : `${API_BASE_URL}${module.videoContent}`;
        videoPlayer.controls = true;
        videoPlayer.style.width = '100%';
        videoPlayer.style.borderRadius = '8px';
        videoContainer.appendChild(videoPlayer);
        videoContainer.style.display = 'block';
    } else {
        videoContainer.style.display = 'none';
    }

    if (module.pdfContent) {
        const pdfLink = document.getElementById('module-pdf-link');
        if (pdfLink) {
            pdfLink.href = module.pdfContent.startsWith('http') 
                ? module.pdfContent 
                : `${API_BASE_URL}${module.pdfContent}`;
            pdfLink.textContent = module.pdfOriginalName || module.pdfContent.split('/').pop();
        }
        pdfContainer.style.display = 'flex';
    } else {
        pdfContainer.style.display = 'none';
    }

    const completeBtn = document.getElementById('complete-module-btn');
    if (completeBtn) {
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
}

async function markModuleAsComplete(courseId, moduleId) {
    const token = localStorage.getItem('accessToken');
    const btn = document.getElementById('complete-module-btn');
    
    if (!token) {
        alert('No authentication token found. Please login again.');
        return;
    }
    
    btn.textContent = 'Loading...';
    btn.disabled = true;
    
    try {
        const url = `${API_BASE_URL2}/modules/${moduleId}/complete`;
        console.log('Making request to:', url);
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Failed to mark module as complete: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Success:', result);
        
        loadCourseAndModules(courseId);
        
    } catch(error) {
        console.error('Error completing module:', error);
        alert(`Error: ${error.message}`);
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
        const response = await fetch(`${API_BASE_URL2}/bookmarks/${courseId}`, {
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
        const response = await fetch(`${API_BASE_URL2}/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to get the course detail');
        
        const result = await response.json();
        const course = result.data;

        if (!course) { 
             throw new Error('Course data not found in response.');
        }
        
        document.getElementById('modalCourseTitle').textContent = course.title;
        document.getElementById('modalCourseInstructor').textContent = course.instructor;
        document.getElementById('modalCourseDescription').textContent = course.description;
        document.getElementById('modalCoursePrice').textContent = `$ ${course.price.toLocaleString('id-ID')}`;
        
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
        
        document.getElementById('modalCourseModules').textContent = course.total_modules || 0; 
        
        const moduleListContainer = document.getElementById('modalModuleListContainer');
        moduleListContainer.innerHTML = '';


        const modalImage = document.getElementById('modalCourseImage');
        const imageUrl = course.thumbnailImage || '../assets/placeholder.jpeg';
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
            const myCoursesResponse = await fetch(`${API_BASE_URL}/courses/my-courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let isPurchased = false;
            if (myCoursesResponse.ok) {
                const myCoursesResult = await myCoursesResponse.json();
                const myCourses = myCoursesResult.data; 
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

        const existingModalBookmarkBtn = document.querySelector('.modal-bookmark-btn');
        if (existingModalBookmarkBtn) {
            existingModalBookmarkBtn.remove();
        }
        
        if (!isMyCoursesPage) {
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
        }

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
    const courseResponse = await fetch(`${API_BASE_URL2}/courses/${courseId}`);
    if (!courseResponse.ok) {
        alert("Could not get course details.");
        return;
    }
    const course = (await courseResponse.json()).data;

    const confirmModal = document.getElementById('confirmBuyModal');
    const confirmText = document.getElementById('confirmBuyText');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    const cancelBtn = document.getElementById('cancelBuyBtn');
    const closeConfirmBtn = document.getElementById('closeConfirmBtn');

    confirmText.textContent = `Are you sure you want to buy "${course.title}"?`;
    confirmModal.style.display = 'flex';

    const isConfirmed = await new Promise((resolve) => {
        confirmBtn.onclick = () => resolve(true);
        cancelBtn.onclick = () => resolve(false);
        closeConfirmBtn.onclick = () => resolve(false);
    });

    confirmModal.style.display = 'none';

    if (!isConfirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL2}/courses/${courseId}/buy`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Purchase failed. Please check your balance.');
        }

        const successModal = document.getElementById('successModal');
        const successOkBtn = document.getElementById('successOkBtn');
        successModal.style.display = 'flex';
        successOkBtn.onclick = () => {
            successModal.style.display = 'none';
            closeModal();
            loadUserData();
            loadCourses(currentPage, currentLimit, '', false, `&timestamp=${new Date().getTime()}`); 
        };
        
    } catch (error) {
        const errorModal = document.getElementById('errorModal');
        const errorModalText = document.getElementById('errorModalText');
        const errorOkBtn = document.getElementById('errorOkBtn');
        
        errorModalText.textContent = error.message;
        errorModal.style.display = 'flex';
        errorOkBtn.onclick = () => {
            errorModal.style.display = 'none';
        };
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
        loadCourses(current_page - 1, currentLimit, currentQuery);
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
        loadCourses(current_page + 1, currentLimit, currentQuery);
    });
    paginationContainer.appendChild(nextButton);
}

function renderPaginationForMyCourses(currentPage, totalPages, query, sortBy, sortOrder) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer || totalPages <= 1) {
        if(paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    paginationContainer.innerHTML = '';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn arrow';
    prevButton.innerHTML = '&#9664;'; 
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        loadMyCourses(currentPage - 1, myCourseLimit, query, sortBy, sortOrder);
    });
    paginationContainer.appendChild(prevButton);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn arrow';
    nextButton.innerHTML = '&#9654;'; 
    nextButton.disabled = currentPage >= totalPages;
    nextButton.addEventListener('click', () => {
        loadMyCourses(currentPage - 1, myCourseLimit, query, sortBy, sortOrder);
    });
    paginationContainer.appendChild(nextButton);
}

function renderPaginationForBookmarks(currentPage, totalPages, query) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer || totalPages <= 1) {
        if(paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    paginationContainer.innerHTML = '';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn arrow';
    prevButton.innerHTML = '&#9664;'; 
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        loadBookmarks(currentPage - 1, bookmarksLimit, query);
    });
    paginationContainer.appendChild(prevButton);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn arrow';
    nextButton.innerHTML = '&#9654;'; 
    nextButton.disabled = currentPage >= totalPages;
    nextButton.addEventListener('click', () => {
        loadBookmarks(currentPage - 1, bookmarksLimit, query);
    });
    paginationContainer.appendChild(nextButton);
}
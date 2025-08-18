const API_BASE_URL = 'http://localhost:3000';

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
                window.location.href = 'browse-course.html';
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
            
            messageDiv.textContent = 'Login succeed!';
            messageDiv.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'browse-course.html';
            }, 1000);

        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.style.color = 'red';
        }
    });
}
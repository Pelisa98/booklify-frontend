// Auth Service for Booklify
class AuthService {
    static init() {
        this.setupAuthProtection();
        this.updateNavigation();
    }

    static isLoggedIn() {
        return localStorage.getItem('booklifyLoggedIn') === 'true';
    }

    static setupAuthProtection() {
        // Protected pages that require authentication
        const protectedPages = ['sell.html', 'profile.html', 'cart.html', 'checkout.html'];
        const currentPage = window.location.pathname.split('/').pop();

        // If on a protected page and not logged in, redirect to login
        if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
    }

    static updateNavigation() {
        // Add navigation items based on auth status
        const navList = document.querySelector('#navbarNav .navbar-nav');
        if (!navList) return;

        // Determine if we're on index.html or in a subfolder
        const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
        const profilePath = isIndex ? 'pages/profile.html' : 'profile.html';
        const loginPath = isIndex ? 'pages/login.html' : 'login.html';

        if (this.isLoggedIn()) {
            // Get user data
            const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
            
            // Add Welcome message and Logout button if we're not on the profile page
            if (!window.location.pathname.includes('profile.html')) {
                // Create container for welcome message and logout button
                const authContainer = document.createElement('li');
                authContainer.className = 'nav-item d-flex align-items-center ms-2';
                
                // Add Welcome message
                const welcomeSpan = document.createElement('span');
                welcomeSpan.className = 'nav-link mb-0';
                welcomeSpan.textContent = `Welcome, ${userData.fullName}`;
                
                // Add Logout button
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'btn btn-outline-danger ms-2';
                logoutBtn.id = 'logoutBtn';
                logoutBtn.textContent = 'Logout';
                
                // Combine them
                authContainer.appendChild(welcomeSpan);
                authContainer.appendChild(logoutBtn);
                
                // Add to navigation
                navList.appendChild(authContainer);                // Add logout functionality
                document.getElementById('logoutBtn')?.addEventListener('click', () => {
                    UserService.logout();
                    window.location.href = loginPath;
                });
            }
        } else {
            // Add Login link for non-logged-in users
            const loginLink = document.createElement('li');
            loginLink.className = 'nav-item';
            loginLink.innerHTML = `<a class="nav-link" href="${loginPath}">Login</a>`;
            navList.appendChild(loginLink);

            // Disable cart for non-logged-in users
            const cartLink = document.querySelector('a[href="cart.html"]');
            if (cartLink) {
                cartLink.addEventListener('click', (e) => {
                    if (!this.isLoggedIn()) {
                        e.preventDefault();
                        alert('Please log in to access your cart');
                        window.location.href = 'login.html';
                    }
                });
            }
        }
    }
}

// Initialize auth service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AuthService.init();
});

// Auth Service for Booklify
class AuthService {
    static init() {
        this.setupAuthProtection();
        // Delay navigation update to allow navbar.js to render first
        setTimeout(() => this.updateNavigation(), 100);
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
        // Navigation is now handled by navbar.js - only handle cart protection here
        if (!this.isLoggedIn()) {
            // Disable cart for non-logged-in users
            const cartLink = document.querySelector('a[href*="cart.html"]');
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

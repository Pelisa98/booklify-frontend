/**
 * Shared Navbar Component
 * Handles role-based navigation for all pages
 */
class NavbarComponent {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.userRole = localStorage.getItem('booklifyUserRole');
        this.isLoggedIn = localStorage.getItem('booklifyLoggedIn') === 'true';
    }

    /**
     * Get current page name from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        // Handle home page
        if (page === '' || page === 'index' || path.endsWith('/')) {
            return 'index';
        }
        return page;
    }

    /**
     * Generate navbar HTML based on user role and current page
     */
    generateNavbar() {
        const isAdmin = this.userRole === 'admin';
        const isCustomer = this.userRole === 'user' || this.isLoggedIn;

        if (isAdmin) {
            return this.generateAdminNavbar();
        } else if (isCustomer) {
            return this.generateCustomerNavbar();
        } else {
            return this.generateGuestNavbar();
        }
    }

    /**
     * Generate admin navbar
     */
    generateAdminNavbar() {
        // Get admin data from localStorage
        const adminData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
        const adminName = adminData.fullName || 'Admin';
        const adminFirstName = adminName.split(' ')[0] || 'Admin';
        
        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 sticky-navbar">
                <div class="container d-flex align-items-center justify-content-between">
                    <a class="navbar-brand d-flex align-items-center" href="../index.html">
                        <img src="../assets/images/logo.png" alt="Booklify Logo" height="48" class="me-2">
                        <span class="brand-text">Booklify</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-center">
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'admin-dashboard' ? 'active' : ''}" href="admin-dashboard.html">
                                    <i class="bi bi-speedometer2 me-1"></i>Dashboard
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'reviews' ? 'active' : ''}" href="reviews.html">
                                    <i class="bi bi-star-fill me-1"></i>Manage Reviews
                                </a>
                            </li>
                            <!-- Admin Dropdown -->
                            <li class="nav-item dropdown ms-2">
                                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-person-circle me-1"></i>${adminFirstName}
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="adminDropdown">
                                    <li>
                                        <a class="dropdown-item ${this.currentPage === 'admin-profile' ? 'active' : ''}" href="admin-profile.html">
                                            <i class="bi bi-person me-2"></i>Profile
                                        </a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item" href="#" id="logoutBtn">
                                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                                        </a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Generate customer navbar
     */
    generateCustomerNavbar() {
        const isHomePage = this.currentPage === 'index';
        const homeLink = isHomePage ? 'index.html' : '../index.html';
        const assetsPath = isHomePage ? 'assets' : '../assets';
        
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
        const userName = userData.fullName || 'User';
        const userFirstName = userName.split(' ')[0] || 'User';

        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 sticky-navbar">
                <div class="container d-flex align-items-center justify-content-between">
                    <a class="navbar-brand d-flex align-items-center" href="${homeLink}">
                        <img src="${assetsPath}/images/logo.png" alt="Booklify Logo" height="48" class="me-2">
                        <span class="brand-text">Booklify</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-center">
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'products' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}products.html">
                                    <i class="bi bi-book me-1"></i>Shop Textbooks
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'sell' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}sell.html">
                                    <i class="bi bi-plus-circle me-1"></i>Sell Textbooks
                                </a>
                            </li>
                            <li class="nav-item d-flex align-items-center ms-2">
                                <a class="nav-link position-relative" href="${isHomePage ? 'pages/' : ''}cart.html">
                                    <i class="bi bi-cart3 fs-4"></i>
                                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartBadge" style="display: none;">
                                        0
                                    </span>
                                </a>
                            </li>
                            <!-- User Dropdown -->
                            <li class="nav-item dropdown ms-2">
                                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-person-circle me-1"></i>${userFirstName}
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                    <li>
                                        <a class="dropdown-item ${this.currentPage === 'profile' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}profile.html">
                                            <i class="bi bi-person me-2"></i>Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item ${this.currentPage === 'orders' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}orders.html">
                                            <i class="bi bi-bag-check me-2"></i>My Orders
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item ${this.currentPage === 'my-reviews' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}my-reviews.html">
                                            <i class="bi bi-star me-2"></i>My Reviews
                                        </a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item" href="#" id="logoutBtn">
                                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                                        </a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Generate guest navbar (not logged in)
     */
    generateGuestNavbar() {
        const isHomePage = this.currentPage === 'index';
        const homeLink = isHomePage ? 'index.html' : '../index.html';
        const assetsPath = isHomePage ? 'assets' : '../assets';

        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 sticky-navbar">
                <div class="container d-flex align-items-center justify-content-between">
                    <a class="navbar-brand d-flex align-items-center" href="${homeLink}">
                        <img src="${assetsPath}/images/logo.png" alt="Booklify Logo" height="48" class="me-2">
                        <span class="brand-text">Booklify</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-center">
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'products' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}products.html">
                                    <i class="bi bi-book me-1"></i>Shop Textbooks
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'sell' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}sell.html">
                                    <i class="bi bi-plus-circle me-1"></i>Sell Textbooks
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${this.currentPage === 'login' ? 'active' : ''}" href="${isHomePage ? 'pages/' : ''}login.html">
                                    <i class="bi bi-box-arrow-in-right me-1"></i>Login
                                </a>
                            </li>
                            <li class="nav-item d-flex align-items-center ms-2">
                                <a class="nav-link position-relative" href="${isHomePage ? 'pages/' : ''}cart.html">
                                    <i class="bi bi-cart3 fs-4"></i>
                                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartBadge" style="display: none;">
                                        0
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Initialize navbar on page load
     */
    init() {
        // Find the navbar placeholder comment
        const navbarPlaceholder = document.querySelector('body');
        if (navbarPlaceholder) {
            // Insert navbar at the beginning of body
            navbarPlaceholder.insertAdjacentHTML('afterbegin', this.generateNavbar());
        }

        // Setup event listeners
        this.setupEventListeners();

        // Update cart badge if user is logged in
        if (this.isLoggedIn && this.userRole !== 'admin') {
            this.updateCartBadge();
        }
    }

    /**
     * Setup navbar event listeners
     */
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        // Check if we're on an admin page and a logout modal exists
        const logoutModal = document.getElementById('logoutModal');
        if (logoutModal) {
            // Use the existing modal
            const modal = new bootstrap.Modal(logoutModal);
            modal.show();
        } else {
            // Create and show a temporary modal if none exists
            this.showLogoutModal();
        }
    }

    /**
     * Show logout confirmation modal
     */
    showLogoutModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="tempLogoutModal" tabindex="-1" aria-labelledby="tempLogoutModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-purple text-white">
                            <h5 class="modal-title" id="tempLogoutModalLabel">
                                <i class="bi bi-box-arrow-right me-2"></i>Confirm Logout
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-question-circle-fill text-purple me-3" style="font-size: 2rem;"></i>
                                <div>
                                    <p class="mb-1 fw-bold">Are you sure you want to logout?</p>
                                    <p class="mb-0 text-muted">You will be redirected to the home page and will need to sign in again.</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-purple" id="tempConfirmLogoutBtn">
                                <i class="bi bi-box-arrow-right me-1"></i>Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal element and show it
        const modalElement = document.getElementById('tempLogoutModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Handle confirm logout
        document.getElementById('tempConfirmLogoutBtn').addEventListener('click', () => {
            this.performLogout();
        });

        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
    }

    /**
     * Perform the actual logout
     */
    performLogout() {
        // Log the logout activity if available
        try {
            const userEmail = localStorage.getItem('booklifyUserEmail') || 'Unknown User';
            const userRole = localStorage.getItem('booklifyUserRole') || 'user';
            
            if (typeof AdminService !== 'undefined' && AdminService.logActivity) {
                AdminService.logActivity(
                    `${userRole === 'admin' ? 'Admin' : 'User'} Logout`, 
                    userEmail, 
                    `${userRole === 'admin' ? 'Administrator' : 'User'} logged out of the system`, 
                    `${userRole}_logout`
                );
            }
        } catch (error) {
            console.warn('Could not log logout activity:', error);
        }

        // Clear all localStorage
        localStorage.clear();

        // Redirect based on current page
        const isAdminPage = window.location.pathname.includes('admin');
        if (isAdminPage) {
            window.location.href = 'adminLogIn.html';
        } else {
            window.location.href = '../index.html';
        }
    }

    /**
     * Update cart badge with current cart count
     */
    async updateCartBadge() {
        try {
            const cartBadge = document.getElementById('cartBadge');
            if (!cartBadge) return;

            // Get cart from localStorage
            const cart = JSON.parse(localStorage.getItem('booklifyCart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

            if (totalItems > 0) {
                cartBadge.textContent = totalItems;
                cartBadge.style.display = 'block';
            } else {
                cartBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating cart badge:', error);
        }
    }

    /**
     * Refresh cart badge (can be called from other components)
     */
    static refreshCartBadge() {
        const navbar = new NavbarComponent();
        navbar.updateCartBadge();
    }
}

// Instantiate and attach to window for other scripts to call
window.NavbarComponent = new NavbarComponent();
// Ensure toast helper is available for pages that rely on window.showToast
(function ensureToastHelper() {
    if (window.showToast) return;
    try {
        const s = document.createElement('script');
        // Determine correct relative path depending on whether the page is inside the /pages/ folder
        // e.g. /pages/payment.html should load ../js/toastHelper.js while root pages should load ./js/toastHelper.js
        const path = window.location.pathname || '';
        const scriptPath = path.includes('/pages/') ? '../js/toastHelper.js' : './js/toastHelper.js';
        s.src = scriptPath;
        s.defer = true;
        document.head.appendChild(s);
    } catch (e) {
        // best-effort; pages may include toastHelper.js themselves
        console.warn('Failed to auto-load toastHelper.js:', e);
    }
})();

// Make NavbarComponent available globally
window.NavbarComponent = NavbarComponent;

// Auto-initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const navbar = new NavbarComponent();
    navbar.init();
});

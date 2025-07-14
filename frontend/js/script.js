// Booklify Main JavaScript
// This file contains site-wide JS for Booklify

document.addEventListener('DOMContentLoaded', function () {
    // Navbar active link highlighting
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const currentPath = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Show/hide Profile link based on login status
    const isLoggedIn = localStorage.getItem('booklifyLoggedIn') === 'true';
    document.querySelectorAll('.nav-profile-link').forEach(function(link) {
        link.style.display = isLoggedIn ? '' : 'none';
    });

    // Login/Register toggle (login.html)
    const loginWrapper = document.getElementById('loginRegisterWrapper');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    if (loginWrapper && showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginWrapper.classList.remove('center-login');
            loginWrapper.classList.add('show-register');
        });
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginWrapper.classList.remove('show-register');
            loginWrapper.classList.add('center-login');
        });
    }

    // Dynamic product details (product-detail.html)
    const productDetailContainer = document.getElementById('productDetailContainer');
    if (productDetailContainer) {
        // Book data
        const books = [
            {
                id: 1,
                title: 'Introduction to Algorithms',
                author: 'Thomas H. Cormen',
                price: 'R450',
                img: '../assets/images/introtoalgorithms.png',
                condition: 'Like New',
                desc: 'This comprehensive textbook covers a broad range of algorithms in depth, making it ideal for students and professionals alike. Includes clear explanations, practical examples, and exercises for self-study.',
                rating: 4.8,
                reviews: [
                    { name: 'Alice', stars: 5, comment: 'Excellent book, very helpful for my course!' },
                    { name: 'Bob', stars: 4, comment: 'Great explanations, but a bit dense.' }
                ]
            },
            {
                id: 2,
                title: 'Database System Concepts',
                author: 'Abraham Silberschatz',
                price: 'R380',
                img: '../assets/images/databasesystem.png',
                condition: 'Good',
                desc: 'A leading textbook for database courses, this book provides a comprehensive introduction to the fundamental concepts necessary for designing, using, and implementing database systems and database applications.',
                rating: 4.5,
                reviews: [
                    { name: 'Chloe', stars: 5, comment: 'Perfect for my DBMS class.' },
                    { name: 'Dan', stars: 4, comment: 'Covers all the basics well.' }
                ]
            },
            {
                id: 3,
                title: 'Operating System Concepts',
                author: 'Abraham Silberschatz',
                price: 'R400',
                img: '../assets/images/operatingsystem.png',
                condition: 'Very Good',
                desc: 'This book provides a clear description of the concepts that underlie operating systems. It covers process, memory, storage, and security management, with practical examples and exercises.',
                rating: 4.6,
                reviews: [
                    { name: 'Eve', stars: 5, comment: 'A must-have for OS students.' },
                    { name: 'Frank', stars: 4, comment: 'Well structured and easy to follow.' }
                ]
            },
            {
                id: 4,
                title: 'Artificial Intelligence: A Modern Approach',
                author: 'Stuart Russell',
                price: 'R520',
                img: '../assets/images/ai.png',
                condition: 'New',
                desc: 'The most comprehensive, up-to-date introduction to the theory and practice of artificial intelligence. Covers search, logic, learning, and robotics, with real-world applications and exercises.',
                rating: 4.9,
                reviews: [
                    { name: 'Grace', stars: 5, comment: 'The best AI textbook out there.' },
                    { name: 'Henry', stars: 5, comment: 'Covers everything you need to know.' }
                ]
            }
        ];
        // Get id from URL
        const params = new URLSearchParams(window.location.search);
        const id = parseInt(params.get('id'), 10);
        const book = books.find(b => b.id === id);
        function renderStars(stars) {
            let html = '';
            for (let i = 1; i <= 5; i++) {
                html += `<i class="bi ${i <= stars ? 'bi-star-fill text-warning' : 'bi-star text-muted'}"></i>`;
            }
            return html;
        }
        if (book) {
            productDetailContainer.innerHTML = `
            <div class="row justify-content-center align-items-center">
                <div class="col-md-5 mb-4 mb-md-0">
                    <img src="${book.img}" alt="${book.title}" class="img-fluid rounded shadow w-100">
                </div>
                <div class="col-md-6">
                    <h2 class="fw-bold mb-2">${book.title}</h2>
                    <p class="text-muted mb-1">by ${book.author}</p>
                    <div class="mb-2"><strong>Condition:</strong> ${book.condition}</div>
                    <div class="mb-3 fw-bold text-purple fs-4">${book.price}</div>
                    <p class="mb-4">${book.desc}</p>
                    <button class="btn btn-purple btn-lg px-4 fw-bold">Add to Cart</button>
                </div>
            </div>
            <div class="row mt-5 justify-content-center">
                <div class="col-md-8">
                    <div class="bg-white rounded shadow p-4">
                        <h4 class="mb-3">Reviews & Ratings</h4>
                        <div class="mb-2">
                            <span class="fs-5 fw-bold">${book.rating.toFixed(1)}</span>
                            <span>${renderStars(Math.round(book.rating))}</span>
                            <span class="text-muted ms-2">(${book.reviews.length} reviews)</span>
                        </div>
                        <ul class="list-unstyled mt-3">
                            ${book.reviews.map(r => `
                                <li class="mb-3 border-bottom pb-2">
                                    <div class="fw-bold">${r.name} <span class="ms-2">${renderStars(r.stars)}</span></div>
                                    <div class="text-muted small">${r.comment}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            `;
        } else {
            productDetailContainer.innerHTML = '<div class="alert alert-danger">Book not found.</div>';
        }
    }

    // Profile page: logout and login check
    if (window.location.pathname.includes('profile.html')) {
        // Redirect to login if not logged in
        if (localStorage.getItem('booklifyLoggedIn') !== 'true') {
            window.location.href = 'login.html';
        }
        // Logout button
        document.addEventListener('DOMContentLoaded', function() {
            const logoutBtn = document.querySelector('.btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    localStorage.removeItem('booklifyLoggedIn');
                    window.location.href = 'login.html';
                });
            }
        });
    }

    // Product page: search/filter functionality
    if (window.location.pathname.includes('products.html')) {
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('book-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const query = searchInput.value.toLowerCase();
                    document.querySelectorAll('.book-card').forEach(function(card) {
                        const title = card.querySelector('.card-title').textContent.toLowerCase();
                        const author = card.querySelector('.card-text').textContent.toLowerCase();
                        if (title.includes(query) || author.includes(query)) {
                            card.parentElement.style.display = '';
                        } else {
                            card.parentElement.style.display = 'none';
                        }
                    });
                });
            }
        });
    }

    // Add more Booklify JS here...
}); 
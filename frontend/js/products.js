// products.js - This should be placed in your ../js/ directory
document.addEventListener('DOMContentLoaded', function() {
    const bookListContainer = document.querySelector('.products-section .row.g-4');
    const searchInput = document.getElementById('book-search-input');

    // Function to create a book card HTML for grouped books
    const createBookCard = (bookGroup) => {
        const { title, author, books, minPrice, maxPrice, totalAvailable } = bookGroup;
        
        // Use the first book's image (they should all be the same book)
        const firstBook = books[0];
        const imageUrl = `http://localhost:8081/api/book/image/${firstBook.bookID}`;
        
        // Determine price display or sold-out state
        let priceDisplay;
        if (totalAvailable === 0) {
            priceDisplay = `<span class="badge bg-danger">Sold out</span>`;
        } else if (minPrice === maxPrice) {
            priceDisplay = `R${minPrice.toFixed(2)}`;
        } else {
            priceDisplay = `R${minPrice.toFixed(2)} - R${maxPrice.toFixed(2)}`;
        }

        // Get available conditions
        const conditions = [...new Set(books.map(book => book.condition))];
        const conditionBadges = conditions.slice(0, 3).map(condition => {
            const colorClass = getConditionColorClass(condition);
            return `<span class="badge ${colorClass} me-1">${condition}</span>`;
        }).join('');
        
        const extraConditions = conditions.length > 3 ? `<span class="text-muted">+${conditions.length - 3} more</span>` : '';

        // Embed the primary book id on the card so clients can update by id when events arrive
        const firstBookId = firstBook.bookID ?? firstBook.bookId ?? firstBook.id ?? '';
        return `
            <div class="col-md-4 col-lg-3">
                <div class="card book-card h-100 shadow-sm" data-first-book-id="${firstBookId}">
                    <img src="${imageUrl}" class="card-img-top" alt="${title}" style="height: 300px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${title}</h5>
                        <p class="card-text text-muted mb-1">by ${author}</p>
                        <div class="mb-2">
                            <div class="fw-bold text-purple mb-1">${priceDisplay}</div>
                            <small class="text-muted">${totalAvailable} available from ${books.length} seller${books.length > 1 ? 's' : ''}</small>
                        </div>
                        <div class="mb-2">
                            ${conditionBadges}${extraConditions}
                        </div>
                        <a ${totalAvailable === 0 ? 'href="#" aria-disabled="true" class="btn btn-secondary disabled mt-auto"' : `href="product-detail.html?title=${encodeURIComponent(title)}" class="btn btn-purple mt-auto"`}>
                            ${totalAvailable === 0 ? 'Sold out' : 'View Details'}
                        </a>
                    </div>
                </div>
            </div>
        `;
    };

    // Function to get condition color class
    const getConditionColorClass = (condition) => {
        const conditionColors = {
            'EXCELLENT': 'bg-success',
            'GOOD': 'bg-info',
            'AVERAGE': 'bg-warning',
            'ACCEPTABLE': 'bg-secondary',
            'FAIR': 'bg-danger'
        };
        return conditionColors[condition?.toUpperCase()] || 'bg-secondary';
    };

    // Function to group books by title
    const groupBooksByTitle = (books) => {
        const grouped = {};
        
        books.forEach(book => {
            const key = `${book.title}-${book.author}`.toLowerCase();
            
            if (!grouped[key]) {
                grouped[key] = {
                    title: book.title,
                    author: book.author,
                    books: [],
                    minPrice: Infinity,
                    maxPrice: -Infinity,
                    totalAvailable: 0
                };
            }
            
            grouped[key].books.push(book);
            grouped[key].minPrice = Math.min(grouped[key].minPrice, book.price);
            grouped[key].maxPrice = Math.max(grouped[key].maxPrice, book.price);
            // Normalize available: prefer numeric available, else parse integer, else use isAvailable flag, else fallback to 1
            let avail = 1;
            if (typeof book.available === 'number') {
                avail = book.available;
            } else if (typeof book.available === 'string' && book.available.trim() !== '') {
                const parsed = parseInt(book.available, 10);
                avail = Number.isNaN(parsed) ? 1 : parsed;
            } else if (book.isAvailable === false) {
                avail = 0;
            }
            grouped[key].totalAvailable += avail;
        });

        return Object.values(grouped);
    };

    // Function to render books in the container
    const renderBooks = (books) => {
        if (!bookListContainer) return;
        if (books.length === 0) {
            bookListContainer.innerHTML = '<p class="text-center w-100">No books found.</p>';
            return;
        }
        
        // Group books by title before rendering
        const groupedBooks = groupBooksByTitle(books);
        bookListContainer.innerHTML = groupedBooks.map(createBookCard).join('');
    };

    // Function to fetch all books
    const fetchAllBooks = async () => {
        try {
            const response = await fetch('http://localhost:8081/api/book/getAll');
            if (!response.ok) {
                if (response.status === 204) { // No content
                    renderBooks([]);
                    return;
                }
                throw new Error('Failed to fetch books');
            }
            const books = await response.json();
            renderBooks(books);
        } catch (error) {
            console.error('Error fetching books:', error);
            bookListContainer.innerHTML = '<p class="text-center w-100 text-danger">Could not load books. Please try again later.</p>';
        }
    };

    // Function to search books by title
    const searchBooks = async (query) => {
        if (query.length < 2) { // Optional: only search if query is long enough
            fetchAllBooks(); // If search is cleared, show all books
            return;
        }
        try {
            const response = await fetch(`http://localhost:8081/api/book/search/title?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                if (response.status === 204) { // No content
                    renderBooks([]);
                    return;
                }
                throw new Error('Failed to search for books');
            }
            const books = await response.json();
            renderBooks(books);
        } catch (error) {
            console.error('Error searching books:', error);
            bookListContainer.innerHTML = '<p class="text-center w-100 text-danger">Error during search. Please try again.</p>';
        }
    };

    // Event listener for the search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        // Debounce search to avoid excessive API calls
        searchTimeout = setTimeout(() => {
            if (query) {
                searchBooks(query);
            } else {
                fetchAllBooks();
            }
        }, 300); // 300ms delay
    });

    // Initial load of all books
    fetchAllBooks();

    // Expose a refresh method for other modules and listen for inventory updates
    window.BookList = window.BookList || {};
    window.BookList.refresh = fetchAllBooks;

    window.addEventListener('inventoryUpdated', (e) => {
        try {
            console.log('products.js detected inventoryUpdated, refreshing list');
            fetchAllBooks();
        } catch (err) {
            console.warn('Failed to refresh product list on inventoryUpdated:', err);
        }
    });

    // Lightweight client-side update to reduce flicker: decrement counts when individual book updates arrive
    window.addEventListener('inventoryUpdatedClient', (e) => {
        try {
            const { book, quantitySold } = e.detail || {};
            if (!book || (typeof quantitySold === 'undefined' || quantitySold === null)) return;

            // Prefer id-based matching (bookID, bookId or id) — falls back to title when id not present
            const incomingId = book.bookID ?? book.bookId ?? book.id ?? null;
            const incomingTitle = (book.title || '').toLowerCase();

            const cards = document.querySelectorAll('.book-card');
            cards.forEach(card => {
                try {
                    const cardId = card.dataset.firstBookId;
                    let matched = false;
                    if (incomingId && cardId && String(incomingId) === String(cardId)) matched = true;
                    if (!matched && incomingTitle) {
                        const titleEl = card.querySelector('.card-title');
                        if (titleEl) {
                            const titleText = titleEl.textContent.trim().toLowerCase();
                            if (titleText === incomingTitle) matched = true;
                        }
                    }
                    if (!matched) return;

                    const small = card.querySelector('.card-text small.text-muted, .card-body small.text-muted');
                    if (small && small.textContent) {
                        // Attempt to parse number from text like "X available"
                        const m = small.textContent.match(/(\d+)\s+available/);
                        if (m) {
                            const current = parseInt(m[1], 10);
                            const next = Math.max(0, current - quantitySold);
                            small.textContent = `${next} available from ${card.querySelectorAll('.badge').length} seller${card.querySelectorAll('.badge').length > 1 ? 's' : ''}`;
                        }
                    }
                } catch (inner) { /* ignore per-card errors */ }
            });
        } catch (err) {
            console.warn('inventoryUpdatedClient handler error (products):', err);
        }
    });
});
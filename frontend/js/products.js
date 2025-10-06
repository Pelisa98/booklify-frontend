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
        
        // Determine price display
        let priceDisplay;
        if (minPrice === maxPrice) {
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

        return `
            <div class="col-md-4 col-lg-3">
                <div class="card book-card h-100 shadow-sm">
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
                        <a href="product-detail.html?title=${encodeURIComponent(title)}" class="btn btn-purple mt-auto">View Details</a>
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
            grouped[key].totalAvailable += 1; // Assuming each book record represents 1 available copy
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
});
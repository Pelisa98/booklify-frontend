// products.js - This should be placed in your ../js/ directory
document.addEventListener('DOMContentLoaded', function() {
    const bookListContainer = document.querySelector('.products-section .row.g-4');
    const searchInput = document.getElementById('book-search-input');

    // Function to create a book card HTML
    const createBookCard = (book) => {
        // Use the backend endpoint for the image
        const imageUrl = `http://localhost:8081/api/book/image/${book.bookID}`;

        return `
            <div class="col-md-4 col-lg-3">
                <div class="card book-card h-100 shadow-sm">
                    <img src="${imageUrl}" class="card-img-top" alt="${book.title}" style="height: 300px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text text-muted mb-1">by ${book.author}</p>
                        <div class="mb-2 fw-bold text-purple">R${book.price.toFixed(2)}</div>
                        <a href="product-detail.html?id=${book.bookID}" class="btn btn-purple mt-auto">View Details</a>
                    </div>
                </div>
            </div>
        `;
    };

    // Function to render books in the container
    const renderBooks = (books) => {
        if (!bookListContainer) return;
        if (books.length === 0) {
            bookListContainer.innerHTML = '<p class="text-center w-100">No books found.</p>';
            return;
        }
        bookListContainer.innerHTML = books.map(createBookCard).join('');
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
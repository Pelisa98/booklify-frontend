// product-detail.js - This should be placed in your ../js/ directory
document.addEventListener('DOMContentLoaded', async () => {
    const productDetailContainer = document.getElementById('productDetailContainer');
    
    // Function to show a loading message
    const showLoading = () => {
        productDetailContainer.innerHTML = '<p class="text-center">Loading book details...</p>';
    };

    // Function to show an error message
    const showError = (message) => {
        productDetailContainer.innerHTML = `<div class="alert alert-danger text-center">${message}</div>`;
    };

    // Function to render the book details
    const renderBookDetails = (book) => {
        const imageUrl = `http://localhost:8081/api/book/image/${book.bookID}`;
        const uploadedDate = new Date(book.uploadedDate).toLocaleDateString();

        const bookDetailsHtml = `
            <div class="row g-5">
                <div class="col-lg-5">
                    <div class="product-image-container">
                        <img id="bookImage" src="${imageUrl}" alt="${book.title}" class="img-fluid rounded shadow-sm">
                    </div>
                </div>
                <div class="col-lg-7">
                    <h1 class="fw-bold" id="bookTitle">${book.title}</h1>
                    <p class="text-muted fs-5 mb-2" id="bookAuthor">by ${book.author}</p>
                    <div class="d-flex align-items-center mb-4">
                         <span class="badge bg-secondary me-2" id="bookCondition">${book.condition}</span>
                         ${book.isbn ? `<span class="text-muted small" id="bookIsbn">ISBN: ${book.isbn}</span>` : ''}
                    </div>

                    <h2 class="text-purple fw-bold mb-4" id="bookPrice">R${book.price.toFixed(2)}</h2>
                    
                    <div class="mb-4">
                        <h5 class="fw-bold">Description</h5>
                        <p id="bookDescription">${book.description || 'No description provided.'}</p>
                    </div>

                    <div class="book-meta border-top pt-3">
                        <p class="mb-1"><strong class="me-2">Publisher:</strong><span id="bookPublisher">${book.publisher || 'N/A'}</span></p>
                        <p class="mb-1"><strong class="me-2">Date Listed:</strong><span id="bookUploadedDate">${uploadedDate}</span></p>
                    </div>

                    <div class="d-grid gap-2 mt-4">
                        <button class="btn btn-purple btn-lg" id="addToCartBtn">
                            <i class="bi bi-cart-plus me-2"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
        productDetailContainer.innerHTML = bookDetailsHtml;
    };

    // Main logic to fetch and display the book
    try {
        showLoading();

        // Get book ID from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');

        if (!bookId) {
            throw new Error('No book ID specified in the URL.');
        }

        // Fetch book data from the backend
        const response = await fetch(`http://localhost:8081/api/book/read/${bookId}`);

        if (response.status === 404) {
             throw new Error('Book not found. It may have been sold or removed.');
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch book details. Please try again later.');
        }

        const book = await response.json();
        renderBookDetails(book);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
});
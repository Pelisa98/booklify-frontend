import { CartService } from './cartService.js';

/**
 * Product Detail Page Controller
 * Handles book details display, cart functionality, and reviews
 */
class ProductDetailController {
    constructor() {
        this.productDetailContainer = document.getElementById('productDetailContainer');
        this.currentBook = null;
        this.init();
    }

     //Initialize the product detail page
    async init() {
        try {
            await this.loadBookDetails();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize product detail page:', error);
            this.showError(error.message);
        }
    }

    /**
     * Load book details from URL parameter and fetch all conditions
     */
    async loadBookDetails() {
        this.showLoading();

        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        const bookTitle = urlParams.get('title');

        let mainBook;
        let allSimilarBooks;

        if (bookTitle) {
            // If title is provided, fetch all books with that title
            const response = await fetch(`http://localhost:8081/api/book/search/title?query=${encodeURIComponent(bookTitle)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch books by title');
            }
            
            allSimilarBooks = await response.json();
            if (!allSimilarBooks || allSimilarBooks.length === 0) {
                throw new Error('No books found with the specified title.');
            }
            
            // Use the first book as the main book for display
            mainBook = allSimilarBooks[0];
        } else if (bookId) {
            // Original behavior: fetch by ID
            const response = await fetch(`http://localhost:8081/api/book/read/${bookId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch book details');
            }

            mainBook = await response.json();
            
            // Fetch all books with the same title to get different conditions
            const allBooksResponse = await fetch('http://localhost:8081/api/book/getAll');
            if (allBooksResponse.ok) {
                const allBooks = await allBooksResponse.json();
                allSimilarBooks = allBooks.filter(book => 
                    book.title.toLowerCase() === mainBook.title.toLowerCase()
                );
            } else {
                allSimilarBooks = [mainBook];
            }
        } else {
            throw new Error('No book ID or title specified in the URL.');
        }

        this.currentBook = mainBook;
        
        // Group books by condition
        this.booksByCondition = this.groupBooksByCondition(allSimilarBooks, mainBook.title);
        
        this.renderBookDetailsWithConditions(this.currentBook, this.booksByCondition);
        await this.loadReviews(this.currentBook.bookID);
    }

    /**
     * Group books by condition for the same title
     */
    groupBooksByCondition(allBooks, targetTitle) {
        const matchingBooks = allBooks.filter(book => 
            book.title.toLowerCase() === targetTitle.toLowerCase() && 
            book.isAvailable !== false // Only include available books
        );

        const grouped = {};
        matchingBooks.forEach(book => {
            const condition = book.condition || 'Unknown';
            if (!grouped[condition]) {
                grouped[condition] = [];
            }
            grouped[condition].push(book);
        });

        return grouped;
    }

    //Show loading state
    showLoading() {
        if (this.productDetailContainer) {
            this.productDetailContainer.innerHTML = '<p class="text-center">Loading book details...</p>';
        }
    }

    //Show error message

    showError(message) {
        if (this.productDetailContainer) {
            this.productDetailContainer.innerHTML = `<div class="alert alert-danger text-center">${message}</div>`;
        }
    }

    //Render book details HTML with conditions

    renderBookDetailsWithConditions(book, booksByCondition) {
        const imageUrl = `http://localhost:8081/api/book/image/${book.bookID}`;
        const uploadedDate = new Date(book.uploadedDate).toLocaleDateString();

        // Generate condition options HTML
        const conditionsHtml = this.generateConditionsHtml(booksByCondition);

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
                    <div class="mb-2">
                        <span class="text-muted small" id="bookPublisher">${book.publisher || 'Unknown Publisher'}</span>
                        ${book.isbn ? `<br><span class="text-muted small" id="bookIsbn">ISBN: ${book.isbn}</span>` : ''}
                        <br><span class="text-muted small">${book.publicationYear || 'Unknown Year'}</span>
                    </div>

                    <div class="mb-4">
                        <h5 class="fw-bold">Description</h5>
                        <p id="bookDescription">${book.description || 'No description provided.'}</p>
                    </div>

                    <!-- Condition Selection Section -->
                    <div class="condition-selection-container mb-4">
                        ${conditionsHtml}
                    </div>

                    <div class="book-meta border-top pt-3 mb-4">
                        <p class="mb-1"><strong class="me-2">Date Listed:</strong><span id="bookUploadedDate">${uploadedDate}</span></p>
                    </div>
                </div>
            </div>
        `;

        this.productDetailContainer.innerHTML = bookDetailsHtml;
        this.setupConditionHandlers(booksByCondition);
    }

    /**
     * Setup event handlers for condition-based selection
     */
    setupConditionHandlers(booksByCondition) {
        // Store reference to grouped books for use in handleAddToCart
        this.groupedBooks = booksByCondition;

        // Add event listeners for "Add Cheapest" buttons
        document.querySelectorAll('.add-cheapest-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const condition = e.target.dataset.condition;
                const price = parseFloat(e.target.dataset.price);
                
                // Find the cheapest book in this condition
                const booksInCondition = booksByCondition[condition];
                const selectedBook = booksInCondition.find(book => book.price === price) || booksInCondition[0];
                
                if (selectedBook) {
                    await this.handleAddToCart(selectedBook.bookID, condition);
                }
            });
        });

        // Add event listeners for "View Options" buttons
        document.querySelectorAll('.view-sellers-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const condition = e.target.dataset.condition;
                this.showSellerOptionsModal(condition, booksByCondition[condition]);
            });
        });

        // Add hover effects for condition options
        document.querySelectorAll('.condition-option').forEach(option => {
            option.addEventListener('mouseenter', (e) => {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.cursor = 'pointer';
            });
            
            option.addEventListener('mouseleave', (e) => {
                e.target.style.backgroundColor = '';
            });
        });
    }

    /**
     * Generate HTML for condition options
     */
    generateConditionsHtml(booksByCondition) {
        if (!booksByCondition || Object.keys(booksByCondition).length === 0) {
            return '<p class="text-muted">No available copies found.</p>';
        }

        // Define condition order and details
        const conditionOrder = ['EXCELLENT', 'GOOD', 'AVERAGE', 'ACCEPTABLE', 'FAIR'];
        const conditionDetails = {
            'EXCELLENT': {
                description: 'This textbook has no torn or missing pages, has no writing or highlighting. It\'s like new.',
                color: 'success'
            },
            'GOOD': {
                description: 'This textbook has minor wear but no missing pages. May have minimal writing or highlighting.',
                color: 'info'
            },
            'AVERAGE': {
                description: 'This textbook has no large tears or any missing pages. It may contain very little writing or highlighting. Used once or twice.',
                color: 'warning'
            },
            'ACCEPTABLE': {
                description: 'This textbook has no missing pages and may have considerable writing or highlighting but the text must not be obscured. This textbook has been around.',
                color: 'secondary'
            },
            'FAIR': {
                description: 'This textbook shows significant wear and may have torn pages or other damage.',
                color: 'danger'
            }
        };

        let html = '<h5 class="fw-bold mb-3">Available Conditions</h5>';

        // Sort conditions by the defined order
        const sortedConditions = Object.keys(booksByCondition).sort((a, b) => {
            const indexA = conditionOrder.indexOf(a.toUpperCase());
            const indexB = conditionOrder.indexOf(b.toUpperCase());
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        sortedConditions.forEach(condition => {
            const books = booksByCondition[condition];
            const quantity = books.length;
            const prices = books.map(book => book.price).sort((a, b) => a - b);
            const lowestPrice = prices[0];
            const highestPrice = prices[prices.length - 1];
            const conditionKey = condition.toUpperCase();
            const details = conditionDetails[conditionKey] || conditionDetails['FAIR'];

            // Determine price display
            let priceDisplay;
            if (prices.length === 1) {
                priceDisplay = `R${lowestPrice.toFixed(2)}`;
            } else if (lowestPrice === highestPrice) {
                priceDisplay = `R${lowestPrice.toFixed(2)}`;
            } else {
                priceDisplay = `R${lowestPrice.toFixed(2)} - R${highestPrice.toFixed(2)}`;
            }

            html += `
                <div class="condition-option border rounded mb-3 p-3" data-condition="${condition}">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <h6 class="fw-bold text-${details.color} mb-1">${condition}</h6>
                            <small class="text-muted">${quantity} Available from ${books.length > 1 ? books.length + ' sellers' : '1 seller'}</small>
                        </div>
                        <div class="col-md-4">
                            <span class="h5 fw-bold text-purple">${priceDisplay}</span>
                            ${prices.length > 1 ? '<br><small class="text-muted">Multiple prices available</small>' : ''}
                        </div>
                        <div class="col-md-5">
                            <div class="d-flex gap-2 align-items-center">
                                <button class="btn btn-purple btn-sm view-sellers-btn" 
                                        data-condition="${condition}">
                                    <i class="bi bi-eye me-1"></i> VIEW OPTIONS
                                </button>
                                <button class="btn btn-outline-secondary btn-sm add-cheapest-btn" 
                                        data-condition="${condition}" 
                                        data-price="${lowestPrice}"
                                        title="Add cheapest option to cart">
                                    <i class="bi bi-cart-plus me-1"></i> CHEAPEST
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="condition-description mt-2">
                        <small class="text-muted">${details.description}</small>
                    </div>
                </div>
            `;
        });

        return html;
    }

    //Render book details HTML (original function kept for compatibility)
    renderBookDetails(book) {
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

        this.productDetailContainer.innerHTML = bookDetailsHtml;
        this.setupAddToCartHandler(book);
    }

    //Setup add to cart button handler
    setupAddToCartHandler(book) {
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', async () => {
                await this.handleAddToCart(book);
            });
        }
    }

    //Handle add to cart functionality
    async handleAddToCart(bookId, condition = null) {
        const userId = localStorage.getItem('booklifyUserId');
        
        if (!userId) {
            alert('You must be logged in to add items to your cart.');
            window.location.href = 'login.html';
            return;
        }

        // Find the specific book to add
        let bookToAdd;
        if (condition && this.groupedBooks) {
            // For condition-based selection, find the first available book of that condition
            const conditionBooks = this.groupedBooks[condition];
            bookToAdd = conditionBooks && conditionBooks.length > 0 ? conditionBooks[0] : null;
        } else {
            // For regular selection, use the provided bookId
            bookToAdd = this.currentBook || { bookID: bookId };
        }

        if (!bookToAdd) {
            alert('Selected book is not available.');
            return;
        }

        console.log('Adding book to cart:', bookToAdd);

        try {
            let cart = await CartService.getCartByUserId(userId);

            if (!cart) {
                cart = await CartService.createCart(userId);
            }

            const existingItem = cart.cartItems?.find(item => item.book.bookID === bookToAdd.bookID);

            if (existingItem) {
                await CartService.updateCartItemsQuantity(cart.cartId, bookToAdd.bookID, existingItem.quantity + 1);
            } else {
                if (!cart.cartItems) {
                    cart.cartItems = [];
                }
                cart.cartItems.push({ book: { bookID: bookToAdd.bookID }, quantity: 1 });
                await CartService.updateCart(cart);
            }

            // Show Bootstrap toast
            const toastEl = document.getElementById('cartToast');
            if (toastEl) {
                const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
                toast.show();
            }

            // Refresh cart badge in navbar
            if (window.NavbarComponent) {
                window.NavbarComponent.refreshCartBadge();
            }

            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1500);

        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add to cart: ' + error.message);
        }
    }

    //Show seller options modal
    showSellerOptionsModal(condition, books) {
        const modalElement = document.getElementById('sellerOptionsModal');
        const modalTitle = document.getElementById('sellerOptionsModalLabel');
        const modalContent = document.getElementById('sellerOptionsContent');

        if (!modalElement || !modalTitle || !modalContent) {
            console.error('Modal elements not found');
            return;
        }

        // Update modal title
        modalTitle.textContent = `${condition} Condition - Available Sellers`;

        // Sort books by price (lowest first)
        const sortedBooks = books.sort((a, b) => a.price - b.price);

        // Generate seller options HTML
        let sellersHtml = `
            <div class="mb-3">
                <p class="text-muted mb-3">Choose from ${books.length} seller${books.length > 1 ? 's' : ''} offering this book in ${condition} condition:</p>
            </div>
        `;

        sortedBooks.forEach((book, index) => {
            const isLowestPrice = index === 0;
            const uploadDate = new Date(book.uploadedDate).toLocaleDateString();

            sellersHtml += `
                <div class="seller-option border rounded mb-3 p-3 ${isLowestPrice ? 'border-success' : ''}">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            ${isLowestPrice ? '<span class="badge bg-success mb-2">Best Price</span><br>' : ''}
                            <small class="text-muted">Seller #${book.userID || 'Unknown'}</small>
                        </div>
                        <div class="col-md-3">
                            <h5 class="fw-bold text-purple mb-1">R${book.price.toFixed(2)}</h5>
                            <small class="text-muted">Listed: ${uploadDate}</small>
                        </div>
                        <div class="col-md-4">
                            <p class="mb-1 small">${book.description ? book.description.substring(0, 80) + (book.description.length > 80 ? '...' : '') : 'No additional description'}</p>
                        </div>
                        <div class="col-md-3">
                            <button class="btn ${isLowestPrice ? 'btn-success' : 'btn-purple'} btn-sm w-100 select-seller-btn" 
                                    data-book-id="${book.bookID}" 
                                    data-condition="${condition}"
                                    data-price="${book.price}">
                                <i class="bi bi-cart-plus me-1"></i> 
                                ${isLowestPrice ? 'ADD CHEAPEST' : 'ADD TO CART'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        modalContent.innerHTML = sellersHtml;

        // Add event listeners to seller selection buttons
        modalContent.querySelectorAll('.select-seller-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const bookId = e.target.dataset.bookId;
                const condition = e.target.dataset.condition;
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }

                // Add selected book to cart
                await this.handleAddToCart(bookId, condition);
            });
        });

        // Show modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    //Load and display reviews for the book
    async loadReviews(bookId, tempReviews = []) {
        const reviewsSummary = document.querySelector('.reviews-summary');
        if (!reviewsSummary) return;

        let reviewsCenter = reviewsSummary.querySelector('#reviewsList');

        if (!reviewsCenter) {
            reviewsCenter = document.createElement('div');
            reviewsCenter.id = 'reviewsList';
            reviewsCenter.className = 'reviews-list d-flex flex-column align-items-center w-100';
            
            const summaryContent = reviewsSummary.querySelector('.reviews-summary-content');
            if (summaryContent) {
                summaryContent.appendChild(reviewsCenter);
            } else {
                reviewsSummary.appendChild(reviewsCenter);
            }
        }

        reviewsCenter.innerHTML = '';

        try {
            const reviews = await this.fetchReviews(bookId);
            const allReviews = [...tempReviews, ...reviews];

            if (!allReviews.length) {
                this.renderEmptyReviews(reviewsCenter, bookId);
                return;
            }

            this.renderReviewsSummary(reviewsCenter, allReviews);
            this.renderReviewsList(reviewsCenter, allReviews, bookId);

        } catch (error) {
            console.error('Failed to load reviews:', error);
            reviewsCenter.innerHTML = `<p class="text-danger text-center w-100">Unable to load reviews.</p>`;
        }
    }

    //Fetch reviews from the backend
    async fetchReviews(bookId) {
        const response = await fetch(`http://localhost:8081/reviews/book/${bookId}`);

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            throw new Error(`Failed to load reviews (${response.status})`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : (data ? [data] : []);
    }

    //Render empty reviews state
    renderEmptyReviews(container, bookId) {
        container.innerHTML = `<p class="text-muted text-center w-100">No reviews yet.</p>`;
    }

    //Render reviews summary with average rating
    renderReviewsSummary(container, reviews) {
        const avg = reviews.reduce((sum, r) => sum + (Number(r.reviewRating) || 0), 0) / reviews.length;
        const rounded = Math.round(avg);
        const fullStars = '★'.repeat(Math.max(0, Math.min(5, rounded)));
        const emptyStars = '☆'.repeat(5 - Math.max(0, Math.min(5, rounded)));

        const avgDiv = document.createElement('div');
        avgDiv.className = 'avg-rating-display mb-3 text-center w-100';
        avgDiv.innerHTML = `
            <div class="fw-bold">Average Rating:</div>
            <div class="text-success fs-5">${fullStars + emptyStars} (${reviews.length} review${reviews.length > 1 ? 's' : ''})</div>
        `;
        container.appendChild(avgDiv);
    }

    //Render individual reviews list
    renderReviewsList(container, reviews, bookId) {
        const list = document.createElement('div');
        list.className = 'reviews-list-items d-flex flex-column align-items-center w-100';

        // Show only top 4 reviews
        const topReviews = reviews.slice(0, 4);
        
        topReviews.forEach(review => {
            const reviewElement = this.createReviewElement(review, bookId);
            list.appendChild(reviewElement);
        });

        // Add "View All Reviews" button if there are more than 4 reviews
        if (reviews.length > 4) {
            const viewAllBtn = document.createElement('button');
            viewAllBtn.className = 'btn btn-outline-primary mt-3';
            viewAllBtn.textContent = `View All ${reviews.length} Reviews`;
            viewAllBtn.onclick = () => this.showAllReviewsModal(reviews, bookId);
            list.appendChild(viewAllBtn);
        }

        container.appendChild(list);
    }

    //Create individual review element
    createReviewElement(review, bookId) {
        const rating = Number(review.reviewRating) || 0;
        const reviewerName = review.tempName || review.user?.name || 'Anonymous';
        const currentUserId = parseInt(localStorage.getItem('booklifyUserId'));
        const isOwner = review.user?.id === currentUserId || review.tempUserId === currentUserId;

        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-card';

        let actionButtons = '';
        if (isOwner) {
            actionButtons = `
            <div class="review-actions">
                <button class="btn btn-sm btn-outline-primary edit-review-btn" data-review-id="${review.reviewId || review.reviewID}">Edit</button>
                <button class="btn btn-sm btn-outline-danger delete-review-btn" data-review-id="${review.reviewId || review.reviewID}">Delete</button>
            </div>
        `;
        }

        reviewItem.innerHTML = `
        <div class="review-header">
            <div class="review-meta">
                <div class="stars text-warning">
                    ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                </div>
                <span class="fw-semibold">${reviewerName}</span>
            </div>
            ${actionButtons}
        </div>
        <p class="review-text">${this.escapeHtml(review.reviewComment)}</p>
    `;

        // Setup event listeners for edit/delete buttons
        this.setupReviewActionButtons(reviewItem, review, bookId);

        return reviewItem;
    }


    //Setup event listeners for review action buttons
    setupReviewActionButtons(reviewItem, review, bookId) {
        const editBtn = reviewItem.querySelector('.edit-review-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.showReviewModal(bookId, review);
            });
        }

        const deleteBtn = reviewItem.querySelector('.delete-review-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                await this.handleDeleteReview(review, reviewItem);
            });
        }
    }

    //Handle review deletion
    async handleDeleteReview(review, reviewElement) {
        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const token = localStorage.getItem('booklifyToken');
            const reviewId = review.reviewId || review.reviewID;
            const response = await fetch(`http://localhost:8081/reviews/delete/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to delete review (${response.status})`);
            }

            // Remove from DOM
            reviewElement.remove();

            // Reload reviews to update average rating
            await this.loadReviews(this.currentBook.bookID);

            alert('Review deleted successfully!');

        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('Failed to delete review: ' + error.message);
        }
    }

    //Escape HTML to prevent XSS
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[s]));
    }


    //Show review modal for creating or editing reviews
    showReviewModal(bookId, review = null) {
        let modal = document.getElementById('reviewModal');

        if (!modal) {
            modal = this.createReviewModal();
            document.body.appendChild(modal);
        }

        this.setupReviewModal(modal, bookId, review);
        new bootstrap.Modal(modal).show();
    }

    //Create the review modal HTML structure
    createReviewModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = 'reviewModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="reviewModalTitle">Write a Review</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="reviewForm">
                            <div class="mb-3">
                                <label for="reviewerName" class="form-label">Your Name</label>
                                <input type="text" class="form-control" id="reviewerName" placeholder="Enter your name">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Rating</label>
                                <select class="form-select" id="reviewRating" required>
                                    <option value="" disabled>Select rating</option>
                                    <option value="5">5 - Excellent</option>
                                    <option value="4">4 - Good</option>
                                    <option value="3">3 - Average</option>
                                    <option value="2">2 - Poor</option>
                                    <option value="1">1 - Terrible</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Comment</label>
                                <textarea class="form-control" id="reviewComment" rows="3" placeholder="Write your review here..." required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" id="reviewSubmitBtn">Submit Review</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    //Setup review modal with data and event handlers

    setupReviewModal(modal, bookId, review) {
        const form = modal.querySelector('#reviewForm');
        const title = modal.querySelector('#reviewModalTitle');
        const submitBtn = modal.querySelector('#reviewSubmitBtn');
        const reviewerInput = modal.querySelector('#reviewerName');
        const ratingInput = modal.querySelector('#reviewRating');
        const commentInput = modal.querySelector('#reviewComment');

        // Update modal title and button text
        const isEditing = review && (review.reviewId || review.reviewID);
        title.textContent = isEditing ? 'Edit Review' : 'Write a Review';
        submitBtn.textContent = isEditing ? 'Update Review' : 'Submit Review';

        // Prefill form if editing
        if (isEditing) {
            reviewerInput.value = review.tempName || review.user?.name || '';
            ratingInput.value = review.reviewRating;
            commentInput.value = review.reviewComment;
        } else {
            form.reset();
        }

        // Setup form submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.handleReviewSubmission(form, bookId, review);
        };
    }

    //Handle review form submission

    async handleReviewSubmission(form, bookId, review) {
        const userId = localStorage.getItem('booklifyUserId');
        if (!userId) {
            this.showNotification('Please log in to submit a review.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        const formData = this.getReviewFormData(form);
        if (!this.validateReviewForm(formData)) {
            return;
        }

        const reviewData = {
            reviewRating: formData.rating,
            reviewComment: formData.comment,
            user: { id: parseInt(userId) },
            book: { bookID: parseInt(bookId) }
        };

        try {
            await this.submitReview(reviewData, review);
            this.closeReviewModal();
            this.showNotification('Review submitted successfully!', 'success');
            await this.loadReviews(this.currentBook.bookID);
        } catch (error) {
            console.error('Failed to submit review:', error);
            this.showNotification('Failed to submit review: ' + error.message, 'error');
        }
    }

    //Get form data from review form
    getReviewFormData(form) {
        return {
            name: form.querySelector('#reviewerName').value.trim() || 'Anonymous',
            rating: parseInt(form.querySelector('#reviewRating').value),
            comment: form.querySelector('#reviewComment').value.trim()
        };
    }

    //Validate review form data
    validateReviewForm(formData) {
        if (!formData.comment || !formData.rating) {
            this.showNotification('Please fill in all required fields.', 'error');
            return false;
        }
        return true;
    }

    //Submit review to backend
    async submitReview(reviewData, existingReview) {
        const isEditing = existingReview && (existingReview.reviewId || existingReview.reviewID);
        const reviewId = existingReview?.reviewId || existingReview?.reviewID;
        const url = isEditing
            ? `http://localhost:8081/reviews/update/${reviewId}`
            : 'http://localhost:8081/reviews/create';
        const method = isEditing ? 'PUT' : 'POST';

        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to ${isEditing ? 'update' : 'create'} review`);
        }

        return response;
    }

    //Show all reviews in a modal
    showAllReviewsModal(reviews, bookId) {
        let modal = document.getElementById('allReviewsModal');

        if (!modal) {
            modal = this.createAllReviewsModal();
            document.body.appendChild(modal);
        }

        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '';

        reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review, bookId);
            modalBody.appendChild(reviewElement);
        });

        new bootstrap.Modal(modal).show();
    }

    //Create the all reviews modal HTML structure
    createAllReviewsModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = 'allReviewsModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">All Reviews</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                        <!-- Reviews will be populated here -->
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    //Close review modal
    closeReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }

    //Show notification toast
    showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.getElementById('notificationToast');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification toast
        const toast = document.createElement('div');
        toast.id = 'notificationToast';
        toast.className = 'toast position-fixed';
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 1055; min-width: 300px;';
        
        const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
        
        toast.innerHTML = `
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">
                    ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'} 
                    ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}
                </strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        document.body.appendChild(toast);
        
        // Show the toast
        const bsToast = new bootstrap.Toast(toast, {
            delay: type === 'error' ? 5000 : 3000
        });
        bsToast.show();
        
        // Clean up after toast is hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    //Setup global event listeners
    setupEventListeners() {
        // No global write review button handler needed anymore
    }
}

// Initialize the product detail controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductDetailController();
});

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
     * Load book details from URL parameter
     */
    async loadBookDetails() {
        this.showLoading();

        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');

        if (!bookId) {
            throw new Error('No book ID specified in the URL.');
        }

        const response = await fetch(`http://localhost:8081/api/book/read/${bookId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch book details');
        }

        this.currentBook = await response.json();
        this.renderBookDetails(this.currentBook);
        await this.loadReviews(this.currentBook.bookID);
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

    //Render book details HTML

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
    async handleAddToCart(book) {
        console.log('Adding book to cart:', book);
        const userId = localStorage.getItem('booklifyUserId');
        console.log('User ID:', userId);

        if (!userId) {
            alert('You must be logged in to add items to your cart.');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('Fetching existing cart for user:', userId);
            let cart = await CartService.getCartByUserId(userId);
            console.log('Existing cart:', cart);

            if (!cart) {
                console.log('No existing cart, creating new one');
                cart = await CartService.createCart(userId);
                console.log('Created cart:', cart);
            }

            const existingItem = cart.cartItems?.find(item => item.book.bookID === book.bookID);
            console.log('Existing item:', existingItem);

            if (existingItem) {
                console.log('Updating existing item quantity');
                await CartService.updateCartItemsQuantity(cart.cartId, book.bookID, existingItem.quantity + 1);
            } else {
                console.log('Adding new item to cart');
                if (!cart.cartItems) {
                    cart.cartItems = [];
                }
                cart.cartItems.push({ book: { bookID: book.bookID }, quantity: 1 });
                console.log('Updated cart before sending:', cart);
                await CartService.updateCart(cart);
            }

           // Show Bootstrap toast instead of alert
   const toastEl = document.getElementById('cartToast');
const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
toast.show();


            // Refresh cart badge in navbar
            if (window.NavbarComponent) {
                window.NavbarComponent.refreshCartBadge();
            }
setTimeout(() => {
    window.location.href = 'cart.html';
}, 1500); // 1.5 seconds delay

        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add to cart: ' + error.message);
        }
    }

    //Load and display reviews for the book
    async loadReviews(bookId, tempReviews = []) {
        const reviewsSummary = document.querySelector('.reviews-summary');
        if (!reviewsSummary) return;

        const writeBtn = document.getElementById('writeReviewBtn');
        let reviewsCenter = reviewsSummary.querySelector('#reviewsList');

        if (!reviewsCenter) {
            reviewsCenter = document.createElement('div');
            reviewsCenter.id = 'reviewsList';
            reviewsCenter.className = 'reviews-list d-flex flex-column align-items-center w-100';

            if (writeBtn && writeBtn.parentNode) {
                writeBtn.parentNode.insertAdjacentElement('afterend', reviewsCenter);
            } else {
                reviewsSummary.appendChild(reviewsCenter);
            }
        }

        reviewsCenter.innerHTML = '';

        try {
            const reviews = await this.fetchReviews(bookId);
            const allReviews = [...tempReviews, ...reviews];

            if (!allReviews.length) {
                this.renderEmptyReviews(reviewsCenter, writeBtn, bookId);
                return;
            }

            this.renderReviewsSummary(reviewsCenter, allReviews);
            this.renderReviewsList(reviewsCenter, allReviews, bookId);

        } catch (error) {
            console.error('Failed to load reviews:', error);
            reviewsCenter.innerHTML = `<p class="text-danger text-center w-100">Unable to load reviews.</p>`;
        } finally {
            if (writeBtn) {
                writeBtn.onclick = () => this.showReviewModal(bookId);
            }
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
    renderEmptyReviews(container, writeBtn, bookId) {
        container.innerHTML = `<p class="text-muted text-center w-100">No reviews yet. Why not leave one!</p>`;
        if (writeBtn) {
            writeBtn.onclick = () => this.showReviewModal(bookId);
        }
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

        reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review, bookId);
            list.appendChild(reviewElement);
        });

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
            alert('Please log in to submit a review.');
            window.location.href = 'login.html';
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
            await this.loadReviews(this.currentBook.bookID);
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review: ' + error.message);
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
            alert('Please fill in all fields.');
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

    //Setup global event listeners
    setupEventListeners() {
        // Global write review button handler (fallback)
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.id === 'writeReviewBtn' || e.target.classList.contains('btn-write-review'))) {
                const urlParams = new URLSearchParams(window.location.search);
                const bookId = urlParams.get('id');
                if (bookId) {
                    this.showReviewModal(bookId);
                }
            }
        });
    }
}

// Initialize the product detail controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductDetailController();
});

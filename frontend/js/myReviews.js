// My Reviews Page - User-specific review management
class MyReviewsController {
    constructor() {
        this.currentUserId = null;
        this.allReviews = [];
        this.filteredReviews = [];
        this.init();
    }

    async init() {
        // Check authentication
        const isLoggedIn = localStorage.getItem('booklifyLoggedIn');
        const userId = localStorage.getItem('booklifyUserId');
        
        if (!isLoggedIn || !userId) {
            this.showNotification('Please log in to view your reviews.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        this.currentUserId = parseInt(userId);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load user reviews
        await this.loadMyReviews();
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('ratingFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('bookFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchReviews').addEventListener('input', () => this.applyFilters());
    }

    async loadMyReviews() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const reviewsContainer = document.getElementById('myReviewsContainer');
        const noReviewsMessage = document.getElementById('noReviewsMessage');
        
        loadingSpinner.style.display = 'block';
        reviewsContainer.style.display = 'none';
        noReviewsMessage.style.display = 'none';

        try {
            // Fetch user's reviews from the API
            const response = await fetch(`http://localhost:8081/reviews/user/${this.currentUserId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('booklifyToken')}`
                }
            });

            if (response.ok) {
                this.allReviews = await response.json();
                this.filteredReviews = [...this.allReviews];
            } else if (response.status === 404) {
                this.allReviews = [];
                this.filteredReviews = [];
            } else {
                throw new Error('Failed to fetch reviews');
            }

            // Load books for filter dropdown
            await this.loadBooksFilter();
            
            // Update stats
            this.updateStats();
            
            // Render reviews
            this.renderReviews();

        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showNotification('Failed to load reviews. Please try again.', 'error');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    async loadBooksFilter() {
        const bookFilter = document.getElementById('bookFilter');
        
        // Get unique books from reviews
        const uniqueBooks = [];
        const bookIds = new Set();
        
        this.allReviews.forEach(review => {
            if (review.book && !bookIds.has(review.book.bookID)) {
                uniqueBooks.push(review.book);
                bookIds.add(review.book.bookID);
            }
        });

        // Clear and populate book filter
        bookFilter.innerHTML = '<option value="">All Books</option>';
        uniqueBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.bookID;
            option.textContent = book.title;
            bookFilter.appendChild(option);
        });
    }

    updateStats() {
        const totalReviews = this.allReviews.length;
        const averageRating = totalReviews > 0 
            ? (this.allReviews.reduce((sum, review) => sum + review.reviewRating, 0) / totalReviews).toFixed(1)
            : '0.0';
        const booksReviewed = new Set(this.allReviews.map(review => review.book?.bookID)).size;

        document.getElementById('myTotalReviews').textContent = totalReviews;
        document.getElementById('myAverageRating').textContent = averageRating;
        document.getElementById('myBooksReviewed').textContent = booksReviewed;
    }

    applyFilters() {
        const ratingFilter = document.getElementById('ratingFilter').value;
        const bookFilter = document.getElementById('bookFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchFilter = document.getElementById('searchReviews').value.toLowerCase();

        this.filteredReviews = this.allReviews.filter(review => {
            // Rating filter
            if (ratingFilter && review.reviewRating !== parseInt(ratingFilter)) {
                return false;
            }

            // Book filter
            if (bookFilter && review.book?.bookID !== parseInt(bookFilter)) {
                return false;
            }

            // Date filter
            if (dateFilter) {
                const reviewDate = new Date(review.reviewDate);
                const now = new Date();
                const daysDiff = (now - reviewDate) / (1000 * 60 * 60 * 24);

                switch (dateFilter) {
                    case 'week':
                        if (daysDiff > 7) return false;
                        break;
                    case 'month':
                        if (daysDiff > 30) return false;
                        break;
                    case 'year':
                        if (daysDiff > 365) return false;
                        break;
                }
            }

            // Search filter
            if (searchFilter) {
                const searchText = (
                    review.reviewComment + ' ' +
                    (review.book?.title || '') + ' ' +
                    (review.book?.author || '')
                ).toLowerCase();
                
                if (!searchText.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        });

        this.renderReviews();
    }

    renderReviews() {
        const reviewsContainer = document.getElementById('myReviewsContainer');
        const noReviewsMessage = document.getElementById('noReviewsMessage');

        if (this.filteredReviews.length === 0) {
            reviewsContainer.style.display = 'none';
            noReviewsMessage.style.display = 'block';
            return;
        }

        reviewsContainer.style.display = 'block';
        noReviewsMessage.style.display = 'none';
        reviewsContainer.innerHTML = '';

        this.filteredReviews.forEach(review => {
            const reviewCard = this.createReviewCard(review);
            reviewsContainer.appendChild(reviewCard);
        });
    }

    createReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'card border-0 shadow-sm mb-4';
        
        const stars = '★'.repeat(review.reviewRating) + '☆'.repeat(5 - review.reviewRating);
        const reviewDate = review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : 'Unknown date';
        
        card.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-2 text-center mb-3 mb-md-0">
                        <img src="../assets/images/logo.png" alt="Book Cover" class="img-fluid rounded" style="max-height: 120px; max-width: 80px;">
                    </div>
                    <div class="col-md-10">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">${review.book?.title || 'Unknown Book'}</h5>
                                <p class="text-muted mb-1">${review.book?.author || 'Unknown Author'}</p>
                                <div class="text-warning mb-2">
                                    <span style="font-size: 1.2rem;">${stars}</span>
                                    <span class="text-muted ms-2">${review.reviewRating}/5</span>
                                </div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="myReviewsController.editReview(${review.reviewID || review.reviewId})">
                                        <i class="bi bi-pencil me-2"></i>Edit Review
                                    </a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="myReviewsController.deleteReview(${review.reviewID || review.reviewId})">
                                        <i class="bi bi-trash me-2"></i>Delete Review
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="product-detail.html?id=${review.book?.bookID}">
                                        <i class="bi bi-book me-2"></i>View Book
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                        <p class="mb-2">${this.escapeHtml(review.reviewComment)}</p>
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>Reviewed on ${reviewDate}
                        </small>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    editReview(reviewId) {
        const review = this.allReviews.find(r => (r.reviewID || r.reviewId) === reviewId);
        if (!review) {
            this.showNotification('Review not found.', 'error');
            return;
        }

        // Populate edit modal
        document.getElementById('editReviewId').value = reviewId;
        document.getElementById('editBookId').value = review.book?.bookID || '';
        document.getElementById('editRating').value = review.reviewRating;
        document.getElementById('editComment').value = review.reviewComment;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editReviewModal'));
        modal.show();
    }

    async deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/reviews/delete/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('booklifyToken')}`
                }
            });

            if (response.ok) {
                this.showNotification('Review deleted successfully!', 'success');
                await this.loadMyReviews(); // Reload reviews
            } else {
                throw new Error('Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            this.showNotification('Failed to delete review. Please try again.', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
}

// Global function to update review (called from modal)
async function updateReview() {
    const reviewId = document.getElementById('editReviewId').value;
    const bookId = document.getElementById('editBookId').value;
    const rating = document.getElementById('editRating').value;
    const comment = document.getElementById('editComment').value.trim();

    if (!rating || !comment) {
        myReviewsController.showNotification('Please fill in all fields.', 'error');
        return;
    }

    try {
        const reviewData = {
            reviewRating: parseInt(rating),
            reviewComment: comment,
            reviewDate: new Date().toISOString().split('T')[0],
            user: { id: myReviewsController.currentUserId },
            book: { bookID: parseInt(bookId) }
        };

        const response = await fetch(`http://localhost:8081/reviews/update/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('booklifyToken')}`
            },
            body: JSON.stringify(reviewData)
        });

        if (response.ok) {
            myReviewsController.showNotification('Review updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editReviewModal'));
            modal.hide();
            
            // Reload reviews
            await myReviewsController.loadMyReviews();
        } else {
            throw new Error('Failed to update review');
        }
    } catch (error) {
        console.error('Error updating review:', error);
        myReviewsController.showNotification('Failed to update review. Please try again.', 'error');
    }
}

// Initialize the controller when page loads
let myReviewsController;
document.addEventListener('DOMContentLoaded', () => {
    myReviewsController = new MyReviewsController();
});
// Reviews Page JavaScript for Booklify
class ReviewsPage {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.userReviews = [];
        this.filteredReviews = [];
        this.init();
    }

    getCurrentUser() {
        const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
        return {
            id: localStorage.getItem('booklifyUserId'),
            email: localStorage.getItem('booklifyUserEmail'),
            fullName: userData.fullName,
            role: localStorage.getItem('booklifyUserRole')
        };
    }

    async init() {
        // Check if user is logged in
        if (!this.currentUser.id) {
            window.location.href = 'login.html';
            return;
        }

        // Load user reviews
        await this.loadUserReviews();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update stats
        this.updateStats();
        
        // Render reviews
        this.renderReviews();
    }

    async loadUserReviews() {
        try {
            this.showLoading(true);
            this.userReviews = await ReviewService.getReviewsByUser(this.currentUser.id);
            this.filteredReviews = [...this.userReviews];
        } catch (error) {
            console.error('Failed to load user reviews:', error);
            this.userReviews = [];
            this.filteredReviews = [];
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Review type filter
        const reviewTypeFilter = document.getElementById('reviewTypeFilter');
        if (reviewTypeFilter) {
            reviewTypeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Rating filter
        const ratingFilter = document.getElementById('ratingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', () => this.applyFilters());
        }

        // Search filter
        const searchInput = document.getElementById('searchReviews');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }

    applyFilters() {
        const reviewType = document.getElementById('reviewTypeFilter').value;
        const rating = document.getElementById('ratingFilter').value;
        const search = document.getElementById('searchReviews').value.toLowerCase();

        this.filteredReviews = this.userReviews.filter(review => {
            // Review type filter
            if (reviewType && review.reviewType !== reviewType) {
                return false;
            }

            // Rating filter
            if (rating && review.rating < parseInt(rating)) {
                return false;
            }

            // Search filter
            if (search) {
                const searchText = `${review.comment} ${review.bookTitle || ''}`.toLowerCase();
                if (!searchText.includes(search)) {
                    return false;
                }
            }

            return true;
        });

        this.renderReviews();
    }

    updateStats() {
        const totalReviews = this.userReviews.length;
        const averageRating = ReviewService.calculateAverageRating(this.userReviews);
        const uniqueBooks = new Set(this.userReviews.map(r => r.bookId)).size;

        document.getElementById('totalReviews').textContent = totalReviews;
        document.getElementById('averageRating').textContent = averageRating.toFixed(1);
        document.getElementById('booksReviewed').textContent = uniqueBooks;
    }

    renderReviews() {
        const container = document.getElementById('reviewsContainer');
        const noReviewsMessage = document.getElementById('noReviewsMessage');

        if (!container) return;

        if (this.filteredReviews.length === 0) {
            container.innerHTML = '';
            if (this.userReviews.length === 0) {
                noReviewsMessage.style.display = 'block';
            } else {
                noReviewsMessage.style.display = 'none';
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                        <h5 class="text-muted mt-3">No reviews match your filters</h5>
                        <p class="text-muted">Try adjusting your search criteria</p>
                    </div>
                `;
            }
            return;
        }

        noReviewsMessage.style.display = 'none';

        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white">
                    <h6 class="mb-0">Showing ${this.filteredReviews.length} of ${this.userReviews.length} reviews</h6>
                </div>
                <div class="card-body p-0">
                    ${this.filteredReviews.map(review => this.renderReviewItem(review)).join('')}
                </div>
            </div>
        `;

        // Re-attach event listeners for edit/delete buttons
        this.attachReviewEventListeners();
    }

    renderReviewItem(review) {
        const userType = review.userType === 'seller' ? 'Seller' : 'Buyer';
        const reviewType = review.reviewType === 'pre-listing' ? 'Pre-listing Review' : 'Purchase Review';
        const userTypeColor = review.userType === 'seller' ? 'success' : 'primary';
        
        return `
            <div class="review-item border-bottom p-4" data-review-id="${review.id}">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex align-items-start mb-2">
                            <div class="me-3">
                                <span class="badge bg-${userTypeColor} me-2">${userType}</span>
                                <span class="badge bg-secondary">${reviewType}</span>
                            </div>
                            <div class="rating-display">
                                ${ReviewService.renderStars(review.rating)}
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mb-2">${review.bookTitle || 'Book Title'}</h6>
                        <p class="mb-2">${review.comment}</p>
                        
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>
                            Reviewed on ${new Date(review.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                    
                    <div class="col-md-4 text-md-end">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-primary mb-1" onclick="reviewsPage.editReview('${review.id}')">
                                <i class="bi bi-pencil me-1"></i>Edit
                            </button>
                            <button class="btn btn-outline-danger" onclick="reviewsPage.deleteReview('${review.id}')">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachReviewEventListeners() {
        // Event listeners are attached via onclick attributes in the rendered HTML
    }

    async editReview(reviewId) {
        try {
            const review = await ReviewService.getReviewById(reviewId);
            if (review) {
                this.showEditModal(review);
            }
        } catch (error) {
            console.error('Failed to load review for editing:', error);
            alert('Failed to load review for editing');
        }
    }

    showEditModal(review) {
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="editReviewModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Review</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editReviewForm">
                                <div class="mb-3">
                                    <label class="form-label">Rating</label>
                                    <div class="rating-input">
                                        ${this.renderRatingStars(review.rating, 'editRatingInput')}
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="editReviewComment" class="form-label">Comment</label>
                                    <textarea 
                                        class="form-control" 
                                        id="editReviewComment" 
                                        rows="3" 
                                        required
                                    >${review.comment}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="reviewsPage.updateReview('${review.id}')">Update Review</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('editReviewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editReviewModal'));
        modal.show();
    }

    renderRatingStars(rating, inputId) {
        let html = '<div class="d-flex gap-1">';
        for (let i = 1; i <= 5; i++) {
            html += `
                <i class="bi bi-star${i <= rating ? '-fill text-warning' : ' text-muted'} 
                   style="cursor: pointer; font-size: 1.5rem;" 
                   data-rating="${i}" 
                   onclick="this.parentElement.querySelectorAll('i').forEach((star, index) => { star.className = 'bi ' + (index < ${i} ? 'bi-star-fill text-warning' : 'bi-star text-muted'); }); document.getElementById('${inputId}').value = ${i};">
                </i>
            `;
        }
        html += `<input type="hidden" id="${inputId}" value="${rating}">`;
        html += '</div>';
        return html;
    }

    async updateReview(reviewId) {
        try {
            const rating = parseInt(document.getElementById('editRatingInput').value);
            const comment = document.getElementById('editReviewComment').value.trim();

            if (!rating || rating < 1 || rating > 5) {
                alert('Please select a valid rating (1-5 stars)');
                return;
            }

            if (!comment) {
                alert('Please write a comment for your review');
                return;
            }

            await ReviewService.updateReview(reviewId, { rating, comment });
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editReviewModal'));
            modal.hide();

            // Reload reviews
            await this.loadUserReviews();
            this.updateStats();
            this.renderReviews();

            alert('Review updated successfully!');
        } catch (error) {
            console.error('Failed to update review:', error);
            alert('Failed to update review. Please try again.');
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            await ReviewService.deleteReview(reviewId);
            
            // Reload reviews
            await this.loadUserReviews();
            this.updateStats();
            this.renderReviews();

            alert('Review deleted successfully!');
        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('Failed to delete review. Please try again.');
        }
    }

    showLoading(show) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }
}

// Initialize reviews page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reviewsPage = new ReviewsPage();
});

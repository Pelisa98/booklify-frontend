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
        const userRole = localStorage.getItem('booklifyUserRole');
        const userId = localStorage.getItem('booklifyUserId');
        const adminId = localStorage.getItem('booklifyAdminId');

        return {
            id: userRole === 'admin' ? adminId : userId,
            email: localStorage.getItem('booklifyUserEmail'),
            fullName: userData.fullName || userData.name,
            role: userRole
        };
    }

    async init() {
        // Check if user is logged in
        if (!this.currentUser.id) {
            window.location.href = 'login.html';
            return;
        }

        // Check if user is admin
        if (this.currentUser.role !== 'admin') {
            if (window.showToast) window.showToast('Access denied. This page is for administrators only.', 'danger'); else alert('Access denied. This page is for administrators only.');
            window.location.href = '../index.html';
            return;
        }

        // Load user reviews
        await this.loadUserReviews();

        // Setup event listeners
        this.setupEventListeners();

        // Populate filter dropdowns
        this.populateFilters();

        // Update stats
        this.updateStats();

        // Render reviews
        this.renderReviews();
    }

    async loadUserReviews() {
        try {
            this.showLoading(true);
            console.log('Loading all reviews for admin...');
            // For admin, load all reviews instead of just user's reviews
            this.userReviews = await ReviewService.getAllReviews();
            console.log('Reviews loaded:', this.userReviews);
            this.filteredReviews = [...this.userReviews];
        } catch (error) {
            console.error('Failed to load reviews:', error);
            this.userReviews = [];
            this.filteredReviews = [];
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Rating filter
        const ratingFilter = document.getElementById('ratingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', () => this.applyFilters());
        }

        // Book filter
        const bookFilter = document.getElementById('bookFilter');
        if (bookFilter) {
            bookFilter.addEventListener('change', () => this.applyFilters());
        }

        // User filter
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('change', () => this.applyFilters());
        }

        // Search filter
        const searchInput = document.getElementById('searchReviews');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }
    }

    applyFilters() {
        const rating = document.getElementById('ratingFilter').value;
        const bookFilter = document.getElementById('bookFilter').value;
        const userFilter = document.getElementById('userFilter').value;
        const search = document.getElementById('searchReviews').value.toLowerCase();

        this.filteredReviews = this.userReviews.filter(review => {
            // Rating filter
            if (rating && (review.reviewRating || review.rating) < parseInt(rating)) {
                return false;
            }

            // Book filter
            if (bookFilter && review.book && review.book.bookID != bookFilter) {
                return false;
            }

            // User filter
            if (userFilter && review.user && review.user.id != userFilter) {
                return false;
            }

            // Search filter
            if (search) {
                const searchText = `${review.reviewComment || review.comment} ${review.book?.title || ''} ${review.user?.fullName || ''}`.toLowerCase();
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
        const uniqueBooks = new Set(this.userReviews.map(r => r.book?.bookID || r.bookId)).size;

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
        const bookTitle = review.book?.title || 'Unknown Book';
        const userName = review.user?.fullName || 'Unknown User';
        const userEmail = review.user?.email || '';

        return `
            <div class="review-item border-bottom p-4" data-review-id="${review.reviewId || review.id}">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex align-items-start mb-2">
                            <div class="rating-display me-3">
                                ${ReviewService.renderStars(review.reviewRating || review.rating)}
                            </div>
                            <div>
                                <span class="badge bg-primary me-2">${review.reviewRating || review.rating} Stars</span>
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mb-2">${bookTitle}</h6>
                        <p class="mb-2">${review.reviewComment || review.comment}</p>
                        
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="bi bi-person me-1"></i>
                                <strong>User:</strong> ${userName} (${userEmail})
                            </small>
                        </div>
                        
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>
                            Reviewed on ${new Date(review.reviewDate || review.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                    
                    <div class="col-md-4 text-md-end">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-primary mb-1" onclick="reviewsPage.editReview('${review.reviewId || review.id}')">
                                <i class="bi bi-pencil me-1"></i>Edit
                            </button>
                            <button class="btn btn-outline-danger" onclick="reviewsPage.deleteReview('${review.reviewId || review.id}')">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    populateFilters() {
        // Populate book filter
        const bookFilter = document.getElementById('bookFilter');
        if (bookFilter) {
            const uniqueBooks = [...new Set(this.userReviews.map(r => r.book?.bookID || r.bookId).filter(Boolean))];
            const bookTitles = [...new Set(this.userReviews.map(r => r.book?.title).filter(Boolean))];

            uniqueBooks.forEach((bookId, index) => {
                const option = document.createElement('option');
                option.value = bookId;
                option.textContent = bookTitles[index] || `Book ${bookId}`;
                bookFilter.appendChild(option);
            });
        }

        // Populate user filter
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            const uniqueUsers = [...new Set(this.userReviews.map(r => r.user?.id).filter(Boolean))];
            const userNames = [...new Set(this.userReviews.map(r => r.user?.fullName).filter(Boolean))];

            uniqueUsers.forEach((userId, index) => {
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = userNames[index] || `User ${userId}`;
                userFilter.appendChild(option);
            });
        }
    }

    attachReviewEventListeners() {
        // Event listeners are attached via onclick attributes in the rendered HTML
    }

    async editReview(reviewId) {
        try {
            console.log('Editing review with ID:', reviewId);
            const review = await ReviewService.getReviewById(reviewId);
            console.log('Review loaded for editing:', review);
            if (review) {
                this.showEditModal(review);
            }
        } catch (error) {
            console.error('Failed to load review for editing:', error);
            alert('Failed to load review for editing: ' + error.message);
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
                                        ${this.renderRatingStars(review.reviewRating || review.rating, 'editRatingInput')}
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="editReviewComment" class="form-label">Comment</label>
                                    <textarea 
                                        class="form-control" 
                                        id="editReviewComment" 
                                        rows="3" 
                                        required
                                    >${review.reviewComment || review.comment}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="reviewsPage.updateReview('${review.reviewId || review.id}')">Update Review</button>
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
            console.log('Updating review with ID:', reviewId);
            const rating = parseInt(document.getElementById('editRatingInput').value);
            const comment = document.getElementById('editReviewComment').value.trim();

            console.log('Update data:', { rating, comment });

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
            const errorMessage = error.message || 'Failed to update review. Please try again.';
            alert(`Error: ${errorMessage}`);
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
            const errorMessage = error.message || 'Failed to delete review. Please try again.';
            alert(`Error: ${errorMessage}`);
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

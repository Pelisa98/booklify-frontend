// Review Component for Booklify
class ReviewComponent {
    constructor(containerId, bookId) {
        this.containerId = containerId;
        this.bookId = bookId;
        this.currentUser = this.getCurrentUser();
        this.currentReview = null;
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
        if (!this.currentUser.id) {
            this.renderLoginPrompt();
            return;
        }

        await this.loadReviews();
        this.renderReviewSection();
    }

    async loadReviews() {
        try {
            this.reviews = await ReviewService.getReviewsByBook(this.bookId);
            this.currentReview = await ReviewService.checkUserReviewForBook(this.bookId, this.currentUser.id);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            this.reviews = [];
            this.currentReview = null;
        }
    }

    renderLoginPrompt() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle me-2"></i>
                    Please <a href="login.html" class="alert-link">log in</a> to view and write reviews.
                </div>
            `;
        }
    }

    renderReviewSection() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const averageRating = ReviewService.calculateAverageRating(this.reviews);

        container.innerHTML = `
            <div class="review-section bg-white rounded shadow p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="mb-0">
                        <i class="bi bi-star-fill text-warning me-2"></i>
                        Reviews & Ratings
                    </h4>
                    ${this.currentUser.id ? this.renderReviewButton() : ''}
                </div>
                
                <div class="rating-summary mb-4">
                    <div class="d-flex align-items-center">
                        <span class="fs-2 fw-bold me-3">${averageRating.toFixed(1)}</span>
                        <div class="me-3">${ReviewService.renderStars(Math.round(averageRating))}</div>
                        <span class="text-muted">(${this.reviews.length} reviews)</span>
                    </div>
                </div>

                ${this.renderReviewForm()}
                ${this.renderReviewsList()}
            </div>
        `;

        this.attachEventListeners();
    }

    renderReviewButton() {
        if (this.currentReview) {
            return `
                <button class="btn btn-outline-primary btn-sm" id="editReviewBtn">
                    <i class="bi bi-pencil me-1"></i>Edit Review
                </button>
            `;
        } else {
            return `
                <button class="btn btn-primary btn-sm" id="writeReviewBtn">
                    <i class="bi bi-star me-1"></i>Write Review
                </button>
            `;
        }
    }

    renderReviewForm() {
        if (!this.currentUser.id) return '';

        const isEditing = this.currentReview !== null;
        const review = this.currentReview || {};

        return `
            <div class="review-form mb-4" id="reviewForm" style="display: ${isEditing ? 'block' : 'none'};">
                <div class="card border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title mb-3">
                            ${isEditing ? 'Edit Your Review' : 'Write a Review'}
                        </h6>
                        
                        <form id="reviewFormElement">
                            <div class="mb-3">
                                <label class="form-label">Rating</label>
                                <div class="rating-input">
                                    ${this.renderRatingStars(review.reviewRating || review.rating || 0, 'ratingInput')}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="reviewComment" class="form-label">Comment</label>
                                <textarea 
                                    class="form-control" 
                                    id="reviewComment" 
                                    rows="3" 
                                    placeholder="Share your thoughts about this book..."
                                    required
                                >${review.reviewComment || review.comment || ''}</textarea>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    ${isEditing ? 'Update Review' : 'Submit Review'}
                                </button>
                                ${isEditing ? `
                                    <button type="button" class="btn btn-outline-secondary" id="cancelEditBtn">
                                        Cancel
                                    </button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    renderRatingStars(rating, inputId) {
        let html = '<div class="d-flex gap-1">';
        for (let i = 1; i <= 5; i++) {
            html += `
                <i class="bi bi-star${i <= rating ? '-fill text-warning' : ' text-muted'} 
                   style="cursor: pointer; font-size: 1.5rem;" 
                   data-rating="${i}" 
                   onclick="document.getElementById('${inputId}').value = ${i}; this.parentElement.querySelectorAll('i').forEach((star, index) => { star.className = 'bi ' + (index < ${i} ? 'bi-star-fill text-warning' : 'bi-star text-muted'); });">
                </i>
            `;
        }
        html += `<input type="hidden" id="${inputId}" value="${rating}">`;
        html += '</div>';
        return html;
    }

    renderReviewsList() {
        if (!this.reviews || this.reviews.length === 0) {
            return `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-chat-dots fs-1"></i>
                    <p class="mt-2">No reviews yet. Be the first to review this book!</p>
                </div>
            `;
        }

        return `
            <div class="reviews-list">
                <h6 class="mb-3">All Reviews</h6>
                ${this.reviews.map(review => this.renderReviewItem(review)).join('')}
            </div>
        `;
    }

    renderReviewItem(review) {
        const isOwnReview = (review.user && review.user.userId) === this.currentUser.id;
        const userType = review.userType === 'seller' ? 'Seller' : 'Buyer';
        const reviewType = review.reviewType === 'pre-listing' ? 'Pre-listing Review' : 'Purchase Review';

        return `
            <div class="review-item border-bottom pb-3 mb-3" data-review-id="${review.reviewId || review.id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong class="me-2">${review.userName || 'Anonymous'}</strong>
                        <span class="badge bg-${review.userType === 'seller' ? 'success' : 'primary'} me-2">${userType}</span>
                        <span class="badge bg-secondary">${reviewType}</span>
                    </div>
                    <div class="d-flex align-items-center">
                        ${ReviewService.renderStars(review.reviewRating || review.rating)}
                        ${isOwnReview ? `
                            <div class="ms-2">
                                <button class="btn btn-sm btn-outline-primary edit-review-btn" data-review-id="${review.reviewId || review.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-review-btn" data-review-id="${review.reviewId || review.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <p class="mb-1">${review.reviewComment || review.comment}</p>
                <small class="text-muted">
                    <i class="bi bi-calendar me-1"></i>
                    ${new Date(review.reviewDate || review.createdAt).toLocaleDateString()}
                </small>
            </div>
        `;
    }

    attachEventListeners() {
        // Write review button
        const writeReviewBtn = document.getElementById('writeReviewBtn');
        if (writeReviewBtn) {
            writeReviewBtn.addEventListener('click', () => this.showReviewForm());
        }

        // Edit review button
        const editReviewBtn = document.getElementById('editReviewBtn');
        if (editReviewBtn) {
            editReviewBtn.addEventListener('click', () => this.showReviewForm(true));
        }

        // Cancel edit button
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.hideReviewForm());
        }

        // Review form submission
        const reviewForm = document.getElementById('reviewFormElement');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.handleReviewSubmission(e));
        }

        // Edit and delete buttons for individual reviews
        const editButtons = document.querySelectorAll('.edit-review-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reviewId = e.target.closest('.edit-review-btn').getAttribute('data-review-id');
                this.editReview(reviewId);
            });
        });

        const deleteButtons = document.querySelectorAll('.delete-review-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reviewId = e.target.closest('.delete-review-btn').getAttribute('data-review-id');
                this.deleteReview(reviewId);
            });
        });
    }

    showReviewForm(isEditing = false) {
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.style.display = 'block';
        }

        if (isEditing) {
            document.getElementById('writeReviewBtn').style.display = 'none';
        }
    }

    hideReviewForm() {
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.style.display = 'none';
        }

        const writeReviewBtn = document.getElementById('writeReviewBtn');
        if (writeReviewBtn) {
            writeReviewBtn.style.display = 'block';
        }
    }

    async handleReviewSubmission(e) {
        e.preventDefault();

        const rating = parseInt(document.getElementById('ratingInput').value);
        const comment = document.getElementById('reviewComment').value.trim();

        if (!rating || rating < 1 || rating > 5) {
            alert('Please select a valid rating (1-5 stars)');
            return;
        }

        if (!comment) {
            alert('Please write a comment for your review');
            return;
        }

        try {
            const reviewData = {
                bookId: this.bookId,
                userId: this.currentUser.id,
                rating: rating,
                comment: comment
            };

            if (this.currentReview) {
                // Update existing review
                await ReviewService.updateReview(this.currentReview.reviewId || this.currentReview.id, { rating, comment });
                alert('Review updated successfully!');
            } else {
                // Create new review
                await ReviewService.createReview(reviewData);
                alert('Review submitted successfully!');
            }

            // Reload reviews and re-render
            await this.loadReviews();
            this.renderReviewSection();

        } catch (error) {
            console.error('Review submission error:', error);
            const errorMessage = error.message || 'Failed to submit review. Please try again.';
            alert(`Error: ${errorMessage}`);
        }
    }

    determineUserType() {
        // This could be enhanced based on your business logic
        // For now, we'll use the user's role or determine based on context
        return this.currentUser.role === 'admin' ? 'seller' : 'buyer';
    }

    determineReviewType() {
        // This could be enhanced based on your business logic
        // For now, we'll use a simple determination
        return this.currentUser.role === 'admin' ? 'pre-listing' : 'post-purchase';
    }

    async editReview(reviewId) {
        try {
            const review = await ReviewService.getReviewById(reviewId);
            if (review) {
                this.currentReview = review;
                this.showReviewForm(true);
                this.renderReviewSection();
            }
        } catch (error) {
            console.error('Failed to load review for editing:', error);
            alert('Failed to load review for editing');
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            await ReviewService.deleteReview(reviewId);
            alert('Review deleted successfully!');

            // Reload reviews and re-render
            await this.loadReviews();
            this.renderReviewSection();

        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('Failed to delete review: ' + error.message);
        }
    }
}

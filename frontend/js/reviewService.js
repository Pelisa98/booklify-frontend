// Review Service for Booklify
const REVIEW_API_BASE_URL = 'http://localhost:8081/api/reviews';

class ReviewService {
    static async createReview(reviewData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${REVIEW_API_BASE_URL}/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookId: reviewData.bookId,
                    userId: reviewData.userId,
                    userType: reviewData.userType, // 'seller' or 'buyer'
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    reviewType: reviewData.reviewType, // 'pre-listing' or 'post-purchase'
                    createdAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create review');
            }

            return await response.json();
        } catch (error) {
            console.error('Create review error:', error);
            throw error;
        }
    }

    static async getReviewsByBook(bookId) {
        try {
            const response = await fetch(`${REVIEW_API_BASE_URL}/book/${bookId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }

            return await response.json();
        } catch (error) {
            console.error('Get reviews by book error:', error);
            throw error;
        }
    }

    static async getReviewsByUser(userId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${REVIEW_API_BASE_URL}/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user reviews');
            }

            return await response.json();
        } catch (error) {
            console.error('Get reviews by user error:', error);
            throw error;
        }
    }

    static async updateReview(reviewId, reviewData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${REVIEW_API_BASE_URL}/update/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    updatedAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update review');
            }

            return await response.json();
        } catch (error) {
            console.error('Update review error:', error);
            throw error;
        }
    }

    static async deleteReview(reviewId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${REVIEW_API_BASE_URL}/delete/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete review');
            }

            return true;
        } catch (error) {
            console.error('Delete review error:', error);
            throw error;
        }
    }

    static async getReviewById(reviewId) {
        try {
            const response = await fetch(`${REVIEW_API_BASE_URL}/${reviewId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch review');
            }

            return await response.json();
        } catch (error) {
            console.error('Get review by ID error:', error);
            throw error;
        }
    }

    static async checkUserReviewForBook(bookId, userId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${REVIEW_API_BASE_URL}/check/${bookId}/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                return null; // No review found
            }

            return await response.json();
        } catch (error) {
            console.error('Check user review error:', error);
            return null;
        }
    }

    static calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return total / reviews.length;
    }

    static renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<i class="bi ${i <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}"></i>`;
        }
        return html;
    }
}

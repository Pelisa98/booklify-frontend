// Review Service for Booklify
const REVIEW_API_BASE_URL = 'http://localhost:8081/reviews';

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
                    reviewRating: reviewData.rating,
                    reviewComment: reviewData.comment,
                    reviewDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
                    user: { id: reviewData.userId },
                    book: { bookID: reviewData.bookId }
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

    static async getAllReviews() {
        try {
            const token = localStorage.getItem('booklifyToken');
            console.log('Fetching all reviews with token:', token ? 'Token present' : 'No token');
            console.log('API URL:', `${REVIEW_API_BASE_URL}/getAll`);

            const response = await fetch(`${REVIEW_API_BASE_URL}/getAll`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch all reviews: ${response.status} ${errorText}`);
            }

            // Handle 204 No Content (no reviews found)
            if (response.status === 204) {
                console.log('No reviews found (204 No Content)');
                return [];
            }

            const reviews = await response.json();
            console.log('Reviews from API:', reviews);
            return reviews;
        } catch (error) {
            console.error('Get all reviews error:', error);
            throw error;
        }
    }

    static async updateReview(reviewId, reviewData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            console.log('Updating review with data:', reviewData);

            // First get the existing review to preserve other fields
            const existingReview = await this.getReviewById(reviewId);
            console.log('Existing review:', existingReview);

            // Create updated review object
            const updatedReview = {
                reviewId: existingReview.reviewId,
                reviewRating: reviewData.rating,
                reviewComment: reviewData.comment,
                reviewDate: existingReview.reviewDate,
                user: existingReview.user,
                book: existingReview.book
            };

            console.log('Sending updated review:', updatedReview);

            const response = await fetch(`${REVIEW_API_BASE_URL}/update/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedReview)
            });

            console.log('Update response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Update error response:', errorText);
                throw new Error(`Failed to update review: ${response.status} ${errorText}`);
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
            const response = await fetch(`${REVIEW_API_BASE_URL}/read/${reviewId}`);

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
            const response = await fetch(`${REVIEW_API_BASE_URL}/check/${bookId}/${userId}`);

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
        const total = reviews.reduce((sum, review) => sum + (review.reviewRating || review.rating || 0), 0);
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

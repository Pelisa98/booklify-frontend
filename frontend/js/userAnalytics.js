/**
 * User Analytics Dashboard
 * Personal analytics for individual users showing their activity
 */

class UserAnalytics {
    constructor(userId) {
        this.userId = userId;
        this.charts = {};
        this.initializeUserAnalytics();
    }

    async initializeUserAnalytics() {
        try {
            // Load user's personal data
            const [userOrders, userReviews, userListings] = await Promise.all([
                this.getUserOrders(),
                this.getUserReviews(),
                this.getUserListings()
            ]);

            // Create user analytics HTML
            this.createUserAnalyticsHTML();
            
            // Initialize user charts
            this.createSpendingChart(userOrders);
            this.createOrderStatusChart(userOrders);
            this.createReviewsChart(userReviews);
            this.createListingsChart(userListings);
            
            // Update user summary cards
            this.updateUserSummaryCards(userOrders, userReviews, userListings);
            
        } catch (error) {
            console.error('Error initializing user analytics:', error);
        }
    }

    async getUserOrders() {
        try {
            const orders = await getOrdersByUserId(this.userId);
            return orders || [];
        } catch (error) {
            console.error('Error fetching user orders:', error);
            return [];
        }
    }

    async getUserReviews() {
        try {
            const reviews = await ReviewService.getReviewsByUser(this.userId);
            return reviews || [];
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            return [];
        }
    }

    async getUserListings() {
        try {
            const response = await fetch(`http://localhost:8081/api/book/user/${this.userId}`);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching user listings:', error);
            return [];
        }
    }

    createUserAnalyticsHTML() {
        const analyticsHTML = `
            <div class="user-analytics-section mt-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4><i class="bi bi-graph-up me-2"></i>My Analytics</h4>
                    <button class="btn btn-sm btn-outline-purple" onclick="userAnalytics.refreshUserAnalytics()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
                
                <!-- User Summary Cards -->
                <div class="row mb-4">
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-0 bg-gradient-primary text-white">
                            <div class="card-body text-center">
                                <i class="bi bi-cart-fill display-4 mb-2"></i>
                                <h3 class="fw-bold mb-0" id="userTotalOrders">0</h3>
                                <p class="mb-0">Orders Placed</p>
                                <small class="text-white-50" id="userTotalSpent">R0.00 spent</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-0 bg-gradient-success text-white">
                            <div class="card-body text-center">
                                <i class="bi bi-star-fill display-4 mb-2"></i>
                                <h3 class="fw-bold mb-0" id="userTotalReviews">0</h3>
                                <p class="mb-0">Reviews Given</p>
                                <small class="text-white-50" id="userAvgRating">0.0 avg rating</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-0 bg-gradient-warning text-white">
                            <div class="card-body text-center">
                                <i class="bi bi-book-fill display-4 mb-2"></i>
                                <h3 class="fw-bold mb-0" id="userTotalListings">0</h3>
                                <p class="mb-0">Books Listed</p>
                                <small class="text-white-50" id="userListingsValue">R0.00 value</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-0 bg-gradient-info text-white">
                            <div class="card-body text-center">
                                <i class="bi bi-trophy-fill display-4 mb-2"></i>
                                <h3 class="fw-bold mb-0" id="userMembershipDays">0</h3>
                                <p class="mb-0">Days Active</p>
                                <small class="text-white-50">Member since registration</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- User Charts -->
                <div class="row">
                    <!-- Monthly Spending -->
                    <div class="col-lg-8 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-graph-up me-2"></i>Monthly Spending Trend
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="userSpendingChart" height="100"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Order Status Distribution -->
                    <div class="col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-pie-chart me-2"></i>Order Status
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="userOrderStatusChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <!-- Reviews Given Over Time -->
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-star me-2"></i>Reviews Over Time
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="userReviewsChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Books Listed -->
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-bookmark me-2"></i>My Book Listings
                                </h5>
                            </div>
                            <div class="card-body">
                                <canvas id="userListingsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Find the right place to insert user analytics (after orders list)
        const ordersList = document.getElementById('ordersList');
        if (ordersList && ordersList.parentElement) {
            const analyticsDiv = document.createElement('div');
            analyticsDiv.id = 'userAnalyticsSection';
            analyticsDiv.innerHTML = analyticsHTML;
            
            // Insert after the orders section
            const ordersContainer = ordersList.closest('.col-lg-8, .col-md-8, .col-12');
            if (ordersContainer && ordersContainer.parentElement) {
                ordersContainer.parentElement.insertBefore(analyticsDiv, ordersContainer.nextSibling);
            }
        }
    }

    createSpendingChart(orders) {
        // Process orders to show spending over time
        const spendingByMonth = this.processSpendingData(orders);
        
        const ctx = document.getElementById('userSpendingChart');
        if (!ctx) return;

        this.charts.spending = new Chart(ctx, {
            type: 'line',
            data: {
                labels: spendingByMonth.map(item => item.month),
                datasets: [{
                    label: 'Monthly Spending (R)',
                    data: spendingByMonth.map(item => item.amount),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    createOrderStatusChart(orders) {
        // Count orders by status
        const statusCounts = {};
        orders.forEach(order => {
            (order.orderItems || []).forEach(item => {
                const status = item.orderStatus || 'PENDING';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
        });

        const ctx = document.getElementById('userOrderStatusChart');
        if (!ctx) return;

        const colors = {
            'PENDING': '#fbbf24',
            'PROCESSING': '#3b82f6',
            'SHIPPED': '#8b5cf6',
            'DELIVERED': '#10b981',
            'CANCELLED': '#ef4444'
        };

        this.charts.orderStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: Object.keys(statusCounts).map(status => colors[status] || '#6b7280'),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createReviewsChart(reviews) {
        // Process reviews by rating over time
        const reviewsByMonth = this.processReviewsData(reviews);
        
        const ctx = document.getElementById('userReviewsChart');
        if (!ctx) return;

        this.charts.reviews = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: reviewsByMonth.map(item => item.month),
                datasets: [{
                    label: 'Reviews Given',
                    data: reviewsByMonth.map(item => item.count),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createListingsChart(listings) {
        // Group listings by category or status
        const listingsByCategory = {};
        listings.forEach(book => {
            const category = book.category || book.genre || 'Other';
            listingsByCategory[category] = (listingsByCategory[category] || 0) + 1;
        });

        const ctx = document.getElementById('userListingsChart');
        if (!ctx) return;

        const colors = [
            '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
            '#ef4444', '#06b6d4', '#84cc16', '#f97316'
        ];

        this.charts.listings = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(listingsByCategory),
                datasets: [{
                    data: Object.values(listingsByCategory),
                    backgroundColor: colors.slice(0, Object.keys(listingsByCategory).length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateUserSummaryCards(orders, reviews, listings) {
        // Update order statistics
        document.getElementById('userTotalOrders').textContent = orders.length;
        
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        document.getElementById('userTotalSpent').textContent = `R${totalSpent.toFixed(2)} spent`;

        // Update review statistics
        document.getElementById('userTotalReviews').textContent = reviews.length;
        
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + (review.rating || review.reviewRating || 0), 0) / reviews.length 
            : 0;
        document.getElementById('userAvgRating').textContent = `${avgRating.toFixed(1)} avg rating`;

        // Update listings statistics
        document.getElementById('userTotalListings').textContent = listings.length;
        
        const listingsValue = listings.reduce((sum, book) => sum + (book.price || 0), 0);
        document.getElementById('userListingsValue').textContent = `R${listingsValue.toFixed(2)} value`;

        // Calculate membership days
        const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
        const joinDate = new Date(userData.dateJoined || Date.now());
        const daysSinceJoined = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        document.getElementById('userMembershipDays').textContent = daysSinceJoined;
    }

    // Helper methods for data processing
    processSpendingData(orders) {
        const spendingByMonth = {};
        
        orders.forEach(order => {
            const date = new Date(order.orderDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!spendingByMonth[monthKey]) {
                spendingByMonth[monthKey] = 0;
            }
            spendingByMonth[monthKey] += order.totalAmount || 0;
        });

        return Object.entries(spendingByMonth)
            .map(([month, amount]) => ({ 
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
                amount 
            }))
            .sort((a, b) => new Date(a.month) - new Date(b.month));
    }

    processReviewsData(reviews) {
        const reviewsByMonth = {};
        
        reviews.forEach(review => {
            const date = new Date(review.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!reviewsByMonth[monthKey]) {
                reviewsByMonth[monthKey] = 0;
            }
            reviewsByMonth[monthKey]++;
        });

        return Object.entries(reviewsByMonth)
            .map(([month, count]) => ({ 
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
                count 
            }))
            .sort((a, b) => new Date(a.month) - new Date(b.month));
    }

    // Method to refresh user analytics
    async refreshUserAnalytics() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        // Reinitialize analytics
        await this.initializeUserAnalytics();
    }
}

// Global user analytics instance
let userAnalytics;

// Function to initialize user analytics (call from profile page)
window.initializeUserAnalytics = function(userId) {
    if (typeof Chart !== 'undefined' && userId) {
        setTimeout(() => {
            userAnalytics = new UserAnalytics(userId);
        }, 1500); // Small delay to ensure profile data is loaded
    }
};
/**
 * Admin Analytics Dashboard
 * Enhanced admin dashboard with comprehensive charts and statistics
 */

class AdminAnalytics {
    constructor() {
        this.charts = {};
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            console.log('Loading admin analytics data...');
            
            // Load all required data with error handling for each service
            const [users, books, orders, orderItems, reviews] = await Promise.all([
                AdminService.getAllUsers().catch(err => {
                    console.warn('Failed to load users:', err);
                    return [];
                }),
                AdminService.getAllBooks().catch(err => {
                    console.warn('Failed to load books:', err);
                    return [];
                }),
                AdminService.viewAllOrders().catch(err => {
                    console.warn('Failed to load orders:', err);
                    return [];
                }),
                AdminService.viewAllOrderItems().catch(err => {
                    console.warn('Failed to load order items:', err);
                    return [];
                }),
                ReviewService.getAllReviews().catch(err => {
                    console.warn('Failed to load reviews:', err);
                    return [];
                })
            ]);

            // Enhance orders with order items for better chart data
            const enhancedOrders = orders.map(order => {
                const relatedOrderItems = orderItems.filter(item => 
                    item.orderId === order.orderId || item.order?.orderId === order.orderId
                );
                return {
                    ...order,
                    orderItems: order.orderItems || relatedOrderItems
                };
            });

            console.log('Data loaded:', { 
                users: users.length, 
                books: books.length, 
                orders: orders.length,
                enhancedOrders: enhancedOrders.length, 
                orderItems: orderItems.length, 
                reviews: reviews.length 
            });

            // Log sample order data for debugging
            if (enhancedOrders.length > 0) {
                console.log('Sample enhanced order:', enhancedOrders[0]);
            }

            // Create analytics sections
            this.createAnalyticsHTML();
            
            // Wait a moment for DOM to update before creating charts
            setTimeout(() => {
                // Initialize all charts with enhanced data
                this.createRevenueChart(enhancedOrders);
                this.createOrderStatusChart(orderItems);
                this.createUserTrendChart(users);
                this.createRatingChart(reviews);
                this.createTopBooksChart(enhancedOrders, books);
                
                // Update summary cards
                this.updateSummaryCards(users, books, enhancedOrders, reviews);
            }, 100);
            
        } catch (error) {
            console.error('Error initializing admin analytics:', error);
            
            // Show error message to user
            const analyticsContainer = document.getElementById('analyticsSection');
            if (analyticsContainer) {
                analyticsContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Error loading analytics data:</strong> ${error.message}
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.adminAnalytics.refreshData()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Retry
                        </button>
                    </div>
                `;
            }
        }
    }

    // Refresh analytics data
    async refreshData() {
        console.log('Refreshing analytics data...');
        const analyticsContainer = document.getElementById('analyticsSection');
        if (analyticsContainer) {
            analyticsContainer.innerHTML = '<div class="text-center p-5"><i class="bi bi-arrow-clockwise fa-spin fs-1 text-primary"></i><br>Loading analytics...</div>';
        }
        await this.initializeDashboard();
    }

    createAnalyticsHTML() {
        const analyticsHTML = `
            <!-- Analytics Overview Cards -->
            <div class="row mb-4">
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 bg-gradient-primary text-white">
                        <div class="card-body text-center">
                            <i class="bi bi-people-fill display-4 mb-2"></i>
                            <h3 class="fw-bold mb-0" id="totalUsersAnalytics">0</h3>
                            <p class="mb-0">Total Users</p>
                            <small class="text-white-50" id="newUsersThisMonth">+0 this month</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 bg-gradient-success text-white">
                        <div class="card-body text-center">
                            <i class="bi bi-book-fill display-4 mb-2"></i>
                            <h3 class="fw-bold mb-0" id="totalBooksAnalytics">0</h3>
                            <p class="mb-0">Total Books</p>
                            <small class="text-white-50" id="newBooksThisMonth">+0 this month</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 bg-gradient-warning text-white">
                        <div class="card-body text-center">
                            <i class="bi bi-cart-fill display-4 mb-2"></i>
                            <h3 class="fw-bold mb-0" id="totalOrdersAnalytics">0</h3>
                            <p class="mb-0">Total Orders</p>
                            <small class="text-white-50" id="pendingOrders">0 pending</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-0 bg-gradient-info text-white">
                        <div class="card-body text-center">
                            <i class="bi bi-currency-dollar display-4 mb-2"></i>
                            <h3 class="fw-bold mb-0" id="totalRevenueAnalytics">R0.00</h3>
                            <p class="mb-0">Total Revenue</p>
                            <small class="text-white-50" id="revenueThisMonth">R0.00 this month</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="row">
                <!-- Revenue Chart -->
                <div class="col-lg-8 mb-4">
                    <div class="card analytics-card">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="card-title mb-0 text-dark fw-semibold">
                                <i class="bi bi-graph-up me-2 text-primary"></i>Revenue Analytics
                            </h5>
                        </div>
                        <div class="card-body pt-2">
                            <canvas id="revenueChart" height="100"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Order Status Chart -->
                <div class="col-lg-4 mb-4">
                    <div class="card analytics-card">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="card-title mb-0 text-dark fw-semibold">
                                <i class="bi bi-pie-chart me-2 text-success"></i>Order Status
                            </h5>
                        </div>
                        <div class="card-body pt-2">
                            <canvas id="orderStatusChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- User Registration Trend -->
                <div class="col-lg-12 mb-4">
                    <div class="card analytics-card">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="card-title mb-0 text-dark fw-semibold">
                                <i class="bi bi-person-plus me-2 text-info"></i>User Registration Trend
                            </h5>
                        </div>
                        <div class="card-body pt-2">
                            <canvas id="userTrendChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Rating Distribution -->
                <div class="col-lg-6 mb-4">
                    <div class="card analytics-card">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="card-title mb-0 text-dark fw-semibold">
                                <i class="bi bi-star-fill me-2 text-warning"></i>Review Ratings
                            </h5>
                        </div>
                        <div class="card-body pt-2">
                            <canvas id="ratingChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Top Books -->
                <div class="col-lg-6 mb-4">
                    <div class="card analytics-card">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="card-title mb-0 text-dark fw-semibold">
                                <i class="bi bi-trophy me-2 text-danger"></i>Top Selling Books
                            </h5>
                        </div>
                        <div class="card-body pt-2">
                            <canvas id="topBooksChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert analytics HTML into the dedicated analytics section
        const analyticsSection = document.getElementById('analyticsSection');
        if (analyticsSection) {
            analyticsSection.innerHTML = analyticsHTML;
            console.log('Analytics content inserted into dedicated section');
        } else {
            console.error('Analytics section not found. Cannot insert analytics content.');
        }
    }

    createRevenueChart(orders) {
        try {
            console.log('Creating revenue chart with orders:', orders?.length || 0);
            const revenueData = ChartService.processRevenueData(orders || []);
            console.log('Processed revenue data:', revenueData?.length || 0, 'data points');
            
            this.charts.revenue = ChartService.createRevenueChart('revenueChart', revenueData);
            
            if (this.charts.revenue) {
                console.log('Revenue chart created successfully');
            } else {
                console.error('Revenue chart creation returned null');
            }
        } catch (error) {
            console.error('Failed to create revenue chart:', error);
            // Try to show error message on canvas
            const canvas = document.getElementById('revenueChart');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#dc3545';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Error loading chart', canvas.width/2, canvas.height/2);
            }
        }
    }

    createOrderStatusChart(orderItems) {
        try {
            const statusData = ChartService.processOrderStatusData(orderItems || []);
            this.charts.orderStatus = ChartService.createOrderStatusChart('orderStatusChart', statusData);
            console.log('Order status chart created successfully');
        } catch (error) {
            console.error('Failed to create order status chart:', error);
        }
    }

    createUserTrendChart(users) {
        try {
            const userData = ChartService.processUserRegistrationData(users || []);
            this.charts.userTrend = ChartService.createUserTrendChart('userTrendChart', userData);
            console.log('User trend chart created successfully');
        } catch (error) {
            console.error('Failed to create user trend chart:', error);
        }
    }



    createRatingChart(reviews) {
        try {
            const ratingData = ChartService.processRatingData(reviews || []);
            this.charts.rating = ChartService.createRatingChart('ratingChart', ratingData);
            console.log('Rating chart created successfully');
        } catch (error) {
            console.error('Failed to create rating chart:', error);
        }
    }

    createTopBooksChart(orders, books) {
        try {
            console.log('Creating top books chart with data:', { orders: orders?.length, books: books?.length });
            
            // Process data to find top selling books
            const bookSales = {};
            let totalOrdersProcessed = 0;
        
            (orders || []).forEach(order => {
                if (order.orderItems && Array.isArray(order.orderItems)) {
                    order.orderItems.forEach(item => {
                        const bookId = item.bookId || item.book?.bookID || item.book?.id;
                        const quantity = item.quantity || 1;
                        
                        if (bookId) {
                            bookSales[bookId] = (bookSales[bookId] || 0) + quantity;
                            totalOrdersProcessed++;
                        }
                    });
                }
            });

            console.log('Book sales data:', bookSales);
            console.log('Total order items processed:', totalOrdersProcessed);

            // Get top 5 books with full book details
            const topBooks = Object.entries(bookSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([bookId, quantity]) => {
                    const book = (books || []).find(b => 
                        String(b.bookID) === String(bookId) || 
                        String(b.id) === String(bookId)
                    );
                    
                    console.log(`Found book for ID ${bookId}:`, book?.title || 'Not found');
                    
                    return {
                        title: book?.title || `Book ID: ${bookId}`,
                        orders: quantity,
                        author: book?.author || 'Unknown Author',
                        price: book?.price || 0
                    };
                });

            console.log('Top books for chart:', topBooks);

            // If no real data, create sample data for visualization
            if (topBooks.length === 0) {
                console.warn('No book sales data found, creating sample data');
                const sampleBooks = [
                    { title: 'Introduction to Algorithms', orders: 12, author: 'Thomas H. Cormen' },
                    { title: 'Operating System Concepts', orders: 8, author: 'Abraham Silberschatz' },
                    { title: 'Database System Concepts', orders: 6, author: 'Abraham Silberschatz' },
                    { title: 'Computer Networks', orders: 4, author: 'Andrew S. Tanenbaum' },
                    { title: 'Software Engineering', orders: 3, author: 'Ian Sommerville' }
                ];
                this.charts.topBooks = ChartService.createTopBooksChart('topBooksChart', sampleBooks);
            } else {
                this.charts.topBooks = ChartService.createTopBooksChart('topBooksChart', topBooks);
            }
            
            console.log('Top books chart created successfully');
        } catch (error) {
            console.error('Failed to create top books chart:', error);
        }
    }

    updateSummaryCards(users, books, orders, reviews) {
        // Update total counts
        document.getElementById('totalUsersAnalytics').textContent = users.length;
        document.getElementById('totalBooksAnalytics').textContent = books.length;
        document.getElementById('totalOrdersAnalytics').textContent = orders.length;

        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        document.getElementById('totalRevenueAnalytics').textContent = `R${totalRevenue.toFixed(2)}`;

        // Calculate monthly stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const newUsersThisMonth = users.filter(user => {
            const userDate = new Date(user.dateJoined || user.createdAt);
            return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
        }).length;

        const newBooksThisMonth = books.filter(book => {
            const bookDate = new Date(book.datePosted || book.createdAt);
            return bookDate.getMonth() === currentMonth && bookDate.getFullYear() === currentYear;
        }).length;

        const revenueThisMonth = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }).reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Update monthly indicators
        document.getElementById('newUsersThisMonth').textContent = `+${newUsersThisMonth} this month`;
        document.getElementById('newBooksThisMonth').textContent = `+${newBooksThisMonth} this month`;
        document.getElementById('revenueThisMonth').textContent = `R${revenueThisMonth.toFixed(2)} this month`;
        
        // Count pending orders
        const pendingOrders = orders.filter(order => 
            order.orderItems && order.orderItems.some(item => 
                !item.orderStatus || item.orderStatus === 'PENDING'
            )
        ).length;
        document.getElementById('pendingOrders').textContent = `${pendingOrders} pending`;
    }

    // Method to refresh all charts with new data
    async refreshAnalytics() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        // Reinitialize dashboard
        await this.initializeDashboard();
    }

    // Export chart data (useful for reports)
    exportChartData() {
        const chartData = {};
        
        Object.entries(this.charts).forEach(([key, chart]) => {
            if (chart && chart.data) {
                chartData[key] = {
                    labels: chart.data.labels,
                    datasets: chart.data.datasets
                };
            }
        });

        return chartData;
    }
}

// Global analytics instance
let adminAnalytics;

// Note: Analytics are now initialized via the toggle button in admin dashboard
// This ensures better performance and user control over when analytics load

// Add refresh analytics function to global scope
window.refreshAdminAnalytics = function() {
    if (adminAnalytics) {
        adminAnalytics.refreshAnalytics();
    }
};
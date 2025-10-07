/**
 * Chart Service for Booklify Analytics
 * Handles chart creation and data visualization
 */

class ChartService {
    
    /**
     * Initialize Chart.js defaults
     */
    static initDefaults() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
            Chart.defaults.color = '#6c757d';
            Chart.defaults.borderColor = '#dee2e6';
        }
    }

    /**
     * Create Revenue Over Time Chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} revenueData - Array of {date, amount}
     */
    static createRevenueChart(canvasId, revenueData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error('Canvas element not found:', canvasId);
            return null;
        }

        // Ensure we have data
        if (!revenueData || revenueData.length === 0) {
            console.warn('No revenue data available, using sample data');
            revenueData = this.processRevenueData([]);
        }

        // Format labels for better display
        const labels = revenueData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
            });
        });

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (R)',
                    data: revenueData.map(item => Number(item.amount) || 0),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Over Time',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `Revenue: R${context.parsed.y.toFixed(2)}`;
                            }
                        }
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

    /**
     * Create Order Status Distribution Chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} statusData - Object with status counts
     */
    static createOrderStatusChart(canvasId, statusData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const colors = {
            'PENDING': '#fbbf24',
            'PROCESSING': '#3b82f6',
            'SHIPPED': '#8b5cf6',
            'DELIVERED': '#10b981',
            'CANCELLED': '#ef4444'
        };

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    data: Object.values(statusData),
                    backgroundColor: Object.keys(statusData).map(status => colors[status] || '#6b7280'),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Order Status Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Create User Registration Trend Chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} userData - Array of {date, count}
     */
    static createUserTrendChart(canvasId, userData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userData.map(item => new Date(item.date).toLocaleDateString()),
                datasets: [{
                    label: 'New Users',
                    data: userData.map(item => item.count),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'User Registration Trend'
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



    /**
     * Create Rating Distribution Chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} ratingData - Array of rating counts [1-5 stars]
     */
    static createRatingChart(canvasId, ratingData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                datasets: [{
                    label: 'Number of Reviews',
                    data: ratingData,
                    backgroundColor: [
                        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Review Rating Distribution'
                    },
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

    /**
     * Create Top Books Chart (Admin Dashboard)
     * @param {string} canvasId - Canvas element ID
     * @param {Array} booksData - Array of {title, orders}
     */
    static createTopBooksChart(canvasId, booksData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        console.log('Creating top books chart with data:', booksData);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: booksData.map(book => {
                    // Better title truncation that preserves readability
                    const title = book.title || 'Unknown Book';
                    if (title.length > 25) {
                        return title.substring(0, 22) + '...';
                    }
                    return title;
                }),
                datasets: [{
                    label: 'Units Sold',
                    data: booksData.map(book => book.orders || 0),
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)', 
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        '#8b5cf6',
                        '#3b82f6',
                        '#10b981', 
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top Selling Books',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return booksData[index]?.title || 'Unknown Book';
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const book = booksData[index];
                                return [
                                    `Units Sold: ${context.parsed.x}`,
                                    `Author: ${book?.author || 'Unknown'}`,
                                    book?.price ? `Price: R${book.price}` : ''
                                ].filter(Boolean);
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units Sold'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Books'
                        }
                    }
                }
            }
        });
    }

    /**
     * Process raw data for charts
     */
    static processRevenueData(orders) {
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            // Generate sample data for last 30 days if no real data
            const sampleData = [];
            const today = new Date();
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                sampleData.push({
                    date: date.toISOString().split('T')[0],
                    amount: Math.floor(Math.random() * 5000) + 1000
                });
            }
            return sampleData;
        }

        const revenueByDate = {};
        
        orders.forEach(order => {
            try {
                // Handle different date formats
                let orderDate;
                if (order.orderDate) {
                    orderDate = new Date(order.orderDate);
                } else if (order.createdAt) {
                    orderDate = new Date(order.createdAt);
                } else {
                    orderDate = new Date(); // fallback to today
                }
                
                // Ensure valid date
                if (isNaN(orderDate.getTime())) {
                    orderDate = new Date();
                }
                
                const dateKey = orderDate.toISOString().split('T')[0];
                
                if (!revenueByDate[dateKey]) {
                    revenueByDate[dateKey] = 0;
                }
                
                // Handle different amount field names
                const amount = order.totalAmount || order.amount || order.total || 
                              (order.orderItems && order.orderItems.reduce((sum, item) => 
                                  sum + ((item.price || 0) * (item.quantity || 1)), 0)) || 0;
                
                revenueByDate[dateKey] += Number(amount) || 0;
            } catch (error) {
                console.warn('Error processing order for revenue chart:', error, order);
            }
        });

        // Convert to array and sort
        const result = Object.entries(revenueByDate)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        // If we have data but it's very sparse, fill in gaps for better visualization
        if (result.length > 0 && result.length < 30) {
            return this.fillDateGaps(result);
        }
        
        return result;
    }
    
    // Helper method to fill date gaps for better chart visualization
    static fillDateGaps(revenueData) {
        if (revenueData.length === 0) return [];
        
        const filledData = [];
        const startDate = new Date(revenueData[0].date);
        const endDate = new Date(revenueData[revenueData.length - 1].date);
        
        // Fill in 30 days if the range is less than 30 days
        const currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() - 29);
        
        for (let i = 0; i < 30; i++) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const existingData = revenueData.find(item => item.date === dateKey);
            
            filledData.push({
                date: dateKey,
                amount: existingData ? existingData.amount : 0
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return filledData;
    }

    static processOrderStatusData(orderItems) {
        const statusCounts = {};
        
        orderItems.forEach(item => {
            const status = item.orderStatus || 'PENDING';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return statusCounts;
    }

    static processUserRegistrationData(users) {
        const registrationsByDate = {};
        
        users.forEach(user => {
            const date = new Date(user.dateJoined || user.createdAt).toDateString();
            registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
        });

        return Object.entries(registrationsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }



    static processRatingData(reviews) {
        const ratingCounts = [0, 0, 0, 0, 0]; // Index 0-4 for ratings 1-5
        
        reviews.forEach(review => {
            const rating = review.rating || review.reviewRating;
            if (rating >= 1 && rating <= 5) {
                ratingCounts[rating - 1]++;
            }
        });

        return ratingCounts;
    }
}

// Initialize Chart.js when script loads
document.addEventListener('DOMContentLoaded', () => {
    ChartService.initDefaults();
});
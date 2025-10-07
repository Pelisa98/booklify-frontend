// ordersPage.js - Fetch and display orders and order items for the logged-in user

const ORDERS_API_BASE_URL = 'http://localhost:8081/api/orders';
const ORDER_ITEMS_API_BASE_URL = 'http://localhost:8081/api/orderItems';

const userId = localStorage.getItem('booklifyUserId');
const ordersContainer = document.getElementById('ordersContainer');
const noOrdersMessage = document.getElementById('noOrdersMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

// Store last known order statuses for polling
let lastKnownStatuses = new Map();
let pollingInterval = null;

// Check for order status changes and auto-send invoices
function checkForInvoiceTriggers(orderId, oldStatus, newStatus) {
    if (oldStatus !== newStatus && window.EmailService && window.EmailService.shouldSendInvoice(newStatus)) {
        console.log(`Order ${orderId} status changed from ${oldStatus} to ${newStatus}, checking for auto-invoice`);
        
        const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
        if (userData.email) {
            window.EmailService.sendInvoiceOnStatusChange(orderId, newStatus, userData)
                .then(sent => {
                    if (sent) {
                        console.log(`Auto-invoice sent for order ${orderId}`);
                        showToast('success', `Invoice sent to ${userData.email} for order #${orderId}`);
                    }
                })
                .catch(error => {
                    console.error('Failed to send auto-invoice:', error);
                });
        }
    }
}

async function fetchOrdersByUser(userId) {
    const response = await fetch(`${ORDERS_API_BASE_URL}/getByUserId/${userId}`);
    if (!response.ok) return [];
    return await response.json();
}

async function fetchOrderItemsByOrder(orderId) {
    const response = await fetch(`${ORDER_ITEMS_API_BASE_URL}/getByOrderId/${orderId}`);
    if (!response.ok) return [];
    return await response.json();
}

function renderOrders(orders) {
    ordersContainer.innerHTML = '';
    if (!orders || orders.length === 0) {
        noOrdersMessage.style.display = 'block';
        return;
    }
    noOrdersMessage.style.display = 'none';
    orders.forEach(async (order) => {
        const orderCard = document.createElement('div');
        orderCard.className = 'card mb-4 shadow-sm';
        orderCard.innerHTML = `
            <div class="card-header bg-purple text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-bag-check"></i> Order #${order.orderId}</span>
                <span class="small">${order.orderDate ? new Date(order.orderDate).toLocaleString() : ''}</span>
            </div>
            <div class="card-body">
                <div class="mb-2"><strong>Status:</strong> <span class="order-status" data-order-id="${order.orderId}">Loading...</span></div>
                <div class="mb-2"><strong>Total:</strong> R${order.totalAmount || '0.00'}</div>
                <div class="mb-3"><strong>Order Items:</strong></div>
                <ul class="list-group order-items-list mb-3" id="order-items-${order.orderId}">
                    <li class="list-group-item">Loading items...</li>
                </ul>
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-purple" onclick="generateInvoice(${order.orderId})" title="Generate Invoice">
                        <i class="bi bi-receipt"></i> View Invoice
                    </button>
                </div>
            </div>
        `;
        ordersContainer.appendChild(orderCard);
        // Fetch and render order items
        const items = await fetchOrderItemsByOrder(order.orderId);
        const itemsList = orderCard.querySelector(`#order-items-${order.orderId}`);
        const statusSpan = orderCard.querySelector('.order-status[data-order-id="' + order.orderId + '"]');
        if (items && items.length > 0) {
            itemsList.innerHTML = '';
            // Set status from the first order item with color
            if (statusSpan) {
                const status = items[0].orderStatus || 'N/A';
                statusSpan.textContent = status;
                statusSpan.classList.add(getStatusBadgeClass(status));
            }
            items.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                const isDelivered = item.orderStatus && item.orderStatus.toUpperCase() === 'DELIVERED';
                const reviewButton = isDelivered ? 
                    `<button class="btn btn-sm btn-outline-warning ms-2" onclick="openReviewModal(${item.book ? item.book.bookID : 'null'}, '${item.book ? item.book.title : 'Book'}', ${item.orderItemId})">
                        <i class="bi bi-star"></i> Review
                    </button>` : '';
                
                itemLi.innerHTML = `
                    <div>
                        <strong>${item.book ? item.book.title : 'Book'}</strong> x${item.quantity}
                    </div>
                    <div class="d-flex align-items-center">
                        <span>R${item.price || '0.00'}</span>
                        ${reviewButton}
                    </div>
                `;
                itemsList.appendChild(itemLi);
            });
        } else {
            if (statusSpan) {
                statusSpan.textContent = 'N/A';
                statusSpan.classList.add(getStatusBadgeClass('N/A'));
            }
            itemsList.innerHTML = '<li class="list-group-item text-muted">No items found for this order.</li>';
        }
    });
}

// Function to check if order statuses have changed
function checkForStatusUpdates(currentOrders) {
    const updatedOrders = [];
    
    currentOrders.forEach(order => {
        const orderId = order.orderId;
        const currentStatus = order.orderStatus;
        const lastStatus = lastKnownStatuses.get(orderId);
        
        if (lastStatus && lastStatus !== currentStatus) {
            updatedOrders.push({
                orderId,
                oldStatus: lastStatus,
                newStatus: currentStatus,
                order
            });
            
            // Check if we should send invoice for this status change
            checkForInvoiceTriggers(orderId, lastStatus, currentStatus);
        }
        
        // Update the stored status
        lastKnownStatuses.set(orderId, currentStatus);
    });
    
    return updatedOrders;
}

// Function to initialize known statuses
function initializeKnownStatuses(orders) {
    orders.forEach(order => {
        lastKnownStatuses.set(order.orderId, order.orderStatus);
    });
}

async function loadOrders() {
    loadingSpinner.style.display = 'block';
    ordersContainer.innerHTML = '';
    noOrdersMessage.style.display = 'none';
    if (!userId) {
        loadingSpinner.style.display = 'none';
        ordersContainer.innerHTML = '<div class="alert alert-warning">You must be logged in to view your orders.</div>';
        return;
    }
    const orders = await fetchOrdersByUser(userId);
    
    // Initialize known statuses on first load
    if (!pollingInterval && orders.length > 0) {
        initializeKnownStatuses(orders);
        startOrderStatusPolling();
    }
    
    loadingSpinner.style.display = 'none';
    renderOrders(orders);
}

// Function to start polling for order status updates
function startOrderStatusPolling() {
    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Poll every 30 seconds (30000ms)
    pollingInterval = setInterval(async () => {
        await checkForOrderUpdates();
    }, 30000);
    
    console.log('Started order status polling on orders page (30-second intervals)');
}

// Function to get status badge class (similar to profile page)
function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'delivered':
            return 'text-success';
        case 'pending':
        case 'processing':
            return 'text-warning';
        case 'cancelled':
            return 'text-danger';
        case 'shipped':
            return 'text-info';
        default:
            return 'text-secondary';
    }
}

// Function to update individual status elements without full reload
function updateStatusElements(statusUpdates) {
    statusUpdates.forEach(update => {
        const statusElement = document.querySelector(`.order-status[data-order-id="${update.orderId}"]`);
        if (statusElement) {
            console.log(`Updating status for order ${update.orderId}: ${update.oldStatus} → ${update.newStatus}`);
            
            // Update the text
            statusElement.textContent = update.newStatus;
            
            // Remove old status classes
            statusElement.className = statusElement.className.replace(/text-\w+/g, '');
            statusElement.classList.add('order-status');
            
            // Add new status class
            statusElement.classList.add(getStatusBadgeClass(update.newStatus));
            
            console.log(`Status updated with class: ${getStatusBadgeClass(update.newStatus)}`);
        } else {
            console.log(`No status element found for order ${update.orderId}, will do full refresh`);
        }
    });
}

// Function to check for order updates and refresh display if needed
async function checkForOrderUpdates() {
    try {
        const orders = await fetchOrdersByUser(userId);
        const statusUpdates = checkForStatusUpdates(orders);
        
        if (statusUpdates.length > 0) {
            console.log('Order status updates detected:', statusUpdates);
            
            // Show notification to user about status changes
            showStatusChangeNotification(statusUpdates);
            
            // Try to update individual status elements first
            updateStatusElements(statusUpdates);
            
            // Also refresh the orders display to ensure consistency
            // but do it after a small delay to avoid flicker
            setTimeout(async () => {
                await loadOrders();
            }, 1000);
        }
    } catch (error) {
        console.error('Error checking for order updates:', error);
    }
}

// Function to show notification about status changes
function showStatusChangeNotification(statusUpdates) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 400px;';
    
    const updateText = statusUpdates.map(update => 
        `Order #${update.orderId}: ${update.oldStatus} → ${update.newStatus}`
    ).join('<br>');
    
    notification.innerHTML = `
        <strong>Order Status Updated!</strong><br>
        ${updateText}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

document.addEventListener('DOMContentLoaded', loadOrders);

// Review Modal Functions
let currentBookId = null;
let currentOrderItemId = null;

function openReviewModal(bookId, bookTitle, orderItemId) {
    currentBookId = bookId;
    currentOrderItemId = orderItemId;
    
    // Update modal title
    document.getElementById('reviewModalLabel').textContent = `Review: ${bookTitle}`;
    
    // Reset form
    document.getElementById('reviewForm').reset();
    resetStarRating();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

function resetStarRating() {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach(star => star.classList.remove('active'));
    document.getElementById('rating').value = '';
}

function setRating(rating) {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    document.getElementById('rating').value = rating;
}

async function submitReview() {
    const rating = document.getElementById('rating').value;
    const reviewText = document.getElementById('reviewText').value;
    
    if (!rating) {
        showErrorModal('Please select a rating');
        return;
    }
    
    if (!reviewText.trim()) {
        showErrorModal('Please write a review');
        return;
    }
    
    try {
        const userId = localStorage.getItem('booklifyUserId');
        
        // Validate required data
        if (!userId) {
            showErrorModal('User not logged in. Please log in again.');
            return;
        }
        
        if (!currentBookId) {
            showErrorModal('Book information is missing. Please try again.');
            return;
        }
        
        const reviewData = {
            bookId: currentBookId,
            rating: parseInt(rating),
            comment: reviewText.trim(),
            userId: parseInt(userId),
            orderItemId: currentOrderItemId
        };
        
        const result = await ReviewService.createReview(reviewData);
        
        if (result && result.reviewID) {
            showSuccessModal('Review submitted successfully!');
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            modal.hide();
            
            // Refresh orders to update UI (remove review button if needed)
            setTimeout(async () => {
                await loadOrders();
            }, 1000);
        } else {
            showErrorModal('Failed to submit review. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        console.error('Review data that was sent:', {
            bookId: currentBookId,
            rating: parseInt(rating),
            comment: reviewText.trim(),
            userId: parseInt(userId),
            orderItemId: currentOrderItemId
        });
        
        if (error.message.includes('already reviewed') || error.message.includes('duplicate')) {
            showErrorModal('You have already reviewed this book for this order.');
        } else if (error.message.includes('token') || error.message.includes('authorization')) {
            showErrorModal('Authentication error. Please log in again.');
        } else {
            showErrorModal(`Failed to submit review: ${error.message || 'Please try again.'}`);
        }
    }
}

function showSuccessModal(message) {
    const modalHtml = `
        <div class="modal fade" id="successModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Success</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('successModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('successModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function showErrorModal(message) {
    const modalHtml = `
        <div class="modal fade" id="errorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">Error</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('errorModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('errorModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Invoice Generation Functions
async function generateInvoice(orderId) {
    try {
        // Show loading state
        showToast('info', 'Generating invoice...');
        
        // Get user information with fallback
        const userId = localStorage.getItem('booklifyUserId');
        let userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
        
        // Provide fallback user data if not available
        if (!userData || Object.keys(userData).length === 0) {
            userData = {
                id: userId,
                userId: userId,
                fullName: 'Customer',
                name: 'Customer',
                email: 'customer@example.com'
            };
            console.warn('User data not found in localStorage, using fallback data');
        }
        
        console.log('Using user data for invoice:', userData);
        
        // Generate and display invoice
        await InvoiceService.generateAndDisplayInvoice(orderId, userData);
        
        showToast('success', 'Invoice generated successfully!');
        
    } catch (error) {
        console.error('Error generating invoice:', error);
        showToast('error', 'Failed to generate invoice. Please try again.');
    }
}

// Function to manually update address for an order (for debugging/fixing purposes)
async function updateOrderAddress(orderId, newAddress) {
    const addressData = {
        orderId: orderId,
        deliveryAddress: newAddress,
        timestamp: new Date().toISOString(),
        manualUpdate: true
    };
    
    localStorage.setItem(`orderAddress_${orderId}`, JSON.stringify(addressData));
    console.log('✅ Manually updated address for order', orderId, ':', newAddress);
    alert(`Address updated for order ${orderId}. Regenerate the invoice to see the change.`);
}

// Make function available globally for console access
window.updateOrderAddress = updateOrderAddress;

// Function to show toast notifications
function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toastTypes = {
        success: { class: 'bg-success', icon: 'bi-check-circle-fill' },
        error: { class: 'bg-danger', icon: 'bi-x-circle-fill' },
        warning: { class: 'bg-warning', icon: 'bi-exclamation-triangle-fill' },
        info: { class: 'bg-info', icon: 'bi-info-circle-fill' }
    };
    
    const toastType = toastTypes[type] || toastTypes.success;
    
    const toastHtml = `
        <div id="${toastId}" class="toast text-white ${toastType.class}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${toastType.icon} me-2"></i>
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

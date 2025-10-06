// profile.js - Handles user profile and recent orders
import { getOrdersByUserId, checkForStatusUpdates, initializeKnownStatuses } from './orderService.js';

// Function to fetch order items for a specific order
async function fetchOrderItemsByOrder(orderId) {
    try {
        const response = await fetch(`http://localhost:8081/api/orderItems/getByOrderId/${orderId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching order items:', error);
        return [];
    }
}

let userIdGlobal = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('booklifyUserId');
    const token = localStorage.getItem('booklifyToken');
    
    console.log('Retrieved userId from localStorage:', userId);
    console.log('Auth token available:', !!token);
    
    if (!userId) {
        console.error('No user ID found in localStorage');
        window.location.href = 'login.html';
        return;
    }
    
    if (!token) {
        console.error('No authentication token found in localStorage');
        window.location.href = 'login.html';
        return;
    }

    // Clean the userId (remove any extra characters)
    const cleanUserId = userId.toString().trim();
    console.log('Clean userId:', cleanUserId);
    userIdGlobal = cleanUserId;

    // Load recent orders initially
    await loadOrders(cleanUserId);
    
    // Start polling for order status updates every 30 seconds
    startOrderStatusPolling(cleanUserId);
});

async function loadOrders(userId) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) {
        console.error('Orders list element not found');
        return;
    }

    // Show loading state
    ordersList.innerHTML = '<div class="list-group-item text-center text-muted">Loading orders...</div>';

    try {
        console.log('Loading orders for user:', userId);
        const orders = await getOrdersByUserId(userId);
        console.log('Received orders:', orders);
        
        if (!orders || orders.length === 0) {
            ordersList.innerHTML = '<div class="list-group-item text-center text-muted">No orders yet.</div>';
        } else {
            // Initialize known statuses for polling (only do this once)
            if (!pollingInterval) {
                await initializeKnownStatuses(orders);
            }
            
            ordersList.innerHTML = '';
            // Sort orders by date descending (newest first) and show only the 2 most recent
            const sortedOrders = orders.sort((a, b) => {
                const dateA = new Date(a.orderDate || a.createdAt || 0);
                const dateB = new Date(b.orderDate || b.createdAt || 0);
                return dateB - dateA; // Descending order (newest first)
            });
            const recentOrders = sortedOrders.slice(0, 2);
            console.log('Showing latest 2 orders:', recentOrders);
            // Process each order and fetch its items to get the actual status
            for (const order of recentOrders) {
                console.log('Full order object:', order);
                console.log('Processing order:', order.orderId);
                console.log('Available order fields:', Object.keys(order));
                
                const orderDiv = document.createElement('div');
                orderDiv.className = 'list-group-item';
                
                // Create initial HTML with placeholder status
                orderDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div><strong>Order #${order.orderId}</strong> 
                                <span class="badge bg-secondary text-white ms-2" data-order-id="${order.orderId}" data-status-badge="true">Loading...</span>
                            </div>
                            <div class="small text-muted">${order.orderDate ? new Date(order.orderDate).toLocaleString() : ''}</div>
                            <div class="small text-muted">
                                ${(order.orderItems || []).length} item(s) • R${order.totalAmount?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div class="text-end">
                            <a href="orders.html" class="btn btn-sm btn-outline-purple me-2">View Details</a>
                            <button class="btn btn-sm btn-outline-warning" id="reviewBtn-${order.orderId}" onclick="checkOrderForReviews(${order.orderId})" style="display: none;">
                                <i class="bi bi-star"></i> Review
                            </button>
                        </div>
                    </div>
                `;
                ordersList.appendChild(orderDiv);
                
                // Fetch order items to get the actual status
                const orderItems = await fetchOrderItemsByOrder(order.orderId);
                console.log('Order items for order', order.orderId, ':', orderItems);
                
                const statusBadge = orderDiv.querySelector(`[data-order-id="${order.orderId}"][data-status-badge="true"]`);
                const reviewBtn = orderDiv.querySelector(`#reviewBtn-${order.orderId}`);
                
                if (orderItems && orderItems.length > 0 && statusBadge) {
                    const actualStatus = orderItems[0].orderStatus || 'Pending';
                    console.log('Actual status for order', order.orderId, ':', actualStatus);
                    
                    // Update the badge with actual status
                    statusBadge.textContent = actualStatus;
                    statusBadge.className = 'badge ms-2';
                    const badgeClasses = getStatusBadgeClass(actualStatus).split(' ');
                    badgeClasses.forEach(cls => statusBadge.classList.add(cls));
                    statusBadge.setAttribute('data-status-badge', 'true');
                    statusBadge.setAttribute('data-order-id', order.orderId);
                    
                    // Show review button if any item is delivered
                    const hasDeliveredItems = orderItems.some(item => 
                        item.orderStatus && item.orderStatus.toUpperCase() === 'DELIVERED'
                    );
                    
                    if (hasDeliveredItems && reviewBtn) {
                        reviewBtn.style.display = 'inline-block';
                    }
                    
                    console.log('Updated badge for order', order.orderId, 'with classes:', statusBadge.className);
                } else if (statusBadge) {
                    statusBadge.textContent = 'Pending';
                    statusBadge.className = 'badge bg-warning text-dark ms-2';
                    statusBadge.setAttribute('data-status-badge', 'true');
                    statusBadge.setAttribute('data-order-id', order.orderId);
                }
            }

            if (orders.length > 2) {
                const moreDiv = document.createElement('div');
                moreDiv.className = 'list-group-item text-center';
                moreDiv.innerHTML = `
                    <a href="orders.html" class="btn btn-purple">
                        View All ${orders.length} Orders
                    </a>
                `;
                ordersList.appendChild(moreDiv);
            }
        }
    } catch (err) {
        console.error('Error in loadOrders:', err);
        ordersList.innerHTML = `
            <div class="list-group-item text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load orders. ${err.message || 'Please try again later.'}
            </div>
        `;
    }
}

function getStatusBadgeClass(status) {
    console.log('Getting badge class for status:', status);
    const lowerStatus = status?.toLowerCase();
    console.log('Lowercase status:', lowerStatus);
    
    let badgeClass;
    switch (lowerStatus) {
        case 'completed':
        case 'delivered':
            badgeClass = 'bg-success text-white';
            break;
        case 'pending':
        case 'processing':
            badgeClass = 'bg-warning text-dark';
            break;
        case 'shipped':
            badgeClass = 'bg-info text-white';
            break;
        case 'cancelled':
            badgeClass = 'bg-danger text-white';
            break;
        default:
            badgeClass = 'bg-secondary text-white';
    }
    
    console.log('Returning badge class:', badgeClass);
    return badgeClass;
}

// Function to start polling for order status updates
function startOrderStatusPolling(userId) {
    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Poll every 30 seconds (30000ms)
    pollingInterval = setInterval(async () => {
        await checkForOrderUpdates(userId);
    }, 30000);
    
    console.log('Started order status polling (30-second intervals)');
}

// Function to update individual status badges without full reload
function updateStatusBadges(statusUpdates) {
    statusUpdates.forEach(update => {
        const badge = document.querySelector(`[data-order-id="${update.orderId}"][data-status-badge="true"]`);
        if (badge) {
            console.log(`Updating badge for order ${update.orderId}: ${update.oldStatus} → ${update.newStatus}`);
            
            // Update the text
            badge.textContent = update.newStatus;
            
            // Remove all existing background and text color classes
            badge.className = badge.className.replace(/bg-\w+|text-\w+/g, '');
            
            // Ensure we keep the base badge and spacing classes
            badge.classList.add('badge', 'ms-2');
            
            // Add new status classes
            const newClasses = getStatusBadgeClass(update.newStatus).split(' ');
            newClasses.forEach(cls => badge.classList.add(cls));
            
            console.log(`Badge updated with classes: ${badge.className}`);
        } else {
            console.log(`No badge found for order ${update.orderId}, will do full refresh`);
        }
    });
}

// Function to check for order updates and refresh display if needed
async function checkForOrderUpdates(userId) {
    try {
        const orders = await getOrdersByUserId(userId);
        const statusUpdates = await checkForStatusUpdates(orders);
        
        if (statusUpdates.length > 0) {
            console.log('Order status updates detected:', statusUpdates);
            
            // Show notification to user about status changes
            showStatusChangeNotification(statusUpdates);
            
            // Try to update individual badges first
            updateStatusBadges(statusUpdates);
            
            // Also refresh the orders display to ensure consistency
            // but do it after a small delay to avoid flicker
            setTimeout(async () => {
                await loadOrders(userId);
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

// Test function to manually check badge colors (for debugging)
window.testBadgeColors = function() {
    const testStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    testStatuses.forEach(status => {
        console.log(`Status: ${status} -> Class: ${getStatusBadgeClass(status)}`);
    });
    
    // Also check current badges on the page
    const badges = document.querySelectorAll('[data-status-badge="true"]');
    console.log('Current badges on page:', badges.length);
    badges.forEach((badge, index) => {
        console.log(`Badge ${index}: Text="${badge.textContent}", Classes="${badge.className}"`);
    });
};

// Review functionality using the same structure as product details
window.checkOrderForReviews = async function(orderId) {
    try {
        // Get delivered items for this order
        const orderItems = await fetchOrderItemsByOrder(orderId);
        const deliveredItems = orderItems.filter(item => 
            item.orderStatus && item.orderStatus.toUpperCase() === 'DELIVERED'
        );
        
        if (deliveredItems.length === 0) {
            showNotification('No delivered items found for review.', 'info');
            return;
        }
        
        if (deliveredItems.length === 1) {
            // If only one item, show review modal directly
            const item = deliveredItems[0];
            showReviewModal(item.book.bookID, item.book.title);
        } else {
            // If multiple items, show selection modal
            showItemSelectionModal(deliveredItems);
        }
    } catch (error) {
        console.error('Error checking order for reviews:', error);
        showNotification('Failed to load order items. Please try again.', 'error');
    }
};

function showItemSelectionModal(deliveredItems) {
    let modal = document.getElementById('itemSelectionModal');
    
    if (!modal) {
        modal = createItemSelectionModal();
        document.body.appendChild(modal);
    }
    
    const itemsList = modal.querySelector('#deliveredItemsList');
    itemsList.innerHTML = '';
    
    deliveredItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-group-item d-flex justify-content-between align-items-center';
        itemDiv.innerHTML = `
            <div>
                <strong>${item.book ? item.book.title : 'Unknown Book'}</strong>
                <div class="small text-muted">Qty: ${item.quantity} • R${item.price || '0.00'}</div>
            </div>
            <button class="btn btn-sm btn-warning" onclick="showReviewModal(${item.book ? item.book.bookID : 'null'}, '${item.book ? item.book.title : 'Book'}')">
                <i class="bi bi-star"></i> Review
            </button>
        `;
        itemsList.appendChild(itemDiv);
    });
    
    new bootstrap.Modal(modal).show();
}

function createItemSelectionModal() {
    const modal = document.createElement('div');
    modal.classList.add('modal', 'fade');
    modal.id = 'itemSelectionModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Select Item to Review</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Select which book you'd like to review:</p>
                    <div id="deliveredItemsList" class="list-group">
                        <!-- Items will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    return modal;
}

window.showReviewModal = function(bookId, bookTitle, review = null) {
    let modal = document.getElementById('reviewModal');

    if (!modal) {
        modal = createReviewModal();
        document.body.appendChild(modal);
    }

    setupReviewModal(modal, bookId, bookTitle, review);
    new bootstrap.Modal(modal).show();
};

function createReviewModal() {
    const modal = document.createElement('div');
    modal.classList.add('modal', 'fade');
    modal.id = 'reviewModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="reviewModalTitle">Write a Review</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="reviewForm">
                        <div class="mb-3">
                            <label for="reviewerName" class="form-label">Your Name</label>
                            <input type="text" class="form-control" id="reviewerName" placeholder="Enter your name">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Rating</label>
                            <select class="form-select" id="reviewRating" required>
                                <option value="" disabled selected>Select rating</option>
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Terrible</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Comment</label>
                            <textarea class="form-control" id="reviewComment" rows="3" placeholder="Write your review here..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary w-100" id="reviewSubmitBtn">Submit Review</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function setupReviewModal(modal, bookId, bookTitle, review) {
    const form = modal.querySelector('#reviewForm');
    const title = modal.querySelector('#reviewModalTitle');
    const submitBtn = modal.querySelector('#reviewSubmitBtn');
    const reviewerInput = modal.querySelector('#reviewerName');
    const ratingInput = modal.querySelector('#reviewRating');
    const commentInput = modal.querySelector('#reviewComment');

    // Update modal title and button text
    const isEditing = review && (review.reviewId || review.reviewID);
    title.textContent = isEditing ? 'Edit Review' : `Write a Review for: ${bookTitle}`;
    submitBtn.textContent = isEditing ? 'Update Review' : 'Submit Review';

    // Prefill form if editing
    if (isEditing) {
        reviewerInput.value = review.tempName || review.user?.name || '';
        ratingInput.value = review.reviewRating;
        commentInput.value = review.reviewComment;
    } else {
        form.reset();
    }

    // Setup form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        await handleReviewSubmission(form, bookId, review);
    };
}

async function handleReviewSubmission(form, bookId, review) {
    const userId = localStorage.getItem('booklifyUserId');
    if (!userId) {
        showNotification('Please log in to submit a review.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    const formData = getReviewFormData(form);
    if (!validateReviewForm(formData)) {
        return;
    }

    const reviewData = {
        reviewRating: formData.rating,
        reviewComment: formData.comment,
        reviewDate: new Date().toISOString().split('T')[0],
        user: { id: parseInt(userId) },
        book: { bookID: parseInt(bookId) }
    };

    try {
        await submitReview(reviewData, review);
        closeReviewModal();
        showNotification('Review submitted successfully!', 'success');
        // Optionally refresh the orders display
        await loadOrders(userIdGlobal);
    } catch (error) {
        console.error('Failed to submit review:', error);
        showNotification('Failed to submit review: ' + error.message, 'error');
    }
}

function getReviewFormData(form) {
    return {
        name: form.querySelector('#reviewerName').value.trim() || 'Anonymous',
        rating: parseInt(form.querySelector('#reviewRating').value),
        comment: form.querySelector('#reviewComment').value.trim()
    };
}

function validateReviewForm(formData) {
    if (!formData.comment || !formData.rating) {
        showNotification('Please fill in all required fields (rating and comment).', 'error');
        return false;
    }
    return true;
}

async function submitReview(reviewData, existingReview) {
    const isEditing = existingReview && (existingReview.reviewId || existingReview.reviewID);
    const reviewId = existingReview?.reviewId || existingReview?.reviewID;
    const url = isEditing
        ? `http://localhost:8081/reviews/update/${reviewId}`
        : 'http://localhost:8081/reviews/create';
    const method = isEditing ? 'PUT' : 'POST';

    const token = localStorage.getItem('booklifyToken');
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to ${isEditing ? 'update' : 'create'} review`);
    }

    return response;
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    const selectionModal = document.getElementById('itemSelectionModal');
    if (selectionModal) {
        const bsSelectionModal = bootstrap.Modal.getInstance(selectionModal);
        if (bsSelectionModal) {
            bsSelectionModal.hide();
        }
    }
}

//Show notification toast
function showNotification(message, type = 'info') {
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



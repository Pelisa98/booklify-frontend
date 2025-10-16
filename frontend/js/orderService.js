// orderService.js
// Handles API calls for order endpoints

const ORDER_API_BASE = 'http://localhost:8081/api/orders';

export async function createOrder(order) {
    const response = await fetch(`${ORDER_API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    });
    if (!response.ok) {
        // Try to extract body for better diagnostics
        let bodyText = '';
        try {
            bodyText = await response.text();
        } catch (e) {
            bodyText = '<no response body>';
        }
        throw new Error(`Order creation failed: ${response.status} ${response.statusText} - ${bodyText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    // Unexpected content type
    const text = await response.text();
    throw new Error('Order creation returned non-JSON response: ' + text);
}

// Add more order-related functions as needed

// Store last known order statuses for comparison
let lastKnownStatuses = new Map();

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

// Function to check if order statuses have changed (now gets status from order items)
export async function checkForStatusUpdates(currentOrders) {
    const updatedOrders = [];
    
    for (const order of currentOrders) {
        const orderId = order.orderId;
        
        // Get current status from order items
        const orderItems = await fetchOrderItemsByOrder(orderId);
        const currentStatus = orderItems.length > 0 ? orderItems[0].orderStatus : 'Pending';
        
        const lastStatus = lastKnownStatuses.get(orderId);
        
        if (lastStatus && lastStatus !== currentStatus) {
            updatedOrders.push({
                orderId,
                oldStatus: lastStatus,
                newStatus: currentStatus,
                order
            });
        }
        
        // Update the stored status
        lastKnownStatuses.set(orderId, currentStatus);
    }
    
    return updatedOrders;
}

// Function to initialize known statuses (call once on page load)
export async function initializeKnownStatuses(orders) {
    for (const order of orders) {
        const orderItems = await fetchOrderItemsByOrder(order.orderId);
        const status = orderItems.length > 0 ? orderItems[0].orderStatus : 'Pending';
        lastKnownStatuses.set(order.orderId, status);
    }
}

export async function getOrdersByUserId(userId) {
    try {
        console.log('Fetching orders for userId:', userId);
        
        // Get the authentication token if available
        const token = localStorage.getItem('booklifyToken');
        console.log('Auth token available:', !!token);
        if (token) {
            console.log('Token preview:', token.substring(0, 20) + '...');
        } else {
            console.warn('No authentication token found in localStorage');
        }
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Note: The /getByUserId endpoint may not require authentication
        // Commenting out auth header for testing
        // if (token) {
        //     headers['Authorization'] = `Bearer ${token}`;
        // }
        
        const url = `${ORDER_API_BASE}/getByUserId/${userId}`;
        console.log('Making request to:', url);
        console.log('Request headers:', headers);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        
        const orders = await response.json();
        console.log('Fetched orders:', orders);
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

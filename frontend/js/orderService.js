// orderService.js
// Handles API calls for order endpoints

const ORDER_API_BASE = 'http://localhost:8081/api/orders';

export async function createOrder(order) {
    const response = await fetch(`${ORDER_API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Order creation failed');
    return response.json();
}

// Add more order-related functions as needed

export async function getOrdersByUserId(userId) {
    try {
        const response = await fetch(`${ORDER_API_BASE}/user/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

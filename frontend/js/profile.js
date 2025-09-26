// profile.js - Handles user profile, purchase history, and orders
import { getOrdersByUserId } from './orderService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('booklifyUserId');
    if (!userId) return;

    // Load purchase history
    await loadPurchaseHistory(userId);

    // Load orders
    await loadOrders(userId);
});

async function loadPurchaseHistory(userId) {
    const purchasesList = document.getElementById('purchasesList');
    const purchaseCount = document.getElementById('purchaseCount');
    if (!purchasesList || !purchaseCount) return;

    try {
        const orders = await getOrdersByUserId(userId);
        purchaseCount.textContent = orders.length;
        if (orders.length === 0) {
            purchasesList.innerHTML = '<div class="list-group-item text-center text-muted">No purchases yet.</div>';
        } else {
            purchasesList.innerHTML = '';
            orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'list-group-item';
                orderDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div><strong>Order #${order.orderId}</strong> <span class="badge bg-secondary ms-2">${order.orderStatus || ''}</span></div>
                            <div class="small text-muted">${order.orderDate ? new Date(order.orderDate).toLocaleString() : ''}</div>
                            <ul class="mb-1">
                                ${(order.orderItems || []).map(item => `<li>${item.quantity} x ${item.book?.title || 'Book'}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">R${order.totalAmount?.toFixed(2) || '0.00'}</div>
                        </div>
                    </div>
                `;
                purchasesList.appendChild(orderDiv);
            });
        }
    } catch (err) {
        purchasesList.innerHTML = '<div class="list-group-item text-danger">Failed to load purchase history.</div>';
    }
}

async function loadOrders(userId) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    try {
        const orders = await getOrdersByUserId(userId);
        if (orders.length === 0) {
            ordersList.innerHTML = '<div class="list-group-item text-center text-muted">No orders yet.</div>';
        } else {
            ordersList.innerHTML = '';
            // Show only the 3 most recent orders
            const recentOrders = orders.slice(0, 3);
            recentOrders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'list-group-item';
                orderDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div><strong>Order #${order.orderId}</strong> 
                                <span class="badge ${getStatusBadgeClass(order.orderStatus)} ms-2">${order.orderStatus || 'Pending'}</span>
                            </div>
                            <div class="small text-muted">${order.orderDate ? new Date(order.orderDate).toLocaleString() : ''}</div>
                            <div class="small text-muted">
                                ${(order.orderItems || []).length} item(s) • R${order.totalAmount?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div class="text-end">
                            <a href="orders.html" class="btn btn-sm btn-outline-purple">View Details</a>
                        </div>
                    </div>
                `;
                ordersList.appendChild(orderDiv);
            });

            if (orders.length > 3) {
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
        ordersList.innerHTML = '<div class="list-group-item text-danger">Failed to load orders.</div>';
    }
}

function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'delivered':
            return 'bg-success';
        case 'pending':
        case 'processing':
            return 'bg-warning';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

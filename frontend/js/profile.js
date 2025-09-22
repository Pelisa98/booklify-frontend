// profile.js - Handles user profile and purchase history
import { getOrdersByUserId } from './orderService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('booklifyUserId');
    if (!userId) return;
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
});

// ordersPage.js - Fetch and display orders and order items for the logged-in user

const ORDERS_API_BASE_URL = 'http://localhost:8081/api/orders';
const ORDER_ITEMS_API_BASE_URL = 'http://localhost:8081/api/orderItems';

const userId = localStorage.getItem('booklifyUserId');
const ordersContainer = document.getElementById('ordersContainer');
const noOrdersMessage = document.getElementById('noOrdersMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

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
                <div class="mb-2"><strong>Status:</strong> ${order.orderStatus || 'N/A'}</div>
                <div class="mb-2"><strong>Total:</strong> R${order.totalAmount || '0.00'}</div>
                <div class="mb-2"><strong>Order Items:</strong></div>
                <ul class="list-group order-items-list mb-2" id="order-items-${order.orderId}">
                    <li class="list-group-item">Loading items...</li>
                </ul>
            </div>
        `;
        ordersContainer.appendChild(orderCard);
        // Fetch and render order items
        const items = await fetchOrderItemsByOrder(order.orderId);
        const itemsList = orderCard.querySelector(`#order-items-${order.orderId}`);
        if (items && items.length > 0) {
            itemsList.innerHTML = '';
            items.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.className = 'list-group-item';
                itemLi.innerHTML = `<strong>${item.book ? item.book.title : 'Book'}</strong> x${item.quantity} <span class="float-end">R${item.price || '0.00'}</span>`;
                itemsList.appendChild(itemLi);
            });
        } else {
            itemsList.innerHTML = '<li class="list-group-item text-muted">No items found for this order.</li>';
        }
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
    loadingSpinner.style.display = 'none';
    renderOrders(orders);
}

document.addEventListener('DOMContentLoaded', loadOrders);

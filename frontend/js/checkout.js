// checkout.js - Dynamically loads cart items for order summary
import { CartService } from './cartService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('booklifyUserId');
    const orderSummaryList = document.querySelector('.order-summary-list');
    const totalElem = document.querySelector('.order-summary-total');

    if (!userId || !orderSummaryList || !totalElem) return;

    let cart = await CartService.getCartByUserId(userId);
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        orderSummaryList.innerHTML = '<li class="list-group-item text-center">Your cart is empty.</li>';
        totalElem.textContent = 'R0.00';
        return;
    }

    let total = 0;
    orderSummaryList.innerHTML = '';
    cart.cartItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `${item.book.title} <span>R${item.book.price}</span>`;
        orderSummaryList.appendChild(li);
        total += item.book.price * item.quantity;
    });
    totalElem.textContent = `R${total.toFixed(2)}`;
});

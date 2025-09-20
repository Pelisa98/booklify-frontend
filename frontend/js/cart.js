// cart.js - Handles cart UI and connects to cartService
import { CartService } from './cartService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('booklifyUserId');
    const cartTableBody = document.querySelector('table tbody');
    const subtotalElem = document.querySelector('.fw-bold .text-purple');

    if (!userId) {
        cartTableBody.innerHTML = '<tr><td colspan="5" class="text-center">You must be logged in to view your cart.</td></tr>';
        return;
    }

    let cart = await CartService.getCartByUserId(userId);
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Your cart is empty.</td></tr>';
        subtotalElem.textContent = 'R0.00';
        return;
    }

    let subtotal = 0;
    cartTableBody.innerHTML = '';
    cart.cartItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="../assets/images/book${item.book.bookID || 1}.jpg" alt="Book" class="img-thumbnail" style="width: 60px;"></td>
            <td>${item.book.title}</td>
            <td>R${item.book.price}</td>
            <td><input type="number" value="${item.quantity}" min="1" class="form-control form-control-sm cart-qty-input" data-book-id="${item.book.bookID}" data-cart-id="${cart.cartId}"></td>
            <td><button class="btn btn-sm btn-danger remove-cart-item-btn" data-book-id="${item.book.bookID}" data-cart-id="${cart.cartId}">Remove</button></td>
        `;
        cartTableBody.appendChild(row);
        subtotal += item.book.price * item.quantity;
    });
    subtotalElem.textContent = `R${subtotal.toFixed(2)}`;

    // Quantity change handler
    cartTableBody.addEventListener('change', async (e) => {
        if (e.target.classList.contains('cart-qty-input')) {
            const bookId = e.target.getAttribute('data-book-id');
            const cartId = e.target.getAttribute('data-cart-id');
            const newQty = parseInt(e.target.value, 10);
            try {
                await CartService.updateCartItemsQuantity(cartId, bookId, newQty);
                location.reload();
            } catch (err) {
                alert('Failed to update quantity.');
            }
        }
    });

    // Remove item handler
    cartTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('remove-cart-item-btn')) {
            const bookId = e.target.getAttribute('data-book-id');
            const cartId = e.target.getAttribute('data-cart-id');
            try {
                await CartService.updateCartItemsQuantity(cartId, bookId, 0);
                location.reload();
            } catch (err) {
                alert('Failed to remove item.');
            }
        }
    });
});

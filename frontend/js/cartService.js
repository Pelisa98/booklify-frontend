// cartService.js - Handles cart API calls to backend


const CART_API_BASE = 'http://localhost:8081/api/cart';

function getAuthHeaders(contentType = true) {
    const token = localStorage.getItem('booklifyToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (contentType) headers['Content-Type'] = 'application/json';
    return headers;
}

export const CartService = {

    async createCart(userId) {
        // Use CartCreateDto: { regularUserId }
        const cartCreateDto = {
            regularUserId: userId
        };
        const res = await fetch(`${CART_API_BASE}/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(cartCreateDto)
        });
        if (!res.ok) throw new Error('Failed to create cart');
        return await res.text();
    },


    async getCartById(id) {
        const res = await fetch(`${CART_API_BASE}/getById/${id}`, {
            headers: getAuthHeaders(false)
        });
        if (!res.ok) return null;
        return await res.json();
    },


    async getCartByUserId(userId) {
        const res = await fetch(`${CART_API_BASE}/getByUserId/${userId}`, {
            headers: getAuthHeaders(false)
        });
        if (!res.ok) return null;
        return await res.json();
    },


    async updateCart(cart) {
        const res = await fetch(`${CART_API_BASE}/update`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(cart)
        });
        if (!res.ok) throw new Error('Failed to update cart');
        return await res.text();
    },


    async updateCartItemsQuantity(cartId, bookId, quantity) {
        const res = await fetch(`${CART_API_BASE}/updateCartItemsQuantity/${cartId}/${bookId}/${quantity}`, {
            method: 'PUT',
            headers: getAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to update cart item quantity');
        return await res.text();
    },

    async clearCart(cartId) {
        const res = await fetch(`${CART_API_BASE}/clear/${cartId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to clear cart');
        return await res.text();
    }
};



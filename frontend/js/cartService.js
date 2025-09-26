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
        console.log('Creating cart with DTO:', cartCreateDto);
        const res = await fetch(`${CART_API_BASE}/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(cartCreateDto)
        });
        console.log('Create cart response status:', res.status);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Create cart error:', errorText);
            throw new Error('Failed to create cart: ' + errorText);
        }
        const result = await res.json();
        console.log('Created cart result:', result);
        // Update localStorage cart
        this.updateLocalStorageCart(result);
        return result;
    },


    async getCartById(id) {
        const res = await fetch(`${CART_API_BASE}/getById/${id}`, {
            headers: getAuthHeaders(false)
        });
        if (!res.ok) return null;
        return await res.json();
    },


    async getCartByUserId(userId) {
        console.log('Getting cart for user ID:', userId);
        const res = await fetch(`${CART_API_BASE}/getByUserId/${userId}`, {
            headers: getAuthHeaders(false)
        });
        console.log('Get cart by user ID response status:', res.status);
        if (!res.ok) {
            if (res.status === 404) {
                console.log('No cart found for user');
                return null;
            }
            const errorText = await res.text();
            console.error('Get cart by user ID error:', errorText);
            throw new Error('Failed to get cart: ' + errorText);
        }
        const result = await res.json();
        console.log('Cart result:', result);
        // Update localStorage cart
        this.updateLocalStorageCart(result);
        return result;
    },


    async updateCart(cart) {
        console.log('Updating cart:', cart);
        const res = await fetch(`${CART_API_BASE}/update`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(cart)
        });
        console.log('Update cart response status:', res.status);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Update cart error:', errorText);
            throw new Error('Failed to update cart: ' + errorText);
        }
        const result = await res.text();
        console.log('Update cart result:', result);
        // Update localStorage cart
        this.updateLocalStorageCart(cart);
        return result;
    },


    async updateCartItemsQuantity(cartId, bookId, quantity) {
        console.log('Updating cart item quantity:', { cartId, bookId, quantity });
        const res = await fetch(`${CART_API_BASE}/updateCartItemsQuantity/${cartId}/${bookId}/${quantity}`, {
            method: 'PUT',
            headers: getAuthHeaders(false)
        });
        console.log('Update cart item quantity response status:', res.status);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Update cart item quantity error:', errorText);
            throw new Error('Failed to update cart item quantity: ' + errorText);
        }
        const result = await res.text();
        console.log('Update cart item quantity result:', result);
        // Refresh cart from server to update localStorage
        const userId = localStorage.getItem('booklifyUserId');
        if (userId) {
            await this.getCartByUserId(userId);
        }
        return result;
    },

    async clearCart(cartId) {
        const res = await fetch(`${CART_API_BASE}/clear/${cartId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to clear cart');
        // Clear localStorage cart
        localStorage.removeItem('booklifyCart');
        return await res.text();
    },

    // Helper method to update localStorage cart
    updateLocalStorageCart(cart) {
        if (cart && cart.cartItems) {
            const cartItems = cart.cartItems.map(item => ({
                bookId: item.book.bookID,
                title: item.book.title,
                price: item.book.price,
                quantity: item.quantity
            }));
            localStorage.setItem('booklifyCart', JSON.stringify(cartItems));
            console.log('Updated localStorage cart:', cartItems);
        }
    }
};



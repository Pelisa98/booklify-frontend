// payment.js
// Handles payment form submission and API integration
import { createPayment } from './paymentService.js';
import { CartService } from './cartService.js';
import { createAddress } from './addressService.js';
import { createOrder } from './orderService.js';

// Example: Attach to a payment button or form submission

// Handles payment submission: fetches cart/order, calls backend, and shows result
export async function handlePaymentSubmission(userId, paymentMethod) {
    try {
        // 1. Try to fetch existing address for the user
        let addressId;
        let existingAddress = null;
        try {
            const res = await fetch(`http://localhost:8081/api/addresses/user/${userId}`);
            if (res.ok) existingAddress = await res.json();
        } catch (e) {}

        if (existingAddress) {
            addressId = existingAddress.id;
        } else {
            // Collect address fields from the form and create new address
            const address = {
                street: document.getElementById('checkoutAddress').value,
                suburb: document.getElementById('checkoutSuburb').value,
                city: document.getElementById('checkoutCity').value,
                province: document.getElementById('checkoutProvince').value,
                country: document.getElementById('checkoutCountry').value,
                postalCode: document.getElementById('checkoutPostal').value,
                user: { id: userId }
            };
            const savedAddress = await createAddress(address);
            addressId = savedAddress.id;
        }

        // 2. Get the user's cart (or build order items as needed)
        const cart = await CartService.getCartByUserId(userId);
        if (!cart || !cart.cartId) throw new Error('No cart found');

        // 3. Transform cart items to order items and create the order with the address ID (OrderCreateDto structure)
        const orderItems = cart.cartItems.map(item => ({
            bookId: item.book.bookID,
            quantity: item.quantity,
            orderStatus: "PENDING"
        }));
        const orderCreateDto = {
            regularUserId: userId,
            shippingAddressId: addressId,
            orderItems
        };
        const savedOrder = await createOrder(orderCreateDto);

        // 4. Create the payment (using orderId)
        const payment = await createPayment({
            userId,
            orderId: savedOrder.orderId,
            paymentMethod
        });

        alert('Payment successful!');
        // Optionally redirect to confirmation page
        // window.location.href = 'confirmation.html';
        return payment;
    } catch (error) {
        alert('Payment failed: ' + error.message);
        throw error;
    }
}

// Wire up to a button with id 'payButton' (add this button to your payment/checkout page)
document.addEventListener('DOMContentLoaded', () => {
    const payBtn = document.getElementById('payButton');
    if (payBtn) {
        payBtn.addEventListener('click', async () => {
            const userId = localStorage.getItem('booklifyUserId');
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'CARD';
            await handlePaymentSubmission(userId, paymentMethod);
        });
    }
});

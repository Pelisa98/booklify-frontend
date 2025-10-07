// payment.js
// Handles payment form submission and API integration
import { createPayment } from './paymentService.js';
import { CartService } from './cartService.js';
import { createAddress } from './addressService.js';
import { createOrder } from './orderService.js';
import EmailService from './emailService.js';

// Example: Attach to a payment button or form submission

// Handles payment submission: fetches cart/order, calls backend, and shows result
export async function handlePaymentSubmission(userId, paymentMethod, orderAddress = null) {
    try {
        // 1. Always create a new address for this order from the form data
        let addressId;
        let address;
        
        if (orderAddress) {
            // Use provided address data (from checkout form)
            address = orderAddress;
        } else {
            // Collect address fields from the current form
            address = {
                street: document.getElementById('checkoutAddress')?.value || '',
                suburb: document.getElementById('checkoutSuburb')?.value || '',
                city: document.getElementById('checkoutCity')?.value || '',
                province: document.getElementById('checkoutProvince')?.value || '',
                country: document.getElementById('checkoutCountry')?.value || '',
                postalCode: document.getElementById('checkoutPostal')?.value || '',
                user: { id: userId }
            };
        }
        
        // Validate address fields
        if (!address.street || !address.city || !address.province || !address.country || !address.postalCode) {
            throw new Error('Please fill in all required address fields');
        }
        
        // Add timestamp to ensure unique address creation for each order
        address.orderTimestamp = new Date().toISOString();
        address.isOrderSpecific = true;
        
        console.log('Creating new order-specific address:', address);
        const savedAddress = await createAddress(address);
        addressId = savedAddress.id;
        
        console.log('Created address with ID:', addressId, 'for order');

        // 2. Get the user's cart (or build order items as needed)
        const cart = await CartService.getCartByUserId(userId);
        if (!cart || !cart.cartId) throw new Error('No cart found');

        // 3. Transform cart items to order items and create the order with the address ID (OrderCreateDto structure)
        const orderItems = cart.cartItems.map(item => ({
            bookId: item.book.bookID,
            quantity: item.quantity,
            orderStatus: "PENDING"
        }));
        
        // Format delivery address string for order
        const deliveryAddressString = `${address.street}, ${address.suburb}, ${address.city}, ${address.province}, ${address.country}, ${address.postalCode}`;
        
        const orderCreateDto = {
            regularUserId: userId,
            shippingAddressId: addressId,
            deliveryAddress: deliveryAddressString, // Add formatted address to order
            orderItems
        };
        console.log('🛒 Creating order with delivery address:', deliveryAddressString);
        console.log('📤 Order DTO being sent:', JSON.stringify(orderCreateDto, null, 2));
        
        const savedOrder = await createOrder(orderCreateDto);
        console.log('✅ Order created successfully:', savedOrder.orderId);
        console.log('📋 Saved order contains:', JSON.stringify(savedOrder, null, 2));

        // 4. Create the payment (using orderId)
        const payment = await createPayment({
            userId,
            orderId: savedOrder.orderId,
            paymentMethod
        });

        // 5. Store the current order's delivery address for invoice generation
        const orderAddressData = {
            orderId: savedOrder.orderId,
            deliveryAddress: deliveryAddressString,
            timestamp: new Date().toISOString()
        };
        
        console.log('💾 About to store address data:', orderAddressData);
        
        // Store in both sessionStorage and localStorage for persistence
        sessionStorage.setItem('currentOrderAddress', JSON.stringify(orderAddressData));
        localStorage.setItem(`orderAddress_${savedOrder.orderId}`, JSON.stringify(orderAddressData));
        
        console.log('✅ Successfully stored address for order', savedOrder.orderId);
        console.log('📱 Session storage check:', sessionStorage.getItem('currentOrderAddress'));
        console.log('💿 Local storage check:', localStorage.getItem(`orderAddress_${savedOrder.orderId}`));

        // 6. Auto-send invoice email after successful payment
        try {
            const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{}');
            console.log('Sending automatic invoice email for order:', savedOrder.orderId);
            console.log('User data for email:', userData);
            
            // Check if EmailService is available
            if (!window.EmailService) {
                console.error('EmailService not available on window object');
                alert('Payment successful! Your invoice is available in the orders page.');
                return payment;
            }
            
            const emailResult = await EmailService.sendInvoiceAfterPayment(savedOrder.orderId, userData);
            console.log('Email sending result:', emailResult);
            
            if (emailResult && emailResult.success) {
                alert('🎉 Payment successful! Your invoice has been generated and is ready for download. Check the popup window and notifications for details.');
            } else {
                alert('Payment successful! Your invoice is available in the orders page.');
            }
        } catch (emailError) {
            console.error('Failed to send invoice email:', emailError);
            alert('Payment successful! Note: There was an issue sending your invoice email, but you can download it from your orders page.');
        }
        
        // Optionally redirect to confirmation page
        // window.location.href = 'confirmation.html';
        return payment;
    } catch (error) {
        alert('Payment failed: ' + error.message);
        throw error;
    }
}

// Wire up to payment form submission
document.addEventListener('DOMContentLoaded', () => {
    // Load checkout data if available
    const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData') || '{}');
    
    // Display checkout info if available
    if (checkoutData.name) {
        console.log('Loaded checkout data:', checkoutData);
    }
    
    // Handle form submission
    const paymentForm = document.getElementById('dummyPaymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = localStorage.getItem('booklifyUserId');
            if (!userId) {
                alert('Please log in to complete your purchase');
                window.location.href = 'login.html';
                return;
            }
            
            const paymentType = document.getElementById('paymentType').value;
            const paymentMethod = paymentType === 'card' ? 'CARD' : 'EFT';
            
            // Get address from checkout data
            const orderAddress = checkoutData.address;
            
            if (!orderAddress) {
                alert('Address information is missing. Please go back to checkout.');
                window.location.href = 'checkout.html';
                return;
            }
            
            try {
                console.log('🚀 Starting payment submission process...');
                console.log('👤 User ID:', userId);
                console.log('💳 Payment method:', paymentMethod);
                console.log('📍 Order address:', orderAddress);
                
                const processBtn = document.querySelector('#dummyPaymentForm button[type="submit"]');
                if (processBtn) {
                    processBtn.disabled = true;
                    processBtn.textContent = 'Processing...';
                }
                
                console.log('📞 Calling handlePaymentSubmission...');
                await handlePaymentSubmission(userId, paymentMethod, orderAddress);
                console.log('✅ Payment submission completed successfully');
                
                // Clear checkout data after successful payment
                sessionStorage.removeItem('checkoutData');
                console.log('🧹 Cleared checkout data from session storage');
                
                // Redirect to orders page
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2000);
                
            } catch (error) {
                console.error('Payment failed:', error);
                const processBtn = document.querySelector('#dummyPaymentForm button[type="submit"]');
                if (processBtn) {
                    processBtn.disabled = false;
                    processBtn.textContent = 'Process Payment';
                }
            }
        });
    }
});

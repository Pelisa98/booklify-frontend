// checkout.js - Handles checkout form validation and navigation to payment
import { CartService } from './cartService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('booklifyUserId');
    const orderSummaryList = document.querySelector('.order-summary-list');
    const totalElem = document.querySelector('.order-summary-total');

    if (!userId || !orderSummaryList || !totalElem) return;

    // Clear any previous checkout data to ensure fresh start
    sessionStorage.removeItem('checkoutData');

    // Load cart items for order summary
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

    // Clear all form fields to ensure fresh address entry
    setTimeout(() => {
        clearAddressForm();
    }, 100); // Small delay to ensure page is fully loaded

    // Handle Continue to Payment button
    const continueBtn = document.getElementById('continueToPaymentBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Validate address form
            const requiredFields = [
                'checkoutName',
                'checkoutAddress', 
                'checkoutSuburb',
                'checkoutCity',
                'checkoutProvince',
                'checkoutCountry',
                'checkoutPostal',
                'checkoutPhone',
                'checkoutEmail'
            ];
            
            let isValid = true;
            const addressData = {};
            
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    isValid = false;
                    if (field) {
                        field.classList.add('is-invalid');
                        // Add error styling
                        if (!field.nextElementSibling?.classList.contains('invalid-feedback')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.classList.add('invalid-feedback');
                            errorDiv.textContent = 'This field is required';
                            field.parentNode.appendChild(errorDiv);
                        }
                    }
                } else {
                    if (field) {
                        field.classList.remove('is-invalid');
                        // Remove error message if exists
                        const errorDiv = field.nextElementSibling;
                        if (errorDiv?.classList.contains('invalid-feedback')) {
                            errorDiv.remove();
                        }
                    }
                    // Store address data
                    addressData[fieldId] = field.value.trim();
                }
            });
            
            if (!isValid) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Store address data in sessionStorage for payment page
            const checkoutData = {
                name: addressData.checkoutName,
                email: addressData.checkoutEmail,
                phone: addressData.checkoutPhone,
                address: {
                    street: addressData.checkoutAddress,
                    suburb: addressData.checkoutSuburb,
                    city: addressData.checkoutCity,
                    province: addressData.checkoutProvince,
                    country: addressData.checkoutCountry,
                    postalCode: addressData.checkoutPostal,
                    user: { id: userId }
                }
            };
            
            sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
            
            // Navigate to payment page
            window.location.href = 'payment.html';
        });
    }

    // Handle Clear Form button
    const clearBtn = document.getElementById('clearFormBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearAddressForm();
            alert('Form cleared! Please enter a new address for this order.');
        });
    }
});

/**
 * Clear all address form fields to ensure fresh entry for each order
 */
function clearAddressForm() {
    const formFields = [
        'checkoutName',
        'checkoutAddress', 
        'checkoutSuburb',
        'checkoutCity',
        'checkoutProvince',
        'checkoutCountry',
        'checkoutPostal',
        'checkoutPhone',
        'checkoutEmail'
    ];
    
    console.log('Clearing address form fields...');
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            const oldValue = field.value;
            field.value = '';
            field.defaultValue = '';
            field.setAttribute('value', '');
            field.classList.remove('is-invalid');
            
            // Ensure field is enabled and editable
            field.disabled = false;
            field.readOnly = false;
            
            // Force clear any browser autocomplete
            field.autocomplete = 'off';
            
            // Remove any error messages
            const errorDiv = field.nextElementSibling;
            if (errorDiv?.classList.contains('invalid-feedback')) {
                errorDiv.remove();
            }
            
            if (oldValue) {
                console.log(`Cleared field ${fieldId}: "${oldValue}" -> ""`);
            }
        } else {
            console.warn(`Field ${fieldId} not found`);
        }
    });
    
    // Clear the entire form
    const form = document.querySelector('#checkoutForm, form');
    if (form) {
        form.reset();
    }
    
    console.log('Address form fully cleared for fresh entry');
}

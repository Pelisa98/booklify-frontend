// emailTestUtils.js
// Utility functions for testing email functionality

class EmailTestUtils {
    
    /**
     * Test email sending with sample data
     */
    static async testEmailSending() {
        console.log('=== Testing Email Sending ===');
        
        // Check if services are available
        if (!window.EmailService) {
            console.error('❌ EmailService not available');
            return false;
        }
        
        if (!window.InvoiceService) {
            console.error('❌ InvoiceService not available');
            return false;
        }
        
        console.log('✅ Both services available');
        
        // Test data
        const testUserData = {
            email: 'test@booklify.com',
            fullName: 'Test User',
            name: 'Test User',
            id: 1
        };
        
        const testOrderId = 1;
        
        try {
            console.log('📧 Testing email sending with test data...');
            const result = await window.EmailService.sendInvoiceAfterPayment(testOrderId, testUserData);
            
            if (result) {
                console.log('✅ Email test successful');
                return true;
            } else {
                console.log('⚠️ Email test completed with fallback');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Email test failed:', error);
            return false;
        }
    }
    
    /**
     * Test notification system
     */
    static testNotifications() {
        console.log('=== Testing Notification System ===');
        
        if (!window.EmailService) {
            console.error('❌ EmailService not available');
            return;
        }
        
        // Test different notification types
        setTimeout(() => {
            window.EmailService.createNotification('success', '✅ Success Test', 'This is a success notification', 5000);
        }, 500);
        
        setTimeout(() => {
            window.EmailService.createNotification('warning', '⚠️ Warning Test', 'This is a warning notification with action', 8000, [
                { text: 'Test Action', action: () => console.log('Action clicked!') }
            ]);
        }, 1000);
        
        setTimeout(() => {
            window.EmailService.createNotification('info', '📧 Info Test', 'This is an info notification', 5000);
        }, 1500);
        
        console.log('✅ Notification tests queued');
    }
    
    /**
     * Simulate payment completion for testing
     */
    static async simulatePaymentCompletion() {
        console.log('=== Simulating Payment Completion ===');
        
        const userData = JSON.parse(localStorage.getItem('booklifyUserData') || '{"email": "test@booklify.com", "fullName": "Test User"}');
        const testOrderId = Date.now(); // Use timestamp as fake order ID
        
        console.log('User data:', userData);
        console.log('Order ID:', testOrderId);
        
        try {
            if (window.EmailService) {
                const result = await window.EmailService.sendInvoiceAfterPayment(testOrderId, userData);
                console.log('Simulation result:', result);
                return result;
            } else {
                console.error('EmailService not available');
                return false;
            }
        } catch (error) {
            console.error('Simulation failed:', error);
            return false;
        }
    }
    
    /**
     * Check saved invoices in localStorage
     */
    static checkSavedInvoices() {
        console.log('=== Checking Saved Invoices ===');
        
        const savedInvoices = JSON.parse(localStorage.getItem('booklify_saved_invoices') || '[]');
        const sentInvoices = JSON.parse(localStorage.getItem('booklify_sent_invoices') || '[]');
        
        console.log('Saved invoices:', savedInvoices.length);
        console.log('Sent invoices tracking:', sentInvoices.length);
        
        savedInvoices.forEach((invoice, index) => {
            console.log(`Invoice ${index + 1}:`, {
                orderId: invoice.orderId,
                email: invoice.customerEmail,
                timestamp: invoice.timestamp,
                emailSent: invoice.emailSent
            });
        });
        
        return { savedInvoices, sentInvoices };
    }
    
    /**
     * Clear test data
     */
    static clearTestData() {
        localStorage.removeItem('booklify_saved_invoices');
        localStorage.removeItem('booklify_sent_invoices');
        console.log('✅ Test data cleared');
    }
}

// Make available globally for console testing
window.EmailTestUtils = EmailTestUtils;

// Auto-run basic checks when loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('📧 Email Test Utils Loaded');
        console.log('Available methods:');
        console.log('- EmailTestUtils.testEmailSending()');
        console.log('- EmailTestUtils.testNotifications()');
        console.log('- EmailTestUtils.simulatePaymentCompletion()');
        console.log('- EmailTestUtils.checkSavedInvoices()');
        console.log('- EmailTestUtils.clearTestData()');
    }, 1000);
});
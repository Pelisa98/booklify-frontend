// paymentService.js
// Handles API calls for payment endpoints

const PAYMENT_API_BASE = 'http://localhost:8081/api/payments';

export async function createPayment({ userId, orderId, paymentMethod }) {
    const response = await fetch(`${PAYMENT_API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, orderId, paymentMethod })
    });
    if (!response.ok) {
        let body = '';
        try { body = await response.text(); } catch(e) { body = '<no body>'; }
        throw new Error(`Payment creation failed: ${response.status} ${response.statusText} - ${body}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    const text = await response.text();
    throw new Error('Payment creation returned non-JSON response: ' + text);
}

export async function updatePayment(paymentId, payment) {
    const response = await fetch(`${PAYMENT_API_BASE}/update/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
    });
    if (!response.ok) throw new Error('Payment update failed');
    return response.json();
}

export async function deletePayment(paymentId) {
    const response = await fetch(`${PAYMENT_API_BASE}/delete/${paymentId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Payment deletion failed');
}

export async function getPaymentById(paymentId) {
    const response = await fetch(`${PAYMENT_API_BASE}/getById/${paymentId}`);
    if (!response.ok) throw new Error('Payment fetch failed');
    return response.json();
}

export async function getAllPayments() {
    const response = await fetch(`${PAYMENT_API_BASE}/getAll`);
    if (!response.ok) throw new Error('Payments fetch failed');
    return response.json();
}

export async function getPaymentsByUser(userId) {
    const response = await fetch(`${PAYMENT_API_BASE}/getByUser/${userId}`);
    if (!response.ok) throw new Error('Payments fetch failed');
    return response.json();
}

export async function getPaymentsByStatus(status) {
    const response = await fetch(`${PAYMENT_API_BASE}/getByStatus/${status}`);
    if (!response.ok) throw new Error('Payments fetch failed');
    return response.json();
}

export async function refundPayment(paymentId, amount) {
    const response = await fetch(`${PAYMENT_API_BASE}/${paymentId}/refund?amount=${amount}`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Refund failed');
}

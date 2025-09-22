// addressService.js
// Handles API calls for address endpoints

const ADDRESS_API_BASE = 'http://localhost:8081/api/addresses';

export async function createAddress(address) {
    const response = await fetch(`${ADDRESS_API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address)
    });
    if (!response.ok) throw new Error('Address creation failed');
    return response.json();
}

export async function getAddressByPostalCode(postalCode) {
    const response = await fetch(`${ADDRESS_API_BASE}/${postalCode}`);
    if (!response.ok) throw new Error('Address fetch failed');
    return response.json();
}

export async function updateAddress(address) {
    const response = await fetch(`${ADDRESS_API_BASE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address)
    });
    if (!response.ok) throw new Error('Address update failed');
    return response.json();
}

export async function deleteAddress(postalCode) {
    const response = await fetch(`${ADDRESS_API_BASE}/${postalCode}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Address deletion failed');
}

// Fetch address by user ID
export async function getAddressByUserId(userId) {
    const response = await fetch(`${ADDRESS_API_BASE}/user/${userId}`);
    if (!response.ok) throw new Error('Address fetch by userId failed');
    return response.json();
}

export async function getAllAddresses() {
    const response = await fetch(`${ADDRESS_API_BASE}`);
    if (!response.ok) throw new Error('Addresses fetch failed');
    return response.json();
}

export async function deleteAllAddresses() {
    const response = await fetch(`${ADDRESS_API_BASE}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Addresses deletion failed');
}

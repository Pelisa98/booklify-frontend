// profileListings.js - Show user's uploaded books under My Listings

const BOOK_API_BASE_URL = 'http://localhost:8081/api/book';

async function getUserListings(userId) {
    // Use backend endpoint to get books by userId
    const response = await fetch(`${BOOK_API_BASE_URL}/user/${userId}`);
    if (!response.ok) return [];
    return await response.json();
}

function renderListings(listings) {
    const listingsList = document.getElementById('listingsList');
    if (!listingsList) return;
    listingsList.innerHTML = '';
    if (!listings || listings.length === 0) {
        listingsList.innerHTML = '<div class="list-group-item text-center">No books uploaded yet.</div>';
        return;
    }
    listings.forEach(book => {
        const item = document.createElement('a');
        item.className = 'list-group-item list-group-item-action flex-column align-items-start';
        item.href = `product-detail.html?id=${book.bookID}`;
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between" style="font-size: 0.95rem;">
                <span class="fw-semibold" style="font-size: 1rem;">${book.title}</span>
                <span style="font-size: 0.9rem;">R${book.price}</span>
            </div>
            <div class="mb-1 text-muted" style="font-size: 0.9rem;">${book.author}</div>
            <div style="font-size: 0.85rem;">${book.condition || ''}</div>
        `;
        listingsList.appendChild(item);
    });
}

// Get userId from localStorage (set on login)
const userId = localStorage.getItem('booklifyUserId');
if (userId) {
    getUserListings(userId).then(renderListings);
}

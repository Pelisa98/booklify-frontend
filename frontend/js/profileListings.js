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
    
    // Sort listings by date descending (newest first) and show only the 2 most recent
    const sortedListings = listings.sort((a, b) => {
        const dateA = new Date(a.datePosted || a.createdAt || 0);
        const dateB = new Date(b.datePosted || b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
    });
    const recentListings = sortedListings.slice(0, 2);
    recentListings.forEach(book => {
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
    
    // Add "View More" link if there are more than 2 listings
    if (listings.length > 2) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'list-group-item text-center';
        moreDiv.innerHTML = `
            <button class="btn btn-purple" onclick="showAllListings()">
                View All ${listings.length} Listings
            </button>
        `;
        listingsList.appendChild(moreDiv);
    }
}

// Global variable to store all listings
let allUserListings = [];

// Function to show all listings
window.showAllListings = function() {
    renderAllListings(allUserListings);
};

function renderAllListings(listings) {
    const listingsList = document.getElementById('listingsList');
    if (!listingsList) return;
    listingsList.innerHTML = '';
    if (!listings || listings.length === 0) {
        listingsList.innerHTML = '<div class="list-group-item text-center">No books uploaded yet.</div>';
        return;
    }
    
    // Sort all listings by date descending (newest first) and show all
    const sortedListings = listings.sort((a, b) => {
        const dateA = new Date(a.datePosted || a.createdAt || 0);
        const dateB = new Date(b.datePosted || b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
    });
    sortedListings.forEach(book => {
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
    
    // Add "Show Less" link
    const lessDiv = document.createElement('div');
    lessDiv.className = 'list-group-item text-center';
    lessDiv.innerHTML = `
        <button class="btn btn-outline-purple" onclick="showLessListings()">
            Show Less
        </button>
    `;
    listingsList.appendChild(lessDiv);
}

// Function to show less listings (back to 2)
window.showLessListings = function() {
    renderListings(allUserListings);
};

// Get userId from localStorage (set on login)
const userId = localStorage.getItem('booklifyUserId');
if (userId) {
    getUserListings(userId).then(listings => {
        allUserListings = listings; // Store all listings globally
        renderListings(listings);
    });
}

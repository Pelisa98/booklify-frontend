document.addEventListener('DOMContentLoaded', function() {
    // Initial load
    loadUsers();
    setupEventListeners();

    // Setup event listeners for search and filters
    function setupEventListeners() {
        document.getElementById('searchButton').addEventListener('click', handleSearch);
        document.getElementById('resetSearch').addEventListener('click', loadUsers);
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        document.getElementById('saveUserChanges').addEventListener('click', handleUserUpdate);
    }

    // Load all users
    async function loadUsers() {
        try {
            const users = await AdminService.getAllUsers();
            displayUsers(users);
        } catch (error) {
            showToast('error', 'Failed to load users');
        }
    }

    // Handle search
    async function handleSearch() {
        const searchInput = document.getElementById('searchInput').value.trim();
        const searchType = document.getElementById('searchType').value;

        if (!searchInput) {
            loadUsers();
            return;
        }

        try {
            const users = await AdminService.searchUsersByEmail(searchInput);
            displayUsers(users);
        } catch (error) {
            showToast('error', 'Search failed');
        }
    }

    // Display users in the table
    function displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${new Date(user.dateJoined).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary custom-btn-outline me-2" onclick="editUser(${user.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger custom-btn-outline-danger" onclick="deleteUser(${user.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Handle user edit
    window.editUser = function(userId) {
        const user = users.find(u => u.id === userId);
        if (user) {
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editFullName').value = user.fullName;
            document.getElementById('editEmail').value = user.email;
            new bootstrap.Modal(document.getElementById('editUserModal')).show();
        }
    };

    // Handle user update
    async function handleUserUpdate() {
        const userId = document.getElementById('editUserId').value;
        const userData = {
            fullName: document.getElementById('editFullName').value,
            email: document.getElementById('editEmail').value
        };

        try {
            await AdminService.updateUser(userId, userData);
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            showToast('success', 'User updated successfully');
            loadUsers();
        } catch (error) {
            showToast('error', 'Failed to update user');
        }
    }

    // Handle user deletion
    window.deleteUser = async function(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await AdminService.deleteUser(userId);
            showToast('success', 'User deleted successfully');
            loadUsers();
        } catch (error) {
            showToast('error', 'Failed to delete user');
        }
    };

    // Toast notification helper
    function showToast(type, message) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
});

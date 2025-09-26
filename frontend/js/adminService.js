// Admin API Service
const API_BASE_URL = 'http://localhost:8081/api/admins';

class AdminService {
    // Update book by ID
    static async updateBookById(bookId, updatedBookDto) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/editBook/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedBookDto)
        });
        if (!response.ok) {
            throw new Error('Failed to update book');
        }
        return await response.json();
    }
    // --- Book Management Methods ---
    static async getAllBooks() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/getAllBooks`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch books');
        return await response.json();
    }

    static async deleteBookById(bookId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/deleteBook/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete book');
        return true;
    }
    static async deleteAdminById(adminId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/deleteAdmin/${adminId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete admin');
        return true;
    }

    static async editBookById(bookId, updatedBook) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/editBook/${bookId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBook)
        });
        if (!response.ok) throw new Error('Failed to edit book');
        return await response.json();
    }

    static async getBookById(bookId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch book');
        return await response.json();
    }

    static async searchBooksByTitle(title) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/search/title?title=${encodeURIComponent(title)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to search books by title');
        return await response.json();
    }

    static async searchBooksByAuthor(author) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/search/author?author=${encodeURIComponent(author)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to search books by author');
        return await response.json();
    }

    static async searchBooksByIsbn(isbn) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/search/isbn?isbn=${encodeURIComponent(isbn)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to search books by ISBN');
        return await response.json();
    }

    static async findBooksByUserId(userId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch books for user');
        return await response.json();
    }
    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            // Expecting the backend to return the token as plain text and admin info in a header or a follow-up fetch
            const token = await response.text();
            localStorage.setItem('booklifyToken', token);
            localStorage.setItem('booklifyUserRole', 'admin');
            localStorage.setItem('booklifyLoggedIn', 'true');
            localStorage.setItem('booklifyUserEmail', email);

            // Fetch admin profile to get the ID
            const adminProfile = await AdminService.getAdminProfileByEmail(email);
            if (adminProfile && adminProfile.id) {
                localStorage.setItem('booklifyAdminId', adminProfile.id);
            }
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Helper to fetch admin by email (assuming unique email)
    static async getAdminProfileByEmail(email) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/getByEmail?email=${encodeURIComponent(email)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) return null;
        const admin = await response.json();
        return admin;
    }

    static async register(adminData) {
        try {
            const response = await fetch(`${API_BASE_URL}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(adminData)
            });

            const responseData = await response.text();
            console.log('Registration response:', response.status, responseData);

            if (!response.ok) {
                // Try to parse the error message if it's JSON
                try {
                    const errorData = JSON.parse(responseData);
                    throw new Error(errorData.message || 'Registration failed');
                } catch (e) {
                    throw new Error(responseData || 'Registration failed');
                }
            }

            return responseData ? JSON.parse(responseData) : {};
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async getAdminProfile(id) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/getById/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch admin profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }

    static async updateUser(userId, userData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update user');
            }

            // Since the backend method is void, we don't expect any content
            // Just return a success object
            return {
                success: true,
                message: 'User updated successfully',
                userId: userId,
                ...userData
            };
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }

    static async getAllUsers() {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            return await response.json();
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    static async updateAdminProfile(id, adminData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(adminData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    static async searchUsersByEmail(email) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/email?email=${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to search users');
            }

            return await response.json();
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }

    static async getUserById(userId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }

            return await response.json();
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }


    // --- Order Management Methods ---

    static async viewAllOrders() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orders/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch all orders');
        return await response.json();
    }

    static async viewAllOrderItems() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orderItems/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch all order items');
        return await response.json();
    }

    static async updateOrderItemStatus(orderItemId, newStatus) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/ordersItem/${orderItemId}/status?newStatus=${encodeURIComponent(newStatus)}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to update order item status');
        // Expecting 204 No Content, so no JSON to parse
        return true;
    }

    static async searchOrdersByUserId(userId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orders/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search orders by user ID');
        return await response.json();
    }

    static async searchOrderItemsByOrderId(orderId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orderItems/order/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search order items by order ID');
        return await response.json();
    }

    static async searchOrderItemsByStatus(status) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orderItems/status?status=${encodeURIComponent(status)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search order items by status');
        return await response.json();
    }

    // --- Revenue Management Methods ---

    static async calculateTotalRevenue() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/revenue/total`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to calculate total revenue');
        return await response.json();
    }

    static async calculateRevenueByDateRange(startDate, endDate) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/revenue/dateRange?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to calculate revenue by date range');
        return await response.json();
    }
}
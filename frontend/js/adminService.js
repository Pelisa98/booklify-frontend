// Admin API Service
const API_BASE_URL = 'http://localhost:8081/api/admins';

class AdminService {
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

            const token = await response.text();
            localStorage.setItem('booklifyToken', token);
            localStorage.setItem('booklifyUserRole', 'admin');
            localStorage.setItem('booklifyLoggedIn', 'true');
            localStorage.setItem('booklifyUserEmail', email);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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
}

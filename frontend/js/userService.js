// Regular User Service
const API_BASE_URL = 'http://localhost:8081/api/regular-user';

class UserService {
    static async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    fullName: userData.fullName,
                    email: userData.email,
                    password: userData.password,
                    bio: userData.bio || '',
                    sellerRating: 0.0,
                    dateJoined: new Date().toISOString()
                })
            });

            const responseData = await response.text();
            console.log('Registration response:', response.status, responseData);

            if (!response.ok) {
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

            const responseData = await response.json();
            // Store token and user info from the LoginResponse
            localStorage.setItem('booklifyToken', responseData.token);
            localStorage.setItem('booklifyUserRole', 'user');
            localStorage.setItem('booklifyLoggedIn', 'true');
            localStorage.setItem('booklifyUserEmail', email);
            localStorage.setItem('booklifyUserId', responseData.user.id);
            localStorage.setItem('booklifyUserData', JSON.stringify(responseData.user));
            
            return responseData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async getUserProfile(id) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/getById/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    static logout() {
        // Clear all auth-related items from localStorage
        localStorage.removeItem('booklifyToken');
        localStorage.removeItem('booklifyUserRole');
        localStorage.removeItem('booklifyLoggedIn');
        localStorage.removeItem('booklifyUserEmail');
        localStorage.removeItem('booklifyUserId');
        localStorage.removeItem('booklifyUserData');
    }

    static async getUserByEmail(email) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/getByEmail/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user by email');
            }

            return await response.json();
        } catch (error) {
            console.error('Get user by email error:', error);
            throw error;
        }
    }

    static async getAllUsers() {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/getAll`, {
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
            console.error('Get all users error:', error);
            throw error;
        }
    }

    static async updateProfile(id, userData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: userData.fullName,
                    email: userData.email,
                    bio: userData.bio,
                    password: userData.password,
                    sellerRating: userData.sellerRating
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    static async deleteUser(id) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
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

    static async searchUsersByName(fullName) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/getByFullName/${fullName}`, {
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

    static logout() {
        localStorage.removeItem('booklifyToken');
        localStorage.removeItem('booklifyUserRole');
        localStorage.removeItem('booklifyLoggedIn');
        localStorage.removeItem('booklifyUserEmail');
        localStorage.removeItem('booklifyUserId');
        localStorage.removeItem('booklifyUserData');
    }
}

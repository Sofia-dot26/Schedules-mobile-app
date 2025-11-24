// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Имитация пользователей
  users = [
    { id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com' },
    { id: 2, username: 'user', password: 'user123', email: 'user@example.com' }
  ];

  async login(username, password) {
    try {
      const user = this.users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        throw new Error('Неверное имя пользователя или пароль');
      }

      // Сохраняем данные пользователя
      this.currentUser = { ...user };
      await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }
}

export default new AuthService();
// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.USERS_STORAGE_KEY = '@app_users';
    this.CURRENT_USER_KEY = 'currentUser';
  }

  // Загружаем пользователей из AsyncStorage при инициализации
  async init() {
    try {
      // Пытаемся загрузить существующих пользователей
      const usersData = await AsyncStorage.getItem(this.USERS_STORAGE_KEY);
      
      if (!usersData) {
        // Если пользователей нет, создаем дефолтных
        const defaultUsers = [
          { 
            id: 1, 
            username: 'admin', 
            password: 'admin123', 
            email: 'admin@example.com',
            fullName: 'Администратор Системы',
            createdAt: new Date().toISOString()
          },
          { 
            id: 2, 
            username: 'user', 
            password: 'user123', 
            email: 'user@example.com',
            fullName: 'Тестовый Пользователь',
            createdAt: new Date().toISOString()
          }
        ];
        await AsyncStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        this.users = defaultUsers;
      } else {
        this.users = JSON.parse(usersData);
      }

      // Загружаем текущего пользователя, если есть
      const currentUserData = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      if (currentUserData) {
        this.currentUser = JSON.parse(currentUserData);
      }
    } catch (error) {
      console.error('AuthService init error:', error);
      this.users = [];
    }
  }

  // Регистрация нового пользователя
  async register(userData) {
    try {
      await this.init();
      
      // Проверяем обязательные поля
      if (!userData.username || !userData.password || !userData.email || !userData.fullName) {
        throw new Error('Все поля обязательны для заполнения');
      }

      // Проверяем уникальность username
      if (this.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        throw new Error('Имя пользователя уже занято');
      }

      // Проверяем уникальность email
      if (this.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Email уже используется');
      }

      // Проверяем длину пароля
      if (userData.password.length < 6) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }

      // Создаем нового пользователя
      const newUser = {
        id: Date.now(),
        username: userData.username.trim(),
        password: userData.password, // В реальном приложении нужно хэшировать!
        email: userData.email.trim(),
        fullName: userData.fullName.trim(),
        createdAt: new Date().toISOString()
      };

      // Добавляем пользователя в массив
      this.users.push(newUser);
      
      // Сохраняем обновленный список пользователей
      await AsyncStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(this.users));

      // Автоматически логиним пользователя после регистрации
      this.currentUser = { ...newUser };
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));

      return {
        success: true,
        user: this.currentUser,
        message: 'Регистрация прошла успешно'
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async login(username, password) {
    try {
      await this.init();
      
      // Поиск пользователя
      const user = this.users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );
      
      if (!user) {
        throw new Error('Неверное имя пользователя или пароль');
      }

      // Сохраняем данные пользователя
      this.currentUser = { ...user };
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
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

      const userData = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
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

  async getAllUsers() {
    try {
      await this.init();
      return this.users;
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async getUserByUsername(username) {
    try {
      await this.init();
      return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    } catch (error) {
      console.error('Get user by username error:', error);
      return null;
    }
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Очистка всех данных (для тестирования)
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(this.USERS_STORAGE_KEY);
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
      this.users = [];
      this.currentUser = null;
    } catch (error) {
      console.error('Clear all data error:', error);
    }
  }
}

// Экспортируем синглтон экземпляр
const authService = new AuthService();

// Инициализируем при экспорте (опционально)
authService.init().catch(console.error);

export default authService;
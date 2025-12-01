import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { ComponentsStyles } from '../styles/ComponentsStyles';

const LoginForm = ({ onLogin, isLoading = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      await onLogin(username.trim(), password.trim());
    } catch (error) {
      throw error;
    }
  };

  return (
    <View style={ComponentsStyles.loginContainer}>
      <Text style={ComponentsStyles.loginTitle}>Вход в систему</Text>
      
      <Text style={ComponentsStyles.loginLabel}>Имя пользователя</Text>
      <TextInput
        style={ComponentsStyles.loginInput}
        placeholder="Введите имя пользователя"
        placeholderTextColor="#9CA3AF"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!isLoading}
      />
      
      <Text style={ComponentsStyles.loginLabel}>Пароль</Text>
      <TextInput
        style={ComponentsStyles.loginInput}
        placeholder="Введите пароль"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[
          ComponentsStyles.loginButton,
          isLoading && ComponentsStyles.loginButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={ComponentsStyles.loginButtonText}>
          {isLoading ? 'Вход...' : 'Войти'}
        </Text>
      </TouchableOpacity>

      {/* Тестовые данные для демонстрации */}
      <View style={ComponentsStyles.demoContainer}>
        <Text style={ComponentsStyles.demoTitle}>Тестовые данные:</Text>
        <Text style={ComponentsStyles.demoText}>admin / admin123</Text>
        <Text style={ComponentsStyles.demoText}>user / user123</Text>
      </View>
    </View>
  );
};

export default LoginForm;
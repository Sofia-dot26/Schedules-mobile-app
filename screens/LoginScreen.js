import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import Header from '../components/Header';
import Section from '../components/Section';
import FormLabel from '../components/FormLabel';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import { ScreenStyles } from '../styles/ScreenStyles';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      if (username === 'admin' && password === 'admin') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Journal' }],
        });
      } else {
        Alert.alert('Ошибка', 'Неверное имя пользователя или пароль');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось войти в систему');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={ScreenStyles.loginScreenContainer}>
      <View style={ScreenStyles.loginScreenHeader}>
        <Text style={ScreenStyles.loginScreenHeaderTitle}>Учебный журнал</Text>
        <Text style={ScreenStyles.loginScreenHeaderSubtitle}>Система управления занятиями</Text>
      </View>

      <Section style={ScreenStyles.loginScreenForm}>
        <Text style={ScreenStyles.loginScreenTitle}>Вход в систему</Text>
        
        <FormLabel text="Имя пользователя" required />
        <FormInput
          placeholder="Введите имя пользователя"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!isLoading}
        />
        
        <FormLabel text="Пароль" required />
        <FormInput
          placeholder="Введите пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <SaveButton
          onPress={handleLogin}
          text="Войти"
          isLoading={isLoading}
          disabled={!username.trim() || !password.trim()}
        />

        {/* Тестовые данные для демонстрации */}
        <View style={ScreenStyles.loginScreenDemoContainer}>
          <Text style={ScreenStyles.loginScreenDemoTitle}>Тестовые данные:</Text>
          <Text style={ScreenStyles.loginScreenDemoText}>Имя пользователя: admin</Text>
          <Text style={ScreenStyles.loginScreenDemoText}>Пароль: admin</Text>
        </View>
      </Section>
    </View>
  );
};

export default LoginScreen;
import React, { useState, useEffect } from 'react';
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
import authService from '../services/AuthService';
import { ScreenStyles } from '../styles/ScreenStyles';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Инициализируем AuthService при монтировании компонента
    authService.init().catch(console.error);
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(username, password);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Journal' }],
      });
    } catch (error) {
      Alert.alert('Ошибка входа', error.message || 'Не удалось войти в систему');
    } finally {
      setIsLoading(false);
    }
  };

  const openDocumentation = () => {
    navigation.navigate('Documentation');
  };

  const navigateToRegistration = () => {
    navigation.navigate('Registration');
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

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={navigateToRegistration}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>Регистрация</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.docsLink}
          onPress={openDocumentation}
          activeOpacity={0.7}
        >
          <Text style={styles.docsLinkText}>Справочная информация</Text>
        </TouchableOpacity>

      
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  registerButton: {
    backgroundColor: '#4A306D',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  docsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  docsLinkText: {
    fontSize: 16,
    color: '#0056b3',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  demoNote: {
    fontStyle: 'italic',
    color: '#6c757d',
    marginTop: 5,
  },
});

export default LoginScreen;
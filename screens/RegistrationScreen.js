import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Section from '../components/Section';
import FormLabel from '../components/FormLabel';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import authService from '../services/AuthService';
import { ScreenStyles } from '../styles/ScreenStyles';

const RegistrationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Инициализируем AuthService при монтировании компонента
    authService.init().catch(console.error);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Минимум 3 символа';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'ФИО обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName
      });

      Alert.alert(
        'Успешная регистрация!',
        'Аккаунт успешно создан. Вы автоматически вошли в систему.',
        [
          {
            text: 'Перейти в журнал',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Journal' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка регистрации', error.message || 'Не удалось зарегистрироваться');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={ScreenStyles.loginScreenContainer}>
          <View style={ScreenStyles.loginScreenHeader}>
            <Text style={ScreenStyles.loginScreenHeaderTitle}>Учебный журнал</Text>
            <Text style={ScreenStyles.loginScreenHeaderSubtitle}>Регистрация нового пользователя</Text>
          </View>

          <Section style={[ScreenStyles.loginScreenForm, styles.formContainer]}>
            <Text style={ScreenStyles.loginScreenTitle}>Создание аккаунта</Text>
            
            <FormLabel text="ФИО" required />
            <FormInput
              placeholder="Введите ваше полное имя"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              autoCapitalize="words"
              editable={!isLoading}
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            
            <FormLabel text="Имя пользователя" required />
            <FormInput
              placeholder="Придумайте имя пользователя"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            
            <FormLabel text="Email" required />
            <FormInput
              placeholder="Введите ваш email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            
            <FormLabel text="Пароль" required />
            <FormInput
              placeholder="Придумайте пароль (мин. 6 символов)"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              editable={!isLoading}
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            
            <FormLabel text="Подтверждение пароля" required />
            <FormInput
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              editable={!isLoading}
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

            <SaveButton
              onPress={handleRegister}
              text="Зарегистрироваться"
              isLoading={isLoading}
              disabled={isLoading || 
                !formData.username.trim() || 
                !formData.password.trim() || 
                !formData.confirmPassword.trim() || 
                !formData.email.trim() || 
                !formData.fullName.trim()}
            />

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={navigateToLogin}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.loginLinkText}>Уже есть аккаунт? Войти</Text>
            </TouchableOpacity>

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Требования:</Text>
              <Text style={styles.requirementsText}>• Имя пользователя: минимум 3 символа</Text>
              <Text style={styles.requirementsText}>• Пароль: минимум 6 символов</Text>
              <Text style={styles.requirementsText}>• Email должен быть в правильном формате</Text>
              <Text style={styles.requirementsText}>• Все поля обязательны для заполнения</Text>
            </View>
          </Section>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  formContainer: {
    marginHorizontal: 20,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#0056b3',
    fontWeight: '500',
  },
  requirementsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
  },
});

export default RegistrationScreen;
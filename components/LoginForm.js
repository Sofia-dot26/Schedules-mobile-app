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
import Icon from 'react-native-vector-icons/MaterialIcons';

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

  const openDocumentation = () => {
    navigation.navigate('Documentation', { section: 'getting-started' });
  };

  return (
    <View style={ScreenStyles.loginScreenContainer}>
      {/* Кнопка документации в правом верхнем углу */}
      <TouchableOpacity 
        style={styles.docsButton}
        onPress={openDocumentation}
        disabled={isLoading}
      >
        <Icon name="help-outline" size={24} color="#0056b3" />
        <Text style={styles.docsButtonText}>Помощь</Text>
      </TouchableOpacity>

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

        {/* Ссылка на документацию под формой */}
        <TouchableOpacity 
          style={styles.docsLink}
          onPress={() => navigation.navigate('Documentation', { section: 'faq' })}
          disabled={isLoading}
        >
          <Icon name="help" size={16} color="#0056b3" style={styles.docsLinkIcon} />
          <Text style={styles.docsLinkText}>Частые вопросы (FAQ)</Text>
        </TouchableOpacity>

        {/* Тестовые данные для демонстрации */}
        <View style={ScreenStyles.loginScreenDemoContainer}>
          <Text style={ScreenStyles.loginScreenDemoTitle}>Тестовые данные:</Text>
          <Text style={ScreenStyles.loginScreenDemoText}>Имя пользователя: admin</Text>
          <Text style={ScreenStyles.loginScreenDemoText}>Пароль: admin</Text>
          
          {/* Ссылка на руководство */}
          <TouchableOpacity 
            style={styles.guideLink}
            onPress={() => navigation.navigate('Documentation', { section: 'guide' })}
            disabled={isLoading}
          >
            <Icon name="book" size={16} color="#0056b3" style={styles.guideLinkIcon} />
            <Text style={styles.guideLinkText}>Руководство пользователя</Text>
          </TouchableOpacity>
        </View>
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  docsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  docsButtonText: {
    color: '#0056b3',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  docsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  docsLinkIcon: {
    marginRight: 8,
  },
  docsLinkText: {
    color: '#0056b3',
    fontSize: 14,
    fontWeight: '500',
  },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0056b3',
  },
  guideLinkIcon: {
    marginRight: 8,
  },
  guideLinkText: {
    color: '#0056b3',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
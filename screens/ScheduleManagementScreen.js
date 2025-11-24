// screens/ScheduleManagementScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import ScheduleService from '../services/ScheduleService';

const ScheduleManagementScreen = ({ navigation }) => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const subjectsData = await ScheduleService.getSubjectsWithGroups();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить предметы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLoadSchedule = async () => {
    if (isPicking) {
      console.log('Document picker is already in progress');
      return;
    }

    setIsPicking(true);
    
    try {
      console.log('Starting file picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('File selected:', file.name);
        
        // Проверяем размер файла (максимум 10MB)
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('Ошибка', 'Файл слишком большой. Максимальный размер: 10MB');
          return;
        }

        // Проверяем расширение файла
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert('Ошибка', 'Выберите файл в формате PDF');
          return;
        }

        // Показываем подтверждение загрузки
        Alert.alert(
          'Подтверждение загрузки',
          `PDF файл: ${file.name}\nРазмер: ${(file.size / 1024).toFixed(2)} KB\n\nПродолжить загрузку?`,
          [
            {
              text: 'Отмена',
              style: 'cancel',
              onPress: () => console.log('Upload cancelled')
            },
            {
              text: 'Загрузить',
              onPress: () => {
                console.log('Starting upload...');
                uploadScheduleFile(file);
              }
            },
          ]
        );
      } else if (result.canceled) {
        console.log('User cancelled file picker');
      } else {
        console.log('No file selected');
      }
    } catch (error) {
      console.error('Error picking PDF file:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать PDF файл');
    } finally {
      setIsPicking(false);
    }
  };

  const uploadScheduleFile = async (file) => {
    console.log('Uploading file:', file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name,
      });

      console.log('FormData created, sending request...');

      const API_URL = 'http://194.87.232.200/file/upload-schedule';
      console.log('Sending to:', API_URL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); 

      // Отправляем файл на сервер
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Upload successful, full result:', JSON.stringify(result, null, 2));
    if (result && result.data) {
      console.log('Processing server data...');
      await ScheduleService.processServerSchedule(result.data);
      
      Alert.alert(
        'Успех', 
        `Расписание успешно загружено и обработано!\nОбработано занятий из PDF.`
      );
    } else  if (result){
      console.log('🔄 Processing server data from root...');
      await ScheduleService.processServerSchedule(result);

      Alert.alert(
        'Успех', 
        `PDF файл успешно загружен и обработано.`
      );
    } else {
      Alert.alert(
        '⚠️ Внимание', 
        `PDF загружен, но данные не получены.`
      );
    }
    
    // Обновляем список предметов
    loadSubjects();

    } catch (error) {
    console.error('Upload error:', error);
    Alert.alert(
      'Ошибка загрузки', 
      `Не удалось загрузить PDF расписание: ${error.message}`
    );
    } finally {
      setUploading(false);
    }
  };

  // Упрощенная версия для тестирования
  const debugHandleLoadSchedule = async () => {
    if (isPicking) {
      console.log('Document picker is already in progress');
      return;
    }

    setIsPicking(true);
    
    try {
      console.log('Starting debug file picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      console.log('Debug document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Debug file selected:', file.name);
        
        // Проверяем размер файла
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('Ошибка', 'Файл слишком большой. Максимальный размер: 10MB');
          return;
        }

        // Проверяем расширение файла
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert('Ошибка', 'Выберите файл в формате PDF');
          return;
        }

        // Имитируем успешную загрузку для тестирования
        Alert.alert(
          'Тестовая загрузка',
          `PDF файл: ${file.name}\nРазмер: ${(file.size / 1024).toFixed(2)} KB\n\nФайл успешно выбран! Для реальной загрузки нажмите "Загрузить PDF расписание".`,
          [
            {
              text: 'OK',
              onPress: () => console.log('Test selection completed')
            },
          ]
        );
      } else if (result.canceled) {
        console.log('User cancelled debug file picker');
      } else {
        console.log('No file selected in debug mode');
      }
    } catch (error) {
      console.error('Error in debug file picker:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать PDF файл');
    } finally {
      setIsPicking(false);
    }
  };

  const handleAddSchedule = () => {
    navigation.navigate('AddLesson');
  };

  const handleSubjectPress = (subject) => {
    navigation.navigate('SubjectDetail', { 
      subjectId: subject.id, 
      subjectName: subject.name 
    });
  };

  const getGroupsText = (subject) => {
    if (subject.groups.length === 0) return 'Группы не добавлены';
    return `Группы: ${subject.groups.join(', ')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Управление занятиями</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menu}>
        {/* Основная кнопка загрузки */}
        <TouchableOpacity 
          style={[styles.menuItem, (uploading || isPicking) && styles.menuItemDisabled]}
          onPress={handleLoadSchedule}
          disabled={uploading || isPicking}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>
              {uploading ? 'Загрузка PDF...' : 
               isPicking ? 'Выбор файла...' : 
               'Загрузить PDF расписание'}
            </Text>
            <Text style={styles.menuItemDescription}>
              Импорт расписания из PDF файла
            </Text>
          </View>
          {(uploading || isPicking) ? (
            <ActivityIndicator size="small" color="#4A306D" />
          ) : (
            <Text style={styles.menuArrow}>›</Text>
          )}
        </TouchableOpacity>

        {/* ДЕБАГ КНОПКА - для тестирования */}
        <TouchableOpacity 
          style={[styles.menuItem, {backgroundColor: '#FFF3CD'}, isPicking && styles.menuItemDisabled]}
          onPress={debugHandleLoadSchedule}
          disabled={isPicking}
        >
          <View style={styles.menuItemContent}>
            <Text style={[styles.menuItemTitle, {color: '#856404'}]}>
              {isPicking ? 'Выбор файла...' : 'Тест выбора файла'}
            </Text>
            <Text style={[styles.menuItemDescription, {color: '#856404'}]}>
              Проверка работы выбора файла (без отправки)
            </Text>
          </View>
          {isPicking ? (
            <ActivityIndicator size="small" color="#856404" />
          ) : (
            <Text style={[styles.menuArrow, {color: '#856404'}]}>›</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleAddSchedule}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Добавить занятие</Text>
            <Text style={styles.menuItemDescription}>
              Создание нового занятия в расписании
            </Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subjectsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Предметы</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadSubjects}
          >
            <Text style={styles.refreshButtonText}>⟳</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Загрузка предметов...</Text>
        ) : (
          subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectCard}
              onPress={() => handleSubjectPress(subject)}
            >
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectGroups}>{getGroupsText(subject)}</Text>
                <Text style={styles.lessonCount}>
                  Занятий: {subject.lessonCount || 0}
                </Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

// Стили остаются без изменений
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: '#4A306D',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A306D',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(139, 58, 98, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B3A62',
  },
  logoutButtonText: {
    color: '#8B3A62',
    fontSize: 14,
    fontWeight: '600',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 24,
    color: '#4A306D',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  subjectsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 15,
  },
  subjectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 4,
  },
  subjectGroups: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    backgroundColor: 'rgba(92, 128, 188, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#5C80BC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    padding: 20,
  },
  lessonCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
});

export default ScheduleManagementScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ScheduleService from '../services/ScheduleService';
import Header from '../components/Header';
import Section from '../components/Section';
import { ScreenStyles } from '../styles/ScreenStyles';

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
        
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('Ошибка', 'Файл слишком большой. Максимальный размер: 10MB');
          return;
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert('Ошибка', 'Выберите файл в формате PDF');
          return;
        }

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

      const API_URL = 'http://194.87.232.200/file/upload-schedule';
      console.log('Sending to:', API_URL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

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
        
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('Ошибка', 'Файл слишком большой. Максимальный размер: 10MB');
          return;
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert('Ошибка', 'Выберите файл в формате PDF');
          return;
        }

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
    <View style={ScreenStyles.scheduleManagementScreenContainer}>
      <Header
        title="Управление занятиями"
        onBack={handleBack}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleManagementScreenHeader}
      />
      <ScrollView style={ScreenStyles.commonScrollView} showsVerticalScrollIndicator={false}>
      <Section style={ScreenStyles.scheduleManagementScreenMenu}>
        {/* Основная кнопка загрузки */}
        <TouchableOpacity 
          style={[ScreenStyles.scheduleManagementScreenMenuItem, (uploading || isPicking) && ScreenStyles.scheduleManagementScreenMenuItemDisabled]}
          onPress={handleLoadSchedule}
          disabled={uploading || isPicking}
        >
          <View style={ScreenStyles.scheduleManagementScreenMenuItemContent}>
            <Text style={ScreenStyles.scheduleManagementScreenMenuItemTitle}>
              {uploading ? 'Загрузка PDF...' : 
               isPicking ? 'Выбор файла...' : 
               'Загрузить PDF расписание'}
            </Text>
            <Text style={ScreenStyles.scheduleManagementScreenMenuItemDescription}>
              Импорт расписания из PDF файла
            </Text>
          </View>
          {(uploading || isPicking) ? (
            <ActivityIndicator size="small" color="#4A306D" />
          ) : (
            <Text style={ScreenStyles.scheduleManagementScreenMenuArrow}>›</Text>
          )}
        </TouchableOpacity>

        {/* ДЕБАГ КНОПКА */}
        <TouchableOpacity 
          style={[ScreenStyles.scheduleManagementScreenMenuItem, {backgroundColor: '#FFF3CD'}, isPicking && ScreenStyles.scheduleManagementScreenMenuItemDisabled]}
          onPress={debugHandleLoadSchedule}
          disabled={isPicking}
        >
          <View style={ScreenStyles.scheduleManagementScreenMenuItemContent}>
            <Text style={[ScreenStyles.scheduleManagementScreenMenuItemTitle, {color: '#856404'}]}>
              {isPicking ? 'Выбор файла...' : 'Тест выбора файла'}
            </Text>
            <Text style={[ScreenStyles.scheduleManagementScreenMenuItemDescription, {color: '#856404'}]}>
              Проверка работы выбора файла (без отправки)
            </Text>
          </View>
          {isPicking ? (
            <ActivityIndicator size="small" color="#856404" />
          ) : (
            <Text style={[ScreenStyles.scheduleManagementScreenMenuArrow, {color: '#856404'}]}>›</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={ScreenStyles.scheduleManagementScreenMenuItem}
          onPress={handleAddSchedule}
        >
          <View style={ScreenStyles.scheduleManagementScreenMenuItemContent}>
            <Text style={ScreenStyles.scheduleManagementScreenMenuItemTitle}>Добавить занятие</Text>
            <Text style={ScreenStyles.scheduleManagementScreenMenuItemDescription}>
              Создание нового занятия в расписании
            </Text>
          </View>
          <Text style={ScreenStyles.scheduleManagementScreenMenuArrow}>›</Text>
        </TouchableOpacity>
      </Section>

      <Section>
        <View style={ScreenStyles.scheduleManagementScreenSectionHeader}>
          <Text style={ScreenStyles.scheduleManagementScreenSectionTitle}>Предметы</Text>
          <TouchableOpacity 
            style={ScreenStyles.scheduleManagementScreenRefreshButton}
            onPress={loadSubjects}
          >
            <Text style={ScreenStyles.scheduleManagementScreenRefreshButtonText}>⟳</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <Text style={ScreenStyles.scheduleManagementScreenLoadingText}>Загрузка предметов...</Text>
        ) : (
          subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={ScreenStyles.scheduleManagementScreenSubjectCard}
              onPress={() => handleSubjectPress(subject)}
            >
              <View style={ScreenStyles.scheduleManagementScreenSubjectInfo}>
                <Text style={ScreenStyles.scheduleManagementScreenSubjectName}>{subject.name}</Text>
                <Text style={ScreenStyles.scheduleManagementScreenSubjectGroups}>{getGroupsText(subject)}</Text>
                <Text style={ScreenStyles.scheduleManagementScreenLessonCount}>
                  Занятий: {subject.lessonCount || 0}
                </Text>
              </View>
              <Text style={ScreenStyles.scheduleManagementScreenMenuArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </Section>
      </ScrollView>
    </View>
  );
};

export default ScheduleManagementScreen;
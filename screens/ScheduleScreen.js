// screens/ScheduleScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import ScheduleService from '../services/ScheduleService';

const ScheduleScreen = ({ navigation }) => {
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState('numerator');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [selectedDay, selectedWeek]);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const lessons = await ScheduleService.getLessonsByDayAndWeek(selectedDay, selectedWeek);
      setSchedule(lessons);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить расписание');
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

  const handleRefresh = () => {
    loadSchedule();
  };

  const handleLessonPress = (lesson) => {
    navigation.navigate('Attendance', { lesson });
  };

  const days = [
    { id: 1, name: 'Понедельник', short: 'ПН' },
    { id: 2, name: 'Вторник', short: 'ВТ' },
    { id: 3, name: 'Среда', short: 'СР' },
    { id: 4, name: 'Четверг', short: 'ЧТ' },
    { id: 5, name: 'Пятница', short: 'ПТ' },
  ];

  const getWeekTypeText = (week) => {
    return week === 'numerator' ? 'Числитель' : week === 'denominator' ? 'Знаменатель' : 'Обе недели';
  };

  const getLessonTypeText = (lessonType) => {
    const types = {
      'лб': 'Лабораторная работа',
      'лк': 'Лекция',
      'пр': 'Практика'
    };
    return types[lessonType] || lessonType;
  };

  const renderGroups = (lesson) => {
    if (lesson.groups && Array.isArray(lesson.groups)) {
      return lesson.groups.join(', ');
    }
    return lesson.group_name || 'Группа не указана'; 
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
          <Text style={styles.headerTitle}>Расписание</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>⟳</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekSection}>
        <Text style={styles.weekSectionTitle}>Неделя:</Text>
        <View style={styles.weekButtons}>
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'numerator' && styles.weekButtonActive
            ]}
            onPress={() => setSelectedWeek('numerator')}
          >
            <Text style={[
              styles.weekButtonText,
              selectedWeek === 'numerator' && styles.weekButtonTextActive
            ]}>
              Числитель
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'denominator' && styles.weekButtonActive
            ]}
            onPress={() => setSelectedWeek('denominator')}
          >
            <Text style={[
              styles.weekButtonText,
              selectedWeek === 'denominator' && styles.weekButtonTextActive
            ]}>
              Знаменатель
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.daysSelector}>
        {days.map(day => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.dayButton,
              selectedDay === day.id && styles.dayButtonActive
            ]}
            onPress={() => setSelectedDay(day.id)}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === day.id && styles.dayButtonTextActive
            ]}>
              {day.short}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.dayHeader}>
        {days.find(d => d.id === selectedDay)?.name}
      </Text>

      <ScrollView style={styles.scheduleList}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Загрузка...</Text>
          </View>
        ) : schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Нет занятий на этот день</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedWeek === 'numerator' ? 'числитель' : 'знаменатель'}
            </Text>
          </View>
        ) : (
          schedule.map(lesson => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => handleLessonPress(lesson)}
            >
              <View style={styles.lessonHeader}>
                <Text style={styles.lessonTime}>
                  {lesson.startTime} - {lesson.endTime}
                </Text>
                {lesson.weekType !== 'both' && (
                  <View style={[
                    styles.weekBadge,
                    lesson.weekType === 'numerator' ? styles.numeratorBadge : styles.denominatorBadge
                  ]}>
                    <Text style={styles.weekBadgeText}>
                      {getWeekTypeText(lesson.weekType)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.lessonSubject}>{lesson.subjectName}</Text>
              {/* Отображение типа занятия */}
              {lesson.lessonType && (
                <Text style={styles.lessonType}>
                  {getLessonTypeText(lesson.lessonType)}
                </Text>
              )}
              <Text style={styles.lessonGroup}>
                Группы: {renderGroups(lesson)}
              </Text>
              {lesson.classroom && (
                <Text style={styles.lessonClassroom}>Аудитория: {lesson.classroom}</Text>
              )}
              
              {/* Индикатор что можно нажать */}
              <View style={styles.attendanceHint}>
                <Text style={styles.attendanceHintText}>
                  Нажмите для отметки посещаемости →
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  refreshButton: {
    backgroundColor: 'rgba(92, 128, 188, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  refreshButtonText: {
    color: '#5C80BC',
    fontSize: 16,
    fontWeight: 'bold',
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
  weekSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  weekSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 10,
  },
  weekButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  weekButtonActive: {
    backgroundColor: '#4A306D',
    borderColor: '#4A306D',
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
  },
  weekButtonTextActive: {
    color: '#FFFFFF',
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayButtonActive: {
    backgroundColor: '#4A306D',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  dayHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 20,
  },
  scheduleList: {
    flex: 1,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4A306D',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lessonTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
  },
  weekBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  numeratorBadge: {
    backgroundColor: '#E1F5FE',
  },
  denominatorBadge: {
    backgroundColor: '#F3E5F5',
  },
  weekBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A306D',
  },
  lessonSubject: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
    fontWeight: '600',
  },
  lessonGroup: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  lessonClassroom: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  lessonType: {
    fontSize: 14,
    color: '#5C80BC',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  attendanceHint: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attendanceHintText: {
    fontSize: 12,
    color: '#8B3A62',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default ScheduleScreen;
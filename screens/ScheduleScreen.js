import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import ScheduleService from '../services/ScheduleService';
import Header from '../components/Header';
import Section from '../components/Section';
import { ScreenStyles } from '../styles/ScreenStyles';

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
    navigation.navigate('Attendance', { lesson})

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
    <View style={ScreenStyles.scheduleScreenContainer}>
      <Header
        title="Расписание"
        onBack={handleBack}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleScreenHeader}
        rightComponent={
          <TouchableOpacity 
            style={ScreenStyles.scheduleScreenRefreshButton}
            onPress={handleRefresh}
          >
            <Text style={ScreenStyles.scheduleScreenRefreshButtonText}>⟳</Text>
          </TouchableOpacity>
        }
        showLogoutButton={true}
      />
      <ScrollView style={ScreenStyles.commonScrollView} showsVerticalScrollIndicator={false}>
      <Section style={ScreenStyles.scheduleScreenWeekSection}>
        <Text style={ScreenStyles.scheduleScreenWeekSectionTitle}>Неделя:</Text>
        <View style={ScreenStyles.scheduleScreenWeekButtons}>
          <TouchableOpacity
            style={[
              ScreenStyles.scheduleScreenWeekButton,
              selectedWeek === 'numerator' && ScreenStyles.scheduleScreenWeekButtonActive
            ]}
            onPress={() => setSelectedWeek('numerator')}
          >
            <Text style={[
              ScreenStyles.scheduleScreenWeekButtonText,
              selectedWeek === 'numerator' && ScreenStyles.scheduleScreenWeekButtonTextActive
            ]}>
              Числитель
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              ScreenStyles.scheduleScreenWeekButton,
              selectedWeek === 'denominator' && ScreenStyles.scheduleScreenWeekButtonActive
            ]}
            onPress={() => setSelectedWeek('denominator')}
          >
            <Text style={[
              ScreenStyles.scheduleScreenWeekButtonText,
              selectedWeek === 'denominator' && ScreenStyles.scheduleScreenWeekButtonTextActive
            ]}>
              Знаменатель
            </Text>
          </TouchableOpacity>
        </View>
      </Section>

      <View style={ScreenStyles.scheduleScreenDaysSelector}>
        {days.map(day => (
          <TouchableOpacity
            key={day.id}
            style={[
              ScreenStyles.scheduleScreenDayButton,
              selectedDay === day.id && ScreenStyles.scheduleScreenDayButtonActive
            ]}
            onPress={() => setSelectedDay(day.id)}
          >
            <Text style={[
              ScreenStyles.scheduleScreenDayButtonText,
              selectedDay === day.id && ScreenStyles.scheduleScreenDayButtonTextActive
            ]}>
              {day.short}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={ScreenStyles.scheduleScreenDayHeader}>
        {days.find(d => d.id === selectedDay)?.name}
      </Text>

      <ScrollView style={ScreenStyles.scheduleScreenScheduleList}>
        {isLoading ? (
          <View style={ScreenStyles.scheduleScreenEmptyState}>
            <Text style={ScreenStyles.scheduleScreenEmptyStateText}>Загрузка...</Text>
          </View>
        ) : schedule.length === 0 ? (
          <View style={ScreenStyles.scheduleScreenEmptyState}>
            <Text style={ScreenStyles.scheduleScreenEmptyStateText}>Нет занятий на этот день</Text>
            <Text style={ScreenStyles.scheduleScreenEmptyStateSubtext}>
              {selectedWeek === 'numerator' ? 'числитель' : 'знаменатель'}
            </Text>
          </View>
        ) : (
          schedule.map(lesson => (
            <TouchableOpacity
              key={lesson.id}
              style={ScreenStyles.scheduleScreenLessonCard}
              onPress={() => handleLessonPress(lesson)}
            >
              <View style={ScreenStyles.scheduleScreenLessonHeader}>
                <Text style={ScreenStyles.scheduleScreenLessonTime}>
                  {lesson.startTime} - {lesson.endTime}
                </Text>
                {lesson.weekType !== 'both' && (
                  <View style={[
                    ScreenStyles.scheduleScreenWeekBadge,
                    lesson.weekType === 'numerator' ? ScreenStyles.scheduleScreenNumeratorBadge : ScreenStyles.scheduleScreenDenominatorBadge
                  ]}>
                    <Text style={ScreenStyles.scheduleScreenWeekBadgeText}>
                      {getWeekTypeText(lesson.weekType)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={ScreenStyles.scheduleScreenLessonSubject}>{lesson.subjectName}</Text>
              {lesson.lessonType && (
                <Text style={ScreenStyles.scheduleScreenLessonType}>
                  {getLessonTypeText(lesson.lessonType)}
                </Text>
              )}
              <Text style={ScreenStyles.scheduleScreenLessonGroup}>
                Группы: {renderGroups(lesson)}
              </Text>
              {lesson.classroom && (
                <Text style={ScreenStyles.scheduleScreenLessonClassroom}>Аудитория: {lesson.classroom}</Text>
              )}
              
              <View style={ScreenStyles.scheduleScreenAttendanceHint}>
                <Text style={ScreenStyles.scheduleScreenAttendanceHintText}>
                  Нажмите для отметки посещаемости →
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      </ScrollView>
    </View>
  );
};

export default ScheduleScreen;
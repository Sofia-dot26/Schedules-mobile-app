import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import StudentService from '../services/StudentService';
import AttendanceService from '../services/AttendanceService';
import Header from '../components/Header';
import Section from '../components/Section';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import { ScreenStyles } from '../styles/ScreenStyles';

const AttendanceScreen = ({ route, navigation }) => {
  const { lesson } = route.params;
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
    loadStudents();
    loadAttendance();

  }, [lesson, attendanceDate]);

  const loadStudents = async () => {
    try {
      const allStudents = [];
      
      for (const group of lesson.groups) {
        const groupStudents = await StudentService.getStudentsByGroup(group);
        allStudents.push(...groupStudents);
      }
      
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список студентов');
    }
  };

  const loadAttendance = async () => {
    try {
      const attendanceRecords = await AttendanceService.getAttendanceByLesson(lesson.id, attendanceDate);
      
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        attendanceMap[record.studentId] = record.status;
      });
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading attendance:', error);
      const initialAttendance = {};
      students.forEach(student => {
        initialAttendance[student.id] = 'absent';
      });
      setAttendance(initialAttendance);
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

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setIsSaving(true);
      
      const savePromises = students.map(student => {
        const status = attendance[student.id] || 'absent';
        
        return AttendanceService.markAttendance({
          lessonId: lesson.id,
          studentId: student.id,
          studentName: student.fullName,
          groupName: student.group,
          date: attendanceDate,
          status: status
        });
      });

      await Promise.all(savePromises);
      Alert.alert('Успех', 'Посещаемость сохранена');
    } catch (error) {
      console.error('Error saving attendance:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить посещаемость');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'late': return '#F59E0B';
      case 'absent': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    
    return { present, late, absent, total: students.length };
  };

  const stats = getAttendanceStats();

  return (
    <View style={ScreenStyles.attendanceScreenContainer}>
      {/* Единая шапка с заголовком и кнопками навигации */}
      <Header
        title="Посещаемость"
        showBackButton={true}
        onBack={handleBack}
        showLogoutButton={true}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleScreenHeader}
      />

      <ScrollView style={ScreenStyles.attendanceScreenScrollView} showsVerticalScrollIndicator={false}>
        {/* Информация о занятии */}
        <Section style={ScreenStyles.attendanceScreenLessonInfo}>
          <Text style={ScreenStyles.attendanceScreenLessonSubject}>{lesson.subjectName}</Text>
          <Text style={ScreenStyles.attendanceScreenLessonDetails}>
            {lesson.startTime} - {lesson.endTime} • {lesson.groups?.join(', ')}
          </Text>
          {lesson.classroom && (
            <Text style={ScreenStyles.attendanceScreenLessonClassroom}>Аудитория: {lesson.classroom}</Text>
          )}
        </Section>

        {/* Выбор даты */}
        <Section title="Дата занятия">
          <FormInput
            value={attendanceDate}
            onChangeText={setAttendanceDate}
            placeholder="YYYY-MM-DD"
            style={ScreenStyles.attendanceScreenDateInput}
          />
        </Section>

        {/* Статистика */}
        <Section>
          <View style={ScreenStyles.attendanceScreenStatsSection}>
            <View style={ScreenStyles.attendanceScreenStatItem}>
              <Text style={ScreenStyles.attendanceScreenStatNumber}>{stats.present}</Text>
              <Text style={ScreenStyles.attendanceScreenStatLabel}>Присут.</Text>
            </View>
            <View style={ScreenStyles.attendanceScreenStatItem}>
              <Text style={ScreenStyles.attendanceScreenStatNumber}>{stats.late}</Text>
              <Text style={ScreenStyles.attendanceScreenStatLabel}>Опозд.</Text>
            </View>
            <View style={ScreenStyles.attendanceScreenStatItem}>
              <Text style={ScreenStyles.attendanceScreenStatNumber}>{stats.absent}</Text>
              <Text style={ScreenStyles.attendanceScreenStatLabel}>Отсут.</Text>
            </View>
            <View style={ScreenStyles.attendanceScreenStatItem}>
              <Text style={ScreenStyles.attendanceScreenStatNumber}>{stats.total}</Text>
              <Text style={ScreenStyles.attendanceScreenStatLabel}>Всего</Text>
            </View>
          </View>
        </Section>

        {/* Список студентов */}
        <Section>
          <View style={ScreenStyles.attendanceScreenSectionHeader}>
            <Text style={ScreenStyles.attendanceScreenSectionTitle}>Студенты</Text>
            <Text style={ScreenStyles.attendanceScreenStudentsCount}>{students.length} чел.</Text>
          </View>

          {isLoading ? (
            <Text style={ScreenStyles.attendanceScreenLoadingText}>Загрузка...</Text>
          ) : students.length === 0 ? (
            <View style={ScreenStyles.attendanceScreenEmptyState}>
              <Text style={ScreenStyles.attendanceScreenEmptyStateText}>Студенты не найдены</Text>
              <Text style={ScreenStyles.attendanceScreenEmptyStateSubtext}>
                В выбранных группах нет студентов
              </Text>
            </View>
          ) : (
            students.map(student => (
              <View key={student.id} style={ScreenStyles.attendanceScreenStudentCard}>
                <View style={ScreenStyles.attendanceScreenStudentInfo}>
                  <Text style={ScreenStyles.attendanceScreenStudentName}>{student.fullName}</Text>
                  <Text style={ScreenStyles.attendanceScreenStudentGroup}>{student.group}</Text>
                </View>
                
                <View style={ScreenStyles.attendanceScreenAttendanceButtons}>
                  <TouchableOpacity
                    style={[
                      ScreenStyles.attendanceScreenStatusButton,
                      attendance[student.id] === 'present' && ScreenStyles.attendanceScreenStatusButtonActive,
                      { backgroundColor: attendance[student.id] === 'present' ? '#10B981' : '#F3F4F6' }
                    ]}
                    onPress={() => handleStatusChange(student.id, 'present')}
                  >
                    <Text style={[
                      ScreenStyles.attendanceScreenStatusButtonText,
                      attendance[student.id] === 'present' && ScreenStyles.attendanceScreenStatusButtonTextActive
                    ]}>
                      ✓
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      ScreenStyles.attendanceScreenStatusButton,
                      attendance[student.id] === 'late' && ScreenStyles.attendanceScreenStatusButtonActive,
                      { backgroundColor: attendance[student.id] === 'late' ? '#F59E0B' : '#F3F4F6' }
                    ]}
                    onPress={() => handleStatusChange(student.id, 'late')}
                  >
                    <Text style={[
                      ScreenStyles.attendanceScreenStatusButtonText,
                      attendance[student.id] === 'late' && ScreenStyles.attendanceScreenStatusButtonTextActive
                    ]}>
                      ⚡
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      ScreenStyles.attendanceScreenStatusButton,
                      attendance[student.id] === 'absent' && ScreenStyles.attendanceScreenStatusButtonActive,
                      { backgroundColor: attendance[student.id] === 'absent' ? '#EF4444' : '#F3F4F6' }
                    ]}
                    onPress={() => handleStatusChange(student.id, 'absent')}
                  >
                    <Text style={[
                      ScreenStyles.attendanceScreenStatusButtonText,
                      attendance[student.id] === 'absent' && ScreenStyles.attendanceScreenStatusButtonTextActive
                    ]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Текущий статус */}
                <View style={ScreenStyles.attendanceScreenCurrentStatus}>
                  <View 
                    style={[
                      ScreenStyles.attendanceScreenStatusBadge,
                      { backgroundColor: getStatusColor(attendance[student.id]) }
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </Section>

        {/* Кнопка сохранения */}
        <SaveButton
          onPress={handleSaveAttendance}
          text="Сохранить посещаемость"
          isLoading={isSaving}
          disabled={isSaving}
          style={ScreenStyles.attendanceScreenSaveButton}
        />
      </ScrollView>
    </View>
  );
};

export default AttendanceScreen;
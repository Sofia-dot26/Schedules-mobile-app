// screens/AttendanceScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import StudentService from '../services/StudentService';
import AttendanceService from '../services/AttendanceService';
import ScheduleService from '../services/ScheduleService';

const AttendanceScreen = ({ route, navigation }) => {
  const { lesson } = route.params;
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
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
      // Инициализируем пустую посещаемость если ошибка
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

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Присутствовал';
      case 'late': return 'Опоздал';
      case 'absent': return 'Отсутствовал';
      default: return 'Не отмечен';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Посещаемость</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Информация о занятии */}
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonSubject}>{lesson.subjectName}</Text>
          <Text style={styles.lessonDetails}>
            {lesson.startTime} - {lesson.endTime} • {lesson.groups?.join(', ')}
          </Text>
          {lesson.classroom && (
            <Text style={styles.lessonClassroom}>Аудитория: {lesson.classroom}</Text>
          )}
        </View>

        {/* Выбор даты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Дата занятия</Text>
          <TextInput
            style={styles.dateInput}
            value={attendanceDate}
            onChangeText={setAttendanceDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Статистика */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.present}</Text>
            <Text style={styles.statLabel}>Присут.</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.late}</Text>
            <Text style={styles.statLabel}>Опозд.</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Отсут.</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Всего</Text>
          </View>
        </View>

        {/* Список студентов */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Студенты</Text>
            <Text style={styles.studentsCount}>{students.length} чел.</Text>
          </View>

          {isLoading ? (
            <Text style={styles.loadingText}>Загрузка...</Text>
          ) : students.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Студенты не найдены</Text>
              <Text style={styles.emptyStateSubtext}>
                В выбранных группах нет студентов
              </Text>
            </View>
          ) : (
            students.map(student => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.fullName}</Text>
                  <Text style={styles.studentGroup}>{student.group}</Text>
                </View>
                
                <View style={styles.attendanceButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      attendance[student.id] === 'present' && styles.statusButtonActive,
                      { backgroundColor: attendance[student.id] === 'present' ? '#10B981' : '#F3F4F6' }
                    ]}
                    onPress={() => handleStatusChange(student.id, 'present')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendance[student.id] === 'present' && styles.statusButtonTextActive
                    ]}>
                      ✓
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      attendance[student.id] === 'late' && styles.statusButtonActive,
                      { backgroundColor: attendance[student.id] === 'late' ? '#F59E0B' : '#F3F4F6' }
                    ]}
                    onPress={() => handleStatusChange(student.id, 'late')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendance[student.id] === 'late' && styles.statusButtonTextActive
                    ]}>
                      ⚡
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      attendance[student.id] === 'absent' && styles.statusButtonActive,
                      { backgroundColor: attendance[student.id] === 'absent' ? '#EF4444' : '#F3F4F6' }
                    ]}
                    onPress={() => handleStatusChange(student.id, 'absent')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendance[student.id] === 'absent' && styles.statusButtonTextActive
                    ]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Текущий статус */}
                <View style={styles.currentStatus}>
                  <View 
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(attendance[student.id]) }
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Кнопка сохранения */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            isSaving && styles.saveButtonDisabled
          ]}
          onPress={handleSaveAttendance}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Сохранение...' : 'Сохранить посещаемость'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontSize: 24,
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  lessonInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lessonSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 8,
  },
  lessonDetails: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  lessonClassroom: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A306D',
  },
  studentsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A306D',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 4,
  },
  studentGroup: {
    fontSize: 14,
    color: '#6B7280',
  },
  attendanceButtons: {
    flexDirection: 'row',
    marginRight: 10,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  statusButtonActive: {
    borderColor: '#4A306D',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  currentStatus: {
    width: 20,
    alignItems: 'center',
  },
  statusBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    padding: 20,
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
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4A306D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AttendanceScreen;
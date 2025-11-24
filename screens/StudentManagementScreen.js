// screens/StudentManagementScreen.js
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

const StudentManagementScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedGroup, searchQuery]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const studentsData = await StudentService.getAllStudents();
      const groupsData = await StudentService.getAllGroups();
      
      setStudents(studentsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить студентов');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Фильтрация по группе
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(student => student.group === selectedGroup);
    }

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.lastName.toLowerCase().includes(query) ||
        student.firstName.toLowerCase().includes(query) ||
        student.middleName?.toLowerCase().includes(query) ||
        student.group.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
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

  const handleAddStudent = () => {
    navigation.navigate('AddStudent');
  };

  const handleEditStudent = (student) => {
    navigation.navigate('AddStudent', { student, isEdit: true });
  };

  const handleDeleteStudent = (student) => {
    Alert.alert(
      'Удаление студента',
      `Вы уверены, что хотите удалить студента ${student.lastName} ${student.firstName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            try {
              await StudentService.deleteStudent(student.id);
              Alert.alert('Успех', 'Студент удален');
              loadStudents();
            } catch (error) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить студента');
            }
          }
        }
      ]
    );
  };

  const getStudentsCountByGroup = (group) => {
    return students.filter(s => s.group === group).length;
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
          <Text style={styles.headerTitle}>Управление студентами</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Поиск и фильтры */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по ФИО, группе или номеру билета..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <Text style={styles.filterTitle}>Фильтр по группе:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>
            <View style={styles.groupsContainer}>
              <TouchableOpacity
                style={[
                  styles.groupFilter,
                  selectedGroup === 'all' && styles.groupFilterActive
                ]}
                onPress={() => setSelectedGroup('all')}
              >
                <Text style={[
                  styles.groupFilterText,
                  selectedGroup === 'all' && styles.groupFilterTextActive
                ]}>
                  Все группы
                </Text>
              </TouchableOpacity>
              
              {groups.map(group => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.groupFilter,
                    selectedGroup === group && styles.groupFilterActive
                  ]}
                  onPress={() => setSelectedGroup(group)}
                >
                  <Text style={[
                    styles.groupFilterText,
                    selectedGroup === group && styles.groupFilterTextActive
                  ]}>
                    {group} ({getStudentsCountByGroup(group)})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Кнопка добавления */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddStudent}
        >
          <Text style={styles.addButtonText}>+ Добавить студента</Text>
        </TouchableOpacity>

        {/* Список студентов */}
        <View style={styles.studentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Студенты {selectedGroup !== 'all' ? `(${selectedGroup})` : ''}
            </Text>
            <Text style={styles.studentsCount}>
              {filteredStudents.length} из {students.length}
            </Text>
          </View>

          {isLoading ? (
            <Text style={styles.loadingText}>Загрузка студентов...</Text>
          ) : filteredStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {students.length === 0 ? 'Нет студентов' : 'Студенты не найдены'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {students.length === 0 
                  ? 'Добавьте первого студента' 
                  : 'Попробуйте изменить параметры поиска'
                }
              </Text>
            </View>
          ) : (
            filteredStudents.map(student => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {student.lastName} {student.firstName} {student.middleName || ''}
                  </Text>
                  <Text style={styles.studentDetails}>
                    Группа: {student.group} • №: {student.studentId}
                  </Text>
                  {student.email && (
                    <Text style={styles.studentContact}>Email: {student.email}</Text>
                  )}
                  {student.phone && (
                    <Text style={styles.studentContact}>Телефон: {student.phone}</Text>
                  )}
                </View>
                
                <View style={styles.studentActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditStudent(student)}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStudent(student)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

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
  filtersSection: {
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
  searchInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 10,
  },
  groupsScroll: {
    marginHorizontal: -5,
  },
  groupsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  groupFilter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  groupFilterActive: {
    backgroundColor: '#4A306D',
    borderColor: '#4A306D',
  },
  groupFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
  },
  groupFilterTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#4A306D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  studentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    padding: 20,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  studentDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  studentContact: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default StudentManagementScreen;
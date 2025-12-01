import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Alert
} from 'react-native';
import StudentService from '../services/StudentService';
import Header from '../components/Header';
import Section from '../components/Section';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import FilterChip from '../components/FilterChip';
import StudentCard from '../components/StudentCard';
import { ScreenStyles } from '../styles/ScreenStyles';

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
    <View style={ScreenStyles.studentManagementScreenContainer}>
      <Header
        title="Управление студентами"
        onBack={handleBack}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleManagementScreenHeader}
      />

      <ScrollView style={ScreenStyles.studentManagementScreenScrollView} showsVerticalScrollIndicator={false}>
        
        {/* Поиск и фильтры */}
        <Section style={ScreenStyles.studentManagementScreenFiltersSection}>
          <FormInput
            placeholder="Поиск по ФИО, группе или номеру билета..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={ScreenStyles.studentManagementScreenSearchInput}
          />
          
          <Text style={ScreenStyles.studentManagementScreenFilterTitle}>Фильтр по группе:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ScreenStyles.studentManagementScreenGroupsScroll}>
            <View style={ScreenStyles.studentManagementScreenGroupsContainer}>
              <FilterChip
                label="Все группы"
                isActive={selectedGroup === 'all'}
                onPress={() => setSelectedGroup('all')}
              />
              
              {groups.map(group => (
                <FilterChip
                  key={group}
                  label={`${group} (${getStudentsCountByGroup(group)})`}
                  isActive={selectedGroup === group}
                  onPress={() => setSelectedGroup(group)}
                />
              ))}
            </View>
          </ScrollView>
        </Section>

        {/* Кнопка добавления */}
        <SaveButton
          onPress={handleAddStudent}
          text="+ Добавить студента"
          style={ScreenStyles.studentManagementScreenAddButton}
        />

        {/* Список студентов */}
        <Section>
          <View style={ScreenStyles.studentManagementScreenSectionHeader}>
            <Text style={ScreenStyles.studentManagementScreenSectionTitle}>
              Студенты {selectedGroup !== 'all' ? `(${selectedGroup})` : ''}
            </Text>
            <Text style={ScreenStyles.studentManagementScreenStudentsCount}>
              {filteredStudents.length} из {students.length}
            </Text>
          </View>

          {isLoading ? (
            <Text style={ScreenStyles.commonLoadingText}>Загрузка студентов...</Text>
          ) : filteredStudents.length === 0 ? (
            <View style={ScreenStyles.commonEmptyState}>
              <Text style={ScreenStyles.commonEmptyStateText}>
                {students.length === 0 ? 'Нет студентов' : 'Студенты не найдены'}
              </Text>
              <Text style={ScreenStyles.commonEmptyStateSubtext}>
                {students.length === 0 
                  ? 'Добавьте первого студента' 
                  : 'Попробуйте изменить параметры поиска'
                }
              </Text>
            </View>
          ) : (
            filteredStudents.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
                style={ScreenStyles.studentManagementScreenStudentCard}
              />
            ))
          )}
        </Section>

      </ScrollView>
    </View>
  );
};

export default StudentManagementScreen;
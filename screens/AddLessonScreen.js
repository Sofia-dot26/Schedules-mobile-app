// screens/AddLessonScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  TextInput,
  Modal
} from 'react-native';
import ScheduleService from '../services/ScheduleService';
import GroupService from '../services/GroupService';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupSelector from '../components/GroupSelector';

const AddLessonScreen = ({ navigation }) => {
  const [selectedWeek, setSelectedWeek] = useState('numerator');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]); 
  const [classroom, setClassroom] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadAvailableGroups();
  }, []);

  const loadSubjects = async () => {
    try {
      const subjectsData = await ScheduleService.getAllSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadAvailableGroups = async () => {
    try {
      const groups = await GroupService.getAllGroups();
      setAvailableGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список групп');
    }
  };

  const timeSlots = [
    { id: 1, start: '8:30', end: '10:00' },
    { id: 2, start: '10:20', end: '11:50' },
    { id: 3, start: '12:10', end: '13:40' },
    { id: 4, start: '14:00', end: '15:30' },
    { id: 5, start: '15:50', end: '17:20' },
  ];

  const days = [
    { id: 1, name: 'Понедельник', short: 'ПН' },
    { id: 2, name: 'Вторник', short: 'ВТ' },
    { id: 3, name: 'Среда', short: 'СР' },
    { id: 4, name: 'Четверг', short: 'ЧТ' },
    { id: 5, name: 'Пятница', short: 'ПТ' },
  ];

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Ошибка', 'Введите название предмета');
      return;
    }

    try {
      setIsLoading(true);
      const newSubject = await ScheduleService.createSubject({
        name: newSubjectName.trim(),
        groups: []
      });

      setSubjects([...subjects, newSubject]);
      setSelectedSubject(newSubject);
      setNewSubjectName('');
      setShowSubjectModal(false);
      Alert.alert('Успех', 'Предмет добавлен');
    } catch (error) {
      Alert.alert('Ошибка', error.message || 'Не удалось добавить предмет');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setAvailableGroups(prev => [newGroup, ...prev]);
    setSelectedGroups(prev => [...prev, newGroup]);
  };

const handleSaveLesson = async () => {
  if (!selectedSubject) {
    Alert.alert('Ошибка', 'Выберите предмет');
    return;
  }

  if (!selectedTime) {
    Alert.alert('Ошибка', 'Выберите время');
    return;
  }

  if (selectedGroups.length === 0) {
    Alert.alert('Ошибка', 'Выберите хотя бы одну группу');
    return;
  }

try {
    setIsLoading(true);
    const timeSlot = timeSlots.find(t => t.id === selectedTime);

    const groupNames = selectedGroups.map(group => {
      if (typeof group === 'string') {
        return group.trim();
      }
      return group.name.trim(); // если это объект группы
    }).filter(name => name.length > 0); // убираем пустые строки

    if (groupNames.length === 0) {
      throw new Error('Нет валидных названий групп');
    }
    const lessonData = {
      subjectId: selectedSubject.id,
      groups: groupNames, 
      dayOfWeek: selectedDay,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      weekType: selectedWeek,
      classroom: classroom.trim() || null
    };

    console.log('Saving lesson data:', lessonData); // для отладки

    const createdLessons = await ScheduleService.createLesson(lessonData);
    
    Alert.alert(
      'Успех',
      `Занятие добавлено в расписание для ${createdLessons.length} групп`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    } catch (error) {
    console.error('Error saving lesson:', error);
    Alert.alert('Ошибка', error.message || 'Не удалось добавить занятие');
  } finally {
    setIsLoading(false);
  }
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
          <Text style={styles.headerTitle}>Добавление занятия</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Выбор недели */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите неделю</Text>
          <View style={styles.weekSelector}>
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

        {/* Выбор дня */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите день</Text>
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
          <Text style={styles.selectedDayText}>
            {days.find(d => d.id === selectedDay)?.name}
          </Text>
        </View>

        {/* Выбор времени */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите время</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map(time => (
              <TouchableOpacity
                key={time.id}
                style={[
                  styles.timeSlot,
                  selectedTime === time.id && styles.timeSlotActive
                ]}
                onPress={() => setSelectedTime(time.id)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time.id && styles.timeTextActive
                ]}>
                  {time.start} - {time.end}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Выбор групп */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите группы</Text>
          <Text style={styles.groupsHint}>
            Можно выбрать несколько групп, которые будут присутствовать на занятии
          </Text>
          
          <GroupSelector
            availableGroups={availableGroups}
            selectedGroups={selectedGroups}
            onGroupsChange={setSelectedGroups}
            onCreateGroup={() => setShowGroupModal(true)}
          />
        </View>

        {/* Ввод аудитории */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Аудитория (необязательно)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Введите номер аудитории"
            placeholderTextColor="#9CA3AF"
            value={classroom}
            onChangeText={setClassroom}
          />
        </View>

        {/* Выбор предмета */}
        <View style={styles.section}>
          <View style={styles.subjectHeader}>
            <Text style={styles.sectionTitle}>Выберите предмет</Text>
            <TouchableOpacity 
              style={styles.addSubjectButton}
              onPress={() => setShowSubjectModal(true)}
            >
              <Text style={styles.addSubjectButtonText}>+ Новый</Text>
            </TouchableOpacity>
          </View>

          {selectedSubject && (
            <View style={styles.selectedSubject}>
              <Text style={styles.selectedSubjectName}>{selectedSubject.name}</Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
            <View style={styles.subjectsContainer}>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectCard,
                    selectedSubject?.id === subject.id && styles.subjectCardActive
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <Text style={[
                    styles.subjectCardName,
                    selectedSubject?.id === subject.id && styles.subjectCardNameActive
                  ]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Кнопка сохранения */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!selectedSubject || !selectedTime || selectedGroups.length === 0 || isLoading) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveLesson}
          disabled={!selectedSubject || !selectedTime || selectedGroups.length === 0 || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Добавление...' : `Сохранить занятие (${selectedGroups.length} групп)`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Модальное окно добавления предмета */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить новый предмет</Text>
            
            <Text style={styles.modalLabel}>Название предмета</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Введите название предмета"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSubjectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddSubject}
                disabled={isLoading}
              >
                <Text style={styles.addButtonText}>
                  {isLoading ? 'Добавление...' : 'Добавить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модальное окно создания группы */}
      <CreateGroupModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
  },

  // Стили для выбора недели
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekButton: {
    flex: 1,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
  },
  weekButtonTextActive: {
    color: '#FFFFFF',
  },

  // Стили для выбора дня
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
  selectedDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
    textAlign: 'center',
    marginTop: 10,
  },

  // Стили для выбора времени
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotActive: {
    backgroundColor: '#4A306D',
    borderColor: '#4A306D',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
  },
  timeTextActive: {
    color: '#FFFFFF',
  },

  // Стили для выбора группы
  selectedGroupContainer: {
    marginBottom: 16,
  },
  selectedGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A306D',
  },
  selectedGroupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A306D',
  },
  changeGroupButton: {
    padding: 8,
  },
  changeGroupButtonText: {
    color: '#8B3A62',
    fontSize: 14,
    fontWeight: '600',
  },
  groupSelection: {
    marginBottom: 16,
  },
  availableGroupsTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  groupsContainer: {
    flexDirection: 'row',
  },
  groupChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupChipText: {
    fontSize: 14,
    color: '#4A306D',
    fontWeight: '600',
  },
  groupsHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  noGroupsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  noGroupsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  noGroupsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  createGroupButton: {
    backgroundColor: 'rgba(74, 48, 109, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A306D',
    borderStyle: 'dashed',
  },
  createGroupButtonText: {
    color: '#4A306D',
    fontSize: 16,
    fontWeight: '600',
  },

  // Стили для выбора предмета
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addSubjectButton: {
    backgroundColor: '#4A306D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSubjectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedSubject: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4A306D',
  },
  selectedSubjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A306D',
  },
  subjectsScroll: {
    marginHorizontal: -5,
  },
  subjectsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  subjectCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#F8F7FF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  subjectCardActive: {
    backgroundColor: '#4A306D',
    borderColor: '#4A306D',
  },
  subjectCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A306D',
    textAlign: 'center',
  },
  subjectCardNameActive: {
    color: '#FFFFFF',
  },

  // Стили для кнопки сохранения
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

  // Стили для модального окна
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A306D',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#4A306D',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddLessonScreen;
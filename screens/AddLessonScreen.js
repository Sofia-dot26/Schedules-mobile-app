import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal
} from 'react-native';
import ScheduleService from '../services/ScheduleService';
import GroupService from '../services/GroupService';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupSelector from '../components/GroupSelector';
import Header from '../components/Header';
import Section from '../components/Section';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import { ScreenStyles } from '../styles/ScreenStyles';

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
        return group.name.trim();
      }).filter(name => name.length > 0);

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
    <View style={ScreenStyles.addLessonScreenContainer}>
      <Header
        title="Добавление занятия"
        onBack={handleBack}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleManagementScreenHeader}
      />

      <ScrollView style={ScreenStyles.addLessonScreenScrollView} showsVerticalScrollIndicator={false}>
        {/* Выбор недели */}
        <Section title="Выберите неделю">
          <View style={ScreenStyles.addLessonScreenWeekSelector}>
            <TouchableOpacity
              style={[
                ScreenStyles.addLessonScreenWeekButton,
                selectedWeek === 'numerator' && ScreenStyles.addLessonScreenWeekButtonActive
              ]}
              onPress={() => setSelectedWeek('numerator')}
            >
              <Text style={[
                ScreenStyles.addLessonScreenWeekButtonText,
                selectedWeek === 'numerator' && ScreenStyles.addLessonScreenWeekButtonTextActive
              ]}>
                Числитель
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                ScreenStyles.addLessonScreenWeekButton,
                selectedWeek === 'denominator' && ScreenStyles.addLessonScreenWeekButtonActive
              ]}
              onPress={() => setSelectedWeek('denominator')}
            >
              <Text style={[
                ScreenStyles.addLessonScreenWeekButtonText,
                selectedWeek === 'denominator' && ScreenStyles.addLessonScreenWeekButtonTextActive
              ]}>
                Знаменатель
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Выбор дня */}
        <Section title="Выберите день">
          <View style={ScreenStyles.addLessonScreenDaysSelector}>
            {days.map(day => (
              <TouchableOpacity
                key={day.id}
                style={[
                  ScreenStyles.addLessonScreenDayButton,
                  selectedDay === day.id && ScreenStyles.addLessonScreenDayButtonActive
                ]}
                onPress={() => setSelectedDay(day.id)}
              >
                <Text style={[
                  ScreenStyles.addLessonScreenDayButtonText,
                  selectedDay === day.id && ScreenStyles.addLessonScreenDayButtonTextActive
                ]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={ScreenStyles.addLessonScreenSelectedDayText}>
            {days.find(d => d.id === selectedDay)?.name}
          </Text>
        </Section>

        {/* Выбор времени */}
        <Section title="Выберите время">
          <View style={ScreenStyles.addLessonScreenTimeGrid}>
            {timeSlots.map(time => (
              <TouchableOpacity
                key={time.id}
                style={[
                  ScreenStyles.addLessonScreenTimeSlot,
                  selectedTime === time.id && ScreenStyles.addLessonScreenTimeSlotActive
                ]}
                onPress={() => setSelectedTime(time.id)}
              >
                <Text style={[
                  ScreenStyles.addLessonScreenTimeText,
                  selectedTime === time.id && ScreenStyles.addLessonScreenTimeTextActive
                ]}>
                  {time.start} - {time.end}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Выбор групп */}
        <Section title="Выберите группы">
          <Text style={ScreenStyles.addLessonScreenGroupsHint}>
            Можно выбрать несколько групп, которые будут присутствовать на занятии
          </Text>
          
          <GroupSelector
            availableGroups={availableGroups}
            selectedGroups={selectedGroups}
            onGroupsChange={setSelectedGroups}
            onCreateGroup={() => setShowGroupModal(true)}
          />
        </Section>

        {/* Ввод аудитории */}
        <Section title="Аудитория (необязательно)">
          <FormInput
            placeholder="Введите номер аудитории"
            value={classroom}
            onChangeText={setClassroom}
            style={ScreenStyles.addLessonScreenTextInput}
          />
        </Section>

        {/* Выбор предмета */}
        <Section>
          <View style={ScreenStyles.addLessonScreenSubjectHeader}>
            <Text style={ScreenStyles.addLessonScreenSectionTitle}>Выберите предмет</Text>
            <TouchableOpacity 
              style={ScreenStyles.addLessonScreenAddSubjectButton}
              onPress={() => setShowSubjectModal(true)}
            >
              <Text style={ScreenStyles.addLessonScreenAddSubjectButtonText}>+ Новый</Text>
            </TouchableOpacity>
          </View>

          {selectedSubject && (
            <View style={ScreenStyles.addLessonScreenSelectedSubject}>
              <Text style={ScreenStyles.addLessonScreenSelectedSubjectName}>{selectedSubject.name}</Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ScreenStyles.addLessonScreenSubjectsScroll}>
            <View style={ScreenStyles.addLessonScreenSubjectsContainer}>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    ScreenStyles.addLessonScreenSubjectCard,
                    selectedSubject?.id === subject.id && ScreenStyles.addLessonScreenSubjectCardActive
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <Text style={[
                    ScreenStyles.addLessonScreenSubjectCardName,
                    selectedSubject?.id === subject.id && ScreenStyles.addLessonScreenSubjectCardNameActive
                  ]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Section>

        {/* Кнопка сохранения */}
        <SaveButton
          onPress={handleSaveLesson}
          text={`Сохранить занятие (${selectedGroups.length} групп)`}
          isLoading={isLoading}
          disabled={!selectedSubject || !selectedTime || selectedGroups.length === 0}
          style={[
            ScreenStyles.addLessonScreenSaveButton,
            (!selectedSubject || !selectedTime || selectedGroups.length === 0 || isLoading) && ScreenStyles.addLessonScreenSaveButtonDisabled
          ]}
        />
      </ScrollView>

      {/* Модальное окно добавления предмета */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={ScreenStyles.addLessonScreenModalOverlay}>
          <View style={ScreenStyles.addLessonScreenModalContent}>
            <Text style={ScreenStyles.addLessonScreenModalTitle}>Добавить новый предмет</Text>
            
            <Text style={ScreenStyles.addLessonScreenModalLabel}>Название предмета</Text>
            <FormInput
              placeholder="Введите название предмета"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              style={ScreenStyles.addLessonScreenModalInput}
            />

            <View style={ScreenStyles.addLessonScreenModalButtons}>
              <TouchableOpacity 
                style={[ScreenStyles.addLessonScreenModalButton, ScreenStyles.addLessonScreenModalCancelButton]}
                onPress={() => setShowSubjectModal(false)}
              >
                <Text style={ScreenStyles.addLessonScreenModalCancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <SaveButton
                onPress={handleAddSubject}
                text="Добавить"
                isLoading={isLoading}
                disabled={!newSubjectName.trim()}
                style={[ScreenStyles.addLessonScreenModalButton, ScreenStyles.addLessonScreenModalAddButton]}
                textStyle={ScreenStyles.addLessonScreenModalAddButtonText}
              />
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

export default AddLessonScreen;
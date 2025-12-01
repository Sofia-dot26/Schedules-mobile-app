import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert
} from 'react-native';
import StudentService from '../services/StudentService';
import GroupService from '../services/GroupService';
import CreateGroupModal from '../components/CreateGroupModal';
import Header from '../components/Header';
import Section from '../components/Section';
import FormLabel from '../components/FormLabel';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import { ScreenStyles } from '../styles/ScreenStyles';

const AddStudentScreen = ({ route, navigation }) => {
  const { student, isEdit } = route.params || {};
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    loadAvailableGroups();
    
    if (isEdit && student) {
      setLastName(student.lastName);
      setFirstName(student.firstName);
      setMiddleName(student.middleName || '');
      setSelectedGroup(student.group_id ? { id: student.group_id, name: student.group } : null);
      setStudentId(student.studentId);
      setEmail(student.email || '');
      setPhone(student.phone || '');
    }
  }, [isEdit, student]);

  const loadAvailableGroups = async () => {
    try {
      const groups = await GroupService.getAllGroups();
      setAvailableGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список групп');
    }
  };

  const handleGroupCreated = (newGroup) => {
    setAvailableGroups(prev => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
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

  const handleSave = async () => {
    if (!lastName.trim() || !firstName.trim() || !selectedGroup || !studentId.trim()) {
      Alert.alert('Ошибка', 'Заполните обязательные поля: Фамилия, Имя, Группа, Номер студенческого билета');
      return;
    }

    try {
      setIsLoading(true);
      
      const studentData = {
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        group_id: selectedGroup.id, 
        group_name: selectedGroup.name, 
        studentId: studentId.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null
      };

      if (isEdit) {
        await StudentService.updateStudent(student.id, studentData);
        Alert.alert('Успех', 'Данные студента обновлены');
      } else {
        await StudentService.createStudent(studentData);
        Alert.alert('Успех', 'Студент добавлен');
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', error.message || 'Не удалось сохранить данные студента');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStudentId = () => {
    if (!selectedGroup) {
      Alert.alert('Внимание', 'Сначала выберите группу');
      return;
    }
    
    const groupPrefix = selectedGroup.name.replace('-', '').toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setStudentId(`${groupPrefix}${randomNum}`);
  };

  return (
    <View style={ScreenStyles.addStudentScreenContainer}>
      <Header
        title={isEdit ? 'Редактирование студента' : 'Добавление студента'}
        onBack={handleBack}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleManagementScreenHeader}
      />

      <ScrollView style={ScreenStyles.addStudentScreenScrollView} showsVerticalScrollIndicator={false}>
        
        {/* Основная информация */}
        <Section title="Основная информация">
          <FormLabel text="Фамилия" required />
          <FormInput
            placeholder="Введите фамилию"
            value={lastName}
            onChangeText={setLastName}
          />
          
          <FormLabel text="Имя" required />
          <FormInput
            placeholder="Введите имя"
            value={firstName}
            onChangeText={setFirstName}
          />
          
          <FormLabel text="Отчество" />
          <FormInput
            placeholder="Введите отчество (если есть)"
            value={middleName}
            onChangeText={setMiddleName}
          />
        </Section>

        {/* Академическая информация */}
        <Section title="Академическая информация">
          <FormLabel text="Группа" required />
          
          {selectedGroup ? (
            <View style={ScreenStyles.addStudentScreenSelectedGroupContainer}>
              <View style={ScreenStyles.addStudentScreenSelectedGroup}>
                <Text style={ScreenStyles.addStudentScreenSelectedGroupText}>{selectedGroup.name}</Text>
                <TouchableOpacity 
                  style={ScreenStyles.addStudentScreenChangeGroupButton}
                  onPress={() => setSelectedGroup(null)}
                >
                  <Text style={ScreenStyles.addStudentScreenChangeGroupButtonText}>Изменить</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={ScreenStyles.addStudentScreenGroupSelection}>
              {availableGroups.length > 0 ? (
                <>
                  <Text style={ScreenStyles.addStudentScreenAvailableGroupsTitle}>Выберите группу:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={ScreenStyles.addStudentScreenGroupsContainer}>
                      {availableGroups.map(group => (
                        <TouchableOpacity
                          key={group.id}
                          style={ScreenStyles.addStudentScreenGroupChip}
                          onPress={() => setSelectedGroup(group)}
                        >
                          <Text style={ScreenStyles.addStudentScreenGroupChipText}>{group.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  
                  <View style={ScreenStyles.addStudentScreenDivider}>
                    <View style={ScreenStyles.addStudentScreenDividerLine} />
                    <Text style={ScreenStyles.addStudentScreenDividerText}>или</Text>
                    <View style={ScreenStyles.addStudentScreenDividerLine} />
                  </View>
                </>
              ) : (
                <View style={ScreenStyles.addStudentScreenNoGroupsContainer}>
                  <Text style={ScreenStyles.addStudentScreenNoGroupsText}>Группы не найдены</Text>
                  <Text style={ScreenStyles.addStudentScreenNoGroupsSubtext}>
                    Для добавления студента сначала создайте группу
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={ScreenStyles.addStudentScreenCreateGroupButton}
                onPress={() => setShowGroupModal(true)}
              >
                <Text style={ScreenStyles.addStudentScreenCreateGroupButtonText}>+ Создать новую группу</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <FormLabel text="Номер студенческого билета" required />
          <View style={ScreenStyles.addStudentScreenStudentIdContainer}>
            <FormInput
              style={ScreenStyles.addStudentScreenStudentIdInput}
              placeholder="Например: IST122001"
              value={studentId}
              onChangeText={setStudentId}
            />
            <TouchableOpacity 
              style={ScreenStyles.addStudentScreenGenerateButton}
              onPress={generateStudentId}
              disabled={!selectedGroup}
            >
              <Text style={[
                ScreenStyles.addStudentScreenGenerateButtonText,
                !selectedGroup && ScreenStyles.addStudentScreenGenerateButtonTextDisabled
              ]}>
                🎲
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Контактная информация */}
        <Section title="Контактная информация">
          <FormLabel text="Email" />
          <FormInput
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <FormLabel text="Телефон" />
          <FormInput
            placeholder="+7 (XXX) XXX-XX-XX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Section>

        {/* Кнопка сохранения */}
        <SaveButton
          onPress={handleSave}
          text={isEdit ? 'Обновить данные' : 'Добавить студента'}
          isLoading={isLoading}
          disabled={!selectedGroup}
          style={ScreenStyles.addStudentScreenSaveButton}
          textStyle={ScreenStyles.addStudentScreenSaveButtonText}
        />

      </ScrollView>

      <CreateGroupModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </View>
  );
};

export default AddStudentScreen;
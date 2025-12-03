// AddStudentScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Switch
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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isHeadman, setIsHeadman] = useState(false);
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
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setIsHeadman(student.isHeadman || false);
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
    if (!lastName.trim() || !firstName.trim() || !selectedGroup) {
      Alert.alert('Ошибка', 'Заполните обязательные поля: Фамилия, Имя, Группа');
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
        email: email.trim() || null,
        phone: phone.trim() || null,
        isHeadman: isHeadman
      };

      if (isEdit) {
        // Если назначаем старосту, проверяем не назначен ли уже другой староста
        if (isHeadman && student.id) {
          const currentHeadman = await StudentService.getGroupHeadman(selectedGroup.name);
          if (currentHeadman && currentHeadman.id !== student.id) {
            const confirm = await new Promise((resolve) => {
              Alert.alert(
                'Назначить старостой',
                `В группе "${selectedGroup.name}" уже есть староста "${currentHeadman.fullName}". Заменить его?`,
                [
                  { text: 'Отмена', onPress: () => resolve(false) },
                  { text: 'Заменить', onPress: () => resolve(true) }
                ]
              );
            });
            
            if (!confirm) {
              setIsLoading(false);
              return;
            }
          }
        }
        
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
          
          {/* Переключатель "Староста" */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: 16,
            padding: 12,
            backgroundColor: '#F8F7FF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#4A306D' }}>Староста группы</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                Назначить этого студента старостой группы
              </Text>
            </View>
            <Switch
              value={isHeadman}
              onValueChange={setIsHeadman}
              trackColor={{ false: '#D1D5DB', true: '#4A306D' }}
              thumbColor="#FFFFFF"
            />
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
// screens/AddStudentScreen.js 
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
import GroupService from '../services/GroupService';
import CreateGroupModal from '../components/CreateGroupModal';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Редактирование студента' : 'Добавление студента'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Основная информация */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основная информация</Text>
          
          <Text style={styles.label}>Фамилия *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите фамилию"
            placeholderTextColor="#9CA3AF"
            value={lastName}
            onChangeText={setLastName}
          />
          
          <Text style={styles.label}>Имя *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите имя"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
          />
          
          <Text style={styles.label}>Отчество</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите отчество (если есть)"
            placeholderTextColor="#9CA3AF"
            value={middleName}
            onChangeText={setMiddleName}
          />
        </View>

        {/* Академическая информация */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Академическая информация</Text>
          
          <Text style={styles.label}>Группа *</Text>
          
          {selectedGroup ? (
            <View style={styles.selectedGroupContainer}>
              <View style={styles.selectedGroup}>
                <Text style={styles.selectedGroupText}>{selectedGroup.name}</Text>
                <TouchableOpacity 
                  style={styles.changeGroupButton}
                  onPress={() => setSelectedGroup(null)}
                >
                  <Text style={styles.changeGroupButtonText}>Изменить</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.groupSelection}>
              {availableGroups.length > 0 ? (
                <>
                  <Text style={styles.availableGroupsTitle}>Выберите группу:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.groupsContainer}>
                      {availableGroups.map(group => (
                        <TouchableOpacity
                          key={group.id}
                          style={styles.groupChip}
                          onPress={() => setSelectedGroup(group)}
                        >
                          <Text style={styles.groupChipText}>{group.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>или</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </>
              ) : (
                <View style={styles.noGroupsContainer}>
                  <Text style={styles.noGroupsText}>Группы не найдены</Text>
                  <Text style={styles.noGroupsSubtext}>
                    Для добавления студента сначала создайте группу
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.createGroupButton}
                onPress={() => setShowGroupModal(true)}
              >
                <Text style={styles.createGroupButtonText}>+ Создать новую группу</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.label}>Номер студенческого билета *</Text>
          <View style={styles.studentIdContainer}>
            <TextInput
              style={[styles.input, styles.studentIdInput]}
              placeholder="Например: IST122001"
              placeholderTextColor="#9CA3AF"
              value={studentId}
              onChangeText={setStudentId}
            />
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateStudentId}
              disabled={!selectedGroup}
            >
              <Text style={[
                styles.generateButtonText,
                !selectedGroup && styles.generateButtonTextDisabled
              ]}>
                🎲
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Контактная информация */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контактная информация</Text>
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>Телефон</Text>
          <TextInput
            style={styles.input}
            placeholder="+7 (XXX) XXX-XX-XX"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Кнопка сохранения */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!selectedGroup || isLoading) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!selectedGroup || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Сохранение...' : (isEdit ? 'Обновить данные' : 'Добавить студента')}
          </Text>
        </TouchableOpacity>

      </ScrollView>

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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
    marginBottom: 16,
  },
  studentIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentIdInput: {
    flex: 1,
    marginRight: 10,
  },
  generateButton: {
    backgroundColor: '#4A306D',
    padding: 16,
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
  },
  generateButtonTextDisabled: {
    opacity: 0.5,
  },
  
  // Новые стили для выбора группы
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

export default AddStudentScreen;
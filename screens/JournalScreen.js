// screens/JournalScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const JournalScreen = ({ navigation }) => {
  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  const handleStudentManagement = () => {
    navigation.navigate('StudentManagement');
  };


  return (
    <View style={styles.container}>
      {/* Header с кнопкой выхода */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Журнал</Text>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Выйти</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subheader}>Учет посещаемости</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('ScheduleManagement')}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Управление занятиями</Text>
            <Text style={styles.menuItemDescription}>
              Загрузка и редактирование расписания
            </Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Schedule')}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Просмотр расписания</Text>
            <Text style={styles.menuItemDescription}>
              Текущее расписание по дням недели
            </Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleStudentManagement}
        > 
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Управление студентами</Text>
            <Text style={styles.menuItemDescription}>
              Добавление и редактирование студентов
            </Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A306D',
    flex: 1,
  },
  subheader: {
    fontSize: 18,
    color: '#6B7280',
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
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#4A306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 24,
    color: '#4A306D',
    fontWeight: 'bold',
  },
});

export default JournalScreen;
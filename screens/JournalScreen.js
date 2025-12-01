import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Section from '../components/Section';
import { ScreenStyles } from '../styles/ScreenStyles';

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
    <View style={ScreenStyles.journalScreenContainer}>
      <Header
        title="Журнал"
        onBack={() => {}}
        onLogout={handleLogout}
        showBackButton={false}
        headerStyle={ScreenStyles.journalScreenHeader}
      />
      <ScrollView style={ScreenStyles.commonScrollView} showsVerticalScrollIndicator={false}>
      <Text style={ScreenStyles.journalScreenSubheader}>Учет посещаемости</Text>

      <Section style={ScreenStyles.journalScreenMenu}>
        <TouchableOpacity 
          style={ScreenStyles.journalScreenMenuItem}
          onPress={() => navigation.navigate('ScheduleManagement')}
        >
          <View style={ScreenStyles.journalScreenMenuItemContent}>
            <Text style={ScreenStyles.journalScreenMenuItemTitle}>Управление занятиями</Text>
            <Text style={ScreenStyles.journalScreenMenuItemDescription}>
              Загрузка и редактирование расписания
            </Text>
          </View>
          <Text style={ScreenStyles.journalScreenMenuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={ScreenStyles.journalScreenMenuItem}
          onPress={() => navigation.navigate('Schedule')}
        >
          <View style={ScreenStyles.journalScreenMenuItemContent}>
            <Text style={ScreenStyles.journalScreenMenuItemTitle}>Просмотр расписания</Text>
            <Text style={ScreenStyles.journalScreenMenuItemDescription}>
              Текущее расписание по дням недели
            </Text>
          </View>
          <Text style={ScreenStyles.journalScreenMenuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={ScreenStyles.journalScreenMenuItem}
          onPress={handleStudentManagement}
        > 
          <View style={ScreenStyles.journalScreenMenuItemContent}>
            <Text style={ScreenStyles.journalScreenMenuItemTitle}>Управление студентами</Text>
            <Text style={ScreenStyles.journalScreenMenuItemDescription}>
              Добавление и редактирование студентов
            </Text>
          </View>
          <Text style={ScreenStyles.journalScreenMenuArrow}>›</Text>
        </TouchableOpacity>
      </Section>
      </ScrollView>
    </View>
  );
};

export default JournalScreen;
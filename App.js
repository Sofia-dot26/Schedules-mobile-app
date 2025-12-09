// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import JournalScreen from './screens/JournalScreen';
import ScheduleManagementScreen from './screens/ScheduleManagementScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import AddLessonScreen from './screens/AddLessonScreen';
import SubjectDetailScreen from './screens/SubjectDetailScreen';
import StudentManagementScreen from './screens/StudentManagementScreen';
import AddStudentScreen from './screens/AddStudentScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import DocumentationScreen from './screens/DocumentationScreen';
import RegistrationScreen from './screens/RegistrationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="ScheduleManagement" component={ScheduleManagementScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="AddLesson" component={AddLessonScreen} />
        <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
        <Stack.Screen name="StudentManagement" component={StudentManagementScreen} />
        <Stack.Screen name="AddStudent" component={AddStudentScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ 
          title: 'Посещаемость',
          headerShown: true 
        }}
      />
      <Stack.Screen 
          name="Documentation" 
          component={DocumentationScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
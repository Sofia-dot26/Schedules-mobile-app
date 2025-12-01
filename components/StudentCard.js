import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenStyles } from '../styles/ScreenStyles';

const StudentCard = ({ 
  student,
  onEdit,
  onDelete,
  style
}) => {
  return (
    <View style={[ScreenStyles.commonStudentCard, style]}>
      <View style={ScreenStyles.commonStudentInfo}>
        <Text style={ScreenStyles.commonStudentName}>
          {student.lastName} {student.firstName} {student.middleName || ''}
        </Text>
        <Text style={ScreenStyles.commonStudentDetails}>
          Группа: {student.group} • №: {student.studentId}
        </Text>
        {student.email && (
          <Text style={ScreenStyles.commonStudentContact}>Email: {student.email}</Text>
        )}
        {student.phone && (
          <Text style={ScreenStyles.commonStudentContact}>Телефон: {student.phone}</Text>
        )}
      </View>
      
      <View style={ScreenStyles.commonStudentActions}>
        <TouchableOpacity 
          style={ScreenStyles.commonEditButton}
          onPress={() => onEdit(student)}
        >
          <Text style={ScreenStyles.commonEditButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={ScreenStyles.commonDeleteButton}
          onPress={() => onDelete(student)}
        >
          <Text style={ScreenStyles.commonDeleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StudentCard;
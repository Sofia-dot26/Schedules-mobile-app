import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Header from '../components/Header';
import Section from '../components/Section';
import FormLabel from '../components/FormLabel';
import FormInput from '../components/FormInput';
import SaveButton from '../components/Button';
import { ScreenStyles } from '../styles/ScreenStyles';

const AddGroupScreen = ({ route, navigation }) => {
  const { subjectId } = route.params;
  const [groupName, setGroupName] = useState('');

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }

    Alert.alert('Успех', `Группа "${groupName}" добавлена`);
    navigation.goBack();
  };

  return (
    <View style={ScreenStyles.addGroupScreenContainer}>
      <Header
        title="Добавление группы"
        onBack={handleBack}
        onLogout={handleLogout}
        headerStyle={ScreenStyles.scheduleManagementScreenHeader}
      />
      
      <Section style={ScreenStyles.addGroupScreenInputContainer}>
        <FormLabel text="Название группы" required />
        <FormInput
          placeholder="ИСТ-122"
          value={groupName}
          onChangeText={setGroupName}
          autoCapitalize="characters"
          style={ScreenStyles.addGroupScreenInput}
        />
      </Section>

      <SaveButton
        onPress={handleSave}
        text="Сохранить"
        style={ScreenStyles.addGroupScreenSaveButton}
        textStyle={ScreenStyles.addGroupScreenSaveButtonText}
      />
    </View>
  );
};

export default AddGroupScreen;
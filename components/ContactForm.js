import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { ComponentsStyles } from '../styles/ComponentsStyles';

const ContactForm = ({ onSubmit, isLoading = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      await onSubmit({ name: name.trim(), email: email.trim() });
      setName('');
      setEmail('');
    } catch (error) {
      throw error;
    }
  };

  return (
    <View style={ComponentsStyles.formContainer}>
      <Text style={ComponentsStyles.formLabel}>Name</Text>
      <TextInput
        style={ComponentsStyles.formInput}
        placeholder="Enter name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
      />
      
      <Text style={ComponentsStyles.formLabel}>Email</Text>
      <TextInput
        style={ComponentsStyles.formInput}
        placeholder="Enter email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />

      <TouchableOpacity 
        style={[
          ComponentsStyles.submitButton,
          isLoading && ComponentsStyles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={ComponentsStyles.submitButtonText}>
          {isLoading ? 'Добавление...' : 'Добавить'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ContactForm;
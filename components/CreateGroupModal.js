import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import GroupService from '../services/GroupService';
import { ComponentsStyles } from '../styles/ComponentsStyles';

const CreateGroupModal = ({ visible, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }

    if (groupName.trim().length < 2) {
      Alert.alert('Ошибка', 'Название группы должно содержать минимум 2 символа');
      return;
    }

    try {
      setIsLoading(true);
      const newGroup = await GroupService.createGroup({ name: groupName.trim() });
      Alert.alert('Успех', `Группа "${newGroup.name}" создана`);
      setGroupName('');
      onGroupCreated(newGroup);
      onClose();
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={ComponentsStyles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={ComponentsStyles.modalHeader}>
          <Text style={ComponentsStyles.modalTitle}>Создание новой группы</Text>
          <TouchableOpacity onPress={handleClose} style={ComponentsStyles.closeButton}>
            <Text style={ComponentsStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={ComponentsStyles.modalContent}>
          <Text style={ComponentsStyles.modalLabel}>Название группы</Text>
          <TextInput
            style={ComponentsStyles.modalInput}
            placeholder="Например: ИСТ-122, ПМИ-101"
            placeholderTextColor="#9CA3AF"
            value={groupName}
            onChangeText={setGroupName}
            autoCapitalize="characters"
            autoFocus
            maxLength={20}
          />
          
          <Text style={ComponentsStyles.modalHint}>
            Используйте стандартные обозначения: факультет + номер группы
          </Text>

          <View style={ComponentsStyles.examplesContainer}>
            <Text style={ComponentsStyles.examplesTitle}>Примеры:</Text>
            <View style={ComponentsStyles.examplesList}>
              <TouchableOpacity onPress={() => setGroupName('ИСТ-122')}>
                <Text style={ComponentsStyles.exampleItem}>ИСТ-122</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGroupName('ПМИ-101')}>
                <Text style={ComponentsStyles.exampleItem}>ПМИ-101</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGroupName('ФИЗ-201')}>
                <Text style={ComponentsStyles.exampleItem}>ФИЗ-201</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={ComponentsStyles.modalFooter}>
          <TouchableOpacity 
            style={ComponentsStyles.cancelButton}
            onPress={handleClose}
          >
            <Text style={ComponentsStyles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              ComponentsStyles.createButton,
              (!groupName.trim() || isLoading) && ComponentsStyles.createButtonDisabled
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || isLoading}
          >
            <Text style={ComponentsStyles.createButtonText}>
              {isLoading ? 'Создание...' : 'Создать группу'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateGroupModal;
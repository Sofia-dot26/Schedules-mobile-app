// components/CreateGroupModal.js
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Создание новой группы</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Название группы</Text>
          <TextInput
            style={styles.input}
            placeholder="Например: ИСТ-122, ПМИ-101"
            placeholderTextColor="#9CA3AF"
            value={groupName}
            onChangeText={setGroupName}
            autoCapitalize="characters"
            autoFocus
            maxLength={20}
          />
          
          <Text style={styles.hint}>
            Используйте стандартные обозначения: факультет + номер группы
          </Text>

          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>Примеры:</Text>
            <View style={styles.examplesList}>
              <TouchableOpacity onPress={() => setGroupName('ИСТ-122')}>
                <Text style={styles.example}>ИСТ-122</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGroupName('ПМИ-101')}>
                <Text style={styles.example}>ПМИ-101</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGroupName('ФИЗ-201')}>
                <Text style={styles.example}>ФИЗ-201</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.createButton,
              (!groupName.trim() || isLoading) && styles.createButtonDisabled
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? 'Создание...' : 'Создать группу'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A306D',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
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
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  examples: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 12,
  },
  examplesList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  example: {
    fontSize: 16,
    color: '#4A306D',
    fontWeight: '600',
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#4A306D',
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateGroupModal;
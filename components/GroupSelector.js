// components/GroupSelector.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';

const GroupSelector = ({ 
  availableGroups, 
  selectedGroups = [], 
  onGroupsChange, 
  onCreateGroup 
}) => {
  const toggleGroup = (group) => {
    const isSelected = selectedGroups.some(g => g.id === group.id);
    
    if (isSelected) {
      // Убираем группу из выбранных
      onGroupsChange(selectedGroups.filter(g => g.id !== group.id));
    } else {
      // Добавляем группу к выбранным
      onGroupsChange([...selectedGroups, group]);
    }
  };

  const isGroupSelected = (group) => {
    return selectedGroups.some(g => g.id === group.id);
  };

  return (
    <View style={styles.container}>
      {/* Выбранные группы */}
      {selectedGroups.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Выбранные группы:</Text>
          <View style={styles.selectedGroupsContainer}>
            {selectedGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.selectedGroupChip}
                onPress={() => toggleGroup(group)}
              >
                <Text style={styles.selectedGroupText}>{group.name}</Text>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Доступные группы */}
      {availableGroups.length > 0 && (
        <View style={styles.availableSection}>
          <Text style={styles.sectionTitle}>Доступные группы:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.groupsScroll}
          >
            <View style={styles.groupsContainer}>
              {availableGroups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupChip,
                    isGroupSelected(group) && styles.groupChipSelected
                  ]}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={[
                    styles.groupChipText,
                    isGroupSelected(group) && styles.groupChipTextSelected
                  ]}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Кнопка создания новой группы */}
      <TouchableOpacity 
        style={styles.createGroupButton}
        onPress={onCreateGroup}
      >
        <Text style={styles.createGroupButtonText}>+ Создать новую группу</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selectedSection: {
    marginBottom: 16,
  },
  availableSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
    marginBottom: 8,
  },
  selectedGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A306D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedGroupText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  removeIcon: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  groupsScroll: {
    marginHorizontal: -5,
  },
  groupsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  groupChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  groupChipSelected: {
    backgroundColor: '#4A306D',
    borderColor: '#4A306D',
  },
  groupChipText: {
    fontSize: 14,
    color: '#4A306D',
    fontWeight: '600',
  },
  groupChipTextSelected: {
    color: '#FFFFFF',
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
});

export default GroupSelector;
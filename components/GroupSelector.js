import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { ComponentsStyles } from '../styles/ComponentsStyles';

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
    <View style={ComponentsStyles.selectorContainer}>
      {/* Выбранные группы */}
      {selectedGroups.length > 0 && (
        <View style={ComponentsStyles.selectedSection}>
          <Text style={ComponentsStyles.sectionTitle}>Выбранные группы:</Text>
          <View style={ComponentsStyles.selectedGroupsContainer}>
            {selectedGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={ComponentsStyles.selectedGroupChip}
                onPress={() => toggleGroup(group)}
              >
                <Text style={ComponentsStyles.selectedGroupText}>{group.name}</Text>
                <Text style={ComponentsStyles.removeIcon}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Доступные группы */}
      {availableGroups.length > 0 && (
        <View style={ComponentsStyles.availableSection}>
          <Text style={ComponentsStyles.sectionTitle}>Доступные группы:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={ComponentsStyles.groupsScroll}
          >
            <View style={ComponentsStyles.groupsContainer}>
              {availableGroups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    ComponentsStyles.groupChip,
                    isGroupSelected(group) && ComponentsStyles.groupChipSelected
                  ]}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={[
                    ComponentsStyles.groupChipText,
                    isGroupSelected(group) && ComponentsStyles.groupChipTextSelected
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
        style={ComponentsStyles.createGroupButton}
        onPress={onCreateGroup}
      >
        <Text style={ComponentsStyles.createGroupButtonText}>+ Создать новую группу</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GroupSelector;
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ScreenStyles } from '../styles/ScreenStyles';

const FilterChip = ({ 
  label, 
  isActive = false, 
  onPress,
  style,
  textStyle
}) => {
  return (
    <TouchableOpacity
      style={[
        ScreenStyles.commonFilterChip,
        isActive && ScreenStyles.commonFilterChipActive,
        style
      ]}
      onPress={onPress}
    >
      <Text style={[
        ScreenStyles.commonFilterChipText,
        isActive && ScreenStyles.commonFilterChipTextActive,
        textStyle
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default FilterChip;
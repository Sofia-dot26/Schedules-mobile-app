import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { ScreenStyles } from '../styles/ScreenStyles';

const FormInput = ({ 
  placeholder,
  value,
  onChangeText,
  style,
  placeholderTextColor = '#9CA3AF',
  ...props
}) => {
  return (
    <TextInput
      style={[ScreenStyles.commonInput, style]}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  );
};

export default FormInput;
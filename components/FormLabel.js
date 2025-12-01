import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ScreenStyles } from '../styles/ScreenStyles';

const FormLabel = ({ 
  text, 
  required = false, 
  style 
}) => {
  return (
    <Text style={[ScreenStyles.commonLabel, style]}>
      {text} {required && <Text style={ScreenStyles.requiredStar}>*</Text>}
    </Text>
  );
};

export default FormLabel;
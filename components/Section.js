import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenStyles } from '../styles/ScreenStyles';

const Section = ({ 
  title, 
  children, 
  style,
  titleStyle,
  showTitle = true
}) => {
  return (
    <View style={[ScreenStyles.commonSection, style]}>
      {showTitle && title && (
        <Text style={[ScreenStyles.commonSectionTitle, titleStyle]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};

export default Section;
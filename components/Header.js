// components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenStyles } from '../styles/ScreenStyles';

const Header = ({ 
  title, 
  onBack, 
  onLogout, 
  showBackButton = true,
  showLogoutButton = true,
  rightComponent,
  backButtonText = '‹',
  headerStyle,
  titleStyle
}) => {
  return (
    <View style={[ScreenStyles.commonHeader, headerStyle]}>
      <View style={ScreenStyles.commonHeaderLeft}>
        {showBackButton ? (
          <TouchableOpacity 
            style={ScreenStyles.commonBackButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={ScreenStyles.commonBackButtonText}>{backButtonText}</Text>
          </TouchableOpacity>
        ) : (
          // Заглушка для сохранения отступа когда кнопки нет
          <View style={[ScreenStyles.commonBackButton, { opacity: 0 }]}>
            <Text style={ScreenStyles.commonBackButtonText}>{backButtonText}</Text>
          </View>
        )}
        
        <Text 
          style={[ScreenStyles.commonHeaderTitle, titleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
      
      {showLogoutButton ? (
        <TouchableOpacity 
          style={ScreenStyles.commonLogoutButton}
          onPress={onLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={ScreenStyles.commonLogoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      ) : rightComponent ? (
        <View style={{ minWidth: 70, alignItems: 'flex-end' }}>
          {rightComponent}
        </View>
      ) : (
        // Заглушка для сохранения ширины когда ничего нет
        <View style={{ minWidth: 70 }} />
      )}
    </View>
  );
};

export default Header;
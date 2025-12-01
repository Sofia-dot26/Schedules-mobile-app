import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate } from '../utils/dateFormatter';
import { ComponentsStyles } from '../styles/ComponentsStyles';

const ContactItem = ({ contact }) => {
  return (
    <View style={ComponentsStyles.contactItemContainer}>
      <View style={ComponentsStyles.contactItemHeader}>
        <Text style={ComponentsStyles.contactItemId}>ID: {contact.id}</Text>
        <Text style={ComponentsStyles.contactItemDate}>
          {formatDate(contact.created_date)}
        </Text>
      </View>
      
      <View style={ComponentsStyles.contactItemInfo}>
        <View style={ComponentsStyles.contactItemRow}>
          <Text style={ComponentsStyles.contactItemLabel}>Name:</Text>
          <Text style={ComponentsStyles.contactItemValue}>{contact.name}</Text>
        </View>
        
        <View style={ComponentsStyles.contactItemRow}>
          <Text style={ComponentsStyles.contactItemLabel}>Email:</Text>
          <Text style={ComponentsStyles.contactItemValue}>{contact.email}</Text>
        </View>
      </View>
    </View>
  );
};

export default ContactItem;
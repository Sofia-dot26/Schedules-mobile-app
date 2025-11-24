import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate } from '../utils/dateFormatter';

const ContactItem = ({ contact }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.id}>ID: {contact.id}</Text>
        <Text style={styles.date}>
          {formatDate(contact.created_date)}
        </Text>
      </View>
      
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{contact.name}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{contact.email}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#5C80BC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  id: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A306D',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  info: {
    // Контейнер для информации о контакте
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A306D',
    width: 60,
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    fontWeight: '500',
  },
});

export default ContactItem; 
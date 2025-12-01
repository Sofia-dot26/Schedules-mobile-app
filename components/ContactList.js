import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ContactItem from './ContactItem';
import { ComponentsStyles } from '../styles/ComponentsStyles';

const ContactList = ({ contacts, isLoading }) => {
  if (isLoading) {
    return (
      <View style={ComponentsStyles.listContainer}>
        <Text style={ComponentsStyles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <View style={ComponentsStyles.listContainer}>
        <View style={ComponentsStyles.emptyContainer}>
          <Text style={ComponentsStyles.emptyText}>No contacts</Text>
          <Text style={ComponentsStyles.emptySubtext}>
            Add your first contact using the form above
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ComponentsStyles.listContainer}>
      <Text style={ComponentsStyles.listHeader}>
        Contacts ({contacts.length})
      </Text>
      <ScrollView style={ComponentsStyles.listScrollView} showsVerticalScrollIndicator={false}>
        {contacts.map((contact) => (
          <ContactItem key={contact.id} contact={contact} />
        ))}
      </ScrollView>
    </View>
  );
};

export default ContactList;
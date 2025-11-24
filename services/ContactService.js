import Database from '../database';
import { Contact } from '../models/Contact';

class ContactService {
  constructor() {
    this.db = null;
  }
//проверка подключения к бд
  async ensureDatabase() {
    if (!this.db) {
      this.db = await Database.init();
    }
    return this.db;
  }

  async createContact(contactData) {
    const db = await this.ensureDatabase();
    const contact = new Contact(contactData);
    
    const errors = contact.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    try {
      const result = await db.runAsync(
        'INSERT INTO contacts (name, email, created_date) VALUES (?, ?, ?)',
        contact.name.trim(),
        contact.email.trim(),
        new Date().toISOString()
      );

      return {
        ...contact.toJSON(),
        id: result.lastInsertRowId
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  }

  async getAllContacts(options = {}) {
    const db = await this.ensureDatabase();
    const { sortBy = 'created_date', order = 'DESC' } = options;

    try {
      const contacts = await db.getAllAsync(
        `SELECT * FROM contacts ORDER BY ${sortBy} ${order}`
      );
      
      return contacts.map(contact => Contact.fromJSON(contact));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Failed to fetch contacts');
    }
  }

  async deleteAllContacts() {
    const db = await this.ensureDatabase();

    try {
      const result = await db.runAsync('DELETE FROM contacts');
      return result.changes;
    } catch (error) {
      console.error('Error deleting contacts:', error);
      throw new Error('Failed to delete contacts');
    }
  }

  async getContactsCount() {
    const db = await this.ensureDatabase();

    try {
      const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM contacts');
      return result.count;
    } catch (error) {
      console.error('Error counting contacts:', error);
      throw 0;
    }
  }
}

export default new ContactService();
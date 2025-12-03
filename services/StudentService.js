// services/StudentService.js
import Database from '../database';
import { Student } from '../models/Student';

class StudentService {
  constructor() {
    this.db = null;
  }

  async ensureDatabase() {
    if (!this.db) {
      this.db = await Database.init();
    }
    return this.db;
  }

  async createStudent(studentData) {
    const db = await this.ensureDatabase();
    
    // Преобразуем данные для совместимости
    const processedData = {
      ...studentData,
      group: studentData.group_name || await this.getGroupNameById(studentData.group_id)
    };
    
    const student = new Student(processedData);
    
    const errors = student.validate();
    if (errors.length > 0) {
      throw new Error(`Ошибка валидации: ${errors.join(', ')}`);
    }

    try {
      // Получаем название группы по ID
      const groupName = await this.getGroupNameById(studentData.group_id);
      if (!groupName) {
        throw new Error('Указанная группа не найдена');
      }

      const result = await db.runAsync(
        `INSERT INTO students (lastName, firstName, middleName, group_name, email, phone, isHeadman) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        student.lastName,
        student.firstName,
        student.middleName || null,
        groupName,
        student.email || null,
        student.phone || null,
        student.isHeadman ? 1 : 0
      );

      const newStudent = {
        ...student.toJSON(),
        id: result.lastInsertRowId
      };

      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw new Error(error.message || 'Не удалось создать студента');
    }
  }

  async updateStudent(studentId, studentData) {
    const db = await this.ensureDatabase();
    try {
      // Получаем название группы по ID
      const groupName = await this.getGroupNameById(studentData.group_id);
      if (!groupName) {
        throw new Error('Указанная группа не найдена');
      }

      // Преобразуем данные для валидации
      const processedData = {
        ...studentData,
        group: groupName
      };
      
      const student = new Student(processedData);
      const errors = student.validate();
      if (errors.length > 0) {
        throw new Error(`Ошибка валидации: ${errors.join(', ')}`);
      }

      await db.runAsync(
        `UPDATE students 
         SET lastName = ?, firstName = ?, middleName = ?, group_name = ?, email = ?, phone = ?, isHeadman = ?
         WHERE id = ?`,
        student.lastName,
        student.firstName,
        student.middleName || null,
        groupName,
        student.email || null,
        student.phone || null,
        student.isHeadman ? 1 : 0,
        studentId
      );

      return { 
        ...student.toJSON(), 
        id: studentId,
        group: groupName
      };
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error(error.message || 'Не удалось обновить данные студента');
    }
  }

  async getGroupNameById(groupId) {
    const db = await this.ensureDatabase();
    try {
      const group = await db.getFirstAsync(
        'SELECT name FROM groups WHERE id = ?',
        groupId
      );
      return group ? group.name : null;
    } catch (error) {
      console.error('Error getting group name:', error);
      return null;
    }
  }

  async getAllStudents() {
    const db = await this.ensureDatabase();
    try {
      const students = await db.getAllAsync(`
        SELECT s.*, 
               g.id as group_id,
               g.name as group_name
        FROM students s 
        LEFT JOIN groups g ON s.group_name = g.name
        ORDER BY s.group_name, s.lastName, s.firstName
      `);
      
      return students.map(student => Student.fromJSON({
        ...student,
        group: student.group_name,
        group_id: student.group_id
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Не удалось загрузить студентов');
    }
  }

  async getStudentsByGroup(groupName) {
    const db = await this.ensureDatabase();
    try {
      const students = await db.getAllAsync(`
        SELECT s.*, 
               g.id as group_id
        FROM students s 
        LEFT JOIN groups g ON s.group_name = g.name
        WHERE s.group_name = ? 
        ORDER BY s.lastName, s.firstName
      `, groupName);
      
      return students.map(student => Student.fromJSON({
        ...student,
        group: student.group_name,
        group_id: student.group_id
      }));
    } catch (error) {
      console.error('Error fetching students by group:', error);
      throw new Error('Не удалось загрузить студентов группы');
    }
  }

  async deleteStudent(studentId) {
    const db = await this.ensureDatabase();
    try {
      const result = await db.runAsync('DELETE FROM students WHERE id = ?', studentId);
      return result.changes;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error('Не удалось удалить студента');
    }
  }

  async getAllGroups() {
    const db = await this.ensureDatabase();
    try {
      const groups = await db.getAllAsync(`
        SELECT DISTINCT group_name FROM students 
        WHERE group_name IS NOT NULL AND group_name != ''
        ORDER BY group_name
      `);
      return groups.map(g => g.group_name);
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async getStudentsCountByGroup() {
    const db = await this.ensureDatabase();
    try {
      const counts = await db.getAllAsync(`
        SELECT group_name, COUNT(*) as count 
        FROM students 
        GROUP BY group_name 
        ORDER BY group_name
      `);
      return counts;
    } catch (error) {
      console.error('Error fetching students count:', error);
      return [];
    }
  }

  async searchStudents(query) {
    const db = await this.ensureDatabase();
    try {
      const searchTerm = `%${query}%`;
      const students = await db.getAllAsync(`
        SELECT s.*, 
               g.id as group_id
        FROM students s 
        LEFT JOIN groups g ON s.group_name = g.name
        WHERE s.lastName LIKE ? OR s.firstName LIKE ? OR s.middleName LIKE ? OR s.group_name LIKE ?
        ORDER BY s.group_name, s.lastName, s.firstName
      `, [searchTerm, searchTerm, searchTerm, searchTerm]);
      
      return students.map(student => Student.fromJSON({
        ...student,
        group: student.group_name,
        group_id: student.group_id
      }));
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Не удалось выполнить поиск');
    }
  }

  // Новый метод: получить старосту группы
  async getGroupHeadman(groupName) {
    const db = await this.ensureDatabase();
    try {
      const headman = await db.getFirstAsync(`
        SELECT s.*, 
               g.id as group_id
        FROM students s 
        LEFT JOIN groups g ON s.group_name = g.name
        WHERE s.group_name = ? AND s.isHeadman = 1
        ORDER BY s.lastName, s.firstName
      `, groupName);
      
      return headman ? Student.fromJSON({
        ...headman,
        group: headman.group_name,
        group_id: headman.group_id
      }) : null;
    } catch (error) {
      console.error('Error fetching group headman:', error);
      return null;
    }
  }

  // Новый метод: обновить старосту группы
  async setGroupHeadman(groupName, studentId) {
    const db = await this.ensureDatabase();
    try {
      // Сначала сбрасываем старосту у всех студентов группы
      await db.runAsync(
        'UPDATE students SET isHeadman = 0 WHERE group_name = ?',
        groupName
      );
      
      // Назначаем нового старосту
      if (studentId) {
        await db.runAsync(
          'UPDATE students SET isHeadman = 1 WHERE id = ?',
          studentId
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error setting group headman:', error);
      throw new Error('Не удалось назначить старосту');
    }
  }
}

export default new StudentService();
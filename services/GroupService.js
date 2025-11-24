// services/GroupService.js
import Database from '../database';
import { Group } from '../models/Group';

class GroupService {
  constructor() {
    this.db = null;
  }

  async ensureDatabase() {
    if (!this.db) {
      this.db = await Database.init();
    }
    return this.db;
  }

  async createGroup(groupData) {
    const db = await this.ensureDatabase();
    const group = new Group(groupData);
    
    const errors = group.validate();
    if (errors.length > 0) {
      throw new Error(`Ошибка валидации: ${errors.join(', ')}`);
    }

    try {
      // Проверяем уникальность названия группы
      const existingGroup = await db.getFirstAsync(
        'SELECT id FROM groups WHERE name = ?',
        group.name
      );

      if (existingGroup) {
        throw new Error('Группа с таким названием уже существует');
      }

      const result = await db.runAsync(
        'INSERT INTO groups (name, createdAt) VALUES (?, ?)',
        group.name,
        group.createdAt
      );

      return {
        ...group.toJSON(),
        id: result.lastInsertRowId
      };
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error(error.message || 'Не удалось создать группу');
    }
  }

  async getAllGroups() {
    const db = await this.ensureDatabase();
    try {
      // Сначала пытаемся получить группы из таблицы groups
      let groups = await db.getAllAsync(`
        SELECT g.*, 
               (SELECT COUNT(*) FROM students s WHERE s.group_name = g.name) as studentCount
        FROM groups g 
        ORDER BY g.name
      `);
      
      // Если таблица groups пустая, получаем группы из студентов
      if (groups.length === 0) {
        groups = await db.getAllAsync(`
          SELECT DISTINCT group_name as name, 
                 COUNT(*) as studentCount
          FROM students 
          WHERE group_name IS NOT NULL AND group_name != ''
          GROUP BY group_name
          ORDER BY group_name
        `);
        
        // Преобразуем результат
        groups = groups.map((group, index) => ({
          id: index + 1,
          name: group.name,
          studentCount: group.studentCount,
          createdAt: new Date().toISOString()
        }));
      }
      
      return groups.map(group => Group.fromJSON(group));
    } catch (error) {
      console.error('Error fetching groups:', error);
      try {
        const fallbackGroups = await db.getAllAsync(`
          SELECT DISTINCT group_name as name
          FROM students 
          WHERE group_name IS NOT NULL AND group_name != ''
          ORDER BY group_name
        `);
        
        return fallbackGroups.map((group, index) => 
          Group.fromJSON({
            id: index + 1,
            name: group.name,
            createdAt: new Date().toISOString()
          })
        );
      } catch (fallbackError) {
        throw new Error('Не удалось загрузить группы');
      }
    }
  }

  async getGroupById(id) {
    const db = await this.ensureDatabase();
    try {
      const group = await db.getFirstAsync('SELECT * FROM groups WHERE id = ?', id);
      return group ? Group.fromJSON(group) : null;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw new Error('Не удалось загрузить группу');
    }
  }

  async deleteGroup(groupId) {
    const db = await this.ensureDatabase();
    try {
      // Проверяем, есть ли студенты в группе
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error('Группа не найдена');
      }

      const studentsCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM students WHERE group_name = ?',
        group.name
      );

      if (studentsCount.count > 0) {
        throw new Error('Нельзя удалить группу, в которой есть студенты');
      }

      const result = await db.runAsync('DELETE FROM groups WHERE id = ?', groupId);
      return result.changes;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error(error.message || 'Не удалось удалить группу');
    }
  }

  async searchGroups(query) {
    const db = await this.ensureDatabase();
    try {
      const searchTerm = `%${query}%`;
      const groups = await db.getAllAsync(`
        SELECT g.*,
               (SELECT COUNT(*) FROM students s WHERE s.group_name = g.name) as studentCount
        FROM groups g 
        WHERE g.name LIKE ?
        ORDER BY g.name
      `, searchTerm);
      
      return groups.map(group => Group.fromJSON(group));
    } catch (error) {
      console.error('Error searching groups:', error);
      throw new Error('Не удалось выполнить поиск групп');
    }
  }
}

export default new GroupService();
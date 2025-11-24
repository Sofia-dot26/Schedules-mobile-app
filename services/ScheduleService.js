// services/ScheduleService.js
import Database from '../database';
import { Subject } from '../models/Subject';
import { Lesson } from '../models/Lesson';

class ScheduleService {
  constructor() {
    this.db = null;
  }

  async ensureDatabase() {
    if (!this.db) {
      this.db = await Database.init();
      this.API_URL = 'http://194.87.232.200/file/upload-schedule';
    }
    return this.db;
  }

  // === SUBJECTS ===
  async createSubject(subjectData) {
    const db = await this.ensureDatabase();
    const subject = new Subject(subjectData);
    
    const errors = subject.validate();
    if (errors.length > 0) {
      throw new Error(`Ошибка валидации: ${errors.join(', ')}`);
    }

    try {
      const result = await db.runAsync(
        'INSERT INTO subjects (name, groups) VALUES (?, ?)',
        subject.name,
        JSON.stringify(subject.groups || [])
      );

      const newSubject = {
        ...subject.toJSON(),
        id: result.lastInsertRowId
      };

      return newSubject;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw new Error('Не удалось создать предмет');
    }
  }

  async getAllSubjects() {
    const db = await this.ensureDatabase();
    try {
      const subjects = await db.getAllAsync('SELECT * FROM subjects ORDER BY name');
      return subjects.map(subject => Subject.fromJSON({
        ...subject,
        groups: JSON.parse(subject.groups || '[]')
      }));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw new Error('Не удалось загрузить предметы');
    }
  }

  async getSubjectById(id) {
    const db = await this.ensureDatabase();
    try {
      const subject = await db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', id);
      if (!subject) return null;
      
      return Subject.fromJSON({
        ...subject,
        groups: JSON.parse(subject.groups || '[]')
      });
    } catch (error) {
      console.error('Error fetching subject:', error);
      throw new Error('Не удалось загрузить предмет');
    }
  }

  // === LESSONS ===
  async createLesson(lessonData) {
    const db = await this.ensureDatabase();
    
    try {
      const subject = await this.getSubjectById(lessonData.subjectId);
      if (!subject) {
        throw new Error('Предмет не найден');
      }
      
      if (!Array.isArray(lessonData.groups) || lessonData.groups.length === 0) {
        throw new Error('Необходимо указать хотя бы одну группу');
      }
      
      const createdLessons = [];
      for (const group of lessonData.groups) {
        if (!group || !group.trim()) {
          console.warn('Пропущена пустая группа');
          continue;
        }
        
        const result = await db.runAsync(
          `INSERT INTO lessons (subjectId, subjectName, group_name, dayOfWeek, startTime, endTime, weekType, classroom, lessonType) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          lessonData.subjectId,
          subject.name,
          group.trim(),
          lessonData.dayOfWeek,
          lessonData.startTime,
          lessonData.endTime,
          lessonData.weekType,
          lessonData.classroom || null,
          lessonData.lessonType || ''
        );

        const newLesson = new Lesson({
          ...lessonData,
          id: result.lastInsertRowId,
          subjectName: subject.name,
          groups: [group]
        });
        createdLessons.push(newLesson);
      }
      
      if (createdLessons.length === 0) {
        throw new Error('Не удалось создать ни одного занятия - все группы пустые');
      }

      return createdLessons;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw new Error('Не удалось создать занятие');
    }
  }

  async getLessonsByDayAndWeek(dayOfWeek, weekType) {
    const db = await this.ensureDatabase();
    try {
      const lessons = await db.getAllAsync(`
        SELECT l.* 
        FROM lessons l 
        WHERE l.dayOfWeek = ? AND (l.weekType = ? OR l.weekType = 'both')
        ORDER BY l.startTime
      `, [dayOfWeek, weekType]);
      
      return this.groupLessonsByParams(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw new Error('Не удалось загрузить занятия');
    }
  }

  async getAllLessons() {
    const db = await this.ensureDatabase();
    try {
      const lessons = await db.getAllAsync(`
        SELECT l.* 
        FROM lessons l 
        ORDER BY l.dayOfWeek, l.startTime
      `);
      const groupedLessons = this.groupLessonsByParams(lessons);
      
      return groupedLessons;    
    } catch (error) {
      console.error('Error fetching all lessons:', error);
      throw new Error('Не удалось загрузить занятия');
    }
  }

  async deleteLesson(lessonId) {
    const db = await this.ensureDatabase();
    try {
      const result = await db.runAsync('DELETE FROM lessons WHERE id = ?', lessonId);
      return result.changes;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw new Error('Не удалось удалить занятие');
    }
  }

  async updateSubjectGroups(subjectId, groups) {
    const db = await this.ensureDatabase();
    try {
      await db.runAsync(
        'UPDATE subjects SET groups = ? WHERE id = ?',
        JSON.stringify(groups),
        subjectId
      );
      return true;
    } catch (error) {
      console.error('Error updating subject groups:', error);
      throw new Error('Не удалось обновить группы');
    }
  }

  async getAllGroups() {
    const db = await this.ensureDatabase();
    try {
      let groups = await db.getAllAsync(`
        SELECT g.*, 
               (SELECT COUNT(*) FROM students s WHERE s.group_name = g.name) as studentCount
        FROM groups g 
        ORDER BY g.name
      `);
      
      if (groups.length === 0) {
        groups = await db.getAllAsync(`
          SELECT DISTINCT group_name as name, 
                 COUNT(*) as lessonCount
          FROM lessons 
          WHERE group_name IS NOT NULL AND group_name != ''
          GROUP BY group_name
          ORDER BY group_name
        `);
        groups = groups.map((group, index) => ({
          id: index + 1,
          name: group.name,
          lessonCount: group.lessonCount,
          createdAt: new Date().toISOString()
        }));
      }
      
      return groups;
    } catch (error) {
      console.error('Error fetching groups:', error);
      try {
        const fallbackGroups = await db.getAllAsync(`
          SELECT DISTINCT group_name as name
          FROM lessons 
          WHERE group_name IS NOT NULL AND group_name != ''
          ORDER BY group_name
        `);
        
        return fallbackGroups.map((group, index) => ({
          id: index + 1,
          name: group.name,
          createdAt: new Date().toISOString()
        }));
      } catch (fallbackError) {
        console.error('Fallback group fetch failed:', fallbackError);
        return [];
      }
    }
  }

  // Вспомогательный метод для группировки занятий
  groupLessonsByParams(lessons) {
    const groups = {};
    
    lessons.forEach(lesson => {
      const key = `${lesson.subjectId}-${lesson.dayOfWeek}-${lesson.startTime}-${lesson.endTime}-${lesson.weekType}-${lesson.classroom || ''}-${lesson.lessonType || ''}`;
      
      if (!groups[key]) {
        groups[key] = {
          ...lesson,
          groups: [],
          id: lesson.id
        };
      }
      
      groups[key].groups.push(lesson.group_name);
    });
    
    return Object.values(groups).map(lesson => Lesson.fromJSON(lesson));
  }

  async getSubjectsWithGroups() {
    const db = await this.ensureDatabase();
    try {
      const subjects = await db.getAllAsync(`
        SELECT s.*, 
               (SELECT COUNT(*) FROM lessons l WHERE l.subjectId = s.id) as lessonCount
        FROM subjects s
        ORDER BY s.name
      `);
      
      return subjects.map(subject => ({
        ...Subject.fromJSON({
          ...subject,
          groups: JSON.parse(subject.groups || '[]')
        }),
        lessonCount: subject.lessonCount
      }));
    } catch (error) {
      console.error('Error fetching subjects with groups:', error);
      throw new Error('Не удалось загрузить предметы');
    }
  }

  // === SERVER DATA PROCESSING ===
  async processServerSchedule(serverData) {
    try {
      console.log('🔍 Starting server data processing...');
      console.log('📊 Server data keys:', Object.keys(serverData));

      const lessons = [];
      const subjectsMap = new Map();

      const daysData = serverData.days || serverData;
      console.log('📅 Days available:', Object.keys(daysData));
      
      if (!daysData || typeof daysData !== 'object') {
        throw new Error('Некорректная структура данных');
      }
      
      for (const [dayName, daySchedule] of Object.entries(daysData)) {
        console.log(`\n📖 Processing day: ${dayName}`);
        
        if (!daySchedule || typeof daySchedule !== 'object') {
          console.log(`⚠️  Skipping invalid day: ${dayName}`);
          continue;
        }
        
        const dayOfWeek = this.mapDayNameToNumber(dayName);
        
        for (const [timeRange, scheduleData] of Object.entries(daySchedule)) {
          console.log(`⏰ Time range: ${timeRange}`);
          
          if (!scheduleData || typeof scheduleData !== 'object') {
            console.log(`⚠️  Skipping invalid time range: ${timeRange}`);
            continue;
          }
          
          const [startTime, endTime] = this.parseTimeRange(timeRange);
          
          if (scheduleData.числитель) {
            await this.processLessonData(
              scheduleData.числитель,
              dayOfWeek,
              startTime,
              endTime,
              'numerator',
              lessons,
              subjectsMap
            );
          }
          
          if (scheduleData.знаменатель) {
            await this.processLessonData(
              scheduleData.знаменатель,
              dayOfWeek,
              startTime,
              endTime,
              'denominator',
              lessons,
              subjectsMap
            );
          }
          
          if (scheduleData.Общая) {
            await this.processLessonData(
              scheduleData.Общая,
              dayOfWeek,
              startTime,
              endTime,
              'both',
              lessons,
              subjectsMap
            );
          }
        }
      }
      
      console.log(`\n📊 Processing complete: ${lessons.length} lessons, ${subjectsMap.size} subjects`);
      
      await this.saveSubjectsToDatabase(subjectsMap);
      await this.saveLessonsToDatabase(lessons);
      
      console.log('✅ Data saved to database successfully');
      
      return {
        subjects: Array.from(subjectsMap.values()),
        lessons: lessons
      };
      
    } catch (error) {
      console.error('Error processing server schedule:', error);
      throw new Error('Не удалось обработать данные с сервера');
    }
  }

  async processLessonData(lessonData, dayOfWeek, startTime, endTime, weekType, lessons, subjectsMap) {
    try {
      console.log(`📚 Processing lesson: ${lessonData}`);
      
      if (typeof lessonData === 'string') {
        const parsedData = this.parseLessonData(lessonData);
        
        if (parsedData.subjectName) {
          const groups = parsedData.groups.length > 0 ? parsedData.groups : ['Не указана'];
          
          for (const group of groups) {
            const lesson = {
              subjectName: parsedData.subjectName,
              groups: [group],
              dayOfWeek: dayOfWeek,
              startTime: startTime,
              endTime: endTime,
              weekType: weekType,
              classroom: parsedData.classroom,
              lessonType: parsedData.lessonType
            };
            
            lessons.push(lesson);
            this.addSubjectToMap(subjectsMap, lesson);
          }
        }
      } else {
        console.log('⚠️  Lesson data is not a string:', lessonData);
      }
    } catch (error) {
      console.error('❌ Error processing lesson data:', error);
    }
  }

  // ИСПРАВЛЕННЫЙ МЕТОД ПАРСИНГА
  parseLessonData(data) {
    const result = {
      subjectName: '',
      lessonType: '',
      classroom: '',
      groups: []
    };
    
    try {
      console.log('🔍 Parsing lesson data:', data);
      
      if (!data || typeof data !== 'string') {
        return result;
      }

      const parts = data.split(' ').filter(part => part && part.trim() !== '');
      
      // Поиск типа занятия
      const typeIndex = parts.findIndex(part => 
        ['лб', 'лк', 'пр', 'лаб', 'лек', 'прак'].includes(part.toLowerCase())
      );
      
      if (typeIndex !== -1 && typeIndex > 0) {
        result.subjectName = parts.slice(0, typeIndex).join(' ').trim();
        result.lessonType = parts[typeIndex];
        
        const remainingParts = parts.slice(typeIndex + 1);
        
        // Разделение на аудиторию и группы
        let classroomParts = [];
        let groupParts = [];
        let foundGroups = false;
        
        for (let i = 0; i < remainingParts.length; i++) {
          const part = remainingParts[i];
          const nextPart = remainingParts[i + 1];
          
          // Проверяем, является ли текущая часть частью аудитории
          if (!foundGroups) {
            // Если это последняя часть или следующая часть - группа, то это аудитория
            if (i === remainingParts.length - 1 || this.isGroup(nextPart)) {
              classroomParts.push(part);
              foundGroups = true;
            } 
            // Если текущая часть содержит дефис и соответствует паттерну аудитории (1 символ до и после тире)
            else if (part.includes('-') && this.isClassroomPattern(part)) {
              classroomParts.push(part);
              foundGroups = true;
            }
            // Если это просто число или буква-число комбинация
            else if (this.isClassroomPart(part)) {
              classroomParts.push(part);
            }
            // Если следующая часть - группа, то текущая часть - аудитория
            else if (nextPart && this.isGroup(nextPart)) {
              classroomParts.push(part);
              foundGroups = true;
            }
            else {
              // Если не можем определить, считаем это аудиторией и переходим к группам
              classroomParts.push(part);
              foundGroups = true;
            }
          } else {
            // После нахождения групп, все остальное - группы
            if (this.isGroup(part)) {
              groupParts.push(part);
            }
          }
        }
        
        // Формируем аудиторию
        if (classroomParts.length > 0) {
          result.classroom = classroomParts.join('');
        }
        
        // Формируем группы
        result.groups = this.extractGroups(groupParts);
        
      } else {
        result.subjectName = data;
        result.groups = this.extractGroups(parts);
      }
      
      // Доп поиск групп
      if (result.groups.length === 0) {
        const groupMatches = data.match(/([А-Яа-яA-Za-z]+\s*-\s*\d+)/g);
        if (groupMatches) {
          result.groups = groupMatches.map(g => g.replace(/\s+/g, ''));
        }
      }
      
      console.log('✅ Parsed result:', result);
      
    } catch (error) {
      console.error('❌ Error parsing lesson data:', error);
      result.subjectName = data || 'Неизвестный предмет';
    }
    
    return result;
  }

  isClassroomPattern(part) {
    // Проверяем паттерн типа "и-З" (1 символ до тире и 1 символ после)
    if (part.includes('-')) {
      const [before, after] = part.split('-');
      if (before && after && before.length === 1 && after.length === 1) {
        return true;
      }
    }
    return false;
  }

  isClassroomPart(part) {
    // Аудитория может быть: число, комбинация числа и букв, но не группа
    if (this.isGroup(part)) {
      return false;
    }
    
    // Если содержит только цифры или цифры с буквами (но не в формате группы)
    if (/^\d+[А-Яа-яA-Za-z]*$/.test(part) || /^[А-Яа-яA-Za-z]?\d+[А-Яа-яA-Za-z]?$/.test(part)) {
      return true;
    }
    
    // Паттерны аудиторий типа "а-З"
    if (this.isClassroomPattern(part)) {
      return true;
    }
    
    return false;
  }

  isGroup(part) {
    if (!part) return false;
    
    const cleanPart = part.replace(/[.,]/g, '').trim();
    
    // Группа: буквы-цифры (например: "Ссп-124", "ФКспк-324")
    const groupRegex = /^[А-Яа-яA-Za-z]{2,}-\d+$/;
    
    // Исключаем паттерны аудиторий типа "а-З"
    if (this.isClassroomPattern(cleanPart)) {
      return false;
    }
    
    return groupRegex.test(cleanPart);
  }

  extractGroups(parts) {
    const groups = [];
    
    for (const part of parts) {
      const cleanPart = part.replace(/[.,]/g, '').trim();
      
      if (this.isGroup(cleanPart)) {
        groups.push(cleanPart.replace(/\s+/g, ''));
        continue;
      }
      
      if (cleanPart.includes(' ')) {
        const subParts = cleanPart.split(' ');
        for (const subPart of subParts) {
          const cleanSubPart = subPart.trim();
          if (this.isGroup(cleanSubPart)) {
            groups.push(cleanSubPart.replace(/\s+/g, ''));
          }
        }
      }
    }
    
    return [...new Set(groups)];
  }

  mapDayNameToNumber(dayName) {
    const daysMap = {
      'понедельник': 1,
      'вторник': 2,
      'среда': 3,
      'четверг': 4,
      'пятница': 5,
      'суббота': 6,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    return daysMap[dayName.toLowerCase()] || 1;
  }

  parseTimeRange(timeRange) {
    try {
      const cleanTime = timeRange.replace(/\s+/g, '');
      const times = cleanTime.split(/[–\-—]/);
      
      if (times.length === 2) {
        return [times[0].trim(), times[1].trim()];
      }
      
      return ['08:30', '10:00'];
    } catch (error) {
      console.error('Error parsing time range:', error);
      return ['08:30', '10:00'];
    }
  }

  addSubjectToMap(subjectsMap, lesson) {
    if (!subjectsMap.has(lesson.subjectName)) {
      subjectsMap.set(lesson.subjectName, {
        name: lesson.subjectName,
        groups: [...new Set(lesson.groups)]
      });
    } else {
      const existingSubject = subjectsMap.get(lesson.subjectName);
      const allGroups = [...existingSubject.groups, ...lesson.groups];
      existingSubject.groups = [...new Set(allGroups)];
    }
  }

  async saveSubjectsToDatabase(subjectsMap) {
    const db = await this.ensureDatabase();
    
    for (const [subjectName, subjectData] of subjectsMap) {
      try {
        const existingSubject = await db.getFirstAsync(
          'SELECT * FROM subjects WHERE name = ?',
          subjectName
        );
        
        if (!existingSubject) {
          await db.runAsync(
            'INSERT INTO subjects (name, groups) VALUES (?, ?)',
            subjectName,
            JSON.stringify(subjectData.groups)
          );
        } else {
          const existingGroups = JSON.parse(existingSubject.groups || '[]');
          const allGroups = [...new Set([...existingGroups, ...subjectData.groups])];
          await db.runAsync(
            'UPDATE subjects SET groups = ? WHERE id = ?',
            JSON.stringify(allGroups),
            existingSubject.id
          );
        }
      } catch (error) {
        console.error('Error saving subject to database:', error);
      }
    }
  }

  async saveLessonsToDatabase(lessons) {
    const db = await this.ensureDatabase();
    
    await db.runAsync('DELETE FROM lessons');
    
    for (const lesson of lessons) {
      try {
        const subject = await db.getFirstAsync(
          'SELECT id FROM subjects WHERE name = ?',
          lesson.subjectName
        );
        
        if (subject) {
          for (const group of lesson.groups) {
            await db.runAsync(
              `INSERT INTO lessons (subjectId, subjectName, group_name, dayOfWeek, startTime, endTime, weekType, classroom, lessonType) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              subject.id,
              lesson.subjectName,
              group,
              lesson.dayOfWeek,
              lesson.startTime,
              lesson.endTime,
              lesson.weekType,
              lesson.classroom || '',
              lesson.lessonType || ''
            );
          }
        }
      } catch (error) {
        console.error('Error saving lesson to database:', error);
      }
    }
  }

  async debugServerData(serverData) {
    console.log('🐛 DEBUG Server Data Structure:');
    console.log(JSON.stringify(serverData, null, 2));
    
    if (serverData.days) {
      console.log('📅 Days structure:');
      Object.entries(serverData.days).forEach(([day, schedule]) => {
        console.log(`\n${day}:`);
        Object.entries(schedule).forEach(([time, data]) => {
          console.log(`  ${time}:`, data);
        });
      });
    }
    
    return true;
  }


async getAttendanceExportData(subjectId) {
  try {
    const db = await Database.init();
    
    // Получаем все занятия по предмету с информацией о посещаемости
    const query = `
      SELECT 
        l.group_name as "groupName",
        s.lastName || ' ' || s.firstName || COALESCE(' ' || s.middleName, '') as "studentName",
        a.date as "lessonDate",
        CASE 
          WHEN a.status = 'present' THEN 'present'
          WHEN a.status = 'absent' THEN 'absent'
          ELSE ''
        END as "attendanceStatus"
      FROM lessons l
      LEFT JOIN attendance a ON l.id = a.lessonId
      LEFT JOIN students s ON a.studentId = s.id
      WHERE l.subjectId = ?
      ORDER BY l.group_name, "studentName", a.date
    `;
    
    const exportData = await db.getAllAsync(query, [subjectId]);
    
    // Если нет записей посещаемости, создаем базовую структуру с занятиями
    if (!exportData || exportData.length === 0 || !exportData[0].studentName) {
      return await this.getBasicLessonData(subjectId);
    }
    
    return exportData;
    
  } catch (error) {
    console.error('Error getting export data:', error);
    throw error;
  }
}

async getBasicLessonData(subjectId) {
  try {
    const db = await Database.init();
    
    // Получаем базовую информацию о занятиях и студентах
    const query = `
      SELECT DISTINCT
        l.group_name as "groupName",
        s.lastName || ' ' || s.firstName || COALESCE(' ' || s.middleName, '') as "studentName",
        l.dayOfWeek as "dayOfWeek",
        'не отмечен' as "attendanceStatus"
      FROM lessons l
      LEFT JOIN students s ON l.group_name = s.group_name
      WHERE l.subjectId = ? AND s.id IS NOT NULL
      ORDER BY l.group_name, "studentName", l.dayOfWeek
    `;
    
    const basicData = await db.getAllAsync(query, [subjectId]);
    
    // Преобразуем dayOfWeek в даты (текущая неделя)
    return basicData.map(item => ({
      groupName: item.groupName,
      studentName: item.studentName,
      lessonDate: this.getDateFromDayOfWeek(item.dayOfWeek),
      attendanceStatus: item.attendanceStatus
    }));
    
  } catch (error) {
    console.error('Error getting basic lesson data:', error);
    throw error;
  }
}

getDateFromDayOfWeek(dayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay() || 7; // Convert Sunday (0) to 7
  const diff = dayOfWeek - currentDay;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  return targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}  
}

export default new ScheduleService();
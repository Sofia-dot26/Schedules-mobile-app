// database/index.js
import * as SQLite from 'expo-sqlite';

// Функция для принудительного пересоздания базы данных
const forceRecreateDatabase = async (db) => {
  try {
    console.log('Принудительное обновление структуры БД...');
    
    // Удаляем существующие таблицы
    await db.execAsync(`
      DROP TABLE IF EXISTS attendance;
      DROP TABLE IF EXISTS students;
      DROP TABLE IF EXISTS lessons;
      DROP TABLE IF EXISTS subjects;
      DROP TABLE IF EXISTS groups;
      DROP TABLE IF EXISTS migrations;
    `);
    
    console.log('Старые таблицы удалены');
  } catch (error) {
    console.log('Ошибка при удалении таблиц:', error);
  }
};

// Миграции
const SCHEDULE_MIGRATIONS = [
// В миграцию v1 нужно добавить поле isHeadman в таблицу students:
{
  version: 1,
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        groups TEXT DEFAULT '[]',
        created_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY NOT NULL,
        subjectId INTEGER NOT NULL,
        subjectName TEXT NOT NULL,
        group_name TEXT NOT NULL,
        dayOfWeek INTEGER NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        weekType TEXT NOT NULL,
        classroom TEXT,
        lessonType TEXT,
        created_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subjectId) REFERENCES subjects (id)
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY NOT NULL,
        lastName TEXT NOT NULL,
        firstName TEXT NOT NULL,
        middleName TEXT,
        group_name TEXT NOT NULL,
        isHeadman INTEGER DEFAULT 0, -- Добавлено: является ли старостой (0 или 1)
        email TEXT,
        phone TEXT,
        created_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_lessons_day_week ON lessons(dayOfWeek, weekType);
      CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subjectId);
      CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_name);
      
      -- Вставляем демо-предметы
      INSERT OR IGNORE INTO subjects (id, name, groups) VALUES 
      (1, 'Математика', '["ИСТ-122", "ИСТ-123"]'),
      (2, 'Физика', '["ИСТ-122"]'),
      (3, 'Программирование', '[]'),
      (4, 'Базы данных', '[]'),
      (5, 'Веб-разработка', '[]');

      -- Вставляем демо-студентов
      INSERT OR IGNORE INTO students (id, lastName, firstName, middleName, group_name, isHeadman, email, phone) VALUES 
      (1, 'Иванов', 'Иван', 'Иванович', 'ИСТ-122', 1, 'ivanov@edu.ru', '+79161234567'),
      (2, 'Петрова', 'Мария', 'Сергеевна', 'ИСТ-122', 0, 'petrova@edu.ru', '+79161234568'),
      (3, 'Сидоров', 'Алексей', 'Петрович', 'ИСТ-123', 1, 'sidorov@edu.ru', '+79161234569'),
      (4, 'Козлова', 'Елена', 'Владимировна', 'ИСТ-122', 0, 'kozlova@edu.ru', '+79161234570');
    `);
  }
},
  {
    version: 2,
    up: async (db) => {
      await db.execAsync(`
        -- Создаем таблицу групп
        CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Создаем индекс для поиска по названию группы
        CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

        -- Переносим существующие группы из students в таблицу groups
        INSERT OR IGNORE INTO groups (name)
        SELECT DISTINCT group_name FROM students WHERE group_name IS NOT NULL AND group_name != '';

        -- Добавляем демо-группы, если их нет
        INSERT OR IGNORE INTO groups (name) VALUES 
        ('ИСТ-122'),
        ('ИСТ-123'),
        ('ПМИ-101'),
        ('ФИЗ-201');
      `);
    }
  },
  {
    version: 3,
    up: async (db) => {
      await db.execAsync(`
        -- Создаем таблицу посещаемости
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lessonId INTEGER NOT NULL,
          studentId INTEGER NOT NULL,
          studentName TEXT NOT NULL,
          groupName TEXT NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'absent',
          createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lessonId) REFERENCES lessons (id),
          FOREIGN KEY (studentId) REFERENCES students (id),
          UNIQUE(lessonId, studentId, date)
        );

        CREATE INDEX IF NOT EXISTS idx_attendance_lesson ON attendance(lessonId);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(studentId);
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      `);
    }
  },
];

const runScheduleMigrations = async (db) => {
  try {
    // Создаем таблицу для отслеживания миграций
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Получаем текущую версию
    const currentVersion = await db.getFirstAsync(
      'SELECT MAX(version) as version FROM migrations'
    ).then(result => result?.version || 0);

    console.log(`Текущая версия БД: ${currentVersion}`);

    // Применяем новые миграции
    for (const migration of SCHEDULE_MIGRATIONS) {
      if (migration.version > currentVersion) {
        console.log(`Applying schedule migration v${migration.version}`);
        await migration.up(db);
        
        await db.runAsync( 
          'INSERT INTO migrations (version) VALUES (?)',
          migration.version
        );
        
        console.log(`Schedule migration v${migration.version} applied`);
      }
    }

  } catch (error) {
    console.error('Schedule migration failed:', error);
    throw error;
  }
};


class Database {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return this.db;

    try {
      console.log('Инициализация базы данных...');
      this.db = await SQLite.openDatabaseAsync('schedule.db');
      
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      await forceRecreateDatabase(this.db);
      
      await runScheduleMigrations(this.db);
      
      this.isInitialized = true;
      console.log('БД успешно инициализирована');
      return this.db;
    } catch (error) {
      console.error('Ошибка инициализации БД:', error);
      throw error;
    }
  }

  async runAsync(sql, ...params) {
    const db = await this.init();
    try {
      const result = await db.runAsync(sql, ...params);
      return result;
    } catch (error) {
      console.error('Error running SQL:', sql, params, error);
      throw error;
    }
  }

  async getFirstAsync(sql, ...params) {
    const db = await this.init();
    try {
      const result = await db.getFirstAsync(sql, ...params);
      return result;
    } catch (error) {
      console.error('Error getting first:', sql, params, error);
      throw error;
    }
  }

  async getAllAsync(sql, ...params) {
    const db = await this.init();
    try {
      const result = await db.getAllAsync(sql, ...params);
      return result;
    } catch (error) {
      console.error('Error getting all:', sql, params, error);
      throw error;
    }
  }

  async execAsync(sql) {
    const db = await this.init();
    try {
      await db.execAsync(sql);
    } catch (error) {
      console.error('Error executing SQL:', sql, error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('БД не инициализирована.');
    }
    return this.db;
  }

  async close() {
    if (this.db) {
      this.isInitialized = false;
      this.db = null;
    }
  }
}

export default new Database();
// services/AttendanceService.js
import Database from '../database';
import { Attendance } from '../models/Attendance';

const AttendanceService = {
  async markAttendance(attendanceData) {
    const db = await Database.init();
    const attendance = new Attendance(attendanceData);
    
    const errors = attendance.validate();
    if (errors.length > 0) {
      throw new Error(`Ошибка валидации: ${errors.join(', ')}`);
    }

    try {
      const result = await db.runAsync(
        `INSERT OR REPLACE INTO attendance 
         (lessonId, studentId, studentName, groupName, date, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        attendance.lessonId,
        attendance.studentId,
        attendance.studentName,
        attendance.groupName,
        attendance.date,
        attendance.status
      );

      return {
        ...attendance.toJSON(),
        id: result.lastInsertRowId
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw new Error('Не удалось сохранить посещаемость');
    }
  },

  async getAttendanceByLesson(lessonId, date) {
    const db = await Database.init();
    try {
      const attendance = await db.getAllAsync(`
        SELECT a.* 
        FROM attendance a
        WHERE a.lessonId = ? AND a.date = ?
        ORDER BY a.studentName
      `, [lessonId, date]);
      
      return attendance.map(record => Attendance.fromJSON(record));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw new Error('Не удалось загрузить посещаемость');
    }
  },

  async getStudentAttendance(studentId, startDate, endDate) {
    const db = await Database.init();
    try {
      const attendance = await db.getAllAsync(`
        SELECT a.*, l.subjectName, l.dayOfWeek, l.startTime
        FROM attendance a
        JOIN lessons l ON a.lessonId = l.id
        WHERE a.studentId = ? AND a.date BETWEEN ? AND ?
        ORDER BY a.date, l.startTime
      `, [studentId, startDate, endDate]);
      
      return attendance.map(record => Attendance.fromJSON(record));
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw new Error('Не удалось загрузить посещаемость студента');
    }
  },

  async getAttendanceStats(groupName, startDate, endDate) {
    const db = await Database.init();
    try {
      const stats = await db.getAllAsync(`
        SELECT 
          s.id as studentId,
          s.lastName || ' ' || s.firstName || COALESCE(' ' || s.middleName, '') as studentName,
          COUNT(a.id) as totalLessons,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentCount,
          SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as lateCount,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absentCount
        FROM students s
        LEFT JOIN attendance a ON s.id = a.studentId AND a.date BETWEEN ? AND ?
        WHERE s.group_name = ?
        GROUP BY s.id, s.lastName, s.firstName, s.middleName
        ORDER BY s.lastName, s.firstName
      `, [startDate, endDate, groupName]);
      
      return stats.map(stat => ({
        ...stat,
        attendanceRate: stat.totalLessons > 0 ? 
          Math.round((stat.presentCount / stat.totalLessons) * 100) : 0
      }));
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw new Error('Не удалось загрузить статистику посещаемости');
    }
  }
};

export default AttendanceService;
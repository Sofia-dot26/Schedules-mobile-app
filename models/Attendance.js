// models/Attendance.js
export class Attendance {
  constructor({ 
    id, 
    lessonId, 
    studentId, 
    studentName,
    groupName,
    date, 
    status, 
    createdAt 
  }) {
    this.id = id;
    this.lessonId = lessonId;
    this.studentId = studentId;
    this.studentName = studentName;
    this.groupName = groupName;
    this.date = date;
    this.status = status || 'absent';
    this.createdAt = createdAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    if (!this.lessonId) errors.push('ID занятия обязательно');
    if (!this.studentId) errors.push('ID студента обязательно');
    if (!this.date) errors.push('Дата обязательна');
    if (!this.status) errors.push('Статус обязателен');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      lessonId: this.lessonId,
      studentId: this.studentId,
      studentName: this.studentName,
      groupName: this.groupName,
      date: this.date,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new Attendance(data);
  }
}
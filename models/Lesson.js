// models/Lesson.js
export class Lesson {
  constructor({ 
    id, 
    subjectId, 
    subjectName, 
    groups = [], 
    dayOfWeek, 
    startTime, 
    endTime, 
    weekType, 
    classroom 
  }) {
    this.id = id;
    this.subjectId = subjectId;
    this.subjectName = subjectName;
    this.groups = Array.isArray(groups) ? groups : [groups]; 
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.weekType = weekType;
    this.classroom = classroom;
  }

  validate() {
    const errors = [];
    if (!this.subjectId) errors.push('ID предмета обязательно');
    if (!this.subjectName?.trim()) errors.push('Название предмета обязательно');
    if (!this.groups || this.groups.length === 0) errors.push('Необходимо выбрать хотя бы одну группу');
    if (!this.dayOfWeek) errors.push('День недели обязателен');
    if (!this.startTime?.trim()) errors.push('Время начала обязательно');
    if (!this.endTime?.trim()) errors.push('Время окончания обязательно');
    if (!this.weekType?.trim()) errors.push('Тип недели обязателен');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      subjectId: this.subjectId,
      subjectName: this.subjectName,
      groups: this.groups,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      weekType: this.weekType,
      classroom: this.classroom
    };
  }

  static fromJSON(data) {
    return new Lesson(data);
  }
}
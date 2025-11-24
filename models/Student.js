// models/Student.js
export class Student {
  constructor({ id, lastName, firstName, middleName, group, group_id, studentId, email, phone }) {
    this.id = id;
    this.lastName = lastName;
    this.firstName = firstName;
    this.middleName = middleName;
    this.group = group; 
    this.group_id = group_id; 
    this.studentId = studentId;
    this.email = email;
    this.phone = phone;
  }

  get fullName() {
    return `${this.lastName} ${this.firstName} ${this.middleName || ''}`.trim();
  }

  validate() {
    const errors = [];
    if (!this.lastName?.trim()) errors.push('Фамилия обязательна');
    if (!this.firstName?.trim()) errors.push('Имя обязательно');
    if (!this.group?.trim()) errors.push('Группа обязательна');
    if (!this.studentId?.trim()) errors.push('Номер студенческого билета обязателен');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      lastName: this.lastName,
      firstName: this.firstName,
      middleName: this.middleName,
      group: this.group,
      group_id: this.group_id,
      studentId: this.studentId,
      email: this.email,
      phone: this.phone
    };
  }

  static fromJSON(data) {
    return new Student(data);
  }
}
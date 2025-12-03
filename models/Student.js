// models/Student.js
export class Student {
  constructor({ id, lastName, firstName, middleName, group, group_id, email, phone, isHeadman = false }) {
    this.id = id;
    this.lastName = lastName;
    this.firstName = firstName;
    this.middleName = middleName;
    this.group = group; 
    this.group_id = group_id; 
    this.email = email;
    this.phone = phone;
    this.isHeadman = isHeadman; // Новое поле: является ли старостой
  }

  get fullName() {
    return `${this.lastName} ${this.firstName} ${this.middleName || ''}`.trim();
  }

  validate() {
    const errors = [];
    if (!this.lastName?.trim()) errors.push('Фамилия обязательна');
    if (!this.firstName?.trim()) errors.push('Имя обязательно');
    if (!this.group?.trim()) errors.push('Группа обязательна');
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
      email: this.email,
      phone: this.phone,
      isHeadman: this.isHeadman
    };
  }

  static fromJSON(data) {
    return new Student({
      ...data,
      isHeadman: data.isHeadman === 1 || data.isHeadman === true // Конвертируем в boolean
    });
  }
}
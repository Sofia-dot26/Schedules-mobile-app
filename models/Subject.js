// models/Subject.js
export class Subject {
  constructor({ id, name, groups = [] }) {
    this.id = id;
    this.name = name;
    this.groups = groups;
  }

  validate() {
    const errors = [];
    if (!this.name?.trim()) errors.push('Название предмета обязательно');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      groups: this.groups
    };
  }

  static fromJSON(data) {
    return new Subject(data);
  }
}
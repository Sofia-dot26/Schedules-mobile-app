// models/Group.js
export class Group {
  constructor({ id, name, createdAt }) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    if (!this.name?.trim()) errors.push('Название группы обязательно');
    if (this.name && this.name.length < 2) errors.push('Название группы слишком короткое');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new Group(data);
  }
}
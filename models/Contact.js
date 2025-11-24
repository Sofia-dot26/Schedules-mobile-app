export class Contact {
  constructor({ id, name, email, created_date }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.created_date = created_date;
  }

  validate() {
    const errors = [];
    
    if (!this.name) {
      errors.push('Name is required');
    }
    
    if (!this.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Email format is invalid');
    }
    
    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_date: this.created_date
    };
  }

  static fromJSON(data) {
    return new Contact(data);
  }
}
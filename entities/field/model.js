export class Field {
  constructor(name, text, id) {
    this.name = name;
    this.text = text;
    this.id = id || Field.generateId();
  }

  static generateId() {
    Field._idCounter = (Field._idCounter || 0) + 1;
    return (
      "field-" +
      Field._idCounter +
      "-" +
      Date.now() +
      "-" +
      Math.floor(Math.random() * 10000)
    );
  }
}

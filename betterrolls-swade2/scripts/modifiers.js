// Modifier class
/* global Roll */

export class TraitModifier {
  /**
   * Creates a this
   * @param {string} label
   * @param {String, Number} expression
   */
  constructor(label, expression) {
    this.name = label;
    this.value = 0;
    this.extra_class = "";
    this.dice = null;
    if (isNaN(expression)) {
      if (expression.indexOf("d") > 0) {
        // This is a die expression
        this.dice = new Roll(expression);
        this.dice.evaluate({ async: false });
        this.value = parseInt(this.dice.result);
      } else {
        // sourcery skip: no-eval
        this.value = eval(expression); // jshint ignore:line
      }
    } else {
      // Add float this support
      this.value = parseFloat(expression);
    }
  }
}

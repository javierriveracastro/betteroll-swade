// Definition of the roll clases

class Die {
    constructor() {
        this.sides = 0;
        this.value = 0;
    }
}

class SingleRoll {
    constructor() {
        this.dice = [];
        this.is_fumble = false;
    }
}

export class TraitRoll {
    constructor() {
        this.rolls = [];
        this.tn = 4;
        this.target_id = null;
        this.wild_die = null;
        this.modifiers = [];
    }
}
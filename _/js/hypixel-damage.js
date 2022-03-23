class Values {
    constructor(combatLevel, weaponDamage, strength, criticalDamage) {
        this.combatLevel = combatLevel;
        this.weaponDamage = weaponDamage;
        this.strength = strength;
        this.criticalDamage = criticalDamage;
        this.weaponBonus = 1;
        this._additive = 1 + (combatLevel * 0.04);
        
        this._multiplicative = 1;
    }
    applyAdditive(v) {
        this._additive += v;
    }
    applyMultiplicative(v) {
        this._multiplicative *= v;
    }

    calculate(isCrit) {
        var final = 5 + this.weaponDamage;
        console.log("f1", final);
        final *= (1 + (this.strength / 100));
        console.log("f2", final);
        if(isCrit) {
            final *= (1 + (this.criticalDamage / 100));
            console.log("c.", final);
        }
        final *= (this._additive + this.weaponBonus);
        console.log("f3", final);
        final *= this._multiplicative;
        console.log("f4", final);

        return final;
    }
}

class EnchantType {
    constructor(id, maxLevels, needsTargetHealth, multV) {
        this.id = id;
        this.maxLevels = maxLevels;
        this.needsTargetHealth = needsTargetHealth;
        this.multV = multV
    }

    apply(values, level) {
        if(typeof(this.multV) === "number") {
            console.log(this.id, level, this.multV);
            values.applyAdditive(level * this.multV);
        } else {
            this.multV(values, level);
        }
    }
}

class SelectedEnchant {
    constructor(level, enchant) {
        this.level = level;
        this.enchant = enchant;
    }
    apply(values) {
        return this.enchant.apply(values, this.level);
    }
}

const ENCHANTS = {
    SHARPNESS: new EnchantType("Sharpness", 7, false, function(values, lvl) {
        switch(lvl) {
            case 7: return values.applyAdditive(0.65);
            case 6: return values.applyAdditive(0.45);
            case 5: return values.applyAdditive(0.30);
            default:
                return values.applyAdditive(lvl * 0.05);
        }
    }),
    SMITE: new EnchantType("Smite", 7, false, 0.08)
}
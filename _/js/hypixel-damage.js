class Entity {
    constructor(health) {
        this.health = health;
    }
}
const ENTITY_KIND = {
    PIGMAN: "Pigman",
    WITHER: "Wither",
    SKELETON: "Skeleton",
    ZOMBIE: "Zombie",
    SPIDER: "Spider",
    CAVE_SPIDER: "Cave Spider",
    SILVERFISH: "Silverfish",
    ENDERMAN: "Enderman",
    ENDER_DRAGON: "Ender Dragon",
    SLIME: "Slime",
    MAGMA_CUBE: "Magma Cube",
    CREEPER: "Creeper",
    SQUID: "Squid",
    GUARDIAN: "Guardian",
    OTHER: "Other"
};
class Enemy extends Entity {
    constructor(health, defense, kind) {
        super(health);
        this.kind = kind;
        this.defense = defense;
    }
}


class Context {
    constructor(strength, weaponDmg, critDmg, combatSkill, player, target) {
        this._strength = strength;
        this._weaponDmg = weaponDmg;
        this._critDmg = critDmg;
        this._player = player;
        this._target = target;

        this._additives = [];

        var cs = 0;
        cs += (Math.min(combatSkill, 50) * 0.04);
        cs += (Math.max(combatSkill - 50, 0) * 0.01);
        this.applyAdditive("Combat Skill", cs);

        this._mult = {};
        this._enchants = [];
    }
    getEnchantLevel(enchantName) {
        for(let s of this._enchants) {
            if(s.enchant.id === enchantName) {
                return s.level;
            }
        }
        return 0;
    }
    addEnchant(enchant) {
        this._enchants.push(enchant);
        enchant.apply(this);
    }
    applyAdditive(where, value) {
        if(typeof(where) !== "string") 
            where = where.id;
        this._additives[where] = value;
    }
    applyMultiplicative(where, value) {
        if(typeof(where) !== "string") 
            where = where.id;
        this._mult[where] = value;
    }
    sumDict(d) {
        var s = 1;
        for(let k in d) {
            s += d[k];
        }
        return s;
    }
    get Strength() {
        return this._strength;
    }
    get WeaponDamage() {
        return this._weaponDmg;
    }
    get CritDamagePerc() {
        var critical = this.getEnchantLevel(ENCHANTS.CRITICAL.id);
        return this._critDmg + (critical * 10);
    }
    get DamageReduction() {
        if(this._target.defense) {
            return (this._target.defense / (this._target.defense + 100));
        } else {
            return 0;
        }
    }
    get Additive() {
        return this.sumDict(this._additives);
    }

    get RegularDamage() {
        var base = (5 + this.WeaponDamage) * (1 + (this.Strength/100)) * (this.Additive);
        for(var k in this._mult) {
            base *= this._mult[k];
        }

        var reduction = 1 - this.DamageReduction;
        return base * reduction;
    }
    get CriticalDamage() {
        return this.RegularDamage * (1 + (this.CritDamagePerc / 100));
    }
}

class EnchantType {
    constructor(id, maxLevels, needsTargetHealth, needsPlayerHealth, multV, limArray) {
        this.id = id;
        this.maxLevels = maxLevels;
        this.needsTargetHealth = needsTargetHealth;
        this.needsPlayerHealth = needsPlayerHealth;
        if(limArray) {
            this._mult = multV;
            this.multV = function(ctx, lvl) {
                if(limArray.indexOf(ctx._target.kind) >= 0) {
                    ctx.applyAdditive(this, lvl * this._mult);
                }
            }
        } else {
            this.multV = multV;
        }
    }

    apply(ctx, level) {
        if(typeof(this.multV) === "number") {
            ctx.applyAdditive(this.id, level * this.multV);
        } else {
            this.multV(ctx, level);
        }
    }
}

class SelectedEnchant {
    constructor(level, enchant) {
        this.level = level;
        this.enchant = enchant;
    }
    apply(ctx) {
        return this.enchant.apply(ctx, this.level);
    }
}

const ENCHANTS = {
    SHARPNESS: new EnchantType("Sharpness", 7, false, false, function(ctx, lvl) {
        switch(ctx, lvl) {
            case 7: return ctx.applyAdditive(this.id, 0.65);
            case 6: return ctx.applyAdditive(this.id, 0.45);
            case 5: return ctx.applyAdditive(this.id, 0.30);
            default:
                return ctx.applyAdditive(this.id, lvl * 0.05);
        }
    }),
    SMITE: new EnchantType("Smite", 7, true, false, 0.08, [ENTITY_KIND.PIGMAN, ENTITY_KIND.WITHER, ENTITY_KIND.SKELETON, ENTITY_KIND.ZOMBIE]),
    BANE_OF_ARTHROPODS: new EnchantType("Bane of Arthropods", 7, true, false, 0.08, [ENTITY_KIND.SPIDER, ENTITY_KIND.CAVE_SPIDER, EnchantType.SILVERFISH]),
    GIANT_KILLER: new EnchantType("Giant Killer", 5, true, true, function(ctx, lvl) {
        // 1000 spider: 231 & 363
        const playerHealth = ctx._player.health;
        const tgtHealth = ctx._target.health;
        var diff = tgtHealth - playerHealth;
        console.log("[GK] Difference: ", diff);
        if(tgtHealth > playerHealth) {
            var perc = Math.min(diff / playerHealth, 0.30);
            console.log("[GK] Percentage diff: ", perc);
            var modifier = 0.1 * lvl;
            console.log("[GK] Modifier:", modifier);
            var v = perc * modifier;
            ctx.applyAdditive(this.id, v);
        }
    }),
    ENDER_SLAYER: new EnchantType("Ender Slayer", 5, true, false, 0.12, [ENTITY_KIND.ENDER_DRAGON, ENTITY_KIND.ENDERMAN]),
    DRAGON_HUNTER: new EnchantType("Dragon Hunter", 5, true, false, 0.08, [ENTITY_KIND.ENDER_DRAGON]),
    CUBISM: new EnchantType("Cubism", 5, true, false, 0.10, [ENTITY_KIND.SLIME, ENTITY_KIND.MAGMA_CUBE, ENTITY_KIND.CREEPER]),
    CRITICAL: new EnchantType("Critical", 7, false, false, function(ctx, lvl) { /* Intentionally empty. Handled elsewhere */ })
}
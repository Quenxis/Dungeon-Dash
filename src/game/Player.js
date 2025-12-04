class Player extends Entity {
    constructor(x, y) {
        super(x, y, 'player');
        this.hp = 12;
        this.maxHp = 12;
        this.damage = 1;
        this.upgrades = [];
        this.abilities = [
            { id: 'dash', name: '💨 Dash', desc: 'Active: Teleport to range 2 (CD: 5)', type: 'active', cooldown: 5, currentCooldown: 0, icon: '💨' }
        ];
    }

    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    addUpgrade(upgrade) {
        if (upgrade.type === 'active') {
            // Check if already have it
            const existing = this.abilities.find(a => a.id === upgrade.id);

            if (existing) {
                // Upgrade existing ability
                if (existing.id === 'dash') {
                    existing.cooldown = Math.max(2, existing.cooldown - 1);
                    existing.desc = `Active: Teleport (CD: ${existing.cooldown})`;
                } else if (existing.id === 'whirlwind') {
                    // We need to track damage bonus somewhere. Let's add a 'level' or 'bonus' prop
                    existing.bonus = (existing.bonus || 0) + 1;
                    existing.desc = `Active: Whirlwind (Dmg +${existing.bonus})`;
                } else if (existing.id === 'fireball') {
                    existing.bonus = (existing.bonus || 0) + 1;
                    existing.desc = `Active: Fireball (Dmg 3+${existing.bonus})`;
                } else if (existing.id === 'heal') {
                    existing.bonus = (existing.bonus || 0) + 1;
                    existing.desc = `Active: Heal (3+${existing.bonus} HP)`;
                } else if (existing.id === 'shield_bash') {
                    existing.cooldown = Math.max(2, existing.cooldown - 1);
                    existing.desc = `Active: Shield Bash (CD: ${existing.cooldown})`;
                }
                return;
            }

            // Add to abilities (Max 3)
            if (this.abilities.length < 3) {
                this.abilities.push({
                    id: upgrade.id,
                    name: upgrade.name,
                    desc: upgrade.desc, // Fix: Copy description!
                    cooldown: upgrade.cooldown,
                    currentCooldown: 0,
                    icon: upgrade.icon,
                    bonus: 0
                });
            } else {
                // Replace? For now, just ignore or maybe replace last?
                // Let's just cap at 3 for simplicity.
                console.log("Ability slots full!");
            }
            return;
        }

        // Track counts
        const existing = this.upgrades.find(u => u.id === upgrade.id);
        if (existing) {
            existing.count = (existing.count || 1) + 1;
        } else {
            this.upgrades.push({ ...upgrade, count: 1 });
        }

        // Apply immediate effects
        if (upgrade.id === 'max_hp') {
            this.maxHp += 2; // Buffed from +1
            this.hp += 2;
        } else if (upgrade.id === 'damage') {
            this.damage += 1;
        }
    }

    getUpgradeRank(id) {
        const u = this.upgrades.find(u => u.id === id);
        return u ? u.count : 0;
    }

    hasUpgrade(id) {
        return this.getUpgradeRank(id) > 0;
    }

    tickCooldowns() {
        this.abilities.forEach(a => {
            if (a.currentCooldown > 0) {
                a.currentCooldown--;
            }
        });
    }

    getAbility(index) {
        return this.abilities[index];
    }
}

class Game {
    constructor() {
        this.grid = new Grid('grid', 7, 7);
        this.ui = new UI();
        this.sound = new SoundManager();
        this.player = null;
        this.enemies = [];
        this.level = 1;
        this.score = 0;
        this.state = 'START'; // START, PLAYER_TURN, ENEMY_TURN, ANIMATING, GAME_OVER, UPGRADE

        this.upgradePool = [
            { id: 'max_hp', name: '❤️ Max HP +1', desc: 'Increases Max HP and heals 1' },
            { id: 'damage', name: '⚔️ Damage +1', desc: 'Increases damage by 1' },
            { id: 'thorns', name: '🌵 Thorns', desc: 'Enemies take 1 dmg/rank when hitting you' },
            { id: 'heal_kill', name: '🩸 Heal on Kill', desc: 'Heal 1 HP/rank when killing an enemy' },
            { id: 'double', name: '⚔️⚔️ Double Strike', desc: 'Attack twice (Rank increases chance/dmg)' },
            { id: 'armor', name: '🛡️ Plated Armor', desc: 'Reduce incoming damage by 1/rank' },
            { id: 'crit', name: '🎯 Critical Strike', desc: '20% chance to deal 3x damage' },
            { id: 'first_strike', name: '⚡ First Strike', desc: '+2 damage to enemies with full HP' },
            // Active Abilities
            { id: 'dash', name: '💨 Dash', desc: 'Active: Teleport to range 2 (CD: 5)', type: 'active', cooldown: 5, icon: '💨' },
            { id: 'whirlwind', name: '🌀 Whirlwind', desc: 'Active: Hit all adjacent enemies (CD: 6)', type: 'active', cooldown: 6, icon: '🌀' },
            { id: 'heal', name: '💖 Heal', desc: 'Active: Heal 3 HP (CD: 10)', type: 'active', cooldown: 10, icon: '💖' },
            { id: 'fireball', name: '🔥 Fireball', desc: 'Active: Ranged attack (Range 3, Dmg 3) (CD: 4)', type: 'active', cooldown: 4, icon: '🔥' }
        ];
    }

    start() {
        this.initLevel();
        this.setupInput();
        this.ui.updateStats(this.player, this.level, this.score);
    }

    initLevel() {
        this.grid.init();

        // Clear any existing entities from DOM (Fixes Ghost Player)
        document.querySelectorAll('.entity').forEach(e => e.remove());

        this.enemies = [];
        this.potions = []; // New: Track potions

        // Player start
        if (!this.player) {
            this.player = new Player(3, 3);
        } else {
            this.player.setPosition(3, 3);
        }
        this.addEntityToDOM(this.player);

        // Exit
        const corners = [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 0, y: 6 }, { x: 6, y: 6 }];
        const exit = corners[Math.floor(Math.random() * corners.length)];
        this.grid.setExit(exit.x, exit.y);

        // Potions (20% chance)
        if (Math.random() < 0.2) {
            let px, py;
            do {
                px = Math.floor(Math.random() * 7);
                py = Math.floor(Math.random() * 7);
            } while (
                (px === 3 && py === 3) ||
                (px === exit.x && py === exit.y)
            );

            const potion = { x: px, y: py, type: 'potion', element: null };
            this.potions.push(potion);

            const el = document.createElement('div');
            el.className = 'entity potion';
            el.textContent = '🍷';
            el.style.left = (px * 60) + 'px';
            el.style.top = (py * 60) + 'px';
            // Center the emoji
            el.style.width = '60px';
            el.style.height = '60px';
            el.style.display = 'flex';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
            el.style.fontSize = '30px';

            document.getElementById('game-container').appendChild(el);
            potion.element = el;
        }

        // Boss Levels (10, 20) & Mini-Boss Levels (5, 15)
        if (this.level === 10 || this.level === 20) {
            this.spawnBoss();
        } else if (this.level === 5 || this.level === 15) {
            this.spawnMiniBoss();
        } else {
            // Enemies
            // Smoother scaling:
            // Lvl 1-2: 2
            // Lvl 3-6: 3
            // Lvl 7-11: 4
            // Lvl 12+: 5
            let enemyCount = 2;
            if (this.level >= 3) enemyCount = 3;
            if (this.level >= 7) enemyCount = 4;
            if (this.level >= 12) enemyCount = 5;

            for (let i = 0; i < enemyCount; i++) {
                this.spawnEnemy();
            }
        }

        this.grid.entities = [this.player, ...this.enemies];
        this.state = 'PLAYER_TURN';
        this.ui.showMessage(`Level ${this.level} Start!`);
    }

    spawnMiniBoss() {
        let x, y;
        do {
            x = Math.floor(Math.random() * 7);
            y = Math.floor(Math.random() * 7);
        } while (
            (x === 3 && y === 3) ||
            (x === this.grid.exitPos.x && y === this.grid.exitPos.y)
        );

        // Level 5: Elite Orc, Level 15: Elite Skeleton
        const type = this.level === 5 ? 'orc' : 'skeleton';
        const miniBoss = new Enemy(x, y, type);

        // Boost Stats
        miniBoss.hp *= 2.5; // Significant HP boost
        miniBoss.damage += 1;
        miniBoss.maxHp = miniBoss.hp;

        // Visual distinction (handled in UI or by adding a class)
        miniBoss.isMiniBoss = true;

        this.enemies.push(miniBoss);
        this.addEntityToDOM(miniBoss);

        // Add visual flair
        if (miniBoss.element) {
            miniBoss.element.style.transform = 'scale(1.3)';
            miniBoss.element.style.border = '2px solid gold';
        }

        this.ui.showMessage("MINI-BOSS!");
    }

    spawnBoss() {
        // Spawn Boss at center-ish or random?
        let x, y;
        do {
            x = Math.floor(Math.random() * 7);
            y = Math.floor(Math.random() * 7);
        } while (
            (x === 3 && y === 3) ||
            (x === this.grid.exitPos.x && y === this.grid.exitPos.y)
        );

        const boss = new Enemy(x, y, 'boss');
        // Buff boss based on level
        if (this.level === 20) {
            boss.hp = 50; // Buffed from 40
            boss.damage = 5;
        } else {
            // Level 10 boss
            boss.hp = 25; // Buffed from 20
        }
        boss.maxHp = boss.hp; // Sync maxHp

        this.enemies.push(boss);
        this.addEntityToDOM(boss);
        this.ui.showMessage("BOSS FIGHT!");
    }

    spawnEnemy() {
        let type = 'goblin';
        const rand = Math.random();

        // Adjusted spawn rates for new enemies
        if (this.level >= 10) {
            if (rand < 0.2) type = 'goblin';
            else if (rand < 0.4) type = 'skeleton';
            else if (rand < 0.6) type = 'orc';
            else if (rand < 0.8) type = 'cultist';
            else type = 'slime';
        } else if (this.level >= 5) {
            if (rand < 0.3) type = 'goblin';
            else if (rand < 0.5) type = 'skeleton';
            else if (rand < 0.7) type = 'orc';
            else if (rand < 0.9) type = 'cultist';
            else type = 'slime';
        } else if (this.level >= 2) {
            if (rand < 0.6) type = 'goblin';
            else if (rand < 0.8) type = 'skeleton';
            else type = 'slime'; // Introduce slime early
        }

        let x, y;
        do {
            x = Math.floor(Math.random() * 7);
            y = Math.floor(Math.random() * 7);
        } while (
            (x === 3 && y === 3) || // Player start
            (x === this.grid.exitPos.x && y === this.grid.exitPos.y) || // Exit
            this.enemies.some(e => e.x === x && e.y === y) // Check existing enemies
        );

        const enemy = new Enemy(x, y, type);

        // Scaling
        // Harder scaling: every 3 levels instead of 5
        const tier = Math.floor(this.level / 3);
        enemy.hp += tier;
        enemy.damage += Math.floor(tier / 2);
        enemy.maxHp = enemy.hp; // Sync maxHp

        this.enemies.push(enemy);
        this.addEntityToDOM(enemy);
    }

    addEntityToDOM(entity) {
        const el = entity.createDOMElement();
        // Initial HP visual
        if (entity.type !== 'player') {
            this.updateEnemyVisuals(entity, el);
        }
        document.getElementById('game-container').appendChild(el);
    }

    updateEnemyVisuals(enemy, el) {
        if (!el) return;
        const pct = (enemy.hp / enemy.maxHp) * 100;
        // Gradient from bottom (color) to top (grey/dark)
        // If 100%, full color. If 50%, bottom 50% color.
        // We need to know the base color. We can set it via CSS var or just assume based on class.
        // Actually, let's use a clip-path or just a background gradient override.
        // Problem: CSS classes set background-color. Inline style overrides it.

        let color = '#e94560'; // Default enemy red
        if (enemy.type === 'cultist') color = '#9b59b6';
        if (enemy.type === 'slime') color = '#2ecc71';
        if (enemy.type === 'boss') color = '#f1c40f';
        if (enemy.type === 'skeleton') color = '#e94560'; // Same as goblin/default

        el.style.background = `linear-gradient(to top, ${color} ${pct}%, #444 ${pct}%)`;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.state === 'PLAYER_TURN') {
                if (e.key === 'ArrowUp') this.handlePlayerInput(this.player.x, this.player.y - 1);
                if (e.key === 'ArrowDown') this.handlePlayerInput(this.player.x, this.player.y + 1);
                if (e.key === 'ArrowLeft') this.handlePlayerInput(this.player.x - 1, this.player.y);
                if (e.key === 'ArrowRight') this.handlePlayerInput(this.player.x + 1, this.player.y);

                // Abilities
                if (e.key === '1') this.useAbility(0);
                if (e.key === '2') this.useAbility(1);
                if (e.key === '3') this.useAbility(2);
            } else if (this.state === 'TARGETING') {
                if (e.key === 'Escape') {
                    this.state = 'PLAYER_TURN';
                    this.ui.showMessage("Targeting Cancelled");
                    this.grid.clearHighlights();
                }
            }
        });

        // Grid clicks
        this.grid.container.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            if (this.state === 'PLAYER_TURN') {
                this.handlePlayerInput(x, y);
            } else if (this.state === 'TARGETING') {
                this.handleTargetingInput(x, y);
            }
        });

        // Hover effects
        this.grid.container.addEventListener('mousemove', (e) => {
            if (this.state !== 'PLAYER_TURN' && this.state !== 'TARGETING') return;

            // Only clear if not in targeting mode (or handle targeting highlights differently)
            if (this.state === 'PLAYER_TURN') this.grid.clearHighlights();

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            if (this.state === 'PLAYER_TURN') {
                if (this.isAdjacent(this.player.x, this.player.y, x, y)) {
                    if (this.grid.isOccupied(x, y)) {
                        this.grid.highlightAttack(x, y);
                    } else {
                        this.grid.highlightMove(x, y);
                    }
                }
            }
            // Targeting hover logic could go here
        });
    }

    useAbility(index) {
        const ability = this.player.getAbility(index);
        if (!ability) return;
        if (ability.currentCooldown > 0) {
            this.ui.showMessage("Ability on Cooldown!");
            return;
        }

        this.activeAbilityIndex = index;

        if (ability.id === 'dash') {
            this.state = 'TARGETING';
            this.ui.showMessage("Select tile to Dash (Range 2)");
        } else if (ability.id === 'fireball') {
            this.state = 'TARGETING';
            this.ui.showMessage("Select enemy to Fireball (Range 3)");
        } else if (ability.id === 'whirlwind') {
            this.performWhirlwind(ability);
        } else if (ability.id === 'heal') {
            this.performHeal(ability);
        }
    }

    handleTargetingInput(x, y) {
        const ability = this.player.getAbility(this.activeAbilityIndex);

        if (ability.id === 'dash') {
            const cheby = Math.max(Math.abs(x - this.player.x), Math.abs(y - this.player.y));

            if (cheby <= 2 && !this.grid.isOccupied(x, y) && this.grid.isValid(x, y)) {
                this.player.setPosition(x, y);
                this.sound.playMove();

                // Check exit (Dash specific)
                if (x === this.grid.exitPos.x && y === this.grid.exitPos.y) {
                    if (this.enemies.length === 0) {
                        this.levelComplete();
                        // Don't complete ability or end turn if level complete (state changes)
                        return;
                    } else {
                        this.ui.showMessage("Kill all enemies first!");
                    }
                }

                this.completeAbility(ability);
            } else {
                this.ui.showMessage("Invalid Dash Target");
            }
        } else if (ability.id === 'fireball') {
            const cheby = Math.max(Math.abs(x - this.player.x), Math.abs(y - this.player.y));
            const target = this.grid.getEntityAt(x, y);

            if (cheby <= 3 && target && target.type !== 'player') {
                const bonus = ability.bonus || 0;
                target.takeDamage(3 + bonus);
                this.updateEnemyVisuals(target, target.element);
                if (target.hp <= 0) {
                    this.sound.playEnemyDeath();
                    this.removeEntity(target);
                    this.score += 5;
                } else {
                    this.sound.playHit();
                }
                this.completeAbility(ability);
            } else {
                this.ui.showMessage("Invalid Fireball Target");
            }
        }
    }

    performWhirlwind(ability) {
        let hit = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const target = this.grid.getEntityAt(this.player.x + dx, this.player.y + dy);
                if (target && target.type !== 'player') {
                    const bonus = ability.bonus || 0;
                    target.takeDamage(this.player.damage + bonus);
                    this.updateEnemyVisuals(target, target.element);
                    if (target.hp <= 0) {
                        this.sound.playEnemyDeath();
                        this.removeEntity(target);
                        this.score += 5;
                    }
                    hit = true;
                }
            }
        }
        if (hit) this.sound.playHit();
        this.completeAbility(ability);
    }

    performHeal(ability) {
        const bonus = ability.bonus || 0;
        const amount = 3 + bonus;
        this.player.heal(amount);
        this.ui.showMessage(`Healed ${amount} HP!`);
        this.completeAbility(ability);
    }

    completeAbility(ability) {
        ability.currentCooldown = ability.cooldown;
        this.ui.updateStats(this.player, this.level, this.score);
        this.endPlayerTurn();
    }

    isAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
    }

    handlePlayerInput(x, y) {
        if (!this.isAdjacent(this.player.x, this.player.y, x, y)) return;

        const targetEnemy = this.grid.getEntityAt(x, y);

        if (targetEnemy) {
            // Attack
            this.sound.playAttack();
            this.attack(this.player, targetEnemy);
        } else {
            // Move
            this.sound.playMove();
            this.player.setPosition(x, y);

            // Check Potion
            const potionIndex = this.potions.findIndex(p => p.x === x && p.y === y);
            if (potionIndex !== -1) {
                const potion = this.potions[potionIndex];
                this.player.heal(3);
                this.ui.showMessage("Consumed Potion! (+3 HP)");
                if (potion.element) potion.element.remove();
                this.potions.splice(potionIndex, 1);
                this.ui.updateStats(this.player, this.level, this.score);
            }

            // Check exit
            if (x === this.grid.exitPos.x && y === this.grid.exitPos.y) {
                if (this.enemies.length === 0) {
                    this.levelComplete();
                    return;
                } else {
                    this.ui.showMessage("Kill all enemies first!");
                    return;
                }
            }
        }

        this.endPlayerTurn();
    }

    attack(attacker, defender) {
        let dmg = attacker.damage;

        // Player Attack Logic
        if (attacker.type === 'player') {
            // Double Strike
            const doubleRank = attacker.getUpgradeRank('double');
            if (doubleRank > 0) {
                // Nerfed: +50% dmg per rank (was +100%)
                dmg = Math.floor(dmg * (1 + doubleRank * 0.5));
            }
            // Crit Strike
            const critRank = attacker.getUpgradeRank('crit');
            if (critRank > 0 && Math.random() < 0.2) {
                dmg *= 3;
                this.ui.showMessage("CRITICAL HIT!");
            }
            // First Strike
            const firstStrikeRank = attacker.getUpgradeRank('first_strike');
            if (firstStrikeRank > 0 && defender.hp === (defender.maxHp || defender.hp)) {
                dmg += 2;
            }
        }

        // Damage Calculation
        let actualDmg = dmg;

        // Armor Logic (Defender)
        if (defender.type === 'player') {
            const armorRank = defender.getUpgradeRank('armor');
            if (armorRank > 0) {
                actualDmg -= armorRank;
                // Nerfed: Minimum damage is 1
                if (actualDmg < 1) actualDmg = 1;
            }
        }

        // Apply Damage
        const killed = defender.takeDamage(actualDmg);

        // Update Visuals
        if (defender.type !== 'player') {
            this.updateEnemyVisuals(defender, defender.element);
        }

        // Play hit sound if defender is player
        if (defender.type === 'player') {
            this.sound.playHit();
        }

        // Thorns Logic (Rank based)
        if (defender.type === 'player') {
            const thornsRank = defender.getUpgradeRank('thorns');
            if (thornsRank > 0) {
                attacker.takeDamage(thornsRank); // 1 dmg per rank
                // Update attacker visuals if it's an enemy
                if (attacker.type !== 'player') {
                    this.updateEnemyVisuals(attacker, attacker.element);
                }
            }
        }

        if (killed) {
            this.sound.playEnemyDeath();
            this.removeEntity(defender);
            if (attacker.type === 'player') {
                this.score += 5;
                // Heal on Kill Logic (Rank based)
                const healRank = attacker.getUpgradeRank('heal_kill');
                if (healRank > 0) {
                    attacker.heal(healRank);
                }
            }
        }

        this.ui.updateStats(this.player, this.level, this.score);
    }

    removeEntity(entity) {
        if (entity.element) entity.element.remove();
        if (entity.type === 'player') {
            this.gameOver();
        } else {
            this.enemies = this.enemies.filter(e => e !== entity);
            this.grid.entities = [this.player, ...this.enemies];
        }
    }

    endPlayerTurn() {
        this.state = 'ENEMY_TURN';
        this.ui.showMessage("Enemy Turn...");
        setTimeout(() => this.processEnemyTurn(), 300);
    }

    processEnemyTurn() {
        if (this.state === 'GAME_OVER') return;

        this.enemies.forEach(enemy => {
            // Check if dead (could have died from thorns)
            if (enemy.hp <= 0) return;

            // Skeleton Logic (Shooting)
            if (enemy.type === 'skeleton') {
                if (enemy.x === this.player.x || enemy.y === this.player.y) {
                    this.attack(enemy, this.player); // Use attack method for armor calc
                    this.sound.playHit();
                    this.ui.showMessage("Skeleton shot you!");
                    return;
                }
            }

            // Cultist Logic (Diagonal Shooting)
            if (enemy.type === 'cultist') {
                const dx = Math.abs(enemy.x - this.player.x);
                const dy = Math.abs(enemy.y - this.player.y);
                if (dx === dy) { // Diagonal alignment
                    this.attack(enemy, this.player);
                    this.sound.playHit();
                    this.ui.showMessage("Cultist zapped you!");
                    return;
                }
            }

            const move = enemy.decideMove(this.player, this.grid);

            // Check if move hits player
            if (move.x === this.player.x && move.y === this.player.y) {
                this.sound.playAttack();
                this.attack(enemy, this.player);
            } else if (move.x !== enemy.x || move.y !== enemy.y) {
                enemy.setPosition(move.x, move.y);
            }
        });

        if (this.state !== 'GAME_OVER') {
            this.player.tickCooldowns(); // Update cooldowns
            this.state = 'PLAYER_TURN';
            this.ui.showMessage("Your Turn");
        }
    }

    levelComplete() {
        this.score += 10;

        // Check for Boss/Mini-Boss Victory (Levels 5, 10, 15, 20)
        // Note: level is incremented AFTER this check in original logic, but we want to check the level we just finished.
        // Actually, level is incremented at start of this function in original code.
        // Let's adjust: increment level at the end or check (level - 1)?
        // Original: this.level++; then check > 20.
        // So if we just finished level 5, level is now 6.
        // Let's check (this.level - 1) or move increment.

        // Better: Check before incrementing.
        const finishedLevel = this.level;
        this.level++;
        this.sound.playLevelComplete();

        if (finishedLevel === 20) {
            this.victory();
            return;
        }

        // Rewards for Boss/Mini-Boss
        if (finishedLevel === 5 || finishedLevel === 10 || finishedLevel === 15) {
            this.player.heal(100); // Full Heal
            this.pendingUpgrades = 2; // Double Upgrade
            this.ui.showMessage("BOSS DEFEATED! Full Heal + 2 Upgrades!");
        } else {
            this.pendingUpgrades = 1;
        }

        this.state = 'UPGRADE';
        this.showUpgradeScreen();
    }

    showUpgradeScreen() {
        // Pick 3 random
        const shuffled = [...this.upgradePool].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        const title = this.pendingUpgrades > 1 ? "Boss Defeated! Choose 2 Upgrades!" : "Level Complete!";
        const sub = this.pendingUpgrades > 1 ? `Select ${this.pendingUpgrades} more...` : "Choose an upgrade:";

        let html = `<h2>${title}</h2><p>${sub}</p><div style="display:flex;">`;
        choices.forEach(u => {
            // Show current rank if owned
            const rank = this.player.getUpgradeRank(u.id);
            const rankText = rank > 0 ? ` (Rank ${rank + 1})` : '';

            html += `
                <div class="upgrade-card" onclick="window.game.selectUpgrade('${u.id}')">
                    <div style="font-size:30px; margin-bottom:10px;">${u.name.split(' ')[0]}</div>
                    <div>${u.name.substring(u.name.indexOf(' ') + 1)}${rankText}</div>
                    <div style="font-size:0.8rem; color:#aaa; margin-top:5px;">${u.desc}</div>
                </div>
            `;
        });
        html += `</div>`;

        this.ui.showOverlay(html);

        // We need a global handler for the onclick because of scope
        window.game.selectUpgrade = (id) => {
            const upgrade = this.upgradePool.find(u => u.id === id);
            this.player.addUpgrade(upgrade);

            this.pendingUpgrades--;

            if (this.pendingUpgrades > 0) {
                // Refresh screen for next pick
                this.showUpgradeScreen();
                this.ui.updateStats(this.player, this.level, this.score);
            } else {
                this.ui.hideOverlay();
                this.initLevel();
                this.ui.updateStats(this.player, this.level, this.score);
            }
        };
    }

    gameOver() {
        this.sound.playGameOver();
        this.state = 'GAME_OVER';
        this.ui.showOverlay(`
            <h1>GAME OVER</h1>
            <p>Level Reached: ${this.level}</p>
            <p>Final Score: ${this.score}</p>
            <button class="btn" onclick="location.reload()">Restart</button>
        `);
    }

    victory() {
        this.state = 'GAME_OVER';
        this.ui.showOverlay(`
            <h1>VICTORY!</h1>
            <p>You conquered the dungeon!</p>
            <p>Final Score: ${this.score}</p>
            <button class="btn" onclick="location.reload()">Play Again</button>
        `);
    }
}

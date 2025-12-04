class UI {
    constructor() {
        this.hpDisplay = document.getElementById('hp-display');
        this.dmgDisplay = document.getElementById('dmg-display');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.messageDisplay = document.getElementById('message-display');
        this.overlay = document.getElementById('overlay');
        this.overlayContent = document.getElementById('overlay-content');
    }

    updateStats(player, level, score) {
        // HP Display: Numeric + Visual
        // "❤️ 5/5"
        this.hpDisplay.textContent = `${player.hp}/${player.maxHp}`;

        this.dmgDisplay.textContent = player.damage;
        this.levelDisplay.textContent = level;
        this.scoreDisplay.textContent = score;

        this.updateUpgradeList(player);
    }

    updateUpgradeList(player) {
        const list = document.getElementById('upgrade-list');
        if (!list) return;

        list.innerHTML = '';
        if (player.upgrades.length === 0) {
            list.innerHTML = '<div style="color:#888; font-style:italic;">No upgrades yet</div>';
        } else {
            player.upgrades.forEach(u => {
                const rank = u.count > 1 ? ` (Rank ${u.count})` : '';
                const item = document.createElement('div');
                item.style.marginBottom = '5px';
                item.style.fontSize = '0.9rem';
                item.textContent = `${u.name.split(' ')[0]} ${u.name.substring(u.name.indexOf(' ') + 1)}${rank}`;
                list.appendChild(item);
            });
        }

        // Also update abilities
        this.updateAbilities(player);
    }

    updateAbilities(player) {
        let bar = document.getElementById('ability-bar');
        if (!bar) return;

        bar.innerHTML = '';
        if (player.abilities.length === 0) {
            // Optional: Show empty slots or placeholder text?
            // For now, just keep it empty but visible (min-height in HTML handles layout)
            bar.innerHTML = '<span style="color:#555; font-size:0.8rem;">Abilities appear here</span>';
            return;
        }
        // bar.style.display = 'flex'; // Already set in HTML/CSS

        player.abilities.forEach((a, index) => {
            const btn = document.createElement('div');
            btn.className = 'ability-btn';
            btn.style.width = '50px';
            btn.style.height = '50px';
            btn.style.backgroundColor = a.currentCooldown > 0 ? '#555' : '#2a2a4e';
            btn.style.border = '2px solid #16213e';
            btn.style.borderRadius = '8px';
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.justifyContent = 'center';
            btn.style.alignItems = 'center';
            btn.style.cursor = 'pointer';
            btn.style.position = 'relative';

            if (a.currentCooldown === 0) {
                btn.style.borderColor = '#0f4c75';
                btn.onclick = () => window.game.useAbility(index);
            }

            const icon = document.createElement('span');
            icon.textContent = a.icon;
            icon.style.fontSize = '20px';

            const key = document.createElement('span');
            key.textContent = index + 1;
            key.style.position = 'absolute';
            key.style.top = '2px';
            key.style.left = '4px';
            key.style.fontSize = '10px';
            key.style.color = '#aaa';

            const cd = document.createElement('span');
            if (a.currentCooldown > 0) {
                cd.textContent = a.currentCooldown;
                cd.style.fontSize = '18px';
                cd.style.fontWeight = 'bold';
                cd.style.color = '#ff4444';
            }

            btn.appendChild(key);
            btn.appendChild(icon);
            if (a.currentCooldown > 0) btn.appendChild(cd);

            bar.appendChild(btn);
        });
    }

    toggleLegend() {
        if (this.overlay.classList.contains('hidden')) {
            // If opening legend, save current state if we are in a menu/upgrade
            this.savedOverlay = this.overlayContent.innerHTML;
            this.showLegend();
        } else {
            // If closing
            if (this.isLegendShowing) {
                // If we were showing legend, restore previous state
                if (this.savedOverlay && this.savedOverlay.trim() !== "") {
                    this.overlayContent.innerHTML = this.savedOverlay;
                    this.isLegendShowing = false;
                    const state = window.game.state;
                    if (state !== 'UPGRADE' && state !== 'GAME_OVER') {
                        this.hideOverlay();
                    }
                } else {
                    this.hideOverlay();
                    this.isLegendShowing = false;
                }
            } else {
                // Overlay was open for something else (Upgrade/Game Over), and user clicked toggle?
                // If user clicks toggle while Upgrade is open, we want to SHOW legend.
                this.savedOverlay = this.overlayContent.innerHTML;
                this.showLegend();
            }
        }
    }

    log(msg, type = 'info') {
        const logContainer = document.getElementById('combat-log');
        if (!logContainer) return;

        const entry = document.createElement('div');
        entry.style.marginBottom = '4px';
        entry.textContent = `> ${msg}`;

        if (type === 'damage-dealt') entry.style.color = '#4cd137'; // Green
        else if (type === 'damage-taken') entry.style.color = '#e84118'; // Red
        else if (type === 'heal') entry.style.color = '#e1b12c'; // Yellow
        else if (type === 'kill') entry.style.color = '#9c88ff'; // Purple
        else entry.style.color = '#dcdde1'; // Grey/White

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    showLegend() {
        this.isLegendShowing = true;
        const html = `
            <h2>Game Legend</h2>
            <div style="text-align: left; max-width: 500px; max-height: 500px; overflow-y: auto; padding-right: 10px;">
                
                <h3>Enemies</h3>
                <div class="legend-row"><div class="entity enemy goblin legend-icon"></div> <strong>Goblin</strong>: Weak melee. Moves 1 tile.</div>
                <div class="legend-row"><div class="entity enemy skeleton legend-icon"></div> <strong>Skeleton</strong>: Sniper. Shoots in straight lines.</div>
                <div class="legend-row"><div class="entity enemy orc legend-icon"></div> <strong>Orc</strong>: Warrior. Moves in all 8 directions.</div>
                <div class="legend-row"><div class="entity enemy cultist legend-icon"></div> <strong>Cultist</strong>: Mage. Shoots diagonally.</div>
                <div class="legend-row"><div class="entity enemy slime legend-icon"></div> <strong>Slime</strong>: Blocker. High HP, blocks path.</div>
                
                <h3>Bosses</h3>
                <div class="legend-row"><div class="entity enemy orc legend-icon" style="border:2px solid gold"></div> <strong>Elite Orc (Lvl 5)</strong>: Goes BERSERK (moves every turn) at 50% HP.</div>
                <div class="legend-row"><div class="entity enemy boss legend-icon"></div> <strong>Dungeon Boss (Lvl 10)</strong>: Uses Shockwave if you kite him.</div>

                <h3>Abilities</h3>
                <div class="legend-row"><strong>💨 Dash</strong>: Teleport 2 tiles. Good for escaping or engaging.</div>
                <div class="legend-row"><strong>🌀 Whirlwind</strong>: Hit ALL adjacent enemies.</div>
                <div class="legend-row"><strong>💖 Heal</strong>: Restore HP instantly.</div>
                <div class="legend-row"><strong>🔥 Fireball</strong>: Ranged attack (Range 3). High damage.</div>

                <h3>Stats</h3>
                <div class="legend-row"><strong>❤️ Max HP</strong>: Increases health pool.</div>
                <div class="legend-row"><strong>⚔️ Damage</strong>: Increases base hit damage.</div>
                <div class="legend-row"><strong>🛡️ Armor</strong>: Reduces incoming damage.</div>
                <div class="legend-row"><strong>🎯 Crit</strong>: Chance to deal triple damage.</div>
            </div>
            <button class="btn" onclick="window.game.ui.toggleLegend()">Close</button>
        `;
        this.overlayContent.innerHTML = html;
        this.overlay.classList.remove('hidden');
    }

    showMessage(msg) {
        this.messageDisplay.textContent = msg;
    }

    showOverlay(html) {
        this.overlayContent.innerHTML = html;
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
}

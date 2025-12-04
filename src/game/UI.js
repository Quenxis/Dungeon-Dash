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

    showLegend() {
        this.isLegendShowing = true;
        const html = `
            <h2>Enemy Legend</h2>
            <div style="text-align: left; max-width: 300px; max-height: 400px; overflow-y: auto;">
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                    <div class="entity enemy goblin" style="position: relative; margin-right: 15px;"></div>
                    <div><strong>Goblin</strong>: Chaser. Moves 1 tile.</div>
                </div>
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                    <div class="entity enemy skeleton" style="position: relative; margin-right: 15px;"></div>
                    <div><strong>Skeleton</strong>: Sniper. Shoots in straight lines.</div>
                </div>
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                    <div class="entity enemy orc" style="position: relative; margin-right: 15px;"></div>
                    <div><strong>Orc</strong>: Warrior. Moves in all 8 directions.</div>
                </div>
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                    <div class="entity enemy cultist" style="position: relative; margin-right: 15px;"></div>
                    <div><strong>Cultist</strong>: Mage. Shoots diagonally.</div>
                </div>
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                    <div class="entity enemy slime" style="position: relative; margin-right: 15px;"></div>
                    <div><strong>Slime</strong>: Blocker. High HP, doesn't attack, blocks path.</div>
                </div>
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                    <div class="entity enemy boss" style="position: relative; margin-right: 15px; transform: scale(1.2);"></div>
                    <div><strong>BOSS</strong>: Extremely dangerous!</div>
                </div>
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

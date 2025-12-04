class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, type);
        this.setupStats();
    }

    setupStats() {
        if (this.type === 'goblin') {
            this.hp = 2;
            this.damage = 1;
        } else if (this.type === 'skeleton') {
            this.hp = 1;
            this.damage = 2;
        } else if (this.type === 'orc') {
            this.hp = 4;
            this.damage = 2;
        } else if (this.type === 'cultist') {
            this.hp = 2;
            this.damage = 2; // Nerfed from 3
        } else if (this.type === 'slime') {
            this.hp = 6;
            this.damage = 0;
        } else if (this.type === 'boss') {
            this.hp = 20;
            this.damage = 3;
        }
        this.maxHp = this.hp; // Track max HP for visual bar
    }

    // Returns the desired next position {x, y} or null if skipping turn
    decideMove(player, grid) {
        if (this.type === 'boss' || this.isMiniBoss) {
            // Berserk Mechanic: If HP <= 50%, move every turn!
            const isBerserk = this.hp <= (this.maxHp / 2);

            if (!isBerserk) {
                this.turnCounter = (this.turnCounter || 0) + 1;
                // "Heavy" mechanic: Move only on odd turns (1, 3, 5...)
                if (this.turnCounter % 2 === 0) {
                    return { x: this.x, y: this.y, skipped: true };
                }
            }
        }

        if (this.type === 'goblin') return this.goblinAI(player, grid);
        if (this.type === 'skeleton') return this.skeletonAI(player, grid);
        if (this.type === 'orc') return this.orcAI(player, grid);
        if (this.type === 'cultist') return this.cultistAI(player, grid);
        if (this.type === 'slime') return this.slimeAI(player, grid);
        if (this.type === 'boss') return this.orcAI(player, grid); // Boss moves like Orc for now

        return { x: this.x, y: this.y };
    }

    cultistAI(player, grid) {
        // Goal: Align diagonally to shoot
        // If already diagonal, maybe move to keep distance? Or stay?
        // Let's try to move to a tile that is diagonal to the player.

        const currentDx = Math.abs(player.x - this.x);
        const currentDy = Math.abs(player.y - this.y);
        const isDiagonal = currentDx === currentDy && currentDx > 0;

        // If aligned and safe distance, 50% chance to stay, 50% to move (kite)
        if (isDiagonal && currentDx > 1 && Math.random() < 0.5) {
            return { x: this.x, y: this.y };
        }

        let bestMove = { x: this.x, y: this.y };
        let minDiff = Infinity; // Difference between dx and dy (0 means diagonal)

        // Check all neighbors
        const neighbors = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
        ];

        // Cultist moves like King (8 dir) or Goblin (4 dir)? 
        // Spec didn't specify, but "Mage" usually implies mobility. Let's give 8-dir movement to make them dangerous.

        for (let dir of neighbors) {
            const nx = this.x + dir.x;
            const ny = this.y + dir.y;

            if (grid.isValid(nx, ny) && !grid.isOccupied(nx, ny)) {
                const dx = Math.abs(player.x - nx);
                const dy = Math.abs(player.y - ny);
                const diff = Math.abs(dx - dy);

                // Prioritize diagonal (diff 0)
                // Then prioritize distance (don't get too close if possible)

                if (diff < minDiff) {
                    minDiff = diff;
                    bestMove = { x: nx, y: ny };
                } else if (diff === minDiff) {
                    // If same alignment quality, pick the one further from player?
                    // Or just random to be unpredictable
                    if (Math.random() < 0.5) {
                        bestMove = { x: nx, y: ny };
                    }
                }
            }
        }

        return bestMove;
    }

    slimeAI(player, grid) {
        // Goal: Block the player from reaching the exit.
        // Strategy: Identify the tile adjacent to the player that is closest to the exit.
        // Move towards that tile.

        if (!grid.exitPos) return this.goblinAI(player, grid); // Fallback

        // 1. Find all valid tiles adjacent to the player
        const neighbors = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
        ];

        let bestSpot = null;
        let minExitDist = Infinity;

        for (let dir of neighbors) {
            const nx = player.x + dir.x;
            const ny = player.y + dir.y;

            if (grid.isValid(nx, ny)) {
                // CRITICAL: Do not step on the Exit
                if (grid.exitPos && nx === grid.exitPos.x && ny === grid.exitPos.y) continue;

                // Distance from this neighbor to exit
                const dist = Math.abs(nx - grid.exitPos.x) + Math.abs(ny - grid.exitPos.y);

                // We want the spot closest to exit (blocking the path)
                // But we also need to check if we can actually *be* there (not occupied by another enemy)
                // Exception: If WE are there, it's valid (we stay)
                const isOccupiedByOther = grid.isOccupied(nx, ny) && (nx !== this.x || ny !== this.y);

                if (!isOccupiedByOther) {
                    if (dist < minExitDist) {
                        minExitDist = dist;
                        bestSpot = { x: nx, y: ny };
                    }
                }
            }
        }

        if (!bestSpot) {
            // No valid blocking spot? Just swarm player.
            return this.goblinAI(player, grid);
        }

        // 2. Move towards bestSpot
        // If we are at bestSpot, stay.
        if (this.x === bestSpot.x && this.y === bestSpot.y) {
            return { x: this.x, y: this.y };
        }

        // Otherwise, move towards bestSpot using Orc movement (8-way)
        // We reuse the logic but target bestSpot instead of player
        let bestMove = { x: this.x, y: this.y };
        let minTargetDist = Infinity;

        for (let dir of neighbors) {
            const nx = this.x + dir.x;
            const ny = this.y + dir.y;

            if (grid.isValid(nx, ny) && !grid.isOccupied(nx, ny)) {
                // CRITICAL: Do not step on the Exit
                if (grid.exitPos && nx === grid.exitPos.x && ny === grid.exitPos.y) continue;

                const dist = Math.max(Math.abs(bestSpot.x - nx), Math.abs(bestSpot.y - ny));
                if (dist < minTargetDist) {
                    minTargetDist = dist;
                    bestMove = { x: nx, y: ny };
                }
            }
        }

        return bestMove;
    }

    goblinAI(player, grid) {
        // Move 1 tile towards player (Manhattan preference)
        const dx = player.x - this.x;
        const dy = player.y - this.y;

        // Helper to check if tile is valid (empty OR has player) AND not exit
        const isValidMove = (x, y) => {
            if (grid.exitPos && x === grid.exitPos.x && y === grid.exitPos.y) return false;
            return grid.isValid(x, y) && (!grid.isOccupied(x, y) || (x === player.x && y === player.y));
        };

        // Try horizontal first if distance is greater
        if (Math.abs(dx) > Math.abs(dy)) {
            const nextX = this.x + Math.sign(dx);
            if (isValidMove(nextX, this.y)) {
                return { x: nextX, y: this.y };
            }
        }

        // Try vertical
        const nextY = this.y + Math.sign(dy);
        if (isValidMove(this.x, nextY)) {
            return { x: this.x, y: nextY };
        }

        // If blocked, try the other axis
        if (Math.abs(dx) <= Math.abs(dy)) {
            const nextX = this.x + Math.sign(dx);
            if (isValidMove(nextX, this.y)) {
                return { x: nextX, y: this.y };
            }
        }

        return { x: this.x, y: this.y }; // Stay
    }

    skeletonAI(player, grid) {
        // Skeleton stays in place (turret)
        return { x: this.x, y: this.y };
    }

    orcAI(player, grid) {
        // Move like chess king
        // Minimize distance
        let bestMove = { x: this.x, y: this.y };
        let minDist = Infinity;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const nx = this.x + dx;
                const ny = this.y + dy;

                // Allow move if empty OR player (attack)
                if (grid.isValid(nx, ny) && (!grid.isOccupied(nx, ny) || (nx === player.x && ny === player.y))) {
                    // CRITICAL: Do not step on the Exit
                    if (grid.exitPos && nx === grid.exitPos.x && ny === grid.exitPos.y) continue;

                    // Chebyshev distance for King movement
                    const dist = Math.max(Math.abs(player.x - nx), Math.abs(player.y - ny));
                    if (dist < minDist) {
                        minDist = dist;
                        bestMove = { x: nx, y: ny };
                    }
                }
            }
        }
        return bestMove;
    }

    createDOMElement() {
        const el = super.createDOMElement();
        el.classList.add('enemy');
        return el;
    }
}

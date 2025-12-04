class Grid {
    constructor(containerId, width, height) {
        this.container = document.getElementById(containerId);
        this.width = width;
        this.height = height;
        this.cells = []; // 2D array or 1D? 2D is easier.
        this.entities = []; // Reference to entities for collision
        this.exitPos = { x: 0, y: 0 };
    }

    init() {
        this.container.innerHTML = '';
        this.cells = [];

        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.container.appendChild(cell);
                row.push(cell);
            }
            this.cells.push(row);
        }
    }

    setExit(x, y) {
        // Clear old exit
        const oldExit = this.container.querySelector('.exit');
        if (oldExit) oldExit.remove();

        this.exitPos = { x, y };
        const exitDiv = document.createElement('div');
        exitDiv.classList.add('exit');
        this.cells[y][x].appendChild(exitDiv);
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isOccupied(x, y) {
        // Check if any entity is at x, y
        // We need the Game to pass entities or store them here.
        // Better to pass them in or have a method `setEntities`
        return this.getEntityAt(x, y) !== null;
    }

    getEntityAt(x, y) {
        return this.entities.find(e => e.x === x && e.y === y) || null;
    }

    // Visual helpers
    clearHighlights() {
        this.cells.forEach(row => row.forEach(cell => {
            cell.classList.remove('valid-move');
            cell.classList.remove('attack-target');
        }));
    }

    highlightMove(x, y) {
        if (this.isValid(x, y)) {
            this.cells[y][x].classList.add('valid-move');
        }
    }

    highlightAttack(x, y) {
        if (this.isValid(x, y)) {
            this.cells[y][x].classList.add('attack-target');
        }
    }
}

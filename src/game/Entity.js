class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'player', 'goblin', 'skeleton', 'orc'
        this.hp = 1;
        this.maxHp = 1;
        this.damage = 0;
        this.element = null;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateVisualPosition();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        // Visual feedback could go here
        console.log(`${this.type} took ${amount} damage. HP: ${this.hp}`);
        return this.hp <= 0;
    }

    updateVisualPosition() {
        if (this.element) {
            // Grid size is 60px + 2px gap
            const cellSize = 62;
            // Center in cell (cell is 60x60, gap is 2)
            // Actually, we can just use top/left with calculation
            // The grid has 2px gap.
            // x=0 -> 0px
            // x=1 -> 62px
            // this.element.style.left = `${this.x * cellSize + 11}px`; // Removed redundant line
            // Let's refine centering.
            // Cell is 60px. Entity is 30-40px.
            // Gap is 2px.
            // Offset = x * (60 + 2).
            // Centering offset = (60 - width) / 2.

            let width = 40;
            if (this.type === 'goblin' || this.type === 'skeleton') width = 30;
            if (this.type === 'orc') width = 35;

            const offset = (60 - width) / 2;

            this.element.style.left = `${this.x * 62 + offset}px`;
            this.element.style.top = `${this.y * 62 + offset}px`;

            // Store coordinates for click handling
            this.element.dataset.x = this.x;
            this.element.dataset.y = this.y;
        }
    }

    createDOMElement() {
        const el = document.createElement('div');
        el.classList.add('entity');
        el.classList.add(this.type);
        this.element = el;
        this.updateVisualPosition();
        return el;
    }
}

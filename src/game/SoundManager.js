class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration) {
        if (!this.enabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    playMove() {
        this.playTone(150, 'sine', 0.1);
    }

    playAttack() {
        this.playTone(100, 'square', 0.15);
    }

    playHit() {
        this.playTone(80, 'sawtooth', 0.1);
    }

    playEnemyDeath() {
        this.playTone(50, 'sawtooth', 0.2);
    }

    playLevelComplete() {
        // Arpeggio
        setTimeout(() => this.playTone(400, 'sine', 0.1), 0);
        setTimeout(() => this.playTone(500, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(600, 'sine', 0.2), 200);
    }

    playGameOver() {
        this.playTone(100, 'sawtooth', 0.5);
        setTimeout(() => this.playTone(80, 'sawtooth', 0.5), 200);
    }
}

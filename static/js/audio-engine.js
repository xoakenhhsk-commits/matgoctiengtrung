// ==========================================
// 1999 RETRO CHIPTUNE & SYNTH AUDIO ENGINE
// Uses 100% Pure Web Audio API (Zero external file dependencies)
// ==========================================

class RetroAudioEngine {
    constructor() {
        this.ctx = null;
        this.bgmOscillators = [];
        this.isPlayingBgm = false;
        this.bgmTimer = null;
        this.isMuted = false;
        this.volume = 0.3;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBgm();
        } else {
            this.playBgm();
        }
        return this.isMuted;
    }

    // Play single synthesizer note
    playNote(freq, type = 'square', duration = 0.15, gainVal = 0.2) {
        if (this.isMuted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal * this.volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    // Sound FX: Dialogue Typing Sound
    playTypewriter() {
        const freqs = [350, 420, 380, 480];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        this.playNote(f, 'sine', 0.04, 0.08);
    }

    // Sound FX: Button Click
    playClick() {
        this.playNote(520, 'square', 0.06, 0.15);
    }

    // Sound FX: Menu Select / Option Choose
    playSelect() {
        this.playNote(440, 'triangle', 0.08, 0.2);
        setTimeout(() => this.playNote(880, 'triangle', 0.12, 0.2), 60);
    }

    // Sound FX: Time Rewind / Paradox Glitch
    playTimeRewind() {
        if (this.isMuted) return;
        this.init();
        const freqs = [880, 784, 659, 587, 523, 440, 349, 261];
        freqs.forEach((f, idx) => {
            setTimeout(() => {
                this.playNote(f, 'sawtooth', 0.08, 0.25);
            }, idx * 45);
        });
    }

    // Sound FX: Attack / Cyber Strike
    playAttack() {
        if (this.isMuted) return;
        this.init();
        this.playNote(220, 'sawtooth', 0.1, 0.3);
        setTimeout(() => this.playNote(110, 'square', 0.2, 0.35), 70);
    }

    // Sound FX: Skill / Hack Y2K
    playSkill() {
        if (this.isMuted) return;
        this.init();
        [440, 554, 659, 880, 1108].forEach((f, idx) => {
            setTimeout(() => {
                this.playNote(f, 'square', 0.1, 0.2);
            }, idx * 50);
        });
    }

    // Sound FX: Enemy Damage
    playDamage() {
        this.playNote(120, 'sawtooth', 0.18, 0.3);
    }

    // Sound FX: Level Up / Victory Fanfare
    playVictory() {
        if (this.isMuted) return;
        this.init();
        const melody = [
            { f: 523.25, d: 0.12 }, // C5
            { f: 659.25, d: 0.12 }, // E5
            { f: 783.99, d: 0.12 }, // G5
            { f: 1046.50, d: 0.35 }  // C6
        ];
        let delay = 0;
        melody.forEach(m => {
            setTimeout(() => {
                this.playNote(m.f, 'triangle', m.d, 0.3);
            }, delay);
            delay += m.d * 1000 + 30;
        });
    }

    // 1999 Synthwave Cyber Chiptune Background Music Loop
    playBgm() {
        if (this.isMuted || this.isPlayingBgm) return;
        this.init();
        this.isPlayingBgm = true;

        const bassline = [
            220, 220, 261.63, 220,
            196, 196, 220, 174.61,
            220, 220, 261.63, 329.63,
            293.66, 261.63, 220, 196
        ];

        let step = 0;
        const tempo = 220; // ms per beat

        this.bgmTimer = setInterval(() => {
            if (!this.isPlayingBgm || this.isMuted) return;
            const freq = bassline[step % bassline.length];
            this.playNote(freq, 'triangle', 0.18, 0.1);

            // Subtle high hat
            if (step % 2 === 1) {
                this.playNote(1200, 'sine', 0.03, 0.03);
            }
            // Lead melody highlight every 4 steps
            if (step % 4 === 0) {
                this.playNote(freq * 2, 'sine', 0.25, 0.08);
            }

            step++;
        }, tempo);
    }

    stopBgm() {
        this.isPlayingBgm = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.retroAudio = new RetroAudioEngine();

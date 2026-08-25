// ==========================================
// MAIN 3D APP CONTROLLER (ANIMATION LOOP & INTEGRATION)
// Integrates Three.js 3D World, Player, Enemies, NPCs & 2D HUD/Story Engine
// ==========================================

class Main3DApp {
    constructor() {
        this.world = window.threeWorld;
        this.player = null;
        this.enemyManager = null;
        this.npcManager = null;
        this.isRunning = false;
    }

    init() {
        // 1. Initialize Three.js World
        this.world.init();

        // 2. Initialize Player Controller
        this.player = new window.ThreePlayerController(this.world);
        this.player.init();
        window.playerController = this.player;

        // 3. Initialize Enemy AI Manager
        this.enemyManager = new window.ThreeEnemyManager(this.world);
        this.enemyManager.init();
        window.enemyManager = this.enemyManager;

        // 4. Initialize NPC Manager
        this.npcManager = new window.ThreeNpcManager(this.world);
        this.npcManager.init();
        window.npcManager = this.npcManager;

        // 5. Start Render Animation Loop
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.world.clock.getDelta(), 0.1);

        // Update Systems
        if (this.player) this.player.update(delta);
        if (this.enemyManager && this.player) this.enemyManager.update(delta, this.player.position);
        if (this.npcManager && this.player) this.npcManager.update(delta, this.player.position);
        if (this.world) this.world.updateRain(delta);

        // Render Scene
        if (this.world.renderer && this.world.scene && this.world.camera) {
            this.world.renderer.render(this.world.scene, this.world.camera);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Three.js script to load
    const checkThree = setInterval(() => {
        if (window.THREE) {
            clearInterval(checkThree);
            window.main3DApp = new Main3DApp();
            window.main3DApp.init();
        }
    }, 50);
});

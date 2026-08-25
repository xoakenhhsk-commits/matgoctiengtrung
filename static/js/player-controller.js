// ==========================================
// 3D PLAYER CONTROLLER (THIRD PERSON RPG)
// Movement (WASD/Joystick), Jumping, Combat Projectiles, Camera Follow
// ==========================================

class ThreePlayerController {
    constructor(world) {
        this.world = world;
        this.mesh = null;
        this.weaponMesh = null;

        // Position & Physics
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 18;
        this.rotationY = 0;
        this.isGrounded = true;
        this.jumpForce = 14;
        this.gravity = 35;

        // Controls State
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            attack: false
        };

        // Projectiles & Combat
        this.projectiles = [];
        this.lastAttackTime = 0;
        this.attackCooldown = 0.28; // seconds

        // Mobile Virtual Joystick
        this.joystickVector = { x: 0, y: 0 };
    }

    init() {
        this.buildPlayerMesh();
        this.bindKeyboardEvents();
        this.bindTouchJoystick();
    }

    buildPlayerMesh() {
        const group = new THREE.Group();

        // Cyber Body Armor
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.3;
        body.castShadow = true;
        group.add(body);

        // Cyber Head with Glowing Cyan Visor
        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.3;
        head.castShadow = true;
        group.add(head);

        const visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.25);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 2.3, 0.32);
        group.add(visor);

        // Glowing Cyber Energy Blade / Blaster
        const swordGeo = new THREE.BoxGeometry(0.12, 1.6, 0.12);
        const swordMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        this.weaponMesh = new THREE.Mesh(swordGeo, swordMat);
        this.weaponMesh.position.set(0.7, 1.2, 0.4);
        this.weaponMesh.rotation.x = Math.PI / 4;
        group.add(this.weaponMesh);

        // Player Point Light Aura
        const auraLight = new THREE.PointLight(0x00f0ff, 2, 10);
        auraLight.position.set(0, 1.5, 0);
        group.add(auraLight);

        this.mesh = group;
        this.world.scene.add(this.mesh);
    }

    bindKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                case 'Space': this.keys.jump = true; e.preventDefault(); break;
                case 'KeyJ': case 'KeyF': case 'Enter': this.shootPlasmaBolt(); break;
                case 'KeyE': this.checkNpcInteraction(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
                case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
                case 'Space': this.keys.jump = false; break;
            }
        });

        // Click / Tap canvas to attack
        window.addEventListener('pointerdown', (e) => {
            if (e.target.tagName === 'CANVAS') {
                this.shootPlasmaBolt();
            }
        });
    }

    bindTouchJoystick() {
        const zone = document.getElementById('touchJoystickZone');
        const knob = document.getElementById('touchJoystickKnob');
        if (!zone || !knob) return;

        let touchId = null;
        let startPos = { x: 0, y: 0 };

        zone.addEventListener('touchstart', (e) => {
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            const rect = zone.getBoundingClientRect();
            startPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        });

        zone.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === touchId) {
                    const touch = e.changedTouches[i];
                    let dx = touch.clientX - startPos.x;
                    let dy = touch.clientY - startPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 40;

                    if (dist > maxDist) {
                        dx = (dx / dist) * maxDist;
                        dy = (dy / dist) * maxDist;
                    }

                    knob.style.transform = `translate(${dx}px, ${dy}px)`;
                    this.joystickVector = { x: dx / maxDist, y: -dy / maxDist };
                    break;
                }
            }
        });

        const resetTouch = () => {
            touchId = null;
            knob.style.transform = `translate(0px, 0px)`;
            this.joystickVector = { x: 0, y: 0 };
        };

        zone.addEventListener('touchend', resetTouch);
        zone.addEventListener('touchcancel', resetTouch);
    }

    update(delta) {
        if (!this.mesh) return;

        // 1. Calculate Movement Vector
        let moveX = 0;
        let moveZ = 0;

        if (this.keys.forward) moveZ -= 1;
        if (this.keys.backward) moveZ += 1;
        if (this.keys.left) moveX -= 1;
        if (this.keys.right) moveX += 1;

        // Add Touch Joystick
        if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
            moveX += this.joystickVector.x;
            moveZ -= this.joystickVector.y;
        }

        const moveDir = new THREE.Vector2(moveX, moveZ);
        if (moveDir.length() > 0.1) {
            moveDir.normalize();

            // Rotate Player to face direction
            const targetRotation = Math.atan2(moveDir.x, moveDir.y);
            this.rotationY = targetRotation;
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 0.2);

            // Move
            this.position.x += moveDir.x * this.speed * delta;
            this.position.z += moveDir.y * this.speed * delta;

            // Boundaries
            this.position.x = Math.max(-130, Math.min(130, this.position.x));
            this.position.z = Math.max(-130, Math.min(130, this.position.z));
        }

        // 2. Jump & Gravity Physics
        if (this.keys.jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            window.retroAudio?.playSelect();
        }

        this.velocity.y -= this.gravity * delta;
        this.position.y += this.velocity.y * delta;

        if (this.position.y <= 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        this.mesh.position.copy(this.position);

        // 3. Update Camera Follow (Third Person)
        this.updateCameraFollow();

        // 4. Update Projectiles
        this.updateProjectiles(delta);
    }

    updateCameraFollow() {
        if (!this.world.camera || !this.mesh) return;

        const targetCamPos = new THREE.Vector3(
            this.position.x,
            this.position.y + 7.5,
            this.position.z + 14
        );

        this.world.camera.position.lerp(targetCamPos, 0.12);
        this.world.camera.lookAt(
            this.position.x,
            this.position.y + 1.8,
            this.position.z - 4
        );
    }

    shootPlasmaBolt() {
        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = now;

        window.retroAudio?.playAttack();

        // 3D Glowing Bolt Mesh
        const boltGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const boltMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const bolt = new THREE.Mesh(boltGeo, boltMat);

        // Forward vector from player rotation
        const forward = new THREE.Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        ).normalize();

        bolt.position.set(
            this.position.x + forward.x * 1.2,
            this.position.y + 1.4,
            this.position.z + forward.z * 1.2
        );

        bolt.userData = {
            velocity: forward.multiplyScalar(48),
            life: 1.8,
            damage: 30 + Math.floor(Math.random() * 15)
        };

        this.world.scene.add(bolt);
        this.projectiles.push(bolt);

        // Swing Weapon Animation
        if (this.weaponMesh) {
            this.weaponMesh.rotation.x = -Math.PI / 4;
            setTimeout(() => {
                if (this.weaponMesh) this.weaponMesh.rotation.x = Math.PI / 4;
            }, 120);
        }
    }

    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.position.addScaledVector(p.userData.velocity, delta);
            p.userData.life -= delta;

            // Check hit enemies
            if (window.enemyManager) {
                const hitEnemy = window.enemyManager.checkHit(p.position, 1.6);
                if (hitEnemy) {
                    window.enemyManager.damageEnemy(hitEnemy, p.userData.damage);
                    p.userData.life = 0;
                }
            }

            if (p.userData.life <= 0) {
                this.world.scene.remove(p);
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkNpcInteraction() {
        if (window.npcManager) {
            window.npcManager.checkProximityInteraction(this.position);
        }
    }
}

window.ThreePlayerController = ThreePlayerController;

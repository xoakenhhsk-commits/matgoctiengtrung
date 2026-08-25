// ==========================================
// 3D ENEMY AI MANAGER (THREE.JS)
// Robot Sentinels, Dial-up Phantoms, Giant Y2K Boss, AI Patrol/Chase/Attack
// ==========================================

class ThreeEnemyManager {
    constructor(world) {
        this.world = world;
        this.enemies = [];
    }

    init() {
        this.spawnEnemies();
    }

    spawnEnemies() {
        // 1. Bug Sentinel Robots (Patrolling West & East Roads)
        const sentinelPositions = [
            { x: -18, z: -20, name: "Robot Lỗi Y2K (Bug Sentinel)", hp: 80, color: 0xff007f },
            { x: 18, z: 20, name: "Robot Lỗi Y2K (Bug Sentinel)", hp: 80, color: 0xff007f },
            { x: -25, z: 25, name: "Robot Lỗi Y2K (Bug Sentinel)", hp: 80, color: 0xff007f }
        ];

        sentinelPositions.forEach(p => this.createSentinel(p.x, p.z, p.name, p.hp, p.color));

        // 2. Dial-Up Phantoms (Glowing Purple Entities in Neon Street)
        const phantomPositions = [
            { x: 0, z: 45, name: "Bóng Ma Quay Số 56k", hp: 120, color: 0xa855f7 },
            { x: 45, z: 0, name: "Bóng Ma Quay Số 56k", hp: 120, color: 0xa855f7 }
        ];

        phantomPositions.forEach(p => this.createPhantom(p.x, p.z, p.name, p.hp, p.color));

        // 3. Giant Y2K Core Boss (At North Millennium Clock Tower: x=0, z=-52)
        this.createY2KBoss(0, -52);
    }

    createSentinel(x, z, name, hp, color) {
        const group = new THREE.Group();
        group.position.set(x, 1.6, z);

        // Hovering Robot Sphere
        const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Glowing Eye Sensor
        const eyeGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: color });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0, 0.6);
        group.add(eye);

        // 3D Billboard HP Bar
        const hpBar = this.create3DHPBar(color);
        hpBar.position.set(0, 1.4, 0);
        group.add(hpBar);

        this.world.scene.add(group);

        this.enemies.push({
            mesh: group,
            name: name,
            hp: hp,
            maxHp: hp,
            speed: 7,
            attackRange: 14,
            damage: 12,
            patrolOrigin: new THREE.Vector3(x, 1.6, z),
            lastAttackTime: 0,
            hpBar: hpBar,
            isBoss: false
        });
    }

    createPhantom(x, z, name, hp, color) {
        const group = new THREE.Group();
        group.position.set(x, 1.8, z);

        // Glitching Cone Phantom
        const geo = new THREE.ConeGeometry(0.8, 2.2, 8);
        const mat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        const phantomMesh = new THREE.Mesh(geo, mat);
        phantomMesh.rotation.x = Math.PI;
        group.add(phantomMesh);

        // 3D Billboard HP Bar
        const hpBar = this.create3DHPBar(color);
        hpBar.position.set(0, 1.8, 0);
        group.add(hpBar);

        this.world.scene.add(group);

        this.enemies.push({
            mesh: group,
            name: name,
            hp: hp,
            maxHp: hp,
            speed: 9,
            attackRange: 16,
            damage: 18,
            patrolOrigin: new THREE.Vector3(x, 1.8, z),
            lastAttackTime: 0,
            hpBar: hpBar,
            isBoss: false
        });
    }

    createY2KBoss(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 6, z);

        // Giant Pulsing Polyhedron Core
        const coreGeo = new THREE.IcosahedronGeometry(3.5, 1);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            wireframe: true,
            emissive: 0xff007f,
            emissiveIntensity: 0.6
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // Orbiting Rings
        const ringGeo = new THREE.TorusGeometry(5, 0.2, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 3;
        group.add(ring);

        // Boss Light
        const bLight = new THREE.PointLight(0xa855f7, 4, 30);
        group.add(bLight);

        // 3D Billboard HP Bar
        const hpBar = this.create3DHPBar(0xff007f, 4.0);
        hpBar.position.set(0, 5.0, 0);
        group.add(hpBar);

        this.world.scene.add(group);

        this.enemies.push({
            mesh: group,
            name: "TRÙM CUỐI: BÓNG MA THIÊN NIÊN KỶ (Y2K Core)",
            hp: 350,
            maxHp: 350,
            speed: 4,
            attackRange: 28,
            damage: 25,
            patrolOrigin: new THREE.Vector3(x, 6, z),
            lastAttackTime: 0,
            hpBar: hpBar,
            isBoss: true
        });
    }

    create3DHPBar(color, width = 1.6) {
        const group = new THREE.Group();
        // Background
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(width, 0.2),
            new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide })
        );
        group.add(bg);

        // Fill
        const fill = new THREE.Mesh(
            new THREE.PlaneGeometry(width, 0.2),
            new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide })
        );
        fill.position.z = 0.02;
        group.add(fill);
        group.userData = { fillMesh: fill, maxWidth: width };
        return group;
    }

    update(delta, playerPos) {
        const now = performance.now() / 1000;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.mesh) continue;

            // Rotate Billboard HP bar to face camera
            if (this.world.camera) {
                e.hpBar.quaternion.copy(this.world.camera.quaternion);
            }

            // Boss Rotation Animation
            if (e.isBoss) {
                e.mesh.rotation.y += delta * 0.8;
                e.mesh.rotation.x += delta * 0.4;
            }

            // Distance to Player
            const dist = e.mesh.position.distanceTo(playerPos);

            // AI State: Chase Player if in Range
            if (dist < 26) {
                const dir = new THREE.Vector3().subVectors(playerPos, e.mesh.position).normalize();
                e.mesh.position.x += dir.x * e.speed * delta;
                e.mesh.position.z += dir.z * e.speed * delta;
                e.mesh.lookAt(playerPos.x, e.mesh.position.y, playerPos.z);

                // Attack Player if within Attack Range
                if (dist < e.attackRange && now - e.lastAttackTime > 1.4) {
                    e.lastAttackTime = now;
                    this.enemyAttackPlayer(e);
                }
            } else {
                // Return to Patrol Origin
                const toOrigin = new THREE.Vector3().subVectors(e.patrolOrigin, e.mesh.position);
                if (toOrigin.length() > 2) {
                    toOrigin.normalize();
                    e.mesh.position.x += toOrigin.x * (e.speed * 0.5) * delta;
                    e.mesh.position.z += toOrigin.z * (e.speed * 0.5) * delta;
                }
            }
        }
    }

    enemyAttackPlayer(enemy) {
        window.retroAudio?.playDamage();

        // Player takes damage
        if (window.gameEngine) {
            window.gameEngine.player.hp = Math.max(0, window.gameEngine.player.hp - enemy.damage);
            window.gameEngine.renderPlayerHud();

            // Screen Glitch Red Flash
            const overlay = document.querySelector('.crt-vignette');
            if (overlay) {
                overlay.style.boxShadow = 'inset 0 0 100px rgba(255, 0, 0, 0.8)';
                setTimeout(() => {
                    overlay.style.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.8)';
                }, 180);
            }

            if (window.gameEngine.player.hp <= 0) {
                alert("💀 Bạn đã bị quái vật hạ gục! Cỗ máy thời gian tự động hồi sinh bạn với 50 HP.");
                window.gameEngine.player.hp = 50;
                window.gameEngine.renderPlayerHud();
            }
        }
    }

    checkHit(projectilePos, radius) {
        for (let e of this.enemies) {
            if (e.mesh.position.distanceTo(projectilePos) < radius + 1.2) {
                return e;
            }
        }
        return null;
    }

    damageEnemy(enemy, amount) {
        enemy.hp = Math.max(0, enemy.hp - amount);
        window.retroAudio?.playDamage();

        // Update 3D HP Bar
        if (enemy.hpBar && enemy.hpBar.userData.fillMesh) {
            const pct = Math.max(0, enemy.hp / enemy.maxHp);
            const w = enemy.hpBar.userData.maxWidth * pct;
            enemy.hpBar.userData.fillMesh.scale.x = pct;
        }

        // Check Enemy Defeated
        if (enemy.hp <= 0) {
            this.defeatEnemy(enemy);
        }
    }

    defeatEnemy(enemy) {
        window.retroAudio?.playVictory();
        this.world.scene.remove(enemy.mesh);
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) this.enemies.splice(idx, 1);

        // Rewards
        if (window.gameEngine) {
            const exp = enemy.isBoss ? 250 : 60;
            const gold = enemy.isBoss ? 150 : 35;
            window.gameEngine.player.exp += exp;
            window.gameEngine.player.gold = (window.gameEngine.player.gold || 0) + gold;

            if (window.gameEngine.player.exp >= window.gameEngine.player.maxExp) {
                window.gameEngine.player.level++;
                window.gameEngine.player.exp = 0;
                window.gameEngine.player.maxHp += 20;
                window.gameEngine.player.hp = window.gameEngine.player.maxHp;
                alert(`🎉 LÊN CẤP 3D! Bạn đã đạt LV.${window.gameEngine.player.level}!`);
            }

            window.gameEngine.renderPlayerHud();

            if (enemy.isBoss) {
                alert("🏆 CHIẾN THẮNG HUY HOÀNG! Bạn đã tiêu diệt TRÙM CUỐI Y2K CORE! Thế giới bước sang Thế Kỷ 2000 bình an!");
                window.gameEngine.renderStoryNode('victory_ending');
            }
        }
    }
}

window.ThreeEnemyManager = ThreeEnemyManager;

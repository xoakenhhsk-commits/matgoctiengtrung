// ==========================================
// 3D NPC MANAGER (THREE.JS)
// 3D Characters, Nametags, Proximity Detection, Interactive Dialogue Triggers
// ==========================================

class ThreeNpcManager {
    constructor(world) {
        this.world = world;
        this.npcs = [];
        this.activeNearbyNpc = null;
        this.promptDom = null;
    }

    init() {
        this.promptDom = document.getElementById('interactionPrompt');
        this.spawnNpcs();

        if (this.promptDom) {
            this.promptDom.addEventListener('click', () => {
                if (this.activeNearbyNpc) {
                    this.triggerNpcDialogue(this.activeNearbyNpc);
                }
            });
        }
    }

    spawnNpcs() {
        const npcList = [
            {
                id: "lam_tinh",
                name: "Lâm Tinh (Hacker 56k)",
                x: -22,
                z: -20,
                color: 0x10b981,
                storyNode: "ch1_cyber_cafe"
            },
            {
                id: "vy_vy",
                name: "Vy Vy (Chủ Tiệm Băng Đĩa)",
                x: -22,
                z: 22,
                color: 0xf43f5e,
                storyNode: "ch1_cassette_shop"
            },
            {
                id: "inspector_truong",
                name: "Thanh Tra Trương",
                x: 0,
                z: 18,
                color: 0xfbbf24,
                storyNode: "ch2_neon_street"
            }
        ];

        npcList.forEach(n => this.createNpc(n));
    }

    createNpc(data) {
        const group = new THREE.Group();
        group.position.set(data.x, 0, data.z);

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.45, 0.35, 1.4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.3;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.25;
        head.castShadow = true;
        group.add(head);

        // Floating Glowing Nametag Ring
        const ringGeo = new THREE.TorusGeometry(0.7, 0.05, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: data.color });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 2.8;
        group.add(ring);

        // Aura Light
        const nLight = new THREE.PointLight(data.color, 2.5, 12);
        nLight.position.set(0, 2, 0);
        group.add(nLight);

        this.world.scene.add(group);

        this.npcs.push({
            ...data,
            mesh: group,
            ring: ring
        });
    }

    update(delta, playerPos) {
        let nearby = null;

        this.npcs.forEach(npc => {
            if (!npc.mesh) return;

            // Rotate ring
            npc.ring.rotation.z += delta * 1.5;

            // Distance check
            const dist = npc.mesh.position.distanceTo(playerPos);
            if (dist < 4.8) {
                nearby = npc;
                npc.mesh.lookAt(playerPos.x, npc.mesh.position.y, playerPos.z);
            }
        });

        this.activeNearbyNpc = nearby;

        if (this.promptDom) {
            if (nearby) {
                this.promptDom.style.display = 'flex';
                this.promptDom.innerHTML = `<span>💬 NHẤN [E] HOẶC BẤM ĐỂ NÓI CHUYỆN VỚI ${nearby.name.toUpperCase()}</span>`;
            } else {
                this.promptDom.style.display = 'none';
            }
        }
    }

    checkProximityInteraction(playerPos) {
        if (this.activeNearbyNpc) {
            this.triggerNpcDialogue(this.activeNearbyNpc);
        }
    }

    triggerNpcDialogue(npc) {
        window.retroAudio?.playSelect();
        if (window.gameEngine) {
            window.gameEngine.renderStoryNode(npc.storyNode);
        }
    }
}

window.ThreeNpcManager = ThreeNpcManager;

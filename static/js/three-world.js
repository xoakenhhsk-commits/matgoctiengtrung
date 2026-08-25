// ==========================================
// 3D WORLD BUILDER: 1999 CYBER CITY (THREE.JS)
// Scene, Camera, Renderer, Buildings, Neon Lights, Clock Tower, Weather
// ==========================================

class ThreeGameWorld {
    constructor() {
        this.container = document.getElementById('canvas3dContainer');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.buildings = [];
        this.npcs = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.interactivePrompts = [];

        this.rainSystem = null;
        this.clockTower = null;
    }

    init() {
        // 1. Scene & Fog
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05070e);
        this.scene.fog = new THREE.FogExp2(0x060914, 0.015);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 15);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Lighting
        this.setupLighting();

        // 5. Build 3D City & Props
        this.buildCityGround();
        this.buildBuildings();
        this.buildMillenniumClockTower();
        this.buildStreetLights();
        this.setupDigitalRain();

        // 6. Resize Listener
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient Night Light
        const ambient = new THREE.AmbientLight(0x1a233a, 1.2);
        this.scene.add(ambient);

        // Moonlight Directional Light
        const moonLight = new THREE.DirectionalLight(0x00f0ff, 1.0);
        moonLight.position.set(30, 60, 40);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        moonLight.shadow.camera.near = 0.5;
        moonLight.shadow.camera.far = 200;
        moonLight.shadow.camera.left = -60;
        moonLight.shadow.camera.right = 60;
        moonLight.shadow.camera.top = 60;
        moonLight.shadow.camera.bottom = -60;
        this.scene.add(moonLight);

        // Purple Neon Hemisphere Light
        const hemiLight = new THREE.HemisphereLight(0xff007f, 0x05070e, 0.6);
        this.scene.add(hemiLight);
    }

    buildCityGround() {
        // Main Ground Plane with Road Grid Texture
        const groundGeo = new THREE.PlaneGeometry(300, 300, 40, 40);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x0a0f1d,
            roughness: 0.85,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid Lines for Cyber 1999 Aesthetic
        const gridHelper = new THREE.GridHelper(300, 60, 0x00f0ff, 0x1e293b);
        gridHelper.position.y = 0.05;
        this.scene.add(gridHelper);

        // Glowing Cyber Road Crossings
        const roadMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3 });
        const roadX = new THREE.Mesh(new THREE.PlaneGeometry(12, 280), roadMat);
        roadX.rotation.x = -Math.PI / 2;
        roadX.position.y = 0.08;
        this.scene.add(roadX);

        const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(280, 12), roadMat);
        roadZ.rotation.x = -Math.PI / 2;
        roadZ.position.y = 0.08;
        this.scene.add(roadZ);
    }

    buildBuildings() {
        const buildingMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 }),
            new THREE.MeshStandardMaterial({ color: 0x181828, roughness: 0.6, metalness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x09101d, roughness: 0.7, metalness: 0.5 })
        ];

        const neonColors = [0x00f0ff, 0xff007f, 0xfbbf24, 0x10b981, 0xa855f7];

        // Generate City Blocks
        const coords = [
            // West Blocks
            { x: -35, z: -35, w: 20, d: 24, h: 22, name: "QUÁN NET 56K", neon: 0x10b981 },
            { x: -35, z: 35, w: 22, d: 20, h: 28, name: "TIỆM BĂNG ĐĨA VY VY", neon: 0xff007f },
            { x: -70, z: -20, w: 26, d: 30, h: 35, name: "KHÁCH SẠN 1999", neon: 0x00f0ff },
            { x: -70, z: 30, w: 24, d: 24, h: 25, name: "TRUNG TÂM BBS", neon: 0xa855f7 },
            
            // East Blocks
            { x: 35, z: -35, w: 24, d: 22, h: 26, name: "CÔNG TY DIAL-UP", neon: 0x00f0ff },
            { x: 35, z: 35, w: 20, d: 24, h: 30, name: "TRẠM VIỄN THÔNG", neon: 0xfbbf24 },
            { x: 70, z: -20, w: 25, d: 28, h: 40, name: "THÁP CÔNG NGHỆ 2000", neon: 0xff007f },
            { x: 70, z: 30, w: 28, d: 22, h: 32, name: "PHÒNG THÍ NGHIỆM Y2K", neon: 0x10b981 }
        ];

        coords.forEach(c => {
            const mat = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
            const geo = new THREE.BoxGeometry(c.w, c.h, c.d);
            const building = new THREE.Mesh(geo, mat);
            building.position.set(c.x, c.h / 2, c.z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
            this.buildings.push(building);

            // Glowing Neon Billboard on Building Top
            const neonMat = new THREE.MeshBasicMaterial({ color: c.neon });
            const neonSign = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.8, 2.5, 0.6), neonMat);
            neonSign.position.set(c.x, c.h + 1.5, c.z + (c.d / 2) + 0.3);
            this.scene.add(neonSign);

            // Neon Point Light from sign
            const pLight = new THREE.PointLight(c.neon, 2.5, 25);
            pLight.position.set(c.x, c.h + 1, c.z + (c.d / 2) + 2);
            this.scene.add(pLight);

            // Window Glowing Strips
            const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
            for (let floor = 4; floor < c.h - 2; floor += 4) {
                const strip = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.7, 1.2, c.d + 0.2), windowMat);
                strip.position.set(c.x, floor, c.z);
                this.scene.add(strip);
            }
        });
    }

    buildMillenniumClockTower() {
        // Central Millennium Clock Tower (North Plaza: x=0, z=-65)
        const towerGroup = new THREE.Group();
        towerGroup.position.set(0, 0, -65);

        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(16, 8, 16),
            new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.4 })
        );
        base.position.y = 4;
        base.castShadow = true;
        towerGroup.add(base);

        // Tower Shaft
        const shaft = new THREE.Mesh(
            new THREE.BoxGeometry(10, 40, 10),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.5 })
        );
        shaft.position.y = 28;
        shaft.castShadow = true;
        towerGroup.add(shaft);

        // Giant Clock Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(14, 14, 14),
            new THREE.MeshStandardMaterial({ color: 0x180528, roughness: 0.2 })
        );
        head.position.y = 55;
        towerGroup.add(head);

        // Glowing Clock Dial Faces (Front & Back)
        const clockDialMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const dialGeo = new THREE.CylinderGeometry(5, 5, 0.4, 32);
        
        const dialFront = new THREE.Mesh(dialGeo, clockDialMat);
        dialFront.rotation.x = Math.PI / 2;
        dialFront.position.set(0, 55, 7.2);
        towerGroup.add(dialFront);

        // Spire Top
        const spireGeo = new THREE.ConeGeometry(4, 16, 8);
        const spire = new THREE.Mesh(spireGeo, new THREE.MeshBasicMaterial({ color: 0xff007f }));
        spire.position.y = 70;
        towerGroup.add(spire);

        // Pulsing Clock Tower Light
        const towerLight = new THREE.PointLight(0x00f0ff, 4, 60);
        towerLight.position.set(0, 55, 10);
        towerGroup.add(towerLight);

        this.scene.add(towerGroup);
        this.clockTower = towerGroup;
    }

    buildStreetLights() {
        const positions = [
            [-12, -12], [12, -12], [-12, 12], [12, 12],
            [-12, -45], [12, -45], [-12, 45], [12, 45],
            [-45, -12], [45, -12], [-45, 12], [45, 12]
        ];

        positions.forEach(([x, z]) => {
            const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 7, 8);
            const pole = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x334155 }));
            pole.position.set(x, 3.5, z);
            pole.castShadow = true;
            this.scene.add(pole);

            // Lamp Head
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
            );
            head.position.set(x, 7.2, z);
            this.scene.add(head);

            // Light
            const light = new THREE.PointLight(0xfbbf24, 1.8, 18);
            light.position.set(x, 7, z);
            this.scene.add(light);
        });
    }

    setupDigitalRain() {
        const rainCount = 1500;
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);

        for (let i = 0; i < rainCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 80;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainMat = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 0.25,
            transparent: true,
            opacity: 0.6
        });

        this.rainSystem = new THREE.Points(rainGeo, rainMat);
        this.scene.add(this.rainSystem);
    }

    updateRain(delta) {
        if (!this.rainSystem) return;
        const pos = this.rainSystem.geometry.attributes.position.array;
        for (let i = 1; i < pos.length; i += 3) {
            pos[i] -= 45 * delta;
            if (pos[i] < 0) pos[i] = 75;
        }
        this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.threeWorld = new ThreeGameWorld();

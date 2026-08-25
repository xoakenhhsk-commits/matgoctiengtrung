// ==========================================
// 1999 RETRO RPG GAME ENGINE
// State Management, Dialogue System, Turn-based Combat, Save/Load
// ==========================================

class RetroGameEngine {
    constructor() {
        this.player = {
            name: "Kẻ Ghi Nhớ",
            title: "Người Du Hành Thời Gian",
            level: 1,
            hp: 100,
            maxHp: 100,
            chrono: 100,
            maxChrono: 100,
            exp: 0,
            maxExp: 100,
            inventory: ["pager_beeper", "cyber_potion"],
            currentLocationId: "loc_cyber_cafe",
            currentStoryNodeId: "intro"
        };

        this.currentEnemy = null;
        this.isTyping = false;
        this.typewriterTimeout = null;

        this.dom = {};
    }

    init() {
        this.cacheDom();
        this.loadSavedGame();
        this.bindEvents();
        this.renderPlayerHud();
        this.renderLocation(this.player.currentLocationId);
        this.renderStoryNode(this.player.currentStoryNodeId);

        // Auto start background music upon first interaction
        const startAudio = () => {
            if (window.retroAudio) {
                window.retroAudio.init();
                window.retroAudio.playBgm();
            }
            window.removeEventListener('click', startAudio);
        };
        window.addEventListener('click', startAudio);
    }

    cacheDom() {
        this.dom = {
            btnToggleSound: document.getElementById('btnToggleSound'),
            soundIcon: document.getElementById('soundIcon'),
            btnSaveGame: document.getElementById('btnSaveGame'),
            btnResetGame: document.getElementById('btnResetGame'),
            
            // HUD
            hudPlayerName: document.getElementById('hudPlayerName'),
            hudPlayerRole: document.getElementById('hudPlayerRole'),
            hudHpText: document.getElementById('hudHpText'),
            hudHpFill: document.getElementById('hudHpFill'),
            hudChronoText: document.getElementById('hudChronoText'),
            hudChronoFill: document.getElementById('hudChronoFill'),
            hudExpText: document.getElementById('hudExpText'),
            hudExpFill: document.getElementById('hudExpFill'),
            hudInventoryList: document.getElementById('hudInventoryList'),

            // Stage Location
            locationHeroCard: document.getElementById('locationHeroCard'),
            locationName: document.getElementById('locationName'),
            locationTimestamp: document.getElementById('locationTimestamp'),
            locationDescText: document.getElementById('locationDescText'),
            mapChipsBar: document.getElementById('mapChipsBar'),

            // Dialogue
            speakerAvatarImg: document.getElementById('speakerAvatarImg'),
            speakerNameBadge: document.getElementById('speakerNameBadge'),
            speakerRoleText: document.getElementById('speakerRoleText'),
            dialogueTextBody: document.getElementById('dialogueTextBody'),
            dialogueChoicesList: document.getElementById('dialogueChoicesList'),

            // Battle Arena
            battleArenaModal: document.getElementById('battleArenaModal'),
            battleEnemyName: document.getElementById('battleEnemyName'),
            battleEnemyAvatar: document.getElementById('battleEnemyAvatar'),
            battleEnemyHpText: document.getElementById('battleEnemyHpText'),
            battleEnemyHpFill: document.getElementById('battleEnemyHpFill'),
            battlePlayerHpText: document.getElementById('battlePlayerHpText'),
            battlePlayerHpFill: document.getElementById('battlePlayerHpFill'),
            battleLogTerminal: document.getElementById('battleLogTerminal'),
            battleSkillsContainer: document.getElementById('battleSkillsContainer'),
            btnFleeBattle: document.getElementById('btnFleeBattle'),

            // NPC AI Chat
            btnOpenNpcChat: document.getElementById('btnOpenNpcChat'),
            npcChatModal: document.getElementById('npcChatModal'),
            btnCloseNpcChat: document.getElementById('btnCloseNpcChat'),
            npcChatTitle: document.getElementById('npcChatTitle'),
            npcChatLog: document.getElementById('npcChatLog'),
            npcChatInput: document.getElementById('npcChatInput'),
            btnSendNpcChat: document.getElementById('btnSendNpcChat')
        };
    }

    bindEvents() {
        // Sound toggle
        this.dom.btnToggleSound?.addEventListener('click', () => {
            const isMuted = window.retroAudio.toggleMute();
            if (this.dom.soundIcon) {
                this.dom.soundIcon.textContent = isMuted ? "🔇" : "🔊";
            }
        });

        // Save / Reset
        this.dom.btnSaveGame?.addEventListener('click', () => this.saveGame());
        this.dom.btnResetGame?.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn chơi lại từ đầu (Khởi động lại Cỗ Máy Thời Gian)?")) {
                localStorage.removeItem('retro_1999_save');
                location.reload();
            }
        });

        // NPC AI Free Chat
        this.dom.btnOpenNpcChat?.addEventListener('click', () => {
            const node = window.GAME_DATA.story[this.player.currentStoryNodeId];
            const speaker = window.GAME_DATA.npcs[node?.speaker] || window.GAME_DATA.npcs.chronicler;
            if (this.dom.npcChatTitle) this.dom.npcChatTitle.textContent = `💬 TRÒ CHUYỆN VỚI ${speaker.name.toUpperCase()} (AI)`;
            if (this.dom.npcChatModal) {
                this.dom.npcChatModal.style.display = 'flex';
                this.dom.npcChatInput?.focus();
            }
        });

        this.dom.btnCloseNpcChat?.addEventListener('click', () => {
            if (this.dom.npcChatModal) this.dom.npcChatModal.style.display = 'none';
        });

        const sendNpcMsg = async () => {
            const msg = this.dom.npcChatInput?.value.trim();
            if (!msg) return;

            const node = window.GAME_DATA.story[this.player.currentStoryNodeId];
            const speaker = window.GAME_DATA.npcs[node?.speaker] || window.GAME_DATA.npcs.lam_tinh;

            const pMsg = document.createElement('div');
            pMsg.style.color = '#fff';
            pMsg.textContent = `> Bạn: ${msg}`;
            this.dom.npcChatLog.appendChild(pMsg);
            this.dom.npcChatInput.value = '';

            const loadingEntry = document.createElement('div');
            loadingEntry.style.color = 'var(--neon-amber)';
            loadingEntry.textContent = `... ${speaker.name} đang suy nghĩ ...`;
            this.dom.npcChatLog.appendChild(loadingEntry);
            this.dom.npcChatLog.scrollTop = this.dom.npcChatLog.scrollHeight;

            window.retroAudio?.playTypewriter();

            try {
                const res = await fetch('/api/game/npc-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        npc_id: speaker.id,
                        npc_name: speaker.name,
                        npc_title: speaker.title,
                        player_message: msg
                    })
                });
                const data = await res.json();
                loadingEntry.remove();

                const replyEntry = document.createElement('div');
                replyEntry.style.color = speaker.color || 'var(--neon-pink)';
                replyEntry.textContent = `> ${speaker.name}: ${data.reply || "Tín hiệu bị nhiễu sóng năm 1999..."}`;
                this.dom.npcChatLog.appendChild(replyEntry);
                this.dom.npcChatLog.scrollTop = this.dom.npcChatLog.scrollHeight;
                window.retroAudio?.playSelect();
            } catch (e) {
                loadingEntry.textContent = `> ${speaker.name}: 'Thời gian đang trôi nhanh quá, chỉ còn vài phút nữa là sang năm 2000 rồi!'`;
            }
        };

        this.dom.btnSendNpcChat?.addEventListener('click', sendNpcMsg);
        this.dom.npcChatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendNpcMsg();
        });

        // Flee battle
        this.dom.btnFleeBattle?.addEventListener('click', () => {
            this.addBattleLog("🏃 Bạn đã sử dụng Dịch Chuyển Không Gian để rút lui an toàn!");
            setTimeout(() => {
                this.dom.battleArenaModal.style.display = 'none';
                window.retroAudio?.playSelect();
            }, 800);
        });
    }

    // ==========================================
    // HUD & INVENTORY
    // ==========================================
    renderPlayerHud() {
        if (!this.dom.hudHpText) return;

        this.dom.hudPlayerName.textContent = this.player.name;
        this.dom.hudPlayerRole.textContent = `LV.${this.player.level} • ${this.player.title}`;

        // HP
        this.dom.hudHpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        const hpPercent = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
        this.dom.hudHpFill.style.width = `${hpPercent}%`;

        // Chrono Energy
        this.dom.hudChronoText.textContent = `${this.player.chrono}/${this.player.maxChrono}`;
        const chronoPercent = Math.max(0, Math.min(100, (this.player.chrono / this.player.maxChrono) * 100));
        this.dom.hudChronoFill.style.width = `${chronoPercent}%`;

        // EXP
        this.dom.hudExpText.textContent = `${this.player.exp}/${this.player.maxExp}`;
        const expPercent = Math.max(0, Math.min(100, (this.player.exp / this.player.maxExp) * 100));
        this.dom.hudExpFill.style.width = `${expPercent}%`;

        // Inventory list
        this.renderInventory();
    }

    renderInventory() {
        if (!this.dom.hudInventoryList) return;
        this.dom.hudInventoryList.innerHTML = '';

        if (this.player.inventory.length === 0) {
            this.dom.hudInventoryList.innerHTML = '<div style="color:#64748b; font-size:0.8rem; font-style:italic;">Túi đồ trống</div>';
            return;
        }

        this.player.inventory.forEach((itemId, idx) => {
            const item = window.GAME_DATA.items.find(i => i.id === itemId);
            if (!item) return;

            const chip = document.createElement('div');
            chip.className = 'item-chip';
            chip.innerHTML = `
                <span>📦 ${item.name}</span>
                <span style="color:var(--border-neon); font-size:0.75rem;">${item.type === 'consumable' ? 'Dùng' : 'Vật phẩm'}</span>
            `;
            chip.addEventListener('click', () => this.useItem(itemId, idx));
            this.dom.hudInventoryList.appendChild(chip);
        });
    }

    useItem(itemId, idx) {
        const item = window.GAME_DATA.items.find(i => i.id === itemId);
        if (!item) return;

        if (item.type === 'consumable') {
            window.retroAudio?.playSelect();
            if (item.healHp) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.healHp);
            }
            if (item.healChrono) {
                this.player.chrono = Math.min(this.player.maxChrono, this.player.chrono + item.healChrono);
            }
            this.player.inventory.splice(idx, 1);
            this.renderPlayerHud();
            alert(`✨ Đã sử dụng ${item.name}!\nHồi phục ${item.healHp || 0} HP và ${item.healChrono || 0} Chrono Energy.`);
        } else {
            alert(`📋 [${item.name}]:\n${item.desc}`);
        }
    }

    // ==========================================
    // LOCATION & MAP EXPLORATION
    // ==========================================
    renderLocation(locationId) {
        const loc = window.GAME_DATA.locations.find(l => l.id === locationId);
        if (!loc) return;

        this.player.currentLocationId = locationId;
        this.dom.locationName.textContent = loc.name;
        this.dom.locationTimestamp.textContent = loc.year;
        this.dom.locationDescText.textContent = loc.desc;
        this.dom.locationHeroCard.style.background = loc.bgGradient;

        // Render Map Chips
        this.dom.mapChipsBar.innerHTML = '';
        window.GAME_DATA.locations.forEach(l => {
            const btn = document.createElement('button');
            btn.className = `map-chip-btn ${l.id === locationId ? 'active' : ''}`;
            btn.innerHTML = `<span>📍</span> <span>${l.name}</span>`;
            btn.addEventListener('click', () => {
                window.retroAudio?.playSelect();
                this.renderLocation(l.id);
            });
            this.dom.mapChipsBar.appendChild(btn);
        });
    }

    // ==========================================
    // STORYLINE & DIALOGUE SYSTEM (TYPEWRITER)
    // ==========================================
    renderStoryNode(nodeId) {
        const node = window.GAME_DATA.story[nodeId];
        if (!node) return;

        this.player.currentStoryNodeId = nodeId;
        const speaker = window.GAME_DATA.npcs[node.speaker] || window.GAME_DATA.npcs.chronicler;

        // Speaker Info
        this.dom.speakerAvatarImg.src = speaker.avatar;
        this.dom.speakerNameBadge.textContent = speaker.name;
        this.dom.speakerNameBadge.style.color = speaker.color || "var(--neon-pink)";
        this.dom.speakerRoleText.textContent = speaker.title;

        // Typewriter Effect
        this.typewriterText(node.text, () => {
            this.renderChoices(node.choices || []);
        });
    }

    typewriterText(text, onComplete) {
        if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);
        this.dom.dialogueTextBody.textContent = '';
        this.dom.dialogueChoicesList.innerHTML = '';
        this.isTyping = true;

        let charIndex = 0;
        const speed = 18; // ms per char

        const typeChar = () => {
            if (charIndex < text.length) {
                this.dom.dialogueTextBody.textContent += text.charAt(charIndex);
                if (charIndex % 3 === 0) {
                    window.retroAudio?.playTypewriter();
                }
                charIndex++;
                this.typewriterTimeout = setTimeout(typeChar, speed);
            } else {
                this.isTyping = false;
                if (onComplete) onComplete();
            }
        };

        typeChar();
    }

    renderChoices(choices) {
        this.dom.dialogueChoicesList.innerHTML = '';
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-action-btn';
            btn.innerHTML = `<span>▶</span> <span>${choice.text}</span>`;
            btn.addEventListener('click', () => {
                window.retroAudio?.playSelect();
                this.handleChoiceAction(choice);
            });
            this.dom.dialogueChoicesList.appendChild(btn);
        });
    }

    handleChoiceAction(choice) {
        if (choice.action === 'gain_item' && choice.item) {
            if (!this.player.inventory.includes(choice.item)) {
                this.player.inventory.push(choice.item);
                this.renderPlayerHud();
            }
        } else if (choice.action === 'gain_items_vyvy') {
            ['walkman_tape', 'cyber_potion'].forEach(it => {
                if (!this.player.inventory.includes(it)) this.player.inventory.push(it);
            });
            this.renderPlayerHud();
        } else if (choice.action === 'restart_game') {
            this.player.level++;
            this.player.hp = this.player.maxHp;
            this.player.chrono = this.player.maxChrono;
            this.renderPlayerHud();
        }

        // Trigger Battle or Next Story Node
        if (choice.next === 'battle_corrupted_bot') {
            this.startBattle('corrupted_bot', 'ch1_cyber_cafe');
        } else if (choice.next === 'battle_boss_y2k') {
            this.startBattle('boss_y2k', 'victory_ending');
        } else {
            this.renderStoryNode(choice.next);
        }
    }

    // ==========================================
    // TURN-BASED TACTICAL COMBAT ENGINE
    // ==========================================
    startBattle(enemyId, postBattleNodeId) {
        const enemyData = window.GAME_DATA.enemies[enemyId];
        if (!enemyData) return;

        this.currentEnemy = {
            ...enemyData,
            hp: enemyData.maxHp,
            postBattleNodeId: postBattleNodeId
        };

        window.retroAudio?.playTimeRewind();

        this.dom.battleEnemyName.textContent = this.currentEnemy.name;
        this.dom.battleEnemyAvatar.src = this.currentEnemy.avatar;
        this.dom.battleLogTerminal.innerHTML = `<div>[TRẬN ĐẤU BẮT ĐẦU] Đối đầu với ${this.currentEnemy.name}!</div>`;

        this.updateBattleStatusUI();
        this.renderBattleSkills();

        this.dom.battleArenaModal.style.display = 'flex';
    }

    updateBattleStatusUI() {
        if (!this.currentEnemy) return;

        // Enemy HP
        this.dom.battleEnemyHpText.textContent = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
        const enemyHpPct = Math.max(0, (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100);
        this.dom.battleEnemyHpFill.style.width = `${enemyHpPct}%`;

        // Player HP
        this.dom.battlePlayerHpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        const playerHpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        this.dom.battlePlayerHpFill.style.width = `${playerHpPct}%`;
    }

    renderBattleSkills() {
        this.dom.battleSkillsContainer.innerHTML = '';
        window.GAME_DATA.skills.forEach(skill => {
            const btn = document.createElement('button');
            btn.className = `battle-skill-btn ${skill.id === 'time_rewind' ? 'time-skill' : ''}`;
            btn.innerHTML = `
                <div style="font-size:1rem;">⚡ ${skill.name}</div>
                <div style="font-size:0.75rem; opacity:0.8;">Tiêu hao: ${skill.costChrono} Chrono</div>
            `;
            btn.addEventListener('click', () => this.executePlayerTurn(skill));
            this.dom.battleSkillsContainer.appendChild(btn);
        });
    }

    executePlayerTurn(skill) {
        if (this.player.chrono < skill.costChrono) {
            alert("⚠️ Không đủ Năng Lượng Thời Gian (Chrono Energy)!");
            return;
        }

        this.player.chrono -= skill.costChrono;
        this.renderPlayerHud();

        if (skill.id === 'time_rewind') {
            window.retroAudio?.playTimeRewind();
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + skill.heal);
            this.addBattleLog(`⏳ Bạn kích hoạt [Tua Ngược Thời Gian]! Hồi phục ${skill.heal} HP!`);
        } else {
            window.retroAudio?.playAttack();
            const damage = skill.power + Math.floor(Math.random() * 8);
            this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
            this.addBattleLog(`⚔️ Bạn tung chiêu [${skill.name}] gây ${damage} sát thương lên ${this.currentEnemy.name}!`);
        }

        this.updateBattleStatusUI();

        // Check Enemy Defeated
        if (this.currentEnemy.hp <= 0) {
            setTimeout(() => this.handleBattleVictory(), 600);
            return;
        }

        // Enemy Counter Attack
        setTimeout(() => this.executeEnemyTurn(), 800);
    }

    executeEnemyTurn() {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;

        window.retroAudio?.playDamage();
        const enemyDmg = this.currentEnemy.attackPower + Math.floor(Math.random() * 6);
        this.player.hp = Math.max(0, this.player.hp - enemyDmg);
        this.addBattleLog(`💥 ${this.currentEnemy.name} phản kích gây ${enemyDmg} sát thương lên bạn!`);

        this.updateBattleStatusUI();
        this.renderPlayerHud();

        // Check Player Defeated
        if (this.player.hp <= 0) {
            setTimeout(() => {
                alert("💀 Bạn đã bị hạ gục trong Cơn Bão Y2K! Hệ thống sẽ tự động hồi sinh bạn với 50 HP.");
                this.player.hp = 50;
                this.dom.battleArenaModal.style.display = 'none';
                this.renderPlayerHud();
            }, 600);
        }
    }

    handleBattleVictory() {
        window.retroAudio?.playVictory();
        this.addBattleLog(`🏆 CHIẾN THẮNG! ${this.currentEnemy.name} đã bị đánh bại!`);
        this.addBattleLog(`⭐ Nhận được +${this.currentEnemy.expReward} EXP!`);

        this.player.exp += this.currentEnemy.expReward;
        if (this.player.exp >= this.player.maxExp) {
            this.player.level++;
            this.player.exp = 0;
            this.player.maxHp += 20;
            this.player.hp = this.player.maxHp;
            alert(`🎉 CHÚC MỪNG! Bạn đã tăng lên LV.${this.player.level}! Mở khóa thêm sức mạnh thời gian!`);
        }

        this.renderPlayerHud();
        const nextNode = this.currentEnemy.postBattleNodeId;

        setTimeout(() => {
            this.dom.battleArenaModal.style.display = 'none';
            this.renderStoryNode(nextNode);
        }, 1500);
    }

    addBattleLog(msg) {
        if (!this.dom.battleLogTerminal) return;
        const entry = document.createElement('div');
        entry.textContent = `> ${msg}`;
        this.dom.battleLogTerminal.appendChild(entry);
        this.dom.battleLogTerminal.scrollTop = this.dom.battleLogTerminal.scrollHeight;
    }

    // ==========================================
    // SAVE / LOAD GAME
    // ==========================================
    saveGame() {
        window.retroAudio?.playSelect();
        localStorage.setItem('retro_1999_save', JSON.stringify(this.player));
        alert("💾 TIẾN TRÌNH ĐÃ ĐƯỢC LƯU VÀO ĐĨA TỪ NĂM 1999 THÀNH CÔNG!");
    }

    loadSavedGame() {
        const saved = localStorage.getItem('retro_1999_save');
        if (saved) {
            try {
                this.player = { ...this.player, ...JSON.parse(saved) };
            } catch (e) {}
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new RetroGameEngine();
    window.gameEngine.init();
});

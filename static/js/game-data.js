// ==========================================
// GAME DATA: REVERSE 1999 - THE Y2K PARADOX (EXPANDED A-Z EDITION)
// Full 5 Chapters, NPCs, Quests, Skills, Items, Shop, Enemies, Endings
// ==========================================

window.GAME_DATA = {
    title: "TRỞ VỀ NĂM 1999: DỊ TƯỢNG Y2K",
    version: "2.5.0 Masterpiece A-Z Edition",

    // NPC DATABASE
    npcs: {
        chronicler: {
            id: "chronicler",
            name: "Kẻ Ghi Nhớ",
            title: "Người Du Hành Thời Gian",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chronicler_1999_hero",
            color: "#00f0ff"
        },
        lam_tinh: {
            id: "lam_tinh",
            name: "Lâm Tinh (ZeroCool)",
            title: "Hacker Quán Net Quay Số 56k",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=lam_tinh_hacker_99",
            color: "#10b981",
            bio: "Chuyên gia bẻ khóa mạng BBS và máy chủ dial-up thập niên 90."
        },
        vy_vy: {
            id: "vy_vy",
            name: "Vy Vy",
            title: "Chủ Tiệm Băng Đĩa Cassette",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=vy_vy_cassette_99",
            color: "#f43f5e",
            bio: "Cô gái bí ẩn sở hữu những cuộn băng chứa tần số kích hoạt cổng không gian."
        },
        inspector_truong: {
            id: "inspector_truong",
            name: "Thanh Tra Trương",
            title: "Đặc Vụ Quản Lý Dòng Thời Gian",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=truong_detective_99",
            color: "#fbbf24",
            bio: "Truy lùng những kẻ làm biến dạng dòng thời gian năm 1999."
        },
        y2k_bug: {
            id: "y2k_bug",
            name: "BÓNG MA THIÊN NIÊN KỶ (Y2K Core)",
            title: "Thực Thể Dữ Liệu Hỗn Loạn",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=y2k_core_anomaly_boss",
            color: "#a855f7",
            bio: "Sinh vật sinh ra từ sự sụp đổ số liệu đồng hồ năm 2000."
        }
    },

    // MAP LOCATIONS (5 FULL DISTRICTS)
    locations: [
        {
            id: "loc_cyber_cafe",
            name: "Quán Net Quay Số 'Thiên Niên Kỷ'",
            year: "31/12/1999 - 21:00",
            icon: "monitor",
            desc: "Tiếng modem 56k rít tít tít quen thuộc. Màn hình CRT phát ra ánh sáng xanh le lói giữa khói thuốc và những đĩa mềm 1.44MB.",
            bgGradient: "linear-gradient(135deg, #091a28, #050d1a)"
        },
        {
            id: "loc_cassette_shop",
            name: "Tiệm Băng Đĩa 'Âm Thanh Vọng Lại'",
            year: "31/12/1999 - 22:15",
            icon: "disc",
            desc: "Những kệ băng cassette đầy ắp nhạc Hoa lời Việt và đĩa CD lấp lánh. Máy nghe nhạc Sony Walkman đang phát một điệu Synthwave bí ẩn.",
            bgGradient: "linear-gradient(135deg, #240a1e, #0d0410)"
        },
        {
            id: "loc_neon_street",
            name: "Phố Đêm Giao Thừa Rực Rỡ",
            year: "31/12/1999 - 23:00",
            icon: "map-pin",
            desc: "Biển hiệu neon lấp lánh phản chiếu dưới cơn mưa phùn. Đám đông đang hồi hộp đếm ngược chào đón năm 2000 mà không hề hay biết dị tượng sắp ập đến.",
            bgGradient: "linear-gradient(135deg, #1c0a2b, #090312)"
        },
        {
            id: "loc_clock_tower",
            name: "Tháp Đồng Hồ Thiên Niên Kỷ",
            year: "31/12/1999 - 23:45",
            icon: "clock",
            desc: "Đồng hồ khổng lồ đang đếm ngược những phút cuối cùng của thế kỷ 20. Không gian xung quanh bắt đầu vặn xoắn và nứt toác.",
            bgGradient: "linear-gradient(135deg, #1f1303, #0a0601)"
        },
        {
            id: "loc_quantum_lab",
            name: "Phòng Thí Nghiệm Nghịch Lý Y2K",
            year: "31/12/1999 - 23:59",
            icon: "cpu",
            desc: "Trái tim của cơn bão thời gian. Nơi thời khắc 00:00:00 ngày 1/1/2000 sẽ quyết định thế giới tiếp tục hay vĩnh viễn kẹt lại năm 1999.",
            bgGradient: "linear-gradient(135deg, #180528, #06010d)"
        }
    ],

    // RETRO SHOP INVENTORY
    shopItems: [
        {
            id: "cyber_potion",
            name: "Nước Ngọt Lon Xanh 1999",
            price: 20,
            icon: "coffee",
            desc: "Thức uống có ga giải khát, hồi phục ngay 40 HP.",
            healHp: 40
        },
        {
            id: "walkman_tape",
            name: "Băng Cassette 'Khúc Ca Thời Gian'",
            price: 45,
            icon: "disc",
            desc: "Phát điệu nhạc Synthwave, hồi 60 HP và 40 Chrono Energy.",
            healHp: 60,
            healChrono: 40
        },
        {
            id: "floppy_disk",
            name: "Đĩa Mềm Floppy Disk 1.44MB",
            price: 50,
            icon: "save",
            desc: "Chứa mã nguồn bẻ khóa tường lửa Y2K do Lâm Tinh lập trình."
        },
        {
            id: "chrono_battery",
            name: "Pin Con Thỏ Siêu Cấp 1999",
            price: 35,
            icon: "battery-charging",
            desc: "Nạp năng lượng tối đa cho Cỗ Máy Thời Gian (+60 Chrono).",
            healChrono: 60
        }
    ],

    // ALL ITEMS DATABASE
    items: [
        {
            id: "pager_beeper",
            name: "Máy Nhắn Tin Beeper Motorola",
            type: "key",
            icon: "smartphone",
            desc: "Nhận các tín hiệu cầu cứu bí ẩn từ tương lai với mã số 1999-2000."
        },
        {
            id: "floppy_disk",
            name: "Đĩa Mềm Floppy Disk 1.44MB",
            type: "quest",
            icon: "save",
            desc: "Chứa mã nguồn bẻ khóa tường lửa Y2K do Lâm Tinh lập trình."
        },
        {
            id: "walkman_tape",
            name: "Băng Cassette 'Khúc Ca Thời Gian'",
            type: "consumable",
            icon: "disc",
            desc: "Khi phát trên Walkman, hồi phục 60 HP và tăng 40 Năng lượng Thời gian.",
            healHp: 60,
            healChrono: 40
        },
        {
            id: "cyber_potion",
            name: "Nước Ngọt Lon Xanh 1999",
            type: "consumable",
            icon: "coffee",
            desc: "Thức uống giải khát tăng ngay 40 HP.",
            healHp: 40
        },
        {
            id: "chrono_battery",
            name: "Pin Con Thỏ Siêu Cấp 1999",
            type: "consumable",
            icon: "battery-charging",
            desc: "Nạp đầy ngay 60 Năng lượng Thời gian (Chrono Energy).",
            healChrono: 60
        },
        {
            id: "master_y2k_key",
            name: "Chìa Khóa Lõi Thời Gian 2000",
            type: "key",
            icon: "key",
            desc: "Chìa khóa mở cổng Cỗ Máy Thời Gian để phá vỡ vòng lặp vĩnh cửu."
        }
    ],

    // PLAYER SKILLS (TURN-BASED)
    skills: [
        {
            id: "strike",
            name: "Đòn Đột Phá Dữ Liệu",
            costChrono: 0,
            power: 28,
            icon: "zap",
            desc: "Tấn công vật lý cơ bản gây 28-35 sát thương và hồi phục +12 Chrono."
        },
        {
            id: "y2k_hack",
            name: "Bẻ Khóa Lỗi Y2K (Virus Dial-up)",
            costChrono: 25,
            power: 60,
            icon: "terminal",
            desc: "Truyền mã độc số hóa gây 60-75 sát thương chí mạng."
        },
        {
            id: "time_rewind",
            name: "Tua Ngược Dòng Thời Gian",
            costChrono: 40,
            power: 0,
            heal: 55,
            icon: "rotate-ccw",
            desc: "Đảo ngược dòng thời gian về 5 giây trước, hồi 55 HP và giải trừ trạng thái xấu."
        },
        {
            id: "chrono_burst",
            name: "Bão Thiên Niên Kỷ 2000 (Tuyệt Chiêu)",
            costChrono: 60,
            power: 110,
            icon: "sparkles",
            desc: "Giải phóng toàn bộ năng lượng thời gian, gây 110-130 sát thương sấm sét!"
        }
    ],

    // FULL EXPANDED STORYLINE (CHAPTER 1 -> 5)
    story: {
        intro: {
            id: "intro",
            speaker: "chronicler",
            text: "Cảnh báo Nghịch Lý Thời Gian! Bạn vừa tỉnh dậy trên chiếc ghế da cũ kỹ. Tiếng quạt thông gió quay rè rè cùng giai điệu nhạc Pop thập niên 90 vang lên bên tai. Trên tờ lịch xé treo tường ghi rõ: 'Ngày 31 tháng 12 năm 1999'. Chỉ còn vài giờ nữa là đến khoảnh khắc chuyển giao Thiên Niên Kỷ...",
            choices: [
                {
                    text: "🔍 Nhìn xung quanh và kiểm tra máy tính trước mặt",
                    next: "ch1_start",
                    action: "gain_item",
                    item: "pager_beeper"
                },
                {
                    text: "📞 Nhấc ống nghe điện thoại bàn đang nhấp nháy đèn đỏ",
                    next: "ch1_phone_call"
                }
            ]
        },

        ch1_phone_call: {
            id: "ch1_phone_call",
            speaker: "inspector_truong",
            text: "'Alo? Kẻ Ghi Nhớ, cuối cùng cậu cũng tỉnh! Cơn bão Y2K đang phá hủy cấu trúc không-thời gian ở Tháp Đồng Hồ. Hãy tìm Lâm Tinh ở Quán Net và Vy Vy ở Tiệm Băng Đĩa ngay lập tức!'",
            choices: [
                {
                    text: "🏃 Đi ngay đến Quán Net Quay Số tìm Lâm Tinh",
                    next: "ch1_cyber_cafe"
                },
                {
                    text: "🎵 Đi đến Tiệm Băng Đĩa tìm Vy Vy",
                    next: "ch1_cassette_shop"
                }
            ]
        },

        ch1_start: {
            id: "ch1_start",
            speaker: "chronicler",
            text: "Trên màn hình máy tính đang chạy dòng mã lệnh màu xanh lá: 'Y2K PARADOX DETECTED - COUNTDOWN TO EXTINCTION'. Chiếc máy nhắn tin Pager trong túi rung lên nhận được tọa độ đầu tiên.",
            choices: [
                {
                    text: "🖥️ Đi tới Quán Net tìm Hacker Lâm Tinh",
                    next: "ch1_cyber_cafe"
                },
                {
                    text: "📼 Đi tới Tiệm Băng Đĩa tìm Vy Vy",
                    next: "ch1_cassette_shop"
                }
            ]
        },

        ch1_cyber_cafe: {
            id: "ch1_cyber_cafe",
            speaker: "lam_tinh",
            text: "'Này người anh em! Cậu cũng cảm nhận được dữ liệu thời gian đang bị xáo trộn đúng không? Tôi vừa phát hiện một lỗ hổng trong máy chủ trung tâm. Cầm lấy chiếc Đĩa Mềm 1.44MB này, chúng ta cần nạp mã giải cứu vào Tháp Đồng Hồ!'",
            choices: [
                {
                    text: "💾 Nhận Đĩa Mềm 1.44MB và sẵn sàng bẻ khóa mạng",
                    next: "battle_corrupted_bot",
                    action: "gain_item",
                    item: "floppy_disk"
                },
                {
                    text: "💻 Thử chơi Mini-game Hacking 1999 trên máy tính",
                    next: "minigame_hacking"
                }
            ]
        },

        minigame_hacking: {
            id: "minigame_hacking",
            speaker: "lam_tinh",
            text: "'Muốn bẻ khóa máy chủ 1999 à? Để tôi bật giao diện Terminal DOS cho cậu. Hãy nhập mã giải mã [1999-Y2K-2000] để nhận 50 Tiền Xu và Pin Thời Gian!'",
            choices: [
                {
                    text: "⚡ Mở Terminal Bẻ Khóa DOS",
                    next: "open_dos_terminal"
                },
                {
                    text: "⚔️ Chuẩn bị vũ khí chiến đấu với Robot Tuần Tra",
                    next: "battle_corrupted_bot"
                }
            ]
        },

        ch1_cassette_shop: {
            id: "ch1_cassette_shop",
            speaker: "vy_vy",
            text: "'Chào mừng đến với năm 1999. Tôi biết cậu sẽ đến. Cuộn băng Cassette này chứa tần số âm thanh có thể làm suy yếu lá chắn của Bóng Ma Thiên Niên Kỷ. Cầm lấy cả Lon Nước Ngọt này nữa nhé!'",
            choices: [
                {
                    text: "🎁 Nhận Băng Cassette & Nước Ngọt 1999",
                    next: "ch2_neon_street",
                    action: "gain_items_vyvy"
                },
                {
                    text: "💬 Hỏi Vy Vy về bí mật vòng lặp thời gian",
                    next: "ch1_vy_lore"
                }
            ]
        },

        ch1_vy_lore: {
            id: "ch1_vy_lore",
            speaker: "vy_vy",
            text: "'Bởi vì tôi đã trải qua đêm 31/12/1999 này hàng ngàn lần rồi... Cứ mỗi khi đồng hồ điểm 00:00, mọi thứ lại bị reset quay về vạch xuất phát. Chỉ có cậu mới phá vỡ được vòng lặp định mệnh này!'",
            choices: [
                {
                    text: "🔥 Tiến ra Phố Đêm Giao Thừa gặp Thanh Tra Trương",
                    next: "ch2_neon_street"
                }
            ]
        },

        ch2_neon_street: {
            id: "ch2_neon_street",
            speaker: "inspector_truong",
            text: "'Kẻ Ghi Nhớ! Tốt lắm, cậu đã có đủ Đĩa Mềm và Băng Cassette! Nhưng quái vật Bóng Ma Quay Số Dial-Up đang chắn đường lên Tháp Đồng Hồ. Hãy cùng tôi quét sạch chúng!'",
            choices: [
                {
                    text: "⚔️ Tấn công Bóng Ma Quay Số Dial-Up!",
                    next: "battle_dialup_phantom"
                },
                {
                    text: "🛍️ Mở Tiệm Tạp Hóa 1999 mua thêm trang bị hồi máu",
                    next: "open_shop_ui"
                }
            ]
        },

        ch3_tower_entrance: {
            id: "ch3_tower_entrance",
            speaker: "chronicler",
            text: "Các mốc thời gian đang sụp đổ dữ dội. Đồng hồ lớn đã điểm 23:45. Bầu trời đêm rực sáng những vệt sấm chớp kỹ thuật số màu tím neon. Cánh cổng Tháp Đồng Hồ Thiên Niên Kỷ đã mở ra trước mắt bạn và các đồng đội!",
            choices: [
                {
                    text: "⚡ Tiến vào Phòng Thí Nghiệm Nghịch Lý đối đầu Trùm Cuối Y2K!",
                    next: "battle_boss_y2k"
                },
                {
                    text: "💬 Hỏi ý kiến chiến thuật từ Lâm Tinh và Vy Vy",
                    next: "ch3_team_briefing"
                }
            ]
        },

        ch3_team_briefing: {
            id: "ch3_team_briefing",
            speaker: "lam_tinh",
            text: "'Nghe này: Hãy dùng kỹ năng [Bẻ Khóa Lỗi Y2K] khi Trùm bật lá chắn, và dùng [Tua Ngược Thời Gian] khi máu cậu xuống thấp. Đòn [Bão Thiên Niên Kỷ 2000] sẽ kết liễu nó hoàn toàn!'",
            choices: [
                {
                    text: "🚀 Xông vào Phòng Thí Nghiệm - Quyết Chiến!",
                    next: "battle_boss_y2k"
                }
            ]
        },

        victory_ending: {
            id: "victory_ending",
            speaker: "chronicler",
            text: "🎉 CHIẾN THẮNG HUY HOÀNG (TRUE ENDING)! Khi dòng mã giải mã cuối cùng được nạp vào lõi thời gian, tiếng chuông đồng hồ vang lên rộn rã: '00:00:00 - 01/01/2000'. Bầu trời bừng sáng pháo hoa rực rỡ. Thế giới bước sang Thế Kỷ 21 bình an. Bạn đã trở thành Huyền Thoại Người Du Hành Thời Gian 1999!",
            choices: [
                {
                    text: "🔄 Khởi động lại vòng lặp cấp độ cao hơn (New Game+)",
                    next: "intro",
                    action: "restart_game"
                }
            ]
        }
    },

    // ENEMIES DATABASE
    enemies: {
        corrupted_bot: {
            id: "corrupted_bot",
            name: "Robot Tuần Tra Lỗi Y2K (Bug Sentinel)",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sentinel_bug_99",
            maxHp: 85,
            attackPower: 15,
            expReward: 60,
            goldReward: 35,
            desc: "Cỗ máy canh gác bị virus thời gian xâm nhập, phóng ra các tia sét số hóa."
        },
        dialup_phantom: {
            id: "dialup_phantom",
            name: "Bóng Ma Quay Số Dial-Up 56k",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dialup_phantom_99",
            maxHp: 120,
            attackPower: 20,
            expReward: 100,
            goldReward: 60,
            desc: "Thực thể âm thanh sinh ra từ tiếng rít modem, có khả năng làm nhiễu sóng não."
        },
        boss_y2k: {
            id: "boss_y2k",
            name: "BÓNG MA THIÊN NIÊN KỶ (Y2K Core Paradox)",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=y2k_core_anomaly_boss",
            maxHp: 200,
            attackPower: 26,
            expReward: 250,
            goldReward: 150,
            desc: "Trùm Cuối: Thực thể kiểm soát dòng thời gian muốn đóng băng nhân loại ở năm 1999."
        }
    }
};

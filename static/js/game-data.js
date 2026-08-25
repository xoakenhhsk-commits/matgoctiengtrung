// ==========================================
// GAME DATA: REVERSE 1999 - THE Y2K PARADOX
// Storyline, NPCs, Quests, Skills, Items, Maps
// ==========================================

window.GAME_DATA = {
    title: "TRỞ VỀ NĂM 1999: DỊ TƯỢNG Y2K",
    version: "1.0.0 Cyber-Edition",

    // NPC DATABASE
    npcs: {
        chronicler: {
            id: "chronicler",
            name: "Kẻ Ghi Nhớ",
            title: "Người Du Hành Thời Gian",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chronicler_1999",
            color: "#00f0ff"
        },
        lam_tinh: {
            id: "lam_tinh",
            name: "Lâm Tinh (ZeroCool)",
            title: "Hacker Quán Net Quay Số 56k",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=lam_tinh_hacker",
            color: "#10b981",
            bio: "Chuyên gia bẻ khóa mạng BBS và máy chủ dial-up thập niên 90."
        },
        vy_vy: {
            id: "vy_vy",
            name: "Vy Vy",
            title: "Chủ Tiệm Băng Đĩa Cassette",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=vy_vy_cassette",
            color: "#f43f5e",
            bio: "Cô gái bí ẩn sở hữu những cuộn băng chứa tần số kích hoạt cổng không gian."
        },
        inspector_truong: {
            id: "inspector_truong",
            name: "Thanh Tra Trương",
            title: "Đặc Vụ Dòng Thời Gian",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=truong_detective",
            color: "#fbbf24",
            bio: "Truy lùng những kẻ làm biến dạng dòng thời gian năm 1999."
        },
        y2k_bug: {
            id: "y2k_bug",
            name: "Bóng Ma Thiên Niên Kỷ (Y2K Bug)",
            title: "Thực Thể Dữ Liệu Hỗn Loạn",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=y2k_core_anomaly",
            color: "#a855f7",
            bio: "Sinh vật sinh ra từ sự sụp đổ số liệu đồng hồ năm 2000."
        }
    },

    // MAP LOCATIONS
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

    // ITEMS DATABASE
    items: [
        {
            id: "floppy_disk",
            name: "Đĩa Mềm Floppy Disk 1.44MB",
            type: "quest",
            icon: "save",
            desc: "Chứa mã nguồn bẻ khóa tường lửa Y2K do Lâm Tinh lập trình.",
            value: 50
        },
        {
            id: "walkman_tape",
            name: "Băng Cassette 'Khúc Ca Thời Gian'",
            type: "consumable",
            icon: "disc",
            desc: "Khi phát trên Walkman, hồi phục 60 HP và tăng 30 Năng lượng Thời gian.",
            healHp: 60,
            healChrono: 30,
            value: 40
        },
        {
            id: "pager_beeper",
            name: "Máy Nhắn Tin Beeper Motorola",
            type: "key",
            icon: "smartphone",
            desc: "Nhận các tín hiệu cầu cứu bí ẩn từ tương lai với mã số 1999-2000.",
            value: 80
        },
        {
            id: "cyber_potion",
            name: "Nước Ngọt Lon Xanh 1999",
            type: "consumable",
            icon: "coffee",
            desc: "Thức uống giải khát tăng ngay 40 HP.",
            healHp: 40,
            value: 20
        }
    ],

    // SKILLS
    skills: [
        {
            id: "strike",
            name: "Đòn Đột Phá Dữ Liệu",
            costChrono: 0,
            power: 25,
            icon: "zap",
            desc: "Tấn công cơ bản gây 25 sát thương vật lý và nạp 10 Chrono."
        },
        {
            id: "y2k_hack",
            name: "Bẻ Khóa Lỗi Y2K",
            costChrono: 25,
            power: 55,
            icon: "terminal",
            desc: "Truyền virus số hóa gây 55 sát thương chí mạng và làm choáng kẻ địch 1 lượt."
        },
        {
            id: "time_rewind",
            name: "Tua Ngược Dòng Thời Gian",
            costChrono: 40,
            power: 0,
            heal: 50,
            icon: "rotate-ccw",
            desc: "Đảo ngược dòng thời gian về 5 giây trước, hồi 50 HP và xóa mọi hiệu ứng xấu."
        }
    ],

    // STORY CHAPTERS & DIALOGUES
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
                    text: "💾 Nhận Đĩa Mềm 1.44MB và bàn kế hoạch tác chiến",
                    next: "battle_corrupted_bot",
                    action: "gain_item",
                    item: "floppy_disk"
                },
                {
                    text: "❓ Hỏi Lâm Tinh về nguồn gốc thực sự của Cơn Bão Y2K",
                    next: "ch1_lam_lore"
                }
            ]
        },

        ch1_lam_lore: {
            id: "ch1_lam_lore",
            speaker: "lam_tinh",
            text: "'Không đơn giản là lỗi 2 chữ số năm 00 đâu! Có một thực thể trí tuệ nhân tạo từ tương lai đang mượn sự cố này để đóng băng loài người vĩnh viễn ở năm 1999! Kìa, lính canh dữ liệu của nó đã tới!'",
            choices: [
                {
                    text: "⚔️ Rút vũ khí chuẩn bị chiến đấu!",
                    next: "battle_corrupted_bot"
                }
            ]
        },

        ch1_cassette_shop: {
            id: "ch1_cassette_shop",
            speaker: "vy_vy",
            text: "'Chào mừng đến với năm 1999. Tôi biết cậu sẽ đến. Cuộn băng Cassette này chứa tần số âm thanh có thể làm suy yếu lá chắn của Bóng Ma Thiên Niên Kỷ. Hãy giữ nó thật cẩn thận!'",
            choices: [
                {
                    text: "🎁 Nhận Băng Cassette & Nước Ngọt 1999",
                    next: "ch2_prep_tower",
                    action: "gain_items_vyvy"
                },
                {
                    text: "💬 Hỏi Vy Vy tại sao cô ấy lại biết trước mọi chuyện",
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
                    text: "🔥 Quyết tâm tiến vào Tháp Đồng Hồ phá vỡ vòng lặp!",
                    next: "ch2_prep_tower"
                }
            ]
        },

        ch2_prep_tower: {
            id: "ch2_prep_tower",
            speaker: "chronicler",
            text: "Các mốc thời gian đang sụp đổ. Đồng hồ lớn đã điểm 23:45. Bầu trời đêm rực sáng những vệt sấm chớp kỹ thuật số màu tím neon. Cánh cổng Tháp Đồng Hồ Thiên Niên Kỷ đã mở ra trước mắt.",
            choices: [
                {
                    text: "⚡ Tiến vào Phòng Thí Nghiệm Nghịch Lý đối đầu Trùm Y2K!",
                    next: "battle_boss_y2k"
                }
            ]
        },

        victory_ending: {
            id: "victory_ending",
            speaker: "chronicler",
            text: "🎉 CHIẾN THẮNG HUY HOÀNG! Khi dòng mã giải mã cuối cùng được nạp vào lõi thời gian, tiếng chuông đồng hồ vang lên rộn rã: '00:00:00 - 01/01/2000'. Thế giới bước sang Thế Kỷ Mới bình an. Bạn đã hoàn thành xuất sắc sứ mệnh của Người Du Hành Thời Gian 1999!",
            choices: [
                {
                    text: "🔄 Chơi lại từ đầu với cấp độ cao hơn (New Game+)",
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
            maxHp: 80,
            attackPower: 15,
            expReward: 50,
            desc: "Cỗ máy canh gác bị virus thời gian xâm nhập, phóng ra các tia sét số hóa."
        },
        boss_y2k: {
            id: "boss_y2k",
            name: "BÓNG MA THIÊN NIÊN KỶ (Y2K Core Paradox)",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=y2k_core_anomaly",
            maxHp: 180,
            attackPower: 22,
            expReward: 200,
            desc: "Trùm Cuối: Thực thể kiểm soát dòng thời gian muốn đóng băng nhân loại ở năm 1999."
        }
    }
};

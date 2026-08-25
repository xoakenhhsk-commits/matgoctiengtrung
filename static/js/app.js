/**
 * 🇨🇳 CHINESE SHADOWING AI - CLIENT CONTROLLER
 * Fullstack YouTube Sync + Pinyin Engine + Gemini AI Pronunciation Assessment
 */

class ChineseShadowingApp {
    constructor() {
        // State
        this.player = null;
        this.playerReady = false;
        this.currentVideoId = null;
        this.subtitles = [];
        this.activeIndex = 0;
        this.isLooping = false;
        this.isAutoPause = false;
        this.isScrollLocked = false;
        this.isMuted = false;
        this.currentVocabData = null;
        this.playbackSpeed = 1.0;
        this.timeSyncInterval = null;
        this.hasPausedForCurrentSub = false;
        this.isSeeking = false;

        // Audio & Recording State
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.speechRecognizer = null;
        this.recognizedText = "";

        // Vocabulary Folders State
        this.vocabFolders = ["Tất cả", "Mặc định", "Khẩu ngữ", "Giao tiếp"];
        try {
            const savedFolders = JSON.parse(localStorage.getItem('cs_vocab_folders') || '[]');
            if (Array.isArray(savedFolders) && savedFolders.length > 0) {
                this.vocabFolders = Array.from(new Set(["Tất cả", "Mặc định", ...savedFolders]));
            }
        } catch (e) {}
        this.activeVocabFolder = "Tất cả";

        // DOM Elements Cache
        this.cacheDOM();
        // Event Listeners
        this.bindEvents();
        // Init Speech Recognition
        this.initSpeechRecognition();
        // Load Sample Videos
        this.loadSampleVideos();
        // Initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    cacheDOM() {
        this.dom = {
            urlInput: document.getElementById('youtubeUrlInput'),
            btnClearUrl: document.getElementById('btnClearUrl'),
            btnLoadVideo: document.getElementById('btnLoadVideo'),
            sampleVideosList: document.getElementById('sampleVideosList'),
            playerPlaceholder: document.getElementById('playerPlaceholder'),
            
            // Player controls
            btnPrev: document.getElementById('btnPrevSentence'),
            btnPlayPause: document.getElementById('btnPlayPause'),
            btnNext: document.getElementById('btnNextSentence'),
            btnLoop: document.getElementById('btnLoopSentence'),
            chkAutoPause: document.getElementById('chkAutoPause'),
            selectSpeed: document.getElementById('selectSpeed'),
            btnToggleMute: document.getElementById('btnToggleMute'),
            muteIcon: document.getElementById('muteIcon'),

            // Scroll Lock
            btnToggleScrollLock: document.getElementById('btnToggleScrollLock'),
            scrollLockIcon: document.getElementById('scrollLockIcon'),
            scrollLockText: document.getElementById('scrollLockText'),

            // Active Sentence Showcase
            sentenceIndexText: document.getElementById('currentSentenceIndexText'),
            timestampBadge: document.getElementById('currentTimestampBadge'),
            pinyinDisplay: document.getElementById('activePinyinDisplay'),
            hanziDisplay: document.getElementById('activeHanziDisplay'),
            vnDisplay: document.getElementById('activeVnDisplay'),

            // Action Buttons
            btnListenNative: document.getElementById('btnListenNative'),
            btnRecordVoice: document.getElementById('btnRecordVoice'),
            micIcon: document.getElementById('micIcon'),
            micBtnText: document.getElementById('micBtnText'),
            recordingStatusBar: document.getElementById('recordingStatusBar'),
            recStatusText: document.getElementById('recStatusText'),

            // Subtitle List
            subCount: document.getElementById('subCount'),
            subtitlesList: document.getElementById('subtitlesList'),
            subSearchInput: document.getElementById('subSearchInput'),

            // Mobile Bar
            mobPrevBtn: document.getElementById('mobPrevBtn'),
            mobNativeAudioBtn: document.getElementById('mobNativeAudioBtn'),
            mobRecordBtn: document.getElementById('mobRecordBtn'),
            mobPlayBtn: document.getElementById('mobPlayBtn'),
            mobNextBtn: document.getElementById('mobNextBtn'),

            // Modals
            evalModal: document.getElementById('evaluationModal'),
            btnCloseModal: document.getElementById('btnCloseModal'),
            overallGauge: document.getElementById('overallGauge'),
            overallScoreNum: document.getElementById('overallScoreNum'),
            toneScoreNum: document.getElementById('toneScoreNum'),
            fluencyScoreNum: document.getElementById('fluencyScoreNum'),
            accuracyScoreNum: document.getElementById('accuracyScoreNum'),
            evalTargetText: document.getElementById('evalTargetText'),
            evalHeardText: document.getElementById('evalHeardText'),
            errorsSection: document.getElementById('errorsSection'),
            errorItemsList: document.getElementById('errorItemsList'),
            aiFeedbackText: document.getElementById('aiFeedbackText'),
            btnRetryPronounce: document.getElementById('btnRetryPronounce'),
            btnNextAfterEval: document.getElementById('btnNextAfterEval'),

            // Help Modal
            btnHelp: document.getElementById('btnHelp'),
            helpModal: document.getElementById('helpModal'),
            btnCloseHelpModal: document.getElementById('btnCloseHelpModal'),
            aiStatusBadge: document.getElementById('aiStatusBadge'),
            samplesContainer: document.getElementById('samplesContainer'),

            // Auth Header & Modal
            authHeaderContainer: document.getElementById('authHeaderContainer'),
            btnLoginHeader: document.getElementById('btnLoginHeader'),
            authModal: document.getElementById('authModal'),
            btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
            btnGoogleLogin: document.getElementById('btnGoogleLogin'),
            emailStepSend: document.getElementById('emailStepSend'),
            emailStepVerify: document.getElementById('emailStepVerify'),
            authEmailInput: document.getElementById('authEmailInput'),
            btnSendOtp: document.getElementById('btnSendOtp'),
            otpTargetEmail: document.getElementById('otpTargetEmail'),
            otpDemoHint: document.getElementById('otpDemoHint'),
            btnVerifyOtp: document.getElementById('btnVerifyOtp'),
            btnResendOtp: document.getElementById('btnResendOtp'),
            btnChangeEmail: document.getElementById('btnChangeEmail'),

            // Settings & User Account Modal
            btnOpenSettings: document.getElementById('btnOpenSettings'),
            settingsModal: document.getElementById('settingsModal'),
            btnCloseSettingsModal: document.getElementById('btnCloseSettingsModal'),
            settingsUserName: document.getElementById('settingsUserName'),
            settingsPlanBadge: document.getElementById('settingsPlanBadge'),
            settingsUserEmail: document.getElementById('settingsUserEmail'),
            settingsRegDate: document.getElementById('settingsRegDate'),
            settingsAvatarImg: document.getElementById('settingsAvatarImg'),
            btnSettingsLogout: document.getElementById('btnSettingsLogout'),
            settingKaraoke: document.getElementById('settingKaraoke'),
            btnSelectWeekPlan: document.getElementById('btnSelectWeekPlan'),
            btnSelectMonthPlan: document.getElementById('btnSelectMonthPlan'),

            // Favorites Modal & Action
            btnOpenFavorites: document.getElementById('btnOpenFavorites'),
            btnToggleFavorite: document.getElementById('btnToggleFavorite'),
            favoritesModal: document.getElementById('favoritesModal'),
            btnCloseFavoritesModal: document.getElementById('btnCloseFavoritesModal'),
            favoritesList: document.getElementById('favoritesList'),
            favCount: document.getElementById('favCount'),

            // 3D AI Flashcards
            btnOpenFlashcards: document.getElementById('btnOpenFlashcards'),
            flashcardsModal: document.getElementById('flashcardsModal'),
            btnCloseFlashcardsModal: document.getElementById('btnCloseFlashcardsModal'),
            flashcardModalTitle: document.getElementById('flashcardModalTitle'),
            selectFlashcardTargetFolder: document.getElementById('selectFlashcardTargetFolder'),
            btnSaveAllFlashcardsToNotebook: document.getElementById('btnSaveAllFlashcardsToNotebook'),
            btnSaveAllFcText: document.getElementById('btnSaveAllFcText'),
            flashcardElement: document.getElementById('flashcardElement'),
            fcFrontLevel: document.getElementById('fcFrontLevel'),
            fcFrontHanzi: document.getElementById('fcFrontHanzi'),
            fcBackPinyin: document.getElementById('fcBackPinyin'),
            fcBackVn: document.getElementById('fcBackVn'),
            fcBackSentence: document.getElementById('fcBackSentence'),
            fcBackSentenceVn: document.getElementById('fcBackSentenceVn'),
            btnFcSpeak: document.getElementById('btnFcSpeak'),
            btnPrevFc: document.getElementById('btnPrevFc'),
            btnNextFc: document.getElementById('btnNextFc'),
            fcCounter: document.getElementById('fcCounter'),

            // Real-time VietQR Payment Modal
            paymentModal: document.getElementById('paymentModal'),
            btnClosePaymentModal: document.getElementById('btnClosePaymentModal'),
            paymentPlanTitle: document.getElementById('paymentPlanTitle'),
            paymentQrImg: document.getElementById('paymentQrImg'),
            paymentAmountText: document.getElementById('paymentAmountText'),
            paymentDescText: document.getElementById('paymentDescText'),
            paymentBankText: document.getElementById('paymentBankText'),
            btnConfirmPaymentPaid: document.getElementById('btnConfirmPaymentPaid'),

            // Vocabulary Detail Modal (Multi-meaning Dictionary - PRO)
            vocabDetailModal: document.getElementById('vocabDetailModal'),
            btnCloseVocabModal: document.getElementById('btnCloseVocabModal'),
            vocabDetailHanzi: document.getElementById('vocabDetailHanzi'),
            vocabDetailPinyin: document.getElementById('vocabDetailPinyin'),
            vocabDetailType: document.getElementById('vocabDetailType'),
            vocabDetailLevel: document.getElementById('vocabDetailLevel'),
            vocabDetailMeaningsList: document.getElementById('vocabDetailMeaningsList'),
            vocabDetailExampleHanzi: document.getElementById('vocabDetailExampleHanzi'),
            vocabDetailExamplePinyin: document.getElementById('vocabDetailExamplePinyin'),
            vocabDetailExampleVn: document.getElementById('vocabDetailExampleVn'),
            btnVocabSpeak: document.getElementById('btnVocabSpeak'),
            selectVocabTargetFolder: document.getElementById('selectVocabTargetFolder'),
            btnSaveToNotebook: document.getElementById('btnSaveToNotebook'),
            btnSaveNotebookText: document.getElementById('btnSaveNotebookText'),

            // Vocabulary Notebook Modal (PRO)
            btnOpenVocabNotebook: document.getElementById('btnOpenVocabNotebook'),
            vocabNotebookModal: document.getElementById('vocabNotebookModal'),
            btnCloseNotebookModal: document.getElementById('btnCloseNotebookModal'),
            btnPracticeNotebookFlashcards: document.getElementById('btnPracticeNotebookFlashcards'),
            btnPracticeFcLabel: document.getElementById('btnPracticeFcLabel'),
            vocabFolderChips: document.getElementById('vocabFolderChips'),
            btnCreateNewFolder: document.getElementById('btnCreateNewFolder'),
            notebookList: document.getElementById('notebookList'),
            notebookCount: document.getElementById('notebookCount'),

            // Turn Limit & Pro Upgrade Modal Elements
            headerTurnBadge: document.getElementById('headerTurnBadge'),
            headerTurnText: document.getElementById('headerTurnText'),
            btnHeaderUpgradePro: document.getElementById('btnHeaderUpgradePro'),
            practiceTurnStatus: document.getElementById('practiceTurnStatus'),
            practiceTurnText: document.getElementById('practiceTurnText'),
            btnPracticeUpgrade: document.getElementById('btnPracticeUpgrade'),
            evalTurnStatusBox: document.getElementById('evalTurnStatusBox'),
            evalTurnStatusText: document.getElementById('evalTurnStatusText'),
            btnEvalUpgradePro: document.getElementById('btnEvalUpgradePro'),
            proUpgradeModal: document.getElementById('proUpgradeModal'),
            btnCloseProUpgradeModal: document.getElementById('btnCloseProUpgradeModal'),
            btnUpgradeWeekModal: document.getElementById('btnUpgradeWeekModal'),
            btnUpgradeMonthModal: document.getElementById('btnUpgradeMonthModal'),
            proUpgradeModalTitle: document.getElementById('proUpgradeModalTitle'),
            proUpgradeModalSubtitle: document.getElementById('proUpgradeModalSubtitle')
        };
    }

    bindEvents() {
        // URL Input & Loading
        this.dom.btnLoadVideo.addEventListener('click', () => this.handleLoadVideo());
        this.dom.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLoadVideo();
        });
        this.dom.urlInput.addEventListener('input', () => {
            this.dom.btnClearUrl.style.display = this.dom.urlInput.value ? 'flex' : 'none';
        });
        this.dom.btnClearUrl.addEventListener('click', () => {
            this.dom.urlInput.value = '';
            this.dom.btnClearUrl.style.display = 'none';
            this.dom.urlInput.focus();
        });

        // Player Controls
        this.dom.btnPlayPause.addEventListener('click', () => this.togglePlayPause());
        this.dom.btnPrev.addEventListener('click', () => this.jumpToSentence(this.activeIndex - 1));
        this.dom.btnNext.addEventListener('click', () => this.jumpToSentence(this.activeIndex + 1));
        this.dom.btnLoop.addEventListener('click', () => this.toggleLoop());
        this.dom.chkAutoPause.addEventListener('change', (e) => {
            this.isAutoPause = e.target.checked;
        });
        this.dom.selectSpeed.addEventListener('change', (e) => {
            this.setSpeed(parseFloat(e.target.value));
        });
        this.dom.btnToggleMute?.addEventListener('click', () => this.toggleMute());
        this.dom.btnToggleScrollLock?.addEventListener('click', () => this.toggleScrollLock());

        // Mobile Controls
        this.dom.mobPrevBtn?.addEventListener('click', () => this.jumpToSentence(this.activeIndex - 1));
        this.dom.mobNextBtn?.addEventListener('click', () => this.jumpToSentence(this.activeIndex + 1));
        this.dom.mobPlayBtn?.addEventListener('click', () => this.playCurrentSentence());
        this.dom.mobNativeAudioBtn?.addEventListener('click', () => this.speakNativeAudio());
        this.dom.mobRecordBtn?.addEventListener('click', () => this.toggleVoiceRecording());

        // Shadowing Actions
        this.dom.btnListenNative.addEventListener('click', () => this.speakNativeAudio());
        this.dom.btnRecordVoice.addEventListener('click', () => this.toggleVoiceRecording());

        // Subtitle Search
        this.dom.subSearchInput.addEventListener('input', (e) => this.filterSubtitles(e.target.value));

        // Modals
        this.dom.btnCloseModal.addEventListener('click', () => this.closeEvaluationModal());
        this.dom.btnRetryPronounce.addEventListener('click', () => {
            this.closeEvaluationModal();
            this.toggleVoiceRecording();
        });
        this.dom.btnNextAfterEval.addEventListener('click', () => {
            this.closeEvaluationModal();
            this.jumpToSentence(this.activeIndex + 1);
        });

        this.dom.btnHelp.addEventListener('click', () => {
            this.dom.helpModal.style.display = 'flex';
        });
        this.dom.btnCloseHelpModal.addEventListener('click', () => {
            this.dom.helpModal.style.display = 'none';
        });

        // Initialize Firebase Authentication UI & Listeners
        this.initAuthUI();

        // Check backend AI status
        this.checkAIStatus();

        // Check URL Query Param (?url=...)
        const urlParams = new URLSearchParams(window.location.search);
        const initialUrl = urlParams.get('url');
        if (initialUrl) {
            this.dom.urlInput.value = initialUrl;
            this.dom.btnClearUrl.style.display = 'flex';
            this.handleLoadVideo(initialUrl);
        }
    }

    initAuthUI() {
        if (!window.authManager) return;

        // 1. Lắng nghe trạng thái đăng nhập
        window.authManager.onAuthStateChanged((user) => {
            this.renderUserAuthUI(user);
        });

        // 2. Mở / Đóng Modal
        this.dom.btnCloseAuthModal?.addEventListener('click', () => this.closeAuthModal());
        this.dom.authModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.authModal) this.closeAuthModal();
        });

        // 3. Đăng nhập Google
        this.dom.btnGoogleLogin?.addEventListener('click', async () => {
            const res = await window.authManager.loginWithGoogle();
            if (res.success) {
                this.closeAuthModal();
                if (this.pendingVideoUrl) {
                    const nextUrl = this.pendingVideoUrl;
                    this.pendingVideoUrl = null;
                    this.handleLoadVideo(nextUrl);
                }
            }
        });

        // 4. Gửi OTP qua Email
        this.dom.btnSendOtp?.addEventListener('click', async () => {
            const email = this.dom.authEmailInput?.value.trim();
            if (!email) {
                alert("Vui lòng nhập địa chỉ Email!");
                return;
            }
            this.dom.btnSendOtp.disabled = true;
            this.dom.btnSendOtp.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Đang gửi mã...</span>`;
            if (window.lucide) window.lucide.createIcons();

            const res = await window.authManager.sendOtpToEmail(email);
            this.dom.btnSendOtp.disabled = false;
            this.dom.btnSendOtp.innerHTML = `<i data-lucide="send"></i><span>Gửi Mã Xác Nhận OTP</span>`;
            if (window.lucide) window.lucide.createIcons();

            if (res.success) {
                this.dom.emailStepSend.style.display = 'none';
                this.dom.emailStepVerify.style.display = 'block';
                if (this.dom.otpTargetEmail) this.dom.otpTargetEmail.textContent = email;
                if (this.dom.otpDemoHint) {
                    this.dom.otpDemoHint.innerHTML = `Mã xác nhận 6 số: <strong style="color:var(--primary-cyan); font-size:1.15rem; letter-spacing:2px;">${res.otp}</strong> (Tự động điền)`;
                }

                // Tự động điền 6 ô OTP
                const otpDigits = res.otp.split('');
                otpDigits.forEach((digit, idx) => {
                    const el = document.getElementById(`otp_${idx+1}`);
                    if (el) el.value = digit;
                });
                document.getElementById('otp_6')?.focus();
            } else {
                alert(res.message);
            }
        });

        // 5. Điều hướng phím trên 6 ô OTP
        const otpBoxes = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`otp_${i}`));
        otpBoxes.forEach((box, idx) => {
            if (!box) return;
            box.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && idx < 5) {
                    otpBoxes[idx + 1].focus();
                }
            });
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                    otpBoxes[idx - 1].focus();
                }
                if (e.key === 'Enter') {
                    this.dom.btnVerifyOtp?.click();
                }
            });
        });

        // 6. Xác nhận OTP
        this.dom.btnVerifyOtp?.addEventListener('click', async () => {
            const code = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`otp_${i}`)?.value || '').join('');
            if (code.length < 6) {
                alert("Vui lòng nhập đủ 6 chữ số mã xác nhận!");
                return;
            }
            this.dom.btnVerifyOtp.disabled = true;
            this.dom.btnVerifyOtp.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Đang xác thực Firebase...</span>`;
            if (window.lucide) window.lucide.createIcons();

            const res = await window.authManager.verifyOtpAndLogin(code);
            this.dom.btnVerifyOtp.disabled = false;
            this.dom.btnVerifyOtp.innerHTML = `<i data-lucide="check-circle-2"></i><span>Xác Nhận & Bắt Đầu Học</span>`;
            if (window.lucide) window.lucide.createIcons();

            if (res.success) {
                this.closeAuthModal();
                if (this.pendingVideoUrl) {
                    const nextUrl = this.pendingVideoUrl;
                    this.pendingVideoUrl = null;
                    this.handleLoadVideo(nextUrl);
                }
            } else {
                alert(res.message);
            }
        });

        // 7. Nút Gửi lại mã / Đổi Email
        this.dom.btnResendOtp?.addEventListener('click', () => {
            this.dom.btnSendOtp?.click();
        });
        this.dom.btnChangeEmail?.addEventListener('click', () => {
            this.dom.emailStepVerify.style.display = 'none';
            this.dom.emailStepSend.style.display = 'block';
            this.dom.authEmailInput?.focus();
        });

        // 8. Cài Đặt & Quản Lý Tài Khoản Modal
        this.dom.btnOpenSettings?.addEventListener('click', () => {
            this.openSettingsModal();
        });
        this.dom.btnCloseSettingsModal?.addEventListener('click', () => {
            this.closeSettingsModal();
        });
        this.dom.settingsModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.settingsModal) this.closeSettingsModal();
        });
        this.dom.btnSettingsLogout?.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                window.authManager.logout();
                this.closeSettingsModal();
            }
        });

        // Nút Đồng Bộ Thủ Công (Cloud Sync Button)
        const btnManualSync = document.getElementById('btnManualSync');
        btnManualSync?.addEventListener('click', async () => {
            if (!window.authManager || !window.authManager.isAuthenticated()) {
                this.closeSettingsModal();
                this.openAuthModal();
                return;
            }

            btnManualSync.disabled = true;
            btnManualSync.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width:14px; height:14px;"></i><span>Đang đồng bộ...</span>`;
            if (window.lucide) window.lucide.createIcons();

            const res = await window.authManager.syncWithServer();
            btnManualSync.disabled = false;
            btnManualSync.innerHTML = `<i data-lucide="check" style="width:14px; height:14px; color:#10b981;"></i><span>Đã Đồng Bộ!</span>`;
            if (window.lucide) window.lucide.createIcons();

            this.openSettingsModal(); // Refresh modal content

            setTimeout(() => {
                btnManualSync.innerHTML = `<i data-lucide="refresh-cw" style="width:14px; height:14px;"></i><span>Đồng Bộ</span>`;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        // 9. Lượt Dùng Thử Miễn Phí & Nâng Cấp PRO Triggers
        this.dom.headerTurnBadge?.addEventListener('click', () => this.openProUpgradeModal());
        this.dom.btnHeaderUpgradePro?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openProUpgradeModal();
        });
        this.dom.btnPracticeUpgrade?.addEventListener('click', () => this.openProUpgradeModal());
        this.dom.btnEvalUpgradePro?.addEventListener('click', () => {
            this.closeEvaluationModal();
            this.openProUpgradeModal();
        });
        this.dom.btnCloseProUpgradeModal?.addEventListener('click', () => this.closeProUpgradeModal());
        this.dom.proUpgradeModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.proUpgradeModal) this.closeProUpgradeModal();
        });
        this.dom.btnUpgradeWeekModal?.addEventListener('click', () => {
            this.closeProUpgradeModal();
            this.startVietQRPayment('week_7d');
        });
        this.dom.btnUpgradeMonthModal?.addEventListener('click', () => {
            this.closeProUpgradeModal();
            this.startVietQRPayment('month_30d');
        });

        // Lắng nghe sự kiện thay đổi lượt dùng
        window.addEventListener('cs-turns-changed', () => this.updateTurnBadges());
        window.addEventListener('cs-cloud-synced', () => this.updateTurnBadges());

        // Cập nhật trạng thái badge ban đầu
        this.updateTurnBadges();

        // 10. Khởi tạo tính năng Yêu Thích ⭐, Flashcards 🎴 và Thanh Toán VietQR Realtime 💳
        this.initFavoritesAndProFeatures();
    }

    renderUserAuthUI(user) {
        if (!this.dom.authHeaderContainer) return;

        if (user) {
            const isPro = window.authManager.isPro();
            const planBadgeHtml = isPro 
                ? `<span class="user-plan-tag" style="color:#fbbf24; font-weight:800;">👑 PRO</span>`
                : `<span class="user-plan-tag" style="color:#10b981; font-weight:700;">🌱 FREE</span>`;

            // Người dùng đã đăng nhập: Hiển thị Profile Pill tinh gọn, thẳng hàng
            this.dom.authHeaderContainer.innerHTML = `
                <div class="user-profile-pill ${isPro ? 'is-pro' : ''}" id="headerUserProfilePill" title="Bấm để xem thông tin tài khoản">
                    <div class="user-avatar-wrap">
                        <img src="${user.photoURL}" alt="${user.name}" class="user-avatar-img">
                        ${isPro ? '<span class="user-crown-badge">👑</span>' : ''}
                    </div>
                    <div class="user-text-meta">
                        <span class="user-display-name">${user.name}</span>
                        ${planBadgeHtml}
                    </div>
                    <button class="user-logout-btn" id="btnLogoutHeader" title="Đăng xuất">
                        <i data-lucide="log-out"></i>
                    </button>
                </div>
            `;
            document.getElementById('headerUserProfilePill')?.addEventListener('click', (e) => {
                if (e.target.closest('#btnLogoutHeader')) return;
                this.openSettingsModal();
            });
            document.getElementById('btnLogoutHeader')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                    window.authManager.logout();
                }
            });
        } else {
            // Chưa đăng nhập: Hiển thị nút Đăng Nhập
            this.dom.authHeaderContainer.innerHTML = `
                <button class="btn-login-trigger" id="btnLoginHeader">
                    <i data-lucide="log-in"></i>
                    <span>Đăng Nhập</span>
                </button>
            `;
            document.getElementById('btnLoginHeader')?.addEventListener('click', () => {
                this.openAuthModal();
            });
        }
        if (window.lucide) window.lucide.createIcons();
    }

    openAuthModal() {
        if (this.dom.authModal) {
            this.dom.authModal.style.display = 'flex';
            this.dom.emailStepSend.style.display = 'block';
            this.dom.emailStepVerify.style.display = 'none';
            if (this.dom.authEmailInput) this.dom.authEmailInput.value = '';
            if (window.lucide) window.lucide.createIcons();
        }
    }

    closeAuthModal() {
        if (this.dom.authModal) {
            this.dom.authModal.style.display = 'none';
        }
    }

    openSettingsModal() {
        if (!this.dom.settingsModal) return;

        const user = window.authManager?.getUser();
        const isPro = window.authManager?.isPro();

        const syncTitle = document.getElementById('cloudSyncStatusTitle');
        const syncDesc = document.getElementById('cloudSyncStatusDesc');

        if (user) {
            if (this.dom.settingsUserName) this.dom.settingsUserName.textContent = user.name || "Học Viên";
            if (this.dom.settingsUserEmail) this.dom.settingsUserEmail.textContent = user.email || "";
            if (this.dom.settingsAvatarImg) this.dom.settingsAvatarImg.src = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`;
            
            if (this.dom.settingsPlanBadge) {
                if (isPro) {
                    this.dom.settingsPlanBadge.textContent = "👑 Gói VIP (Tài Khoản PRO)";
                    this.dom.settingsPlanBadge.style.color = "#fbbf24";
                    this.dom.settingsPlanBadge.style.borderColor = "rgba(251,191,36,0.5)";
                    this.dom.settingsPlanBadge.style.background = "rgba(251,191,36,0.15)";
                } else {
                    this.dom.settingsPlanBadge.textContent = "🌱 Gói Miễn Phí (FREE)";
                    this.dom.settingsPlanBadge.style.color = "#10b981";
                    this.dom.settingsPlanBadge.style.borderColor = "rgba(16,185,129,0.4)";
                    this.dom.settingsPlanBadge.style.background = "rgba(16,185,129,0.15)";
                }
            }

            if (this.dom.settingsRegDate) {
                if (isPro && user.planExpiresAt) {
                    this.dom.settingsRegDate.textContent = `Hạn dùng PRO: đến ngày ${user.planExpiresAt}`;
                } else {
                    const todayStr = new Date().toLocaleDateString('vi-VN');
                    this.dom.settingsRegDate.textContent = `Bắt đầu từ ngày: ${todayStr} (Đang hoạt động)`;
                }
            }

            if (syncTitle) syncTitle.textContent = "Đồng Bộ Cloud Đa Thiết Bị: Đã Sẵn Sàng ✅";
            if (syncDesc) syncDesc.textContent = `Gmail: ${user.email} | Đã đồng bộ ${this.savedVocab.length} từ vựng, ${this.favorites.length} câu yêu thích (Tự động tải khi đổi điện thoại)`;

            if (this.dom.btnSettingsLogout) this.dom.btnSettingsLogout.style.display = 'flex';
        } else {
            if (this.dom.settingsUserName) this.dom.settingsUserName.textContent = "Khách Học Viên";
            if (this.dom.settingsUserEmail) this.dom.settingsUserEmail.textContent = "Chưa đăng nhập tài khoản";
            if (this.dom.settingsAvatarImg) this.dom.settingsAvatarImg.src = "https://api.dicebear.com/7.x/bottts/svg?seed=guestuser";
            if (this.dom.settingsPlanBadge) this.dom.settingsPlanBadge.textContent = "🌱 Khách (Chưa đăng nhập)";
            if (this.dom.settingsRegDate) this.dom.settingsRegDate.textContent = "Bấm Đăng Nhập để lưu tiến trình học";
            
            if (syncTitle) syncTitle.textContent = "Chưa Đồng Bộ Đám Mây";
            if (syncDesc) syncDesc.textContent = "Vui lòng đăng nhập bằng Gmail để lưu trữ và truy cập dữ liệu trên mọi điện thoại/máy tính.";

            if (this.dom.btnSettingsLogout) this.dom.btnSettingsLogout.style.display = 'none';
        }

        this.dom.settingsModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    closeSettingsModal() {
        if (this.dom.settingsModal) {
            this.dom.settingsModal.style.display = 'none';
        }
    }

    // ==========================================
    // SCROLL LOCK & MUTE CONTROLS
    // ==========================================
    toggleScrollLock() {
        this.isScrollLocked = !this.isScrollLocked;
        if (this.dom.btnToggleScrollLock) {
            this.dom.btnToggleScrollLock.classList.toggle('locked', this.isScrollLocked);
        }
        if (this.dom.scrollLockIcon) {
            this.dom.scrollLockIcon.setAttribute('data-lucide', this.isScrollLocked ? 'lock' : 'unlock');
        }
        if (this.dom.scrollLockText) {
            this.dom.scrollLockText.textContent = this.isScrollLocked ? 'Đã Khóa' : 'Tự Cuộn';
        }
        if (window.lucide) window.lucide.createIcons();
    }

    toggleMute() {
        if (!this.player) return;
        try {
            const isCurrentlyMuted = (typeof this.player.isMuted === 'function') ? this.player.isMuted() : this.isMuted;
            if (isCurrentlyMuted) {
                if (typeof this.player.unMute === 'function') this.player.unMute();
                this.isMuted = false;
                if (this.dom.btnToggleMute) this.dom.btnToggleMute.classList.remove('muted');
                if (this.dom.muteIcon) this.dom.muteIcon.setAttribute('data-lucide', 'volume-2');
            } else {
                if (typeof this.player.mute === 'function') this.player.mute();
                this.isMuted = true;
                if (this.dom.btnToggleMute) this.dom.btnToggleMute.classList.add('muted');
                if (this.dom.muteIcon) this.dom.muteIcon.setAttribute('data-lucide', 'volume-x');
            }
            if (window.lucide) window.lucide.createIcons();
        } catch (e) {
            console.log("Toggle mute error:", e);
        }
    }

    // ==========================================
    // FAVORITES & VOCABULARY PRO FEATURES LOGIC
    // ==========================================
    initFavoritesAndProFeatures() {
        // Khởi tạo danh sách yêu thích & từ vựng từ localStorage
        this.favorites = JSON.parse(localStorage.getItem('cs_favorite_sentences') || '[]');
        this.savedVocab = JSON.parse(localStorage.getItem('cs_saved_vocabulary') || '[]');
        this.updateFavCountBadge();
        this.updateVocabCountBadge();

        // Lắng nghe sự kiện đồng bộ Cloud đa thiết bị từ AuthManager
        window.addEventListener('cs-cloud-synced', (e) => {
            const serverUser = e.detail?.user;
            if (serverUser) {
                if (Array.isArray(serverUser.saved_vocabulary)) {
                    this.savedVocab = serverUser.saved_vocabulary;
                    this.updateVocabCountBadge();
                    this.updateSaveVocabBtnState();
                    if (this.dom.vocabNotebookModal && this.dom.vocabNotebookModal.style.display === 'flex') {
                        this.renderVocabNotebookList();
                    }
                }
                if (Array.isArray(serverUser.favorite_sentences)) {
                    this.favorites = serverUser.favorite_sentences;
                    this.updateFavCountBadge();
                    if (this.dom.favoritesModal && this.dom.favoritesModal.style.display === 'flex') {
                        this.renderFavoritesList();
                    }
                }
            }
        });

        // 1. Toggle Favorite on current active sentence
        this.dom.btnToggleFavorite?.addEventListener('click', () => {
            this.toggleCurrentFavorite();
        });

        // 2. Open / Close Favorites Modal
        this.dom.btnOpenFavorites?.addEventListener('click', () => {
            this.openFavoritesModal();
        });
        this.dom.btnCloseFavoritesModal?.addEventListener('click', () => {
            this.closeFavoritesModal();
        });
        this.dom.favoritesModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.favoritesModal) this.closeFavoritesModal();
        });

        // 3. AI Flashcards 3D Modal
        this.dom.btnOpenFlashcards?.addEventListener('click', () => {
            this.handleOpenFlashcards();
        });
        this.dom.btnCloseFlashcardsModal?.addEventListener('click', () => {
            this.closeFlashcardsModal();
        });
        this.dom.flashcardsModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.flashcardsModal) this.closeFlashcardsModal();
        });
        this.dom.flashcardElement?.addEventListener('click', () => {
            this.dom.flashcardElement.classList.toggle('is-flipped');
        });
        this.dom.btnPrevFc?.addEventListener('click', () => {
            this.navigateFlashcard(-1);
        });
        this.dom.btnNextFc?.addEventListener('click', () => {
            this.navigateFlashcard(1);
        });
        this.dom.btnFcSpeak?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.flashcards && this.flashcards[this.currentFcIndex]) {
                const text = this.flashcards[this.currentFcIndex].hanzi;
                this.speakChineseText(text);
            }
        });
        this.dom.btnSaveAllFlashcardsToNotebook?.addEventListener('click', () => {
            this.saveAllFlashcardsToNotebook();
        });

        // 4. Vocabulary Detail Modal (Multi-meaning Dictionary - PRO)
        this.dom.btnCloseVocabModal?.addEventListener('click', () => {
            this.closeVocabDetailModal();
        });
        this.dom.vocabDetailModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.vocabDetailModal) this.closeVocabDetailModal();
        });
        this.dom.btnVocabSpeak?.addEventListener('click', () => {
            if (this.currentVocabData && this.currentVocabData.hanzi) {
                this.speakChineseWord(this.currentVocabData.hanzi);
            }
        });
        this.dom.btnSaveToNotebook?.addEventListener('click', () => {
            this.toggleSaveCurrentVocab();
        });

        // 5. Vocabulary Notebook Modal (PRO)
        this.dom.btnOpenVocabNotebook?.addEventListener('click', () => {
            this.openVocabNotebookModal();
        });
        this.dom.btnCloseNotebookModal?.addEventListener('click', () => {
            this.closeVocabNotebookModal();
        });
        this.dom.vocabNotebookModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.vocabNotebookModal) this.closeVocabNotebookModal();
        });
        this.dom.btnPracticeNotebookFlashcards?.addEventListener('click', () => {
            this.startNotebookFlashcardsPractice();
        });
        this.dom.btnCreateNewFolder?.addEventListener('click', () => {
            this.promptCreateNewFolder();
        });

        // 6. Real-time VietQR Payment Handlers
        this.dom.btnSelectWeekPlan?.addEventListener('click', () => {
            this.closeSettingsModal();
            this.startVietQRPayment('week_7d');
        });
        this.dom.btnSelectMonthPlan?.addEventListener('click', () => {
            this.closeSettingsModal();
            this.startVietQRPayment('month_30d');
        });
        this.dom.btnClosePaymentModal?.addEventListener('click', () => {
            this.closePaymentModal();
        });
        this.dom.paymentModal?.addEventListener('click', (e) => {
            if (e.target === this.dom.paymentModal) this.closePaymentModal();
        });
        this.dom.btnConfirmPaymentPaid?.addEventListener('click', () => {
            this.confirmVietQRPayment();
        });
    }

    async handleVocabClick(word, currentSub) {
        // Phân quyền: FREE -> Yêu cầu nâng cấp PRO
        if (!window.authManager || !window.authManager.isPro()) {
            const accept = confirm("⭐ Tra cứu từ vựng đa nghĩa chi tiết & Sổ Từ Vựng là ĐẶC QUYỀN PRO VIP.\n\nBạn có muốn nâng cấp gói PRO chỉ 2.000đ (PayOS) để mở khóa trọn bộ không?");
            if (accept) {
                this.startVietQRPayment('week_7d');
            }
            return;
        }

        // Tài khoản PRO -> Tra cứu từ điển đa nghĩa chuyên sâu
        try {
            const res = await fetch('/api/vocab/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: word,
                    context_sentence: currentSub?.hanzi || ""
                })
            });
            const result = await res.json();
            if (result.success && result.data) {
                this.openVocabDetailModal(result.data, currentSub);
            }
        } catch (e) {
            console.error("Vocab lookup error:", e);
        }
    }

    openVocabDetailModal(data, currentSub) {
        this.currentVocabData = data;
        if (this.dom.vocabDetailHanzi) this.dom.vocabDetailHanzi.textContent = data.hanzi;
        if (this.dom.vocabDetailPinyin) this.dom.vocabDetailPinyin.textContent = data.pinyin;
        if (this.dom.vocabDetailType) this.dom.vocabDetailType.textContent = data.word_type || "Từ vựng";
        if (this.dom.vocabDetailLevel) this.dom.vocabDetailLevel.textContent = data.level || "Hội thoại thực tế";

        if (this.dom.vocabDetailMeaningsList) {
            this.dom.vocabDetailMeaningsList.innerHTML = '';
            (data.meanings || []).forEach(m => {
                const div = document.createElement('div');
                div.className = 'vocab-meaning-item';
                div.innerHTML = `<span style="color:#38bdf8;">•</span> ${m}`;
                this.dom.vocabDetailMeaningsList.appendChild(div);
            });
        }

        if (this.dom.vocabDetailExampleHanzi) {
            this.dom.vocabDetailExampleHanzi.textContent = data.example_sentence || currentSub?.hanzi || "";
        }
        if (this.dom.vocabDetailExamplePinyin) {
            this.dom.vocabDetailExamplePinyin.textContent = data.example_pinyin || currentSub?.pinyin || "";
        }
        if (this.dom.vocabDetailExampleVn) {
            this.dom.vocabDetailExampleVn.textContent = data.example_vietnamese || currentSub?.vietnamese || "";
        }

        this.updateSaveVocabBtnState();
        if (this.dom.vocabDetailModal) this.dom.vocabDetailModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    closeVocabDetailModal() {
        if (this.dom.vocabDetailModal) this.dom.vocabDetailModal.style.display = 'none';
    }

    // ==========================================
    // VOCABULARY FOLDER SYSTEM (QUẢN LÝ THƯ MỤC TỪ VỰNG)
    // ==========================================
    saveFolders() {
        try {
            localStorage.setItem('cs_vocab_folders', JSON.stringify(this.vocabFolders));
        } catch (e) {}
        this.populateFolderSelects();
        this.renderFolderChips();
    }

    populateFolderSelects() {
        const folders = this.vocabFolders.filter(f => f !== 'Tất cả');
        const flashcardSelect = this.dom.selectFlashcardTargetFolder;
        const vocabSelect = this.dom.selectVocabTargetFolder;

        const optionsHtml = folders.map(f => `<option value="${f}" style="background:#0f1424;">📁 Thư mục: ${f}</option>`).join('');

        if (flashcardSelect) {
            flashcardSelect.innerHTML = optionsHtml;
            if (folders.includes(this.activeVocabFolder) && this.activeVocabFolder !== 'Tất cả') {
                flashcardSelect.value = this.activeVocabFolder;
            }
        }
        if (vocabSelect) {
            vocabSelect.innerHTML = optionsHtml;
            if (folders.includes(this.activeVocabFolder) && this.activeVocabFolder !== 'Tất cả') {
                vocabSelect.value = this.activeVocabFolder;
            }
        }
    }

    renderFolderChips() {
        if (!this.dom.vocabFolderChips) return;
        this.dom.vocabFolderChips.innerHTML = '';

        this.vocabFolders.forEach(folder => {
            let count = 0;
            if (folder === 'Tất cả') {
                count = this.savedVocab.length;
            } else {
                count = this.savedVocab.filter(v => (v.folder || 'Mặc định') === folder).length;
            }

            const btn = document.createElement('button');
            const isActive = this.activeVocabFolder === folder;
            btn.className = `btn-folder-chip ${isActive ? 'active' : ''}`;
            btn.style.cssText = `
                padding: 4px 10px;
                font-size: 0.75rem;
                font-weight: 700;
                border-radius: var(--radius-full);
                border: 1px solid ${isActive ? 'var(--primary-cyan)' : 'rgba(255,255,255,0.1)'};
                background: ${isActive ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255,255,255,0.04)'};
                color: ${isActive ? '#ffffff' : 'var(--text-secondary)'};
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                transition: var(--transition-fast);
            `;
            btn.innerHTML = `<span>📁 ${folder}</span> <span style="font-size:0.68rem; opacity:0.8; background:rgba(0,0,0,0.3); padding:1px 5px; border-radius:10px;">${count}</span>`;
            
            btn.addEventListener('click', () => {
                this.setActiveFolder(folder);
            });

            this.dom.vocabFolderChips.appendChild(btn);
        });
    }

    setActiveFolder(folderName) {
        this.activeVocabFolder = folderName;
        this.renderFolderChips();
        this.renderVocabNotebookList();
        this.populateFolderSelects();
    }

    promptCreateNewFolder() {
        const folderName = prompt("Nhập tên Thư mục từ vựng mới (Ví dụ: HSK 3, Giao tiếp nhà hàng, Bài 1...):");
        if (!folderName || !folderName.trim()) return;
        const cleanName = folderName.trim();
        if (this.vocabFolders.includes(cleanName)) {
            alert(`Thư mục "${cleanName}" đã tồn tại!`);
            this.setActiveFolder(cleanName);
            return;
        }
        this.vocabFolders.push(cleanName);
        this.saveFolders();
        this.setActiveFolder(cleanName);
    }

    changeVocabItemFolder(wordHanzi, newFolder) {
        const item = this.savedVocab.find(v => v.hanzi === wordHanzi);
        if (item) {
            item.folder = newFolder;
            try {
                localStorage.setItem('cs_saved_vocabulary', JSON.stringify(this.savedVocab));
            } catch (e) {}
            this.renderFolderChips();
            this.renderVocabNotebookList();
            window.authManager?.syncWithServer({ saved_vocabulary: this.savedVocab, replace_vocab: true });
        }
    }

    toggleSaveCurrentVocab() {
        if (!this.currentVocabData) return;
        const word = this.currentVocabData.hanzi;
        const idx = this.savedVocab.findIndex(v => v.hanzi === word);
        const targetFolder = this.dom.selectVocabTargetFolder?.value || (this.activeVocabFolder !== 'Tất cả' ? this.activeVocabFolder : 'Mặc định');

        if (idx >= 0) {
            this.savedVocab.splice(idx, 1);
        } else {
            this.savedVocab.push({
                hanzi: this.currentVocabData.hanzi,
                pinyin: this.currentVocabData.pinyin,
                meanings: this.currentVocabData.meanings || [],
                word_type: this.currentVocabData.word_type || "",
                level: this.currentVocabData.level || "",
                folder: targetFolder,
                example: this.currentVocabData.example_sentence || "",
                example_vn: this.currentVocabData.example_vietnamese || "",
                savedAt: new Date().toLocaleDateString('vi-VN')
            });
        }

        try {
            localStorage.setItem('cs_saved_vocabulary', JSON.stringify(this.savedVocab));
        } catch (e) {}

        this.updateSaveVocabBtnState();
        this.updateVocabCountBadge();
        this.renderFolderChips();

        // Đồng bộ tức thì lên Cloud
        window.authManager?.syncWithServer({ saved_vocabulary: this.savedVocab, replace_vocab: true });
    }

    updateSaveVocabBtnState() {
        if (!this.dom.btnSaveToNotebook || !this.currentVocabData) return;
        const isSaved = this.savedVocab.some(v => v.hanzi === this.currentVocabData.hanzi);
        if (this.dom.btnSaveNotebookText) {
            this.dom.btnSaveNotebookText.textContent = isSaved ? '⭐ Đã Trong Sổ' : '⭐ Lưu Vào Sổ';
        }
        this.dom.btnSaveToNotebook.style.background = isSaved ? 'rgba(251, 191, 36, 0.2)' : '';
    }

    openVocabNotebookModal() {
        // Phân quyền: FREE -> Yêu cầu nâng cấp PRO
        if (!window.authManager || !window.authManager.isPro()) {
            const accept = confirm("⭐ Sổ Từ Vựng Của Tôi là ĐẶC QUYỀN PRO VIP để bạn lưu & ôn tập lặp lại lâu dài.\n\nBạn có muốn nâng cấp PRO chỉ 2.000đ (PayOS) để mở khóa không?");
            if (accept) {
                this.startVietQRPayment('week_7d');
            }
            return;
        }

        this.populateFolderSelects();
        this.renderFolderChips();
        this.renderVocabNotebookList();
        if (this.dom.vocabNotebookModal) this.dom.vocabNotebookModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    closeVocabNotebookModal() {
        if (this.dom.vocabNotebookModal) this.dom.vocabNotebookModal.style.display = 'none';
    }

    renderVocabNotebookList() {
        if (!this.dom.notebookList) return;
        this.dom.notebookList.innerHTML = '';
        
        // Lọc từ vựng theo Thư mục đang chọn
        const filteredVocab = this.activeVocabFolder === 'Tất cả'
            ? this.savedVocab
            : this.savedVocab.filter(v => (v.folder || 'Mặc định') === this.activeVocabFolder);

        if (this.dom.notebookCount) {
            this.dom.notebookCount.textContent = `${filteredVocab.length}/${this.savedVocab.length}`;
        }
        if (this.dom.btnPracticeFcLabel) {
            this.dom.btnPracticeFcLabel.textContent = this.activeVocabFolder === 'Tất cả' ? '🎴 Ôn Tập Tất Cả' : `🎴 Ôn Tập Thư Mục (${filteredVocab.length})`;
        }

        if (filteredVocab.length === 0) {
            this.dom.notebookList.innerHTML = `
                <div style="text-align: center; padding: 35px 20px; color: var(--text-muted);">
                    <i data-lucide="folder-open" style="width: 42px; height: 42px; margin-bottom: 8px; color: rgba(251,191,36,0.6);"></i>
                    <p style="font-size:0.95rem; font-weight:600; color:#ffffff;">Thư mục "${this.activeVocabFolder}" đang trống</p>
                    <p style="font-size:0.8rem; margin-top:4px;">Hãy nhấp vào các chữ Hán trong bài học hoặc tạo Flashcard từ video để lưu từ vào thư mục này nhé!</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        const foldersWithoutAll = this.vocabFolders.filter(f => f !== 'Tất cả');

        filteredVocab.forEach((item, index) => {
            const originalIndex = this.savedVocab.indexOf(item);
            const div = document.createElement('div');
            div.className = 'vocab-nb-item';
            const firstMeaning = item.meanings && item.meanings.length > 0 ? item.meanings[0] : (item.example_vn || item.vietnamese || '');
            const currentFolder = item.folder || 'Mặc định';

            let exampleHtml = '';
            if (item.example) {
                exampleHtml = `
                    <div class="vocab-nb-example-box">
                        <div class="vocab-nb-ex-hanzi">💬 ${item.example}</div>
                        ${item.example_pinyin ? `<div class="vocab-nb-ex-pinyin">${item.example_pinyin}</div>` : ''}
                        ${item.example_vn ? `<div class="vocab-nb-ex-vn">🇻🇳 ${item.example_vn}</div>` : ''}
                    </div>
                `;
            }

            const folderOptionsHtml = foldersWithoutAll.map(f => `<option value="${f}" ${f === currentFolder ? 'selected' : ''}>📁 ${f}</option>`).join('');

            div.innerHTML = `
                <div class="vocab-nb-top-row">
                    <div class="vocab-nb-main-info">
                        <span class="vocab-nb-hanzi">${item.hanzi}</span>
                        <span class="vocab-nb-pinyin">${item.pinyin || ''}</span>
                        <span class="tag-pill gold" style="font-size:0.68rem;">${item.level || 'HSK'}</span>
                        <select class="vocab-item-folder-select" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,242,254,0.3); color: var(--primary-cyan); font-size: 0.72rem; border-radius: var(--radius-sm); padding: 2px 6px; outline: none; cursor: pointer;">
                            ${folderOptionsHtml}
                        </select>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button class="icon-btn btn-nb-speak" title="Phát âm từ này" style="width:32px; height:32px; color:var(--primary-cyan); background:rgba(0,242,254,0.1);">
                            <i data-lucide="volume-2" style="width:15px; height:15px;"></i>
                        </button>
                        <button class="icon-btn btn-nb-lookup" title="Tra cứu đa nghĩa chi tiết" style="width:32px; height:32px; color:#fbbf24; background:rgba(251,191,36,0.1);">
                            <i data-lucide="search" style="width:15px; height:15px;"></i>
                        </button>
                        <button class="icon-btn btn-nb-delete" title="Xóa từ này khỏi sổ" style="width:32px; height:32px; color:var(--accent-red); background:rgba(239,68,68,0.1);">
                            <i data-lucide="trash-2" style="width:15px; height:15px;"></i>
                        </button>
                    </div>
                </div>
                <div class="vocab-nb-meaning">⭐ ${firstMeaning}</div>
                ${exampleHtml}
            `;

            div.querySelector('.vocab-item-folder-select')?.addEventListener('change', (e) => {
                this.changeVocabItemFolder(item.hanzi, e.target.value);
            });

            div.querySelector('.btn-nb-speak')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speakChineseWord(item.hanzi);
            });

            div.querySelector('.btn-nb-lookup')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleVocabClick(item.hanzi, { hanzi: item.example || item.hanzi });
            });

            div.querySelector('.btn-nb-delete')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (originalIndex >= 0) {
                    this.savedVocab.splice(originalIndex, 1);
                    localStorage.setItem('cs_saved_vocabulary', JSON.stringify(this.savedVocab));
                    this.renderFolderChips();
                    this.renderVocabNotebookList();
                    this.updateVocabCountBadge();
                    this.updateSaveVocabBtnState();
                    // Đồng bộ xóa từ lên Cloud
                    window.authManager?.syncWithServer({ saved_vocabulary: this.savedVocab, replace_vocab: true });
                }
            });

            this.dom.notebookList.appendChild(div);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    saveAllFlashcardsToNotebook() {
        if (!this.flashcards || this.flashcards.length === 0) {
            alert("Chưa có bộ Flashcards nào để lưu!");
            return;
        }

        // KIỂM TRA QUYỀN PRO
        if (!window.authManager.isPro()) {
            const accept = confirm("⭐ Tính năng Sổ Từ Vựng PRO là đặc quyền của gói VIP.\n\nNâng cấp ngay chỉ 2.000đ để mở khóa toàn bộ?");
            if (accept) {
                this.startVietQRPayment('week_7d');
            }
            return;
        }

        const targetFolder = this.dom.selectFlashcardTargetFolder?.value || (this.activeVocabFolder !== 'Tất cả' ? this.activeVocabFolder : 'Mặc định');
        let addedCount = 0;
        let updatedCount = 0;

        this.flashcards.forEach(card => {
            const word = card.hanzi;
            if (!word) return;
            const existingIdx = this.savedVocab.findIndex(v => v.hanzi === word);
            const vocabItem = {
                hanzi: card.hanzi,
                pinyin: card.pinyin,
                meanings: [card.vietnamese],
                word_type: "Từ vựng Flashcard",
                level: card.level || "HSK",
                folder: targetFolder,
                example: card.context_sentence || "",
                example_pinyin: card.context_pinyin || "",
                example_vn: card.context_vn || "",
                savedAt: new Date().toLocaleDateString('vi-VN')
            };

            if (existingIdx >= 0) {
                this.savedVocab[existingIdx] = { ...this.savedVocab[existingIdx], ...vocabItem };
                updatedCount++;
            } else {
                this.savedVocab.push(vocabItem);
                addedCount++;
            }
        });

        try {
            localStorage.setItem('cs_saved_vocabulary', JSON.stringify(this.savedVocab));
        } catch (e) {}

        this.updateVocabCountBadge();
        this.updateSaveVocabBtnState();
        this.renderFolderChips();

        // Đồng bộ tức thì lên Cloud Server
        window.authManager?.syncWithServer({ saved_vocabulary: this.savedVocab, replace_vocab: true });

        if (this.dom.btnSaveAllFcText) {
            this.dom.btnSaveAllFcText.textContent = `✅ Đã Lưu ${this.flashcards.length} Từ!`;
            if (this.dom.btnSaveAllFlashcardsToNotebook) {
                this.dom.btnSaveAllFlashcardsToNotebook.style.background = 'rgba(251, 191, 36, 0.25)';
            }
            setTimeout(() => {
                if (this.dom.btnSaveAllFcText) this.dom.btnSaveAllFcText.textContent = '⭐ Lưu Tất Cả';
                if (this.dom.btnSaveAllFlashcardsToNotebook) {
                    this.dom.btnSaveAllFlashcardsToNotebook.style.background = '';
                }
            }, 3000);
        }

        alert(`🎉 Đã lưu thành công ${this.flashcards.length} từ vựng vào Thư mục "${targetFolder}"!\n(Thêm mới: ${addedCount} từ, Cập nhật: ${updatedCount} từ)`);
    }

    startNotebookFlashcardsPractice() {
        const filteredVocab = this.activeVocabFolder === 'Tất cả'
            ? this.savedVocab
            : this.savedVocab.filter(v => (v.folder || 'Mặc định') === this.activeVocabFolder);

        if (!filteredVocab || filteredVocab.length === 0) {
            alert(`Thư mục "${this.activeVocabFolder}" đang trống! Hãy thêm từ vựng vào thư mục trước khi ôn tập nhé!`);
            return;
        }

        // KIỂM TRA QUYỀN PRO
        if (!window.authManager.isPro()) {
            const accept = confirm("⭐ Ôn tập Sổ Từ Vựng bằng Flashcard 3D là ĐẶC QUYỀN PRO VIP.\n\nBạn có muốn nâng cấp gói PRO chỉ 2.000đ để mở khóa không?");
            if (accept) {
                this.startVietQRPayment('week_7d');
            }
            return;
        }

        const deck = filteredVocab.map((item, idx) => ({
            id: idx + 1,
            hanzi: item.hanzi,
            pinyin: item.pinyin,
            vietnamese: (item.meanings && item.meanings.length > 0 ? item.meanings[0] : (item.example_vn || item.vietnamese || '')),
            level: item.level || (item.folder ? `📁 ${item.folder}` : 'Sổ Từ Vựng'),
            context_sentence: item.example || '',
            context_pinyin: item.example_pinyin || '',
            context_vn: item.example_vn || ''
        }));

        this.closeVocabNotebookModal();
        this.flashcards = deck;
        this.currentFcIndex = 0;

        if (this.dom.flashcardModalTitle) {
            this.dom.flashcardModalTitle.textContent = `🎴 Ôn Tập: ${this.activeVocabFolder} (${deck.length} từ)`;
        }
        if (this.dom.btnSaveAllFcText) {
            this.dom.btnSaveAllFcText.textContent = '⭐ Đã Trong Sổ';
        }

        this.renderCurrentFlashcard();
        if (this.dom.flashcardsModal) {
            this.dom.flashcardsModal.style.display = 'flex';
            if (window.lucide) window.lucide.createIcons();
        }
    }

    updateVocabCountBadge() {
        if (this.dom.notebookCount) {
            this.dom.notebookCount.textContent = this.savedVocab.length;
        }
    }

    toggleCurrentFavorite() {
        if (!this.subtitles || this.subtitles.length === 0) return;
        const currentSub = this.subtitles[this.activeIndex];
        if (!currentSub) return;

        const idx = this.favorites.findIndex(f => f.hanzi === currentSub.hanzi && f.start === currentSub.start);
        if (idx >= 0) {
            this.favorites.splice(idx, 1);
            this.dom.btnToggleFavorite?.classList.remove('active');
        } else {
            this.favorites.push({
                hanzi: currentSub.hanzi,
                pinyin: currentSub.pinyin,
                vietnamese: currentSub.vietnamese,
                start: currentSub.start,
                duration: currentSub.duration,
                videoId: this.currentVideoId,
                addedAt: new Date().toLocaleDateString('vi-VN')
            });
            this.dom.btnToggleFavorite?.classList.add('active');
        }

        try {
            localStorage.setItem('cs_favorite_sentences', JSON.stringify(this.favorites));
        } catch (e) {}

        this.updateFavCountBadge();

        // Đồng bộ câu yêu thích lên Cloud
        window.authManager?.syncWithServer({ favorite_sentences: this.favorites, replace_favorites: true });
    }

    updateFavCountBadge() {
        if (this.dom.favCount) this.dom.favCount.textContent = this.favorites.length;
    }

    openFavoritesModal() {
        this.renderFavoritesList();
        if (this.dom.favoritesModal) {
            this.dom.favoritesModal.style.display = 'flex';
            if (window.lucide) window.lucide.createIcons();
        }
    }

    closeFavoritesModal() {
        if (this.dom.favoritesModal) this.dom.favoritesModal.style.display = 'none';
    }

    renderFavoritesList() {
        if (!this.dom.favoritesList) return;
        this.updateFavCountBadge();

        if (this.favorites.length === 0) {
            this.dom.favoritesList.innerHTML = `
                <div class="empty-fav-state" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="star-off" style="width: 36px; height: 36px; margin-bottom: 8px;"></i>
                    <p>Bạn chưa lưu câu nào. Hãy bấm ngôi sao ⭐ trên câu thoại để lưu vào đây nhé!</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        this.dom.favoritesList.innerHTML = '';
        this.favorites.forEach((fav, index) => {
            const item = document.createElement('div');
            item.className = 'fav-item';
            item.innerHTML = `
                <div class="fav-content-col" title="Bấm để phát âm và nhảy tới câu này">
                    <div class="fav-hanzi">${fav.hanzi}</div>
                    <div class="fav-pinyin">${fav.pinyin || ''}</div>
                    <div class="fav-vn">🇻🇳 ${fav.vietnamese || ''}</div>
                </div>
                <div class="fav-actions-group">
                    <button class="btn-fav-play" title="Nghe phát âm">
                        <i data-lucide="volume-2"></i>
                    </button>
                    <button class="btn-fav-remove" title="Xóa khỏi yêu thích">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;

            // Click play & jump
            item.querySelector('.fav-content-col')?.addEventListener('click', () => {
                this.closeFavoritesModal();
                this.speakChineseText(fav.hanzi);
                const subIndex = this.subtitles.findIndex(s => s.hanzi === fav.hanzi);
                if (subIndex >= 0) this.jumpToSentence(subIndex);
            });
            item.querySelector('.btn-fav-play')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speakChineseText(fav.hanzi);
            });
            item.querySelector('.btn-fav-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.favorites.splice(index, 1);
                try {
                    localStorage.setItem('cs_favorite_sentences', JSON.stringify(this.favorites));
                } catch (err) {}
                this.renderFavoritesList();
                // Check if current active sentence un-starred
                const currentSub = this.subtitles[this.activeIndex];
                if (currentSub && currentSub.hanzi === fav.hanzi) {
                    this.dom.btnToggleFavorite?.classList.remove('active');
                }
                // Đồng bộ xóa câu yêu thích lên Cloud
                window.authManager?.syncWithServer({ favorite_sentences: this.favorites, replace_favorites: true });
            });

            this.dom.favoritesList.appendChild(item);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // ==========================================
    // 3D AI FLASHCARDS (PRO FEATURE)
    // ==========================================
    async handleOpenFlashcards() {
        if (!this.subtitles || this.subtitles.length === 0) {
            alert("Vui lòng tải video bài học trước khi tạo Flashcards!");
            return;
        }

        // KIỂM TRA QUYỀN TÀI KHOẢN PRO
        if (!window.authManager.isPro()) {
            const accept = confirm("💎 Tính năng 'AI Tạo Flashcard 3D Từ Video' là đặc quyền của Tài Khoản PRO.\n\nNâng cấp ngay chỉ với 2.000đ / 7 ngày để mở khóa toàn bộ tính năng VIP?");
            if (accept) {
                this.startVietQRPayment('week_7d');
            }
            return;
        }

        // Đã là PRO: Gọi API tạo flashcards từ video
        this.dom.btnOpenFlashcards.disabled = true;
        this.dom.btnOpenFlashcards.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Đang tạo thẻ...</span>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await fetch('/api/generate-flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: this.currentVideoId || "",
                    subtitles: this.subtitles
                })
            });

            const data = await res.json();
            if (data.success && data.flashcards && data.flashcards.length > 0) {
                this.flashcards = data.flashcards;
                this.currentFcIndex = 0;
                if (this.dom.flashcardModalTitle) {
                    this.dom.flashcardModalTitle.textContent = "Flashcard AI Từ Video";
                }
                if (this.dom.btnSaveAllFcText) {
                    this.dom.btnSaveAllFcText.textContent = "⭐ Lưu Tất Cả Vào Sổ";
                }
                this.renderCurrentFlashcard();
                if (this.dom.flashcardsModal) {
                    this.dom.flashcardsModal.style.display = 'flex';
                    if (window.lucide) window.lucide.createIcons();
                }
            } else {
                alert("Không thể tạo flashcards cho video này.");
            }
        } catch (e) {
            alert(`Lỗi tạo flashcards: ${e.message}`);
        } finally {
            this.dom.btnOpenFlashcards.disabled = false;
            this.dom.btnOpenFlashcards.innerHTML = `<i data-lucide="layers"></i><span>🎴 Flashcard AI (PRO)</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    renderCurrentFlashcard() {
        if (!this.flashcards || this.flashcards.length === 0) return;
        const card = this.flashcards[this.currentFcIndex];
        if (!card) return;

        // Reset flip state to front
        this.dom.flashcardElement?.classList.remove('is-flipped');

        if (this.dom.fcFrontLevel) this.dom.fcFrontLevel.textContent = card.level || "HSK Từ Vựng";
        if (this.dom.fcFrontHanzi) this.dom.fcFrontHanzi.textContent = card.hanzi;
        if (this.dom.fcBackPinyin) this.dom.fcBackPinyin.textContent = card.pinyin;
        if (this.dom.fcBackVn) this.dom.fcBackVn.textContent = card.vietnamese;
        if (this.dom.fcBackSentence) this.dom.fcBackSentence.textContent = card.context_sentence || "";
        if (this.dom.fcBackSentenceVn) this.dom.fcBackSentenceVn.textContent = card.context_vn ? `🇻🇳 ${card.context_vn}` : "";
        if (this.dom.fcCounter) this.dom.fcCounter.textContent = `${this.currentFcIndex + 1} / ${this.flashcards.length}`;
    }

    navigateFlashcard(step) {
        if (!this.flashcards || this.flashcards.length === 0) return;
        this.currentFcIndex += step;
        if (this.currentFcIndex < 0) this.currentFcIndex = this.flashcards.length - 1;
        if (this.currentFcIndex >= this.flashcards.length) this.currentFcIndex = 0;
        this.renderCurrentFlashcard();
    }

    closeFlashcardsModal() {
        if (this.dom.flashcardsModal) this.dom.flashcardsModal.style.display = 'none';
    }

    // ==========================================
    // REAL-TIME VIETQR PAYMENT
    // ==========================================
    async startVietQRPayment(planType) {
        if (!window.authManager.isAuthenticated()) {
            this.openAuthModal();
            return;
        }

        const user = window.authManager.getUser();
        this.currentPaymentPlan = planType;

        try {
            const res = await fetch('/api/payment/create-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_type: planType,
                    user_email: user.email,
                    user_name: user.name
                })
            });

            const data = await res.json();
            if (data.success) {
                this.currentPaymentOrder = data.order_code;
                if (this.dom.paymentPlanTitle) this.dom.paymentPlanTitle.textContent = `Thanh Toán ${data.plan_name}`;
                if (this.dom.paymentQrImg) this.dom.paymentQrImg.src = data.qr_url;
                if (this.dom.paymentAmountText) this.dom.paymentAmountText.textContent = data.amount_formatted;
                if (this.dom.paymentDescText) this.dom.paymentDescText.textContent = data.description;
                if (this.dom.paymentBankText) this.dom.paymentBankText.textContent = `${data.bank_name} - STK: ${data.account_no}`;

                if (this.dom.paymentModal) {
                    this.dom.paymentModal.style.display = 'flex';
                    if (window.lucide) window.lucide.createIcons();
                    // Bắt đầu lắng nghe biến động thanh toán Realtime tự động
                    this.startPaymentPolling(this.currentPaymentOrder);
                }
            }
        } catch (e) {
            alert(`Lỗi tạo mã QR thanh toán: ${e.message}`);
        }
    }

    startPaymentPolling(orderCode) {
        if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);

        this.paymentPollingInterval = setInterval(async () => {
            if (!orderCode || !this.dom.paymentModal || this.dom.paymentModal.style.display === 'none') {
                clearInterval(this.paymentPollingInterval);
                return;
            }

            try {
                const res = await fetch(`/api/payment/check-status/${orderCode}`);
                const data = await res.json();
                if (data.success && data.paid) {
                    clearInterval(this.paymentPollingInterval);
                    window.authManager.upgradeToPro(data.plan_type, data.days_valid, data.expires_at);
                    
                    if (this.dom.btnConfirmPaymentPaid) {
                        this.dom.btnConfirmPaymentPaid.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                        this.dom.btnConfirmPaymentPaid.innerHTML = `<i data-lucide="check-circle-2"></i><span>✅ Đã Nhận Tiền Thành Công!</span>`;
                    }
                    if (window.lucide) window.lucide.createIcons();

                    setTimeout(() => {
                        alert(`🎉 HỆ THỐNG ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG!\n\n👑 Tài khoản của bạn đã được nâng cấp lên PRO VIP (Hạn dùng: đến ngày ${data.expires_at}).\nToàn bộ tính năng AI Flashcards và luyện phát âm không giới hạn đã được mở khóa!`);
                        this.closePaymentModal();
                    }, 500);
                }
            } catch (e) {
                console.log("Polling payment status:", e);
            }
        }, 2500);
    }

    async confirmVietQRPayment() {
        const user = window.authManager.getUser();
        if (!user) return;

        this.dom.btnConfirmPaymentPaid.disabled = true;
        this.dom.btnConfirmPaymentPaid.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Đang kiểm tra giao dịch...</span>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await fetch('/api/payment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_code: this.currentPaymentOrder || "CSPRO888888",
                    plan_type: this.currentPaymentPlan,
                    user_email: user.email
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
                window.authManager.upgradeToPro(data.plan_type, data.days_valid, data.expires_at);
                alert(`${data.message}\n\nThời hạn PRO: đến ngày ${data.expires_at}\nBây giờ bạn có thể sử dụng trọn bộ tính năng Flashcard AI và luyện nói không giới hạn!`);
                this.closePaymentModal();
            } else {
                alert(data.detail || "Hệ thống PayOS chưa nhận được tiền từ ngân hàng. Vui lòng quét mã QR để chuyển khoản!");
            }
        } catch (e) {
            alert(`Lỗi kiểm tra thanh toán: ${e.message}`);
        } finally {
            this.dom.btnConfirmPaymentPaid.disabled = false;
            this.dom.btnConfirmPaymentPaid.innerHTML = `<i data-lucide="refresh-cw"></i><span>Kiểm Tra Trạng Thái Thanh Toán</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    closePaymentModal() {
        if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
        if (this.dom.paymentModal) this.dom.paymentModal.style.display = 'none';
    }

    async checkAIStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            if (data.gemini_configured) {
                this.dom.aiStatusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">AI Đang Hoạt Động</span>`;
            } else {
                this.dom.aiStatusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">AI Đang Hoạt Động</span>`;
            }
        } catch (e) {
            console.log("Status check:", e);
        }
    }

    async loadSampleVideos() {
        try {
            const res = await fetch('/api/lessons');
            const data = await res.json();
            const lessons = data.lessons || [];

            if (lessons && lessons.length > 0) {
                if (this.dom.samplesContainer) this.dom.samplesContainer.style.display = 'flex';
                this.dom.sampleVideosList.innerHTML = '';
                lessons.forEach((sample) => {
                    const chip = document.createElement('div');
                    chip.className = 'sample-chip';
                    chip.innerHTML = `<span>${sample.title}</span> <span class="tag-pill cyan" style="font-size:0.65rem;">${sample.level || ''}</span>`;
                    chip.addEventListener('click', () => {
                        this.dom.urlInput.value = sample.youtube_url;
                        this.dom.btnClearUrl.style.display = 'flex';
                        // Highlight active chip
                        document.querySelectorAll('.sample-chip').forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        this.handleLoadVideo(sample.youtube_url);
                    });
                    this.dom.sampleVideosList.appendChild(chip);
                });
            } else {
                if (this.dom.samplesContainer) this.dom.samplesContainer.style.display = 'none';
            }
        } catch (e) {
            console.error("Failed to load admin lessons:", e);
            if (this.dom.samplesContainer) this.dom.samplesContainer.style.display = 'none';
        }
    }

    async handleLoadVideo(providedUrl = null) {
        const url = providedUrl || this.dom.urlInput.value.trim();
        if (!url) {
            alert("Vui lòng nhập đường link video YouTube tiếng Trung!");
            return;
        }

        // BẮT BUỘC ĐĂNG NHẬP (FIREBASE GOOGLE / EMAIL OTP)
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            this.pendingVideoUrl = url;
            this.openAuthModal();
            return;
        }

        // Show loading state
        this.dom.btnLoadVideo.disabled = true;
        this.dom.btnLoadVideo.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Đang xử lý...</span>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await fetch('/api/video-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            let data;
            try {
                data = await res.json();
            } catch(jsonErr) {
                throw new Error("Máy chủ phản hồi lỗi. Vui lòng thử lại với video khác hoặc kiểm tra kết nối mạng!");
            }

            if (!res.ok || !data.success) {
                throw new Error(data.detail || "Không thể tải video!");
            }

            const videoId = data.metadata.video_id;
            this.subtitles = data.subtitles || [];
            this.currentVideoId = videoId;
            this.activeIndex = 0;

            // Initialize / Load YouTube Player
            this.initOrLoadYouTubePlayer(videoId);

            // Render Subtitles List
            this.renderSubtitlesList();

            // Set Active Sentence
            if (this.subtitles.length > 0) {
                this.updateActiveSentence(0, false);
            }

            // Hide Placeholder
            this.dom.playerPlaceholder.style.display = 'none';

        } catch (err) {
            alert(`Lỗi: ${err.message}`);
        } finally {
            this.dom.btnLoadVideo.disabled = false;
            this.dom.btnLoadVideo.innerHTML = `<i data-lucide="sparkles"></i><span>Tải Bài Học</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    initOrLoadYouTubePlayer(videoId) {
        if (!this.player && window.YT && window.YT.Player) {
            this.player = new window.YT.Player('youtubePlayer', {
                videoId: videoId,
                playerVars: {
                    playsinline: 1,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1
                },
                events: {
                    onReady: (e) => {
                        this.playerReady = true;
                        this.startTimeSync();
                        this.setSpeed(this.playbackSpeed);
                    },
                    onStateChange: (e) => {
                        this.onPlayerStateChange(e);
                    }
                }
            });
        } else if (this.player && this.player.loadVideoById) {
            this.player.loadVideoById(videoId);
        } else {
            // Wait for YT API to be available
            window.onYouTubeIframeAPIReady = () => {
                this.initOrLoadYouTubePlayer(videoId);
            };
        }
    }

    onPlayerStateChange(event) {
        // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3
        if (event.data === 1) {
            this.dom.btnPlayPause.innerHTML = `<i data-lucide="pause"></i><span class="play-btn-label">Tạm Dừng</span>`;
            if (this.dom.mobPlayBtn) {
                this.dom.mobPlayBtn.innerHTML = `<i data-lucide="pause"></i>`;
            }
        } else {
            this.dom.btnPlayPause.innerHTML = `<i data-lucide="play"></i><span class="play-btn-label">Phát Toàn Bài</span>`;
            if (this.dom.mobPlayBtn) {
                this.dom.mobPlayBtn.innerHTML = `<i data-lucide="play"></i>`;
            }
        }
        if (window.lucide) window.lucide.createIcons();
    }

    togglePlayPause() {
        if (!this.player) {
            if (this.currentVideoId) {
                this.initOrLoadYouTubePlayer(this.currentVideoId);
            }
            return;
        }

        try {
            const state = typeof this.player.getPlayerState === 'function' ? this.player.getPlayerState() : -1;
            if (state === 1) { // Currently playing -> Pause
                this.player.pauseVideo();
            } else { // Currently paused or unstarted -> Play
                // Reset pause flag so user can continue playing smoothly
                this.hasPausedForCurrentSub = true;
                this.player.playVideo();
            }
        } catch (e) {
            console.log("Toggle play/pause error:", e);
            try { this.player.playVideo(); } catch(err) {}
        }
    }

    startTimeSync() {
        if (this.timeSyncInterval) clearInterval(this.timeSyncInterval);

        this.timeSyncInterval = setInterval(() => {
            if (!this.player || !this.player.getCurrentTime || !this.subtitles.length) return;
            if (this.isSeeking) return;

            const currentTime = this.player.getCurrentTime();
            // Bù độ trễ âm thanh/thị giác (120ms) để phụ đề bắt nhịp tức thì đúng từng âm
            const effectiveTime = currentTime + 0.12;
            const firstSub = this.subtitles[0];

            // 0. Xử lý đoạn mở đầu / Nhạc Intro của Video
            if (firstSub && currentTime < firstSub.start - 0.2) {
                this.renderIntroState(currentTime, firstSub.start);
                return;
            }

            const currentSub = this.subtitles[this.activeIndex];

            // 1. Sentence Loop Logic
            if (this.isLooping && currentSub) {
                if (currentTime >= currentSub.end || currentTime < currentSub.start - 0.5) {
                    this.player.seekTo(currentSub.start, true);
                    this.player.playVideo();
                    return;
                }
            }

            // 2. Auto Pause at sentence end for Shadowing Practice (only when checked)
            if (this.isAutoPause && currentSub && !this.isLooping && !this.hasPausedForCurrentSub) {
                if (currentTime >= currentSub.end && currentTime <= currentSub.end + 0.5) {
                    this.hasPausedForCurrentSub = true;
                    this.player.pauseVideo();
                    return;
                }
            }

            // 3. Khớp chính xác câu thoại theo thời gian thực (Zero-latency)
            let matchedIndex = -1;
            for (let i = 0; i < this.subtitles.length; i++) {
                const sub = this.subtitles[i];
                const nextSub = this.subtitles[i + 1];
                const sentenceEnd = nextSub ? nextSub.start : (sub.end + 1.0);

                if (effectiveTime >= sub.start && effectiveTime < sentenceEnd) {
                    matchedIndex = i;
                    break;
                }
            }

            if (matchedIndex !== -1 && matchedIndex !== this.activeIndex) {
                this.hasPausedForCurrentSub = false; // Reset for new sentence
                this.updateActiveSentence(matchedIndex, false);
            }

            // 4. Karaoke theo từng chữ Hán trong câu hiện tại
            this.updateCharacterKaraoke(currentTime);
        }, 25); // 40 FPS siêu mượt
    }

    updateCharacterKaraoke(currentTime) {
        const sub = this.subtitles[this.activeIndex];
        if (!sub || !sub.tokens || sub.tokens.length === 0) return;

        const elapsed = currentTime - sub.start;
        const duration = Math.max(sub.duration, 0.5);
        const progress = Math.max(0, Math.min(elapsed / duration, 1));
        const activeCharIdx = Math.floor(progress * sub.tokens.length);

        const tokenEls = this.dom.hanziDisplay.querySelectorAll('.hanzi-char-token');
        tokenEls.forEach((el, idx) => {
            if (idx === activeCharIdx) {
                el.classList.add('karaoke-active');
                el.classList.remove('karaoke-spoken');
            } else if (idx < activeCharIdx) {
                el.classList.remove('karaoke-active');
                el.classList.add('karaoke-spoken');
            } else {
                el.classList.remove('karaoke-active');
                el.classList.remove('karaoke-spoken');
            }
        });
    }

    renderIntroState(currentTime, firstSpokenStart) {
        const formatTime = (secs) => {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        };

        const remainSecs = Math.max(0, Math.ceil(firstSpokenStart - currentTime));
        this.dom.sentenceIndexText.textContent = `🎬 Nhạc mở đầu (Intro)`;
        this.dom.timestampBadge.textContent = `${formatTime(currentTime)} / ${formatTime(firstSpokenStart)}`;
        this.dom.pinyinDisplay.textContent = `🎵 (Đang phát đoạn nhạc dạo mở đầu video...)`;
        this.dom.hanziDisplay.innerHTML = `<span style="color: var(--primary-cyan); font-size: 1.5rem;">🎵 准备开始朗读 (${remainSecs}s)...</span>`;
        this.dom.vnDisplay.textContent = `Đoạn nhạc mở đầu video. Bài học Câu 1 sẽ bắt đầu vào giây ${formatTime(firstSpokenStart)}. Bạn có thể bấm thẳng vào Câu 1 bên phải để bỏ qua Intro!`;

        // Bỏ highlight câu trong danh sách khi đang phát intro
        document.querySelectorAll('.sub-item-card').forEach(card => card.classList.remove('active'));
    }

    renderSubtitlesList(filteredList = null) {
        const listToRender = filteredList || this.subtitles;
        this.dom.subCount.textContent = listToRender.length;
        this.dom.subtitlesList.innerHTML = '';

        if (listToRender.length === 0) {
            this.dom.subtitlesList.innerHTML = `
                <div class="empty-sub-state">
                    <p>Không tìm thấy câu phù hợp.</p>
                </div>
            `;
            return;
        }

        listToRender.forEach((sub) => {
            const card = document.createElement('div');
            card.className = `sub-item-card ${sub.index === this.activeIndex ? 'active' : ''}`;
            card.id = `sub-card-${sub.index}`;

            const formatTime = (secs) => {
                const m = Math.floor(secs / 60);
                const s = Math.floor(secs % 60);
                return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            };

            card.innerHTML = `
                <div class="sub-item-top">
                    <span class="sub-item-time">${formatTime(sub.start)} - ${formatTime(sub.end)}</span>
                    <span class="sub-item-pinyin">${sub.pinyin}</span>
                </div>
                <div class="sub-item-hanzi">${sub.hanzi}</div>
                <div class="sub-item-vn">${sub.vietnamese || ''}</div>
            `;

            card.addEventListener('click', () => {
                this.jumpToSentence(sub.index);
            });

            this.dom.subtitlesList.appendChild(card);
        });
    }

    updateActiveSentence(index, shouldSeek = true) {
        if (index < 0 || index >= this.subtitles.length) return;

        this.activeIndex = index;
        this.hasPausedForCurrentSub = false;
        const sub = this.subtitles[index];

        // Format timestamps
        const formatTime = (secs) => {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        };

        this.dom.sentenceIndexText.textContent = `Câu ${index + 1} / ${this.subtitles.length}`;
        this.dom.timestampBadge.textContent = `${formatTime(sub.start)} - ${formatTime(sub.end)}`;
        this.dom.pinyinDisplay.textContent = sub.pinyin;
        
        // Render Interactive Characters (Hanzi)
        this.renderHanziTokens(sub);
        this.dom.vnDisplay.textContent = sub.vietnamese || "(Đang tải bản dịch...)";

        // Highlight in subtitle list
        document.querySelectorAll('.sub-item-card').forEach(card => card.classList.remove('active'));
        const activeCard = document.getElementById(`sub-card-${index}`);
        if (activeCard) {
            activeCard.classList.add('active');
            if (!this.isScrollLocked) {
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Update favorite star button state
        if (this.dom.btnToggleFavorite && this.favorites) {
            const isFav = this.favorites.some(f => f.hanzi === sub.hanzi && f.start === sub.start);
            this.dom.btnToggleFavorite.classList.toggle('active', isFav);
        }

        // Seek video if requested
        if (shouldSeek && this.player && this.player.seekTo) {
            this.isSeeking = true;
            this.player.seekTo(sub.start, true);
            this.player.playVideo();
            setTimeout(() => {
                this.isSeeking = false;
            }, 450);
        }
    }

    renderHanziTokens(sub) {
        if (!sub.tokens || sub.tokens.length === 0) {
            this.dom.hanziDisplay.textContent = sub.hanzi;
            return;
        }

        this.dom.hanziDisplay.innerHTML = '';
        sub.tokens.forEach(tok => {
            const span = document.createElement('span');
            span.className = `hanzi-char-token tone-${tok.tone}`;
            span.textContent = tok.hanzi;
            span.title = `${tok.pinyin} (Thanh ${tok.tone}) - Bấm để tra cứu đa nghĩa & lưu vào Sổ Từ Vựng PRO`;
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleVocabClick(tok.hanzi, sub);
            });
            this.dom.hanziDisplay.appendChild(span);
        });
    }

    jumpToSentence(index) {
        if (!this.subtitles || this.subtitles.length === 0) return;
        if (index < 0) index = 0;
        if (index >= this.subtitles.length) index = this.subtitles.length - 1;
        this.updateActiveSentence(index, true);
    }

    playCurrentSentence() {
        if (!this.subtitles || this.subtitles.length === 0) return;
        const currentSub = this.subtitles[this.activeIndex];
        if (this.player && this.player.seekTo) {
            this.player.seekTo(currentSub.start, true);
            this.player.playVideo();
        }
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.dom.btnLoop.classList.toggle('active-loop', this.isLooping);
        if (this.isLooping) {
            this.playCurrentSentence();
        }
    }

    setSpeed(speed) {
        this.playbackSpeed = speed;
        if (this.player && this.player.setPlaybackRate) {
            this.player.setPlaybackRate(speed);
        }
    }

    filterSubtitles(keyword) {
        if (!keyword.trim()) {
            this.renderSubtitlesList();
            return;
        }
        const term = keyword.toLowerCase();
        const filtered = this.subtitles.filter(
            s => s.hanzi.toLowerCase().includes(term) ||
                 s.pinyin.toLowerCase().includes(term) ||
                 (s.vietnamese && s.vietnamese.toLowerCase().includes(term))
        );
        this.renderSubtitlesList(filtered);
    }

    // ==========================================
    // SPEECH SYNTHESIS (TTS) - CHINESE NATIVE AUDIO
    // ==========================================
    speakNativeAudio() {
        if (!this.subtitles.length) return;
        const sub = this.subtitles[this.activeIndex];
        this.speakChineseWord(sub.hanzi, 0.88);
    }

    speakChineseText(text, rate = 0.9) {
        this.speakChineseWord(text, rate);
    }

    speakChineseWord(text, rate = 0.9) {
        if (!text) return;
        const cleanText = text.trim();

        // 1. Thử dùng Web Speech API (Local Browser Engine)
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = 'zh-CN';
                utterance.rate = rate;

                const voices = window.speechSynthesis.getVoices();
                const chineseVoice = voices.find(v => v.lang && (v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('CN')));
                if (chineseVoice) {
                    utterance.voice = chineseVoice;
                }

                // Nếu trình duyệt không phát được -> Tự động chuyển sang Audio Online
                utterance.onerror = () => {
                    this.playOnlineChineseTTS(cleanText);
                };

                window.speechSynthesis.speak(utterance);
                return;
            } catch (e) {
                console.log("Web SpeechSynthesis error:", e);
            }
        }

        // 2. Fallback sang Youdao / Google Online TTS Audio
        this.playOnlineChineseTTS(cleanText);
    }

    playOnlineChineseTTS(text) {
        try {
            // Chuẩn âm thanh phát âm bản xứ Youdao / Google
            const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1`;
            const audio = new Audio(youdaoUrl);
            audio.play().catch(() => {
                const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${encodeURIComponent(text)}`;
                const gAudio = new Audio(googleUrl);
                gAudio.play().catch(err => console.log("Online TTS playback error:", err));
            });
        } catch (err) {
            console.log("Audio error:", err);
        }
    }

    // ==========================================
    // SPEECH RECOGNITION & RECORDING (100% RELIABLE)
    // ==========================================
    initSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            this.speechRecognizer = new SpeechRec();
            this.speechRecognizer.continuous = false;
            this.speechRecognizer.interimResults = true;
            this.speechRecognizer.lang = 'zh-CN';

            this.speechRecognizer.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                this.recognizedText = transcript;
                this.dom.recStatusText.textContent = `Nghe thấy: "${transcript}"`;
            };

            this.speechRecognizer.onerror = (e) => {
                console.log("SpeechRec error:", e.error);
            };
        }
    }

    async toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopRecordingAndEvaluate();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        if (this.subtitles.length === 0) {
            alert("Vui lòng tải một bài học trước khi ghi âm.");
            return;
        }

        // KIỂM TRA GIỚI HẠN 3 LƯỢT DÙNG MIỄN PHÍ
        if (!window.authManager || !window.authManager.hasFreeTurnsLeft()) {
            this.openProUpgradeModal("quota_exceeded");
            return;
        }

        // Pause video playback while recording
        if (this.player && this.player.pauseVideo) {
            this.player.pauseVideo();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];
            this.recognizedText = "";

            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.audioChunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                this.processRecordedAudio();
            };

            this.mediaRecorder.start();
            if (this.speechRecognizer) {
                try { this.speechRecognizer.start(); } catch(e) {}
            }

            this.isRecording = true;
            this.updateRecordingUI(true);

        } catch (err) {
            alert("Không thể truy cập Micro. Vui lòng cho phép quyền truy cập Micro trên trình duyệt để ghi âm!");
            console.error("Mic Access Error:", err);
        }
    }

    stopRecordingAndEvaluate() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            if (this.speechRecognizer) {
                try { this.speechRecognizer.stop(); } catch(e) {}
            }
            this.isRecording = false;
            this.updateRecordingUI(false);
        }
    }

    updateRecordingUI(recording) {
        if (recording) {
            this.dom.btnRecordVoice.classList.add('recording');
            this.dom.micBtnText.textContent = "Dừng & Chấm Điểm";
            this.dom.recordingStatusBar.style.display = 'flex';
            this.dom.recStatusText.textContent = "Đang lắng nghe bạn đọc tiếng Trung...";
            this.dom.mobRecordBtn?.classList.add('recording');
        } else {
            this.dom.btnRecordVoice.classList.remove('recording');
            this.dom.micBtnText.textContent = "Bấm Để Ghi Âm & Chấm Điểm";
            this.dom.recordingStatusBar.style.display = 'none';
            this.dom.mobRecordBtn?.classList.remove('recording');
        }
        if (window.lucide) window.lucide.createIcons();
    }

    async processRecordedAudio() {
        const activeSub = this.subtitles[this.activeIndex];
        if (!activeSub) return;

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1] || "";
            
            // Show loading modal
            this.showEvaluationLoading();

            try {
                const userEmail = window.authManager?.getUser()?.email || "";
                const response = await fetch('/api/evaluate-pronunciation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_text: activeSub.hanzi,
                        user_speech_text: this.recognizedText,
                        audio_base64: base64Audio,
                        mime_type: 'audio/webm',
                        user_email: userEmail
                    })
                });

                const data = await response.json();

                // Nếu hết lượt dùng miễn phí từ phía Server
                if (data.quota_exceeded) {
                    this.closeEvaluationModal();
                    this.openProUpgradeModal("quota_exceeded");
                    return;
                }

                if (!response.ok || !data.success) {
                    throw new Error(data.detail || data.message || "Lỗi chấm điểm phát âm.");
                }

                // Tiêu thụ 1 lượt dùng thử cho tài khoản FREE
                const newRemaining = window.authManager?.consumeFreeTurn();
                this.updateTurnBadges();

                this.renderEvaluationResult(data.result, newRemaining);

            } catch (err) {
                alert(`Lỗi phân tích phát âm: ${err.message}`);
                this.closeEvaluationModal();
            }
        };
    }

    showEvaluationLoading() {
        this.dom.evalModal.style.display = 'flex';
        this.dom.overallScoreNum.textContent = "--";
        this.dom.overallGauge.style.setProperty('--score-pct', 0);
        this.dom.toneScoreNum.textContent = "--";
        this.dom.fluencyScoreNum.textContent = "--";
        this.dom.accuracyScoreNum.textContent = "--";
        this.dom.evalTargetText.textContent = this.subtitles[this.activeIndex]?.hanzi || "";
        this.dom.evalHeardText.textContent = "AI đang lắng nghe và phân tích thanh điệu...";
        this.dom.errorsSection.style.display = 'none';
        this.dom.aiFeedbackText.textContent = "AI đang phân tích và chấm điểm phát âm...";
        if (this.dom.evalTurnStatusBox) this.dom.evalTurnStatusBox.style.display = 'none';
        if (window.lucide) window.lucide.createIcons();
    }

    renderEvaluationResult(res, newRemaining = null) {
        const score = res.overall_score || 80;
        this.dom.overallScoreNum.textContent = score;
        this.dom.overallGauge.style.setProperty('--score-pct', score);
        
        this.dom.toneScoreNum.textContent = `${res.tone_accuracy || 80}%`;
        this.dom.fluencyScoreNum.textContent = `${res.fluency_score || 85}%`;
        this.dom.accuracyScoreNum.textContent = `${res.accuracy_score || 80}%`;

        this.dom.evalTargetText.textContent = `${res.target_text} (${res.target_pinyin || ''})`;
        this.dom.evalHeardText.textContent = res.transcribed_text || "(Không nhận diện được rõ âm)";
        this.dom.aiFeedbackText.textContent = res.feedback_vn || "Chúc mừng bạn đã hoàn thành bài luyện nói!";

        // Errors Breakdown
        if (res.mispronounced_words && res.mispronounced_words.length > 0) {
            this.dom.errorsSection.style.display = 'flex';
            this.dom.errorItemsList.innerHTML = '';
            res.mispronounced_words.forEach(err => {
                const item = document.createElement('div');
                item.className = 'error-item';
                item.innerHTML = `
                    <div class="error-word-row">
                        <span class="err-hanzi">${err.word}</span>
                        <span class="err-pinyin">Đúng: ${err.expected_pinyin} | AI nghe: ${err.heard_pinyin || 'chưa rõ'}</span>
                    </div>
                    <div class="err-tip">💡 <strong>Mẹo sửa:</strong> ${err.tip || err.issue}</div>
                `;
                this.dom.errorItemsList.appendChild(item);
            });
        } else {
            this.dom.errorsSection.style.display = 'none';
        }

        // Cập nhật thông báo số lượt dùng còn lại trong Modal Chấm Điểm
        if (this.dom.evalTurnStatusBox && this.dom.evalTurnStatusText) {
            const isPro = window.authManager?.isPro();
            if (isPro) {
                this.dom.evalTurnStatusBox.style.display = 'none';
            } else {
                this.dom.evalTurnStatusBox.style.display = 'flex';
                const rem = newRemaining !== null ? newRemaining : window.authManager?.getRemainingFreeTurns();
                if (rem > 0) {
                    this.dom.evalTurnStatusBox.classList.remove('exhausted');
                    this.dom.evalTurnStatusText.textContent = `🎁 Bạn còn ${rem}/3 lượt trải nghiệm AI miễn phí. Nâng cấp PRO để luyện tập không giới hạn!`;
                } else {
                    this.dom.evalTurnStatusBox.classList.add('exhausted');
                    this.dom.evalTurnStatusText.textContent = `⚠️ Bạn đã dùng hết 3 lượt trải nghiệm AI miễn phí! Nâng cấp ngay lên PRO để tiếp tục.`;
                }
            }
        }

        if (window.lucide) window.lucide.createIcons();
    }

    closeEvaluationModal() {
        this.dom.evalModal.style.display = 'none';
    }

    // ==========================================
    // FREE TURNS LIMIT & PRO UPGRADE MODAL LOGIC
    // ==========================================
    updateTurnBadges() {
        if (!window.authManager) return;
        const isPro = window.authManager.isPro();
        const remaining = window.authManager.getRemainingFreeTurns();
        const used = window.authManager.getFreeUsageCount();

        // 1. Header Turn Badge
        if (this.dom.headerTurnBadge && this.dom.headerTurnText) {
            if (isPro) {
                this.dom.headerTurnBadge.className = 'turn-counter-badge is-pro';
                this.dom.headerTurnText.textContent = '👑 PRO VIP';
                if (this.dom.btnHeaderUpgradePro) this.dom.btnHeaderUpgradePro.style.display = 'none';
            } else if (remaining > 0) {
                this.dom.headerTurnBadge.className = 'turn-counter-badge';
                this.dom.headerTurnText.textContent = `🎁 AI: Còn ${remaining}/3`;
                if (this.dom.btnHeaderUpgradePro) {
                    this.dom.btnHeaderUpgradePro.style.display = 'inline-block';
                    this.dom.btnHeaderUpgradePro.textContent = 'Nâng Cấp';
                }
            } else {
                this.dom.headerTurnBadge.className = 'turn-counter-badge is-exhausted';
                this.dom.headerTurnText.textContent = '⚠️ Hết Lượt Free';
                if (this.dom.btnHeaderUpgradePro) {
                    this.dom.btnHeaderUpgradePro.style.display = 'inline-block';
                    this.dom.btnHeaderUpgradePro.textContent = 'Nâng Cấp';
                }
            }
        }

        // 2. Practice Area Turn Status
        if (this.dom.practiceTurnStatus && this.dom.practiceTurnText) {
            if (isPro) {
                this.dom.practiceTurnStatus.className = 'turn-status-bar pro-active';
                this.dom.practiceTurnText.textContent = '👑 Tài khoản PRO VIP: Luyện tập không giới hạn';
                if (this.dom.btnPracticeUpgrade) this.dom.btnPracticeUpgrade.style.display = 'none';
            } else if (remaining > 0) {
                this.dom.practiceTurnStatus.className = 'turn-status-bar';
                this.dom.practiceTurnText.textContent = `🎁 Dùng thử AI: Còn ${remaining}/3 lượt miễn phí`;
                if (this.dom.btnPracticeUpgrade) this.dom.btnPracticeUpgrade.style.display = 'inline-block';
            } else {
                this.dom.practiceTurnStatus.className = 'turn-status-bar exhausted';
                this.dom.practiceTurnText.textContent = '⚠️ Đã hết 3 lượt dùng thử miễn phí - Nâng cấp PRO để tiếp tục';
                if (this.dom.btnPracticeUpgrade) this.dom.btnPracticeUpgrade.style.display = 'inline-block';
            }
        }

        if (window.lucide) window.lucide.createIcons();
    }

    openProUpgradeModal(reason = "") {
        if (!this.dom.proUpgradeModal) return;
        if (reason === "quota_exceeded") {
            if (this.dom.proUpgradeModalTitle) this.dom.proUpgradeModalTitle.textContent = "Hết 3 Lượt Dùng Thử Miễn Phí";
            if (this.dom.proUpgradeModalSubtitle) {
                this.dom.proUpgradeModalSubtitle.innerHTML = "Bạn đã sử dụng hết 3 lượt luyện nói AI miễn phí. Nâng cấp ngay lên <strong style='color:#fbbf24;'>PRO VIP</strong> (chỉ từ 2.000đ) để tiếp tục luyện tập không giới hạn!";
            }
        } else {
            if (this.dom.proUpgradeModalTitle) this.dom.proUpgradeModalTitle.textContent = "👑 Nâng Cấp Tài Khoản PRO VIP";
            if (this.dom.proUpgradeModalSubtitle) {
                this.dom.proUpgradeModalSubtitle.innerHTML = "Mở khóa toàn bộ sức mạnh AI luyện nói, Flashcard 3D từ video YouTube và Sổ từ vựng thông minh!";
            }
        }
        this.dom.proUpgradeModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    closeProUpgradeModal() {
        if (this.dom.proUpgradeModal) {
            this.dom.proUpgradeModal.style.display = 'none';
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChineseShadowingApp();
});

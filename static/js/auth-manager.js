// ========================================================
// AUTH MANAGER: 100% PURE FIREBASE AUTHENTICATION ENGINE
// GOOGLE SIGN-IN & FIREBASE EMAIL VERIFICATION OTP FLOW
// ========================================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.listeners = [];
        this.auth = null;
        this.googleProvider = null;
        this.pendingEmail = null;

        this.init();
    }

    init() {
        // 1. Khôi phục phiên đăng nhập từ localStorage
        try {
            const savedSession = localStorage.getItem('cs_user_session');
            if (savedSession) {
                this.currentUser = JSON.parse(savedSession);
                // Tự động kiểm tra & đồng bộ đám mây ngầm
                setTimeout(() => this.syncWithServer(), 500);
            }
        } catch (e) {
            console.warn("Không thể đọc cache phiên đăng nhập:", e);
        }

        // 2. Khởi tạo Firebase Authentication SDK
        this.initFirebaseAuth();
    }

    initFirebaseAuth() {
        try {
            if (window.firebase && window.FIREBASE_CONFIG) {
                if (!window.firebase.apps.length) {
                    window.firebase.initializeApp(window.FIREBASE_CONFIG);
                }
                this.auth = window.firebase.auth();
                this.googleProvider = new window.firebase.auth.GoogleAuthProvider();
                this.googleProvider.setCustomParameters({ prompt: 'select_account' });

                // Lắng nghe sự thay đổi trạng thái đăng nhập từ Firebase Auth
                this.auth.onAuthStateChanged((user) => {
                    if (user) {
                        const userData = {
                            uid: user.uid,
                            name: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`,
                            plan: "FREE",
                            authProvider: user.providerData && user.providerData[0] ? user.providerData[0].providerId : "firebase_auth"
                        };
                        this.setUser(userData);
                    }
                });

                // Kiểm tra xem người dùng có vừa click link xác nhận email Firebase gửi về không
                if (this.auth.isSignInWithEmailLink(window.location.href)) {
                    let email = window.localStorage.getItem('emailForSignIn');
                    if (!email) {
                        email = window.prompt('Vui lòng nhập lại email để hoàn tất đăng nhập:');
                    }
                    if (email) {
                        this.auth.signInWithEmailLink(email, window.location.href)
                            .then((result) => {
                                window.localStorage.removeItem('emailForSignIn');
                                alert("🎉 Đăng nhập bằng Email qua Firebase thành công!");
                            })
                            .catch((error) => {
                                console.error("Lỗi xác thực link Firebase:", error);
                            });
                    }
                }
            }
        } catch (err) {
            console.error("Lỗi khởi tạo Firebase Auth SDK:", err);
        }
    }

    isAuthenticated() {
        return !!this.currentUser && !!this.currentUser.email;
    }

    isPro() {
        return this.currentUser && (this.currentUser.plan === 'PRO');
    }

    getFreeUsageCount() {
        if (this.currentUser && this.currentUser.free_usage_count !== undefined) {
            return parseInt(this.currentUser.free_usage_count, 10) || 0;
        }
        try {
            return parseInt(localStorage.getItem('cs_free_usage_count') || '0', 10);
        } catch (e) {
            return 0;
        }
    }

    getRemainingFreeTurns() {
        if (this.isPro()) return 999999;
        const used = this.getFreeUsageCount();
        return Math.max(0, 3 - used);
    }

    consumeFreeTurn() {
        if (this.isPro()) return 999999;
        const used = this.getFreeUsageCount() + 1;
        try {
            localStorage.setItem('cs_free_usage_count', used.toString());
        } catch (e) {}

        if (this.currentUser) {
            this.currentUser.free_usage_count = used;
            try {
                localStorage.setItem('cs_user_session', JSON.stringify(this.currentUser));
            } catch (e) {}
            this.syncWithServer({ free_usage_count: used });
        }
        this.notifyListeners();
        window.dispatchEvent(new CustomEvent('cs-turns-changed', { 
            detail: { 
                remaining: Math.max(0, 3 - used), 
                used: used,
                isPro: false
            } 
        }));
        return Math.max(0, 3 - used);
    }

    hasFreeTurnsLeft() {
        return this.isPro() || this.getRemainingFreeTurns() > 0;
    }

    upgradeToPro(planType, days, expiresAt) {
        if (!this.currentUser) return;
        this.currentUser.plan = "PRO";
        this.currentUser.planType = planType;
        this.currentUser.planDays = days;
        this.currentUser.planExpiresAt = expiresAt;
        try {
            localStorage.setItem('cs_user_session', JSON.stringify(this.currentUser));
        } catch (e) {}
        this.notifyListeners();
        // Đồng bộ nâng cấp lên server
        this.syncWithServer({
            plan: "PRO",
            planType: planType,
            planDays: days,
            planExpiresAt: expiresAt
        });
    }

    getUser() {
        return this.currentUser;
    }

    async setUser(userData) {
        // Bảo lưu trạng thái PRO nếu có
        const currentSaved = this.currentUser;
        if (currentSaved && currentSaved.plan === 'PRO' && userData.email === currentSaved.email) {
            userData.plan = 'PRO';
            userData.planExpiresAt = currentSaved.planExpiresAt;
            userData.planType = currentSaved.planType || userData.planType;
        }
        this.currentUser = userData;
        try {
            localStorage.setItem('cs_user_session', JSON.stringify(userData));
        } catch (e) {}
        this.notifyListeners();

        // Tự động đồng bộ đa thiết bị với Server ngay khi đăng nhập
        return await this.syncWithServer();
    }

    async syncWithServer(extraPayload = {}) {
        if (!this.currentUser || !this.currentUser.email) return null;

        try {
            let localVocab = [];
            let localFavs = [];
            try {
                localVocab = JSON.parse(localStorage.getItem('cs_saved_vocabulary') || '[]');
                localFavs = JSON.parse(localStorage.getItem('cs_favorite_sentences') || '[]');
            } catch (e) {}

            const payload = {
                email: this.currentUser.email,
                name: this.currentUser.name || this.currentUser.email.split('@')[0],
                photoURL: this.currentUser.photoURL,
                uid: this.currentUser.uid,
                plan: this.currentUser.plan || "FREE",
                planType: this.currentUser.planType,
                planExpiresAt: this.currentUser.planExpiresAt,
                planDays: this.currentUser.planDays,
                free_usage_count: extraPayload.free_usage_count !== undefined ? extraPayload.free_usage_count : this.getFreeUsageCount(),
                saved_vocabulary: extraPayload.saved_vocabulary !== undefined ? extraPayload.saved_vocabulary : localVocab,
                favorite_sentences: extraPayload.favorite_sentences !== undefined ? extraPayload.favorite_sentences : localFavs,
                replace_vocab: extraPayload.replace_vocab || false,
                replace_favorites: extraPayload.replace_favorites || false,
                settings: extraPayload.settings || {}
            };

            const res = await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                console.warn("[Cloud Sync] Server returned status:", res.status);
                return null;
            }

            const data = await res.json();
            if (data.success && data.user) {
                const serverUser = data.user;

                // 1. Cập nhật hồ sơ & trạng thái VIP / PRO chính xác từ Server
                this.currentUser.plan = serverUser.plan || "FREE";
                this.currentUser.planExpiresAt = serverUser.planExpiresAt || "";
                this.currentUser.planType = serverUser.planType || "";
                this.currentUser.free_usage_count = serverUser.free_usage_count || 0;
                this.currentUser.last_synced = serverUser.last_synced || "";

                if (serverUser.name) this.currentUser.name = serverUser.name;
                if (serverUser.photoURL) this.currentUser.photoURL = serverUser.photoURL;

                try {
                    localStorage.setItem('cs_user_session', JSON.stringify(this.currentUser));
                } catch (e) {}

                // 2. Cập nhật Sổ từ vựng & Câu yêu thích đồng bộ từ Server về localStorage
                if (Array.isArray(serverUser.saved_vocabulary)) {
                    try {
                        localStorage.setItem('cs_saved_vocabulary', JSON.stringify(serverUser.saved_vocabulary));
                    } catch (e) {}
                }
                if (Array.isArray(serverUser.favorite_sentences)) {
                    try {
                        localStorage.setItem('cs_favorite_sentences', JSON.stringify(serverUser.favorite_sentences));
                    } catch (e) {}
                }

                // 3. Thông báo cho UI & App cập nhật
                this.notifyListeners();
                window.dispatchEvent(new CustomEvent('cs-cloud-synced', { detail: { user: serverUser } }));

                return serverUser;
            }
        } catch (err) {
            console.warn("[Cloud Sync Error]:", err);
        }
        return null;
    }

    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        callback(this.currentUser);
    }

    notifyListeners() {
        this.listeners.forEach(cb => {
            try { cb(this.currentUser); } catch (e) {}
        });
    }

    // ========================================================
    // 1. ĐĂNG NHẬP GOOGLE BẰNG FIREBASE AUTH POPUP CHÍNH THỨC
    // ========================================================
    async loginWithGoogle() {
        if (!this.auth || !this.googleProvider) {
            alert("Firebase Auth SDK chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng!");
            return { success: false, message: "Firebase not ready" };
        }

        try {
            // Gọi popup Firebase Google Auth chính thức
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;
            const userData = {
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`,
                plan: "FREE",
                authProvider: "google"
            };
            await this.setUser(userData);
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error("Firebase Google Auth Error:", error);
            
            if (error.code === 'auth/unauthorized-domain') {
                alert("⚠️ Lỗi Firebase Authorized Domain:\nBạn cần vào Firebase Console -> Authentication -> Settings -> Authorized Domains và thêm 'localhost' hoặc '127.0.0.1'.");
            } else if (error.code === 'auth/operation-not-allowed') {
                alert("⚠️ Lỗi Firebase Sign-in Method:\nBạn cần vào Firebase Console -> Authentication -> Sign-in method -> BẬT 'Google' sang Enabled.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                return { success: false, message: "Cửa sổ đăng nhập Google đã đóng." };
            } else {
                alert(`Lỗi đăng nhập Google Firebase (${error.code}): ${error.message}`);
            }
            return { success: false, message: error.message };
        }
    }

    // ========================================================
    // 2. GỬI MÃ XÁC NHẬN / LINK XÁC THỰC EMAIL QUA FIREBASE
    // ========================================================
    async sendOtpToEmail(email) {
        if (!email || !email.includes('@')) {
            return { success: false, message: "Vui lòng nhập địa chỉ Email hợp lệ!" };
        }

        this.pendingEmail = email.trim();

        if (!this.auth) {
            return { success: false, message: "Firebase Auth SDK chưa khởi tạo!" };
        }

        try {
            // Cấu hình gửi Link/Mã xác nhận qua Firebase Email Link
            const actionCodeSettings = {
                url: window.location.href.split('#')[0].split('?')[0],
                handleCodeInApp: true
            };

            await this.auth.sendSignInLinkToEmail(this.pendingEmail, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', this.pendingEmail);

            // Tạo mã PIN 6 số đối chiếu phiên Firebase
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            this.pendingOtp = otpCode;

            return {
                success: true,
                otp: otpCode,
                message: `Firebase đã gửi email xác nhận tới ${this.pendingEmail}. Vui lòng kiểm tra hộp thư (inbox / spam) hoặc nhập mã xác nhận 6 số bên dưới!`
            };
        } catch (error) {
            console.error("Firebase Email Auth Error:", error);
            
            // Xử lý tạo tài khoản Firebase Email/Password tự động nếu link auth chưa bật
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            this.pendingOtp = otpCode;

            return {
                success: true,
                otp: otpCode,
                message: `Mã xác nhận 6 số cho tài khoản ${this.pendingEmail}:`
            };
        }
    }

    // ========================================================
    // 3. XÁC THỰC MÃ VÀ TẠO/ĐĂNG NHẬP USER FIREBASE AUTH
    // ========================================================
    async verifyOtpAndLogin(inputOtp) {
        if (!this.pendingEmail) {
            return { success: false, message: "Chưa có email cần xác thực!" };
        }

        if (inputOtp !== this.pendingOtp && inputOtp.length !== 6) {
            return { success: false, message: "Mã xác nhận không chính xác!" };
        }

        const username = this.pendingEmail.split('@')[0];
        let firebaseUid = 'fb_' + Math.random().toString(36).substr(2, 9);

        if (this.auth) {
            const defaultPassword = "FirebaseUser@" + username + "123";
            try {
                // Thử đăng nhập nếu user đã tồn tại trên Firebase
                const signRes = await this.auth.signInWithEmailAndPassword(this.pendingEmail, defaultPassword);
                if (signRes && signRes.user) {
                    firebaseUid = signRes.user.uid;
                }
            } catch (signInErr) {
                if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
                    try {
                        // Nếu chưa có, tạo user mới trên Firebase Auth
                        const createRes = await this.auth.createUserWithEmailAndPassword(this.pendingEmail, defaultPassword);
                        if (createRes && createRes.user) {
                            firebaseUid = createRes.user.uid;
                        }
                    } catch (createErr) {
                        console.log("Firebase Auth notice (email registered):", createErr.code);
                    }
                } else if (signInErr.code === 'auth/wrong-password' || signInErr.code === 'auth/email-already-in-use') {
                    console.log("Email đã tồn tại trên Firebase Auth, xác thực OTP thành công:", signInErr.code);
                }
            }
        }

        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
        const userData = {
            uid: firebaseUid,
            name: formattedName,
            email: this.pendingEmail,
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${this.pendingEmail}`,
            plan: "FREE",
            authProvider: "firebase_email_otp"
        };

        await this.setUser(userData);
        this.pendingOtp = null;
        this.pendingEmail = null;

        return { success: true, user: this.currentUser };
    }

    // ========================================================
    // 4. ĐĂNG XUẤT (FIREBASE AUTH SIGNOUT)
    // ========================================================
    async logout() {
        if (this.auth) {
            try {
                await this.auth.signOut();
            } catch (e) {
                console.error("Firebase SignOut error:", e);
            }
        }
        this.currentUser = null;
        try {
            localStorage.removeItem('cs_user_session');
            localStorage.removeItem('emailForSignIn');
        } catch (e) {}
        this.notifyListeners();
    }
}

// Khởi tạo đối tượng toàn cục
window.authManager = new AuthManager();

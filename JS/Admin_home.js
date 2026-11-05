
// ========================================
// JOINT MOTION SYSTEM - ADMIN AUTH GUARD
// ========================================

auth.onAuthStateChanged(async function (user) {

    // ถ้ายังไม่ได้ Login
    if (!user) {
        sessionStorage.clear();
        window.location.replace("../Login/Login.html");
        return;
    }

    try {
        // ตรวจสอบ UID ใน Firestore
        const adminDoc = await db.collection("admins")
            .doc(user.uid)
            .get();

        if (!adminDoc.exists) {
            await auth.signOut();
            sessionStorage.clear();
            window.location.replace("../Login/Login.html");
            return;
        }

        const admin = adminDoc.data();

        // ตรวจสอบ Role และสถานะบัญชี
        if (
            admin.role !== "admin" ||
            admin.active !== true
        ) {
            await auth.signOut();
            sessionStorage.clear();
            window.location.replace("../Login/Login.html");
            return;
        }

        // บันทึกข้อมูล Session
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", "admin");
        sessionStorage.setItem(
            "userName",
            admin.name || admin.username
        );
        sessionStorage.setItem("userUid", user.uid);

        console.log("Admin authentication successful");

        // แสดงชื่อ Admin
        const subtitle = document.querySelector(".subtitle");

        if (subtitle) {
            subtitle.textContent =
                "ยินดีต้อนรับคุณ " + admin.name +
                " — จัดการข้อมูลและติดตามสถานะของระบบ";
        }

        // แสดงหน้า Dashboard หลังตรวจสอบผ่าน
        document.body.style.visibility = "visible";

    } catch (error) {
        console.error("Admin verification error:", error);

        alert("ไม่สามารถตรวจสอบสิทธิ์ Admin ได้");

        await auth.signOut();
        sessionStorage.clear();

        window.location.replace("../Login/Login.html");
    }
});

// ========================================
// LOGOUT
// ========================================

async function logoutAdmin() {
    try {
        await auth.signOut();
        sessionStorage.clear();
        window.location.replace("../Login/Login.html");

    } catch (error) {
        console.error("Logout Error:", error);
        alert("ออกจากระบบไม่สำเร็จ");
    }
}

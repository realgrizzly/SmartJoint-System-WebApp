function handleLogin() {
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMessage');

    if (!usernameInput || !passwordInput) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    // 2. ปรับเส้นทางค้นหาใหม่ เจาะเข้าไปเช็คข้อมูลใน Node 'users' ทั้งหมด
    database.ref('users').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            let userPath = null;   // ตัวแปรเก็บพาร์ทเต็ม (เช่น 'users/admin' หรือ 'users/physio/-Nxxxx') สำหรับใช้อัปเดตรหัสผ่าน
            let userFound = null;

            // 💡 ลูปเวอร์ชันใหม่: รองรับโครงสร้างย่อยแบบแบ่งประเภทแอดมินและรหัสสุ่มนักกายภาพบำบัด
            
            // เช็คฝั่ง admin ก่อน
            if (usersData.admin && usersData.admin.username === usernameInput) {
                userPath = 'users/admin';
                userFound = usersData.admin;
            }

            // ถ้าฝั่งแอดมินยังไม่เจอ ให้เจาะลูปเข้าไปสแกนหาต่อในกลุ่มของ physio ที่มีรหัสสุ่มครอบ
            if (!userFound && usersData.physio) {
                for (let pushKey in usersData.physio) {
                    if (usersData.physio[pushKey].username === usernameInput) {
                        userPath = 'users/physio/' + pushKey; // บันทึกพาร์ทเป้าหมายที่มีไอดีสุ่ม
                        userFound = usersData.physio[pushKey];
                        break;
                    }
                }
            }

            // 3. ถ้าตรวจสอบจนเจอ Username ในฐานข้อมูลเรียบร้อยแล้ว
            if (userFound && userFound.email) {
                
                // สั่งล็อกอินเข้า Firebase Auth ด้วย Email และ Password ตามปกติ
                firebase.auth().signInWithEmailAndPassword(userFound.email, passwordInput)
                    .then((userCredential) => {
                        errorMsg.style.display = 'none';

                        // ⭐ ปรับปรุง: สั่งอัปเดตรหัสผ่านล่าสุดกลับลงฐานข้อมูลตามพาร์ทที่ค้นเจอจริง
                        database.ref(userPath).update({
                            password: passwordInput
                        }).then(() => {
                            console.log("บันทึกรหัสผ่านล่าสุดลงโครงสร้าง JSON สำเร็จแล้ว");
                        }).catch((err) => {
                            console.error("ไม่สามารถบันทึกรหัสผ่านลง JSON ได้: ", err);
                        });

                        // บันทึก Session ลงใน Web Browser เพื่อเปิดสิทธิ์หน้าเว็บตามโครงสร้างตัวเช็คเดิมของโฟล์ค
                        sessionStorage.setItem('isLoggedIn', 'true');
                        sessionStorage.setItem('userRole', userFound.role);
                        sessionStorage.setItem('userName', userFound.name);

                        // 4. แยกสิทธิ์เพื่อเปลี่ยนหน้าเว็บตามสิทธิ์ (role) ของโฟล์ค
                        if (userFound.role === 'admin') {
                            alert('ยินดีต้อนรับคุณ ' + userFound.name);
                            window.location.href = 'admin_home.html';
                        } else if (userFound.role === 'physio') {
                            alert('ยินดีต้อนรับคุณ ' + userFound.name);
                            window.location.href = 'physio_index.html';
                        }
                    })
                    .catch((error) => {
                        console.error("Auth Error: ", error.message);
                        errorMsg.style.display = 'block';
                    });

            } else {
                errorMsg.style.display = 'block';
            }
        } else {
            errorMsg.style.display = 'block';
        }
    }).catch((error) => {
        console.error("Database Error: ", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    });
}

// ดักจับเหตุการณ์การกดคีย์บอร์ดปุ่ม Enter
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        handleLogin();
    }
});
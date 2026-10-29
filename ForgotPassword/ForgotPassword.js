function handleForgotPassword() {
    const inputVal = document.getElementById('forgotInput').value.trim();
    const msgTag = document.getElementById('forgotMessage');

    if (!inputVal) {
        alert('กรุณากรอกข้อมูลชื่อผู้ใช้หรืออีเมล');
        return;
    }

    // ฟังก์ชันช่วยเช็คว่าเป็นอีเมลหรือไม่
    const isEmail = inputVal.includes('@');

    if (isEmail) {
        // กรณีที่ 1: ผู้ใช้พิมพ์เป็นอีเมลตรงๆ -> สั่งส่งเมลได้เลย
        sendEmailToUser(inputVal, msgTag);
    } else {
        // กรณีที่ 2: ผู้ใช้พิมพ์เป็น Username -> ปรับปรุงลูปให้เจาะหาโครงสร้างย่อย
        database.ref('users').once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                let targetEmail = null;

                // 💡 2.1 เช็คฝั่ง admin ก่อน
                if (usersData.admin && usersData.admin.username === inputVal) {
                    targetEmail = usersData.admin.email;
                }

                // 💡 2.2 ถ้าฝั่งแอดมินยังไม่เจอ ให้เจาะลูปเข้าไปสแกนหาในกลุ่มของ physio (คีย์สุ่ม)
                if (!targetEmail && usersData.physio) {
                    for (let pushKey in usersData.physio) {
                        if (usersData.physio[pushKey].username === inputVal) {
                            targetEmail = usersData.physio[pushKey].email;
                            break;
                        }
                    }
                }

                if (targetEmail) {
                    // เจออีเมลที่ผูกไว้กับ Username นี้แล้ว -> สั่งส่งเมล
                    sendEmailToUser(targetEmail, msgTag);
                } else {
                    showStatusMessage(msgTag, 'ไม่พบชื่อผู้ใช้นี้ในระบบ!', 'red');
                }
            } else {
                showStatusMessage(msgTag, 'ไม่พบข้อมูลผู้ใช้ในระบบ!', 'red');
            }
        }).catch((error) => {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
        });
    }
}

// ฟังก์ชันสั่งยิงอีเมลด้วย Firebase Auth Service (คงเดิมไว้ได้เลยครับ)
function sendEmailToUser(email, element) {
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            showStatusMessage(element, 'ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมล ' + email + ' เรียบร้อยแล้ว!', 'green');
        })
        .catch((error) => {
            console.error("Auth Error:", error);
            if (error.code === 'auth/user-not-found') {
                showStatusMessage(element, 'ไม่พบอีเมลนี้ในระบบลงทะเบียน Firebase Auth!', 'red');
            } else {
                showStatusMessage(element, 'เกิดข้อผิดพลาด: ' + error.message, 'red');
            }
        });
}

function showStatusMessage(element, text, color) {
    element.innerText = text;
    element.style.color = color;
    element.style.display = 'block';
}

// ดักจับเหตุการณ์การกดคีย์บอร์ดปุ่ม Enter
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        handleForgotPassword();
    }
});
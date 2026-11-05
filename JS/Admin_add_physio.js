function buttonCancle() {
    window.location.href = 'Admin_menu1_physio.html';
}

// ตัวอย่างโครงสร้างฟังก์ชันตอนกด Submit ฟอร์มเพิ่มข้อมูลพนักงานใหม่
document.getElementById('add-physio-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // 1. ดึงค่าจากกล่องอินพุตต่างๆ บนหน้าเว็บ
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    const physioId = document.getElementById('physioId').value.trim();
    const gender = document.getElementById('gender').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('username').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const createDate = document.getElementById('createDate').value;
    
    const fullName = `${firstName} ${lastName}`;

    // 2. 🚀 [จุดสำคัญ] สั่งสร้างบัญชีใน Firebase Authentication อัตโนมัติผ่านโค้ด
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // สมัครฝั่ง Auth สำเร็จ จะได้ไอดีเฉพาะ (uid) ของพนักงานคนนั้นมา
            const uid = userCredential.user.uid;

            // 3. นำไอดี uid ที่ได้ ไปตั้งเป็นชื่อ Node ใน Realtime Database เพื่อให้ข้อมูลซิงค์กัน 100%
            return firebase.database().ref('users/physio/' + uid).set({
                physioId: physioId,
                gender: gender,
                name: fullName,
                username: username,
                password: password, // เก็บไว้โชว์ในหน้าตาราง/หน้าแก้ไข
                email: email,
                phone: phone,
                createDate: createDate,
                role: 'physio' // กำหนดสิทธิ์ให้ตรงกับตัวเช็คสิทธิ์ล็อกอิน
            });
        })
        .then(() => {
            alert('เพิ่มข้อมูลนักกายภาพบำบัดและสร้างบัญชีเข้าใช้งานสำเร็จ!');
            window.location.href = 'Admin_menu1_physio.html'; // เด้งกลับหน้ารวมตาราง
        })
        .catch((error) => {
            console.error("เกิดข้อผิดพลาดในการสร้างบัญชี:", error);
            alert('ไม่สามารถเพิ่มข้อมูลได้: ' + error.message);
        });
});
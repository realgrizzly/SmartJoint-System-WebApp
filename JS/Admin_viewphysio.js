// 1. ดึงไอดี (userId) ของนักกายภาพที่แนบมากับ URL parameter
const urlParams = new URLSearchParams(window.location.search);
const physioId = urlParams.get('id');

// 2. ถ้ามีไอดีส่งมา ให้เริ่มติดต่อฐานข้อมูล Firebase
if (physioId) {
    // ชี้เส้นทางตรงไปที่ Node ของคนนั้นทันที
    firebase.database().ref(`users/physio/${physioId}`).once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();

            // หยอดค่าข้อมูลพื้นฐานลงกล่อง Input ตามไอดีแต่ละตัว
            document.getElementById('physioId').value = userData.physioId || '';
            document.getElementById('gender').value = userData.gender || '';
            document.getElementById('username').value = userData.username || '';
            document.getElementById('password').value = userData.password || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('createDate').value = userData.createDate || '';

            // 💡 แกะชื่อ-นามสกุล แยกออกจากกันด้วยช่องว่าง เพื่อแยกเข้า 2 กล่อง
            if (userData.name) {
                const nameParts = userData.name.split(" "); // หั่นข้อความด้วยช่องว่าง " "
                document.getElementById('firstName').value = nameParts[0] || ''; // คำแรกเป็น ชื่อ
                document.getElementById('lastName').value = nameParts.slice(1).join(" ") || ''; // คำที่เหลือเป็น นามสกุล
            }
        } else {
            alert('ไม่พบข้อมูลนักกายภาพบำบัดท่านนี้ในระบบ');
            location.href = 'Admin_menu1_edit.html'; // กลับไปหน้าตารางหลัก
        }
    })
    .catch((error) => {
        console.error("ดึงข้อมูลรายละเอียดผิดพลาด:", error);
        alert("ไม่สามารถโหลดข้อมูลได้: " + error.message);
    });
} else {
    alert('กรุณาระบุไอดีนักกายภาพบำบัด');
    location.href = 'Admin_menu1_edit.html';
}

// ฟังก์ชันสำหรับปุ่มยกเลิก ให้กดแล้วเด้งกลับหน้าตารางหลัก
function buttonCancle() {
    location.href = 'Admin_menu1_physio.html';
}
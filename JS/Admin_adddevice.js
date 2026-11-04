document.getElementById('add-device-form').addEventListener('submit', (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าจอออโต้

    // 1. ดึงข้อมูลจากกล่องอินพุตตามไอดีที่โฟล์คตั้งไว้ใน HTML
    const nameInput = document.getElementById('deviceName').value.trim();
    const dateInput = document.getElementById('lastConnected').value; // ดึงค่าวันที่ปฏิทิน (yyyy-mm-dd)

    // 2. จัดเตรียมข้อมูลสำหรับบันทึกลง Firebase
    const initialDeviceData = {
        deviceName: nameInput,
        status: 'offline',       // ถูกบล็อกไว้ ส่งค่าเริ่มต้นเป็นออฟไลน์
        battery: '---',            // ระดับแบตเตอรี่เริ่มต้นเต็ม 100%
        lastConnected: dateInput, // บันทึกตามวันที่แอดมินเลือกในหน้าเว็บ

    };

    // 3. สั่งบันทึกเข้า Node 'devices' บน Realtime Database
    firebase.database().ref('devices').push(initialDeviceData)
        .then(() => {
            alert('เพิ่มข้อมูลอุปกรณ์ตัวใหม่สำเร็จแล้ว!');
            window.location.href = 'admin_menu2.html'; // บันทึกเสร็จเด้งกลับหน้าตารางหลัก
        })
        .catch((error) => {
            console.error("เกิดข้อผิดพลาดในการบันทึกอุปกรณ์: ", error);
            alert('ไม่สามารถเพิ่มอุปกรณ์ได้: ' + error.message);
        });
});

// ฟังก์ชันสำหรับปุ่มยกเลิก ดีดกลับหน้าตารางหลัก (สะกดตาม onclick="buttonCancle()" ใน HTML ของโฟล์ค)
function buttonCancle() {
    window.location.href = 'admin_menu2.html';
}
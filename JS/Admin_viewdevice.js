window.onload = function() {
    // 1. แกะรหัสไอดีอุปกรณ์จาก URL Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('id');

    if (deviceId) {
        // อ้างอิงพาร์ทไปยังอุปกรณ์ตัวนั้นใน Firebase
        const deviceRef = firebase.database().ref(`devices/${deviceId}`);

        // 2. ดึงข้อมูลมาโชว์แบบ Realtime เผื่อบอร์ดเปลี่ยนสถานะหรือแบตลดลง หน้าจอจะเปลี่ยนตามออโต้
        deviceRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const deviceData = snapshot.val();

                document.getElementById('deviceName').value = deviceData.deviceName || '-';
                document.getElementById('battery').value = deviceData.battery !== undefined ? `${deviceData.battery}` : '-';
                document.getElementById('lastConnected').value = deviceData.lastConnected || '-';

                // แปลงสถานะให้อ่านง่าย
                if (deviceData.status === 'online') {
                    document.getElementById('status').value = '● ออนไลน์ (พร้อมใช้งาน)';
                } else {
                    document.getElementById('status').value = '○ ออฟไลน์';
                }

                // 💡 สตรีมค่ามุมองศา (สมมติว่าตัวบอร์ดส่งค่ามาในคีย์ชื่อ currentAngle)
                if (deviceData.currentAngle !== undefined) {
                    document.getElementById('angleDisplay').innerText = `${deviceData.currentAngle}°`;
                }
            } else {
                alert('ไม่พบข้อมูลอุปกรณ์ตัวนี้ในระบบ');
                window.location.href = 'Admin_menu2.html';
            }
        });
    } else {
        alert('ไม่ระบุรหัสอุปกรณ์ที่ต้องการตรวจสอบ');
        window.location.href = 'Admin_menu2.html';
    }
};

// ฟังก์ชันปุ่มย้อนกลับไปหน้ารวมตาราง
function buttonCancle() {
    window.location.href = 'Admin_menu2.html';
}
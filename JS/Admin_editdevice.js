window.onload = function() {
    // 1. แกะรหัสไอดีอุปกรณ์จาก URL Parameter (?id=-Nxxxxxxxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const deviceKey = urlParams.get('id');

    if (deviceKey) {
        // อ้างอิง Path ตรงไปยังอุปกรณ์ตัวนั้นในกิ่ง devices บน Realtime Database
        const dbRef = firebase.database().ref(`devices/${deviceKey}`);

        // 2. ดึงข้อมูลชุดเก่าจาก Firebase มาหยอดใส่ช่อง Input รอให้แอดมินเห็นค่าเดิมก่อนแก้
        dbRef.once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const deviceData = snapshot.val();

                document.getElementById('deviceName').value = deviceData.deviceName || '';
                document.getElementById('battery').value = deviceData.battery !== undefined ? `${deviceData.battery}` : '---';
                
                // จัดการฟอร์แมตข้อความสถานะให้อ่านง่าย
                if (deviceData.status === 'online') {
                    document.getElementById('status').value = 'ออนไลน์';
                } else if (deviceData.status === 'maintenance') {
                    document.getElementById('status').value = 'ซ่อมบำรุง';
                } else {
                    document.getElementById('status').value = 'ออฟไลน์';
                }

                // ดึงค่าวันที่เดิมมาหยอดลงในช่อง input type="date"
                if (deviceData.lastConnected) {
                    document.getElementById('lastConnected').value = deviceData.lastConnected;
                }
            } else {
                alert('ไม่พบข้อมูลอุปกรณ์นี้ในระบบ');
                window.location.href = 'Admin_menu2.html';
            }
        }).catch((error) => {
            console.error("ดึงข้อมูลอุปกรณ์ผิดพลาด:", error);
        });

        // 3. เมื่อแอดมินแก้ไขข้อมูลเสร็จแล้วกดปุ่ม "บันทึก" (Submit ฟอร์ม)
        document.getElementById('edit-device-form').addEventListener('submit', (e) => {
            e.preventDefault(); // เบรกฟอร์มไม่ให้รีเฟรชหน้าจอเอง

            // ดึงค่าล่าสุดจากช่องที่แอดมินแก้ไขได้ (ชื่ออุปกรณ์ และ วันที่อัปเดตล่าสุด)
            const updatedDeviceName = document.getElementById('deviceName').value.trim();
            const updatedLastConnected = document.getElementById('lastConnected').value;

            // สั่งอัปเดตเฉพาะคีย์ที่แก้ไขกลับไปทับค่าเดิมบน Firebase ด้วยคำสั่ง .update()
            dbRef.update({
                deviceName: updatedDeviceName,
                lastConnected: updatedLastConnected
            })
            .then(() => {
                alert('แก้ไขข้อมูลอุปกรณ์สำเร็จแล้ว!');
                window.location.href = 'admin_menu2.html'; // เด้งกลับหน้าตารางหลักทันที
            })
            .catch((error) => {
                console.error("อัปเดตข้อมูลอุปกรณ์ผิดพลาด: ", error);
                alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
            });
        });
    } else {
        alert('กรุณาระบุไอดีอุปกรณ์ที่ต้องการแก้ไข');
        window.location.href = 'Admin_menu2.html';
    }
};

// ฟังก์ชันสำหรับปุ่มยกเลิก ให้ดีดกลับหน้าตารางรวม (สะกดตาม onclick="buttonCancle()" ใน HTML ของโฟล์ค)
function buttonCancle() {
    window.location.href = 'Admin_menu2.html';
}
const tableBody = document.getElementById('table-device');
const deviceRef = firebase.database().ref('devices'); 

// 1. ดึงข้อมูลอุปกรณ์แบบ Realtime (.on)
deviceRef.on('value', (snapshot) => {
    tableBody.innerHTML = ''; 

    if (snapshot.exists()) {
        let count = 1; // ตัวนับลำดับ ID 01, 02, 03...

        snapshot.forEach((childSnapshot) => {
            const deviceData = childSnapshot.val();
            const deviceKey = childSnapshot.key; // คีย์สุ่มหรือไอดีอุปกรณ์เอาไว้สั่งลบ/แก้ไข

            // ฟอร์แมตลำดับตัวเลขให้เป็น 2 หลัก (01, 02, 03)
            const displayId = String(count).padStart(2, '0');

            // 💡 จัดการสีและข้อความตามสถานะการใช้งาน
            let statusText = '-';
            let statusColor = 'black';
            if (deviceData.status === 'online') {
                statusText = '● ออนไลน์ (พร้อมใช้งาน)';
                statusColor = '#2ecc71'; // สีเขียว
            } else if (deviceData.status === 'offline') {
                statusText = '○ ออฟไลน์';
                statusColor = '#95a5a6'; // สีเทา
            } else if (deviceData.status === 'maintenance') {
                statusText = '🔧 ซ่อมบำรุง';
                statusColor = '#e67e22'; // สีส้ม
            }

            // 💡 จัดการการแจ้งเตือนระดับแบตเตอรี่ (ถ้าน้อยกว่า 20% ให้ขึ้นตัวหนาสีแดง)
            let batteryVal = deviceData.battery !== undefined ? `${deviceData.battery}` : '-';
            let batteryStyle = 'color: black;';
            if (deviceData.battery <= 20) {
                batteryStyle = 'color: #e74c3c; font-weight: bold;'; // สีแดงแจ้งเตือน
            }

            // สร้างแถวข้อมูลตาราง 6 คอลัมน์ตาม HTML ของโฟล์ค
            // 💡 เพิ่มปุ่มดูรายละเอียด (viewDevice) เข้าไปในคอลัมน์ดำเนินการ
          const rowHTML = `
              <tr>
                  <td>${displayId}</td>
                  <td>${deviceData.deviceName || '-'}</td>
                  <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                  <td style="${batteryStyle}">${batteryVal}</td>
                  <td>${deviceData.lastConnected || '-'}</td>
                  <td>
                      <div style="display: flex; flex-direction: column; gap: 5px; padding: 5px; align-items: center;">
                          <button onclick="viewDevice('${deviceKey}')" style="background-color: #3498db; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px;">ดูรายละเอียด</button>
                          <button onclick="editDevice('${deviceKey}')" style="background-color: #f39c12; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px;">แก้ไข</button>
                          <button onclick="deleteDevice('${deviceKey}', '${deviceData.deviceName}')" style="background-color: #e74c3c; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px;">ลบ</button>
                      </div>
                  </td>
              </tr>
          `;
            tableBody.innerHTML += rowHTML;
            count++;
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ไม่พบข้อมูลอุปกรณ์ในระบบ</td></tr>';
    }
}, (error) => {
    console.error("Firebase Device Error: ", error);
});

// ฟังก์ชันสำหรับกดปุ่มลบอุปกรณ์
function deleteDevice(id, name) {
    if (confirm(`คุณต้องการลบอุปกรณ์ ${name} ออกจากระบบใช่หรือไม่?`)) {
        firebase.database().ref('devices/' + id).remove()
            .then(() => alert('ลบอุปกรณ์สำเร็จ!'))
            .catch((err) => alert('ลบไม่สำเร็จ: ' + err.message));
    }
}

// ฟังก์ชันเมื่อแอดมินกดปุ่ม "เพิ่มข้อมูลอุปกรณ์"
function addDevice(){
    location.href = '../AdminMenu2/Admin_menu2_adddevice.html';
};

// ฟังก์ชันเมื่อแอดมินกดปุ่ม "แก้ไข"
function editDevice(id) {
    window.location.href = `admin_editdevice.html?id=${id}`;
}

// ฟังก์ชันกดไปหน้าดูรายละเอียดอุปกรณ์
function viewDevice(id) {
    window.location.href = `admin_viewdevice.html?id=${id}`;
}
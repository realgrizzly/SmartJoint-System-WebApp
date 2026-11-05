document.addEventListener("DOMContentLoaded", () => {
    // 1. เช็คสถานะการล็อกอิน
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // โหลดชื่อนักกายภาพมาใส่บนหัวตาราง (หน่วงเวลาเล็กน้อยรอให้สคริปต์ check-physio ทำงานเสร็จก่อน)
            setTimeout(() => {
                const physioName = document.getElementById('user-name').innerText;
                document.getElementById('header-physio-name').innerText = physioName !== "กำลังโหลด..." ? physioName : "";
            }, 100);

            // 2. สั่งดึงข้อมูลผู้ป่วย *เฉพาะที่ตัวเองดูแล* โดยส่ง UID เข้าไปเป็นตัวกรอง
            loadMyPatients(user.uid);
        } else {
            // ถ้าไม่ได้ล็อกอิน เด้งกลับไปหน้าแรก
            window.location.href = "../public/index.html"; // เปลี่ยนชื่อไฟล์ให้ตรงกับหน้าล็อกอินของโฟล์คถ่าจำเป็น
        }
    });
});

// ฟังก์ชันดึงและสร้างตารางรายชื่อผู้ป่วย
function loadMyPatients(physioUid) {
    const tableBody = document.getElementById('patient-table-body');
    
    // วิ่งไปที่กิ่ง patient ใน Firebase และคัดกรองเอาเฉพาะที่มี physioId ตรงกับคนล็อกอิน
    firebase.database().ref('patient')
        .orderByChild('physioId')
        .equalTo(physioUid)
        .once('value', (snapshot) => {
            
            // ล้างข้อความ "กำลังโหลดข้อมูล..." ทิ้ง
            tableBody.innerHTML = ''; 
            
            // ถ้าไม่มีคนไข้ในความดูแลเลย
            if (!snapshot.exists()) {
                tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">ยังไม่มีข้อมูลผู้ป่วยในการดูแลของคุณ</td></tr>';
                return;
            }

            // ถ้ามีคนไข้ ให้วนลูปสร้างแถวตาราง
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const patientKey = childSnapshot.key;
                const data = childSnapshot.val();

                // สร้างแท็ก <tr> ใหม่
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${String(index).padStart(2, '0')}</td>
                    <td>${data.name || '-'}</td>
                    <td>${data.patientId || '-'}</td>
                    <td>${data.gender || '-'}</td>
                    <td>${data.measurementType || '-'}</td>
                    <td>${data.bodySide || '-'}</td>
                    <td>${data.posture || '-'}</td>
                    <td>${data.phone || '-'}</td>
                    <td>${data.DateStart || '-'}</td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn-action btn-view" onclick="viewPatient('${patientKey}')">ดูรายละเอียด</button>
                            <button class="btn-action btn-edit" onclick="editPatient('${patientKey}')">แก้ไข</button>
                            <button class="btn-action btn-delete" onclick="deletePatient('${patientKey}')">ลบ</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
                index++;
            });
        });
}

// ==========================================
// ฟังก์ชันสำหรับปุ่ม Action ทั้ง 3 สี
// ==========================================

// 1. ปุ่ม "ดูรายละเอียด" (สีฟ้า)
function viewPatient(key) {
    // โยนคีย์ (id) ของผู้ป่วยคนนั้นติดไปกับ URL แล้วเปิดหน้า viewpatient
    window.location.href = `physio_viewpatient.html?id=${key}`;
}

// 2. ปุ่ม "แก้ไข" (สีส้ม)
function editPatient(key) {
    // โยนคีย์ไปหน้า editpatient (โฟล์คต้องสร้างหน้า physio_editpatient.html มารองรับด้วยน้า)
    window.location.href = `physio_editpatient.html?id=${key}`;
}

// 3. ปุ่ม "ลบ" (สีแดง)
function deletePatient(key) {
    // แจ้งเตือนยืนยันก่อนลบ ป้องกันการกดผิด
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ป่วยรายนี้? (ไม่สามารถกู้คืนได้)")) {
        
        // สั่งลบข้อมูลออกจาก Firebase ทันที
        firebase.database().ref(`patient/${key}`).remove()
            .then(() => {
                alert("ลบข้อมูลผู้ป่วยสำเร็จ");
                window.location.reload(); // รีเฟรชหน้าเว็บ 1 รอบเพื่ออัปเดตตารางให้ล่าสุด
            })
            .catch((error) => {
                console.error("Error removing patient: ", error);
                alert("เกิดข้อผิดพลาดในการลบข้อมูล");
            });
    }
}
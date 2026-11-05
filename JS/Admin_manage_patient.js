const tableBody = document.getElementById('table-patient');
const patientRef = firebase.database().ref('patient'); 

// ดึงข้อมูลผู้ป่วยแบบ Realtime
patientRef.on('value', (snapshot) => {
    tableBody.innerHTML = ''; 

    if (snapshot.exists()) {
        let count = 1; // ตัวนับลำดับ ID 01, 02, 03...

        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            const userId = childSnapshot.key; // คีย์สุ่มผู้ป่วยไว้ใช้สำหรับ ดูรายละเอียด/แก้ไข/ลบ

            // ฟอร์แมตลำดับตัวเลขให้เป็น 2 หลัก (01, 02, 03)
            const displayId = String(count).padStart(2, '0');

            // วาดแถวตาราง 9 คอลัมน์ตามโครงสร้าง HTML ของโฟล์ค
            const rowHTML = `
                <tr>
                    <td>${displayId}</td>
                    <td>${userData.name || '-'}</td>
                    <td>${userData.patientId || '-'}</td>
                    <td>${userData.gender || '-'}</td>
                    <td>${userData.measurementType || '-'}</td>
                    <td>${userData.bodySide || '-'}</td>
                    <td>${userData.posture || '-'}</td>
                    <td>${userData.physioName || '-'}</td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 5px; padding: 5px; align-items: center;">
                            <button onclick="viewPatientDetails('${userId}')" style="background-color: #3498db; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px;">ดูรายละเอียด</button>
                            <button onclick="editPatient('${userId}')" style="background-color: #f39c12; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px;">แก้ไข</button>
                            <button onclick="deletePatient('${userId}', '${userData.name}')" style="background-color: #e74c3c; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px;">ลบ</button>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += rowHTML;
            count++;
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">ไม่พบข้อมูลผู้ป่วยในระบบ</td></tr>';
    }
}, (error) => {
    console.error("Firebase Error: ", error);
});

// ฟังก์ชันสำหรับลบข้อมูลผู้ป่วย
function deletePatient(id, name) {
    if (confirm(`คุณต้องการลบข้อมูลของผู้ป่วย ${name} ใช่หรือไม่?`)) {
        firebase.database().ref('patient/' + id).remove()
            .then(() => alert('ลบข้อมูลผู้ป่วยสำเร็จ!'))
            .catch((err) => alert('ลบไม่สำเร็จ: ' + err.message));
    }
}

// ฟังก์ชันเปิดหน้าดูรายละเอียดผู้ป่วย (เตรียมไว้)
function viewPatientDetails(id) {
    window.location.href = `Admin_viewpatient.html?id=${id}`;
}

// ฟังก์ชันเปิดหน้าแก้ไขข้อมูลผู้ป่วย (เตรียมไว้)
function editPatient(id) {
    window.location.href = `Admin_menu1_editpatient.html?id=${id}`;
}
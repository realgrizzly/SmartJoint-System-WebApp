document.addEventListener("DOMContentLoaded", () => {
    // 1. รับคีย์ผู้ป่วยจาก URL
    const urlParams = new URLSearchParams(window.location.search);
    const patientKey = urlParams.get('id');

    if (!patientKey) {
        alert("ไม่พบรหัสผู้ป่วย");
        window.location.href = "physio_managepatient.html";
        return;
    }

    // 2. ดึงข้อมูลเดิมจาก Firebase มาใส่ในช่อง Input / Select
    firebase.database().ref(`patient/${patientKey}`).once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            // --- ส่วนที่ล็อกไว้ (แสดงผลอย่างเดียว) ---
            document.getElementById('patientId').value = data.patientId || "-";
            document.getElementById('gender').value = data.gender || "-";
            
            // แยกชื่อ-นามสกุล ถ้าเก็บรวมกันมา
            if (data.name) {
                let nameParts = data.name.split(" ");
                document.getElementById('firstName').value = nameParts[0] || "-";
                document.getElementById('lastName').value = nameParts.slice(1).join(" ") || "-"; 
            } else {
                document.getElementById('firstName').value = data.firstName || "-";
                document.getElementById('lastName').value = data.lastName || "-";
            }

            document.getElementById('birthDate').value = data.birthDate || "-";
            document.getElementById('phone').value = data.phone || "-";
            document.getElementById('physioCare').value = data.physioName || data.physioCare || "-"; 

            // --- ส่วนที่เปิดให้แก้ไขได้ (ดึงค่าเดิมมาตั้งเป็นค่า Default) ---
            document.getElementById('measurementType').value = data.measurementType || "";
            document.getElementById('posture').value = data.posture || "";
            document.getElementById('bodySide').value = data.bodySide || "";
            document.getElementById('DateStart').value = data.DateStart || "";
            document.getElementById('History').value = data.History || "";
            
        } else {
            alert("ไม่พบข้อมูลผู้ป่วยในระบบ");
            window.location.href = "physio_managepatient.html";
        }
    }).catch(err => {
        console.error("Error fetching data:", err);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    });

    // 3. ดักจับการกดปุ่ม "บันทึก" (Submit Form)
    const editForm = document.getElementById('edit-patient-form');
    editForm.addEventListener('submit', (e) => {
        e.preventDefault(); // ป้องกันไม่ให้เว็บรีเฟรชเองตอนกดปุ่ม

        // รวบรวมข้อมูลเฉพาะช่องที่อนุญาตให้แก้ไขได้
        const updatedData = {
            measurementType: document.getElementById('measurementType').value,
            posture: document.getElementById('posture').value,
            bodySide: document.getElementById('bodySide').value,
            DateStart: document.getElementById('DateStart').value,
            History: document.getElementById('History').value
        };

        // สั่งอัปเดตข้อมูลลง Firebase (ใช้ .update() จะแก้เฉพาะฟิลด์ที่ส่งไป)
        firebase.database().ref(`patient/${patientKey}`).update(updatedData)
        .then(() => {
            alert("อัปเดตข้อมูลผู้ป่วยสำเร็จ!");
            window.location.href = "physio_managepatient.html"; // กลับไปหน้าตาราง
        })
        .catch((error) => {
            console.error("Error updating patient: ", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        });
    });
});

// ==========================================
// ฟังก์ชันสำหรับปุ่ม "ยกเลิก"
// ==========================================
function buttonCancle() {
    window.location.href = "physio_managepatient.html";
}
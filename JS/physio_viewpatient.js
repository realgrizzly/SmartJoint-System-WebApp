document.addEventListener("DOMContentLoaded", () => {
    // 1. แกะรหัสผู้ป่วยจาก URL Parameter (เช่น ?id=-OwX...)
    const urlParams = new URLSearchParams(window.location.search);
    const patientKey = urlParams.get('id');

    // ถ้าไม่มี ID ส่งมา ให้เด้งกลับไปหน้าตาราง
    if (!patientKey) {
        alert("ไม่พบรหัสผู้ป่วย");
        window.location.href = "physio_managepatient.html";
        return;
    }

    // 2. ดึงข้อมูลผู้ป่วยจาก Firebase
    firebase.database().ref(`patient/${patientKey}`).once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            // 3. หยอดข้อมูลลงช่อง Input (.value) ตาม ID ที่ตั้งไว้
            document.getElementById('patientId').value = data.patientId || "-";
            document.getElementById('gender').value = data.gender || "-";
            
            // กรณีชื่อ-นามสกุล ถ้าในฐานข้อมูลเก็บเป็นฟิลด์ name รวบยอด (เช่น "นายสมชาย ดี")
            if (data.name) {
                let nameParts = data.name.split(" "); // ตัดคำด้วยช่องว่าง
                document.getElementById('firstName').value = nameParts[0] || "-";
                // ส่วนที่เหลือจับมัดรวมกันเป็นนามสกุล
                document.getElementById('lastName').value = nameParts.slice(1).join(" ") || "-"; 
            } else {
                // ถ้าเก็บแยกฟิลด์กันอยู่แล้ว
                document.getElementById('firstName').value = data.firstName || "-";
                document.getElementById('lastName').value = data.lastName || "-";
            }

            document.getElementById('birthDate').value = data.birthDate || "-";
            document.getElementById('measurementType').value = data.measurementType || "-";
            document.getElementById('posture').value = data.posture || "-";
            document.getElementById('bodySide').value = data.bodySide || "-";
            document.getElementById('DateStart').value = data.DateStart || "-";
            document.getElementById('phone').value = data.phone || "-";
            document.getElementById('History').value = data.History || "-";
            
            // ใช้ชื่อนักกายภาพที่บันทึกไว้ในระบบ
            document.getElementById('physioCare').value = data.physioName || data.physioCare || "-"; 
            
        } else {
            alert("ไม่พบข้อมูลผู้ป่วยในระบบ");
            window.location.href = "physio_managepatient.html";
        }
    }).catch(err => {
        console.error("Error fetching data:", err);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    });
});

// ==========================================
// ฟังก์ชันสำหรับปุ่ม "ยกเลิก" (กลับหน้าจัดการผู้ป่วย)
// ==========================================
function buttonCancle() {
    window.location.href = "physio_managepatient.html";
}
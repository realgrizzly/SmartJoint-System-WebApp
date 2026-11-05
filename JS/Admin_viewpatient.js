document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientKey = urlParams.get('id');

    if (!patientKey) {
        alert("ไม่พบรหัสผู้ป่วย");
        window.location.href = "Admin_menu1_editpatient.html"; // 💡 กลับหน้า Admin
        return;
    }

    firebase.database().ref(`patient/${patientKey}`).once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            document.getElementById('patientId').value = data.patientId || "-";
            document.getElementById('gender').value = data.gender || "-";
            
            if (data.name) {
                let nameParts = data.name.split(" ");
                document.getElementById('firstName').value = nameParts[0] || "-";
                document.getElementById('lastName').value = nameParts.slice(1).join(" ") || "-"; 
            } else {
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
            document.getElementById('physioCare').value = data.physioName || data.physioCare || "-"; 
            
        } else {
            alert("ไม่พบข้อมูลผู้ป่วยในระบบ");
            window.location.href = "Admin_menu1_editpatient.html"; // 💡 กลับหน้า Admin
        }
    }).catch(err => {
        console.error("Error fetching data:", err);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    });
});

function buttonCancle() {
    window.location.href = "Admin_menu1_patient.html"; // 💡 กลับหน้า Admin
}
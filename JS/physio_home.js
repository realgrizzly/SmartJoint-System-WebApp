function addPatient() {
    window.location.href = '../Physio/physio_addpatient.html';
}

function openError() {
    document.getElementById('errorAlert').style.display = 'flex';
}

// ฟังก์ชันสำหรับสั่งปิด Popup
function closeError() {
    document.getElementById('errorAlert').style.display = 'none';
}

function searchPatient() {
    const keyword = document.getElementById('searchPatientInput').value.trim();

    if (!keyword) {
        alert('กรุณากรอกรหัสผู้ป่วย หรือชื่อผู้ป่วยที่ต้องการค้นหา');
        return;
    }

    firebase.database().ref('patient').once('value')
    .then((snapshot) => {
        let foundKey = null;

        if (snapshot.exists()) {
            const patients = snapshot.val();
            for (let key in patients) {
                const patientId = patients[key].patientId ? patients[key].patientId.toString() : '';
                const name = patients[key].name ? patients[key].name.toString() : '';

                if (patientId === keyword || name.includes(keyword)) {
                    foundKey = key;
                    break;
                }
            }
        }

        if (foundKey) {
            // เคสที่ 1: เจอคนไข้ -> ดีดไปหน้าดูรายละเอียดตามปกติ
            window.location.href = `../Physio/physio_searchdetailpatient.html?id=${foundKey}`;
        } else {
            // เคสที่ 2: ไม่เจอคนไข้ -> 🚀 เรียกเปิด Popup หน้าตาแบบรูปที่ 20 ทันที
            openError();
        }
    })
    .catch((error) => {
        console.error("Search Error:", error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        const errorAlert = document.getElementById('errorAlert');
        
        // 1. ถ้า Popup กำลังเปิดอยู่ กด Enter ให้ปิด Popup
        if (errorAlert && errorAlert.style.display === 'flex') {
            event.preventDefault();
            closeError();
        } 
        // 2. ถ้า Popup ปิดอยู่ (หน้าจอปกติ) กด Enter ให้ทำการค้นหาผู้ป่วย
        else {
            // เช็คเพิ่มเผื่อว่าโฟล์คอยู่ในหน้า physio_index จริงๆ (มีช่องค้นหาอยู่บนหน้าจอ)
            const searchInput = document.getElementById('searchPatientInput');
            if (searchInput) {
                searchPatient();
            }
        }
    }
});
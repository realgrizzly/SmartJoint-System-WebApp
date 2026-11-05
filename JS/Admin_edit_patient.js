document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientKey = urlParams.get('id');

    if (!patientKey) {
        alert("ไม่พบรหัสผู้ป่วย");
        window.location.href = "Admin_menu1_patient.html"; // 💡 กลับหน้า Admin
        return;
    }

    const physioSelect = document.getElementById('physioCare');

    // 1. ดึงรายชื่อนักกายภาพบำบัดทั้งหมดในระบบมาใส่ใน Dropdown
    // (💡 หมายเหตุ: สมมติว่าโฟล์คเก็บข้อมูลนักกายภาพไว้ที่ users/physiotherapist นะครับ)
    firebase.database().ref('users/physio').once('value')
    .then((physioSnapshot) => {
        physioSelect.innerHTML = '<option value="" disabled selected>เลือกนักกายภาพบำบัด</option>';
        
        if (physioSnapshot.exists()) {
            physioSnapshot.forEach((child) => {
                const physioId = child.key; // UID ของนักกายภาพ
                const physioData = child.val();
                const physioName = physioData.name || (physioData.firstName + " " + physioData.lastName);
                
                const option = document.createElement('option');
                option.value = physioId;
                option.text = physioName;
                option.dataset.name = physioName; // แอบเก็บชื่อไว้ใช้ตอนบันทึก
                
                physioSelect.appendChild(option);
            });
        }

        // 2. โหลดข้อมูลผู้ป่วยมาโชว์ในช่องที่โดนล็อก
        return firebase.database().ref(`patient/${patientKey}`).once('value');
    })
    .then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            // ล็อกข้อมูลส่วนตัว
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
            document.getElementById('phone').value = data.phone || "-";

            // ล็อกข้อมูลการรักษา
            document.getElementById('measurementType').value = data.measurementType || "-";
            document.getElementById('posture').value = data.posture || "-";
            document.getElementById('bodySide').value = data.bodySide || "-";
            document.getElementById('DateStart').value = data.DateStart || "-";
            document.getElementById('History').value = data.History || "-";
            
            // 🎯 เลือกชื่อนักกายภาพคนปัจจุบันให้แสดงใน Dropdown อัตโนมัติ
            if (data.physioId) {
                physioSelect.value = data.physioId;
            }
            
            // 🚀 โค้ดสำรอง (Backup): ถ้าหาด้วย ID แล้วช่องยังว่างเปล่า ให้ลองหาจาก "ชื่อ" แทน
            if (!physioSelect.value || physioSelect.value === "") {
                const careName = data.physioName || data.physioCare; // ดึงชื่อจากฐานข้อมูลเก่า
                
                if (careName) {
                    let foundExactMatch = false;

                    // สเต็ปที่ 1: วนลูปหาแบบ "ชื่อ+นามสกุล" เป๊ะๆ ก่อน
                    for (let i = 0; i < physioSelect.options.length; i++) {
                        if (physioSelect.options[i].text === careName) {
                            physioSelect.selectedIndex = i; 
                            foundExactMatch = true;
                            break;
                        }
                    }

                    // สเต็ปที่ 2: ถ้าหาแบบเป๊ะๆ ไม่เจอ (นามสกุลอาจจะไม่ตรง) ให้ลองหาแค่ "ชื่อจริง"
                    if (!foundExactMatch) {
                        const firstNameOnly = careName.split(" ")[0]; // ตัดเอาแค่คำแรก
                        
                        for (let i = 0; i < physioSelect.options.length; i++) {
                            if (physioSelect.options[i].text.includes(firstNameOnly)) {
                                physioSelect.selectedIndex = i; 
                                break;
                            }
                        }
                    }
                }
            }
            
        } else {
            alert("ไม่พบข้อมูลผู้ป่วยในระบบ");
            window.location.href = "Admin_menu1_patient.html";
        }
    }).catch(err => {
        console.error("Error:", err);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    });

    // 3. ดักจับการกดปุ่ม "บันทึก"
    const editForm = document.getElementById('edit-patient-form');
    editForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        // ดึงค่า UID และ ชื่อ ของนักกายภาพคนที่ถูกเลือกใหม่
        const selectedOption = physioSelect.options[physioSelect.selectedIndex];
        
        if (!selectedOption.value) {
            alert("กรุณาเลือกนักกายภาพบำบัด");
            return;
        }

        const newPhysioId = selectedOption.value;
        const newPhysioName = selectedOption.dataset.name;

        // อัปเดตเฉพาะสิทธิ์การดูแล (แก้แค่ 2 ฟิลด์นี้)
        const updatedData = {
            physioId: newPhysioId,
            physioName: newPhysioName,
            physioCare: newPhysioName // อัปเดตเผื่อไว้กรณีที่โฟล์คใช้ตัวแปรนี้ด้วย
        };

        firebase.database().ref(`patient/${patientKey}`).update(updatedData)
        .then(() => {
            alert("โอนย้ายผู้ป่วยให้นักกายภาพบำบัดคนใหม่เรียบร้อยแล้ว!");
            window.location.href = "Admin_menu1_patient.html";
        })
        .catch((error) => {
            console.error("Error updating patient: ", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        });
    });
});

function buttonCancle() {
    window.location.href = "Admin_menu1_patient.html"; // 💡 กลับหน้า Admin
}
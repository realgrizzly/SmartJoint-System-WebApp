// ฟังก์ชันปุ่มยกเลิก (สะกดตาม HTML ของโฟล์ค)
function buttonCancle() {
    window.location.href = '../public/physio_home.html';
}

// ตอนโหลดหน้าเว็บ ไม่ต้องวิ่งไปคิวรี่หาข้อมูลในกิ่ง physio ให้ซับซ้อนแล้วครับ 
// เพราะไฟล์ check-physio.js ของโฟล์คจะทำหน้าที่จัดการดึงชื่อมาหยอดลงหน้าเว็บให้อยู่แล้ว
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // รอให้ check-physio.js หยอดชื่อเสร็จ แล้วดึงชื่อจากหัวเว็บมาใส่ช่องสีเทาชวนดู
        setTimeout(() => {
            const userNameOnHeader = document.getElementById('user-name').innerText;
            if (userNameOnHeader && userNameOnHeader !== "กำลังโหลด...") {
                document.getElementById('physioCare').value = userNameOnHeader;
            }
        }, 100); // หน่วงเวลา 0.1 วินาทีให้ฐานข้อมูลหลักดึงชื่อมาแปะหน้าเว็บเสร็จก่อน
    } else {
        window.location.href = '../public/index.html';
    }
});

// จัดการบันทึกข้อมูลฟอร์มผู้ป่วยเมื่อกด Submit
document.getElementById('add-patient-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert("เซสชันหมดอายุ กรุณาล็อกอินใหม่อีกครั้ง");
        window.location.href = '../public/index.html';
        return;
    }

    // 🚀 ดึงชื่อจากกล่องอินพุตสีเทา (#physioCare) ตรงๆ เลย ชัวร์ที่สุด!
    let physioName = document.getElementById('physioCare').value.trim();
    if (!physioName || physioName === "กำลังโหลด...") {
        // แผนสำรอง: ถ้าในช่องดันยังโหลดไม่เสร็จ ให้ดึงจากหัวข้อข้างบนสุดแทน
        physioName = document.getElementById('user-name').innerText;
    }

    // ดึงค่าจากกล่องอินพุตอื่นๆ ของโฟล์ค
    const patientId = document.getElementById('patientId').value.trim();
    const gender = document.getElementById('gender').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const measurementType = document.getElementById('measurementType').value;
    const posture = document.getElementById('posture').value;
    const bodySide = document.getElementById('bodySide').value;
    const DateStart = document.getElementById('DateStart').value;
    const phone = document.getElementById('phone').value.trim();
    const History = document.getElementById('History').value.trim();

    // ประกอบโครงสร้าง Data เข้าล็อกพิมพ์เขียว
    const patientData = {
        patientId: patientId,
        name: `${firstName} ${lastName}`, 
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        birthDate: birthDate,
        measurementType: measurementType,
        posture: posture,
        bodySide: bodySide,
        DateStart: DateStart,             
        phone: phone,
        History: History,                 
        physioId: currentUser.uid,        // 💡 เก็บ ID จาก FirebaseAuth (T7Pbro7...) เอาไว้ตรวจสอบสิทธิ์
        physioName: physioName,           // 💡 ชื่อจริง (เช่น แอนนา เบล) จะเข้าไปตรงๆ ไม่หลุดคำว่ากำลังโหลดแล้วครับ
        role: 'patient'
    };

    // ส่งข้อมูลเข้ากิ่ง /patient
    firebase.database().ref('patient').push(patientData)
        .then(() => {
            alert('บันทึกข้อมูลผู้ป่วยรายใหม่เข้าสู่ระบบสำเร็จแล้ว!');
            window.location.href = '../public/physio_home.html'; // กลับไปหน้าแรกของนักกายภาพบำบัด
        })
        .catch((error) => {
            console.error("Save Patient Error: ", error);
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
        });
});


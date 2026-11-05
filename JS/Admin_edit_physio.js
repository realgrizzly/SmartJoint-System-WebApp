window.onload = function() {
    // 1. แกะไอดีนักกายภาพบำบัดจาก URL Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const physioId = urlParams.get('id');

    if (physioId) {
        const dbRef = firebase.database().ref(`users/physio/${physioId}`);

        // 2. ดึงข้อมูลชุดเดิมจาก Firebase มาหยอดใส่กล่องรอก่อน
        dbRef.once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();

                document.getElementById('physioId').value = userData.physioId || '';
                document.getElementById('gender').value = userData.gender || 'ชาย';
                document.getElementById('username').value = userData.username || '';
                document.getElementById('password').value = userData.password || '';
                document.getElementById('email').value = userData.email || '';
                document.getElementById('phone').value = userData.phone || '';
                if(userData.createDate) {
                    document.getElementById('createDate').value = userData.createDate;
                }

                // หั่น ชื่อ-นามสกุล ออกจากกันด้วยช่องว่าง เพื่อแยกใส่กล่องซ้าย-ขวา
                if (userData.name) {
                    const nameParts = userData.name.split(" ");
                    document.getElementById('firstName').value = nameParts[0] || '';
                    document.getElementById('lastName').value = nameParts.slice(1).join(" ") || '';
                }
            } else {
                alert('ไม่พบข้อมูลนักกายภาพบำบัดท่านนี้ในระบบ');
                location.href = 'Admin_menu1_edit.html'; // กลับไปหน้าตารางหลัก
            }
        }).catch((error) => {
            console.error("ดึงข้อมูลมาแก้ไขผิดพลาด:", error);
        });

        // 3. เมื่อแอดมินแก้ไขเสร็จแล้วกดปุ่ม "บันทึก"
        document.getElementById('edit-physio-form').addEventListener('submit', (e) => {
            e.preventDefault(); 

            const updatedPhysioId = document.getElementById('physioId').value;
            const updatedGender = document.getElementById('gender').value;
            const updatedFirstName = document.getElementById('firstName').value;
            const updatedLastName = document.getElementById('lastName').value;
            const updatedUsername = document.getElementById('username').value;
            const updatedPhone = document.getElementById('phone').value;
            const updatedCreateDate = document.getElementById('createDate').value;

            // รวม ชื่อ+นามสกุล กลับเป็นก้อนเดียวในคีย์ name
            const fullName = `${updatedFirstName} ${updatedLastName}`;

            // 💡 สั่งอัปเดตข้อมูลเฉพาะส่วนที่อนุญาตให้แก้ (ไม่รวม email และ password ในการ update)
            dbRef.update({
                physioId: updatedPhysioId,
                gender: updatedGender,
                name: fullName,
                username: updatedUsername,
                phone: updatedPhone,
                createDate: updatedCreateDate
            })
            .then(() => {
                alert('แก้ไขข้อมูลนักกายภาพบำบัดสำเร็จแล้ว!');
                window.location.href = 'Admin_menu1_physio.html'; // กลับไปหน้าตารางหลัก
            })
            .catch((error) => {
                console.error("อัปเดตข้อมูลผิดพลาด: ", error);
                alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
            });
        });
    } else {
        alert('กรุณาระบุไอดีที่ต้องการแก้ไข');
        location.href = 'Admin_menu1_edit.html';
    }
};

function buttonCancle() {
    location.href = 'Admin_menu1_physio.html';
}
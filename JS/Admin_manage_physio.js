const tableBody = document.getElementById('table-physio');
const physioRef = firebase.database().ref('users/physio'); 

// เปลี่ยนกลับมาใช้การดึงค่าแบบ Realtime ลูปอ่านตามคีย์สุ่ม (.push)
physioRef.on('value', (snapshot) => {
    tableBody.innerHTML = ''; 

    if (snapshot.exists()) {
        let count = 1; // ตัวนับลำดับ ID 01, 02, 03...

        // ลูปอ่านข้อมูลพนักงานทุกคนที่อยู่ในกลุ่ม physio
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val(); // ดึงค่าในปีกกา { name, gender, ... }
            const userId = childSnapshot.key;    // ดึงคีย์สุ่ม (เช่น -Nxxxxxxxx) เอาไว้ใช้ลบ/แก้ไข

            // Format เบอร์โทรศัพท์
            let rawPhone = userData.phone || '';
            let formattedPhone = '-'; // ค่าเริ่มต้นกรณีไม่มีข้อมูล

            if (rawPhone.length === 10) {
                // ถ้าครบ 10 หลัก ตัด 3 ตัวแรกมา - ตามด้วย 7 ตัวที่เหลือ
                formattedPhone = `${rawPhone.slice(0, 3)}-${rawPhone.slice(3)}`;
            } else if (rawPhone.length === 9) {
                // เผื่อไว้สำหรับเบอร์บ้าน 9 หลัก (055-536153)
                formattedPhone = `${rawPhone.slice(0, 3)}-${rawPhone.slice(3)}`;
            } else if (rawPhone !== '') {
                // ถ้ามีข้อมูลแต่หลักไม่ครบ ให้โชว์เท่าที่พิมพ์มา
                formattedPhone = rawPhone;
            }

            // ฟอร์แมตลำดับตัวเลขให้เป็น 2 หลัก (01, 02, 03)
            const displayId = String(count).padStart(2, '0');

            // สร้างแถวข้อมูลตาราง ดึงคีย์ตรงตามที่เรากรอกในฟอร์มเป๊ะๆ
            const rowHTML = `
                <tr>
                    <td>${displayId}</td>
                    <td>${userData.name || '-'}</td>
                    <td>${userData.gender || '-'}</td>
                    <td>${userData.physioId || '-'}</td>
                    <td>${userData.username || '-'}</td>
                    <td>${formattedPhone}</td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 5px; padding: 5px; align-items: center;">
                            <button onclick="viewDetails('${userId}')" style="background-color: #3498db; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px; ">ดูรายละเอียด</button>
                            <button onclick="editPhysio('${userId}')" style="background-color: #f39c12; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px; ">แก้ไข</button>
                            <button onclick="deletePhysio('${userId}', '${userData.name}')" style="background-color: #e74c3c; color:white; border:solid 2px black; padding: 2px 10px; cursor:pointer; width: 100px; ">ลบ</button>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += rowHTML; // ใช้ += เพื่อต่อแถวลงไปเรื่อยๆ ตามจำนวนพนักงาน
            count++;
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="7">ไม่พบข้อมูลนักกายภาพบำบัด</td></tr>';
    }
}, (error) => {
    console.error("Firebase Error: ", error);
});

// ฟังก์ชันสำหรับกดปุ่มลบข้อมูลพนักงานอ้างอิงตามคีย์
function deletePhysio(id, name) {
    if (confirm(`คุณต้องการลบข้อมูลของ ${name} ใช่หรือไม่?`)) {
        firebase.database().ref('users/physio/' + id).remove()
            .then(() => alert('ลบข้อมูลสำเร็จ!'))
            .catch((err) => alert('ลบไม่สำเร็จ: ' + err.message));
    }
}

function addPhysio(){
    location.href = 'Admin_menu1_addphysio.html';
};

// ไปหน้าดูรายละเอียด
function viewDetails(id) {
    window.location.href = `Admin_viewphysio.html?id=${encodeURIComponent(id)}`;
}

function  editPhysio(id) {
    window.location.href = `../Admin_editphysio.html?id=${encodeURIComponent(id)}`;
}
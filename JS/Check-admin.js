(function() {
    // 1. ดึงข้อมูลสิทธิ์จาก Browser Storage (แบบ Session)
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');

    // 2. เช็คเงื่อนไข: ถ้าไม่มีข้อมูล หรือไม่ได้ล็อกอิน หรือสิทธิ์ไม่ใช่ 'admin'
    if (!isLoggedIn || isLoggedIn !== 'true' || userRole !== 'admin') {
        // ขึ้นกล่อง Alert แจ้งเตือนของฝั่งแอดมิน
        alert('เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์เข้าถึงหน้านี้');
        
        // ดีดกลับไปที่หน้า Login ปกติทันที
        window.location.href = 'index.html';
    }
})();

document.addEventListener('DOMContentLoaded', () => {
      // ดึงชื่อผู้ใช้ที่เซฟไว้ตอนล็อกอินสำเร็จจาก sessionStorage (หรือ เปลี่ยนเป็น localStorage ตามที่โฟล์คใช้เก็บค่า)
    const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName');
    
      // นำชื่อไปแปะใน HTML
    const userNameSpan = document.getElementById('user-name');
    if (userNameSpan) {
        if (userName) {
            userNameSpan.innerText = userName;
        } else {
            userNameSpan.innerText = 'ไม่ระบุชื่อ'; // กรณีไม่มีข้อมูลชื่อค้างอยู่
        }
    }
});
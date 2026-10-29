function Logout() {
    alert("ออกจากระบบเรียบร้อย");

    console.log("Current URL:", window.location.href);

    sessionStorage.clear();
    localStorage.clear();

    window.location.href = "../../public/index.html";
}
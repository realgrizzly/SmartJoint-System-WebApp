const firebaseConfig = {
  apiKey: "AIzaSyAP_wzv05lZDO5JwlWx1YbEQSXRljRxIJs",
  authDomain: "smart-joint-senser.firebaseapp.com",
  databaseURL: "https://smart-joint-senser-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-joint-senser",
  storageBucket: "smart-joint-senser.firebasestorage.app",
  messagingSenderId: "1078398581671",
  appId: "1:1078398581671:web:e13aab70f23a1a900e5482",
  measurementId: "G-Z3SNECGNBG"
};

// เริ่มต้นเปิดใช้งานโปรเจกต์
firebase.initializeApp(firebaseConfig);
const database = firebase.database();


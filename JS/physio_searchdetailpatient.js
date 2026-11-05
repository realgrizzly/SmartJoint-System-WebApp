/* JOINT MOTION SYSTEM
 * Browser-based sensor simulator for development before ESP32 hardware is ready.
 * RTDB paths:
 * patient/{patientKey}/liveMeasurement
 * patient/{patientKey}/treatmentHistory/{recordKey}
 * All simulator-generated records are marked source: "simulation".
 */

const params = new URLSearchParams(window.location.search);
const patientKey = params.get("id");
const HISTORY_CHILD = "treatmentHistory";
const LIVE_CHILD = "liveMeasurement";

let patientData = {};
let isMeasuring = false;
let simulationTimer = null;
let chartInstance = null;
let startedAt = null;
let elapsedSeconds = 0;
let currentAngle = 0;
let minAngle = null;
let maxAngle = null;
let angleSamples = [];
let lastLiveWrite = 0;

const $ = (id) => document.getElementById(id);
const db = () => firebase.database();

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function setSensorStatus(online) {
  ["status-s1", "status-s2"].forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.textContent = online ? "ออนไลน์ (จำลอง)" : "ออฟไลน์";
    element.classList.toggle("status-offline", !online);
    element.classList.toggle("status-online", online);
  });
}

function updateAngleDisplay() {
  setText("current-angle", `${currentAngle.toFixed(1)}°`);
  setText("max-angle", maxAngle === null ? "0°" : `${maxAngle.toFixed(1)}°`);
  setText("min-angle", minAngle === null ? "0°" : `${minAngle.toFixed(1)}°`);
}

function initChart() {
  const canvas = $("treatmentChart");
  if (!canvas || typeof Chart === "undefined") return;

  chartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "องศาการเคลื่อนไหว (ข้อมูลจำลอง)",
        data: [],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.10)",
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { title: { display: true, text: "เวลาที่วัด (วินาที)" } },
        y: {
          min: 0,
          max: 180,
          title: { display: true, text: "องศา (°)" }
        }
      },
      plugins: {
        tooltip: { callbacks: { label: (context) => ` ${context.parsed.y.toFixed(1)}°` } }
      }
    }
  });
}

function updateChart() {
  if (!chartInstance) return;
  chartInstance.data.labels = angleSamples.map((point) => point.elapsedSeconds);
  chartInstance.data.datasets[0].data = angleSamples.map((point) => point.angle);
  chartInstance.update("none");
}

function resetMeasurementState() {
  elapsedSeconds = 0;
  currentAngle = 0;
  minAngle = null;
  maxAngle = null;
  angleSamples = [];
  updateAngleDisplay();
  updateChart();
}

function setMeasureButton(active) {
  const button = $("btn-toggle-measure");
  if (!button) return;
  button.classList.toggle("btn-measure-active", active);
  button.classList.toggle("btn-measure-idle", !active);
  button.textContent = active ? "หยุดวัด" : "เริ่มวัด";
}

function getMeasurementType() {
  return patientData.measurementType || "ไม่ระบุ";
}

function getLocalDateTime() {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    timestamp: now.getTime()
  };
}

// Smooth, repeatable motion pattern to imitate a joint moving through an exercise.
function generateSimulatedAngle() {
  const seconds = elapsedSeconds;
  const wave = (Math.sin(seconds * 0.72) + 1) / 2;
  const smallVariation = Math.sin(seconds * 2.15) * 2.2;
  return Math.max(0, Math.min(180, 18 + wave * 92 + smallVariation));
}

async function writeLiveMeasurement() {
  if (!patientKey) return;
  const now = Date.now();
  // Keep writes to roughly one per second to avoid unnecessary RTDB traffic.
  if (now - lastLiveWrite < 950) return;
  lastLiveWrite = now;

  try {
    await db().ref(`patient/${patientKey}/${LIVE_CHILD}`).update({
      currentAngle: Number(currentAngle.toFixed(1)),
      maxAngle: Number(maxAngle.toFixed(1)),
      minAngle: Number(minAngle.toFixed(1)),
      sensor1Status: "online",
      sensor2Status: "online",
      isMeasuring: true,
      source: "simulation",
      updatedAt: now
    });
  } catch (error) {
    console.error("เขียนค่า liveMeasurement ไม่สำเร็จ:", error);
  }
}

function measurementTick() {
  elapsedSeconds += 1;
  currentAngle = Number(generateSimulatedAngle().toFixed(1));
  minAngle = minAngle === null ? currentAngle : Math.min(minAngle, currentAngle);
  maxAngle = maxAngle === null ? currentAngle : Math.max(maxAngle, currentAngle);

  angleSamples.push({
    elapsedSeconds,
    angle: currentAngle,
    timestamp: Date.now()
  });

  // Keep chart and session data at a manageable size (up to 30 minutes).
  if (angleSamples.length > 1800) angleSamples.shift();
  updateAngleDisplay();
  updateChart();
  writeLiveMeasurement();
}

async function startMeasurement() {
  if (isMeasuring) return;
  if (!patientKey) return;
  if (angleSamples.length === 0) resetMeasurementState();

  isMeasuring = true;
  startedAt = Date.now();
  lastLiveWrite = 0;
  setMeasureButton(true);
  setSensorStatus(true);
  measurementTick();
  simulationTimer = window.setInterval(measurementTick, 1000);

  try {
    await db().ref(`patient/${patientKey}/${LIVE_CHILD}`).update({
      isMeasuring: true,
      source: "simulation",
      sensor1Status: "online",
      sensor2Status: "online",
      startedAt
    });
  } catch (error) {
    console.error("เริ่มสถานะจำลองบน Firebase ไม่สำเร็จ:", error);
  }
}

async function stopMeasurement() {
  if (!isMeasuring) return;
  isMeasuring = false;
  window.clearInterval(simulationTimer);
  simulationTimer = null;
  setMeasureButton(false);
  setSensorStatus(false);

  try {
    await db().ref(`patient/${patientKey}/${LIVE_CHILD}`).update({
      currentAngle: Number(currentAngle.toFixed(1)),
      maxAngle: maxAngle === null ? null : Number(maxAngle.toFixed(1)),
      minAngle: minAngle === null ? null : Number(minAngle.toFixed(1)),
      isMeasuring: false,
      sensor1Status: "offline",
      sensor2Status: "offline",
      source: "simulation",
      stoppedAt: Date.now()
    });
  } catch (error) {
    console.error("อัปเดตสถานะหยุดวัดไม่สำเร็จ:", error);
  }
}

async function saveTreatment() {
  if (isMeasuring) {
    alert("กรุณาหยุดวัดก่อนบันทึกข้อมูล");
    return;
  }
  if (angleSamples.length < 2 || maxAngle === null || minAngle === null) {
    alert("ยังไม่มีข้อมูลการวัด กรุณากดเริ่มวัดและรอให้มีข้อมูลก่อน");
    return;
  }

  const { date, time, timestamp } = getLocalDateTime();
  const averageAngle = angleSamples.reduce((sum, point) => sum + point.angle, 0) / angleSamples.length;
  const record = {
    date,
    time,
    timestamp,
    measurementType: getMeasurementType(),
    bodySide: patientData.bodySide || "ไม่ระบุ",
    posture: patientData.posture || "ไม่ระบุ",
    currentAngle: Number(currentAngle.toFixed(1)),
    maxAngle: Number(maxAngle.toFixed(1)),
    minAngle: Number(minAngle.toFixed(1)),
    averageAngle: Number(averageAngle.toFixed(1)),
    durationSeconds: elapsedSeconds,
    angleSeries: angleSamples,
    source: "simulation",
    note: "ข้อมูลจากการจำลองเซนเซอร์บนเว็บไซต์ ไม่ใช่ข้อมูลจาก ESP32 จริง"
  };

  const button = $("btn-save-data");
  if (button) button.disabled = true;
  try {
    const newRecord = db().ref(`patient/${patientKey}/${HISTORY_CHILD}`).push();
    await newRecord.set(record);
    alert("บันทึกข้อมูลจำลองลง Firebase เรียบร้อยแล้ว");
  } catch (error) {
    console.error("บันทึกประวัติการรักษาไม่สำเร็จ:", error);
    alert(`บันทึกไม่สำเร็จ: ${error.message || "กรุณาตรวจสอบ Firebase Rules และการเชื่อมต่อ"}`);
  } finally {
    if (button) button.disabled = false;
  }
}

async function resetMeasurement() {
  if (isMeasuring) await stopMeasurement();
  resetMeasurementState();
  startedAt = null;
  alert("รีเซ็ตข้อมูลการวัดบนหน้าจอแล้ว (ประวัติที่บันทึกไว้จะไม่ถูกลบ)");
}

async function loadPatient() {
  if (!patientKey) {
    alert("ไม่พบรหัสผู้ป่วยใน URL");
    return;
  }

  try {
    const snapshot = await db().ref(`patient/${patientKey}`).once("value");
    if (!snapshot.exists()) {
      alert("ไม่พบข้อมูลผู้ป่วยในระบบ");
      return;
    }

    patientData = snapshot.val() || {};
    setText("lbl-name", patientData.name || "-");
    setText("lbl-patientId", patientData.patientId || "-");
    setText("lbl-gender", patientData.gender || "-");
    setText("lbl-measurementType", patientData.measurementType || "-");
    setText("lbl-bodySide", patientData.bodySide || "-");
    setText("lbl-DateStart", patientData.DateStart || "-");
    setText("lbl-posture", patientData.posture || "-");
    setText("lbl-phone", patientData.phone || "-");
    setText("lbl-physioName", patientData.physioName || "-");
    setText("lbl-History", patientData.History || "-");

    if (patientData.birthDate) {
      const birth = new Date(patientData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
      setText("lbl-age", String(age));
    } else {
      setText("lbl-age", "-");
    }

    document.title = `${patientData.name || "รายละเอียดผู้ป่วย"} | JOINT MOTION SYSTEM`;
  } catch (error) {
    console.error("โหลดข้อมูลผู้ป่วยไม่สำเร็จ:", error);
    alert(`โหลดข้อมูลผู้ป่วยไม่สำเร็จ: ${error.message || "เกิดข้อผิดพลาด"}`);
  }
}

function bindControls() {
  $("btn-toggle-measure")?.addEventListener("click", () => {
    if (isMeasuring) stopMeasurement();
    else startMeasurement();
  });
  $("btn-reset")?.addEventListener("click", resetMeasurement);
  $("btn-save-data")?.addEventListener("click", saveTreatment);
  $("btn-history")?.addEventListener("click", () => {
    window.location.href = `physio_treatmenthistory.html?id=${encodeURIComponent(patientKey)}`;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof firebase === "undefined" || !firebase.database) {
    alert("ไม่พบ Firebase Realtime Database กรุณาตรวจสอบการโหลด firebase-config.js");
    return;
  }
  initChart();
  setMeasureButton(false);
  setSensorStatus(false);
  bindControls();
  await loadPatient();
});

window.addEventListener("beforeunload", () => {
  if (simulationTimer) window.clearInterval(simulationTimer);
});

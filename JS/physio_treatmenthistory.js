/* JOINT MOTION SYSTEM - Treatment History
 *
 * Firebase path expected by this page:
 * patient/{patientKey}/treatmentHistory/{recordKey}
 *
 * Each record can contain:
 * date, time, measurementType, bodySide, posture,
 * maxAngle, minAngle, currentAngle, averageAngle, note/notes
 *
 * If the current save function stores records elsewhere or uses different
 * field names, update HISTORY_CHILD below and normalizeRecord().
 */

const HISTORY_CHILD = "treatmentHistory";
const params = new URLSearchParams(window.location.search);
const patientKey = params.get("id");

let patientData = {};
let allHistory = [];
let visibleHistory = [];
let allSessionsChart = null;

const $ = (id) => document.getElementById(id);

function safeText(value, fallback = "-") {
  return value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value)
    : fallback;
}

function formatDate(value) {
  if (!value) return "-";

  // Supports timestamp, ISO date, and common date strings.
  let date;
  if (typeof value === "number") {
    date = new Date(value);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date = new Date(`${value}T00:00:00`);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric", month: "short", day: "numeric"
  }).format(date);
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRecord(key, record) {
  const item = record || {};
  const timestamp = toNumber(item.timestamp || item.createdAt || item.dateTime);

  return {
    key,
    raw: item,
    date: item.date || item.sessionDate || (timestamp ? new Date(timestamp).toISOString().slice(0, 10) : ""),
    time: item.time || item.sessionTime || (timestamp ? new Date(timestamp).toLocaleTimeString("th-TH", {hour:"2-digit", minute:"2-digit"}) : ""),
    measurementType: item.measurementType || item.type || patientData.measurementType || "-",
    bodySide: item.bodySide || item.side || patientData.bodySide || "-",
    posture: item.posture || item.exercise || item.position || "-",
    maxAngle: toNumber(item.maxAngle ?? item.maximumAngle ?? item.max),
    minAngle: toNumber(item.minAngle ?? item.minimumAngle ?? item.min),
    currentAngle: toNumber(item.currentAngle ?? item.angle ?? item.value),
    averageAngle: toNumber(item.averageAngle ?? item.avgAngle),
    note: item.note || item.notes || item.description || "-",
    // Supports arrays such as [{time:"00:01", angle:25}, ...]
    angleSeries: normalizeAngleSeries(item)
  };
}

function normalizeAngleSeries(item) {
  const source = item.angleSeries || item.angleData || item.measurements ||
    item.samples || item.chartData || item.readings;

  if (Array.isArray(source)) {
    return source.map((point, index) => {
      if (typeof point === "number") {
        return { label: String(index + 1), angle: point };
      }
      return {
        label: safeText(point.time || point.label || point.timestamp, String(index + 1)),
        angle: toNumber(point.angle ?? point.value ?? point.currentAngle)
      };
    }).filter(point => point.angle !== null);
  }

  // Also accepts parallel arrays: labels/timestamps and angles/values.
  const values = item.angles || item.values;
  const labels = item.labels || item.timestamps;
  if (Array.isArray(values)) {
    return values.map((value, index) => ({
      label: Array.isArray(labels) ? safeText(labels[index], String(index + 1)) : String(index + 1),
      angle: toNumber(value)
    })).filter(point => point.angle !== null);
  }

  return [];
}

function renderPatient() {
  $("patient-name").textContent = safeText(patientData.name, "ไม่พบชื่อผู้ป่วย");
  $("patient-id").textContent = safeText(patientData.patientId);
  $("patient-gender").textContent = safeText(patientData.gender);
  $("physio-name").textContent = safeText(patientData.physioName || patientData.physiotherapist);
  $("measurement-type").textContent = `ประเภทการวัด: ${safeText(patientData.measurementType)}`;
  $("body-side").textContent = `ตำแหน่ง: ${safeText(patientData.bodySide)}`;

  const name = safeText(patientData.name, "ผู้ป่วย");
  document.title = `ประวัติการรักษา ${name} | JOINT MOTION SYSTEM`;
}

function updateSummary() {
  $("total-records").textContent = allHistory.length;

  if (!allHistory.length) {
    $("last-session").textContent = "-";
    $("last-session-time").textContent = "ยังไม่มีข้อมูล";
    $("overall-max").textContent = "-";
    return;
  }

  const sorted = [...allHistory].sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
  );
  $("last-session").textContent = formatDate(sorted[0].date);
  $("last-session-time").textContent = sorted[0].time || "ไม่ระบุเวลา";

  const maxValues = allHistory.map(x => x.maxAngle).filter(x => x !== null);
  $("overall-max").textContent = maxValues.length
    ? `${Math.max(...maxValues)}°`
    : "-";
}

function renderAllSessionsChart() {
  const canvas = $("all-sessions-chart");
  if (!canvas || typeof Chart === "undefined") return;

  if (allSessionsChart) {
    allSessionsChart.destroy();
    allSessionsChart = null;
  }

  // Every saved treatment is one X-axis category, ordered from oldest to newest.
  const chronological = [...allHistory].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );

  const labels = chronological.map(item => {
    const dateLabel = formatDate(item.date);
    return item.time ? `${dateLabel} ${item.time}` : dateLabel;
  });

  const maxData = chronological.map(item => item.maxAngle);
  const minData = chronological.map(item => item.minAngle);
  const avgData = chronological.map(item => item.averageAngle);

  const datasets = [
    {
      label: "ค่ามุมสูงสุด",
      data: maxData,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.10)",
      pointBackgroundColor: "#2563eb",
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.25,
      spanGaps: true
    },
    {
      label: "ค่ามุมต่ำสุด",
      data: minData,
      borderColor: "#16a34a",
      backgroundColor: "rgba(22, 163, 74, 0.08)",
      pointBackgroundColor: "#16a34a",
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.25,
      spanGaps: true
    }
  ];

  // Show the average line only when at least one session has an average value.
  if (avgData.some(value => value !== null)) {
    datasets.push({
      label: "ค่าเฉลี่ย",
      data: avgData,
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      pointBackgroundColor: "#f59e0b",
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderDash: [5, 4],
      tension: 0.25,
      spanGaps: true
    });
  }

  const note = $("history-chart-note");
  if (!chronological.length || !chronological.some(item =>
    item.maxAngle !== null || item.minAngle !== null || item.averageAngle !== null
  )) {
    if (note) {
      note.textContent = "ยังไม่มีข้อมูลค่ามุมที่บันทึกไว้ กราฟจะแสดงเมื่อมีประวัติการรักษาพร้อมค่ามุม";
    }
  } else if (note) {
    note.textContent = "แต่ละจุดแทนการรักษา 1 ครั้ง เรียงจากวันที่เก่าไปใหม่ สามารถชี้ที่จุดเพื่อดูวันที่ เวลา และค่าองศา";
  }

  allSessionsChart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, boxWidth: 8, padding: 18 }
        },
        tooltip: {
          callbacks: {
            title(context) {
              const item = chronological[context[0].dataIndex];
              return `${formatDate(item.date)}${item.time ? ` เวลา ${item.time}` : ""}`;
            },
            afterTitle(context) {
              const item = chronological[context[0].dataIndex];
              return `ท่ากายภาพ: ${safeText(item.posture)}`;
            },
            label(context) {
              return ` ${context.dataset.label}: ${context.parsed.y ?? "-"}°`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "วันที่เข้ารับการรักษา" },
          grid: { display: false },
          ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 180,
          title: { display: true, text: "องศาการเคลื่อนไหว (°)" }
        }
      }
    }
  });
}

function renderTable(records) {
  const tbody = $("history-table");
  visibleHistory = records;

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">
      <i class="fa-regular fa-folder-open"></i>
      ไม่พบประวัติการรักษาในเงื่อนไขที่เลือก
    </td></tr>`;
    $("result-count").textContent = "แสดง 0 รายการ";
    return;
  }

  tbody.innerHTML = records.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${formatDate(item.date)}<br><small>${safeText(item.time, "ไม่ระบุเวลา")}</small></td>
      <td>${safeText(item.measurementType)}</td>
      <td>${safeText(item.posture)}</td>
      <td class="angle-cell">${item.maxAngle === null ? "-" : `${item.maxAngle}°`}</td>
      <td class="angle-cell">${item.minAngle === null ? "-" : `${item.minAngle}°`}</td>
      <td class="note-cell" title="${escapeHtml(item.note)}">${escapeHtml(item.note)}</td>
      <td><button class="btn-detail" data-key="${escapeHtml(item.key)}">ดูรายละเอียด</button></td>
    </tr>
  `).join("");

  $("result-count").textContent = `แสดง ${records.length} จาก ${allHistory.length} รายการ`;

  tbody.querySelectorAll(".btn-detail").forEach(button => {
    button.addEventListener("click", () => {
      const record = allHistory.find(item => item.key === button.dataset.key);
      if (record) openDetail(record);
    });
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function applyFilters() {
  const keyword = $("search-history").value.trim().toLowerCase();
  const from = $("date-from").value;
  const to = $("date-to").value;

  const filtered = allHistory.filter(item => {
    const searchable = [
      item.measurementType, item.bodySide, item.posture, item.note
    ].join(" ").toLowerCase();

    return (!keyword || searchable.includes(keyword)) &&
      (!from || (item.date && item.date >= from)) &&
      (!to || (item.date && item.date <= to));
  }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  renderTable(filtered);
}

function openDetail(item) {
  const fields = [
    ["วันที่รักษา", formatDate(item.date)],
    ["เวลา", safeText(item.time)],
    ["ประเภทการวัด", safeText(item.measurementType)],
    ["ตำแหน่ง", safeText(item.bodySide)],
    ["ท่ากายภาพบำบัด", safeText(item.posture)],
    ["ค่ามุมสูงสุด", item.maxAngle === null ? "-" : `${item.maxAngle}°`],
    ["ค่ามุมต่ำสุด", item.minAngle === null ? "-" : `${item.minAngle}°`],
    ["ค่ามุมล่าสุด", item.currentAngle === null ? "-" : `${item.currentAngle}°`],
    ["ค่าเฉลี่ย", item.averageAngle === null ? "-" : `${item.averageAngle}°`],
    ["บันทึกเพิ่มเติม", safeText(item.note)]
  ];

  $("detail-content").innerHTML = fields.map(([label, value]) => `
    <div class="detail-item"><label>${escapeHtml(label)}</label><strong>${escapeHtml(value)}</strong></div>
  `).join("");

  $("detail-modal").classList.add("show");
  $("detail-modal").setAttribute("aria-hidden", "false");


}

function closeDetail() {
  $("detail-modal").classList.remove("show");
  $("detail-modal").setAttribute("aria-hidden", "true");
}

function exportCSV() {
  if (!visibleHistory.length) {
    alert("ไม่มีข้อมูลสำหรับส่งออก");
    return;
  }

  const headers = ["วันที่", "เวลา", "ประเภทการวัด", "ตำแหน่ง", "ท่ากายภาพบำบัด", "ค่ามุมสูงสุด", "ค่ามุมต่ำสุด", "ค่ามุมล่าสุด", "ค่าเฉลี่ย", "หมายเหตุ"];
  const rows = visibleHistory.map(item => [
    item.date, item.time, item.measurementType, item.bodySide, item.posture,
    item.maxAngle ?? "", item.minAngle ?? "", item.currentAngle ?? "",
    item.averageAngle ?? "", item.note
  ]);
  const csv = [headers, ...rows].map(row =>
    row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\r\n");

  // BOM helps spreadsheet software display Thai text correctly.
  const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `treatment_history_${patientData.patientId || patientKey}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadHistoryPage() {
  if (!patientKey) {
    $("patient-name").textContent = "ไม่พบรหัสผู้ป่วย";
    $("history-table").innerHTML = `<tr><td colspan="8" class="error-cell">ไม่พบพารามิเตอร์ id ใน URL กรุณาเปิดหน้านี้จากหน้าข้อมูลผู้ป่วย</td></tr>`;
    return;
  }

  if (typeof firebase === "undefined" || !firebase.database) {
    $("history-table").innerHTML = `<tr><td colspan="8" class="error-cell">ไม่พบการเชื่อมต่อ Firebase กรุณาตรวจสอบ firebase-config.js</td></tr>`;
    return;
  }

  try {
    const patientSnapshot = await firebase.database().ref(`patient/${patientKey}`).once("value");
    if (patientSnapshot.exists()) {
      patientData = patientSnapshot.val() || {};
      renderPatient();
    } else {
      $("patient-name").textContent = "ไม่พบข้อมูลผู้ป่วย";
    }

    const historySnapshot = await firebase.database()
      .ref(`patient/${patientKey}/${HISTORY_CHILD}`)
      .once("value");

    if (!historySnapshot.exists()) {
      allHistory = [];
      updateSummary();
      renderAllSessionsChart();
      renderTable([]);
      return;
    }

    const raw = historySnapshot.val();
    allHistory = Object.entries(raw).map(([key, value]) => normalizeRecord(key, value))
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    updateSummary();
    renderAllSessionsChart();
    applyFilters();
  } catch (error) {
    console.error("Load treatment history error:", error);
    $("history-table").innerHTML = `<tr><td colspan="8" class="error-cell">โหลดประวัติไม่สำเร็จ: ${escapeHtml(error.message || "เกิดข้อผิดพลาด")}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("btn-back").addEventListener("click", () => {
    window.location.href = `physio_searchdetailpatient.html?id=${encodeURIComponent(patientKey || "")}`;
  });

  ["search-history", "date-from", "date-to"].forEach(id =>
    $(id).addEventListener(id === "search-history" ? "input" : "change", applyFilters)
  );

  $("btn-clear").addEventListener("click", () => {
    $("search-history").value = "";
    $("date-from").value = "";
    $("date-to").value = "";
    applyFilters();
  });

  $("btn-export").addEventListener("click", exportCSV);
  $("modal-close").addEventListener("click", closeDetail);
  $("modal-close-bottom").addEventListener("click", closeDetail);
  $("detail-modal").addEventListener("click", event => {
    if (event.target.id === "detail-modal") closeDetail();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeDetail();
  });

  loadHistoryPage();
});

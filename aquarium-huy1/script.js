import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = { 
  apiKey : "AIzaSyCFVPjjXWMOa2miE2OoEWzKzDjmmjQMlcs" , 
  authDomain : "smartaquarium-25bd7.firebaseapp.com" , 
  projectId : "smartaquarium-25bd7" , 
  storageBucket : "smartaquarium-25bd7.firebasestorage.app" , 
  messagingSenderId : "268626197317" , 
  appId : "1:268626197317:web:203298c91a7920d2d05c2c" , 
  measurementId : "G-Z6H7R4QRVD" 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const docRef = doc(db, "test", "qVE4OEB3bRcOjzsBnzPz");
/* ==== UI refs (KHỚP HTML) ==== */
const tdsEl = document.getElementById("tds");
const lightEl = document.getElementById("light");
const updatedAtEl = document.getElementById("updatedAt");
const pumpEl = document.getElementById("pump");
const lastPumpEl = document.getElementById("lastPump");
const alertEl = document.getElementById("alert");
const statusEl = document.getElementById("status");
const dotEl = document.getElementById("dot");
const brightnessEl = document.getElementById("brightness");
const brightTextEl = document.getElementById("brightText");
const colorEl = document.getElementById("color");
const colorBoxEl = document.getElementById("colorBox");
const colorHexEl = document.getElementById("colorHex");
const saveLedBtn = document.getElementById("saveLed");
const toastEl = document.getElementById("toast");

function setStatus(state, text) {
  statusEl.textContent = text;
  dotEl.classList.remove("ok", "warn", "error");
  if (state) {
    dotEl.classList.add(state);
  }
}

function waterStatusText(v) {
  if (v == null) return "--";
  if (v >= 70) return "⚠️ Nước kém";
  if (v >= 40) return "Nước trung bình";
  return "Nước tốt";
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 1600);
}

function setColorUi(hex) {
  colorBoxEl.style.background = hex;
  colorHexEl.textContent = hex.toUpperCase();
}

function syncBrightness(value) {
  brightTextEl.textContent = `${value}%`;
}

colorEl.addEventListener("input", (event) => {
  setColorUi(event.target.value);
});

brightnessEl.addEventListener("input", (event) => {
  syncBrightness(event.target.value);
});

setColorUi(colorEl.value);
syncBrightness(brightnessEl.value);

saveLedBtn.addEventListener("click", async () => {
  saveLedBtn.disabled = true;
  saveLedBtn.textContent = "Đang lưu...";

  try {
    await updateDoc(docRef, {
      led_brightness: Number(brightnessEl.value),
      led_color: colorEl.value
    });
    showToast("Đã lưu!");
  } catch (error) {
    alertEl.textContent = `Lỗi lưu LED: ${error.message}`;
    showToast("Lưu thất bại");
  } finally {
    saveLedBtn.disabled = false;
    saveLedBtn.textContent = "Lưu LED";
  }
});

/* ==== LISTEN REALTIME FIRESTORE ==== */
onSnapshot(
  docRef,
  (snap) => {
    if (!snap.exists()) {
      setStatus("warn", "Không thấy dữ liệu");
      alertEl.textContent =
        "Không tìm thấy document. Kiểm tra collection/document ID.";
      return;
    }

    setStatus("ok", "Đã kết nối");

    const d = snap.data();

    tdsEl.textContent = d.water_quality ?? "--";
    lightEl.textContent = d.lux ?? "--";

    alertEl.textContent =
      d.alert_message && d.alert_message !== ""
        ? d.alert_message
        : waterStatusText(d.water_quality);

    pumpEl.textContent = d.water_status ?? "--";
    lastPumpEl.textContent = "--";

    updatedAtEl.textContent = new Date().toLocaleString();
  },
  (error) => {
    setStatus("error", "Không kết nối");
    alertEl.textContent = `Lỗi Firebase: ${error.message}`;
  }
);
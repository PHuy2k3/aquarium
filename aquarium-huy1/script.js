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
const feedTimeEl = document.getElementById("feedTime");
const saveFeedBtn = document.getElementById("saveFeed");
const feedNowBtn = document.getElementById("feedNow");
const lastFeedEl = document.getElementById("lastFeed");
const waterTimeEl = document.getElementById("waterTime");
const saveWaterBtn = document.getElementById("saveWater");
const waterNowBtn = document.getElementById("waterNow");
const lastWaterEl = document.getElementById("lastWater");
const shareUrlEl = document.getElementById("shareUrl");
const copyLinkBtn = document.getElementById("copyLink");
const shareHostEl = document.getElementById("shareHost");
const saveHostBtn = document.getElementById("saveHost");
const STORAGE_KEY = "aquarium-dashboard-state";

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch (error) {
    console.warn("Không thể đọc localStorage:", error);
    return {};
  }
}

function updateStoredState(partial) {
  try {
    const current = loadStoredState();
    const next = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Không thể ghi localStorage:", error);
  }
}

const storedState = loadStoredState();
if (storedState.led_brightness !== undefined) {
  brightnessEl.value = storedState.led_brightness;
}
if (storedState.led_color) {
  colorEl.value = storedState.led_color;
}
if (storedState.feed_time) {
  feedTimeEl.value = storedState.feed_time;
}
if (storedState.water_time) {
  waterTimeEl.value = storedState.water_time;
}
if (storedState.share_host && shareHostEl) {
  shareHostEl.value = storedState.share_host;
}
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
  updateStoredState({ led_color: event.target.value });
});

brightnessEl.addEventListener("input", (event) => {
  const value = Number(event.target.value);
  syncBrightness(value);
  updateStoredState({ led_brightness: value });
});

setColorUi(colorEl.value);
syncBrightness(brightnessEl.value);
function buildShareUrl() {
  const customHost = shareHostEl?.value?.trim();
  const origin = customHost
    ? `${window.location.protocol}//${customHost}`
    : window.location.origin;
  return `${origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function syncShareUrl() {
  if (shareUrlEl) {
    shareUrlEl.value = buildShareUrl();
  }
}

syncShareUrl();

copyLinkBtn?.addEventListener("click", async () => {
  const url = shareUrlEl?.value || window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Đã copy link!");
  } catch (error) {
    showToast("Không thể copy, hãy copy thủ công.");
  }
});

saveHostBtn?.addEventListener("click", () => {
  const host = shareHostEl?.value?.trim() ?? "";
  updateStoredState({ share_host: host || null });
  syncShareUrl();
  showToast("Đã cập nhật máy chủ");
});

shareHostEl?.addEventListener("input", () => {
  syncShareUrl();
});

feedTimeEl.addEventListener("input", (event) => {
  updateStoredState({ feed_time: event.target.value });
});

waterTimeEl.addEventListener("input", (event) => {
  updateStoredState({ water_time: event.target.value });
});

saveLedBtn.addEventListener("click", async () => {
  saveLedBtn.disabled = true;
  saveLedBtn.textContent = "Đang lưu...";

  try {
    await updateDoc(docRef, {
      led_brightness: Number(brightnessEl.value),
      led_color: colorEl.value
    });
    updateStoredState({
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
        "Không thấy document. Kiểm tra collection/document ID và quyền đọc Firestore.";
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
    if (d.feed_time) {
      feedTimeEl.value = d.feed_time;
      updateStoredState({ feed_time: d.feed_time });
    }
    if (d.water_time) {
      waterTimeEl.value = d.water_time;
      updateStoredState({ water_time: d.water_time });
    }
    lastFeedEl.textContent = d.feed_last_at
      ? new Date(d.feed_last_at).toLocaleString()
      : "--";
    lastWaterEl.textContent = d.water_last_at
      ? new Date(d.water_last_at).toLocaleString()
      : "--";

    updatedAtEl.textContent = new Date().toLocaleString();
  },
  (error) => {
    setStatus("error", "Không kết nối");
    alertEl.textContent = `Lỗi Firebase: ${error.message}`;
  }
);
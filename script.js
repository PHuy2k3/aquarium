import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBEJGvX4JJmf6OmbhjGDlzCBHz8AM3C5-4",
  authDomain: "finalproject-5ecae.firebaseapp.com",
  projectId: "finalproject-5ecae",
  storageBucket: "finalproject-5ecae.appspot.com",
  messagingSenderId: "243065714313",
  appId: "1:243065714313:web:82a23f471a17a4f3873858"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==== QUAN TRỌNG ====
collection = aquarium
document   = eMJjRGtbDT7JMiHdJSRO
====================== */
const docRef = doc(db, "aquarium", "eMJjRGtbDT7JMiHdJSRO");

/* ==== UI refs (KHỚP HTML) ==== */
const tdsEl = document.getElementById("tds");
const lightEl = document.getElementById("light");
const updatedAtEl = document.getElementById("updatedAt");
const pumpEl = document.getElementById("pump");
const lastPumpEl = document.getElementById("lastPump");
const alertEl = document.getElementById("alert");

function waterStatusText(v) {
  if (v == null) return "--";
  if (v >= 70) return "⚠️ Nước kém";
  if (v >= 40) return "Nước trung bình";
  return "Nước tốt";
}

/* ==== LISTEN REALTIME FIRESTORE ==== */
onSnapshot(docRef, (snap) => {
  if (!snap.exists()) return;

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
});

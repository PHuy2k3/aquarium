import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://etbldulfsxumtjrmhrhl.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YmxkdWxmc3h1bXRqcm1ocmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Njc3NjIsImV4cCI6MjA4NDQ0Mzc2Mn0.35nN8-gzYFW2yyXWGJVF6DO0rU1HItATmnl3MVgvqRA"
const AQUARIUM_ID = 1;
const TABLES = {
  devices: "aquarium_devices",
  sensors: "aquarium_sensors",
  settings: "aquarium_settings",
  events: "aquarium_events"
};

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

function applySensors(d) {
  if (!d) {
    setStatus("warn", "Không thấy dữ liệu");
    alertEl.textContent =
      "Không thấy bản ghi cảm biến. Kiểm tra bảng Supabase và AQUARIUM_ID.";
    return;
  }

  setStatus("ok", "Đã kết nối");

  tdsEl.textContent = d.water_quality ?? "--";
  lightEl.textContent = d.lux ?? "--";

  alertEl.textContent =
    d.alert_message && d.alert_message !== ""
      ? d.alert_message
      : waterStatusText(d.water_quality);

  pumpEl.textContent = d.water_status ?? "--";
  lastPumpEl.textContent = "--";
  lastFeedEl.textContent = d.feed_last_at
    ? new Date(d.feed_last_at).toLocaleString()
    : "--";
  lastWaterEl.textContent = d.water_last_at
    ? new Date(d.water_last_at).toLocaleString()
    : "--";

  updatedAtEl.textContent = new Date().toLocaleString();
}

function applySettings(d) {
  if (!d) return;

  if (d.feed_time) {
    feedTimeEl.value = d.feed_time;
    updateStoredState({ feed_time: d.feed_time });
  }
  if (d.water_time) {
    waterTimeEl.value = d.water_time;
    updateStoredState({ water_time: d.water_time });
  }
  if (d.led_brightness !== null && d.led_brightness !== undefined) {
    brightnessEl.value = d.led_brightness;
    syncBrightness(d.led_brightness);
    updateStoredState({ led_brightness: d.led_brightness });
  }
  if (d.led_color) {
    colorEl.value = d.led_color;
    setColorUi(d.led_color);
    updateStoredState({ led_color: d.led_color });
  }
}

async function fetchSensors() {
  const { data, error } = await supabaseClient
    .from(TABLES.sensors)
    .select("*")
    .eq("aquarium_id", AQUARIUM_ID)
    .single();

  if (error) {
    setStatus("error", "Không kết nối");
    alertEl.textContent = `Lỗi Supabase (sensors): ${error.message}`;
    return;
  }

  applySensors(data);
}

async function fetchSettings() {
  const { data, error } = await supabaseClient
    .from(TABLES.settings)
    .select("*")
    .eq("aquarium_id", AQUARIUM_ID)
    .single();

  if (error) {
    setStatus("error", "Không kết nối");
    alertEl.textContent = `Lỗi Supabase (settings): ${error.message}`;
    return;
  }

  applySettings(data);
}

function subscribeToUpdates() {
  return supabaseClient
    .channel("aquarium-updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.sensors,
        filter: `aquarium_id=eq.${AQUARIUM_ID}`
      },
      (payload) => {
        applySensors(payload.new);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.settings,
        filter: `aquarium_id=eq.${AQUARIUM_ID}`
      },
      (payload) => {
        applySettings(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        setStatus("error", "Không kết nối");
      }
    });
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
    const { error } = await supabaseClient
      .from(TABLES.settings)
      .update({
        led_brightness: Number(brightnessEl.value),
        led_color: colorEl.value
      })
      .eq("aquarium_id", AQUARIUM_ID);
    if (error) throw error;
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

saveFeedBtn.addEventListener("click", async () => {
  saveFeedBtn.disabled = true;
  saveFeedBtn.textContent = "Đang lưu...";

  try {
    const { error } = await supabaseClient
      .from(TABLES.settings)
      .update({
        feed_time: feedTimeEl.value
      })
      .eq("aquarium_id", AQUARIUM_ID);
    if (error) throw error;
    updateStoredState({ feed_time: feedTimeEl.value });
    showToast("Đã lưu lịch cho ăn!");
  } catch (error) {
    alertEl.textContent = `Lỗi lưu lịch cho ăn: ${error.message}`;
    showToast("Lưu thất bại");
  } finally {
    saveFeedBtn.disabled = false;
    saveFeedBtn.textContent = "Lưu";
  }
});

saveWaterBtn.addEventListener("click", async () => {
  saveWaterBtn.disabled = true;
  saveWaterBtn.textContent = "Đang lưu...";

  try {
    const { error } = await supabaseClient
      .from(TABLES.settings)
      .update({
        water_time: waterTimeEl.value
      })
      .eq("aquarium_id", AQUARIUM_ID);
    if (error) throw error;
    updateStoredState({ water_time: waterTimeEl.value });
    showToast("Đã lưu lịch thay nước!");
  } catch (error) {
    alertEl.textContent = `Lỗi lưu lịch thay nước: ${error.message}`;
    showToast("Lưu thất bại");
  } finally {
    saveWaterBtn.disabled = false;
    saveWaterBtn.textContent = "Lưu";
  }
});

fetchSensors();
fetchSettings();
subscribeToUpdates();

const API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";
const CLASSBOARD_MEDIA_REF_PREFIX = "sfk-media://";
const ANNOUNCEMENT_MEDIA_COLLECTION = "announcementMedia";
const MEMORY_MEDIA_COLLECTION = "memoryMedia";
const FREEDOM_WALL_MEDIA_COLLECTION = "freedomWallMedia";
const CLASSBOARD_MEDIA_DATA_CACHE = new Map();
const CLASSBOARD_MEDIA_BLOB_URL_CACHE = new Map();

const DATA_REFRESH_MS = 2000;
const ANNOUNCEMENT_ROTATE_MS = 10000;
const BIRTHDAY_ROTATE_MS = 30000;
const CACHE_KEY = "sfkClassBoardData";
const CLASSBOARD_MEDIA_FIX_CACHE_VERSION_KEY = "sfkClassBoardMediaFixVersion";
const CLASSBOARD_MEDIA_FIX_CACHE_VERSION = "v477-polaroid-jungle-poste";
const ANNOUNCEMENT_HEARTS_KEY = "sfkClassBoardHeartedAnnouncements";

try {
  if (localStorage.getItem(CLASSBOARD_MEDIA_FIX_CACHE_VERSION_KEY) !== CLASSBOARD_MEDIA_FIX_CACHE_VERSION) {
    localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(CLASSBOARD_MEDIA_FIX_CACHE_VERSION_KEY, CLASSBOARD_MEDIA_FIX_CACHE_VERSION);
  }
} catch (error) {
  // Ignore cache reset errors.
}
const MEMORIES_SEEN_IDS_KEY = "sfkMemoriesSeenPostIdsV1";
const IS_PHONE_DEVICE =
  navigator.userAgentData?.mobile === true ||
  /Android|iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (IS_PHONE_DEVICE) {
  document.documentElement.classList.add("phone-device");
}

document.addEventListener("click", handlePendingAnnouncementMediaClick);

/* PRAYER AUDIO PLAYER SYSTEM
   No autoplay / no bell.
   Prayer popup appears at scheduled/test time with a manual audio player.
*/
const PRAYER_TEST_TRIGGER_ENABLED = true;
const PRAYER_TEST_HOUR = "00";
const PRAYER_TEST_MINUTE = "20";

let latestData = null;
let latestDataString = "";
let announcementIndex = 0;
let announcementRotateTimer = null;
let announcementRotationCount = 0;
let announcementRotationVersion = 0;
let announcementRotationPaused = false;
let announcementRemainingMs = ANNOUNCEMENT_ROTATE_MS;
let birthdayIndex = 0;
let isFetching = false;
let announcementMediaHydrationTimer = null;
let announcementMediaHydrationRun = 0;
let announcementFastRefreshTimer = null;
let announcementFastRefreshStartedAt = 0;
let lastBirthdayDisplayKey = "";
let birthdayYearModalReady = false;
let lastBirthdayModalFocus = null;
let activeBirthdayMonth = null;
const BIRTHDAY_MUSIC_SRC = "birthday-music.mp3?v=autoplay-sound-fix-v112";
let birthdayMusicAudio = null;
let birthdayCelebrationCleanupTimer = null;
let weeklyScheduleData = [];
let weeklyDailyInfoData = [];
let activeWeeklyDay = "Monday";
let subjectRecordsCache = null;
let subjectRecordsPromise = null;
let homepageDesignSettings = {};
let lastPrayerTriggerKey = "";
let lastScheduleAutoScrollKey = "";
let todayScheduleNoCurrentInitialized = false;
let lastTodayScheduleRenderSignature = "";
let todayScheduleReturnTimer = null;
let todayScheduleAutoScrollLockUntil = 0;
let isTodayScheduleOpen = false;
let lastThingsToBringManilaDateKey = "";

function safeSetClassBoardCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, String(value || ""));
  } catch (error) {
    console.warn("ClassBoard cache skipped:", error);
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (removeError) {
      // Ignore cache cleanup errors.
    }
  }
}

const subjectIcons = {
  english: "📘",
  math: "🧮",
  mathematics: "🧮",
  science: "🔬",
  ict: "💻",
  English: "📖",
  filipno: "📖",
  mapeh: "🎵",
  music: "🎵",
  arts: "🎨",
  pe: "⚽",
  health: "❤️",
  ap: "🌏",
  araling: "🌏",
  cled: "🙏",
  christian: "🙏",
  religion: "🙏",
  le: "🍳",
  homeroom: "🏠",
  assembly: "📣",
  mass: "⛪",
  break: "🍽️",
  recess: "🍽️",
  lunch: "🍱"
};

function initClassBoard() {
  ensureAnnouncementTimerControl();
  initClassBoardAccessMenu();
  initBirthdayYearModal();
  initDesktopShhhMode();
  initDesktopFloatClock();
  initHomepageEffectSystem();

  const audioOverlay = document.getElementById("audioStartOverlay");
  if (audioOverlay) {
    audioOverlay.classList.remove("hidden");
  }

  startLiveClock();
  renderCleanersToday();

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      latestData = cachedData;
      latestDataString = cached;
      renderDashboard(cachedData);
      scheduleAnnouncementMediaHydration("cached-dashboard");
    } catch (e) {
      console.warn("Cache error", e);
    }
  }

  loadClassBoard();
  loadMemoriesUnreadBadge();

  setInterval(loadClassBoard, DATA_REFRESH_MS);
  startAnnouncementFastRefreshBurst("startup");
  window.addEventListener("focus", () => {
    refreshThingsToBringForManilaDay();
    startAnnouncementFastRefreshBurst("window-focus");
  });
  window.addEventListener("pageshow", () => {
    refreshThingsToBringForManilaDay();
    startAnnouncementFastRefreshBurst("pageshow");
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshThingsToBringForManilaDay();
      startAnnouncementFastRefreshBurst("visible");
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "sfkClassBoardAnnouncementUpdatedAt") startAnnouncementFastRefreshBurst("admin-saved");
    if (event.key === "sfkClassBoardPageLockUpdatedAt") startAnnouncementFastRefreshBurst("page-lock-updated");
    if (event.key === "sfkClassBoardHomepageEffectUpdatedAt") loadClassBoard();
  });
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("sfk-classboard-updates");
      channel.addEventListener("message", (event) => {
        if (event.data?.type === "announcement-updated") startAnnouncementFastRefreshBurst("announcement-broadcast");
        if (event.data?.type === "page-lock-updated") startAnnouncementFastRefreshBurst("page-lock-broadcast");
        if (event.data?.type === "homepage-effect-updated") loadClassBoard();
      });
    }
  } catch (error) {
    // Ignore unsupported broadcast channel errors.
  }
  setInterval(loadMemoriesUnreadBadge, 60000);
  setInterval(rotateBirthdays, BIRTHDAY_ROTATE_MS);
  window.addEventListener("resize", scheduleAnnouncementViewportRefit);
  setInterval(renderCleanersToday, 60000);

  setTimeout(() => {
    startAutoScroll("thingsList");
    startAutoScroll("reminderList");
  }, 1500);

  syncTodayScheduleToggle();
  window.addEventListener("resize", syncTodayScheduleToggle);
}


let classBoardFloatClockWindow = null;
let classBoardFloatClockTimer = null;

function isDesktopFloatClockAvailable() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia("(min-width: 901px)").matches &&
    window.documentPictureInPicture &&
    typeof window.documentPictureInPicture.requestWindow === "function"
  );
}

function formatFloatClockTime(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(now);
}

function formatFloatClockDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(now);
}

function updateDesktopFloatClockButton() {
  const button = document.getElementById("desktopFloatClockBtn");
  if (!button) return;

  const isOpen = Boolean(classBoardFloatClockWindow && !classBoardFloatClockWindow.closed);
  button.classList.toggle("is-active", isOpen);
  button.setAttribute("aria-pressed", isOpen ? "true" : "false");
  button.setAttribute("aria-label", isOpen ? "Hide floating clock" : "Float clock above other apps");
  button.title = isOpen ? "Hide floating clock" : "Float clock";
  button.innerHTML = isOpen ? '<span aria-hidden="true">×</span>' : '<span aria-hidden="true">▣</span>';
}

function stopDesktopFloatClockTimer() {
  if (classBoardFloatClockTimer == null) return;
  try {
    if (classBoardFloatClockWindow && !classBoardFloatClockWindow.closed) {
      classBoardFloatClockWindow.clearInterval(classBoardFloatClockTimer);
    } else {
      window.clearInterval(classBoardFloatClockTimer);
    }
  } catch (error) {
    window.clearInterval(classBoardFloatClockTimer);
  }
  classBoardFloatClockTimer = null;
}

function renderDesktopFloatClock() {
  const pipWindow = classBoardFloatClockWindow;
  if (!pipWindow || pipWindow.closed) return;

  const timeNode = pipWindow.document.getElementById("sfkFloatTime");
  const dateNode = pipWindow.document.getElementById("sfkFloatDate");
  const now = new Date();

  if (timeNode) timeNode.textContent = formatFloatClockTime(now);
  if (dateNode) dateNode.textContent = formatFloatClockDate(now);
}

function closeDesktopFloatClock() {
  stopDesktopFloatClockTimer();

  const pipWindow = classBoardFloatClockWindow;
  classBoardFloatClockWindow = null;

  if (pipWindow && !pipWindow.closed) {
    try { pipWindow.close(); } catch (error) {}
  }

  updateDesktopFloatClockButton();
}

async function openDesktopFloatClock() {
  if (classBoardFloatClockWindow && !classBoardFloatClockWindow.closed) {
    try { classBoardFloatClockWindow.focus(); } catch (error) {}
    return;
  }

  if (!isDesktopFloatClockAvailable()) {
    window.alert("Floating Clock needs a recent Chrome or Edge desktop browser. Please update the browser and open ClassBoard over HTTPS.");
    return;
  }

  let pipWindow;
  try {
    pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 390,
      height: 168
    });
  } catch (error) {
    console.warn("Unable to open ClassBoard floating clock:", error);
    return;
  }

  classBoardFloatClockWindow = pipWindow;

  const pipDoc = pipWindow.document;
  pipDoc.title = "SFK Floating Clock";
  pipDoc.documentElement.lang = "en";
  pipDoc.body.innerHTML = `
    <main class="sfkFloatClock" aria-label="SFK ClassBoard floating clock">
      <div class="sfkFloatClockTopline">
        <span class="sfkFloatClockLabel">SFK CLASSBOARD</span>
        <button id="sfkFloatHideBtn" class="sfkFloatHideBtn" type="button" aria-label="Hide floating clock">Hide</button>
      </div>
      <div id="sfkFloatTime" class="sfkFloatTime">--:--:-- --</div>
      <div id="sfkFloatDate" class="sfkFloatDate">Loading date...</div>
    </main>
  `;

  const style = pipDoc.createElement("style");
  style.textContent = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #071426;
      color: #fff;
    }
    .sfkFloatClock {
      width: 100%;
      height: 100%;
      padding: 13px 16px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background:
        radial-gradient(circle at 88% 0%, rgba(247,198,0,.17), transparent 34%),
        linear-gradient(145deg, #08172c, #0b2347);
      border: 3px solid #f7c600;
      outline: 2px solid #111;
      outline-offset: -7px;
    }
    .sfkFloatClockTopline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 25px;
    }
    .sfkFloatClockLabel {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      color: #f7c600;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .16em;
      white-space: nowrap;
    }
    .sfkFloatHideBtn {
      flex: 0 0 auto;
      padding: 5px 10px;
      border: 1px solid rgba(255,255,255,.34);
      border-radius: 999px;
      background: rgba(255,255,255,.10);
      color: #fff;
      font: inherit;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
    }
    .sfkFloatHideBtn:hover { background: rgba(247,198,0,.2); border-color: #f7c600; }
    .sfkFloatTime {
      margin-top: 3px;
      text-align: center;
      color: #fff;
      font-size: clamp(36px, 13vw, 58px);
      font-weight: 950;
      line-height: .98;
      letter-spacing: -.055em;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      text-shadow: 0 6px 18px rgba(0,0,0,.3);
    }
    .sfkFloatDate {
      margin-top: 6px;
      text-align: center;
      color: #dbe8ff;
      font-size: clamp(12px, 4vw, 17px);
      font-weight: 700;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  pipDoc.head.appendChild(style);

  pipDoc.getElementById("sfkFloatHideBtn")?.addEventListener("click", () => closeDesktopFloatClock());

  pipWindow.addEventListener("pagehide", () => {
    stopDesktopFloatClockTimer();
    classBoardFloatClockWindow = null;
    updateDesktopFloatClockButton();
  }, { once: true });

  renderDesktopFloatClock();
  classBoardFloatClockTimer = pipWindow.setInterval(renderDesktopFloatClock, 1000);
  updateDesktopFloatClockButton();
}

function initDesktopFloatClock() {
  const timeBox = document.getElementById("classBoardAccessTrigger");
  if (!timeBox || document.getElementById("desktopFloatClockBtn")) return;

  const button = document.createElement("button");
  button.id = "desktopFloatClockBtn";
  button.className = "desktopFloatClockBtn";
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", "Float clock above other apps");
  button.title = "Float clock";
  button.innerHTML = '<span aria-hidden="true">▣</span>';

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (classBoardFloatClockWindow && !classBoardFloatClockWindow.closed) {
      closeDesktopFloatClock();
    } else {
      openDesktopFloatClock();
    }
  });

  button.addEventListener("keydown", (event) => event.stopPropagation());
  timeBox.appendChild(button);

  const syncVisibility = () => {
    button.hidden = !(window.matchMedia && window.matchMedia("(min-width: 901px)").matches);
  };
  syncVisibility();
  window.addEventListener("resize", syncVisibility);
  updateDesktopFloatClockButton();
}

function initClassBoardAccessMenu() {
  const trigger = document.getElementById("classBoardAccessTrigger");
  const layer = document.getElementById("classBoardAccessMenu");
  if (!trigger || !layer || trigger.dataset.menuReady === "true") return;

  trigger.dataset.menuReady = "true";
  trigger.addEventListener("click", openClassBoardAccessMenu);
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openClassBoardAccessMenu();
  });

  layer.querySelector(".accessMenuBackdrop")?.addEventListener("click", closeClassBoardAccessMenu);
  document.getElementById("closeAccessMenu")?.addEventListener("click", closeClassBoardAccessMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !layer.hidden) closeClassBoardAccessMenu();
  });
}

function openClassBoardAccessMenu() {
  const trigger = document.getElementById("classBoardAccessTrigger");
  const layer = document.getElementById("classBoardAccessMenu");
  if (!trigger || !layer) return;

  layer.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("accessMenuOpen");
  window.requestAnimationFrame(() => layer.classList.add("isOpen"));
  window.setTimeout(() => layer.querySelector(".accessMenuItem")?.focus(), 80);
}

function closeClassBoardAccessMenu() {
  const trigger = document.getElementById("classBoardAccessTrigger");
  const layer = document.getElementById("classBoardAccessMenu");
  if (!layer || layer.hidden) return;

  layer.classList.remove("isOpen");
  trigger?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("accessMenuOpen");
  window.setTimeout(() => {
    layer.hidden = true;
    trigger?.focus();
  }, 170);
}

function ensureAnnouncementTimerControl() {
  const card = document.querySelector(".announcementsCard");
  const title = document.getElementById("announcementTitle");
  const list = document.getElementById("announcementList");
  if (!card || !title || !list) return;

  let heading = title.closest(".announcementHeading");
  if (!heading) {
    heading = document.createElement("div");
    heading.className = "announcementHeading";
    card.insertBefore(heading, title);
    heading.appendChild(title);
  }

  let button = document.getElementById("announcementTimerToggle");
  if (!button) {
    button = document.createElement("button");
    button.id = "announcementTimerToggle";
    button.className = "announcementTimerToggle";
    button.type = "button";
    button.innerHTML = "&#10074;&#10074;";
    button.addEventListener("click", toggleAnnouncementRotation);
    heading.appendChild(button);
  }

  if (!document.getElementById("announcementProgress")) {
    const progress = document.createElement("div");
    progress.id = "announcementProgress";
    progress.className = "announcementProgress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = `<span id="announcementProgressFill"></span>`;
    card.insertBefore(progress, list);
  }

  updateAnnouncementTimerButton();
}

async function loadClassBoard() {
  if (isFetching) return;

  isFetching = true;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${API_URL}?type=today`, {
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json();
    const newDataString = JSON.stringify(data);

    safeSetClassBoardCache(newDataString);

    if (newDataString !== latestDataString) {
      const previousData = latestData;
      const shouldFocusLatestAnnouncement = shouldInstantFocusLatestAnnouncement(
        previousData?.announcements || [],
        data.announcements || []
      );

      if (shouldFocusLatestAnnouncement) {
        announcementIndex = 0;
      }

      latestDataString = newDataString;
      latestData = data;
      renderDashboard(data);

      if (shouldFocusLatestAnnouncement) {
        resetAnnouncementRotation(data.announcements || []);
      }

      scheduleAnnouncementMediaHydration("fresh-dashboard");
    } else {
      latestData = data;
      updateCountdownAndBell();
      renderCleanersToday();
      scheduleAnnouncementMediaHydration("same-dashboard");
    }

  } catch (error) {
    console.error("ClassBoard fetch failed:", error);

    if (!latestData) {
      document.getElementById("dashboardTitle").textContent =
        "Unable to load ClassBoard";
    }
  } finally {
    isFetching = false;
  }
}


function startAnnouncementFastRefreshBurst(reason = "") {
  window.clearTimeout(announcementFastRefreshTimer);
  announcementFastRefreshStartedAt = Date.now();

  const run = () => {
    loadClassBoard();
    if (Date.now() - announcementFastRefreshStartedAt > 30000) return;
    announcementFastRefreshTimer = window.setTimeout(run, 1200);
  };

  announcementFastRefreshTimer = window.setTimeout(run, reason === "startup" ? 900 : 80);
}

function shouldInstantFocusLatestAnnouncement(previousItems = [], nextItems = []) {
  const previousActive = getActiveAnnouncements(previousItems || []);
  const nextActive = getActiveAnnouncements(nextItems || []);
  if (nextActive.length === 0) return false;
  if (previousActive.length === 0) return true;

  const previousTopId = getAnnouncementId(previousActive[0]);
  const nextTopId = getAnnouncementId(nextActive[0]);
  if (nextTopId && nextTopId !== previousTopId) return true;

  const previousSignature = getAnnouncementQuickRenderSignature(previousActive);
  const nextSignature = getAnnouncementQuickRenderSignature(nextActive);
  return previousSignature !== nextSignature && announcementIndex >= nextActive.length;
}

function getAnnouncementQuickRenderSignature(items = []) {
  return getActiveAnnouncements(items)
    .slice(0, 5)
    .map(item => [
      getAnnouncementId(item),
      item?.Subject || "",
      item?.Announcement || "",
      item?.AttachmentURLs || item?.Attachments || item?.AttachmentURL || item?.AttachmentRefs || "",
      item?.AttachmentNames || item?.AttachmentLabels || item?.AttachmentName || ""
    ].map(value => String(value || "").trim()).join("~"))
    .join("|");
}

async function loadMemoriesUnreadBadge() {
  const badge = document.getElementById("memoriesUnreadBadge");
  if (!badge) return;

  try {
    const response = await fetch(`${API_URL}?type=memories`, { cache: "no-store" });
    const result = await response.json();
    const posts = Array.isArray(result.memories) ? result.memories : [];
    const ids = posts.map(getMemoryPostId).filter(Boolean);
    const savedSeen = localStorage.getItem(MEMORIES_SEEN_IDS_KEY);

    if (!savedSeen) {
      saveSeenMemoryIds(ids);
      renderMemoriesUnreadBadge(0);
      return;
    }

    const seen = getSeenMemoryIds();
    const unread = ids.filter(id => !seen.includes(id)).length;
    renderMemoriesUnreadBadge(unread);
  } catch (error) {
    renderMemoriesUnreadBadge(0);
  }
}

function getMemoryPostId(item) {
  return String(item?.ID || item?.Id || item?.id || "").trim();
}

function getSeenMemoryIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMORIES_SEEN_IDS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    return [];
  }
}

function saveSeenMemoryIds(ids) {
  localStorage.setItem(
    MEMORIES_SEEN_IDS_KEY,
    JSON.stringify(Array.from(new Set((ids || []).map(String).filter(Boolean))).slice(0, 500))
  );
}

function renderMemoriesUnreadBadge(count) {
  const badge = document.getElementById("memoriesUnreadBadge");
  if (!badge) return;

  const safeCount = Math.max(0, Number(count) || 0);
  badge.hidden = safeCount === 0;
  badge.textContent = safeCount > 99 ? "99+" : String(safeCount);
}


function getHomepageSetting(settings, key, fallback = "") {
  const value = settings && settings[key] !== undefined ? String(settings[key] || "").trim() : "";
  return value || fallback;
}

function getHomepageBool(settings, key, fallback = true) {
  const value = getHomepageSetting(settings, key, fallback ? "YES" : "NO").toUpperCase();
  return value !== "NO";
}

function setHomepageText(selector, text) {
  const element = document.querySelector(selector);
  if (element && text) element.textContent = text;
}

function applyHomepageVar(root, key, value) {
  if (value) root.style.setProperty(key, value);
}

function applyHomepageDesignSettings(settings = {}) {
  homepageDesignSettings = settings || {};
  const root = document.documentElement;

  const designMap = {
    "--home-design-bg": ["HomepageBgColor", ""],
    "--home-design-text": ["HomepageTextColor", ""],
    "--home-design-card-bg": ["HomepageCardBgColor", ""],
    "--home-design-card-text": ["HomepageCardTextColor", ""],
    "--home-design-card-border": ["HomepageCardBorderColor", ""],
    "--home-design-card-shadow": ["HomepageCardShadowColor", ""],
    "--home-design-accent": ["HomepageAccentColor", ""],
    "--home-design-accent-text": ["HomepageAccentTextColor", ""],
    "--home-card-radius": ["HomepageCardRadius", "16px"],
    "--home-topbar-bg": ["HomepageTopbarBg", ""],
    "--home-topbar-text": ["HomepageTopbarText", ""],
    "--home-brand-title-color": ["HomepageBrandTitleColor", ""],
    "--home-brand-subtitle-color": ["HomepageBrandSubtitleColor", ""],
    "--home-quote-bg": ["HomepageQuoteBg", ""],
    "--home-quote-text": ["HomepageQuoteText", ""],
    "--home-quote-label-bg": ["HomepageQuoteLabelBg", ""],
    "--home-quote-label-text": ["HomepageQuoteLabelText", ""],
    "--home-auto-subject-theme": ["HomepageAutoSubjectTheme", "NO"],
    "--home-timebox-bg": ["HomepageTimeBoxBg", ""],
    "--home-timebox-text": ["HomepageTimeBoxText", ""],
    "--home-current-label-color": ["HomepageCurrentLabelColor", ""],
    "--home-next-label-color": ["HomepageNextLabelColor", ""],
    "--home-current-card-bg": ["HomepageCurrentCardBg", ""],
    "--home-current-subject-color": ["HomepageCurrentSubjectColor", ""],
    "--home-current-details-color": ["HomepageCurrentDetailsColor", ""],
    "--home-current-countdown-bg": ["HomepageCurrentCountdownBg", ""],
    "--home-current-countdown-text": ["HomepageCurrentCountdownText", ""],
    "--home-next-card-bg": ["HomepageNextCardBg", ""],
    "--home-next-subject-color": ["HomepageNextSubjectColor", ""],
    "--home-next-details-color": ["HomepageNextDetailsColor", ""],
    "--home-next-countdown-bg": ["HomepageNextCountdownBg", ""],
    "--home-next-countdown-text": ["HomepageNextCountdownText", ""],
    "--home-schedule-title-color": ["HomepageScheduleTitleColor", ""],
    "--home-schedule-panel-bg": ["HomepageSchedulePanelBg", ""],
    "--home-schedule-card-bg": ["HomepageScheduleCardBg", ""],
    "--home-schedule-card-text": ["HomepageScheduleCardText", ""],
    "--home-schedule-time-color": ["HomepageScheduleTimeColor", ""],
    "--home-schedule-details-color": ["HomepageScheduleDetailsColor", ""],
    "--home-schedule-current-badge-bg": ["HomepageScheduleCurrentBadgeBg", ""],
    "--home-schedule-current-badge-text": ["HomepageScheduleCurrentBadgeText", ""],
    "--home-schedule-button-bg": ["HomepageScheduleButtonBg", ""],
    "--home-schedule-button-text": ["HomepageScheduleButtonText", ""],
    "--home-announcements-title-color": ["HomepageAnnouncementsTitleColor", ""],
    "--home-announcement-panel-bg": ["HomepageAnnouncementPanelBg", ""],
    "--home-announcement-card-bg": ["HomepageAnnouncementCardBg", ""],
    "--home-announcement-text-color": ["HomepageAnnouncementTextColor", ""],
    "--home-announcement-chip-bg": ["HomepageAnnouncementChipBg", ""],
    "--home-announcement-chip-text": ["HomepageAnnouncementChipText", ""],
    "--home-announcement-button-bg": ["HomepageAnnouncementButtonBg", ""],
    "--home-announcement-button-text": ["HomepageAnnouncementButtonText", ""],
    "--home-things-title-color": ["HomepageThingsTitleColor", ""],
    "--home-things-panel-bg": ["HomepageThingsPanelBg", ""],
    "--home-things-item-bg": ["HomepageThingsItemBg", ""],
    "--home-things-item-text": ["HomepageThingsItemText", ""],
    "--home-things-subject-text": ["HomepageThingsSubjectText", ""],
    "--home-things-status-bg": ["HomepageThingsStatusBg", ""],
    "--home-things-status-text": ["HomepageThingsStatusText", ""],
    "--home-things-summary-bg": ["HomepageThingsSummaryBg", ""],
    "--home-things-summary-text": ["HomepageThingsSummaryText", ""],
    "--home-prayer-label-color": ["HomepagePrayerLabelColor", ""],
    "--home-prayer-card-bg": ["HomepagePrayerCardBg", ""],
    "--home-prayer-card-border": ["HomepagePrayerCardBorder", ""],
    "--home-prayer-card-text": ["HomepagePrayerCardText", ""],
    "--home-prayer-name-color": ["HomepagePrayerNameColor", ""],
    "--home-prayer-divider-color": ["HomepagePrayerDividerColor", ""],
    "--home-prayer-link-hover-bg": ["HomepagePrayerLinkHoverBg", ""],
    "--home-cleaners-label-text-color": ["HomepageCleanersLabelColor", ""],
    "--home-cleaners-box-bg": ["HomepageCleanersBoxBg", ""],
    "--home-cleaners-border-color": ["HomepageCleanersBorderColor", ""],
    "--home-cleaners-label-color": ["HomepageCleanersLabelColor", ""],
    "--home-cleaners-text-color": ["HomepageCleanersTextColor", ""],
    "--home-cleaners-shadow-color": ["HomepageCleanersShadowColor", ""],
    "--home-birthday-label-color": ["HomepageBirthdayLabelColor", ""],
    "--home-birthday-card-bg": ["HomepageBirthdayCardBg", ""],
    "--home-birthday-card-border": ["HomepageBirthdayCardBorder", ""],
    "--home-birthday-card-accent": ["HomepageBirthdayCardAccent", ""],
    "--home-birthday-date-bg": ["HomepageBirthdayDateBg", ""],
    "--home-birthday-date-text": ["HomepageBirthdayDateTextColor", ""],
    "--home-birthday-date-border": ["HomepageBirthdayDateBorder", ""],
    "--home-birthday-inner-bg": ["HomepageBirthdayInnerBg", ""],
    "--home-birthday-inner-border": ["HomepageBirthdayInnerBorder", ""],
    "--home-birthday-icon-bg": ["HomepageBirthdayIconBg", ""],
    "--home-birthday-icon-text": ["HomepageBirthdayIconText", ""],
    "--home-birthday-greeting-color": ["HomepageBirthdayGreetingColor", ""],
    "--home-birthday-celebrant-color": ["HomepageBirthdayCelebrantColor", ""],
    "--home-birthday-message-color": ["HomepageBirthdayMessageColor", ""],
    "--home-birthday-empty-bg": ["HomepageBirthdayEmptyBg", ""],
    "--home-birthday-empty-text": ["HomepageBirthdayEmptyText", ""],
    "--home-birthday-text-color": ["HomepageBirthdayTextColor", ""],
    "--home-adviser-title-color": ["HomepageAdviserRemindersTitleColor", ""],
    "--home-ticker-bg": ["HomepageTickerBg", ""],
    "--home-ticker-text": ["HomepageTickerText", ""]
  };

  Object.entries(designMap).forEach(([cssVar, [settingKey, fallback]]) => {
    applyHomepageVar(root, cssVar, getHomepageSetting(settings, settingKey, fallback));
  });

  document.body.dataset.homeShadowStyle = getHomepageSetting(settings, "HomepageShadowStyle", "classic");
  document.body.dataset.useSubjectScheduleColors = getHomepageBool(settings, "HomepageUseSubjectScheduleColors", true) ? "yes" : "no";
  document.body.dataset.useSubjectPeriodColors = getHomepageBool(settings, "HomepageUseSubjectPeriodColors", true) ? "yes" : "no";
  document.body.dataset.autoSubjectTheme = getHomepageBool(settings, "HomepageAutoSubjectTheme", false) ? "yes" : "no";

  setHomepageText(".current .label", getHomepageSetting(settings, "HomepageCurrentLabelText", "Current Period"));
  setHomepageText(".next .label", getHomepageSetting(settings, "HomepageNextLabelText", "Next Period"));
  setHomepageText(".scheduleCard .scheduleHeader h2", getHomepageSetting(settings, "HomepageTodayScheduleTitle", "Today's Schedule"));
  setHomepageText("#announcementTitle", getHomepageSetting(settings, "HomepageAnnouncementsTitleText", "Subject Announcements"));
  setHomepageText(".thingsCard .cardHeader h2", getHomepageSetting(settings, "HomepageThingsTitleText", "Things to Bring"));
  setHomepageText(".prayer .label", getHomepageSetting(settings, "HomepagePrayerLabelText", "Prayer Leader"));
  setHomepageText(".cleanersMini span", getHomepageSetting(settings, "HomepageCleanersLabelText", "Cleaners Today"));
  setHomepageText(".birthdayCard .label", getHomepageSetting(settings, "HomepageBirthdayLabelText", "Birthday Corner"));
  setHomepageText(".adviserReminderHeader h2", getHomepageSetting(settings, "HomepageAdviserRemindersTitleText", "Adviser Reminders"));
  setHomepageText(".quoteLabel", getHomepageSetting(settings, "HomepageQuoteLabelTextValue", "Daily Kindness Quote"));

  const loadingSoundId = getHomepageSetting(settings, "LoadingSoundId", "");
  if (loadingSoundId) {
    try { localStorage.setItem("sfkClassBoardIntroSoundChoice", loadingSoundId); } catch (error) {}
  }
}

function getHomeCssVar(name, fallback = "") {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function mixHexColors(hexA, hexB, amount = 0.5) {
  const parse = (hex) => {
    const clean = String(hex || "").replace("#", "");
    if (clean.length !== 6) return null;
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  };
  const a = parse(hexA);
  const b = parse(hexB);
  if (!a || !b) return hexA || hexB || "#ffd000";
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const out = a.map((channel, index) => clamp(channel + (b[index] - channel) * amount));
  return `#${out.map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function setAutoSubjectVar(root, name, value) {
  if (root && value) root.style.setProperty(name, value);
}

function applyAutoSubjectHomepageTheme(periodState = {}) {
  const root = document.documentElement;
  if (!root || !getHomepageBool(homepageDesignSettings, "HomepageAutoSubjectTheme", false)) {
    document.body.dataset.autoSubjectTheme = "no";
    return;
  }

  const item = periodState.currentPeriod || periodState.nextPeriod || null;
  if (!item) return;

  const subjectColor = item.Color || getSubjectColor(item.Subject);
  const readable = getReadableTextColor(subjectColor);
  const dark = mixHexColors(subjectColor, "#000000", 0.62);
  const soft = mixHexColors(subjectColor, "#ffffff", 0.78);
  const softer = mixHexColors(subjectColor, "#ffffff", 0.90);

  document.body.dataset.autoSubjectTheme = "yes";
  setAutoSubjectVar(root, "--home-design-bg", soft);
  setAutoSubjectVar(root, "--home-design-text", "#111111");
  setAutoSubjectVar(root, "--home-design-card-bg", softer);
  setAutoSubjectVar(root, "--home-design-card-text", "#111111");
  setAutoSubjectVar(root, "--home-design-card-border", dark);
  setAutoSubjectVar(root, "--home-design-card-shadow", dark);
  setAutoSubjectVar(root, "--home-design-accent", subjectColor);
  setAutoSubjectVar(root, "--home-design-accent-text", readable);
  setAutoSubjectVar(root, "--home-topbar-bg", dark);
  setAutoSubjectVar(root, "--home-topbar-text", "#ffffff");
  setAutoSubjectVar(root, "--home-brand-subtitle-color", subjectColor);
  setAutoSubjectVar(root, "--home-quote-bg", dark);
  setAutoSubjectVar(root, "--home-quote-text", "#ffffff");
  setAutoSubjectVar(root, "--home-quote-label-bg", subjectColor);
  setAutoSubjectVar(root, "--home-quote-label-text", readable);
  setAutoSubjectVar(root, "--home-timebox-bg", subjectColor);
  setAutoSubjectVar(root, "--home-timebox-text", readable);
  setAutoSubjectVar(root, "--home-schedule-title-color", dark);
  setAutoSubjectVar(root, "--home-schedule-panel-bg", softer);
  setAutoSubjectVar(root, "--home-schedule-button-bg", dark);
  setAutoSubjectVar(root, "--home-schedule-button-text", "#ffffff");
  setAutoSubjectVar(root, "--home-announcements-title-color", dark);
  setAutoSubjectVar(root, "--home-announcement-panel-bg", softer);
  setAutoSubjectVar(root, "--home-announcement-chip-bg", dark);
  setAutoSubjectVar(root, "--home-announcement-chip-text", "#ffffff");
  setAutoSubjectVar(root, "--home-things-title-color", dark);
  setAutoSubjectVar(root, "--home-things-panel-bg", softer);
  setAutoSubjectVar(root, "--home-things-status-bg", dark);
  setAutoSubjectVar(root, "--home-things-status-text", "#ffffff");
  setAutoSubjectVar(root, "--home-prayer-card-bg", softer);
  setAutoSubjectVar(root, "--home-prayer-card-border", dark);
  setAutoSubjectVar(root, "--home-prayer-divider-color", subjectColor);
  setAutoSubjectVar(root, "--home-cleaners-box-bg", dark);
  setAutoSubjectVar(root, "--home-cleaners-border-color", subjectColor);
  setAutoSubjectVar(root, "--home-cleaners-text-color", subjectColor);
  setAutoSubjectVar(root, "--home-birthday-card-bg", softer);
  setAutoSubjectVar(root, "--home-birthday-card-border", dark);
  setAutoSubjectVar(root, "--home-birthday-card-accent", subjectColor);
  setAutoSubjectVar(root, "--home-birthday-date-bg", dark);
  setAutoSubjectVar(root, "--home-birthday-date-text", "#ffffff");
  setAutoSubjectVar(root, "--home-birthday-inner-bg", dark);
  setAutoSubjectVar(root, "--home-birthday-inner-border", subjectColor);
  setAutoSubjectVar(root, "--home-birthday-greeting-color", subjectColor);
  setAutoSubjectVar(root, "--home-ticker-bg", dark);
  setAutoSubjectVar(root, "--home-ticker-text", subjectColor);
}

function ensureSingleLineMarqueeTrack(element) {
  if (!element) return null;

  let track = Array.from(element.children || []).find((child) =>
    child.classList?.contains("sfk-marquee-track")
  );

  if (track) return track;

  track = document.createElement("span");
  track.className = "sfk-marquee-track";

  while (element.firstChild) {
    track.appendChild(element.firstChild);
  }

  element.appendChild(track);
  return track;
}

function setupSingleLineMarquee(element, options = {}) {
  if (!element) return;

  const track = ensureSingleLineMarqueeTrack(element);
  if (!track) return;

  // Stop anything left by a previous render/measurement.
  if (track._sfkMarqueeAnimation) {
    try { track._sfkMarqueeAnimation.cancel(); } catch (_) {}
    track._sfkMarqueeAnimation = null;
  }
  track.getAnimations?.().forEach((animation) => {
    try { animation.cancel(); } catch (_) {}
  });

  element.classList.remove("sfk-marquee-active");
  element.style.removeProperty("--sfk-marquee-distance");
  element.style.removeProperty("--sfk-marquee-duration");
  track.style.removeProperty("animation");
  track.style.removeProperty("transform");

  const measureTextWidth = () => {
    const text = String(track.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return 0;

    // Canvas measurement is independent of clipping/scrollWidth quirks.
    try {
      const style = window.getComputedStyle(element);
      const canvas = setupSingleLineMarquee._measureCanvas ||
        (setupSingleLineMarquee._measureCanvas = document.createElement("canvas"));
      const context = canvas.getContext("2d");
      if (context) {
        context.font = `${style.fontStyle || "normal"} ${style.fontWeight || "400"} ${style.fontSize || "16px"} ${style.fontFamily || "sans-serif"}`;
        const letterSpacing = parseFloat(style.letterSpacing) || 0;
        const measured = context.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
        if (Number.isFinite(measured) && measured > 0) return Math.ceil(measured);
      }
    } catch (_) {}

    // Fallback: temporary natural-width clone outside the clipped viewport.
    const probe = track.cloneNode(true);
    probe.removeAttribute("style");
    Object.assign(probe.style, {
      position: "fixed",
      left: "-100000px",
      top: "-100000px",
      display: "inline-block",
      width: "max-content",
      minWidth: "max-content",
      maxWidth: "none",
      whiteSpace: "nowrap",
      visibility: "hidden",
      pointerEvents: "none",
      animation: "none",
      transform: "none"
    });
    document.body.appendChild(probe);
    const width = Math.ceil(probe.getBoundingClientRect().width || probe.scrollWidth || 0);
    probe.remove();
    return width;
  };

  const measureAndStart = () => {
    if (!element.isConnected || !track.isConnected) return;

    // Reset first so we always measure the real viewport, not a translated track.
    element.classList.remove("sfk-marquee-active");
    track.style.removeProperty("animation");
    track.style.removeProperty("transform");

    const availableWidth = Math.floor(element.clientWidth || element.getBoundingClientRect().width || 0);
    const contentWidth = measureTextWidth();
    let overflowDistance = Math.ceil(contentWidth - availableWidth);

    // Extra fallback for edge cases where the browser reports a suspiciously small
    // width despite visibly long text. This keeps long schedule names readable.
    const plainText = String(track.textContent || "").replace(/\s+/g, " ").trim();
    if (availableWidth > 0 && overflowDistance <= 4 && plainText.length >= 28) {
      const estimatedWidth = Math.ceil(plainText.length * (parseFloat(getComputedStyle(element).fontSize) || 18) * 0.57);
      overflowDistance = Math.max(overflowDistance, estimatedWidth - availableWidth);
    }

    if (availableWidth <= 0 || overflowDistance <= 4) return;

    // Reveal the final letters fully, but keep the motion calm and slow.
    const travelDistance = Math.max(10, overflowDistance + 10);
    const pixelsPerSecond = Math.max(8, Number(options.pixelsPerSecond || 10));
    const oneWaySeconds = travelDistance / pixelsPerSecond;
    const fullCycleSeconds = Math.min(52, Math.max(24, (oneWaySeconds * 2) + 7));

    element.style.setProperty("--sfk-marquee-distance", `${travelDistance}px`);
    element.style.setProperty("--sfk-marquee-duration", `${fullCycleSeconds.toFixed(2)}s`);
    element.classList.add("sfk-marquee-active");

    // Inline !important ensures later stylesheet overrides cannot silently disable it.
    track.style.setProperty(
      "animation",
      `sfkTodayScheduleSubjectSlowMarquee ${fullCycleSeconds.toFixed(2)}s ease-in-out infinite`,
      "important"
    );
  };

  // Let the schedule grid settle, then measure more than once so live updates/fonts
  // cannot leave the marquee in a stale non-moving state.
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(measureAndStart);
  });
  window.setTimeout(measureAndStart, 180);
  window.setTimeout(measureAndStart, 520);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!element.isConnected) return;
      window.requestAnimationFrame(measureAndStart);
    }).catch(() => {});
  }

  if (typeof ResizeObserver === "function") {
    if (element._sfkMarqueeResizeObserver) {
      try { element._sfkMarqueeResizeObserver.disconnect(); } catch (_) {}
    }
    let resizeTimer = 0;
    element._sfkMarqueeResizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measureAndStart, 90);
    });
    element._sfkMarqueeResizeObserver.observe(element);
  }
}

function autoFitSingleLine(element) {
  setupSingleLineMarquee(element);
}

function autoFitPeriodSubject(element) {
  if (!element) return;

  // Phone keeps its existing wrapped/compact behavior.
  if (window.innerWidth <= 700) {
    element.style.removeProperty("font-size");
    return;
  }

  // Always begin at the normal CSS font size. Only shrink when the title
  // truly does not fit the available middle lane.
  element.style.removeProperty("font-size");
  element.classList.remove("sfk-marquee-active");
  element.style.removeProperty("--sfk-marquee-distance");
  element.style.removeProperty("--sfk-marquee-duration");

  const fit = () => {
    if (!element.isConnected || window.innerWidth <= 700) return;

    element.style.removeProperty("font-size");
    const normalSize = parseFloat(window.getComputedStyle(element).fontSize) || 24;
    const available = element.clientWidth;
    if (!available) return;

    // If the normal subject size already fits, leave it completely untouched.
    if (element.scrollWidth <= available + 1) return;

    const minimumSize = Math.max(13, normalSize * 0.58);
    let low = minimumSize;
    let high = normalSize;
    let best = minimumSize;

    // Find the largest font size that still fits on one line.
    for (let i = 0; i < 12; i += 1) {
      const mid = (low + high) / 2;
      element.style.setProperty("font-size", `${mid}px`, "important");
      if (element.scrollWidth <= available + 1) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    element.style.setProperty("font-size", `${Math.floor(best * 10) / 10}px`, "important");
  };

  requestAnimationFrame(() => requestAnimationFrame(fit));
  window.setTimeout(fit, 120);
  if (document.fonts?.ready) {
    document.fonts.ready.then(fit).catch(() => {});
  }
}


function autoFitPeriodMetaLine(element) {
  if (!element) return;

  // Phone keeps the established compact layout.
  if (window.innerWidth <= 700) {
    element.style.removeProperty("font-size");
    return;
  }

  const fit = () => {
    if (!element.isConnected || window.innerWidth <= 700) return;

    // Start at the normal CSS size every time. If it fits, do not shrink it.
    element.style.removeProperty("font-size");
    const normalSize = parseFloat(window.getComputedStyle(element).fontSize) || 16;
    const available = element.clientWidth;
    if (!available) return;

    if (element.scrollWidth <= available + 1) return;

    // Keep one line at all costs, but only shrink as much as actually needed.
    const minimumSize = Math.max(10, normalSize * 0.60);
    let low = minimumSize;
    let high = normalSize;
    let best = minimumSize;

    for (let i = 0; i < 14; i += 1) {
      const mid = (low + high) / 2;
      element.style.setProperty("font-size", `${mid}px`, "important");
      if (element.scrollWidth <= available + 1) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    element.style.setProperty("font-size", `${Math.floor(best * 10) / 10}px`, "important");
  };

  requestAnimationFrame(() => requestAnimationFrame(fit));
  window.setTimeout(fit, 120);
  if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
}

let sfkMarqueeResizeTimer = 0;

function fitTodayScheduleSubject(element) {
  if (!element) return;

  // Keep the established phone layout untouched. This fix targets the
  // desktop/tablet Today's Schedule cards where the title lane is one line.
  if (!window.matchMedia("(min-width: 901px)").matches) {
    element.style.removeProperty("font-size");
    return;
  }

  // A schedule row is rebuilt on every render, but clean up any old marquee
  // state as a safeguard when live updates or resizes reuse the same node.
  element.classList.remove("sfk-marquee-active");
  element.style.removeProperty("--sfk-marquee-distance");
  element.style.removeProperty("--sfk-marquee-duration");

  const oldTrack = Array.from(element.children || []).find((child) =>
    child.classList?.contains("sfk-marquee-track")
  );
  if (oldTrack) {
    oldTrack.getAnimations?.().forEach((animation) => {
      try { animation.cancel(); } catch (_) {}
    });
    while (oldTrack.firstChild) element.insertBefore(oldTrack.firstChild, oldTrack);
    oldTrack.remove();
  }

  const fit = () => {
    if (!element.isConnected || !window.matchMedia("(min-width: 901px)").matches) return;

    // Always start from the normal CSS size. Short names such as Filipino stay
    // at the intended large size; shrinking happens only when genuinely needed.
    element.style.removeProperty("font-size");
    const normalSize = parseFloat(window.getComputedStyle(element).fontSize) || 18;
    const available = Math.max(0, Math.floor(element.clientWidth) - 3); // tiny glyph safety room
    if (!available) return;

    // v391: Do NOT use element.scrollWidth here. A block-level subject-name has
    // scrollWidth >= clientWidth even when a short title fits perfectly, so the
    // old check falsely treated every subject as overflowing and shrank it.
    // Measure the actual rendered title/anchor content instead.
    const measureNaturalWidth = () => {
      const link = element.querySelector(".schedule-text-link");
      if (link) return Math.ceil(link.getBoundingClientRect().width || 0);

      try {
        const range = document.createRange();
        range.selectNodeContents(element);
        const width = range.getBoundingClientRect().width || 0;
        range.detach?.();
        return Math.ceil(width);
      } catch (_) {
        return Math.ceil(element.getBoundingClientRect().width || 0);
      }
    };

    const naturalWidth = measureNaturalWidth();
    // Short/normal names keep the ORIGINAL large CSS font untouched.
    if (!naturalWidth || naturalWidth <= available) return;

    // Find the largest font size that keeps the COMPLETE subject on one line.
    // Only genuinely long names are reduced.
    const minimumSize = Math.max(9, normalSize * 0.50);
    let low = minimumSize;
    let high = normalSize;
    let best = minimumSize;

    for (let i = 0; i < 16; i += 1) {
      const mid = (low + high) / 2;
      element.style.setProperty("font-size", `${mid}px`, "important");
      const width = measureNaturalWidth();
      if (width <= available) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    element.style.setProperty("font-size", `${Math.floor(best * 10) / 10}px`, "important");

    // Extreme edge-case fallback: step down only while the actual title content
    // remains wider than the available title lane.
    let guard = 0;
    while (measureNaturalWidth() > available && guard < 12) {
      const current = parseFloat(window.getComputedStyle(element).fontSize) || best;
      if (current <= 8) break;
      element.style.setProperty("font-size", `${Math.max(8, current - 0.4).toFixed(1)}px`, "important");
      guard += 1;
    }
  };

  window.requestAnimationFrame(() => window.requestAnimationFrame(fit));
  window.setTimeout(fit, 120);
  window.setTimeout(fit, 360);
  document.fonts?.ready?.then(fit).catch(() => {});
}

function setupTodayScheduleSubjectMarquees() {
  if (!window.matchMedia("(min-width: 901px)").matches) return;

  document.querySelectorAll("#scheduleList .subject-name").forEach((element) => {
    fitTodayScheduleSubject(element);
  });
}

function refreshSingleLineMarquees() {
  const currentSubject = document.getElementById("currentSubject");
  const nextSubject = document.getElementById("nextSubject");
  if (currentSubject) autoFitPeriodSubject(currentSubject);
  if (nextSubject) autoFitPeriodSubject(nextSubject);

  const currentMeta = document.querySelector(".heroGrid .current .period-meta");
  const nextMeta = document.querySelector(".heroGrid .next .period-meta");
  if (currentMeta) autoFitPeriodMetaLine(currentMeta);
  if (nextMeta) autoFitPeriodMetaLine(nextMeta);

  setupTodayScheduleSubjectMarquees();
}

window.addEventListener("resize", () => {
  window.clearTimeout(sfkMarqueeResizeTimer);
  sfkMarqueeResizeTimer = window.setTimeout(refreshSingleLineMarquees, 180);
});



const CLASSBOARD_PAGE_LOCK_DEFAULT_MESSAGE = "NOT AVAILABLE. Students forgot to be Kind a little.";
const CLASSBOARD_PAGE_LOCK_IMAGE = "page-lock-kindness-poster.jpg";

function isClassBoardPageLocked(settings = {}) {
  const text = String(settings?.PageLockEnabled || "").trim().toUpperCase();
  return ["YES", "TRUE", "1", "ON", "LOCKED"].includes(text);
}

function getClassBoardPageLockMessage(settings = {}) {
  return String(settings?.PageLockMessage || CLASSBOARD_PAGE_LOCK_DEFAULT_MESSAGE).trim() || CLASSBOARD_PAGE_LOCK_DEFAULT_MESSAGE;
}

function showClassBoardPageLock(settings = {}) {
  const message = getClassBoardPageLockMessage(settings);
  const app = document.querySelector(".app") || document.body;
  let screen = document.getElementById("sfkPageLockScreen");

  document.body.classList.add("classBoardPageLocked");
  document.documentElement.classList.add("classBoardPageLocked");
  announcementRotationPaused = true;
  window.clearTimeout(announcementRotateTimer);
  window.clearTimeout(announcementFastRefreshTimer);

  const intro = document.getElementById("sfkIntroOverlay");
  if (intro) {
    intro.classList.add("is-hidden");
    intro.hidden = true;
    intro.style.display = "none";
  }

  const audioOverlay = document.getElementById("audioStartOverlay");
  if (audioOverlay) audioOverlay.classList.add("hidden");

  if (!screen) {
    screen = document.createElement("section");
    screen.id = "sfkPageLockScreen";
    screen.className = "sfkPageLockScreen";
    app.insertBefore(screen, app.firstChild || null);
  }

  screen.innerHTML = `
    <div class="sfkPageLockBackdrop" aria-hidden="true">
      <img class="sfkPageLockBackdropImage" src="${CLASSBOARD_PAGE_LOCK_IMAGE}" alt="" loading="eager" decoding="async" />
      <div class="sfkPageLockBackdropShade"></div>
      <div class="sfkPageLockAurora"></div>
      <div class="sfkPageLockShimmer"></div>
      <div class="sfkPageLockDustField"></div>
      <div class="sfkPageLockParticles">
        <span class="sfkParticle sfkParticle1"></span>
        <span class="sfkParticle sfkParticle2"></span>
        <span class="sfkParticle sfkParticle3"></span>
        <span class="sfkParticle sfkParticle4"></span>
        <span class="sfkParticle sfkParticle5"></span>
        <span class="sfkParticle sfkParticle6"></span>
        <span class="sfkParticle sfkParticle7"></span>
        <span class="sfkParticle sfkParticle8"></span>
        <span class="sfkParticle sfkParticle9"></span>
        <span class="sfkParticle sfkParticle10"></span>
        <span class="sfkParticle sfkParticle11"></span>
        <span class="sfkParticle sfkParticle12"></span>
        <span class="sfkParticle sfkParticle13"></span>
        <span class="sfkParticle sfkParticle14"></span>
        <span class="sfkParticle sfkParticle15"></span>
        <span class="sfkParticle sfkParticle16"></span>
        <span class="sfkParticle sfkParticle17"></span>
        <span class="sfkParticle sfkParticle18"></span>
        <span class="sfkParticle sfkParticle19"></span>
        <span class="sfkParticle sfkParticle20"></span>
        <span class="sfkParticle sfkParticle21"></span>
        <span class="sfkParticle sfkParticle22"></span>
        <span class="sfkParticle sfkParticle23"></span>
        <span class="sfkParticle sfkParticle24"></span>
        <span class="sfkParticle sfkParticle25"></span>
        <span class="sfkParticle sfkParticle26"></span>
        <span class="sfkParticle sfkParticle27"></span>
        <span class="sfkParticle sfkParticle28"></span>
        <span class="sfkParticle sfkParticle29"></span>
        <span class="sfkParticle sfkParticle30"></span>
        <span class="sfkParticle sfkParticle31"></span>
        <span class="sfkParticle sfkParticle32"></span>
        <span class="sfkParticle sfkParticle33"></span>
        <span class="sfkParticle sfkParticle34"></span>
        <span class="sfkParticle sfkParticle35"></span>
        <span class="sfkParticle sfkParticle36"></span>
        <span class="sfkParticle sfkParticle37"></span>
        <span class="sfkParticle sfkParticle38"></span>
        <span class="sfkParticle sfkParticle39"></span>
        <span class="sfkParticle sfkParticle40"></span>
      </div>
      <div class="sfkPageLockLeaves">
        <span class="sfkLeaf sfkLeaf1"></span>
        <span class="sfkLeaf sfkLeaf2"></span>
        <span class="sfkLeaf sfkLeaf3"></span>
        <span class="sfkLeaf sfkLeaf4"></span>
        <span class="sfkLeaf sfkLeaf5"></span>
        <span class="sfkLeaf sfkLeaf6"></span>
        <span class="sfkLeaf sfkLeaf7"></span>
        <span class="sfkLeaf sfkLeaf8"></span>
        <span class="sfkLeaf sfkLeaf9"></span>
        <span class="sfkLeaf sfkLeaf10"></span>
        <span class="sfkLeaf sfkLeaf11"></span>
        <span class="sfkLeaf sfkLeaf12"></span>
        <span class="sfkLeaf sfkLeaf13"></span>
        <span class="sfkLeaf sfkLeaf14"></span>
        <span class="sfkLeaf sfkLeaf15"></span>
        <span class="sfkLeaf sfkLeaf16"></span>
        <span class="sfkLeaf sfkLeaf17"></span>
        <span class="sfkLeaf sfkLeaf18"></span>
        <span class="sfkLeaf sfkLeaf19"></span>
        <span class="sfkLeaf sfkLeaf20"></span>
        <span class="sfkLeaf sfkLeaf21"></span>
        <span class="sfkLeaf sfkLeaf22"></span>
        <span class="sfkLeaf sfkLeaf23"></span>
        <span class="sfkLeaf sfkLeaf24"></span>
      </div>
    </div>
    <div class="sfkPageLockCard sfkPageLockCardAlive" role="status" aria-live="polite">
      <div class="sfkPageLockTopline">
        <div class="sfkPageLockIcon" aria-hidden="true">🔒</div>
        <p class="sfkPageLockEyebrow">SFK ClassBoard</p>
      </div>
      <div class="sfkPageLockHeroStage">
        <div class="sfkPageLockHeroGlow" aria-hidden="true"></div>
        <img class="sfkPageLockHero" src="${CLASSBOARD_PAGE_LOCK_IMAGE}" alt="Kindness poster" loading="eager" decoding="async" onerror="this.closest('.sfkPageLockHeroStage')?.classList.add('is-missing')" />
      </div>
      <div class="sfkPageLockMessagePanel">
        <h1>NOT AVAILABLE</h1>
        <p class="sfkPageLockMessage">${escapeHtml(message)}</p>
        <p class="sfkPageLockSubtext">Please come back when the class page is reopened.</p>
      </div>
    </div>
  `;
}

function hideClassBoardPageLock() {
  document.body.classList.remove("classBoardPageLocked");
  document.documentElement.classList.remove("classBoardPageLocked");
  const screen = document.getElementById("sfkPageLockScreen");
  if (screen) screen.remove();
  announcementRotationPaused = false;
}


/* =========================================================
   v206 ROTATING CLASSBOARD HEADING
   Base title: 5 seconds. Random name: 3 seconds.
   Every name is shown once before the pool reshuffles.
========================================================= */
const SFK_ROTATING_HEADING_NAMES = [
  "Lord Rani Karl",
  "Johnreeve Khari",
  "Jayren",
  "Rojer Jyuan",
  "John Manuel",
  "Leobert Joros",
  "Marcus Brent",
  "Robin Dale",
  "Dan Leonard",
  "Oliver Francois",
  "Kellin Chase",
  "Andrei James",
  "Blaine Xander",
  "Argi Caleb",
  "Ram Jacob",
  "Shawn Rowin",
  "John Miguel",
  "Juancho Jakob",
  "Dion Carlo",
  "Mael",
  "Marcus Carsten",
  "Alleria Jhane",
  "Elijah",
  "Cassandra Vielle",
  "Mary Joice",
  "Kyrie Blaire",
  "Brina Marce",
  "Kreezha Cylee",
  "Rich Anne Mary",
  "Azzurie",
  "Jayra",
  "Breeana Klein",
  "Keiszha Andrea",
  "Johanna",
  "Arnie",
  "Yumi Dennise",
  "Ckeannie Aliyah",
  "Christin Louhrayne",
  "Gillian Venice",
  "Jasmin Sia",
  "Sofia Marie",
  "Joella Vian",
  "Ellerie Mich",
  "Sir JR"
];

const SFK_HEADING_BASE_MS = 5000;
const SFK_HEADING_NAME_MS = 3000;
const SFK_HEADING_EXIT_MS = 260;
const SFK_HEADING_ENTER_MS = 520;
let sfkHeadingBaseText = "SFK ClassBoard";
let sfkHeadingNameQueue = [];
let sfkHeadingLastName = "";
let sfkHeadingTimer = 0;
let sfkHeadingTransitionTimer = 0;
let sfkHeadingShowingBase = true;
let sfkHeadingRotationStarted = false;

function getSfkRandomIndex(maxExclusive) {
  if (maxExclusive <= 1) return 0;

  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let value = 0;
    do {
      window.crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);
    return value % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function isSfkHeadingOrderTooPredictable(queue) {
  if (queue.length < 4) return false;

  const original = SFK_ROTATING_HEADING_NAMES;
  const samePositions = queue.reduce((count, name, index) => count + (name === original[index] ? 1 : 0), 0);
  const alphabetical = [...queue].sort((a, b) => a.localeCompare(b));
  const matchesAlphabetical = queue.every((name, index) => name === alphabetical[index]);
  const matchesReverseAlphabetical = queue.every((name, index) => name === alphabetical[alphabetical.length - 1 - index]);

  return samePositions > Math.ceil(queue.length * .22) || matchesAlphabetical || matchesReverseAlphabetical;
}

function shuffleSfkHeadingNames() {
  let queue = [];
  let attempts = 0;

  do {
    queue = [...SFK_ROTATING_HEADING_NAMES];
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = getSfkRandomIndex(i + 1);
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    attempts += 1;
  } while (attempts < 8 && isSfkHeadingOrderTooPredictable(queue));

  // Avoid a back-to-back repeat when a new full round begins.
  if (queue.length > 1 && sfkHeadingLastName && queue[0] === sfkHeadingLastName) {
    const swapIndex = 1 + getSfkRandomIndex(queue.length - 1);
    [queue[0], queue[swapIndex]] = [queue[swapIndex], queue[0]];
  }

  sfkHeadingNameQueue = queue;
}
function getNextSfkHeadingName() {
  if (!sfkHeadingNameQueue.length) shuffleSfkHeadingNames();
  const nextName = sfkHeadingNameQueue.shift() || "";
  sfkHeadingLastName = nextName;
  return nextName;
}

function fitSfkDashboardHeading() {
  const title = document.getElementById("dashboardTitle");
  if (!title) return;

  title.style.removeProperty("font-size");
  title.style.removeProperty("letter-spacing");
  title.classList.remove("sfkHeadingTight", "sfkHeadingVeryTight");

  requestAnimationFrame(() => {
    if (!title.isConnected) return;
    const available = Math.max(1, title.clientWidth);
    const needed = Math.max(1, title.scrollWidth);
    if (needed <= available) return;

    const ratio = available / needed;
    if (ratio < 0.82) title.classList.add("sfkHeadingVeryTight");
    else title.classList.add("sfkHeadingTight");

    requestAnimationFrame(() => {
      if (!title.isConnected || title.scrollWidth <= title.clientWidth) return;
      const computed = window.getComputedStyle(title);
      const currentSize = parseFloat(computed.fontSize) || 24;
      const fitRatio = Math.max(.66, Math.min(1, title.clientWidth / Math.max(1, title.scrollWidth)));
      title.style.setProperty("font-size", `${Math.max(14, currentSize * fitRatio * .985)}px`, "important");
    });
  });
}

function setSfkHeadingText(nextText, animate = true) {
  const title = document.getElementById("dashboardTitle");
  if (!title) return;

  window.clearTimeout(sfkHeadingTransitionTimer);
  title.classList.remove("sfkHeadingLeaving", "sfkHeadingEntering");

  const applyText = () => {
    title.textContent = nextText;
    title.title = nextText;
    fitSfkDashboardHeading();

    if (!animate) return;

    // Restart the entrance animation even when transitions happen repeatedly.
    void title.offsetWidth;
    title.classList.add("sfkHeadingEntering");
    sfkHeadingTransitionTimer = window.setTimeout(() => {
      title.classList.remove("sfkHeadingEntering");
    }, SFK_HEADING_ENTER_MS);
  };

  if (!animate || title.textContent === nextText) {
    applyText();
    return;
  }

  title.classList.add("sfkHeadingLeaving");
  sfkHeadingTransitionTimer = window.setTimeout(() => {
    title.classList.remove("sfkHeadingLeaving");
    applyText();
  }, SFK_HEADING_EXIT_MS);
}
function setSfkDashboardBaseTitle(value) {
  sfkHeadingBaseText = String(value || "SFK ClassBoard").trim() || "SFK ClassBoard";
  if (sfkHeadingShowingBase) setSfkHeadingText(sfkHeadingBaseText, false);
}

function scheduleNextSfkHeadingSwap(delay) {
  window.clearTimeout(sfkHeadingTimer);
  sfkHeadingTimer = window.setTimeout(() => {
    if (sfkHeadingShowingBase) {
      const nextName = getNextSfkHeadingName();
      sfkHeadingShowingBase = false;
      setSfkHeadingText(nextName, true);
      scheduleNextSfkHeadingSwap(SFK_HEADING_NAME_MS + SFK_HEADING_EXIT_MS);
    } else {
      sfkHeadingShowingBase = true;
      setSfkHeadingText(sfkHeadingBaseText, true);
      scheduleNextSfkHeadingSwap(SFK_HEADING_BASE_MS + SFK_HEADING_EXIT_MS);
    }
  }, delay);
}

function startSfkHeadingRotation() {
  if (sfkHeadingRotationStarted) return;
  const title = document.getElementById("dashboardTitle");
  if (!title) return;

  sfkHeadingRotationStarted = true;
  sfkHeadingShowingBase = true;
  sfkHeadingBaseText = String(title.textContent || sfkHeadingBaseText).trim() || "SFK ClassBoard";
  setSfkHeadingText(sfkHeadingBaseText, false);
  shuffleSfkHeadingNames();
  scheduleNextSfkHeadingSwap(SFK_HEADING_BASE_MS);

  window.addEventListener("resize", fitSfkDashboardHeading, { passive: true });
}

/* =========================================================
   v381 HOMEPAGE LIVE DISPLAY / EFFECTS
   Admin-controlled, full-screen, dismissible per page view,
   with Firestore real-time sync and normal 2-second fallback.
========================================================= */
const HOMEPAGE_EFFECT_KEYS = new Set([
  "HomepageEffectEnabled",
  "HomepageEffectMode",
  "HomepageEffectTitle",
  "HomepageEffectMessage",
  "HomepageEffectImage",
  "HomepageEffectImages",
  "HomepageEffectDismissible",
  "HomepageEffectAlertSound",
  "HomepageEffectSpiderSound",
  "HomepageEffectAudioEnabled",
  "HomepageEffectAudioUrl",
  "HomepageEffectAudioLoop",
  "HomepageEffectYouTubeUrl",
  "HomepageEffectYouTubeMuted",
  "HomepageEffectRickrollUrl",
  "HomepageEffectUpdatedAt",
  "FreedomWallTheme",
  "FreedomWallAllowPosting",
  "FreedomWallShowNames",
  "FreedomWallAllowTextColor",
  "FreedomWallAllowFont",
  "FreedomWallAllowGif",
  "FreedomWallAllowYouTube",
  "FreedomWallAllowYouTubeSearch",
  "FreedomWallAllowGifSearch",
  "FreedomWallMediaSearchUrl",
  "FreedomWallGiphyApiKey",
  "FreedomWallYouTubePlaybackMode",
  "FreedomWallPlaylistEnabled",
  "FreedomWallPlaylist",
  "FreedomWallPlaylistShuffle",
  "FreedomWallPlaylistLoop",
  "FreedomWallActiveWallID"
]);

let homepageEffectUnsubscribe = null;
let homepageEffectListenAttempts = 0;
let homepageEffectCurrentSignature = "";
let homepageEffectDismissedSignature = "";
let homepageEffectDismissAllowed = true;
let homepageEffectRenderToken = 0;
let homepageEffectParticleMode = "";
let homepageEffectAmbientMode = "";
let homepageEffectLatestUpdatedAt = 0;
let homepageEffectGalleryIndex = 0;
let homepageEffectGallerySources = [];
let homepageEffectGalleryScrollTimer = 0;
let homepageEffectGalleryRenderSignature = "";
let homepageEffectGalleryStoryTimer = 0;
let homepageEffectGalleryProgressFrame = 0;
let homepageEffectGalleryStoryStartedAt = 0;
let homepageEffectGalleryStoryRemainingMs = 15000;
let homepageEffectGalleryStoryPaused = false;
let homepageEffectGalleryStorySignature = "";
const HOMEPAGE_EFFECT_GALLERY_STORY_MS = 15000;
let homepageAlertAudioContext = null;
let homepageAlertSoundTimer = 0;
let homepageAlertSoundActive = false;
let homepageAlertSoundSignature = "";
let homepageAlertAudioPrimed = false;
const homepageAlertOscillators = new Set();
const HOMEPAGE_EFFECT_DEFAULT_AUDIO_URLS = {
  "spider-glitch": "https://audio.jukehost.co.uk/019fe9f5-214f-72a6-b974-320080180160",
  "comic-web": "https://audio.jukehost.co.uk/019fea02-24bd-729b-8e0c-b0bf7be7a9e0",
  "black-symbiote": "https://audio.jukehost.co.uk/019fea3c-43ce-7225-90f3-8405d456eea1"
};
let homepageEffectMusicAudio = null;
let homepageEffectMusicWanted = false;
let homepageEffectMusicSignature = "";
let homepageEffectMusicUrl = "";
let homepageEffectMusicLoop = true;
let homepageEffectMusicPrimed = false;
let homepageEffectMusicPlaylistActive = false;
let homepageEffectMusicPlaylistTracks = [];
let homepageEffectMusicPlaylistOrder = [];
let homepageEffectMusicPlaylistPosition = 0;
let homepageEffectMusicPlaylistShuffle = false;
let homepageEffectMusicPlaylistLoop = true;
let homepageEffectMusicPlaylistFailures = 0;
let homepageEffectMusicSuppressedByWallVideo = false;
let freedomWallActiveYoutubePlayback = null;
let freedomWallYoutubeApiPromise = null;
let freedomWallPageLockActive = false;
let freedomWallPageLockScrollY = 0;
let freedomWallPageLockBodyStyles = null;
let homepageEffectPendingSettings = null;
let homepageEffectStartupWaitTimer = 0;
let homepageEffectYouTubePlayerKey = "";
let homepageRickrollSignature = "";
let homepageRickrollRevealed = false;
let homepageRickrollPlayerKey = "";
let homepageRickrollUrl = "https://streamable.com/33rhw4";
const HOMEPAGE_RICKROLL_DEFAULT_URL = "https://streamable.com/33rhw4";

/* =========================================================
   v454 SFK FREEDOM WALL
   Live student sticky notes + Admin prompt/background controls.
========================================================= */
const FREEDOM_WALL_COLLECTION = "freedomWallNotes";
const FREEDOM_WALL_SESSION_COLLECTION = "freedomWallSessions";
const FREEDOM_WALL_PROMPT_REACTION_COLLECTION = "freedomWallPromptReactions";
const FREEDOM_WALL_REPLY_COLLECTION = "freedomWallReplies";
const FREEDOM_WALL_LEGACY_SESSION_ID = "legacy";
const FREEDOM_WALL_MAX_RENDERED_NOTES = 400;
const FREEDOM_WALL_NOTE_MAX_LENGTH = 240;
const FREEDOM_WALL_AUTHOR_MAX_LENGTH = 42;
const FREEDOM_WALL_MEDIA_MAX_STATIC_SOURCE_BYTES = 8 * 1024 * 1024;
const FREEDOM_WALL_MEDIA_MAX_BYTES = 520 * 1024;
const FREEDOM_WALL_MEDIA_MAX_GIF_BYTES = 500 * 1024;
const FREEDOM_WALL_THEME_SET = new Set(["sunny","rainy","night","flood","comic","comic-noir","comic-manga","comic-strip","school-note","sticky-notes","jungle","bulletin-board","whiteboard","cafe","sakura","galaxy","beach","art-room","library","newspaper","liquid-glass","polaroid","retro-arcade","coding-lab","rainbow","brick-alley","school-fair","eco","dreamy-clouds","chalkboard","detective","cutout-pop","appreciation","seasonal","neon-music","spiderman","filipino","poste","graffiti","vandal"]);
const FREEDOM_WALL_COLORS = ["yellow","cream","white","peach","coral","pink","rose","lavender","violet","sky","blue","mint","sage","green","lime","orange","tan","gray","navy","black"];
const FREEDOM_WALL_COLOR_HEX = Object.freeze({
  yellow:"#fff1a5", cream:"#fff6d9", white:"#fffdf5", peach:"#ffd6c9", coral:"#ffb9a8",
  pink:"#ffc7df", rose:"#f6b4c9", lavender:"#e6d7ff", violet:"#d6c3ff", sky:"#c7eaff",
  blue:"#acd3ff", mint:"#c9f2d9", sage:"#d5e3c1", green:"#bfe3b4", lime:"#e2f3a7",
  orange:"#ffd0a1", tan:"#dfc69c", gray:"#d9dce1", navy:"#26334f", black:"#202124"
});
const FREEDOM_WALL_TEXT_COLOR_HEX = Object.freeze({
  black:"#171717", charcoal:"#34383d", white:"#ffffff", navy:"#183153", blue:"#165fbd",
  red:"#c62828", maroon:"#7f1d2d", green:"#237a3b", brown:"#70452f", purple:"#6d3dad",
  pink:"#b83280", orange:"#b45309", gold:"#8a6400"
});
const FREEDOM_WALL_TEXT_COLORS = Object.freeze(Object.keys(FREEDOM_WALL_TEXT_COLOR_HEX));
const FREEDOM_WALL_FONTS = Object.freeze(["theme-default","clean","rounded","handwritten","marker","classic-serif","typewriter","comic","bold-poster","elegant","casual","monospace"]);
// v479 post hotfix: the live site may still be using the older v477 Firestore
// rules while the new customization UI is already deployed. Keep a compatibility
// path so posting never dies just because rules have not been upgraded yet.
const FREEDOM_WALL_LEGACY_COLORS = new Set(["yellow","pink","blue","mint","orange","violet","peach","white"]);
const FREEDOM_WALL_LEGACY_COLOR_MAP = Object.freeze({
  yellow:"yellow", cream:"yellow", white:"white", peach:"peach", coral:"peach",
  pink:"pink", rose:"pink", lavender:"violet", violet:"violet", sky:"blue",
  blue:"blue", mint:"mint", sage:"mint", green:"mint", lime:"yellow",
  orange:"orange", tan:"orange", gray:"white", navy:"blue", black:"blue"
});
const FREEDOM_WALL_TEXTURED_TEXT_THEMES = new Set(["jungle","chalkboard","graffiti","vandal","poste","comic","comic-noir","comic-manga","comic-strip","spiderman"]);
const FREEDOM_WALL_REACTIONS = Object.freeze({ heart:"❤️", haha:"😂", wow:"😮", sad:"😢", like:"👍" });
const FREEDOM_WALL_REACTION_TYPES = Object.freeze(Object.keys(FREEDOM_WALL_REACTIONS));
const FREEDOM_WALL_REACTION_HOLD_MS = 480;
const FREEDOM_WALL_REACTION_MOVE_THRESHOLD = 11;
const FREEDOM_WALL_REPLY_MAX_LENGTH = 240;
const FREEDOM_WALL_REPLY_HOLD_MS = 430;
const FREEDOM_WALL_REPLY_MOVE_THRESHOLD = 10;
const FREEDOM_WALL_READER_DURATION_MS = 15000;
const FREEDOM_WALL_READER_SWIPE_THRESHOLD = 46;
const FREEDOM_WALL_READER_MOVE_THRESHOLD = 11;
// v535: device-independent teacher identity trigger. The literal nickname is
// intentionally never rendered publicly; it only selects the Koala / Sir JR UI.
const FREEDOM_WALL_SIRJR_NICKNAME = "<sirjr>";
const FREEDOM_WALL_SIRJR_DISPLAY_NAME = "Sir JR";
let freedomWallUnsubscribe = null;
let freedomWallListenToken = 0;
let freedomWallConfig = null;
let freedomWallPromptDismissedSignature = "";

function isFreedomWallFilipinoTheme(theme = freedomWallConfig?.freedomWallTheme) {
  return String(theme || "").trim().toLowerCase() === "filipino";
}

function getFreedomWallAttachmentLabelState(theme = freedomWallConfig?.freedomWallTheme) {
  const modes = getFreedomWallAllowedAttachmentModes().map((item) => item.value);
  const isFilipino = isFreedomWallFilipinoTheme(theme);
  const hasImage = modes.includes("image");
  const hasGif = hasImage || modes.includes("gif") || modes.includes("gif-search");
  const hasYouTube = modes.includes("youtube") || modes.includes("youtube-search");
  let mediaLabel = isFilipino ? "Attachment (opsyonal)" : "Attachment (optional)";
  let typeLabel = isFilipino ? "Uri ng attachment" : "Attachment Type";
  if (hasImage && hasYouTube) {
    mediaLabel = isFilipino ? "Larawan / GIF / YouTube (opsyonal)" : "Photo / GIF / YouTube (optional)";
    typeLabel = isFilipino ? "Larawan, GIF, o YouTube" : "Photo, GIF, or YouTube";
  } else if (hasImage && hasGif) {
    mediaLabel = isFilipino ? "Larawan / GIF (opsyonal)" : "Photo / GIF (optional)";
    typeLabel = isFilipino ? "Larawan o GIF" : "Photo or GIF";
  } else if (hasGif && hasYouTube) {
    mediaLabel = isFilipino ? "GIF / YouTube (opsyonal)" : "GIF / YouTube (optional)";
    typeLabel = isFilipino ? "GIF o YouTube" : "GIF or YouTube";
  } else if (hasYouTube) {
    mediaLabel = isFilipino ? "YouTube (opsyonal)" : "YouTube (optional)";
    typeLabel = isFilipino ? "YouTube option" : "YouTube Option";
  } else if (hasGif) {
    mediaLabel = isFilipino ? "GIF (opsyonal)" : "GIF (optional)";
    typeLabel = isFilipino ? "GIF option" : "GIF Option";
  }
  return { mediaLabel, typeLabel };
}

function getFreedomWallUiCopy(theme = freedomWallConfig?.freedomWallTheme) {
  if (isFreedomWallFilipinoTheme(theme)) {
    return {
      brand: "SFK #BeKind WALL",
      live: "Buhay na pader",
      promptEyebrow: "PAKSA NG ATING PADER",
      addButton: "Mag-Note",
      addButtonAria: "Magdagdag ng note",
      composerTitle: "Magdagdag sa SFK #BeKind Wall",
      composerSubtitle: "Mag-iwan ng maikling mensahe para sa kapwa SFK.",
      nameLabel: "Pangalan / palayaw",
      namePlaceholder: "Iyong pangalan",
      noteLabel: "Iyong mensahe",
      notePlaceholder: "Sumulat ng mabait, totoo, masaya, taos-puso, o makabuluhang mensahe…",
      colorAria: "Kulay ng note",
      noteBackgroundLabel: "Kulay ng Note",
      textColorLabel: "Kulay ng Teksto",
      fontLabel: "Font",
      contrastHint: "Awtomatikong inaayos ang mahihinang color combination para malinaw basahin.",
      customizeLabel: "Ayusin ang Note",
      customizeClosedHint: "Kulay, teksto at font",
      customizeOpenHint: "Pumili ng style ng note",
      postButton: "Idikit ang Note",
      mediaLabel: "Larawan / GIF (opsyonal)",
      mediaHint: "Photo/GIF sa Polaroid; GIF at YouTube depende sa Admin settings.",
      mediaChoose: "Pumili ng Larawan / GIF",
      mediaRemove: "Alisin",
      closePromptAria: "Isara ang paksa",
      closeComposerAria: "Isara",
      statusEmpty: "Isulat muna ang iyong mensahe.",
      statusWait: "Sandali lang bago muling magpost ng panibagong note.",
      statusPosting: "Ipinapaskil…",
      statusDone: "Naipaskil na nang live!",
      statusFail: "Hindi maipaskil sa ngayon. Pakisubukang muli.",
      formatCount(count, mode = "normal") {
        if (mode === "connecting") return count ? `${count} mensahe • muling kumokonekta…` : "Muling kumokonekta…";
        if (mode === "initial") return count ? `${count} mensahe` : "Kumokonekta nang live…";
        return count ? `${count} mensahe` : "Buhay na pader";
      }
    };
  }
  return {
    brand: "SFK #BeKind WALL",
    live: "Live wall",
    promptEyebrow: "TODAY'S WALL PROMPT",
    addButton: "Add Note",
    addButtonAria: "Add a note",
    composerTitle: "Add to the SFK #BeKind Wall",
    composerSubtitle: "Share a short note with SFK.",
    nameLabel: "Name / nickname",
    namePlaceholder: "Your name",
    noteLabel: "Your note",
    notePlaceholder: "Write something kind, honest, funny, thankful, or meaningful…",
    colorAria: "Note background color",
    noteBackgroundLabel: "Note Background",
    textColorLabel: "Text Color",
    fontLabel: "Font",
    contrastHint: "Low-contrast combinations are adjusted automatically for readability.",
    customizeLabel: "Customize Note",
    customizeClosedHint: "Background, text color and font",
    customizeOpenHint: "Choose your note style",
    postButton: "Post Note",
    mediaLabel: "Photo / GIF (optional)",
    mediaHint: "Photo/GIF for Polaroid; GIF and YouTube depend on Admin settings.",
    mediaChoose: "Choose Photo / GIF",
    mediaRemove: "Remove",
    closePromptAria: "Close prompt",
    closeComposerAria: "Close",
    statusEmpty: "Write your note first.",
    statusWait: "Give it a moment before posting another note.",
    statusPosting: "Posting…",
    statusDone: "Posted live!",
    statusFail: "Unable to post right now. Please try again.",
    formatCount(count, mode = "normal") {
      if (mode === "connecting") return count ? `${count} notes • reconnecting…` : "Reconnecting live…";
      if (mode === "initial") return count ? `${count} notes` : "Connecting live…";
      return count ? `${count} ${count === 1 ? "note" : "notes"}` : "Live wall";
    }
  };
}

function buildFreedomWallCutoutMarkup(text = "", mode = "word") {
  const source = String(text || "").trim();
  if (!source) return "";
  const tokens = mode === "letter"
    ? Array.from(source)
    : source.split(/\s+/).filter(Boolean);
  let index = 0;
  return tokens.map((token) => {
    const palette = index % 10;
    const rotate = ((index % 5) - 2) * 1.8;
    const lift = index % 2 === 0 ? -1 : 1;
    index += 1;
    return `<span class="fwCutoutWord fwCutout-${palette}" style="--fw-cutout-rotate:${rotate}deg;--fw-cutout-lift:${lift}px">${escapeHtml(token)}</span>`;
  }).join(mode === "letter" ? "" : " ");
}

function applyFreedomWallCutoutTitle(target, text) {
  if (!target) return;
  const safe = String(freedomWallConfig?.freedomWallTheme || "").trim().toLowerCase();
  const source = String(text || "").trim();
  target.dataset.rawText = source;
  if (safe === "cutout-pop") {
    target.classList.add("is-cutout-pop-title");
    target.innerHTML = buildFreedomWallCutoutMarkup(source, source.length <= 18 ? "letter" : "word");
  } else {
    target.classList.remove("is-cutout-pop-title");
    target.textContent = source;
  }
}

function applyFreedomWallCutoutBrand(target, text) {
  if (!target) return;
  const safe = String(freedomWallConfig?.freedomWallTheme || "").trim().toLowerCase();
  const source = String(text || "").trim();
  target.dataset.rawText = source;
  if (safe === "cutout-pop") {
    target.classList.add("is-cutout-pop-brand");
    target.innerHTML = buildFreedomWallCutoutMarkup(source, "word");
  } else {
    target.classList.remove("is-cutout-pop-brand");
    target.textContent = source;
  }
}

function applyFreedomWallThemeCopy(theme = freedomWallConfig?.freedomWallTheme) {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  const copy = getFreedomWallUiCopy(theme);
  const brandStrong = layer.querySelector('.freedomWallBrand strong');
  const brandSpan = layer.querySelector('#freedomWallCount');
  const eyebrow = layer.querySelector('.freedomWallPromptEyebrow');
  const promptClose = layer.querySelector('#freedomWallPromptClose');
  const addBtn = layer.querySelector('#freedomWallAddBtn');
  const addSmall = addBtn?.querySelector('small');
  const composerTitle = layer.querySelector('.freedomWallComposerHead strong');
  const composerSubtitle = layer.querySelector('.freedomWallComposerHead span');
  const composerClose = layer.querySelector('#freedomWallComposerClose');
  const nameLabel = layer.querySelector('label[for="freedomWallAuthorInput"]');
  const nameInput = layer.querySelector('#freedomWallAuthorInput');
  const noteLabel = layer.querySelector('label[for="freedomWallNoteInput"]');
  const noteInput = layer.querySelector('#freedomWallNoteInput');
  const colorRow = layer.querySelector('.freedomWallColorRow');
  const backgroundLabel = layer.querySelector('#freedomWallBackgroundLabel');
  const textColorLabel = layer.querySelector('#freedomWallTextColorLabel');
  const fontLabel = layer.querySelector('#freedomWallFontLabel');
  const contrastHint = layer.querySelector('#freedomWallContrastHint');
  const customizeLabel = layer.querySelector('#freedomWallCustomizeLabel');
  const customizeHint = layer.querySelector('#freedomWallCustomizeHint');
  const mediaField = layer.querySelector('#freedomWallMediaField');
  const mediaLabel = layer.querySelector('#freedomWallMediaLabel');
  const mediaHint = layer.querySelector('#freedomWallMediaHint');
  const mediaChoose = layer.querySelector('#freedomWallMediaChooseText');
  const mediaRemove = layer.querySelector('#freedomWallMediaRemove');
  const postBtn = layer.querySelector('#freedomWallPostBtn');
  if (brandStrong) applyFreedomWallCutoutBrand(brandStrong, copy.brand);
  if (brandSpan && !freedomWallLastRenderedCount) brandSpan.textContent = copy.live;
  if (eyebrow) eyebrow.textContent = copy.promptEyebrow;
  if (promptClose) promptClose.setAttribute('aria-label', copy.closePromptAria);
  if (addBtn) addBtn.setAttribute('aria-label', copy.addButtonAria);
  if (addSmall) addSmall.textContent = copy.addButton;
  if (composerTitle) composerTitle.textContent = copy.composerTitle;
  if (composerSubtitle) composerSubtitle.textContent = copy.composerSubtitle;
  if (composerClose) composerClose.setAttribute('aria-label', copy.closeComposerAria);
  if (nameLabel) nameLabel.textContent = copy.nameLabel;
  if (nameInput) nameInput.placeholder = copy.namePlaceholder;
  if (noteLabel) noteLabel.textContent = copy.noteLabel;
  if (noteInput) noteInput.placeholder = copy.notePlaceholder;
  if (colorRow) colorRow.setAttribute('aria-label', copy.colorAria);
  if (backgroundLabel) backgroundLabel.textContent = copy.noteBackgroundLabel;
  if (textColorLabel) textColorLabel.textContent = copy.textColorLabel;
  if (fontLabel) fontLabel.textContent = copy.fontLabel;
  if (contrastHint) contrastHint.textContent = copy.contrastHint;
  if (customizeLabel) customizeLabel.textContent = copy.customizeLabel;
  if (customizeHint) customizeHint.textContent = copy.customizeClosedHint;
  const isPolaroid = String(theme || '').trim().toLowerCase() === 'polaroid';
  const allowGif = Boolean(freedomWallConfig?.freedomWallAllowGif);
  const allowYouTube = Boolean(freedomWallConfig?.freedomWallAllowYouTube);
  const searchEndpoint = getFreedomWallMediaSearchEndpoint();
  const allowGifSearch = Boolean(freedomWallConfig?.freedomWallAllowGifSearch && searchEndpoint);
  const allowYouTubeSearch = Boolean(freedomWallConfig?.freedomWallAllowYouTubeSearch && searchEndpoint);
  const mediaAvailable = isPolaroid || allowGif || allowGifSearch || allowYouTube || allowYouTubeSearch;
  const attachmentLabels = getFreedomWallAttachmentLabelState(theme);
  if (mediaField) mediaField.hidden = !mediaAvailable;
  if (mediaLabel) mediaLabel.textContent = attachmentLabels.mediaLabel || copy.mediaLabel;
  if (mediaTypeLabel) mediaTypeLabel.textContent = attachmentLabels.typeLabel;
  if (mediaHint) mediaHint.textContent = copy.mediaHint;
  if (mediaChoose) mediaChoose.textContent = copy.mediaChoose;
  if (mediaRemove) mediaRemove.textContent = copy.mediaRemove;
  if (!mediaAvailable) resetFreedomWallPendingMedia();
  updateFreedomWallMediaUi();
  if (postBtn) postBtn.textContent = copy.postButton;
}

function applyFreedomWallThemeDecor(theme = freedomWallConfig?.freedomWallTheme) {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  const burstA = layer.querySelector('.freedomWallComicBurst.burst-a');
  const burstB = layer.querySelector('.freedomWallComicBurst.burst-b');
  const markA = layer.querySelector('.freedomWallVandalMark.mark-a');
  const markB = layer.querySelector('.freedomWallVandalMark.mark-b');
  const markC = layer.querySelector('.freedomWallVandalMark.mark-c');
  const safe = String(theme || '').trim().toLowerCase();
  const map = {
    'comic': ['WOW!','SFK!','#BEKIND','SFK','★'],
    'comic-noir': ['CASE FILE','ISSUE 01','NOIR','INK',''],
    'comic-manga': ['KIRA!','SPEED','MANGA','DOKI!',''],
    'comic-strip': ['PANEL 01','NEXT','STRIP','SFK',''],
    'spiderman': ['THWIP!','WEB','SPIDEY','SFK',''],
    'filipino': ['MABUHAY!','KAPWA!','BAYANIHAN','#BEKIND','★'],
    'cutout-pop': ['SNIP!','CLIP!','CUTOUT','POP!','★']
  };
  const values = map[safe] || ['WOW!','SFK!','#BEKIND','SFK','★'];
  if (burstA) burstA.textContent = values[0];
  if (burstB) burstB.textContent = values[1];
  if (markA) markA.textContent = values[2];
  if (markB) markB.textContent = values[3];
  if (markC) markC.textContent = values[4];
}
let freedomWallPosting = false;
let freedomWallSelectedColor = "yellow";
let freedomWallSelectedTextColor = "charcoal";
let freedomWallSelectedFont = "theme-default";
let freedomWallPendingMedia = null;
let freedomWallPendingYouTubeUrl = "";
let freedomWallPendingYouTube = null;
let freedomWallPendingGif = null;
let freedomWallPendingSpotify = null;
let freedomWallMediaSearchBusy = "";
let freedomWallSelectedAttachmentMode = "none";
let freedomWallSpotifySearchBusy = false;
let freedomWallActiveSpotifyPlayback = null;
let freedomWallMediaPrepareToken = 0;
let freedomWallLastRenderedCount = 0;
let freedomWallNotesCache = [];
// v483: fingerprint the last painted wall so Firestore/cache callbacks that
// contain the same notes do not repaint the entire phone viewport.
let freedomWallLastRenderSignature = "";
let freedomWallLiveRetryTimer = 0;
// v460: temporary local drag positions. Never saved to Firestore, so a page
// refresh/reopen restores the normal smart Freedom Wall arrangement.
const freedomWallLocalDragPositions = new Map();
let freedomWallDragState = null;
let freedomWallDragPending = null;
let freedomWallDragLongPressTimer = 0;
let freedomWallDragMoveFrame = 0;
let freedomWallDragFrontZ = 350;
let freedomWallReactionMenuTarget = null;
let freedomWallReactionWriting = false;
let freedomWallPromptReactionUnsubscribe = null;
let freedomWallPromptReactionDocId = "";
let freedomWallPromptReactionConnecting = false;
let freedomWallPromptReactionListenToken = 0;
let freedomWallPromptReactionsCache = {};
let freedomWallPromptReactionLastType = "";
let freedomWallPromptReactionPending = null;
let freedomWallPromptReactionTimer = 0;
let freedomWallReplyThreadNoteId = "";
let freedomWallReplyThreadUnsubscribe = null;
let freedomWallReplyThreadListenToken = 0;
let freedomWallReplyThreadCache = [];
let freedomWallReplyParentId = "";
let freedomWallReplyParentName = "";
let freedomWallReplyPosting = false;
let freedomWallReplyHoldTimer = 0;
let freedomWallReplyHoldPending = null;
// v536: one-note-at-a-time Read Notes mode. Viewer-only; it never writes
// positions or reply contents and is intentionally absent from exports.
let freedomWallReaderIndex = 0;
let freedomWallReaderNoteId = "";
let freedomWallReaderPaused = false;
let freedomWallReaderElapsedMs = 0;
let freedomWallReaderLastTick = 0;
let freedomWallReaderRaf = 0;
let freedomWallReaderPointer = null;
let freedomWallReaderHoldTimer = 0;
let freedomWallReaderHoveringNote = false;
let freedomWallReaderFitRaf = 0;
let freedomWallReaderFitTimers = [];


function getFreedomWallExactExportOptions() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const enabled = params.get("fwExactExport") === "1";
    const rawLayout = String(params.get("fwLayout") || "current").trim().toLowerCase();
    const layout = ["current", "readable", "fit"].includes(rawLayout) ? rawLayout : "current";
    return { enabled, layout };
  } catch (error) {
    return { enabled:false, layout:"current" };
  }
}

const freedomWallExactExportOptions = getFreedomWallExactExportOptions();

function isFreedomWallExactExportMode() {
  return Boolean(freedomWallExactExportOptions.enabled);
}

function prepareFreedomWallExactExportDocument() {
  if (!isFreedomWallExactExportMode()) return;
  document.documentElement.classList.add("sfkFreedomWallExactExport");
  document.body?.classList?.add("sfkFreedomWallExactExport");
  const intro = document.getElementById("sfkIntroOverlay");
  if (intro) {
    intro.hidden = true;
    intro.style.setProperty("display", "none", "important");
    try { intro.remove(); } catch (error) {}
  }
}

function applyFreedomWallExactExportMode() {
  if (!isFreedomWallExactExportMode()) return;
  prepareFreedomWallExactExportDocument();
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  layer.classList.add("is-freedom-wall-exact-export");
  layer.classList.remove("is-freedom-wall-exact-current", "is-freedom-wall-exact-readable", "is-freedom-wall-exact-fit");
  layer.classList.add(`is-freedom-wall-exact-${freedomWallExactExportOptions.layout}`);
  layer.dataset.exactExportLayout = freedomWallExactExportOptions.layout;
  setHomepageEffectRealCloseVisible(false);
  closeFreedomWallComposer();
  closeFreedomWallMediaSearchModal();
  closeFreedomWallReactionMenu();
  stopHomepageEffectMusic();
  stopHomepageAlertSound();

  const scene = layer.querySelector(".homepageFreedomWallScene");
  const stage = layer.querySelector("#freedomWallNotesStage");
  if (!scene || !stage) return;
  const cards = Array.from(layer.querySelectorAll(".freedomWallNote[data-note-id]"));
  const layout = freedomWallExactExportOptions.layout;
  if (layout === "fit") {
    const count = Math.max(1, cards.length);
    const portrait = window.innerHeight > window.innerWidth;
    const columns = portrait ? Math.max(3, Math.min(6, Math.ceil(Math.sqrt(count * .66)))) : Math.max(4, Math.min(9, Math.ceil(Math.sqrt(count * 1.45))));
    const rows = Math.ceil(count / columns);
    stage.style.setProperty("--fw-exact-columns", String(columns));
    stage.style.setProperty("--fw-exact-rows", String(rows));
    const density = Math.max(.48, Math.min(1, 8 / Math.max(columns, rows)));
    stage.style.setProperty("--fw-exact-density", String(density));
  } else if (layout === "readable") {
    const portrait = window.innerHeight > window.innerWidth;
    const columns = portrait ? 2 : (window.innerWidth >= 1400 ? 4 : 3);
    stage.style.setProperty("--fw-exact-columns", String(columns));
    stage.style.setProperty("--fw-exact-density", "1");
  }
  window.requestAnimationFrame(() => {
    document.documentElement.dataset.fwExactReady = "true";
    window.parent?.postMessage?.({ type:"SFK_FREEDOM_WALL_EXACT_READY", layout }, window.location.origin === "null" ? "*" : window.location.origin);
  });
}

if (isFreedomWallExactExportMode()) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", prepareFreedomWallExactExportDocument, { once:true });
  else prepareFreedomWallExactExportDocument();
}

function isHomepageEffectStartupBlocked() {
  if (isFreedomWallExactExportMode()) return false;
  const intro = document.getElementById("sfkIntroOverlay");
  if (!intro || intro.hidden) return false;
  try {
    const style = window.getComputedStyle(intro);
    if (style.display === "none" || style.visibility === "hidden") return false;
  } catch (error) {}
  // Keep effects completely hidden until the loading overlay has actually
  // left the DOM, including its short fade-out after Skip/auto-finish.
  return Boolean(intro.isConnected);
}

function scheduleHomepageEffectStartupFlush() {
  if (homepageEffectStartupWaitTimer) return;
  homepageEffectStartupWaitTimer = window.setTimeout(() => {
    homepageEffectStartupWaitTimer = 0;
    if (isHomepageEffectStartupBlocked()) {
      scheduleHomepageEffectStartupFlush();
      return;
    }
    const pending = homepageEffectPendingSettings;
    homepageEffectPendingSettings = null;
    if (pending) applyHomepageEffectSettings(pending);
  }, 120);
}

function initHomepageEffectSystem() {
  ensureHomepageEffectLayer();
  primeHomepageAlertAudioOnInteraction();
  primeHomepageEffectMusicOnInteraction();
  startHomepageEffectRealtimeListener();
  window.addEventListener("beforeunload", () => {
    try { homepageEffectUnsubscribe?.(); } catch (error) {}
    homepageEffectUnsubscribe = null;
  }, { once: true });
}

function startHomepageEffectRealtimeListener() {
  if (homepageEffectUnsubscribe) return;
  const db = window.SFK_CLASSBOARD_FIREBASE_DB;
  if (!db) {
    homepageEffectListenAttempts += 1;
    if (homepageEffectListenAttempts <= 30) {
      window.setTimeout(startHomepageEffectRealtimeListener, Math.min(2000, 120 + homepageEffectListenAttempts * 80));
    }
    return;
  }

  try {
    homepageEffectUnsubscribe = db.collection("settings").onSnapshot((snapshot) => {
      const settings = {};
      snapshot.forEach((doc) => {
        const data = doc.data() || {};
        const key = String(data.Key || doc.id || "");
        if (!HOMEPAGE_EFFECT_KEYS.has(key)) return;
        settings[key] = data.Value ?? "";
      });
      applyHomepageEffectSettings(settings);
    }, (error) => {
      console.warn("Homepage effect real-time listener unavailable; dashboard refresh remains active.", error);
      try { homepageEffectUnsubscribe?.(); } catch (unsubscribeError) {}
      homepageEffectUnsubscribe = null;
    });
  } catch (error) {
    console.warn("Homepage effect listener setup failed:", error);
  }
}

function normalizeHomepageEffectImageList(value, fallback = "") {
  const normalizeItem = (item) => {
    const raw = String(item || "").trim();
    if (!raw) return "";
    if (raw.startsWith("sfk-media://")) return raw.slice(0, 360);
    if (/^https:\/\//i.test(raw) || /^data:image\//i.test(raw) || /^blob:/i.test(raw)) return raw.slice(0, 1200);
    return "";
  };

  let list = [];
  const raw = String(value || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch (error) {
      list = raw.split(/\r?\n/g);
    }
  }
  if (fallback) list.push(fallback);

  const seen = new Set();
  const result = [];
  list.forEach((item) => {
    const safe = normalizeItem(item);
    if (!safe || seen.has(safe) || result.length >= 12) return;
    seen.add(safe);
    result.push(safe);
  });
  return result;
}

function normalizeFreedomWallSessionId(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === FREEDOM_WALL_LEGACY_SESSION_ID) return FREEDOM_WALL_LEGACY_SESSION_ID;
  if (/^wall_[A-Za-z0-9_-]{6,80}$/.test(raw)) return raw;
  return FREEDOM_WALL_LEGACY_SESSION_ID;
}

function getFreedomWallActiveSessionId(config = freedomWallConfig) {
  return normalizeFreedomWallSessionId(config?.freedomWallActiveWallId || FREEDOM_WALL_LEGACY_SESSION_ID);
}

function normalizeFreedomWallPlaylist(value, fallbackUrl = "") {
  let list = [];
  const raw = String(value || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch (error) {
      list = raw.split(/\r?\n/g);
    }
  }
  if (!list.length && fallbackUrl) list = [{ url: fallbackUrl }];

  const result = [];
  const seen = new Set();
  list.forEach((item) => {
    if (result.length >= 50) return;
    const source = typeof item === "string" ? { url:item } : (item || {});
    const url = String(source.url || source.URL || "").trim().slice(0,1200);
    if (!/^https:\/\//i.test(url) || seen.has(url)) return;
    seen.add(url);
    result.push({
      title: String(source.title || source.Title || "").trim().slice(0,80),
      url
    });
  });
  return result;
}

function normalizeHomepageEffectConfig(settings = {}) {
  const allowedModes = new Set([
    "normal", "drizzle", "heavy-rain", "thunderstorm", "flood-rain", "multiverse", "picture", "youtube", "rickroll", "alert",
    "spider-glitch", "comic-web", "black-symbiote", "portal-rift",
    "fog", "snow", "confetti", "hearts", "koala-family", "stars", "matrix", "bubbles", "fireflies", "minions", "spongebob", "naruto", "akatsuki", "ninja-night", "neon-pulse",
    "aurora", "galaxy", "solar-system", "pet-dog", "pet-koala", "buwan-wika", "meteors", "laser-grid", "crt", "pixel-storm", "prism", "petals", "gold-sparkle",
    "sunrise", "underwater", "notebook", "hyperspace", "window-weather", "fiesta", "book-world", "magic-blackboard", "moonlit-garden", "cloud-kingdom", "countdown", "pixel-game", "cyber-classroom", "heritage-journey", "freedom-wall"
  ]);
  const rawMode = String(settings.HomepageEffectMode || "normal").trim().toLowerCase();
  const mode = allowedModes.has(rawMode) ? rawMode : "normal";
  const enabled = String(settings.HomepageEffectEnabled || "").trim().toUpperCase() === "YES" && mode !== "normal";
  const title = String(settings.HomepageEffectTitle || "").trim().slice(0, 100);
  const message = String(settings.HomepageEffectMessage || "").trim().slice(0, 700);
  const image = String(settings.HomepageEffectImage || "").trim();
  const images = normalizeHomepageEffectImageList(settings.HomepageEffectImages, image);
  const dismissible = String(settings.HomepageEffectDismissible || "YES").trim().toUpperCase() !== "NO";
  const alertSound = String(settings.HomepageEffectAlertSound || "YES").trim().toUpperCase() !== "NO";
  const spiderSound = String(settings.HomepageEffectSpiderSound || "YES").trim().toUpperCase() !== "NO";
  const hasNewAudioEnabled = Object.prototype.hasOwnProperty.call(settings || {}, "HomepageEffectAudioEnabled");
  const defaultAudioUrl = HOMEPAGE_EFFECT_DEFAULT_AUDIO_URLS[mode] || "";
  const rawAudioUrl = String(settings.HomepageEffectAudioUrl || "").trim();
  const savedAudioUrl = /^https:\/\//i.test(rawAudioUrl) ? rawAudioUrl.slice(0, 1200) : "";
  const legacySpiderMode = ["spider-glitch", "comic-web", "black-symbiote"].includes(mode);
  const audioEnabled = hasNewAudioEnabled
    ? String(settings.HomepageEffectAudioEnabled || "NO").trim().toUpperCase() === "YES"
    : (legacySpiderMode && spiderSound);
  const audioUrl = savedAudioUrl || ((legacySpiderMode && audioEnabled) ? defaultAudioUrl : "");
  const audioLoop = String(settings.HomepageEffectAudioLoop || "YES").trim().toUpperCase() !== "NO";
  const youtubeUrl = normalizeHomepageEffectYouTubeUrl(settings.HomepageEffectYouTubeUrl);
  const youtubeMuted = String(settings.HomepageEffectYouTubeMuted || "YES").trim().toUpperCase() !== "NO";
  const rickrollUrl = normalizeHomepageEffectRickrollUrl(settings.HomepageEffectRickrollUrl) || HOMEPAGE_RICKROLL_DEFAULT_URL;
  const updatedAt = String(settings.HomepageEffectUpdatedAt || "").trim();
  const rawFreedomWallTheme = String(settings.FreedomWallTheme || "sticky-notes").trim().toLowerCase();
  const freedomWallTheme = FREEDOM_WALL_THEME_SET.has(rawFreedomWallTheme) ? rawFreedomWallTheme : "sticky-notes";
  const freedomWallAllowPosting = String(settings.FreedomWallAllowPosting || "YES").trim().toUpperCase() !== "NO";
  const freedomWallShowNames = String(settings.FreedomWallShowNames || "YES").trim().toUpperCase() !== "NO";
  const freedomWallAllowTextColor = String(settings.FreedomWallAllowTextColor || "YES").trim().toUpperCase() !== "NO";
  const freedomWallAllowFont = String(settings.FreedomWallAllowFont || "YES").trim().toUpperCase() !== "NO";
  const freedomWallAllowGif = String(settings.FreedomWallAllowGif || "NO").trim().toUpperCase() === "YES";
  const freedomWallAllowGifSearch = String(settings.FreedomWallAllowGifSearch || "NO").trim().toUpperCase() === "YES";
  const freedomWallAllowYouTube = String(settings.FreedomWallAllowYouTube || "NO").trim().toUpperCase() === "YES";
  const freedomWallAllowYouTubeSearch = String(settings.FreedomWallAllowYouTubeSearch || "NO").trim().toUpperCase() === "YES";
  const freedomWallYouTubePlaybackMode = normalizeFreedomWallYouTubePlaybackMode(settings.FreedomWallYouTubePlaybackMode || "viewer");
  const freedomWallMediaSearchUrl = String(settings.FreedomWallMediaSearchUrl || "").trim().slice(0, 1200);
  const freedomWallGiphyApiKey = String(settings.FreedomWallGiphyApiKey || "").trim().slice(0, 240);
  const hasFreedomWallPlaylistSetting = Object.prototype.hasOwnProperty.call(settings || {}, "FreedomWallPlaylistEnabled");
  const freedomWallPlaylist = normalizeFreedomWallPlaylist(settings.FreedomWallPlaylist, mode === "freedom-wall" ? audioUrl : "");
  const freedomWallPlaylistEnabled = mode === "freedom-wall" && freedomWallPlaylist.length > 0 && (hasFreedomWallPlaylistSetting
    ? String(settings.FreedomWallPlaylistEnabled || "NO").trim().toUpperCase() === "YES"
    : audioEnabled);
  const freedomWallPlaylistShuffle = String(settings.FreedomWallPlaylistShuffle || "NO").trim().toUpperCase() === "YES";
  const freedomWallPlaylistLoop = String(settings.FreedomWallPlaylistLoop || "YES").trim().toUpperCase() !== "NO";
  const freedomWallActiveWallId = normalizeFreedomWallSessionId(settings.FreedomWallActiveWallID || FREEDOM_WALL_LEGACY_SESSION_ID);
  const playlistSignature = freedomWallPlaylist.map((track) => `${track.title}~${track.url}`).join("~~");
  const signature = updatedAt || [enabled ? "1" : "0", mode, title, message, images.join("~"), dismissible ? "1" : "0", alertSound ? "1" : "0", audioEnabled ? "1" : "0", audioUrl, audioLoop ? "1" : "0", youtubeUrl, youtubeMuted ? "1" : "0", rickrollUrl, freedomWallTheme, freedomWallAllowPosting ? "1" : "0", freedomWallShowNames ? "1" : "0", freedomWallAllowTextColor ? "1" : "0", freedomWallAllowFont ? "1" : "0", freedomWallAllowGif ? "1" : "0", freedomWallAllowGifSearch ? "1" : "0", freedomWallAllowYouTube ? "1" : "0", freedomWallAllowYouTubeSearch ? "1" : "0", freedomWallYouTubePlaybackMode, freedomWallMediaSearchUrl, freedomWallGiphyApiKey ? "giphy-key" : "", freedomWallPlaylistEnabled ? "1" : "0", freedomWallPlaylistShuffle ? "1" : "0", freedomWallPlaylistLoop ? "1" : "0", playlistSignature, freedomWallActiveWallId].join("|");
  return { enabled, mode, title, message, image: images[0] || "", images, dismissible, alertSound, spiderSound, audioEnabled, audioUrl, audioLoop, youtubeUrl, youtubeMuted, rickrollUrl, updatedAt, signature, freedomWallTheme, freedomWallAllowPosting, freedomWallShowNames, freedomWallAllowTextColor, freedomWallAllowFont, freedomWallAllowGif, freedomWallAllowGifSearch, freedomWallAllowYouTube, freedomWallAllowYouTubeSearch, freedomWallYouTubePlaybackMode, freedomWallMediaSearchUrl, freedomWallGiphyApiKey, freedomWallPlaylistEnabled, freedomWallPlaylist, freedomWallPlaylistShuffle, freedomWallPlaylistLoop, freedomWallActiveWallId };
}

function normalizeHomepageEffectYouTubeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || !/^https:\/\//i.test(raw)) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live"].includes(parts[0])) id = parts[1] || "";
      }
    }
    id = String(id || "").trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return "";
    return `https://www.youtube.com/watch?v=${id}`;
  } catch (error) { return ""; }
}

function getHomepageEffectYouTubeVideoId(value) {
  const normalized = normalizeHomepageEffectYouTubeUrl(value);
  if (!normalized) return "";
  try { return new URL(normalized).searchParams.get("v") || ""; } catch (error) { return ""; }
}

function getFreedomWallYouTubeVideoId(value) {
  return getHomepageEffectYouTubeVideoId(value);
}

function normalizeFreedomWallYouTubeUrl(value) {
  return normalizeHomepageEffectYouTubeUrl(value);
}

function normalizeFreedomWallYouTubePlaybackMode(value) {
  const mode = String(value || "viewer").trim().toLowerCase();
  return mode === "inline" ? "inline" : "viewer";
}

// v503: media search is an optional enhancement. Keep its endpoint lookup
// self-contained so a missing/invalid URL can NEVER stop the Freedom Wall
// prompt and live-note renderer from starting. v501 referenced this helper
// without defining it, which caused the blank-wall runtime failure.
const FREEDOM_WALL_YOUTUBE_SEARCH_FALLBACK_URL = "https://script.google.com/macros/s/AKfycbxntR5jJpDeKPOK7lJ7iLwEXQCNy1_rQF3Zg-KDJ1mwP8QAMKnz0eIiSMXP__PSgfpFsA/exec";

function normalizeFreedomWallMediaSearchUrl(value) {
  const raw = String(value || "").trim().slice(0, 1200);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function getFreedomWallMediaSearchEndpoint() {
  // v508: use the Admin-configured endpoint when valid, but fall back to the
  // deployment that was directly verified to return YouTube results. This
  // repairs stale/old saved proxy URLs without affecting GIPHY (client-side).
  return normalizeFreedomWallMediaSearchUrl(freedomWallConfig?.freedomWallMediaSearchUrl || "")
    || normalizeFreedomWallMediaSearchUrl(FREEDOM_WALL_YOUTUBE_SEARCH_FALLBACK_URL);
}

function getFreedomWallYouTubeSearchEndpoints() {
  const configured = normalizeFreedomWallMediaSearchUrl(freedomWallConfig?.freedomWallMediaSearchUrl || "");
  const fallback = normalizeFreedomWallMediaSearchUrl(FREEDOM_WALL_YOUTUBE_SEARCH_FALLBACK_URL);
  return [configured, fallback].filter((value, index, list) => value && list.indexOf(value) === index);
}

function getFreedomWallGiphyApiKey() {
  return String(freedomWallConfig?.freedomWallGiphyApiKey || "").trim().slice(0, 240);
}

function normalizeFreedomWallSpotifySearchUrl(value) {
  const raw = String(value || "").trim().slice(0, 1200);
  return /^https:\/\//i.test(raw) ? raw : "";
}

function normalizeFreedomWallSpotifyTrackUrl(value) {
  const raw = String(value || "").trim();
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host !== "open.spotify.com") return "";
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "track" || !parts[1]) return "";
    return `https://open.spotify.com/track/${encodeURIComponent(parts[1])}`;
  } catch (error) { return ""; }
}

function normalizeFreedomWallSpotifyItem(value = {}) {
  if (!value || typeof value !== "object") return null;
  const url = normalizeFreedomWallSpotifyTrackUrl(value.url || value.SpotifyUrl || value.externalUrl || "");
  const uri = String(value.uri || value.SpotifyUri || "").trim().slice(0, 160);
  const title = String(value.title || value.name || value.SpotifyTitle || "Spotify Track").trim().slice(0, 120) || "Spotify Track";
  const artist = String(value.artist || value.artists || value.SpotifyArtist || "").trim().slice(0, 160);
  const image = String(value.image || value.thumbnail || value.SpotifyImage || "").trim().slice(0, 1200);
  if (!url) return null;
  return { url, uri, title, artist, image };
}


function normalizeFreedomWallYouTubeItem(value = {}) {
  const rawUrl = String(value.url || value.YouTubeUrl || value.videoUrl || "").trim();
  const url = normalizeFreedomWallYouTubeUrl(rawUrl || (value.videoId ? `https://www.youtube.com/watch?v=${value.videoId}` : ""));
  const videoId = getFreedomWallYouTubeVideoId(url);
  if (!url || !videoId) return null;
  const title = String(value.title || value.name || value.YouTubeTitle || "YouTube Video").trim().slice(0, 140) || "YouTube Video";
  const channel = String(value.channel || value.channelTitle || value.YouTubeChannel || "YouTube").trim().slice(0, 120);
  const thumbnail = String(value.thumbnail || value.image || value.YouTubeThumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`).trim().slice(0, 1200);
  return { url, videoId, title, channel, thumbnail };
}

function normalizeFreedomWallGifItem(value = {}) {
  const url = String(value.url || value.gifUrl || value.GifUrl || "").trim().slice(0, 1200);
  const previewUrl = String(value.previewUrl || value.preview || value.thumbnail || value.GifPreviewUrl || url).trim().slice(0, 1200);
  if (!/^https:\/\//i.test(url)) return null;
  const title = String(value.title || value.name || value.GifTitle || "GIF").trim().slice(0, 120) || "GIF";
  return { url, previewUrl: /^https:\/\//i.test(previewUrl) ? previewUrl : url, title };
}

function getFreedomWallSpotifyEmbedUrl(value) {
  const url = normalizeFreedomWallSpotifyTrackUrl(value);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const id = parsed.pathname.split("/").filter(Boolean)[1];
    return id ? `https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=generator` : "";
  } catch (error) { return ""; }
}

function freedomWallJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `sfkMediaSearch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const script = document.createElement("script");
    let finished = false;
    const cleanup = () => {
      try { delete window[callbackName]; } catch (error) { window[callbackName] = undefined; }
      try { script.remove(); } catch (error) {}
    };
    window[callbackName] = (data) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(data || {});
    };
    const finalUrl = new URL(url);
    finalUrl.searchParams.set("callback", callbackName);
    script.src = finalUrl.toString();
    script.async = true;
    script.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error("Media search service could not be reached."));
    };
    document.head.appendChild(script);
    window.setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error("Media search timed out."));
    }, 12000);
  });
}

async function fetchFreedomWallSpotifyResults(query) {
  const endpoint = getFreedomWallMediaSearchEndpoint() || normalizeFreedomWallSpotifySearchUrl(freedomWallConfig?.freedomWallSpotifySearchUrl || "");
  const q = String(query || "").trim().slice(0, 80);
  if (!endpoint) throw new Error("Spotify search is not configured yet.");
  if (!q) return [];
  const url = new URL(endpoint);
  url.searchParams.set("action", "search");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  let data;
  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    data = await response.json();
  } catch (error) {
    data = await freedomWallJsonp(url.toString());
  }
  if (!data || data.ok === false) throw new Error(data?.error || "Spotify search failed.");
  const list = Array.isArray(data.items) ? data.items : (Array.isArray(data.tracks) ? data.tracks : []);
  return list.map(normalizeFreedomWallSpotifyItem).filter(Boolean).slice(0, 8);
}


async function fetchFreedomWallMediaSearchResults(provider, query) {
  const endpoint = getFreedomWallMediaSearchEndpoint();
  const q = String(query || "").trim().slice(0, 80);
  if (!endpoint) throw new Error("Media search is not configured yet.");
  if (!q) return [];
  const url = new URL(endpoint);
  url.searchParams.set("provider", provider);
  url.searchParams.set("action", provider);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("_sfk", Date.now().toString());

  let data;

  // v507: Apps Script ContentService can be inconsistent with cross-origin
  // fetch(), especially from file:// and some GitHub Pages/browser paths.
  // The proxy already supports callback= JSONP, so use that as the PRIMARY
  // path for YouTube. This avoids CORS/redirect behavior while keeping the
  // YouTube API key private inside Apps Script.
  if (String(provider || "").toLowerCase().startsWith("youtube")) {
    try {
      data = await freedomWallJsonp(url.toString());
    } catch (jsonpError) {
      // Network fetch is only a fallback for environments where JSONP/script
      // loading is blocked. Never silently turn a transport failure into [].
      try {
        const response = await fetch(url.toString(), { cache: "no-store", redirect: "follow" });
        if (!response.ok) throw new Error(`YouTube search HTTP ${response.status}.`);
        data = await response.json();
      } catch (fetchError) {
        throw new Error(jsonpError?.message || fetchError?.message || "YouTube search service could not be reached.");
      }
    }
  } else {
    try {
      const response = await fetch(url.toString(), { cache: "no-store", redirect: "follow" });
      if (!response.ok) throw new Error(`Media search HTTP ${response.status}.`);
      data = await response.json();
    } catch (error) {
      data = await freedomWallJsonp(url.toString());
    }
  }

  if (!data || data.ok === false) throw new Error(data?.error || "Media search failed.");
  return Array.isArray(data.items) ? data.items : [];
}

async function fetchFreedomWallYouTubeResults(query) {
  const q = String(query || "").trim().slice(0, 80);
  if (!q) return [];

  const endpoints = getFreedomWallYouTubeSearchEndpoints();
  if (!endpoints.length) throw new Error("YouTube Search is not configured yet.");

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("provider", "youtube");
      url.searchParams.set("action", "youtube");
      url.searchParams.set("q", q);
      url.searchParams.set("limit", "10");
      url.searchParams.set("debug", "1");
      url.searchParams.set("_sfk", Date.now().toString());

      let data;
      try {
        data = await freedomWallJsonp(url.toString());
      } catch (jsonpError) {
        const response = await fetch(url.toString(), { cache: "no-store", redirect: "follow" });
        if (!response.ok) throw new Error(`YouTube search HTTP ${response.status}.`);
        data = await response.json();
      }

      if (!data || data.ok === false) throw new Error(data?.error || "YouTube search failed.");
      const raw = Array.isArray(data.items) ? data.items : [];
      const normalized = raw.map(normalizeFreedomWallYouTubeItem).filter(Boolean).slice(0, 10);
      if (normalized.length) return normalized;

      // A stale proxy can respond successfully but return an empty list.
      // In that case continue to the next known endpoint instead of showing
      // a false "No YouTube videos found" result immediately.
      lastError = new Error(`YouTube proxy returned 0 results${data?.debug?.receivedQuery ? ` for "${data.debug.receivedQuery}"` : ""}.`);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

async function fetchFreedomWallGifResults(query) {
  const key = getFreedomWallGiphyApiKey();
  const q = String(query || "").trim().slice(0, 50);
  if (!key) throw new Error("GIPHY Search is not configured yet.");
  if (!q) return [];

  // GIPHY requires Search API requests to be made directly from the client.
  // Do not route this request through the Apps Script YouTube proxy.
  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "18");
  url.searchParams.set("rating", "pg");

  const response = await fetch(url.toString(), { cache: "no-store" });
  let data = {};
  try { data = await response.json(); } catch (error) {}
  if (!response.ok) {
    const message = String(data?.meta?.msg || data?.meta?.message || `GIPHY search failed (${response.status}).`);
    throw new Error(message);
  }

  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((item) => {
    const images = item?.images || {};
    const gif = images.downsized_medium || images.downsized || images.fixed_height || images.original || {};
    const preview = images.fixed_width_small || images.fixed_height_small || images.preview_gif || gif || {};
    return normalizeFreedomWallGifItem({
      title: item?.title || "GIF",
      url: String(gif?.url || preview?.url || ""),
      previewUrl: String(preview?.url || gif?.url || "")
    });
  }).filter(Boolean).slice(0, 18);
}

function renderHomepageEffectYouTube(config) {
  const layer = ensureHomepageEffectLayer();
  const iframe = layer.querySelector("#homepageEffectYouTubeFrame");
  const empty = layer.querySelector("#homepageEffectYouTubeEmpty");
  if (!iframe) return;

  const videoId = getHomepageEffectYouTubeVideoId(config.youtubeUrl);
  if (!videoId) {
    // Only tear the player down when there truly is no valid video. Do not
    // churn the iframe during normal dashboard refreshes.
    if (homepageEffectYouTubePlayerKey) {
      iframe.removeAttribute("src");
      homepageEffectYouTubePlayerKey = "";
    }
    iframe.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  const muted = config.youtubeMuted !== false;
  const playerKey = `${videoId}|${muted ? "muted" : "sound"}`;

  // Critical: the dashboard refreshes its data repeatedly. Reassigning even
  // the exact same iframe.src makes YouTube start over (and may show a new ad).
  // Keep the existing player alive unless the actual video or mute setting
  // changed in Admin.
  if (homepageEffectYouTubePlayerKey === playerKey && iframe.getAttribute("src")) {
    iframe.hidden = false;
    if (empty) empty.hidden = true;
    return;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "1",
    rel: "0",
    playsinline: "1",
    modestbranding: "1"
  });

  homepageEffectYouTubePlayerKey = playerKey;
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  iframe.hidden = false;
  if (empty) empty.hidden = true;
}

function clearHomepageEffectYouTube() {
  const layer = document.getElementById("homepageEffectLayer");
  const iframe = layer?.querySelector("#homepageEffectYouTubeFrame");
  if (iframe && (homepageEffectYouTubePlayerKey || iframe.getAttribute("src"))) {
    iframe.removeAttribute("src");
    iframe.hidden = true;
  }
  homepageEffectYouTubePlayerKey = "";
}

function normalizeHomepageEffectRickrollUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || !/^https:\/\//i.test(raw)) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "streamable.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = (["e", "s"].includes(parts[0]) ? parts[1] : parts[0]) || "";
      if (!/^[A-Za-z0-9_-]{4,20}$/.test(id)) return "";
      return `https://streamable.com/${id}`;
    }
    if (/\.(mp4|webm)(?:$|[?#])/i.test(raw)) return raw.slice(0, 1200);
    return "";
  } catch (error) {
    return "";
  }
}

function getHomepageRickrollSource(value) {
  const safe = normalizeHomepageEffectRickrollUrl(value) || HOMEPAGE_RICKROLL_DEFAULT_URL;
  try {
    const url = new URL(safe);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "streamable.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = (["e", "s"].includes(parts[0]) ? parts[1] : parts[0]) || "";
      return { type: "streamable", key: `streamable:${id}`, src: `https://streamable.com/e/${id}?autoplay=1` };
    }
    return { type: "direct", key: `direct:${safe}`, src: safe };
  } catch (error) {
    return { type: "streamable", key: "streamable:33rhw4", src: "https://streamable.com/e/33rhw4?autoplay=1" };
  }
}

function setHomepageEffectRealCloseVisible(visible) {
  const layer = document.getElementById("homepageEffectLayer");
  const close = layer?.querySelector("#homepageEffectClose");
  if (!close) return;
  const show = Boolean(visible && homepageEffectDismissAllowed);
  close.hidden = !show;
  close.disabled = !show;
  close.setAttribute("aria-hidden", show ? "false" : "true");
  close.tabIndex = show ? 0 : -1;
  close.style.setProperty("display", show ? "grid" : "none", "important");
  close.style.setProperty("pointer-events", show ? "auto" : "none", "important");
}

function clearHomepageRickroll() {
  const layer = document.getElementById("homepageEffectLayer");
  const frame = layer?.querySelector("#homepageRickrollFrame");
  const video = layer?.querySelector("#homepageRickrollVideo");
  const player = layer?.querySelector("#homepageRickrollPlayer");
  const bait = layer?.querySelector("#homepageRickrollBait");
  if (frame && frame.getAttribute("src")) frame.removeAttribute("src");
  if (frame) frame.hidden = true;
  if (video) {
    try { video.pause(); } catch (error) {}
    video.removeAttribute("src");
    try { video.load(); } catch (error) {}
    video.hidden = true;
  }
  if (player) player.hidden = true;
  if (bait) bait.hidden = false;
  layer?.classList.remove("is-rickroll-revealed");
  homepageRickrollPlayerKey = "";
  homepageRickrollSignature = "";
  homepageRickrollRevealed = false;
}

function renderHomepageRickroll(config) {
  const layer = ensureHomepageEffectLayer();
  const bait = layer.querySelector("#homepageRickrollBait");
  const player = layer.querySelector("#homepageRickrollPlayer");
  const frame = layer.querySelector("#homepageRickrollFrame");
  const video = layer.querySelector("#homepageRickrollVideo");
  if (!bait || !player || !frame || !video) return;
  homepageRickrollUrl = config.rickrollUrl || HOMEPAGE_RICKROLL_DEFAULT_URL;

  if (homepageRickrollSignature !== config.signature) {
    if (frame.getAttribute("src")) frame.removeAttribute("src");
    frame.hidden = true;
    try { video.pause(); } catch (error) {}
    video.removeAttribute("src");
    try { video.load(); } catch (error) {}
    video.hidden = true;
    homepageRickrollPlayerKey = "";
    homepageRickrollSignature = config.signature;
    homepageRickrollRevealed = false;
  }

  if (!homepageRickrollRevealed) {
    bait.hidden = false;
    player.hidden = true;
    layer.classList.remove("is-rickroll-revealed");
    // Keep the genuine close control hidden until the prank is triggered.
    setHomepageEffectRealCloseVisible(false);
    return;
  }

  bait.hidden = true;
  player.hidden = false;
  layer.classList.add("is-rickroll-revealed");
  setHomepageEffectRealCloseVisible(homepageEffectDismissAllowed);
}

function revealHomepageRickroll() {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || !layer.classList.contains("is-rickroll")) return;
  const bait = layer.querySelector("#homepageRickrollBait");
  const player = layer.querySelector("#homepageRickrollPlayer");
  const frame = layer.querySelector("#homepageRickrollFrame");
  const video = layer.querySelector("#homepageRickrollVideo");
  if (!player || !frame || !video) return;

  homepageRickrollRevealed = true;
  if (bait) bait.hidden = true;
  player.hidden = false;
  layer.classList.add("is-rickroll-revealed");

  const source = getHomepageRickrollSource(homepageRickrollUrl);
  if (homepageRickrollPlayerKey !== source.key) {
    if (frame.getAttribute("src")) frame.removeAttribute("src");
    frame.hidden = true;
    try { video.pause(); } catch (error) {}
    video.removeAttribute("src");
    try { video.load(); } catch (error) {}
    video.hidden = true;

    if (source.type === "direct") {
      video.hidden = false;
      video.src = source.src;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    } else {
      frame.hidden = false;
      frame.src = source.src;
    }
    homepageRickrollPlayerKey = source.key;
  } else if (source.type === "direct" && video.paused) {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
  }
  setHomepageEffectRealCloseVisible(homepageEffectDismissAllowed);
}

function getHomepageAlertAudioContext() {
  if (homepageAlertAudioContext) return homepageAlertAudioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    homepageAlertAudioContext = new AudioContextClass();
  } catch (error) {
    homepageAlertAudioContext = null;
  }
  return homepageAlertAudioContext;
}

function primeHomepageAlertAudioOnInteraction() {
  if (homepageAlertAudioPrimed) return;
  homepageAlertAudioPrimed = true;
  const prime = async () => {
    document.removeEventListener("pointerdown", prime, true);
    document.removeEventListener("keydown", prime, true);
    const context = getHomepageAlertAudioContext();
    if (!context) return;
    try {
      if (context.state === "suspended") await context.resume();
    } catch (error) {}
    if (homepageAlertSoundActive && context.state === "running" && !homepageAlertSoundTimer) {
      playHomepageAlertSirenCycle();
    }
  };
  document.addEventListener("pointerdown", prime, { capture: true, passive: true });
  document.addEventListener("keydown", prime, { capture: true });
}

function stopHomepageAlertSound() {
  homepageAlertSoundActive = false;
  homepageAlertSoundSignature = "";
  if (homepageAlertSoundTimer) {
    window.clearTimeout(homepageAlertSoundTimer);
    homepageAlertSoundTimer = 0;
  }
  homepageAlertOscillators.forEach((oscillator) => {
    try { oscillator.stop(); } catch (error) {}
  });
  homepageAlertOscillators.clear();
}

function createHomepageAlertTone(context, startAt, duration, startFrequency, endFrequency, gainValue = .04, type = "triangle") {
  const gain = context.createGain();
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(35, startFrequency), startAt);
  if (endFrequency && endFrequency !== startFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, endFrequency), startAt + duration);
  }

  gain.gain.setValueAtTime(.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(.001, gainValue), startAt + Math.min(.08, duration * .18));
  gain.gain.setValueAtTime(Math.max(.001, gainValue * .86), startAt + Math.max(.09, duration * .72));
  gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  homepageAlertOscillators.add(oscillator);
  oscillator.addEventListener("ended", () => homepageAlertOscillators.delete(oscillator), { once: true });
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + .03);
}

function createHomepageAlertDrone(context, startAt, duration) {
  createHomepageAlertTone(context, startAt, duration, 82.41, 78.2, .018, "sine");
  createHomepageAlertTone(context, startAt, duration, 123.47, 116.54, .010, "triangle");
}

async function playHomepageAlertSirenCycle() {
  if (!homepageAlertSoundActive) return;
  const context = getHomepageAlertAudioContext();
  if (!context) return;
  try {
    if (context.state === "suspended") await context.resume();
  } catch (error) {}
  if (!homepageAlertSoundActive || context.state !== "running") return;

  // Original ClassBoard ominous civil-defense alarm: a low drone with broad, slow air-raid-style wails.
  // The mood is intentionally cinematic, but this is not a copy of any film, agency, or broadcast recording.
  const now = context.currentTime + .04;

  // Dark low-frequency bed.
  createHomepageAlertTone(context, now, 6.6, 55.00, 52.00, .016, "sine");
  createHomepageAlertTone(context, now, 6.6, 82.41, 77.78, .012, "triangle");

  // First long rising/falling warning wail with a lightly detuned partner for a distant mechanical feel.
  createHomepageAlertTone(context, now + .10, 2.05, 155.56, 430.00, .043, "sawtooth");
  createHomepageAlertTone(context, now + .10, 2.05, 161.20, 445.00, .015, "triangle");
  createHomepageAlertTone(context, now + 2.02, 1.75, 430.00, 176.00, .044, "sawtooth");
  createHomepageAlertTone(context, now + 2.02, 1.75, 445.00, 182.00, .014, "triangle");

  // Second shorter wail, slightly higher, then a low horn-like tail.
  createHomepageAlertTone(context, now + 3.95, 1.42, 205.00, 515.00, .038, "triangle");
  createHomepageAlertTone(context, now + 5.22, 1.18, 515.00, 205.00, .036, "triangle");
  createHomepageAlertTone(context, now + 5.34, .95, 103.83, 92.50, .018, "sine");

  if (homepageAlertSoundTimer) window.clearTimeout(homepageAlertSoundTimer);
  homepageAlertSoundTimer = window.setTimeout(() => {
    homepageAlertSoundTimer = 0;
    playHomepageAlertSirenCycle();
  }, 8200);
}

function startHomepageAlertSound(signature) {
  const nextSignature = String(signature || "alert");
  if (homepageAlertSoundActive && homepageAlertSoundSignature === nextSignature) return;
  stopHomepageAlertSound();
  homepageAlertSoundActive = true;
  homepageAlertSoundSignature = nextSignature;
  playHomepageAlertSirenCycle();
}

function getHomepageEffectMusicAudio(url, loop = true) {
  const safeUrl = String(url || "").trim();
  if (!/^https:\/\//i.test(safeUrl)) return null;

  if (homepageEffectMusicAudio && homepageEffectMusicUrl === safeUrl) {
    homepageEffectMusicAudio.loop = Boolean(loop);
    return homepageEffectMusicAudio;
  }

  if (homepageEffectMusicAudio) {
    try {
      homepageEffectMusicAudio.removeEventListener("ended", handleHomepageEffectMusicEnded);
      homepageEffectMusicAudio.removeEventListener("error", handleHomepageEffectMusicError);
      homepageEffectMusicAudio.pause();
      homepageEffectMusicAudio.currentTime = 0;
      homepageEffectMusicAudio.removeAttribute("src");
      homepageEffectMusicAudio.load?.();
    } catch (error) {}
    homepageEffectMusicAudio = null;
  }
  try {
    const audio = new Audio(safeUrl);
    audio.loop = Boolean(loop);
    audio.preload = "auto";
    audio.volume = .62;
    audio.playsInline = true;
    audio.addEventListener("ended", handleHomepageEffectMusicEnded);
    audio.addEventListener("error", handleHomepageEffectMusicError);
    audio.addEventListener("playing", () => { homepageEffectMusicPlaylistFailures = 0; });
    homepageEffectMusicAudio = audio;
    homepageEffectMusicUrl = safeUrl;
  } catch (error) {
    homepageEffectMusicAudio = null;
    homepageEffectMusicUrl = "";
  }
  return homepageEffectMusicAudio;
}

async function tryPlayHomepageEffectMusic() {
  if (homepageEffectMusicSuppressedByWallVideo) return;
  if (!homepageEffectMusicWanted || !homepageEffectMusicUrl) return;
  const audio = getHomepageEffectMusicAudio(homepageEffectMusicUrl, homepageEffectMusicLoop);
  if (!audio) return;
  try {
    if (audio.paused) await audio.play();
  } catch (error) {
    // Browsers may require a user gesture before remote audio can autoplay.
  }
}

function primeHomepageEffectMusicOnInteraction() {
  if (homepageEffectMusicPrimed) return;
  homepageEffectMusicPrimed = true;
  const resume = () => {
    if (homepageEffectMusicWanted) tryPlayHomepageEffectMusic();
  };
  document.addEventListener("pointerdown", resume, { capture: true, passive: true });
  document.addEventListener("keydown", resume, { capture: true });
}

function pauseHomepageEffectMusicForFreedomWallVideo() {
  homepageEffectMusicSuppressedByWallVideo = true;
  const audio = homepageEffectMusicAudio;
  if (!audio) return;
  try { audio.pause(); } catch (error) {}
}

function resumeHomepageEffectMusicAfterFreedomWallVideo() {
  homepageEffectMusicSuppressedByWallVideo = false;
  if (homepageEffectMusicWanted && homepageEffectMusicUrl) tryPlayHomepageEffectMusic();
}

function loadFreedomWallYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (freedomWallYoutubeApiPromise) return freedomWallYoutubeApiPromise;
  freedomWallYoutubeApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-freedom-wall-youtube-api="true"]');
    const previousReady = window.onYouTubeIframeAPIReady;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      if (typeof previousReady === "function") { try { previousReady(); } catch (error) {} }
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player API unavailable"));
    };
    window.onYouTubeIframeAPIReady = done;
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.freedomWallYoutubeApi = "true";
      script.onerror = () => { if (!finished) { finished = true; reject(new Error("Unable to load YouTube player API")); } };
      document.head.appendChild(script);
    }
    window.setTimeout(() => { if (window.YT?.Player) done(); }, 900);
    window.setTimeout(() => { if (!finished && !window.YT?.Player) { finished = true; reject(new Error("YouTube player API timed out")); } }, 6000);
  }).catch((error) => { freedomWallYoutubeApiPromise = null; throw error; });
  return freedomWallYoutubeApiPromise;
}

function restoreFreedomWallYoutubePreview(playback, { resumeMusic = true } = {}) {
  if (!playback) return;
  const { media, videoId, player, viewer, card, stage, originalX, originalY } = playback;
  try { player?.destroy?.(); } catch (error) {}
  try { viewer?.remove?.(); } catch (error) {}
  if (card?.isConnected) {
    card.classList.remove('is-inline-video-active');
    if (originalX) card.style.setProperty('--fw-x', originalX); else card.style.removeProperty('--fw-x');
    if (originalY) card.style.setProperty('--fw-y', originalY); else card.style.removeProperty('--fw-y');
  }
  stage?.classList?.remove('has-inline-youtube');
  if (media?.isConnected && videoId) {
    media.replaceChildren();
    media.appendChild(createFreedomWallYoutubePlayButton(media, videoId));
  }
  media?.classList?.remove('is-loading', 'is-unavailable', 'is-youtube-playing');
  if (freedomWallActiveYoutubePlayback === playback) freedomWallActiveYoutubePlayback = null;
  if (resumeMusic) resumeHomepageEffectMusicAfterFreedomWallVideo();
  else homepageEffectMusicSuppressedByWallVideo = false;
}

function closeFreedomWallActiveYoutube({ resumeMusic = true } = {}) {
  const playback = freedomWallActiveYoutubePlayback;
  if (!playback) {
    if (resumeMusic) resumeHomepageEffectMusicAfterFreedomWallVideo();
    else homepageEffectMusicSuppressedByWallVideo = false;
    return;
  }
  restoreFreedomWallYoutubePreview(playback, { resumeMusic });
}

function createFreedomWallYoutubeViewer(videoId) {
  const layer = document.getElementById('homepageEffectLayer');
  if (!layer) return null;
  layer.querySelectorAll('.freedomWallYoutubeViewer').forEach((item) => item.remove());

  const viewer = document.createElement('div');
  viewer.className = 'freedomWallYoutubeViewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Freedom Wall YouTube video');

  const panel = document.createElement('section');
  panel.className = 'freedomWallYoutubeViewerPanel';
  const head = document.createElement('div');
  head.className = 'freedomWallYoutubeViewerHead';
  const title = document.createElement('strong');
  title.textContent = 'YouTube Video';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'freedomWallYoutubeViewerClose';
  close.setAttribute('aria-label', 'Close video and resume background music');
  close.textContent = '×';
  head.append(title, close);

  const stage = document.createElement('div');
  stage.className = 'freedomWallYoutubeViewerStage';
  const slot = document.createElement('div');
  slot.className = 'freedomWallYoutubePlayerSlot';
  slot.id = `fwYoutube_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  stage.appendChild(slot);
  panel.append(head, stage);
  viewer.appendChild(panel);
  layer.appendChild(viewer);

  viewer.addEventListener('pointerdown', (event) => event.stopPropagation());
  viewer.addEventListener('click', (event) => {
    event.stopPropagation();
    if (event.target === viewer && freedomWallActiveYoutubePlayback?.viewer === viewer) {
      closeFreedomWallActiveSpotify({ resumeMusic:true });
    closeFreedomWallActiveYoutube({ resumeMusic:true });
    }
  });
  return { viewer, stage:null, card:null, slot, close, originalX:"", originalY:"" };
}

function clampFreedomWallInlineVideoCard(card, stage) {
  if (!card?.isConnected || !stage?.isConnected) return;
  const stageRect = stage.getBoundingClientRect();
  const width = card.offsetWidth || 320;
  const height = card.offsetHeight || 240;
  const currentX = (parseFloat(card.style.getPropertyValue('--fw-x')) || 50) / 100 * stageRect.width;
  const currentY = (parseFloat(card.style.getPropertyValue('--fw-y')) || 50) / 100 * stageRect.height;
  const margin = 12;
  const minX = Math.min(stageRect.width / 2, width / 2 + margin);
  const maxX = Math.max(stageRect.width / 2, stageRect.width - width / 2 - margin);
  const minY = Math.min(stageRect.height / 2, height / 2 + margin);
  const maxY = Math.max(stageRect.height / 2, stageRect.height - height / 2 - margin);
  const x = Math.max(minX, Math.min(maxX, currentX));
  const y = Math.max(minY, Math.min(maxY, currentY));
  card.style.setProperty('--fw-x', String((x / Math.max(1, stageRect.width) * 100).toFixed(3)));
  card.style.setProperty('--fw-y', String((y / Math.max(1, stageRect.height) * 100).toFixed(3)));
}

function createFreedomWallYoutubeInlinePlayer(media, videoId) {
  const card = media?.closest?.('.freedomWallNote');
  const stage = card?.closest?.('.freedomWallNotesStage, .freedomWallDragOverlay') || document.getElementById('homepageEffectLayer')?.querySelector?.('#freedomWallNotesStage');
  if (!card || !stage) return null;
  const originalX = card.style.getPropertyValue('--fw-x');
  const originalY = card.style.getPropertyValue('--fw-y');
  card.classList.add('is-inline-video-active');
  stage.classList.add('has-inline-youtube');
  media.replaceChildren();
  media.classList.add('is-youtube-playing');

  const slot = document.createElement('div');
  slot.className = 'freedomWallYoutubePlayerSlot';
  slot.id = `fwYoutubeInline_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'freedomWallYoutubeInlineClose';
  close.setAttribute('aria-label', 'Close video and resume background music');
  close.textContent = '×';
  media.append(slot, close);
  window.requestAnimationFrame(() => clampFreedomWallInlineVideoCard(card, stage));
  return { viewer:null, stage, card, slot, close, originalX, originalY };
}

async function mountFreedomWallYoutubePlayer(playback, slot, videoId) {
  try {
    const YT = await loadFreedomWallYouTubeApi();
    if (freedomWallActiveYoutubePlayback !== playback || !slot.isConnected) return;
    playback.player = new YT.Player(slot.id, {
      videoId,
      width:'100%',
      height:'100%',
      playerVars: { autoplay:1, controls:1, rel:0, modestbranding:1, playsinline:1, fs:1 },
      events: {
        onStateChange: (playerEvent) => {
          if (playerEvent?.data === YT.PlayerState.ENDED && freedomWallActiveYoutubePlayback === playback) {
            restoreFreedomWallYoutubePreview(playback, { resumeMusic:true });
          }
        },
        onError: () => {
          if (freedomWallActiveYoutubePlayback === playback) restoreFreedomWallYoutubePreview(playback, { resumeMusic:true });
        }
      }
    });
  } catch (error) {
    if (freedomWallActiveYoutubePlayback !== playback || !slot.isConnected) return;
    const frame = document.createElement('iframe');
    frame.className = 'freedomWallYoutubeFrame';
    frame.title = 'Freedom Wall YouTube video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&fs=1`;
    slot.replaceChildren(frame);
  }
}

function createFreedomWallYoutubePlayButton(media, videoId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'freedomWallYoutubePlayCard';
  button.innerHTML = `<img src="https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg" alt="YouTube video thumbnail" loading="lazy" decoding="async" /><span class="freedomWallYoutubePlayBadge" aria-hidden="true"><span class="freedomWallYoutubePlayTriangle"></span></span>`;
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!media?.isConnected) return;

    if (freedomWallActiveSpotifyPlayback) closeFreedomWallActiveSpotify({ resumeMusic:false });
    if (freedomWallActiveYoutubePlayback) closeFreedomWallActiveYoutube({ resumeMusic:false });
    pauseHomepageEffectMusicForFreedomWallVideo();

    const readerPlayback = Boolean(media.closest?.(".freedomWallReaderNote"));
    const mode = readerPlayback ? "viewer" : normalizeFreedomWallYouTubePlaybackMode(freedomWallConfig?.freedomWallYouTubePlaybackMode);
    const ui = mode === 'inline' ? createFreedomWallYoutubeInlinePlayer(media, videoId) : createFreedomWallYoutubeViewer(videoId);
    if (!ui) {
      resumeHomepageEffectMusicAfterFreedomWallVideo();
      return;
    }
    const { viewer, stage, card, slot, close, originalX, originalY } = ui;
    const playback = { media, videoId, player:null, viewer, stage, card, mode, originalX, originalY };
    freedomWallActiveYoutubePlayback = playback;
    media.classList.add('is-youtube-playing');

    close.addEventListener('click', (closeEvent) => {
      closeEvent.preventDefault();
      closeEvent.stopPropagation();
      restoreFreedomWallYoutubePreview(playback, { resumeMusic:true });
    });
    await mountFreedomWallYoutubePlayer(playback, slot, videoId);
  });
  return button;
}

function buildHomepageEffectPlaylistOrder(length, shuffle = false, avoidFirst = -1) {
  // One complete cycle is always a permutation of every track index exactly once.
  // Shuffle changes only the order; it never randomly picks with replacement.
  const order = Array.from({ length: Math.max(0, Number(length) || 0) }, (_, index) => index);
  if (!shuffle || order.length < 2) return order;
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  if (order.length > 1 && order[0] === avoidFirst) {
    const swapIndex = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
  }
  return order;
}

function playHomepageEffectPlaylistPosition(position, shouldPlay = true) {
  if (!homepageEffectMusicPlaylistActive || !homepageEffectMusicPlaylistTracks.length) return;
  const safePosition = Math.max(0, Math.min(homepageEffectMusicPlaylistOrder.length - 1, Number(position) || 0));
  homepageEffectMusicPlaylistPosition = safePosition;
  const trackIndex = homepageEffectMusicPlaylistOrder[safePosition];
  const track = homepageEffectMusicPlaylistTracks[trackIndex];
  const url = String(track?.url || "").trim();
  if (!/^https:\/\//i.test(url)) {
    advanceHomepageEffectPlaylist("invalid");
    return;
  }
  // Do NOT assign homepageEffectMusicUrl before getHomepageEffectMusicAudio().
  // That URL is also the player's source identity. Assigning it early makes the
  // audio factory believe the next track is already loaded and can replay the
  // previous Audio element forever. The factory updates the global URL only
  // after it has actually created/switched the Audio element.
  homepageEffectMusicLoop = homepageEffectMusicPlaylistTracks.length === 1 && homepageEffectMusicPlaylistLoop;
  const audio = getHomepageEffectMusicAudio(url, homepageEffectMusicLoop);
  if (audio && shouldPlay) tryPlayHomepageEffectMusic();
}

function advanceHomepageEffectPlaylist(reason = "ended") {
  if (!homepageEffectMusicPlaylistActive || !homepageEffectMusicPlaylistTracks.length) return;
  if (reason === "error") homepageEffectMusicPlaylistFailures += 1;
  if (homepageEffectMusicPlaylistFailures >= homepageEffectMusicPlaylistTracks.length) {
    console.warn("Freedom Wall playlist stopped because no playable track was available.");
    stopHomepageEffectMusic();
    return;
  }

  let nextPosition = homepageEffectMusicPlaylistPosition + 1;
  if (nextPosition >= homepageEffectMusicPlaylistOrder.length) {
    if (!homepageEffectMusicPlaylistLoop) {
      homepageEffectMusicWanted = false;
      homepageEffectMusicPlaylistActive = false;
      return;
    }
    const previousTrackIndex = homepageEffectMusicPlaylistOrder[homepageEffectMusicPlaylistPosition] ?? -1;
    homepageEffectMusicPlaylistOrder = buildHomepageEffectPlaylistOrder(
      homepageEffectMusicPlaylistTracks.length,
      homepageEffectMusicPlaylistShuffle,
      previousTrackIndex
    );
    nextPosition = 0;
  }
  playHomepageEffectPlaylistPosition(nextPosition, true);
}

function handleHomepageEffectMusicEnded() {
  if (!homepageEffectMusicPlaylistActive) return;
  advanceHomepageEffectPlaylist("ended");
}

function handleHomepageEffectMusicError() {
  if (!homepageEffectMusicPlaylistActive) return;
  window.setTimeout(() => advanceHomepageEffectPlaylist("error"), 80);
}

function startHomepageEffectPlaylist(tracks, shuffle, loop, signature) {
  const safeTracks = normalizeFreedomWallPlaylist(JSON.stringify(Array.isArray(tracks) ? tracks : []));
  if (!safeTracks.length) {
    stopHomepageEffectMusic();
    return;
  }
  const nextSignature = String(signature || safeTracks.map((track) => track.url).join("|"));
  const samePlaylist = homepageEffectMusicWanted
    && homepageEffectMusicPlaylistActive
    && homepageEffectMusicSignature === nextSignature
    && homepageEffectMusicPlaylistShuffle === Boolean(shuffle)
    && homepageEffectMusicPlaylistLoop === Boolean(loop);
  if (samePlaylist) return;

  stopHomepageEffectMusic();
  homepageEffectMusicWanted = true;
  homepageEffectMusicSignature = nextSignature;
  homepageEffectMusicPlaylistActive = true;
  homepageEffectMusicPlaylistTracks = safeTracks;
  homepageEffectMusicPlaylistShuffle = Boolean(shuffle);
  homepageEffectMusicPlaylistLoop = Boolean(loop);
  homepageEffectMusicPlaylistFailures = 0;
  homepageEffectMusicPlaylistOrder = buildHomepageEffectPlaylistOrder(safeTracks.length, homepageEffectMusicPlaylistShuffle);
  homepageEffectMusicPlaylistPosition = 0;
  playHomepageEffectPlaylistPosition(0, true);
}

function startHomepageEffectMusic(url, loop, signature) {
  const safeUrl = String(url || "").trim();
  if (!/^https:\/\//i.test(safeUrl)) {
    stopHomepageEffectMusic();
    return;
  }

  const nextSignature = String(signature || safeUrl);
  const sameTrack = homepageEffectMusicWanted
    && homepageEffectMusicSignature === nextSignature
    && homepageEffectMusicUrl === safeUrl
    && homepageEffectMusicLoop === Boolean(loop);
  if (sameTrack) return;

  stopHomepageEffectMusic();
  homepageEffectMusicWanted = true;
  homepageEffectMusicSignature = nextSignature;
  homepageEffectMusicUrl = safeUrl;
  homepageEffectMusicLoop = Boolean(loop);
  getHomepageEffectMusicAudio(safeUrl, homepageEffectMusicLoop);
  tryPlayHomepageEffectMusic();
}

function stopHomepageEffectMusic() {
  homepageEffectMusicSuppressedByWallVideo = false;
  homepageEffectMusicWanted = false;
  homepageEffectMusicSignature = "";
  const audio = homepageEffectMusicAudio;
  if (audio) {
    try {
      audio.removeEventListener("ended", handleHomepageEffectMusicEnded);
      audio.removeEventListener("error", handleHomepageEffectMusicError);
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load?.();
    } catch (error) {}
  }
  homepageEffectMusicAudio = null;
  homepageEffectMusicUrl = "";
  homepageEffectMusicLoop = true;
  homepageEffectMusicPlaylistActive = false;
  homepageEffectMusicPlaylistTracks = [];
  homepageEffectMusicPlaylistOrder = [];
  homepageEffectMusicPlaylistPosition = 0;
  homepageEffectMusicPlaylistShuffle = false;
  homepageEffectMusicPlaylistLoop = true;
  homepageEffectMusicPlaylistFailures = 0;
}

function ensureHomepageEffectLayer() {
  let layer = document.getElementById("homepageEffectLayer");
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = "homepageEffectLayer";
  layer.className = "homepageEffectLayer";
  layer.hidden = true;
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <div class="homepageEffectBackdrop" aria-hidden="true"></div>
    <div class="homepageEffectRain" aria-hidden="true"></div>
    <div class="homepageEffectFlood" aria-hidden="true">
      <span class="homepageFloodWave is-back"></span><span class="homepageFloodWave is-front"></span><span class="homepageFloodShine"></span>
      <div class="floodUnderwaterLife">
        <span class="floodFish fish-a"><i class="fishFin"></i></span>
        <span class="floodFish fish-b"><i class="fishFin"></i></span>
        <span class="floodFish fish-c"><i class="fishFin"></i></span>
        <span class="floodFish fish-d"><i class="fishFin"></i></span>
        <span class="floodFish fish-e"><i class="fishFin"></i></span>
        <span class="floodFish fish-f"><i class="fishFin"></i></span>
        <div class="floodSwimmer">
          <span class="swimmerHead"><i class="swimmerHair"></i><i class="swimmerGoggles"></i><i class="swimmerFace"></i></span>
          <span class="swimmerNeck"></span>
          <span class="swimmerBody"><i class="swimmerShirtStripe"></i></span>
          <span class="swimmerShorts"></span>
          <span class="swimmerArm arm-front"><i></i></span><span class="swimmerArm arm-back"><i></i></span>
          <span class="swimmerLeg leg-front"><i></i></span><span class="swimmerLeg leg-back"><i></i></span>
          <span class="swimBubble bubble-a"></span><span class="swimBubble bubble-b"></span><span class="swimBubble bubble-c"></span>
          <span class="floodSafetyBubble">Stay safe, SFK!</span>
        </div>
      </div>
    </div>
    <div class="homepageEffectMist" aria-hidden="true"></div>
    <div class="homepageEffectLightning" aria-hidden="true"></div>
    <div class="homepageEffectMultiverse" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="homepageBlackSpiderScene" aria-hidden="true">
      <span class="homepageSpiderWeb is-top-left"></span>
      <span class="homepageSpiderWeb is-top-right"></span>
      <span class="homepageSpiderWeb is-bottom-left"></span>
      <span class="homepageSpiderWeb is-bottom-right"></span>
      <span class="homepageSpiderThread is-one"></span>
      <span class="homepageSpiderThread is-two"></span>
      <span class="homepageSpiderThread is-three"></span>
      <span class="homepageBlackSpider">
        <svg class="homepageBlackSpiderSvg" viewBox="0 0 360 310" role="presentation" aria-hidden="true">
          <g class="spiderVectorLegs" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
            <path d="M156 101 C126 79 104 58 79 34 C61 17 44 13 25 20 C43 26 54 38 65 53" />
            <path d="M148 119 C111 111 83 99 51 87 C31 80 16 82 7 94 C28 92 44 99 59 111" />
            <path d="M146 144 C108 149 80 160 49 177 C28 189 17 203 15 220 C31 205 47 198 66 196" />
            <path d="M154 169 C123 186 104 205 85 232 C71 252 65 271 69 289 C80 270 94 257 113 247" />
            <path d="M204 101 C234 79 256 58 281 34 C299 17 316 13 335 20 C317 26 306 38 295 53" />
            <path d="M212 119 C249 111 277 99 309 87 C329 80 344 82 353 94 C332 92 316 99 301 111" />
            <path d="M214 144 C252 149 280 160 311 177 C332 189 343 203 345 220 C329 205 313 198 294 196" />
            <path d="M206 169 C237 186 256 205 275 232 C289 252 295 271 291 289 C280 270 266 257 247 247" />
          </g>
          <ellipse class="spiderVectorAbdomen" cx="180" cy="190" rx="54" ry="78" />
          <ellipse class="spiderVectorThorax" cx="180" cy="112" rx="36" ry="34" />
          <path class="spiderVectorNeck" d="M162 136 C169 146 191 146 198 136 C194 151 166 151 162 136 Z" />
          <path class="spiderVectorPedipalp is-left" d="M165 89 C149 76 141 67 143 56 C154 65 160 73 170 84 Z" />
          <path class="spiderVectorPedipalp is-right" d="M195 89 C211 76 219 67 217 56 C206 65 200 73 190 84 Z" />
          <circle class="spiderVectorEye" cx="169" cy="103" r="2.6" />
          <circle class="spiderVectorEye" cx="178" cy="99" r="2.2" />
          <circle class="spiderVectorEye" cx="182" cy="99" r="2.2" />
          <circle class="spiderVectorEye" cx="191" cy="103" r="2.6" />
        </svg>
      </span>
    </div>
    <div class="homepageEffectParticles" aria-hidden="true"></div>

    <div class="homepageThemeScene homepageMinionsScene" aria-hidden="true">
      <div class="minionLabWall"><i></i><i></i><i></i><i></i></div>
      <div class="minionLabPipe pipe-a"></div><div class="minionLabPipe pipe-b"></div>
      <div class="minionLabConsole"><span></span><span></span><span></span></div>
      <div class="minionCharacter minion-one"><span class="minionGoggle"><b></b></span><span class="minionMouth"></span><span class="minionOverall"></span><i class="minionArm left"></i><i class="minionArm right"></i><i class="minionBoot left"></i><i class="minionBoot right"></i></div>
      <div class="minionCharacter minion-two one-eye"><span class="minionGoggle"><b></b></span><span class="minionMouth"></span><span class="minionOverall"></span><i class="minionArm left"></i><i class="minionArm right"></i><i class="minionBoot left"></i><i class="minionBoot right"></i></div>
      <div class="minionCharacter minion-three"><span class="minionGoggle"><b></b></span><span class="minionMouth"></span><span class="minionOverall"></span><i class="minionArm left"></i><i class="minionArm right"></i><i class="minionBoot left"></i><i class="minionBoot right"></i></div>
      <div class="minionBanana banana-a">🍌</div><div class="minionBanana banana-b">🍌</div><div class="minionBanana banana-c">🍌</div>
      <div class="minionWarningStripe"></div>
    </div>

    <div class="homepageThemeScene homepageSpongeScene" aria-hidden="true">
      <div class="spongeWaterLight"></div>
      <div class="spongeFlower flower-a"></div><div class="spongeFlower flower-b"></div><div class="spongeFlower flower-c"></div>
      <div class="bikiniHouse pineapple"><span class="pineappleLeaves"></span><span class="houseDoor"></span><span class="houseWindow w1"></span><span class="houseWindow w2"></span></div>
      <div class="bikiniHouse rock"><span class="rockDoor"></span></div>
      <div class="bikiniHouse tiki"><span class="tikiEye e1"></span><span class="tikiEye e2"></span><span class="tikiDoor"></span></div>
      <div class="spongeCharacter"><span class="spongeEye left"><b></b></span><span class="spongeEye right"><b></b></span><span class="spongeNose"></span><span class="spongeSmile"></span><span class="spongeShirt"></span><span class="spongeTie"></span><span class="spongePants"></span><i class="spongeArm left"></i><i class="spongeArm right"></i><i class="spongeLeg left"></i><i class="spongeLeg right"></i></div>
      <div class="jellyfish jelly-a"><i></i><i></i><i></i></div><div class="jellyfish jelly-b"><i></i><i></i><i></i></div><div class="jellyfish jelly-c"><i></i><i></i><i></i></div>
      <div class="spongeSand"></div>
    </div>

    <div class="homepageThemeScene homepageNarutoScene" aria-hidden="true">
      <div class="leafSun"></div><div class="leafMountain"><i></i><i></i><i></i><i></i></div>
      <div class="leafVillage back"></div><div class="leafVillage front"></div>
      <div class="leafGate"><span></span></div>
      <div class="narutoRunner"><span class="ninjaHead"></span><span class="ninjaBody"></span><span class="ninjaArm a1"></span><span class="ninjaArm a2"></span><span class="ninjaLeg l1"></span><span class="ninjaLeg l2"></span><span class="ninjaBand"></span></div>
      <div class="chakraOrb"><i></i><i></i><i></i></div>
      <div class="leafWind leaf-a">🍃</div><div class="leafWind leaf-b">🍃</div><div class="leafWind leaf-c">🍃</div>
    </div>

    <div class="homepageThemeScene homepageAkatsukiScene" aria-hidden="true">
      <div class="akatsukiMoon"></div>
      <div class="redCloud cloud-a"><i></i><i></i><i></i></div><div class="redCloud cloud-b"><i></i><i></i><i></i></div><div class="redCloud cloud-c"><i></i><i></i><i></i></div>
      <div class="akatsukiCloak cloak-a"><span class="cloakHead"></span><span class="cloudMark m1"></span><span class="cloudMark m2"></span></div>
      <div class="akatsukiCloak cloak-b"><span class="cloakHead"></span><span class="cloudMark m1"></span><span class="cloudMark m2"></span></div>
      <div class="akatsukiRain"></div>
      <div class="crow crow-a">◆</div><div class="crow crow-b">◆</div><div class="crow crow-c">◆</div>
    </div>

    <div class="homepageThemeScene homepageNinjaNightScene" aria-hidden="true">
      <div class="ninjaMoon"></div><div class="nightCloud nc-a"></div><div class="nightCloud nc-b"></div>
      <div class="ninjaRoof roof-a"></div><div class="ninjaRoof roof-b"></div><div class="ninjaRoof roof-c"></div>
      <div class="ninjaLeap leap-a"><span></span><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div>
      <div class="ninjaLeap leap-b"><span></span><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div>
      <div class="shurikenTrail st-a"><b>✦</b></div><div class="shurikenTrail st-b"><b>✦</b></div>
      <div class="nightFog"></div>
    </div>
    <div class="homepageThemeScene homepageSolarSystemScene" aria-hidden="true">
      <div class="solarSceneGlow glow-a"></div><div class="solarSceneGlow glow-b"></div>
      <div class="solarSystemStage" aria-label="Interactive Solar System">
        <button class="solarSun" type="button" data-name="Sun" data-order="Center star" data-type="G-type star" data-fact="The Sun is the star at the center of our Solar System."><span class="solarSunAura"></span><span class="solarSunCore"></span></button>
        <div class="solarOrbit orbit-mercury"><span class="solarPlanetAnchor"><button class="solarPlanet mercury" type="button" data-name="Mercury" data-order="1st planet" data-type="Rocky planet" data-fact="Mercury is the closest planet to the Sun and the smallest major planet."></button></span></div>
        <div class="solarOrbit orbit-venus"><span class="solarPlanetAnchor"><button class="solarPlanet venus" type="button" data-name="Venus" data-order="2nd planet" data-type="Rocky planet" data-fact="Venus is the hottest planet because of its thick carbon-dioxide atmosphere."></button></span></div>
        <div class="solarOrbit orbit-earth"><span class="solarPlanetAnchor"><button class="solarPlanet earth" type="button" data-name="Earth" data-order="3rd planet" data-type="Rocky planet" data-fact="Earth has abundant liquid surface water and is our home planet."></button></span></div>
        <div class="solarOrbit orbit-mars"><span class="solarPlanetAnchor"><button class="solarPlanet mars" type="button" data-name="Mars" data-order="4th planet" data-type="Rocky planet" data-fact="Mars is known as the Red Planet because iron minerals in its surface oxidize."></button></span></div>
        <div class="solarOrbit orbit-jupiter"><span class="solarPlanetAnchor"><button class="solarPlanet jupiter" type="button" data-name="Jupiter" data-order="5th planet" data-type="Gas giant" data-fact="Jupiter is the largest planet in the Solar System."></button></span></div>
        <div class="solarOrbit orbit-saturn"><span class="solarPlanetAnchor"><button class="solarPlanet saturn" type="button" data-name="Saturn" data-order="6th planet" data-type="Gas giant" data-fact="Saturn is famous for its broad, bright ring system."></button></span></div>
        <div class="solarOrbit orbit-uranus"><span class="solarPlanetAnchor"><button class="solarPlanet uranus" type="button" data-name="Uranus" data-order="7th planet" data-type="Ice giant" data-fact="Uranus rotates on its side compared with most other planets."></button></span></div>
        <div class="solarOrbit orbit-neptune"><span class="solarPlanetAnchor"><button class="solarPlanet neptune" type="button" data-name="Neptune" data-order="8th planet" data-type="Ice giant" data-fact="Neptune is the farthest major planet from the Sun."></button></span></div>
      </div>
      <div class="solarInteractionHint" aria-hidden="true"><span>Move</span> to tilt • <span>Hover</span> to identify • <span>Tap</span> a planet to inspect</div>
      <div class="solarInfoCard" aria-live="polite" hidden>
        <button class="solarInfoClose" type="button" aria-label="Close planet details">×</button>
        <span class="solarInfoEyebrow" id="solarInfoOrder">Planet</span>
        <strong class="solarInfoName" id="solarInfoName">Earth</strong>
        <span class="solarInfoType" id="solarInfoType">Rocky planet</span>
        <p class="solarInfoFact" id="solarInfoFact"></p>
        <small>Illustrative orbit layout • not to scale</small>
      </div>
    </div>
    <div class="homepageThemeScene homepagePetDogScene" aria-hidden="true">
      <div class="petWindow"><span class="petCloud c1"></span><span class="petCloud c2"></span><span class="petSunGlow"></span></div>
      <div class="petRoomWall"><span class="petFrame f1"></span><span class="petFrame f2"></span><span class="petShelf"><i></i><i></i><i></i></span></div>
      <div class="petPlant"><span class="petPot"></span><i class="leaf l1"></i><i class="leaf l2"></i><i class="leaf l3"></i></div>
      <div class="petRug"></div>
      <div class="petToyBall"></div>
      <div class="petDog" aria-hidden="true">
        <span class="petDogTail"></span>
        <span class="petDogBody"><i class="petChest"></i><i class="petPaw p1"></i><i class="petPaw p2"></i></span>
        <span class="petDogHead">
          <i class="petDogEar left"></i><i class="petDogEar right"></i>
          <span class="petDogFace">
            <i class="petDogEye left"><b></b></i><i class="petDogEye right"><b></b></i>
            <i class="petDogBrow left"></i><i class="petDogBrow right"></i>
            <i class="petDogMuzzle"><b class="petDogNose"></b><em class="petDogSmile left"></em><em class="petDogSmile right"></em><strong class="petDogTongue"></strong></i>
          </span>
        </span>
      </div>
      <div class="petLoveBurst"><span>♥</span><span>♥</span><span>♥</span><span>♥</span><span>♥</span></div>
      <div class="petInteractionHint">Move, tap or click — your puppy is watching you</div>
    </div>
    <div class="homepageThemeScene homepagePetKoalaScene" aria-hidden="true">
      <div class="koalaForestSky"><span class="koalaForestSun"></span><span class="koalaForestRay r1"></span><span class="koalaForestRay r2"></span><span class="koalaForestRay r3"></span></div>
      <div class="koalaForestCanopy back"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="koalaForestTrunk trunk-left"><span></span></div>
      <div class="koalaForestTrunk trunk-right"><span></span></div>
      <div class="koalaForestCanopy front"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="koalaForestFloor"><i class="fern f1"></i><i class="fern f2"></i><i class="fern f3"></i><i class="fern f4"></i></div>
      <div class="koalaMainTree"><span class="koalaMainTrunk"></span><span class="koalaBranch main"></span><span class="koalaBranch side"></span></div>
      <div class="petKoala" aria-hidden="true">
        <span class="petKoalaBody"><i class="petKoalaBelly"></i><i class="petKoalaFoot left"></i><i class="petKoalaFoot right"></i></span>
        <span class="petKoalaArm hug"></span><span class="petKoalaArm wave"></span>
        <span class="petKoalaHead">
          <i class="petKoalaEar left"><b></b></i><i class="petKoalaEar right"><b></b></i>
          <span class="petKoalaFace">
            <i class="petKoalaEye left"><b></b></i><i class="petKoalaEye right"><b></b></i>
            <i class="petKoalaBlush left"></i><i class="petKoalaBlush right"></i>
            <i class="petKoalaNose"></i><i class="petKoalaSmile"></i>
          </span>
        </span>
        <span class="petKoalaLeafSnack"><i></i><i></i><i></i></span>
      </div>
      <div class="koalaForestLeaf leaf-a"></div><div class="koalaForestLeaf leaf-b"></div><div class="koalaForestLeaf leaf-c"></div><div class="koalaForestLeaf leaf-d"></div><div class="koalaForestLeaf leaf-e"></div>
      <div class="koalaReactionBurst"><span>♥</span><span>🍃</span><span>♥</span><span>🍃</span><span>♥</span></div>
      <div class="koalaInteractionHint">Move, tap or click — your koala is watching from the eucalyptus forest</div>
    </div>
    <div class="homepageThemeScene homepageBuwanWikaScene" aria-hidden="true">
      <img class="buwanAsset buwanAssetBackdrop" src="assets/buwan-wika/mountains-banig.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetFlag" src="assets/buwan-wika/philippine-flag.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetEagle" src="assets/buwan-wika/philippine-eagle.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <div class="buwanWikaBaybayinBanner">
        <strong lang="tl-Tglg">ᜋᜎᜒᜄᜌᜅ᜔ ᜊᜓᜏᜈ᜔ ᜅ᜔ ᜏᜒᜃ</strong>
        <span>Maligayang Buwan ng Wika</span>
      </div>
      <img class="buwanAsset buwanAssetChurch" src="assets/buwan-wika/church.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetKubo" src="assets/buwan-wika/bahay-kubo.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetBarong" src="assets/buwan-wika/barong-person-base.png?v=449" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetFilipiniana" src="assets/buwan-wika/filipiniana-person-base.png?v=449" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetCulture" src="assets/buwan-wika/culture-cluster.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetProps" src="assets/buwan-wika/heritage-props.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="buwanAsset buwanAssetJeepney" src="assets/buwan-wika/jeepney.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <div class="buwanWikaKalabaw" aria-hidden="true">🐃</div>
      <div class="buwanWikaRibbon"><span>PILIPINAS</span><b>WIKA • KULTURA • PAGKAKAKILANLAN</b></div>
    </div>
    <div class="homepageEffectKoalaFamily" aria-hidden="true">
      <div class="koalaFamilySoftGlow"></div>
      <div class="koalaFamilyStage">
        <div class="koalaForestTitle">SFK KOALA FAMILY</div>
        <span class="koalaFamilyWalker is-adviser" style="--pose-x:0vw;--pose-y:-17vh;--start-x:-62vw;--delay:-0.15s;--depth:5"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i><b class="koalaAdviserBadge">ADVISER</b></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:-32.40vw;--pose-y:-8vh;--start-x:-61vw;--delay:-0.07s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:-25.20vw;--pose-y:-8vh;--start-x:64vw;--delay:-0.14s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:-18.00vw;--pose-y:-8vh;--start-x:-67vw;--delay:-0.21s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:-10.80vw;--pose-y:-8vh;--start-x:70vw;--delay:-0.28s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:-3.60vw;--pose-y:-8vh;--start-x:-73vw;--delay:-0.35s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:3.60vw;--pose-y:-8vh;--start-x:76vw;--delay:-0.42s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:10.80vw;--pose-y:-8vh;--start-x:-58vw;--delay:-0.49s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:18.00vw;--pose-y:-8vh;--start-x:61vw;--delay:-0.56s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:25.20vw;--pose-y:-8vh;--start-x:-64vw;--delay:0.00s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-1" style="--pose-x:32.40vw;--pose-y:-8vh;--start-x:67vw;--delay:-0.07s;--depth:1"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:-33.50vw;--pose-y:-1vh;--start-x:-70vw;--delay:-0.14s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:-26.80vw;--pose-y:-1vh;--start-x:73vw;--delay:-0.21s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:-20.10vw;--pose-y:-1vh;--start-x:-76vw;--delay:-0.28s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:-13.40vw;--pose-y:-1vh;--start-x:58vw;--delay:-0.35s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:-6.70vw;--pose-y:-1vh;--start-x:-61vw;--delay:-0.42s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:0.00vw;--pose-y:-1vh;--start-x:64vw;--delay:-0.49s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:6.70vw;--pose-y:-1vh;--start-x:-67vw;--delay:-0.56s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:13.40vw;--pose-y:-1vh;--start-x:70vw;--delay:0.00s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:20.10vw;--pose-y:-1vh;--start-x:-73vw;--delay:-0.07s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:26.80vw;--pose-y:-1vh;--start-x:76vw;--delay:-0.14s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-2" style="--pose-x:33.50vw;--pose-y:-1vh;--start-x:-58vw;--delay:-0.21s;--depth:2"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:-33.50vw;--pose-y:6vh;--start-x:61vw;--delay:-0.28s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:-26.80vw;--pose-y:6vh;--start-x:-64vw;--delay:-0.35s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:-20.10vw;--pose-y:6vh;--start-x:67vw;--delay:-0.42s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:-13.40vw;--pose-y:6vh;--start-x:-70vw;--delay:-0.49s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:-6.70vw;--pose-y:6vh;--start-x:73vw;--delay:-0.56s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:0.00vw;--pose-y:6vh;--start-x:-76vw;--delay:0.00s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:6.70vw;--pose-y:6vh;--start-x:58vw;--delay:-0.07s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:13.40vw;--pose-y:6vh;--start-x:-61vw;--delay:-0.14s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:20.10vw;--pose-y:6vh;--start-x:64vw;--delay:-0.21s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:26.80vw;--pose-y:6vh;--start-x:-67vw;--delay:-0.28s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-3" style="--pose-x:33.50vw;--pose-y:6vh;--start-x:70vw;--delay:-0.35s;--depth:3"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:-33.50vw;--pose-y:13vh;--start-x:-73vw;--delay:-0.42s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:-26.80vw;--pose-y:13vh;--start-x:76vw;--delay:-0.49s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:-20.10vw;--pose-y:13vh;--start-x:-58vw;--delay:-0.56s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:-13.40vw;--pose-y:13vh;--start-x:61vw;--delay:0.00s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:-6.70vw;--pose-y:13vh;--start-x:-64vw;--delay:-0.07s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:0.00vw;--pose-y:13vh;--start-x:67vw;--delay:-0.14s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:6.70vw;--pose-y:13vh;--start-x:-70vw;--delay:-0.21s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:13.40vw;--pose-y:13vh;--start-x:73vw;--delay:-0.28s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:20.10vw;--pose-y:13vh;--start-x:-76vw;--delay:-0.35s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:26.80vw;--pose-y:13vh;--start-x:58vw;--delay:-0.42s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <span class="koalaFamilyWalker is-student row-4" style="--pose-x:33.50vw;--pose-y:13vh;--start-x:-61vw;--delay:-0.49s;--depth:4"><span class="koalaFamilyFigure"><span class="koalaFamilyEar is-left"></span><span class="koalaFamilyEar is-right"></span><span class="koalaFamilyHead"><span class="koalaFamilyEye is-left"></span><span class="koalaFamilyEye is-right"></span><span class="koalaFamilyNose"></span><span class="koalaFamilyBlush is-left"></span><span class="koalaFamilyBlush is-right"></span></span><span class="koalaFamilyBodyCore"></span><span class="koalaFamilyBelly"></span><span class="koalaFamilyArm is-left"></span><span class="koalaFamilyArm is-right"></span><span class="koalaFamilyFoot is-left"></span><span class="koalaFamilyFoot is-right"></span></span><i class="koalaFamilyHeldHeart">♥</i></span>
        <div class="koalaFamilyHeartPose"><span>♥</span></div>
        <div class="koalaFamilyLoveBurst"><i>♥</i><i>♡</i><i>♥</i><i>♡</i><i>♥</i><i>♥</i><i>♡</i><i>♥</i><i>♡</i><i>♥</i><i>♡</i><i>♥</i></div>
      </div>
    </div>

    <div class="homepageThemeScene homepageSunriseScene" aria-hidden="true">
      <div class="sunriseSun"></div>
      <div class="sunriseCloud cloud-a"></div><div class="sunriseCloud cloud-b"></div><div class="sunriseCloud cloud-c"></div>
      <div class="sunriseBird bird-a">⌒⌒</div><div class="sunriseBird bird-b">⌒⌒</div><div class="sunriseBird bird-c">⌒⌒</div>
      <div class="sunriseHill hill-back"></div><div class="sunriseHill hill-front"></div>
      <div class="sunriseGlowLine"></div>
    </div>

    <div class="homepageThemeScene homepageUnderwaterScene" aria-hidden="true">
      <div class="underwaterLight"></div>
      <div class="underwaterWave wave-a"></div><div class="underwaterWave wave-b"></div>
      <div class="underwaterFish fish-a"><i></i></div><div class="underwaterFish fish-b"><i></i></div><div class="underwaterFish fish-c"><i></i></div><div class="underwaterFish fish-d"><i></i></div>
      <div class="underwaterBubble bubble-a"></div><div class="underwaterBubble bubble-b"></div><div class="underwaterBubble bubble-c"></div><div class="underwaterBubble bubble-d"></div>
      <div class="underwaterSeaweed weed-a"></div><div class="underwaterSeaweed weed-b"></div><div class="underwaterSeaweed weed-c"></div><div class="underwaterSeaweed weed-d"></div>
      <div class="underwaterCoral coral-a"></div><div class="underwaterCoral coral-b"></div>
    </div>

    <div class="homepageThemeScene homepageNotebookScene" aria-hidden="true">
      <div class="notebookPaper"></div><div class="notebookMargin"></div>
      <div class="notebookSticker sticker-a">A+</div><div class="notebookSticker sticker-b">#BeKind</div>
      <div class="notebookDoodle doodle-a">&lt;html&gt;</div><div class="notebookDoodle doodle-b">ICT</div><div class="notebookDoodle doodle-c">★</div><div class="notebookDoodle doodle-d">♥</div><div class="notebookDoodle doodle-e">123</div>
      <div class="notebookPencil"></div><div class="notebookRuler"></div>
    </div>

    <div class="homepageThemeScene homepageHyperspaceScene" aria-hidden="true">
      <div class="hyperspaceCore"></div>
      <span class="hyperspaceStar s1"></span><span class="hyperspaceStar s2"></span><span class="hyperspaceStar s3"></span><span class="hyperspaceStar s4"></span><span class="hyperspaceStar s5"></span><span class="hyperspaceStar s6"></span><span class="hyperspaceStar s7"></span><span class="hyperspaceStar s8"></span><span class="hyperspaceStar s9"></span><span class="hyperspaceStar s10"></span><span class="hyperspaceStar s11"></span><span class="hyperspaceStar s12"></span>
      <div class="hyperspacePlanet planet-a"></div><div class="hyperspacePlanet planet-b"></div>
    </div>

    <div class="homepageThemeScene homepageWindowWeatherScene" aria-hidden="true">
      <div class="windowWeatherGlow"></div>
      <div class="windowFrame"><span class="windowPane v"></span><span class="windowPane h"></span><div class="windowOutsideSky"></div><div class="windowOutsideCloud cloud-a"></div><div class="windowOutsideCloud cloud-b"></div><div class="windowOutsideBird">⌒⌒</div></div>
      <div class="windowCurtain curtain-left"></div><div class="windowCurtain curtain-right"></div>
      <div class="windowPlant"><i></i><i></i><i></i><i></i></div>
      <div class="windowBranch"><i></i><i></i><i></i><i></i><i></i></div>
    </div>

    <div class="homepageThemeScene homepageFiestaScene" aria-hidden="true">
      <div class="fiestaGlow"></div>
      <div class="fiestaBunting row-a"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
      <div class="fiestaBunting row-b"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
      <div class="fiestaLights"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="fiestaChurch"></div><div class="fiestaPlaza"></div><div class="fiestaJeep"></div>
      <div class="fiestaSpark sparkle-a">✦</div><div class="fiestaSpark sparkle-b">✦</div><div class="fiestaSpark sparkle-c">✦</div>
    </div>

    <div class="homepageThemeScene homepageBookWorldScene" aria-hidden="true">
      <div class="bookWorldGlow"></div>
      <div class="bookWorldBook"><span class="page left"></span><span class="page right"></span><i class="spine"></i></div>
      <div class="bookWorldMountain m1"></div><div class="bookWorldMountain m2"></div>
      <div class="bookWorldIcon icon-a">★</div><div class="bookWorldIcon icon-b">✦</div><div class="bookWorldIcon icon-c">📘</div><div class="bookWorldIcon icon-d">💡</div><div class="bookWorldIcon icon-e">☁</div>
    </div>

    <div class="homepageThemeScene homepageBlackboardScene" aria-hidden="true">
      <div class="blackboardFrameOuter"></div>
      <div class="blackboardDust dust-a"></div><div class="blackboardDust dust-b"></div><div class="blackboardDust dust-c"></div>
      <div class="blackboardText text-a">&lt;/&gt; HTML</div><div class="blackboardText text-b">V = I × R</div><div class="blackboardText text-c">#BeKind</div><div class="blackboardText text-d">Arduino • Web • Code</div><div class="blackboardText text-e">∞ Learning</div>
      <div class="blackboardFormula formula-a"></div><div class="blackboardFormula formula-b"></div><div class="blackboardFormula formula-c"></div>
      <div class="blackboardEraser"></div><div class="blackboardChalk"></div>
    </div>

    <div class="homepageThemeScene homepageMoonGardenScene" aria-hidden="true">
      <div class="moonGardenMoon"></div><div class="moonGardenGlow"></div>
      <div class="moonGardenHill hill-back"></div><div class="moonGardenHill hill-front"></div>
      <div class="moonGardenTree tree-a"></div><div class="moonGardenTree tree-b"></div>
      <div class="moonGardenFirefly fly-a"></div><div class="moonGardenFirefly fly-b"></div><div class="moonGardenFirefly fly-c"></div><div class="moonGardenFirefly fly-d"></div><div class="moonGardenFirefly fly-e"></div><div class="moonGardenFirefly fly-f"></div>
      <div class="moonGardenGrass"></div>
    </div>

    <div class="homepageThemeScene homepageCloudKingdomScene" aria-hidden="true">
      <div class="cloudKingdomSun"></div><div class="cloudKingdomRay ray-a"></div><div class="cloudKingdomRay ray-b"></div><div class="cloudKingdomRay ray-c"></div>
      <div class="cloudKingdomCloud cloud-a"></div><div class="cloudKingdomCloud cloud-b"></div><div class="cloudKingdomCloud cloud-c"></div><div class="cloudKingdomCloud cloud-d"></div>
      <div class="cloudKingdomBird bird-a">⌒⌒</div><div class="cloudKingdomBird bird-b">⌒⌒</div>
    </div>

    <div class="homepageThemeScene homepageCountdownScene" aria-hidden="true">
      <div class="countdownGlow"></div><div class="countdownRing ring-a"></div><div class="countdownRing ring-b"></div>
      <div class="countdownBurst burst-a"></div><div class="countdownBurst burst-b"></div><div class="countdownBurst burst-c"></div>
      <div class="countdownStage"><span class="countdownWord word-3">3</span><span class="countdownWord word-2">2</span><span class="countdownWord word-1">1</span><span class="countdownWord word-go">GO!</span></div>
      <div class="countdownConfetti conf-a">✦</div><div class="countdownConfetti conf-b">✦</div><div class="countdownConfetti conf-c">✦</div><div class="countdownConfetti conf-d">✦</div>
    </div>

    <div class="homepageThemeScene homepagePixelGameScene" aria-hidden="true">
      <div class="pixelSun"></div><div class="pixelCloud cloud-a"></div><div class="pixelCloud cloud-b"></div>
      <div class="pixelCoin coin-a"></div><div class="pixelCoin coin-b"></div><div class="pixelCoin coin-c"></div>
      <div class="pixelHill hill-a"></div><div class="pixelHill hill-b"></div>
      <div class="pixelRunner"><i class="head"></i><i class="body"></i><i class="arm arm-a"></i><i class="arm arm-b"></i><i class="leg leg-a"></i><i class="leg leg-b"></i></div>
      <div class="pixelGround"></div>
    </div>

    <div class="homepageThemeScene homepageCyberClassroomScene" aria-hidden="true">
      <div class="cyberGrid"></div>
      <div class="cyberBeam beam-a"></div><div class="cyberBeam beam-b"></div><div class="cyberBeam beam-c"></div>
      <div class="cyberNode node-a"></div><div class="cyberNode node-b"></div><div class="cyberNode node-c"></div><div class="cyberNode node-d"></div><div class="cyberNode node-e"></div>
      <div class="cyberPanel panel-a"><span>DATA</span></div><div class="cyberPanel panel-b"><span>LESSONS</span></div><div class="cyberPanel panel-c"><span>COMPLIANCE</span></div>
      <div class="cyberPulse"></div>
    </div>

    <div class="homepageThemeScene homepageHeritageJourneyScene" aria-hidden="true">
      <img class="heritageAsset heritageBackdrop" src="assets/buwan-wika/mountains-banig.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="heritageAsset heritageFlag" src="assets/buwan-wika/philippine-flag.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="heritageAsset heritageChurch" src="assets/buwan-wika/church.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="heritageAsset heritageKubo" src="assets/buwan-wika/bahay-kubo.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="heritageAsset heritageJeep" src="assets/buwan-wika/jeepney.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="heritageAsset heritageProps" src="assets/buwan-wika/heritage-props.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <img class="heritageAsset heritageCulture" src="assets/buwan-wika/culture-cluster.webp?v=441" alt="" draggable="false" decoding="async" loading="eager" />
      <div class="heritageJourneyTrack"><span class="stop stop-a">Bahay Kubo</span><span class="stop stop-b">Jeepney</span><span class="stop stop-c">Simbahan</span><span class="stop stop-d">Akda at Kultura</span></div>
    </div>

    <div class="homepageThemeScene homepageFreedomWallScene" data-theme="sticky-notes" aria-label="SFK #BeKind Wall">
      <div class="freedomWallBg" aria-hidden="true">
        <div class="freedomWallSun"></div>
        <div class="freedomWallMoon"></div>
        <div class="freedomWallCloud fw-cloud-a"></div><div class="freedomWallCloud fw-cloud-b"></div><div class="freedomWallCloud fw-cloud-c"></div>
        <div class="freedomWallRain"></div>
        <div class="freedomWallFlood"><span class="fwFloodWave wave-a"></span><span class="fwFloodWave wave-b"></span></div>
        <div class="freedomWallComicBurst burst-a">WOW!</div><div class="freedomWallComicBurst burst-b">SFK!</div>
        <div class="freedomWallVandalMark mark-a">#BEKIND</div><div class="freedomWallVandalMark mark-b">SFK</div><div class="freedomWallVandalMark mark-c">★</div>
        <div class="freedomWallJungleEnvironment" aria-hidden="true">
          <i class="fwJungleTree tree-a"></i><i class="fwJungleTree tree-b"></i><i class="fwJungleTree tree-c"></i>
          <i class="fwJungleVine vine-a"></i><i class="fwJungleVine vine-b"></i><i class="fwJungleVine vine-c"></i>
          <i class="fwJungleFoliage foliage-a"></i><i class="fwJungleFoliage foliage-b"></i><i class="fwJungleFoliage foliage-c"></i><i class="fwJungleFoliage foliage-d"></i>
        </div>
        <div class="freedomWallUtilityPole" aria-hidden="true">
          <i class="fwUtilityPoleBody"></i><i class="fwUtilityCrossArm"></i>
          <i class="fwUtilityInsulator ins-a"></i><i class="fwUtilityInsulator ins-b"></i><i class="fwUtilityInsulator ins-c"></i><i class="fwUtilityInsulator ins-d"></i>
          <i class="fwUtilityWire wire-a"></i><i class="fwUtilityWire wire-b"></i><i class="fwUtilityWire wire-c"></i><i class="fwUtilityWire wire-d"></i>
          <i class="fwUtilityJumper jumper-a"></i><i class="fwUtilityJumper jumper-b"></i><i class="fwUtilityNotice"></i>
        </div>
      </div>
      <div class="freedomWallBrand">
        <div class="freedomWallBrandLine"><strong>SFK #BeKind WALL</strong><button id="freedomWallReaderOpenBtn" class="freedomWallReaderOpenBtn" type="button" aria-label="Read notes one at a time" title="Read notes one at a time"><span aria-hidden="true">📖</span><small>Read</small></button></div>
        <span id="freedomWallCount">Live wall</span>
      </div>
      <div id="freedomWallNotesStage" class="freedomWallNotesStage" aria-live="polite"></div>
      <div id="freedomWallDragOverlay" class="freedomWallDragOverlay" aria-hidden="true"></div>
      <section id="freedomWallPromptCard" class="freedomWallPromptCard" hidden>
        <button id="freedomWallPromptClose" class="freedomWallPromptClose" type="button" aria-label="Close prompt">×</button>
        <span class="freedomWallPromptEyebrow">TODAY'S WALL PROMPT</span>
        <h2 id="freedomWallPromptTitle"></h2>
        <p id="freedomWallPromptMessage"></p>
        <div id="freedomWallPromptReactionSummary" class="freedomWallReactionSummary is-prompt" aria-live="polite" hidden></div>
      </section>
      <section id="freedomWallEmptyState" class="freedomWallEmptyState" hidden aria-live="polite">
        <span aria-hidden="true">✦</span>
        <strong>SFK #BeKind Wall is ready</strong>
        <p>Press Add Note to start sharing. If old notes are missing, check the active saved wall in Admin.</p>
      </section>
      <div id="freedomWallReactionMenu" class="freedomWallReactionMenu" role="menu" aria-label="React" hidden>
        <div class="freedomWallReactionMenuHead"><strong id="freedomWallReactionMenuTitle">React</strong><button id="freedomWallReactionMenuClose" type="button" aria-label="Close reactions">×</button></div>
        <div class="freedomWallReactionChoices">
          <button type="button" role="menuitem" data-fw-reaction="heart" aria-label="Heart"><span>❤️</span><b>Heart</b><small data-fw-reaction-count="heart">0</small></button>
          <button type="button" role="menuitem" data-fw-reaction="haha" aria-label="Haha"><span>😂</span><b>Haha</b><small data-fw-reaction-count="haha">0</small></button>
          <button type="button" role="menuitem" data-fw-reaction="wow" aria-label="Wow"><span>😮</span><b>Wow</b><small data-fw-reaction-count="wow">0</small></button>
          <button type="button" role="menuitem" data-fw-reaction="sad" aria-label="Sad"><span>😢</span><b>Sad</b><small data-fw-reaction-count="sad">0</small></button>
          <button type="button" role="menuitem" data-fw-reaction="like" aria-label="Like"><span>👍</span><b>Like</b><small data-fw-reaction-count="like">0</small></button>
        </div>
        <div id="freedomWallNoteActionRow" class="freedomWallNoteActionRow" hidden>
          <button id="freedomWallViewRepliesBtn" type="button"><span aria-hidden="true">💬</span><b>Replies</b><small id="freedomWallActionReplyCount">0</small></button>
          <button id="freedomWallQuickReplyBtn" type="button"><span aria-hidden="true">↩</span><b>Reply</b></button>
        </div>
        <small id="freedomWallReactionStatus" class="freedomWallReactionStatus" role="status"></small>
      </div>
      <div id="freedomWallReplyThread" class="freedomWallReplyThread" hidden>
        <section class="freedomWallReplyDialog" role="dialog" aria-modal="true" aria-labelledby="freedomWallReplyTitle">
          <div class="freedomWallReplyHead">
            <div><strong id="freedomWallReplyTitle">Replies</strong><span id="freedomWallReplySubtitle">Conversation on this note</span></div>
            <button id="freedomWallReplyClose" type="button" aria-label="Close replies">×</button>
          </div>
          <div id="freedomWallReplyOriginal" class="freedomWallReplyOriginal"></div>
          <div id="freedomWallReplyList" class="freedomWallReplyList" role="feed" aria-live="polite"></div>
          <form id="freedomWallReplyForm" class="freedomWallReplyForm">
            <div id="freedomWallReplyingTo" class="freedomWallReplyingTo" hidden><span></span><button id="freedomWallReplyCancelParent" type="button">×</button></div>
            <div class="freedomWallReplyIdentity"><label for="freedomWallReplyAuthor">Name / nickname</label><input id="freedomWallReplyAuthor" maxlength="42" autocomplete="name" placeholder="Your name" /></div>
            <div class="freedomWallReplyComposerLine"><textarea id="freedomWallReplyInput" maxlength="240" rows="2" placeholder="Write a reply…"></textarea><button id="freedomWallReplySend" type="submit">Send</button></div>
            <small id="freedomWallReplyStatus" role="status"></small>
          </form>
        </section>
      </div>
      <div id="freedomWallReplyActionMenu" class="freedomWallReplyActionMenu" hidden>
        <button id="freedomWallReplyToReplyBtn" type="button">↩ <span>Reply</span></button>
      </div>

      <div id="freedomWallGestureHint" class="freedomWallGestureHint" aria-hidden="true">
        <span class="freedomWallGestureHintPhone">Hold: react/reply • drag notes to move</span>
        <span class="freedomWallGestureHintDesktop">Right-click: react/reply • drag notes to move</span>
      </div>

      <section id="freedomWallReader" class="freedomWallReader" hidden aria-label="Read notes one at a time">
        <div class="freedomWallReaderToolbar">
          <div class="freedomWallReaderTitle"><strong>Read Notes</strong><span id="freedomWallReaderCounter">0 / 0</span></div>
          <div class="freedomWallReaderToolbarActions">
            <button id="freedomWallReaderPauseBtn" type="button" aria-label="Pause automatic note switching" title="Pause auto-switch"><span aria-hidden="true">⏸</span><small>Pause</small></button>
            <button id="freedomWallReaderCloseBtn" type="button" aria-label="Close Read Notes mode" title="Close Read Notes mode">×</button>
          </div>
        </div>
        <div id="freedomWallReaderProgress" class="freedomWallReaderProgress" aria-hidden="true"><i></i></div>
        <button id="freedomWallReaderPrevBtn" class="freedomWallReaderNav is-prev" type="button" aria-label="Previous note">‹</button>
        <div id="freedomWallReaderViewport" class="freedomWallReaderViewport">
          <div id="freedomWallReaderCardMount" class="freedomWallReaderCardMount"></div>
          <div id="freedomWallReaderEmpty" class="freedomWallReaderEmpty" hidden><span>📖</span><strong>No notes yet</strong><small>New notes will appear here automatically.</small></div>
        </div>
        <button id="freedomWallReaderNextBtn" class="freedomWallReaderNav is-next" type="button" aria-label="Next note">›</button>
        <div class="freedomWallReaderHelp"><span>Swipe or use ‹ ›</span><b>•</b><span>Hold / right-click to react &amp; reply</span></div>
      </section>

      <button id="freedomWallAddBtn" class="freedomWallAddBtn" type="button" aria-label="Add a note"><span>+</span><small>Add Note</small></button>
      <div id="freedomWallComposer" class="freedomWallComposer" hidden>
        <form id="freedomWallComposerForm" class="freedomWallComposerCard">
          <div class="freedomWallComposerHead"><div><strong>Add to the SFK #BeKind Wall</strong><span>Share a short note with SFK.</span></div><button id="freedomWallComposerClose" type="button" aria-label="Close">×</button></div>
          <div id="freedomWallComposerScroll" class="freedomWallComposerScroll">
          <label for="freedomWallAuthorInput">Name / nickname</label>
          <input id="freedomWallAuthorInput" type="text" maxlength="42" autocomplete="name" placeholder="Your name" />
          <label for="freedomWallNoteInput">Your note</label>
          <textarea id="freedomWallNoteInput" maxlength="240" rows="4" placeholder="Write something kind, honest, funny, thankful, or meaningful…"></textarea>
          <div id="freedomWallMediaField" class="freedomWallMediaField" hidden>
            <div class="freedomWallMediaFieldHead"><label id="freedomWallMediaLabel" for="freedomWallMediaInput">Media (optional)</label><small id="freedomWallMediaHint">Available for the Polaroid theme.</small></div>
            <div id="freedomWallMediaTypeWrap" class="freedomWallMediaTypeWrap" hidden><label for="freedomWallMediaType">Attachment Type</label><select id="freedomWallMediaType"></select></div>
            <div class="freedomWallMediaControls">
              <label class="freedomWallMediaChoose" for="freedomWallMediaInput"><span aria-hidden="true">📷</span><b id="freedomWallMediaChooseText">Choose Photo / GIF</b></label>
              <input id="freedomWallMediaInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" />
              <button id="freedomWallMediaRemove" type="button" hidden>Remove</button>
            </div>
            <div id="freedomWallYouTubeWrap" class="freedomWallYouTubeWrap" hidden><label for="freedomWallYouTubeInput">YouTube Link</label><input id="freedomWallYouTubeInput" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=..." /></div>
            <div id="freedomWallYouTubeSearchWrap" class="freedomWallMediaSearchWrap freedomWallYouTubeSearchWrap" hidden><label for="freedomWallYouTubeSearchInput">YouTube Search</label><div class="freedomWallMediaSearchLine"><input id="freedomWallYouTubeSearchInput" type="search" placeholder="Song, topic, or video title" /><button id="freedomWallYouTubeSearchBtn" type="button">Search</button></div><div id="freedomWallYouTubeSelected" class="freedomWallMediaSelected" hidden></div><div id="freedomWallYouTubeResults" class="freedomWallMediaSearchResults"></div></div>
            <div id="freedomWallGifSearchWrap" class="freedomWallMediaSearchWrap freedomWallGifSearchWrap" hidden><label for="freedomWallGifSearchInput">GIF Search</label><div class="freedomWallMediaSearchLine"><input id="freedomWallGifSearchInput" type="search" placeholder="happy, thank you, funny…" /><button id="freedomWallGifSearchBtn" type="button">Search</button></div><div id="freedomWallGifSelected" class="freedomWallMediaSelected" hidden></div><div id="freedomWallGifResults" class="freedomWallMediaSearchResults is-gif-grid"></div></div>
            <div id="freedomWallMediaPreview" class="freedomWallMediaPreview" hidden></div>
          </div>
          <section id="freedomWallCustomizePanel" class="freedomWallCustomizePanel">
            <button id="freedomWallCustomizeToggle" class="freedomWallCustomizeToggle" type="button" aria-expanded="false" aria-controls="freedomWallCustomizeBody">
              <span class="freedomWallCustomizeIcon" aria-hidden="true">✦</span>
              <span class="freedomWallCustomizeToggleText"><strong id="freedomWallCustomizeLabel">Customize Note</strong><small id="freedomWallCustomizeHint">Background, text color and font</small></span>
              <span id="freedomWallCustomizeSummary" class="freedomWallCustomizeSummary" aria-live="polite"></span>
              <span class="freedomWallCustomizeChevron" aria-hidden="true">›</span>
            </button>
            <div id="freedomWallCustomizeBody" class="freedomWallCustomizeBody" hidden>
              <div class="freedomWallCustomizationField freedomWallBackgroundField">
                <button class="freedomWallCustomizerTrigger" type="button" data-fw-customizer-toggle="background" aria-expanded="false" aria-controls="freedomWallBackgroundOptions">
                  <span id="freedomWallBackgroundLabel">Note Background</span>
                  <span class="freedomWallCustomizerValue"><i id="freedomWallBackgroundPreview" class="freedomWallCustomizerColorPreview" aria-hidden="true"></i><b id="freedomWallBackgroundValue">Yellow</b><em aria-hidden="true">⌄</em></span>
                </button>
                <div id="freedomWallBackgroundOptions" class="freedomWallCustomizerOptions" data-fw-customizer-panel="background" hidden>
                  <div class="freedomWallCustomizerOptionsHead"><strong>Choose Note Background</strong><button type="button" data-fw-customizer-close aria-label="Close background choices">×</button></div>
                  <div class="freedomWallColorRow freedomWallSwatchRow" aria-label="Note background color">
                    <button type="button" data-fw-color="yellow" class="is-selected" aria-label="Yellow"></button><button type="button" data-fw-color="cream" aria-label="Cream"></button><button type="button" data-fw-color="white" aria-label="White"></button><button type="button" data-fw-color="peach" aria-label="Peach"></button><button type="button" data-fw-color="coral" aria-label="Coral"></button><button type="button" data-fw-color="pink" aria-label="Pink"></button><button type="button" data-fw-color="rose" aria-label="Rose"></button><button type="button" data-fw-color="lavender" aria-label="Lavender"></button><button type="button" data-fw-color="violet" aria-label="Violet"></button><button type="button" data-fw-color="sky" aria-label="Sky Blue"></button><button type="button" data-fw-color="blue" aria-label="Blue"></button><button type="button" data-fw-color="mint" aria-label="Mint"></button><button type="button" data-fw-color="sage" aria-label="Sage"></button><button type="button" data-fw-color="green" aria-label="Green"></button><button type="button" data-fw-color="lime" aria-label="Lime"></button><button type="button" data-fw-color="orange" aria-label="Orange"></button><button type="button" data-fw-color="tan" aria-label="Tan / Kraft"></button><button type="button" data-fw-color="gray" aria-label="Gray"></button><button type="button" data-fw-color="navy" aria-label="Dark Navy"></button><button type="button" data-fw-color="black" aria-label="Black"></button>
                  </div>
                </div>
              </div>
              <div id="freedomWallTextColorField" class="freedomWallCustomizationField">
                <button class="freedomWallCustomizerTrigger" type="button" data-fw-customizer-toggle="text" aria-expanded="false" aria-controls="freedomWallTextColorOptions">
                  <span id="freedomWallTextColorLabel">Text Color</span>
                  <span class="freedomWallCustomizerValue"><i id="freedomWallTextColorPreview" class="freedomWallCustomizerColorPreview" aria-hidden="true"></i><b id="freedomWallTextColorValue">Charcoal</b><em aria-hidden="true">⌄</em></span>
                </button>
                <div id="freedomWallTextColorOptions" class="freedomWallCustomizerOptions" data-fw-customizer-panel="text" hidden>
                  <div class="freedomWallCustomizerOptionsHead"><strong>Choose Text Color</strong><button type="button" data-fw-customizer-close aria-label="Close text color choices">×</button></div>
                  <div class="freedomWallTextColorRow freedomWallSwatchRow" aria-label="Text color">
                    <button type="button" data-fw-text-color="black" aria-label="Black"></button><button type="button" data-fw-text-color="charcoal" class="is-selected" aria-label="Charcoal"></button><button type="button" data-fw-text-color="white" aria-label="White"></button><button type="button" data-fw-text-color="navy" aria-label="Navy"></button><button type="button" data-fw-text-color="blue" aria-label="Blue"></button><button type="button" data-fw-text-color="red" aria-label="Red"></button><button type="button" data-fw-text-color="maroon" aria-label="Maroon"></button><button type="button" data-fw-text-color="green" aria-label="Green"></button><button type="button" data-fw-text-color="brown" aria-label="Brown"></button><button type="button" data-fw-text-color="purple" aria-label="Purple"></button><button type="button" data-fw-text-color="pink" aria-label="Pink"></button><button type="button" data-fw-text-color="orange" aria-label="Orange"></button><button type="button" data-fw-text-color="gold" aria-label="Gold"></button>
                  </div>
                  <small id="freedomWallContrastHint" class="freedomWallCustomizationHint">Low-contrast combinations are adjusted automatically for readability.</small>
                </div>
              </div>
              <div id="freedomWallFontField" class="freedomWallCustomizationField">
                <button class="freedomWallCustomizerTrigger" type="button" data-fw-customizer-toggle="font" aria-expanded="false" aria-controls="freedomWallFontOptions">
                  <span id="freedomWallFontLabel">Font</span>
                  <span class="freedomWallCustomizerValue"><b id="freedomWallFontValue">Theme Default</b><em aria-hidden="true">⌄</em></span>
                </button>
                <div id="freedomWallFontOptions" class="freedomWallCustomizerOptions" data-fw-customizer-panel="font" hidden>
                  <div class="freedomWallCustomizerOptionsHead"><strong>Choose Font</strong><button type="button" data-fw-customizer-close aria-label="Close font choices">×</button></div>
                  <div class="freedomWallFontGrid" role="group" aria-label="Note font">
                    <button type="button" data-fw-font="theme-default" class="is-selected">Theme Default</button><button type="button" data-fw-font="clean">Clean</button><button type="button" data-fw-font="rounded">Rounded</button><button type="button" data-fw-font="handwritten">Handwritten</button><button type="button" data-fw-font="marker">Marker</button><button type="button" data-fw-font="classic-serif">Classic Serif</button><button type="button" data-fw-font="typewriter">Typewriter</button><button type="button" data-fw-font="comic">Comic</button><button type="button" data-fw-font="bold-poster">Bold Poster</button><button type="button" data-fw-font="elegant">Elegant</button><button type="button" data-fw-font="casual">Casual</button><button type="button" data-fw-font="monospace">Monospace / Coding</button>
                  </div>
                </div>
              </div>
            </div>
            <div id="freedomWallCustomizerBackdrop" class="freedomWallCustomizerBackdrop" hidden aria-hidden="true"></div>
          </section>
          </div>
          <div class="freedomWallComposerFooter"><span id="freedomWallComposerStatus" role="status"></span><button id="freedomWallPostBtn" type="submit">Post Note</button></div>
        </form>
      </div>

      <div id="freedomWallMediaSearchModal" class="freedomWallMediaSearchModal" hidden>
        <section class="freedomWallMediaSearchDialog" role="dialog" aria-modal="true" aria-labelledby="freedomWallMediaSearchModalTitle">
          <div class="freedomWallMediaSearchDialogHead">
            <div><strong id="freedomWallMediaSearchModalTitle">Media Search</strong><span id="freedomWallMediaSearchModalHint">Search and choose one result.</span></div>
            <button id="freedomWallMediaSearchModalClose" type="button" aria-label="Close media search">×</button>
          </div>
          <div class="freedomWallMediaSearchDialogBar">
            <input id="freedomWallMediaSearchModalInput" type="search" autocomplete="off" placeholder="Search..." />
            <button id="freedomWallMediaSearchModalBtn" type="button">Search</button>
          </div>
          <div id="freedomWallMediaSearchModalStatus" class="freedomWallMediaSearchModalStatus" role="status"></div>
          <div id="freedomWallMediaSearchModalResults" class="freedomWallMediaSearchModalResults"></div>
        </section>
      </div>
    </div>

    <div class="homepageEffectContent" role="status" aria-live="polite">
      <div class="homepageEffectWeatherMessage">
        <strong id="homepageEffectWeatherTitle"></strong>
        <span id="homepageEffectWeatherMessage"></span>
      </div>
      <figure class="homepageEffectPicturePanel">
        <button id="homepageEffectGalleryPrev" class="homepageEffectGalleryNav is-prev" type="button" aria-label="Previous picture">‹</button>
        <div id="homepageEffectGalleryViewport" class="homepageEffectGalleryViewport" tabindex="0" aria-label="ClassBoard picture gallery">
          <div id="homepageEffectGalleryTrack" class="homepageEffectGalleryTrack"></div>
        </div>
        <button id="homepageEffectGalleryNext" class="homepageEffectGalleryNav is-next" type="button" aria-label="Next picture">›</button>
        <div id="homepageEffectStoryProgress" class="homepageEffectStoryProgress" aria-hidden="true"></div>
        <div id="homepageEffectGalleryCount" class="homepageEffectGalleryCount" aria-live="polite"></div>
        <figcaption id="homepageEffectPictureCaption"></figcaption>
      </figure>
      <section class="homepageEffectYouTubePanel" aria-label="ClassBoard YouTube video">
        <div class="homepageEffectYouTubePlayer">
          <iframe id="homepageEffectYouTubeFrame" title="ClassBoard YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" hidden></iframe>
          <div id="homepageEffectYouTubeEmpty" class="homepageEffectYouTubeEmpty" hidden>Unable to load the YouTube video.</div>
        </div>
      </section>
      <section class="homepageEffectRickrollPanel" aria-label="ClassBoard prank display">
        <div id="homepageRickrollBait" class="homepageRickrollBait">
          <div class="homepageRickrollFakeWindow">
            <div class="homepageRickrollFakeBar"><span>ClassBoard Display</span><span>•••</span></div>
            <div class="homepageRickrollFakeBody">
              <div class="homepageRickrollFakeIcon">×</div>
              <strong>Exit display?</strong>
              <p>Tap the button below to close this screen.</p>
              <button id="homepageRickrollFakeExit" class="homepageRickrollFakeExit" type="button"><span>×</span> Exit</button>
            </div>
          </div>
        </div>
        <div id="homepageRickrollPlayer" class="homepageRickrollPlayer" hidden>
          <div class="homepageRickrollGotcha" aria-hidden="true">YOU GOT RICKROLLED! <span>😂</span></div>
          <iframe id="homepageRickrollFrame" title="ClassBoard prank video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" hidden></iframe>
          <video id="homepageRickrollVideo" title="ClassBoard prank video" controls playsinline preload="metadata" hidden></video>
        </div>
      </section>
      <section class="homepageEffectAlertPanel" role="alert">
        <div class="homepageEffectAlertIcon">⚠</div>
        <p class="homepageEffectAlertEyebrow">SFK CLASSBOARD ALERT</p>
        <h2 id="homepageEffectAlertTitle">Important Notice</h2>
        <p id="homepageEffectAlertMessage"></p>
      </section>
    </div>
    <button id="homepageEffectClose" class="homepageEffectClose" type="button" aria-label="Dismiss display effect" hidden aria-hidden="true" tabindex="-1" disabled>×</button>
  `;
  document.body.appendChild(layer);
  window.addEventListener("resize", forceHomepageStoryBarViewportV453, { passive: true });
  forceHomepageStoryBarViewportV453();

  layer.querySelector("#freedomWallAddBtn")?.addEventListener("click", openFreedomWallComposer);
  layer.querySelector("#freedomWallReaderOpenBtn")?.addEventListener("click", openFreedomWallReader);
  layer.querySelector("#freedomWallReaderCloseBtn")?.addEventListener("click", closeFreedomWallReader);
  layer.querySelector("#freedomWallReaderPauseBtn")?.addEventListener("click", toggleFreedomWallReaderPause);
  layer.querySelector("#freedomWallReaderPrevBtn")?.addEventListener("click", () => moveFreedomWallReader(-1, { resetTimer:true, source:"button" }));
  layer.querySelector("#freedomWallReaderNextBtn")?.addEventListener("click", () => moveFreedomWallReader(1, { resetTimer:true, source:"button" }));
  setupFreedomWallReaderInteractions(layer);
  layer.querySelector("#freedomWallComposerClose")?.addEventListener("click", closeFreedomWallComposer);
  const freedomWallPromptCloseButton = layer.querySelector("#freedomWallPromptClose");
  if (freedomWallPromptCloseButton) {
    // v544: close on the FIRST valid press. On phones the wall's drag/reaction
    // layers can cancel or steal the later click/touchend after a touch begins.
    // Pointer-down capture makes the prompt X deterministic without changing
    // long-press/right-click behavior on the rest of the prompt or notes.
    const closeFreedomWallPromptImmediately = (event) => {
      if (event?.type === "pointerdown" && event.pointerType === "mouse" && event.button !== 0) return;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      clearFreedomWallPromptReactionPending();
      dismissFreedomWallPromptForView(event);
    };
    freedomWallPromptCloseButton.addEventListener("pointerdown", closeFreedomWallPromptImmediately, { capture:true, passive:false });
    // Old touch-only WebViews that do not expose PointerEvent still get the
    // same immediate close path. Modern phones use pointerdown only, avoiding
    // duplicate touch + pointer handling.
    if (!("PointerEvent" in window)) {
      freedomWallPromptCloseButton.addEventListener("touchstart", closeFreedomWallPromptImmediately, { capture:true, passive:false });
    }
    // Keyboard activation still produces click with detail=0.
    freedomWallPromptCloseButton.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      dismissFreedomWallPromptForView(event);
    });
  }
  layer.querySelector("#freedomWallComposerForm")?.addEventListener("submit", submitFreedomWallNote);
  layer.querySelector("#freedomWallCustomizeToggle")?.addEventListener("click", toggleFreedomWallCustomizePanel);
  layer.querySelectorAll("[data-fw-customizer-toggle]").forEach((button) => button.addEventListener("click", () => toggleFreedomWallCustomizerPanel(button.dataset.fwCustomizerToggle)));
  layer.querySelectorAll("[data-fw-customizer-close]").forEach((button) => button.addEventListener("click", () => closeFreedomWallCustomizerPanel()));
  layer.querySelector("#freedomWallCustomizerBackdrop")?.addEventListener("click", () => closeFreedomWallCustomizerPanel());
  window.addEventListener("resize", () => {
    const openPanel = layer.querySelector('[data-fw-customizer-panel]:not([hidden])');
    if (openPanel) positionFreedomWallCustomizerPanel(openPanel.dataset.fwCustomizerPanel);
  }, { passive: true });
  layer.querySelectorAll("[data-fw-color]").forEach((button) => button.addEventListener("click", () => { selectFreedomWallColor(button.dataset.fwColor); closeFreedomWallCustomizerPanel("background"); }));
  layer.querySelectorAll("[data-fw-text-color]").forEach((button) => button.addEventListener("click", () => { selectFreedomWallTextColor(button.dataset.fwTextColor); closeFreedomWallCustomizerPanel("text"); }));
  layer.querySelectorAll("[data-fw-font]").forEach((button) => button.addEventListener("click", () => { selectFreedomWallFont(button.dataset.fwFont); closeFreedomWallCustomizerPanel("font"); }));
  layer.querySelector("#freedomWallMediaInput")?.addEventListener("change", handleFreedomWallMediaInput);
  layer.querySelector("#freedomWallYouTubeInput")?.addEventListener("change", handleFreedomWallYouTubeInput);
  layer.querySelector("#freedomWallYouTubeInput")?.addEventListener("input", handleFreedomWallYouTubeInput);
  layer.querySelector("#freedomWallMediaType")?.addEventListener("change", (event) => {
    const mode = String(event?.target?.value || "none");
    setFreedomWallAttachmentMode(mode);
    if (mode === "youtube-search") openFreedomWallMediaSearchModal("youtube");
    else if (mode === "gif-search") openFreedomWallMediaSearchModal("gif");
  });
  layer.querySelector("#freedomWallYouTubeSearchBtn")?.addEventListener("click", runFreedomWallYouTubeSearch);
  layer.querySelector("#freedomWallYouTubeSearchInput")?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); runFreedomWallYouTubeSearch(); } });
  layer.querySelector("#freedomWallGifSearchBtn")?.addEventListener("click", runFreedomWallGifSearch);
  layer.querySelector("#freedomWallGifSearchInput")?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); runFreedomWallGifSearch(); } });
  layer.querySelector("#freedomWallMediaSearchModalClose")?.addEventListener("click", closeFreedomWallMediaSearchModal);
  layer.querySelector("#freedomWallMediaSearchModalBtn")?.addEventListener("click", runFreedomWallMediaSearchModalSearch);
  layer.querySelector("#freedomWallMediaSearchModalInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); runFreedomWallMediaSearchModalSearch(); }
    else if (event.key === "Escape") { event.preventDefault(); closeFreedomWallMediaSearchModal(); }
  });
  layer.querySelector("#freedomWallMediaSearchModal")?.addEventListener("pointerdown", (event) => {
    if (event.target?.id === "freedomWallMediaSearchModal") closeFreedomWallMediaSearchModal();
  });
  layer.querySelector("#freedomWallMediaRemove")?.addEventListener("click", (event) => { event.preventDefault(); resetFreedomWallPendingMedia(); });
  layer.querySelector("#freedomWallComposer")?.addEventListener("pointerdown", (event) => {
    if (event.target?.id === "freedomWallComposer") closeFreedomWallComposer();
  });
  layer.querySelector("#freedomWallViewRepliesBtn")?.addEventListener("click", () => {
    const target = freedomWallReactionMenuTarget ? { ...freedomWallReactionMenuTarget } : null;
    if (target?.type === "note") openFreedomWallReplyThread(target.id, { focusComposer:false });
  });
  layer.querySelector("#freedomWallQuickReplyBtn")?.addEventListener("click", () => {
    const target = freedomWallReactionMenuTarget ? { ...freedomWallReactionMenuTarget } : null;
    if (target?.type === "note") openFreedomWallReplyThread(target.id, { focusComposer:true });
  });
  layer.querySelector("#freedomWallReplyClose")?.addEventListener("click", closeFreedomWallReplyThread);
  layer.querySelector("#freedomWallReplyThread")?.addEventListener("pointerdown", (event) => {
    if (event.target?.id === "freedomWallReplyThread") closeFreedomWallReplyThread();
  });
  layer.querySelector("#freedomWallReplyForm")?.addEventListener("submit", submitFreedomWallReply);
  // v535: remember the nickname as soon as it is typed. This lets <sirjr>
  // activate Koala reactions on a fresh device without requiring a login or
  // forcing the user to publish a note first.
  layer.querySelector("#freedomWallAuthorInput")?.addEventListener("input", rememberFreedomWallNicknameInput);
  layer.querySelector("#freedomWallReplyAuthor")?.addEventListener("input", rememberFreedomWallNicknameInput);
  layer.querySelector("#freedomWallReplyCancelParent")?.addEventListener("click", (event) => { event.preventDefault(); clearFreedomWallReplyParent(); });
  layer.querySelector("#freedomWallReplyToReplyBtn")?.addEventListener("click", (event) => { event.preventDefault(); applyFreedomWallReplyActionTarget(); });
  setupFreedomWallReplyInteractions(layer);
  setupFreedomWallNoteDragging(layer);
  setupFreedomWallReactions(layer);

  layer.querySelector("#homepageEffectClose")?.addEventListener("click", dismissHomepageEffectForView);
  layer.querySelector("#homepageRickrollFakeExit")?.addEventListener("click", revealHomepageRickroll);
  layer.querySelector("#homepageEffectGalleryPrev")?.addEventListener("click", () => moveHomepageEffectGallery(-1));
  layer.querySelector("#homepageEffectGalleryNext")?.addEventListener("click", () => moveHomepageEffectGallery(1));
  const galleryViewport = layer.querySelector("#homepageEffectGalleryViewport");
  galleryViewport?.addEventListener("scroll", () => {
    if (homepageEffectGalleryScrollTimer) window.clearTimeout(homepageEffectGalleryScrollTimer);
    homepageEffectGalleryScrollTimer = window.setTimeout(syncHomepageEffectGalleryIndexFromScroll, 70);
  }, { passive: true });
  galleryViewport?.addEventListener("pointerdown", pauseHomepageEffectGalleryStory, { passive: true });
  galleryViewport?.addEventListener("pointerup", resumeHomepageEffectGalleryStory, { passive: true });
  galleryViewport?.addEventListener("pointercancel", resumeHomepageEffectGalleryStory, { passive: true });
  galleryViewport?.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && homepageEffectGalleryStoryPaused) resumeHomepageEffectGalleryStory();
  }, { passive: true });
  galleryViewport?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveHomepageEffectGallery(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveHomepageEffectGallery(1);
    }
  });
  const solarScene = layer.querySelector(".homepageSolarSystemScene");
  const solarInfoCard = layer.querySelector(".solarInfoCard");
  const solarInfoName = layer.querySelector("#solarInfoName");
  const solarInfoOrder = layer.querySelector("#solarInfoOrder");
  const solarInfoType = layer.querySelector("#solarInfoType");
  const solarInfoFact = layer.querySelector("#solarInfoFact");
  const resetSolarSystemPointer = () => {
    layer.style.setProperty("--solar-pointer-x", "0px");
    layer.style.setProperty("--solar-pointer-y", "0px");
    layer.style.setProperty("--solar-tilt-x", "0deg");
    layer.style.setProperty("--solar-tilt-y", "0deg");
  };
  const updateSolarSystemPointer = (event) => {
    if (!layer.classList.contains("is-solar-system")) return;
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    layer.style.setProperty("--solar-pointer-x", `${(nx * 14).toFixed(2)}px`);
    layer.style.setProperty("--solar-pointer-y", `${(ny * 10).toFixed(2)}px`);
    layer.style.setProperty("--solar-tilt-x", `${(ny * -4.2).toFixed(2)}deg`);
    layer.style.setProperty("--solar-tilt-y", `${(nx * 5.2).toFixed(2)}deg`);
  };
  const clearSolarPlanetFocus = () => {
    solarScene?.classList.remove("has-planet-focus");
    layer.querySelectorAll(".solarPlanet.is-solar-selected,.solarSun.is-solar-selected").forEach((item) => item.classList.remove("is-solar-selected"));
    if (solarInfoCard) solarInfoCard.hidden = true;
  };
  const focusSolarObject = (target) => {
    if (!target || !layer.classList.contains("is-solar-system")) return;
    const alreadySelected = target.classList.contains("is-solar-selected");
    clearSolarPlanetFocus();
    if (alreadySelected) return;
    target.classList.add("is-solar-selected");
    solarScene?.classList.add("has-planet-focus");
    if (solarInfoName) solarInfoName.textContent = target.dataset.name || "Solar System";
    if (solarInfoOrder) solarInfoOrder.textContent = target.dataset.order || "Solar System";
    if (solarInfoType) solarInfoType.textContent = target.dataset.type || "";
    if (solarInfoFact) solarInfoFact.textContent = target.dataset.fact || "";
    if (solarInfoCard) solarInfoCard.hidden = false;
  };
  solarScene?.addEventListener("pointermove", updateSolarSystemPointer, { passive: true });
  solarScene?.addEventListener("pointerleave", resetSolarSystemPointer, { passive: true });
  solarScene?.addEventListener("click", (event) => {
    const target = event.target.closest?.(".solarPlanet,.solarSun");
    if (!target) return;
    event.preventDefault();
    focusSolarObject(target);
  });
  layer.querySelector(".solarInfoClose")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearSolarPlanetFocus();
  });
  let petExcitedTimer = 0;
  const dogReactionClasses = ["is-pet-excited", "is-pet-boop", "is-pet-paw", "is-pet-ball", "is-pet-roll"];
  const dogReactionDurations = { "is-pet-excited": 1150, "is-pet-boop": 820, "is-pet-paw": 940, "is-pet-ball": 1020, "is-pet-roll": 980 };
  const clearPetDogReactions = () => dogReactionClasses.forEach((className) => layer.classList.remove(className));
  const resetPetDogLook = () => {
    layer.style.setProperty("--pet-eye-x", "0px");
    layer.style.setProperty("--pet-eye-y", "0px");
    layer.style.setProperty("--pet-head-x", "0px");
    layer.style.setProperty("--pet-head-y", "0px");
    layer.style.setProperty("--pet-head-r", "0deg");
    layer.style.setProperty("--pet-body-x", "0px");
  };
  const updatePetDogLook = (event) => {
    if (!layer.classList.contains("is-pet-dog")) return;
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    layer.style.setProperty("--pet-eye-x", `${(nx * 5.2).toFixed(2)}px`);
    layer.style.setProperty("--pet-eye-y", `${(ny * 3.7).toFixed(2)}px`);
    layer.style.setProperty("--pet-head-x", `${(nx * 9).toFixed(2)}px`);
    layer.style.setProperty("--pet-head-y", `${(ny * 4.5).toFixed(2)}px`);
    layer.style.setProperty("--pet-head-r", `${(nx * 5.5).toFixed(2)}deg`);
    layer.style.setProperty("--pet-body-x", `${(nx * 2.8).toFixed(2)}px`);
  };
  const choosePetDogReaction = (event) => {
    const scene = event?.currentTarget;
    const rect = scene?.getBoundingClientRect?.();
    const rx = rect?.width ? (event.clientX - rect.left) / rect.width : .5;
    const ry = rect?.height ? (event.clientY - rect.top) / rect.height : .5;
    const target = event?.target;
    const hitFace = !!target?.closest?.(".petDogHead,.petDogFace,.petDogEye,.petDogEar,.petDogMuzzle,.petDogNose");
    const hitBall = !!target?.closest?.(".petToyBall");
    const hitPaw = !!target?.closest?.(".petPaw");
    let pool = [];
    if (hitFace || ry < .42) pool = ["is-pet-boop", "is-pet-excited", "is-pet-roll"];
    else if (hitBall || (rx < .30 && ry > .52)) pool = ["is-pet-ball", "is-pet-paw"];
    else if (hitPaw || ry > .72) pool = ["is-pet-paw", "is-pet-roll", "is-pet-excited"];
    else if (rx > .68) pool = ["is-pet-roll", "is-pet-excited"];
    else pool = ["is-pet-excited", "is-pet-boop", "is-pet-paw", "is-pet-ball", "is-pet-roll"];
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const triggerPetDogReaction = (reactionClass) => {
    clearPetDogReactions();
    void layer.offsetWidth;
    layer.classList.add(reactionClass);
    if (petExcitedTimer) window.clearTimeout(petExcitedTimer);
    petExcitedTimer = window.setTimeout(() => {
      clearPetDogReactions();
      petExcitedTimer = 0;
    }, dogReactionDurations[reactionClass] || 1000);
  };
  const excitePetDog = (event) => {
    if (!layer.classList.contains("is-pet-dog")) return;
    if (event?.clientX != null) updatePetDogLook(event);
    triggerPetDogReaction(choosePetDogReaction(event));
  };
  const petScene = layer.querySelector(".homepagePetDogScene");
  petScene?.addEventListener("pointermove", updatePetDogLook, { passive: true });
  petScene?.addEventListener("pointerdown", excitePetDog, { passive: true });
  petScene?.addEventListener("pointerleave", resetPetDogLook, { passive: true });
  let koalaExcitedTimer = 0;
  const resetPetKoalaLook = () => {
    layer.style.setProperty("--koala-eye-x", "0px");
    layer.style.setProperty("--koala-eye-y", "0px");
    layer.style.setProperty("--koala-head-x", "0px");
    layer.style.setProperty("--koala-head-y", "0px");
    layer.style.setProperty("--koala-head-r", "0deg");
    layer.style.setProperty("--koala-body-x", "0px");
    layer.style.setProperty("--koala-forest-x", "0px");
    layer.style.setProperty("--koala-forest-y", "0px");
  };
  const updatePetKoalaLook = (event) => {
    if (!layer.classList.contains("is-pet-koala")) return;
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    layer.style.setProperty("--koala-eye-x", `${(nx * 5.4).toFixed(2)}px`);
    layer.style.setProperty("--koala-eye-y", `${(ny * 3.7).toFixed(2)}px`);
    layer.style.setProperty("--koala-head-x", `${(nx * 8.5).toFixed(2)}px`);
    layer.style.setProperty("--koala-head-y", `${(ny * 4.2).toFixed(2)}px`);
    layer.style.setProperty("--koala-head-r", `${(nx * 6.2).toFixed(2)}deg`);
    layer.style.setProperty("--koala-body-x", `${(nx * 2.2).toFixed(2)}px`);
    layer.style.setProperty("--koala-forest-x", `${(nx * -6).toFixed(2)}px`);
    layer.style.setProperty("--koala-forest-y", `${(ny * -3).toFixed(2)}px`);
  };
  const koalaReactionClasses = ["is-koala-excited", "is-koala-nuzzle", "is-koala-hug-react", "is-koala-wave-react", "is-koala-leaf-react", "is-koala-heart-react"];
  const koalaReactionDurations = { "is-koala-excited": 1250, "is-koala-nuzzle": 880, "is-koala-hug-react": 1120, "is-koala-wave-react": 1080, "is-koala-leaf-react": 1160, "is-koala-heart-react": 980 };
  const clearPetKoalaReactions = () => koalaReactionClasses.forEach((className) => layer.classList.remove(className));
  const choosePetKoalaReaction = (event) => {
    const scene = event?.currentTarget;
    const rect = scene?.getBoundingClientRect?.();
    const rx = rect?.width ? (event.clientX - rect.left) / rect.width : .5;
    const ry = rect?.height ? (event.clientY - rect.top) / rect.height : .5;
    const target = event?.target;
    const hitFace = !!target?.closest?.(".petKoalaHead,.petKoalaFace,.petKoalaEye,.petKoalaEar,.petKoalaNose");
    const hitLeaf = !!target?.closest?.(".petKoalaLeafSnack");
    const hitBody = !!target?.closest?.(".petKoalaBody,.petKoalaBelly,.petKoalaArm");
    let pool = [];
    if (hitFace || ry < .38) pool = ["is-koala-nuzzle", "is-koala-heart-react", "is-koala-excited"];
    else if (hitLeaf || rx > .64) pool = ["is-koala-leaf-react", "is-koala-wave-react"];
    else if (hitBody || (rx > .36 && rx < .64 && ry > .42)) pool = ["is-koala-hug-react", "is-koala-heart-react", "is-koala-excited"];
    else if (rx < .34) pool = ["is-koala-wave-react", "is-koala-excited"];
    else pool = ["is-koala-excited", "is-koala-nuzzle", "is-koala-hug-react", "is-koala-wave-react", "is-koala-leaf-react", "is-koala-heart-react"];
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const triggerPetKoalaReaction = (reactionClass) => {
    clearPetKoalaReactions();
    void layer.offsetWidth;
    layer.classList.add(reactionClass);
    if (koalaExcitedTimer) window.clearTimeout(koalaExcitedTimer);
    koalaExcitedTimer = window.setTimeout(() => {
      clearPetKoalaReactions();
      koalaExcitedTimer = 0;
    }, koalaReactionDurations[reactionClass] || 1100);
  };
  const excitePetKoala = (event) => {
    if (!layer.classList.contains("is-pet-koala")) return;
    if (event?.clientX != null) updatePetKoalaLook(event);
    triggerPetKoalaReaction(choosePetKoalaReaction(event));
  };
  const koalaScene = layer.querySelector(".homepagePetKoalaScene");
  koalaScene?.addEventListener("pointermove", updatePetKoalaLook, { passive: true });
  koalaScene?.addEventListener("pointerdown", excitePetKoala, { passive: true });
  koalaScene?.addEventListener("pointerleave", resetPetKoalaLook, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (layer.hidden) return;
    const replyThreadOpen = Boolean(layer.querySelector("#freedomWallReplyThread") && !layer.querySelector("#freedomWallReplyThread").hidden);
    const reactionMenuOpen = Boolean(layer.querySelector("#freedomWallReactionMenu") && !layer.querySelector("#freedomWallReactionMenu").hidden);
    const readerOpen = isFreedomWallReaderOpen();
    if (readerOpen && !replyThreadOpen && !reactionMenuOpen) {
      if (event.key === "Escape") { event.preventDefault(); closeFreedomWallReader(event); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveFreedomWallReader(-1, { resetTimer:true, source:"keyboard" }); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); moveFreedomWallReader(1, { resetTimer:true, source:"keyboard" }); return; }
      if (event.key === " " || event.key === "Spacebar") { event.preventDefault(); toggleFreedomWallReaderPause(); return; }
    }
    if (event.key === "Escape") {
      if (!homepageEffectDismissAllowed) return;
      dismissHomepageEffectForView();
      return;
    }
    if (layer.classList.contains("is-picture") && event.key === "ArrowLeft") moveHomepageEffectGallery(-1);
    if (layer.classList.contains("is-picture") && event.key === "ArrowRight") moveHomepageEffectGallery(1);
  });
  return layer;
}

function dismissHomepageEffectForView() {
  // Student-side dismissal is allowed only when the Admin explicitly enables it.
  // This guard protects every dismissal path, including keyboard/programmatic triggers.
  if (!homepageEffectDismissAllowed || !homepageEffectCurrentSignature) return;
  homepageEffectDismissedSignature = homepageEffectCurrentSignature;
  hideHomepageEffectLayer();
}

function setFreedomWallPageLock(active) {
  const shouldLock = Boolean(active);
  if (shouldLock === freedomWallPageLockActive) return;

  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  if (shouldLock) {
    freedomWallPageLockActive = true;
    freedomWallPageLockScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
    freedomWallPageLockBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow
    };
    root.classList.add("sfkFreedomWallModalOpen");
    body.style.position = "fixed";
    body.style.top = `-${freedomWallPageLockScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return;
  }

  freedomWallPageLockActive = false;
  root.classList.remove("sfkFreedomWallModalOpen");
  const saved = freedomWallPageLockBodyStyles || {};
  body.style.position = saved.position || "";
  body.style.top = saved.top || "";
  body.style.left = saved.left || "";
  body.style.right = saved.right || "";
  body.style.width = saved.width || "";
  body.style.overflow = saved.overflow || "";
  freedomWallPageLockBodyStyles = null;
  const restoreY = freedomWallPageLockScrollY;
  freedomWallPageLockScrollY = 0;
  window.requestAnimationFrame(() => window.scrollTo(0, restoreY));
}

function hideHomepageEffectLayer() {
  setFreedomWallPageLock(false);
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  homepageEffectRenderToken += 1;
  layer.hidden = true;
  layer.setAttribute("aria-hidden", "true");
  layer.className = "homepageEffectLayer";
  document.documentElement.classList.remove("sfkHomepageEffectActive", "sfkHomepageMultiverseActive", "sfkHomepageSpiderGlitchActive", "sfkHomepageBlackSymbioteActive");
  homepageEffectAmbientMode = "";
  stopFreedomWallLive(true);
  stopHomepageEffectGalleryStory(true);
  homepageEffectGalleryIndex = 0;
  homepageEffectGallerySources = [];
  homepageEffectGalleryRenderSignature = "";
  const galleryTrack = layer.querySelector("#homepageEffectGalleryTrack");
  if (galleryTrack) galleryTrack.innerHTML = "";
  const ambient = layer.querySelector(".homepageEffectParticles");
  if (ambient) ambient.innerHTML = "";
  const solarScene = layer.querySelector(".homepageSolarSystemScene");
  solarScene?.classList.remove("has-planet-focus");
  layer.querySelectorAll(".solarPlanet.is-solar-selected,.solarSun.is-solar-selected").forEach((item) => item.classList.remove("is-solar-selected"));
  const solarInfoCard = layer.querySelector(".solarInfoCard");
  if (solarInfoCard) solarInfoCard.hidden = true;
  layer.style.setProperty("--solar-pointer-x", "0px");
  layer.style.setProperty("--solar-pointer-y", "0px");
  layer.style.setProperty("--solar-tilt-x", "0deg");
  layer.style.setProperty("--solar-tilt-y", "0deg");
  stopHomepageAlertSound();
  stopHomepageEffectMusic();
  clearHomepageEffectYouTube();
  clearHomepageRickroll();
}

function updateHomepageEffectGalleryStoryProgress(progress = null) {
  const layer = document.getElementById("homepageEffectLayer");
  const host = layer?.querySelector("#homepageEffectStoryProgress");
  const count = homepageEffectGallerySources.length;
  if (!host) return;
  forceHomepageStoryBarViewportV453();
  host.hidden = count <= 1;
  if (count <= 1) {
    host.innerHTML = "";
    return;
  }
  if (host.children.length !== count) {
    host.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      const segment = document.createElement("span");
      segment.className = "homepageEffectStorySegment";
      const fill = document.createElement("i");
      segment.appendChild(fill);
      host.appendChild(segment);
    }
  }
  let currentProgress;
  if (progress == null) {
    const elapsed = (!homepageEffectGalleryStoryPaused && homepageEffectGalleryStoryStartedAt)
      ? Math.max(0, performance.now() - homepageEffectGalleryStoryStartedAt)
      : 0;
    const liveRemaining = Math.max(0, homepageEffectGalleryStoryRemainingMs - elapsed);
    currentProgress = Math.max(0, Math.min(1, 1 - (liveRemaining / HOMEPAGE_EFFECT_GALLERY_STORY_MS)));
  } else {
    currentProgress = Math.max(0, Math.min(1, Number(progress) || 0));
  }
  Array.from(host.children).forEach((segment, index) => {
    const fill = segment.firstElementChild;
    if (!fill) return;
    const amount = index < homepageEffectGalleryIndex ? 1 : (index === homepageEffectGalleryIndex ? currentProgress : 0);
    fill.style.transform = `scaleX(${amount})`;
  });
}

function stopHomepageEffectGalleryStory(resetProgress = false) {
  if (homepageEffectGalleryStoryTimer) window.clearTimeout(homepageEffectGalleryStoryTimer);
  if (homepageEffectGalleryProgressFrame) window.cancelAnimationFrame(homepageEffectGalleryProgressFrame);
  homepageEffectGalleryStoryTimer = 0;
  homepageEffectGalleryProgressFrame = 0;
  homepageEffectGalleryStoryStartedAt = 0;
  homepageEffectGalleryStoryPaused = false;
  if (resetProgress) {
    homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
    homepageEffectGalleryStorySignature = "";
    updateHomepageEffectGalleryStoryProgress(0);
  }
}

function tickHomepageEffectGalleryStoryProgress() {
  homepageEffectGalleryProgressFrame = 0;
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || layer.hidden || !layer.classList.contains("is-picture") || homepageEffectGalleryStoryPaused || homepageEffectGallerySources.length <= 1) return;
  const elapsed = Math.max(0, performance.now() - homepageEffectGalleryStoryStartedAt);
  const remaining = Math.max(0, homepageEffectGalleryStoryRemainingMs - elapsed);
  const progress = 1 - (remaining / HOMEPAGE_EFFECT_GALLERY_STORY_MS);
  updateHomepageEffectGalleryStoryProgress(progress);
  if (remaining > 0) homepageEffectGalleryProgressFrame = window.requestAnimationFrame(tickHomepageEffectGalleryStoryProgress);
}

function startHomepageEffectGalleryStory(reset = true, signature = homepageEffectGalleryStorySignature) {
  stopHomepageEffectGalleryStory(false);
  homepageEffectGalleryStorySignature = String(signature || homepageEffectGalleryStorySignature || homepageEffectCurrentSignature || "picture");
  if (reset) homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || layer.hidden || !layer.classList.contains("is-picture") || homepageEffectGallerySources.length <= 1) {
    updateHomepageEffectGalleryStoryProgress(0);
    return;
  }
  homepageEffectGalleryStoryPaused = false;
  homepageEffectGalleryStoryStartedAt = performance.now();
  homepageEffectGalleryStoryTimer = window.setTimeout(() => {
    homepageEffectGalleryStoryTimer = 0;
    homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
    showHomepageEffectGalleryIndex((homepageEffectGalleryIndex + 1) % homepageEffectGallerySources.length, true, true);
  }, Math.max(80, homepageEffectGalleryStoryRemainingMs));
  updateHomepageEffectGalleryStoryProgress(reset ? 0 : 1 - (homepageEffectGalleryStoryRemainingMs / HOMEPAGE_EFFECT_GALLERY_STORY_MS));
  homepageEffectGalleryProgressFrame = window.requestAnimationFrame(tickHomepageEffectGalleryStoryProgress);
}

function pauseHomepageEffectGalleryStory() {
  if (homepageEffectGalleryStoryPaused || homepageEffectGallerySources.length <= 1) return;
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || layer.hidden || !layer.classList.contains("is-picture")) return;
  const elapsed = homepageEffectGalleryStoryStartedAt ? Math.max(0, performance.now() - homepageEffectGalleryStoryStartedAt) : 0;
  homepageEffectGalleryStoryRemainingMs = Math.max(0, homepageEffectGalleryStoryRemainingMs - elapsed);
  if (homepageEffectGalleryStoryTimer) window.clearTimeout(homepageEffectGalleryStoryTimer);
  if (homepageEffectGalleryProgressFrame) window.cancelAnimationFrame(homepageEffectGalleryProgressFrame);
  homepageEffectGalleryStoryTimer = 0;
  homepageEffectGalleryProgressFrame = 0;
  homepageEffectGalleryStoryPaused = true;
  updateHomepageEffectGalleryStoryProgress(1 - (homepageEffectGalleryStoryRemainingMs / HOMEPAGE_EFFECT_GALLERY_STORY_MS));
}

function resumeHomepageEffectGalleryStory() {
  if (!homepageEffectGalleryStoryPaused) return;
  homepageEffectGalleryStoryPaused = false;
  if (homepageEffectGalleryStoryRemainingMs <= 0) {
    homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
    showHomepageEffectGalleryIndex((homepageEffectGalleryIndex + 1) % homepageEffectGallerySources.length, true, true);
    return;
  }
  startHomepageEffectGalleryStory(false, homepageEffectGalleryStorySignature);
}

function updateHomepageEffectGalleryControls() {
  const layer = ensureHomepageEffectLayer();
  const count = homepageEffectGallerySources.length;
  const prev = layer.querySelector("#homepageEffectGalleryPrev");
  const next = layer.querySelector("#homepageEffectGalleryNext");
  const label = layer.querySelector("#homepageEffectGalleryCount");
  if (prev) prev.hidden = count <= 1;
  if (next) next.hidden = count <= 1;
  if (label) {
    label.hidden = count <= 1;
    label.textContent = count ? `${homepageEffectGalleryIndex + 1} / ${count}` : "";
  }
  if (prev) prev.disabled = count <= 1;
  if (next) next.disabled = count <= 1;
  updateHomepageEffectGalleryStoryProgress();
}

function showHomepageEffectGalleryIndex(index, smooth = true, restartStory = true) {
  const layer = ensureHomepageEffectLayer();
  const viewport = layer.querySelector("#homepageEffectGalleryViewport");
  const count = homepageEffectGallerySources.length;
  if (!viewport || !count) return;
  homepageEffectGalleryIndex = ((Number(index) || 0) % count + count) % count;
  const width = viewport.clientWidth || viewport.getBoundingClientRect().width || 1;
  viewport.scrollTo({ left: width * homepageEffectGalleryIndex, behavior: smooth ? "smooth" : "auto" });
  if (restartStory) {
    homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
    startHomepageEffectGalleryStory(true, homepageEffectGalleryStorySignature || homepageEffectCurrentSignature);
  }
  updateHomepageEffectGalleryControls();
}

function moveHomepageEffectGallery(direction) {
  const count = homepageEffectGallerySources.length;
  if (count <= 1) return;
  showHomepageEffectGalleryIndex(homepageEffectGalleryIndex + Number(direction || 0), true, true);
}

function syncHomepageEffectGalleryIndexFromScroll() {
  homepageEffectGalleryScrollTimer = 0;
  const layer = document.getElementById("homepageEffectLayer");
  const viewport = layer?.querySelector("#homepageEffectGalleryViewport");
  if (!viewport || !homepageEffectGallerySources.length) return;
  const width = viewport.clientWidth || viewport.getBoundingClientRect().width || 1;
  const nextIndex = Math.max(0, Math.min(homepageEffectGallerySources.length - 1, Math.round(viewport.scrollLeft / width)));
  const changed = nextIndex !== homepageEffectGalleryIndex;
  homepageEffectGalleryIndex = nextIndex;
  updateHomepageEffectGalleryControls();
  if (changed) {
    homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
    startHomepageEffectGalleryStory(true, homepageEffectGalleryStorySignature || homepageEffectCurrentSignature);
  }
}

async function renderHomepageEffectPictureGallery(config, token) {
  const layer = ensureHomepageEffectLayer();
  const track = layer.querySelector("#homepageEffectGalleryTrack");
  const viewport = layer.querySelector("#homepageEffectGalleryViewport");
  if (!track || !viewport) return;

  if (homepageEffectGalleryRenderSignature === config.signature && homepageEffectGallerySources.length) {
    homepageEffectGalleryStorySignature = config.signature;
    updateHomepageEffectGalleryControls();
    if (!homepageEffectGalleryStoryTimer && !homepageEffectGalleryStoryPaused) {
      startHomepageEffectGalleryStory(false, config.signature);
    }
    return;
  }

  stopHomepageEffectGalleryStory(true);
  homepageEffectGalleryIndex = 0;
  homepageEffectGallerySources = [];
  homepageEffectGalleryRenderSignature = "";
  track.innerHTML = '<div class="homepageEffectGalleryLoading">Loading picture gallery…</div>';
  updateHomepageEffectGalleryControls();

  const rawImages = Array.isArray(config.images) ? config.images.slice(0, 12) : [];
  const resolved = await Promise.all(rawImages.map(async (value) => {
    try {
      const source = await resolveHomepageEffectImageSource(value);
      return source ? { raw: value, source } : null;
    } catch (error) {
      return null;
    }
  }));
  if (token !== homepageEffectRenderToken || homepageEffectCurrentSignature !== config.signature) return;

  const valid = resolved.filter(Boolean);
  homepageEffectGallerySources = valid;
  track.innerHTML = "";

  if (!valid.length) {
    const empty = document.createElement("div");
    empty.className = "homepageEffectGalleryEmpty";
    empty.textContent = "No picture is available for this display.";
    track.appendChild(empty);
    updateHomepageEffectGalleryControls();
    return;
  }

  valid.forEach((item, index) => {
    const slide = document.createElement("div");
    slide.className = "homepageEffectGallerySlide";
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-label", `Picture ${index + 1} of ${valid.length}`);
    const image = document.createElement("img");
    image.src = classBoardMediaDisplayUrl(item.source, item.raw || `${config.signature}-${index}`);
    image.alt = config.title ? `${config.title} — picture ${index + 1}` : `ClassBoard picture ${index + 1}`;
    image.loading = index === 0 ? "eager" : "lazy";
    slide.appendChild(image);
    track.appendChild(slide);
  });

  viewport.scrollLeft = 0;
  homepageEffectGalleryRenderSignature = config.signature;
  homepageEffectGalleryStorySignature = config.signature;
  homepageEffectGalleryStoryRemainingMs = HOMEPAGE_EFFECT_GALLERY_STORY_MS;
  updateHomepageEffectGalleryControls();
  startHomepageEffectGalleryStory(true, config.signature);
}

function buildHomepageRain(mode) {
  const layer = ensureHomepageEffectLayer();
  const rain = layer.querySelector(".homepageEffectRain");
  if (!rain || homepageEffectParticleMode === mode) return;
  homepageEffectParticleMode = mode;
  rain.innerHTML = "";

  const count = mode === "drizzle" ? 52 : (mode === "flood-rain" ? 148 : (mode === "heavy-rain" ? 132 : 164));
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const drop = document.createElement("i");
    const left = Math.random() * 112 - 6;
    const delay = -(Math.random() * 2.8);
    const duration = mode === "drizzle"
      ? 1.05 + Math.random() * .85
      : .48 + Math.random() * .42;
    const length = mode === "drizzle"
      ? 18 + Math.random() * 20
      : 28 + Math.random() * 40;
    const opacity = mode === "drizzle"
      ? .18 + Math.random() * .32
      : .34 + Math.random() * .48;
    drop.style.setProperty("--rain-left", `${left}%`);
    drop.style.setProperty("--rain-delay", `${delay}s`);
    drop.style.setProperty("--rain-duration", `${duration}s`);
    drop.style.setProperty("--rain-length", `${length}px`);
    drop.style.setProperty("--rain-opacity", String(opacity));
    fragment.appendChild(drop);
  }
  rain.appendChild(fragment);
}

function buildHomepageAmbientParticles(mode) {
  const layer = ensureHomepageEffectLayer();
  const host = layer.querySelector(".homepageEffectParticles");
  if (!host || homepageEffectAmbientMode === mode) return;
  homepageEffectAmbientMode = mode;
  host.innerHTML = "";

  const configs = {
    fog: { count: 9, kind: "fog" },
    snow: { count: 92, kind: "snow" },
    confetti: { count: 88, kind: "confetti" },
    hearts: { count: 46, kind: "hearts" },
    stars: { count: 110, kind: "stars" },
    matrix: { count: 54, kind: "matrix" },
    bubbles: { count: 44, kind: "bubbles" },
    fireflies: { count: 118, kind: "fireflies" },
    minions: { count: 10, kind: "minions" },
    spongebob: { count: 24, kind: "spongebob" },
    naruto: { count: 18, kind: "naruto" },
    akatsuki: { count: 12, kind: "akatsuki" },
    "ninja-night": { count: 14, kind: "ninja-night" },
    "neon-pulse": { count: 18, kind: "neon" },
    "spider-glitch": { count: 58, kind: "spider-glitch" },
    "comic-web": { count: 38, kind: "comic-web" },
    "black-symbiote": { count: 72, kind: "black-symbiote" },
    "portal-rift": { count: 42, kind: "portal-rift" },
    aurora: { count: 12, kind: "aurora" },
    galaxy: { count: 150, kind: "galaxy" },
    "solar-system": { count: 138, kind: "solar-system" },
    meteors: { count: 30, kind: "meteors" },
    "laser-grid": { count: 28, kind: "laser-grid" },
    crt: { count: 45, kind: "crt" },
    "pixel-storm": { count: 84, kind: "pixel-storm" },
    prism: { count: 34, kind: "prism" },
    petals: { count: 58, kind: "petals" },
    "gold-sparkle": { count: 92, kind: "gold-sparkle" }
  };
  const config = configs[mode];
  if (!config) return;

  const fragment = document.createDocumentFragment();
  const matrixChars = "01SFKKINDNESS2627";
  for (let index = 0; index < config.count; index += 1) {
    const particle = document.createElement("span");
    particle.className = `homepageAmbientParticle is-${config.kind}`;
    particle.style.setProperty("--fx-x", `${Math.random() * 100}%`);
    particle.style.setProperty("--fx-y", `${Math.random() * 100}%`);
    particle.style.setProperty("--fx-delay", `${-(Math.random() * 9).toFixed(2)}s`);
    particle.style.setProperty("--fx-duration", `${(3.8 + Math.random() * 8.4).toFixed(2)}s`);
    particle.style.setProperty("--fx-size", `${(5 + Math.random() * 22).toFixed(1)}px`);
    const drift = -80 + Math.random() * 160;
    particle.style.setProperty("--fx-drift", `${drift.toFixed(0)}px`);
    particle.style.setProperty("--fx-drift-mid", `${(drift * .55).toFixed(0)}px`);
    particle.style.setProperty("--fx-drift-back", `${(drift * -.45).toFixed(0)}px`);
    particle.style.setProperty("--fx-rotate", `${(-180 + Math.random() * 360).toFixed(0)}deg`);
    particle.style.setProperty("--fx-hue", `${Math.floor(Math.random() * 360)}deg`);
    particle.style.setProperty("--fx-alpha", `${(.28 + Math.random() * .62).toFixed(2)}`);

    if (config.kind === "hearts") particle.textContent = Math.random() > .25 ? "♥" : "♡";
    if (config.kind === "matrix") {
      const length = 5 + Math.floor(Math.random() * 10);
      let text = "";
      for (let i = 0; i < length; i += 1) text += matrixChars[Math.floor(Math.random() * matrixChars.length)] + "\n";
      particle.textContent = text.trim();
    }
    if (config.kind === "stars" || config.kind === "galaxy" || config.kind === "solar-system") particle.textContent = Math.random() > .76 ? "✦" : "•";
    if (config.kind === "fireflies" || config.kind === "gold-sparkle") particle.textContent = Math.random() > .65 ? "✦" : "•";
    if (config.kind === "minions") particle.textContent = ["🍌", "◎", "✦"][Math.floor(Math.random() * 3)];
    if (config.kind === "spongebob") particle.textContent = ["🫧", "✿", "★", "⬜"][Math.floor(Math.random() * 4)];
    if (config.kind === "naruto") particle.textContent = ["🌀", "🍃", "✦", "•"][Math.floor(Math.random() * 4)];
    if (config.kind === "akatsuki") particle.textContent = ["☁", "✦", "●"][Math.floor(Math.random() * 3)];
    if (config.kind === "ninja-night") particle.textContent = ["✥", "✦", "•"][Math.floor(Math.random() * 3)];
    if (config.kind === "comic-web") particle.textContent = Math.random() > .72 ? "✦" : "";
    if (config.kind === "spider-glitch") particle.textContent = Math.random() > .86 ? "◆" : "";
    if (config.kind === "black-symbiote") particle.textContent = "";
    if (config.kind === "petals") particle.textContent = "❀";
    if (config.kind === "pixel-storm") particle.textContent = "■";
    if (config.kind === "crt") particle.textContent = Math.random() > .5 ? "▮" : "·";
    fragment.appendChild(particle);
  }
  host.appendChild(fragment);
}

function renderHomepageEffectText(config) {
  const layer = ensureHomepageEffectLayer();
  const weatherTitle = layer.querySelector("#homepageEffectWeatherTitle");
  const weatherMessage = layer.querySelector("#homepageEffectWeatherMessage");
  const weatherBox = layer.querySelector(".homepageEffectWeatherMessage");
  const pictureCaption = layer.querySelector("#homepageEffectPictureCaption");
  const alertTitle = layer.querySelector("#homepageEffectAlertTitle");
  const alertMessage = layer.querySelector("#homepageEffectAlertMessage");

  if (weatherTitle) weatherTitle.textContent = config.title;
  if (weatherMessage) weatherMessage.textContent = config.message;
  if (weatherBox) weatherBox.hidden = config.mode === "alert" || config.mode === "picture" || config.mode === "youtube" || config.mode === "rickroll" || config.mode === "freedom-wall" || !(config.title || config.message);
  if (pictureCaption) {
    pictureCaption.textContent = [config.title, config.message].filter(Boolean).join(" — ");
    pictureCaption.hidden = !(config.title || config.message);
  }
  if (alertTitle) alertTitle.textContent = config.title || "Important Notice";
  if (alertMessage) alertMessage.textContent = config.message || "Please check the latest ClassBoard advisory.";
}

async function resolveHomepageEffectImageSource(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https:\/\//i.test(raw) || /^data:image\//i.test(raw) || /^blob:/i.test(raw)) return raw;
  if (typeof parseClassBoardMediaRef === "function" && parseClassBoardMediaRef(raw)) {
    return await resolveClassBoardMediaDataUrlWithRetryV7(raw, 6) || "";
  }
  return "";
}



function getFreedomWallDeviceId() {
  const key = "sfkFreedomWallDeviceIdV454";
  try {
    let id = String(localStorage.getItem(key) || "").trim();
    if (!id) {
      id = `fw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
      localStorage.setItem(key, id);
    }
    return id.slice(0, 80);
  } catch (error) {
    return `fw_${Math.random().toString(36).slice(2,12)}`;
  }
}

function getFreedomWallSavedAuthor() {
  try { return String(localStorage.getItem("sfkFreedomWallAuthorV454") || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH); }
  catch (error) { return ""; }
}

function saveFreedomWallAuthor(value) {
  const name = String(value || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
  if (!name) return;
  try { localStorage.setItem("sfkFreedomWallAuthorV454", name); } catch (error) {}
}

function isFreedomWallSirJRNickname(value) {
  return String(value || "").trim().toLowerCase() === FREEDOM_WALL_SIRJR_NICKNAME;
}

function isCurrentFreedomWallSirJR() {
  return isFreedomWallSirJRNickname(getFreedomWallSavedAuthor());
}

function getFreedomWallPublicAuthor(value, isSirJR = isFreedomWallSirJRNickname(value)) {
  return isSirJR ? FREEDOM_WALL_SIRJR_DISPLAY_NAME : String(value || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
}

function normalizeFreedomWallSirJRReactions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  Object.entries(value).forEach(([deviceId, reaction]) => {
    const id = String(deviceId || "").trim().slice(0, 80);
    const type = String(reaction || "").trim().toLowerCase();
    if (/^fw_[A-Za-z0-9_]+$/.test(id) && FREEDOM_WALL_REACTION_TYPES.includes(type)) out[id] = type;
  });
  return out;
}

function hasFreedomWallSirJRReaction(note) {
  return Boolean(note && Object.keys(normalizeFreedomWallSirJRReactions(note.sirJRReactions || note.SirJRReactions || {})).length);
}

function rememberFreedomWallNicknameInput(event) {
  const value = String(event?.target?.value || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
  if (value) saveFreedomWallAuthor(value);
}

function freedomWallHash(value) {
  let hash = 2166136261;
  const text = String(value || "freedom-wall");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function freedomWallSafeNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function getFreedomWallPlacement(note = {}, index = 0) {
  const seed = freedomWallHash(note.id || note.ID || `${note.Text || "note"}-${index}`);
  const xFallback = 6 + ((seed % 8800) / 100);
  const yFallback = 12 + (((seed >>> 7) % 7800) / 100);
  const rotationPresets = [-11.5, -8, -5.5, -3, -1.2, 0, 1.5, 3.5, 6, 8.5, 11.5];
  const rotationFallback = rotationPresets[(seed >>> 13) % rotationPresets.length] + ((((seed >>> 17) % 120) / 100) - .6);
  const scaleFallback = .88 + (((seed >>> 19) % 230) / 1000);
  return {
    x: freedomWallSafeNumber(note.X, xFallback, 4, 96),
    y: freedomWallSafeNumber(note.Y, yFallback, 10, 92),
    rotation: freedomWallSafeNumber(note.Rotation, rotationFallback, -13, 13),
    scale: freedomWallSafeNumber(note.Scale, scaleFallback, .84, 1.14)
  };
}

function getFreedomWallNoteSizeClass(note = {}) {
  if (note.mediaRef || note.MediaRef || note.youtubeUrl || note.YouTubeUrl || note.gif?.url || note.GifUrl || note.spotify?.url || note.SpotifyUrl) return "medium";
  const length = String(note.text || note.Text || "").trim().length;
  const lines = String(note.text || note.Text || "").split(/\n/).length;
  const score = length + Math.max(0, lines - 1) * 18;
  if (score <= 26) return "compact";
  if (score <= 72) return "small";
  if (score <= 145) return "medium";
  return "large";
}

function isFreedomWallPromptVisible() {
  const card = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
  return Boolean(card && !card.hidden);
}

function getFreedomWallDisplayPlacement(note = {}, index = 0) {
  let x = Number(note.x) || 50;
  let y = Number(note.y) || 50;
  const rotation = Number(note.rotation) || 0;
  const scale = Number(note.scale) || 1;
  if (!isFreedomWallPromptVisible()) return { x, y, rotation, scale };

  const seed = freedomWallHash(note.id || `${note.text || "note"}-${index}`);
  const narrow = window.matchMedia?.("(max-width:700px)")?.matches;
  if (narrow) {
    // On phones the centered prompt is almost the full width, so keep notes
    // above or below it until the viewer closes the prompt.
    if (y > 27 && y < 74) {
      const placeAbove = (seed % 2) === 0;
      y = placeAbove ? 13 + ((seed >>> 4) % 1300) / 100 : 77 + ((seed >>> 4) % 1200) / 100;
      x = 12 + ((seed >>> 10) % 7600) / 100;
    }
  } else {
    // Reserve a generous central reading lane for the Admin prompt. Notes use
    // top/bottom/left/right zones rather than sitting behind the prompt card.
    if (x > 22 && x < 78 && y > 27 && y < 73) {
      const zone = (seed >>> 5) % 4;
      if (zone === 0) { x = 7 + ((seed >>> 9) % 1300) / 100; y = 24 + ((seed >>> 15) % 4800) / 100; }
      else if (zone === 1) { x = 80 + ((seed >>> 9) % 1300) / 100; y = 24 + ((seed >>> 15) % 4800) / 100; }
      else if (zone === 2) { x = 18 + ((seed >>> 9) % 6400) / 100; y = 12 + ((seed >>> 15) % 1100) / 100; }
      else { x = 18 + ((seed >>> 9) % 6400) / 100; y = 78 + ((seed >>> 15) % 1000) / 100; }
    }
  }
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(10, Math.min(92, y)), rotation, scale };
}

function createFreedomWallPostingPlacement() {
  const promptVisible = isFreedomWallPromptVisible();
  const narrow = window.matchMedia?.("(max-width:700px)")?.matches;
  // Keep saved values inside the already-published v454 Firestore rule limits.
  const rotationPresets = [-9.2, -7.2, -5, -2.5, 0, 2, 4.5, 7, 9.2];
  let x;
  let y;
  if (promptVisible && narrow) {
    const top = Math.random() < .5;
    x = 12 + Math.random() * 76;
    y = top ? 13 + Math.random() * 13 : 77 + Math.random() * 12;
  } else if (promptVisible) {
    const zones = [
      [6, 19, 20, 70], [81, 94, 20, 70],
      [16, 84, 13, 24], [16, 84, 77, 89]
    ];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    x = zone[0] + Math.random() * (zone[1] - zone[0]);
    y = zone[2] + Math.random() * (zone[3] - zone[2]);
  } else {
    x = 6 + Math.random() * 88;
    y = 13 + Math.random() * 76;
  }
  const baseRotation = rotationPresets[Math.floor(Math.random() * rotationPresets.length)];
  return {
    x: +x.toFixed(2),
    y: +y.toFixed(2),
    rotation: +Math.max(-9.8, Math.min(9.8, baseRotation + (Math.random() - .5) * 1.2)).toFixed(2),
    scale: +(.88 + Math.random() * .23).toFixed(3)
  };
}


function getFreedomWallVisualRotation(note = {}, index = 0) {
  const seed = freedomWallHash(note.id || `${note.text || note.Text || "note"}-${index}`);
  // v457: balanced left/right/straight angles. We intentionally do not rely
  // only on the saved Rotation value so a batch of notes can never all look
  // tilted toward the same side by chance.
  const presets = [-12.5, 8.5, -6.5, 3.2, 0, 11.2, -9.2, 5.6, -3.4, 13.2, 1.5, -10.8, 7.1, -1.6];
  const base = presets[(seed + index * 5) % presets.length];
  const jitter = ((((seed >>> 11) % 120) / 100) - .6);
  return Math.max(-14, Math.min(14, base + jitter));
}

function getFreedomWallVisualSkew(note = {}, index = 0) {
  const seed = freedomWallHash(`${note.id || "note"}-skew-${index}`);
  const presets = [-1.25, -.7, -.25, 0, .35, .8, 1.15];
  return presets[(seed + index * 3) % presets.length];
}

function expandFreedomWallRect(rect, pad = 0) {
  return {
    left: rect.left - pad,
    top: rect.top - pad,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2
  };
}

function freedomWallOverlapArea(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function getFreedomWallReservedRects(layer, stageRect) {
  const reserved = [];
  const addReserved = (element, pad) => {
    if (!element || element.hidden) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    reserved.push(expandFreedomWallRect(rect, pad));
  };
  // The prompt is the most important safe zone: notes never cover it while it
  // is visible. Also keep the wall identity and + button readable while space
  // still exists elsewhere.
  addReserved(layer?.querySelector("#freedomWallPromptCard"), 18);
  addReserved(layer?.querySelector(".freedomWallBrand"), 10);
  addReserved(layer?.querySelector("#freedomWallAddBtn"), 10);
  return reserved.filter((rect) => rect.right > stageRect.left && rect.left < stageRect.right && rect.bottom > stageRect.top && rect.top < stageRect.bottom);
}

function getFreedomWallCandidateRect(stageRect, centerX, centerY, width, height, rotation, scale = 1) {
  const rad = Math.abs(Number(rotation) || 0) * Math.PI / 180;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const rotatedWidth = Math.abs(scaledWidth * Math.cos(rad)) + Math.abs(scaledHeight * Math.sin(rad));
  const rotatedHeight = Math.abs(scaledWidth * Math.sin(rad)) + Math.abs(scaledHeight * Math.cos(rad));
  const left = stageRect.left + centerX - rotatedWidth / 2;
  const top = stageRect.top + centerY - rotatedHeight / 2;
  return { left, top, right: left + rotatedWidth, bottom: top + rotatedHeight, width: rotatedWidth, height: rotatedHeight };
}

function findFreedomWallSmartPlacement(card, note, index, occupiedRects, reservedRects) {
  const stage = card?.parentElement;
  const stageRect = stage?.getBoundingClientRect();
  if (!stageRect || !stageRect.width || !stageRect.height) {
    const fallback = getFreedomWallDisplayPlacement(note, index);
    return { ...fallback, rotation: getFreedomWallVisualRotation(note, index), skew: getFreedomWallVisualSkew(note, index) };
  }

  const narrow = window.matchMedia?.("(max-width:700px)")?.matches;
  const seed = freedomWallHash(`${note.id || "note"}-smart-${index}`);
  const rotation = getFreedomWallVisualRotation(note, index);
  const skew = getFreedomWallVisualSkew(note, index);
  const scale = Math.max(.84, Math.min(1.14, Number(note.scale) || 1));
  const width = Math.max(74, card.offsetWidth || card.getBoundingClientRect().width || 140);
  const height = Math.max(50, card.offsetHeight || card.getBoundingClientRect().height || 80);
  const rad = Math.abs(rotation) * Math.PI / 180;
  const boxWidth = (Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad))) * scale;
  const boxHeight = (Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad))) * scale;
  const edge = narrow ? 7 : 10;
  const minX = boxWidth / 2 + edge;
  const maxX = Math.max(minX, stageRect.width - boxWidth / 2 - edge);
  const minY = boxHeight / 2 + edge;
  const maxY = Math.max(minY, stageRect.height - boxHeight / 2 - edge);

  const preferredX = Math.max(minX, Math.min(maxX, stageRect.width * ((Number(note.x) || 50) / 100)));
  const preferredY = Math.max(minY, Math.min(maxY, stageRect.height * ((Number(note.y) || 50) / 100)));
  const candidates = [{ x: preferredX, y: preferredY }];

  // Deterministic pseudo-random sampling covers the whole wall. We test many
  // positions before allowing overlap, so notes use empty space first on both
  // desktop and phone. Only once every useful area is occupied do we accept the
  // least-overlapping candidate.
  let state = (seed || 1) >>> 0;
  const nextRandom = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const samples = narrow ? 190 : 260;
  for (let i = 0; i < samples; i += 1) {
    candidates.push({
      x: minX + nextRandom() * Math.max(1, maxX - minX),
      y: minY + nextRandom() * Math.max(1, maxY - minY)
    });
  }

  // Add a loose grid too, so thin leftover lanes are not missed by random
  // sampling when the wall is almost full.
  const cols = narrow ? 5 : 11;
  const rows = narrow ? 12 : 8;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const xRatio = cols <= 1 ? .5 : col / (cols - 1);
      const yRatio = rows <= 1 ? .5 : row / (rows - 1);
      candidates.push({ x: minX + xRatio * (maxX - minX), y: minY + yRatio * (maxY - minY) });
    }
  }

  let best = null;
  let bestPenalty = Number.POSITIVE_INFINITY;
  const noteGap = narrow ? 4 : 6;
  for (const candidate of candidates) {
    const rect = getFreedomWallCandidateRect(stageRect, candidate.x, candidate.y, width, height, rotation, scale);
    let overlap = 0;
    for (const occupied of occupiedRects) overlap += freedomWallOverlapArea(expandFreedomWallRect(rect, noteGap), occupied);
    // Covering the prompt/brand/+ button receives a much larger penalty so it
    // happens only if the wall is genuinely out of usable room.
    for (const reserved of reservedRects) overlap += freedomWallOverlapArea(expandFreedomWallRect(rect, 3), reserved) * 12;
    const distance = Math.hypot(candidate.x - preferredX, candidate.y - preferredY);
    const penalty = overlap * 1000 + distance;
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = { x: candidate.x, y: candidate.y, rect };
      if (overlap === 0 && distance < Math.max(stageRect.width, stageRect.height) * .14) break;
    }
  }

  const chosen = best || { x: preferredX, y: preferredY, rect: getFreedomWallCandidateRect(stageRect, preferredX, preferredY, width, height, rotation, scale) };
  return {
    x: Math.max(0, Math.min(100, (chosen.x / stageRect.width) * 100)),
    y: Math.max(0, Math.min(100, (chosen.y / stageRect.height) * 100)),
    rotation,
    skew,
    scale,
    rect: chosen.rect
  };
}


function clearFreedomWallDragLongPressTimer() {
  if (freedomWallDragLongPressTimer) window.clearTimeout(freedomWallDragLongPressTimer);
  freedomWallDragLongPressTimer = 0;
}

function getFreedomWallCssNumber(card, name, fallback = 0) {
  const raw = String(card?.style?.getPropertyValue(name) || "").replace(/deg|%/g, "").trim();
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getFreedomWallDragGeometry(stage, card) {
  const stageRect = stage.getBoundingClientRect();
  const width = Math.max(1, card.offsetWidth || card.getBoundingClientRect().width || 100);
  const height = Math.max(1, card.offsetHeight || card.getBoundingClientRect().height || 60);
  const rotation = getFreedomWallCssNumber(card, "--fw-rotation", 0);
  const scale = getFreedomWallCssNumber(card, "--fw-scale", 1) || 1;
  const rad = Math.abs(rotation) * Math.PI / 180;
  const rotatedWidth = (Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad))) * scale;
  const rotatedHeight = (Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad))) * scale;
  const edge = window.innerWidth <= 700 ? 4 : 7;
  const minX = rotatedWidth / 2 + edge;
  const maxX = Math.max(minX, stageRect.width - rotatedWidth / 2 - edge);
  const minY = rotatedHeight / 2 + edge;
  const maxY = Math.max(minY, stageRect.height - rotatedHeight / 2 - edge);
  return { stageRect, width, height, rotation, scale, minX, maxX, minY, maxY };
}

function beginFreedomWallNoteDrag(card, event) {
  const layer = card?.closest?.("#homepageEffectLayer") || document.getElementById("homepageEffectLayer");
  const stage = layer?.querySelector?.("#freedomWallNotesStage");
  const overlay = layer?.querySelector?.("#freedomWallDragOverlay");
  if (!stage || !overlay || !card?.dataset?.noteId) return;

  clearFreedomWallDragLongPressTimer();
  const geometry = getFreedomWallDragGeometry(stage, card);
  const rect = card.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - geometry.stageRect.left;
  const centerY = rect.top + rect.height / 2 - geometry.stageRect.top;
  const xPercent = Math.max(0, Math.min(100, (centerX / geometry.stageRect.width) * 100));
  const yPercent = Math.max(0, Math.min(100, (centerY / geometry.stageRect.height) * 100));
  const rotation = getFreedomWallCssNumber(card, "--fw-rotation", 0);
  const skew = getFreedomWallCssNumber(card, "--fw-skew", 0);
  const scale = getFreedomWallCssNumber(card, "--fw-scale", 1) || 1;

  freedomWallDragState = {
    pointerId: event.pointerId,
    pointerType: event.pointerType || "mouse",
    card,
    layer,
    stage,
    overlay,
    startPointerX: event.clientX,
    startPointerY: event.clientY,
    latestPointerX: event.clientX,
    latestPointerY: event.clientY,
    startCenterX: centerX,
    startCenterY: centerY,
    currentXPercent: xPercent,
    currentYPercent: yPercent,
    geometry,
    rotation,
    skew,
    scale,
    moved: false
  };
  freedomWallDragPending = null;

  // v462: manually moved notes live in a temporary overlay ABOVE the prompt.
  // This overlay is browser-session-only and is never written to Firestore.
  overlay.appendChild(card);
  layer.classList.add("is-note-dragging");
  card.classList.add("is-dragging");
  card.style.setProperty("--fw-drag-x", "0px");
  card.style.setProperty("--fw-drag-y", "0px");
  card.style.transform = `translate(-50%,-50%) translate3d(0,0,0) rotate(${rotation}deg) skewY(${skew}deg) scale(${scale})`;
  freedomWallDragFrontZ = Math.min(900, Math.max(1, freedomWallDragFrontZ + 1));
  card.style.zIndex = String(freedomWallDragFrontZ);
  card.dataset.fwDragged = "true";

  // Seed local state immediately so a live Firestore snapshot cannot move the
  // actively-held card back under the prompt or recreate a duplicate.
  freedomWallLocalDragPositions.set(String(card.dataset.noteId), {
    x: xPercent,
    y: yPercent,
    rotation,
    skew,
    scale,
    zIndex: freedomWallDragFrontZ
  });

  try { card.setPointerCapture?.(event.pointerId); } catch (error) {}
  event.preventDefault?.();
}

function applyFreedomWallNoteDragInstant(clientX, clientY) {
  const state = freedomWallDragState;
  if (!state) return;

  const dx = clientX - state.startPointerX;
  const dy = clientY - state.startPointerY;
  if (Math.abs(dx) + Math.abs(dy) > 2) state.moved = true;

  const g = state.geometry;
  const x = Math.max(g.minX, Math.min(g.maxX, state.startCenterX + dx));
  const y = Math.max(g.minY, Math.min(g.maxY, state.startCenterY + dy));
  state.currentXPercent = Math.max(0, Math.min(100, (x / g.stageRect.width) * 100));
  state.currentYPercent = Math.max(0, Math.min(100, (y / g.stageRect.height) * 100));

  // v471: write the compositor transform directly. No queued animation frame,
  // no left/top updates, and no CSS-variable recalculation while the finger is
  // moving. This keeps the note visually attached to the current pointer sample.
  const tx = x - state.startCenterX;
  const ty = y - state.startCenterY;
  state.card.style.transform = `translate(-50%,-50%) translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${state.rotation}deg) skewY(${state.skew}deg) scale(${state.scale})`;
}

function moveFreedomWallNoteDrag(event) {
  const state = freedomWallDragState;
  if (!state || state.pointerId !== event.pointerId) return;

  // Use the newest coalesced pointer sample when the browser provides one.
  // On phones this can be newer than the outer pointermove event itself.
  let sample = event;
  try {
    const points = event.getCoalescedEvents?.();
    if (points?.length) sample = points[points.length - 1];
  } catch (error) {}

  state.latestPointerX = sample.clientX;
  state.latestPointerY = sample.clientY;
  applyFreedomWallNoteDragInstant(state.latestPointerX, state.latestPointerY);
  if (event.cancelable) event.preventDefault();
}

function endFreedomWallNoteDrag(event, force = false) {
  clearFreedomWallDragLongPressTimer();

  if (freedomWallDragPending && (force || event?.pointerId == null || freedomWallDragPending.pointerId === event.pointerId)) {
    try { freedomWallDragPending.card?.releasePointerCapture?.(freedomWallDragPending.pointerId); } catch (error) {}
    freedomWallDragPending = null;
  }

  const state = freedomWallDragState;
  if (!state || (!force && event?.pointerId != null && state.pointerId !== event.pointerId)) return;

  // v471 moves directly on every pointer sample, so there is no queued frame
  // to wait for at release.
  if (freedomWallDragMoveFrame) {
    window.cancelAnimationFrame(freedomWallDragMoveFrame);
    freedomWallDragMoveFrame = 0;
  }

  const finalX = Number.isFinite(state.currentXPercent) ? state.currentXPercent : 50;
  const finalY = Number.isFinite(state.currentYPercent) ? state.currentYPercent : 50;
  state.card.style.setProperty("--fw-x", finalX.toFixed(3));
  state.card.style.setProperty("--fw-y", finalY.toFixed(3));
  state.card.style.setProperty("--fw-drag-x", "0px");
  state.card.style.setProperty("--fw-drag-y", "0px");
  state.card.style.removeProperty("transform");
  state.card.classList.remove("is-dragging");
  state.layer?.classList?.remove("is-note-dragging");
  state.card.dataset.fwDragged = "true";

  const local = freedomWallLocalDragPositions.get(String(state.card.dataset.noteId)) || {};
  freedomWallLocalDragPositions.set(String(state.card.dataset.noteId), {
    ...local,
    x: finalX,
    y: finalY,
    rotation: getFreedomWallCssNumber(state.card, "--fw-rotation", local.rotation || 0),
    skew: getFreedomWallCssNumber(state.card, "--fw-skew", local.skew || 0),
    scale: getFreedomWallCssNumber(state.card, "--fw-scale", local.scale || 1) || 1,
    zIndex: Number(state.card.style.zIndex) || freedomWallDragFrontZ
  });

  try { state.card.releasePointerCapture?.(state.pointerId); } catch (error) {}
  freedomWallDragState = null;
  event?.preventDefault?.();
}

function normalizeFreedomWallReactionLastType(value) {
  const safe = String(value || "").trim().toLowerCase();
  return FREEDOM_WALL_REACTION_TYPES.includes(safe) ? safe : "";
}

function getFreedomWallReactionStats(reactions = {}, lastType = "") {
  const normalized = normalizeFreedomWallReactions(reactions);
  const counts = Object.fromEntries(FREEDOM_WALL_REACTION_TYPES.map((type) => [type, 0]));
  Object.values(normalized).forEach((type) => { if (type in counts) counts[type] += 1; });
  const mine = normalized[getFreedomWallDeviceId()] || "";
  const total = FREEDOM_WALL_REACTION_TYPES.reduce((sum, type) => sum + counts[type], 0);
  const maxCount = Math.max(0, ...FREEDOM_WALL_REACTION_TYPES.map((type) => counts[type] || 0));
  const tied = maxCount > 0 ? FREEDOM_WALL_REACTION_TYPES.filter((type) => counts[type] === maxCount) : [];
  const safeLast = normalizeFreedomWallReactionLastType(lastType);
  const dominant = tied.includes(safeLast) ? safeLast : (tied[0] || "");
  return { counts, mine, total, dominant };
}

function updateFreedomWallReactionSummary(container, reactions = {}, targetType = "note", lastType = "") {
  if (!container) return;
  const id = targetType === "prompt" ? "freedomWallPromptReactionSummary" : "";
  let summary = targetType === "prompt" ? container.querySelector?.(`#${id}`) : container.querySelector?.(".freedomWallReactionSummary.is-note");
  if (!summary && targetType === "note") {
    summary = document.createElement("div");
    summary.className = "freedomWallReactionSummary is-note";
    summary.setAttribute("aria-live", "polite");
    container.appendChild(summary);
  }
  if (!summary) return;
  const { total, dominant, mine } = getFreedomWallReactionStats(reactions, lastType);
  const noteId = targetType === "note" ? String(container.dataset?.noteId || container.dataset?.readerNoteId || "") : "";
  const note = noteId ? freedomWallNotesCache.find((item) => String(item?.id || "") === noteId) : null;
  const replyCount = targetType === "note" ? Math.max(0, Math.floor(Number(note?.replyCount || 0) || 0)) : 0;
  const sirJRReacted = targetType === "note" && hasFreedomWallSirJRReaction(note);
  const sirJRReplied = targetType === "note" && Boolean(note?.sirJRReplied);
  const parts = [];
  if (total && dominant) {
    const selected = mine === dominant ? " is-mine" : "";
    const special = sirJRReacted ? " is-sirjr" : "";
    const koala = sirJRReacted ? '<span class="freedomWallSirJRKoala" aria-hidden="true">🐨</span>' : "";
    const extraLabel = sirJRReacted ? ", including Sir JR" : "";
    parts.push(`<span class="freedomWallReactionCount is-dominant${selected}${special}" data-reaction="${dominant}" aria-label="${total} reactions${extraLabel}">${FREEDOM_WALL_REACTIONS[dominant]} <b>${total}</b>${koala}</span>`);
  }
  if (replyCount > 0) {
    const special = sirJRReplied ? " is-sirjr" : "";
    const koala = sirJRReplied ? '<span class="freedomWallSirJRKoala" aria-hidden="true">🐨</span>' : "";
    const extraLabel = sirJRReplied ? ", including a reply from Sir JR" : "";
    parts.push(`<span class="freedomWallReplyCount${special}" aria-label="${replyCount} ${replyCount === 1 ? "reply" : "replies"}${extraLabel}">💬 <b>${replyCount}</b>${koala}</span>`);
  }
  summary.innerHTML = parts.join("");
  summary.hidden = parts.length === 0;
  container.classList?.toggle?.("has-reactions", Boolean(total && dominant));
  container.classList?.toggle?.("has-replies", replyCount > 0);
  container.classList?.toggle?.("has-sirjr-reaction", sirJRReacted);
  container.classList?.toggle?.("has-sirjr-reply", sirJRReplied);
}
function getFreedomWallPromptReactionDocIdFromSignature(signature) {
  const safe = String(signature || "").trim();
  if (!safe) return "";
  const a = (freedomWallHash(safe) >>> 0).toString(36);
  const b = (freedomWallHash(safe.split("").reverse().join("")) >>> 0).toString(36);
  return `prompt_${a}_${b}`;
}

function getFreedomWallPromptReactionDocId() {
  const card = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
  if (!card || card.hidden) return "";
  return getFreedomWallPromptReactionDocIdFromSignature(card.dataset.promptSignature);
}

function getFreedomWallPromptLegacyReactionDocId() {
  const card = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
  if (!card || card.hidden) return "";
  return getFreedomWallPromptReactionDocIdFromSignature(card.dataset.promptLegacySignature);
}

function getFreedomWallReactionMapForTarget(target = freedomWallReactionMenuTarget) {
  if (!target) return {};
  if (target.type === "prompt") return normalizeFreedomWallReactions(freedomWallPromptReactionsCache);
  const note = freedomWallNotesCache.find((item) => String(item?.id || "") === String(target.id || ""));
  return normalizeFreedomWallReactions(note?.reactions || {});
}

function getFreedomWallReactionLastTypeForTarget(target = freedomWallReactionMenuTarget) {
  if (!target) return "";
  if (target.type === "prompt") return normalizeFreedomWallReactionLastType(freedomWallPromptReactionLastType);
  const note = freedomWallNotesCache.find((item) => String(item?.id || "") === String(target.id || ""));
  return normalizeFreedomWallReactionLastType(note?.reactionLastType || "");
}

function updateFreedomWallReactionMenuState() {
  const layer = document.getElementById("homepageEffectLayer");
  const menu = layer?.querySelector("#freedomWallReactionMenu");
  if (!menu || menu.hidden || !freedomWallReactionMenuTarget) return;
  const { counts, mine } = getFreedomWallReactionStats(getFreedomWallReactionMapForTarget(), getFreedomWallReactionLastTypeForTarget());
  const isNote = freedomWallReactionMenuTarget.type === "note";
  const noteForMenu = isNote
    ? freedomWallNotesCache.find((item) => String(item?.id || "") === String(freedomWallReactionMenuTarget.id || ""))
    : null;
  const sirJRTypes = new Set(Object.values(normalizeFreedomWallSirJRReactions(noteForMenu?.sirJRReactions || {})));
  menu.querySelectorAll("[data-fw-reaction]").forEach((button) => {
    const type = String(button.dataset.fwReaction || "");
    button.classList.toggle("is-selected", mine === type);
    button.classList.toggle("has-sirjr", sirJRTypes.has(type));
    button.setAttribute("aria-pressed", mine === type ? "true" : "false");
    const count = button.querySelector(`[data-fw-reaction-count="${type}"]`);
    if (count) count.textContent = String(counts[type] || 0);
  });
  const actionRow = menu.querySelector("#freedomWallNoteActionRow");
  const replyCountEl = menu.querySelector("#freedomWallActionReplyCount");
  const repliesButton = menu.querySelector("#freedomWallViewRepliesBtn");
  const quickReplyButton = menu.querySelector("#freedomWallQuickReplyBtn");
  if (actionRow) actionRow.hidden = !isNote;
  if (repliesButton) repliesButton.classList.toggle("has-sirjr", Boolean(noteForMenu?.sirJRReplied));
  if (quickReplyButton) quickReplyButton.classList.toggle("has-sirjr", Boolean(noteForMenu?.sirJRReplied));
  if (isNote && replyCountEl) {
    replyCountEl.textContent = String(Math.max(0, Math.floor(Number(noteForMenu?.replyCount || 0) || 0)));
  }
}

function positionFreedomWallReactionMenu(clientX, clientY) {
  const layer = document.getElementById("homepageEffectLayer");
  const menu = layer?.querySelector("#freedomWallReactionMenu");
  if (!menu || menu.hidden || window.innerWidth <= 700) return;
  menu.style.left = `${Math.max(10, Number(clientX) || window.innerWidth / 2)}px`;
  menu.style.top = `${Math.max(10, Number(clientY) || window.innerHeight / 2)}px`;
  menu.style.transform = "none";
  const rect = menu.getBoundingClientRect();
  const left = Math.max(10, Math.min(window.innerWidth - rect.width - 10, Number(clientX) || 10));
  const top = Math.max(10, Math.min(window.innerHeight - rect.height - 10, Number(clientY) || 10));
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function openFreedomWallReactionMenu(target, clientX, clientY, pointerType = "mouse") {
  if (!target?.type || !target?.id) return;
  const layer = document.getElementById("homepageEffectLayer");
  const menu = layer?.querySelector("#freedomWallReactionMenu");
  const status = layer?.querySelector("#freedomWallReactionStatus");
  const title = layer?.querySelector("#freedomWallReactionMenuTitle");
  if (!menu) return;
  endFreedomWallNoteDrag(null, true);
  clearFreedomWallPromptReactionPending();
  closeFreedomWallCustomizerPanel();
  freedomWallReactionMenuTarget = { type: target.type, id: String(target.id) };
  if (title) title.textContent = target.type === "prompt" ? "React to the prompt" : "Note actions";
  if (status) status.textContent = "";
  menu.dataset.pointerType = pointerType || "mouse";
  menu.hidden = false;
  layer.classList.add("is-reaction-menu-open");
  freedomWallReaderLastTick = performance.now();
  updateFreedomWallReactionMenuState();
  positionFreedomWallReactionMenu(clientX, clientY);
  window.requestAnimationFrame(() => menu.classList.add("is-open"));
  try { if (pointerType !== "mouse" && navigator.vibrate) navigator.vibrate(7); } catch (error) {}
}

function closeFreedomWallReactionMenu() {
  const layer = document.getElementById("homepageEffectLayer");
  const menu = layer?.querySelector("#freedomWallReactionMenu");
  if (!menu) { freedomWallReactionMenuTarget = null; return; }
  menu.classList.remove("is-open");
  menu.hidden = true;
  menu.style.removeProperty("left");
  menu.style.removeProperty("top");
  menu.style.removeProperty("transform");
  layer?.classList?.remove("is-reaction-menu-open");
  freedomWallReactionMenuTarget = null;
  freedomWallReaderLastTick = performance.now();
}

function applyFreedomWallOptimisticReaction(target, reactions, lastType = "", sirJRReactions = null) {
  const clean = normalizeFreedomWallReactions(reactions);
  const safeLast = normalizeFreedomWallReactionLastType(lastType);
  if (target.type === "prompt") {
    freedomWallPromptReactionsCache = clean;
    freedomWallPromptReactionLastType = safeLast;
    const promptCard = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
    updateFreedomWallReactionSummary(promptCard, clean, "prompt", safeLast);
  } else {
    const note = freedomWallNotesCache.find((item) => String(item?.id || "") === String(target.id || ""));
    if (note) {
      note.reactions = clean;
      note.reactionLastType = safeLast;
      if (sirJRReactions !== null) note.sirJRReactions = normalizeFreedomWallSirJRReactions(sirJRReactions);
    }
    const wallLayer = document.getElementById("homepageEffectLayer");
    const card = wallLayer?.querySelector(`.freedomWallNote[data-note-id="${CSS.escape(String(target.id || ""))}"]`);
    const readerCard = wallLayer?.querySelector(`.freedomWallReaderNote[data-reader-note-id="${CSS.escape(String(target.id || ""))}"]`);
    updateFreedomWallReactionSummary(card, clean, "note", safeLast);
    updateFreedomWallReactionSummary(readerCard, clean, "note", safeLast);
  }
  updateFreedomWallReactionMenuState();
  // Keep v483's paint fingerprint aligned with the optimistic reaction so an
  // unrelated dashboard refresh cannot rebuild every note while the network
  // write is still in flight.
  if (freedomWallNotesCache.length) {
    const sorted = freedomWallNotesCache.filter(Boolean).sort((a,b) => (a.createdAtMs - b.createdAtMs) || a.id.localeCompare(b.id)).slice(-FREEDOM_WALL_MAX_RENDERED_NOTES);
    freedomWallLastRenderSignature = buildFreedomWallRenderSignature(sorted);
  }
}

async function writeFreedomWallReactionFast(db, target, deviceId, type, removing, lastType, includeLastType = true, sirJRMode = "keep") {
  const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
  const deleteField = firebase.firestore.FieldValue.delete();
  const common = {
    ReactionDeviceId: deviceId,
    ReactionUpdatedAt: serverTimestamp
  };
  if (includeLastType) common.ReactionLastType = normalizeFreedomWallReactionLastType(lastType) || type;

  if (target.type === "note") {
    const ref = db.collection(FREEDOM_WALL_COLLECTION).doc(target.id);
    const update = { ...common };
    update[`Reactions.${deviceId}`] = removing ? deleteField : type;
    // v535: Sir JR identity is nickname-triggered, not login-triggered. Keep a
    // parallel per-device map so every viewer can show the Koala indicator.
    if (sirJRMode === "set") update[`SirJRReactions.${deviceId}`] = removing ? deleteField : type;
    else if (sirJRMode === "clear") update[`SirJRReactions.${deviceId}`] = deleteField;
    await ref.update(update);
    return;
  }

  const ref = db.collection(FREEDOM_WALL_PROMPT_REACTION_COLLECTION).doc(target.id);
  if (removing) {
    const update = { ...common };
    update[`Reactions.${deviceId}`] = deleteField;
    await ref.update(update);
  } else {
    const payload = {
      PromptKey: target.id,
      Reactions: { [deviceId]: type },
      ...common
    };
    await ref.set(payload, { merge:true });
  }
}

async function toggleFreedomWallReaction(type) {
  if (freedomWallReactionWriting || !FREEDOM_WALL_REACTION_TYPES.includes(String(type || ""))) return;
  const target = freedomWallReactionMenuTarget ? { ...freedomWallReactionMenuTarget } : null;
  if (!target) return;
  const layer = document.getElementById("homepageEffectLayer");
  const status = layer?.querySelector("#freedomWallReactionStatus");
  const deviceId = getFreedomWallDeviceId();
  const previous = getFreedomWallReactionMapForTarget(target);
  const previousLastType = getFreedomWallReactionLastTypeForTarget(target);
  const optimistic = { ...previous };
  const removing = optimistic[deviceId] === type;
  if (removing) delete optimistic[deviceId];
  else optimistic[deviceId] = type;
  const previewStats = getFreedomWallReactionStats(optimistic, previousLastType);
  const optimisticLastType = removing
    ? (previewStats.counts[previousLastType] > 0 ? previousLastType : previewStats.dominant)
    : type;

  const note = target.type === "note"
    ? freedomWallNotesCache.find((item) => String(item?.id || "") === String(target.id || ""))
    : null;
  const previousSirJR = normalizeFreedomWallSirJRReactions(note?.sirJRReactions || {});
  const optimisticSirJR = { ...previousSirJR };
  const sirJRNow = target.type === "note" && isCurrentFreedomWallSirJR();
  const hadSirJROnDevice = Boolean(previousSirJR[deviceId]);
  let sirJRMode = "keep";
  if (target.type === "note") {
    if (sirJRNow) {
      if (removing) {
        sirJRMode = hadSirJROnDevice ? "clear" : "keep";
        delete optimisticSirJR[deviceId];
      } else {
        sirJRMode = "set";
        optimisticSirJR[deviceId] = type;
      }
    } else if (hadSirJROnDevice) {
      // If this browser stops using the secret nickname, its next reaction
      // becomes ordinary and its old Koala marker is cleaned up.
      sirJRMode = "clear";
      delete optimisticSirJR[deviceId];
    }
  }

  freedomWallReactionWriting = true;
  applyFreedomWallOptimisticReaction(target, optimistic, optimisticLastType, target.type === "note" ? optimisticSirJR : null);
  if (status) status.textContent = "Saving…";
  try {
    const db = await waitForClassBoardFirestore(12000);
    if (!db) throw new Error("wall unavailable");
    try {
      await writeFreedomWallReactionFast(db, target, deviceId, type, removing, optimisticLastType, true, sirJRMode);
    } catch (writeError) {
      // Compatibility retry is safe only for ordinary reactions. v535 Koala
      // identity needs the v535 Rules because SirJRReactions is a new field.
      if (!isFreedomWallRulesCompatibilityError(writeError) || sirJRMode !== "keep") throw writeError;
      await writeFreedomWallReactionFast(db, target, deviceId, type, removing, optimisticLastType, false, "keep");
    }
    if (status) status.textContent = removing ? "Reaction removed" : (sirJRNow ? "🐨 Sir JR reaction saved" : "Reaction saved");
  } catch (error) {
    console.warn("Freedom Wall reaction failed:", error);
    if (note) note.sirJRReactions = previousSirJR;
    applyFreedomWallOptimisticReaction(target, previous, previousLastType, target.type === "note" ? previousSirJR : null);
    if (status) status.textContent = isFreedomWallRulesCompatibilityError(error) ? "Publish the v535 Firebase Rules to enable Koala interactions." : "Unable to react right now.";
  } finally {
    freedomWallReactionWriting = false;
  }
}
function stopFreedomWallPromptReactionLive() {
  freedomWallPromptReactionListenToken += 1;
  try { freedomWallPromptReactionUnsubscribe?.(); } catch (error) {}
  freedomWallPromptReactionUnsubscribe = null;
  freedomWallPromptReactionConnecting = false;
  freedomWallPromptReactionDocId = "";
  freedomWallPromptReactionsCache = {};
  freedomWallPromptReactionLastType = "";
  const card = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
  updateFreedomWallReactionSummary(card, {}, "prompt", "");
}

async function syncFreedomWallPromptReactionLive() {
  const docId = getFreedomWallPromptReactionDocId();
  if (!docId) { stopFreedomWallPromptReactionLive(); return; }
  if (freedomWallPromptReactionDocId === docId && (freedomWallPromptReactionUnsubscribe || freedomWallPromptReactionConnecting)) return;
  stopFreedomWallPromptReactionLive();
  freedomWallPromptReactionDocId = docId;
  freedomWallPromptReactionConnecting = true;
  const token = ++freedomWallPromptReactionListenToken;
  const db = await waitForClassBoardFirestore(12000);
  if (token !== freedomWallPromptReactionListenToken || !db || getFreedomWallPromptReactionDocId() !== docId) return;
  try {
    freedomWallPromptReactionUnsubscribe = db.collection(FREEDOM_WALL_PROMPT_REACTION_COLLECTION).doc(docId).onSnapshot(async (snapshot) => {
      freedomWallPromptReactionConnecting = false;
      if (freedomWallPromptReactionDocId !== docId) return;

      const stableData = snapshot.exists ? (snapshot.data() || {}) : {};
      let legacyData = {};
      // v487 transition: also read the current v484-v486 key and merge it for
      // display. Stable-key reactions override the same device from the legacy
      // document. This prevents an upgrade/refresh from visually dropping old
      // counts while all new reactions are written to the refresh-safe key.
      const legacyId = getFreedomWallPromptLegacyReactionDocId();
      if (legacyId && legacyId !== docId) {
        try {
          const legacySnapshot = await db.collection(FREEDOM_WALL_PROMPT_REACTION_COLLECTION).doc(legacyId).get();
          if (freedomWallPromptReactionDocId !== docId) return;
          if (legacySnapshot.exists) legacyData = legacySnapshot.data() || {};
        } catch (legacyError) {}
      }

      const legacyReactions = normalizeFreedomWallReactions(legacyData?.Reactions || {});
      const stableReactions = normalizeFreedomWallReactions(stableData?.Reactions || {});
      freedomWallPromptReactionsCache = { ...legacyReactions, ...stableReactions };
      freedomWallPromptReactionLastType = normalizeFreedomWallReactionLastType(
        stableData?.ReactionLastType || legacyData?.ReactionLastType || ""
      );
      const card = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
      updateFreedomWallReactionSummary(card, freedomWallPromptReactionsCache, "prompt", freedomWallPromptReactionLastType);
      if (freedomWallReactionMenuTarget?.type === "prompt" && freedomWallReactionMenuTarget.id === docId) updateFreedomWallReactionMenuState();
    }, (error) => {
      console.warn("Freedom Wall prompt reactions unavailable:", error);
      try { freedomWallPromptReactionUnsubscribe?.(); } catch (unsubscribeError) {}
      freedomWallPromptReactionUnsubscribe = null;
      freedomWallPromptReactionConnecting = false;
      freedomWallPromptReactionDocId = "";
    });
  } catch (error) {
    console.warn("Freedom Wall prompt reaction listener failed:", error);
    freedomWallPromptReactionUnsubscribe = null;
    freedomWallPromptReactionConnecting = false;
    freedomWallPromptReactionDocId = "";
  }
}

function clearFreedomWallPromptReactionPending() {
  if (freedomWallPromptReactionTimer) window.clearTimeout(freedomWallPromptReactionTimer);
  freedomWallPromptReactionTimer = 0;
  if (freedomWallPromptReactionPending) {
    try { freedomWallPromptReactionPending.card?.releasePointerCapture?.(freedomWallPromptReactionPending.pointerId); } catch (error) {}
  }
  freedomWallPromptReactionPending = null;
}

function setupFreedomWallReactions(layer) {
  if (!layer || layer.dataset.reactionsReady === "true") return;
  layer.dataset.reactionsReady = "true";
  const menu = layer.querySelector("#freedomWallReactionMenu");
  const closeButton = layer.querySelector("#freedomWallReactionMenuClose");

  const swallowMenuPointer = (event) => {
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  };
  menu?.addEventListener("pointerdown", swallowMenuPointer);
  menu?.addEventListener("pointermove", swallowMenuPointer);
  menu?.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    swallowMenuPointer(event);
  }, true);

  closeButton?.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    swallowMenuPointer(event);
  }, true);
  closeButton?.addEventListener("pointerup", (event) => {
    event.preventDefault();
    swallowMenuPointer(event);
    closeFreedomWallReactionMenu();
  }, true);
  closeButton?.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    event.preventDefault();
    closeFreedomWallReactionMenu();
  });

  layer.querySelectorAll("[data-fw-reaction]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      swallowMenuPointer(event);
    }, true);
    button.addEventListener("pointerup", (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      swallowMenuPointer(event);
      toggleFreedomWallReaction(button.dataset.fwReaction);
    }, true);
    // Keyboard accessibility without firing a second reaction after pointerup.
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      toggleFreedomWallReaction(button.dataset.fwReaction);
    });
  });

  layer.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    if (event.target?.closest?.("#freedomWallReactionMenu")) return;
    const prompt = event.target?.closest?.("#freedomWallPromptCard");
    if (!prompt || prompt.hidden || event.target?.closest?.("button,a,input,textarea,select")) return;
    closeFreedomWallReactionMenu();
    clearFreedomWallPromptReactionPending();
    freedomWallPromptReactionPending = { card: prompt, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, latestX:event.clientX, latestY:event.clientY, pointerType:event.pointerType };
    freedomWallPromptReactionTimer = window.setTimeout(() => {
      const pending = freedomWallPromptReactionPending;
      freedomWallPromptReactionTimer = 0;
      if (!pending || pending.pointerId !== event.pointerId || !pending.card.isConnected) return;
      const docId = getFreedomWallPromptReactionDocId();
      const x = pending.latestX, y = pending.latestY, pointerType = pending.pointerType;
      freedomWallPromptReactionPending = null;
      if (docId) openFreedomWallReactionMenu({ type:"prompt", id:docId }, x, y, pointerType || "touch");
    }, FREEDOM_WALL_REACTION_HOLD_MS);
    if (event.cancelable) event.preventDefault();
  });

  document.addEventListener("pointermove", (event) => {
    const pending = freedomWallPromptReactionPending;
    if (!pending || pending.pointerId !== event.pointerId) return;
    pending.latestX = event.clientX;
    pending.latestY = event.clientY;
    if (Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY) > FREEDOM_WALL_REACTION_MOVE_THRESHOLD) clearFreedomWallPromptReactionPending();
  }, { capture:true, passive:true });
  document.addEventListener("pointerup", (event) => {
    if (freedomWallPromptReactionPending?.pointerId === event.pointerId) clearFreedomWallPromptReactionPending();
  }, true);
  document.addEventListener("pointercancel", (event) => {
    if (freedomWallPromptReactionPending?.pointerId === event.pointerId) clearFreedomWallPromptReactionPending();
  }, true);

  // Close only when the next intentional pointer starts OUTSIDE the picker.
  // Because the picker itself has pointer-events:auto in v485, reaction taps
  // no longer fall through to the note underneath.
  document.addEventListener("pointerdown", (event) => {
    const activeMenu = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReactionMenu");
    if (!activeMenu || activeMenu.hidden || activeMenu.contains(event.target)) return;
    if (event.button === 2) return; // let contextmenu move/open the picker first
    closeFreedomWallReactionMenu();
  }, true);
}


function normalizeFreedomWallReply(doc, index = 0) {
  const data = typeof doc?.data === "function" ? (doc.data() || {}) : (doc || {});
  const id = String(doc?.id || data.ID || data.id || `reply-${index}`);
  const noteId = String(data.NoteID || data.noteId || "").trim();
  const parentReplyId = String(data.ParentReplyID || data.parentReplyId || "").trim();
  const text = String(data.Text || data.text || "").trim().slice(0, FREEDOM_WALL_REPLY_MAX_LENGTH);
  const author = String(data.Name || data.Author || data.name || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
  const deviceId = String(data.DeviceId || data.deviceId || "").trim();
  const createdAtMs = freedomWallSafeNumber(data.CreatedAtMs || data.createdAtMs, Date.now() - (10000 - index), 0, Number.MAX_SAFE_INTEGER);
  const wallId = normalizeFreedomWallSessionId(data.WallID || data.wallId || FREEDOM_WALL_LEGACY_SESSION_ID);
  const isSirJR = data.IsSirJR === true || data.isSirJR === true;
  if (!id || !noteId || !text || !author) return null;
  return { id, noteId, parentReplyId, text, author, deviceId, createdAtMs, wallId, isSirJR };
}

function getFreedomWallReplyNote(noteId = freedomWallReplyThreadNoteId) {
  return freedomWallNotesCache.find((item) => String(item?.id || "") === String(noteId || "")) || null;
}

function formatFreedomWallReplyTime(ms) {
  try {
    const date = new Date(Number(ms) || Date.now());
    return date.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
  } catch (error) {
    return "";
  }
}

function stopFreedomWallReplyThreadLive() {
  freedomWallReplyThreadListenToken += 1;
  try { freedomWallReplyThreadUnsubscribe?.(); } catch (error) {}
  freedomWallReplyThreadUnsubscribe = null;
}

function clearFreedomWallReplyActionMenu() {
  if (freedomWallReplyHoldTimer) window.clearTimeout(freedomWallReplyHoldTimer);
  freedomWallReplyHoldTimer = 0;
  freedomWallReplyHoldPending = null;
  const menu = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReplyActionMenu");
  if (menu) {
    menu.hidden = true;
    menu.style.removeProperty("left");
    menu.style.removeProperty("top");
    menu.removeAttribute("data-reply-id");
    menu.removeAttribute("data-reply-name");
  }
}

function clearFreedomWallReplyParent() {
  freedomWallReplyParentId = "";
  freedomWallReplyParentName = "";
  const box = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReplyingTo");
  const label = box?.querySelector("span");
  if (label) label.textContent = "";
  if (box) box.hidden = true;
}

function setFreedomWallReplyParent(replyId, author) {
  freedomWallReplyParentId = String(replyId || "").trim();
  freedomWallReplyParentName = String(author || "Someone").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH) || "Someone";
  const layer = document.getElementById("homepageEffectLayer");
  const box = layer?.querySelector("#freedomWallReplyingTo");
  const label = box?.querySelector("span");
  if (label) label.textContent = `↩ Replying to ${freedomWallReplyParentName}`;
  if (box) box.hidden = !freedomWallReplyParentId;
  clearFreedomWallReplyActionMenu();
  window.setTimeout(() => layer?.querySelector("#freedomWallReplyInput")?.focus(), 20);
}

function applyFreedomWallReplyActionTarget() {
  const menu = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReplyActionMenu");
  if (!menu || menu.hidden) return;
  const replyId = String(menu.dataset.replyId || "");
  const replyName = String(menu.dataset.replyName || "Someone");
  if (replyId) setFreedomWallReplyParent(replyId, replyName);
}

function positionFreedomWallReplyActionMenu(clientX, clientY) {
  const menu = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReplyActionMenu");
  if (!menu || menu.hidden) return;
  if (window.innerWidth <= 700) {
    menu.style.left = "50%";
    menu.style.top = "auto";
    return;
  }
  menu.style.left = `${Math.max(10, Number(clientX) || 10)}px`;
  menu.style.top = `${Math.max(10, Number(clientY) || 10)}px`;
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(10, Math.min(window.innerWidth - rect.width - 10, Number(clientX) || 10))}px`;
  menu.style.top = `${Math.max(10, Math.min(window.innerHeight - rect.height - 10, Number(clientY) || 10))}px`;
}

function openFreedomWallReplyActionMenu(replyId, author, clientX, clientY) {
  const layer = document.getElementById("homepageEffectLayer");
  const menu = layer?.querySelector("#freedomWallReplyActionMenu");
  if (!menu || !replyId) return;
  menu.dataset.replyId = String(replyId);
  menu.dataset.replyName = String(author || "Someone");
  const label = menu.querySelector("#freedomWallReplyToReplyBtn span");
  if (label) label.textContent = `Reply to ${String(author || "Someone").slice(0, 26)}`;
  menu.hidden = false;
  positionFreedomWallReplyActionMenu(clientX, clientY);
  try { if (navigator.vibrate && window.innerWidth <= 700) navigator.vibrate(6); } catch (error) {}
}

function renderFreedomWallReplyOriginal(note) {
  const layer = document.getElementById("homepageEffectLayer");
  const box = layer?.querySelector("#freedomWallReplyOriginal");
  if (!box) return;
  box.replaceChildren();
  if (!note) return;
  const label = document.createElement("small");
  label.textContent = "Original note";
  const text = document.createElement("p");
  text.textContent = note.text || (note.youtubeUrl ? "YouTube post" : (note.gif?.url || note.mediaRef ? "Media post" : "Note"));
  box.append(label, text);
  if (freedomWallConfig?.freedomWallShowNames && note.author) {
    const author = document.createElement("b");
    author.textContent = `— ${note.author}`;
    box.appendChild(author);
  }
}

function getFreedomWallReplyDepth(reply, byId) {
  let depth = 0;
  let parentId = String(reply?.parentReplyId || "");
  const seen = new Set();
  while (parentId && depth < 8 && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    depth += 1;
    parentId = String(parent.parentReplyId || "");
  }
  return depth;
}

function renderFreedomWallReplyThread(replies = freedomWallReplyThreadCache) {
  const layer = document.getElementById("homepageEffectLayer");
  const list = layer?.querySelector("#freedomWallReplyList");
  const subtitle = layer?.querySelector("#freedomWallReplySubtitle");
  if (!list) return;
  const sorted = (replies || []).filter(Boolean).slice().sort((a,b) => (a.createdAtMs - b.createdAtMs) || a.id.localeCompare(b.id));
  const byId = new Map(sorted.map((reply) => [String(reply.id), reply]));
  const totalCount = Math.max(sorted.length, Math.floor(Number(getFreedomWallReplyNote()?.replyCount || 0) || 0));
  if (subtitle) subtitle.textContent = `${totalCount} ${totalCount === 1 ? "reply" : "replies"} • long-press/right-click a reply to answer it`;
  list.replaceChildren();
  if (!sorted.length) {
    const empty = document.createElement("div");
    empty.className = "freedomWallReplyEmpty";
    empty.innerHTML = `<span>💬</span><strong>No replies yet</strong><small>Be the first to reply to this note.</small>`;
    list.appendChild(empty);
    return;
  }
  sorted.forEach((reply) => {
    const item = document.createElement("article");
    item.className = `freedomWallReplyItem${reply.isSirJR ? " is-sirjr" : ""}`;
    item.dataset.replyId = reply.id;
    const displayAuthor = reply.isSirJR
      ? FREEDOM_WALL_SIRJR_DISPLAY_NAME
      : (freedomWallConfig?.freedomWallShowNames ? reply.author : "Anonymous");
    item.dataset.replyName = displayAuthor;
    const depth = getFreedomWallReplyDepth(reply, byId);
    item.style.setProperty("--fw-reply-depth", String(Math.min(2, depth)));
    const head = document.createElement("div");
    head.className = "freedomWallReplyItemHead";
    const author = document.createElement("strong");
    if (reply.isSirJR) {
      author.className = "freedomWallSirJRReplyIdentity";
      author.innerHTML = `<span aria-hidden="true">🐨</span><b>${FREEDOM_WALL_SIRJR_DISPLAY_NAME}</b><em>Teacher</em>`;
    } else {
      author.textContent = displayAuthor;
    }
    const time = document.createElement("small");
    time.textContent = formatFreedomWallReplyTime(reply.createdAtMs);
    head.append(author, time);
    item.appendChild(head);
    if (reply.parentReplyId) {
      const parent = byId.get(reply.parentReplyId);
      const parentLabel = document.createElement("div");
      parentLabel.className = "freedomWallReplyParentLabel";
      const parentDisplayAuthor = parent?.isSirJR
        ? `🐨 ${FREEDOM_WALL_SIRJR_DISPLAY_NAME}`
        : (freedomWallConfig?.freedomWallShowNames ? (parent?.author || "a reply") : "Anonymous");
      parentLabel.textContent = `↳ Replying to ${parentDisplayAuthor}`;
      item.appendChild(parentLabel);
    }
    const body = document.createElement("p");
    body.textContent = reply.text;
    item.appendChild(body);
    list.appendChild(item);
  });
}

async function startFreedomWallReplyThreadLive(noteId) {
  stopFreedomWallReplyThreadLive();
  const token = ++freedomWallReplyThreadListenToken;
  const db = await waitForClassBoardFirestore(12000);
  if (!db || token !== freedomWallReplyThreadListenToken || freedomWallReplyThreadNoteId !== noteId) return;
  try {
    freedomWallReplyThreadUnsubscribe = db.collection(FREEDOM_WALL_REPLY_COLLECTION)
      .where("NoteID", "==", noteId)
      .limit(500)
      .onSnapshot((snapshot) => {
        if (token !== freedomWallReplyThreadListenToken || freedomWallReplyThreadNoteId !== noteId) return;
        freedomWallReplyThreadCache = snapshot.docs.map((doc, index) => normalizeFreedomWallReply(doc, index)).filter(Boolean);
        renderFreedomWallReplyThread(freedomWallReplyThreadCache);
      }, (error) => {
        console.warn("Freedom Wall replies listener unavailable:", error);
        const status = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReplyStatus");
        if (status) status.textContent = "Unable to load replies right now.";
      });
  } catch (error) {
    console.warn("Freedom Wall replies setup failed:", error);
  }
}

function openFreedomWallReplyThread(noteId, { focusComposer = false } = {}) {
  const note = getFreedomWallReplyNote(noteId);
  const layer = document.getElementById("homepageEffectLayer");
  const modal = layer?.querySelector("#freedomWallReplyThread");
  if (!note || !modal) return;
  closeFreedomWallReactionMenu();
  clearFreedomWallReplyActionMenu();
  endFreedomWallNoteDrag(null, true);
  freedomWallReplyThreadNoteId = String(noteId);
  freedomWallReplyThreadCache = [];
  clearFreedomWallReplyParent();
  const authorInput = layer.querySelector("#freedomWallReplyAuthor");
  if (authorInput && !authorInput.value) authorInput.value = getFreedomWallSavedAuthor();
  const replyInput = layer.querySelector("#freedomWallReplyInput");
  const status = layer.querySelector("#freedomWallReplyStatus");
  if (replyInput) replyInput.value = "";
  if (status) status.textContent = "";
  renderFreedomWallReplyOriginal(note);
  renderFreedomWallReplyThread([]);
  modal.hidden = false;
  layer.classList.add("is-reply-thread-open");
  freedomWallReaderLastTick = performance.now();
  syncFreedomWallChildModalCloseSafety();
  startFreedomWallReplyThreadLive(note.id);
  if (focusComposer) window.setTimeout(() => replyInput?.focus(), 80);
}

function closeFreedomWallReplyThread(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const layer = document.getElementById("homepageEffectLayer");
  const modal = layer?.querySelector("#freedomWallReplyThread");
  stopFreedomWallReplyThreadLive();
  clearFreedomWallReplyActionMenu();
  clearFreedomWallReplyParent();
  freedomWallReplyThreadNoteId = "";
  freedomWallReplyThreadCache = [];
  if (modal) modal.hidden = true;
  layer?.classList?.remove("is-reply-thread-open");
  freedomWallReaderLastTick = performance.now();
  syncFreedomWallChildModalCloseSafety();
}

async function submitFreedomWallReply(event) {
  event?.preventDefault?.();
  if (freedomWallReplyPosting || !freedomWallReplyThreadNoteId) return;
  const layer = document.getElementById("homepageEffectLayer");
  const authorInput = layer?.querySelector("#freedomWallReplyAuthor");
  const replyInput = layer?.querySelector("#freedomWallReplyInput");
  const send = layer?.querySelector("#freedomWallReplySend");
  const status = layer?.querySelector("#freedomWallReplyStatus");
  const author = String(authorInput?.value || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
  const isSirJR = isFreedomWallSirJRNickname(author);
  const publicAuthor = getFreedomWallPublicAuthor(author, isSirJR);
  const text = String(replyInput?.value || "").trim().slice(0, FREEDOM_WALL_REPLY_MAX_LENGTH);
  if (!author) { if (status) status.textContent = "Add your name or nickname first."; authorInput?.focus(); return; }
  if (!text) { if (status) status.textContent = "Write a reply first."; replyInput?.focus(); return; }
  const note = getFreedomWallReplyNote();
  if (!note) { if (status) status.textContent = "This note is no longer available."; return; }
  const priorReplyCount = Math.max(0, Math.floor(Number(note.replyCount || 0) || 0));
  freedomWallReplyPosting = true;
  if (send) send.disabled = true;
  if (status) status.textContent = "Sending…";
  try {
    const db = await waitForClassBoardFirestore(12000);
    if (!db) throw new Error("Replies are unavailable.");
    const replyRef = db.collection(FREEDOM_WALL_REPLY_COLLECTION).doc();
    const noteRef = db.collection(FREEDOM_WALL_COLLECTION).doc(note.id);
    const deviceId = getFreedomWallDeviceId();
    const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    const payload = {
      NoteID: note.id,
      WallID: note.wallId || FREEDOM_WALL_LEGACY_SESSION_ID,
      ParentReplyID: freedomWallReplyParentId || "",
      Text: text,
      Name: publicAuthor,
      DeviceId: deviceId,
      CreatedAtMs: Date.now(),
      CreatedAt: serverTimestamp
    };
    if (isSirJR) payload.IsSirJR = true;
    const batch = db.batch();
    batch.set(replyRef, payload);
    const noteUpdate = {
      ReplyCount: firebase.firestore.FieldValue.increment(1),
      ReplyLastId: replyRef.id,
      ReplyDeviceId: deviceId,
      ReplyUpdatedAt: serverTimestamp
    };
    if (isSirJR) noteUpdate.SirJRReplied = true;
    batch.update(noteRef, noteUpdate);
    await batch.commit();
    saveFreedomWallAuthor(author);
    if (replyInput) replyInput.value = "";
    clearFreedomWallReplyParent();
    if (status) status.textContent = isSirJR ? "🐨 Sir JR reply sent." : "Reply sent.";
    // Optimistic count so the chip/menu feels instant; Firestore live sync will reconcile it.
    note.replyCount = Math.max(Math.max(0, Math.floor(Number(note.replyCount || 0) || 0)), priorReplyCount + 1);
    if (isSirJR) note.sirJRReplied = true;
    const card = layer?.querySelector(`.freedomWallNote[data-note-id="${CSS.escape(note.id)}"]`);
    const readerCard = layer?.querySelector(`.freedomWallReaderNote[data-reader-note-id="${CSS.escape(note.id)}"]`);
    updateFreedomWallReactionSummary(card, note.reactions, "note", note.reactionLastType);
    updateFreedomWallReactionSummary(readerCard, note.reactions, "note", note.reactionLastType);
    updateFreedomWallReactionMenuState();
  } catch (error) {
    console.warn("Freedom Wall reply failed:", error);
    if (status) status.textContent = isFreedomWallRulesCompatibilityError(error) ? "Publish the v535 Firebase Rules to enable replies and Koala identity." : "Unable to send reply right now.";
  } finally {
    freedomWallReplyPosting = false;
    if (send) send.disabled = false;
  }
}

function setupFreedomWallReplyInteractions(layer) {
  if (!layer || layer.dataset.replyInteractionsReady === "true") return;
  layer.dataset.replyInteractionsReady = "true";
  const list = layer.querySelector("#freedomWallReplyList");
  if (!list) return;

  list.addEventListener("contextmenu", (event) => {
    const item = event.target?.closest?.(".freedomWallReplyItem");
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    openFreedomWallReplyActionMenu(item.dataset.replyId, item.dataset.replyName, event.clientX, event.clientY);
  });

  list.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    const item = event.target?.closest?.(".freedomWallReplyItem");
    if (!item) return;
    clearFreedomWallReplyActionMenu();
    freedomWallReplyHoldPending = {
      item,
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      latestX:event.clientX,
      latestY:event.clientY
    };
    freedomWallReplyHoldTimer = window.setTimeout(() => {
      const pending = freedomWallReplyHoldPending;
      freedomWallReplyHoldTimer = 0;
      if (!pending || pending.pointerId !== event.pointerId || !pending.item.isConnected) return;
      openFreedomWallReplyActionMenu(pending.item.dataset.replyId, pending.item.dataset.replyName, pending.latestX, pending.latestY);
      freedomWallReplyHoldPending = null;
    }, FREEDOM_WALL_REPLY_HOLD_MS);
  }, { passive:true });

  list.addEventListener("pointermove", (event) => {
    const pending = freedomWallReplyHoldPending;
    if (!pending || pending.pointerId !== event.pointerId) return;
    pending.latestX = event.clientX;
    pending.latestY = event.clientY;
    if (Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY) > FREEDOM_WALL_REPLY_MOVE_THRESHOLD) clearFreedomWallReplyActionMenu();
  }, { passive:true });
  list.addEventListener("pointerup", (event) => { if (freedomWallReplyHoldPending?.pointerId === event.pointerId) clearFreedomWallReplyActionMenu(); }, { passive:true });
  list.addEventListener("pointercancel", (event) => { if (freedomWallReplyHoldPending?.pointerId === event.pointerId) clearFreedomWallReplyActionMenu(); }, { passive:true });

  document.addEventListener("pointerdown", (event) => {
    const menu = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReplyActionMenu");
    if (!menu || menu.hidden || menu.contains(event.target)) return;
    if (event.button === 2) return;
    clearFreedomWallReplyActionMenu();
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const wallLayer = document.getElementById("homepageEffectLayer");
    const actionMenu = wallLayer?.querySelector("#freedomWallReplyActionMenu");
    const thread = wallLayer?.querySelector("#freedomWallReplyThread");
    if (actionMenu && !actionMenu.hidden) { event.preventDefault(); event.stopImmediatePropagation(); clearFreedomWallReplyActionMenu(); return; }
    if (thread && !thread.hidden) { event.preventDefault(); event.stopImmediatePropagation(); closeFreedomWallReplyThread(event); }
  });
}


function getFreedomWallReaderNotes() {
  return (freedomWallNotesCache || [])
    .filter(Boolean)
    .slice()
    .sort((a,b) => (a.createdAtMs - b.createdAtMs) || String(a.id || "").localeCompare(String(b.id || "")))
    .slice(-FREEDOM_WALL_MAX_RENDERED_NOTES);
}

function isFreedomWallReaderOpen() {
  const reader = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReader");
  return Boolean(reader && !reader.hidden);
}

function clearFreedomWallReaderHoldTimer() {
  if (freedomWallReaderHoldTimer) window.clearTimeout(freedomWallReaderHoldTimer);
  freedomWallReaderHoldTimer = 0;
}

function stopFreedomWallReaderClock() {
  if (freedomWallReaderRaf) cancelAnimationFrame(freedomWallReaderRaf);
  freedomWallReaderRaf = 0;
  freedomWallReaderLastTick = 0;
}

function resetFreedomWallReaderClock() {
  freedomWallReaderElapsedMs = 0;
  freedomWallReaderLastTick = performance.now();
  updateFreedomWallReaderProgress();
}

function isFreedomWallReaderTemporarilyPaused() {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || !isFreedomWallReaderOpen()) return true;
  const reactionOpen = Boolean(layer.querySelector("#freedomWallReactionMenu") && !layer.querySelector("#freedomWallReactionMenu").hidden);
  const replyOpen = Boolean(layer.querySelector("#freedomWallReplyThread") && !layer.querySelector("#freedomWallReplyThread").hidden);
  return Boolean(
    freedomWallReaderPaused
    || freedomWallReaderHoveringNote
    || freedomWallReaderPointer
    || reactionOpen
    || replyOpen
    || Boolean(freedomWallActiveYoutubePlayback)
    || Boolean(freedomWallActiveSpotifyPlayback)
    || document.hidden
  );
}

function updateFreedomWallReaderProgress() {
  const layer = document.getElementById("homepageEffectLayer");
  const bar = layer?.querySelector("#freedomWallReaderProgress i");
  if (!bar) return;
  const ratio = Math.max(0, Math.min(1, freedomWallReaderElapsedMs / FREEDOM_WALL_READER_DURATION_MS));
  bar.style.width = `${(ratio * 100).toFixed(3)}%`;
}

function tickFreedomWallReader(now) {
  if (!isFreedomWallReaderOpen()) { stopFreedomWallReaderClock(); return; }
  if (!freedomWallReaderLastTick) freedomWallReaderLastTick = now;
  const delta = Math.max(0, Math.min(250, now - freedomWallReaderLastTick));
  freedomWallReaderLastTick = now;
  if (!isFreedomWallReaderTemporarilyPaused() && getFreedomWallReaderNotes().length > 1) {
    freedomWallReaderElapsedMs += delta;
    if (freedomWallReaderElapsedMs >= FREEDOM_WALL_READER_DURATION_MS) {
      moveFreedomWallReader(1, { resetTimer:true, source:"auto" });
    } else {
      updateFreedomWallReaderProgress();
    }
  }
  freedomWallReaderRaf = requestAnimationFrame(tickFreedomWallReader);
}

function startFreedomWallReaderClock() {
  stopFreedomWallReaderClock();
  freedomWallReaderLastTick = performance.now();
  freedomWallReaderRaf = requestAnimationFrame(tickFreedomWallReader);
}

function syncFreedomWallReaderPauseButton() {
  const button = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallReaderPauseBtn");
  if (!button) return;
  const icon = button.querySelector("span");
  const label = button.querySelector("small");
  if (icon) icon.textContent = freedomWallReaderPaused ? "▶" : "⏸";
  if (label) label.textContent = freedomWallReaderPaused ? "Resume" : "Pause";
  button.setAttribute("aria-label", freedomWallReaderPaused ? "Resume automatic note switching" : "Pause automatic note switching");
  button.title = freedomWallReaderPaused ? "Resume auto-switch" : "Pause auto-switch";
  button.classList.toggle("is-paused", freedomWallReaderPaused);
}

function toggleFreedomWallReaderPause(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (!isFreedomWallReaderOpen()) return;
  freedomWallReaderPaused = !freedomWallReaderPaused;
  freedomWallReaderLastTick = performance.now();
  syncFreedomWallReaderPauseButton();
}

function makeFreedomWallReaderMediaFresh(card, note) {
  if (!card || !note) return;
  const media = card.querySelector(".freedomWallNoteMedia");
  if (!media) return;
  media.replaceChildren();
  media.dataset.mediaLoaded = "";
  media.classList.remove("is-unavailable", "is-youtube-playing", "is-spotify-playing");
  media.classList.add("is-loading");
  const loading = document.createElement("span");
  loading.textContent = note.youtubeUrl ? "Loading video…" : (note.gif?.url ? "Loading GIF…" : "Loading media…");
  media.appendChild(loading);
  window.requestAnimationFrame(() => hydrateFreedomWallNoteMedia(card, note));
}

function clearFreedomWallReaderFitTimers() {
  if (freedomWallReaderFitRaf) cancelAnimationFrame(freedomWallReaderFitRaf);
  freedomWallReaderFitRaf = 0;
  freedomWallReaderFitTimers.forEach((timerId) => window.clearTimeout(timerId));
  freedomWallReaderFitTimers = [];
}

function fitFreedomWallReaderNote() {
  if (!isFreedomWallReaderOpen()) return;
  const layer = document.getElementById("homepageEffectLayer");
  const reader = layer?.querySelector("#freedomWallReader");
  const viewport = layer?.querySelector("#freedomWallReaderViewport");
  const card = layer?.querySelector(".freedomWallReaderNote");
  if (!reader || !viewport || !card || !card.isConnected) return;

  const readerRect = reader.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const safeW = Math.max(120, Math.min(viewport.clientWidth || viewportRect.width || 0, viewportRect.width || 0) - 8);
  const safeH = Math.max(120, Math.min(viewport.clientHeight || viewportRect.height || 0, viewportRect.height || 0) - 8);
  card.style.setProperty("--fw-reader-fit-scale", "1");
  card.style.removeProperty("max-height");
  card.style.removeProperty("height");

  // Use the actual rendered size, including pseudo-element decorations and media.
  const rect = card.getBoundingClientRect();
  const naturalW = Math.max(1, card.scrollWidth || card.offsetWidth || rect.width || 1);
  const naturalH = Math.max(1, card.scrollHeight || card.offsetHeight || rect.height || 1);
  const mobile = readerRect.width <= 700 || window.matchMedia?.("(max-width:700px)")?.matches;
  const hasMedia = card.classList.contains("has-media") || card.classList.contains("has-video") || card.classList.contains("has-gif") || card.querySelector(".freedomWallNoteMedia");
  const maxScale = mobile ? (hasMedia ? 1.46 : 1.72) : (hasMedia ? 1.82 : 2.15);
  const minScale = mobile ? 0.10 : 0.12;
  let scale = Math.min(maxScale, safeW / naturalW, safeH / naturalH);
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;
  scale = Math.max(minScale, Math.min(maxScale, scale));
  card.style.setProperty("--fw-reader-fit-scale", scale.toFixed(4));
  viewport.classList.toggle("is-reader-scaled-down", scale < .985);
  viewport.classList.toggle("is-reader-scaled-up", scale > 1.025);
}

function scheduleFreedomWallReaderFit() {
  clearFreedomWallReaderFitTimers();
  if (!isFreedomWallReaderOpen()) return;
  const run = () => fitFreedomWallReaderNote();
  freedomWallReaderFitRaf = requestAnimationFrame(() => {
    freedomWallReaderFitRaf = 0;
    run();
    freedomWallReaderFitTimers.push(window.setTimeout(run, 70));
    freedomWallReaderFitTimers.push(window.setTimeout(run, 220));
    freedomWallReaderFitTimers.push(window.setTimeout(run, 650));
  });
}

function renderFreedomWallReaderNote({ animateDirection = 0 } = {}) {
  const layer = document.getElementById("homepageEffectLayer");
  const reader = layer?.querySelector("#freedomWallReader");
  const mount = layer?.querySelector("#freedomWallReaderCardMount");
  const empty = layer?.querySelector("#freedomWallReaderEmpty");
  const counter = layer?.querySelector("#freedomWallReaderCounter");
  const prev = layer?.querySelector("#freedomWallReaderPrevBtn");
  const next = layer?.querySelector("#freedomWallReaderNextBtn");
  if (!reader || !mount) return;

  const notes = getFreedomWallReaderNotes();
  if (!notes.length) {
    freedomWallReaderIndex = 0;
    freedomWallReaderNoteId = "";
    mount.replaceChildren();
    if (empty) empty.hidden = false;
    if (counter) counter.textContent = "0 / 0";
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    updateFreedomWallReaderProgress();
    return;
  }

  if (freedomWallReaderNoteId) {
    const keepIndex = notes.findIndex((note) => String(note.id) === String(freedomWallReaderNoteId));
    if (keepIndex >= 0) freedomWallReaderIndex = keepIndex;
    else freedomWallReaderIndex = Math.max(0, Math.min(notes.length - 1, freedomWallReaderIndex));
  } else {
    freedomWallReaderIndex = Math.max(0, Math.min(notes.length - 1, freedomWallReaderIndex));
  }

  const note = notes[freedomWallReaderIndex];
  freedomWallReaderNoteId = String(note.id || "");
  if (counter) counter.textContent = `${freedomWallReaderIndex + 1} / ${notes.length}`;
  if (prev) prev.disabled = notes.length < 2;
  if (next) next.disabled = notes.length < 2;
  if (empty) empty.hidden = true;

  const source = layer.querySelector(`.freedomWallNote[data-note-id="${CSS.escape(freedomWallReaderNoteId)}"]`);
  let card = source?.cloneNode(true);
  if (!card) {
    const showMedia = Boolean(note.mediaRef || note.youtubeUrl || note.gif?.url || note.spotify?.url);
    card = document.createElement("article");
    card.className = `freedomWallNote is-${note.color || "yellow"} is-size-${getFreedomWallNoteSizeClass(note)}${showMedia ? " has-media" : ""}${note.youtubeUrl ? " has-video" : ""}${note.gif?.url ? " has-gif" : ""}${note.spotify?.url ? " has-spotify" : ""}`;
    card.style.setProperty("--fw-note-bg", FREEDOM_WALL_COLOR_HEX[note.color] || FREEDOM_WALL_COLOR_HEX.yellow);
    const requestedTextColor = freedomWallConfig?.freedomWallAllowTextColor && note.textColor ? note.textColor : getFreedomWallThemeDefaultTextColor(freedomWallConfig?.freedomWallTheme);
    const effectiveTextColor = resolveFreedomWallTextColor(requestedTextColor, note.color, freedomWallConfig?.freedomWallTheme);
    card.classList.add("has-safe-text");
    card.style.setProperty("--fw-note-text-color", FREEDOM_WALL_TEXT_COLOR_HEX[effectiveTextColor] || FREEDOM_WALL_TEXT_COLOR_HEX.charcoal);
    card.style.setProperty("--fw-note-text-shadow", getFreedomWallTextContrastAssist(effectiveTextColor, freedomWallConfig?.freedomWallTheme));
    if (freedomWallConfig?.freedomWallAllowFont && note.fontStyle && note.fontStyle !== "theme-default") card.classList.add(`is-font-${note.fontStyle}`);
    const pin = document.createElement("i");
    pin.className = "freedomWallNotePin";
    card.appendChild(pin);
    if (showMedia) {
      const media = document.createElement("div");
      media.className = "freedomWallNoteMedia is-loading";
      media.innerHTML = "<span>Loading media…</span>";
      card.appendChild(media);
    }
    const text = document.createElement("p");
    text.textContent = note.text || "";
    card.appendChild(text);
    if (freedomWallConfig?.freedomWallShowNames && note.author) {
      const author = document.createElement("small");
      author.textContent = `— ${note.author}`;
      card.appendChild(author);
    }
  }

  card.removeAttribute("data-note-id");
  card.dataset.readerNoteId = freedomWallReaderNoteId;
  card.classList.add("freedomWallReaderNote");
  card.classList.remove("is-new", "is-dragging", "is-inline-video-active");
  card.style.removeProperty("visibility");
  card.style.removeProperty("z-index");
  card.style.setProperty("--fw-rotation", "0deg");
  card.style.setProperty("--fw-skew", "0deg");
  card.style.setProperty("--fw-scale", "1");
  updateFreedomWallReactionSummary(card, note.reactions, "note", note.reactionLastType);

  mount.replaceChildren(card);
  scheduleFreedomWallReaderFit();
  if (animateDirection) {
    mount.dataset.direction = animateDirection > 0 ? "next" : "prev";
    mount.classList.remove("is-reader-enter");
    void mount.offsetWidth;
    mount.classList.add("is-reader-enter");
  } else {
    mount.removeAttribute("data-direction");
    mount.classList.remove("is-reader-enter");
  }

  card.addEventListener("mouseenter", () => {
    freedomWallReaderHoveringNote = true;
    freedomWallReaderLastTick = performance.now();
  });
  card.addEventListener("mouseleave", () => {
    freedomWallReaderHoveringNote = false;
    freedomWallReaderLastTick = performance.now();
  });

  makeFreedomWallReaderMediaFresh(card, note);
  card.addEventListener("load", scheduleFreedomWallReaderFit, true);
  card.querySelectorAll("img, iframe").forEach((asset) => {
    asset.addEventListener("load", scheduleFreedomWallReaderFit, { once:false });
    asset.addEventListener("error", scheduleFreedomWallReaderFit, { once:false });
  });
  scheduleFreedomWallReaderFit();
}

function moveFreedomWallReader(direction, { resetTimer = true, source = "manual" } = {}) {
  if (!isFreedomWallReaderOpen()) return;
  const notes = getFreedomWallReaderNotes();
  if (!notes.length) { renderFreedomWallReaderNote(); return; }
  if (notes.length > 1) {
    const step = direction < 0 ? -1 : 1;
    freedomWallReaderIndex = (freedomWallReaderIndex + step + notes.length) % notes.length;
    freedomWallReaderNoteId = String(notes[freedomWallReaderIndex]?.id || "");
  }
  freedomWallReaderHoveringNote = false;
  freedomWallReaderPointer = null;
  clearFreedomWallReaderHoldTimer();
  if (resetTimer) resetFreedomWallReaderClock();
  renderFreedomWallReaderNote({ animateDirection:direction });
  freedomWallReaderLastTick = performance.now();
}

function syncFreedomWallReaderFromNotes({ preserveProgress = true } = {}) {
  if (!isFreedomWallReaderOpen()) return;
  const currentId = freedomWallReaderNoteId;
  const notes = getFreedomWallReaderNotes();
  if (currentId) {
    const index = notes.findIndex((note) => String(note.id) === String(currentId));
    if (index >= 0) freedomWallReaderIndex = index;
    else if (notes.length) freedomWallReaderIndex = Math.min(freedomWallReaderIndex, notes.length - 1);
  }
  renderFreedomWallReaderNote();
  if (!preserveProgress) resetFreedomWallReaderClock();
}

function openFreedomWallReader(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const layer = document.getElementById("homepageEffectLayer");
  const reader = layer?.querySelector("#freedomWallReader");
  if (!layer || !reader || !layer.classList.contains("is-freedom-wall")) return;
  closeFreedomWallReactionMenu();
  clearFreedomWallReplyActionMenu();
  closeFreedomWallActiveSpotify({ resumeMusic:true });
  closeFreedomWallActiveYoutube({ resumeMusic:true });
  endFreedomWallNoteDrag(null, true);
  freedomWallReaderPaused = false;
  freedomWallReaderHoveringNote = false;
  freedomWallReaderPointer = null;
  clearFreedomWallReaderHoldTimer();

  const notes = getFreedomWallReaderNotes();
  freedomWallReaderIndex = 0;
  freedomWallReaderNoteId = String(notes[0]?.id || "");
  reader.hidden = false;
  document.documentElement.classList.add("sfkFreedomWallReaderNoScroll");
  document.body?.classList?.add("sfkFreedomWallReaderNoScroll");
  layer.classList.add("is-freedom-wall-reader-open");
  syncFreedomWallReaderPauseButton();
  resetFreedomWallReaderClock();
  renderFreedomWallReaderNote();
  syncFreedomWallChildModalCloseSafety();
  startFreedomWallReaderClock();
  window.setTimeout(() => layer.querySelector("#freedomWallReaderNextBtn")?.focus({ preventScroll:true }), 30);
}

function closeFreedomWallReader(event, { force = false } = {}) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const layer = document.getElementById("homepageEffectLayer");
  const reader = layer?.querySelector("#freedomWallReader");
  if (!reader || (reader.hidden && !force)) return;
  stopFreedomWallReaderClock();
  clearFreedomWallReaderHoldTimer();
  clearFreedomWallReaderFitTimers();
  freedomWallReaderPointer = null;
  freedomWallReaderHoveringNote = false;
  freedomWallReaderPaused = false;
  freedomWallReaderElapsedMs = 0;
  freedomWallReaderLastTick = 0;
  freedomWallReaderNoteId = "";
  freedomWallReaderIndex = 0;
  const mount = layer?.querySelector("#freedomWallReaderCardMount");
  if (mount) mount.replaceChildren();
  reader.hidden = true;
  document.documentElement.classList.remove("sfkFreedomWallReaderNoScroll");
  document.body?.classList?.remove("sfkFreedomWallReaderNoScroll");
  layer?.classList?.remove("is-freedom-wall-reader-open");
  syncFreedomWallReaderPauseButton();
  updateFreedomWallReaderProgress();
  syncFreedomWallChildModalCloseSafety();
}

function setupFreedomWallReaderInteractions(layer) {
  if (!layer || layer.dataset.readerInteractionsReady === "true") return;
  layer.dataset.readerInteractionsReady = "true";
  const viewport = layer.querySelector("#freedomWallReaderViewport");
  if (!viewport) return;

  viewport.addEventListener("contextmenu", (event) => {
    const card = event.target?.closest?.(".freedomWallReaderNote");
    if (!card || !isFreedomWallReaderOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    clearFreedomWallReaderHoldTimer();
    freedomWallReaderPointer = null;
    const noteId = String(card.dataset.readerNoteId || freedomWallReaderNoteId || "");
    if (noteId) openFreedomWallReactionMenu({ type:"note", id:noteId }, event.clientX, event.clientY, "mouse");
  }, true);

  viewport.addEventListener("pointerdown", (event) => {
    if (!isFreedomWallReaderOpen()) return;
    const card = event.target?.closest?.(".freedomWallReaderNote");
    if (!card) return;
    if (event.target?.closest?.("button,a,input,textarea,select,iframe,.freedomWallYoutubeFrame,.freedomWallYoutubePlayCard,.freedomWallSpotifyFrame,.freedomWallSpotifyPlayCard")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearFreedomWallReaderHoldTimer();
    freedomWallReaderPointer = {
      pointerId:event.pointerId,
      pointerType:event.pointerType,
      startX:event.clientX,
      startY:event.clientY,
      latestX:event.clientX,
      latestY:event.clientY,
      card
    };
    freedomWallReaderLastTick = performance.now();
    if (event.pointerType !== "mouse") {
      freedomWallReaderHoldTimer = window.setTimeout(() => {
        const pending = freedomWallReaderPointer;
        freedomWallReaderHoldTimer = 0;
        if (!pending || pending.pointerId !== event.pointerId || !pending.card?.isConnected) return;
        const noteId = String(pending.card.dataset.readerNoteId || freedomWallReaderNoteId || "");
        const x = pending.latestX, y = pending.latestY;
        freedomWallReaderPointer = null;
        if (noteId) openFreedomWallReactionMenu({ type:"note", id:noteId }, x, y, pending.pointerType || "touch");
      }, FREEDOM_WALL_REACTION_HOLD_MS);
    }
  }, { passive:true });

  viewport.addEventListener("pointermove", (event) => {
    const pending = freedomWallReaderPointer;
    if (!pending || pending.pointerId !== event.pointerId) return;
    pending.latestX = event.clientX;
    pending.latestY = event.clientY;
    const dx = event.clientX - pending.startX;
    const dy = event.clientY - pending.startY;
    if (Math.hypot(dx, dy) > FREEDOM_WALL_READER_MOVE_THRESHOLD) clearFreedomWallReaderHoldTimer();
    if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.08 && event.cancelable) event.preventDefault();
  }, { passive:false });

  const finishPointer = (event, cancelled = false) => {
    const pending = freedomWallReaderPointer;
    if (!pending || pending.pointerId !== event.pointerId) return;
    clearFreedomWallReaderHoldTimer();
    freedomWallReaderPointer = null;
    freedomWallReaderLastTick = performance.now();
    if (cancelled) return;
    const dx = event.clientX - pending.startX;
    const dy = event.clientY - pending.startY;
    if (Math.abs(dx) >= FREEDOM_WALL_READER_SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.12) {
      moveFreedomWallReader(dx < 0 ? 1 : -1, { resetTimer:true, source:"swipe" });
    }
  };
  viewport.addEventListener("pointerup", (event) => finishPointer(event, false), { passive:true });
  viewport.addEventListener("pointercancel", (event) => finishPointer(event, true), { passive:true });
  viewport.addEventListener("lostpointercapture", (event) => finishPointer(event, true), { passive:true });
  if (!window.__sfkFreedomWallReaderFitResizeReady) {
    window.__sfkFreedomWallReaderFitResizeReady = true;
    window.addEventListener("resize", scheduleFreedomWallReaderFit, { passive:true });
    window.addEventListener("orientationchange", () => window.setTimeout(scheduleFreedomWallReaderFit, 180), { passive:true });
  }
}

function setupFreedomWallNoteDragging(layer) {
  const stage = layer?.querySelector?.("#freedomWallNotesStage");
  const overlay = layer?.querySelector?.("#freedomWallDragOverlay");
  if (!stage || !overlay || layer.dataset.dragReady === "true") return;
  layer.dataset.dragReady = "true";

  // v484: touch gesture split. A deliberate stationary hold opens reactions;
  // movement beyond the threshold starts dragging immediately. Desktop keeps
  // left-drag for movement and right-click for reactions.
  layer.addEventListener("pointerdown", (event) => {
    const card = event.target?.closest?.(".freedomWallNote");
    if (!card || card.classList.contains("freedomWallReaderNote") || !layer.contains(card) || event.target?.closest?.("#freedomWallReactionMenu") || event.target?.closest?.("button,a,input,textarea,select,iframe,.freedomWallYoutubeFrame,.freedomWallYoutubePlayCard,.freedomWallSpotifyFrame,.freedomWallSpotifyPlayCard")) return;
    if (layer.classList.contains("is-reaction-menu-open")) return;
    closeFreedomWallReactionMenu();

    if (freedomWallDragState && freedomWallDragState.pointerId !== event.pointerId) endFreedomWallNoteDrag(null, true);

    if (event.pointerType === "mouse") {
      if (event.button !== 0) return;
      beginFreedomWallNoteDrag(card, event);
      return;
    }

    clearFreedomWallDragLongPressTimer();
    freedomWallDragPending = {
      card, stage, pointerId:event.pointerId, pointerType:event.pointerType,
      startX:event.clientX, startY:event.clientY, latestX:event.clientX, latestY:event.clientY
    };
    // Do not capture the pointer while merely waiting for a long press.
    // Capture starts only if the gesture becomes a real drag. This prevents
    // the reaction picker from fighting the held note on phones.
    freedomWallDragLongPressTimer = window.setTimeout(() => {
      const pending = freedomWallDragPending;
      freedomWallDragLongPressTimer = 0;
      if (!pending || pending.pointerId !== event.pointerId || !pending.card.isConnected) return;
      const id = String(pending.card.dataset.noteId || "");
      const x = pending.latestX, y = pending.latestY, pointerType = pending.pointerType;
      freedomWallDragPending = null;
      if (id) openFreedomWallReactionMenu({ type:"note", id }, x, y, pointerType || "touch");
    }, FREEDOM_WALL_REACTION_HOLD_MS);
    if (event.cancelable) event.preventDefault();
  });

  const handleFreedomWallPointerMotion = (event) => {
    if (freedomWallDragState && freedomWallDragState.pointerId === event.pointerId) {
      moveFreedomWallNoteDrag(event);
      return;
    }
    const pending = freedomWallDragPending;
    if (!pending || pending.pointerId !== event.pointerId) return;
    let sample = event;
    try {
      const points = event.getCoalescedEvents?.();
      if (points?.length) sample = points[points.length - 1];
    } catch (error) {}
    pending.latestX = sample.clientX;
    pending.latestY = sample.clientY;
    const moved = Math.hypot(sample.clientX - pending.startX, sample.clientY - pending.startY);
    if (moved > FREEDOM_WALL_REACTION_MOVE_THRESHOLD) {
      clearFreedomWallDragLongPressTimer();
      const startEvent = {
        pointerId: pending.pointerId,
        pointerType: pending.pointerType,
        clientX: pending.startX,
        clientY: pending.startY,
        preventDefault() {}
      };
      const card = pending.card;
      beginFreedomWallNoteDrag(card, startEvent);
      moveFreedomWallNoteDrag(event);
      return;
    }
    if (event.cancelable) event.preventDefault();
  };

  const dragMoveEvent = ("onpointerrawupdate" in window) ? "pointerrawupdate" : "pointermove";
  document.addEventListener(dragMoveEvent, handleFreedomWallPointerMotion, { capture:true, passive:false });
  if (dragMoveEvent !== "pointermove") {
    document.addEventListener("pointermove", (event) => {
      if (freedomWallDragState) return;
      handleFreedomWallPointerMotion(event);
    }, { capture:true, passive:false });
  }

  document.addEventListener("pointerup", (event) => {
    if ((freedomWallDragState && freedomWallDragState.pointerId === event.pointerId) || (freedomWallDragPending && freedomWallDragPending.pointerId === event.pointerId)) endFreedomWallNoteDrag(event);
  }, true);
  document.addEventListener("pointercancel", (event) => {
    if (freedomWallDragPending?.pointerId === event.pointerId) endFreedomWallNoteDrag(event);
  }, true);
  window.addEventListener("blur", () => { endFreedomWallNoteDrag(null, true); clearFreedomWallPromptReactionPending(); closeFreedomWallReactionMenu(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { endFreedomWallNoteDrag(null, true); clearFreedomWallPromptReactionPending(); closeFreedomWallReactionMenu(); }
  });

  layer.addEventListener("contextmenu", (event) => {
    const note = event.target?.closest?.(".freedomWallNote");
    const prompt = event.target?.closest?.("#freedomWallPromptCard");
    if (note?.classList?.contains("freedomWallReaderNote")) return;
    if (!note && (!prompt || event.target?.closest?.("button,a,input,textarea,select,iframe,.freedomWallYoutubeFrame,.freedomWallYoutubePlayCard,.freedomWallSpotifyFrame,.freedomWallSpotifyPlayCard"))) return;
    event.preventDefault();
    event.stopPropagation();
    endFreedomWallNoteDrag(null, true);
    clearFreedomWallDragLongPressTimer();
    clearFreedomWallPromptReactionPending();
    try { window.getSelection?.()?.removeAllRanges?.(); } catch (error) {}
    if (note) {
      openFreedomWallReactionMenu({ type:"note", id:String(note.dataset.noteId || "") }, event.clientX, event.clientY, "mouse");
      return;
    }
    const docId = getFreedomWallPromptReactionDocId();
    if (docId) openFreedomWallReactionMenu({ type:"prompt", id:docId }, event.clientX, event.clientY, "mouse");
  }, true);
}


function freedomWallSplitDataUrl(dataUrl = "") {
  const raw = String(dataUrl || "").trim();
  const match = raw.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) return null;
  return { mimeType: String(match[1] || "").toLowerCase(), base64: match[2] || "" };
}

function freedomWallReadFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function freedomWallLoadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to open photo.")); };
    image.src = url;
  });
}

function freedomWallCanvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function prepareFreedomWallStaticImage(file) {
  if (!file || file.size <= 0) throw new Error("Choose a photo first.");
  if (file.size > FREEDOM_WALL_MEDIA_MAX_STATIC_SOURCE_BYTES) throw new Error("Photo is too large. Please choose one under 8 MB.");
  const image = await freedomWallLoadImageFromFile(file);
  let maxDimension = 1280;
  let quality = .86;
  let bestBlob = null;
  for (let attempt = 0; attempt < 9; attempt += 1) {
    const naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
    const naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
    const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Photo processing is not available on this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const blob = await freedomWallCanvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) throw new Error("Unable to prepare photo.");
    bestBlob = blob;
    if (blob.size <= FREEDOM_WALL_MEDIA_MAX_BYTES) break;
    if (quality > .58) quality -= .09;
    else maxDimension = Math.max(720, Math.round(maxDimension * .82));
  }
  if (!bestBlob || bestBlob.size > FREEDOM_WALL_MEDIA_MAX_BYTES) throw new Error("Photo could not be reduced enough. Please choose a smaller image.");
  const dataUrl = await freedomWallReadFileAsDataUrl(bestBlob);
  const parsed = freedomWallSplitDataUrl(dataUrl);
  if (!parsed) throw new Error("Unable to prepare photo.");
  return {
    name: String(file.name || "polaroid-photo.jpg").slice(0, 120),
    mimeType: "image/jpeg",
    dataUrl,
    base64: parsed.base64,
    bytesApprox: bestBlob.size,
    isGif: false
  };
}

async function prepareFreedomWallMediaFile(file, { forceGifOnly = false } = {}) {
  if (!file) return null;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const isGif = type === "image/gif" || name.endsWith(".gif");
  if (forceGifOnly && !isGif) throw new Error("Choose a GIF file only.");
  if (isGif) {
    if (file.size > FREEDOM_WALL_MEDIA_MAX_GIF_BYTES) throw new Error("Animated GIF must be 500 KB or smaller so the wall stays fast on phones.");
    const dataUrl = await freedomWallReadFileAsDataUrl(file);
    const parsed = freedomWallSplitDataUrl(dataUrl);
    if (!parsed || parsed.mimeType !== "image/gif") throw new Error("That GIF could not be read.");
    return {
      name: String(file.name || "polaroid.gif").slice(0, 120),
      mimeType: "image/gif",
      dataUrl,
      base64: parsed.base64,
      bytesApprox: file.size,
      isGif: true
    };
  }
  if (!["image/jpeg","image/jpg","image/png","image/webp"].includes(type) && !/\.(jpe?g|png|webp)$/i.test(name)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF only.");
  }
  return prepareFreedomWallStaticImage(file);
}

function resetFreedomWallPendingMedia() {
  freedomWallMediaPrepareToken += 1;
  freedomWallPendingMedia = null;
  freedomWallPendingYouTubeUrl = "";
  freedomWallPendingYouTube = null;
  freedomWallPendingGif = null;
  const layer = document.getElementById("homepageEffectLayer");
  const input = layer?.querySelector("#freedomWallMediaInput");
  const preview = layer?.querySelector("#freedomWallMediaPreview");
  const remove = layer?.querySelector("#freedomWallMediaRemove");
  const youtube = layer?.querySelector("#freedomWallYouTubeInput");
  const youtubeSearch = layer?.querySelector("#freedomWallYouTubeSearchInput");
  const youtubeResults = layer?.querySelector("#freedomWallYouTubeResults");
  const youtubeSelected = layer?.querySelector("#freedomWallYouTubeSelected");
  const gifSearch = layer?.querySelector("#freedomWallGifSearchInput");
  const gifResults = layer?.querySelector("#freedomWallGifResults");
  const gifSelected = layer?.querySelector("#freedomWallGifSelected");
  if (input) input.value = "";
  if (youtube) youtube.value = "";
  if (youtubeSearch) youtubeSearch.value = "";
  if (youtubeResults) youtubeResults.replaceChildren();
  if (youtubeSelected) { youtubeSelected.hidden = true; youtubeSelected.replaceChildren(); }
  if (gifSearch) gifSearch.value = "";
  if (gifResults) gifResults.replaceChildren();
  if (gifSelected) { gifSelected.hidden = true; gifSelected.replaceChildren(); }
  if (preview) {
    preview.hidden = true;
    preview.replaceChildren();
  }
  if (remove) remove.hidden = true;
  updateFreedomWallMediaUi();
}

function getFreedomWallAllowedAttachmentModes() {
  const theme = String(freedomWallConfig?.freedomWallTheme || "").trim().toLowerCase();
  const isPolaroid = theme === "polaroid";
  const allowGif = Boolean(freedomWallConfig?.freedomWallAllowGif);
  const searchEndpoint = getFreedomWallMediaSearchEndpoint();
  const giphyKey = getFreedomWallGiphyApiKey();
  const allowGifSearch = Boolean(freedomWallConfig?.freedomWallAllowGifSearch && giphyKey);
  const allowYouTube = Boolean(freedomWallConfig?.freedomWallAllowYouTube);
  const allowYouTubeSearch = Boolean(freedomWallConfig?.freedomWallAllowYouTubeSearch && searchEndpoint);
  const modes = [{ value:"none", label:"None" }];
  if (isPolaroid) modes.push({ value:"image", label:"Photo / GIF" });
  else if (allowGifSearch) modes.push({ value:"gif-search", label:"GIF Search" });
  else if (allowGif) modes.push({ value:"gif", label:"GIF Upload" });
  if (allowYouTubeSearch) modes.push({ value:"youtube-search", label:"YouTube Search" });
  else if (allowYouTube) modes.push({ value:"youtube", label:"YouTube Link" });
  return modes;
}

function setFreedomWallAttachmentMode(mode = "none") {
  const allowed = getFreedomWallAllowedAttachmentModes().map((item) => item.value);
  const next = allowed.includes(mode) ? mode : (allowed.includes("image") ? "image" : allowed[0] || "none");
  freedomWallSelectedAttachmentMode = next;
  if (next !== "youtube" && next !== "youtube-search") { freedomWallPendingYouTubeUrl = ""; freedomWallPendingYouTube = null; }
  if (next !== "gif-search") freedomWallPendingGif = null;
  if (["youtube","youtube-search","gif-search"].includes(next)) freedomWallPendingMedia = null;
  updateFreedomWallMediaUi();
}

function updateFreedomWallMediaUi() {
  const layer = document.getElementById("homepageEffectLayer");
  const field = layer?.querySelector("#freedomWallMediaField");
  if (!field) return;
  const typeWrap = layer.querySelector("#freedomWallMediaTypeWrap");
  const typeSelect = layer.querySelector("#freedomWallMediaType");
  const controls = layer.querySelector(".freedomWallMediaControls");
  const youtubeWrap = layer.querySelector("#freedomWallYouTubeWrap");
  const youtubeSearchWrap = layer.querySelector("#freedomWallYouTubeSearchWrap");
  const gifSearchWrap = layer.querySelector("#freedomWallGifSearchWrap");
  const chooseText = layer.querySelector("#freedomWallMediaChooseText");
  const typeLabel = layer.querySelector('label[for="freedomWallMediaType"]');
  const fileInput = layer.querySelector("#freedomWallMediaInput");
  const preview = layer.querySelector("#freedomWallMediaPreview");
  const remove = layer.querySelector("#freedomWallMediaRemove");
  const hint = layer.querySelector("#freedomWallMediaHint");
  const modes = getFreedomWallAllowedAttachmentModes();
  const canUseMedia = modes.length > 1;
  field.hidden = !canUseMedia;
  if (!canUseMedia) return;
  if (!modes.some((item) => item.value === freedomWallSelectedAttachmentMode)) {
    freedomWallSelectedAttachmentMode = modes.some((item) => item.value === "image") ? "image" : (modes[1]?.value || "none");
  }
  const attachmentLabels = getFreedomWallAttachmentLabelState();
  if (typeWrap) typeWrap.hidden = modes.length <= 2;
  if (typeLabel) typeLabel.textContent = attachmentLabels.typeLabel;
  if (typeSelect) {
    const current = Array.from(typeSelect.options).map((o) => o.value).join("|");
    const wanted = modes.map((item) => item.value).join("|");
    if (current !== wanted) typeSelect.innerHTML = modes.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
    typeSelect.value = freedomWallSelectedAttachmentMode;
  }
  const mode = freedomWallSelectedAttachmentMode;
  const fileMode = mode === "image" || mode === "gif";
  if (controls) controls.hidden = !fileMode;
  if (youtubeWrap) youtubeWrap.hidden = mode !== "youtube";
  if (youtubeSearchWrap) youtubeSearchWrap.hidden = mode !== "youtube-search";
  if (gifSearchWrap) gifSearchWrap.hidden = mode !== "gif-search";
  if (chooseText) chooseText.textContent = mode === "gif" ? "Choose GIF" : "Choose Photo / GIF";
  if (fileInput) fileInput.setAttribute("accept", mode === "gif" ? "image/gif,.gif" : "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif");
  if (hint) {
    if (mode === "youtube-search") hint.textContent = "Search YouTube, choose a result, then post a playable video preview. No autoplay.";
    else if (mode === "gif-search") hint.textContent = "Search GIFs and choose one animated GIF result. No GIF link paste needed.";
    else if (mode === "youtube") hint.textContent = "Paste a YouTube link. The video stays paused until someone presses Play.";
    else if (mode === "gif") hint.textContent = "GIF only. Static photos remain Polaroid-only.";
    else hint.textContent = "Available for the Polaroid theme.";
  }
  if (preview && mode !== "youtube" && !freedomWallPendingMedia) {
    preview.hidden = true;
    preview.replaceChildren();
  }
  if (remove) remove.hidden = !(freedomWallPendingMedia || freedomWallPendingYouTubeUrl || freedomWallPendingYouTube || freedomWallPendingGif);
}

async function handleFreedomWallYouTubeInput(event) {
  const layer = document.getElementById("homepageEffectLayer");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const remove = layer?.querySelector("#freedomWallMediaRemove");
  const raw = String(event?.target?.value || "").trim();
  if (!raw) {
    freedomWallPendingYouTubeUrl = "";
    freedomWallPendingYouTube = null;
    if (remove) remove.hidden = true;
    if (status) status.textContent = "";
    return;
  }
  const normalized = normalizeFreedomWallYouTubeUrl(raw);
  if (!normalized) {
    freedomWallPendingYouTubeUrl = "";
    if (status) status.textContent = "Use a valid YouTube link.";
    return;
  }
  freedomWallPendingMedia = null;
  freedomWallPendingGif = null;
  freedomWallPendingYouTube = normalizeFreedomWallYouTubeItem({ url: normalized });
  freedomWallPendingYouTubeUrl = normalized;
  if (status) status.textContent = "YouTube video ready.";
  if (remove) remove.hidden = false;
}

async function handleFreedomWallMediaInput(event) {
  const file = event?.target?.files?.[0] || null;
  const layer = document.getElementById("homepageEffectLayer");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const preview = layer?.querySelector("#freedomWallMediaPreview");
  const remove = layer?.querySelector("#freedomWallMediaRemove");
  if (!file) { resetFreedomWallPendingMedia(); return; }
  const token = ++freedomWallMediaPrepareToken;
  freedomWallPendingMedia = null;
  if (status) status.textContent = /gif$/i.test(file.name || "") ? "Preparing GIF…" : "Optimizing photo…";
  try {
    const prepared = await prepareFreedomWallMediaFile(file, { forceGifOnly: freedomWallSelectedAttachmentMode === "gif" });
    if (token !== freedomWallMediaPrepareToken) return;
    freedomWallPendingYouTubeUrl = "";
    freedomWallPendingMedia = prepared;
    if (preview) {
      preview.replaceChildren();
      const image = document.createElement("img");
      image.src = prepared.dataUrl;
      image.alt = prepared.isGif ? "Selected animated GIF preview" : "Selected photo preview";
      preview.appendChild(image);
      preview.hidden = false;
    }
    if (remove) remove.hidden = false;
    if (status) status.textContent = prepared.isGif ? "GIF ready." : "Photo ready.";
  } catch (error) {
    if (token !== freedomWallMediaPrepareToken) return;
    resetFreedomWallPendingMedia();
    if (status) status.textContent = error?.message || "Unable to prepare that image.";
  }
}



function syncFreedomWallChildModalCloseSafety() {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || !layer.classList.contains("is-freedom-wall")) return;
  const composer = layer.querySelector("#freedomWallComposer");
  const mediaModal = layer.querySelector("#freedomWallMediaSearchModal");
  const replyThread = layer.querySelector("#freedomWallReplyThread");
  const reader = layer.querySelector("#freedomWallReader");
  const childModalOpen = Boolean(
    (composer && !composer.hidden)
    || (mediaModal && !mediaModal.hidden)
    || (replyThread && !replyThread.hidden)
    || (reader && !reader.hidden)
  );
  layer.classList.toggle("has-freedom-wall-child-modal", childModalOpen);
  if (childModalOpen) {
    setHomepageEffectRealCloseVisible(false);
  } else {
    setHomepageEffectRealCloseVisible(homepageEffectDismissAllowed);
  }
}

function getFreedomWallMediaSearchModalRefs() {
  const layer = document.getElementById("homepageEffectLayer");
  const modal = layer?.querySelector("#freedomWallMediaSearchModal");
  return {
    layer,
    modal,
    title: modal?.querySelector("#freedomWallMediaSearchModalTitle"),
    hint: modal?.querySelector("#freedomWallMediaSearchModalHint"),
    input: modal?.querySelector("#freedomWallMediaSearchModalInput"),
    button: modal?.querySelector("#freedomWallMediaSearchModalBtn"),
    status: modal?.querySelector("#freedomWallMediaSearchModalStatus"),
    results: modal?.querySelector("#freedomWallMediaSearchModalResults")
  };
}

function openFreedomWallMediaSearchModal(provider = "youtube", initialQuery = "") {
  const refs = getFreedomWallMediaSearchModalRefs();
  if (!refs.modal) return;
  const safeProvider = provider === "gif" ? "gif" : "youtube";
  refs.modal.dataset.provider = safeProvider;
  refs.modal.hidden = false;
  syncFreedomWallChildModalCloseSafety();
  if (refs.title) refs.title.textContent = safeProvider === "gif" ? "Search GIFs" : "Search YouTube";
  if (refs.hint) refs.hint.textContent = safeProvider === "gif"
    ? "Browse more GIFs, then choose one."
    : "Browse more videos, then choose one.";
  if (refs.input) {
    refs.input.placeholder = safeProvider === "gif" ? "Search GIFs..." : "Song, topic, or video title...";
    if (initialQuery) refs.input.value = initialQuery;
  }
  if (refs.status) refs.status.textContent = "";
  if (refs.results) {
    refs.results.replaceChildren();
    refs.results.classList.toggle("is-gif-grid", safeProvider === "gif");
  }
  window.setTimeout(() => refs.input?.focus(), 20);
  if (String(initialQuery || "").trim()) runFreedomWallMediaSearchModalSearch();
}

function closeFreedomWallMediaSearchModal(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const refs = getFreedomWallMediaSearchModalRefs();
  if (!refs.modal) return;
  refs.modal.hidden = true;
  refs.modal.removeAttribute("data-provider");
  syncFreedomWallChildModalCloseSafety();
  if (refs.status) refs.status.textContent = "";
  if (refs.results) refs.results.replaceChildren();
}

async function runFreedomWallMediaSearchModalSearch() {
  if (freedomWallMediaSearchBusy) return;
  const refs = getFreedomWallMediaSearchModalRefs();
  if (!refs.modal || refs.modal.hidden) return;
  const provider = refs.modal.dataset.provider === "gif" ? "gif" : "youtube";
  const q = String(refs.input?.value || "").trim();
  if (!q) {
    if (refs.status) refs.status.textContent = provider === "gif" ? "Type a word to search GIFs." : "Type a video or song to search YouTube.";
    refs.input?.focus();
    return;
  }

  freedomWallMediaSearchBusy = provider;
  if (refs.button) refs.button.disabled = true;
  if (refs.status) refs.status.textContent = provider === "gif" ? "Searching GIPHY…" : "Searching YouTube…";
  if (refs.results) refs.results.innerHTML = `<small class="freedomWallMediaSearchEmpty">${provider === "gif" ? "Searching GIFs…" : "Searching YouTube…"}</small>`;

  try {
    const items = provider === "gif"
      ? await fetchFreedomWallGifResults(q)
      : await fetchFreedomWallYouTubeResults(q);
    if (provider === "gif") renderFreedomWallGifResults(items);
    else renderFreedomWallYouTubeResults(items);
    if (refs.status) refs.status.textContent = items.length
      ? `${items.length} ${provider === "gif" ? "GIF" : "YouTube"} result${items.length === 1 ? "" : "s"} — choose one.`
      : `No ${provider === "gif" ? "GIF" : "YouTube"} results found.`;
  } catch (error) {
    const message = String(error?.message || (provider === "gif" ? "GIF search failed." : "YouTube search failed."));
    if (refs.results) refs.results.innerHTML = `<small class="freedomWallMediaSearchEmpty">${message}</small>`;
    if (refs.status) refs.status.textContent = message;
  } finally {
    freedomWallMediaSearchBusy = "";
    if (refs.button) refs.button.disabled = false;
  }
}


function renderFreedomWallYouTubeResults(items = []) {
  const layer = document.getElementById("homepageEffectLayer");
  const results = layer?.querySelector("#freedomWallMediaSearchModalResults");
  if (!results) return;
  results.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("small");
    empty.className = "freedomWallMediaSearchEmpty";
    empty.textContent = "No YouTube videos found.";
    results.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "freedomWallMediaSearchResult is-youtube";
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = item.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(item.videoId)}/mqdefault.jpg`;
    const meta = document.createElement("span");
    meta.innerHTML = `<b></b><small></small>`;
    meta.querySelector("b").textContent = item.title;
    meta.querySelector("small").textContent = item.channel || "YouTube";
    const choose = document.createElement("em");
    choose.textContent = "Choose";
    btn.append(img, meta, choose);
    btn.addEventListener("click", () => selectFreedomWallYouTubeItem(item));
    results.appendChild(btn);
  });
}

function selectFreedomWallYouTubeItem(item) {
  const safe = normalizeFreedomWallYouTubeItem(item);
  if (!safe) return;
  freedomWallPendingMedia = null;
  freedomWallPendingGif = null;
  freedomWallPendingYouTube = safe;
  freedomWallPendingYouTubeUrl = safe.url;
  freedomWallSelectedAttachmentMode = "youtube-search";
  const layer = document.getElementById("homepageEffectLayer");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const selected = layer?.querySelector("#freedomWallYouTubeSelected");
  const remove = layer?.querySelector("#freedomWallMediaRemove");
  if (selected) {
    selected.hidden = false;
    selected.replaceChildren();
    const img = document.createElement("img");
    img.alt = "";
    img.src = safe.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(safe.videoId)}/mqdefault.jpg`;
    const meta = document.createElement("span");
    meta.innerHTML = `<strong></strong><small></small>`;
    meta.querySelector("strong").textContent = safe.title;
    meta.querySelector("small").textContent = safe.channel || "YouTube";
    selected.append(img, meta);
  }
  if (remove) remove.hidden = false;
  if (status) status.textContent = "YouTube video selected.";
  closeFreedomWallMediaSearchModal();
}

async function runFreedomWallYouTubeSearch() {
  const layer = document.getElementById("homepageEffectLayer");
  const input = layer?.querySelector("#freedomWallYouTubeSearchInput");
  const q = String(input?.value || "").trim();
  openFreedomWallMediaSearchModal("youtube", q);
}

function renderFreedomWallGifResults(items = []) {
  const layer = document.getElementById("homepageEffectLayer");
  const results = layer?.querySelector("#freedomWallMediaSearchModalResults");
  if (!results) return;
  results.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("small");
    empty.className = "freedomWallMediaSearchEmpty";
    empty.textContent = "No GIFs found.";
    results.appendChild(empty);
    return;
  }
  const attribution = document.createElement("small");
  attribution.className = "freedomWallGiphyAttribution";
  attribution.textContent = "Powered by GIPHY";
  results.appendChild(attribution);
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "freedomWallGifResult";
    const img = document.createElement("img");
    img.alt = item.title || "GIF";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = item.previewUrl || item.url;
    btn.appendChild(img);
    btn.addEventListener("click", () => selectFreedomWallGifItem(item));
    results.appendChild(btn);
  });
}

function selectFreedomWallGifItem(item) {
  const safe = normalizeFreedomWallGifItem(item);
  if (!safe) return;
  freedomWallPendingMedia = null;
  freedomWallPendingYouTubeUrl = "";
  freedomWallPendingYouTube = null;
  freedomWallPendingGif = safe;
  freedomWallSelectedAttachmentMode = "gif-search";
  const layer = document.getElementById("homepageEffectLayer");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const selected = layer?.querySelector("#freedomWallGifSelected");
  const remove = layer?.querySelector("#freedomWallMediaRemove");
  if (selected) {
    selected.hidden = false;
    selected.replaceChildren();
    const img = document.createElement("img");
    img.alt = safe.title || "Selected GIF";
    img.src = safe.previewUrl || safe.url;
    const meta = document.createElement("span");
    meta.innerHTML = `<strong></strong><small></small>`;
    meta.querySelector("strong").textContent = safe.title || "Selected GIF";
    meta.querySelector("small").textContent = "GIF selected";
    selected.append(img, meta);
  }
  if (remove) remove.hidden = false;
  if (status) status.textContent = "GIF selected.";
  closeFreedomWallMediaSearchModal();
}

async function runFreedomWallGifSearch() {
  const layer = document.getElementById("homepageEffectLayer");
  const input = layer?.querySelector("#freedomWallGifSearchInput");
  const q = String(input?.value || "").trim();
  openFreedomWallMediaSearchModal("gif", q);
}

function renderFreedomWallGifPreview(media, note) {
  const gif = note?.gif;
  if (!media || !gif?.url) return;
  media.replaceChildren();
  const img = document.createElement("img");
  img.src = gif.url;
  img.alt = gif.title || "Freedom Wall GIF";
  img.loading = "lazy";
  img.decoding = "async";
  media.appendChild(img);
  media.classList.remove("is-loading", "is-unavailable");
}

function renderFreedomWallSpotifyResults(items = []) {
  const layer = document.getElementById("homepageEffectLayer");
  const results = layer?.querySelector("#freedomWallSpotifyResults");
  if (!results) return;
  results.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("small");
    empty.className = "freedomWallSpotifyEmpty";
    empty.textContent = "No Spotify tracks found.";
    results.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "freedomWallSpotifyResult";
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = item.image || "";
    const meta = document.createElement("span");
    meta.innerHTML = `<b></b><small></small>`;
    meta.querySelector("b").textContent = item.title;
    meta.querySelector("small").textContent = item.artist || "Spotify";
    const choose = document.createElement("em");
    choose.textContent = "Choose";
    btn.append(img, meta, choose);
    btn.addEventListener("click", () => selectFreedomWallSpotifyItem(item));
    results.appendChild(btn);
  });
}

function selectFreedomWallSpotifyItem(item) {
  const safe = normalizeFreedomWallSpotifyItem(item);
  if (!safe) return;
  freedomWallPendingMedia = null;
  freedomWallPendingYouTubeUrl = "";
  freedomWallPendingYouTube = null;
  freedomWallPendingGif = null;
  freedomWallPendingSpotify = safe;
  freedomWallSelectedAttachmentMode = "spotify";
  const layer = document.getElementById("homepageEffectLayer");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const selected = layer?.querySelector("#freedomWallSpotifySelected");
  const remove = layer?.querySelector("#freedomWallMediaRemove");
  if (selected) {
    selected.hidden = false;
    selected.replaceChildren();
    const img = document.createElement("img");
    img.alt = "";
    img.src = safe.image || "";
    const meta = document.createElement("span");
    meta.innerHTML = `<strong></strong><small></small>`;
    meta.querySelector("strong").textContent = safe.title;
    meta.querySelector("small").textContent = safe.artist || "Spotify";
    selected.append(img, meta);
  }
  if (remove) remove.hidden = false;
  if (status) status.textContent = "Spotify track selected.";
}

async function runFreedomWallSpotifySearch() {
  if (freedomWallSpotifySearchBusy) return;
  const layer = document.getElementById("homepageEffectLayer");
  const input = layer?.querySelector("#freedomWallSpotifySearchInput");
  const results = layer?.querySelector("#freedomWallSpotifyResults");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const q = String(input?.value || "").trim();
  if (!q) {
    input?.focus();
    if (status) status.textContent = "Type a song or artist to search Spotify.";
    return;
  }
  freedomWallSpotifySearchBusy = true;
  if (results) results.innerHTML = '<small class="freedomWallSpotifyEmpty">Searching Spotify…</small>';
  if (status) status.textContent = "Searching Spotify…";
  try {
    const items = await fetchFreedomWallSpotifyResults(q);
    renderFreedomWallSpotifyResults(items);
    if (status) status.textContent = items.length ? "Choose a Spotify track." : "No Spotify results found.";
  } catch (error) {
    if (results) results.innerHTML = `<small class="freedomWallSpotifyEmpty">${String(error?.message || "Spotify search failed.")}</small>`;
    if (status) status.textContent = String(error?.message || "Spotify search failed.");
  } finally {
    freedomWallSpotifySearchBusy = false;
  }
}

function closeFreedomWallActiveSpotify({ resumeMusic = true } = {}) {
  const playback = freedomWallActiveSpotifyPlayback;
  if (!playback) return;
  const { media, note } = playback;
  media?.classList?.remove("is-spotify-playing");
  if (media?.isConnected) renderFreedomWallSpotifyPreview(media, note);
  if (freedomWallActiveSpotifyPlayback === playback) freedomWallActiveSpotifyPlayback = null;
  if (resumeMusic) resumeHomepageEffectMusicAfterFreedomWallVideo();
  else homepageEffectMusicSuppressedByWallVideo = false;
}

function renderFreedomWallSpotifyPreview(media, note) {
  const spotify = note?.spotify;
  if (!media || !spotify?.url) return;
  media.replaceChildren();
  const button = document.createElement("button");
  button.type = "button";
  button.className = "freedomWallSpotifyPlayCard";
  const img = document.createElement("img");
  img.alt = "Spotify track cover";
  img.loading = "lazy";
  img.decoding = "async";
  img.src = spotify.image || "";
  const meta = document.createElement("span");
  meta.className = "freedomWallSpotifyMeta";
  meta.innerHTML = `<b></b><small></small>`;
  meta.querySelector("b").textContent = spotify.title || "Spotify Track";
  meta.querySelector("small").textContent = spotify.artist || "Spotify";
  const badge = document.createElement("i");
  badge.className = "freedomWallSpotifyPlayBadge";
  badge.textContent = "▶";
  button.append(img, meta, badge);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const embed = getFreedomWallSpotifyEmbedUrl(spotify.url);
    if (!embed || !media.isConnected) return;
    if (freedomWallActiveYoutubePlayback) closeFreedomWallActiveYoutube({ resumeMusic:false });
    if (freedomWallActiveSpotifyPlayback) closeFreedomWallActiveSpotify({ resumeMusic:false });
    pauseHomepageEffectMusicForFreedomWallVideo();
    media.replaceChildren();
    media.classList.add("is-spotify-playing");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "freedomWallSpotifyClose";
    close.setAttribute("aria-label", "Close Spotify preview and resume background music");
    close.textContent = "×";
    const iframe = document.createElement("iframe");
    iframe.className = "freedomWallSpotifyFrame";
    iframe.title = `Spotify preview: ${spotify.title || "track"}`;
    iframe.src = embed;
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.loading = "lazy";
    media.append(iframe, close);
    const playback = { media, note };
    freedomWallActiveSpotifyPlayback = playback;
    close.addEventListener("click", (closeEvent) => {
      closeEvent.preventDefault();
      closeEvent.stopPropagation();
      closeFreedomWallActiveSpotify({ resumeMusic:true });
    });
  });
  media.appendChild(button);
  media.classList.remove("is-loading", "is-unavailable", "is-spotify-playing");
}

async function hydrateFreedomWallNoteMedia(card, note) {
  if (!card || (!note?.mediaRef && !note?.youtubeUrl && !note?.gif?.url && !note?.spotify?.url)) return;
  const media = card.querySelector(".freedomWallNoteMedia");
  if (!media) return;
  const expectedRef = String(note.spotify?.url || note.youtubeUrl || note.gif?.url || note.mediaRef || "");
  if (media.dataset.mediaLoaded === expectedRef && (media.querySelector("img") || media.querySelector("iframe") || media.querySelector("button"))) return;
  media.dataset.mediaLoaded = expectedRef;
  media.classList.add("is-loading");
  if (note.spotify?.url) {
    renderFreedomWallSpotifyPreview(media, note);
    return;
  }
  if (note.gif?.url) {
    renderFreedomWallGifPreview(media, note);
    return;
  }
  if (note.youtubeUrl) {
    const videoId = getFreedomWallYouTubeVideoId(note.youtubeUrl);
    if (!videoId) {
      media.replaceChildren();
      const label = document.createElement("span");
      label.textContent = "Video unavailable";
      media.appendChild(label);
      media.classList.remove("is-loading");
      media.classList.add("is-unavailable");
      return;
    }
    media.replaceChildren();
    const button = createFreedomWallYoutubePlayButton(media, videoId);
    media.appendChild(button);
    media.classList.remove("is-loading", "is-unavailable");
    return;
  }
  try {
    const dataUrl = await resolveClassBoardMediaDataUrl(expectedRef);
    if (!dataUrl || !card.isConnected || media.dataset.mediaLoaded !== expectedRef) throw new Error("Photo unavailable");
    const ref = parseClassBoardMediaRef(expectedRef);
    const displayUrl = classBoardMediaDisplayUrl(dataUrl, ref ? `${ref.kind}/${ref.id}` : expectedRef);
    media.replaceChildren();
    const image = document.createElement("img");
    image.src = displayUrl;
    image.alt = note.mediaType === "image/gif" ? "Animated Freedom Wall GIF" : "Freedom Wall media";
    image.loading = "lazy";
    image.decoding = "async";
    media.appendChild(image);
    media.classList.remove("is-loading", "is-unavailable");
  } catch (error) {
    if (!card.isConnected || media.dataset.mediaLoaded !== expectedRef) return;
    media.replaceChildren();
    const label = document.createElement("span");
    label.textContent = note.youtubeUrl ? "Video unavailable" : "Photo unavailable";
    media.appendChild(label);
    media.classList.remove("is-loading");
    media.classList.add("is-unavailable");
  }
}

function freedomWallHexToRgb(hex) {
  const value = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(value)) return { r: 255, g: 255, b: 255 };
  return { r: parseInt(value.slice(0,2),16), g: parseInt(value.slice(2,4),16), b: parseInt(value.slice(4,6),16) };
}

function freedomWallRelativeLuminance(hex) {
  const { r, g, b } = freedomWallHexToRgb(hex);
  const convert = (channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return (0.2126 * convert(r)) + (0.7152 * convert(g)) + (0.0722 * convert(b));
}

function freedomWallContrastRatio(a, b) {
  const l1 = freedomWallRelativeLuminance(a);
  const l2 = freedomWallRelativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function freedomWallMixHex(baseHex, mixHex, baseWeight = 1) {
  const a = freedomWallHexToRgb(baseHex);
  const b = freedomWallHexToRgb(mixHex);
  const w = Math.min(1, Math.max(0, Number(baseWeight) || 0));
  const toHex = (value) => Math.round(value).toString(16).padStart(2, "0");
  return `#${toHex(a.r*w+b.r*(1-w))}${toHex(a.g*w+b.g*(1-w))}${toHex(a.b*w+b.b*(1-w))}`;
}

function getFreedomWallContrastBackgrounds(color, theme = freedomWallConfig?.freedomWallTheme) {
  const safeColor = FREEDOM_WALL_COLORS.includes(String(color || "").toLowerCase()) ? String(color).toLowerCase() : "yellow";
  const base = FREEDOM_WALL_COLOR_HEX[safeColor] || FREEDOM_WALL_COLOR_HEX.yellow;
  const safeTheme = String(theme || "").toLowerCase();
  // v479: model the actual visible note/caption surfaces closely enough that
  // every note (including legacy notes without TextColor) stays readable after
  // a theme change. The saved student preference is never overwritten here.
  if (safeTheme === "polaroid") return [freedomWallMixHex(base,"#ffffff",.18), "#fffdf9"];
  if (safeTheme === "newspaper") return [freedomWallMixHex(base,"#fffef8",.42), freedomWallMixHex(base,"#e9e4d5",.36)];
  if (safeTheme === "jungle") return [freedomWallMixHex(base,"#fff5cf",.82), freedomWallMixHex(base,"#bd9d62",.82)];
  if (safeTheme === "poste") return [freedomWallMixHex(base,"#fff7e5",.84), freedomWallMixHex(base,"#c8b792",.82)];
  if (safeTheme === "coding-lab") return [freedomWallMixHex(base,"#ffffff",.88), freedomWallMixHex(base,"#18232b",.80)];
  if (safeTheme === "chalkboard") return [freedomWallMixHex(base,"#f7f0d8",.84), freedomWallMixHex(base,"#4d654f",.78)];
  return [freedomWallMixHex(base,"#ffffff",.94), freedomWallMixHex(base,"#000000",.89)];
}

function getFreedomWallThemeDefaultTextColor(theme = freedomWallConfig?.freedomWallTheme) {
  const safeTheme = String(theme || "").trim().toLowerCase();
  if (["night","rainy","flood","galaxy","retro-arcade","coding-lab","neon-music","spiderman","comic-noir"].includes(safeTheme)) return "white";
  if (["jungle","eco","chalkboard"].includes(safeTheme)) return "green";
  if (["cafe","library","brick-alley","detective","poste"].includes(safeTheme)) return "brown";
  if (["filipino","comic-strip"].includes(safeTheme)) return "navy";
  if (["cutout-pop"].includes(safeTheme)) return "charcoal";
  return "charcoal";
}

function resolveFreedomWallTextColor(textColor, backgroundColor, theme = freedomWallConfig?.freedomWallTheme) {
  const requested = FREEDOM_WALL_TEXT_COLORS.includes(String(textColor || "").toLowerCase()) ? String(textColor).toLowerCase() : getFreedomWallThemeDefaultTextColor(theme);
  const backgrounds = getFreedomWallContrastBackgrounds(backgroundColor, theme);
  const requestedHex = FREEDOM_WALL_TEXT_COLOR_HEX[requested] || FREEDOM_WALL_TEXT_COLOR_HEX.charcoal;
  const minRequestedRatio = Math.min(...backgrounds.map((bg) => freedomWallContrastRatio(requestedHex, bg)));
  if (minRequestedRatio >= 4.5) return requested;
  const candidates = ["black","charcoal","navy","brown","white"];
  let best = "black";
  let bestRatio = -1;
  for (const candidate of candidates) {
    const candidateHex = FREEDOM_WALL_TEXT_COLOR_HEX[candidate];
    const ratio = Math.min(...backgrounds.map((bg) => freedomWallContrastRatio(candidateHex, bg)));
    if (ratio > bestRatio) { best = candidate; bestRatio = ratio; }
  }
  return best;
}

function getFreedomWallTextContrastAssist(textColor, theme = freedomWallConfig?.freedomWallTheme) {
  const safeTheme = String(theme || "").trim().toLowerCase();
  if (!FREEDOM_WALL_TEXTURED_TEXT_THEMES.has(safeTheme)) return "none";
  const hex = FREEDOM_WALL_TEXT_COLOR_HEX[textColor] || FREEDOM_WALL_TEXT_COLOR_HEX.charcoal;
  return freedomWallRelativeLuminance(hex) > .52 ? "0 1px 2px rgba(0,0,0,.38)" : "0 1px 1px rgba(255,255,255,.42)";
}

function setFreedomWallContrastHint(wasAdjusted = false) {
  const hint = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallContrastHint");
  if (!hint) return;
  if (wasAdjusted) {
    hint.textContent = isFreedomWallFilipinoTheme() ? "Inayos ang text color para manatiling malinaw basahin." : "Text color adjusted automatically to keep the note readable.";
    hint.classList.add("is-warning");
  } else {
    hint.textContent = getFreedomWallUiCopy().contrastHint;
    hint.classList.remove("is-warning");
  }
}

function normalizeFreedomWallTextColor(value) {
  const safe = String(value || "").trim().toLowerCase();
  return FREEDOM_WALL_TEXT_COLORS.includes(safe) ? safe : "";
}

function normalizeFreedomWallFont(value) {
  const safe = String(value || "").trim().toLowerCase();
  return FREEDOM_WALL_FONTS.includes(safe) ? safe : "theme-default";
}

function normalizeFreedomWallReactions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  Object.entries(value).forEach(([deviceId, reaction]) => {
    const id = String(deviceId || "").trim().slice(0, 80);
    const type = String(reaction || "").trim().toLowerCase();
    if (/^fw_[A-Za-z0-9_]+$/.test(id) && FREEDOM_WALL_REACTION_TYPES.includes(type)) out[id] = type;
  });
  return out;
}

function getFreedomWallReactionSignature(reactions = {}) {
  return Object.entries(normalizeFreedomWallReactions(reactions)).sort((a,b) => a[0].localeCompare(b[0])).map(([id,type]) => `${id}:${type}`).join(",");
}

function normalizeFreedomWallNote(doc, index = 0) {
  const data = typeof doc?.data === "function" ? (doc.data() || {}) : (doc || {});
  const id = String(doc?.id || data.ID || data.id || `note-${index}`);
  const text = String(data.Text || data.text || "").trim().slice(0, FREEDOM_WALL_NOTE_MAX_LENGTH);
  const author = String(data.Name || data.Author || data.name || "").trim().slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
  const rawColor = String(data.Color || data.color || "").trim().toLowerCase();
  const color = FREEDOM_WALL_COLORS.includes(rawColor) ? rawColor : FREEDOM_WALL_COLORS[freedomWallHash(id) % FREEDOM_WALL_COLORS.length];
  const textColor = normalizeFreedomWallTextColor(data.TextColor || data.textColor || "");
  const fontStyle = normalizeFreedomWallFont(data.FontStyle || data.fontStyle || "theme-default");
  const createdAtMs = freedomWallSafeNumber(data.CreatedAtMs || data.createdAtMs, Date.now() - (100000 - index), 0, Number.MAX_SAFE_INTEGER);
  const rawMediaRef = String(data.MediaRef || data.mediaRef || "").trim();
  const parsedMediaRef = parseClassBoardMediaRef(rawMediaRef);
  const mediaRef = parsedMediaRef?.kind === "freedomWall" ? parsedMediaRef.raw : "";
  const mediaType = mediaRef ? String(data.MediaType || data.mediaType || "image/jpeg").trim().toLowerCase().slice(0, 32) : "";
  const youtube = normalizeFreedomWallYouTubeItem({
    url: data.YouTubeUrl || data.youtubeUrl || "",
    title: data.YouTubeTitle || data.youtubeTitle || "",
    channel: data.YouTubeChannel || data.youtubeChannel || "",
    thumbnail: data.YouTubeThumb || data.youtubeThumb || ""
  });
  const youtubeUrl = youtube?.url || "";
  const gif = normalizeFreedomWallGifItem({
    url: data.GifUrl || data.gifUrl || "",
    previewUrl: data.GifPreviewUrl || data.gifPreviewUrl || "",
    title: data.GifTitle || data.gifTitle || ""
  });
  const spotify = normalizeFreedomWallSpotifyItem({
    url: data.SpotifyUrl || data.spotifyUrl || "",
    uri: data.SpotifyUri || data.spotifyUri || "",
    title: data.SpotifyTitle || data.spotifyTitle || "",
    artist: data.SpotifyArtist || data.spotifyArtist || "",
    image: data.SpotifyImage || data.spotifyImage || ""
  });
  const reactions = normalizeFreedomWallReactions(data.Reactions || data.reactions || {});
  const reactionLastType = normalizeFreedomWallReactionLastType(data.ReactionLastType || data.reactionLastType || "");
  const sirJRReactions = normalizeFreedomWallSirJRReactions(data.SirJRReactions || data.sirJRReactions || {});
  const replyCount = Math.max(0, Math.floor(Number(data.ReplyCount || data.replyCount || 0) || 0));
  const sirJRReplied = data.SirJRReplied === true || data.sirJRReplied === true;
  const wallId = normalizeFreedomWallSessionId(data.WallID || data.wallId || FREEDOM_WALL_LEGACY_SESSION_ID);
  if (!text && !mediaRef && !youtubeUrl && !gif?.url && !spotify?.url) return null;
  return { id, text, author, color, textColor, fontStyle, createdAtMs, mediaRef, mediaType, youtubeUrl, youtube, gif, spotify, reactions, reactionLastType, sirJRReactions, replyCount, sirJRReplied, wallId, ...getFreedomWallPlacement({ ...data, id }, index) };
}

function getFreedomWallNoteCoreSignature(note) {
  return JSON.stringify([
    note?.id, note?.text, note?.author, note?.color, note?.textColor, note?.fontStyle,
    note?.createdAtMs, note?.mediaRef, note?.mediaType, note?.youtubeUrl, note?.youtube?.title, note?.gif?.url, note?.spotify?.url, note?.spotify?.title, note?.spotify?.artist, note?.wallId, note?.x, note?.y, note?.rotation, note?.scale
  ]);
}

function buildFreedomWallRenderSignature(notes = []) {
  return JSON.stringify({
    theme: String(freedomWallConfig?.freedomWallTheme || "sticky-notes"),
    showNames: Boolean(freedomWallConfig?.freedomWallShowNames),
    allowTextColor: Boolean(freedomWallConfig?.freedomWallAllowTextColor),
    allowFont: Boolean(freedomWallConfig?.freedomWallAllowFont),
    promptVisible: isFreedomWallPromptVisible(),
    viewport: window.innerWidth <= 700 ? "phone" : "wide",
    notes: notes.map((note) => [
      getFreedomWallNoteCoreSignature(note),
      getFreedomWallReactionSignature(note?.reactions),
      note?.reactionLastType || "",
      JSON.stringify(Object.entries(normalizeFreedomWallSirJRReactions(note?.sirJRReactions || {})).sort((a,b) => a[0].localeCompare(b[0]))),
      Math.max(0, Math.floor(Number(note?.replyCount || 0) || 0)),
      Boolean(note?.sirJRReplied)
    ])
  });
}

function renderFreedomWallNotes(notes = []) {
  const layer = document.getElementById("homepageEffectLayer");
  const stage = layer?.querySelector("#freedomWallNotesStage");
  const count = layer?.querySelector("#freedomWallCount");
  if (!stage) return;

  // v455+: update ONLY the Freedom Wall note layer. Music and the overall
  // display effect are never restarted when live notes arrive.
  const sorted = notes
    .filter(Boolean)
    .sort((a,b) => (a.createdAtMs - b.createdAtMs) || a.id.localeCompare(b.id))
    .slice(-FREEDOM_WALL_MAX_RENDERED_NOTES);
  freedomWallLastRenderedCount = sorted.length;

  // v483 mobile anti-flicker: realtime listeners can legitimately deliver the
  // same document set more than once (cache/server state, reconnects, etc.).
  // Do not touch card classes/styles/layout unless something visible changed.
  const renderSignature = buildFreedomWallRenderSignature(sorted);
  if (renderSignature === freedomWallLastRenderSignature && stage.childElementCount) {
    if (count) count.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).formatCount(sorted.length, "normal");
    updateFreedomWallEmptyState();
    syncFreedomWallReaderFromNotes({ preserveProgress:true });
    return;
  }
  freedomWallLastRenderSignature = renderSignature;

  const wantedIds = new Set(sorted.map((note) => note.id));
  const existing = new Map(
    Array.from(layer.querySelectorAll(".freedomWallNote[data-note-id]")).map((item) => [String(item.dataset.noteId || ""), item])
  );
  existing.forEach((card, id) => {
    if (!wantedIds.has(id)) {
      card.remove();
      freedomWallLocalDragPositions.delete(id);
    }
  });

  const stageRect = stage.getBoundingClientRect();
  const reservedRects = getFreedomWallReservedRects(layer, stageRect);
  const occupiedRects = [];

  sorted.forEach((note, index) => {
    let card = existing.get(note.id);
    const isNew = !card;
    if (!card) {
      card = document.createElement("article");
      card.dataset.noteId = note.id;
      const pin = document.createElement("i");
      pin.className = "freedomWallNotePin";
      const text = document.createElement("p");
      card.append(pin, text);
    }

    const showThemeMedia = Boolean(note.mediaRef || note.youtubeUrl || note.gif?.url || note.spotify?.url);
    const sizeClass = getFreedomWallNoteSizeClass(note);
    const isActivelyDragged = freedomWallDragState?.card === card;
    const inlineYoutubeActive = Boolean(freedomWallActiveYoutubePlayback?.mode === "inline" && freedomWallActiveYoutubePlayback?.card === card);
    card.className = `freedomWallNote is-${note.color} is-size-${sizeClass}${showThemeMedia ? " has-media" : ""}${note.youtubeUrl ? " has-video" : ""}${note.gif?.url ? " has-gif" : ""}${note.spotify?.url ? " has-spotify" : ""}${inlineYoutubeActive ? " is-inline-video-active" : ""}${isNew ? " is-new" : ""}${isActivelyDragged ? " is-dragging" : ""}`;
    card.dataset.theme = String(freedomWallConfig?.freedomWallTheme || "sticky-notes").trim().toLowerCase();
    card.style.setProperty("--fw-note-bg", FREEDOM_WALL_COLOR_HEX[note.color] || FREEDOM_WALL_COLOR_HEX.yellow);
    const allowTextColor = Boolean(freedomWallConfig?.freedomWallAllowTextColor);
    const hasAllowedCustomText = Boolean(allowTextColor && note.textColor);
    const requestedTextColor = hasAllowedCustomText ? note.textColor : getFreedomWallThemeDefaultTextColor(freedomWallConfig?.freedomWallTheme);
    const effectiveTextColor = resolveFreedomWallTextColor(requestedTextColor, note.color, freedomWallConfig?.freedomWallTheme);
    // v479: ALL notes get a contrast-safe rendered color. This fixes legacy
    // notes and Admin-disabled Text Color too, without changing saved TextColor.
    card.classList.add("has-safe-text");
    card.classList.toggle("has-custom-text", hasAllowedCustomText);
    card.style.setProperty("--fw-note-text-color", FREEDOM_WALL_TEXT_COLOR_HEX[effectiveTextColor] || FREEDOM_WALL_TEXT_COLOR_HEX.charcoal);
    card.style.setProperty("--fw-note-text-shadow", getFreedomWallTextContrastAssist(effectiveTextColor, freedomWallConfig?.freedomWallTheme));
    if (freedomWallConfig?.freedomWallAllowFont && note.fontStyle && note.fontStyle !== "theme-default") {
      card.classList.add(`is-font-${note.fontStyle}`);
    }

    let mediaEl = card.querySelector(".freedomWallNoteMedia");
    if (showThemeMedia) {
      if (!mediaEl) {
        mediaEl = document.createElement("div");
        mediaEl.className = "freedomWallNoteMedia is-loading";
        const loading = document.createElement("span");
        loading.textContent = "Loading photo…";
        mediaEl.appendChild(loading);
        const textNode = card.querySelector("p");
        card.insertBefore(mediaEl, textNode || null);
      }
      if (card.isConnected) hydrateFreedomWallNoteMedia(card, note);
      else window.requestAnimationFrame(() => hydrateFreedomWallNoteMedia(card, note));
    } else if (mediaEl) {
      mediaEl.remove();
    }

    const textEl = card.querySelector("p");
    if (textEl && textEl.textContent !== note.text) textEl.textContent = note.text;

    let authorEl = card.querySelector("small");
    const shouldShowAuthor = Boolean(freedomWallConfig?.freedomWallShowNames && note.author);
    if (shouldShowAuthor) {
      if (!authorEl) {
        authorEl = document.createElement("small");
        card.appendChild(authorEl);
      }
      const authorText = `— ${note.author}`;
      if (authorEl.textContent !== authorText) authorEl.textContent = authorText;
    } else if (authorEl) {
      authorEl.remove();
    }
    updateFreedomWallReactionSummary(card, note.reactions, "note", note.reactionLastType);

    // v460: a note manually moved in this browser keeps that temporary spot
    // for the current session only. We NEVER write this position to Firestore.
    const localDrag = freedomWallLocalDragPositions.get(note.id);
    if (localDrag) {
      card.style.setProperty("--fw-x", String(localDrag.x));
      card.style.setProperty("--fw-y", String(localDrag.y));
      card.style.setProperty("--fw-rotation", `${localDrag.rotation}deg`);
      card.style.setProperty("--fw-skew", `${localDrag.skew}deg`);
      card.style.setProperty("--fw-scale", String(localDrag.scale));
      card.dataset.fwDragged = "true";
      const dragOverlay = layer.querySelector("#freedomWallDragOverlay");
      if (dragOverlay && card.parentElement !== dragOverlay) dragOverlay.appendChild(card);
      const rect = card.getBoundingClientRect();
      if (rect.width && rect.height) occupiedRects.push(expandFreedomWallRect(rect, window.innerWidth <= 700 ? 4 : 6));
      if (!isActivelyDragged) card.style.zIndex = String(Math.max(1, Number(localDrag.zIndex) || 1));
    } else if (isNew) {
      card.style.visibility = "hidden";
      card.style.setProperty("--fw-x", "50");
      card.style.setProperty("--fw-y", "50");
      card.style.setProperty("--fw-rotation", "0deg");
      card.style.setProperty("--fw-skew", "0deg");
      card.style.setProperty("--fw-scale", String(note.scale || 1));
      stage.appendChild(card);
      const placement = findFreedomWallSmartPlacement(card, note, index, occupiedRects, reservedRects);
      card.style.setProperty("--fw-x", String(placement.x));
      card.style.setProperty("--fw-y", String(placement.y));
      card.style.setProperty("--fw-rotation", `${placement.rotation}deg`);
      card.style.setProperty("--fw-skew", `${placement.skew}deg`);
      card.style.setProperty("--fw-scale", String(placement.scale));
      card.style.setProperty("--fw-pin-x", `${40 + (freedomWallHash(`${note.id}-pin`) % 21)}%`);
      card.style.visibility = "";
      occupiedRects.push(placement.rect);
      card.style.zIndex = String(40 + Math.min(index, 230));
    } else {
      // Do not move old notes every time another device posts. Read their
      // actual rendered rectangle as occupied space for the next new note.
      card.style.setProperty("--fw-rotation", `${getFreedomWallVisualRotation(note, index)}deg`);
      card.style.setProperty("--fw-skew", `${getFreedomWallVisualSkew(note, index)}deg`);
      stage.appendChild(card);
      const rect = card.getBoundingClientRect();
      if (rect.width && rect.height) occupiedRects.push(expandFreedomWallRect(rect, window.innerWidth <= 700 ? 4 : 6));
      card.style.zIndex = String(40 + Math.min(index, 230));
    }
    if (isNew) window.setTimeout(() => card?.classList.remove("is-new"), 650);
  });

  if (count) {
    const displayCount = sorted.length >= FREEDOM_WALL_MAX_RENDERED_NOTES ? sorted.length : sorted.length;
    count.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).formatCount(displayCount, "normal");
  }
  updateFreedomWallEmptyState();
  syncFreedomWallReaderFromNotes({ preserveProgress:true });
  if (isFreedomWallExactExportMode()) applyFreedomWallExactExportMode();
}

function updateFreedomWallPrompt(config) {
  const layer = document.getElementById("homepageEffectLayer");
  const card = layer?.querySelector("#freedomWallPromptCard");
  const title = layer?.querySelector("#freedomWallPromptTitle");
  const message = layer?.querySelector("#freedomWallPromptMessage");
  if (!card || !title || !message) return;
  // Prompt reactions must survive page refreshes and unrelated Admin saves
  // (playlist/theme/settings). Key the prompt by its actual visible content, not
  // the generic HomepageEffectUpdatedAt value. Keep the previous v484-v486 key
  // available for one-way display compatibility with reactions already saved.
  const activeWallId = getFreedomWallActiveSessionId(config);
  // v488: every saved wall — including the original legacy wall — owns one
  // stable prompt-reaction identity. The previous v487 content-based id is
  // still read once as a compatibility source so existing counts survive.
  const promptSignature = `session:${activeWallId}`;
  const legacyPromptSignature = activeWallId === FREEDOM_WALL_LEGACY_SESSION_ID
    ? `${String(config?.title || "").trim()}|${String(config?.message || "").trim()}`
    : "";
  const rawTitle = String(config?.title || "").trim();
  const rawMessage = String(config?.message || "").trim();
  const hasAdminPrompt = Boolean(rawTitle || rawMessage);
  // v502 blank-wall guard: if an Admin save leaves the active wall prompt blank,
  // do not render a large empty white wall. Show a safe default prompt instead.
  const fallbackTitle = "SFK #BeKind Wall";
  card.dataset.promptSignature = promptSignature;
  card.dataset.promptLegacySignature = legacyPromptSignature;
  card.dataset.promptFallback = hasAdminPrompt ? "NO" : "YES";
  applyFreedomWallCutoutTitle(title, rawTitle || fallbackTitle);
  // v510: an intentionally blank Admin message stays blank.
  message.textContent = rawMessage;
  message.hidden = !rawMessage;
  card.hidden = freedomWallPromptDismissedSignature === promptSignature;
  // v545: keep the visual state in lock-step with the hidden attribute.
  // Some mobile prompt rules intentionally use display:flex!important; an
  // inline important display:none prevents that styling from defeating a
  // user dismissal, while removing it lets a new/undismissed prompt render.
  if (card.hidden) {
    card.style.setProperty("display", "none", "important");
    card.setAttribute("aria-hidden", "true");
  } else {
    card.style.removeProperty("display");
    card.setAttribute("aria-hidden", "false");
  }
  if (!card.hidden) syncFreedomWallPromptReactionLive();
  else stopFreedomWallPromptReactionLive();
  updateFreedomWallEmptyState();
}

function updateFreedomWallEmptyState() {
  const layer = document.getElementById("homepageEffectLayer");
  const empty = layer?.querySelector("#freedomWallEmptyState");
  if (!empty) return;
  const stage = layer.querySelector("#freedomWallNotesStage");
  const prompt = layer.querySelector("#freedomWallPromptCard");
  const hasNotes = Boolean((freedomWallNotesCache || []).length || stage?.querySelector?.(".freedomWallNote[data-note-id]"));
  const promptVisible = Boolean(prompt && !prompt.hidden);
  empty.hidden = hasNotes || promptVisible || !freedomWallConfig;
}


function dismissFreedomWallPromptForView(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const card = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallPromptCard");
  if (!card) return;
  freedomWallPromptDismissedSignature = String(card.dataset.promptSignature || "");
  card.hidden = true;
  // v545: force an immediate visual close too. This is necessary on mobile
  // because older theme/mobile rules contain display:flex!important.
  card.style.setProperty("display", "none", "important");
  card.setAttribute("aria-hidden", "true");
  stopFreedomWallPromptReactionLive();
  closeFreedomWallReactionMenu();
  // Once the prompt is closed, notes are free to use their original full-wall
  // positions, without rebuilding the effect or touching its music.
  if (freedomWallNotesCache.length) renderFreedomWallNotes(freedomWallNotesCache);
  updateFreedomWallEmptyState();
}

function getFreedomWallSelectedChoice(selector, fallback = "") {
  const selected = document.getElementById("homepageEffectLayer")?.querySelector(`${selector}.is-selected`);
  return String(selected?.getAttribute("aria-label") || selected?.textContent || fallback).trim();
}

function syncFreedomWallCustomizationVisibility() {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  const textColorField = layer.querySelector("#freedomWallTextColorField");
  const fontField = layer.querySelector("#freedomWallFontField");
  const allowTextColor = Boolean(freedomWallConfig?.freedomWallAllowTextColor);
  const allowFont = Boolean(freedomWallConfig?.freedomWallAllowFont);

  // v495: keep DOM visibility in sync with the exact same config used by the
  // customization summary. This repairs the v494 state where Theme Default
  // could appear in the summary while the Font row itself remained hidden.
  if (textColorField) {
    textColorField.hidden = !allowTextColor;
    textColorField.classList.toggle("is-admin-enabled", allowTextColor);
    textColorField.classList.toggle("is-admin-disabled", !allowTextColor);
  }
  if (fontField) {
    fontField.hidden = !allowFont;
    fontField.classList.toggle("is-admin-enabled", allowFont);
    fontField.classList.toggle("is-admin-disabled", !allowFont);
  }
}

function updateFreedomWallCustomizationSummary() {
  syncFreedomWallCustomizationVisibility();
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  const backgroundButton = layer.querySelector(`[data-fw-color="${freedomWallSelectedColor}"]`);
  const textButton = layer.querySelector(`[data-fw-text-color="${freedomWallSelectedTextColor}"]`);
  const fontButton = layer.querySelector(`[data-fw-font="${freedomWallSelectedFont}"]`);
  const backgroundName = String(backgroundButton?.getAttribute("aria-label") || "Yellow").trim();
  const textName = String(textButton?.getAttribute("aria-label") || "Charcoal").trim();
  const fontName = String(fontButton?.textContent || "Theme Default").trim();

  const backgroundValue = layer.querySelector("#freedomWallBackgroundValue");
  const textValue = layer.querySelector("#freedomWallTextColorValue");
  const fontValue = layer.querySelector("#freedomWallFontValue");
  const backgroundPreview = layer.querySelector("#freedomWallBackgroundPreview");
  const textPreview = layer.querySelector("#freedomWallTextColorPreview");
  if (backgroundValue) backgroundValue.textContent = backgroundName;
  if (textValue) textValue.textContent = textName;
  if (fontValue) fontValue.textContent = fontName;
  if (backgroundPreview) backgroundPreview.style.backgroundColor = FREEDOM_WALL_COLOR_HEX[freedomWallSelectedColor] || FREEDOM_WALL_COLOR_HEX.yellow;
  if (textPreview) textPreview.style.backgroundColor = FREEDOM_WALL_TEXT_COLOR_HEX[freedomWallSelectedTextColor] || FREEDOM_WALL_TEXT_COLOR_HEX.charcoal;

  const summary = layer.querySelector("#freedomWallCustomizeSummary");
  if (summary) {
    const values = [backgroundName];
    if (freedomWallConfig?.freedomWallAllowTextColor) values.push(textName);
    if (freedomWallConfig?.freedomWallAllowFont) values.push(fontName);
    summary.textContent = values.join(" · ");
    summary.title = values.join(" · ");
  }
}

function closeFreedomWallCustomizerPanel(kind = "") {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  layer.querySelectorAll("[data-fw-customizer-panel]").forEach((panel) => {
    if (!kind || panel.dataset.fwCustomizerPanel === kind) {
      panel.hidden = true;
      panel.style.removeProperty("--fw-picker-left");
      panel.style.removeProperty("--fw-picker-top");
      panel.style.removeProperty("--fw-picker-width");
      panel.style.removeProperty("--fw-picker-max-height");
    }
  });
  layer.querySelectorAll("[data-fw-customizer-toggle]").forEach((button) => {
    if (!kind || button.dataset.fwCustomizerToggle === kind) button.setAttribute("aria-expanded", "false");
  });
  layer.querySelectorAll(".freedomWallCustomizationField.is-options-open").forEach((field) => {
    const button = field.querySelector("[data-fw-customizer-toggle]");
    if (!kind || button?.dataset.fwCustomizerToggle === kind) field.classList.remove("is-options-open");
  });
  if (!layer.querySelector('[data-fw-customizer-panel]:not([hidden])')) {
    const backdrop = layer.querySelector("#freedomWallCustomizerBackdrop");
    if (backdrop) backdrop.hidden = true;
    layer.querySelector(".freedomWallComposer")?.classList.remove("is-customizer-picker-open");
  }
}

function positionFreedomWallCustomizerPanel(kind) {
  const layer = document.getElementById("homepageEffectLayer");
  const panel = layer?.querySelector(`[data-fw-customizer-panel="${kind}"]`);
  const trigger = layer?.querySelector(`[data-fw-customizer-toggle="${kind}"]`);
  if (!panel || !trigger || panel.hidden) return;

  // Phones use the CSS bottom sheet so every choice has its own scrolling area.
  if (window.matchMedia("(max-width: 700px)").matches) {
    panel.style.removeProperty("--fw-picker-left");
    panel.style.removeProperty("--fw-picker-top");
    panel.style.removeProperty("--fw-picker-width");
    panel.style.removeProperty("--fw-picker-max-height");
    return;
  }

  requestAnimationFrame(() => {
    if (panel.hidden) return;
    const triggerRect = trigger.getBoundingClientRect();
    const viewportW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportH = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const gap = 8;
    const edge = 14;
    const width = Math.min(460, Math.max(330, triggerRect.width));
    const maxHeight = Math.min(360, Math.max(220, viewportH - edge * 2));
    const measuredHeight = Math.min(panel.scrollHeight || 280, maxHeight);
    const left = Math.max(edge, Math.min(triggerRect.left, viewportW - width - edge));
    const roomBelow = viewportH - triggerRect.bottom - edge;
    let top = triggerRect.bottom + gap;
    if (roomBelow < Math.min(measuredHeight, 230)) {
      top = Math.max(edge, triggerRect.top - measuredHeight - gap);
    }
    if (top + measuredHeight > viewportH - edge) top = Math.max(edge, viewportH - measuredHeight - edge);

    panel.style.setProperty("--fw-picker-left", `${Math.round(left)}px`);
    panel.style.setProperty("--fw-picker-top", `${Math.round(top)}px`);
    panel.style.setProperty("--fw-picker-width", `${Math.round(width)}px`);
    panel.style.setProperty("--fw-picker-max-height", `${Math.round(maxHeight)}px`);
  });
}

function toggleFreedomWallCustomizerPanel(kind) {
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer) return;
  const panel = layer.querySelector(`[data-fw-customizer-panel="${kind}"]`);
  const trigger = layer.querySelector(`[data-fw-customizer-toggle="${kind}"]`);
  if (!panel || !trigger || trigger.closest("[hidden]")) return;
  const shouldOpen = panel.hidden;
  closeFreedomWallCustomizerPanel();
  if (!shouldOpen) return;

  panel.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  trigger.closest(".freedomWallCustomizationField")?.classList.add("is-options-open");
  const backdrop = layer.querySelector("#freedomWallCustomizerBackdrop");
  if (backdrop) backdrop.hidden = false;
  layer.querySelector(".freedomWallComposer")?.classList.add("is-customizer-picker-open");
  positionFreedomWallCustomizerPanel(kind);
}

function setFreedomWallCustomizeOpen(open) {
  const layer = document.getElementById("homepageEffectLayer");
  const body = layer?.querySelector("#freedomWallCustomizeBody");
  const toggle = layer?.querySelector("#freedomWallCustomizeToggle");
  const hint = layer?.querySelector("#freedomWallCustomizeHint");
  if (!body || !toggle) return;
  syncFreedomWallCustomizationVisibility();
  const next = Boolean(open);
  body.hidden = !next;
  toggle.setAttribute("aria-expanded", next ? "true" : "false");
  toggle.closest(".freedomWallCustomizePanel")?.classList.toggle("is-open", next);
  if (!next) closeFreedomWallCustomizerPanel();
  if (hint) {
    const copy = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme);
    hint.textContent = next ? copy.customizeOpenHint : copy.customizeClosedHint;
  }
}

function toggleFreedomWallCustomizePanel() {
  const layer = document.getElementById("homepageEffectLayer");
  const body = layer?.querySelector("#freedomWallCustomizeBody");
  if (!body) return;
  setFreedomWallCustomizeOpen(body.hidden);
}

function selectFreedomWallColor(color) {
  const safe = FREEDOM_WALL_COLORS.includes(String(color || "").toLowerCase()) ? String(color).toLowerCase() : "yellow";
  freedomWallSelectedColor = safe;
  const layer = document.getElementById("homepageEffectLayer");
  layer?.querySelectorAll("[data-fw-color]").forEach((button) => button.classList.toggle("is-selected", button.dataset.fwColor === safe));
  if (freedomWallConfig?.freedomWallAllowTextColor) {
    const resolved = resolveFreedomWallTextColor(freedomWallSelectedTextColor, safe, freedomWallConfig?.freedomWallTheme);
    const adjusted = resolved !== freedomWallSelectedTextColor;
    freedomWallSelectedTextColor = resolved;
    layer?.querySelectorAll("[data-fw-text-color]").forEach((button) => button.classList.toggle("is-selected", button.dataset.fwTextColor === resolved));
    setFreedomWallContrastHint(adjusted);
  }
  updateFreedomWallCustomizationSummary();
}

function selectFreedomWallTextColor(color) {
  if (!freedomWallConfig?.freedomWallAllowTextColor) return;
  const requested = normalizeFreedomWallTextColor(color) || "charcoal";
  const safe = resolveFreedomWallTextColor(requested, freedomWallSelectedColor, freedomWallConfig?.freedomWallTheme);
  freedomWallSelectedTextColor = safe;
  const layer = document.getElementById("homepageEffectLayer");
  layer?.querySelectorAll("[data-fw-text-color]").forEach((button) => button.classList.toggle("is-selected", button.dataset.fwTextColor === safe));
  setFreedomWallContrastHint(safe !== requested);
  updateFreedomWallCustomizationSummary();
}

function selectFreedomWallFont(font) {
  if (!freedomWallConfig?.freedomWallAllowFont) return;
  const safe = normalizeFreedomWallFont(font);
  freedomWallSelectedFont = safe;
  const layer = document.getElementById("homepageEffectLayer");
  layer?.querySelectorAll("[data-fw-font]").forEach((button) => button.classList.toggle("is-selected", button.dataset.fwFont === safe));
  updateFreedomWallCustomizationSummary();
}

function openFreedomWallComposer() {
  if (!freedomWallConfig?.freedomWallAllowPosting) return;
  const layer = document.getElementById("homepageEffectLayer");
  if (!layer || !layer.classList.contains("is-freedom-wall")) return;
  const composer = layer.querySelector("#freedomWallComposer");
  const author = layer.querySelector("#freedomWallAuthorInput");
  const note = layer.querySelector("#freedomWallNoteInput");
  const status = layer.querySelector("#freedomWallComposerStatus");
  if (!composer) return;
  if (author && !author.value) author.value = getFreedomWallSavedAuthor();
  if (note) note.value = "";
  resetFreedomWallPendingMedia();
  const modes = getFreedomWallAllowedAttachmentModes();
  freedomWallSelectedAttachmentMode = modes.some((item) => item.value === "image") ? "image" : (modes[1]?.value || "none");
  updateFreedomWallMediaUi();
  if (status) status.textContent = "";
  freedomWallSelectedTextColor = "charcoal";
  freedomWallSelectedFont = "theme-default";
  selectFreedomWallColor(FREEDOM_WALL_COLORS[Math.floor(Math.random() * FREEDOM_WALL_COLORS.length)]);
  if (freedomWallConfig?.freedomWallAllowTextColor) selectFreedomWallTextColor(freedomWallSelectedTextColor);
  if (freedomWallConfig?.freedomWallAllowFont) selectFreedomWallFont("theme-default");
  setFreedomWallContrastHint(false);
  syncFreedomWallCustomizationVisibility();
  updateFreedomWallCustomizationSummary();
  setFreedomWallCustomizeOpen(false);
  composer.hidden = false;
  syncFreedomWallChildModalCloseSafety();
  window.setTimeout(() => note?.focus(), 30);
}

function closeFreedomWallComposer(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const layer = document.getElementById("homepageEffectLayer");
  const composer = layer?.querySelector("#freedomWallComposer");
  closeFreedomWallMediaSearchModal();
  setFreedomWallCustomizeOpen(false);
  if (composer) composer.hidden = true;
  syncFreedomWallChildModalCloseSafety();
}

function isFreedomWallRulesCompatibilityError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || error || "").toLowerCase();
  return code.includes("permission-denied")
    || code.includes("permission_denied")
    || message.includes("missing or insufficient permissions")
    || message.includes("permission denied")
    || message.includes("permission_denied");
}

function buildFreedomWallLegacyCompatiblePayload(payload = {}) {
  const legacy = { ...payload };
  delete legacy.TextColor;
  delete legacy.FontStyle;
  delete legacy.WallID;
  delete legacy.YouTubeUrl;
  delete legacy.SpotifyUrl;
  delete legacy.SpotifyUri;
  delete legacy.SpotifyTitle;
  delete legacy.SpotifyArtist;
  delete legacy.SpotifyImage;
  delete legacy.YouTubeTitle;
  delete legacy.YouTubeChannel;
  delete legacy.YouTubeThumb;
  delete legacy.GifUrl;
  delete legacy.GifPreviewUrl;
  delete legacy.GifTitle;
  const requestedColor = String(legacy.Color || "yellow").trim().toLowerCase();
  legacy.Color = FREEDOM_WALL_LEGACY_COLORS.has(requestedColor)
    ? requestedColor
    : (FREEDOM_WALL_LEGACY_COLOR_MAP[requestedColor] || "yellow");
  return legacy;
}

async function submitFreedomWallNote(event) {
  event?.preventDefault?.();
  if (freedomWallPosting || !freedomWallConfig?.freedomWallAllowPosting) return;
  const layer = document.getElementById("homepageEffectLayer");
  const noteInput = layer?.querySelector("#freedomWallNoteInput");
  const authorInput = layer?.querySelector("#freedomWallAuthorInput");
  const status = layer?.querySelector("#freedomWallComposerStatus");
  const button = layer?.querySelector("#freedomWallPostBtn");
  const text = String(noteInput?.value || "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, FREEDOM_WALL_NOTE_MAX_LENGTH);
  const author = String(authorInput?.value || "").trim().replace(/\s+/g, " ").slice(0, FREEDOM_WALL_AUTHOR_MAX_LENGTH);
  const attachmentMode = freedomWallSelectedAttachmentMode;
  const pendingMedia = (attachmentMode === "image" || attachmentMode === "gif") ? freedomWallPendingMedia : null;
  const pendingYouTube = (attachmentMode === "youtube-search") ? normalizeFreedomWallYouTubeItem(freedomWallPendingYouTube || {}) : null;
  const pendingYouTubeUrl = attachmentMode === "youtube" ? normalizeFreedomWallYouTubeUrl(freedomWallPendingYouTubeUrl) : (pendingYouTube?.url || "");
  const pendingGif = attachmentMode === "gif-search" ? normalizeFreedomWallGifItem(freedomWallPendingGif || {}) : null;
  if (!text && !pendingMedia && !pendingYouTubeUrl && !pendingGif?.url) {
    if (status) status.textContent = attachmentMode === "youtube-search" ? "Write a note or choose a YouTube result first." : (attachmentMode === "gif-search" ? "Write a note or choose a GIF first." : (attachmentMode === "youtube" ? "Write a note or paste a YouTube link first." : "Write a note or add media first."));
    noteInput?.focus();
    return;
  }
  const now = Date.now();
  try {
    const lastPostAt = Number(localStorage.getItem("sfkFreedomWallLastPostAtV454") || 0);
    if (lastPostAt && now - lastPostAt < 2200) {
      if (status) status.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).statusWait;
      return;
    }
  } catch (error) {}
  freedomWallPosting = true;
  if (button) button.disabled = true;
  if (status) status.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).statusPosting;
  try {
    const db = await waitForClassBoardFirestore(12000);
    if (!db) throw new Error("wall unavailable");
    const placement = createFreedomWallPostingPlacement();
    const activeWallId = getFreedomWallActiveSessionId();
    const payload = {
      Text: text,
      Name: author,
      Color: freedomWallSelectedColor,
      X: placement.x,
      Y: placement.y,
      Rotation: placement.rotation,
      Scale: placement.scale,
      DeviceId: getFreedomWallDeviceId(),
      CreatedAtMs: now
    };
    payload.WallID = activeWallId;
    if (freedomWallConfig?.freedomWallAllowTextColor) payload.TextColor = freedomWallSelectedTextColor;
    if (freedomWallConfig?.freedomWallAllowFont) payload.FontStyle = freedomWallSelectedFont;
    try { payload.CreatedAt = firebase.firestore.FieldValue.serverTimestamp(); } catch (error) {}
    // Give the document its final Firestore id first. Polaroid media uses the same id.
    const noteRef = db.collection(FREEDOM_WALL_COLLECTION).doc();
    let mediaDocRef = null;
    let mediaPayload = null;
    if (pendingYouTubeUrl) {
      payload.YouTubeUrl = pendingYouTubeUrl;
      if (pendingYouTube?.title) payload.YouTubeTitle = pendingYouTube.title;
      if (pendingYouTube?.channel) payload.YouTubeChannel = pendingYouTube.channel;
      if (pendingYouTube?.thumbnail) payload.YouTubeThumb = pendingYouTube.thumbnail;
    }
    if (pendingGif?.url) {
      payload.GifUrl = pendingGif.url;
      if (pendingGif.previewUrl) payload.GifPreviewUrl = pendingGif.previewUrl;
      if (pendingGif.title) payload.GifTitle = pendingGif.title;
    }
    if (pendingMedia) {
      payload.MediaRef = `${CLASSBOARD_MEDIA_REF_PREFIX}freedomWall/${noteRef.id}`;
      payload.MediaType = pendingMedia.mimeType;
      mediaDocRef = db.collection(FREEDOM_WALL_MEDIA_COLLECTION).doc(noteRef.id);
      mediaPayload = {
        NoteID: noteRef.id,
        DeviceId: payload.DeviceId,
        Name: pendingMedia.name,
        MimeType: pendingMedia.mimeType,
        Data: pendingMedia.base64,
        BytesApprox: pendingMedia.bytesApprox
      };
      try { mediaPayload.CreatedAt = firebase.firestore.FieldValue.serverTimestamp(); } catch (error) {}
      CLASSBOARD_MEDIA_DATA_CACHE.set(`freedomWall/${noteRef.id}`, pendingMedia.dataUrl);
    }
    const optimisticNote = normalizeFreedomWallNote({ id: noteRef.id, ...payload }, freedomWallNotesCache.length);
    if (optimisticNote) {
      freedomWallNotesCache = freedomWallNotesCache.filter((item) => item.id !== optimisticNote.id);
      freedomWallNotesCache.push(optimisticNote);
      renderFreedomWallNotes(freedomWallNotesCache);
    }

    let committedPayload = payload;
    const commitNotePayload = async (notePayload) => {
      if (mediaDocRef && mediaPayload) {
        const batch = db.batch();
        batch.set(mediaDocRef, mediaPayload);
        batch.set(noteRef, notePayload);
        await batch.commit();
      } else {
        await noteRef.set(notePayload);
      }
    };
    try {
      await commitNotePayload(payload);
    } catch (writeError) {
      // Fail-safe for deployments that still use the v477/v454 wall rules.
      // Those rules reject TextColor/FontStyle and any color outside the old 8.
      // Retry once with a rules-compatible payload instead of making the user
      // think the wall is broken. Full customization persists as soon as the
      // updated Firestore rules are published.
      if (isFreedomWallRulesCompatibilityError(writeError) && activeWallId === FREEDOM_WALL_LEGACY_SESSION_ID) {
        const legacyPayload = buildFreedomWallLegacyCompatiblePayload(payload);
        try {
          await commitNotePayload(legacyPayload);
          committedPayload = legacyPayload;
          console.warn("Freedom Wall used legacy Firestore-rules compatibility mode. Publish the updated wall rules to persist Text Color, Font, and all 20 note colors.");
        } catch (fallbackError) {
          freedomWallNotesCache = freedomWallNotesCache.filter((item) => item.id !== noteRef.id);
          CLASSBOARD_MEDIA_DATA_CACHE.delete(`freedomWall/${noteRef.id}`);
          renderFreedomWallNotes(freedomWallNotesCache);
          throw fallbackError;
        }
      } else {
        freedomWallNotesCache = freedomWallNotesCache.filter((item) => item.id !== noteRef.id);
        CLASSBOARD_MEDIA_DATA_CACHE.delete(`freedomWall/${noteRef.id}`);
        renderFreedomWallNotes(freedomWallNotesCache);
        throw writeError;
      }
    }

    if (committedPayload !== payload) {
      const fallbackNote = normalizeFreedomWallNote({ id: noteRef.id, ...committedPayload }, freedomWallNotesCache.length);
      freedomWallNotesCache = freedomWallNotesCache.filter((item) => item.id !== noteRef.id);
      if (fallbackNote) freedomWallNotesCache.push(fallbackNote);
      renderFreedomWallNotes(freedomWallNotesCache);
    }

    saveFreedomWallAuthor(author);
    try { localStorage.setItem("sfkFreedomWallLastPostAtV454", String(now)); } catch (error) {}
    if (status) status.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).statusDone;
    if (noteInput) noteInput.value = "";
    resetFreedomWallPendingMedia();
    window.setTimeout(() => closeFreedomWallComposer(), 280);
  } catch (error) {
    console.warn("Freedom Wall post failed:", error);
    if (status) status.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).statusFail;
  } finally {
    freedomWallPosting = false;
    if (button) button.disabled = false;
  }
}

function scheduleFreedomWallLiveRetry() {
  if (freedomWallLiveRetryTimer || !freedomWallConfig) return;
  freedomWallLiveRetryTimer = window.setTimeout(() => {
    freedomWallLiveRetryTimer = 0;
    if (!freedomWallConfig || freedomWallUnsubscribe) return;
    startFreedomWallLive();
  }, 2500);
}

async function startFreedomWallLive() {
  // Never tear down/recreate an active listener during the normal ClassBoard
  // refresh cycle. That listener is independent of the effect music player.
  if (freedomWallUnsubscribe) return;
  const token = ++freedomWallListenToken;
  const db = await waitForClassBoardFirestore(12000);
  if (token !== freedomWallListenToken || !freedomWallConfig) return;
  if (!db) {
    const count = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallCount");
    if (count) count.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).formatCount(freedomWallLastRenderedCount, "initial");
    scheduleFreedomWallLiveRetry();
    return;
  }

  try {
    const activeWallId = getFreedomWallActiveSessionId();
    // Session-aware query. New walls are isolated by WallID. The legacy wall
    // keeps supporting old documents that predate WallID without requiring a migration.
    const query = activeWallId === FREEDOM_WALL_LEGACY_SESSION_ID
      ? db.collection(FREEDOM_WALL_COLLECTION).limit(Math.max(FREEDOM_WALL_MAX_RENDERED_NOTES, 800))
      : db.collection(FREEDOM_WALL_COLLECTION).where("WallID", "==", activeWallId).limit(FREEDOM_WALL_MAX_RENDERED_NOTES);

    // v483: metadata-only snapshots are intentionally ignored. They do not
    // change what students see and were causing unnecessary phone repaints.
    freedomWallUnsubscribe = query.onSnapshot((snapshot) => {
      const changes = typeof snapshot.docChanges === "function" ? snapshot.docChanges() : [];
      // v484 performance path: a reaction modifies only Reactions + reaction
      // metadata on one note. Update just that tiny counter strip instead of
      // recalculating placement/styles for up to 400 notes.
      if (freedomWallNotesCache.length && changes.length && changes.every((change) => change.type === "modified")) {
        let reactionOnly = true;
        const pending = [];
        for (const change of changes) {
          const next = normalizeFreedomWallNote(change.doc, 0);
          const index = freedomWallNotesCache.findIndex((item) => item.id === next?.id);
          if (!next || index < 0 || getFreedomWallNoteCoreSignature(freedomWallNotesCache[index]) !== getFreedomWallNoteCoreSignature(next)) {
            reactionOnly = false;
            break;
          }
          pending.push({ index, next });
        }
        if (reactionOnly) {
          const layer = document.getElementById("homepageEffectLayer");
          pending.forEach(({ index, next }) => {
            freedomWallNotesCache[index].reactions = next.reactions;
            freedomWallNotesCache[index].reactionLastType = next.reactionLastType;
            freedomWallNotesCache[index].sirJRReactions = next.sirJRReactions;
            freedomWallNotesCache[index].replyCount = next.replyCount;
            freedomWallNotesCache[index].sirJRReplied = next.sirJRReplied;
            const card = Array.from(layer?.querySelectorAll?.(".freedomWallNote[data-note-id]") || []).find((item) => String(item.dataset.noteId || "") === String(next.id));
            const readerCard = layer?.querySelector?.(`.freedomWallReaderNote[data-reader-note-id="${CSS.escape(String(next.id || ""))}"]`);
            updateFreedomWallReactionSummary(card, next.reactions, "note", next.reactionLastType);
            updateFreedomWallReactionSummary(readerCard, next.reactions, "note", next.reactionLastType);
            if (freedomWallReactionMenuTarget?.type === "note" && freedomWallReactionMenuTarget.id === next.id) updateFreedomWallReactionMenuState();
            if (freedomWallReplyThreadNoteId === next.id) {
              const subtitle = layer?.querySelector("#freedomWallReplySubtitle");
              if (subtitle) {
                const total = Math.max(freedomWallReplyThreadCache.length, Math.max(0, Math.floor(Number(next.replyCount || 0) || 0)));
                subtitle.textContent = `${total} ${total === 1 ? "reply" : "replies"} • long-press/right-click a reply to answer it`;
              }
            }
          });
          const sortedForSignature = freedomWallNotesCache.filter(Boolean).sort((a,b) => (a.createdAtMs - b.createdAtMs) || a.id.localeCompare(b.id)).slice(-FREEDOM_WALL_MAX_RENDERED_NOTES);
          freedomWallLastRenderSignature = buildFreedomWallRenderSignature(sortedForSignature);
          syncFreedomWallReaderFromNotes({ preserveProgress:true });
          return;
        }
      }
      const notes = snapshot.docs
        .map((doc, index) => normalizeFreedomWallNote(doc, index))
        .filter(Boolean)
        .filter((note) => note.wallId === activeWallId);
      freedomWallNotesCache = notes;
      renderFreedomWallNotes(notes);
    }, (error) => {
      console.warn("Freedom Wall live listener unavailable:", error);
      try { freedomWallUnsubscribe?.(); } catch (unsubscribeError) {}
      freedomWallUnsubscribe = null;
      const count = document.getElementById("homepageEffectLayer")?.querySelector("#freedomWallCount");
      if (count) count.textContent = getFreedomWallUiCopy(freedomWallConfig?.freedomWallTheme).formatCount(freedomWallLastRenderedCount, "connecting");
      scheduleFreedomWallLiveRetry();
    });
  } catch (error) {
    console.warn("Freedom Wall listener setup failed:", error);
    freedomWallUnsubscribe = null;
    scheduleFreedomWallLiveRetry();
  }
}

function configureFreedomWall(config) {
  const previousWallId = getFreedomWallActiveSessionId(freedomWallConfig);
  const nextWallId = getFreedomWallActiveSessionId(config);
  const wallChanged = Boolean(freedomWallConfig && previousWallId !== nextWallId);
  if (wallChanged) {
    closeFreedomWallActiveYoutube({ resumeMusic:true });
    freedomWallListenToken += 1;
    try { freedomWallUnsubscribe?.(); } catch (error) {}
    freedomWallUnsubscribe = null;
    stopFreedomWallPromptReactionLive();
    closeFreedomWallReactionMenu();
    closeFreedomWallReplyThread();
    freedomWallNotesCache = [];
    freedomWallLastRenderSignature = "";
    freedomWallLastRenderedCount = 0;
    freedomWallLocalDragPositions.clear();
    freedomWallPromptDismissedSignature = "";
  }
  freedomWallConfig = config;
  const layer = ensureHomepageEffectLayer();
  if (wallChanged) {
    const stage = layer?.querySelector("#freedomWallNotesStage");
    const dragOverlay = layer?.querySelector("#freedomWallDragOverlay");
    if (stage) stage.replaceChildren();
    if (dragOverlay) dragOverlay.replaceChildren();
  }
  const scene = layer.querySelector(".homepageFreedomWallScene");
  const addButton = layer.querySelector("#freedomWallAddBtn");
  const authorInput = layer.querySelector("#freedomWallAuthorInput");
  const authorLabel = layer.querySelector('label[for="freedomWallAuthorInput"]');
  const textColorField = layer.querySelector("#freedomWallTextColorField");
  const fontField = layer.querySelector("#freedomWallFontField");
  if (scene) {
    const theme = config.freedomWallTheme || "sticky-notes";
    scene.dataset.theme = theme;
    // v479: mirror the wall theme on the overlay so the global close control
    // can use the same visual language as the wall label and Add Note button.
    layer.dataset.freedomWallTheme = theme;
    if (theme === "seasonal") {
      // v503: older builds referenced a seasonal helper that may not exist in
      // every deployment. Never let that optional theme detail stop the wall.
      scene.dataset.seasonalVariant = typeof getFreedomWallSeasonalVariant === "function"
        ? getFreedomWallSeasonalVariant()
        : "graduation";
    } else {
      delete scene.dataset.seasonalVariant;
    }
    scene.style.setProperty("display", "block", "important");
    scene.style.setProperty("visibility", "visible", "important");
    scene.style.setProperty("opacity", "1", "important");
  }
  // v503 fail-safe: visual/media-control helpers must never be able to abort
  // the core prompt + Firestore live-note startup. If an optional UI helper
  // fails, keep rendering the wall and log the isolated error instead.
  try {
    applyFreedomWallThemeCopy(config.freedomWallTheme || "sticky-notes");
  } catch (error) {
    console.warn("Freedom Wall UI copy/media controls skipped:", error);
  }
  try {
    applyFreedomWallThemeDecor(config.freedomWallTheme || "sticky-notes");
  } catch (error) {
    console.warn("Freedom Wall theme decoration skipped:", error);
  }
  if (addButton) addButton.hidden = !config.freedomWallAllowPosting;
  if (authorInput) authorInput.hidden = !config.freedomWallShowNames;
  if (authorLabel) authorLabel.hidden = !config.freedomWallShowNames;
  if (textColorField) textColorField.hidden = !config.freedomWallAllowTextColor;
  if (fontField) fontField.hidden = !config.freedomWallAllowFont;
  syncFreedomWallCustomizationVisibility();
  updateFreedomWallCustomizationSummary();
  if (!config.freedomWallAllowPosting) closeFreedomWallComposer();
  updateFreedomWallPrompt(config);
  if (freedomWallNotesCache.length) renderFreedomWallNotes(freedomWallNotesCache);
  updateFreedomWallEmptyState();
  startFreedomWallLive();
}

function stopFreedomWallLive(clearStage = false) {
  closeFreedomWallActiveSpotify({ resumeMusic:false });
  closeFreedomWallActiveYoutube({ resumeMusic:false });
  freedomWallListenToken += 1;
  if (freedomWallLiveRetryTimer) window.clearTimeout(freedomWallLiveRetryTimer);
  freedomWallLiveRetryTimer = 0;
  try { freedomWallUnsubscribe?.(); } catch (error) {}
  freedomWallUnsubscribe = null;
  closeFreedomWallReader(null, { force:true });
  freedomWallConfig = null;
  freedomWallPosting = false;
  stopFreedomWallPromptReactionLive();
  clearFreedomWallPromptReactionPending();
  closeFreedomWallReactionMenu();
  closeFreedomWallReplyThread();
  const layer = document.getElementById("homepageEffectLayer");
  const scene = layer?.querySelector(".homepageFreedomWallScene");
  const composer = layer?.querySelector("#freedomWallComposer");
  if (scene) {
    scene.style.removeProperty("display");
    scene.style.removeProperty("visibility");
    scene.style.removeProperty("opacity");
  }
  if (composer) composer.hidden = true;
  if (clearStage) {
    const stage = layer?.querySelector("#freedomWallNotesStage");
    if (stage) stage.replaceChildren();
    freedomWallLastRenderedCount = 0;
    freedomWallNotesCache = [];
    freedomWallLastRenderSignature = "";
  }
}

const HOMEPAGE_PREMIUM_SCENE_MAP_V453 = Object.freeze({
  sunrise: "homepageSunriseScene",
  underwater: "homepageUnderwaterScene",
  notebook: "homepageNotebookScene",
  hyperspace: "homepageHyperspaceScene",
  "window-weather": "homepageWindowWeatherScene",
  fiesta: "homepageFiestaScene",
  "book-world": "homepageBookWorldScene",
  "magic-blackboard": "homepageBlackboardScene",
  "moonlit-garden": "homepageMoonGardenScene",
  "cloud-kingdom": "homepageCloudKingdomScene",
  countdown: "homepageCountdownScene",
  "pixel-game": "homepagePixelGameScene",
  "cyber-classroom": "homepageCyberClassroomScene",
  "heritage-journey": "homepageHeritageJourneyScene"
});

function forceHomepagePremiumSceneV453(layer, mode) {
  if (!layer) return;
  const wantedClass = HOMEPAGE_PREMIUM_SCENE_MAP_V453[String(mode || "")];
  const premiumClasses = new Set(Object.values(HOMEPAGE_PREMIUM_SCENE_MAP_V453));
  layer.querySelectorAll(".homepageThemeScene").forEach((scene) => {
    const isPremiumScene = Array.from(premiumClasses).some((className) => scene.classList.contains(className));
    if (!isPremiumScene) return;
    const shouldShow = Boolean(wantedClass && scene.classList.contains(wantedClass));
    scene.style.setProperty("display", shouldShow ? "block" : "none", "important");
    scene.style.setProperty("visibility", shouldShow ? "visible" : "hidden", "important");
    scene.style.setProperty("opacity", shouldShow ? "1" : "0", "important");
  });

  // A hard inline backdrop makes every premium mode visibly different even if
  // an older cached stylesheet is temporarily present during a PWA update.
  const backdrop = layer.querySelector(".homepageEffectBackdrop");
  if (!backdrop) return;
  const fallbackBackgrounds = {
    sunrise: "linear-gradient(180deg, rgba(255,185,92,.40), rgba(255,116,82,.24) 48%, rgba(68,100,126,.18))",
    underwater: "linear-gradient(180deg, rgba(80,207,255,.42), rgba(14,103,174,.34) 48%, rgba(3,42,82,.38))",
    notebook: "linear-gradient(180deg, rgba(255,253,247,.95), rgba(245,239,229,.92))",
    hyperspace: "radial-gradient(circle at 50% 50%, rgba(123,78,255,.34), transparent 20%), linear-gradient(180deg, rgba(7,5,28,.88), rgba(3,4,14,.92))",
    "window-weather": "linear-gradient(180deg, rgba(196,229,255,.52), rgba(236,246,255,.34) 58%, rgba(239,228,209,.24))",
    fiesta: "linear-gradient(180deg, rgba(113,192,255,.36), rgba(255,245,208,.28) 56%, rgba(75,150,76,.20))",
    "book-world": "linear-gradient(180deg, rgba(163,143,255,.34), rgba(255,236,174,.26))",
    "magic-blackboard": "linear-gradient(180deg, rgba(27,66,53,.92), rgba(13,39,31,.94))",
    "moonlit-garden": "linear-gradient(180deg, rgba(8,27,63,.92), rgba(6,24,50,.94) 55%, rgba(3,17,27,.96))",
    "cloud-kingdom": "linear-gradient(180deg, rgba(176,224,255,.52), rgba(225,245,255,.38) 52%, rgba(255,255,255,.28))",
    countdown: "radial-gradient(circle at 50% 50%, rgba(209,108,255,.24), transparent 30%), linear-gradient(180deg, rgba(71,19,112,.76), rgba(15,16,58,.88))",
    "pixel-game": "linear-gradient(180deg, rgba(121,207,255,.46), rgba(207,239,255,.30) 58%, rgba(77,160,73,.28))",
    "cyber-classroom": "linear-gradient(180deg, rgba(7,29,55,.90), rgba(4,10,27,.94))",
    "heritage-journey": "linear-gradient(180deg, rgba(255,239,195,.30), rgba(91,174,255,.22))"
  };
  if (wantedClass) {
    backdrop.style.setProperty("background", fallbackBackgrounds[mode] || "rgba(0,0,0,.18)", "important");
  } else {
    backdrop.style.removeProperty("background");
  }
}

function forceHomepageStoryBarViewportV453() {
  const layer = document.getElementById("homepageEffectLayer");
  const host = layer?.querySelector("#homepageEffectStoryProgress");
  if (!host) return;
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("top", "max(7px, env(safe-area-inset-top))", "important");
  host.style.setProperty("left", "0", "important");
  host.style.setProperty("right", "auto", "important");
  host.style.setProperty("width", "100vw", "important");
  host.style.setProperty("max-width", "100vw", "important");
  host.style.setProperty("margin", "0", "important");
  host.style.setProperty("padding-left", "max(8px, env(safe-area-inset-left))", "important");
  host.style.setProperty("padding-right", "max(8px, env(safe-area-inset-right))", "important");
  host.style.setProperty("box-sizing", "border-box", "important");
  host.style.setProperty("transform", "none", "important");
  host.style.setProperty("justify-content", "center", "important");
  host.style.setProperty("gap", window.innerWidth <= 700 ? "3px" : "5px", "important");
  host.style.setProperty("height", window.innerWidth <= 700 ? "3px" : "4px", "important");
  host.style.setProperty("z-index", "2147483646", "important");
}

async function applyHomepageEffectSettings(settings = {}) {
  // Fresh page load: do not reveal or play any Admin effect on top of the
  // ClassBoard loading screen. Keep only the newest settings and render them
  // after the loading overlay has fully disappeared.
  if (isHomepageEffectStartupBlocked()) {
    homepageEffectPendingSettings = { ...(settings || {}) };
    hideHomepageEffectLayer();
    scheduleHomepageEffectStartupFlush();
    return;
  }
  homepageEffectPendingSettings = null;

  let config = normalizeHomepageEffectConfig(settings);
  if (isFreedomWallExactExportMode()) {
    config = {
      ...config,
      enabled: true,
      mode: "freedom-wall",
      dismissible: false,
      audioEnabled: false,
      audioUrl: "",
      freedomWallPlaylistEnabled: false,
      freedomWallPlaylist: [],
      signature: `${config.signature}|exact-export|${freedomWallExactExportOptions.layout}`
    };
  }
  const incomingUpdatedAt = Number(config.updatedAt || 0);
  if (incomingUpdatedAt && homepageEffectLatestUpdatedAt && incomingUpdatedAt < homepageEffectLatestUpdatedAt) return;
  if (incomingUpdatedAt > homepageEffectLatestUpdatedAt) homepageEffectLatestUpdatedAt = incomingUpdatedAt;

  const previousEffectSignature = homepageEffectCurrentSignature;
  const existingLayer = document.getElementById("homepageEffectLayer");
  const unchangedActiveFreedomWall = Boolean(
    config.enabled
    && config.mode === "freedom-wall"
    && previousEffectSignature === config.signature
    && freedomWallConfig
    && existingLayer
    && !existingLayer.hidden
    && existingLayer.classList.contains("is-freedom-wall")
  );

  homepageEffectCurrentSignature = config.signature;
  homepageEffectDismissAllowed = Boolean(config.dismissible);

  // v483: the dashboard itself may refresh for unrelated data. If the active
  // Freedom Wall configuration is byte-for-byte the same, leave the existing
  // full-screen layer alone instead of reassigning classes/theme/scene styles.
  // The independent Firestore listener still updates notes in real time.
  if (unchangedActiveFreedomWall) {
    setFreedomWallPageLock(true);
    return;
  }

  const layer = ensureHomepageEffectLayer();

  // If Admin disables Allow Dismiss, a previously dismissed copy of this same
  // effect must immediately become visible again and stay locked on-screen.
  if (!homepageEffectDismissAllowed) homepageEffectDismissedSignature = "";

  if (!config.enabled) {
    homepageEffectDismissedSignature = "";
    homepageEffectParticleMode = "";
    homepageEffectAmbientMode = "";
    hideHomepageEffectLayer();
    return;
  }

  if (homepageEffectDismissedSignature === config.signature) {
    hideHomepageEffectLayer();
    return;
  }

  const token = ++homepageEffectRenderToken;
  layer.hidden = false;
  layer.setAttribute("aria-hidden", "false");
  layer.className = `homepageEffectLayer is-${config.mode}`;
  forceHomepagePremiumSceneV453(layer, config.mode);
  document.documentElement.classList.add("sfkHomepageEffectActive");
  document.documentElement.classList.toggle("sfkHomepageMultiverseActive", config.mode === "multiverse");
  document.documentElement.classList.toggle("sfkHomepageSpiderGlitchActive", config.mode === "spider-glitch");
  document.documentElement.classList.toggle("sfkHomepageBlackSymbioteActive", config.mode === "black-symbiote");

  const close = layer.querySelector("#homepageEffectClose");
  if (close) {
    const canDismiss = homepageEffectDismissAllowed === true;
    const showNow = canDismiss && (config.mode !== "rickroll" || homepageRickrollRevealed);
    close.hidden = !showNow;
    close.disabled = !showNow;
    close.setAttribute("aria-hidden", showNow ? "false" : "true");
    close.tabIndex = showNow ? 0 : -1;
    close.style.setProperty("display", showNow ? "grid" : "none", "important");
    close.style.setProperty("pointer-events", showNow ? "auto" : "none", "important");
    if (!showNow && document.activeElement === close) close.blur();
  }
  layer.dataset.dismissible = homepageEffectDismissAllowed ? "true" : "false";
  // Freedom Wall behaves like a true modal workspace: blank wall areas absorb
  // clicks and the ClassBoard underneath cannot scroll until the wall closes.
  setFreedomWallPageLock(config.mode === "freedom-wall");
  renderHomepageEffectText(config);

  const hasFreedomWallPlaylist = Boolean(
    config.mode === "freedom-wall"
    && config.freedomWallPlaylistEnabled
    && Array.isArray(config.freedomWallPlaylist)
    && config.freedomWallPlaylist.length
  );
  const hasCustomEffectAudio = Boolean(!["youtube", "rickroll"].includes(config.mode) && !hasFreedomWallPlaylist && config.audioEnabled && config.audioUrl);
  if (config.mode === "alert" && config.alertSound && !hasCustomEffectAudio) {
    startHomepageAlertSound(config.signature);
  } else {
    stopHomepageAlertSound();
  }

  if (hasFreedomWallPlaylist) {
    // v489: the playlist owns its own playback signature. Prompt edits, saved-wall
    // loads, reactions, or unrelated HomepageEffectUpdatedAt changes must NOT
    // restart the shuffled cycle and accidentally repeat a song before every
    // track in the current cycle has played once.
    const playlistPlaybackSignature = [
      "freedom-wall-playlist-v489",
      config.freedomWallPlaylist.map((track) => String(track?.url || "").trim()).join("|"),
      config.freedomWallPlaylistShuffle ? "shuffle" : "ordered",
      config.freedomWallPlaylistLoop ? "loop" : "once"
    ].join("::");
    startHomepageEffectPlaylist(
      config.freedomWallPlaylist,
      config.freedomWallPlaylistShuffle,
      config.freedomWallPlaylistLoop,
      playlistPlaybackSignature
    );
  } else if (hasCustomEffectAudio) {
    startHomepageEffectMusic(config.audioUrl, config.audioLoop, config.signature);
  } else {
    stopHomepageEffectMusic();
  }

  if (["drizzle", "heavy-rain", "thunderstorm", "flood-rain"].includes(config.mode)) {
    buildHomepageRain(config.mode);
  } else {
    const rain = layer.querySelector(".homepageEffectRain");
    if (rain) rain.innerHTML = "";
    homepageEffectParticleMode = "";
  }

  const ambientModes = new Set([
    "fog", "snow", "confetti", "hearts", "stars", "matrix", "bubbles", "fireflies", "minions", "spongebob", "naruto", "akatsuki", "ninja-night", "neon-pulse",
    "spider-glitch", "comic-web", "black-symbiote", "portal-rift", "aurora", "galaxy", "solar-system", "meteors", "laser-grid", "crt",
    "pixel-storm", "prism", "petals", "gold-sparkle"
  ]);
  if (ambientModes.has(config.mode)) {
    buildHomepageAmbientParticles(config.mode);
  } else {
    const ambient = layer.querySelector(".homepageEffectParticles");
    if (ambient) ambient.innerHTML = "";
    homepageEffectAmbientMode = "";
  }

  if (config.mode === "freedom-wall") {
    configureFreedomWall(config);
    if (isFreedomWallExactExportMode()) window.setTimeout(applyFreedomWallExactExportMode, 40);
  } else {
    stopFreedomWallLive(true);
  }

  if (config.mode === "picture") {
    await renderHomepageEffectPictureGallery(config, token);
  } else {
    stopHomepageEffectGalleryStory(true);
    homepageEffectGalleryIndex = 0;
    homepageEffectGallerySources = [];
    homepageEffectGalleryRenderSignature = "";
    const galleryTrack = layer.querySelector("#homepageEffectGalleryTrack");
    if (galleryTrack) galleryTrack.innerHTML = "";
    updateHomepageEffectGalleryControls();
  }

  if (config.mode === "youtube") renderHomepageEffectYouTube(config);
  else clearHomepageEffectYouTube();

  if (config.mode === "rickroll") renderHomepageRickroll(config);
  else clearHomepageRickroll();
}

function renderDashboard(data) {
  if (!data || !data.settings) return;

  if (isClassBoardPageLocked(data.settings)) {
    showClassBoardPageLock(data.settings);
    return;
  }

  hideClassBoardPageLock();

  setSfkDashboardBaseTitle(
    data.settings.DashboardTitle || "SFK ClassBoard"
  );

  document.getElementById("sectionText").textContent =
    `${data.settings.Section || ""} • S.Y. ${data.settings.SchoolYear || ""}`;

  applyHomepageDesignSettings(data.settings || {});
  applyHomepageEffectSettings(data.settings || {});

  const headerDateEl = document.getElementById("dateText");
  if (headerDateEl) {
    headerDateEl.textContent = `${data.day}, ${data.date}`;
    requestAnimationFrame(() => fitDesktopHeaderDate(headerDateEl));
  }

  const periodState = getDisplayPeriodState(data.schedule || [], data.currentSubject, data.nextSubject);
  applyAutoSubjectHomepageTheme(periodState);

  renderCurrentSubject(periodState.currentPeriod);
  renderNextSubject(periodState.nextPeriod);
  updateMobilePeriodCardVisibility(periodState);
  renderPrayerLeader(data.prayerLeader);
  renderCleanersToday();
  renderSchedule(data.schedule, periodState.currentPeriod);
  renderAnnouncements(data.announcements || []);
  ensureAnnouncementRotation(data.announcements || []);
  renderThings(data.thingsToBring || []);
  renderReminders(data.adviserReminders || []);
  renderQuote(data.dailyQuote);
  renderBirthdays(data.birthdays || []);
  renderTicker(data.ticker || []);
  updateCountdownAndBell();
}

function getDisplayPeriodState(schedule, currentSubject, nextSubject) {
  const sortedSchedule = (schedule || [])
    .filter(item => item && item.StartTime && item.EndTime)
    .slice()
    .sort((a, b) => timeToMinutes(a.StartTime) - timeToMinutes(b.StartTime));

  const nowMinutes = getCurrentManilaMinutes();
  const todayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Manila"
  });

  const isWeekend = todayName === "Saturday" || todayName === "Sunday";
  const firstPeriod = sortedSchedule[0] || null;
  const lastPeriod = sortedSchedule[sortedSchedule.length - 1] || null;
  const firstStart = firstPeriod ? timeToMinutes(firstPeriod.StartTime) : null;
  const lastEnd = lastPeriod ? timeToMinutes(lastPeriod.EndTime) : null;
  const oneHour = 60;

  let currentPeriod = sortedSchedule.find(item => {
    const start = timeToMinutes(item.StartTime);
    const end = timeToMinutes(item.EndTime);
    return nowMinutes >= start && nowMinutes < end;
  }) || null;

  let nextPeriod = sortedSchedule.find(item => timeToMinutes(item.StartTime) > nowMinutes) || null;

  if (!currentPeriod && firstPeriod && firstStart !== null && nowMinutes >= firstStart - oneHour && nowMinutes < firstStart) {
    currentPeriod = null;
    nextPeriod = firstPeriod;
  }

  const shouldHideOnMobile =
    isWeekend ||
    sortedSchedule.length === 0 ||
    (lastEnd !== null && nowMinutes >= lastEnd + oneHour) ||
    (firstStart !== null && nowMinutes < firstStart - oneHour);

  return {
    currentPeriod,
    nextPeriod,
    shouldHideOnMobile
  };
}

function updateMobilePeriodCardVisibility(periodState) {
  document.body.classList.toggle(
    "mobileHidePeriodCards",
    Boolean(periodState && periodState.shouldHideOnMobile)
  );
}

function renderCleanersToday() {
  const cleanersEl = document.getElementById("cleanersToday");
  if (!cleanersEl) return;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Manila"
  });

  const cleanersByDay = {
    Monday: "Group 1 + Group 6 (1)",
    Tuesday: "Group 2 + Group 6 (1)",
    Wednesday: "Group 3 + Group 6 (2)",
    Thursday: "Group 4 + Group 6 (2)",
    Friday: "Group 5 + Group 6 (2)"
  };

  cleanersEl.textContent = cleanersByDay[today] || "No cleaners today";
}

function iconFor(subject) {
  const text = String(subject || "").toLowerCase();

  for (const key in subjectIcons) {
    if (text.includes(key)) return subjectIcons[key];
  }

  return "📚";
}

function getSubjectColor(subject) {
  const sub = String(subject || "").toLowerCase().trim();

  if (sub.includes("mapeh")) return "#333333";
  if (sub.includes("cled")) return "#C084FC";
  if (sub.includes("math")) return "#90EE90";
  if (sub.includes("ict")) return "#FF6B6B";
  if (sub.includes("le")) return "#FF6B6B";
  if (sub.includes("english")) return "#FFB6C1";
  if (sub.includes("English") || sub.includes("filipno")) return "#A0522D";
  if (sub.includes("science")) return "#FFD700";
  if (sub.includes("ap") || sub.includes("araling")) return "#60A5FA";

  return "#FFD700";
}

function getScheduleTextColor(subject, backgroundColor) {
  const sub = String(subject || "").toLowerCase().trim();

  // Force black text for subjects with very light official colors.
  // This keeps Math (light green) and Science (yellow) readable in
  // Today's Schedule and in the Current / Next Period cards.
  if (sub.includes("math") || sub.includes("science")) {
    return "#111";
  }

  return getReadableTextColor(backgroundColor || getSubjectColor(subject));
}

function getSubjectTextColor(subject) {
  return getScheduleTextColor(subject, getSubjectColor(subject));
}

function getScheduleItemSubjectTextColor(item = {}, backgroundColor = "") {
  const assigned = String(
    item.TextColor ||
    item.textColor ||
    item.SubjectTextColor ||
    item.subjectTextColor ||
    item.FontColor ||
    item.fontColor ||
    item.SubjectFontColor ||
    item.subjectFontColor ||
    item.PeriodTextColor ||
    item.periodTextColor ||
    ""
  ).trim();

  return assigned || getScheduleTextColor(item.Subject, backgroundColor || item.Color || getSubjectColor(item.Subject));
}

/* v348: Resolve the configured schedule color pair for other subject UI
   (such as the Subject Announcement pill). This keeps the schedule as
   the source of truth instead of falling back to the old hard-coded palette. */
function getSubjectThemeMatchKey(subject) {
  const raw = String(subject || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!raw) return "";

  if (/\bmapeh\b/.test(raw)) return "mapeh";
  if (/\bcled?\b/.test(raw) || raw.includes("christian living")) return "cled";
  if (/\bmath(?:ematics)?\b/.test(raw)) return "math";
  if (/\bscience\b/.test(raw)) return "science";
  if (/\benglish\b/.test(raw)) return "english";
  if (/\bfilipino\b/.test(raw) || /\bfilipno\b/.test(raw)) return "filipino";
  if (raw.includes("araling panlipunan") || /(^| )ap( |$)/.test(raw)) return "ap";
  if (/\bict\b/.test(raw)) return "ict";
  if (/\btle\b/.test(raw) || raw.includes("technology and livelihood") || raw.includes("technology livelihood")) return "tle";

  return raw
    .replace(/\bgrade\s*\d+\b/g, "")
    .replace(/\b\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getConfiguredSubjectTheme(subject) {
  const key = getSubjectThemeMatchKey(subject);
  const pools = [
    Array.isArray(latestData?.schedule) ? latestData.schedule : [],
    Array.isArray(weeklyScheduleData) ? weeklyScheduleData : []
  ];

  let matched = null;
  for (const pool of pools) {
    matched = pool.find((entry) => getSubjectThemeMatchKey(entry?.Subject || entry?.subject) === key);
    if (matched) break;
  }

  const background = String(
    matched?.Color || matched?.color || matched?.BackgroundColor || matched?.backgroundColor || ""
  ).trim() || getSubjectColor(subject);

  const text = matched
    ? getScheduleItemSubjectTextColor(matched, background)
    : getScheduleTextColor(subject, background);

  return { background, text, item: matched };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function renderPeriodDetails(element, item) {
  if (!element || !item) return;

  const time = `${item.StartTime || ""} - ${item.EndTime || ""}`;
  const teacher = String(item.Teacher || "").trim();
  const room = String(item.Room || "").trim();

  const teacherMarkup = teacher
    ? `<span class="period-teacher"><span class="period-meta-icon" aria-hidden="true">👤</span><span>${escapeHtml(teacher)}</span></span>`
    : "";
  const roomMarkup = room
    ? `<span class="period-room"><span class="period-meta-icon" aria-hidden="true">📍</span><span>${escapeHtml(room)}</span></span>`
    : "";

  element.innerHTML = `
    <span class="period-time">
      <span class="period-time-icon" aria-hidden="true">◷</span>
      <span class="period-time-value">${escapeHtml(time)}</span>
    </span>
    <span class="period-meta">${teacherMarkup}${roomMarkup}</span>
  `;
}


const DEFAULT_ASSEMBLY_CANVA_LINK = "https://canva.link/gqit03d2of2blzy";
const HOLY_MASS_LINK = "https://www.facebook.com/CCFO56/";

function getScheduleItemLink(item = {}) {
  const directLink =
    item.Link ||
    item.link ||
    item.URL ||
    item.Url ||
    item.url ||
    item.Hyperlink ||
    item.hyperlink;

  if (directLink) return String(directLink).trim();

  const subject = String(item.Subject || item.subject || "").toLowerCase();
  const isMorningWorshipPeriod =
    subject.includes("morning assembly") ||
    subject.includes("morning worship") ||
    (subject.includes("morning") && subject.includes("homeroom"));

  const isHolyMassPeriod =
    subject === "mass" ||
    subject.includes("holy mass");

  if (isHolyMassPeriod) return HOLY_MASS_LINK;

  return isMorningWorshipPeriod ? DEFAULT_ASSEMBLY_CANVA_LINK : "";
}

function isSafeExternalLink(url) {
  const value = String(url || "").trim();
  return /^https?:\/\//i.test(value) || /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value);
}

function renderScheduleSubjectText(item = {}, textColor = "inherit") {
  const subject = item.Subject || item.subject || "";
  const label = `${iconFor(subject)} ${subject}`;
  const itemLink = getScheduleItemLink(item);
  const safeLabel = escapeHtml(label);

  if (!isSafeExternalLink(itemLink)) {
    return safeLabel;
  }

  return `
    <a class="schedule-text-link"
       href="${escapeHtml(itemLink)}"
       target="_blank"
       rel="noopener noreferrer"
       style="color:${textColor};">
      ${safeLabel}
    </a>
  `;
}


function renderHeroPeriodSubjectText(item = {}, textColor = "inherit") {
  const subject = item.Subject || item.subject || "";
  const icon = iconFor(subject);
  const itemLink = getScheduleItemLink(item);
  const subjectMarkup = `
    <span class="hero-subject-inline-icon" aria-hidden="true">${escapeHtml(icon)}</span>
    <span class="hero-subject-name">${escapeHtml(subject)}</span>
  `;

  if (!isSafeExternalLink(itemLink)) {
    return subjectMarkup;
  }

  return `
    <a class="schedule-text-link hero-period-subject-link"
       href="${escapeHtml(itemLink)}"
       target="_blank"
       rel="noopener noreferrer"
       style="color:${textColor};">
      ${subjectMarkup}
    </a>
  `;
}

function setHeroPeriodIcon(card, item, fallbackIcon = "◷") {
  if (!card) return;

  let iconEl = card.querySelector(".periodHeroIcon");
  if (!iconEl) {
    iconEl = document.createElement("span");
    iconEl.className = "periodHeroIcon";
    iconEl.setAttribute("aria-hidden", "true");
    card.insertBefore(iconEl, card.firstChild);
  }

  iconEl.textContent = item ? iconFor(item.Subject || item.subject || "") : fallbackIcon;
}

function applyHeroStatusLaneTheme(labelEl, laneBackground, laneTextColor) {
  if (!labelEl) return;
  const bg = String(laneBackground || "").trim();
  const fg = String(laneTextColor || "").trim();

  if (bg) labelEl.style.setProperty("--sfk-period-status-lane-bg", bg);
  else labelEl.style.removeProperty("--sfk-period-status-lane-bg");

  if (fg) labelEl.style.setProperty("--sfk-period-status-lane-fg", fg);
  else labelEl.style.removeProperty("--sfk-period-status-lane-fg");
}

function renderCurrentSubject(item) {
  const card = document.querySelector(".current");
  const subjectEl = document.getElementById("currentSubject");
  const detailsEl = document.getElementById("currentDetails");
  const countdownEl = document.getElementById("currentCountdownText");
  const labelEl = card?.querySelector(".label");
  const useSubjectColors = getHomepageBool(homepageDesignSettings, "HomepageUseSubjectPeriodColors", true);
  const overrideText = getHomepageBool(homepageDesignSettings, "HomepageOverridePeriodTextColors", false);

  if (item) {
    const subjectBg = item.Color || getSubjectColor(item.Subject);
    const autoTextColor = getScheduleTextColor(item.Subject, subjectBg);
    const assignedSubjectTextColor = getScheduleItemSubjectTextColor(item, subjectBg);
    const cardBg = useSubjectColors ? subjectBg : getHomeCssVar("--home-current-card-bg", subjectBg);
    const subjectTextColor = overrideText ? getHomeCssVar("--home-current-subject-color", assignedSubjectTextColor) : assignedSubjectTextColor;
    const detailsColor = overrideText ? getHomeCssVar("--home-current-details-color", assignedSubjectTextColor) : assignedSubjectTextColor;

    card.style.background = cardBg;
    card.style.color = subjectTextColor;
    subjectEl.style.color = subjectTextColor;
    detailsEl.style.setProperty("color", detailsColor, "important");
    if (labelEl) {
      labelEl.style.color = getHomeCssVar("--home-current-label-color", autoTextColor);
      /* v355: inverse the subject card colors inside the fixed NOW lane. */
      applyHeroStatusLaneTheme(labelEl, subjectTextColor, cardBg);
    }

    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-current-countdown-text", autoTextColor === "#111" ? "#111" : "#fff"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-current-countdown-bg", autoTextColor === "#111" ? "rgba(255,255,255,.65)" : "rgba(0,0,0,.45)"), "important");
      countdownEl.style.borderColor = "rgba(0,0,0,.25)";
    }

    setHeroPeriodIcon(card, item, "◷");
    subjectEl.innerHTML = renderHeroPeriodSubjectText(item, subjectTextColor);
    renderPeriodDetails(detailsEl, item);
    autoFitPeriodSubject(subjectEl);
    autoFitPeriodMetaLine(detailsEl.querySelector(".period-meta"));
  } else {
    card.style.background = getHomeCssVar("--home-current-card-bg", "#111");
    card.style.color = getHomeCssVar("--home-current-subject-color", "#fff");
    subjectEl.style.color = getHomeCssVar("--home-current-subject-color", "#fff");
    detailsEl.style.color = getHomeCssVar("--home-current-details-color", "#fff");
    if (labelEl) {
      const fallbackCurrentBg = getHomeCssVar("--home-current-card-bg", "#111");
      const fallbackCurrentText = getHomeCssVar("--home-current-subject-color", "#fff");
      labelEl.style.color = getHomeCssVar("--home-current-label-color", "#ffd700");
      applyHeroStatusLaneTheme(labelEl, fallbackCurrentText, fallbackCurrentBg);
    }
    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-current-countdown-text", "#111"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-current-countdown-bg", "rgba(255, 215, 0, .95)"), "important");
      countdownEl.style.borderColor = "rgba(0,0,0,.35)";
    }
    setHeroPeriodIcon(card, null, "◷");
    subjectEl.textContent = "No current period";
    detailsEl.textContent = "Free time / no scheduled period";
    autoFitPeriodSubject(subjectEl);
  }
}

function renderNextSubject(item) {
  const card = document.querySelector(".next");
  const subjectEl = document.getElementById("nextSubject");
  const detailsEl = document.getElementById("nextDetails");
  const countdownEl = document.getElementById("countdownText");
  const labelEl = card?.querySelector(".label");
  const useSubjectColors = getHomepageBool(homepageDesignSettings, "HomepageUseSubjectPeriodColors", true);
  const overrideText = getHomepageBool(homepageDesignSettings, "HomepageOverridePeriodTextColors", false);

  if (item) {
    const subjectBg = item.Color || getSubjectColor(item.Subject);
    const autoTextColor = getScheduleTextColor(item.Subject, subjectBg);
    const assignedSubjectTextColor = getScheduleItemSubjectTextColor(item, subjectBg);
    const cardBg = useSubjectColors ? subjectBg : getHomeCssVar("--home-next-card-bg", subjectBg);
    const subjectTextColor = overrideText ? getHomeCssVar("--home-next-subject-color", assignedSubjectTextColor) : assignedSubjectTextColor;
    const detailsColor = overrideText ? getHomeCssVar("--home-next-details-color", assignedSubjectTextColor) : assignedSubjectTextColor;

    card.style.background = cardBg;
    card.style.color = subjectTextColor;
    subjectEl.style.color = subjectTextColor;
    detailsEl.style.setProperty("color", detailsColor, "important");
    if (labelEl) {
      labelEl.style.color = getHomeCssVar("--home-next-label-color", autoTextColor);
      /* v355: inverse the subject card colors inside the fixed NEXT lane. */
      applyHeroStatusLaneTheme(labelEl, subjectTextColor, cardBg);
    }

    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-next-countdown-text", autoTextColor === "#111" ? "#111" : "#fff"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-next-countdown-bg", autoTextColor === "#111" ? "rgba(255,255,255,.65)" : "rgba(0,0,0,.45)"), "important");
    }

    setHeroPeriodIcon(card, item, "»");
    subjectEl.innerHTML = renderHeroPeriodSubjectText(item, subjectTextColor);
    renderPeriodDetails(detailsEl, item);
    autoFitPeriodSubject(subjectEl);
    autoFitPeriodMetaLine(detailsEl.querySelector(".period-meta"));

  } else {
    card.style.background = getHomeCssVar("--home-next-card-bg", "#fff7c7");
    card.style.color = getHomeCssVar("--home-next-subject-color", "#111");
    subjectEl.style.color = getHomeCssVar("--home-next-subject-color", "#111");
    detailsEl.style.color = getHomeCssVar("--home-next-details-color", "#111");
    if (labelEl) {
      const fallbackNextBg = getHomeCssVar("--home-next-card-bg", "#fff7c7");
      const fallbackNextText = getHomeCssVar("--home-next-subject-color", "#111");
      labelEl.style.color = getHomeCssVar("--home-next-label-color", "#111");
      applyHeroStatusLaneTheme(labelEl, fallbackNextText, fallbackNextBg);
    }
    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-next-countdown-text", "#fff"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-next-countdown-bg", "rgba(0, 0, 0, .44)"), "important");
    }
    setHeroPeriodIcon(card, null, "»");
    subjectEl.textContent = "No next period";
    detailsEl.textContent = "End of schedule";
    countdownEl.textContent = "No upcoming period";
    autoFitPeriodSubject(subjectEl);

  }
}


function renderPrayerLeader(item) {
  document.getElementById("prayerLeader").textContent =
    item ? item.PrayerLeader : "Not set";
}


function isSubjectDetailsScheduleItem(item = {}) {
  const subject = String(item.Subject || item.subject || "").trim().toLowerCase();
  if (!subject) return false;

  // Keep existing Canva / FB / external links untouched.
  if (isSafeExternalLink(getScheduleItemLink(item))) return false;

  // Non-academic / special cards should keep their existing behavior or remain plain.
  const excludedPatterns = [
    "break",
    "recess",
    "lunch",
    "snack",
    "morning assembly",
    "assembly",
    "daily prayer",
    "prayer",
    "angelus",
    "regina caeli",
    "holy mass",
    "mass",
    "flag ceremony",
    "homeroom",
    "free time"
  ];

  return !excludedPatterns.some((pattern) => subject.includes(pattern));
}

function renderSchedule(items, currentSubject) {
  const box = document.getElementById("scheduleList");
  if (!box) return;

  bindTodayScheduleFocusGuard();

  // v443: Disable browser scroll anchoring for this panel. The schedule itself
  // owns its scroll position, so unrelated DOM/layout updates must never tug it.
  box.style.overflowAnchor = "none";

  if (!items || items.length === 0) {
    const emptySignature = "no-schedule";
    if (lastTodayScheduleRenderSignature !== emptySignature) {
      box.classList.remove("all-periods-complete");
      box.innerHTML = `<p>No schedule for today.</p>`;
      lastTodayScheduleRenderSignature = emptySignature;
    }

    syncTodayScheduleToggle();
    clearTodayScheduleReturnTimer();
    lastScheduleAutoScrollKey = "";

    // No schedule/current period: top is only the initial/default position for
    // this page load/state. After the user moves the panel, nothing pulls it.
    if (!todayScheduleNoCurrentInitialized) {
      todayScheduleNoCurrentInitialized = true;
      box.scrollTop = 0;
    }
    return;
  }

  const previousScrollTop = box.scrollTop;
  const currentKey = currentSubject
    ? `${currentSubject.Subject || ""}|${currentSubject.StartTime || ""}|${currentSubject.EndTime || ""}`
    : "";
  const useSubjectScheduleColors = getHomepageBool(homepageDesignSettings, "HomepageUseSubjectScheduleColors", true);
  const nowMinutes = getCurrentManilaMinutes();
  const validEndMinutes = items
    .map((item) => timeToMinutes(item.EndTime))
    .filter((value) => value > 0);
  const allScheduleComplete =
    validEndMinutes.length > 0 &&
    !currentSubject &&
    validEndMinutes.every((endMinutes) => endMinutes <= nowMinutes);

  box.classList.toggle("all-periods-complete", allScheduleComplete);

  // Only rebuild Today's Schedule when its actual content/current-period state
  // changes. Dashboard refreshes for announcements, ticker, cleaners, etc. must
  // leave this DOM completely untouched so there is no visible scroll tug.
  const scheduleRenderSignature = JSON.stringify({
    currentKey,
    useSubjectScheduleColors,
    design: {
      cardBg: getHomeCssVar("--home-schedule-card-bg", ""),
      cardText: getHomeCssVar("--home-schedule-card-text", ""),
      timeColor: getHomeCssVar("--home-schedule-time-color", ""),
      detailsColor: getHomeCssVar("--home-schedule-details-color", "")
    },
    items: items.map((item) => ({
      Subject: item?.Subject || "",
      StartTime: item?.StartTime || "",
      EndTime: item?.EndTime || "",
      Teacher: item?.Teacher || "",
      Room: item?.Room || "",
      Color: item?.Color || "",
      TextColor: item?.TextColor || item?.SubjectTextColor || ""
    }))
  });

  if (scheduleRenderSignature === lastTodayScheduleRenderSignature) {
    syncTodayScheduleToggle();

    if (currentKey) {
      // If a current period has just become active, focus it once. Otherwise do
      // not touch scrollTop here; the user's temporary manual scroll is handled
      // only by the current-period focus guard below.
      todayScheduleNoCurrentInitialized = false;
      if (currentKey !== lastScheduleAutoScrollKey) {
        lastScheduleAutoScrollKey = currentKey;
        scrollToCurrentSchedule();
      }
    } else {
      clearTodayScheduleReturnTimer();
      lastScheduleAutoScrollKey = "";
      if (!todayScheduleNoCurrentInitialized) {
        todayScheduleNoCurrentInitialized = true;
        box.scrollTop = 0;
      }
      // IMPORTANT: once initialized with no current period, do absolutely
      // nothing to box.scrollTop. Manual scrolling remains exactly where left.
    }
    return;
  }

  const scheduleHtml = items.map(item => {
    const subjectColor = item.Color || getSubjectColor(item.Subject);
    const autoTextColor = getScheduleTextColor(item.Subject, subjectColor);
    const assignedSubjectTextColor = getScheduleItemSubjectTextColor(item, subjectColor);
    const cardColor = useSubjectScheduleColors ? subjectColor : getHomeCssVar("--home-schedule-card-bg", subjectColor);
    const textColor = useSubjectScheduleColors ? assignedSubjectTextColor : getHomeCssVar("--home-schedule-card-text", autoTextColor);
    const subjectTextColor = useSubjectScheduleColors ? assignedSubjectTextColor : textColor;
    const timeColor = useSubjectScheduleColors ? assignedSubjectTextColor : getHomeCssVar("--home-schedule-time-color", textColor);
    const detailColor = useSubjectScheduleColors ? assignedSubjectTextColor : getHomeCssVar("--home-schedule-details-color", textColor);
    const canOpenSubjectDetails = isSubjectDetailsScheduleItem(item);

    const isCurrent =
      currentSubject &&
      item.Subject === currentSubject.Subject &&
      item.StartTime === currentSubject.StartTime &&
      item.EndTime === currentSubject.EndTime;
    const endMinutes = timeToMinutes(item.EndTime);
    const isPast = !isCurrent && endMinutes > 0 && endMinutes <= nowMinutes;
    const scheduleStateClass = isCurrent ? "current-row" : (isPast ? "past-row" : "future-row");

    return `
  <div class="schedule-item ${scheduleStateClass}"
       ${isCurrent ? `aria-current="true" tabindex="-1"` : ""}
       ${canOpenSubjectDetails ? `data-subject-popup="${escapeHtml(item.Subject || "")}"` : ""}
       style="background:${cardColor}; color:${textColor};">
    <strong class="schedule-time" style="color:${timeColor};">
      <span class="schedule-time-start">${item.StartTime}</span>
      <span class="schedule-time-separator" aria-hidden="true">–</span>
      <span class="schedule-time-end">${item.EndTime}</span>
    </strong><br>
    ${isCurrent ? `<div class="current-badge">▶ CURRENT PERIOD</div>` : ""}
    <span class="subject-name" style="color:${subjectTextColor};">${renderScheduleSubjectText(item, subjectTextColor)}</span><br>
    <small style="color:${detailColor}; opacity:.9;">${item.Teacher} • ${item.Room}</small>
  </div>
`;
  }).join("");

  // Rebuild only for a real schedule/current-state change. When no period is
  // current and the user already moved the list, restore the old position in
  // the same JS task (before paint) — no delayed corrections, no bounce.
  box.innerHTML = scheduleHtml;
  lastTodayScheduleRenderSignature = scheduleRenderSignature;

  box.querySelectorAll("[data-subject-popup]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      openSubjectDetailsPopup(card.dataset.subjectPopup || "");
    });
  });

  setupTodayScheduleSubjectMarquees();
  syncTodayScheduleToggle();

  if (currentKey) {
    todayScheduleNoCurrentInitialized = false;

    if (currentKey !== lastScheduleAutoScrollKey) {
      lastScheduleAutoScrollKey = currentKey;
      scrollToCurrentSchedule();
      return;
    }

    // Content changed but the same period is still current. Preserve the live
    // position synchronously; the normal current-period guard will refocus after
    // manual scrolling becomes idle.
    box.scrollTop = previousScrollTop;
    return;
  }

  clearTodayScheduleReturnTimer();
  lastScheduleAutoScrollKey = "";

  if (!todayScheduleNoCurrentInitialized) {
    // Entering no-current state (including initial page load): default to top.
    todayScheduleNoCurrentInitialized = true;
    box.scrollTop = 0;
  } else {
    // A genuine schedule-content change occurred while no period is current.
    // Preserve position immediately; never use rAF/setTimeout restoration.
    const maxScrollTop = Math.max(0, box.scrollHeight - box.clientHeight);
    box.scrollTop = Math.max(0, Math.min(maxScrollTop, previousScrollTop));
  }
}




function normalizeSubjectRecordKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bmathematics\b/g, "math")
    .replace(/\btechnology and livelihood education\b/g, "tle")
    .replace(/\baraling panlipunan\b/g, "ap")
    .replace(/\s+/g, " ")
    .trim();
}

function getSubjectBaseKey(value = "") {
  return normalizeSubjectRecordKey(value)
    .split(" ")
    .filter(token => !/^\d+$/.test(token) && token !== "grade" && token !== "g")
    .join(" ")
    .trim();
}

function getSubjectFamilyKey(value = "") {
  const key = normalizeSubjectRecordKey(value);
  const tokens = key.split(" ").filter(Boolean);
  const tokenSet = new Set(tokens);

  // HARD SEPARATION:
  // AP / Araling Panlipunan is NOT the same as MAPEH.
  // MAPEH contains the letters "ap", but it must never match AP.
  if (tokenSet.has("mapeh") || tokenSet.has("music") || tokenSet.has("arts") || tokenSet.has("pe") || tokenSet.has("health")) {
    return "mapeh";
  }

  if (
    tokenSet.has("ap") ||
    tokenSet.has("araling") ||
    tokenSet.has("panlipunan") ||
    key === "araling panlipunan"
  ) {
    return "ap";
  }

  if (tokenSet.has("math")) return "math";
  if (tokenSet.has("science")) return "science";
  if (tokenSet.has("english")) return "english";
  if (tokenSet.has("filipino")) return "filipino";
  if (tokenSet.has("ict")) return "ict";
  if (tokenSet.has("cled")) return "cled";
  if (tokenSet.has("tle")) return "tle";

  return "";
}

function isSubjectRecordMatch(itemSubject = "", targetSubject = "") {
  const itemKey = normalizeSubjectRecordKey(itemSubject);
  const targetKey = normalizeSubjectRecordKey(targetSubject);
  if (!itemKey || !targetKey) return false;

  const itemFamily = getSubjectFamilyKey(itemKey);
  const targetFamily = getSubjectFamilyKey(targetKey);

  // If both are known academic subject families, they must be the same.
  // This prevents AP from ever getting MAPEH records.
  if (itemFamily && targetFamily) {
    return itemFamily === targetFamily;
  }

  // If one side is AP or MAPEH and the other side is unknown, do not do loose matching.
  if ((itemFamily === "ap" || itemFamily === "mapeh" || targetFamily === "ap" || targetFamily === "mapeh") && itemFamily !== targetFamily) {
    return false;
  }

  if (itemKey === targetKey) return true;

  const itemTokens = new Set(itemKey.split(" ").filter(Boolean));
  const targetTokens = targetKey.split(" ").filter(Boolean);

  if (targetTokens.length > 0 && targetTokens.every(token => itemTokens.has(token))) {
    return true;
  }

  const itemBase = getSubjectBaseKey(itemKey);
  const targetBase = getSubjectBaseKey(targetKey);
  if (itemBase && targetBase && itemBase === targetBase) {
    return true;
  }

  const canUseLooseMatch = itemBase.length >= 4 && targetBase.length >= 4;
  if (canUseLooseMatch && (itemBase.includes(targetBase) || targetBase.includes(itemBase))) {
    return true;
  }

  return false;
}

function getSubjectRecordsFallback() {
  return {
    announcements: Array.isArray(latestData?.announcements) ? latestData.announcements : [],
    thingsToBring: Array.isArray(latestData?.thingsToBring) ? latestData.thingsToBring : []
  };
}

async function fetchSubjectRecords(forceFresh = false) {
  if (!forceFresh && subjectRecordsCache) return subjectRecordsCache;
  if (!forceFresh && subjectRecordsPromise) return subjectRecordsPromise;

  subjectRecordsPromise = fetch(`${API_URL}?type=subjectRecords&ts=${Date.now()}`, { cache: "no-store" })
    .then(response => response.json())
    .then(data => {
      const hasFreshData = Array.isArray(data?.announcements) || Array.isArray(data?.thingsToBring);
      const records = {
        announcements: Array.isArray(data?.announcements) ? data.announcements : getSubjectRecordsFallback().announcements,
        thingsToBring: Array.isArray(data?.thingsToBring) ? data.thingsToBring : getSubjectRecordsFallback().thingsToBring,
        generatedAt: data?.generatedAt || "",
        source: hasFreshData ? "api" : "fallback"
      };
      subjectRecordsCache = records;
      return records;
    })
    .catch(() => ({
      ...getSubjectRecordsFallback(),
      source: "fallback"
    }))
    .finally(() => {
      subjectRecordsPromise = null;
    });

  return subjectRecordsPromise;
}

function getSubjectRecordDateValue(item = {}) {
  return (
    item.PublishDate ||
    item.ScheduledPublishDate ||
    item.PostedDate ||
    item.DatePosted ||
    item.CreatedAt ||
    item.Timestamp ||
    item.Date ||
    item.StartDate ||
    item.Deadline ||
    item.DueDate ||
    item.DateNeeded ||
    item.NeededDate ||
    ""
  );
}

function getSubjectRecordDateLabel(item = {}) {
  const value = getSubjectRecordDateValue(item);
  return value ? String(value) : "No date";
}

function getSubjectRecordSortTime(item = {}) {
  const value = getSubjectRecordDateValue(item);
  const parsed = value ? new Date(value) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
}

function getLocalDateOnlyTime(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getSubjectRecordDayTime(item = {}) {
  const value = getSubjectRecordDateValue(item);
  if (!value) return 0;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 0;
  return getLocalDateOnlyTime(parsed);
}

function isSubjectRecordInRecentWindow(item = {}, options = {}) {
  const dayTime = getSubjectRecordDayTime(item);
  if (!dayTime) return false;

  const todayTime = getLocalDateOnlyTime(new Date());
  const daysBack = Number(options.daysBack ?? 7);
  const startTime = todayTime - (Math.max(0, daysBack) * 24 * 60 * 60 * 1000);

  if (options.includeFuture) {
    return dayTime >= startTime;
  }

  return dayTime >= startTime && dayTime <= todayTime;
}

function getAnnouncementRecordText(item = {}) {
  return (
    item.Announcement ||
    item.Message ||
    item.Title ||
    item.Reminder ||
    item.Description ||
    item.Task ||
    "Announcement"
  );
}

function renderSubjectRecordText(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";

  // Rich posts from the admin editor are stored as [rich] + HTML.
  // Render them safely instead of showing raw <ul><li> tags.
  if (isRichBoardText(text)) {
    return formatBoardText(text, "left");
  }

  return formatBoardText(text, "left") || `<div class="formattedText align-left">${escapeHTML(text)}</div>`;
}

function getSubjectTimelineText(item = {}) {
  return item.__historyType === "things"
    ? (item.itemText || getThingText(item) || "Thing to bring")
    : getAnnouncementRecordText(item);
}

function getSubjectRecordCollections(subject = "", records = getSubjectRecordsFallback()) {
  const announcements = (Array.isArray(records.announcements) ? records.announcements : [])
    .filter(item => isSubjectRecordMatch(item.Subject || item.subject || "", subject))
    .sort((a, b) => getSubjectRecordSortTime(b) - getSubjectRecordSortTime(a));

  const things = (Array.isArray(records.thingsToBring) ? records.thingsToBring : [])
    .filter(item => isSubjectRecordMatch(item.Subject || item.subject || "", subject))
    .map(item => ({
      ...item,
      dateValue: getThingDateValue(item),
      itemText: getThingText(item) || getAnnouncementRecordText(item)
    }))
    .sort((a, b) => getSubjectRecordSortTime(b) - getSubjectRecordSortTime(a));

  return { announcements, things };
}

function renderSubjectRecordCards(items = [], type = "announcement") {
  if (!items.length) {
    return `<div class="subjectEmptyState">
      <span>${type === "things" ? "🎒" : "📭"}</span>
      <strong>No recent records here</strong>
      <small>Older posts may still appear in the History Timeline below.</small>
    </div>`;
  }

  return items.map((item) => {
    const isThing = type === "things";
    const text = isThing
      ? (item.itemText || "No item specified")
      : getAnnouncementRecordText(item);
    const dateLabel = isThing
      ? (item.dateValue || getSubjectRecordDateLabel(item))
      : getSubjectRecordDateLabel(item);
    const priority = item.Priority || (isThing ? "Things to Bring" : "Announcement");
    const deadline = item.Deadline || item.DueDate || item.DateNeeded || item.NeededDate || "";
    const teacher = item.Teacher || item.PostedBy || item.Author || "";

    return `
      <article class="subjectRecordCard ${isThing ? "isThing" : "isAnnouncement"}">
        <div class="subjectRecordIcon">${isThing ? "🎒" : "📢"}</div>
        <div class="subjectRecordContent">
          <div class="subjectRecordTop">
            <span class="subjectRecordDate">${escapeHtml(dateLabel)}</span>
            <span class="subjectRecordType">${escapeHtml(priority)}</span>
          </div>
          <div class="subjectRecordText">${renderSubjectRecordText(text)}</div>
          ${(deadline || teacher) ? `
            <div class="subjectRecordMeta">
              ${deadline ? `<span>📅 ${escapeHtml(deadline)}</span>` : ""}
              ${teacher ? `<span>👤 ${escapeHtml(teacher)}</span>` : ""}
            </div>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function renderSubjectHistoryTimeline(history = []) {
  if (!history.length) {
    return `<div class="subjectEmptyState"><span>🗂️</span><strong>No history yet</strong><small>No saved record for this subject has been found.</small></div>`;
  }

  return history.map(item => `
    <div class="subjectTimelineItem">
      <span>${item.__historyType === "things" ? "🎒" : "📢"}</span>
      <div>
        <b>${escapeHtml(getSubjectRecordDateLabel(item))}</b>
        <div class="subjectTimelineText">${renderSubjectRecordText(getSubjectTimelineText(item))}</div>
      </div>
    </div>
  `).join("");
}

function renderSubjectDetailsPopupContent(popup, subject, records, statusLabel = "") {
  const { announcements, things } = getSubjectRecordCollections(subject, records);

  const recentAnnouncements = announcements.filter(item =>
    isSubjectRecordInRecentWindow(item, { daysBack: 7, includeFuture: false })
  );

  const currentThings = things.filter(item =>
    isSubjectRecordInRecentWindow(item, { daysBack: 7, includeFuture: true })
  );

  const history = [
    ...announcements.map(item => ({ ...item, __historyType: "announcement" })),
    ...things.map(item => ({ ...item, __historyType: "things" }))
  ].sort((a, b) => getSubjectRecordSortTime(b) - getSubjectRecordSortTime(a));

  const card = popup.querySelector(".subjectDetailsCard");
  if (!card) return;

  const subjectAccent = getSubjectColor(subject);
  const subjectAccentText = getScheduleTextColor(subject, subjectAccent);
  card.style.setProperty("--subject-accent", subjectAccent);
  card.style.setProperty("--subject-accent-text", subjectAccentText);

  card.innerHTML = `
    <button class="subjectDetailsClose" aria-label="Close subject details">×</button>

    <div class="subjectDetailsHero">
      <div class="subjectDetailsIcon" style="background:${subjectAccent}; color:${subjectAccentText};">${iconFor(subject)}</div>
      <div>
        <span class="subjectDetailsKicker" style="background:${subjectAccent}; color:${subjectAccentText};">Subject records ${statusLabel ? `• ${escapeHtml(statusLabel)}` : ""}</span>
        <h2 style="color:${subjectAccent};">${escapeHtml(subject)}</h2>
        <p>Recent posts show here. Older posts are kept in the History Timeline.</p>
      </div>
    </div>

    <div class="subjectStats">
      <span><strong>${recentAnnouncements.length}</strong><small>Recent Announcements</small></span>
      <span><strong>${currentThings.length}</strong><small>Current Bring Items</small></span>
      <span><strong>${history.length}</strong><small>All History</small></span>
    </div>

    <section class="subjectDetailsSection subjectRecentSection">
      <h3>📢 Announcements <small>Today + last 7 days</small></h3>
      <div class="subjectRecordList">${renderSubjectRecordCards(recentAnnouncements, "announcement")}</div>
    </section>

    <section class="subjectDetailsSection subjectRecentSection">
      <h3>🎒 Things to Bring <small>Today + last 7 days + upcoming</small></h3>
      <div class="subjectRecordList">${renderSubjectRecordCards(currentThings, "things")}</div>
    </section>

    <section class="subjectDetailsSection subjectHistoryOnlySection">
      <h3>📜 History Timeline <small>All records, including older posts</small></h3>
      <div class="subjectTimeline">${renderSubjectHistoryTimeline(history)}</div>
    </section>
  `;

  card.querySelector(".subjectDetailsClose").onclick = () => popup.remove();
}

async function openSubjectDetailsPopup(subjectName) {
  const subject = String(subjectName || "").trim();
  if (!subject) return;

  document.getElementById("subjectDetailsPopup")?.remove();

  const popup = document.createElement("div");
  popup.id = "subjectDetailsPopup";
  popup.className = "subjectDetailsPopup";
  popup.innerHTML = `
    <div class="subjectDetailsCard isLoading">
      <button class="subjectDetailsClose" aria-label="Close subject details">×</button>
      <div class="subjectLoading" style="--subject-accent:${getSubjectColor(subject)}; --subject-accent-text:${getScheduleTextColor(subject, getSubjectColor(subject))};">
        <span style="background:${getSubjectColor(subject)}; color:${getScheduleTextColor(subject, getSubjectColor(subject))};">${iconFor(subject)}</span>
        <strong style="color:${getSubjectColor(subject)};">Loading ${escapeHtml(subject)} records...</strong>
        <small>Loading all saved posts from Announcements and ThingsToBring.</small>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  popup.querySelector(".subjectDetailsClose").onclick = () => popup.remove();
  popup.onclick = (event) => {
    if (event.target === popup) popup.remove();
  };

  renderSubjectDetailsPopupContent(popup, subject, getSubjectRecordsFallback(), "current data");

  const freshRecords = await fetchSubjectRecords(true);
  if (!document.body.contains(popup)) return;
  renderSubjectDetailsPopupContent(popup, subject, freshRecords, "all history");
}



function isCompactScheduleView() {
  return window.matchMedia("(max-width: 700px)").matches;
}

function syncTodayScheduleToggle() {
  const card = document.querySelector(".scheduleCard");
  const button = document.getElementById("todayScheduleToggle");

  if (!card || !button) return;

  if (!isCompactScheduleView()) {
    card.classList.remove("todayScheduleCollapsed");
    button.textContent = "Today's Schedule";
    return;
  }

  card.classList.toggle("todayScheduleCollapsed", !isTodayScheduleOpen);
  button.textContent = isTodayScheduleOpen
    ? "Hide Today ▲"
    : "Show Today ▼";
}

function toggleTodaySchedule() {
  isTodayScheduleOpen = !isTodayScheduleOpen;
  syncTodayScheduleToggle();

  if (isTodayScheduleOpen) {
    setTimeout(scrollToCurrentSchedule, 120);
  }
}

function clearTodayScheduleReturnTimer() {
  if (todayScheduleReturnTimer) {
    clearTimeout(todayScheduleReturnTimer);
    todayScheduleReturnTimer = null;
  }
}

function bindTodayScheduleFocusGuard() {
  const scheduleBox = document.getElementById("scheduleList");
  if (!scheduleBox || scheduleBox.dataset.currentFocusGuardBound === "1") return;

  scheduleBox.dataset.currentFocusGuardBound = "1";
  scheduleBox.addEventListener("scroll", () => {
    const currentRow = scheduleBox.querySelector(".current-row");
    if (!currentRow) {
      // v443: No active period means manual scroll has absolute ownership.
      // There is intentionally no save/restore timer and no scroll correction.
      clearTodayScheduleReturnTimer();
      return;
    }

    // Ignore scroll events produced by our own smooth current-period focus.
    if (Date.now() < todayScheduleAutoScrollLockUntil) return;

    // While a period is current, allow the user to inspect the list, then
    // return to the active subject after scrolling has been idle for a moment.
    clearTodayScheduleReturnTimer();
    todayScheduleReturnTimer = window.setTimeout(() => {
      todayScheduleReturnTimer = null;
      if (scheduleBox.querySelector(".current-row")) {
        scrollToCurrentSchedule();
      }
    }, 1200);
  }, { passive: true });
}

function scrollToCurrentSchedule(attempt = 0) {
  const scheduleBox = document.getElementById("scheduleList");
  if (!scheduleBox) return;

  window.setTimeout(() => {
    const currentRow = scheduleBox.querySelector(".current-row");
    if (!currentRow) return;

    // The panel may still be opening or laying itself out on phones.
    // Retry briefly until its scrollable height is ready.
    if (scheduleBox.clientHeight <= 0 && attempt < 4) {
      scrollToCurrentSchedule(attempt + 1);
      return;
    }

    const maxScrollTop = Math.max(0, scheduleBox.scrollHeight - scheduleBox.clientHeight);
    const centeredTop = Math.max(
      0,
      Math.min(
        maxScrollTop,
        currentRow.offsetTop - (scheduleBox.clientHeight - currentRow.offsetHeight) / 2
      )
    );

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    clearTodayScheduleReturnTimer();
    todayScheduleAutoScrollLockUntil = Date.now() + 1200;
    scheduleBox.scrollTo({
      top: centeredTop,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });

    // Give the current schedule keyboard focus without moving the whole page.
    try {
      currentRow.focus({ preventScroll: true });
    } catch (error) {
      currentRow.focus();
    }

    currentRow.classList.remove("current-focus-pulse");
    void currentRow.offsetWidth;
    currentRow.classList.add("current-focus-pulse");
  }, attempt === 0 ? 120 : 160);
}

function normalizeAnnouncementIndex(index, total) {
  const count = Number(total) || 0;
  if (count <= 0) return 0;
  const safe = Number(index) || 0;
  return ((safe % count) + count) % count;
}

function renderAnnouncements(items) {
  items = getActiveAnnouncements(items);
  const box = document.getElementById("announcementList");
  const title = document.getElementById("announcementTitle");

  if (!items || items.length === 0) {
    title.textContent = "Subject Announcements";
    box.innerHTML = `
      <div class="announcementEmptyState" role="status" aria-live="polite">
        <div class="announcementEmptyIcon" aria-hidden="true">📢</div>
        <div class="announcementEmptyTextWrap">
          <h3>No announcements yet</h3>
          <p>Everything is quiet for now. Please wait for the next class update.</p>
        </div>
      </div>`;
    return;
  }

  const total = items.length;
  announcementIndex = normalizeAnnouncementIndex(announcementIndex, total);
  const currentNumber = announcementIndex + 1;
  const item = items[announcementIndex];

  const configuredSubjectTheme = getConfiguredSubjectTheme(item.Subject);
  const subjectColor = configuredSubjectTheme.background;
  const subjectTextColor = configuredSubjectTheme.text;
  const announcementText = item.Announcement || "";
  const formattedAnnouncement = formatBoardText(announcementText, "center");
  const announcementSizeClass = getAnnouncementTextSizeClass(announcementText);
  const announcementRichClass = isRichBoardText(announcementText) ? "announcement-rich" : "";
  const attachmentMarkup = renderAnnouncementAttachments(item);
  const metadataMarkup = renderAnnouncementMetadata(item);
  const postedChipMarkup = renderAnnouncementPostedChip(item);

  title.textContent = `Subject Announcements (${currentNumber} / ${total})`;

  box.innerHTML = `
    <div class="announcement-item rotating-announcement ${announcementSizeClass} ${announcementRichClass}">

      <div class="announcement-top-left">
        <span class="announcement-subject-pill"
              style="background:${subjectColor}; color:${subjectTextColor};">
          ${iconFor(item.Subject)} ${item.Subject}

          <span class="priority-mini">
            ${item.Priority || "Reminder"}
          </span>
        </span>
        ${postedChipMarkup}
      </div>

      <div class="announcement-center-content">
        <div class="announcement-main-text">
          ${formattedAnnouncement}
        </div>
      </div>

      <div class="announcement-bottom-stack">
        ${metadataMarkup}

        ${attachmentMarkup}

        <div class="announcement-controls">
          <button class="announcement-btn prev-btn" onclick="previousAnnouncement()" aria-label="Previous announcement">
            <span class="announcement-nav-icon" aria-hidden="true">←</span>
            <span class="announcement-nav-label">Previous</span>
          </button>
          ${renderAnnouncementHeartButton(item)}
          <button class="announcement-btn next-btn" onclick="nextAnnouncement()" aria-label="Next announcement">
            <span class="announcement-nav-label">Next</span>
            <span class="announcement-nav-icon" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

    </div>
  `;

  hydrateAnnouncementMedia(box).catch(() => {});
  scheduleAnnouncementMediaHydration("render-announcements");
  requestAnimationFrame(fitAnnouncementTextToCard);
  setTimeout(fitAnnouncementTextToCard, 90);
  setTimeout(fitAnnouncementTextToCard, 260);
  setTimeout(fitAnnouncementTextToCard, 650);
  setTimeout(fitAnnouncementTextToCard, 1200);
}



let announcementViewportRefitTimer = null;

function scheduleAnnouncementViewportRefit() {
  // Browser F11 / maximize / restore can fire resize before the layout has
  // finished settling. Refit now, then again after the viewport stabilizes
  // so the announcement keeps the same readable size instead of getting
  // stuck at a temporary smaller measurement.
  requestAnimationFrame(() => fitAnnouncementTextToCard());

  if (announcementViewportRefitTimer) {
    clearTimeout(announcementViewportRefitTimer);
  }

  announcementViewportRefitTimer = setTimeout(() => {
    requestAnimationFrame(() => fitAnnouncementTextToCard());
  }, 120);

  setTimeout(() => {
    requestAnimationFrame(() => fitAnnouncementTextToCard());
  }, 320);
}


function fitAnnouncementTextToCard() {
  const card = document.querySelector(".announcement-item.rotating-announcement");
  const text = card ? card.querySelector(".announcement-main-text") : null;
  const center = card ? card.querySelector(".announcement-center-content") : null;

  if (!card || !text || !center) return;

  const plainText = (text.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  const charCount = plainText.length;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
  const visualUnits = estimateAnnouncementVisualUnits(text);
  const hasRichText = !!text.querySelector(".richBoardText");
  const canGrowWithPage = viewportWidth <= 1200 || card.classList.contains("announcement-phone-flow");

  card.classList.remove("announcement-fitted-tight", "announcement-fit-scroll");
  text.style.removeProperty("max-height");
  text.style.removeProperty("overflow-y");

  const targetFont = getAnnouncementTargetFontSize(charCount, viewportWidth, viewportHeight, visualUnits, hasRichText);
  const minimumFont = getAnnouncementMinimumFontSize(charCount, viewportWidth, viewportHeight, visualUnits, hasRichText);
  const lineHeight = getAnnouncementLineHeight(charCount, visualUnits, hasRichText);

  text.style.setProperty("--announcement-fit-line-height", String(lineHeight));

  // In one-column tablet/phone layouts, the card is allowed to grow with the page.
  // Do not squeeze the text there; readability is more important than fixed height.
  if (canGrowWithPage) {
    text.style.setProperty("--announcement-fit-font", `${targetFont}px`);
    text.style.maxHeight = "none";
    text.style.overflowY = "visible";
    return;
  }

  // Desktop display: use the biggest possible text without touching the subject,
  // posted date, teacher/deadline, attachments, navigation, or heart button.
  let availableTextHeight = getAnnouncementAvailableTextHeight(center, text);
  const maximumFont = getAnnouncementMaximumFontSize(
    charCount,
    viewportWidth,
    viewportHeight,
    visualUnits,
    hasRichText,
    availableTextHeight,
    center.clientWidth || center.getBoundingClientRect().width || 0
  );

  text.style.maxHeight = `${availableTextHeight}px`;
  text.style.overflowY = "hidden";

  let low = minimumFont;
  let high = Math.max(minimumFont, maximumFont);
  let best = minimumFont;

  for (let i = 0; i < 22; i++) {
    const mid = (low + high) / 2;
    text.style.setProperty("--announcement-fit-font", `${mid}px`);
    availableTextHeight = getAnnouncementAvailableTextHeight(center, text);
    text.style.maxHeight = `${availableTextHeight}px`;

    if (announcementContentOverflows(card, center, text, availableTextHeight)) {
      high = mid - 0.1;
    } else {
      best = mid;
      low = mid + 0.1;
    }
  }

  const finalFont = Math.max(minimumFont, Math.min(best, maximumFont));
  text.style.setProperty("--announcement-fit-font", `${finalFont.toFixed(2)}px`);
  availableTextHeight = getAnnouncementAvailableTextHeight(center, text);
  text.style.maxHeight = `${availableTextHeight}px`;

  const stillOverflowing = announcementContentOverflows(card, center, text, availableTextHeight);
  card.classList.toggle("announcement-fitted-tight", stillOverflowing);

  // Last-resort safety: never overlap the footer/buttons. Keep the fixed slots safe
  // and scroll only the announcement text when the post is extremely long.
  if (stillOverflowing) {
    text.style.setProperty("--announcement-fit-font", `${minimumFont}px`);
    text.style.overflowY = "auto";
    card.classList.add("announcement-fit-scroll");
  }
}

function getAnnouncementAvailableTextHeight(center, text) {
  if (!center || !text) return 160;

  const children = Array.from(center.children || []);
  const styles = window.getComputedStyle(center);
  const gap = Number.parseFloat(styles.rowGap || styles.gap || "0") || 0;
  const paddingTop = Number.parseFloat(styles.paddingTop || "0") || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom || "0") || 0;
  const centerHeight = center.clientHeight || center.getBoundingClientRect().height || 0;
  const nonTextHeight = children
    .filter(child => child !== text && child.offsetParent !== null)
    .reduce((sum, child) => sum + child.offsetHeight, 0);
  const visibleChildren = children.filter(child => child.offsetParent !== null).length;
  const gapHeight = Math.max(0, visibleChildren - 1) * gap;
  const available = centerHeight - nonTextHeight - gapHeight - paddingTop - paddingBottom - 10;

  return Math.max(58, available || Math.max(120, centerHeight * 0.70));
}

function announcementContentOverflows(card, center, text, availableTextHeight) {
  if (!center || !text) return false;

  // Only the text slot is allowed to shrink/scroll.
  // The deadline/teacher row and navigation buttons live in a fixed bottom stack,
  // so they must not be used as part of the text-fit calculation.
  const slotHeight = availableTextHeight || center.clientHeight || 0;
  return text.scrollHeight > slotHeight + 3 || center.scrollHeight > center.clientHeight + 3;
}

function estimateAnnouncementVisualUnits(text) {
  if (!text) return 1;

  const rich = text.querySelector(".richBoardText");
  const blockCount = rich
    ? rich.querySelectorAll("p, div").length
    : 0;
  const breakCount = rich
    ? rich.querySelectorAll("br").length
    : 0;
  const listCount = rich
    ? rich.querySelectorAll("li").length
    : 0;
  const plain = (text.textContent || "").replace(/\s+/g, " ").trim();
  const wrapUnits = Math.ceil(plain.length / 72);

  // Count visual rows, but keep the estimate gentle. The actual DOM measurement
  // below will decide whether shrinking is really needed.
  return Math.max(1, Math.ceil(blockCount * 0.75) + Math.ceil(breakCount * 0.45) + Math.ceil(listCount * 0.28), wrapUnits);
}

function getAnnouncementTargetFontSize(charCount, viewportWidth, viewportHeight, visualUnits = 1, hasRichText = false) {
  const shortHeight = viewportHeight <= 820;
  const veryShortHeight = viewportHeight <= 720;
  const phone = viewportWidth <= 900;
  const wideBoard = viewportWidth >= 1500 && viewportHeight >= 820;

  let size;

  if (hasRichText) {
    // v9: Rich editor posts used to be treated too conservatively, so the
    // desktop display looked small. Start larger, then let the measured
    // binary-search below shrink only when it would overlap the safe slots.
    if (charCount <= 30) size = phone ? 26 : 64;
    else if (charCount <= 60) size = phone ? 24 : 56;
    else if (charCount <= 100) size = phone ? 22 : 48;
    else if (charCount <= 160) size = phone ? 20 : 40;
    else if (charCount <= 240) size = phone ? 18 : 34;
    else if (charCount <= 360) size = phone ? 16 : 28;
    else if (charCount <= 540) size = phone ? 14 : 22;
    else size = phone ? 13 : 17;

    if (wideBoard && charCount <= 260) size += 6;
    if (visualUnits >= 8) size -= 1;
    if (visualUnits >= 12) size -= 2;
  } else {
    if (charCount <= 20) size = phone ? 44 : 72;
    else if (charCount <= 40) size = phone ? 40 : 64;
    else if (charCount <= 60) size = phone ? 38 : 58;
    else if (charCount <= 100) size = phone ? 34 : 50;
    else if (charCount <= 160) size = phone ? 28 : 42;
    else if (charCount <= 240) size = phone ? 24 : 34;
    else if (charCount <= 340) size = phone ? 21 : 28;
    else if (charCount <= 460) size = phone ? 18 : 23;
    else size = phone ? 16 : 18;
  }

  if (shortHeight) size -= hasRichText ? 1 : 3;
  if (veryShortHeight) size -= hasRichText ? 1 : 4;

  return Math.max(size, getAnnouncementMinimumFontSize(charCount, viewportWidth, viewportHeight, visualUnits, hasRichText));
}

function getAnnouncementMaximumFontSize(charCount, viewportWidth, viewportHeight, visualUnits = 1, hasRichText = false, availableTextHeight = 180, centerWidth = 0) {
  const base = getAnnouncementTargetFontSize(charCount, viewportWidth, viewportHeight, visualUnits, hasRichText);
  const heightCap = Math.max(18, (availableTextHeight || 180) * (hasRichText ? 0.42 : 0.58));
  const widthCap = centerWidth
    ? Math.max(18, centerWidth / Math.max(8, Math.min(Math.max(charCount, 1), 32)) * (hasRichText ? 1.55 : 1.85))
    : 96;
  const hardCap = hasRichText ? 76 : 88;

  if (charCount <= 18 && !hasRichText) {
    return Math.min(hardCap, Math.max(base, heightCap, 58));
  }

  if (charCount <= 60 && !hasRichText) {
    return Math.min(hardCap, Math.max(base, Math.min(heightCap, widthCap), 48));
  }

  if (hasRichText && charCount <= 60) {
    return Math.min(hardCap, Math.max(base, Math.min(heightCap, widthCap), 46));
  }

  if (hasRichText && charCount <= 140) {
    return Math.min(hardCap, Math.max(base, Math.min(heightCap, widthCap), 36));
  }

  return Math.min(hardCap, Math.max(base, Math.min(heightCap, widthCap)));
}

function getAnnouncementMinimumFontSize(charCount, viewportWidth, viewportHeight, visualUnits = 1, hasRichText = false) {
  const phone = viewportWidth <= 900;
  const veryShortHeight = viewportHeight <= 720;

  if (hasRichText) {
    if (phone) return 12;

    // v292: Keep the SAME readable desktop floor in normal-window and F11 modes.
    // Previously this floor only applied when viewportHeight <= 860, so entering
    // fullscreen removed the protection and the auto-fitter could shrink a short
    // announcement much more than it did in the normal desktop view.
    if (charCount <= 140 && visualUnits <= 4) return veryShortHeight ? 24 : 28;
    if (charCount <= 260 && visualUnits <= 6) return veryShortHeight ? 21 : 24;
    if (charCount <= 420 && visualUnits <= 9) return veryShortHeight ? 18 : 20;
    if (charCount <= 620 && visualUnits <= 12) return veryShortHeight ? 15 : 17;
    if (charCount > 700 || visualUnits > 14) return veryShortHeight ? 12 : 13.5;
    return veryShortHeight ? 12.5 : 14;
  }

  if (phone) {
    if (charCount <= 120) return 16;
    if (charCount <= 260) return 13;
    if (charCount <= 460) return 11;
    return veryShortHeight ? 10.5 : 11.5;
  }

  // Same desktop floor whether the browser is windowed, maximized, or F11.
  if (charCount <= 120) return veryShortHeight ? 26 : 30;
  if (charCount <= 260) return veryShortHeight ? 20 : 24;
  if (charCount <= 460) return veryShortHeight ? 15 : 18;
  return veryShortHeight ? 12 : 14;
}

function getAnnouncementLineHeight(charCount, visualUnits = 1, hasRichText = false) {
  if (hasRichText) {
    if (charCount <= 80 && visualUnits <= 3) return 1.06;
    if (charCount <= 180) return 1.08;
    if (charCount <= 360) return 1.11;
    return 1.10;
  }
  if (charCount <= 60 && visualUnits <= 2) return 1.02;
  if (charCount <= 120) return 1.06;
  return 1.12;
}

function renderAnnouncementHeartButton(item) {
  if (!shouldShowAnnouncementHeart(item)) return `<span class="announcement-heart-spacer"></span>`;

  const id = getAnnouncementId(item);
  const count = getAnnouncementHeartCount(item);
  const isHearted = id ? isAnnouncementHeartedByThisDevice(item) : false;
  const label = "Noted";

  return `
    <button
      class="announcement-heart-btn ${isHearted ? "is-hearted" : ""}"
      type="button"
      data-announcement-id="${escapeAttr(id)}"
      onclick="heartAnnouncement('${escapeJsAttribute(id)}')"
      ${!id ? "disabled" : ""}
      aria-label="Acknowledge this announcement">
      <span class="heart-icon">${isHearted ? "❤️" : "🤍"}</span>
      <span>${label}</span>
      <strong>${count}</strong>
    </button>
  `;
}

function shouldShowAnnouncementHeart(item) {
  return true;
}

function getAnnouncementId(item) {
  const explicitId = String(
    (item && (item.docId || item.DocID || item.__docId || item.ID || item.Id || item.id || item.RecordID || item["Record ID"])) ||
    ""
  ).trim();

  if (explicitId) return explicitId;

  return createAnnouncementFallbackId(item);
}

function createAnnouncementFallbackId(item) {
  if (!item) return "";

  const rowNumber = String(
    item.RowNumber ||
    item.rowNumber ||
    item.__rowNumber ||
    ""
  ).trim();

  if (rowNumber) {
    return `ANN-ROW-${rowNumber}`;
  }

  const raw = [
    item.Date || item.PostedDate || item.DatePosted || "",
    item.Subject || "",
    item.Announcement || "",
    item.Teacher || "",
    item.Deadline || ""
  ]
    .map(normalizeAnnouncementKeyPart)
    .filter(Boolean)
    .join("|");

  return raw ? `ANN-${simpleAnnouncementHash(raw)}` : "";
}

function normalizeAnnouncementKeyPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

function simpleAnnouncementHash(value) {
  let hash = 0;
  const text = String(value || "");

  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36).toUpperCase();
}


function getAnnouncementHeartCount(item) {
  const heartUsers = getHeartUsersV2(item);
  const mapCount = Object.keys(heartUsers).length;
  if (mapCount > 0) return mapCount;

  const values = [
    item?.HeartCountV2,
    item?.heartCountV2,
    item?.NotedCountV2,
    item?.notedCountV2
  ]
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);

  return values.length ? Math.max(...values) : 0;
}

function getHeartUsersV2(item) {
  return normalizeHeartedDevices(item?.HeartUsersV2 || item?.heartUsersV2 || item?.NotedDevicesV2 || item?.notedDevicesV2);
}

function isAnnouncementHeartedByThisDevice(item) {
  const deviceId = getClassBoardHeartDeviceId();
  return Boolean(getHeartUsersV2(item)[deviceId]);
}

function getHeartedAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_HEARTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHeartedAnnouncements(ids) {
  localStorage.setItem(
    ANNOUNCEMENT_HEARTS_KEY,
    JSON.stringify(Array.from(new Set(ids.filter(Boolean))))
  );
}

function isAnnouncementHearted(id) {
  return getHeartedAnnouncements().includes(String(id || ""));
}

function markAnnouncementHearted(id) {
  const ids = getHeartedAnnouncements();
  ids.push(String(id || ""));
  saveHeartedAnnouncements(ids);
}

function unmarkAnnouncementHearted(id) {
  const cleanId = String(id || "");
  saveHeartedAnnouncements(getHeartedAnnouncements().filter(item => item !== cleanId));
}


const HEART_DEVICE_ID_KEY = "sfkClassBoardHeartDeviceId.v1";
const ANNOUNCEMENT_HEART_PENDING = new Set();

function getClassBoardHeartDeviceId() {
  try {
    const existing = localStorage.getItem(HEART_DEVICE_ID_KEY);
    if (existing) return existing;
    const random = window.crypto && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(12))).map(value => value.toString(16).padStart(2, "0")).join("")
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const id = `device-${random}`;
    localStorage.setItem(HEART_DEVICE_ID_KEY, id);
    return id;
  } catch (error) {
    return "device-fallback";
  }
}

function setAnnouncementHeartState(id, hearted) {
  if (hearted) markAnnouncementHearted(id);
  else unmarkAnnouncementHearted(id);
}


function syncAnnouncementHeartStatesFromServer(data) {
  const announcements = Array.isArray(data?.announcements) ? data.announcements : [];
  if (announcements.length === 0) return;

  const deviceId = getClassBoardHeartDeviceId();
  announcements.forEach(item => {
    const id = getAnnouncementId(item);
    if (!id) return;

    const serverState = getServerHeartStateForDevice(item, deviceId);
    if (serverState === true) setAnnouncementHeartState(id, true);
    else if (serverState === false || getAnnouncementHeartCount(item) === 0) setAnnouncementHeartState(id, false);
  });
}

function getServerHeartStateForDevice(item, deviceId) {
  const map = normalizeHeartedDevices(item?.HeartUsersV2 || item?.heartUsersV2 || item?.NotedDevicesV2 || item?.notedDevicesV2 || item?.HeartedDevices || item?.heartedDevices);
  const keys = Object.keys(map);
  if (keys.length === 0) return null;
  return Boolean(map[deviceId]);
}

function normalizeHeartedDevices(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, isHearted]) => key && Boolean(isHearted))
      .map(([key]) => [String(key), true])
  );
}

function escapeJsAttribute(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

async function heartAnnouncement(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || ANNOUNCEMENT_HEART_PENDING.has(cleanId)) return false;

  const item = findAnnouncementById(cleanId);
  if (!item) {
    console.warn("Announcement not found for heart:", cleanId);
    return false;
  }

  const nextHearted = !isAnnouncementHeartedByThisDevice(item);
  ANNOUNCEMENT_HEART_PENDING.add(cleanId);
  setAnnouncementHeartButtonSaving(cleanId, true);

  try {
    const result = await saveAnnouncementHeartV2(cleanId, nextHearted);
    applyAnnouncementHeartResult(cleanId, result.count, result.hearted, result.heartUsers);
    renderAnnouncements(latestData?.announcements || []);
  } catch (error) {
    console.error("Announcement heart failed:", error);
    alert("Unable to save Noted. Please refresh and try again.");
  } finally {
    ANNOUNCEMENT_HEART_PENDING.delete(cleanId);
    setAnnouncementHeartButtonSaving(cleanId, false);
  }

  return false;
}

function findAnnouncementById(id) {
  const cleanId = String(id || "").trim();
  return (latestData?.announcements || []).find(item => getAnnouncementId(item) === cleanId) || null;
}

function setAnnouncementHeartButtonSaving(id, saving) {
  const button = document.querySelector(`.announcement-heart-btn[data-announcement-id="${cssEscapeSafe(id)}"]`);
  if (!button) return;
  button.disabled = Boolean(saving);
  button.classList.toggle("is-saving", Boolean(saving));
}

function cssEscapeSafe(value) {
  const text = String(value || "");
  if (window.CSS && typeof CSS.escape === "function") return CSS.escape(text);
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function saveAnnouncementHeartV2(id, hearted) {
  const db = getClassBoardFirestore();
  if (!db) {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "announcementHeartV2",
        payload: { id, announcementId: id, hearted, deviceId: getClassBoardHeartDeviceId() }
      })
    });
    const result = await response.json();
    if (!result.success && result.status !== "success") throw new Error(result.message || "Heart save failed.");
    return normalizeHeartSaveResult(result, hearted);
  }

  const ref = await resolveClassBoardDocumentRef(db, "announcements", id, ["ID", "id", "RecordID"]);
  if (!ref) throw new Error("Announcement record was not found in Firebase.");

  return runHeartV2Transaction(db, ref, hearted);
}

async function resolveClassBoardDocumentRef(db, collectionName, id, fields = []) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return null;

  const collection = db.collection(collectionName);
  try {
    const direct = await collection.doc(cleanId).get();
    if (direct.exists) return direct.ref;
  } catch (error) {
    console.warn("Direct document lookup failed:", error);
  }

  for (const field of fields) {
    try {
      const snap = await collection.where(field, "==", cleanId).limit(1).get();
      if (!snap.empty) return snap.docs[0].ref;
    } catch (error) {
      console.warn(`Document lookup by ${field} failed:`, error);
    }
  }

  return null;
}

async function runHeartV2Transaction(db, ref, hearted) {
  const deviceId = getClassBoardHeartDeviceId();
  let heartUsers = {};
  let nextCount = 0;

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    if (!doc.exists) throw new Error("Record was not found in Firebase.");

    const data = doc.data() || {};
    heartUsers = getHeartUsersV2(data);

    if (hearted) heartUsers[deviceId] = true;
    else delete heartUsers[deviceId];

    nextCount = Object.keys(heartUsers).length;
    const update = {
      HeartUsersV2: heartUsers,
      heartUsersV2: heartUsers,
      HeartCountV2: nextCount,
      heartCountV2: nextCount,
      NotedCountV2: nextCount,
      notedCountV2: nextCount,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    transaction.set(ref, update, { merge: true });
  });

  return { success: true, hearted: Boolean(heartUsers[deviceId]), count: nextCount, heartUsers };
}

function normalizeHeartSaveResult(result, requestedHearted) {
  const heartUsers = normalizeHeartedDevices(result.heartUsers || result.HeartUsersV2 || result.heartUsersV2);
  const count = Number.isFinite(Number(result.count)) ? Math.max(0, Number(result.count)) : Object.keys(heartUsers).length;
  return {
    success: true,
    hearted: typeof result.hearted === "boolean" ? result.hearted : Boolean(requestedHearted),
    count,
    heartUsers
  };
}

function getClassBoardFirestore() {
  try {
    if (window.SFK_CLASSBOARD_FIREBASE_DB) return window.SFK_CLASSBOARD_FIREBASE_DB;
    if (!window.firebase || !window.SFK_FIREBASE_READY) return null;
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    const db = firebase.firestore();
    window.SFK_CLASSBOARD_FIREBASE_DB = db;
    return db;
  } catch (error) {
    console.warn("Firebase database is unavailable:", error);
    return null;
  }
}

async function waitForClassBoardFirestore(timeoutMs = 7000) {
  const started = Date.now();
  let delay = 80;

  while (Date.now() - started < timeoutMs) {
    const db = getClassBoardFirestore();
    if (db) return db;
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(500, Math.round(delay * 1.45));
  }

  return getClassBoardFirestore();
}

function applyAnnouncementHeartResult(id, count, hearted, heartUsers) {
  if (!latestData || !Array.isArray(latestData.announcements)) return;

  const deviceId = getClassBoardHeartDeviceId();
  const map = normalizeHeartedDevices(heartUsers);
  if (Object.keys(map).length === 0 && hearted) map[deviceId] = true;
  if (!hearted) delete map[deviceId];
  const safeCount = Math.max(0, Number.isFinite(Number(count)) ? Number(count) : Object.keys(map).length);

  latestData.announcements = latestData.announcements.map(item => {
    if (getAnnouncementId(item) !== id) return item;
    return {
      ...item,
      HeartUsersV2: map,
      heartUsersV2: map,
      HeartCountV2: safeCount,
      heartCountV2: safeCount,
      NotedCountV2: safeCount,
      notedCountV2: safeCount
    };
  });

  try {
    safeSetClassBoardCache(JSON.stringify(latestData));
    latestDataString = JSON.stringify(latestData);
  } catch (error) {
    // Ignore cache update errors.
  }
}

function updateAnnouncementHeartCountLocal(id, value, absolute = false) {
  if (!latestData || !Array.isArray(latestData.announcements)) return;

  latestData.announcements = latestData.announcements.map(item => {
    if (getAnnouncementId(item) !== id) return item;

    const current = getAnnouncementHeartCount(item);
    const nextCount = absolute ? value : current + value;

    const safeCount = Math.max(0, Number(nextCount) || 0);
    return {
      ...item,
      HeartCount: safeCount,
      heartCount: safeCount,
      NotedCount: safeCount,
      notedCount: safeCount,
      AcknowledgementCount: safeCount,
      AcknowledgeCount: safeCount,
      Hearts: safeCount,
      hearts: safeCount
    };
  });

  try {
    const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

    if (cachedData && Array.isArray(cachedData.announcements)) {
      cachedData.announcements = cachedData.announcements.map(item => {
        const itemId = String(
          item.ID || item.Id || item.id || item.RecordID || item["Record ID"] || ""
        ).trim();

        if (itemId !== id) return item;

        const current = getAnnouncementHeartCount(item);
        const safeCount = Math.max(0, Number(absolute ? value : current + value) || 0);
        return {
          ...item,
          HeartCount: safeCount,
          heartCount: safeCount,
          NotedCount: safeCount,
          notedCount: safeCount,
          AcknowledgementCount: safeCount,
          AcknowledgeCount: safeCount,
          Hearts: safeCount,
          hearts: safeCount
        };
      });

      safeSetClassBoardCache(JSON.stringify(cachedData));
      latestDataString = JSON.stringify(cachedData);
    }
  } catch (error) {
    // Ignore cache update errors.
  }
}


function renderAnnouncementPostedChip(item) {
  const postedDate = getAnnouncementPostedDate(item);

  if (!postedDate) return "";

  return `
    <span class="announcement-posted-chip" aria-label="Published ${escapeHtml(postedDate)}">
      <span class="posted-icon">📌</span>
      <span class="posted-word">Published</span>
      <span class="posted-separator">•</span>
      <span class="posted-date-text">${escapeHtml(postedDate)}</span>
    </span>
  `;
}

function renderAnnouncementMetadata(item) {
  const deadline = getAnnouncementField(item, [
    "Deadline",
    "DueDate",
    "Due Date"
  ]);
  const teacher = getAnnouncementField(item, [
    "Teacher",
    "PostedBy",
    "Posted By"
  ]);
  const showDeadlineValue = getAnnouncementField(item, [
    "ShowDeadline",
    "Show Deadline",
    "DisplayDeadline",
    "Display Deadline"
  ]);
  const shouldShowDeadline = shouldDisplayAnnouncementDeadline(showDeadlineValue, deadline);
  const parts = [];

  if (shouldShowDeadline && deadline) parts.push(`📅 Deadline: ${escapeHtml(deadline)}`);
  if (teacher) parts.push(`👤 ${escapeHtml(teacher)}`);

  if (parts.length === 0) return "";

  return `
    <div class="announcement-footer">
      ${parts.join(" <span class=\"announcement-meta-dot\">•</span> ")}
    </div>
  `;
}

function getAnnouncementPostedDate(item) {
  const postedDate = getAnnouncementField(item, [
    "PublishDate",
    "Publish Date",
    "Date",
    "PostedDate",
    "DatePosted",
    "Posted Date",
    "Date Posted",
    "Posted"
  ]);

  if (postedDate) return postedDate;

  const id = getAnnouncementField(item, ["ID", "Id", "RecordID", "Record Id"]);
  const match = String(id || "").match(/ANN-(\d{4})(\d{2})(\d{2})/i);

  if (!match) return "";

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (isNaN(date)) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getAnnouncementField(item, names) {
  const entries = Object.entries(item || {});

  for (const name of names) {
    const direct = item && item[name];
    if (direct !== undefined && String(direct).trim()) {
      return String(direct).trim();
    }

    const normalizedName = normalizeAnnouncementKey(name);
    const match = entries.find(([key, value]) => {
      return normalizeAnnouncementKey(key) === normalizedName && String(value || "").trim();
    });

    if (match) return String(match[1]).trim();
  }

  return "";
}

function normalizeAnnouncementKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function shouldDisplayAnnouncementDeadline(showDeadlineValue, deadline) {
  if (!deadline) return false;

  const value = String(showDeadlineValue || "").trim().toLowerCase();

  if (!value) return true;
  if (["no", "n", "false", "hide", "hidden", "0"].includes(value)) return false;

  return true;
}

function renderAnnouncementAttachments(item) {
  const urls = splitAttachmentField(item.AttachmentURLs || item.Attachments || item.AttachmentURL || item.AttachmentRefs || item.attachmentRefs);
  const labels = splitAttachmentField(item.AttachmentNames || item.AttachmentLabels || item.AttachmentName);

  if (urls.length === 0) return "";

  const attachmentItems = urls
    .map((url, index) => {
      const mediaRef = parseClassBoardMediaRef(url);
      const safeUrl = isSafeExternalLink(url) ? String(url || "").trim() : "";
      if (!safeUrl && !mediaRef) return null;
      return {
        rawUrl: String(url || "").trim(),
        safeUrl,
        mediaRef,
        label: labels[index] || `Attachment ${index + 1}`
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const links = attachmentItems
    .map((item) => {
      const label = item.label;
      const isImage = item.mediaRef?.kind === "announcement" || isImageUrl(item.safeUrl || item.rawUrl) || isImageUrl(label);
      const icon = isImage ? "🖼️" : "📎";
      const pendingClass = item.mediaRef ? " is-loading-media" : "";

      // Important: image attachments are buttons, not normal links.
      // This prevents the browser from opening the file/link again behind the modal
      // after the user taps X on mobile.
      if (isImage) {
        const mediaAttrs = item.mediaRef
          ? ` data-announcement-media-ref="${escapeHtml(item.mediaRef.raw)}"`
          : ` data-announcement-media-ready="true" data-announcement-media-url="${escapeHtml(item.safeUrl)}"`;

        return `
          <button class="announcement-attachment-chip compact-attachment-row announcement-image-preview-chip${pendingClass}"
             type="button"
             title="Preview ${escapeHtml(label)}"
             data-announcement-media-label="${escapeHtml(label)}"${mediaAttrs}>
            <span class="attachment-file-icon" aria-hidden="true">${icon}</span>
            <span class="attachment-file-name">${escapeHtml(label)}</span>
            <span class="attachment-file-open" aria-hidden="true">${item.mediaRef ? "…" : "👁"}</span>
          </button>
        `;
      }

      const href = item.safeUrl || "#";
      return `
        <a class="announcement-attachment-chip compact-attachment-row"
           href="${escapeHtml(href)}"
           target="_blank"
           rel="noopener noreferrer"
           title="Open ${escapeHtml(label)}">
          <span class="attachment-file-icon" aria-hidden="true">${icon}</span>
          <span class="attachment-file-name">${escapeHtml(label)}</span>
          <span class="attachment-file-open" aria-hidden="true">↗</span>
        </a>
      `;
    })
    .join("");

  if (!links) return "";

  const attachmentLabel = attachmentItems.length === 1 ? "Attachment" : "Attachments";

  return `
    <div class="announcement-attachments compact-attachments" aria-label="Announcement attachments">
      <div class="announcement-attachments-label compact-attachments-label">📎 ${attachmentLabel} (${attachmentItems.length})</div>
      <div class="announcement-attachment-list compact-attachment-list">
        ${links}
      </div>
    </div>
  `;
}

function scheduleAnnouncementMediaHydration(reason = "") {
  window.clearTimeout(announcementMediaHydrationTimer);
  announcementMediaHydrationRun = 0;

  const runHydration = () => {
    const root = document.getElementById("announcementList") || document;
    hydrateAnnouncementMedia(root, { retryCount: 0, maxRetries: 8, reason }).catch(() => {});

    announcementMediaHydrationRun += 1;
    const pending = document.querySelector("[data-announcement-media-ref]");
    if (!pending || announcementMediaHydrationRun >= 10) return;

    const delays = [120, 220, 400, 700, 1100, 1700, 2500, 3500, 5000, 7000];
    const delay = delays[Math.min(announcementMediaHydrationRun, delays.length - 1)];
    announcementMediaHydrationTimer = window.setTimeout(runHydration, delay);
  };

  announcementMediaHydrationTimer = window.setTimeout(runHydration, 0);
}


async function resolveClassBoardMediaDataUrlWithRetryV7(value, attempts = 8) {
  const delays = [0, 80, 180, 320, 560, 900, 1400, 2100];
  for (let index = 0; index < attempts; index += 1) {
    if (delays[index]) await new Promise(resolve => setTimeout(resolve, delays[index]));
    const dataUrl = await resolveClassBoardMediaDataUrl(value);
    if (dataUrl) return dataUrl;
  }
  return "";
}

async function hydrateAnnouncementMedia(root = document, options = {}) {
  if (!root) return;
  const retryCount = Number(options.retryCount || 0);
  const maxRetries = Number(options.maxRetries || 8);
  const links = Array.from(root.querySelectorAll("[data-announcement-media-ref]"));
  await Promise.all(links.map(async (link) => {
    const rawRef = link.getAttribute("data-announcement-media-ref") || "";
    const dataUrl = await resolveClassBoardMediaDataUrlWithRetryV7(rawRef, retryCount > 0 ? 3 : 8);
    if (!dataUrl) {
      link.classList.remove("is-loading-media");
      link.classList.add("is-unavailable-media");
      const open = link.querySelector(".attachment-file-open");
      if (open) open.textContent = retryCount < maxRetries ? "…" : "!";
      if (retryCount < maxRetries && link.isConnected) {
        window.setTimeout(() => {
          hydrateAnnouncementMedia(link.closest(".announcement-attachment-list") || link.parentElement || link, { retryCount: retryCount + 1, maxRetries }).catch(() => {});
        }, 500 + retryCount * 700);
      }
      return;
    }

    const displayUrl = await prepareAnnouncementImageDisplayUrl(dataUrl, rawRef);
    if (!displayUrl) {
      link.classList.remove("is-loading-media");
      link.classList.add("is-unavailable-media");
      const open = link.querySelector(".attachment-file-open");
      if (open) open.textContent = "!";
      return;
    }

    if (link.tagName === "A") link.href = displayUrl;
    link.classList.remove("is-loading-media", "is-unavailable-media");
    link.classList.add("is-ready-media");
    link.removeAttribute("data-announcement-media-ref");
    link.dataset.announcementMediaReady = "true";
    link.dataset.announcementMediaUrl = displayUrl;
    const open = link.querySelector(".attachment-file-open");
    if (open) open.textContent = "↗";
  }));
}

async function handlePendingAnnouncementMediaClick(event) {
  if (Date.now() < announcementImageOverlaySuppressClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const link = event.target?.closest?.("[data-announcement-media-ref], .announcement-attachment-chip[data-announcement-media-ready='true'], .announcement-attachment-chip[data-announcement-media-url], .announcement-attachment-chip[href^='data:image/']");
  if (!link) return;

  const hrefValue = link.tagName === "A" ? link.href : (link.getAttribute("href") || "");
  const readyUrl = link.dataset.announcementMediaUrl || (link.dataset.announcementMediaReady === "true" || isAnnouncementImageDisplayUrl(link.getAttribute("href") || "") ? hrefValue : "");
  if (readyUrl && isAnnouncementImageDisplayUrl(readyUrl)) {
    event.preventDefault();
    showAnnouncementImageOverlay(readyUrl, link.dataset.announcementMediaLabel || link.textContent || "Announcement photo");
    return;
  }

  const rawRef = link.getAttribute("data-announcement-media-ref") || "";
  if (!rawRef) return;

  event.preventDefault();
  const open = link.querySelector(".attachment-file-open");
  if (open) open.textContent = "…";

  const dataUrl = await resolveClassBoardMediaDataUrlWithRetryV7(rawRef, 8);
  if (!dataUrl) {
    hydrateAnnouncementMedia(link.parentElement || link).catch(() => {});
    if (open) open.textContent = "!";
    return;
  }

  const displayUrl = await prepareAnnouncementImageDisplayUrl(dataUrl, rawRef);
  if (!displayUrl) {
    if (open) open.textContent = "!";
    return;
  }

  if (link.tagName === "A") link.href = displayUrl;
  link.removeAttribute("data-announcement-media-ref");
  link.dataset.announcementMediaReady = "true";
  link.dataset.announcementMediaUrl = displayUrl;
  link.classList.remove("is-loading-media", "is-unavailable-media");
  link.classList.add("is-ready-media");
  if (open) open.textContent = "↗";
  showAnnouncementImageOverlay(displayUrl, link.dataset.announcementMediaLabel || link.textContent || "Announcement photo");
}

async function prepareAnnouncementImageDisplayUrl(dataUrl, cacheKey) {
  // Do not block the announcement card while the browser decodes the picture.
  // The chip becomes ready immediately, and the image continues loading in the background.
  return classBoardMediaDisplayUrl(dataUrl, cacheKey);
}

function waitForAnnouncementImageDecode(src, timeoutMs = 4500) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Missing image source."));
      return;
    }

    const image = new Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      ok ? resolve(true) : reject(new Error("Image could not decode."));
    };
    const timer = window.setTimeout(() => finish(true), timeoutMs);
    image.onload = () => {
      if (typeof image.decode === "function") {
        image.decode().then(() => finish(true)).catch(() => finish(true));
      } else {
        finish(true);
      }
    };
    image.onerror = () => finish(false);
    image.src = src;
  });
}

let announcementImageOverlaySuppressClickUntil = 0;
let announcementImageOverlayGuardInstalled = false;

function closeAnnouncementImageOverlay(event) {
  if (event) {
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  }

  announcementImageOverlaySuppressClickUntil = Date.now() + 1100;

  const overlays = Array.from(document.querySelectorAll("#announcementImageOverlay, .announcementImageOverlay"));
  overlays.forEach((overlay) => {
    overlay.querySelectorAll("img").forEach((image) => {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      image.alt = "";
    });
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
    overlay.style.pointerEvents = "none";
    if (typeof overlay.remove === "function") overlay.remove();
  });

  document.body.classList.remove("announcementImageOpen");
  return false;
}

function isAnnouncementImageCloseGesture(event) {
  const target = event?.target;
  if (!target || typeof target.closest !== "function") return false;
  const overlay = target.closest("#announcementImageOverlay, .announcementImageOverlay");
  if (!overlay) return false;

  return Boolean(
    target.closest(".announcementImageOverlayClose, [data-close-announcement-image='true']") ||
    target.classList?.contains("announcementImageOverlayBackdrop") ||
    target === overlay
  );
}

function installAnnouncementImageOverlayCloseGuard() {
  if (announcementImageOverlayGuardInstalled) return;
  announcementImageOverlayGuardInstalled = true;

  const guard = (event) => {
    if (Date.now() < announcementImageOverlaySuppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      return false;
    }

    if (isAnnouncementImageCloseGesture(event)) {
      return closeAnnouncementImageOverlay(event);
    }
    return undefined;
  };

  ["pointerdown", "mousedown", "touchstart", "click"].forEach((type) => {
    document.addEventListener(type, guard, { capture: true, passive: false });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector("#announcementImageOverlay, .announcementImageOverlay")) {
      closeAnnouncementImageOverlay(event);
    }
  }, true);
}

function showAnnouncementImageOverlay(src, label) {
  if (!src) return;
  installAnnouncementImageOverlayCloseGuard();

  // Always rebuild the modal from scratch. This avoids stale mobile/browser link layers
  // and guarantees one tap on X removes everything.
  closeAnnouncementImageOverlay();
  announcementImageOverlaySuppressClickUntil = 0;

  const overlay = document.createElement("div");
  overlay.id = "announcementImageOverlay";
  overlay.className = "announcementImageOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-hidden", "false");
  overlay.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);pointer-events:auto;";
  overlay.innerHTML = `
    <button class="announcementImageOverlayBackdrop" type="button" data-close-announcement-image="true" aria-label="Close image preview" style="position:absolute;inset:0;border:0;background:transparent;padding:0;margin:0;cursor:zoom-out;touch-action:manipulation;"></button>
    <figure class="announcementImageOverlayFigure" style="position:relative;z-index:1;max-width:min(96vw,1100px);max-height:92vh;margin:0;display:grid;gap:10px;place-items:center;pointer-events:none;">
      <button class="announcementImageOverlayClose" type="button" data-close-announcement-image="true" aria-label="Close image" onclick="return closeAnnouncementImageOverlay(event);" onpointerdown="return closeAnnouncementImageOverlay(event);" ontouchstart="return closeAnnouncementImageOverlay(event);" style="position:relative;z-index:3;justify-self:center;pointer-events:auto;width:52px;height:52px;border:0;border-radius:999px;background:#fff;color:#111;font-size:32px;font-weight:900;line-height:1;box-shadow:0 8px 30px rgba(0,0,0,.32);cursor:pointer;touch-action:manipulation;">×</button>
      <img alt="" style="display:block;max-width:96vw;max-height:78vh;object-fit:contain;border-radius:14px;background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.45);pointer-events:auto;" />
      <figcaption style="color:#fff;text-align:center;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.7);pointer-events:none;"></figcaption>
    </figure>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add("announcementImageOpen");

  const image = overlay.querySelector("img");
  const caption = overlay.querySelector("figcaption");
  const cleanLabel = String(label || "Announcement photo").replace(/\s+/g, " ").trim();

  if (caption) caption.textContent = "Loading photo...";
  if (image) {
    image.removeAttribute("src");
    image.alt = "Loading announcement photo...";
    image.onerror = () => {
      image.alt = "";
      if (caption) caption.textContent = "Photo could not load. Tap X or outside the photo to close.";
    };
    image.onload = () => {
      image.alt = cleanLabel;
      if (caption) caption.textContent = cleanLabel;
    };
    image.src = src;
  }

  const closeButton = overlay.querySelector(".announcementImageOverlayClose");
  if (closeButton && typeof closeButton.focus === "function") {
    window.setTimeout(() => closeButton.focus({ preventScroll: true }), 0);
  }
}

installAnnouncementImageOverlayCloseGuard();

function parseClassBoardMediaRef(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith(CLASSBOARD_MEDIA_REF_PREFIX)) return null;
  const rest = raw.slice(CLASSBOARD_MEDIA_REF_PREFIX.length);
  const slashIndex = rest.indexOf("/");
  if (slashIndex <= 0) return null;

  const rawKind = rest.slice(0, slashIndex);
  const id = rest.slice(slashIndex + 1);
  if (!id || !/^[A-Za-z0-9_-]{1,240}$/.test(id)) return null;
  const kindMap = {
    announcement: "announcement",
    announcements: "announcement",
    announcementMedia: "announcement",
    memory: "memory",
    memories: "memory",
    memoryMedia: "memory",
    freedomWall: "freedomWall",
    freedomwall: "freedomWall",
    freedomWallMedia: "freedomWall"
  };
  const kind = kindMap[rawKind];
  if (!kind) return null;

  return {
    raw: `${CLASSBOARD_MEDIA_REF_PREFIX}${kind}/${id}`,
    kind,
    id,
    collectionName: kind === "announcement" ? ANNOUNCEMENT_MEDIA_COLLECTION : kind === "freedomWall" ? FREEDOM_WALL_MEDIA_COLLECTION : MEMORY_MEDIA_COLLECTION
  };
}

function isAnnouncementImageDisplayUrl(value) {
  return /^(data:image\/|blob:)/i.test(String(value || "").trim());
}

function classBoardMediaDisplayUrl(dataUrl, cacheKey) {
  const raw = String(dataUrl || "").trim();
  if (!/^data:image\//i.test(raw)) return raw;
  const key = String(cacheKey || raw.slice(0, 96)).trim();
  if (CLASSBOARD_MEDIA_BLOB_URL_CACHE.has(key)) return CLASSBOARD_MEDIA_BLOB_URL_CACHE.get(key);

  try {
    const comma = raw.indexOf(",");
    if (comma < 0) return raw;
    const header = raw.slice(0, comma);
    const mimeMatch = header.match(/^data:([^;]+);base64$/i);
    if (!mimeMatch) return raw;
    const binary = atob(raw.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mimeMatch[1] || "image/jpeg" }));
    CLASSBOARD_MEDIA_BLOB_URL_CACHE.set(key, blobUrl);
    return blobUrl;
  } catch (error) {
    return raw;
  }
}

async function resolveClassBoardMediaDataUrl(value) {
  const directValue = String(value || "").trim();
  if (/^data:image\//i.test(directValue)) return directValue;

  const ref = parseClassBoardMediaRef(directValue);
  if (!ref) return "";
  const cacheKey = `${ref.kind}/${ref.id}`;
  if (CLASSBOARD_MEDIA_DATA_CACHE.has(cacheKey)) return CLASSBOARD_MEDIA_DATA_CACHE.get(cacheKey);

  const db = await waitForClassBoardFirestore(12000);
  if (!db) return "";

  try {
    const doc = await db.collection(ref.collectionName).doc(ref.id).get();
    if (!doc.exists) return "";
    const data = doc.data() || {};
    const mimeType = String(data.MimeType || data.mimeType || data.Type || "image/jpeg").trim();
    const directDataUrl = String(data.DataURL || data.dataUrl || data.Url || data.url || data.PreviewURL || data.previewUrl || "").trim();
    if (/^data:image\//i.test(directDataUrl)) {
      CLASSBOARD_MEDIA_DATA_CACHE.set(cacheKey, directDataUrl);
      return directDataUrl;
    }
    const base64 = String(data.Data || data.data || data.Base64 || data.base64 || data.Content || data.content || "").trim();
    if (!base64 || !mimeType.toLowerCase().startsWith("image/")) return "";
    const dataUrl = `data:${mimeType};base64,${base64}`;
    CLASSBOARD_MEDIA_DATA_CACHE.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (error) {
    console.warn("Unable to load ClassBoard media:", error);
    return "";
  }
}

function splitAttachmentField(value) {
  const text = String(value || "").trim();
  if (!text) return [];

  const lineItems = text
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);

  if (lineItems.length > 1 || /^data:image\//i.test(text)) return lineItems;

  return text
    .split(/,\s*/)
    .map(item => item.trim())
    .filter(Boolean);
}

function isImageUrl(url) {
  const value = String(url || "").trim();
  return /^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(value);
}

function getAnnouncementTextSizeClass(value) {
  const text = stripBoardTextFormatTag(value);
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const charCount = text.replace(/\s+/g, " ").trim().length;
  const lineCount = lines.length;

  if (charCount > 420 || lineCount >= 8) return "announcement-size-xs";
  if (charCount > 280 || lineCount >= 6) return "announcement-size-sm";
  if (charCount > 160 || lineCount >= 4) return "announcement-size-md";

  if (lineCount <= 1 && charCount <= 80) return "announcement-size-one-line";
  if (lineCount <= 2 && charCount <= 120) return "announcement-size-short";

  return "announcement-size-normal";
}

function rotateAnnouncements() {
  const items = getActiveAnnouncements(latestData?.announcements || []);
  if (items.length === 0) return;

  announcementIndex++;
  renderAnnouncements(items);
  resetAnnouncementRotation(items);
}

function previousAnnouncement() {
  const items = getActiveAnnouncements(latestData?.announcements || []);
  if (items.length === 0) return;

  announcementIndex--;

  if (announcementIndex < 0) {
    announcementIndex = items.length - 1;
  }

  renderAnnouncements(items);
  resetAnnouncementRotation(items);
}

function nextAnnouncement() {
  const items = getActiveAnnouncements(latestData?.announcements || []);
  if (items.length === 0) return;

  announcementIndex++;
  renderAnnouncements(items);
  resetAnnouncementRotation(items);
}

function ensureAnnouncementRotation(items) {
  const total = getActiveAnnouncements(items).length;
  if (
    announcementRotationCount !== total ||
    (!announcementRotateTimer && !announcementRotationPaused)
  ) {
    resetAnnouncementRotation(items);
  }
}

function resetAnnouncementRotation(items = latestData?.announcements || []) {
  announcementRotationVersion++;
  const rotationVersion = announcementRotationVersion;
  window.clearTimeout(announcementRotateTimer);
  announcementRotateTimer = null;
  announcementRotationCount = getActiveAnnouncements(items).length;
  announcementRemainingMs = ANNOUNCEMENT_ROTATE_MS;

  const progress = document.getElementById("announcementProgress");
  const fill = document.getElementById("announcementProgressFill");
  if (!progress || !fill) return;

  progress.classList.toggle("isStatic", announcementRotationCount <= 1);
  fill.style.transition = "none";
  fill.style.width = announcementRotationCount ? (announcementRotationCount === 1 ? "100%" : "0%") : "0%";
  updateAnnouncementTimerButton();

  if (announcementRotationCount <= 1 || announcementRotationPaused) return;

  void fill.offsetWidth;
  window.requestAnimationFrame(() => {
    if (rotationVersion !== announcementRotationVersion) return;
    fill.style.transition = `width ${announcementRemainingMs}ms linear`;
    fill.style.width = "100%";
    announcementRotateTimer = window.setTimeout(rotateAnnouncements, announcementRemainingMs);
  });
}

function toggleAnnouncementRotation() {
  if (announcementRotationCount <= 1) return;

  const progress = document.getElementById("announcementProgress");
  const fill = document.getElementById("announcementProgressFill");
  if (!progress || !fill) return;

  announcementRotationVersion++;
  window.clearTimeout(announcementRotateTimer);
  announcementRotateTimer = null;

  if (!announcementRotationPaused) {
    const trackWidth = Math.max(1, progress.getBoundingClientRect().width);
    const fillWidth = Math.max(0, fill.getBoundingClientRect().width);
    const completedRatio = Math.min(1, fillWidth / trackWidth);
    announcementRemainingMs = Math.max(80, ANNOUNCEMENT_ROTATE_MS * (1 - completedRatio));
    fill.style.transition = "none";
    fill.style.width = `${completedRatio * 100}%`;
    announcementRotationPaused = true;
    updateAnnouncementTimerButton();
    return;
  }

  announcementRotationPaused = false;
  updateAnnouncementTimerButton();
  const rotationVersion = announcementRotationVersion;
  void fill.offsetWidth;
  window.requestAnimationFrame(() => {
    if (rotationVersion !== announcementRotationVersion) return;
    fill.style.transition = `width ${announcementRemainingMs}ms linear`;
    fill.style.width = "100%";
    announcementRotateTimer = window.setTimeout(rotateAnnouncements, announcementRemainingMs);
  });
}

function updateAnnouncementTimerButton() {
  const button = document.getElementById("announcementTimerToggle");
  if (!button) return;

  const paused = announcementRotationPaused;
  button.disabled = announcementRotationCount <= 1;
  button.classList.toggle("isPaused", paused);
  button.setAttribute("aria-pressed", paused ? "true" : "false");
  button.setAttribute("aria-label", paused ? "Resume announcement timer" : "Pause announcement timer");
  button.title = paused ? "Resume announcement timer" : "Pause announcement timer";
  button.innerHTML = paused ? "&#9654;" : "&#10074;&#10074;";
}

function getActiveAnnouncements(items) {
  const todayKey = getManilaDateKey(new Date());
  return (Array.isArray(items) ? items : []).filter(item => {
    const publishKey = getAnnouncementDateKey(item?.PublishDate || item?.ScheduledPublishDate || item?.StartDate);
    const expiryKey = getAnnouncementDateKey(item?.ExpiryDate || item?.ExpirationDate || item?.EndDate);
    return (!publishKey || todayKey >= publishKey) && (!expiryKey || todayKey < expiryKey);
  });
}

function getManilaDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find(part => part.type === "year")?.value || "";
  const month = parts.find(part => part.type === "month")?.value || "";
  const day = parts.find(part => part.type === "day")?.value || "";
  return `${year}-${month}-${day}`;
}

// Keep Things to Bring countdown labels correct across midnight without
// rebuilding the entire dashboard. This preserves Today's Schedule scroll,
// current-period focus, and subject marquee state.
function refreshThingsToBringForManilaDay(now = new Date()) {
  const currentDateKey = getManilaDateKey(now);

  if (!lastThingsToBringManilaDateKey) {
    lastThingsToBringManilaDateKey = currentDateKey;
    return false;
  }

  if (currentDateKey === lastThingsToBringManilaDateKey) return false;

  lastThingsToBringManilaDateKey = currentDateKey;

  if (latestData && Array.isArray(latestData.thingsToBring)) {
    renderThings(latestData.thingsToBring);
  }

  return true;
}

function getAnnouncementDateKey(value) {
  if (!value) return "";
  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? getManilaDateKey(date) : "";
}

function renderThings(items) {
  const box = document.getElementById("thingsList");
  const summary = document.getElementById("bringSummary");

  if (!box) return;

  if (!items || items.length === 0) {
    if (summary) summary.textContent = "";
    box.innerHTML = `<p>No things to bring yet.</p>`;
    return;
  }

  const visibleItems = items
    .map(item => {
      const subject = item.Subject || "Reminder";
      const dateValue = getThingDateValue(item);
      const itemText = getThingText(item);
      const status = getBringStatus(dateValue);

      return {
        ...item,
        subject,
        dateValue,
        itemText,
        status
      };
    })
    .filter(item => item.status && (item.itemText || item.subject))
    .sort((a, b) => {
      if (a.status.priority !== b.status.priority) {
        return a.status.priority - b.status.priority;
      }

      return a.status.sortValue - b.status.sortValue;
    });

  updateBringSummary(visibleItems);

  if (visibleItems.length === 0) {
    box.innerHTML = `<p>No upcoming things to bring.</p>`;
    return;
  }

  box.innerHTML = visibleItems.map(item => {
    const safeSubject = escapeHTML(item.subject);
    const formattedItemText = formatBoardText(item.itemText || "No item specified", "left");
    const subjectClass = getThingSubjectClass(item.subject);

    const statusLabel = item.status.label
      ? `<span class="bring-status ${item.status.className}">${escapeHTML(item.status.label)}</span>`
      : "";

    return `
      <div class="thing-item">
        <div class="thing-topline">
          <strong class="thing-subject ${subjectClass}">${safeSubject}</strong>
          ${statusLabel}
        </div>

        <div class="thing-detail">${formattedItemText}</div>
      </div>
    `;
  }).join("");


}

function getThingDateValue(item) {
  return (
    item.DateNeeded ||
    item.NeededDate ||
    item.DueDate ||
    item.Deadline ||
    item.Date ||
    ""
  );
}

function getThingText(item) {
  return (
    item.Item ||
    item.Things ||
    item.Materials ||
    item.Reminder ||
    item.Description ||
    item.Task ||
    ""
  );
}

function updateBringSummary(items) {
  const summary = document.getElementById("bringSummary");
  if (!summary) return;

  const todayCount = items.filter(item => item.status?.type === "today").length;
  const tomorrowCount = items.filter(item => item.status?.type === "tomorrow").length;

  const parts = [];

  if (todayCount > 0) {
    parts.push(`🔥 TODAY: ${todayCount}`);
  }

  if (tomorrowCount > 0) {
    parts.push(`⚠️ TOMORROW: ${tomorrowCount}`);
  }

  summary.textContent = parts.join(" | ");
}

function getBringStatus(dateValue) {
  const dueParts = parseDateToManilaParts(dateValue);

  if (!dueParts) {
    return {
      type: "no-date",
      label: "",
      className: "",
      priority: 6,
      sortValue: Number.MAX_SAFE_INTEGER
    };
  }

  const todayParts = getTodayManilaParts();

  const dueUTC = Date.UTC(dueParts.year, dueParts.month - 1, dueParts.day);
  const todayUTC = Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day);

  const diffDays = Math.round((dueUTC - todayUTC) / 86400000);

  if (diffDays < 0) return null;

  if (diffDays === 0) {
    return {
      type: "today",
      label: "🔥 TODAY",
      className: "status-today",
      priority: 1,
      sortValue: dueUTC
    };
  }

  if (diffDays === 1) {
    return {
      type: "tomorrow",
      label: "🔴 NEED TOMORROW",
      className: "status-tomorrow",
      priority: 2,
      sortValue: dueUTC
    };
  }

  if (diffDays === 2) {
    return {
      type: "two-days",
      label: "🟠 IN 2 DAYS",
      className: "status-two-days",
      priority: 3,
      sortValue: dueUTC
    };
  }

  const week = getManilaWeekRangeUTC(todayUTC);

  if (dueUTC <= week.endThisWeekUTC) {
    return {
      type: "this-week",
      label: `🟡 THIS WEEK • ${formatShortBringDate(dueParts)}`,
      className: "status-this-week",
      priority: 4,
      sortValue: dueUTC
    };
  }

  if (dueUTC >= week.startNextWeekUTC && dueUTC <= week.endNextWeekUTC) {
    return {
      type: "next-week",
      label: `🔵 NEXT WEEK • ${formatShortBringDate(dueParts)}`,
      className: "status-next-week",
      priority: 5,
      sortValue: dueUTC
    };
  }

  return {
    type: "future",
    label: `🟢 FUTURE DATE • ${formatShortBringDate(dueParts)}`,
    className: "status-future",
    priority: 6,
    sortValue: dueUTC
  };
}

function getTodayManilaParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  return {
    year: Number(parts.find(part => part.type === "year")?.value || 0),
    month: Number(parts.find(part => part.type === "month")?.value || 0),
    day: Number(parts.find(part => part.type === "day")?.value || 0)
  };
}

function getManilaWeekRangeUTC(todayUTC) {
  const dayMs = 86400000;
  const today = new Date(todayUTC);
  const dayOfWeek = today.getUTCDay(); // 0 Sunday, 1 Monday, ... 6 Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startThisWeekUTC = todayUTC - (daysSinceMonday * dayMs);

  return {
    startThisWeekUTC,
    endThisWeekUTC: startThisWeekUTC + (6 * dayMs),
    startNextWeekUTC: startThisWeekUTC + (7 * dayMs),
    endNextWeekUTC: startThisWeekUTC + (13 * dayMs)
  };
}

function parseDateToManilaParts(value) {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3])
    };
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);

  if (slashMatch) {
    const rawYear = Number(slashMatch[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    return {
      year,
      month: Number(slashMatch[1]),
      day: Number(slashMatch[2])
    };
  }

  const dashMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/);

  if (dashMatch) {
    const rawYear = Number(dashMatch[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    return {
      year,
      month: Number(dashMatch[1]),
      day: Number(dashMatch[2])
    };
  }

  const parsedDate = new Date(text);

  if (isNaN(parsedDate)) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(parsedDate);

  return {
    year: Number(parts.find(part => part.type === "year")?.value || 0),
    month: Number(parts.find(part => part.type === "month")?.value || 0),
    day: Number(parts.find(part => part.type === "day")?.value || 0)
  };
}

function formatShortBringDate(dateParts) {
  const date = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric"
  }).format(date).toUpperCase();
}

function getThingSubjectClass(subject) {
  const sub = String(subject || "").toLowerCase().trim();

  if (sub.includes("mapeh") || /\b(music|arts?|health|p\.?e\.?|physical education)\b/.test(sub)) {
    return "subject-mapeh";
  }

  if (
    sub.includes("cled") ||
    sub.includes("christian") ||
    sub.includes("religion") ||
    sub.includes("holy eucharist") ||
    sub.includes("eucharist") ||
    /\bcle\b/.test(sub)
  ) {
    return "subject-cled";
  }

  if (sub.includes("math")) return "subject-mathematics";
  if (/\bict\b/.test(sub) || sub.includes("computer")) return "subject-ict";
  if (/\ble\b/.test(sub) || sub.includes("livelihood")) return "subject-le";
  if (sub.includes("english")) return "subject-english";
  if (sub.includes("filipino") || sub.includes("filipno")) return "subject-filipino";
  if (sub.includes("science")) return "subject-science";
  if (sub.includes("araling") || /\bap\b/.test(sub)) return "subject-ap";
  if (sub.includes("homeroom") || sub.includes("advisory")) return "subject-homeroom";

  return "subject-homeroom";
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBoardText(value, defaultAlign = "center") {
  const rawValue = String(value || "").replace(/\r/g, "").trim();

  if (!rawValue) {
    return "";
  }

  if (isRichBoardText(rawValue)) {
    const richHtml = extractRichBoardHtml(rawValue);
    const safeHtml = sanitizeBoardRichHtml(richHtml);
    if (!safeHtml) return "";
    return `<div class="formattedText richBoardText">${safeHtml}</div>`;
  }

  const rawLines = rawValue
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return "";
  }

  const firstLine = rawLines[0].toLowerCase();
  const tagMatch = firstLine.match(/^\[(left|center|right|bullets|numbers)\]$/);
  const mode = tagMatch ? tagMatch[1] : defaultAlign;
  const contentLines = tagMatch ? rawLines.slice(1) : rawLines;
  const safeLines = contentLines.map(line => escapeHTML(line));

  if (safeLines.length === 0) {
    return "";
  }

  if (mode === "bullets" || mode === "numbers") {
    const tagName = mode === "numbers" ? "ol" : "ul";
    return `
      <${tagName} class="formattedText align-left">
        ${safeLines.map(line => `<li>${line}</li>`).join("")}
      </${tagName}>
    `;
  }

  const alignClass =
    mode === "right"
      ? "align-right"
      : mode === "left"
        ? "align-left"
        : "align-center";
  return `<div class="formattedText ${alignClass}">${safeLines.join("<br>")}</div>`;
}

function isRichBoardText(value) {
  return /^\[rich\]\s*\n/i.test(String(value || "").replace(/\r/g, ""));
}

function extractRichBoardHtml(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/^\[rich\]\s*\n?/i, "")
    .trim();
}

function sanitizeBoardRichHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const cleanFragment = sanitizeBoardRichNode(template.content);
  const wrapper = document.createElement("div");
  wrapper.appendChild(cleanFragment);
  return wrapper.innerHTML.trim();
}

function sanitizeBoardRichNode(node) {
  const fragment = document.createDocumentFragment();
  const allowedTags = ["b", "strong", "i", "em", "u", "br", "div", "p", "ul", "ol", "li", "span", "font"];
  const allowedAlignments = ["left", "center", "right"];
  const allowedListStyles = ["disc", "circle", "square", "decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman"];
  const maxIndentEm = 7.5;

  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      fragment.appendChild(document.createTextNode(child.textContent || ""));
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const tag = child.tagName.toLowerCase();
    if (!allowedTags.includes(tag)) {
      fragment.appendChild(sanitizeBoardRichNode(child));
      return;
    }

    const cleanTag = tag === "font" ? "span" : tag;
    const clean = document.createElement(cleanTag);
    const styleParts = [];
    const textAlign = String(child.style?.textAlign || "").toLowerCase();
    const listStyleType = String(child.style?.listStyleType || "").toLowerCase();
    const fontWeight = String(child.style?.fontWeight || "").toLowerCase();
    const fontStyle = String(child.style?.fontStyle || "").toLowerCase();
    const textDecoration = String(child.style?.textDecoration || "").toLowerCase();
    const color = normalizeBoardRichColor(child.getAttribute("color") || child.style?.color || "");
    const indent = normalizeBoardRichIndent(child.style?.marginLeft || "", maxIndentEm);

    if (allowedAlignments.includes(textAlign)) styleParts.push(`text-align:${textAlign}`);
    if ((cleanTag === "ul" || cleanTag === "ol") && allowedListStyles.includes(listStyleType)) {
      styleParts.push(`list-style-type:${listStyleType}`);
    }
    if (["div", "p", "li", "ul", "ol"].includes(cleanTag) && indent) styleParts.push(`margin-left:${indent}`);
    if (cleanTag === "span" && (fontWeight === "bold" || Number(fontWeight) >= 600)) styleParts.push("font-weight:700");
    if (cleanTag === "span" && fontStyle === "italic") styleParts.push("font-style:italic");
    if (cleanTag === "span" && textDecoration.includes("underline")) styleParts.push("text-decoration:underline");
    if (cleanTag === "span" && color) styleParts.push(`color:${color}`);
    if (styleParts.length) clean.setAttribute("style", styleParts.join(";"));

    clean.appendChild(sanitizeBoardRichNode(child));
    fragment.appendChild(clean);
  });

  return fragment;
}


function normalizeBoardRichColor(value) {
  const raw = String(value || "").trim().toLowerCase();

  const shortHex = raw.match(/^#([0-9a-f]{3})$/i);
  if (shortHex) {
    return `#${shortHex[1].split("").map(char => char + char).join("")}`.toLowerCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();

  const rgb = raw.match(/^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(?:0|1|0?\.\d+))?\)$/i);
  if (rgb) {
    const parts = rgb.slice(1, 4).map(part => Math.max(0, Math.min(255, Number(part) || 0)));
    return `#${parts.map(part => part.toString(16).padStart(2, "0")).join("")}`;
  }

  return "";
}

function normalizeBoardRichIndent(value, maxIndentEm = 7.5) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  let parsed = 0;
  if (raw.endsWith("em")) {
    parsed = Number.parseFloat(raw) || 0;
  } else if (raw.endsWith("px")) {
    parsed = (Number.parseFloat(raw) || 0) / 16;
  } else {
    parsed = Number.parseFloat(raw) || 0;
  }

  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  const rounded = Math.round(Math.min(maxIndentEm, parsed) * 100) / 100;
  return `${String(rounded).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}em`;
}

function stripHtmlToPlainText(html) {
  const template = document.createElement("template");
  template.innerHTML = sanitizeBoardRichHtml(html);
  return String(template.content.textContent || "").replace(/\s+/g, " ").trim();
}

function stripBoardTextFormatTag(value) {
  const raw = String(value || "").replace(/\r/g, "").trim();

  if (isRichBoardText(raw)) {
    return stripHtmlToPlainText(extractRichBoardHtml(raw));
  }

  return raw
    .replace(/^\[(left|center|right|bullets|numbers)\]\s*\n?/i, "")
    .trim();
}

function renderReminders(items) {
  const box = document.getElementById("reminderList");

  if (!box) return;

  if (!items || items.length === 0) {
    box.innerHTML = `<p>No adviser reminders yet.</p>`;
    return;
  }

  box.innerHTML = items.map(item => {
    const reminder = item.Reminder || item.Message || item.Description || "";

    return `
      <div class="reminder-item">
        ${formatBoardText(reminder, "left")}
      </div>
    `;
  }).join("");
}

/* BIRTHDAY CORNER */
function renderBirthdays(items) {
  const box = document.getElementById("birthdayList");
  const dateText = document.getElementById("birthdayDateText");

  if (!box) return;

  const todayMonthDay = getTodayMonthDay();

  if (dateText) {
    dateText.textContent = formatBirthdayDateText(todayMonthDay);
    dateText.setAttribute("aria-label", "Open full year birthday list");
    dateText.title = "View all birthdays";
  }

  if (!items || items.length === 0) {
    birthdayIndex = 0;

    box.innerHTML = `
      <div class="noBirthday">
        <span>🎂</span>
        <p>No birthday celebrants today.</p>
      </div>
    `;
    return;
  }

  const birthdayToday = items.filter(item => {
    const birthdayValue =
      item.MonthDay ||
      item.Birthday ||
      item.Birthdate ||
      item.Date ||
      "";

    return normalizeBirthdayValue(birthdayValue) === todayMonthDay;
  });

  if (birthdayToday.length === 0) {
    birthdayIndex = 0;

    box.innerHTML = `
      <div class="noBirthday">
        <span>🎂</span>
        <p>No birthday celebrants today.</p>
      </div>
    `;
    return;
  }

  if (birthdayIndex >= birthdayToday.length) {
    birthdayIndex = 0;
  }

  const currentNumber = (birthdayIndex % birthdayToday.length) + 1;
  const item = birthdayToday[birthdayIndex % birthdayToday.length];

  const name =
    item.Name ||
    item.StudentName ||
    item.Student ||
    "Birthday Celebrant";

  const counterText =
    birthdayToday.length > 1
      ? `<span class="birthdayCounter">${currentNumber}/${birthdayToday.length}</span>`
      : "";

  const birthdayDisplayKey = `${name}-${currentNumber}-${birthdayToday.length}`;
const shouldFadeBirthday = birthdayDisplayKey !== lastBirthdayDisplayKey;
lastBirthdayDisplayKey = birthdayDisplayKey;

box.innerHTML = `
  <div class="birthdayItem ${shouldFadeBirthday ? "birthdayFadeIn" : ""}">
    <div class="birthdayIcon">🎉</div>

      <div class="birthdayContent">
        <strong>
          Happy Birthday!
          ${counterText}
        </strong>

        <h3 class="birthdayNameMarquee">
          <span>${escapeHTML(name)}</span>
        </h3>

        <p>Have a joyful day! 🐨💛</p>
      </div>
    </div>
  `;
}

function initBirthdayYearModal() {
  if (birthdayYearModalReady) return;

  const trigger = document.getElementById("birthdayDateText");
  const modal = document.getElementById("birthdayYearModal");
  const closeBtn = document.getElementById("birthdayYearClose");

  if (!trigger || !modal) return;

  birthdayYearModalReady = true;

  trigger.addEventListener("click", () => {
    playBirthdayMusic();
    openBirthdayYearModal();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    playBirthdayMusic();
    openBirthdayYearModal();
  });

  closeBtn?.addEventListener("click", closeBirthdayYearModal);
  modal.querySelector("[data-birthday-modal-close]")?.addEventListener("click", closeBirthdayYearModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("isOpen")) {
      closeBirthdayYearModal();
    }
  });
}

function getBirthdayMusicAudio() {
  if (birthdayMusicAudio) return birthdayMusicAudio;

  birthdayMusicAudio = new Audio(BIRTHDAY_MUSIC_SRC);
  birthdayMusicAudio.loop = true;
  birthdayMusicAudio.preload = "auto";
  birthdayMusicAudio.volume = 0.88;
  return birthdayMusicAudio;
}

function playBirthdayMusic() {
  try {
    const audio = getBirthdayMusicAudio();
    audio.loop = true;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Browser sound permission can still block audio on some devices.
        // The birthday date click is a user gesture, so a second tap usually unlocks it.
      });
    }
  } catch (error) {}
}

function stopBirthdayMusic() {
  if (!birthdayMusicAudio) return;
  try {
    birthdayMusicAudio.pause();
    birthdayMusicAudio.currentTime = 0;
  } catch (error) {}
}


function getBirthdayCelebrationLayer() {
  const modal = document.getElementById("birthdayYearModal");
  if (!modal) return null;

  let layer = document.getElementById("birthdayCelebrationLayer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "birthdayCelebrationLayer";
    layer.className = "birthdayCelebrationLayer";
    layer.setAttribute("aria-hidden", "true");
    const panel = modal.querySelector(".birthdayYearPanel");
    modal.insertBefore(layer, panel || null);
  }
  return layer;
}

function startBirthdayCelebration() {
  const layer = getBirthdayCelebrationLayer();
  if (!layer) return;

  if (birthdayCelebrationCleanupTimer) {
    clearTimeout(birthdayCelebrationCleanupTimer);
    birthdayCelebrationCleanupTimer = null;
  }

  const records = getSortedBirthdayRecords(latestData?.birthdays || []);
  if (!records.length) {
    stopBirthdayCelebration(true);
    return;
  }

  if (layer.dataset.ready !== "1") {
    const balloonIcons = ["🎈", "🎉", "🎂", "🎁", "🥳", "🎊"];
    const confettiColors = ["#ffd700", "#ff6b9a", "#6bd6ff", "#7ee787", "#b28dff", "#ff9f43", "#ffffff"];
    const sparkleIcons = ["✨", "⭐", "💛", "🎊", "🎉"];
    const parts = [];

    for (let i = 0; i < 14; i++) {
      const x = 3 + ((i * 19) % 94);
      const size = 1.95 + ((i % 5) * 0.26);
      const duration = 8.4 + ((i % 6) * 0.75);
      const delay = -1 * ((i * 0.82) % 8.6);
      const swayDuration = 2.7 + ((i % 4) * 0.45);
      const icon = balloonIcons[i % balloonIcons.length];
      parts.push(`<span class="birthdayBalloon" style="--x:${x}%;--size:${size}rem;--duration:${duration}s;--delay:${delay}s;--sway-duration:${swayDuration}s;">${icon}</span>`);
    }

    for (let i = 0; i < 68; i++) {
      const x = (i * 37) % 100;
      const width = 6 + (i % 4) * 2;
      const height = 10 + (i % 5) * 2;
      const duration = 3.1 + ((i % 8) * 0.35);
      const delay = -1 * ((i * 0.19) % 4.8);
      const drift = ((i % 2 === 0 ? 1 : -1) * (16 + (i % 7) * 10));
      const rotation = (i * 31) % 180;
      const color = confettiColors[i % confettiColors.length];
      parts.push(`<i class="birthdayConfettiPiece" style="--x:${x}%;--w:${width}px;--h:${height}px;--duration:${duration}s;--delay:${delay}s;--drift:${drift}px;--rotation:${rotation}deg;--confetti-color:${color};"></i>`);
    }

    for (let i = 0; i < 16; i++) {
      const x = 5 + ((i * 23) % 90);
      const y = 8 + ((i * 17) % 76);
      const size = 0.95 + ((i % 5) * 0.16);
      const duration = 2.0 + ((i % 5) * 0.28);
      const delay = -1 * ((i * 0.33) % 2.7);
      const icon = sparkleIcons[i % sparkleIcons.length];
      parts.push(`<span class="birthdaySparkleBurst" style="--x:${x}%;--y:${y}%;--size:${size}rem;--duration:${duration}s;--delay:${delay}s;">${icon}</span>`);
    }

    layer.innerHTML = parts.join("");
    layer.dataset.ready = "1";
  }

  layer.classList.add("isActive");
}

function stopBirthdayCelebration(clearNow = false) {
  const layer = document.getElementById("birthdayCelebrationLayer");
  if (!layer) return;

  layer.classList.remove("isActive");

  if (birthdayCelebrationCleanupTimer) {
    clearTimeout(birthdayCelebrationCleanupTimer);
    birthdayCelebrationCleanupTimer = null;
  }

  const cleanup = () => {
    layer.innerHTML = "";
    layer.dataset.ready = "0";
    birthdayCelebrationCleanupTimer = null;
  };

  if (clearNow) {
    cleanup();
  } else {
    birthdayCelebrationCleanupTimer = window.setTimeout(cleanup, 260);
  }
}

function openBirthdayYearModal() {
  const modal = document.getElementById("birthdayYearModal");
  if (!modal) return;

  lastBirthdayModalFocus = document.activeElement;
  activeBirthdayMonth = null;
  renderBirthdayYearModal(latestData?.birthdays || []);
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("birthdayYearModalOpen");
  startBirthdayCelebration();

  requestAnimationFrame(() => {
    modal.classList.add("isOpen");
    document.getElementById("birthdayYearClose")?.focus({ preventScroll: true });
  });
}

function closeBirthdayYearModal() {
  const modal = document.getElementById("birthdayYearModal");
  if (!modal || !modal.classList.contains("isOpen")) return;

  stopBirthdayMusic();
  stopBirthdayCelebration();
  modal.classList.remove("isOpen");
  document.body.classList.remove("birthdayYearModalOpen");

  window.setTimeout(() => {
    modal.setAttribute("aria-hidden", "true");
    if (lastBirthdayModalFocus && typeof lastBirthdayModalFocus.focus === "function") {
      lastBirthdayModalFocus.focus({ preventScroll: true });
    }
  }, 160);
}

function renderBirthdayYearModal(items) {
  const list = document.getElementById("birthdayYearList");
  const count = document.getElementById("birthdayYearCount");
  const todayBox = document.getElementById("birthdayYearToday");
  if (!list) return;

  const records = getSortedBirthdayRecords(items || []);
  const todayMonthDay = getTodayMonthDay();
  const todayMonth = Number((todayMonthDay || "").split("-")[0] || 0);
  const todayRecords = records.filter(record => record.monthDay === todayMonthDay);

  if (count) {
    count.textContent = `${records.length} ${records.length === 1 ? "birthday" : "birthdays"}`;
  }

  if (todayBox) {
    if (todayRecords.length > 0) {
      todayBox.hidden = false;
      todayBox.innerHTML = `
        <span>Today’s Celebrants</span>
        <strong>${todayRecords.map(record => escapeHTML(record.name)).join(", ")}</strong>
        <small>Tap a month below to view its birthday list 🎉</small>
      `;
    } else {
      todayBox.hidden = false;
      todayBox.innerHTML = `
        <span>Birthday List</span>
        <strong>Tap a month to view the celebrants.</strong>
        <small>Each month stays hidden until you open it. 🎂</small>
      `;
    }
  }

  if (records.length === 0) {
    list.innerHTML = `
      <div class="birthdayYearEmpty">
        <span>🎂</span>
        <p>No saved birthday greetings yet.</p>
      </div>
    `;
    return;
  }

  const grouped = new Map();
  records.forEach(record => {
    if (!grouped.has(record.month)) grouped.set(record.month, []);
    grouped.get(record.month).push(record);
  });

  list.innerHTML = Array.from(grouped.entries()).map(([month, monthRecords], groupIndex) => {
    const monthNumber = Number(month);
    const monthName = getBirthdayMonthName(monthNumber);
    const monthIcon = getBirthdayMonthIcon(monthNumber);
    const isCurrentMonth = monthNumber === todayMonth;
    const isExpanded = activeBirthdayMonth === monthNumber;
    const celebrantLabel = `${monthRecords.length} ${monthRecords.length === 1 ? "celebrant" : "celebrants"}`;

    return `
      <section class="birthdayMonthGroup ${isCurrentMonth ? "isCurrentMonth" : ""} ${isExpanded ? "isExpanded" : ""}" style="--group-index:${groupIndex};">
        <button type="button" class="birthdayMonthHeader" aria-expanded="${isExpanded ? "true" : "false"}" aria-controls="birthdayMonthPanel-${monthNumber}" onclick="toggleBirthdayMonth(${monthNumber})">
          <div class="birthdayMonthBadge" aria-hidden="true">${escapeHTML(monthIcon)}</div>
          <div class="birthdayMonthHeading">
            <h3>${escapeHTML(monthName)}</h3>
            <p>${celebrantLabel}${isCurrentMonth ? ' <span>This month</span>' : ''}</p>
          </div>
          <div class="birthdayMonthCountWrap">
            <div class="birthdayMonthCount" aria-label="${celebrantLabel}">${monthRecords.length}</div>
            <span class="birthdayMonthToggle" aria-hidden="true">${isExpanded ? "−" : "+"}</span>
          </div>
        </button>

        <div id="birthdayMonthPanel-${monthNumber}" class="birthdayMonthPeople" ${isExpanded ? '' : 'hidden'}>
          ${monthRecords.map((record, itemIndex) => `
            <div class="birthdayYearPerson ${record.monthDay === todayMonthDay ? "isToday" : ""}" style="--item-index:${itemIndex};">
              <span class="birthdayYearSparkle" aria-hidden="true">${record.monthDay === todayMonthDay ? "🎉" : "🎂"}</span>
              <span class="birthdayYearDate">${escapeHTML(getOrdinalDay(record.day))}</span>
              <div class="birthdayYearMeta">
                <strong>${escapeHTML(record.name)}</strong>
                <small>${record.monthDay === todayMonthDay ? "Celebrating today" : "Birthday celebrant"}</small>
              </div>
              ${record.monthDay === todayMonthDay ? '<em>Today</em>' : ''}
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function toggleBirthdayMonth(month) {
  const numericMonth = Number(month) || 0;
  if (!numericMonth) return;

  activeBirthdayMonth = activeBirthdayMonth === numericMonth ? null : numericMonth;
  renderBirthdayYearModal(latestData?.birthdays || []);
}

function getSortedBirthdayRecords(items) {
  return (items || [])
    .map(item => {
      const birthdayValue = item?.MonthDay || item?.Birthday || item?.Birthdate || item?.Date || "";
      const monthDay = normalizeBirthdayValue(birthdayValue);
      if (!monthDay || !monthDay.includes("-")) return null;

      const [monthText, dayText] = monthDay.split("-");
      const month = Number(monthText);
      const day = Number(dayText);
      if (!month || !day) return null;

      const name = item?.Name || item?.StudentName || item?.Student || "Birthday Celebrant";
      return { monthDay, month, day, name: String(name).trim() || "Birthday Celebrant" };
    })
    .filter(Boolean)
    .sort((a, b) => (a.month - b.month) || (a.day - b.day) || a.name.localeCompare(b.name));
}

function getBirthdayMonthName(month) {
  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  return monthNames[Number(month)] || "Birthday Month";
}

function getBirthdayMonthIcon(month) {
  const icons = {
    1: "🎈",
    2: "💝",
    3: "🌸",
    4: "🌼",
    5: "🌞",
    6: "🌺",
    7: "🎆",
    8: "🍭",
    9: "🍎",
    10: "🎃",
    11: "🦃",
    12: "🎄"
  };
  return icons[Number(month)] || "🎂";
}

function rotateBirthdays() {
  if (!latestData || !latestData.birthdays || latestData.birthdays.length === 0) return;

  const todayMonthDay = getTodayMonthDay();

  const birthdayToday = latestData.birthdays.filter(item => {
    const birthdayValue =
      item.MonthDay ||
      item.Birthday ||
      item.Birthdate ||
      item.Date ||
      "";

    return normalizeBirthdayValue(birthdayValue) === todayMonthDay;
  });

  if (birthdayToday.length <= 1) return;

  birthdayIndex++;

  if (birthdayIndex >= birthdayToday.length) {
    birthdayIndex = 0;
  }

  renderBirthdays(latestData.birthdays);
}

function getTodayMonthDay() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const month = parts.find(part => part.type === "month")?.value || "";
  const day = parts.find(part => part.type === "day")?.value || "";

  return `${month}-${day}`;
}

function normalizeBirthdayValue(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (/^\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{1,2}-\d{1,2}$/.test(text)) {
    const [month, day] = text.split("-");
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (/^\d{1,2}\/\d{1,2}$/.test(text)) {
    const [month, day] = text.split("/");
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const date = new Date(text);

  if (!isNaN(date)) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);

    const month = parts.find(part => part.type === "month")?.value || "";
    const day = parts.find(part => part.type === "day")?.value || "";

    return `${month}-${day}`;
  }

  return text;
}

function formatBirthdayDateText(value) {
  const monthDay = normalizeBirthdayValue(value);

  if (!monthDay || !monthDay.includes("-")) {
    return "";
  }

  const [monthText, dayText] = monthDay.split("-");
  const month = Number(monthText);
  const day = Number(dayText);

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  return `${getOrdinalDay(day)} of ${monthNames[month] || ""}`;
}

function getOrdinalDay(day) {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }

  const lastDigit = day % 10;

  if (lastDigit === 1) return `${day}st`;
  if (lastDigit === 2) return `${day}nd`;
  if (lastDigit === 3) return `${day}rd`;

  return `${day}th`;
}

function fitDesktopQuoteText() {
  if (!window.matchMedia || !window.matchMedia("(min-width: 901px)").matches) return;

  const box = document.querySelector(".topQuoteBox");
  const label = box?.querySelector(".quoteLabel");
  const quote = document.getElementById("dailyQuote");
  if (!box || !quote) return;

  // Keep the quote visibly large. Shrink only when the full text truly needs it.
  // The author now sits in its own lower lane, above the SHSS meter.
  const MAX_PX = 21;
  const MIN_PX = 15.5;
  const BOTTOM_LANE_RESERVE = 31; // author + safe gap + 8px SHSS meter
  const LABEL_GAP = 5;

  quote.style.setProperty("font-size", `${MAX_PX}px`, "important");
  quote.style.setProperty("line-height", "1.01", "important");
  quote.style.setProperty("display", "block", "important");
  quote.style.setProperty("white-space", "normal", "important");
  quote.style.setProperty("overflow", "visible", "important");
  quote.style.setProperty("height", "auto", "important");
  quote.style.setProperty("max-height", "none", "important");
  quote.style.setProperty("transform", "none", "important");

  const labelBottom = label ? (label.offsetTop + label.offsetHeight) : 0;
  const quoteTop = Math.max(labelBottom + LABEL_GAP, 22);
  const available = Math.max(38, box.clientHeight - quoteTop - BOTTOM_LANE_RESERVE);

  let size = MAX_PX;
  while (size > MIN_PX && quote.scrollHeight > available + 1) {
    size -= 0.5;
    quote.style.setProperty("font-size", `${size}px`, "important");
  }
}

let quoteFitResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(quoteFitResizeTimer);
  quoteFitResizeTimer = setTimeout(fitDesktopQuoteText, 100);
});

function renderQuote(item) {
  const rawQuote = item?.Quote ? String(item.Quote).trim() : "";
  const cleanQuote = rawQuote
    .replace(/^[\s\"'“”‘’]+/, "")
    .replace(/[\s\"'“”‘’]+$/, "");

  document.getElementById("dailyQuote").textContent =
    cleanQuote || "Be kind today.";

  document.getElementById("quoteAuthor").textContent =
    item ? `— ${item.Author || "SFK ClassBoard"}` : "";

  requestAnimationFrame(fitDesktopQuoteText);
}

function renderTicker(items) {
  const ticker = document.getElementById("tickerText");
  if (!ticker) return;

  const messages = (!items || items.length === 0)
    ? ["Welcome to SFK ClassBoard"]
    : items.map(item => String(item?.Message || "").trim()).filter(Boolean);

  const signature = JSON.stringify(messages);
  const existingTrack = ticker.querySelector(".ticker-marquee-track");

  // Do not rebuild/restart the marquee when the ticker messages themselves
  // have not changed. Other dashboard refreshes must not reset ticker travel.
  if (ticker.dataset.tickerSignature === signature && existingTrack) {
    if (!existingTrack._sfkTickerAnimation) {
      requestAnimationFrame(() => configureTickerMarquee(ticker, existingTrack));
    }
    return;
  }

  if (existingTrack?._sfkTickerAnimation) {
    try { existingTrack._sfkTickerAnimation.cancel(); } catch (_) {}
  }

  ticker.replaceChildren();
  ticker.dataset.tickerSignature = signature;

  const track = document.createElement("span");
  track.className = "ticker-marquee-track";

  messages.forEach((message, index) => {
    if (index > 0) {
      const separator = document.createElement("span");
      separator.className = "ticker-message-separator";
      separator.textContent = "•";
      separator.setAttribute("aria-hidden", "true");
      track.appendChild(separator);
    }

    const messageSpan = document.createElement("span");
    messageSpan.className = "ticker-message-item";
    messageSpan.textContent = `📢 ${message}`;
    track.appendChild(messageSpan);
  });

  ticker.appendChild(track);
  ticker.dataset.marquee = messages.map(message => `📢 ${message}`).join(" • ");

  requestAnimationFrame(() => configureTickerMarquee(ticker, track));
}

function configureTickerMarquee(ticker, track) {
  if (!ticker || !track || !track.isConnected) return;

  if (track._sfkTickerAnimation) {
    try { track._sfkTickerAnimation.cancel(); } catch (_) {}
    track._sfkTickerAnimation = null;
  }

  track.style.animation = "none";
  track.style.transform = "translate3d(0,0,0)";
  track.style.paddingLeft = "0";

  const isPhoneTicker = !!window.matchMedia?.("(max-width: 700px)").matches;

  /* v316 PHONE: convert the single message row into two identical sequences.
     The second copy follows the first immediately, so the loop never creates
     a long blank lane after the last message. */
  if (isPhoneTicker) {
    let sequences = track.querySelectorAll(":scope > .ticker-marquee-sequence");

    if (!sequences.length) {
      const sequence = document.createElement("span");
      sequence.className = "ticker-marquee-sequence";

      while (track.firstChild) sequence.appendChild(track.firstChild);

      // Add one separator after the final message so the wrap from last -> first
      // has exactly the same breathing room as every other message boundary.
      const wrapSeparator = document.createElement("span");
      wrapSeparator.className = "ticker-message-separator ticker-wrap-separator";
      wrapSeparator.textContent = "•";
      wrapSeparator.setAttribute("aria-hidden", "true");
      sequence.appendChild(wrapSeparator);

      const sequenceClone = sequence.cloneNode(true);
      sequenceClone.setAttribute("aria-hidden", "true");
      track.append(sequence, sequenceClone);
      sequences = track.querySelectorAll(":scope > .ticker-marquee-sequence");
    }

    const firstSequence = sequences[0];
    const sequenceWidth = Math.max(
      1,
      firstSequence?.scrollWidth || 0,
      firstSequence?.getBoundingClientRect().width || 0
    );

    // Begin already inside the visible lane: no long wait on first load.
    // Move exactly one sequence width; the duplicate makes the reset seamless.
    const startX = 18;
    const endX = startX - sequenceWidth;
    const pixelsPerSecond = 66;
    const durationMs = Math.max(9000, (sequenceWidth / pixelsPerSecond) * 1000);

    track.style.setProperty("--ticker-start-x", `${startX}px`);
    track.style.setProperty("--ticker-end-x", `${endX}px`);
    track.style.setProperty("--ticker-duration", `${(durationMs / 1000).toFixed(2)}s`);

    if (typeof track.animate === "function") {
      const animation = track.animate(
        [
          { transform: `translate3d(${startX}px, 0, 0)` },
          { transform: `translate3d(${endX}px, 0, 0)` }
        ],
        {
          duration: durationMs,
          easing: "linear",
          iterations: Infinity
        }
      );
      track._sfkTickerAnimation = animation;
      return;
    }

    track.style.animation = `sfkTickerTrackV287 ${durationMs}ms linear infinite`;
    return;
  }

  // Desktop keeps the approved full-travel behavior: start beyond the right
  // edge and reset only after the final message has completely left the left.
  const viewportWidth = Math.max(1, ticker.getBoundingClientRect().width);
  const trackWidth = Math.max(1, track.scrollWidth, track.getBoundingClientRect().width);
  const edgePadding = 28;
  const startX = viewportWidth + edgePadding;
  const endX = -(trackWidth + edgePadding);
  const totalDistance = startX - endX;
  const pixelsPerSecond = 58;
  const durationMs = Math.max(22000, (totalDistance / pixelsPerSecond) * 1000);

  track.style.setProperty("--ticker-start-x", `${startX}px`);
  track.style.setProperty("--ticker-end-x", `${endX}px`);
  track.style.setProperty("--ticker-duration", `${(durationMs / 1000).toFixed(2)}s`);

  if (typeof track.animate === "function") {
    const animation = track.animate(
      [
        { transform: `translate3d(${startX}px, 0, 0)` },
        { transform: `translate3d(${endX}px, 0, 0)` }
      ],
      {
        duration: durationMs,
        easing: "linear",
        iterations: Infinity
      }
    );
    track._sfkTickerAnimation = animation;
    return;
  }

  track.style.animation = `sfkTickerTrackV287 ${durationMs}ms linear infinite`;
}

if (!window.__sfkTickerResizeBound) {
  window.__sfkTickerResizeBound = true;
  let tickerResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(tickerResizeTimer);
    tickerResizeTimer = setTimeout(() => {
      const ticker = document.getElementById("tickerText");
      const track = ticker?.querySelector(".ticker-marquee-track");
      if (ticker && track) requestAnimationFrame(() => configureTickerMarquee(ticker, track));
    }, 180);
  }, { passive: true });
}

function getBellAlertTextElement(alert) {
  return alert?.querySelector?.("#bellAlertText") || null;
}

function setBellAlertText(alert, message) {
  if (!alert) return;
  const textEl = getBellAlertTextElement(alert);
  if (textEl) {
    textEl.textContent = message;
  }
}

function getScheduleBellAlertKey(period) {
  if (!period) return "";
  return [period.Day || "", period.StartTime || "", period.EndTime || "", period.Subject || ""].join("|");
}

function showBellAlertForKey(alert, message, key) {
  if (!alert) return;
  const cleanKey = String(key || message || "bell-alert");
  alert.dataset.alertKey = cleanKey;
  setBellAlertText(alert, message);

  if (alert.dataset.dismissedKey === cleanKey) {
    alert.classList.add("hidden");
    return;
  }

  alert.classList.remove("hidden");
}

function dismissBellAlert() {
  const alert = document.getElementById("bellAlert");
  if (!alert) return;
  alert.dataset.dismissedKey = alert.dataset.alertKey || "manual";
  alert.classList.add("hidden");
}

if (!window.__sfkBellAlertCloseBound) {
  window.__sfkBellAlertCloseBound = true;
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest?.("#bellAlertClose");
    if (!closeButton) return;
    event.preventDefault();
    event.stopPropagation();
    dismissBellAlert();
  });
}

function updateCountdownAndBell() {
  const nextCountdown = document.getElementById("countdownText");
  const currentCountdown = document.getElementById("currentCountdownText");
  const alert = document.getElementById("bellAlert");

  const currentMinutes = getCurrentManilaMinutes();
  const periodState = latestData
    ? getDisplayPeriodState(latestData.schedule || [], latestData.currentSubject, latestData.nextSubject)
    : { currentPeriod: null, nextPeriod: null };
  const currentPeriod = periodState.currentPeriod;
  const nextPeriod = periodState.nextPeriod;

  if (currentCountdown) {
    if (!currentPeriod) {
      currentCountdown.textContent = "No ongoing period";
    } else {
      const endMinutes = timeToMinutes(currentPeriod.EndTime);
      const startMinutes = timeToMinutes(currentPeriod.StartTime);

      if (currentMinutes < startMinutes) {
        currentCountdown.textContent = `Starts in: ${formatMinutesCountdown(startMinutes - currentMinutes)}`;
      } else {
        const remaining = endMinutes - currentMinutes;

        if (remaining <= 0) {
          currentCountdown.textContent = "Ending soon";
        } else {
          currentCountdown.textContent = `Ends in: ${formatMinutesCountdown(remaining)}`;
        }
      }
    }
  }

  if (!nextPeriod) {
    if (nextCountdown) {
      nextCountdown.textContent = "No upcoming period";
    }

    if (alert) {
      alert.classList.add("hidden");
      alert.dataset.alertKey = "";
    }

    return;
  }

  const startMinutes = timeToMinutes(nextPeriod.StartTime);
  const diff = startMinutes - currentMinutes;

  if (diff <= 0) {
    if (nextCountdown) {
      nextCountdown.textContent = "Starting soon";
    }

    if (alert) {
      const alertKey = getScheduleBellAlertKey(nextPeriod);
      showBellAlertForKey(alert, `⏰ ${nextPeriod.Subject} is starting now`, alertKey);
    }

    return;
  }

  if (nextCountdown) {
    nextCountdown.textContent = `Starts in: ${formatMinutesCountdown(diff)}`;
  }

  if (diff <= 5) {
    if (alert) {
      const alertKey = getScheduleBellAlertKey(nextPeriod);
      showBellAlertForKey(
        alert,
        `⏰ ${nextPeriod.Subject} starts in ${diff} minute${diff > 1 ? "s" : ""}`,
        alertKey
      );
    }
  } else {
    if (alert) {
      alert.classList.add("hidden");
    }
  }

  enforceHomepagePeriodColors();
}


function enforceHomepagePeriodColors() {
  const currentCountdown = document.getElementById("currentCountdownText");
  const nextCountdown = document.getElementById("countdownText");

  if (currentCountdown) {
    currentCountdown.style.setProperty("color", getHomeCssVar("--home-current-countdown-text", currentCountdown.style.color || "#111"), "important");
    currentCountdown.style.setProperty("background", getHomeCssVar("--home-current-countdown-bg", currentCountdown.style.background || "rgba(255, 215, 0, .95)"), "important");
  }

  if (nextCountdown) {
    nextCountdown.style.setProperty("color", getHomeCssVar("--home-next-countdown-text", nextCountdown.style.color || "#fff"), "important");
    nextCountdown.style.setProperty("background", getHomeCssVar("--home-next-countdown-bg", nextCountdown.style.background || "rgba(0,0,0,.44)"), "important");
  }
}

function formatMinutesCountdown(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getCurrentManilaMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const hours = Number(parts.find(part => part.type === "hour")?.value || 0);
  const minutes = Number(parts.find(part => part.type === "minute")?.value || 0);

  return hours * 60 + minutes;
}

function getReadableTextColor(hexColor) {
  if (!hexColor || !hexColor.startsWith("#")) return "#111";

  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return "#111";

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#111" : "#fff";
}

function timeToMinutes(timeValue) {
  const text = String(timeValue || "").trim();

  const match =
    text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);

  if (!match) return 0;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function startLiveClock() {
  updateClock();

  if (!window.clockInterval) {
    window.clockInterval = setInterval(() => {
      updateClock();
      updateCountdownAndBell();
      checkPrayerTimes();

      document.title =
        "SFK ClassBoard " + new Date().getSeconds();
    }, 1000);
  }
}

function fitDesktopHeaderDate(dateEl) {
  if (!dateEl || !window.matchMedia || !window.matchMedia("(min-width: 901px)").matches) return;

  // Always show the complete weekday + date on one line. Never use an ellipsis.
  // Start at a readable size and shrink only as much as the current card width requires.
  const MAX_PX = 16;
  const MIN_PX = 8.5;
  let size = MAX_PX;

  dateEl.style.setProperty("font-size", `${MAX_PX}px`, "important");
  dateEl.style.setProperty("letter-spacing", "-0.03em", "important");
  dateEl.style.setProperty("transform", "none", "important");
  dateEl.style.setProperty("width", "100%", "important");
  dateEl.style.setProperty("white-space", "nowrap", "important");
  dateEl.style.setProperty("overflow", "hidden", "important");
  dateEl.style.setProperty("text-overflow", "clip", "important");
  dateEl.style.setProperty("max-width", "100%", "important");
  dateEl.style.setProperty("min-width", "0", "important");

  while (size > MIN_PX && dateEl.scrollWidth > dateEl.clientWidth + 1) {
    size -= 0.25;
    dateEl.style.setProperty("font-size", `${size}px`, "important");
  }

  // If an unusually long date is still wider at the minimum font size,
  // compress it horizontally rather than hiding characters or showing dots.
  dateEl.style.setProperty("transform", "none", "important");
  dateEl.style.setProperty("transform-origin", "left center", "important");
  if (dateEl.scrollWidth > dateEl.clientWidth + 1 && dateEl.scrollWidth > 0) {
    const scale = Math.min(1, dateEl.clientWidth / dateEl.scrollWidth);
    dateEl.style.setProperty("transform", `scaleX(${scale})`, "important");
    dateEl.style.setProperty("width", `${100 / scale}%`, "important");
  } else {
    dateEl.style.setProperty("width", "100%", "important");
  }
}

function fitDesktopHeaderTime(timeEl) {
  if (!timeEl || !window.matchMedia || !window.matchMedia("(min-width: 901px)").matches) return;

  // Start large, then shrink only when a long value such as 12:59:59 AM needs it.
  const MAX_PX = 64;
  const MIN_PX = 20;
  let size = MAX_PX;

  timeEl.style.setProperty("font-size", `${MAX_PX}px`, "important");
  timeEl.style.setProperty("white-space", "nowrap", "important");
  timeEl.style.setProperty("overflow", "hidden", "important");
  timeEl.style.setProperty("text-overflow", "clip", "important");

  // Measure after the text for this second has been written.
  while (size > MIN_PX && timeEl.scrollWidth > timeEl.clientWidth + 1) {
    size -= 0.5;
    timeEl.style.setProperty("font-size", `${size}px`, "important");
  }
}

function updateClock() {
  const now = new Date();
  refreshThingsToBringForManilaDay(now);
  const timeEl = document.getElementById("timeText");
  if (!timeEl) return;

  const isPhoneHeader = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;

  const formatterOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila"
  };

  if (!isPhoneHeader) {
    // Desktop/tablet: keep the full clock on one line and auto-fit long values.
    timeEl.textContent = new Intl.DateTimeFormat("en-US", formatterOptions).format(now);
    timeEl.classList.remove("phoneCompactTime");
    requestAnimationFrame(() => {
      fitDesktopHeaderTime(timeEl);
      fitDesktopHeaderDate(document.getElementById("dateText"));
    });
    return;
  }

  const parts = new Intl.DateTimeFormat("en-US", formatterOptions).formatToParts(now);

  const getPart = (type) => parts.find((part) => part.type === type)?.value || "";
  const hour = getPart("hour") || "--";
  const minute = getPart("minute") || "--";
  const second = getPart("second") || "--";
  const dayPeriod = getPart("dayPeriod") || "";

  timeEl.innerHTML = `
    <span class="timeMain">${hour}:${minute}</span><span class="timeSeconds">:${second}</span><span class="timePeriod">${dayPeriod}</span>
  `.trim();

  timeEl.classList.add("phoneCompactTime");
}

function startAutoScroll(id) {
  const box = document.getElementById(id);
  if (!box) return;

  let direction = 1;
  let paused = false;

  setInterval(() => {
    const maxScroll = box.scrollHeight - box.clientHeight;

    if (maxScroll <= 5 || paused) return;

    const nextScroll = box.scrollTop + direction;

    if (nextScroll >= maxScroll) {
      box.scrollTop = maxScroll;
      paused = true;

      setTimeout(() => {
        direction = -1;
        paused = false;
      }, 2000);

      return;
    }

    if (nextScroll <= 0) {
      box.scrollTop = 0;
      paused = true;

      setTimeout(() => {
        direction = 1;
        paused = false;
      }, 2000);

      return;
    }

    box.scrollTop = nextScroll;
  }, 180);
}

async function openWeeklySchedule() {
  const modal = document.getElementById("weeklyScheduleModal");
  if (!modal) return;

  modal.classList.remove("hidden");

  if (weeklyScheduleData.length === 0) {
    await loadWeeklySchedule();
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Manila"
  });

  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  activeWeeklyDay = validDays.includes(today) ? today : "Monday";

  showWeeklyDay(activeWeeklyDay);
}

function closeWeeklySchedule() {
  const modal = document.getElementById("weeklyScheduleModal");
  if (!modal) return;

  modal.classList.add("hidden");
}

async function loadWeeklySchedule() {
  const content = document.getElementById("weeklyScheduleContent");

  if (content) {
    content.innerHTML = `<p>Loading weekly schedule...</p>`;
  }

  try {
    const response = await fetch(`${API_URL}?type=schedule`, {
      cache: "no-store"
    });

    const data = await response.json();

    console.log("Weekly schedule raw data:", data);

    if (Array.isArray(data)) {
      weeklyScheduleData = data;
      weeklyDailyInfoData = [];
    } else if (Array.isArray(data.schedule)) {
      weeklyScheduleData = data.schedule;
      weeklyDailyInfoData = Array.isArray(data.dailyInfo) ? data.dailyInfo : [];
    } else if (Array.isArray(data.data)) {
      weeklyScheduleData = data.data;
      weeklyDailyInfoData = Array.isArray(data.dailyInfo) ? data.dailyInfo : [];
    } else if (Array.isArray(data.rows)) {
      weeklyScheduleData = data.rows;
      weeklyDailyInfoData = Array.isArray(data.dailyInfo) ? data.dailyInfo : [];
    } else {
      weeklyScheduleData = [];
      weeklyDailyInfoData = [];
    }

    console.log("Weekly schedule parsed:", weeklyScheduleData);

  } catch (error) {
    console.error("Weekly schedule failed:", error);

    if (content) {
      content.innerHTML = `
        <p>Unable to load weekly schedule.</p>
      `;
    }
  }
}
function showWeeklyDay(day) {
  activeWeeklyDay = day;

  const content = document.getElementById("weeklyScheduleContent");
  if (!content) return;

  document.querySelectorAll(".weeklyTab").forEach(button => {
    button.classList.toggle("active", button.textContent.trim() === day);
  });

const dayItems = weeklyScheduleData
  .filter(item => {
    const itemDay = String(
      item.Day ||
      item.day ||
      item.DAY ||
      item.Weekday ||
      item.weekday ||
      ""
    ).trim().toLowerCase();

    return itemDay === day.toLowerCase();
  })
  .sort((a, b) => {
    const aStart = a.StartTime || a.startTime || a.Start || a.start || "";
    const bStart = b.StartTime || b.startTime || b.Start || b.start || "";

    return timeToMinutes(aStart) - timeToMinutes(bStart);
  });

  if (dayItems.length === 0) {
    content.innerHTML = `
      <div class="weeklyEmpty">
        <h3>${day}</h3>
        <p>No schedule found for this day.</p>
      </div>
    `;
    return;
  }

  const firstItem = dayItems[0];
  const lastItem = dayItems[dayItems.length - 1];

  const pasokTime = firstItem.StartTime || "--";
  const uwianTime = lastItem.EndTime || "--";
  const dailyInfo = getWeeklyDailyInfo(day);
  const entryGate = dailyInfo.EntryGate || dailyInfo.entryGate || "Gate 2";
  const exitGate = dailyInfo.ExitGate || dailyInfo.exitGate || "SHS Gate";
  const uniform = dailyInfo.Uniform || dailyInfo.uniform || "To be announced";

  content.innerHTML = `
    <div class="weeklyDayTitle">
      <div class="weeklyDayHeaderLine">
        <h3>${day}</h3>
        <div class="weeklyDayMeta">
          <span><b>Pasok:</b> ${pasokTime}</span>
          <span><b>Uwian:</b> ${uwianTime}</span>
          <span><b>Entry:</b> ${escapeHTML(entryGate)}</span>
          <span><b>Exit:</b> ${escapeHTML(exitGate)}</span>
          <span><b>Uniform:</b> ${escapeHTML(uniform)}</span>
        </div>
      </div>

      <div class="weeklyDaySummary weeklyDaySummaryCompact" aria-hidden="true">
        <div>
          <span>Pasok</span>
          <strong>${pasokTime}</strong>
        </div>

        <div>
          <span>Uwian</span>
          <strong>${uwianTime}</strong>
        </div>

        <div>
          <span>Entry Gate</span>
          <strong>${escapeHTML(entryGate)}</strong>
        </div>

        <div>
          <span>Exit Gate</span>
          <strong>${escapeHTML(exitGate)}</strong>
        </div>

        <div class="weeklyUniformInfo">
          <span>Uniform</span>
          <strong>${escapeHTML(uniform)}</strong>
        </div>
      </div>
    </div>

    <div class="weeklyList">
      ${dayItems.map(item => {
        const color = item.Color || getSubjectColor(item.Subject);
        const textColor = getScheduleItemSubjectTextColor(item, color);

        return `
          <div class="weeklyItem" style="border-left-color:${color};">
            <div class="weeklyTime">
              ${item.StartTime || item.startTime || item.Start || ""} - ${item.EndTime || item.endTime || item.End || ""}
            </div>

            <div class="weeklySubject">
              <strong style="color:${textColor}; background:${color};">
                ${renderScheduleSubjectText(item, textColor)}
              </strong>

				<p>
				  ${item.Teacher || item.teacher || ""}
				  ${(item.Room || item.room) ? `• ${item.Room || item.room}` : ""}
				</p>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getWeeklyDailyInfo(day) {
  return (weeklyDailyInfoData || []).slice().reverse().find(item => {
    const itemDay = String(item.Day || item.day || "").trim().toLowerCase();
    return itemDay === String(day || "").trim().toLowerCase();
  }) || {};
}


/* ================================
   PRAYER AUDIO PLAYER SYSTEM
   12:00 PM = Angelus / Regina Caeli based on season
   3:00 PM = Three PM Prayer
   TEST: configurable time = Angelus

   This version does NOT autoplay and does NOT use bell audio.
   It opens a popup with a built-in audio player instead.
================================ */
function checkPrayerTimes() {
  const trigger = getCurrentPrayerTrigger();

  if (!trigger || !trigger.config || !trigger.triggerKey) return;
  if (lastPrayerTriggerKey === trigger.triggerKey) return;

  lastPrayerTriggerKey = trigger.triggerKey;
  showPrayerPlayerPopup(trigger.config);
}

function getCurrentPrayerTrigger() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const dateKey = `${getPartValue(parts, "year")}-${getPartValue(parts, "month")}-${getPartValue(parts, "day")}`;
  const hour = getPartValue(parts, "hour");
  const minute = getPartValue(parts, "minute");

  if (hour === "12" && minute === "00") {
    const config = getNoonPrayerConfig(dateKey);
    return {
      config,
      triggerKey: `${dateKey}-12PM-${config.audioSrc}`
    };
  }

  if (hour === "15" && minute === "00") {
    return {
      config: {
        icon: "🙏",
        title: "3:00 PM Prayer",
        subtitle: "Let us pause for the three o’clock prayer.",
        audioSrc: "three-pm-prayer.mp3"
      },
      triggerKey: `${dateKey}-3PM`
    };
  }

  if (PRAYER_TEST_TRIGGER_ENABLED && hour === PRAYER_TEST_HOUR && minute === PRAYER_TEST_MINUTE) {
    return {
      config: {
        icon: "🙏",
        title: "Angelus Test",
        subtitle: `${PRAYER_TEST_HOUR}:${PRAYER_TEST_MINUTE} test prayer player.`,
        audioSrc: "angelus.mp3"
      },
      triggerKey: `${dateKey}-${PRAYER_TEST_HOUR}${PRAYER_TEST_MINUTE}-TEST-ANGELUS-PLAYER`
    };
  }

  return null;
}

function getNoonPrayerConfig(dateKey) {
  if (dateKey >= "2027-03-28" && dateKey <= "2027-05-16") {
    return {
      icon: "👑",
      title: "Regina Caeli",
      subtitle: "Queen of Heaven • Easter Season",
      audioSrc: "regina-caeli.mp3"
    };
  }

  return {
    icon: "🙏",
    title: "Angelus",
    subtitle: "12:00 PM Prayer",
    audioSrc: "angelus.mp3"
  };
}

function showPrayerPlayerPopup(config) {
  const popup = document.getElementById("prayerPopup");
  const icon = document.getElementById("prayerPopupIcon");
  const title = document.getElementById("prayerPopupTitle");
  const subtitle = document.getElementById("prayerPopupSubtitle");
  const status = document.getElementById("prayerPopupStatus");
  const player = document.getElementById("prayerPlayer");

  if (!popup) return;

  if (icon) icon.textContent = config.icon || "🙏";
  if (title) title.textContent = config.title || "Prayer Time";
  if (subtitle) subtitle.textContent = config.subtitle || "Please pause for prayer.";
  if (status) status.textContent = "Press play below to start the prayer.";

  if (player) {
    player.pause();
    player.src = config.audioSrc;
    player.currentTime = 0;
    player.load();
  }

  popup.classList.remove("hidden");
}

function closePrayerPopup() {
  const popup = document.getElementById("prayerPopup");
  const player = document.getElementById("prayerPlayer");

  if (player) {
    player.pause();
    player.currentTime = 0;
  }

  if (popup) {
    popup.classList.add("hidden");
  }
}

// Kept for compatibility with older onclick handlers, if any.
function stopPrayerSequence() {
  closePrayerPopup();
}

function enableClassBoardSound() {
  showSoundAlert("Audio player mode is active. The prayer will use manual controls.");
}

function startClassBoardAudio() {
  enableClassBoardSound();
}

function updatePrayerPopupStatus(message) {
  const status = document.getElementById("prayerPopupStatus");
  if (status) {
    status.textContent = message;
  }
}

function showSoundAlert(message) {
  const alert = document.getElementById("bellAlert");
  if (!alert) return;

  const alertKey = `sound:${String(message || "notice")}:${Date.now()}`;
  showBellAlertForKey(alert, message, alertKey);

  clearTimeout(window.soundAlertTimer);
  window.soundAlertTimer = setTimeout(() => {
    if (alert.dataset.alertKey === alertKey) {
      alert.classList.add("hidden");
    }
  }, 5000);
}

function getPartValue(parts, type) {
  return parts.find(part => part.type === type)?.value || "";
}

// initClassBoard() is called after the stable heart ledger override below.


/* ========================================================================
   STABLE HEART LEDGER V3
   Source of truth: settings collection documents with Kind=ClassBoardHeartLedgerV3.
   This avoids writing counts into announcement/memory records and avoids old broken
   HeartCount/HeartUsers fields. Counts are always calculated from actual heart docs.
======================================================================== */
const HEART_LEDGER_KIND_V3 = "ClassBoardHeartLedgerV3";
const HEART_LEDGER_COLLECTION_V3 = "settings";
const ANNOUNCEMENT_HEART_LEDGER_PENDING = new Set();

function getHeartLedgerDbV3() {
  try {
    if (window.SFK_CLASSBOARD_FIREBASE_DB) return window.SFK_CLASSBOARD_FIREBASE_DB;
    if (!window.firebase || !window.SFK_FIREBASE_READY) return null;
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    const db = firebase.firestore();
    window.SFK_CLASSBOARD_FIREBASE_DB = db;
    return db;
  } catch (error) {
    console.warn("Heart ledger database unavailable:", error);
    return null;
  }
}

function makeHeartLedgerTargetKeyV3(type, id) {
  return `${String(type || "record").trim()}:${String(id || "").trim()}`;
}

function makeAnnouncementHeartTargetKeyV3(itemOrId) {
  const id = typeof itemOrId === "object" ? getAnnouncementId(itemOrId) : String(itemOrId || "").trim();
  return makeHeartLedgerTargetKeyV3("announcement", id);
}

function hashHeartLedgerTextV3(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function makeHeartLedgerDocIdV3(targetKey, deviceId) {
  return `heartV3_${hashHeartLedgerTextV3(targetKey)}_${hashHeartLedgerTextV3(deviceId)}`;
}

async function readHeartLedgerSummaryV3(targetType, targetKeys) {
  const db = getHeartLedgerDbV3();
  const uniqueKeys = Array.from(new Set((targetKeys || []).map(String).filter(Boolean)));
  const summary = {};
  uniqueKeys.forEach(key => {
    summary[key] = { count: 0, mine: false };
  });

  if (!db || uniqueKeys.length === 0) return summary;

  const deviceId = getClassBoardHeartDeviceId();
  const targetSet = new Set(uniqueKeys);

  try {
    const snap = await db.collection(HEART_LEDGER_COLLECTION_V3)
      .where("Kind", "==", HEART_LEDGER_KIND_V3)
      .get();

    snap.forEach(doc => {
      const data = doc.data() || {};
      const key = String(data.TargetKey || "").trim();
      if (!targetSet.has(key)) return;
      if (String(data.TargetType || "").trim() !== String(targetType || "").trim()) return;
      if (data.Active === false) return;

      summary[key].count += 1;
      if (String(data.DeviceID || "") === deviceId) summary[key].mine = true;
    });
  } catch (error) {
    console.warn("Unable to read heart ledger:", error);
  }

  return summary;
}

async function saveHeartLedgerStateV3(targetType, targetKey, shouldHeart) {
  const db = getHeartLedgerDbV3();
  if (!db) throw new Error("Firebase is not ready for hearts.");

  const deviceId = getClassBoardHeartDeviceId();
  const cleanTargetKey = String(targetKey || "").trim();
  if (!cleanTargetKey) throw new Error("Missing heart target.");

  const docId = makeHeartLedgerDocIdV3(cleanTargetKey, deviceId);
  const ref = db.collection(HEART_LEDGER_COLLECTION_V3).doc(docId);

  if (shouldHeart) {
    const payload = {
      Kind: HEART_LEDGER_KIND_V3,
      TargetType: String(targetType || "record"),
      TargetKey: cleanTargetKey,
      DeviceID: deviceId,
      Active: true,
      UpdatedAtText: new Date().toISOString()
    };
    if (window.firebase?.firestore?.FieldValue) {
      payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await ref.set(payload, { merge: true });
  } else {
    await ref.delete().catch(async () => {
      await ref.set({
        Kind: HEART_LEDGER_KIND_V3,
        TargetType: String(targetType || "record"),
        TargetKey: cleanTargetKey,
        DeviceID: deviceId,
        Active: false,
        UpdatedAtText: new Date().toISOString()
      }, { merge: true });
    });
  }

  const summary = await readHeartLedgerSummaryV3(targetType, [cleanTargetKey]);
  return {
    success: true,
    hearted: Boolean(summary[cleanTargetKey]?.mine),
    count: Number(summary[cleanTargetKey]?.count || 0),
    targetKey: cleanTargetKey
  };
}

async function hydrateAnnouncementHeartsV3(announcements) {
  if (!Array.isArray(announcements) || announcements.length === 0) return announcements;
  const keys = announcements.map(item => makeAnnouncementHeartTargetKeyV3(item));
  const summary = await readHeartLedgerSummaryV3("announcement", keys);
  announcements.forEach(item => {
    const key = makeAnnouncementHeartTargetKeyV3(item);
    const info = summary[key] || { count: 0, mine: false };
    item._heartV3TargetKey = key;
    item._heartV3Count = Number(info.count || 0);
    item._heartV3Mine = Boolean(info.mine);
  });
  return announcements;
}

// Override the original loader so heart counts come from the ledger before rendering.
loadClassBoard = async function loadClassBoardWithHeartLedger() {
  if (isFetching) return;
  isFetching = true;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(`${API_URL}?type=today`, {
      cache: "no-store",
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (Array.isArray(data.announcements)) {
      data.announcements = await hydrateAnnouncementAttachmentRowsV6(data.announcements);
      await hydrateAnnouncementHeartsV3(data.announcements);
    }

    const cacheData = stripLargeAnnouncementMediaForCacheV6(data);
    const cacheDataString = JSON.stringify(cacheData);
    safeSetClassBoardCache(cacheDataString);

    // The API includes a live `time` value that changes every request. Comparing
    // that field caused the whole dashboard (including Today's Schedule) to be
    // rebuilt every 2 seconds, continuously restarting subject marquees.
    // Ignore only the volatile clock value for render-change detection. Real
    // changes such as schedule/current period/announcements still trigger render.
    const stableCompareData = { ...cacheData };
    delete stableCompareData.time;
    const stableDataString = JSON.stringify(stableCompareData);

    const shouldRenderDashboardV6 = stableDataString !== latestDataString || hasAnnouncementDataImageV6(data);
    if (shouldRenderDashboardV6) {
      latestDataString = stableDataString;
      latestData = data;
      renderDashboard(data);
    } else {
      latestData = data;
      updateCountdownAndBell();
      renderCleanersToday();
    }
  } catch (error) {
    console.error("ClassBoard fetch failed:", error);
    if (!latestData) {
      const title = document.getElementById("dashboardTitle");
      if (title) title.textContent = "Unable to load ClassBoard";
    }
  } finally {
    isFetching = false;
  }
};


async function hydrateAnnouncementAttachmentRowsV6(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return Promise.all(list.map(async (row) => {
    const originalUrls = splitAttachmentField(
      row?.AttachmentURLs || row?.Attachments || row?.AttachmentURL || row?.AttachmentRefs || row?.attachmentRefs || ""
    );
    const originalRefs = splitAttachmentField(row?.AttachmentRefs || row?.attachmentRefs || "");
    const urls = originalUrls.length ? originalUrls : originalRefs;
    if (!urls.length) return row;

    const resolvedUrls = await Promise.all(urls.map(async (url) => {
      const raw = String(url || "").trim();
      if (!raw) return "";
      if (/^data:image\//i.test(raw)) return raw;
      if (parseClassBoardMediaRef(raw)) {
        return await resolveClassBoardMediaDataUrlWithRetryV7(raw, 5) || raw;
      }
      return raw;
    }));

    const joined = resolvedUrls.filter(Boolean).join("\n");
    return {
      ...row,
      AttachmentURLs: joined,
      Attachments: joined,
      AttachmentURL: joined,
      AttachmentRefs: originalRefs.length ? originalRefs.join("\n") : urls.filter(value => parseClassBoardMediaRef(value)).join("\n")
    };
  }));
}

function hasAnnouncementDataImageV6(data) {
  return Array.isArray(data?.announcements)
    && data.announcements.some((item) => splitAttachmentField(item?.AttachmentURLs || item?.Attachments || item?.AttachmentURL || "")
      .some((part) => /^data:image\//i.test(String(part || ""))));
}

function stripLargeAnnouncementMediaForCacheV6(data) {
  if (!data || !Array.isArray(data.announcements)) return data;
  return {
    ...data,
    announcements: data.announcements.map((item) => {
      const stripField = (value) => splitAttachmentField(value)
        .map((part) => /^data:image\//i.test(String(part || "")) ? "" : part)
        .filter(Boolean)
        .join("\n");
      return {
        ...item,
        AttachmentURLs: stripField(item.AttachmentURLs || item.Attachments || item.AttachmentURL || "") || item.AttachmentRefs || item.attachmentRefs || "",
        Attachments: stripField(item.Attachments || item.AttachmentURLs || item.AttachmentURL || "") || item.AttachmentRefs || item.attachmentRefs || "",
        AttachmentURL: stripField(item.AttachmentURL || item.AttachmentURLs || item.Attachments || "") || item.AttachmentRefs || item.attachmentRefs || ""
      };
    })
  };
}

renderAnnouncementHeartButton = function renderAnnouncementHeartButtonV3(item) {
  if (!shouldShowAnnouncementHeart(item)) return `<span class="announcement-heart-spacer"></span>`;
  const id = getAnnouncementId(item);
  const count = getAnnouncementHeartCount(item);
  const isHearted = isAnnouncementHeartedByThisDevice(item);
  return `
    <button
      class="announcement-heart-btn ${isHearted ? "is-hearted" : ""}"
      type="button"
      data-announcement-id="${escapeAttr(id)}"
      onclick="return heartAnnouncement('${escapeJsAttribute(id)}')"
      ${!id ? "disabled" : ""}
      aria-label="Acknowledge this announcement">
      <span class="heart-icon">${isHearted ? "❤️" : "🤍"}</span>
      <span>Noted</span>
      <strong>${count}</strong>
    </button>
  `;
};

getAnnouncementHeartCount = function getAnnouncementHeartCountV3(item) {
  const value = Number(item?._heartV3Count);
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

isAnnouncementHeartedByThisDevice = function isAnnouncementHeartedByThisDeviceV3(item) {
  return Boolean(item?._heartV3Mine);
};

syncAnnouncementHeartStatesFromServer = function syncAnnouncementHeartStatesFromServerV3() {
  // No-op. Heart state comes from the Firestore ledger, not localStorage.
};

heartAnnouncement = async function heartAnnouncementV3(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || ANNOUNCEMENT_HEART_LEDGER_PENDING.has(cleanId)) return false;

  const item = findAnnouncementById(cleanId);
  if (!item) {
    console.warn("Announcement not found for heart:", cleanId);
    return false;
  }

  const targetKey = makeAnnouncementHeartTargetKeyV3(item);
  const nextHearted = !Boolean(item._heartV3Mine);
  ANNOUNCEMENT_HEART_LEDGER_PENDING.add(cleanId);
  setAnnouncementHeartButtonSaving(cleanId, true);

  try {
    const result = await saveHeartLedgerStateV3("announcement", targetKey, nextHearted);
    if (latestData && Array.isArray(latestData.announcements)) {
      latestData.announcements.forEach(record => {
        if (getAnnouncementId(record) === cleanId) {
          record._heartV3TargetKey = targetKey;
          record._heartV3Count = result.count;
          record._heartV3Mine = result.hearted;
        }
      });
      latestDataString = JSON.stringify(latestData);
      safeSetClassBoardCache(latestDataString);
    }
    renderAnnouncements(latestData?.announcements || []);
  } catch (error) {
    console.error("Announcement heart failed:", error);
    alert("Unable to save Noted. Please refresh and try again.");
  } finally {
    ANNOUNCEMENT_HEART_LEDGER_PENDING.delete(cleanId);
    setAnnouncementHeartButtonSaving(cleanId, false);
  }

  return false;
};


/* =========================================================
   v30 DESKTOP-ONLY SHHH MODE
   Noise-level monitor only. No voice recording.
========================================================= */
const SHHH_MODE_STORAGE_KEY = "sfkClassBoardShhhModeSettings";
const SHHH_MODE_DAILY_COUNTS_KEY = "sfkClassBoardShhhModeDailyCountsV2";
const SHHH_DAILY_HISTORY_LIMIT = 500;
const SHHH_DESKTOP_MEDIA_QUERY = "(min-width: 1024px) and (pointer: fine)";
const SHHH_SENSITIVITY_DEFAULT = 65;
const SHHH_SENSITIVITY_MIN = 0;
const SHHH_SENSITIVITY_MAX = 100;


function isShhhShortcutTypingTarget(target) {
  if (!target) return false;
  const tagName = String(target.tagName || "").toLowerCase();
  return Boolean(
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.closest?.("[contenteditable='true'], .richEditorSurface")
  );
}

function showShhhShortcutFeedback(message) {
  showSoundAlert(message);
}

let sfkSingingBowlAudio = {
  context: null,
  stops: [],
  element: null,
  activeKey: null,
  boostNodes: null
};

let sfkOShortcutAudio = {
  element: null,
  activeKey: null,
  boostNodes: null
};

let sfkShortcutBoostContext = null;

async function getShortcutBoostContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = sfkShortcutBoostContext || new AudioContextClass();
  sfkShortcutBoostContext = context;
  if (context.state === "suspended") await context.resume();
  return context;
}

function disconnectShortcutAudioBoost(state) {
  const nodes = state?.boostNodes;
  if (!nodes) return;
  ["source", "bass", "shine", "gain", "compressor", "out"].forEach((key) => {
    try { nodes[key]?.disconnect?.(); } catch (error) {}
  });
  state.boostNodes = null;
}

async function attachShortcutAudioBoost(audio, state, options = {}) {
  const context = await getShortcutBoostContext();
  if (!context || !audio || !state) return null;

  disconnectShortcutAudioBoost(state);

  const source = context.createMediaElementSource(audio);
  const bass = context.createBiquadFilter();
  const shine = context.createBiquadFilter();
  const gain = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const out = context.createGain();

  bass.type = "lowshelf";
  bass.frequency.setValueAtTime(options.bassFrequency || 240, context.currentTime);
  bass.gain.setValueAtTime(options.bassGain ?? 4.5, context.currentTime);

  shine.type = "highshelf";
  shine.frequency.setValueAtTime(options.shineFrequency || 2600, context.currentTime);
  shine.gain.setValueAtTime(options.shineGain ?? 2.5, context.currentTime);

  gain.gain.setValueAtTime(options.boost ?? 2.15, context.currentTime);

  compressor.threshold.setValueAtTime(options.threshold ?? -18, context.currentTime);
  compressor.knee.setValueAtTime(18, context.currentTime);
  compressor.ratio.setValueAtTime(options.ratio ?? 4.2, context.currentTime);
  compressor.attack.setValueAtTime(0.002, context.currentTime);
  compressor.release.setValueAtTime(0.28, context.currentTime);

  out.gain.setValueAtTime(options.output ?? 0.98, context.currentTime);

  source.connect(bass);
  bass.connect(shine);
  shine.connect(gain);
  gain.connect(compressor);
  compressor.connect(out);
  out.connect(context.destination);

  state.boostNodes = { source, bass, shine, gain, compressor, out };
  return context;
}

function stopSingingBowlShortcutSound(showFeedback = false) {
  const wasPlaying = Boolean(sfkSingingBowlAudio.element || sfkSingingBowlAudio.stops?.length || sfkSingingBowlAudio.activeKey === "p");
  disconnectShortcutAudioBoost(sfkSingingBowlAudio);
  if (sfkSingingBowlAudio.element) {
    try {
      sfkSingingBowlAudio.element.pause();
      sfkSingingBowlAudio.element.currentTime = 0;
      sfkSingingBowlAudio.element.src = "";
      sfkSingingBowlAudio.element.load?.();
    } catch (error) {}
    sfkSingingBowlAudio.element = null;
  }

  const stops = Array.isArray(sfkSingingBowlAudio.stops) ? sfkSingingBowlAudio.stops : [];
  stops.forEach((stop) => {
    try {
      stop();
    } catch (error) {}
  });
  sfkSingingBowlAudio.stops = [];
  sfkSingingBowlAudio.activeKey = null;
  if (showFeedback && wasPlaying) showSoundAlert("⏹ Singing Bowl Stopped");
}

function stopOShortcutSound(showFeedback = false) {
  const wasPlaying = Boolean(sfkOShortcutAudio.element || sfkOShortcutAudio.activeKey === "o");
  disconnectShortcutAudioBoost(sfkOShortcutAudio);
  if (sfkOShortcutAudio.element) {
    try {
      sfkOShortcutAudio.element.pause();
      sfkOShortcutAudio.element.currentTime = 0;
      sfkOShortcutAudio.element.src = "";
      sfkOShortcutAudio.element.load?.();
    } catch (error) {}
    sfkOShortcutAudio.element = null;
  }
  sfkOShortcutAudio.activeKey = null;
  if (showFeedback && wasPlaying) showSoundAlert("⏹ O Sound Stopped");
}

function stopAllShortcutSounds(exceptKey = "") {
  if (exceptKey !== "p") stopSingingBowlShortcutSound(false);
  if (exceptKey !== "o") stopOShortcutSound(false);
}

async function playSingingBowlAudioFile() {
  const audio = new Audio("tibetan-singing-bowl.mp3?v=shortcut-reliable-v117");
  audio.preload = "auto";
  audio.volume = 1;
  audio.currentTime = 0;
  audio.playsInline = true;
  sfkSingingBowlAudio.element = audio;
  sfkSingingBowlAudio.activeKey = "p";

  const clearElement = () => {
    if (sfkSingingBowlAudio.element === audio) {
      sfkSingingBowlAudio.element = null;
      sfkSingingBowlAudio.activeKey = null;
    }
  };
  audio.addEventListener("ended", clearElement, { once: true });
  audio.addEventListener("error", clearElement, { once: true });

  // Play FIRST while the P key press is still the active user gesture.
  // The previous loud booster used WebAudio before audio.play(), which can
  // make some browsers lose the gesture and play nothing. The MP3 itself is
  // already normalized, so direct playback is the safest classroom behavior.
  const playPromise = audio.play();
  showSoundAlert("🔔 Singing Bowl Playing");
  if (playPromise && typeof playPromise.then === "function") {
    await playPromise;
  }
}

async function playGeneratedSingingBowlFallback() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    showSoundAlert("Tibetan bowl sound is not supported on this browser.");
    return;
  }

  const context = sfkSingingBowlAudio.context || new AudioContextClass();
  sfkSingingBowlAudio.context = context;
  if (context.state === "suspended") await context.resume();

  const now = context.currentTime;
  const duration = 9.0;
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const lowpass = context.createBiquadFilter();
  const lowshelf = context.createBiquadFilter();
  const delay = context.createDelay(1.4);
  const feedback = context.createGain();
  const delayWet = context.createGain();

  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(9800, now);
  lowpass.frequency.exponentialRampToValueAtTime(4100, now + duration);

  lowshelf.type = "lowshelf";
  lowshelf.frequency.setValueAtTime(240, now);
  lowshelf.gain.setValueAtTime(5.5, now);

  compressor.threshold.setValueAtTime(-26, now);
  compressor.knee.setValueAtTime(24, now);
  compressor.ratio.setValueAtTime(5.5, now);
  compressor.attack.setValueAtTime(0.002, now);
  compressor.release.setValueAtTime(0.48, now);

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.75, now + 0.045);
  master.gain.exponentialRampToValueAtTime(1.18, now + 0.55);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  delay.delayTime.setValueAtTime(0.31, now);
  feedback.gain.setValueAtTime(0.42, now);
  delayWet.gain.setValueAtTime(0.28, now);

  master.connect(lowpass);
  lowpass.connect(lowshelf);
  lowshelf.connect(compressor);
  compressor.connect(context.destination);
  lowshelf.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(context.destination);

  const stopFns = [];
  const partials = [
    { freq: 174.6, gain: 0.62, detune: -2, decay: duration, type: "sine", pan: -0.08 },
    { freq: 176.1, gain: 0.22, detune: 1, decay: duration * 0.96, type: "sine", pan: 0.12 },
    { freq: 261.8, gain: 0.34, detune: 3, decay: duration * 0.82, type: "sine", pan: -0.22 },
    { freq: 264.2, gain: 0.14, detune: -3, decay: duration * 0.76, type: "sine", pan: 0.18 },
    { freq: 349.4, gain: 0.24, detune: 2, decay: duration * 0.66, type: "triangle", pan: 0.22 },
    { freq: 392.0, gain: 0.16, detune: -2, decay: duration * 0.58, type: "triangle", pan: -0.18 },
    { freq: 523.3, gain: 0.14, detune: 4, decay: duration * 0.50, type: "sine", pan: 0.08 },
    { freq: 694.0, gain: 0.09, detune: -4, decay: duration * 0.40, type: "triangle", pan: -0.25 },
    { freq: 880.0, gain: 0.065, detune: 5, decay: duration * 0.34, type: "sine", pan: 0.26 },
    { freq: 1320.0, gain: 0.04, detune: -5, decay: duration * 0.24, type: "triangle", pan: -0.12 }
  ];

  partials.forEach((tone, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const pan = context.createStereoPanner ? context.createStereoPanner() : null;
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    const startOffset = index * 0.012;

    oscillator.type = tone.type || "sine";
    oscillator.frequency.setValueAtTime(tone.freq, now + startOffset);
    oscillator.frequency.exponentialRampToValueAtTime(tone.freq * 0.992, now + tone.decay);
    oscillator.detune.setValueAtTime(tone.detune || 0, now + startOffset);

    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(0.18 + index * 0.045, now);
    shimmerGain.gain.setValueAtTime(1.6 + index * 0.12, now);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(oscillator.detune);

    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(tone.gain, now + startOffset + 0.028);
    gain.gain.exponentialRampToValueAtTime(tone.gain * 0.38, now + startOffset + 0.42);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.decay);

    oscillator.connect(gain);
    if (pan) {
      pan.pan.setValueAtTime(tone.pan || 0, now + startOffset);
      gain.connect(pan);
      pan.connect(master);
    } else {
      gain.connect(master);
    }

    oscillator.start(now + startOffset);
    shimmer.start(now + startOffset);
    oscillator.stop(now + duration + 0.1);
    shimmer.stop(now + duration + 0.1);
    stopFns.push(() => {
      try { oscillator.stop(); } catch (error) {}
      try { shimmer.stop(); } catch (error) {}
      try { oscillator.disconnect(); } catch (error) {}
      try { shimmer.disconnect(); } catch (error) {}
      try { shimmerGain.disconnect(); } catch (error) {}
      try { gain.disconnect(); } catch (error) {}
      if (pan) { try { pan.disconnect(); } catch (error) {} }
    });
  });

  const strikeLength = Math.floor(context.sampleRate * 0.42);
  const strikeBuffer = context.createBuffer(1, strikeLength, context.sampleRate);
  const data = strikeBuffer.getChannelData(0);
  for (let i = 0; i < strikeLength; i += 1) {
    const t = i / strikeLength;
    const envelope = Math.pow(1 - t, 3.1);
    data[i] = (Math.random() * 2 - 1) * 0.62 * envelope;
  }

  const strike = context.createBufferSource();
  const strikeFilter = context.createBiquadFilter();
  const strikeGain = context.createGain();
  strikeFilter.type = "bandpass";
  strikeFilter.frequency.setValueAtTime(540, now);
  strikeFilter.frequency.exponentialRampToValueAtTime(880, now + 0.12);
  strikeFilter.Q.setValueAtTime(8.5, now);
  strikeGain.gain.setValueAtTime(0.0001, now);
  strikeGain.gain.exponentialRampToValueAtTime(1.18, now + 0.012);
  strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
  strike.buffer = strikeBuffer;
  strike.connect(strikeFilter);
  strikeFilter.connect(strikeGain);
  strikeGain.connect(master);
  strike.start(now);
  strike.stop(now + 0.65);
  stopFns.push(() => {
    try { strike.stop(); } catch (error) {}
    try { strike.disconnect(); } catch (error) {}
    try { strikeFilter.disconnect(); } catch (error) {}
    try { strikeGain.disconnect(); } catch (error) {}
  });

  const cleanupTimer = window.setTimeout(() => {
    stopSingingBowlShortcutSound();
  }, Math.ceil((duration + 0.5) * 1000));

  stopFns.push(() => {
    window.clearTimeout(cleanupTimer);
    try { master.disconnect(); } catch (error) {}
    try { compressor.disconnect(); } catch (error) {}
    try { lowpass.disconnect(); } catch (error) {}
    try { lowshelf.disconnect(); } catch (error) {}
    try { delay.disconnect(); } catch (error) {}
    try { feedback.disconnect(); } catch (error) {}
    try { delayWet.disconnect(); } catch (error) {}
  });

  sfkSingingBowlAudio.stops = stopFns;
  sfkSingingBowlAudio.activeKey = "p";
  showSoundAlert("🔔 Singing Bowl Playing");
}

async function playSingingBowlShortcutSound() {
  try {
    if (sfkSingingBowlAudio.activeKey === "p" || sfkSingingBowlAudio.element || sfkSingingBowlAudio.stops?.length) {
      stopSingingBowlShortcutSound(true);
      return;
    }

    stopAllShortcutSounds("p");
    try {
      await playSingingBowlAudioFile();
    } catch (audioError) {
      console.warn("Real singing bowl audio failed; using generated fallback:", audioError);
      await playGeneratedSingingBowlFallback();
    }
  } catch (error) {
    console.warn("Singing bowl shortcut failed:", error);
    showSoundAlert("Tap/click once, then press P for the singing bowl.");
  }
}

async function playOShortcutSound() {
  try {
    if (sfkOShortcutAudio.activeKey === "o" || sfkOShortcutAudio.element) {
      stopOShortcutSound(true);
      return;
    }

    stopAllShortcutSounds("o");

    const audio = new Audio("o-shortcut-sound.mp3?v=o-sound-reliable-v117");
    audio.preload = "auto";
    audio.volume = 1;
    audio.currentTime = 0;
    audio.playsInline = true;
    sfkOShortcutAudio.element = audio;
    sfkOShortcutAudio.activeKey = "o";

    const clearElement = () => {
      if (sfkOShortcutAudio.element === audio) {
        sfkOShortcutAudio.element = null;
        sfkOShortcutAudio.activeKey = null;
      }
    };
    audio.addEventListener("ended", clearElement, { once: true });
    audio.addEventListener("error", clearElement, { once: true });

    // Same reliability rule as P: start direct playback immediately on the
    // O key press. No async audio routing before play, so it will not go silent
    // on GitHub Pages / installed PWA.
    const playPromise = audio.play();
    showSoundAlert("🔊 O Sound Playing");
    if (playPromise && typeof playPromise.then === "function") {
      await playPromise;
    }
  } catch (error) {
    console.warn("O shortcut sound failed:", error);
    stopOShortcutSound(false);
    showSoundAlert("Tap/click once, then press O for the uploaded sound.");
  }
}

function initSingingBowlKeyboardShortcut() {
  if (window.__sfkSingingBowlShortcutReady) return;
  window.__sfkSingingBowlShortcutReady = true;

  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isShhhShortcutTypingTarget(event.target)) return;

    const key = String(event.key || "").toLowerCase();
    if (!["p", "o"].includes(key)) return;

    event.preventDefault();
    event.stopPropagation();

    if (key === "p") {
      playSingingBowlShortcutSound();
      return;
    }

    if (key === "o") {
      playOShortcutSound();
    }
  }, true);
}

function initShhhModeKeyboardShortcuts() {
  if (window.__sfkShhhShortcutReady) return;
  window.__sfkShhhShortcutReady = true;

  document.addEventListener("keydown", async (event) => {
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (isShhhShortcutTypingTarget(event.target)) return;

    const key = String(event.key || "").toLowerCase();
    if (!["s", "m"].includes(key)) return;

    event.preventDefault();
    event.stopPropagation();

    if (key === "s") {
      if (shhhMode.enabled) {
        stopShhhMode();
        showShhhShortcutFeedback("✅ Shhh Mode OFF");
        return;
      }

      showShhhShortcutFeedback("🤫 Turning Shhh Mode ON...");
      await startShhhMode();
      showShhhShortcutFeedback(shhhMode.enabled ? "🤫 Shhh Mode ON" : "⚠️ Shhh Mode did not turn on");
      return;
    }

    if (key === "m") {
      shhhMode.muted = !shhhMode.muted;
      saveShhhModeSettings();
      updateShhhModeUi(shhhMode.muted ? "Sound muted" : "Sound on");
      showShhhShortcutFeedback(shhhMode.muted ? "🔇 Shhh Mute ON" : "🔊 Shhh Mute OFF");
    }
  }, true);
}

function getShhhThreshold() {
  const value = Math.max(SHHH_SENSITIVITY_MIN, Math.min(
    SHHH_SENSITIVITY_MAX,
    Number(shhhMode.sensitivityLevel ?? SHHH_SENSITIVITY_DEFAULT)
  ));

  // Higher slider = lower threshold = more sensitive.
  return 0.090 - (value / 100) * 0.082;
}

let shhhMode = {
  available: false,
  enabled: false,
  panelOpen: false,
  stream: null,
  audioContext: null,
  analyser: null,
  source: null,
  animationId: 0,
  samples: null,
  loudSince: 0,
  lastShhhAt: 0,
  level: 0,
  autoCount: 0,
  totalCount: 0,
  muted: false,
  voiceEnabled: true,
  randomVoiceEnabled: true,
  visualEnabled: true,
  showHeaderCount: true,
  sensitivityLevel: SHHH_SENSITIVITY_DEFAULT,
  micGainLevel: 100,
  noiseGateLevel: 20,
  cooldownMs: 10000
};

function initDesktopShhhMode() {
  createShhhModeUi();
  restoreShhhModeSettings();
  syncShhhModeAvailability();
  window.addEventListener("resize", syncShhhModeAvailability);
  window.addEventListener("pageshow", syncShhhDailyCountsFromStorage);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncShhhDailyCountsFromStorage();
  });
  initShhhModeKeyboardShortcuts();
  initSingingBowlKeyboardShortcut();
  window.addEventListener("beforeunload", () => {
    stopShhhMode();
    stopSingingBowlShortcutSound();
    stopOShortcutSound();
  });
}

function isShhhModeDesktopAvailable() {
  return !IS_PHONE_DEVICE
    && window.matchMedia?.(SHHH_DESKTOP_MEDIA_QUERY)?.matches
    && Boolean(navigator.mediaDevices?.getUserMedia);
}


function isShhhDesktopHeaderCountViewport() {
  try {
    return !IS_PHONE_DEVICE && Boolean(window.matchMedia?.(SHHH_DESKTOP_MEDIA_QUERY)?.matches);
  } catch (error) {
    return false;
  }
}

function ensureHeartCounterGroup() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return null;

  let group = document.getElementById("heartCounterGroup");
  if (!group) {
    group = document.createElement("div");
    group.id = "heartCounterGroup";
    group.className = "heartCounterGroup";
    group.setAttribute("aria-label", "Shhh monitor and count");

    const quoteBox = topbar.querySelector(".topQuoteBox");
    if (quoteBox) topbar.insertBefore(group, quoteBox);
    else topbar.appendChild(group);
  }

  const heartButton = document.querySelector(".topbarHeart");
  if (heartButton) {
    heartButton.textContent = "💛";
    heartButton.setAttribute("aria-label", "Open Shhh Mode");
    if (heartButton.parentElement !== group) group.prepend(heartButton);
  }

  return group;
}

function createShhhDesktopHeaderCountBadge() {
  const existing = document.getElementById("shhhDesktopCountBadge");
  const group = ensureHeartCounterGroup();
  if (!group) return existing || null;

  if (existing) {
    if (existing.parentElement !== group) group.appendChild(existing);
    return existing;
  }

  const badge = document.createElement("div");
  badge.id = "shhhDesktopCountBadge";
  badge.className = "shhhDesktopCountBadge";
  badge.setAttribute("aria-live", "polite");
  badge.setAttribute("aria-label", "Today's Shhh count");
  badge.title = "Today's Shhh count";
  badge.innerHTML = '<span aria-hidden="true">🤫</span><em>Shhh:</em><strong id="shhhDesktopCountValue">0</strong>';
  group.appendChild(badge);
  return badge;
}

function updateShhhDesktopHeaderCountBadge() {
  const badge = createShhhDesktopHeaderCountBadge();
  if (!badge) return;
  const count = Math.max(0, Number(shhhMode.totalCount) || 0);
  const shouldShow = isShhhDesktopHeaderCountViewport();
  badge.hidden = !shouldShow;
  badge.classList.toggle("is-live", Boolean(shhhMode.enabled));
  badge.classList.toggle("is-muted", Boolean(shhhMode.muted));
  badge.title = `Today's Shhh count: ${count}`;
  badge.setAttribute("aria-label", `Today's Shhh count: ${count}`);
  const value = badge.querySelector("#shhhDesktopCountValue");
  if (value) value.textContent = String(count);
}

function createShhhModeUi() {
  if (document.getElementById("shhhModeOpen")) {
    createShhhDesktopHeaderCountBadge();
    updateShhhDesktopHeaderCountBadge();
    return;
  }
  createShhhDesktopHeaderCountBadge();

  const header = document.querySelector(".adviserReminderHeader")
    || document.querySelector("#reminderList")?.previousElementSibling;
  let actions = header?.querySelector(".adviserHeaderActions")
    || document.querySelector(".adviserHeaderActions");

  if (!actions && header) {
    actions = document.createElement("div");
    actions.className = "adviserHeaderActions";
    header.appendChild(actions);
  }

  const heartButton = document.querySelector(".topbarHeart");
  const openButton = heartButton || document.createElement("button");
  openButton.id = "shhhModeOpen";
  openButton.classList.add("shhhModeOpen");
  openButton.setAttribute("role", "button");
  openButton.setAttribute("tabindex", "0");
  openButton.setAttribute("aria-label", "Open Shhh Mode");
  openButton.title = "Desktop Shhh Mode";

  if (!heartButton) {
    openButton.type = "button";
    openButton.dataset.shhhFallback = "true";
    openButton.innerHTML = '<span aria-hidden="true">🤫</span><span>Shhh</span>';
    if (actions) actions.appendChild(openButton);
    else document.body.appendChild(openButton);
  }

  const panel = document.createElement("section");
  panel.id = "shhhModePanel";
  panel.className = "shhhModePanel";
  panel.hidden = true;
  panel.setAttribute("aria-labelledby", "shhhModeTitle");
  panel.innerHTML = `
    <div class="shhhModeCard">
      <header>
        <div>
          <span class="shhhModeIcon" aria-hidden="true">🤫</span>
          <div>
            <h3 id="shhhModeTitle">Shhh Mode</h3>
            <p>Desktop-only classroom noise monitor.</p>
          </div>
        </div>
        <button id="shhhModeClose" type="button" aria-label="Close Shhh Mode">&times;</button>
      </header>

      <div class="shhhModeScrollable">
        <div id="shhhModeDesktopOnly" class="shhhModeNotice" hidden>
          Shhh Mode is available on desktop/laptop only.
        </div>

      <div class="shhhModeStatus">
        <strong id="shhhModeStatusText">Off</strong>
        <span id="shhhModeStatusHint">Turn on to monitor classroom noise level.</span>
      </div>

      <div class="shhhModeMeter" aria-hidden="true">
        <span id="shhhModeMeterFill"></span>
      </div>

      <div class="shhhModeCounts" aria-label="Shhh count">
        <article>
          <span>Auto Shhh</span>
          <strong id="shhhModeAutoCount">0</strong>
        </article>
        <article>
          <span>Total Played</span>
          <strong id="shhhModeTotalCount">0</strong>
        </article>
        <button id="shhhModeResetCount" type="button">Reset Count</button>
        <small id="shhhModeTodayHint" class="shhhModeTodayHint">Saved for today until Reset Count.</small>
      </div>

      <div class="shhhModeControls">
        <label class="shhhSensitivitySlider">
          Sensitivity
          <input id="shhhModeSensitivity" type="range" min="0" max="100" step="1">
          <div class="shhhSliderLabels">
            <span>Least</span>
            <strong id="shhhSensitivityValue">65%</strong>
            <span>Most</span>
          </div>
        </label>
        <label class="shhhSensitivitySlider">
          Microphone Gain
          <input id="shhhMicGain" type="range" min="0" max="100" value="100">
          <div class="shhhSliderLabels"><span>Low</span><strong id="shhhMicGainValue">100%</strong><span>High</span></div>
        </label>

        <label class="shhhSensitivitySlider">
          Noise Gate
          <input id="shhhNoiseGate" type="range" min="0" max="100" value="20">
          <div class="shhhSliderLabels"><span>Detect More</span><strong id="shhhNoiseGateValue">20%</strong><span>Ignore More</span></div>
        </label>

        <label>
          Cooldown
          <select id="shhhModeCooldown">
            <option value="5000">5 seconds</option>
            <option value="10000">10 seconds</option>
            <option value="20000">20 seconds</option>
          </select>
        </label>
      </div>

      <p class="shhhSensitivityNote">
        Mic Gain 0 or Sensitivity 0 = OFF. For strong webcam: lower Gain + slide Noise Gate right.
      </p>

      <label class="shhhModeMuteRow">
        <input id="shhhModeMute" type="checkbox">
        <span>
          <strong>Mute Shhh Sound</strong>
          <small>Counts noise triggers without playing sound.</small>
        </span>
      </label>

      <label class="shhhModeVoiceRow">
        <input id="shhhModeVoice" type="checkbox" checked>
        <span>
          <strong>Be Quiet Voice</strong>
          <small>Speaks random English classroom reminders.</small>
        </span>
      </label>

      <div class="shhhVoiceOptions">
        <label class="shhhRandomVoiceMini">
          <input id="shhhRandomVoice" type="checkbox" checked>
          <span>Random English voice</span>
        </label>
      </div>

      <label class="shhhModeVisualRow">
        <input id="shhhModeVisual" type="checkbox" checked>
        <span>
          <strong>Visual Shhh Alert</strong>
          <small>Shows moving 🤫 SHHH! alert in the center.</small>
        </span>
      </label>

      <label class="shhhModeHeaderCountRow">
        <input id="shhhModeHeaderCount" type="checkbox" checked>
        <span>
          <strong>Desktop Header Count</strong>
          <small>Shows today's Shhh number above the heart on desktop only.</small>
        </span>
      </label>

      <div class="shhhModeActions">
        <button id="shhhModeToggle" type="button">Turn On</button>
        <button id="shhhModeTest" type="button">Test Shhh</button>
      </div>

        <p class="shhhModePrivacy">
          No voice is recorded. It only reads loudness level from the microphone.
        </p>
      </div>
    </div>`;

  document.body.appendChild(panel);
  createShhhVisualAlert();
  forceShhhSensitivitySlider();

  openButton.addEventListener("click", openShhhModePanel);
  openButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openShhhModePanel();
    }
  });
  panel.querySelector("#shhhModeClose")?.addEventListener("click", closeShhhModePanel);
  panel.querySelector("#shhhModeToggle")?.addEventListener("click", toggleShhhMode);
  panel.querySelector("#shhhModeTest")?.addEventListener("click", () => handleShhhTrigger(true));
  panel.querySelector("#shhhModeResetCount")?.addEventListener("click", resetShhhCounts);
  panel.querySelector("#shhhModeMute")?.addEventListener("change", (event) => {
    shhhMode.muted = Boolean(event.target.checked);
    saveShhhModeSettings();
    updateShhhModeUi(shhhMode.muted ? "Sound muted" : "Sound on");
  });
  panel.querySelector("#shhhModeVoice")?.addEventListener("change", (event) => {
    shhhMode.voiceEnabled = Boolean(event.target.checked);
    saveShhhModeSettings();
    updateShhhModeUi(shhhMode.voiceEnabled ? "Voice on" : "Voice off");
  });
  panel.querySelector("#shhhRandomVoice")?.addEventListener("change", (event) => {
    shhhMode.randomVoiceEnabled = Boolean(event.target.checked);
    saveShhhModeSettings();
    updateShhhModeUi(shhhMode.randomVoiceEnabled ? "Random voice on" : "Random voice off");
  });
  panel.querySelector("#shhhModeVisual")?.addEventListener("change", (event) => {
    shhhMode.visualEnabled = Boolean(event.target.checked);
    saveShhhModeSettings();
    updateShhhModeUi(shhhMode.visualEnabled ? "Visual alert on" : "Visual alert off");
  });
  panel.querySelector("#shhhModeHeaderCount")?.addEventListener("change", (event) => {
    shhhMode.showHeaderCount = Boolean(event.target.checked);
    saveShhhModeSettings();
    updateShhhModeUi(shhhMode.showHeaderCount ? "Desktop header count shown" : "Desktop header count hidden");
  });
  panel.querySelector("#shhhModeSensitivity")?.addEventListener("input", (event) => {
    shhhMode.sensitivityLevel = Math.max(0, Math.min(100, Number(event.target.value) || 0));
    saveShhhModeSettings();
    updateShhhModeUi();
  });

  panel.querySelector("#shhhMicGain")?.addEventListener("input", (event) => {
    shhhMode.micGainLevel = Math.max(0, Math.min(100, Number(event.target.value) || 0));
    saveShhhModeSettings();
    updateShhhModeUi();
  });

  panel.querySelector("#shhhNoiseGate")?.addEventListener("input", (event) => {
    shhhMode.noiseGateLevel = Math.max(0, Math.min(100, Number(event.target.value) || 0));
    saveShhhModeSettings();
    updateShhhModeUi();
  });
  panel.querySelector("#shhhModeCooldown")?.addEventListener("change", (event) => {
    shhhMode.cooldownMs = Number(event.target.value) || 10000;
    saveShhhModeSettings();
    updateShhhModeUi();
  });
}


function forceShhhSensitivitySlider() {
  const field = document.getElementById("shhhModeSensitivity");
  if (!field) return;

  if (field.tagName === "SELECT") {
    const oldValue = field.value;
    const label = field.closest("label");
    if (!label) return;

    let level = SHHH_SENSITIVITY_DEFAULT;
    if (oldValue === "high") level = 90;
    else if (oldValue === "medium") level = 65;
    else if (oldValue === "low") level = 35;

    label.className = "shhhSensitivitySlider";
    label.innerHTML = `
      Sensitivity
      <input id="shhhModeSensitivity" type="range" min="0" max="100" step="1" value="${level}">
      <div class="shhhSliderLabels">
        <span>Least</span>
        <strong id="shhhSensitivityValue">${level}%</strong>
        <span>Most</span>
      </div>
    `;
    shhhMode.sensitivityLevel = level;
  }

  const slider = document.getElementById("shhhModeSensitivity");
  if (slider && slider.type === "range" && !slider.dataset.boundSlider) {
    slider.dataset.boundSlider = "true";
    slider.addEventListener("input", (event) => {
      shhhMode.sensitivityLevel = Math.max(0, Math.min(100, Number(event.target.value) || 0));
      saveShhhModeSettings();
      updateShhhModeUi();
    });
  }
}


function getShhhLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readShhhDailyCountsStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHHH_MODE_DAILY_COUNTS_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeShhhDailyCountsStore(store) {
  try {
    localStorage.setItem(SHHH_MODE_DAILY_COUNTS_KEY, JSON.stringify(store || {}));
  } catch (error) {
    // Daily count history is helpful, but Shhh Mode must still work without storage.
  }
}

function sanitizeShhhDailyCounts(value, dayKey = getShhhLocalDayKey()) {
  const record = value && typeof value === "object" ? value : {};
  const events = Array.isArray(record.events) ? record.events.slice(-SHHH_DAILY_HISTORY_LIMIT) : [];
  return {
    dateKey: String(record.dateKey || dayKey),
    autoCount: Math.max(0, Number(record.autoCount) || 0),
    totalCount: Math.max(0, Number(record.totalCount) || 0),
    events,
    updatedAt: String(record.updatedAt || ""),
    resetAt: String(record.resetAt || "")
  };
}

function pruneShhhDailyCountsStore(store) {
  const nextStore = store && typeof store === "object" ? { ...store } : {};
  const dayKeys = Object.keys(nextStore).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort();
  while (dayKeys.length > 45) {
    const key = dayKeys.shift();
    if (key) delete nextStore[key];
  }
  return nextStore;
}

function getLegacyShhhCounts(savedSettings = null) {
  try {
    const saved = savedSettings && typeof savedSettings === "object"
      ? savedSettings
      : JSON.parse(localStorage.getItem(SHHH_MODE_STORAGE_KEY) || "{}");
    return {
      autoCount: Math.max(0, Number(saved.autoCount) || 0),
      totalCount: Math.max(0, Number(saved.totalCount) || 0)
    };
  } catch (error) {
    return { autoCount: 0, totalCount: 0 };
  }
}

function restoreShhhDailyCounts(savedSettings = null) {
  const todayKey = getShhhLocalDayKey();
  const store = readShhhDailyCountsStore();
  const hasToday = Object.prototype.hasOwnProperty.call(store, todayKey);
  let todayCounts = hasToday ? sanitizeShhhDailyCounts(store[todayKey], todayKey) : null;

  // One-time migration from the older settings-only count storage.
  // After migration, refresh/close-open will use the daily record instead of resetting to 0.
  if (!todayCounts && !store.__legacyMigrated) {
    const legacy = getLegacyShhhCounts(savedSettings);
    if (legacy.autoCount > 0 || legacy.totalCount > 0) {
      todayCounts = sanitizeShhhDailyCounts({
        dateKey: todayKey,
        autoCount: legacy.autoCount,
        totalCount: legacy.totalCount,
        events: [{
          time: new Date().toISOString(),
          type: "migrated",
          autoCount: legacy.autoCount,
          totalCount: legacy.totalCount
        }],
        updatedAt: new Date().toISOString()
      }, todayKey);
    }
    store.__legacyMigrated = true;
  }

  if (!todayCounts) todayCounts = sanitizeShhhDailyCounts({}, todayKey);

  shhhMode.autoCount = todayCounts.autoCount;
  shhhMode.totalCount = todayCounts.totalCount;
  store[todayKey] = todayCounts;
  writeShhhDailyCountsStore(pruneShhhDailyCountsStore(store));
  return todayCounts;
}

function saveShhhDailyCounts(reason = "update", manual = false) {
  const todayKey = getShhhLocalDayKey();
  const nowIso = new Date().toISOString();
  const store = readShhhDailyCountsStore();
  const todayCounts = sanitizeShhhDailyCounts(store[todayKey], todayKey);

  todayCounts.autoCount = Math.max(0, Number(shhhMode.autoCount) || 0);
  todayCounts.totalCount = Math.max(0, Number(shhhMode.totalCount) || 0);
  todayCounts.updatedAt = nowIso;

  if (reason === "trigger") {
    todayCounts.events.push({
      time: nowIso,
      type: manual ? "manual-test" : "auto-shhh",
      autoCount: todayCounts.autoCount,
      totalCount: todayCounts.totalCount
    });
    todayCounts.events = todayCounts.events.slice(-SHHH_DAILY_HISTORY_LIMIT);
  }

  if (reason === "reset") {
    todayCounts.events = [];
    todayCounts.resetAt = nowIso;
  }

  store.__legacyMigrated = true;
  store[todayKey] = todayCounts;
  writeShhhDailyCountsStore(pruneShhhDailyCountsStore(store));
  return todayCounts;
}

function syncShhhDailyCountsFromStorage() {
  const todayCounts = restoreShhhDailyCounts();
  updateShhhModeUi();
  return todayCounts;
}


function restoreShhhModeSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHHH_MODE_STORAGE_KEY) || "{}");
    shhhMode.sensitivityLevel = Number.isFinite(Number(saved.sensitivityLevel))
      ? Number(saved.sensitivityLevel)
      : SHHH_SENSITIVITY_DEFAULT;
    if ([5000, 10000, 20000].includes(Number(saved.cooldownMs))) {
      shhhMode.cooldownMs = Number(saved.cooldownMs);
    }
    restoreShhhDailyCounts(saved);
    shhhMode.muted = Boolean(saved.muted);
    shhhMode.voiceEnabled = typeof saved.voiceEnabled === "boolean" ? saved.voiceEnabled : true;
    shhhMode.randomVoiceEnabled = typeof saved.randomVoiceEnabled === "boolean" ? saved.randomVoiceEnabled : true;
    shhhMode.visualEnabled = typeof saved.visualEnabled === "boolean" ? saved.visualEnabled : true;
    shhhMode.showHeaderCount = typeof saved.showHeaderCount === "boolean" ? saved.showHeaderCount : true;
    shhhMode.micGainLevel = Math.max(0, Math.min(100, Number(saved.micGainLevel ?? 100)));
    shhhMode.noiseGateLevel = Math.max(0, Math.min(100, Number(saved.noiseGateLevel ?? 20)));
  } catch (error) {
    // Settings are optional.
  }
  forceShhhSensitivitySlider();
  const sensitivity = document.getElementById("shhhModeSensitivity");
  const cooldown = document.getElementById("shhhModeCooldown");
  const mute = document.getElementById("shhhModeMute");
  const voice = document.getElementById("shhhModeVoice");
  const randomVoice = document.getElementById("shhhRandomVoice");
  const visual = document.getElementById("shhhModeVisual");
  const headerCount = document.getElementById("shhhModeHeaderCount");
  const micGain = document.getElementById("shhhMicGain");
  const micGainValue = document.getElementById("shhhMicGainValue");
  const noiseGate = document.getElementById("shhhNoiseGate");
  const noiseGateValue = document.getElementById("shhhNoiseGateValue");
  if (sensitivity) sensitivity.value = String(shhhMode.sensitivityLevel);
  if (micGain) micGain.value = String(shhhMode.micGainLevel);
  if (micGainValue) micGainValue.textContent = `${Math.round(shhhMode.micGainLevel)}%`;
  if (noiseGate) noiseGate.value = String(shhhMode.noiseGateLevel);
  if (noiseGateValue) noiseGateValue.textContent = `${Math.round(shhhMode.noiseGateLevel)}%`;
  if (cooldown) cooldown.value = String(shhhMode.cooldownMs);
  if (mute) mute.checked = Boolean(shhhMode.muted);
  if (voice) voice.checked = Boolean(shhhMode.voiceEnabled);
  if (randomVoice) randomVoice.checked = Boolean(shhhMode.randomVoiceEnabled);
  if (visual) visual.checked = Boolean(shhhMode.visualEnabled);
  if (headerCount) headerCount.checked = shhhMode.showHeaderCount !== false;
  updateShhhModeUi();
}

function saveShhhModeSettings() {
  try {
    localStorage.setItem(SHHH_MODE_STORAGE_KEY, JSON.stringify({
      sensitivityLevel: shhhMode.sensitivityLevel,
      cooldownMs: shhhMode.cooldownMs,
      muted: Boolean(shhhMode.muted),
      voiceEnabled: Boolean(shhhMode.voiceEnabled),
          randomVoiceEnabled: Boolean(shhhMode.randomVoiceEnabled),
      visualEnabled: Boolean(shhhMode.visualEnabled),
      showHeaderCount: shhhMode.showHeaderCount !== false,
      micGainLevel: shhhMode.micGainLevel,
      noiseGateLevel: shhhMode.noiseGateLevel,
      autoCount: Math.max(0, Number(shhhMode.autoCount) || 0),
      totalCount: Math.max(0, Number(shhhMode.totalCount) || 0)
    }));
  } catch (error) {
    // Settings are optional.
  }
}

function syncShhhModeAvailability() {
  const available = isShhhModeDesktopAvailable();
  shhhMode.available = available;
  document.documentElement.classList.toggle("shhh-mode-desktop-ready", available);
  const openButton = document.getElementById("shhhModeOpen");
  const desktopOnly = document.getElementById("shhhModeDesktopOnly");
  if (openButton) {
    if (openButton.dataset.shhhFallback === "true") openButton.hidden = !available;
    openButton.classList.toggle("is-unavailable", !available);
    openButton.setAttribute("aria-disabled", String(!available));
  }
  if (desktopOnly) desktopOnly.hidden = available;
  if (!available && shhhMode.enabled) stopShhhMode();
  updateShhhModeUi();
  updateShhhDesktopHeaderCountBadge();
}

function openShhhModePanel() {
  const panel = document.getElementById("shhhModePanel");
  if (!panel) return;
  shhhMode.panelOpen = true;
  panel.hidden = false;
  updateShhhModeUi();
}

function closeShhhModePanel() {
  const panel = document.getElementById("shhhModePanel");
  if (!panel) return;
  shhhMode.panelOpen = false;
  panel.hidden = true;
}

async function toggleShhhMode() {
  if (shhhMode.enabled) {
    stopShhhMode();
    return;
  }
  await startShhhMode();
}

async function startShhhMode() {
  if (!isShhhModeDesktopAvailable()) {
    showSoundAlert("Shhh Mode is available on desktop/laptop only.");
    syncShhhModeAvailability();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is not supported.");

    const context = shhhMode.audioContext || new AudioContextClass();
    if (context.state === "suspended") await context.resume();

    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.72;

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    shhhMode.stream = stream;
    shhhMode.audioContext = context;
    shhhMode.analyser = analyser;
    shhhMode.source = source;
    shhhMode.samples = new Uint8Array(analyser.fftSize);
    shhhMode.enabled = true;
    shhhMode.loudSince = 0;
    shhhMode.lastShhhAt = 0;

    updateShhhModeUi("Listening...");
    monitorShhhNoise();
  } catch (error) {
    stopShhhMode();
    showSoundAlert("Microphone permission is needed for Shhh Mode.");
    updateShhhModeUi("Mic blocked");
  }
}

function stopShhhMode() {
  if (shhhMode.animationId) {
    cancelAnimationFrame(shhhMode.animationId);
    shhhMode.animationId = 0;
  }
  if (shhhMode.source) {
    try { shhhMode.source.disconnect(); } catch (error) {}
  }
  if (shhhMode.stream) {
    shhhMode.stream.getTracks().forEach((track) => track.stop());
  }

  shhhMode.enabled = false;
  shhhMode.stream = null;
  shhhMode.analyser = null;
  shhhMode.source = null;
  shhhMode.samples = null;
  shhhMode.level = 0;
  shhhMode.loudSince = 0;
  updateShhhModeUi("Off");
}

function monitorShhhNoise() {
  if (!shhhMode.enabled || !shhhMode.analyser || !shhhMode.samples) return;

  shhhMode.analyser.getByteTimeDomainData(shhhMode.samples);
  let sum = 0;
  for (let index = 0; index < shhhMode.samples.length; index += 1) {
    const value = (shhhMode.samples[index] - 128) / 128;
    sum += value * value;
  }

  const rawRms = Math.sqrt(sum / shhhMode.samples.length);
  const micGainPercent = Math.max(0, Math.min(100, Number(shhhMode.micGainLevel) || 0));
  const sensitivityPercent = Math.max(0, Math.min(100, Number(shhhMode.sensitivityLevel) || 0));
  const noiseGatePercent = Math.max(0, Math.min(100, Number(shhhMode.noiseGateLevel) || 0));

  // HARD RULES:
  // Sensitivity 0 = OFF for triggering.
  // Mic Gain 0 = OFF for triggering.
  const detectionAllowed = micGainPercent > 0 && sensitivityPercent > 0;

  const gainMultiplier = micGainPercent / 100;
  const adjustedRms = rawRms * gainMultiplier;
  shhhMode.level = Math.min(1, adjustedRms * 5.2);

  // Lower sensitivity = needs much stronger sound.
  // Higher sensitivity = triggers easier.
  const sensitivityThreshold = 0.240 - (sensitivityPercent / 100) * 0.230;

  // Higher noise gate = ignore more weak/background sound.
  const gateThreshold = Math.pow(noiseGatePercent / 100, 1.35) * 0.260;

  // Both settings matter together.
  const finalThreshold = sensitivityThreshold + gateThreshold;

  const now = Date.now();
  const isLoud = detectionAllowed && adjustedRms >= finalThreshold;

  if (isLoud) {
    if (!shhhMode.loudSince) shhhMode.loudSince = now;
    if (now - shhhMode.loudSince > 280 && now - shhhMode.lastShhhAt > shhhMode.cooldownMs) {
      shhhMode.lastShhhAt = now;
      handleShhhTrigger(false);
    }
  } else {
    shhhMode.loudSince = 0;
  }

  updateShhhModeUi(isLoud ? "Too loud" : shhhMode.level > 0.32 ? "Getting loud" : "Quiet");
  shhhMode.animationId = requestAnimationFrame(monitorShhhNoise);
}

function createShhhVisualAlert() {
  if (document.getElementById("shhhVisualAlert")) return;
  const visual = document.createElement("div");
  visual.id = "shhhVisualAlert";
  visual.className = "shhhVisualAlert";
  visual.setAttribute("aria-hidden", "true");
  visual.innerHTML = `
    <div class="shhhVisualBackdrop"></div>
    <div class="shhhVisualGlow"></div>
    <div class="shhhVisualRing shhhVisualRingOne"></div>
    <div class="shhhVisualRing shhhVisualRingTwo"></div>
    <div class="shhhVisualRing shhhVisualRingThree"></div>
    <div class="shhhVisualSpark shhhVisualSparkOne">✨</div>
    <div class="shhhVisualSpark shhhVisualSparkTwo">✨</div>
    <div class="shhhVisualSpark shhhVisualSparkThree">💫</div>
    <div class="shhhVisualChip shhhVisualChipLeft">shhh</div>
    <div class="shhhVisualChip shhhVisualChipRight">quiet</div>
    <div class="shhhVisualCard">
      <div class="shhhVisualTopline">Noise detected</div>
      <span class="shhhVisualEmoji">🤫</span>
      <strong class="shhhVisualMainText">SHHHHH!</strong>
      <small class="shhhVisualSubtext">Be quiet, please.</small>
      <div class="shhhVisualBars" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;
  document.body.appendChild(visual);
}

function showShhhVisualAlert(manual = false) {
  if (!shhhMode.visualEnabled) return;
  createShhhVisualAlert();
  const visual = document.getElementById("shhhVisualAlert");
  if (!visual) return;

  const mainText = visual.querySelector(".shhhVisualMainText");
  const subText = visual.querySelector(".shhhVisualSubtext");
  const topLine = visual.querySelector(".shhhVisualTopline");
  if (mainText) mainText.textContent = manual ? "SHHHH!" : "SHHHHHH!";
  if (subText) subText.textContent = manual ? "Quiet test alert." : "Be quiet, please.";
  if (topLine) topLine.textContent = manual ? "Test alert" : "Noise detected";

  visual.classList.remove("is-showing", "is-manual");
  void visual.offsetWidth;
  visual.classList.toggle("is-manual", Boolean(manual));
  visual.classList.add("is-showing");

  window.clearTimeout(visual._hideTimer);
  const visualDuration = manual ? 3400 : 4800;
  visual.style.setProperty("--shhh-alert-duration", `${visualDuration}ms`);
  visual.style.setProperty("--shhh-loop-duration", `${Math.max(900, Math.round(visualDuration * 0.32))}ms`);
  visual._hideTimer = window.setTimeout(() => {
    visual.classList.remove("is-showing", "is-manual");
  }, visualDuration);
}


function handleShhhTrigger(manual = false) {
  showShhhVisualAlert(manual);
  if (shhhMode.muted) {
    recordShhhPlayed(manual);
    const message = manual
      ? "Shhh test counted. Sound and voice are muted."
      : "Auto Shhh counted. Sound and voice are muted.";
    updateShhhModeUi(manual ? "Muted test counted" : "Muted auto count");
    if (manual) showSoundAlert(message);
    return;
  }
  playShhhSound(manual);
}

async function playShhhSound(manual = false) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = shhhMode.audioContext || new AudioContextClass();
    shhhMode.audioContext = context;
    if (context.state === "suspended") await context.resume();

    const duration = manual ? 3.4 : 4.8;
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      const fadeIn = Math.min(1, t / 0.12);
      const fadeOut = Math.min(1, (1 - t) / 0.58);
      const shimmer = 0.86 + Math.sin(t * Math.PI * 8) * 0.10;
      const envelope = Math.max(0, Math.min(fadeIn, fadeOut)) * shimmer;
      data[i] = (Math.random() * 2 - 1) * 0.46 * envelope;
    }

    const source = context.createBufferSource();
    const highpass = context.createBiquadFilter();
    const bandpass = context.createBiquadFilter();
    const lowpass = context.createBiquadFilter();
    const gain = context.createGain();

    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(1700, context.currentTime);
    highpass.frequency.linearRampToValueAtTime(1300, context.currentTime + duration);

    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(5200, context.currentTime);
    bandpass.frequency.linearRampToValueAtTime(3800, context.currentTime + duration);
    bandpass.Q.value = 0.92;

    lowpass.type = "lowpass";
    lowpass.frequency.value = 7600;

    const baseGain = manual ? 0.52 : 0.62;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(baseGain, context.currentTime + 0.18);
    gain.gain.linearRampToValueAtTime(baseGain * 0.92, context.currentTime + duration * 0.65);
    gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + duration);

    source.buffer = buffer;
    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.stop(context.currentTime + duration + 0.02);
    recordShhhPlayed(manual);
    scheduleBeQuietVoice(manual, duration);

    if (manual) showSoundAlert(shhhMode.voiceEnabled ? "Long shhh + Be quiet voice test played." : "Long shhh sound test played.");
  } catch (error) {
    showSoundAlert("Shhh sound could not play in this browser.");
  }
}

function scheduleBeQuietVoice(manual = false, shhhDuration = 0) {
  if (!shhhMode.voiceEnabled || shhhMode.muted) return;
  const baseDelay = manual ? 380 : 520;
  const delay = Math.max(baseDelay, Math.round((shhhDuration || 0) * 1000) - (manual ? 420 : 520));
  window.setTimeout(() => speakBeQuietVoice(manual), delay);
}

function getAvailableShhhVoices() {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return [];
  const englishVoices = voices.filter((voice) => /^en/i.test(voice.lang || ""));
  return englishVoices.length ? englishVoices : voices;
}

function pickShhhVoice() {
  const voices = getAvailableShhhVoices();
  if (!voices.length) return null;

  if (shhhMode.randomVoiceEnabled) {
    return voices[Math.floor(Math.random() * voices.length)] || voices[0] || null;
  }

  const preferredPatterns = [
    /Samantha/i,
    /Google US English/i,
    /Microsoft Aria/i,
    /Microsoft Jenny/i,
    /Google UK English Female/i,
    /Zira/i,
    /Female/i
  ];

  for (const pattern of preferredPatterns) {
    const match = voices.find((voice) => pattern.test(`${voice.name} ${voice.voiceURI}`));
    if (match) return match;
  }

  return voices[0] || null;
}

function getShhhVoicePhrase() {
  const phrases = [
    "Be quiet, please.",
    "Class, quiet please.",
    "Please lower your voice.",
    "Quiet down, please.",
    "Let's keep the classroom quiet.",
    "Silent please.",
    "Silence please.",
    "Keep your voices low.",
    "Lower your volume, please.",
    "Inside voices, please.",
    "Settle down, class.",
    "Eyes front, voices down.",
    "Quiet mode, please.",
    "Please listen quietly.",
    "Less talking, more listening.",
    "Class, let's be quiet.",
    "Kindly lower your voice.",
    "Quiet please, everyone.",
    "Let's stay calm and quiet.",
    "Shhh, quiet please.",
    "Zip your lips for a moment.",
    "Volume down, class.",
    "Tiny voices only.",
    "Mute mode, please.",
    "The classroom is too loud.",
    "Let's press the quiet button.",
    "Quiet powers, activate.",
    "Mouth closed, ears open.",
    "Concert mode off, please.",
    "Pause the talking, please.",
    "Soft voices, everyone.",
    "Whisper mode, class.",
    "Let's turn the volume down.",
    "Quiet button activated.",
    "Listening mode, please.",
    "Less noise, more focus.",
    "Class, calm and quiet.",
    "Voices down, eyes front.",
    "Shhh, soft voices please.",
    "Quiet team, let's go."
  ];

  return {
    text: phrases[Math.floor(Math.random() * phrases.length)] || "Be quiet, please.",
    lang: "en-US"
  };
}

function speakBeQuietVoice(manual = false) {
  try {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const phrase = getShhhVoicePhrase();
    const utterance = new SpeechSynthesisUtterance(phrase.text);
    utterance.lang = "en-US";
    utterance.rate = manual ? 0.82 : 0.76;
    utterance.pitch = shhhMode.randomVoiceEnabled ? 0.92 + Math.random() * 0.24 : 1.02;
    utterance.volume = 1;

    const selectedVoice = pickShhhVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      if (selectedVoice.lang && /^en/i.test(selectedVoice.lang)) utterance.lang = selectedVoice.lang;
    }

    synth.speak(utterance);
  } catch (error) {
    // Voice is optional; shhh sound still works.
  }
}

function recordShhhPlayed(manual = false) {
  // Keep today's Shhh count/history alive across refresh, close-open, and installed app reloads.
  // A new browser session must continue the same daily count until Reset Count is clicked.
  restoreShhhDailyCounts();
  shhhMode.totalCount = Math.max(0, Number(shhhMode.totalCount) || 0) + 1;
  if (!manual) {
    shhhMode.autoCount = Math.max(0, Number(shhhMode.autoCount) || 0) + 1;
  }
  saveShhhDailyCounts("trigger", manual);
  saveShhhModeSettings();
  updateShhhModeUi();
}

function resetShhhCounts() {
  shhhMode.autoCount = 0;
  shhhMode.totalCount = 0;
  saveShhhDailyCounts("reset");
  saveShhhModeSettings();
  updateShhhModeUi("Count reset");
  showSoundAlert("Today's Shhh count reset.");
}

function updateQuoteNoiseMeter(statusOverride = "") {
  const widget = document.getElementById("quoteNoiseWidget");
  const state = document.getElementById("quoteNoiseState");
  const bars = Array.from(document.querySelectorAll("#quoteNoiseBars span"));
  if (!widget || !state || !bars.length) return;

  const level = Math.max(0, Math.min(1, Number(shhhMode.level) || 0));
  const activeCount = shhhMode.enabled ? Math.round(level * bars.length) : 0;

  widget.classList.toggle("is-live", shhhMode.enabled);
  widget.classList.toggle("is-muted", Boolean(shhhMode.muted));
  widget.classList.toggle("is-off", !shhhMode.enabled);

  let stateText = "Idle";
  if (!shhhMode.available) {
    stateText = "Desktop only";
  } else if (!shhhMode.enabled) {
    stateText = "Ready";
  } else if (statusOverride && !/muted test counted/i.test(statusOverride) && !/muted auto count/i.test(statusOverride)) {
    stateText = statusOverride;
  } else if (level >= 0.65) {
    stateText = "Loud";
  } else if (level >= 0.30) {
    stateText = "Active";
  } else {
    stateText = "Quiet";
  }
  state.textContent = stateText;

  bars.forEach((bar, index) => {
    const isActive = shhhMode.enabled && index < activeCount;
    bar.classList.toggle("is-active", isActive);
  });
}

function updateShhhModeUi(statusOverride = "") {
  const openButton = document.getElementById("shhhModeOpen");
  const status = document.getElementById("shhhModeStatusText");
  const hint = document.getElementById("shhhModeStatusHint");
  const fill = document.getElementById("shhhModeMeterFill");
  const toggle = document.getElementById("shhhModeToggle");
  const panel = document.getElementById("shhhModePanel");
  const autoCount = document.getElementById("shhhModeAutoCount");
  const totalCount = document.getElementById("shhhModeTotalCount");
  const todayHint = document.getElementById("shhhModeTodayHint");
  const mute = document.getElementById("shhhModeMute");
  const voice = document.getElementById("shhhModeVoice");
  const randomVoice = document.getElementById("shhhRandomVoice");
  const visual = document.getElementById("shhhModeVisual");
  const headerCount = document.getElementById("shhhModeHeaderCount");
  const testButton = document.getElementById("shhhModeTest");
  const micGain = document.getElementById("shhhMicGain");
  const micGainValue = document.getElementById("shhhMicGainValue");
  const noiseGate = document.getElementById("shhhNoiseGate");
  const noiseGateValue = document.getElementById("shhhNoiseGateValue");

  if (openButton) {
    openButton.classList.toggle("is-active", shhhMode.enabled);
    openButton.title = shhhMode.enabled ? "Shhh Mode is ON" : "Desktop Shhh Mode";
  }
  if (panel) {
    panel.classList.toggle("is-active", shhhMode.enabled);
    panel.classList.toggle("is-unavailable", !shhhMode.available);
  }
  if (status) {
    status.textContent = statusOverride || (shhhMode.enabled ? "Listening..." : "Off");
  }
  if (hint) {
    if (!shhhMode.available) {
      hint.textContent = "Desktop/laptop only. Not available on phone or tablet.";
    } else if (shhhMode.enabled && shhhMode.muted) {
      hint.textContent = "Listening and counting noise triggers. Shhh sound is muted.";
    } else if (shhhMode.enabled && shhhMode.voiceEnabled) {
      hint.textContent = "Listening to loudness only. Plays shhh then says “Be quiet” when triggered.";
    } else if (shhhMode.enabled) {
      hint.textContent = "Listening to loudness only. No voice is recorded.";
    } else if (shhhMode.muted) {
      hint.textContent = "Muted mode is on. Counts will still increase when triggered.";
    } else {
      hint.textContent = "Turn on to monitor classroom noise level.";
    }
  }
  if (fill) {
    fill.style.width = `${Math.round(Math.min(1, shhhMode.level) * 100)}%`;
  }
  updateQuoteNoiseMeter(statusOverride);
  if (autoCount) {
    autoCount.textContent = String(Math.max(0, Number(shhhMode.autoCount) || 0));
  }
  if (totalCount) {
    totalCount.textContent = String(Math.max(0, Number(shhhMode.totalCount) || 0));
  }
  if (todayHint) {
    todayHint.textContent = `Saved for ${getShhhLocalDayKey()} until Reset Count.`;
  }
  if (mute) {
    mute.checked = Boolean(shhhMode.muted);
  }
  if (voice) {
    voice.checked = Boolean(shhhMode.voiceEnabled);
    voice.disabled = Boolean(shhhMode.muted);
  }
  if (randomVoice) {
    randomVoice.checked = Boolean(shhhMode.randomVoiceEnabled);
    randomVoice.disabled = Boolean(shhhMode.muted) || !shhhMode.voiceEnabled;
  }
  if (visual) {
    visual.checked = Boolean(shhhMode.visualEnabled);
  }
  if (headerCount) {
    headerCount.checked = shhhMode.showHeaderCount !== false;
  }
  updateShhhDesktopHeaderCountBadge();
  if (testButton) {
    testButton.textContent = shhhMode.muted ? "Count Test" : "Test Shhh";
  }
  const sensitivity = document.getElementById("shhhModeSensitivity");
  const sensitivityValue = document.getElementById("shhhSensitivityValue");
  if (sensitivity) sensitivity.value = String(shhhMode.sensitivityLevel);
  if (sensitivityValue) {
    sensitivityValue.textContent = `${Math.round(shhhMode.sensitivityLevel)}%`;
  }
  if (micGain) {
    micGain.value = String(Math.round(shhhMode.micGainLevel));
  }
  if (micGainValue) {
    micGainValue.textContent = `${Math.round(shhhMode.micGainLevel)}%`;
  }
  if (noiseGate) {
    noiseGate.value = String(Math.round(shhhMode.noiseGateLevel));
  }
  if (noiseGateValue) {
    noiseGateValue.textContent = `${Math.round(shhhMode.noiseGateLevel)}%`;
  }
  if (toggle) {
    toggle.textContent = shhhMode.enabled ? "Turn Off" : "Turn On";
    toggle.disabled = !shhhMode.available;
  }
}


initClassBoard();

/* =========================================================
   v16 GC + TIME CAPSULE QUICK BUTTON FALLBACK
   Recreates the adviser header buttons if a previous deploy/cache removed them.
========================================================= */
(function ensureSfkQuickAccessButtons() {
  function ensureButtons() {
    const header = document.querySelector('.adviserReminderHeader')
      || document.querySelector('#reminderList')?.previousElementSibling;
    if (!header) return;

    let actions = header.querySelector('.adviserHeaderActions')
      || document.querySelector('.adviserHeaderActions');

    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'adviserHeaderActions';
      header.appendChild(actions);
    }

    if (!document.getElementById('timeCapsuleOpen')) {
      const capsuleButton = document.createElement('button');
      capsuleButton.id = 'timeCapsuleOpen';
      capsuleButton.className = 'timeCapsuleOpen';
      capsuleButton.type = 'button';
      capsuleButton.setAttribute('aria-label', 'Open SFK Time Capsule');
      capsuleButton.title = 'SFK Time Capsule';
      capsuleButton.innerHTML = '<span aria-hidden="true">&#9829;</span><i aria-hidden="true"></i>';
      actions.appendChild(capsuleButton);
    }

    if (!document.getElementById('classChatOpen')) {
      const chatButton = document.createElement('button');
      chatButton.id = 'classChatOpen';
      chatButton.className = 'classChatOpen';
      chatButton.type = 'button';
      chatButton.setAttribute('aria-label', 'Open class group chat');
      chatButton.title = 'Class group chat';
      chatButton.innerHTML = '<span class="classChatGlyph" aria-hidden="true"></span><span id="classChatUnread" class="classChatUnread" hidden>0</span>';
      actions.appendChild(chatButton);
    }
  }

  ensureButtons();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButtons, { once: true });
  } else {
    window.setTimeout(ensureButtons, 0);
  }
  window.addEventListener('load', ensureButtons, { once: true });
})();


/* v206: start rotating heading on desktop and phone. */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startSfkHeadingRotation, { once: true });
} else {
  startSfkHeadingRotation();
}

/* =========================================================
   v294 PHONE-ONLY HEADER ROTATOR: TIME <-> DAILY QUOTE
   - fixed header row height; both cards share the same wide slot
   - time shows first, then quote, with a soft cross-slide transition
   - quote auto-fits inside the fixed card instead of increasing header height
========================================================= */
(function initSfkMobileHeaderRotator() {
  const PHONE_QUERY = "(max-width: 700px)";
  const TIME_VISIBLE_MS = 9000;
  const QUOTE_VISIBLE_MS = 9000;
  const mq = window.matchMedia ? window.matchMedia(PHONE_QUERY) : null;

  let timer = null;
  let showingQuote = false;
  let resizeTimer = null;
  let transitionFitTimer = null;
  let heartMergeTimer = null;
  let heartMergedTimer = null;
  let quoteObserver = null;

  function getEls() {
    return {
      topbar: document.querySelector(".topbar"),
      timeBox: document.querySelector(".timeBox"),
      quoteBox: document.querySelector(".topQuoteBox"),
      quote: document.getElementById("dailyQuote"),
      label: document.querySelector(".topQuoteBox .quoteLabel"),
      author: document.getElementById("quoteAuthor")
    };
  }

  function fitMobileHeaderQuote() {
    if (!mq?.matches) return;

    const { quoteBox, quote, label, author } = getEls();
    if (!quoteBox || !quote) return;

    const boxStyle = window.getComputedStyle(quoteBox);
    const padTop = parseFloat(boxStyle.paddingTop) || 0;
    const padBottom = parseFloat(boxStyle.paddingBottom) || 0;
    const labelHeight = label ? label.getBoundingClientRect().height : 0;
    const authorHeight = author && author.textContent.trim()
      ? author.getBoundingClientRect().height
      : 0;

    // Reserve the label + author lanes and fit only the quote in the middle.
    const available = Math.max(
      16,
      quoteBox.clientHeight - padTop - padBottom - labelHeight - authorHeight - 3
    );

    const MAX_PX = window.innerWidth <= 430 ? 10.5 : 11.5;
    const MIN_PX = 7.5;
    let size = MAX_PX;

    quote.style.setProperty("display", "block", "important");
    quote.style.setProperty("white-space", "normal", "important");
    quote.style.setProperty("overflow", "visible", "important");
    quote.style.setProperty("height", "auto", "important");
    quote.style.setProperty("max-height", "none", "important");
    quote.style.setProperty("line-height", ".98", "important");
    quote.style.setProperty("transform", "none", "important");
    quote.style.setProperty("font-size", `${size}px`, "important");

    while (size > MIN_PX && quote.scrollHeight > available + 0.5) {
      size -= 0.25;
      quote.style.setProperty("font-size", `${size}px`, "important");
    }
  }

  function clearHeartSequenceTimers() {
    clearTimeout(heartMergeTimer);
    clearTimeout(heartMergedTimer);
    heartMergeTimer = null;
    heartMergedTimer = null;
  }

  function setHeartSequenceForPhase(topbar) {
    if (!topbar) return;

    clearHeartSequenceTimers();
    topbar.classList.remove(
      "mobile-heart-cluster",
      "mobile-heart-merging",
      "mobile-heart-merged"
    );

    // During Time mode, give the 43-heart formation enough time to be seen.
    if (!showingQuote) {
      topbar.classList.add("mobile-heart-cluster");

      // 43 small hearts stay visible first, then converge into one heart.
      heartMergeTimer = window.setTimeout(() => {
        if (!mq?.matches || showingQuote) return;
        topbar.classList.remove("mobile-heart-cluster");
        topbar.classList.add("mobile-heart-merging");
      }, 4600);

      // Finish the merge and reveal 43 in the center of the big heart.
      heartMergedTimer = window.setTimeout(() => {
        if (!mq?.matches || showingQuote) return;
        topbar.classList.remove("mobile-heart-merging");
        topbar.classList.add("mobile-heart-merged");
      }, 5600);
    }
  }

  function applyPhase() {
    const { topbar, timeBox, quoteBox } = getEls();
    if (!topbar || !timeBox || !quoteBox) return;

    topbar.classList.add("mobile-header-rotator");
    topbar.classList.toggle("mobile-show-quote", showingQuote);
    topbar.classList.toggle("mobile-show-time", !showingQuote);

    timeBox.setAttribute("aria-hidden", showingQuote ? "true" : "false");
    quoteBox.setAttribute("aria-hidden", showingQuote ? "false" : "true");

    clearTimeout(transitionFitTimer);
    if (showingQuote) {
      // First pass keeps the text stable as the card starts opening.
      requestAnimationFrame(() => requestAnimationFrame(fitMobileHeaderQuote));
      // Final pass runs after the width expansion has finished, so the quote
      // uses the entire wide card instead of staying fitted to the compact width.
      transitionFitTimer = window.setTimeout(fitMobileHeaderQuote, 540);
    }

    setHeartSequenceForPhase(topbar);
  }

  function scheduleNext() {
    clearTimeout(timer);
    if (!mq?.matches) return;

    timer = window.setTimeout(() => {
      showingQuote = !showingQuote;
      applyPhase();
      scheduleNext();
    }, showingQuote ? QUOTE_VISIBLE_MS : TIME_VISIBLE_MS);
  }

  function stopPhoneMode() {
    clearTimeout(timer);
    clearTimeout(transitionFitTimer);
    clearHeartSequenceTimers();
    timer = null;
    transitionFitTimer = null;
    showingQuote = false;

    const { topbar, timeBox, quoteBox, quote } = getEls();
    topbar?.classList.remove(
      "mobile-header-rotator",
      "mobile-show-time",
      "mobile-show-quote",
      "mobile-heart-cluster",
      "mobile-heart-merging",
      "mobile-heart-merged"
    );
    timeBox?.removeAttribute("aria-hidden");
    quoteBox?.removeAttribute("aria-hidden");

    // Do not leave mobile inline fitting behind when returning to desktop.
    if (quote) {
      quote.style.removeProperty("font-size");
      quote.style.removeProperty("line-height");
      quote.style.removeProperty("display");
      quote.style.removeProperty("white-space");
      quote.style.removeProperty("overflow");
      quote.style.removeProperty("height");
      quote.style.removeProperty("max-height");
      quote.style.removeProperty("transform");
    }

    if (typeof fitDesktopQuoteText === "function") {
      requestAnimationFrame(fitDesktopQuoteText);
    }
  }

  function startPhoneMode() {
    if (!mq?.matches) {
      stopPhoneMode();
      return;
    }

    showingQuote = false;
    applyPhase();
    requestAnimationFrame(fitMobileHeaderQuote);
    scheduleNext();
  }

  function setupObserver() {
    const { quote, author } = getEls();
    if (!quote || quoteObserver) return;

    quoteObserver = new MutationObserver(() => {
      if (mq?.matches) requestAnimationFrame(fitMobileHeaderQuote);
    });

    quoteObserver.observe(quote, { childList: true, characterData: true, subtree: true });
    if (author) {
      quoteObserver.observe(author, { childList: true, characterData: true, subtree: true });
    }
  }

  function boot() {
    setupObserver();
    startPhoneMode();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  if (mq) {
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", startPhoneMode);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(startPhoneMode);
    }
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (mq?.matches) {
        fitMobileHeaderQuote();
      }
    }, 120);
  });
})();


/* =========================================================
   v304 PHONE-ONLY 43 HEARTS -> ONE HEART -> QUOTE HEART
   - exact 43 mini hearts form a heart-shaped cluster in Time mode
   - cluster smoothly converges into one large heart with "43" inside
   - Quote mode keeps the single heart and moves it to the title lane
========================================================= */
(function ensureSfkMobileHeaderHeart() {
  const HEART_POSITIONS = [
    [2,0],[3,0],[6,0],[7,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
    [2,5],[3,5],[4,5],[5,5],[6,5],
    [4,6]
  ];

  function buildHeartContents(heart) {
    heart.replaceChildren();

    const cluster = document.createElement('span');
    cluster.className = 'sfkMiniHeartCluster';
    cluster.setAttribute('aria-hidden', 'true');

    const CELL = 8;
    const BASE_LEFT = 7;
    const BASE_TOP = 2;
    const CENTER_X = 43;
    const CENTER_Y = 30;

    HEART_POSITIONS.forEach(([col, row], index) => {
      const mini = document.createElement('i');
      mini.className = 'sfkMiniHeart';
      mini.textContent = '♥';

      const left = BASE_LEFT + (col * CELL);
      const top = BASE_TOP + (row * CELL);
      const tx = CENTER_X - (left + 4);
      const ty = CENTER_Y - (top + 4);

      mini.style.left = `${left}px`;
      mini.style.top = `${top}px`;
      mini.style.setProperty('--sfk-heart-merge-x', `${tx}px`);
      mini.style.setProperty('--sfk-heart-merge-y', `${ty}px`);
      mini.style.setProperty('--sfk-heart-delay', `${(index % 9) * 16}ms`);
      cluster.appendChild(mini);
    });

    const bigHeart = document.createElement('span');
    bigHeart.className = 'sfkBigHeartGlyph';
    bigHeart.textContent = '💛';
    bigHeart.setAttribute('aria-hidden', 'true');

    const count = document.createElement('span');
    count.className = 'sfkHeartCount';
    count.textContent = '43';
    count.setAttribute('aria-hidden', 'true');

    heart.append(cluster, bigHeart, count);
  }

  function ensureHeart() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    let heart = topbar.querySelector('.sfkMobileHeaderHeart');
    if (!heart) {
      heart = document.createElement('span');
      heart.className = 'sfkMobileHeaderHeart';
      heart.setAttribute('aria-hidden', 'true');
      topbar.appendChild(heart);
    }

    if (!heart.querySelector('.sfkMiniHeartCluster')) {
      buildHeartContents(heart);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureHeart, { once: true });
  } else {
    ensureHeart();
  }
})();


/* =========================================================
   v319 MOBILE HEART GEOMETRY — REAL ELEMENT MEASUREMENT
   Avoids device-name / CSS-width guessing. The heart lane is positioned from
   the actual Time card and topbar rectangles on the current phone.
========================================================= */
(function initMeasuredMobileHeartGeometry() {
  const PHONE_MAX = 700;
  let rafId = 0;
  let lastSignature = '';

  function px(value) {
    return `${Math.round(value * 10) / 10}px`;
  }

  function update() {
    rafId = 0;

    const topbar = document.querySelector('.topbar.mobile-header-rotator');
    const timeBox = document.querySelector('.timeBox');
    const heart = topbar?.querySelector('.sfkMobileHeaderHeart');

    if (!topbar || !timeBox || !heart || window.innerWidth > PHONE_MAX) return;

    const bar = topbar.getBoundingClientRect();
    const time = timeBox.getBoundingClientRect();
    if (bar.width < 1 || time.width < 1) return;

    const timeRight = time.right - bar.left;
    const laneStart = timeRight + 6;
    const laneEnd = bar.width - 12;
    const freeLane = Math.max(68, laneEnd - laneStart);
    const stageWidth = Math.max(72, Math.min(82, freeLane));

    /* Center in the remaining lane, then bias a few px LEFT. */
    let timeLeft = laneStart + Math.max(0, (freeLane - stageWidth) / 2) - 8;
    timeLeft = Math.max(timeRight + 1, timeLeft);
    timeLeft = Math.min(bar.width - stageWidth - 12, timeLeft);

    /* Align vertically to the actual Time card, then nudge UP. */
    let timeTop = (time.top - bar.top) + ((time.height - 56) / 2) + 1;
    timeTop = Math.max(38, timeTop);

    /* Quote heart moves farther left as the available header gets wider. */
    const quoteStageWidth = 60;
    const quoteRightGap = Math.max(30, Math.min(48, bar.width * 0.085));
    const quoteLeft = Math.max(
      timeRight + 4,
      bar.width - quoteStageWidth - quoteRightGap
    );
    const quoteTop = -8;

    const signature = [bar.width, timeRight, time.height, timeLeft, timeTop, quoteLeft].map(v => Math.round(v)).join('|');
    if (signature === lastSignature) return;
    lastSignature = signature;

    topbar.style.setProperty('--sfk-measured-time-heart-left', px(timeLeft));
    topbar.style.setProperty('--sfk-measured-time-heart-top', px(timeTop));
    topbar.style.setProperty('--sfk-measured-time-heart-width', px(stageWidth));
    topbar.style.setProperty('--sfk-measured-quote-heart-left', px(quoteLeft));
    topbar.style.setProperty('--sfk-measured-quote-heart-top', px(quoteTop));
  }

  function schedule() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => requestAnimationFrame(update));
  }

  function start() {
    schedule();
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    window.visualViewport?.addEventListener('resize', schedule, { passive: true });

    /* Header classes/width change when Time <-> Quote transitions. */
    const topbar = document.querySelector('.topbar');
    if (topbar && 'MutationObserver' in window) {
      new MutationObserver(schedule).observe(topbar, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    [80, 260, 700, 1400].forEach(delay => window.setTimeout(schedule, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();


/* =========================================================
   v330 ST. FAUSTINA DIGITAL EXHIBIT MODAL
========================================================= */
(function initSfkFaustinaExhibit() {
  let lastFocused = null;

  function els() {
    return {
      trigger: document.getElementById('sfkFaustinaTrigger'),
      modal: document.getElementById('sfkFaustinaModal'),
      dialog: document.querySelector('#sfkFaustinaModal .sfkFaustinaExhibit'),
      close: document.getElementById('sfkFaustinaClose')
    };
  }

  function focusables(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll(
      'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hidden && el.getClientRects().length);
  }

  function openExhibit() {
    const { modal, dialog, close } = els();
    if (!modal || !dialog) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sfkFaustinaOpen');
    dialog.scrollTop = 0;
    requestAnimationFrame(() => (close || dialog).focus({ preventScroll: true }));
  }

  function closeExhibit() {
    const { modal } = els();
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sfkFaustinaOpen');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      requestAnimationFrame(() => lastFocused.focus({ preventScroll: true }));
    }
  }

  function onKeydown(event) {
    const { modal, dialog } = els();
    if (!modal || modal.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeExhibit();
      return;
    }

    if (event.key !== 'Tab') return;
    const list = focusables(dialog);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function boot() {
    const { trigger, modal, close } = els();
    if (!trigger || !modal) return;

    trigger.addEventListener('click', openExhibit);
    trigger.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openExhibit();
      }
    });

    close?.addEventListener('click', closeExhibit);
    modal.addEventListener('click', event => {
      if (event.target?.closest?.('[data-sfk-faustina-close="true"]')) closeExhibit();
    });
    document.addEventListener('keydown', onKeydown, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.openSfkFaustinaExhibit = openExhibit;
  window.closeSfkFaustinaExhibit = closeExhibit;
})();


/* =========================================================
   v339 ST. FAUSTINA EXHIBIT — PHOTO / VIDEO SLIDERS
========================================================= */
(function initSfkFaustinaExhibitSliders() {
  const sliderStates = new WeakMap();
  const pad = value => String(value).padStart(2, '0');

  function activateVideo(slider, index) {
    if (slider?.dataset?.sfkFaustinaSlider !== 'videos') return;
    const slides = Array.from(slider.querySelectorAll('[data-sfk-slide]'));
    slides.forEach((slide, i) => {
      const frame = slide.querySelector('iframe[data-src]');
      if (!frame) return;
      if (i === index) {
        if (!frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.src);
      } else if (frame.getAttribute('src')) {
        frame.removeAttribute('src');
      }
    });
  }

  function currentIndex(track, slides) {
    if (!slides.length) return 0;
    const viewportCenter = track.scrollLeft + (track.clientWidth / 2);
    let best = 0;
    let bestDistance = Infinity;
    slides.forEach((slide, index) => {
      const center = slide.offsetLeft + (slide.offsetWidth / 2);
      const distance = Math.abs(center - viewportCenter);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    return best;
  }

  function updateState(slider) {
    const state = sliderStates.get(slider);
    if (!state) return;
    const index = currentIndex(state.track, state.slides);
    if (index === state.index) return;
    state.index = index;
    if (state.count) state.count.textContent = `${pad(index + 1)} / ${pad(state.slides.length)}`;
    activateVideo(slider, index);
  }

  function goTo(slider, nextIndex, behavior = 'smooth') {
    const state = sliderStates.get(slider);
    if (!state || !state.slides.length) return;
    const total = state.slides.length;
    const index = ((nextIndex % total) + total) % total;
    const slide = state.slides[index];
    state.track.scrollTo({ left: slide.offsetLeft - state.track.offsetLeft, behavior });
    state.index = index;
    if (state.count) state.count.textContent = `${pad(index + 1)} / ${pad(total)}`;
    activateVideo(slider, index);
  }

  function setup(slider) {
    if (!slider || slider.dataset.sfkSliderReady === 'true') return;
    const track = slider.querySelector('[data-sfk-slider-track]');
    const slides = Array.from(slider.querySelectorAll('[data-sfk-slide]'));
    const prev = slider.querySelector('[data-sfk-slider-prev]');
    const next = slider.querySelector('[data-sfk-slider-next]');
    const count = slider.querySelector('[data-sfk-slider-count]');
    if (!track || !slides.length) return;

    slider.dataset.sfkSliderReady = 'true';
    const state = { track, slides, prev, next, count, index: 0, scrollTimer: 0 };
    sliderStates.set(slider, state);
    if (count) count.textContent = `${pad(1)} / ${pad(slides.length)}`;

    prev?.addEventListener('click', () => goTo(slider, state.index - 1));
    next?.addEventListener('click', () => goTo(slider, state.index + 1));
    track.addEventListener('scroll', () => {
      window.clearTimeout(state.scrollTimer);
      state.scrollTimer = window.setTimeout(() => updateState(slider), 80);
    }, { passive: true });
    slider.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(slider, state.index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(slider, state.index + 1); }
    });
    /* Keep video embeds unloaded until the exhibit is actually opened. */
  }

  function stopAllVideos() {
    document.querySelectorAll('#sfkFaustinaModal iframe[data-src]').forEach(frame => frame.removeAttribute('src'));
  }

  function resetAll() {
    document.querySelectorAll('[data-sfk-faustina-slider]').forEach(slider => {
      const state = sliderStates.get(slider);
      if (state) goTo(slider, 0, 'auto');
    });
  }

  function boot() {
    document.querySelectorAll('[data-sfk-faustina-slider]').forEach(setup);
    const modal = document.getElementById('sfkFaustinaModal');
    if (!modal) return;
    new MutationObserver(() => {
      if (modal.hidden) {
        stopAllVideos();
      } else {
        requestAnimationFrame(() => {
          resetAll();
          document.querySelectorAll('[data-sfk-faustina-slider="videos"]').forEach(slider => activateVideo(slider, 0));
        });
      }
    }).observe(modal, { attributes:true, attributeFilter:['hidden'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();

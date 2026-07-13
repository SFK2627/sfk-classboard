const API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";
const CLASSBOARD_MEDIA_REF_PREFIX = "sfk-media://";
const ANNOUNCEMENT_MEDIA_COLLECTION = "announcementMedia";
const MEMORY_MEDIA_COLLECTION = "memoryMedia";
const CLASSBOARD_MEDIA_DATA_CACHE = new Map();
const CLASSBOARD_MEDIA_BLOB_URL_CACHE = new Map();

const DATA_REFRESH_MS = 2000;
const ANNOUNCEMENT_ROTATE_MS = 10000;
const BIRTHDAY_ROTATE_MS = 30000;
const CACHE_KEY = "sfkClassBoardData";
const CLASSBOARD_MEDIA_FIX_CACHE_VERSION_KEY = "sfkClassBoardMediaFixVersion";
const CLASSBOARD_MEDIA_FIX_CACHE_VERSION = "homepage-admin-readable-v71";
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
const BIRTHDAY_MUSIC_SRC = "birthday-music.mp3?v=birthday-mobile-center-v103";
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
let isTodayScheduleOpen = false;

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
  window.addEventListener("focus", () => startAnnouncementFastRefreshBurst("window-focus"));
  window.addEventListener("pageshow", () => startAnnouncementFastRefreshBurst("pageshow"));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) startAnnouncementFastRefreshBurst("visible");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "sfkClassBoardAnnouncementUpdatedAt") startAnnouncementFastRefreshBurst("admin-saved");
  });
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("sfk-classboard-updates");
      channel.addEventListener("message", (event) => {
        if (event.data?.type === "announcement-updated") startAnnouncementFastRefreshBurst("announcement-broadcast");
      });
    }
  } catch (error) {
    // Ignore unsupported broadcast channel errors.
  }
  setInterval(loadMemoriesUnreadBadge, 60000);
  setInterval(rotateBirthdays, BIRTHDAY_ROTATE_MS);
  window.addEventListener("resize", fitAnnouncementTextToCard);
  setInterval(renderCleanersToday, 60000);

  setTimeout(() => {
    startAutoScroll("thingsList");
    startAutoScroll("reminderList");
  }, 1500);

  syncTodayScheduleToggle();
  window.addEventListener("resize", syncTodayScheduleToggle);
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

function autoFitSingleLine(element, options = {}) {
  if (!element) return;
  const min = Number(options.min || 22);
  const max = Number(options.max || 42);
  element.style.whiteSpace = "nowrap";
  element.style.overflow = "hidden";
  element.style.textOverflow = "ellipsis";
  element.style.fontSize = `${max}px`;
  window.requestAnimationFrame(() => {
    let size = max;
    while (size > min && element.scrollWidth > element.clientWidth) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
  });
}

function autoFitPeriodSubject(element) {
  autoFitSingleLine(element, { min: 24, max: 42 });
}


function renderDashboard(data) {
  if (!data || !data.settings) return;

  document.getElementById("dashboardTitle").textContent =
    data.settings.DashboardTitle || "SFK ClassBoard";

  document.getElementById("sectionText").textContent =
    `${data.settings.Section || ""} • S.Y. ${data.settings.SchoolYear || ""} • ${data.settings.Motto || ""}`;

  applyHomepageDesignSettings(data.settings || {});

  document.getElementById("dateText").textContent =
    `${data.day}, ${data.date}`;

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
  const location = [item.Teacher, item.Room].filter(Boolean).join(" • ");

  element.innerHTML = `
    <span class="period-time">${escapeHtml(time)}</span>
    <span class="period-location">${escapeHtml(location)}</span>
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
    const cardBg = useSubjectColors ? subjectBg : getHomeCssVar("--home-current-card-bg", subjectBg);
    const subjectTextColor = overrideText ? getHomeCssVar("--home-current-subject-color", autoTextColor) : autoTextColor;
    const detailsColor = overrideText ? getHomeCssVar("--home-current-details-color", autoTextColor) : autoTextColor;

    card.style.background = cardBg;
    card.style.color = subjectTextColor;
    subjectEl.style.color = subjectTextColor;
    detailsEl.style.color = detailsColor;
    if (labelEl) labelEl.style.color = getHomeCssVar("--home-current-label-color", subjectTextColor);

    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-current-countdown-text", autoTextColor === "#111" ? "#111" : "#fff"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-current-countdown-bg", autoTextColor === "#111" ? "rgba(255,255,255,.65)" : "rgba(0,0,0,.45)"), "important");
      countdownEl.style.borderColor = "rgba(0,0,0,.25)";
    }

    subjectEl.innerHTML = renderScheduleSubjectText(item, subjectTextColor);
    renderPeriodDetails(detailsEl, item);
    autoFitPeriodSubject(subjectEl);
  } else {
    card.style.background = getHomeCssVar("--home-current-card-bg", "#111");
    card.style.color = getHomeCssVar("--home-current-subject-color", "#fff");
    subjectEl.style.color = getHomeCssVar("--home-current-subject-color", "#fff");
    detailsEl.style.color = getHomeCssVar("--home-current-details-color", "#fff");
    if (labelEl) labelEl.style.color = getHomeCssVar("--home-current-label-color", "#ffd700");
    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-current-countdown-text", "#111"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-current-countdown-bg", "rgba(255, 215, 0, .95)"), "important");
      countdownEl.style.borderColor = "rgba(0,0,0,.35)";
    }
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
    const cardBg = useSubjectColors ? subjectBg : getHomeCssVar("--home-next-card-bg", subjectBg);
    const subjectTextColor = overrideText ? getHomeCssVar("--home-next-subject-color", autoTextColor) : autoTextColor;
    const detailsColor = overrideText ? getHomeCssVar("--home-next-details-color", autoTextColor) : autoTextColor;

    card.style.background = cardBg;
    card.style.color = subjectTextColor;
    subjectEl.style.color = subjectTextColor;
    detailsEl.style.color = detailsColor;
    if (labelEl) labelEl.style.color = getHomeCssVar("--home-next-label-color", subjectTextColor);

    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-next-countdown-text", autoTextColor === "#111" ? "#111" : "#fff"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-next-countdown-bg", autoTextColor === "#111" ? "rgba(255,255,255,.65)" : "rgba(0,0,0,.45)"), "important");
    }

    subjectEl.innerHTML = renderScheduleSubjectText(item, subjectTextColor);
    renderPeriodDetails(detailsEl, item);
    autoFitPeriodSubject(subjectEl);
  } else {
    card.style.background = getHomeCssVar("--home-next-card-bg", "#fff7c7");
    card.style.color = getHomeCssVar("--home-next-subject-color", "#111");
    subjectEl.style.color = getHomeCssVar("--home-next-subject-color", "#111");
    detailsEl.style.color = getHomeCssVar("--home-next-details-color", "#111");
    if (labelEl) labelEl.style.color = getHomeCssVar("--home-next-label-color", "#111");
    if (countdownEl) {
      countdownEl.style.setProperty("color", getHomeCssVar("--home-next-countdown-text", "#fff"), "important");
      countdownEl.style.setProperty("background", getHomeCssVar("--home-next-countdown-bg", "rgba(0, 0, 0, .44)"), "important");
    }
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

  if (!items || items.length === 0) {
    box.innerHTML = `<p>No schedule for today.</p>`;
    syncTodayScheduleToggle();
    if (!lastScheduleAutoScrollKey) {
      box.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }

  const previousScrollTop = box.scrollTop;
  const currentKey = currentSubject
    ? `${currentSubject.Subject || ""}|${currentSubject.StartTime || ""}|${currentSubject.EndTime || ""}`
    : "";
  const useSubjectScheduleColors = getHomepageBool(homepageDesignSettings, "HomepageUseSubjectScheduleColors", true);

  box.innerHTML = items.map(item => {
    const subjectColor = item.Color || getSubjectColor(item.Subject);
    const autoTextColor = getScheduleTextColor(item.Subject, subjectColor);
    const cardColor = useSubjectScheduleColors ? subjectColor : getHomeCssVar("--home-schedule-card-bg", subjectColor);
    const textColor = useSubjectScheduleColors ? autoTextColor : getHomeCssVar("--home-schedule-card-text", autoTextColor);
    const timeColor = useSubjectScheduleColors ? autoTextColor : getHomeCssVar("--home-schedule-time-color", textColor);
    const detailColor = useSubjectScheduleColors ? autoTextColor : getHomeCssVar("--home-schedule-details-color", textColor);
    const canOpenSubjectDetails = isSubjectDetailsScheduleItem(item);

    const isCurrent =
      currentSubject &&
      item.Subject === currentSubject.Subject &&
      item.StartTime === currentSubject.StartTime &&
      item.EndTime === currentSubject.EndTime;

    return `
  <div class="schedule-item ${isCurrent ? "current-row" : ""}"
       ${canOpenSubjectDetails ? `data-subject-popup="${escapeHtml(item.Subject || "")}"` : ""}
       style="background:${cardColor}; color:${textColor};">
    ${isCurrent ? `<div class="current-badge">▶ CURRENT PERIOD</div>` : ""}
    <strong style="color:${timeColor};">${item.StartTime} - ${item.EndTime}</strong><br>
    <span class="subject-name" style="color:${textColor};">${renderScheduleSubjectText(item, textColor)}</span><br>
    <small style="color:${detailColor}; opacity:.9;">${item.Teacher} • ${item.Room}</small>
  </div>
`;
  }).join("");

  box.querySelectorAll("[data-subject-popup]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      openSubjectDetailsPopup(card.dataset.subjectPopup || "");
    });
  });

  syncTodayScheduleToggle();

  if (currentKey && currentKey !== lastScheduleAutoScrollKey) {
    lastScheduleAutoScrollKey = currentKey;
    scrollToCurrentSchedule();
    return;
  }

  if (!currentKey && !lastScheduleAutoScrollKey) {
    box.scrollTop = 0;
    return;
  }

  box.scrollTop = previousScrollTop;
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

function scrollToCurrentSchedule() {
  const scheduleBox = document.getElementById("scheduleList");
  if (!scheduleBox) return;

  const currentRow = scheduleBox.querySelector(".current-row");

  setTimeout(() => {
    if (currentRow) {
      const boxRect = scheduleBox.getBoundingClientRect();
      const rowRect = currentRow.getBoundingClientRect();

      const offset =
        rowRect.top -
        boxRect.top -
        scheduleBox.clientHeight / 2 +
        currentRow.clientHeight / 2;

      scheduleBox.scrollTo({
        top: scheduleBox.scrollTop + offset,
        behavior: "smooth"
      });
    }
  }, 300);
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
    box.innerHTML = `<p>No announcements yet.</p>`;
    return;
  }

  const total = items.length;
  announcementIndex = normalizeAnnouncementIndex(announcementIndex, total);
  const currentNumber = announcementIndex + 1;
  const item = items[announcementIndex];

  const subjectColor = getSubjectColor(item.Subject);
  const subjectTextColor = getSubjectTextColor(item.Subject);
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
  const compactDesktopWindow = viewportWidth >= 1201 && viewportHeight <= 860;

  if (hasRichText) {
    if (phone) return 12;

    // v10: In a browser window that is not full screen, the old fitter could
    // shrink rich/editor posts too much just to preserve every slot. Keep a
    // readable floor instead, then let the text area scroll if the post is
    // truly too long. This prevents overlap without making announcements tiny.
    if (compactDesktopWindow) {
      if (charCount <= 140 && visualUnits <= 4) return veryShortHeight ? 24 : 28;
      if (charCount <= 260 && visualUnits <= 6) return veryShortHeight ? 21 : 24;
      if (charCount <= 420 && visualUnits <= 9) return veryShortHeight ? 18 : 20;
      if (charCount <= 620 && visualUnits <= 12) return veryShortHeight ? 15 : 17;
      return veryShortHeight ? 12.5 : 14;
    }

    if (charCount > 700 || visualUnits > 14 || veryShortHeight) return 12;
    if (charCount <= 160) return 18;
    if (charCount <= 320) return 16;
    return 13.5;
  }

  if (compactDesktopWindow) {
    if (charCount <= 120) return veryShortHeight ? 26 : 30;
    if (charCount <= 260) return veryShortHeight ? 20 : 24;
    if (charCount <= 460) return veryShortHeight ? 15 : 18;
    return veryShortHeight ? 12 : 14;
  }

  if (charCount <= 120) return phone ? 16 : 20;
  if (charCount <= 260) return phone ? 13 : 16;
  if (charCount <= 460) return phone ? 11 : 13;

  return veryShortHeight ? 10.5 : 11.5;
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
    memoryMedia: "memory"
  };
  const kind = kindMap[rawKind];
  if (!kind) return null;

  return {
    raw: `${CLASSBOARD_MEDIA_REF_PREFIX}${kind}/${id}`,
    kind,
    id,
    collectionName: kind === "announcement" ? ANNOUNCEMENT_MEDIA_COLLECTION : MEMORY_MEDIA_COLLECTION
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

  if (sub.includes("mapeh")) return "subject-mapeh";
  if (sub.includes("cled") || sub.includes("christian") || sub.includes("religion")) return "subject-cled";
  if (sub.includes("math")) return "subject-mathematics";
  if (sub.includes("ict")) return "subject-ict";
  if (sub.includes("le")) return "subject-le";
  if (sub.includes("english")) return "subject-english";
  if (sub.includes("English") || sub.includes("filipno")) return "subject-English";
  if (sub.includes("science")) return "subject-science";
  if (sub.includes("araling") || /\bap\b/.test(sub)) return "subject-ap";
  if (sub.includes("homeroom")) return "subject-homeroom";

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

function renderQuote(item) {
  document.getElementById("dailyQuote").textContent =
    item ? `“${item.Quote}”` : "Be kind today.";

  document.getElementById("quoteAuthor").textContent =
    item ? `— ${item.Author || "SFK ClassBoard"}` : "";
}

function renderTicker(items) {
  const ticker = document.getElementById("tickerText");

  if (!items || items.length === 0) {
    ticker.textContent = "📢 Welcome to SFK ClassBoard";
    return;
  }

  ticker.textContent = items
    .map(item => `📢 ${item.Message}`)
    .join("     •     ");
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
      alert.classList.remove("hidden");
    }

    return;
  }

  if (nextCountdown) {
    nextCountdown.textContent = `Starts in: ${formatMinutesCountdown(diff)}`;
  }

  if (diff <= 5) {
    if (alert) {
      alert.textContent =
        `⏰ ${nextPeriod.Subject} starts in ${diff} minute${diff > 1 ? "s" : ""}`;

      alert.classList.remove("hidden");
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

function updateClock() {
  const now = new Date();
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
    // Desktop/tablet should keep the original one-line browser text sizing.
    timeEl.textContent = new Intl.DateTimeFormat("en-US", formatterOptions).format(now);
    timeEl.classList.remove("phoneCompactTime");
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
        const textColor = getReadableTextColor(color);

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

  alert.textContent = message;
  alert.classList.remove("hidden");

  clearTimeout(window.soundAlertTimer);
  window.soundAlertTimer = setTimeout(() => {
    alert.classList.add("hidden");
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

    const newDataString = JSON.stringify(stripLargeAnnouncementMediaForCacheV6(data));
    safeSetClassBoardCache(newDataString);

    const shouldRenderDashboardV6 = newDataString !== latestDataString || hasAnnouncementDataImageV6(data);
    if (shouldRenderDashboardV6) {
      latestDataString = newDataString;
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
  window.addEventListener("beforeunload", stopShhhMode);
}

function isShhhModeDesktopAvailable() {
  return !IS_PHONE_DEVICE
    && window.matchMedia?.(SHHH_DESKTOP_MEDIA_QUERY)?.matches
    && Boolean(navigator.mediaDevices?.getUserMedia);
}

function createShhhModeUi() {
  if (document.getElementById("shhhModeOpen")) return;

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

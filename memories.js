const MEMORIES_API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";
const MEMORY_CACHE_KEY = "sfkMemoriesCacheV4";
const HEARTED_MEMORY_KEY = "sfkHeartedMemoriesV1";
const MEMORIES_SEEN_IDS_KEY = "sfkMemoriesSeenPostIdsV1";
const MEMORY_POSTED_BY_KEY = "sfkMemoryPostedByV1";
const MEMORY_MUSIC_AUTOPLAY_KEY = "sfkMemoryMusicAutoplayV1";
const PHOTOBOOTH_FAVORITES_KEY = "sfkPhotoboothFavoritesV1";
const PHOTOBOOTH_DEFAULT_FILTER_KEY = "sfkPhotoboothDefaultFilterV1";
const PHOTOBOOTH_FEAST_PALETTE_KEY = "sfkPhotoboothFeastPaletteV1";
const PHOTOBOOTH_FEAST_ORIENTATION_KEY = "sfkPhotoboothFeastOrientationV1";
const FEAST_PALETTES = {
  pink: {
    label:"Pink Celebration", bgStops:["#fffaea", "#f1dcb7", "#faf1e7", "#ddc0cd"],
    headerStops:["#241836", "#6b315e", "#261733"], footerStops:["#20172e", "#5d2d53", "#20172e"],
    accentPalette:["#e4b954", "#aa688d", "#fff1c8", "#653254"], banderitasPalette:["#e5b94d", "#aa5b86", "#fff2dc", "#472646"],
    outerStroke:"#cc9e4b", innerStroke:"#653254", chipFill:"#e4b954", chipText:"#23172d",
    footerAccent:"#fce5a8", railHighlight:"#fff6db", sparkleBright:"#fff6d5", sparkleWarm:"#f9d582", celebrationText:"#623350"
  },
  gold: {
    label:"Gold • Black • Yellow", bgStops:["#fffbea", "#f5d780", "#fff4d0", "#dec16a"],
    headerStops:["#101014", "#382b13", "#101014"], footerStops:["#111015", "#544016", "#111015"],
    accentPalette:["#e6b93a", "#111217", "#fff2ba", "#c08a20"], banderitasPalette:["#111217", "#ffdb4f", "#fffdf2", "#d79e25"],
    outerStroke:"#bd861e", innerStroke:"#383022", chipFill:"#f7cd46", chipText:"#19150d",
    footerAccent:"#ffdf6b", railHighlight:"#fff9df", sparkleBright:"#fffdf2", sparkleWarm:"#ffd85e", celebrationText:"#272015"
  },
  champagne: {
    label:"Champagne Glow", bgStops:["#fffdfa", "#eedbc1", "#fff6e7", "#d8b68e"],
    headerStops:["#322a26", "#846449", "#322a26"], footerStops:["#362b29", "#8b6750", "#362b29"],
    accentPalette:["#c6a063", "#8e6448", "#fff6e8", "#dfc398"], banderitasPalette:["#b78b59", "#fff4df", "#744c39", "#ddc091"],
    outerStroke:"#b9915b", innerStroke:"#79583d", chipFill:"#e8c68a", chipText:"#31251f",
    footerAccent:"#fff0c7", railHighlight:"#fffaf1", sparkleBright:"#fffefa", sparkleWarm:"#ffe3a0", celebrationText:"#61412e"
  },
  royal: {
    label:"Royal Blue", bgStops:["#f4faff", "#b6d4e3", "#fff5d9", "#a0b4d6"],
    headerStops:["#102342", "#284b73", "#112344"], footerStops:["#112446", "#366180", "#112446"],
    accentPalette:["#e9c75d", "#34739b", "#fff9dd", "#183755"], banderitasPalette:["#174c79", "#f5d466", "#fff8dc", "#6da9c0"],
    outerStroke:"#c6a343", innerStroke:"#254d70", chipFill:"#f1d575", chipText:"#152b42",
    footerAccent:"#ffe699", railHighlight:"#f5fbff", sparkleBright:"#fffef5", sparkleWarm:"#ffdc75", celebrationText:"#254268"
  },
  lavender: {
    label:"Lavender Lights", bgStops:["#fff9fc", "#e7d4ef", "#fff2d9", "#c8b2dc"],
    headerStops:["#311b48", "#77518f", "#321e4b"], footerStops:["#2c1a42", "#76518c", "#2c1a42"],
    accentPalette:["#dfb956", "#a177bd", "#fff6e1", "#5e3e80"], banderitasPalette:["#7f59a7", "#eac55a", "#fff3e4", "#c793c9"],
    outerStroke:"#bf9751", innerStroke:"#63407e", chipFill:"#e7c674", chipText:"#321d47",
    footerAccent:"#ffe7a5", railHighlight:"#fff8fc", sparkleBright:"#fffdfd", sparkleWarm:"#ffe299", celebrationText:"#603d72"
  },
  coral: {
    label:"Coral Fiesta", bgStops:["#fff9ec", "#ffccad", "#fff4cf", "#eaa996"],
    headerStops:["#54303a", "#af604e", "#54303a"], footerStops:["#522c39", "#ad5b4d", "#522c39"],
    accentPalette:["#e9bc4e", "#e98178", "#fff6d7", "#a94c54"], banderitasPalette:["#f6cf60", "#dc6d71", "#fff4d2", "#ed9d6e"],
    outerStroke:"#c59142", innerStroke:"#823f48", chipFill:"#f5cf73", chipText:"#4b2b31",
    footerAccent:"#fff0b3", railHighlight:"#fff7e8", sparkleBright:"#fffdf2", sparkleWarm:"#ffe08d", celebrationText:"#853f48"
  }
};
const PHOTOBOOTH_FILTER_STRENGTHS_KEY = "sfkPhotoboothFilterStrengthsV1";
const MAX_MEDIA_FILES = 50;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 25 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 380 * 1024;
const NO_BILLING_MEDIA_REF_PREFIX = "sfk-media://";
const NO_BILLING_MEMORY_MEDIA_COLLECTION = "memoryMedia";
const NO_BILLING_MEMORY_MEDIA_CACHE = new Map();
const MUSIC_LINK_TEST_TIMEOUT_MS = 8000;
const MEMORY_SHARE_IMAGE_WIDTH = 1080;
const MEMORY_SHARE_IMAGE_HEIGHT = 1350;
const MEMORY_SHARE_STORY_WIDTH = 1080;
const MEMORY_SHARE_STORY_HEIGHT = 1920;
const MEMORY_SHARE_PREVIEW_LIMIT = 4;
const MEMORY_MUSIC_LIBRARY_DOC_ID = "memoryMusicLibrary";
const DEFAULT_MEMORY_MUSIC_LIBRARY = [
  {
    id: "019f0409-13d2-7275-b51f-0e58da8105fe",
    title: "Halcali - Otsukare Summer (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f0409-13d2-7275-b51f-0e58da8105fe"
  },
  {
    id: "019efe86-fd8f-72dd-9b85-e599fae9da2c",
    title: "Impostor Syndrome",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019efe86-fd8f-72dd-9b85-e599fae9da2c"
  },
  {
    id: "019ef9f2-8a06-71ba-85f0-5ef3b12c2270",
    title: "Michael Buble - It's Beginning to Look a Lot Like Christmas (ARAN Cover)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-8a06-71ba-85f0-5ef3b12c2270"
  },
  {
    id: "019ef9f2-12d0-70dc-90e8-600513eef96b",
    title: "Michael Jackson - Man in the Mirror (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-12d0-70dc-90e8-600513eef96b"
  },
  {
    id: "019ef9f2-89dd-72d0-81d3-ac7f8691ce7c",
    title: "My Mood Playlist - 10 Songs, One Guitar (ARAN Acoustic Mashup)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-89dd-72d0-81d3-ac7f8691ce7c"
  },
  {
    id: "019f0348-6fe4-7385-8e80-1bdce1382d95",
    title: "Patience and Prudence - A Smile and a Ribbon (Sped Up)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f0348-6fe4-7385-8e80-1bdce1382d95"
  },
  {
    id: "019ef9f2-89dd-70c3-8032-bdbf97f57001",
    title: "Ryan Gosling and Emma Stone - City of Stars (ARAN Cover)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-89dd-70c3-8032-bdbf97f57001"
  },
  {
    id: "019f06bb-f55a-7322-b938-1c91ba58f0fe",
    title: "Sasane - Mosi Mosi (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f06bb-f55a-7322-b938-1c91ba58f0fe"
  },
  {
    id: "019f06bc-735a-715c-a8b1-a5cadcf8d42a",
    title: "Sasane - Mosi Mosi (Lyrics)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019f06bc-735a-715c-a8b1-a5cadcf8d42a"
  },
  {
    id: "019ef9f2-89dd-70e8-a633-a2066b5540d3",
    title: "Bill Withers - Just the Two of Us (ARAN Cover)",
    category: "Pang song",
    url: "https://audio.jukehost.co.uk/019ef9f2-89dd-70e8-a633-a2066b5540d3"
  }
];

const memoryState = {
  posts: [],
  filter: "all",
  carousel: new Map(),
  auth: null,
  selectedFiles: [],
  previewObjectUrls: [],
  coverIndex: 0,
  uploadProgress: 0,
  uploadStatus: "",

  viewerMedia: [],
  viewerIndex: 0,
  viewerAnimating: false,
  requestedPostHandled: false,
  suppressClickUntil: 0,
  musicLibrary: [],
  musicLibraryLoaded: false,
  musicLibraryLoading: false,
  musicPreviewAudio: null,
  musicPreviewId: "",
  youtubeApiKey: "",
  youtubeSearchResults: [],
  youtubePreviewId: "",
  musicAutoplayEnabled: localStorage.getItem(MEMORY_MUSIC_AUTOPLAY_KEY) === "true",
  musicAutoplayUnlocked: false,
  musicAutoplayTimer: null,
  musicAutoplaySyncing: false,
  selectedMusicLibraryIds: new Set()
};

let touchGesture = null;
let feedVideoObserver = null;
let postMusicObserver = null;
let pageMediaResumeState = null;
let pageMediaResumeTimer = null;

const photoBoothState = {
  stream: null,
  source: "webcam",
  pairUrl: "",
  zoom: 1,
  digitalZoom: 1,
  devices: [],
  deviceId: "",
  facingMode: "user",
  layout: "single",
  theme: "feast-faustina",
  themeVariant: "premium",
  palette: loadPhotoboothFeastPalette(),
  feastOrientation: loadPhotoboothFeastOrientation(),
  filter: loadPhotoboothDefaultFilter(),
  filterCategory: "all",
  favoriteFilters: loadPhotoboothFavorites(),
  defaultFilter: loadPhotoboothDefaultFilter(),
  filterStrengths: loadPhotoboothFilterStrengths(),
  timer: 3,
  mirror: true,
  sound: true,
  shots: [],
  resultBlob: null,
  resultUrl: "",
  busy: false,
  audioContext: null
};

document.addEventListener("DOMContentLoaded", () => {
  setDefaultMemoryDate();
  restoreMemoryAuth();
  bindMemoryEvents();
  updateMusicAutoplayButton();
  renderCachedMemories();
  loadMemories();
});

function bindMemoryEvents() {
  ["topPostButton", "sidePostButton"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", openComposeModal);
  });
  ["topPhotoboothButton", "sidePhotoboothButton", "mobilePhotoboothButton"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", openPhotobooth);
  });
  document.getElementById("closePhotoboothButton")?.addEventListener("click", closePhotobooth);
  document.querySelectorAll("[data-close-photobooth]").forEach((element) => element.addEventListener("click", closePhotobooth));
  document.getElementById("photoboothLayoutOptions")?.addEventListener("click", handlePhotoboothLayoutClick);
  document.getElementById("photoboothSetupTabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-booth-step]");
    if (button) setPhotoboothSetupStep(button.dataset.boothStep);
  });
  document.querySelector(".photoboothControls")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-next-step]");
    if (button) setPhotoboothSetupStep(button.dataset.nextStep);
  });
  document.getElementById("photoboothThemeOptions")?.addEventListener("click", handlePhotoboothThemeClick);
  document.getElementById("photoboothFeastTemplateOptions")?.addEventListener("click", handlePhotoboothFeastTemplateClick);
  document.getElementById("photoboothFeastPaletteOptions")?.addEventListener("click", handlePhotoboothPaletteClick);
  document.getElementById("photoboothMobilePaletteOptions")?.addEventListener("click", handlePhotoboothPaletteClick);
  document.getElementById("photoboothFeastOrientationOptions")?.addEventListener("click", handlePhotoboothOrientationClick);
  document.getElementById("photoboothMobileOrientationOptions")?.addEventListener("click", handlePhotoboothOrientationClick);
  document.getElementById("photoboothFilterOptions")?.addEventListener("click", handlePhotoboothFilterClick);
  document.getElementById("photoboothFilterCategories")?.addEventListener("click", handlePhotoboothFilterCategoryClick);
  document.getElementById("photoboothFavoriteToggle")?.addEventListener("click", togglePhotoboothFavoriteFilter);
  document.getElementById("photoboothSetDefaultButton")?.addEventListener("click", setPhotoboothDefaultFilterFromCurrent);
  document.getElementById("photoboothFilterStrength")?.addEventListener("input", handlePhotoboothStrengthInput);
  document.getElementById("photoboothTimer")?.addEventListener("change", syncPhotoboothSettingsFromUi);
  document.getElementById("photoboothCameraSelect")?.addEventListener("change", handlePhotoboothCameraSelect);
  document.getElementById("photoboothZoom")?.addEventListener("input", handlePhotoboothZoomInput);
  document.getElementById("photoboothUseWebcam")?.addEventListener("click", () => setPhotoboothCameraSource("webcam"));
  document.getElementById("photoboothUsePhone")?.addEventListener("click", () => setPhotoboothCameraSource("phone"));
  document.getElementById("photoboothNewPairCode")?.addEventListener("click", startPhotoboothPhonePairing);
  document.getElementById("photoboothCopyPairLink")?.addEventListener("click", copyPhotoboothPairLink);
  document.getElementById("photoboothMirror")?.addEventListener("change", syncPhotoboothSettingsFromUi);
  document.getElementById("photoboothSound")?.addEventListener("change", syncPhotoboothSettingsFromUi);
  document.getElementById("photoboothSwitchCamera")?.addEventListener("click", switchPhotoboothCamera);
  document.getElementById("photoboothCaptureButton")?.addEventListener("click", startPhotoboothCaptureSequence);
  document.getElementById("mobilePhotoboothClose")?.addEventListener("click", closePhotobooth);
  document.getElementById("mobilePhotoboothTimer")?.addEventListener("click", () => togglePhotoboothMobileTray("timer"));
  document.getElementById("mobilePhotoboothSound")?.addEventListener("click", togglePhotoboothMobileSound);
  document.getElementById("mobilePhotoboothSwitch")?.addEventListener("click", switchPhotoboothCamera);
  document.getElementById("mobilePhotoboothFilter")?.addEventListener("click", () => togglePhotoboothMobileTray("filters"));
  document.getElementById("mobilePhotoboothLayout")?.addEventListener("click", () => togglePhotoboothMobileTray("layout"));
  document.getElementById("mobilePhotoboothPalette")?.addEventListener("click", () => togglePhotoboothMobileTray("palette"));
  document.getElementById("mobilePhotoboothStrengthButton")?.addEventListener("click", () => togglePhotoboothMobileTray("strength"));
  document.getElementById("mobilePhotoboothMirror")?.addEventListener("click", togglePhotoboothMobileMirror);
  document.getElementById("mobilePhotoboothCapture")?.addEventListener("click", startPhotoboothCaptureSequence);
  document.getElementById("photoboothMobileFilterOptions")?.addEventListener("click", handlePhotoboothMobileFilterClick);
  document.getElementById("photoboothMobileFilterCategories")?.addEventListener("click", handlePhotoboothMobileCategoryClick);
  document.getElementById("mobilePhotoboothFavorite")?.addEventListener("click", togglePhotoboothFavoriteFilter);
  document.getElementById("mobilePhotoboothDefault")?.addEventListener("click", setPhotoboothDefaultFilterFromCurrent);
  document.getElementById("mobilePhotoboothStrength")?.addEventListener("input", handlePhotoboothStrengthInput);
  document.querySelector(".photoboothMobileLayoutOptions")?.addEventListener("click", handlePhotoboothMobileLayoutClick);
  document.querySelector(".photoboothMobileTimerOptions")?.addEventListener("click", handlePhotoboothMobileTimerClick);
  document.getElementById("photoboothVideo")?.addEventListener("click", closePhotoboothMobileTray);
  document.getElementById("photoboothRetakeButton")?.addEventListener("click", resetPhotoboothResult);
  document.getElementById("photoboothDownloadButton")?.addEventListener("click", downloadPhotoboothResult);
  document.getElementById("photoboothPostButton")?.addEventListener("click", sendPhotoboothToMemories);

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", () => closeModal(element.dataset.closeModal));
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => setMemoryFilter(button.dataset.filter));
  });

  document.getElementById("unlockPostingButton")?.addEventListener("click", unlockMemoryPosting);
  document.getElementById("changeRoleButton")?.addEventListener("click", resetMemoryAuth);
  document.getElementById("memoryFiles")?.addEventListener("change", handleMemoryFiles);
  document.getElementById("mediaPreview")?.addEventListener("click", handleMediaPreviewAction);
  document.getElementById("togglePostPreviewButton")?.addEventListener("click", togglePostPreview);
  document.getElementById("toggleMusicFieldsButton")?.addEventListener("click", () => toggleMusicFields());
  document.getElementById("musicAutoplayToggle")?.addEventListener("click", toggleMusicAutoplay);
  document.getElementById("toggleAdditionalMusicSources")?.addEventListener("click", toggleAdditionalMusicSources);
  document.getElementById("testMusicLinkButton")?.addEventListener("click", testMusicLink);
  document.getElementById("musicLibrarySearch")?.addEventListener("input", renderMemoryMusicLibrary);
  document.getElementById("musicLibraryList")?.addEventListener("click", handleMusicLibraryListClick);
  document.getElementById("manageMusicLibraryButton")?.addEventListener("click", openMusicLibraryManager);
  document.getElementById("musicLibraryForm")?.addEventListener("submit", saveMusicLibrarySong);
  document.getElementById("importMusicLibrarySongs")?.addEventListener("click", importMusicLibrarySongs);
  document.getElementById("searchYoutubeSongsButton")?.addEventListener("click", searchYoutubeSongs);
  document.getElementById("youtubeSongSearch")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchYoutubeSongs();
    }
  });
  document.getElementById("youtubeSongResults")?.addEventListener("click", handleYoutubeSongResultClick);
  document.getElementById("saveYoutubeApiKey")?.addEventListener("click", saveYoutubeApiKey);
  document.getElementById("cancelMusicLibraryEdit")?.addEventListener("click", resetMusicLibraryEditor);
  document.getElementById("musicLibraryManageList")?.addEventListener("click", handleMusicLibraryManageClick);
  document.getElementById("musicLibraryManageList")?.addEventListener("change", handleMusicLibrarySelectionChange);
  document.getElementById("selectAllMusicLibrarySongs")?.addEventListener("change", toggleAllMusicLibrarySongs);
  document.getElementById("deleteSelectedMusicLibrarySongs")?.addEventListener("click", deleteSelectedMusicLibrarySongs);
  document.querySelectorAll("[data-close-music-library]").forEach((element) => {
    element.addEventListener("click", closeMusicLibraryManager);
  });
  document.getElementById("memoryForm")?.addEventListener("submit", submitMemoryPost);
  ["memoryTitle", "memoryDate", "memoryPostedBy", "memoryCaption", "memoryVideoUrl", "memoryMusicUrl", "memoryMusicTitle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderComposePreview);
  });
  document.getElementById("memoryMusicUrl")?.addEventListener("input", renderMemoryMusicLibrary);
  const feed = document.getElementById("memoryFeed");
  feed?.addEventListener("click", handleFeedClick);
  feed?.addEventListener("touchstart", startFeedSwipe, { passive: true });
  feed?.addEventListener("touchmove", moveFeedSwipe, { passive: false });
  feed?.addEventListener("touchend", endFeedSwipe, { passive: true });
  feed?.addEventListener("error", handleFeedVideoError, true);
  feed?.addEventListener("load", handleEmbeddedMediaLoad, true);
  document.getElementById("closeViewerButton")?.addEventListener("click", closeViewer);
  document.getElementById("viewerPrevious")?.addEventListener("click", () => moveViewer(-1, { smooth: true }));
  document.getElementById("viewerNext")?.addEventListener("click", () => moveViewer(1, { smooth: true }));
  document.getElementById("viewerModal")?.addEventListener("touchstart", startViewerSwipe, { passive: true });
  document.getElementById("viewerModal")?.addEventListener("touchmove", moveViewerSwipe, { passive: false });
  document.getElementById("viewerModal")?.addEventListener("touchend", endViewerSwipe, { passive: true });
  document.getElementById("viewerModal")?.addEventListener("click", handleViewerClick);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeViewer();
      closeModal("composeModal");
      closePhotobooth();
    }

    if (!document.getElementById("viewerModal")?.hidden) {
      if (event.key === "ArrowLeft") moveViewer(-1, { smooth: true });
      if (event.key === "ArrowRight") moveViewer(1, { smooth: true });
    }
  });

  document.addEventListener("visibilitychange", handlePageVisibilityChange);
  window.addEventListener("pagehide", () => pauseAllPageMedia({ remember: true }));
  window.addEventListener("blur", () => pauseAllPageMedia({ remember: true }));
  window.addEventListener("focus", resumePageMedia);
  window.addEventListener("pageshow", resumePageMedia);
  document.addEventListener("freeze", () => pauseAllPageMedia({ remember: true }));
  document.addEventListener("resume", resumePageMedia);
  document.addEventListener("pointerdown", () => {
    memoryState.musicAutoplayUnlocked = true;
    scheduleMusicAutoplaySync();
  }, { once: true, capture: true, passive: true });
  window.addEventListener("scroll", scheduleMusicAutoplaySync, { passive: true });
}

async function loadMemories() {
  setFeedStatus("Loading memories...");

  try {
    const rows = await loadMemoriesFromFirebaseFirst();
    memoryState.posts = rows.map(normalizeMemoryPost);
    markLoadedMemoriesSeen(memoryState.posts);
    renderMemories();
    cacheMemoriesForFastLoad(memoryState.posts);
  } catch (error) {
    console.error("Memories load failed:", error);
    if (memoryState.posts.length === 0) {
      setFeedStatus("Memories will appear after the database loads correctly.");
    }
  }
}

async function loadMemoriesFromFirebaseFirst() {
  try {
    const rows = await loadMemoriesDirectFromFirebase();
    if (Array.isArray(rows)) return rows;
  } catch (error) {
    console.warn("Direct Firebase memories load failed. Falling back to API.", error);
  }

  const response = await fetch(`${MEMORIES_API_URL}?type=memories`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  if (result.status !== "success" || !Array.isArray(result.memories)) {
    throw new Error(result.message || "Invalid memories response.");
  }

  return result.memories;
}

async function loadMemoriesDirectFromFirebase() {
  const db = getClassBoardFirestore();
  if (!db) throw new Error("Firebase is not ready.");

  const snap = await db.collection("memories").get();
  const rows = [];
  snap.forEach((doc) => {
    const data = convertFirestoreData(doc.data() || {});
    const id = String(doc.id || data.docId || data.ID || data.MemoryID || data.memoryId || data.id || "").trim();
    rows.push({
      ...data,
      docId: doc.id,
      id,
      ID: id,
      HeartCount: readMemoryHeartCount(data),
      heartCount: readMemoryHeartCount(data)
    });
  });

  const publishedRows = rows
    .filter((row) => String(row.Publish || "YES").trim().toUpperCase() === "YES")
    .sort((a, b) => compareMemoryRowsForDisplay(a, b));

  return Promise.all(publishedRows.map(resolveNoBillingMemoryMediaRefsInRow));
}

async function resolveNoBillingMemoryMediaRefsInRow(row) {
  const mediaItems = getRawMemoryMediaItems(row);
  if (!mediaItems.some(hasNoBillingMemoryMediaRef)) return row;

  const media = await Promise.all(mediaItems.map(resolveNoBillingMemoryMediaItem));
  const resolved = media.filter(Boolean);
  return {
    ...row,
    media: resolved,
    MediaJSON: JSON.stringify(resolved),
    MediaItems: JSON.stringify(resolved)
  };
}

function getRawMemoryMediaItems(row) {
  if (Array.isArray(row?.media)) return row.media;

  const jsonCandidates = [
    row?.MediaJSON, row?.mediaJSON,
    row?.MediaItems, row?.mediaItems,
    row?.Media, row?.media,
    row?.UploadedMedia, row?.uploadedMedia,
    row?.UploadedMediaJSON, row?.uploadedMediaJSON
  ];
  for (const value of jsonCandidates) {
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(String(value || "[]"));
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch (error) {
      // Ignore invalid legacy JSON and try the next field.
    }
  }

  return [];
}

function hasNoBillingMemoryMediaRef(item) {
  return Boolean(getNoBillingMemoryMediaRef(item));
}

function getNoBillingMemoryMediaRef(item) {
  if (!item) return null;
  if (typeof item === "string") return parseNoBillingMemoryMediaRef(item);
  if (typeof item !== "object") return null;

  const candidates = [
    item.firestoreRef,
    item.url,
    item.viewerUrl,
    item.fullUrl,
    item.downloadUrl,
    item.href,
    item.mediaRef,
    item.MediaRef,
    item.Ref,
    item.ref
  ];
  for (const value of candidates) {
    const ref = parseNoBillingMemoryMediaRef(value);
    if (ref) return ref;
  }

  const mediaId = String(item.mediaId || item.MediaID || item.id || item.ID || "").trim();
  if (/^[A-Za-z0-9_-]{1,240}$/.test(mediaId) && String(item.storage || item.OwnerKind || item.ownerKind || "").toLowerCase().includes("firestore")) {
    return { raw: `${NO_BILLING_MEDIA_REF_PREFIX}memory/${mediaId}`, id: mediaId };
  }

  return null;
}

function parseNoBillingMemoryMediaRef(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith(NO_BILLING_MEDIA_REF_PREFIX)) return null;

  const rest = raw.slice(NO_BILLING_MEDIA_REF_PREFIX.length);
  const slashIndex = rest.indexOf("/");
  if (slashIndex <= 0) return null;

  const kind = rest.slice(0, slashIndex);
  const id = rest.slice(slashIndex + 1).trim();
  if (!["memory", "memories", "memoryMedia"].includes(kind) || !/^[A-Za-z0-9_-]{1,240}$/.test(id)) return null;

  return { raw: `${NO_BILLING_MEDIA_REF_PREFIX}memory/${id}`, id };
}

async function resolveNoBillingMemoryMediaItem(item) {
  const ref = getNoBillingMemoryMediaRef(item);
  if (!ref) return item;

  const dataUrl = await loadNoBillingMemoryMediaDataUrl(ref.id);
  if (!dataUrl) return item;

  return {
    ...item,
    kind: "image",
    url: dataUrl,
    viewerUrl: dataUrl,
    fullUrl: dataUrl,
    downloadUrl: dataUrl,
    firestoreRef: ref.raw
  };
}

async function loadNoBillingMemoryMediaDataUrl(mediaId) {
  const cleanId = String(mediaId || "").trim();
  if (!cleanId) return "";
  if (NO_BILLING_MEMORY_MEDIA_CACHE.has(cleanId)) return NO_BILLING_MEMORY_MEDIA_CACHE.get(cleanId);

  const db = await waitForClassBoardFirestore();
  if (!db) return "";

  try {
    const doc = await db.collection(NO_BILLING_MEMORY_MEDIA_COLLECTION).doc(cleanId).get();
    if (!doc.exists) return "";

    const data = doc.data() || {};
    const mimeType = String(data.MimeType || data.mimeType || data.Type || "image/jpeg").trim();
    const directDataUrl = String(data.DataURL || data.dataUrl || data.Url || data.url || data.PreviewURL || data.previewUrl || "").trim();
    if (/^data:image\//i.test(directDataUrl)) {
      NO_BILLING_MEMORY_MEDIA_CACHE.set(cleanId, directDataUrl);
      return directDataUrl;
    }

    const base64 = String(data.Data || data.data || data.Base64 || data.base64 || data.Content || data.content || "").trim();
    if (!base64 || !mimeType.toLowerCase().startsWith("image/")) return "";

    const dataUrl = `data:${mimeType};base64,${base64}`;
    NO_BILLING_MEMORY_MEDIA_CACHE.set(cleanId, dataUrl);
    return dataUrl;
  } catch (error) {
    console.warn("Unable to load memory photo from Firestore:", error);
    return "";
  }
}

function cacheMemoriesForFastLoad(posts) {
  try {
    const cacheablePosts = (posts || []).map(stripLargeInlineMediaForMemoryCache);
    localStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(cacheablePosts));
  } catch (error) {
    // No-billing photos can be large data URLs. A cache failure must not block rendering.
    console.warn("Unable to update memories cache:", error);
    try {
      localStorage.removeItem(MEMORY_CACHE_KEY);
    } catch (removeError) {
      // Ignore localStorage cleanup errors.
    }
  }
}

function stripLargeInlineMediaForMemoryCache(post) {
  return {
    ...post,
    media: Array.isArray(post?.media)
      ? post.media.map((item) => ({
          ...item,
          url: stripInlineMediaUrl(item?.url),
          viewerUrl: stripInlineMediaUrl(item?.viewerUrl),
          fullUrl: stripInlineMediaUrl(item?.fullUrl),
          downloadUrl: stripInlineMediaUrl(item?.downloadUrl)
        }))
      : []
  };
}

function stripInlineMediaUrl(value) {
  const raw = String(value || "");
  return raw.startsWith("data:") ? "" : raw;
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

function convertFirestoreData(data) {
  const next = { ...data };
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (value && typeof value.toDate === "function") {
      next[key] = value.toDate().toISOString();
    }
  });
  return next;
}

function compareMemoryRowsForDisplay(a, b) {
  const bValue = memorySortValue(b);
  const aValue = memorySortValue(a);
  if (bValue !== aValue) return bValue - aValue;
  return String(b.ID || b.id || "").localeCompare(String(a.ID || a.id || ""));
}

function memorySortValue(row) {
  const candidates = [row.CreatedAt, row.createdAt, row.Date, row.date];
  for (const value of candidates) {
    const millis = valueToMillis(value);
    if (Number.isFinite(millis)) return millis;
  }
  return 0;
}

function valueToMillis(value) {
  if (!value) return NaN;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function markLoadedMemoriesSeen(posts) {
  const ids = (posts || [])
    .map(post => String(post.id || "").trim())
    .filter(Boolean);

  localStorage.setItem(MEMORIES_SEEN_IDS_KEY, JSON.stringify(Array.from(new Set(ids)).slice(0, 500)));
}

function renderCachedMemories() {
  try {
    const cached = JSON.parse(localStorage.getItem(MEMORY_CACHE_KEY) || "[]");
    if (!Array.isArray(cached) || cached.length === 0) return;
    memoryState.posts = cached.map(normalizeMemoryPost);
    renderMemories();
  } catch (error) {
    localStorage.removeItem(MEMORY_CACHE_KEY);
  }
}

function readMemoryHeartCount(raw) {
  const heartUsers = getHeartUsersV2(raw);
  const mapCount = Object.keys(heartUsers).length;
  if (mapCount > 0) return mapCount;

  const values = [
    raw?.HeartCountV2,
    raw?.heartCountV2,
    raw?.NotedCountV2,
    raw?.notedCountV2
  ]
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);

  return values.length ? Math.max(...values) : 0;
}

function getHeartUsersV2(raw) {
  return normalizeHeartedDevices(raw?.HeartUsersV2 || raw?.heartUsersV2 || raw?.NotedDevicesV2 || raw?.notedDevicesV2);
}

function isMemoryHeartedByThisDevice(post) {
  const deviceId = getClassBoardHeartDeviceId();
  return Boolean(getHeartUsersV2(post)[deviceId]);
}

function normalizeMemoryPost(raw) {
  let uploadedMedia = Array.isArray(raw.media) ? raw.media : [];

  if (uploadedMedia.length === 0) {
    try {
      const parsed = JSON.parse(raw.MediaJSON || raw.mediaJSON || raw.MediaItems || raw.mediaItems || raw.UploadedMedia || raw.uploadedMedia || raw.Media || "[]");
      uploadedMedia = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      uploadedMedia = [];
    }
  }

  const media = uploadedMedia
    .map(normalizeStoredMedia)
    .filter(Boolean);
  const linkedVideo = normalizeExternalMedia(
    raw.VideoURL || raw.videoUrl || "",
    raw.VideoDownloadURL || raw.videoDownloadUrl || ""
  );
  if (linkedVideo) media.push(linkedVideo);
  const music = normalizePostMusic(raw);

  return {
    id: String(raw.docId || raw.DocID || raw.__docId || raw.ID || raw.Id || raw.id || raw.MemoryID || raw.memoryId || "").trim(),
    date: String(raw.Date || "").trim(),
    title: String(raw.Title || "Untitled Memory").trim(),
    caption: String(raw.Caption || "").trim(),
    postedBy: String(raw.PostedBy || "SFK").trim(),
    role: String(raw.Role || "Officer").trim(),
    heartCount: readMemoryHeartCount(raw),
    heartUsersV2: getHeartUsersV2(raw),
    createdAt: String(raw.CreatedAt || "").trim(),
    videoUrl: String(raw.VideoURL || raw.videoUrl || "").trim(),
    media,
    music
  };
}

function normalizePostMusic(raw) {
  const customMusicTitle = String(
    raw.MusicTitle || raw.musicTitle || raw.MusicDisplayTitle || raw.musicDisplayTitle || raw.MusicName || raw.musicName || ""
  ).trim();

  if (raw.music && typeof raw.music === "object") {
    if (raw.music.kind === "youtube-audio") {
      const videoId = String(raw.music.videoId || getYouTubeId(raw.music.url) || "").trim();
      if (!videoId) return null;
      return {
        ...raw.music,
        kind: "youtube-audio",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        name: customMusicTitle || raw.music.name || "YouTube music",
        customTitle: customMusicTitle,
        muted: true,
        started: false
      };
    }
    const fileId = String(raw.music.fileId || getDriveFileId(raw.music.url) || getDriveFileId(raw.music.previewUrl) || "").trim();
    const isDriveAudio = raw.music.kind === "drive-audio" || Boolean(fileId);
    return {
      ...raw.music,
      kind: isDriveAudio ? "drive-audio" : raw.music.kind,
      fileId,
      url: isDriveAudio
        ? (getDriveStreamUrl(fileId) || safeHttpUrl(raw.music.url) || safeHttpUrl(raw.music.downloadUrl) || getDriveAudioStreamUrl(fileId))
        : safeHttpUrl(raw.music.url),
      fallbackUrl: isDriveAudio
        ? (getDriveAudioStreamUrl(fileId) || safeHttpUrl(raw.music.fallbackUrl))
        : safeHttpUrl(raw.music.fallbackUrl),
      previewUrl: safeHttpUrl(raw.music.previewUrl),
      name: customMusicTitle || getMusicDisplayName(raw.music),
      customTitle: customMusicTitle,
      muted: true,
      started: false
    };
  }

  let uploaded = null;
  try {
    uploaded = JSON.parse(raw.MusicJSON || raw.musicJSON || "null");
  } catch (error) {
    uploaded = null;
  }

  if (uploaded && uploaded.fileId) {
    return {
      kind: "drive-audio",
      name: customMusicTitle || String(uploaded.name || "Background music"),
      customTitle: customMusicTitle,
      fileId: String(uploaded.fileId),
      url: getDriveStreamUrl(uploaded.fileId) || safeHttpUrl(uploaded.downloadUrl) || getDriveAudioStreamUrl(uploaded.fileId),
      fallbackUrl: getDriveAudioStreamUrl(uploaded.fileId),
      previewUrl: safeHttpUrl(uploaded.previewUrl),
      muted: true,
      started: false
    };
  }

  const url = safeHttpUrl(raw.MusicURL || raw.musicUrl || "");
  if (!url) return null;
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "youtube-audio",
      videoId: youtubeId,
      url,
      name: customMusicTitle || "YouTube music",
      customTitle: customMusicTitle,
      muted: true,
      started: false
    };
  }

  const driveId = getDriveFileId(url);
  if (driveId) {
    return {
      kind: "drive-audio",
      name: customMusicTitle || deriveMusicNameFromUrl(url) || "Google Drive music",
      customTitle: customMusicTitle,
      fileId: driveId,
      url: getDriveStreamUrl(driveId) || safeHttpUrl(raw.MusicDownloadURL || raw.musicDownloadUrl) || getDriveAudioStreamUrl(driveId),
      fallbackUrl: getDriveAudioStreamUrl(driveId),
      previewUrl: url,
      muted: true,
      started: false
    };
  }

  return { kind: "direct-audio", name: customMusicTitle || deriveMusicNameFromUrl(url) || "Background music", customTitle: customMusicTitle, url, muted: true, started: false };
}

function getMusicDisplayName(music) {
  const explicitName = String(music?.customTitle || music?.displayTitle || music?.MusicTitle || music?.name || music?.title || "").trim();
  if (explicitName && !/^background music$/i.test(explicitName)) return explicitName;

  return deriveMusicNameFromUrl(
    music?.previewUrl ||
    music?.fullUrl ||
    music?.url ||
    music?.downloadUrl ||
    music?.fallbackUrl
  ) || explicitName || "Background music";
}

function deriveMusicNameFromUrl(value) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const url = new URL(raw, window.location.href);
    const id = getDriveFileId(url.href);
    if (id) return "Google Drive music";

    const pathPart = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    const clean = pathPart
      .replace(/\.(mp3|m4a|aac|ogg|wav|webm)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return clean ? clean.replace(/\b\w/g, letter => letter.toUpperCase()) : "";
  } catch (error) {
    return "";
  }
}

function normalizeStoredMedia(item) {
  if (!item) return null;

  if (typeof item === "string") {
    const ref = parseNoBillingMemoryMediaRef(item);
    if (ref) {
      return {
        kind: "image",
        url: "",
        viewerUrl: "",
        fullUrl: "",
        downloadUrl: "",
        previewUrl: "",
        firestoreRef: ref.raw,
        mediaId: ref.id,
        name: "SFK memory",
        mimeType: "image/jpeg",
        fileId: "",
        ratio: 0,
        streamUrl: "",
        muted: true
      };
    }
    const url = safeHttpUrl(item);
    return url ? {
      kind: "image",
      url,
      viewerUrl: url,
      fullUrl: url,
      downloadUrl: "",
      previewUrl: url,
      firestoreRef: "",
      name: "SFK memory",
      mimeType: "",
      fileId: getDriveFileId(url),
      ratio: 0,
      streamUrl: "",
      muted: true
    } : null;
  }

  if (typeof item !== "object") return null;

  const noBillingRef = getNoBillingMemoryMediaRef(item);
  const previewUrl = [
    item.previewUrl,
    item.PreviewURL,
    item.inlinePreviewUrl,
    item.InlinePreviewURL,
    item.thumbnailUrl,
    item.ThumbnailURL,
    item.thumbUrl,
    item.ThumbURL,
    item.dataUrl,
    item.DataURL
  ].map(safeHttpUrl).find(Boolean) || "";
  const primaryUrl = [item.url, item.viewerUrl, item.fullUrl, item.downloadUrl]
    .map(safeHttpUrl)
    .find(Boolean) || previewUrl;
  if (!primaryUrl && !noBillingRef) return null;

  const allowedKinds = ["image", "drive-video", "direct-video", "embed-video"];
  const kind = allowedKinds.includes(item.kind) ? item.kind : "image";

  const fileId = String(item.fileId || getDriveFileId(item.url) || getDriveFileId(item.fullUrl) || "").trim();
  const derivedViewerUrl = kind === "image" && fileId
    ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w4000`
    : "";

  const normalizedUrl = safeHttpUrl(item.url) || previewUrl || (noBillingRef ? "" : primaryUrl);
  const normalizedViewerUrl = safeHttpUrl(item.viewerUrl) || previewUrl || derivedViewerUrl || normalizedUrl;
  const normalizedFullUrl = safeHttpUrl(item.fullUrl) || normalizedUrl || normalizedViewerUrl;

  return {
    kind,
    url: normalizedUrl,
    viewerUrl: normalizedViewerUrl,
    fullUrl: normalizedFullUrl,
    downloadUrl: noBillingRef ? "" : safeHttpUrl(item.downloadUrl),
    previewUrl,
    firestoreRef: noBillingRef?.raw || String(item.firestoreRef || item.mediaRef || "").trim(),
    mediaId: noBillingRef?.id || String(item.mediaId || item.MediaID || "").trim(),
    name: String(item.name || item.Name || "SFK memory"),
    mimeType: String(item.mimeType || item.MimeType || ""),
    fileId,
    ratio: Number(item.ratio) > 0 ? Number(item.ratio) : 0,
    streamUrl: kind === "drive-video"
      ? (safeHttpUrl(item.downloadUrl) || safeHttpUrl(item.streamUrl) || getDriveStreamUrl(fileId))
      : safeHttpUrl(item.streamUrl),
    muted: true
  };
}

function normalizeExternalMedia(value, downloadUrl) {
  const url = safeHttpUrl(value);
  if (!url) return null;

  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "embed-video",
      url: `https://www.youtube.com/embed/${youtubeId}`,
      fullUrl: url,
      name: "YouTube video",
      muted: true
    };
  }

  const driveId = getDriveFileId(url);
  if (driveId) {
    return {
      kind: "drive-video",
      url: `https://drive.google.com/file/d/${driveId}/preview`,
      streamUrl: safeHttpUrl(downloadUrl) || getDriveStreamUrl(driveId),
      fullUrl: url,
      fileId: driveId,
      name: "Google Drive video",
      muted: true
    };
  }

  if (/\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url)) {
    return { kind: "direct-video", url, fullUrl: url, name: "Video", muted: true };
  }

  return { kind: "embed-video", url, fullUrl: url, name: "Linked video", muted: true };
}

function getDriveStreamUrl(fileId) {
  return fileId
    ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`
    : "";
}

function getDriveAudioStreamUrl(fileId) {
  return fileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
    : "";
}

function getMemoryAudioProxyUrl(fileId) {
  return fileId
    ? `${MEMORIES_API_URL}?type=memoryAudio&fileId=${encodeURIComponent(fileId)}`
    : "";
}

function getMemoryImageProxyUrl(fileId) {
  return fileId
    ? `${MEMORIES_API_URL}?type=memoryMedia&fileId=${encodeURIComponent(fileId)}`
    : "";
}

function getMusicDirectSources(music) {
  const sources = [];
  const add = (url) => {
    const safe = safeHttpUrl(url);
    if (safe && !sources.includes(safe)) sources.push(safe);
  };

  if (music?.fileId) {
    add(getDriveStreamUrl(music.fileId));
    add(getDriveAudioStreamUrl(music.fileId));
  }

  add(music?.url);
  add(music?.downloadUrl);
  add(music?.fallbackUrl);

  return sources;
}

function getManualMusicSources(url) {
  const sources = [];
  const add = (value) => {
    const safe = safeHttpUrl(value);
    if (safe && !sources.includes(safe)) sources.push(safe);
  };
  const driveId = getDriveFileId(url);

  if (driveId) {
    add(getDriveStreamUrl(driveId));
    add(getDriveAudioStreamUrl(driveId));
  } else {
    add(url);
  }

  return sources;
}

async function fetchDriveAudioObjectUrl(fileId) {
  const url = getMemoryAudioProxyUrl(fileId);
  if (!url) throw new Error("Music file is not available.");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Music file request failed (${response.status}).`);

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.message || "Music file is not available.");
  }

  const blob = base64ToBlob(result.data, result.mimeType || "audio/mpeg");
  return {
    objectUrl: URL.createObjectURL(blob),
    name: String(result.name || "").trim()
  };
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(String(base64 || ""));
  const chunks = [];
  const chunkSize = 8192;

  for (let index = 0; index < binary.length; index += chunkSize) {
    const slice = binary.slice(index, index + chunkSize);
    const bytes = new Uint8Array(slice.length);
    for (let byteIndex = 0; byteIndex < slice.length; byteIndex++) {
      bytes[byteIndex] = slice.charCodeAt(byteIndex);
    }
    chunks.push(bytes);
  }

  return new Blob(chunks, { type: mimeType || "audio/mpeg" });
}

function testAudioSource(url, timeoutMs = MUSIC_LINK_TEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let settled = false;
    const timer = window.setTimeout(() => {
      finish(false, new Error("Music link took too long to respond."));
    }, timeoutMs);

    function finish(ok, error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (ok) resolve(true);
      else reject(error || new Error("This link is not playable audio."));
    }

    audio.preload = "metadata";
    audio.muted = true;
    audio.addEventListener("loadedmetadata", () => finish(true), { once: true });
    audio.addEventListener("canplay", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false, new Error("This link is not a direct playable audio file.")), { once: true });
    audio.src = url;
    audio.load();
  });
}

function getYouTubeId(url) {
  const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/i);
  return match ? match[1] : "";
}

function getDriveFileId(url) {
  const pathMatch = String(url).match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (pathMatch) return pathMatch[1];
  const queryMatch = String(url).match(/[?&]id=([^&]+)/i);
  return queryMatch ? queryMatch[1] : "";
}

function safeHttpUrl(value) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const url = new URL(raw, window.location.href);
    if (["http:", "https:"].includes(url.protocol)) return url.href;
    if (url.protocol === "data:" && /^data:(image|video|audio)\//i.test(url.href)) return url.href;
    return "";
  } catch (error) {
    return "";
  }
}

function renderMemories() {
  const feed = document.getElementById("memoryFeed");
  const empty = document.getElementById("emptyMemories");
  if (!feed || !empty) return;

  const playbackState = captureFeedPlaybackState();
  updateMemoryStats();
  const filtered = getFilteredPosts();
  setFeedStatus("");
  empty.hidden = filtered.length !== 0;
  feed.innerHTML = filtered.map(renderMemoryPost).join("");
  window.requestAnimationFrame(() => {
    restoreFeedPlaybackState(playbackState);
    hydrateNoBillingMemoryImages(feed).catch(() => {});
    updateMusicTitleMarquees();
    observeFeedVideos();
    observePostMusic();
    scheduleMusicAutoplaySync();
    scrollToRequestedMemory();
  });
}

function captureFeedPlaybackState() {
  const states = new Map();

  document.querySelectorAll(".memoryPost").forEach((article) => {
    const postId = article.dataset.postId;
    if (!postId) return;

    article.querySelectorAll(".feedVideo").forEach((video, index) => {
      states.set(`video:${postId}:${video.dataset.mediaIndex || index}`, captureMediaElementState(video));
    });

    const music = article.querySelector(".postMusicPlayer");
    if (music) {
      states.set(`music:${postId}`, captureMediaElementState(music));
    }
  });

  return states;
}

function captureMediaElementState(element) {
  return {
    currentTime: Number.isFinite(element.currentTime) ? element.currentTime : 0,
    muted: Boolean(element.muted),
    paused: Boolean(element.paused),
    ended: Boolean(element.ended),
    src: element.currentSrc || element.src || "",
    volume: Number.isFinite(element.volume) ? element.volume : 1
  };
}

function restoreFeedPlaybackState(states) {
  if (!states || states.size === 0) return;

  document.querySelectorAll(".memoryPost").forEach((article) => {
    const postId = article.dataset.postId;
    if (!postId) return;

    article.querySelectorAll(".feedVideo").forEach((video, index) => {
      restoreMediaElementState(video, states.get(`video:${postId}:${video.dataset.mediaIndex || index}`));
    });

    const music = article.querySelector(".postMusicPlayer");
    restoreMediaElementState(music, states.get(`music:${postId}`), true);
  });
}

function restoreMediaElementState(element, state, restoreSource = false) {
  if (!element || !state) return;

  if (restoreSource && state.src && element.src !== state.src) {
    element.src = state.src;
    element.load();
  }

  element.muted = state.muted;
  element.volume = state.volume;

  const restore = () => {
    if (state.currentTime > 0) {
      try {
        element.currentTime = state.currentTime;
      } catch (error) {
        // Some browsers block seeking until more metadata is ready.
      }
    }

    if (!document.hidden && !state.paused && !state.ended) {
      element.play().catch(() => {});
    }
  };

  if (element.readyState >= 1) {
    restore();
  } else {
    element.addEventListener("loadedmetadata", restore, { once: true });
  }
}

function getFilteredPosts() {
  if (memoryState.filter === "photos") {
    return memoryState.posts.filter((post) => post.media.some((item) => item.kind === "image"));
  }

  if (memoryState.filter === "videos") {
    return memoryState.posts.filter((post) => post.media.some((item) => item.kind !== "image"));
  }

  return memoryState.posts;
}

function renderMemoryPost(post) {
  const currentIndex = Math.min(memoryState.carousel.get(post.id) || 0, Math.max(0, post.media.length - 1));
  const hearted = isMemoryHeartedByThisDevice(post);
  const avatar = escapeHtml(getInitials(post.postedBy));
  const menu = memoryState.auth
    ? `<button class="postMenuButton" type="button" data-action="manage" data-id="${escapeAttr(post.id)}" aria-label="Manage memory">&#8943;</button>`
    : "";

  return `
    <article class="memoryPost" data-post-id="${escapeAttr(post.id)}" ${post.music ? 'data-has-music="true"' : ""}>
      <header class="postHeader">
        <div class="postAvatar">${avatar}</div>
        <div class="postIdentity">
          <strong>${escapeHtml(post.postedBy)}</strong>
          <small><span class="postRole">${escapeHtml(post.role)}</span></small>
        </div>
        ${menu}
      </header>

      ${renderPostMedia(post, currentIndex)}

      <div class="postActions">
        <button class="heartButton ${hearted ? "hearted" : ""}" type="button" data-action="heart" data-id="${escapeAttr(post.id)}" aria-label="Heart this memory">${hearted ? "&#9829;" : "&#9825;"}</button>
        <button class="shareButton" type="button" data-action="share" data-id="${escapeAttr(post.id)}" aria-label="Create share image for this memory" title="Create share image"><span class="shareButtonIcon" aria-hidden="true">&#8599;</span></button>
      </div>

      <div class="postDetails">
        <span class="heartCount">${formatHeartCount(post.heartCount)}</span>
        <p class="postCaption"><strong>${escapeHtml(post.title)}</strong>${post.caption ? ` ${escapeHtml(post.caption)}` : ""}</p>
        <time class="postDate">${escapeHtml(post.date || post.createdAt || "SFK Memory")}</time>
      </div>
    </article>
  `;
}

function renderPostMedia(post, currentIndex) {
  if (post.media.length === 0) {
    return `
      <div class="postMedia textOnlyPostMedia">
        <div class="mediaSlide textOnlySlide">
          <span class="textOnlyBadge">SFK Memory</span>
          <strong>${escapeHtml(post.title || "Text Memory")}</strong>
          ${post.caption ? `<p>${escapeHtml(post.caption)}</p>` : ""}
        </div>
        ${renderPostMusic(post)}
      </div>
    `;
  }

  const slides = post.media.map((media, index) => renderMediaSlide(media, post.id, index)).join("");
  const controls = post.media.length > 1
    ? `
      <button class="mediaArrow mediaPrevious" type="button" data-action="previous" data-id="${escapeAttr(post.id)}" aria-label="Previous" ${currentIndex === 0 ? "hidden" : ""}>&#8249;</button>
      <button class="mediaArrow mediaNext" type="button" data-action="next" data-id="${escapeAttr(post.id)}" aria-label="Next" ${currentIndex === post.media.length - 1 ? "hidden" : ""}>&#8250;</button>
      <span class="mediaCounter">${currentIndex + 1}/${post.media.length}</span>
      <div class="mediaDots">${post.media.map((_, index) => `<span class="mediaDot ${index === currentIndex ? "active" : ""}"></span>`).join("")}</div>
    `
    : "";

  return `
    <div class="postMedia">
      <div class="mediaTrack" style="transform:translateX(-${currentIndex * 100}%)">${slides}</div>
      ${controls}
      ${renderPostMusic(post)}
    </div>
  `;
}

function renderPostMusic(post) {
  const music = post.music;
  if (!music) return "";

  const audible = music.muted === false;
  const musicName = getMusicDisplayName(music);
  let player = "";

  player = music.kind === "youtube-audio"
    ? `<div class="youtubeMusicPopover">
        <iframe class="postMusicFrame" src="${escapeAttr(getYouTubeMusicEmbedUrl(music.videoId))}" title="${escapeAttr(musicName)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen data-music-youtube="true" data-post-id="${escapeAttr(post.id)}"></iframe>
        <button class="youtubeMusicClose" type="button" data-action="youtube-music-hide" data-id="${escapeAttr(post.id)}" aria-label="Pause and hide YouTube player">&times;</button>
      </div>`
    : music.kind === "drive-audio"
    ? `<audio class="postMusicPlayer" ${audible ? "" : "muted"} loop preload="metadata" data-drive-audio="true"></audio>`
    : `
      <audio class="postMusicPlayer" ${audible ? "" : "muted"} loop preload="metadata">
        <source src="${escapeAttr(music.url)}" />
        ${music.fallbackUrl ? `<source src="${escapeAttr(music.fallbackUrl)}" />` : ""}
      </audio>
    `;

  return `
    <div class="postMusic ${music.kind === "youtube-audio" ? "youtubeMusic" : ""} ${audible ? "isPlaying" : ""}" data-music-post="${escapeAttr(post.id)}">
      ${player}
      <button class="musicToggleButton ${audible ? "audible" : ""}" type="button" data-action="music" data-id="${escapeAttr(post.id)}" title="${escapeAttr(musicName)}" aria-label="${audible ? `Mute ${musicName}` : `Play ${musicName}`}">
        <span class="musicPillEqualizer" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
        <span class="musicNote">&#9835;</span><span class="musicLabelViewport"><span class="musicLabel">${escapeHtml(musicName)}</span></span><span class="musicSound">${audible ? "&#128266;" : "&#128263;"}</span>
      </button>
    </div>
  `;
}

function getYouTubeMusicEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: "0",
    mute: "1",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    controls: "1",
    rel: "0",
    enablejsapi: "1",
    origin: window.location.origin
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function renderMediaSlide(media, postId, index) {
  const common = `data-action="view" data-id="${escapeAttr(postId)}" data-index="${index}"`;

  if (media.kind === "image") {
    const imageUrl = [media.viewerUrl, media.previewUrl, media.url, media.fullUrl, media.downloadUrl]
      .map(safeHttpUrl)
      .find(Boolean) || "";
    const firestoreRef = getNoBillingMemoryMediaRef(media)?.raw || "";
    const imageAttrs = firestoreRef
      ? `data-memory-media-ref="${escapeAttr(firestoreRef)}" data-post-id="${escapeAttr(postId)}" data-media-index="${index}"`
      : "";
    const srcAttr = imageUrl ? `src="${escapeAttr(imageUrl)}"` : "";
    const hiddenAttr = imageUrl ? "" : "hidden";

    return `
      <div class="mediaSlide ${imageUrl ? "" : "mediaSlideLoading"}">
        ${imageUrl ? `<img class="mediaBackdrop" src="${escapeAttr(imageUrl)}" alt="" aria-hidden="true" loading="lazy" />` : `<div class="mediaBackdrop memoryMediaLoadingBackdrop" aria-hidden="true"></div>`}
        <img class="mediaMain" ${srcAttr} ${imageAttrs} alt="${escapeAttr(media.name)}" loading="lazy" decoding="async" ${hiddenAttr} ${common} />
        ${imageUrl ? "" : `<span class="memoryMediaLoadingText">Loading photo...</span>`}
      </div>
    `;
  }

  if (media.kind === "direct-video" || media.kind === "drive-video") {
    const source = media.kind === "drive-video" ? (media.streamUrl || media.url) : media.url;
    return `
      <div class="mediaSlide videoSlide">
        <video class="feedVideo" src="${escapeAttr(source)}" autoplay ${media.muted === false ? "" : "muted"} loop playsinline preload="metadata" data-post-id="${escapeAttr(postId)}" data-media-index="${index}" ${media.kind === "drive-video" ? `data-drive-preview="${escapeAttr(media.url)}"` : ""}></video>
        ${renderVolumeButton(media, postId, index)}
      </div>
    `;
  }

  const youtubeId = getYouTubeId(media.fullUrl || media.url);
  const iframeUrl = youtubeId
    ? getYouTubeEmbedUrl(youtubeId, media.muted !== false)
    : media.url;

  return `
    <div class="mediaSlide videoSlide ${youtubeId ? "youtubeSlide" : ""}">
      <iframe class="feedVideoFrame" src="${escapeAttr(iframeUrl)}" title="${escapeAttr(media.name)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen data-post-id="${escapeAttr(postId)}" data-media-index="${index}" data-youtube="${youtubeId ? "true" : "false"}"></iframe>
      ${youtubeId ? `
        <div class="youtubeInteractionBar">
          <button type="button" data-action="youtube-controls" data-id="${escapeAttr(postId)}" data-index="${index}">
            <span aria-hidden="true">&#9654;</span><span class="youtubeModeText">Enable YouTube Controls</span>
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

async function hydrateNoBillingMemoryImages(root = document, options = {}) {
  if (!root) return;
  const retryCount = Number(options.retryCount || 0);
  const images = Array.from(root.querySelectorAll('img[data-memory-media-ref], img[src^="sfk-media://memory/"], img[src^="sfk-media://memories/"], img[src^="sfk-media://memoryMedia/"]'));
  await Promise.all(images.map(async (image) => {
    const rawRef = image.dataset.memoryMediaRef || image.getAttribute("src") || "";
    const ref = parseNoBillingMemoryMediaRef(rawRef);
    if (!ref) return;

    if ((image.getAttribute("src") || "").startsWith("sfk-media://")) {
      image.removeAttribute("src");
      image.hidden = true;
    }

    const dataUrl = await loadNoBillingMemoryMediaDataUrl(ref.id);
    if (!dataUrl) {
      if (retryCount < 3 && image.isConnected) {
        window.setTimeout(() => {
          hydrateNoBillingMemoryImages(image.closest(".mediaSlide") || image.parentElement || image, { retryCount: retryCount + 1 }).catch(() => {});
        }, 600 + retryCount * 900);
      } else {
        const slide = image.closest(".mediaSlide");
        const text = slide?.querySelector(".memoryMediaLoadingText");
        if (text) text.textContent = "Photo is saved, but cannot load yet. Refresh or publish the latest Firebase rules.";
      }
      return;
    }

    image.src = dataUrl;
    image.hidden = false;
    image.removeAttribute("data-memory-media-ref");
    image.onerror = () => {
      const slide = image.closest(".mediaSlide");
      const text = slide?.querySelector(".memoryMediaLoadingText");
      if (text) text.textContent = "This photo could not be displayed.";
    };

    const slide = image.closest(".mediaSlide");
    slide?.classList.remove("mediaSlideLoading");
    slide?.querySelector(".memoryMediaLoadingText")?.remove();

    const backdrop = slide?.querySelector(".mediaBackdrop");
    if (backdrop) {
      if (backdrop.tagName === "IMG") {
        backdrop.src = dataUrl;
      } else {
        const img = document.createElement("img");
        img.className = "mediaBackdrop";
        img.src = dataUrl;
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
        backdrop.replaceWith(img);
      }
    }

    const postId = image.dataset.postId || image.closest(".memoryPost")?.dataset.postId || "";
    const index = Number(image.dataset.mediaIndex || 0);
    const post = memoryState.posts.find((entry) => entry.id === postId);
    const media = post?.media?.[index];
    if (media) {
      media.url = dataUrl;
      media.viewerUrl = dataUrl;
      media.fullUrl = dataUrl;
      media.downloadUrl = dataUrl;
      media.firestoreRef = ref.raw;
      media.mediaId = ref.id;
    }
  }));
}

function renderVolumeButton(media, postId, index) {
  const audible = media.muted === false;
  return `<button class="mediaVolumeButton ${audible ? "audible" : ""}" type="button" data-action="volume" data-id="${escapeAttr(postId)}" data-index="${index}" aria-label="${audible ? "Mute video" : "Turn on video sound"}">${audible ? "&#128266;" : "&#128263;"}</button>`;
}

function getYouTubeEmbedUrl(videoId, muted) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    controls: "1",
    rel: "0",
    enablejsapi: "1"
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function handleFeedClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === "view" && Date.now() < memoryState.suppressClickUntil) return;

  if (action === "previous") return moveCarousel(id, -1);
  if (action === "next") return moveCarousel(id, 1);
  if (action === "heart") {
    event.preventDefault();
    event.stopPropagation();
    return heartMemory(id);
  }
  if (action === "share") return shareMemory(id);
  if (action === "youtube-music-hide") {
    const article = target.closest(".memoryPost");
    const musicButton = article?.querySelector(".musicToggleButton");
    if (musicButton) return togglePostMusic(id, musicButton);
    return;
  }
  if (action === "manage") return openManageActions(id);
  if (action === "view") return openPostViewer(id, Number(target.dataset.index) || 0);
  if (action === "volume") return toggleMediaVolume(id, Number(target.dataset.index) || 0, target);
  if (action === "music") return togglePostMusic(id, target);
  if (action === "youtube-controls") return toggleYouTubeControls(target);
}

function toggleYouTubeControls(button) {
  const slide = button.closest(".youtubeSlide");
  if (!slide) return;

  const enabled = slide.classList.toggle("youtubeControlsEnabled");
  const text = button.querySelector(".youtubeModeText");
  if (text) text.textContent = enabled ? "Return to Scroll Mode" : "Enable YouTube Controls";
  button.classList.toggle("active", enabled);

  window.clearTimeout(slide.youtubeControlTimer);
  if (enabled) {
    slide.youtubeControlTimer = window.setTimeout(() => {
      slide.classList.remove("youtubeControlsEnabled");
      button.classList.remove("active");
      if (text) text.textContent = "Enable YouTube Controls";
    }, 20000);
  }
}

async function togglePostMusic(postId, button) {
  const post = memoryState.posts.find((item) => item.id === postId);
  const music = post?.music;
  const article = button.closest(".memoryPost");
  if (!music || !article) return;

  const audio = article.querySelector(".postMusicPlayer");
  const youtubeFrame = article.querySelector('[data-music-youtube="true"]');
  if (!audio && !youtubeFrame) return;

  const willPlay = music.muted !== false;
  if (!willPlay) {
    music.muted = true;
    if (audio) {
      audio.muted = true;
      audio.pause();
    }
    if (youtubeFrame) {
      sendYouTubeCommand(youtubeFrame, "mute");
      sendYouTubeCommand(youtubeFrame, "pauseVideo");
    }
    updateMusicButton(button, false);
    return;
  }

  muteAllOtherMedia("", -1);
  button.disabled = true;
  button.classList.add("loading");
  const label = button.querySelector(".musicLabel");
  if (label) label.textContent = "Loading...";

  try {
    if (youtubeFrame) {
      music.muted = false;
      music.started = true;
      sendYouTubeCommand(youtubeFrame, "unMute");
      sendYouTubeCommand(youtubeFrame, "playVideo");
      updateMusicButton(button, true);
      return;
    }

    await preparePostMusic(post, article);
    music.muted = false;
    music.started = true;
    audio.muted = false;
    audio.volume = 1;
    try {
      await audio.play();
    } catch (playError) {
      const triedNextSource = music.kind === "drive-audio"
        ? prepareNextPostMusicSource(post, article)
        : false;

      if (!triedNextSource) {
        throw playError;
      }

      if (label) label.textContent = "Retrying...";
      audio.muted = false;
      audio.volume = 1;
      await audio.play();
    }
    updateMusicButton(button, true);
  } catch (error) {
    music.muted = true;
    music.started = false;
    updateMusicButton(button, false);
    showMemoryToast(error.message || "Unable to play this music file.");
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
    if (label) label.textContent = getMusicDisplayName(music);
  }
}

function updateMusicButton(button, audible) {
  if (!button) return;
  button.classList.toggle("audible", audible);
  button.closest(".postMusic")?.classList.toggle("isPlaying", audible);
  const sound = button.querySelector(".musicSound");
  if (sound) sound.innerHTML = audible ? "&#128266;" : "&#128263;";
  const post = memoryState.posts.find((item) => item.id === button.dataset.id);
  const musicName = getMusicDisplayName(post?.music);
  const label = button.querySelector(".musicLabel");
  if (label) label.textContent = musicName;
  button.title = musicName;
  button.setAttribute("aria-label", audible ? `Mute ${musicName}` : `Play ${musicName}`);
  updateMusicTitleMarquees();
}

function updateMusicAutoplayButton() {
  const button = document.getElementById("musicAutoplayToggle");
  if (!button) return;
  const enabled = memoryState.musicAutoplayEnabled;
  button.classList.toggle("isEnabled", enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
  button.setAttribute(
    "aria-label",
    enabled ? "Turn off automatic music playback" : "Turn on automatic music playback"
  );
  button.title = enabled
    ? "Turn off automatic music playback"
    : "Automatically play music on visible posts";
}

function toggleMusicAutoplay() {
  memoryState.musicAutoplayEnabled = !memoryState.musicAutoplayEnabled;
  memoryState.musicAutoplayUnlocked = true;
  localStorage.setItem(MEMORY_MUSIC_AUTOPLAY_KEY, String(memoryState.musicAutoplayEnabled));
  updateMusicAutoplayButton();

  if (memoryState.musicAutoplayEnabled) {
    showMemoryToast("Music autoplay is on.");
    scheduleMusicAutoplaySync();
  } else {
    stopAllPostMusic();
    showMemoryToast("Music autoplay is off.");
  }
}

function stopAllPostMusic() {
  memoryState.posts.forEach((post) => {
    if (!post.music) return;
    post.music.muted = true;
    post.music.started = false;
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    audio.muted = true;
    audio.pause();
  });
  document.querySelectorAll('[data-music-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });
  document.querySelectorAll(".musicToggleButton").forEach((button) => {
    updateMusicButton(button, false);
  });
}

function scheduleMusicAutoplaySync() {
  window.clearTimeout(memoryState.musicAutoplayTimer);
  memoryState.musicAutoplayTimer = window.setTimeout(syncMusicAutoplayToVisiblePost, 120);
}

async function syncMusicAutoplayToVisiblePost() {
  if (
    !memoryState.musicAutoplayEnabled ||
    !memoryState.musicAutoplayUnlocked ||
    memoryState.musicAutoplaySyncing ||
    document.hidden
  ) return;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  let bestArticle = null;
  let bestRatio = 0;

  document.querySelectorAll('.memoryPost[data-has-music="true"]').forEach((article) => {
    const rect = article.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const ratio = visibleHeight / Math.max(1, Math.min(rect.height, viewportHeight));
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestArticle = article;
    }
  });

  if (!bestArticle || bestRatio < .4) {
    stopAllPostMusic();
    return;
  }
  const post = memoryState.posts.find((item) => item.id === bestArticle.dataset.postId);
  const button = bestArticle.querySelector(".musicToggleButton");
  if (!post?.music || !button || post.music.muted === false) return;

  memoryState.musicAutoplaySyncing = true;
  try {
    await togglePostMusic(post.id, button);
  } finally {
    memoryState.musicAutoplaySyncing = false;
  }
}

function updateMusicTitleMarquees() {
  document.querySelectorAll(".musicToggleButton").forEach((button) => {
    const viewport = button.querySelector(".musicLabelViewport");
    const label = button.querySelector(".musicLabel");
    if (!viewport || !label) return;
    const distance = Math.max(0, label.scrollWidth - viewport.clientWidth + 14);
    button.style.setProperty("--music-marquee-distance", `${distance}px`);
    button.classList.toggle("isMarquee", distance > 14);
  });
}

async function preparePostMusic(post, article) {
  const music = post?.music;
  const audio = article?.querySelector(".postMusicPlayer");
  if (!music || !audio) throw new Error("Music player is unavailable.");

  if (music.kind !== "drive-audio") return;

  const directSources = getMusicDirectSources(music);

  if (music.objectUrl) {
    if (audio.src !== music.objectUrl) {
      audio.src = music.objectUrl;
      audio.load();
    }
    return;
  }

  if (music.fileId && !music.proxyFailed) {
    try {
      const proxyAudio = await fetchDriveAudioObjectUrl(music.fileId);
      music.objectUrl = proxyAudio.objectUrl;
      if (proxyAudio.name && !music.customTitle) music.name = proxyAudio.name;
      audio.preload = "auto";
      audio.src = music.objectUrl;
      audio.load();
      music.directPrepared = true;
      return;
    } catch (error) {
      music.proxyFailed = true;
    }
  }

  if (!directSources.length) {
    throw new Error("Music file is not available.");
  }

  if (music.directPrepared && audio.src) {
    return;
  }

  music.directSources = directSources;
  music.sourceIndex = 0;
  audio.preload = "auto";
  audio.src = directSources[0];
  audio.load();
  music.directPrepared = true;
}

function prepareNextPostMusicSource(post, article) {
  const music = post?.music;
  const audio = article?.querySelector(".postMusicPlayer");
  if (!music || !audio || music.kind !== "drive-audio") return false;

  const directSources = getMusicDirectSources(music);
  const currentIndex = Number.isFinite(music.sourceIndex) ? music.sourceIndex : 0;
  const nextIndex = currentIndex + 1;

  if (!directSources[nextIndex]) return false;

  music.directSources = directSources;
  music.sourceIndex = nextIndex;
  music.directPrepared = true;
  audio.preload = "auto";
  audio.src = directSources[nextIndex];
  audio.load();
  return true;
}

function toggleMediaVolume(postId, mediaIndex, button) {
  const post = memoryState.posts.find((item) => item.id === postId);
  const media = post?.media?.[mediaIndex];
  const article = button.closest(".memoryPost");
  if (!media || !article) return;

  const willUnmute = media.muted !== false;
  if (willUnmute) muteAllOtherMedia(postId, mediaIndex);
  media.muted = !willUnmute;

  const video = article.querySelector(`video[data-media-index="${mediaIndex}"]`);
  const iframe = article.querySelector(`iframe[data-media-index="${mediaIndex}"]`);

  if (video) {
    video.muted = media.muted;
    video.volume = 1;
    video.play().catch(() => {});
  }

  if (iframe?.dataset.youtube === "true") {
    sendYouTubeCommand(iframe, media.muted ? "mute" : "unMute");
    sendYouTubeCommand(iframe, "playVideo");
  }

  updateVolumeButton(button, media.muted);
}

function muteAllOtherMedia(activePostId, activeIndex) {
  memoryState.posts.forEach((post) => {
    post.media.forEach((media, index) => {
      if (post.id === activePostId && index === activeIndex) return;
      media.muted = true;
    });
    if (post.music) post.music.muted = true;
  });

  document.querySelectorAll(".feedVideo").forEach((video) => {
    video.muted = true;
  });

  document.querySelectorAll('.feedVideoFrame[data-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
  });

  document.querySelectorAll(".mediaVolumeButton").forEach((button) => {
    updateVolumeButton(button, true);
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    audio.muted = true;
    audio.pause();
  });

  document.querySelectorAll('[data-music-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });

  document.querySelectorAll(".musicToggleButton").forEach((button) => {
    updateMusicButton(button, false);
  });
}

function handlePageVisibilityChange() {
  if (document.hidden) {
    pauseAllPageMedia({ remember: true });
  } else {
    resumePageMedia();
  }
}

function pauseAllPageMedia(options = {}) {
  const shouldRemember = options.remember !== false;
  if (shouldRemember && !pageMediaResumeState) {
    pageMediaResumeState = capturePageMediaResumeState();
  }

  document.querySelectorAll(".feedVideo, .viewerVideo").forEach((video) => {
    video.dataset.wasPageHiddenMuted = String(video.muted);
    video.muted = true;
    video.pause();
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    audio.dataset.wasPageHiddenMuted = String(audio.muted);
    audio.muted = true;
    audio.pause();
  });

  document.querySelectorAll('.feedVideoFrame[data-youtube="true"], .viewerVideoFrame[data-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });

  document.querySelectorAll('[data-music-youtube="true"]').forEach((iframe) => {
    sendYouTubeCommand(iframe, "mute");
    sendYouTubeCommand(iframe, "pauseVideo");
  });
}

function capturePageMediaResumeState() {
  const state = {
    createdAt: Date.now(),
    feedVideos: [],
    feedIframes: [],
    music: [],
    viewerVideo: null,
    viewerIframe: null,
    hasActiveMedia: false
  };

  document.querySelectorAll(".feedVideo").forEach((video) => {
    const article = video.closest(".memoryPost");
    const postId = article?.dataset.postId || "";
    const mediaIndex = Number(video.dataset.mediaIndex || 0);
    const post = memoryState.posts.find((item) => item.id === postId);
    const media = post?.media?.[mediaIndex];
    const activeIndex = memoryState.carousel.get(postId) || 0;
    const isActiveSlide = activeIndex === mediaIndex;
    const wasPlaying = !video.paused && !video.ended;
    const shouldResume = wasPlaying || (isActiveSlide && isElementInViewport(video));

    if (!shouldResume) return;
    state.hasActiveMedia = true;
    state.feedVideos.push({
      postId,
      mediaIndex,
      currentTime: safeCurrentTime(video),
      muted: media?.muted === false ? false : Boolean(video.muted),
      volume: safeVolume(video),
      wasPlaying,
      shouldResume
    });
  });

  document.querySelectorAll('.feedVideoFrame[data-youtube="true"]').forEach((iframe) => {
    const article = iframe.closest(".memoryPost");
    const postId = article?.dataset.postId || iframe.dataset.postId || "";
    const mediaIndex = Number(iframe.dataset.mediaIndex || 0);
    const post = memoryState.posts.find((item) => item.id === postId);
    const media = post?.media?.[mediaIndex];
    const activeIndex = memoryState.carousel.get(postId) || 0;
    const isActiveSlide = activeIndex === mediaIndex;
    if (!isActiveSlide || !isElementInViewport(iframe)) return;

    state.hasActiveMedia = true;
    state.feedIframes.push({
      postId,
      mediaIndex,
      muted: media?.muted !== false,
      shouldResume: true
    });
  });

  document.querySelectorAll(".postMusicPlayer").forEach((audio) => {
    const article = audio.closest(".memoryPost");
    const postId = article?.dataset.postId || "";
    const post = memoryState.posts.find((item) => item.id === postId);
    const music = post?.music;
    const wasPlaying = !audio.paused && !audio.ended;
    const shouldResume = wasPlaying || Boolean(music?.started && music.muted === false);
    if (!shouldResume) return;

    state.hasActiveMedia = true;
    state.music.push({
      postId,
      currentTime: safeCurrentTime(audio),
      muted: music?.muted === false ? false : Boolean(audio.muted),
      volume: safeVolume(audio),
      wasPlaying,
      started: Boolean(music?.started),
      src: audio.currentSrc || audio.src || ""
    });
  });

  const viewerModal = document.getElementById("viewerModal");
  if (viewerModal && !viewerModal.hidden) {
    const media = memoryState.viewerMedia[memoryState.viewerIndex];
    const activeViewerSlide = getActiveViewerSlide();
    const video = activeViewerSlide?.querySelector(".viewerVideo");
    if (video && media) {
      const wasPlaying = !video.paused && !video.ended;
      const shouldResume = wasPlaying || media.muted === false;
      if (shouldResume) {
        state.hasActiveMedia = true;
        state.viewerVideo = {
          index: memoryState.viewerIndex,
          currentTime: safeCurrentTime(video),
          muted: media.muted === false ? false : Boolean(video.muted),
          volume: safeVolume(video),
          wasPlaying,
          shouldResume
        };
      }
    }

    const iframe = activeViewerSlide?.querySelector('.viewerVideoFrame[data-youtube="true"]');
    if (iframe && media) {
      state.hasActiveMedia = true;
      state.viewerIframe = {
        index: memoryState.viewerIndex,
        muted: media.muted !== false,
        shouldResume: true
      };
    }
  }

  return state.hasActiveMedia ? state : null;
}

function resumePageMedia() {
  if (document.hidden) return;

  const state = pageMediaResumeState;
  if (!state) return;
  pageMediaResumeState = null;

  window.clearTimeout(pageMediaResumeTimer);
  pageMediaResumeTimer = window.setTimeout(() => restorePageMediaState(state), 120);
}

function restorePageMediaState(state) {
  if (!state || document.hidden) return;

  state.feedVideos.forEach((item) => {
    const article = findMemoryArticle(item.postId);
    const post = memoryState.posts.find((entry) => entry.id === item.postId);
    const media = post?.media?.[item.mediaIndex];
    const video = article?.querySelector(`video[data-media-index="${item.mediaIndex}"]`);
    if (!article || !video) return;

    if (media) media.muted = item.muted;
    video.muted = item.muted;
    video.volume = item.volume;
    restoreCurrentTime(video, item.currentTime);
    updateVolumeButton(article.querySelector(`.mediaVolumeButton[data-index="${item.mediaIndex}"]`), item.muted);

    if (item.shouldResume) {
      const activeIndex = memoryState.carousel.get(item.postId) || 0;
      if (activeIndex === item.mediaIndex && isElementInViewport(video)) {
        video.play().catch(() => {});
      }
    }
  });

  state.feedIframes.forEach((item) => {
    const article = findMemoryArticle(item.postId);
    const post = memoryState.posts.find((entry) => entry.id === item.postId);
    const media = post?.media?.[item.mediaIndex];
    const iframe = article?.querySelector(`iframe[data-media-index="${item.mediaIndex}"]`);
    if (!article || !iframe) return;

    if (media) media.muted = item.muted;
    sendYouTubeCommand(iframe, item.muted ? "mute" : "unMute");
    if (item.shouldResume && isElementInViewport(iframe)) sendYouTubeCommand(iframe, "playVideo");
  });

  state.music.forEach((item) => {
    const article = findMemoryArticle(item.postId);
    const post = memoryState.posts.find((entry) => entry.id === item.postId);
    const music = post?.music;
    const audio = article?.querySelector(".postMusicPlayer");
    const button = article?.querySelector(".musicToggleButton");
    if (!article || !music || !audio) return;

    music.muted = item.muted;
    music.started = item.started || item.wasPlaying;
    audio.muted = item.muted;
    audio.volume = item.volume;
    if (item.src && !audio.currentSrc && !audio.src) audio.src = item.src;
    restoreCurrentTime(audio, item.currentTime);
    updateMusicButton(button, !item.muted && music.started);

    if (music.started && !item.muted && isElementInViewport(article)) {
      preparePostMusic(post, article)
        .then(() => {
          audio.muted = false;
          restoreCurrentTime(audio, item.currentTime);
          return audio.play();
        })
        .catch(() => {
          updateMusicButton(button, false);
        });
    }
  });

  if (state.viewerVideo && !document.getElementById("viewerModal")?.hidden) {
    const media = memoryState.viewerMedia[state.viewerVideo.index];
    const activeViewerSlide = getActiveViewerSlide();
    const video = activeViewerSlide?.querySelector(".viewerVideo");
    const button = activeViewerSlide?.querySelector(".viewerVolumeButton");
    if (media && video) {
      media.muted = state.viewerVideo.muted;
      video.muted = state.viewerVideo.muted;
      video.volume = state.viewerVideo.volume;
      restoreCurrentTime(video, state.viewerVideo.currentTime);
      updateVolumeButton(button, state.viewerVideo.muted);
      if (state.viewerVideo.shouldResume) video.play().catch(() => {});
    }
  }

  if (state.viewerIframe && !document.getElementById("viewerModal")?.hidden) {
    const media = memoryState.viewerMedia[state.viewerIframe.index];
    const activeViewerSlide = getActiveViewerSlide();
    const iframe = activeViewerSlide?.querySelector('.viewerVideoFrame[data-youtube="true"]');
    if (media && iframe) {
      media.muted = state.viewerIframe.muted;
      sendYouTubeCommand(iframe, state.viewerIframe.muted ? "mute" : "unMute");
      if (state.viewerIframe.shouldResume) sendYouTubeCommand(iframe, "playVideo");
    }
  }
}

function findMemoryArticle(postId) {
  return Array.from(document.querySelectorAll(".memoryPost"))
    .find((article) => article.dataset.postId === postId);
}

function isElementInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width;
}

function safeCurrentTime(element) {
  return Number.isFinite(element?.currentTime) ? element.currentTime : 0;
}

function safeVolume(element) {
  return Number.isFinite(element?.volume) ? element.volume : 1;
}

function restoreCurrentTime(element, seconds) {
  if (!element || !Number.isFinite(seconds) || seconds <= 0) return;

  const restore = () => {
    try {
      element.currentTime = seconds;
    } catch (error) {
      // Some media sources cannot be seeked until enough metadata is loaded.
    }
  };

  if (element.readyState >= 1) restore();
  else element.addEventListener("loadedmetadata", restore, { once: true });
}

function updateVolumeButton(button, muted) {
  if (!button) return;
  button.classList.toggle("audible", !muted);
  button.innerHTML = muted ? "&#128263;" : "&#128266;";
  button.setAttribute("aria-label", muted ? "Turn on video sound" : "Mute video");
}

function sendYouTubeCommand(iframe, command) {
  iframe?.contentWindow?.postMessage(JSON.stringify({
    event: "command",
    func: command,
    args: []
  }), "*");
}

function observeFeedVideos() {
  feedVideoObserver?.disconnect();
  feedVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const element = entry.target;
      const visible = entry.isIntersecting && entry.intersectionRatio >= .55;

      if (document.hidden) {
        if (element instanceof HTMLVideoElement) element.pause();
        else if (element.dataset.youtube === "true") sendYouTubeCommand(element, "pauseVideo");
        return;
      }

      if (element instanceof HTMLVideoElement) {
        if (visible) element.play().catch(() => {});
        else element.pause();
      } else if (element.dataset.youtube === "true") {
        sendYouTubeCommand(element, visible ? "playVideo" : "pauseVideo");
      }
    });
  }, { threshold: [0, .55, 1] });

  document.querySelectorAll(".feedVideo, .feedVideoFrame").forEach((element) => {
    feedVideoObserver.observe(element);
  });
}

function observePostMusic() {
  postMusicObserver?.disconnect();
  postMusicObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const article = entry.target;
      const post = memoryState.posts.find((item) => item.id === article.dataset.postId);
      const music = post?.music;
      const visible = entry.isIntersecting && entry.intersectionRatio >= .45;
      if (!music) return;

      if (document.hidden) {
        article.querySelector(".postMusicPlayer")?.pause();
        const iframe = article.querySelector('[data-music-youtube="true"]');
        if (iframe) sendYouTubeCommand(iframe, "pauseVideo");
        return;
      }

      if (visible && music.kind === "drive-audio" && !music.objectUrl) {
        preparePostMusic(post, article).catch(() => {});
      }

      if (!music.started || music.muted) return;

      const audio = article.querySelector(".postMusicPlayer");
      const iframe = article.querySelector('[data-music-youtube="true"]');

      if (audio) {
        if (visible) audio.play().catch(() => {});
        else audio.pause();
      }

      if (iframe) sendYouTubeCommand(iframe, visible ? "playVideo" : "pauseVideo");
    });
    scheduleMusicAutoplaySync();
  }, { threshold: [0, .45, 1] });

  document.querySelectorAll('.memoryPost[data-has-music="true"]').forEach((article) => {
    postMusicObserver.observe(article);
  });
}

function handleFeedVideoError(event) {
  const video = event.target;
  if (!(video instanceof HTMLVideoElement) || !video.dataset.drivePreview) return;

  const slide = video.closest(".videoSlide");
  if (!slide || slide.dataset.driveFallback === "true") return;
  slide.dataset.driveFallback = "true";

  const iframe = document.createElement("iframe");
  iframe.className = "feedVideoFrame";
  iframe.src = video.dataset.drivePreview;
  iframe.title = "Google Drive video";
  iframe.allow = "autoplay; fullscreen";
  iframe.allowFullscreen = true;
  video.replaceWith(iframe);

  const volumeButton = slide.querySelector(".mediaVolumeButton");
  if (volumeButton) volumeButton.hidden = true;
}

function handleEmbeddedMediaLoad(event) {
  const iframe = event.target;
  if (!(iframe instanceof HTMLIFrameElement) || iframe.dataset.musicYoutube !== "true") return;

  const post = memoryState.posts.find((item) => item.id === iframe.dataset.postId);
  if (document.hidden || !post?.music?.started || post.music.muted) return;
  sendYouTubeCommand(iframe, "unMute");
  sendYouTubeCommand(iframe, "playVideo");
}

function moveCarousel(id, direction) {
  const post = memoryState.posts.find((item) => item.id === id);
  if (!post || post.media.length < 2) return;

  const current = memoryState.carousel.get(id) || 0;
  const next = Math.max(0, Math.min(post.media.length - 1, current + direction));
  memoryState.carousel.set(id, next);
  updateCarouselElement(id, next, true);
}

function updateCarouselElement(id, index, animate) {
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === id);
  const post = memoryState.posts.find((item) => item.id === id);
  if (!article || !post) return;

  const track = article.querySelector(".mediaTrack");
  if (!track) return;

  track.style.transition = animate ? "transform .34s cubic-bezier(.22,.72,.2,1)" : "none";
  track.style.transform = `translateX(-${index * 100}%)`;

  const counter = article.querySelector(".mediaCounter");
  if (counter) counter.textContent = `${index + 1}/${post.media.length}`;

  article.querySelectorAll(".mediaDot").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });

  const previous = article.querySelector('[data-action="previous"]');
  const next = article.querySelector('[data-action="next"]');
  if (previous) previous.hidden = index === 0;
  if (next) next.hidden = index === post.media.length - 1;
  window.setTimeout(() => syncActiveCarouselPlayback(article, index), animate ? 180 : 0);
}

function syncActiveCarouselPlayback(article, activeIndex) {
  article.querySelectorAll(".mediaSlide").forEach((slide, index) => {
    const active = index === activeIndex;
    const video = slide.querySelector("video");
    const iframe = slide.querySelector('.feedVideoFrame[data-youtube="true"]');

    if (video) {
      if (active && !document.hidden) video.play().catch(() => {});
      else video.pause();
    }

    if (iframe) sendYouTubeCommand(iframe, active && !document.hidden ? "playVideo" : "pauseVideo");
  });
}

function startFeedSwipe(event) {
  const media = event.target.closest(".postMedia");
  const article = event.target.closest(".memoryPost");
  const touch = event.changedTouches?.[0];

  if (!media || !article || !touch || event.target.closest("iframe, button")) return;

  touchGesture = {
    scope: "feed",
    id: article.dataset.postId,
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
    width: media.clientWidth,
    currentIndex: memoryState.carousel.get(article.dataset.postId) || 0,
    mediaCount: article.querySelectorAll(".mediaSlide").length,
    track: media.querySelector(".mediaTrack"),
    horizontal: false
  };
}

function moveFeedSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "feed") return;
  const touch = event.changedTouches?.[0];
  if (!touch || !touchGesture.track) return;

  const deltaX = touch.clientX - touchGesture.x;
  const deltaY = touch.clientY - touchGesture.y;

  if (!touchGesture.horizontal) {
    if (Math.abs(deltaX) < 8) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    touchGesture.horizontal = true;
  }

  event.preventDefault();

  const atFirst = touchGesture.currentIndex === 0 && deltaX > 0;
  const atLast = touchGesture.currentIndex === touchGesture.mediaCount - 1 && deltaX < 0;
  const resistedX = atFirst || atLast ? deltaX * .22 : deltaX;

  touchGesture.track.style.transition = "none";
  touchGesture.track.style.transform = `translateX(calc(-${touchGesture.currentIndex * 100}% + ${resistedX}px))`;
}

function endFeedSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "feed") return;
  const gesture = touchGesture;
  touchGesture = null;
  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const deltaX = touch.clientX - gesture.x;
  const deltaY = touch.clientY - gesture.y;
  const elapsed = Math.max(1, Date.now() - gesture.time);
  const velocity = Math.abs(deltaX) / elapsed;
  const enoughDistance = Math.abs(deltaX) >= Math.min(85, gesture.width * .16);
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
  const direction = horizontal && (enoughDistance || (Math.abs(deltaX) > 28 && velocity > .38))
    ? (deltaX < 0 ? 1 : -1)
    : 0;
  const canMove = direction === 1
    ? gesture.currentIndex < gesture.mediaCount - 1
    : gesture.currentIndex > 0;

  if (gesture.horizontal) memoryState.suppressClickUntil = Date.now() + 450;

  if (direction && canMove) {
    moveCarousel(gesture.id, direction);
  } else {
    updateCarouselElement(gesture.id, gesture.currentIndex, true);
  }
}

function startViewerSwipe(event) {
  if (memoryState.viewerMedia.length < 2 || memoryState.viewerAnimating) return;
  if (event.touches && event.touches.length > 1) return;

  const touch = event.changedTouches?.[0];
  if (!touch || event.target.closest("video, iframe, button")) return;

  const content = document.getElementById("viewerContent");
  const track = content?.querySelector(".viewerTrack");
  if (!content || !track) return;

  touchGesture = {
    scope: "viewer",
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
    width: content.clientWidth || window.innerWidth || 360,
    content,
    track,
    currentIndex: memoryState.viewerIndex,
    mediaCount: memoryState.viewerMedia.length,
    horizontal: false,
    deltaX: 0
  };
}

function moveViewerSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "viewer") return;
  if (event.touches && event.touches.length > 1) {
    resetViewerSwipePosition(touchGesture.content);
    touchGesture = null;
    return;
  }

  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const deltaX = touch.clientX - touchGesture.x;
  const deltaY = touch.clientY - touchGesture.y;

  if (!touchGesture.horizontal) {
    if (Math.abs(deltaX) < 8) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    touchGesture.horizontal = true;
  }

  event.preventDefault();

  const atFirst = touchGesture.currentIndex === 0 && deltaX > 0;
  const atLast = touchGesture.currentIndex === touchGesture.mediaCount - 1 && deltaX < 0;
  const resistedX = atFirst || atLast ? deltaX * .28 : deltaX;

  setViewerTrackPosition(touchGesture.currentIndex, resistedX, false);
  touchGesture.deltaX = resistedX;
}

function endViewerSwipe(event) {
  if (!touchGesture || touchGesture.scope !== "viewer") return;
  const gesture = touchGesture;
  touchGesture = null;
  const touch = event.changedTouches?.[0];
  if (!touch) return;

  const direction = getViewerSwipeDirection(gesture, touch);
  const canMove = direction === 1
    ? gesture.currentIndex < gesture.mediaCount - 1
    : gesture.currentIndex > 0;

  if (gesture.horizontal || direction) memoryState.suppressClickUntil = Date.now() + 450;

  if (direction && canMove) {
    moveViewer(direction, { smooth: true, gesture });
  } else {
    setViewerTrackPosition(gesture.currentIndex, 0, true);
  }
}

function getSwipeDirection(start, endTouch) {
  const deltaX = endTouch.clientX - start.x;
  const deltaY = endTouch.clientY - start.y;
  const elapsed = Date.now() - start.time;

  if (elapsed > 900 || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
    return 0;
  }

  return deltaX < 0 ? 1 : -1;
}

function getViewerSwipeDirection(start, endTouch) {
  const deltaX = endTouch.clientX - start.x;
  const deltaY = endTouch.clientY - start.y;
  const elapsed = Math.max(1, Date.now() - start.time);
  const width = Math.max(1, start.width || window.innerWidth || 360);
  const velocity = Math.abs(deltaX) / elapsed;
  const enoughDistance = Math.abs(deltaX) >= Math.min(100, width * .18);
  const quickFlick = Math.abs(deltaX) > 34 && velocity > .34;
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.15;

  if (!horizontal || elapsed > 1000 || (!enoughDistance && !quickFlick)) return 0;
  return deltaX < 0 ? 1 : -1;
}

const MEMORY_HEART_PENDING = new Set();

async function heartMemory(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || MEMORY_HEART_PENDING.has(cleanId)) return false;

  const post = memoryState.posts.find((item) => item.id === cleanId);
  if (!post) return false;

  const nextHearted = !isMemoryHeartedByThisDevice(post);
  MEMORY_HEART_PENDING.add(cleanId);
  setMemoryHeartButtonSaving(cleanId, true);

  try {
    const result = await saveMemoryHeartToDatabase(cleanId, 0, nextHearted);
    applyMemoryHeartResult(cleanId, result.count, result.hearted, result.heartUsers);
    updateMemoryHeartDisplay(cleanId);
    saveMemoryCacheSnapshot();
  } catch (error) {
    console.error("Memory heart failed:", error);
    showToast("Unable to save heart. Please refresh and try again.");
  } finally {
    MEMORY_HEART_PENDING.delete(cleanId);
    setMemoryHeartButtonSaving(cleanId, false);
  }

  return false;
}

function setMemoryHeartButtonSaving(id, saving) {
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === String(id || ""));
  const button = article?.querySelector('.heartButton[data-action="heart"]');
  if (!button) return;
  button.disabled = Boolean(saving);
  button.classList.toggle("is-saving", Boolean(saving));
}

async function saveMemoryHeartToDatabase(id, delta, hearted) {
  const db = getClassBoardFirestore();
  if (db) {
    return saveMemoryHeartDirectToFirebase(id, delta, hearted);
  }

  return postMemoryApi("memoryHeartV2", { MemoryID: id, memoryId: id, id, hearted, deviceId: getClassBoardHeartDeviceId() });
}

async function saveMemoryHeartDirectToFirebase(id, delta, hearted) {
  const db = getClassBoardFirestore();
  if (!db) throw new Error("Firebase is not ready.");

  const ref = await resolveMemoryDocumentRef(db, id);
  if (!ref) throw new Error("Memory record was not found in Firebase.");

  const deviceId = getClassBoardHeartDeviceId();
  const requestedHearted = typeof hearted === "boolean" ? hearted : null;

  let nextCount = 0;
  let serverHearted = false;
  let heartUsers = {};

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    if (!doc.exists) throw new Error("Memory record was not found in Firebase.");

    const data = doc.data() || {};
    heartUsers = getHeartUsersV2(data);
    const currentlyHearted = Boolean(heartUsers[deviceId]);
    const nextHearted = requestedHearted === null ? !currentlyHearted : requestedHearted;

    if (nextHearted) heartUsers[deviceId] = true;
    else delete heartUsers[deviceId];

    nextCount = Object.keys(heartUsers).length;
    serverHearted = Boolean(heartUsers[deviceId]);

    const update = {
      HeartUsersV2: heartUsers,
      heartUsersV2: heartUsers,
      HeartCountV2: nextCount,
      heartCountV2: nextCount,
      NotedCountV2: nextCount,
      notedCountV2: nextCount
    };
    if (window.firebase?.firestore?.FieldValue) {
      update.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    transaction.set(ref, update, { merge: true });
  });

  return { success: true, count: nextCount, hearted: serverHearted, heartUsers };
}

async function resolveMemoryDocumentRef(db, id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return null;

  const collection = db.collection("memories");

  try {
    const direct = await collection.doc(cleanId).get();
    if (direct.exists) return direct.ref;
  } catch (error) {
    console.warn("Direct memory document lookup failed:", error);
  }

  const fields = ["docId", "DocID", "ID", "id", "MemoryID", "memoryId"];
  for (const field of fields) {
    try {
      const snap = await collection.where(field, "==", cleanId).limit(1).get();
      if (!snap.empty) return snap.docs[0].ref;
    } catch (error) {
      console.warn(`Memory lookup by ${field} failed:`, error);
    }
  }

  return null;
}

function applyMemoryHeartResult(id, count, hearted, heartUsers) {
  const cleanId = String(id || "").trim();
  const deviceId = getClassBoardHeartDeviceId();
  const map = normalizeHeartedDevices(heartUsers);
  if (Object.keys(map).length === 0 && hearted) map[deviceId] = true;
  if (!hearted) delete map[deviceId];
  const safeCount = Math.max(0, Number.isFinite(Number(count)) ? Number(count) : Object.keys(map).length);

  memoryState.posts = memoryState.posts.map((post) => {
    if (post.id !== cleanId) return post;
    return {
      ...post,
      heartUsersV2: map,
      HeartUsersV2: map,
      HeartCountV2: safeCount,
      heartCountV2: safeCount,
      heartCount: safeCount
    };
  });
}

function updateMemoryHeartDisplay(id) {
  const post = memoryState.posts.find((item) => item.id === id);
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === id);
  if (!post || !article) return;

  const hearted = isMemoryHeartedByThisDevice(post);
  const button = article.querySelector('.heartButton[data-action="heart"]');
  const count = article.querySelector(".heartCount");

  if (button) {
    button.classList.toggle("hearted", hearted);
    button.innerHTML = hearted ? "&#9829;" : "&#9825;";
  }

  if (count) {
    count.textContent = formatHeartCount(post.heartCount);
  }

  updateMemoryStats();
}

function syncMemoryHeartStatesFromServer(posts) {
  const deviceId = getClassBoardHeartDeviceId();
  (posts || []).forEach(post => {
    const id = String(post?.id || "").trim();
    if (!id) return;

    const users = getHeartUsersV2(post);
    if (users[deviceId]) setHeartedMemory(id);
    else unsetHeartedMemory(id);
  });
}

function saveMemoryCacheSnapshot() {
  cacheMemoriesForFastLoad(memoryState.posts);
}


const HEART_DEVICE_ID_KEY = "sfkClassBoardHeartDeviceId.v1";

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

function normalizeHeartedDevices(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, isHearted]) => key && Boolean(isHearted))
      .map(([key]) => [String(key), true])
  );
}

function makeHeartDocId(targetId, deviceId) {
  return `${safeHeartDocPart(targetId)}__${safeHeartDocPart(deviceId)}`.slice(0, 1400);
}

function safeHeartDocPart(value) {
  return encodeURIComponent(String(value || ""))
    .replace(/\./g, "%2E")
    .replace(/%/g, "_");
}

function getHeartedMemoryIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(HEARTED_MEMORY_KEY) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    return [];
  }
}

function setHeartedMemory(id) {
  const ids = getHeartedMemoryIds();
  if (!ids.includes(id)) ids.push(id);
  localStorage.setItem(HEARTED_MEMORY_KEY, JSON.stringify(ids.slice(-500)));
}

function unsetHeartedMemory(id) {
  const ids = getHeartedMemoryIds().filter((item) => item !== id);
  localStorage.setItem(HEARTED_MEMORY_KEY, JSON.stringify(ids.slice(-500)));
}

async function shareMemory(id) {
  const post = memoryState.posts.find((item) => item.id === id);
  if (!post) return;

  const format = await chooseMemoryShareFormat();
  if (!format) return;

  const shareUrl = new URL("memories.html", window.location.href);
  shareUrl.searchParams.set("memory", id);
  const shareData = {
    title: `${post.title} | SFK Memories`,
    text: `${post.title}${post.caption ? ` - ${post.caption}` : ""}`.trim(),
    url: shareUrl.href
  };
  const button = getShareButtonById(id);

  try {
    setShareButtonBusy(button, true);
    showMemoryToast(format === "story" ? "Creating Story share image..." : "Creating original share image...");

    const image = await createMemoryShareImage(post, format);
    if (image?.file && navigator.share && navigator.canShare && navigator.canShare({ files: [image.file] })) {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        files: [image.file]
      });
      showMemoryToast("Share image ready.");
      return;
    }

    if (image?.blob) {
      downloadBlob(image.blob, image.fileName);
      try {
        await copyMemoryLink(shareData.url);
        showMemoryToast("Share image downloaded. Link copied too.");
      } catch (copyError) {
        showMemoryToast("Share image downloaded.");
      }
      return;
    }

    await shareMemoryLinkFallback(shareData);
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.warn("Memory image share failed:", error);
    try {
      await shareMemoryLinkFallback(shareData);
    } catch (fallbackError) {
      console.warn("Memory link fallback failed:", fallbackError);
      showMemoryToast("Unable to share this memory.");
    }
  } finally {
    setShareButtonBusy(button, false);
  }
}

function chooseMemoryShareFormat() {
  return new Promise((resolve) => {
    document.querySelector(".shareFormatLayer")?.remove();

    const layer = document.createElement("div");
    layer.className = "shareFormatLayer";
    layer.innerHTML = `
      <button class="shareFormatBackdrop" type="button" data-share-format="" aria-label="Cancel"></button>
      <section class="shareFormatSheet" role="dialog" aria-modal="true" aria-labelledby="shareFormatTitle">
        <div class="shareFormatHandle" aria-hidden="true"></div>
        <div class="shareFormatHeading">
          <div>
            <span class="shareFormatEyebrow">SHARE IMAGE</span>
            <h2 id="shareFormatTitle">Choose a size</h2>
          </div>
          <button class="shareFormatClose" type="button" data-share-format="" aria-label="Close">&times;</button>
        </div>
        <div class="shareFormatChoices">
          <button class="shareFormatChoice" type="button" data-share-format="original">
            <span class="shareFormatPreview shareFormatPreviewOriginal" aria-hidden="true"></span>
            <span><strong>Original Post</strong><small>1080 &times; 1350</small></span>
            <span class="shareFormatArrow" aria-hidden="true">&rsaquo;</span>
          </button>
          <button class="shareFormatChoice shareFormatChoiceStory" type="button" data-share-format="story">
            <span class="shareFormatPreview shareFormatPreviewStory" aria-hidden="true"></span>
            <span><strong>FB / IG Story</strong><small>1080 &times; 1920</small></span>
            <span class="shareFormatArrow" aria-hidden="true">&rsaquo;</span>
          </button>
        </div>
      </section>
    `;

    const finish = (format) => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.classList.remove("shareFormatOpen");
      layer.classList.remove("isOpen");
      window.setTimeout(() => layer.remove(), 160);
      resolve(format || "");
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") finish("");
    };

    layer.addEventListener("click", (event) => {
      const target = event.target.closest("[data-share-format]");
      if (!target) return;
      finish(target.dataset.shareFormat);
    });
    document.addEventListener("keydown", handleKeydown);
    document.body.appendChild(layer);
    document.body.classList.add("shareFormatOpen");
    requestAnimationFrame(() => layer.classList.add("isOpen"));
    layer.querySelector('[data-share-format="original"]')?.focus();
  });
}

async function shareMemoryLinkFallback(shareData) {
  const mobileLike = window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (navigator.share && mobileLike) {
    await navigator.share(shareData);
    return;
  }
  await copyMemoryLink(shareData.url);
  showMemoryToast("Memory link copied.");
}

function getShareButtonById(id) {
  return Array.from(document.querySelectorAll('.shareButton[data-action="share"]'))
    .find((button) => button.dataset.id === id);
}

function setShareButtonBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.classList.toggle("loading", busy);
  button.setAttribute("aria-busy", busy ? "true" : "false");
  button.innerHTML = `<span class="shareButtonIcon" aria-hidden="true">${busy ? "&#8635;" : "&#8599;"}</span>`;
}

async function createMemoryShareImage(post, format = "original") {
  const isStory = format === "story";
  const canvas = document.createElement("canvas");
  canvas.width = isStory ? MEMORY_SHARE_STORY_WIDTH : MEMORY_SHARE_IMAGE_WIDTH;
  canvas.height = isStory ? MEMORY_SHARE_STORY_HEIGHT : MEMORY_SHARE_IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  drawShareBackground(ctx, canvas.width, canvas.height);

  const margin = 64;
  const cardX = 42;
  const cardY = isStory ? 84 : 42;
  const cardW = canvas.width - 84;
  const cardH = canvas.height - (cardY * 2);

  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.16)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 42);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 42);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#181818";
  ctx.stroke();

  ctx.save();
  drawRoundRect(ctx, cardX + 24, cardY + 20, cardW - 48, 6, 4);
  ctx.fillStyle = "#f7c600";
  ctx.globalAlpha = .95;
  ctx.fill();
  ctx.restore();

  drawShareHeader(ctx, post, margin, isStory ? 130 : 78, canvas.width - (margin * 2));

  const mediaX = margin;
  const mediaY = isStory ? 260 : 190;
  const mediaW = canvas.width - (margin * 2);
  const imageCount = (post.media || []).filter((item) => item.kind === "image").length;
  const mediaH = isStory
    ? (imageCount ? 1000 : 880)
    : (imageCount ? 640 : 575);
  await drawShareMedia(ctx, post, mediaX, mediaY, mediaW, mediaH);

  const detailsY = mediaY + mediaH + (isStory ? 60 : 54);
  const footerOffset = isStory ? 170 : 118;
  drawShareDetails(ctx, post, margin, detailsY, canvas.width - (margin * 2), imageCount > 0, canvas.height, footerOffset);
  drawShareFooter(ctx, canvas.width, canvas.height, footerOffset);

  const blob = await canvasToBlob(canvas);
  const fileSuffix = isStory ? "-story" : "";
  const fileName = `${safeShareFileName(post.title || "sfk-memory")}${fileSuffix}.png`;
  const file = typeof File !== "undefined"
    ? new File([blob], fileName, { type: "image/png", lastModified: Date.now() })
    : null;
  return { blob, file, fileName };
}

function drawShareBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fffdf3");
  gradient.addColorStop(0.52, "#fff8e2");
  gradient.addColorStop(1, "#f5d64e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#6f6642";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  const glowA = ctx.createRadialGradient(width - 120, 100, 0, width - 120, 100, 320);
  glowA.addColorStop(0, "rgba(255,255,255,.72)");
  glowA.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glowA;
  ctx.beginPath();
  ctx.arc(width - 120, 100, 320, 0, Math.PI * 2);
  ctx.fill();

  const glowB = ctx.createRadialGradient(70, height - 95, 0, 70, height - 95, 250);
  glowB.addColorStop(0, "rgba(247,198,0,.22)");
  glowB.addColorStop(1, "rgba(247,198,0,0)");
  ctx.fillStyle = glowB;
  ctx.beginPath();
  ctx.arc(70, height - 95, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShareHeader(ctx, post, x, y, width) {
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.10)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  drawRoundRect(ctx, x, y, 138, 58, 22);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#f7c600";
  ctx.font = "900 31px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SFK", x + 69, y + 30);

  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "900 38px Arial, Helvetica, sans-serif";
  ctx.fillText("SFK Updates 🫶", x + 162, y + 24);
  ctx.fillStyle = "#7a7568";
  ctx.font = "800 17px Arial, Helvetica, sans-serif";
  ctx.fillText("Grade 8 - St. Faustina Kowalska (SY \'26-\'27) • #BeKind", x + 163, y + 58);

  const dateText = post.date || post.createdAt || "Class Memory";
  ctx.font = "800 21px Arial, Helvetica, sans-serif";
  const dateW = Math.min(330, Math.max(178, ctx.measureText(dateText).width + 48));
  const dateX = x + width - dateW;
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.08)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  drawRoundRect(ctx, dateX, y + 6, dateW, 48, 20);
  ctx.fillStyle = "#fff3b7";
  ctx.fill();
  ctx.restore();
  drawRoundRect(ctx, dateX, y + 6, dateW, 48, 20);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(dateText, dateX + (dateW / 2), y + 31);
  ctx.textAlign = "left";
}

async function drawShareMedia(ctx, post, x, y, width, height) {
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.13)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 7;
  drawRoundRect(ctx, x, y, width, height, 34);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  drawRoundRect(ctx, x, y, width, height, 34);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#181818";
  ctx.stroke();

  const imageMedia = post.media.filter((item) => item.kind === "image");
  if (imageMedia.length === 0) {
    drawShareTextOnlyMedia(ctx, post, x, y, width, height);
    return;
  }

  const framePad = 10;
  const innerX = x + framePad;
  const innerY = y + framePad;
  const innerW = width - (framePad * 2);
  const innerH = height - (framePad * 2);

  ctx.save();
  drawRoundRect(ctx, innerX, innerY, innerW, innerH, 26);
  ctx.fillStyle = "#faf7ef";
  ctx.fill();
  ctx.restore();

  const items = imageMedia.slice(0, MEMORY_SHARE_PREVIEW_LIMIT);
  const images = await Promise.all(items.map((item) => loadShareImage(item)));
  const gap = 10;
  const layouts = getShareMediaLayout(items.length, innerX, innerY, innerW, innerH, gap);
  const hasHeartGap = imageMedia.length >= 4;
  const heartSize = 21;
  const heartCx = innerX + (innerW / 2);
  const heartCy = innerY + (innerH / 2);

  if (hasHeartGap) {
    drawShareHeartGapBase(ctx, heartCx, heartCy, heartSize);
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.max(1, Math.round(innerW));
  tempCanvas.height = Math.max(1, Math.round(innerH));
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) {
    return;
  }

  layouts.forEach((box, index) => {
    const localX = box.x - innerX;
    const localY = box.y - innerY;
    tempCtx.save();
    drawRoundRect(tempCtx, localX, localY, box.w, box.h, box.r || 22);
    tempCtx.clip();
    tempCtx.fillStyle = "#f5f3ed";
    tempCtx.fillRect(localX, localY, box.w, box.h);
    if (images[index]) {
      if (imageMedia.length === 1) {
        drawContainImageWithSoftBackdrop(tempCtx, images[index], localX, localY, box.w, box.h);
      } else {
        drawCoverImage(tempCtx, images[index], localX, localY, box.w, box.h);
      }
    } else {
      drawShareMediaPlaceholder(tempCtx, localX, localY, box.w, box.h, "Photo");
    }
    if (index === layouts.length - 1 && imageMedia.length > MEMORY_SHARE_PREVIEW_LIMIT) {
      tempCtx.fillStyle = "rgba(17,17,17,.58)";
      tempCtx.fillRect(localX, localY, box.w, box.h);
      tempCtx.fillStyle = "#ffffff";
      tempCtx.font = "900 82px Arial, Helvetica, sans-serif";
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.fillText(`+${imageMedia.length - MEMORY_SHARE_PREVIEW_LIMIT}`, localX + box.w / 2, localY + box.h / 2);
      tempCtx.textAlign = "left";
      tempCtx.textBaseline = "alphabetic";
    }
    tempCtx.restore();
  });

  if (hasHeartGap) {
    tempCtx.save();
    tempCtx.globalCompositeOperation = "destination-out";
    drawHeartPath(tempCtx, heartCx - innerX, heartCy - innerY, heartSize + 5);
    tempCtx.fill();
    tempCtx.restore();
  }

  ctx.drawImage(tempCanvas, innerX, innerY);

  images.forEach((image) => {
    if (image?._shareObjectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(image._shareObjectUrl), 1200);
    }
  });
}

function getShareMediaLayout(count, x, y, width, height, gap) {
  if (count <= 1) return [{ x, y, w: width, h: height, r: 32 }];
  if (count === 2) {
    const half = (width - gap) / 2;
    return [
      { x, y, w: half, h: height, r: 28 },
      { x: x + half + gap, y, w: half, h: height, r: 28 }
    ];
  }
  if (count === 3) {
    const leftW = Math.round((width - gap) * .58);
    const rightW = width - gap - leftW;
    const rightH = (height - gap) / 2;
    return [
      { x, y, w: leftW, h: height, r: 28 },
      { x: x + leftW + gap, y, w: rightW, h: rightH, r: 24 },
      { x: x + leftW + gap, y: y + rightH + gap, w: rightW, h: rightH, r: 24 }
    ];
  }
  const colW = (width - gap) / 2;
  const rowH = (height - gap) / 2;
  return [
    { x, y, w: colW, h: rowH, r: 24 },
    { x: x + colW + gap, y, w: colW, h: rowH, r: 24 },
    { x, y: y + rowH + gap, w: colW, h: rowH, r: 24 },
    { x: x + colW + gap, y: y + rowH + gap, w: colW, h: rowH, r: 24 }
  ];
}

function drawShareTextOnlyMedia(ctx, post, x, y, width, height) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#151515");
  gradient.addColorStop(.68, "#302700");
  gradient.addColorStop(1, "#4a3a00");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = "rgba(247, 198, 0, .12)";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 100 + i * 130, y + 90 + (i % 2) * 260, 54, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#f7c600";
  ctx.font = "900 28px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SFK MEMORY", x + width / 2, y + 140);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px Arial, Helvetica, sans-serif";
  wrapCanvasText(ctx, post.title || "Class Memory", x + 95, y + 238, width - 190, 68, 3);
  if (post.caption) {
    ctx.fillStyle = "#fff5c8";
    ctx.font = "700 31px Arial, Helvetica, sans-serif";
    wrapCanvasText(ctx, post.caption, x + 105, y + 456, width - 210, 42, 4);
  }
  ctx.textAlign = "left";
}

function drawShareMediaPlaceholder(ctx, x, y, width, height, label) {
  ctx.fillStyle = "#fff6c7";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#111111";
  ctx.font = "900 34px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label || "Memory", x + width / 2, y + height / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawShareHeartGapBase(ctx, cx, cy, size) {
  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.16)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  drawHeartPath(ctx, cx, cy, size + 6);
  ctx.fillStyle = "rgba(255,255,255,.96)";
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawHeartPath(ctx, cx, cy, size);
  const heartGradient = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size * 1.1);
  heartGradient.addColorStop(0, "#fff8bf");
  heartGradient.addColorStop(0.45, "#f7c600");
  heartGradient.addColorStop(1, "#d7a600");
  ctx.fillStyle = heartGradient;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111111";
  ctx.stroke();
  ctx.restore();
}

function drawHeartPath(ctx, cx, cy, size) {
  const topCurveHeight = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.9);
  ctx.bezierCurveTo(
    cx - size * 1.35, cy + size * 0.18,
    cx - size * 1.2, cy - size * 0.72,
    cx, cy - size * 0.18
  );
  ctx.bezierCurveTo(
    cx + size * 1.2, cy - size * 0.72,
    cx + size * 1.35, cy + size * 0.18,
    cx, cy + size * 0.9
  );
  ctx.closePath();
}

function drawShareDetails(ctx, post, x, y, width, hasPhoto = false, canvasHeight = MEMORY_SHARE_IMAGE_HEIGHT, footerOffset = 118) {
  const titleMaxY = canvasHeight - footerOffset - 157;
  const captionMaxY = canvasHeight - footerOffset - 92;

  ctx.fillStyle = "#111111";
  ctx.font = hasPhoto ? "900 39px Arial, Helvetica, sans-serif" : "900 48px Arial, Helvetica, sans-serif";
  const titleLineHeight = hasPhoto ? 47 : 58;
  const titleLines = wrapCanvasText(ctx, post.title || "Untitled Memory", x, y, width, titleLineHeight, hasPhoto ? 2 : 3);
  let cursorY = y + (titleLines * titleLineHeight) + 18;

  if (post.caption && cursorY < titleMaxY) {
    ctx.fillStyle = "#36332d";
    ctx.font = hasPhoto ? "700 26px Arial, Helvetica, sans-serif" : "700 31px Arial, Helvetica, sans-serif";
    const captionLineHeight = hasPhoto ? 34 : 42;
    const maxCaptionLines = Math.max(1, Math.min(hasPhoto ? 2 : 4, Math.floor((captionMaxY - cursorY) / captionLineHeight)));
    const captionLines = wrapCanvasText(ctx, post.caption, x, cursorY, width, captionLineHeight, maxCaptionLines);
    cursorY += (captionLines * captionLineHeight) + 26;
  } else {
    cursorY += 20;
  }

  const metaY = Math.min(cursorY, canvasHeight - footerOffset - 96);
  const avatarSize = 60;

  ctx.save();
  ctx.shadowColor = "rgba(17,17,17,.10)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#f7c600";
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, metaY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#111111";
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, metaY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#111111";
  ctx.font = "900 24px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getInitials(post.postedBy), x + avatarSize / 2, metaY + avatarSize / 2 + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111111";
  ctx.font = "900 27px Arial, Helvetica, sans-serif";
  ctx.fillText(post.postedBy || "SFK", x + avatarSize + 18, metaY + 40);

  if (post.media.length) {
    const attachmentText = `${post.media.length} attachment${post.media.length > 1 ? "s" : ""}`;
    ctx.fillStyle = "#6a5a16";
    ctx.font = "800 21px Arial, Helvetica, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(attachmentText, x + width, metaY + 43);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

function drawShareFooter(ctx, width, height, footerOffset = 118) {
  const footerY = height - footerOffset;
  ctx.strokeStyle = "#eadfa9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(88, footerY - 28);
  ctx.lineTo(width - 88, footerY - 28);
  ctx.stroke();

  const footerTextY = footerY;
  const parts = [
    { text: "S", color: "#f7c600", weight: "900" },
    { text: "o ", color: "#111111", weight: "900" },
    { text: "F", color: "#f7c600", weight: "900" },
    { text: "ar, so ", color: "#111111", weight: "900" },
    { text: "K", color: "#f7c600", weight: "900" },
    { text: "ind - SFK Memories", color: "#111111", weight: "900" }
  ];
  const fontSize = 24;
  const fontFamily = 'Arial, Helvetica, sans-serif';
  let totalWidth = 0;
  parts.forEach((part) => {
    ctx.font = `${part.weight} ${fontSize}px ${fontFamily}`;
    totalWidth += ctx.measureText(part.text).width;
  });
  let drawX = (width - totalWidth) / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  parts.forEach((part) => {
    ctx.font = `${part.weight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, drawX, footerTextY);
    drawX += ctx.measureText(part.text).width;
  });

  ctx.fillStyle = "#7b6700";
  ctx.font = "800 20px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Our moments, milestones, and kind beginnings.", width / 2, footerY + 34);
  ctx.textAlign = "left";
}

async function loadShareImage(mediaItem) {
  const item = typeof mediaItem === "string" ? { url: mediaItem } : (mediaItem || {});
  const fileId = String(item.fileId || getDriveFileId(item.url) || getDriveFileId(item.viewerUrl) || getDriveFileId(item.fullUrl) || getDriveFileId(item.downloadUrl) || "").trim();

  // 1) If the media already has a data URL/base64 source, use it directly.
  const inlineImage = await loadInlineShareImage(item);
  if (inlineImage) return inlineImage;

  // 2) Safest path for Google Drive photos: Apps Script reads the Drive file and
  // returns base64. This avoids the browser canvas/CORS issue that causes the
  // yellow "Photo" placeholder.
  if (fileId) {
    const proxied = await fetchShareImageThroughApi(fileId);
    if (proxied) return proxied;
  }

  // 3) Fallback to public Google image URLs and stored URLs. Every image is
  // verified on a tiny canvas first, so the final share card can export cleanly.
  const candidates = getShareImageCandidates(item, fileId);
  for (const url of candidates) {
    const image = await loadVerifiedShareImage(url);
    if (image) return image;
  }

  return null;
}

async function loadInlineShareImage(item) {
  const inlineValues = [
    item.dataUrl,
    item.dataURL,
    item.base64,
    item.data && item.mimeType ? `data:${item.mimeType};base64,${item.data}` : ""
  ];

  for (const value of inlineValues) {
    const text = String(value || "").trim();
    if (!text || !text.startsWith("data:image/")) continue;
    const image = await loadShareImageElement(text, false);
    if (image && canUseImageInCanvas(image)) return image;
  }

  return null;
}

function getShareImageCandidates(item, fileId) {
  const urls = [];
  const add = (value) => {
    const safe = safeHttpUrl(value);
    if (safe && !urls.includes(safe)) urls.push(safe);
  };

  if (fileId) {
    add(`https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w2400`);
    add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w4000`);
    add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`);
    add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`);
    add(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`);
  }

  add(item.viewerUrl);
  add(item.url);
  add(item.downloadUrl);
  add(item.fullUrl);
  return urls;
}

async function fetchShareImageThroughApi(fileId) {
  const url = getMemoryImageProxyUrl(fileId);
  if (!url) return null;

  try {
    const response = await fetch(`${url}&_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Image request failed (${response.status}).`);

    const result = await response.json();
    if (!result.success || !result.data) throw new Error(result.message || "Image data is missing.");

    const blob = base64ToBlob(result.data, result.mimeType || "image/jpeg");
    const objectUrl = URL.createObjectURL(blob);
    const image = await loadShareImageElement(objectUrl, false);
    if (image && canUseImageInCanvas(image)) {
      image._shareObjectUrl = objectUrl;
      return image;
    }
    URL.revokeObjectURL(objectUrl);
    return null;
  } catch (error) {
    console.warn("Memory image proxy failed. Trying direct image source.", error);
    return null;
  }
}

async function loadVerifiedShareImage(url) {
  // Try normal CORS image loading first.
  const direct = await loadShareImageElement(url, true);
  if (direct && canUseImageInCanvas(direct)) return direct;

  // Some public image URLs are easier to use as a fetched blob/object URL.
  const fetched = await fetchShareImageAsObjectUrl(url);
  if (fetched) return fetched;

  return null;
}

async function fetchShareImageAsObjectUrl(url) {
  const cleanUrl = safeHttpUrl(url);
  if (!cleanUrl) return null;

  try {
    const response = await fetch(cleanUrl, { mode: "cors", cache: "no-store" });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!String(blob.type || "").startsWith("image/")) return null;
    const objectUrl = URL.createObjectURL(blob);
    const image = await loadShareImageElement(objectUrl, false);
    if (image && canUseImageInCanvas(image)) {
      image._shareObjectUrl = objectUrl;
      return image;
    }
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    // Keep quiet; the next candidate may work.
  }

  return null;
}

function loadShareImageElement(url, useCors) {
  const cleanUrl = String(url || "").trim().startsWith("data:image/") ? String(url).trim() : safeHttpUrl(url);
  if (!cleanUrl) return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new Image();
    const done = (value) => {
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => done(null), 12000);
    if (useCors) image.crossOrigin = "anonymous";
    image.onload = () => done(image);
    image.onerror = () => done(null);
    image.src = cleanUrl;
  });
}

function canUseImageInCanvas(image) {
  if (!image || !image.naturalWidth || !image.naturalHeight) return false;

  try {
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 2;
    testCanvas.height = 2;
    const testCtx = testCanvas.getContext("2d");
    testCtx.drawImage(image, 0, 0, 2, 2);
    testCanvas.toDataURL("image/png");
    return true;
  } catch (error) {
    return false;
  }
}


function drawCoverImage(ctx, image, x, y, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let sourceW = image.naturalWidth;
  let sourceH = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > boxRatio) {
    sourceW = image.naturalHeight * boxRatio;
    sourceX = (image.naturalWidth - sourceW) / 2;
  } else {
    sourceH = image.naturalWidth / boxRatio;
    sourceY = (image.naturalHeight - sourceH) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
}

function drawContainImageWithSoftBackdrop(ctx, image, x, y, width, height) {
  // Main share card should show the whole photo, not crop important edges.
  ctx.save();
  ctx.globalAlpha = 0.38;
  drawCoverImage(ctx, image, x, y, width, height);
  ctx.restore();

  ctx.fillStyle = "rgba(17,17,17,.18)";
  ctx.fillRect(x, y, width, height);

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let drawW = width;
  let drawH = height;
  let drawX = x;
  let drawY = y;

  if (imageRatio > boxRatio) {
    drawW = width;
    drawH = width / imageRatio;
    drawY = y + (height - drawH) / 2;
  } else {
    drawH = height;
    drawW = height * imageRatio;
    drawX = x + (width - drawW) / 2;
  }

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return 0;

  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      line = testLine;
      continue;
    }

    if (line) lines.push(line);
    else lines.push(trimCanvasText(ctx, word, maxWidth));
    line = line ? word : "";

    if (lines.length >= maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines || words.join(" ").length > visibleLines.join(" ").length;
  visibleLines.forEach((value, index) => {
    const output = hasMore && index === maxLines - 1
      ? trimCanvasText(ctx, `${value}...`, maxWidth)
      : value;
    ctx.fillText(output, x, y + (index * lineHeight));
  });

  return visibleLines.length;
}

function trimCanvasText(ctx, text, maxWidth) {
  let output = String(text || "");
  while (output.length > 1 && ctx.measureText(output).width > maxWidth) {
    output = `${output.slice(0, -4)}...`;
  }
  return output;
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image export failed."));
      }, "image/png", 0.95);
    } catch (error) {
      reject(error);
    }
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3500);
}

function safeShareFileName(value) {
  const clean = String(value || "sfk-memory")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55);
  return clean || "sfk-memory";
}

async function copyMemoryLink(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Copy failed");
}

function scrollToRequestedMemory() {
  if (memoryState.requestedPostHandled) return;
  const requestedId = new URLSearchParams(window.location.search).get("memory");
  if (!requestedId) {
    memoryState.requestedPostHandled = true;
    return;
  }

  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === requestedId);
  if (!article) return;

  memoryState.requestedPostHandled = true;
  article.classList.add("sharedMemoryFocus");
  article.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => article.classList.remove("sharedMemoryFocus"), 2200);
}

function openComposeModal() {
  document.getElementById("composeModal").hidden = false;
  document.body.style.overflow = "hidden";

  if (memoryState.auth) showMemoryForm();
  else showMemoryAuthStep();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal || modal.hidden) return;
  if (id === "composeModal") {
    stopMusicLibraryPreview();
    closeMusicLibraryManager();
    setPostPreviewOpen(false);
  }
  modal.hidden = true;
  document.body.style.overflow = "";
}

function showMemoryAuthStep() {
  document.getElementById("memoryAuthStep").hidden = false;
  document.getElementById("memoryForm").hidden = true;
  const postingIdentity = document.getElementById("postingIdentity");
  if (postingIdentity) postingIdentity.hidden = true;
  document.getElementById("authMessage").textContent = "";
  window.setTimeout(() => document.getElementById("memoryPin")?.focus(), 80);
}

function showMemoryForm() {
  document.getElementById("memoryAuthStep").hidden = true;
  document.getElementById("memoryForm").hidden = false;
  const postingIdentity = document.getElementById("postingIdentity");
  if (postingIdentity) postingIdentity.hidden = false;
  document.getElementById("postingRole").textContent = memoryState.auth?.role || "Officer";
  restoreRememberedPostedBy();
  loadMemoryMusicLibrary();
  renderComposePreview();
  window.setTimeout(() => document.getElementById("memoryTitle")?.focus(), 80);
}

async function testMusicLink() {
  const input = document.getElementById("memoryMusicUrl");
  const button = document.getElementById("testMusicLinkButton");
  const message = document.getElementById("musicTestMessage");
  const rawUrl = input?.value.trim() || "";

  if (!message || !button) return;

  message.className = "musicTestMessage";

  if (!rawUrl) {
    message.classList.add("bad");
    message.textContent = "Paste or choose a music link first.";
    return;
  }

  if (getYouTubeId(rawUrl)) {
    message.classList.add("ok");
    message.textContent = "YouTube song selected. It will use the embedded player.";
    return;
  }

  const sources = getManualMusicSources(rawUrl);
  if (!sources.length) {
    message.classList.add("bad");
    message.textContent = "This is not a valid music URL.";
    return;
  }

  button.disabled = true;
  button.textContent = "Testing...";
  message.textContent = "Checking if this link can load as audio...";

  const driveId = getDriveFileId(rawUrl);
  if (driveId) {
    let objectUrl = "";
    try {
      message.textContent = "Checking Google Drive audio through the app...";
      const proxyAudio = await fetchDriveAudioObjectUrl(driveId);
      objectUrl = proxyAudio.objectUrl;
      await testAudioSource(objectUrl);
      message.className = "musicTestMessage ok";
      message.textContent = "Playable through app audio proxy. This Drive music should work.";
      renderComposePreview();
      button.disabled = false;
      button.textContent = "Test Music Link";
      return;
    } catch (error) {
      // Continue to the direct Drive URLs below.
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  for (let index = 0; index < sources.length; index++) {
    try {
      await testAudioSource(sources[index]);
      input.value = sources[index];
      message.className = "musicTestMessage ok";
      message.textContent = "Playable. This music link should work.";
      renderComposePreview();
      button.disabled = false;
      button.textContent = "Test Music Link";
      return;
    } catch (error) {
      if (index === sources.length - 1) {
        message.className = "musicTestMessage bad";
        message.textContent = error.message || "This music link is not playable.";
      }
    }
  }

  button.disabled = false;
  button.textContent = "Test Music Link";
}

function normalizeMusicLibrarySong(raw, index = 0) {
  const url = safeHttpUrl(raw?.url || raw?.URL || raw?.MusicURL || "");
  const title = String(raw?.title || raw?.Title || "").trim();
  if (!url || !title) return null;

  return {
    id: String(raw?.id || raw?.ID || `song-${index + 1}`).trim(),
    title,
    category: String(raw?.category || raw?.Category || "Pang song").trim() || "Pang song",
    url
  };
}

function sortMemoryMusicLibrary(songs) {
  return songs.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, {
    sensitivity: "base",
    numeric: true
  }));
}

async function loadMemoryMusicLibrary(force = false) {
  if (memoryState.musicLibraryLoading) return;
  if (memoryState.musicLibraryLoaded && !force) {
    renderMemoryMusicLibrary();
    renderMusicLibraryManager();
    return;
  }

  memoryState.musicLibraryLoading = true;
  const list = document.getElementById("musicLibraryList");
  if (list) list.innerHTML = `<div class="musicLibraryStatus">Loading music library...</div>`;

  try {
    const db = getClassBoardFirestore();
    if (!db) throw new Error("Firebase is not ready.");

    const ref = db.collection("settings").doc(MEMORY_MUSIC_LIBRARY_DOC_ID);
    const snapshot = await ref.get();
    const data = snapshot.exists ? (snapshot.data() || {}) : {};
    memoryState.youtubeApiKey = String(data.YouTubeApiKey || "").trim();

    if (snapshot.exists && data.Initialized === true && Array.isArray(data.Songs)) {
      memoryState.musicLibrary = sortMemoryMusicLibrary(
        data.Songs.map(normalizeMusicLibrarySong).filter(Boolean)
      );
    } else {
      memoryState.musicLibrary = sortMemoryMusicLibrary(
        DEFAULT_MEMORY_MUSIC_LIBRARY.map(normalizeMusicLibrarySong).filter(Boolean)
      );
      const payload = {
        Initialized: true,
        Songs: memoryState.musicLibrary,
        UpdatedBy: memoryState.auth?.role || "Admin"
      };
      if (window.firebase?.firestore?.FieldValue) {
        payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await ref.set(payload, { merge: true });
    }

    memoryState.musicLibraryLoaded = true;
    syncYoutubeApiKeyField();
  } catch (error) {
    console.warn("Music library load failed:", error);
    if (!memoryState.musicLibrary.length) {
      memoryState.musicLibrary = sortMemoryMusicLibrary(
        DEFAULT_MEMORY_MUSIC_LIBRARY.map(normalizeMusicLibrarySong).filter(Boolean)
      );
    }
    const status = document.getElementById("musicLibraryStatus");
    if (status) status.textContent = "Using the built-in song list. Firebase sync is unavailable.";
  } finally {
    memoryState.musicLibraryLoading = false;
    renderMemoryMusicLibrary();
    renderMusicLibraryManager();
  }
}

function renderMemoryMusicLibrary() {
  const list = document.getElementById("musicLibraryList");
  if (!list) return;

  const query = String(document.getElementById("musicLibrarySearch")?.value || "").trim().toLowerCase();
  const currentUrl = String(document.getElementById("memoryMusicUrl")?.value || "").trim();
  const songs = memoryState.musicLibrary.filter((song) => {
    if (!query) return true;
    return `${song.title} ${song.category}`.toLowerCase().includes(query);
  });

  if (!songs.length) {
    list.innerHTML = `<div class="musicLibraryStatus">No matching songs.</div>`;
    return;
  }

  list.innerHTML = songs.map((song) => {
    const isSelected = currentUrl === song.url;
    const isPlaying = memoryState.musicPreviewId === song.id && memoryState.musicPreviewAudio && !memoryState.musicPreviewAudio.paused;
    return `
      <div class="musicLibraryItem ${isSelected ? "isSelected" : ""}">
        <button
          class="musicLibraryPlay"
          type="button"
          data-music-action="preview"
          data-music-id="${escapeAttr(song.id)}"
          aria-label="${isPlaying ? "Stop" : "Preview"} ${escapeAttr(song.title)}">
          ${isPlaying ? "&#9632;" : "&#9654;"}
        </button>
        <button
          class="musicLibrarySelect"
          type="button"
          data-music-action="select"
          data-music-id="${escapeAttr(song.id)}">
          <strong>${escapeHtml(song.title)}</strong>
          <small>${escapeHtml(song.category)}</small>
        </button>
        <span class="musicLibrarySelectedMark" aria-hidden="true">${isSelected ? "&#10003;" : ""}</span>
      </div>
    `;
  }).join("");
}

function handleMusicLibraryListClick(event) {
  const button = event.target.closest("[data-music-action]");
  if (!button) return;

  const song = memoryState.musicLibrary.find((item) => item.id === button.dataset.musicId);
  if (!song) return;

  if (button.dataset.musicAction === "preview") {
    previewMusicLibrarySong(song);
    return;
  }

  if (button.dataset.musicAction === "select") {
    selectMusicLibrarySong(song);
  }
}

function stopMusicLibraryPreview() {
  const audio = memoryState.musicPreviewAudio;
  memoryState.musicPreviewAudio = null;
  memoryState.musicPreviewId = "";
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
  renderMemoryMusicLibrary();
}

async function previewMusicLibrarySong(song) {
  if (memoryState.musicPreviewId === song.id && memoryState.musicPreviewAudio && !memoryState.musicPreviewAudio.paused) {
    stopMusicLibraryPreview();
    return;
  }

  stopMusicLibraryPreview();
  const audio = new Audio(song.url);
  audio.preload = "none";
  memoryState.musicPreviewAudio = audio;
  memoryState.musicPreviewId = song.id;
  audio.addEventListener("ended", () => {
    if (memoryState.musicPreviewAudio === audio) stopMusicLibraryPreview();
  }, { once: true });
  audio.addEventListener("error", () => {
    if (memoryState.musicPreviewAudio !== audio) return;
    stopMusicLibraryPreview();
    showMemoryToast("This song could not be previewed.");
  }, { once: true });

  try {
    await audio.play();
    renderMemoryMusicLibrary();
  } catch (error) {
    stopMusicLibraryPreview();
    showMemoryToast("Tap preview again or check the music link.");
  }
}

function selectMusicLibrarySong(song) {
  const urlInput = document.getElementById("memoryMusicUrl");
  const titleInput = document.getElementById("memoryMusicTitle");
  if (!urlInput || !titleInput) return;

  urlInput.value = song.url;
  titleInput.value = song.title;
  closeYoutubeSongPreview();
  const message = document.getElementById("musicLibraryStatus");
  if (message) message.textContent = `Selected: ${song.title}`;
  renderMemoryMusicLibrary();
  renderComposePreview();
}

function syncYoutubeApiKeyField() {
  const input = document.getElementById("youtubeApiKey");
  if (input && document.activeElement !== input) input.value = memoryState.youtubeApiKey;
}

async function saveYoutubeApiKey() {
  if (!memoryState.auth) return;
  const input = document.getElementById("youtubeApiKey");
  const message = document.getElementById("youtubeApiKeyMessage");
  const button = document.getElementById("saveYoutubeApiKey");
  const apiKey = String(input?.value || "").trim();

  if (!apiKey) {
    if (message) message.textContent = "Paste a restricted YouTube Data API v3 key.";
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = "Saving API key...";

  try {
    const db = getClassBoardFirestore();
    if (!db) throw new Error("Firebase is not ready.");
    const payload = {
      YouTubeApiKey: apiKey,
      UpdatedBy: memoryState.auth.role
    };
    if (window.firebase?.firestore?.FieldValue) {
      payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await db.collection("settings").doc(MEMORY_MUSIC_LIBRARY_DOC_ID).set(payload, { merge: true });
    memoryState.youtubeApiKey = apiKey;
    if (message) message.textContent = "YouTube search is ready.";
    showMemoryToast("YouTube search API key saved.");
  } catch (error) {
    if (message) message.textContent = error.message || "Could not save the API key.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function searchYoutubeSongs() {
  const input = document.getElementById("youtubeSongSearch");
  const button = document.getElementById("searchYoutubeSongsButton");
  const message = document.getElementById("youtubeSongSearchMessage");
  const results = document.getElementById("youtubeSongResults");
  const query = String(input?.value || "").trim();

  if (!query) {
    if (message) message.textContent = "Enter a song title or artist.";
    return;
  }
  if (!memoryState.youtubeApiKey) {
    if (message) message.textContent = "Open Manage and save a YouTube Data API key first.";
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = "Searching YouTube...";
  if (results) results.innerHTML = "";
  closeYoutubeSongPreview();

  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      videoEmbeddable: "true",
      safeSearch: "strict",
      maxResults: "8",
      q: `${query} music`,
      key: memoryState.youtubeApiKey
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      referrer: window.location.href,
      referrerPolicy: "origin"
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "YouTube search failed.");
    }

    memoryState.youtubeSearchResults = (data.items || []).map((item) => ({
      id: String(item?.id?.videoId || ""),
      title: decodeHtmlText(item?.snippet?.title || ""),
      channel: decodeHtmlText(item?.snippet?.channelTitle || ""),
      thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || ""
    })).filter((song) => song.id && song.title);
    renderYoutubeSongResults();
    if (message) {
      message.textContent = memoryState.youtubeSearchResults.length
        ? `${memoryState.youtubeSearchResults.length} results found.`
        : "No embeddable songs found.";
    }
  } catch (error) {
    memoryState.youtubeSearchResults = [];
    if (results) results.innerHTML = "";
    if (message) message.textContent = error.message || "Could not search YouTube.";
  } finally {
    if (button) button.disabled = false;
  }
}

function decodeHtmlText(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value || "");
  return textarea.value;
}

function renderYoutubeSongResults() {
  const container = document.getElementById("youtubeSongResults");
  if (!container) return;
  const currentId = getYouTubeId(document.getElementById("memoryMusicUrl")?.value || "");

  container.innerHTML = memoryState.youtubeSearchResults.map((song) => `
    <article class="youtubeSongResult ${currentId === song.id ? "isSelected" : ""}">
      <img src="${escapeAttr(song.thumbnail)}" alt="" loading="lazy" />
      <div>
        <strong>${escapeHtml(song.title)}</strong>
        <small>${escapeHtml(song.channel)}</small>
      </div>
      <div class="youtubeSongActions">
        <button type="button" data-youtube-action="preview" data-youtube-id="${escapeAttr(song.id)}">Preview</button>
        <button type="button" data-youtube-action="select" data-youtube-id="${escapeAttr(song.id)}">${currentId === song.id ? "Selected" : "Use Song"}</button>
      </div>
    </article>
  `).join("");
}

function handleYoutubeSongResultClick(event) {
  const button = event.target.closest("[data-youtube-action]");
  if (!button) return;
  const song = memoryState.youtubeSearchResults.find((item) => item.id === button.dataset.youtubeId);
  if (!song) return;

  if (button.dataset.youtubeAction === "preview") {
    previewYoutubeSong(song);
  } else if (button.dataset.youtubeAction === "select") {
    selectYoutubeSong(song);
  }
}

function previewYoutubeSong(song) {
  const container = document.getElementById("youtubeSongPreview");
  if (!container) return;
  memoryState.youtubePreviewId = song.id;
  container.hidden = false;
  container.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${escapeAttr(song.id)}?autoplay=1&playsinline=1&controls=1&rel=0"
      title="${escapeAttr(`Preview ${song.title}`)}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen></iframe>
    <button type="button" data-youtube-action="close-preview" aria-label="Close preview">&times;</button>
  `;
  container.querySelector("[data-youtube-action='close-preview']")?.addEventListener("click", closeYoutubeSongPreview);
}

function closeYoutubeSongPreview() {
  const container = document.getElementById("youtubeSongPreview");
  memoryState.youtubePreviewId = "";
  if (!container) return;
  container.innerHTML = "";
  container.hidden = true;
}

function selectYoutubeSong(song) {
  stopMusicLibraryPreview();
  const urlInput = document.getElementById("memoryMusicUrl");
  const titleInput = document.getElementById("memoryMusicTitle");
  if (!urlInput || !titleInput) return;

  urlInput.value = `https://www.youtube.com/watch?v=${song.id}`;
  titleInput.value = `${song.title} - ${song.channel}`;
  const message = document.getElementById("youtubeSongSearchMessage");
  if (message) message.textContent = `Selected: ${song.title}`;
  renderYoutubeSongResults();
  renderMemoryMusicLibrary();
  renderComposePreview();
}

async function openMusicLibraryManager() {
  if (!memoryState.auth) return;
  await loadMemoryMusicLibrary();

  const modal = document.getElementById("musicLibraryModal");
  if (!modal) return;
  modal.hidden = false;
  syncYoutubeApiKeyField();
  resetMusicLibraryEditor();
  renderMusicLibraryManager();

  const currentUrl = document.getElementById("memoryMusicUrl")?.value.trim() || "";
  const currentTitle = document.getElementById("memoryMusicTitle")?.value.trim() || "";
  if (currentUrl && !memoryState.musicLibrary.some((song) => song.url === currentUrl)) {
    document.getElementById("musicLibrarySongTitle").value = currentTitle;
    document.getElementById("musicLibrarySongUrl").value = currentUrl;
  }
  window.setTimeout(() => document.getElementById("musicLibrarySongTitle")?.focus(), 80);
}

function closeMusicLibraryManager() {
  const modal = document.getElementById("musicLibraryModal");
  if (modal) modal.hidden = true;
  memoryState.selectedMusicLibraryIds.clear();
  resetMusicLibraryEditor();
  updateMusicLibrarySelectionBar();
}

function resetMusicLibraryEditor() {
  const form = document.getElementById("musicLibraryForm");
  form?.reset();
  const idInput = document.getElementById("musicLibrarySongId");
  if (idInput) idInput.value = "";
  const category = document.getElementById("musicLibrarySongCategory");
  if (category) category.value = "Pang song";
  const cancel = document.getElementById("cancelMusicLibraryEdit");
  if (cancel) cancel.hidden = true;
  const submit = document.getElementById("saveMusicLibrarySong");
  if (submit) submit.textContent = "Add Song";
  const message = document.getElementById("musicLibraryManagerMessage");
  if (message) message.textContent = "";
}

function renderMusicLibraryManager() {
  const list = document.getElementById("musicLibraryManageList");
  if (!list) return;

  const validIds = new Set(memoryState.musicLibrary.map((song) => song.id));
  Array.from(memoryState.selectedMusicLibraryIds).forEach((id) => {
    if (!validIds.has(id)) memoryState.selectedMusicLibraryIds.delete(id);
  });

  if (!memoryState.musicLibrary.length) {
    list.innerHTML = `<div class="musicLibraryStatus">No songs in the library yet.</div>`;
    memoryState.selectedMusicLibraryIds.clear();
    updateMusicLibrarySelectionBar();
    return;
  }

  list.innerHTML = memoryState.musicLibrary.map((song) => `
    <div class="musicLibraryManageItem">
      <label class="musicLibrarySelectCheck" aria-label="Select ${escapeAttr(song.title)}">
        <input
          type="checkbox"
          data-library-select
          data-music-id="${escapeAttr(song.id)}"
          ${memoryState.selectedMusicLibraryIds.has(song.id) ? "checked" : ""} />
      </label>
      <div>
        <strong>${escapeHtml(song.title)}</strong>
        <small>${escapeHtml(song.category)}</small>
      </div>
      <button type="button" data-library-action="edit" data-music-id="${escapeAttr(song.id)}">Edit</button>
      <button class="danger" type="button" data-library-action="delete" data-music-id="${escapeAttr(song.id)}">Delete</button>
    </div>
  `).join("");
  updateMusicLibrarySelectionBar();
}

function handleMusicLibrarySelectionChange(event) {
  const checkbox = event.target.closest("[data-library-select]");
  if (!checkbox) return;

  if (checkbox.checked) memoryState.selectedMusicLibraryIds.add(checkbox.dataset.musicId);
  else memoryState.selectedMusicLibraryIds.delete(checkbox.dataset.musicId);
  updateMusicLibrarySelectionBar();
}

function toggleAllMusicLibrarySongs(event) {
  if (event.target.checked) {
    memoryState.musicLibrary.forEach((song) => memoryState.selectedMusicLibraryIds.add(song.id));
  } else {
    memoryState.selectedMusicLibraryIds.clear();
  }
  renderMusicLibraryManager();
}

function updateMusicLibrarySelectionBar() {
  const selectAll = document.getElementById("selectAllMusicLibrarySongs");
  const deleteButton = document.getElementById("deleteSelectedMusicLibrarySongs");
  const countLabel = document.getElementById("selectedMusicLibraryCount");
  const selectedCount = memoryState.selectedMusicLibraryIds.size;
  const totalCount = memoryState.musicLibrary.length;

  if (selectAll) {
    selectAll.checked = totalCount > 0 && selectedCount === totalCount;
    selectAll.indeterminate = selectedCount > 0 && selectedCount < totalCount;
    selectAll.disabled = totalCount === 0;
  }
  if (deleteButton) deleteButton.disabled = selectedCount === 0;
  if (countLabel) countLabel.textContent = selectedCount ? `${selectedCount} selected` : `${totalCount} songs`;
}

async function saveMusicLibrarySong(event) {
  event.preventDefault();
  if (!memoryState.auth) return;

  const idInput = document.getElementById("musicLibrarySongId");
  const titleInput = document.getElementById("musicLibrarySongTitle");
  const urlInput = document.getElementById("musicLibrarySongUrl");
  const categoryInput = document.getElementById("musicLibrarySongCategory");
  const message = document.getElementById("musicLibraryManagerMessage");
  const submit = document.getElementById("saveMusicLibrarySong");
  const title = titleInput?.value.trim() || "";
  const url = safeHttpUrl(urlInput?.value.trim() || "");
  const category = categoryInput?.value.trim() || "Pang song";

  if (!title || !url) {
    if (message) message.textContent = "Song title and direct audio link are required.";
    return;
  }

  const existingId = idInput?.value.trim() || "";
  const duplicate = memoryState.musicLibrary.find((song) => song.url === url && song.id !== existingId);
  if (duplicate) {
    if (message) message.textContent = "This music link is already in the library.";
    return;
  }

  const id = existingId || (
    window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `music-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const nextSong = { id, title, category, url };
  const nextSongs = memoryState.musicLibrary.filter((song) => song.id !== id);
  nextSongs.push(nextSong);

  if (submit) submit.disabled = true;
  if (message) message.textContent = existingId ? "Saving changes..." : "Adding song...";

  try {
    await writeMemoryMusicLibrary(nextSongs);
    memoryState.musicLibrary = sortMemoryMusicLibrary(nextSongs);
    memoryState.musicLibraryLoaded = true;
    resetMusicLibraryEditor();
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    showMemoryToast(existingId ? "Song updated." : "Song added to the library.");
  } catch (error) {
    if (message) message.textContent = error.message || "Could not save this song.";
  } finally {
    if (submit) submit.disabled = false;
  }
}

function parseBulkMusicEntries(rawValue, category) {
  const lines = String(rawValue || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const songs = [];
  let pendingTitle = "";
  let invalidLines = 0;

  lines.forEach((line) => {
    const urlMatch = line.match(/https?:\/\/[^\s|]+/i);
    if (!urlMatch) {
      if (pendingTitle) invalidLines += 1;
      pendingTitle = line.replace(/^[\s|,;:\-]+|[\s|,;:\-]+$/g, "").trim();
      return;
    }

    const rawUrl = urlMatch[0].replace(/[),.;]+$/g, "");
    const url = safeHttpUrl(rawUrl);
    let title = line
      .replace(urlMatch[0], "")
      .replace(/^[\s|,;:\-]+|[\s|,;:\-]+$/g, "")
      .trim();

    if (!title) title = pendingTitle;
    pendingTitle = "";

    if (!url) {
      invalidLines += 1;
      return;
    }

    songs.push({
      id: createMusicLibraryIdFromUrl(url),
      title,
      category,
      url
    });
  });

  if (pendingTitle) invalidLines += 1;
  return { songs, invalidLines };
}

function extractJukeHostTitlesFromPaste(rawValue, category = "") {
  const lines = String(rawValue || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const titles = [];
  const normalizedCategory = String(category || "").trim().toLowerCase();

  lines.forEach((line) => {
    const cells = line.split(/\t+/).map((cell) => cell.trim()).filter(Boolean);
    if (cells.length >= 2 && cells.some((cell) => /^\d{1,2}:\d{2}$/.test(cell))) {
      const title = cleanPastedJukeHostTitle(cells[0], normalizedCategory);
      if (title) titles.push(title);
      return;
    }

    const inlineRow = line.match(/^(.*?)\s+(\d{1,2}:\d{2})\s+(.+)$/);
    if (inlineRow) {
      const title = cleanPastedJukeHostTitle(inlineRow[1], normalizedCategory);
      if (title) titles.push(title);
    }
  });

  if (titles.length) return titles;

  lines.forEach((line, index) => {
    if (!/^\d{1,2}:\d{2}$/.test(line)) return;
    for (let previous = index - 1; previous >= 0; previous -= 1) {
      const title = cleanPastedJukeHostTitle(lines[previous], normalizedCategory);
      if (!title) continue;
      titles.push(title);
      break;
    }
  });

  if (titles.length) return titles;

  return lines
    .map((line) => cleanPastedJukeHostTitle(line, normalizedCategory))
    .filter(Boolean);
}

function cleanPastedJukeHostTitle(value, normalizedCategory = "") {
  const title = String(value || "")
    .replace(/^\s*\d+[.)-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = title.toLowerCase();

  if (!title || /^\d{1,2}:\d{2}$/.test(title)) return "";
  if (normalizedCategory && normalized === normalizedCategory) return "";
  if (/^(title|category|duration|library|upload|uploads|sort by|search)$/i.test(title.replace(/[↑↓↕]/g, "").trim())) return "";
  if (/^(profile|security|appearance|logout|login|home|settings)$/i.test(title)) return "";
  return title;
}

async function autoFillSingleMusicTitle() {
  const titleInput = document.getElementById("musicLibrarySongTitle");
  const urlInput = document.getElementById("musicLibrarySongUrl");
  const message = document.getElementById("musicLibraryManagerMessage");
  const url = safeHttpUrl(urlInput?.value.trim() || "");
  if (!titleInput || titleInput.value.trim() || !url) return;

  if (message) message.textContent = "Detecting song title...";
  try {
    const titles = await requestMusicMetadataBatch([url]);
    const detected = titles.get(url) || "";
    if (detected) {
      titleInput.value = detected;
      if (message) message.textContent = "Song title detected.";
    } else if (message) {
      message.textContent = "Title could not be detected. Please enter it manually.";
    }
  } catch (error) {
    if (message) message.textContent = error.message || "Title detection is unavailable.";
  }
}

async function requestMusicMetadataBatch(urls) {
  const uniqueUrls = Array.from(new Set((urls || []).map(safeHttpUrl).filter(Boolean))).slice(0, 100);
  if (!uniqueUrls.length) return new Map();

  const result = await postMemoryApi("musicMetadataBatch", {
    Role: memoryState.auth?.role || "",
    Urls: uniqueUrls
  });
  if (!result?.success || !Array.isArray(result.items)) {
    throw new Error(result?.message || "Music title service is not available.");
  }

  return new Map(result.items.map((item) => [
    safeHttpUrl(item.url),
    cleanDetectedMusicTitle(item.title)
  ]));
}

async function requestMusicMetadataInChunks(urls) {
  const uniqueUrls = Array.from(new Set((urls || []).map(safeHttpUrl).filter(Boolean)));
  const titles = new Map();

  for (let start = 0; start < uniqueUrls.length; start += 100) {
    const batch = await requestMusicMetadataBatch(uniqueUrls.slice(start, start + 100));
    batch.forEach((title, url) => titles.set(url, title));
  }
  return titles;
}

async function detectMusicTitleFromAudio(url) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = window.setTimeout(() => controller?.abort(), 12000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Range: "bytes=0-262143" },
      signal: controller?.signal
    });
    if (!response.ok) return "";

    const dispositionTitle = getTitleFromContentDisposition(response.headers.get("content-disposition"));
    const buffer = await readResponsePrefix(response, 262144);
    const tags = readId3MusicTags(buffer);
    const taggedTitle = String(tags.title || "").trim();
    const taggedArtist = String(tags.artist || "").trim();

    if (taggedTitle) {
      if (taggedArtist && !taggedTitle.toLowerCase().includes(taggedArtist.toLowerCase())) {
        return cleanDetectedMusicTitle(`${taggedArtist} - ${taggedTitle}`);
      }
      return cleanDetectedMusicTitle(taggedTitle);
    }
    return cleanDetectedMusicTitle(dispositionTitle);
  } catch (error) {
    return "";
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readResponsePrefix(response, maxBytes) {
  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    return buffer.slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = maxBytes - total;
      const chunk = value.length > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.length;
      if (total >= maxBytes) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    joined.set(chunk, offset);
    offset += chunk.length;
  });
  return joined.buffer;
}

function getTitleFromContentDisposition(value) {
  const header = String(value || "");
  if (!header) return "";

  const encoded = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  const plain = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  const raw = encoded?.[1] || plain?.[1] || "";
  try {
    return decodeURIComponent(raw.trim());
  } catch (error) {
    return raw.trim();
  }
}

function readId3MusicTags(buffer) {
  const bytes = new Uint8Array(buffer || 0);
  if (bytes.length < 10 || String.fromCharCode(...bytes.slice(0, 3)) !== "ID3") {
    return {};
  }

  const version = bytes[3];
  const tagSize = readSynchsafeInt(bytes, 6);
  const end = Math.min(bytes.length, 10 + tagSize);
  const tags = {};
  let offset = 10;

  while (offset < end) {
    const isV22 = version === 2;
    const headerSize = isV22 ? 6 : 10;
    if (offset + headerSize > end) break;

    const frameId = String.fromCharCode(...bytes.slice(offset, offset + (isV22 ? 3 : 4)));
    if (!frameId.replace(/\0/g, "").trim()) break;
    const frameSize = isV22
      ? ((bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5])
      : (version === 4 ? readSynchsafeInt(bytes, offset + 4) : readUint32(bytes, offset + 4));
    if (!frameSize || offset + headerSize + frameSize > end) break;

    const frameData = bytes.slice(offset + headerSize, offset + headerSize + frameSize);
    if (frameId === "TIT2" || frameId === "TT2") tags.title = decodeId3TextFrame(frameData);
    if (frameId === "TPE1" || frameId === "TP1") tags.artist = decodeId3TextFrame(frameData);
    if (tags.title && tags.artist) break;
    offset += headerSize + frameSize;
  }

  return tags;
}

function readSynchsafeInt(bytes, offset) {
  return ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f);
}

function readUint32(bytes, offset) {
  return ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3];
}

function decodeId3TextFrame(frameData) {
  if (!frameData?.length) return "";
  const encoding = frameData[0];
  const content = frameData.slice(1);

  try {
    if (encoding === 3) return new TextDecoder("utf-8").decode(content).replace(/\0/g, "").trim();
    if (encoding === 1) {
      const littleEndian = content[0] === 0xff && content[1] === 0xfe;
      const data = (content[0] === 0xff || content[0] === 0xfe) ? content.slice(2) : content;
      return new TextDecoder(littleEndian ? "utf-16le" : "utf-16be").decode(data).replace(/\0/g, "").trim();
    }
    if (encoding === 2) return new TextDecoder("utf-16be").decode(content).replace(/\0/g, "").trim();
    return Array.from(content, (byte) => String.fromCharCode(byte)).join("").replace(/\0/g, "").trim();
  } catch (error) {
    return "";
  }
}

function cleanDetectedMusicTitle(value) {
  return String(value || "")
    .replace(/\.(mp3|m4a|aac|ogg|wav|webm)$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
}

function createMusicLibraryIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const lastPart = parsed.pathname.split("/").filter(Boolean).pop() || "";
    if (/^[a-z0-9-]{12,}$/i.test(lastPart)) return lastPart;
  } catch (error) {
    // Use a generated ID below.
  }

  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `music-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createJukeHostFallbackTitle(url) {
  try {
    const trackId = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    const shortId = trackId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
    if (shortId) return `JukeHost Audio ${shortId}`;
  } catch (error) {
    // Use the generic fallback below.
  }

  return "JukeHost Audio";
}

async function importMusicLibrarySongs() {
  if (!memoryState.auth) return;

  const entriesInput = document.getElementById("bulkMusicLibraryEntries");
  const categoryInput = document.getElementById("bulkMusicLibraryCategory");
  const message = document.getElementById("bulkMusicLibraryMessage");
  const button = document.getElementById("importMusicLibrarySongs");
  const category = categoryInput?.value.trim() || "Pang song";
  const parsed = parseBulkMusicEntries(entriesInput?.value || "", category);

  if (!parsed.songs.length) {
    if (message) {
      message.textContent = "Paste at least one direct JukeHost audio link.";
    }
    return;
  }

  const existingUrls = new Set(memoryState.musicLibrary.map((song) => song.url));
  const existingIds = new Set(memoryState.musicLibrary.map((song) => song.id));
  const batchUrls = new Set();
  const imported = [];
  let duplicates = 0;

  parsed.songs.forEach((song) => {
    if (existingUrls.has(song.url) || batchUrls.has(song.url)) {
      duplicates += 1;
      return;
    }

    if (existingIds.has(song.id)) {
      song.id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${song.id}-${Math.random().toString(36).slice(2, 7)}`;
    }
    existingIds.add(song.id);
    batchUrls.add(song.url);
    imported.push(song);
  });

  if (!imported.length) {
    if (message) message.textContent = `No new songs imported. ${duplicates} duplicate link${duplicates === 1 ? " was" : "s were"} skipped.`;
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = `Saving ${imported.length} song${imported.length === 1 ? "" : "s"}...`;

  try {
    const readySongs = imported.map((song) => ({
      ...song,
      title: song.title || createJukeHostFallbackTitle(song.url)
    }));
    const nextSongs = sortMemoryMusicLibrary([...memoryState.musicLibrary, ...readySongs]);
    await writeMemoryMusicLibrary(nextSongs);
    memoryState.musicLibrary = nextSongs;
    memoryState.musicLibraryLoaded = true;
    if (entriesInput) entriesInput.value = "";
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();

    const notes = [`Imported ${readySongs.length} song${readySongs.length === 1 ? "" : "s"}.`];
    if (duplicates) notes.push(`Skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.`);
    if (parsed.invalidLines) notes.push(`${parsed.invalidLines} incomplete line${parsed.invalidLines === 1 ? "" : "s"} ignored.`);
    if (message) message.textContent = notes.join(" ");
    showMemoryToast(`${readySongs.length} song${readySongs.length === 1 ? "" : "s"} added to ${category}.`);
  } catch (error) {
    if (message) message.textContent = error.message || "Could not import these songs.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function repairMissingMusicTitles() {
  if (!memoryState.auth) return;

  const button = document.getElementById("detectMissingMusicTitles");
  const message = document.getElementById("bulkMusicLibraryMessage");
  const missingSongs = memoryState.musicLibrary.filter((song) =>
    /^JukeHost Song \d+$/i.test(song.title) ||
    /^[a-f0-9-]{24,}$/i.test(song.title)
  );

  if (!missingSongs.length) {
    if (message) message.textContent = "No missing song titles found.";
    return;
  }

  if (button) button.disabled = true;
  if (message) message.textContent = `Checking ${missingSongs.length} missing title${missingSongs.length === 1 ? "" : "s"} in one batch...`;

  try {
    const detectedTitles = await requestMusicMetadataInChunks(missingSongs.map((song) => song.url));
    let fixed = 0;
    const nextSongs = memoryState.musicLibrary.map((song) => {
      const detected = detectedTitles.get(song.url);
      if (!detected) return song;
      fixed += 1;
      return { ...song, title: detected };
    });

    if (fixed) {
      await writeMemoryMusicLibrary(nextSongs);
      memoryState.musicLibrary = sortMemoryMusicLibrary(nextSongs);
      renderMusicLibraryManager();
      renderMemoryMusicLibrary();
    }

    const unresolved = missingSongs.length - fixed;
    if (message) {
      message.textContent = fixed
        ? `Fixed ${fixed} title${fixed === 1 ? "" : "s"}.${unresolved ? ` ${unresolved} still need manual editing.` : ""}`
        : "No titles could be detected. Check that the Apps Script update is deployed.";
    }
    if (fixed) showMemoryToast(`${fixed} music title${fixed === 1 ? "" : "s"} fixed.`);
  } catch (error) {
    if (message) message.textContent = error.message || "Could not detect the missing titles.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function removeGenericMusicTitles() {
  if (!memoryState.auth) return;

  const genericSongs = memoryState.musicLibrary.filter((song) =>
    /^JukeHost Song \d+$/i.test(song.title) ||
    /^[a-f0-9-]{24,}$/i.test(song.title)
  );
  const message = document.getElementById("bulkMusicLibraryMessage");
  const button = document.getElementById("removeGenericMusicTitles");

  if (!genericSongs.length) {
    if (message) message.textContent = "No generic JukeHost song names found.";
    return;
  }

  if (!window.confirm(`Remove all ${genericSongs.length} generic JukeHost songs from the library?`)) return;

  const genericIds = new Set(genericSongs.map((song) => song.id));
  const nextSongs = memoryState.musicLibrary.filter((song) => !genericIds.has(song.id));
  if (button) button.disabled = true;
  if (message) message.textContent = `Removing ${genericSongs.length} generic song${genericSongs.length === 1 ? "" : "s"}...`;

  try {
    await writeMemoryMusicLibrary(nextSongs);
    if (genericIds.has(memoryState.musicPreviewId)) stopMusicLibraryPreview();
    genericIds.forEach((id) => memoryState.selectedMusicLibraryIds.delete(id));
    memoryState.musicLibrary = nextSongs;
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    if (message) message.textContent = `Removed ${genericSongs.length} generic song${genericSongs.length === 1 ? "" : "s"}.`;
    showMemoryToast("Generic JukeHost songs removed.");
  } catch (error) {
    if (message) message.textContent = error.message || "Could not remove the generic songs.";
  } finally {
    if (button) button.disabled = false;
  }
}

async function writeMemoryMusicLibrary(songs) {
  const db = getClassBoardFirestore();
  if (!db) throw new Error("Firebase is not ready.");

  const payload = {
    Initialized: true,
    Songs: sortMemoryMusicLibrary(songs).map(({ id, title, category, url }) => ({ id, title, category, url })),
    UpdatedBy: memoryState.auth?.role || "Officer"
  };
  if (window.firebase?.firestore?.FieldValue) {
    payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
  }
  await db.collection("settings").doc(MEMORY_MUSIC_LIBRARY_DOC_ID).set(payload, { merge: true });
}

function handleMusicLibraryManageClick(event) {
  const button = event.target.closest("[data-library-action]");
  if (!button) return;
  const song = memoryState.musicLibrary.find((item) => item.id === button.dataset.musicId);
  if (!song) return;

  if (button.dataset.libraryAction === "edit") {
    document.getElementById("musicLibrarySongId").value = song.id;
    document.getElementById("musicLibrarySongTitle").value = song.title;
    document.getElementById("musicLibrarySongUrl").value = song.url;
    document.getElementById("musicLibrarySongCategory").value = song.category;
    document.getElementById("cancelMusicLibraryEdit").hidden = false;
    document.getElementById("saveMusicLibrarySong").textContent = "Save Changes";
    document.getElementById("musicLibraryManagerMessage").textContent = "";
    document.getElementById("musicLibrarySongTitle").focus();
    return;
  }

  if (button.dataset.libraryAction === "delete") {
    deleteMusicLibrarySong(song);
  }
}

async function deleteMusicLibrarySong(song) {
  if (!memoryState.auth) return;
  if (!window.confirm(`Delete "${song.title}" from the music library?`)) return;

  const nextSongs = memoryState.musicLibrary.filter((item) => item.id !== song.id);
  try {
    await writeMemoryMusicLibrary(nextSongs);
    if (memoryState.musicPreviewId === song.id) stopMusicLibraryPreview();
    memoryState.selectedMusicLibraryIds.delete(song.id);
    memoryState.musicLibrary = nextSongs;
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    showMemoryToast("Song deleted from the library.");
  } catch (error) {
    const message = document.getElementById("musicLibraryManagerMessage");
    if (message) message.textContent = error.message || "Could not delete this song.";
  }
}

async function deleteSelectedMusicLibrarySongs() {
  if (!memoryState.auth || !memoryState.selectedMusicLibraryIds.size) return;

  const selectedIds = new Set(memoryState.selectedMusicLibraryIds);
  const selectedCount = selectedIds.size;
  const deletingAll = selectedCount === memoryState.musicLibrary.length;
  const prompt = deletingAll
    ? `Delete all ${selectedCount} songs from the Music Library?`
    : `Delete ${selectedCount} selected song${selectedCount === 1 ? "" : "s"} from the Music Library?`;
  if (!window.confirm(prompt)) return;

  const button = document.getElementById("deleteSelectedMusicLibrarySongs");
  const message = document.getElementById("musicLibraryManagerMessage");
  const nextSongs = memoryState.musicLibrary.filter((song) => !selectedIds.has(song.id));
  if (button) button.disabled = true;
  if (message) message.textContent = `Deleting ${selectedCount} song${selectedCount === 1 ? "" : "s"}...`;

  try {
    await writeMemoryMusicLibrary(nextSongs);
    if (selectedIds.has(memoryState.musicPreviewId)) stopMusicLibraryPreview();
    memoryState.musicLibrary = nextSongs;
    memoryState.selectedMusicLibraryIds.clear();
    renderMusicLibraryManager();
    renderMemoryMusicLibrary();
    if (message) message.textContent = "";
    showMemoryToast(`${selectedCount} song${selectedCount === 1 ? "" : "s"} deleted.`);
  } catch (error) {
    if (message) message.textContent = error.message || "Could not delete the selected songs.";
    updateMusicLibrarySelectionBar();
  }
}

async function unlockMemoryPosting() {
  const role = document.getElementById("memoryRole").value;
  const pin = document.getElementById("memoryPin").value.trim();
  const message = document.getElementById("authMessage");
  const button = document.getElementById("unlockPostingButton");

  if (!pin) {
    message.textContent = "Enter your PIN.";
    return;
  }

  button.disabled = true;
  message.textContent = "Checking access...";

  try {
    const user = await window.SFKAuth.signInWithPin(role, pin);
    const authenticatedRole = window.SFKAuth.roleForUser(user);
    memoryState.auth = { role: authenticatedRole === "admin" ? "Admin" : "Officer" };
    document.getElementById("memoryPin").value = "";
    message.textContent = "";
    showMemoryForm();
    renderMemories();
  } catch (error) {
    message.textContent = "Incorrect PIN or access is not configured.";
  } finally {
    button.disabled = false;
  }
}

async function resetMemoryAuth() {
  stopMusicLibraryPreview();
  closeMusicLibraryManager();
  memoryState.auth = null;
  await window.SFKAuth?.signOut();
  showMemoryAuthStep();
  renderMemories();
}

function setMusicFieldsOpen(open) {
  const panel = document.getElementById("musicFieldsPanel");
  const button = document.getElementById("toggleMusicFieldsButton");
  if (!panel || !button) return;

  panel.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.classList.toggle("isOpen", Boolean(open));
  button.innerHTML = open
    ? `<span>&#9835;</span> Hide background music`
    : `<span>&#9835;</span> Add background music`;

  if (open) {
    window.setTimeout(() => document.getElementById("youtubeSongSearch")?.focus(), 80);
  }
}

function toggleMusicFields(forceOpen) {
  const panel = document.getElementById("musicFieldsPanel");
  const next = typeof forceOpen === "boolean" ? forceOpen : Boolean(panel?.hidden);
  setMusicFieldsOpen(next);
}

function setAdditionalMusicSourcesOpen(open) {
  const panel = document.getElementById("additionalMusicSources");
  const button = document.getElementById("toggleAdditionalMusicSources");
  if (!panel || !button) return;

  panel.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.textContent = open
    ? "Hide Music Library & Direct Link"
    : "Show Music Library & Direct Link";
}

function toggleAdditionalMusicSources() {
  const panel = document.getElementById("additionalMusicSources");
  setAdditionalMusicSourcesOpen(Boolean(panel?.hidden));
}

function hasMusicDraft() {
  return Boolean(
    document.getElementById("memoryMusicUrl")?.value.trim() ||
    document.getElementById("memoryMusicTitle")?.value.trim()
  );
}

function restoreMemoryAuth() {
  window.SFKAuth?.onAuthStateChanged((user, role) => {
    memoryState.auth = user && role
      ? { role: role === "admin" ? "Admin" : "Officer" }
      : null;
    renderMemories();

    const composeModal = document.getElementById("composeModal");
    if (composeModal && !composeModal.hidden) {
      if (memoryState.auth) showMemoryForm();
      else showMemoryAuthStep();
    }
  });
}

function handleMemoryFiles(event) {
  const incoming = Array.from(event.target.files || []);
  const seen = new Set();
  const files = incoming.filter((file) => {
    const key = `${file.name}|${file.size}|${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_MEDIA_FILES);

  memoryState.selectedFiles = files;
  memoryState.coverIndex = 0;
  memoryState.previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  memoryState.previewObjectUrls = [];
  renderSelectedMediaPreview();
  renderComposePreview();

  if (incoming.length > MAX_MEDIA_FILES) {
    showMemoryToast(`Only the first ${MAX_MEDIA_FILES} files will be uploaded.`);
  }
}

function renderSelectedMediaPreview() {
  const container = document.getElementById("mediaPreview");
  if (!container) return;

  if (memoryState.selectedFiles.length === 0) {
    container.innerHTML = "";
    return;
  }

  const uploadStatus = memoryState.uploadStatus
    ? `<div class="mediaUploadStatus" style="margin:8px 0;padding:8px 10px;border-radius:10px;background:#eef6ff;color:#164e63;font-weight:700;font-size:13px">${escapeHtml(memoryState.uploadStatus)}</div>`
    : "";
  if (memoryState.previewObjectUrls.length !== memoryState.selectedFiles.length) {
    memoryState.previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    memoryState.previewObjectUrls = memoryState.selectedFiles.map((file) => URL.createObjectURL(file));
  }

  container.innerHTML = `<div class="mediaSelectionCounter">${memoryState.selectedFiles.length}/${MAX_MEDIA_FILES} photos selected</div>${uploadStatus}` + memoryState.selectedFiles.map((file, index) => {
    const url = memoryState.previewObjectUrls[index];
    const preview = file.type.startsWith("video/")
      ? `<video src="${escapeAttr(url)}" muted></video>`
      : `<img loading="lazy" decoding="async" src="${escapeAttr(url)}" alt="" />`;

    return `
      <div class="previewItem ${index === memoryState.coverIndex ? "isCover" : ""}" data-preview-index="${index}">
        ${preview}
        <span>${escapeHtml(file.name)}</span>
        <div class="previewControls">
          <button type="button" data-preview-action="cover" ${index === memoryState.coverIndex ? "disabled" : ""}>Cover</button>
          <button type="button" data-preview-action="left" ${index === 0 ? "disabled" : ""}>&#8592;</button>
          <button type="button" data-preview-action="right" ${index === memoryState.selectedFiles.length - 1 ? "disabled" : ""}>&#8594;</button>
          <button type="button" data-preview-action="remove">Remove</button>
        </div>
      </div>
    `;
  }).join("");
}

function updateMemoryUploadProgress(done, total, label = "Uploading photos...") {
  const percent = total ? Math.round((done / total) * 100) : 0;
  memoryState.uploadProgress = percent;
  memoryState.uploadStatus = `${label} ${done}/${total} (${percent}%)`;
  renderSelectedMediaPreview();
}

function handleMediaPreviewAction(event) {
  const button = event.target.closest("[data-preview-action]");
  const item = event.target.closest("[data-preview-index]");
  if (!button || !item) return;

  const index = Number(item.dataset.previewIndex);
  if (!Number.isInteger(index) || !memoryState.selectedFiles[index]) return;

  const action = button.dataset.previewAction;
  if (action === "cover") {
    moveSelectedFile(index, 0);
    memoryState.coverIndex = 0;
  } else if (action === "left") {
    moveSelectedFile(index, index - 1);
  } else if (action === "right") {
    moveSelectedFile(index, index + 1);
  } else if (action === "remove") {
    memoryState.selectedFiles.splice(index, 1);
    memoryState.coverIndex = Math.min(memoryState.coverIndex, Math.max(0, memoryState.selectedFiles.length - 1));
  }

  syncMemoryFileInput();
  renderSelectedMediaPreview();
  renderComposePreview();
}

function moveSelectedFile(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= memoryState.selectedFiles.length || fromIndex === toIndex) return;

  const [file] = memoryState.selectedFiles.splice(fromIndex, 1);
  memoryState.selectedFiles.splice(toIndex, 0, file);

  if (memoryState.coverIndex === fromIndex) {
    memoryState.coverIndex = toIndex;
  } else if (fromIndex < memoryState.coverIndex && toIndex >= memoryState.coverIndex) {
    memoryState.coverIndex -= 1;
  } else if (fromIndex > memoryState.coverIndex && toIndex <= memoryState.coverIndex) {
    memoryState.coverIndex += 1;
  }
}

function syncMemoryFileInput() {
  const input = document.getElementById("memoryFiles");
  if (!input || typeof DataTransfer === "undefined") return;

  const transfer = new DataTransfer();
  memoryState.selectedFiles.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

function renderComposePreview() {
  const container = document.getElementById("composePreview");
  if (!container) return;

  const title = document.getElementById("memoryTitle")?.value.trim() || "Untitled Memory";
  const caption = document.getElementById("memoryCaption")?.value.trim() || "";
  const postedBy = document.getElementById("memoryPostedBy")?.value.trim() || "SFK";
  const date = document.getElementById("memoryDate")?.value || "";
  const videoUrl = document.getElementById("memoryVideoUrl")?.value.trim() || "";
  const musicUrl = document.getElementById("memoryMusicUrl")?.value.trim() || "";
  const musicTitle = document.getElementById("memoryMusicTitle")?.value.trim() || "";
  const firstFile = memoryState.selectedFiles[0] || null;

  let mediaPreview = `<div class="composePreviewMedia textOnly"><span>Text-only memory</span></div>`;
  if (firstFile) {
    const url = URL.createObjectURL(firstFile);
    mediaPreview = firstFile.type.startsWith("video/")
      ? `<video class="composePreviewMedia" src="${escapeAttr(url)}" muted></video>`
      : `<img class="composePreviewMedia" src="${escapeAttr(url)}" alt="" />`;
  } else if (videoUrl) {
    mediaPreview = `<div class="composePreviewMedia linked"><span>Linked video</span></div>`;
  }

  const musicLabel = musicUrl ? (musicTitle || deriveMusicNameFromUrl(musicUrl) || "Background music link") : "";
  const previewChips = [
    memoryState.selectedFiles.length ? `${memoryState.selectedFiles.length} media file${memoryState.selectedFiles.length > 1 ? "s" : ""}` : "",
    videoUrl ? "Linked video" : "",
    musicLabel ? `Music: ${musicLabel}` : ""
  ].filter(Boolean);

  container.innerHTML = `
    <div class="composePreviewTitle">
      <strong>Post preview</strong>
      <small>${memoryState.selectedFiles.length > 1 ? "Cover is the first item below." : "Preview before posting."}</small>
    </div>
    <article class="composePreviewCard">
      <header><span class="postAvatar">${escapeHtml(getInitials(postedBy))}</span><div><strong>${escapeHtml(postedBy)}</strong><small>${escapeHtml(memoryState.auth?.role || "Officer")}</small></div></header>
      ${mediaPreview}
      <div class="composePreviewDetails">
        <strong>${escapeHtml(title)}</strong>
        ${caption ? `<p>${escapeHtml(caption)}</p>` : ""}
        <time>${escapeHtml(formatPreviewDate(date))}</time>
        ${previewChips.length ? `<div class="composePreviewChips">${previewChips.map(chip => `<span>${escapeHtml(chip)}</span>`).join("")}</div>` : ""}
      </div>
    </article>
  `;
}

function setPostPreviewOpen(open) {
  const preview = document.getElementById("composePreview");
  const button = document.getElementById("togglePostPreviewButton");
  if (!preview || !button) return;

  preview.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.textContent = open ? "Hide Post Preview" : "Show Post Preview";
}

function togglePostPreview() {
  const preview = document.getElementById("composePreview");
  setPostPreviewOpen(Boolean(preview?.hidden));
}

function formatPreviewDate(value) {
  if (!value) return "SFK Memory";
  const date = new Date(`${value}T00:00:00`);
  if (isNaN(date)) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function restoreRememberedPostedBy() {
  const input = document.getElementById("memoryPostedBy");
  if (!input || input.value.trim()) return;

  const saved = localStorage.getItem(MEMORY_POSTED_BY_KEY);
  if (saved) input.value = saved;
}

function rememberPostedBy(value) {
  const cleanValue = String(value || "").trim();
  if (cleanValue) localStorage.setItem(MEMORY_POSTED_BY_KEY, cleanValue);
}

async function submitMemoryPost(event) {
  event.preventDefault();
  if (!memoryState.auth) {
    showMemoryAuthStep();
    return;
  }

  const videoUrl = document.getElementById("memoryVideoUrl").value.trim();
  const musicUrl = document.getElementById("memoryMusicUrl").value.trim();
  const musicTitle = document.getElementById("memoryMusicTitle").value.trim();
  const title = document.getElementById("memoryTitle").value.trim();
  const caption = document.getElementById("memoryCaption").value.trim();
  const message = document.getElementById("postMessage");
  const button = document.getElementById("publishMemoryButton");
  const hasAttachment = memoryState.selectedFiles.length > 0 || Boolean(videoUrl) || Boolean(musicUrl);
  const hasText = Boolean(title || caption);

  if (!hasAttachment && !hasText) {
    message.textContent = "Write a title or caption, or add an attachment.";
    return;
  }

  button.disabled = true;
  button.textContent = "Preparing...";
  message.textContent = "Optimizing and preparing your media...";

  try {
    const mediaFiles = [];
    let uploadBytes = 0;

    let preparedIndex = 0;
    memoryState.uploadStatus = "Preparing photos...";
    renderSelectedMediaPreview();

    for (const file of memoryState.selectedFiles) {
      if (file.type.startsWith("video/")) {
        throw new Error(`${file.name}: no-billing upload supports photos only. Paste a Drive, YouTube, or direct video link instead.`);
      }

      const prepared = await prepareMediaFile(file);
      uploadBytes += Math.ceil(prepared.data.length * .75);
      if (uploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
        throw new Error("The selected media is too large for one post. Use fewer files or use a Drive/YouTube link for videos.");
      }
      mediaFiles.push(prepared);
      preparedIndex += 1;
      updateMemoryUploadProgress(preparedIndex, memoryState.selectedFiles.length, "Preparing photos...");
    }

    button.textContent = "Sharing...";
    message.textContent = "Sharing this memory with SFK...";

    let uploadSessionId = "";
    let uploadedMedia = [];
    let canUseSplitPhotoUpload = false;
    const memoryId = `MEM-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    if (mediaFiles.length > 0) {
      button.textContent = "Checking upload mode...";
      message.textContent = "Preparing photo upload...";

      try {
        const session = await postMemoryApi("memoryUploadSession", {
          Role: memoryState.auth.role
        });

        if (session.success && session.sessionId) {
          uploadSessionId = session.sessionId;
          canUseSplitPhotoUpload = true;
        } else if (isUnsupportedMemoryApiType(session.message)) {
          // The deployed Apps Script is older and does not know memoryUploadSession yet.
          // Fall back to the original one-step memoryCreate upload so posting still works.
          canUseSplitPhotoUpload = false;
        } else {
          throw new Error(session.message || "Unable to prepare photo upload. Please refresh and try again.");
        }
      } catch (sessionError) {
        if (isUnsupportedMemoryApiType(sessionError.message)) {
          canUseSplitPhotoUpload = false;
        } else {
          throw sessionError;
        }
      }
    }

    if (mediaFiles.length > 0 && canUseSplitPhotoUpload) {
      button.textContent = "Uploading photos...";
      message.textContent = "Uploading photo attachment first...";

      try {
        updateMemoryUploadProgress(0, mediaFiles.length, "Uploading photos...");
        // Upload in small controlled batches instead of sending 50 photos at once.
        // This keeps the browser responsive and avoids large single requests.
        const uploadBatchSize = 5;
        const uploadedParts = [];
        for (let start = 0; start < mediaFiles.length; start += uploadBatchSize) {
          const batch = mediaFiles.slice(start, start + uploadBatchSize);
          const batchNumber = Math.floor(start / uploadBatchSize) + 1;
          const totalBatches = Math.ceil(mediaFiles.length / uploadBatchSize);
          message.textContent = `Uploading photo batch ${batchNumber}/${totalBatches}...`;
          updateMemoryUploadProgress(start, mediaFiles.length, "Uploading photos...");

          const uploadResult = await postMemoryApi("memoryUploadAssets", {
            Role: memoryState.auth.role,
            MemoryID: memoryId,
            MediaFiles: batch,
            ...(uploadSessionId ? { UploadSessionID: uploadSessionId } : {})
          });

          if (!uploadResult.success) {
            if (isUnsupportedMemoryApiType(uploadResult.message)) {
              canUseSplitPhotoUpload = false;
              uploadedMedia = [];
              break;
            }
            throw new Error(uploadResult.message || "Photo attachment could not be uploaded.");
          }

          if (Array.isArray(uploadResult.media)) {
            uploadedParts.push(...uploadResult.media);
          }
          updateMemoryUploadProgress(Math.min(start + batch.length, mediaFiles.length), mediaFiles.length, "Uploading photos...");
        }

        if (canUseSplitPhotoUpload) {
          const seenMediaKeys = new Set();
          uploadedMedia = uploadedParts.filter((item) => {
            const key = String(
              item?.fileId ||
              item?.id ||
              item?.url ||
              item?.viewerUrl ||
              JSON.stringify(item)
            );
            if (!key || seenMediaKeys.has(key)) return false;
            seenMediaKeys.add(key);
            return true;
          });
        }
      } catch (uploadError) {
        if (isUnsupportedMemoryApiType(uploadError.message)) {
          canUseSplitPhotoUpload = false;
          uploadedMedia = [];
        } else {
          throw uploadError;
        }
      }
    }

    button.textContent = "Posting...";
    message.textContent = mediaFiles.length > 0 && !canUseSplitPhotoUpload
      ? "Saving this memory using compatibility upload..."
      : "Saving this memory...";

    const finalUploadedMediaKeys = new Set();
    uploadedMedia = (Array.isArray(uploadedMedia) ? uploadedMedia : []).filter((item) => {
      const key = String(item?.fileId || item?.id || item?.url || item?.viewerUrl || JSON.stringify(item));
      if (!key || finalUploadedMediaKeys.has(key)) return false;
      finalUploadedMediaKeys.add(key);
      return true;
    });

    const payload = {
      Role: memoryState.auth.role,
      MemoryID: memoryId,
      Title: title,
      Date: document.getElementById("memoryDate").value,
      PostedBy: document.getElementById("memoryPostedBy").value.trim(),
      Caption: caption,
      VideoURL: videoUrl,
      MediaFiles: canUseSplitPhotoUpload ? [] : mediaFiles,
      UploadedMedia: uploadedMedia,
      UploadedMediaJSON: JSON.stringify(uploadedMedia),
      MusicURL: musicUrl,
      MusicTitle: musicTitle,
      ...(uploadSessionId ? { UploadSessionID: uploadSessionId } : {})
    };

    const result = await postMemoryApi("memoryCreate", payload);
    if (!result.success) throw new Error(result.message || "Memory could not be posted.");

    rememberPostedBy(payload.PostedBy);
    resetMemoryForm();
    closeModal("composeModal");
    showMemoryToast("Memory shared successfully.");
    await loadMemories();
  } catch (error) {
    message.textContent = error.message || "Unable to post this memory.";
  } finally {
    button.disabled = false;
    button.textContent = "Share Memory";
  }
}

const memoryPreparedMediaCache = new Map();

async function prepareMediaFile(file) {
  const cacheKey = `${file.name}|${file.size}|${file.lastModified}`;
  if (memoryPreparedMediaCache.has(cacheKey)) {
    return memoryPreparedMediaCache.get(cacheKey);
  }

  const task = (async () => {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return fileToPayload(file);
  }

  const imageUrl = await readFileAsDataUrl(file);
  const image = await loadImage(imageUrl);
  const blob = await compressImageForFirestore(image);
  if (!blob) return fileToPayload(file);

  const dataUrl = await readFileAsDataUrl(blob);
  return {
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    data: dataUrl.split(",")[1]
  };
  })();

  memoryPreparedMediaCache.set(cacheKey, task);
  try {
    return await task;
  } catch (error) {
    memoryPreparedMediaCache.delete(cacheKey);
    throw error;
  }
}

async function compressImageForFirestore(image) {
  const dimensions = [1100, 900, 760, 640];
  const qualities = [.7, .62, .54, .46, .38];
  let bestBlob = null;

  for (const maxDimension of dimensions) {
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;

      bestBlob = blob;
      if (blob.size <= TARGET_IMAGE_BYTES) return blob;
    }
  }

  return bestBlob;
}

async function fileToPayload(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    data: dataUrl.split(",")[1]
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected media."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src, { crossOrigin = "anonymous" } = {}) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin !== null && crossOrigin !== undefined && crossOrigin !== "") image.crossOrigin = crossOrigin;
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to prepare one of the photos."));
    image.src = src;
  });
}

function resetMemoryForm() {
  document.getElementById("memoryForm")?.reset();
  stopMusicLibraryPreview();
  closeYoutubeSongPreview();
  memoryState.youtubeSearchResults = [];
  const youtubeResults = document.getElementById("youtubeSongResults");
  if (youtubeResults) youtubeResults.innerHTML = "";
  const youtubeMessage = document.getElementById("youtubeSongSearchMessage");
  if (youtubeMessage) youtubeMessage.textContent = "";
  memoryState.selectedFiles = [];
  memoryState.previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  memoryState.previewObjectUrls = [];
  memoryState.coverIndex = 0;
  memoryState.uploadProgress = 0;
  memoryState.uploadStatus = "";
  document.getElementById("mediaPreview").innerHTML = "";
  document.getElementById("postMessage").textContent = "";
  const musicTestMessage = document.getElementById("musicTestMessage");
  if (musicTestMessage) {
    musicTestMessage.textContent = "Paste a direct audio link, then test before posting.";
    musicTestMessage.className = "musicTestMessage";
  }
  const musicLibrarySearch = document.getElementById("musicLibrarySearch");
  if (musicLibrarySearch) musicLibrarySearch.value = "";
  const musicLibraryStatus = document.getElementById("musicLibraryStatus");
  if (musicLibraryStatus) musicLibraryStatus.textContent = "";
  renderMemoryMusicLibrary();
  setPostPreviewOpen(false);
  setAdditionalMusicSourcesOpen(false);
  setMusicFieldsOpen(false);
  setDefaultMemoryDate();
  restoreRememberedPostedBy();
  renderComposePreview();
}

function openManageActions(id) {
  if (!memoryState.auth) return;

  const post = memoryState.posts.find((item) => item.id === id);
  if (!post) return;

  const layer = document.createElement("div");
  layer.className = "modalLayer manageLayer";
  layer.innerHTML = `
    <div class="modalBackdrop" data-manage-close></div>
    <section class="manageSheet" role="dialog" aria-modal="true" aria-label="Manage memory">
      <div class="managePreview"><span class="miniBrandMark">SFK</span><div><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.date)}</small></div></div>
      <button type="button" data-manage-action="edit">Edit details</button>
      <button type="button" data-manage-action="hide">Hide from Memories</button>
      ${memoryState.auth.role === "Admin" ? `<button class="dangerAction" type="button" data-manage-action="delete">Delete permanently</button>` : ""}
      <button type="button" data-manage-close>Cancel</button>
    </section>
  `;

  layer.addEventListener("click", async (event) => {
    if (event.target.closest("[data-manage-close]")) {
      layer.remove();
      return;
    }

    const actionButton = event.target.closest("[data-manage-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.manageAction;
    if (action === "edit") {
      renderEditMemoryForm(layer, post);
      return;
    }

    if (action !== "hide" && action !== "delete") return;

    const label = action === "delete" ? "permanently delete" : "hide";
    if (!window.confirm(`Do you want to ${label} this memory?`)) return;

    actionButton.disabled = true;
    try {
      const result = await postMemoryApi(action === "delete" ? "memoryDelete" : "memoryHide", {
        MemoryID: id,
        Role: memoryState.auth.role,
      });
      if (!result.success) throw new Error(result.message || "Action failed.");
      layer.remove();
      showMemoryToast(result.message || "Memory updated.");
      await loadMemories();
    } catch (error) {
      showMemoryToast(error.message || "Unable to update memory.");
      actionButton.disabled = false;
    }
  });

  document.body.appendChild(layer);
}

function renderEditMemoryForm(layer, post) {
  const videoUrl = post.videoUrl || "";
  const musicTitle = getMusicDisplayName(post.music);

  layer.innerHTML = `
    <div class="modalBackdrop" data-manage-close></div>
    <section class="manageSheet editMemorySheet" role="dialog" aria-modal="true" aria-label="Edit memory">
      <div class="managePreview"><span class="miniBrandMark">SFK</span><div><strong>Edit memory</strong><small>${escapeHtml(post.id)}</small></div></div>
      <label>Memory title
        <input id="editMemoryTitle" type="text" maxlength="80" value="${escapeAttr(post.title || "")}" />
      </label>
      <label>Event date
        <input id="editMemoryDate" type="date" value="${escapeAttr(toDateInputValue(post.date))}" />
      </label>
      <label>Posted by
        <input id="editMemoryPostedBy" type="text" maxlength="60" value="${escapeAttr(post.postedBy || "")}" />
      </label>
      <label>Caption and details
        <textarea id="editMemoryCaption" rows="4" maxlength="1200">${escapeHtml(post.caption || "")}</textarea>
      </label>
      <label>Video link
        <input id="editMemoryVideoUrl" type="url" value="${escapeAttr(videoUrl)}" />
        <small class="fieldHint">This edits the linked video only. Uploaded photos/videos stay as-is.</small>
      </label>
      <label>Displayed music title
        <input id="editMemoryMusicTitle" type="text" maxlength="80" value="${escapeAttr(musicTitle || "")}" />
        <small class="fieldHint">This changes the title shown on the music marquee. It does not replace the music link.</small>
      </label>
      <p id="editMemoryMessage" class="formMessage" aria-live="polite"></p>
      <div class="manageActionsRow">
        <button class="secondaryButton" type="button" data-manage-action="back">Back</button>
        <button class="primaryButton" type="button" data-manage-action="save-edit">Save changes</button>
      </div>
    </section>
  `;

  layer.onclick = async (event) => {
    if (event.target.closest("[data-manage-close]")) {
      layer.remove();
      return;
    }

    const actionButton = event.target.closest("[data-manage-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.manageAction;
    if (action === "back") {
      layer.remove();
      openManageActions(post.id);
      return;
    }

    if (action !== "save-edit") return;

    const title = document.getElementById("editMemoryTitle").value.trim();
    const caption = document.getElementById("editMemoryCaption").value.trim();
    const postedBy = document.getElementById("editMemoryPostedBy").value.trim();
    const date = document.getElementById("editMemoryDate").value;
    const videoUrlValue = document.getElementById("editMemoryVideoUrl").value.trim();
    const musicTitleValue = document.getElementById("editMemoryMusicTitle")?.value.trim() || "";
    const message = document.getElementById("editMemoryMessage");

    if (!postedBy) {
      message.textContent = "Posted by is required.";
      return;
    }

    if (!title && !caption && !videoUrlValue && post.media.length === 0 && !post.music) {
      message.textContent = "Write a title or caption, or keep an attachment.";
      return;
    }

    actionButton.disabled = true;
    message.textContent = "Saving changes...";

    try {
      const result = await postMemoryApi("memoryUpdate", {
        MemoryID: post.id,
        Role: memoryState.auth.role,
        Title: title,
        Date: date,
        PostedBy: postedBy,
        Caption: caption,
        VideoURL: videoUrlValue,
        MusicTitle: musicTitleValue
      });

      if (!result.success) throw new Error(result.message || "Memory could not be updated.");
      layer.remove();
      showMemoryToast(result.message || "Memory updated.");
      await loadMemories();
    } catch (error) {
      message.textContent = error.message || "Unable to update memory.";
      actionButton.disabled = false;
    }
  };
}

function openPostViewer(id, index) {
  const post = memoryState.posts.find((item) => item.id === id);
  if (!post || post.media.length === 0) return;
  memoryState.viewerMedia = post.media;
  memoryState.viewerIndex = Math.min(Math.max(0, index), post.media.length - 1);
  document.getElementById("viewerModal").hidden = false;
  document.body.style.overflow = "hidden";
  renderViewer();
}

function renderViewer() {
  const content = document.getElementById("viewerContent");
  if (!content || memoryState.viewerMedia.length === 0) return;

  clearViewerInlineMotion(content);
  content.classList.remove("viewerSwitching", "viewerEnterNext", "viewerEnterPrevious");
  const slides = memoryState.viewerMedia.map((media, index) => `
    <div class="viewerSlide ${index === memoryState.viewerIndex ? "active" : ""}" data-viewer-slide-index="${index}">
      ${renderViewerMedia(media, { active: index === memoryState.viewerIndex })}
    </div>
  `).join("");

  content.innerHTML = `<div class="viewerTrack" id="viewerTrack">${slides}</div>`;
  setViewerTrackPosition(memoryState.viewerIndex, 0, false);
  attachViewerMediaFallbacks(content);
  hydrateNoBillingMemoryImages(content).catch(() => {});
  updateViewerControls();
  syncActiveViewerPlayback();
}

function renderViewerMedia(media, options = {}) {
  if (!media) return "";
  const active = options.active !== false;

  if (media.kind === "image") {
    const imageUrl = [media.viewerUrl, media.previewUrl, media.url, media.fullUrl, media.downloadUrl]
      .map(safeHttpUrl)
      .find(Boolean) || "";
    const firestoreRef = getNoBillingMemoryMediaRef(media)?.raw || "";
    const hydrationAttrs = firestoreRef ? ` data-memory-media-ref="${escapeAttr(firestoreRef)}"` : "";
    if (imageUrl) {
      return `<img src="${escapeAttr(imageUrl)}"${hydrationAttrs} alt="${escapeAttr(media.name)}" draggable="false" decoding="async" />`;
    }
    if (firestoreRef) {
      return `<img data-memory-media-ref="${escapeAttr(firestoreRef)}" alt="${escapeAttr(media.name)}" draggable="false" decoding="async" hidden />`;
    }
    return `<div class="viewerMediaUnavailable">Photo is saved, but cannot load yet.</div>`;
  }

  if (media.kind === "direct-video" || media.kind === "drive-video") {
    const source = media.kind === "drive-video" ? (media.streamUrl || media.url) : media.url;
    return `
      <video class="viewerVideo" src="${escapeAttr(source)}" ${active ? "autoplay" : 'preload="metadata"'} ${media.muted === false && active ? "" : "muted"} loop playsinline ${media.kind === "drive-video" ? `data-viewer-drive-preview="${escapeAttr(media.url)}"` : ""}></video>
      ${active ? renderViewerVolumeButton(media) : ""}
    `;
  }

  const youtubeId = getYouTubeId(media.fullUrl || media.url);
  const source = youtubeId ? getYouTubeEmbedUrl(youtubeId, active && media.muted !== false) : media.url;
  return `
    <iframe class="viewerVideoFrame" src="${escapeAttr(source)}" title="${escapeAttr(media.name)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen data-youtube="${youtubeId ? "true" : "false"}"></iframe>
  `;
}

function attachViewerMediaFallbacks(content = document.getElementById("viewerContent")) {
  if (!content) return;
  content.querySelectorAll("video[data-viewer-drive-preview]").forEach((driveVideo) => {
    driveVideo.addEventListener("error", () => {
      const preview = driveVideo.dataset.viewerDrivePreview;
      const shell = driveVideo.closest(".viewerSlide") || content;
      shell.innerHTML = `<iframe class="viewerVideoFrame" src="${escapeAttr(preview)}" title="Google Drive video" allow="fullscreen" allowfullscreen></iframe>`;
    }, { once: true });
  });
}

function updateViewerControls() {
  const multiple = memoryState.viewerMedia.length > 1;
  document.getElementById("viewerPrevious").hidden = !multiple || memoryState.viewerIndex === 0;
  document.getElementById("viewerNext").hidden = !multiple || memoryState.viewerIndex === memoryState.viewerMedia.length - 1;
  const counter = document.getElementById("viewerCounter");
  if (counter) counter.textContent = `${memoryState.viewerIndex + 1} / ${memoryState.viewerMedia.length}`;
}

function renderViewerVolumeButton(media) {
  const audible = media.muted === false;
  return `<button class="mediaVolumeButton viewerVolumeButton ${audible ? "audible" : ""}" type="button" data-viewer-volume aria-label="${audible ? "Mute video" : "Turn on video sound"}">${audible ? "&#128266;" : "&#128263;"}</button>`;
}

function handleViewerClick(event) {
  const button = event.target.closest("[data-viewer-volume]");
  if (!button) return;

  const media = memoryState.viewerMedia[memoryState.viewerIndex];
  if (!media) return;

  const willUnmute = media.muted !== false;
  if (willUnmute) muteAllOtherMedia("", -1);
  media.muted = !willUnmute;

  const activeSlide = getActiveViewerSlide();
  const video = activeSlide?.querySelector("video");
  const iframe = activeSlide?.querySelector('iframe[data-youtube="true"]');

  if (video) {
    video.muted = media.muted;
    video.volume = 1;
    video.play().catch(() => {});
  }

  if (iframe) {
    sendYouTubeCommand(iframe, media.muted ? "mute" : "unMute");
    sendYouTubeCommand(iframe, "playVideo");
  }

  updateVolumeButton(button, media.muted);
}

function moveViewer(direction, options = {}) {
  if (memoryState.viewerMedia.length < 2 || memoryState.viewerAnimating) return;

  const currentIndex = memoryState.viewerIndex;
  const nextIndex = Math.max(0, Math.min(memoryState.viewerMedia.length - 1, currentIndex + direction));
  if (nextIndex === currentIndex) {
    setViewerTrackPosition(currentIndex, 0, true);
    return;
  }

  if (options.smooth === false) {
    memoryState.viewerIndex = nextIndex;
    updateViewerActiveSlide();
    setViewerTrackPosition(nextIndex, 0, false);
    updateViewerControls();
    syncActiveViewerPlayback();
    return;
  }

  animateViewerSwitch(direction, nextIndex, options);
}

function animateViewerSwitch(direction, nextIndex, options = {}) {
  const content = document.getElementById("viewerContent");
  const track = content?.querySelector(".viewerTrack");

  if (!content || !track) {
    memoryState.viewerIndex = nextIndex;
    renderViewer();
    return;
  }

  memoryState.viewerAnimating = true;
  const startOffset = Number(options.gesture?.deltaX || 0);
  memoryState.viewerIndex = nextIndex;
  updateViewerActiveSlide();
  updateViewerControls();
  setViewerTrackPosition(nextIndex - direction, startOffset, false);

  window.requestAnimationFrame(() => {
    setViewerTrackPosition(nextIndex, 0, true);
  });

  window.setTimeout(() => {
    memoryState.viewerAnimating = false;
    setViewerTrackPosition(memoryState.viewerIndex, 0, false);
    syncActiveViewerPlayback();
  }, 360);
}

function setViewerTrackPosition(index = memoryState.viewerIndex, offsetPx = 0, animate = false) {
  const track = document.getElementById("viewerTrack") || document.querySelector("#viewerContent .viewerTrack");
  if (!track) return;

  const easing = "cubic-bezier(.22, .72, .2, 1)";
  track.style.transition = animate ? `transform 335ms ${easing}` : "none";
  track.style.transform = `translate3d(calc(-${index * 100}% + ${offsetPx}px), 0, 0)`;
}

function updateViewerActiveSlide() {
  const content = document.getElementById("viewerContent");
  if (!content) return;

  content.querySelectorAll(".viewerSlide").forEach((slide) => {
    const active = Number(slide.dataset.viewerSlideIndex) === memoryState.viewerIndex;
    slide.classList.toggle("active", active);
  });
}

function getActiveViewerSlide() {
  return document.querySelector(`#viewerContent .viewerSlide[data-viewer-slide-index="${memoryState.viewerIndex}"]`);
}

function syncActiveViewerPlayback() {
  const content = document.getElementById("viewerContent");
  if (!content || document.getElementById("viewerModal")?.hidden) return;

  content.querySelectorAll(".viewerSlide").forEach((slide) => {
    const index = Number(slide.dataset.viewerSlideIndex);
    const active = index === memoryState.viewerIndex;
    const media = memoryState.viewerMedia[index];
    const video = slide.querySelector("video");
    const iframe = slide.querySelector('iframe[data-youtube="true"]');

    if (video) {
      video.muted = active ? media?.muted !== false : true;
      if (active && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    if (iframe) {
      sendYouTubeCommand(iframe, active && media?.muted === false ? "unMute" : "mute");
      sendYouTubeCommand(iframe, active && !document.hidden ? "playVideo" : "pauseVideo");
    }
  });
}

function resetViewerSwipePosition(content = document.getElementById("viewerContent")) {
  if (!content) return;
  setViewerTrackPosition(memoryState.viewerIndex, 0, true);
}

function clearViewerInlineMotion(content = document.getElementById("viewerContent")) {
  if (!content) return;
  content.style.transition = "";
  content.style.transform = "";
  content.style.opacity = "";
  const track = content.querySelector(".viewerTrack");
  if (track) {
    track.style.transition = "";
    track.style.transform = "";
  }
}

function closeViewer() {
  const viewer = document.getElementById("viewerModal");
  if (!viewer || viewer.hidden) return;
  touchGesture = touchGesture?.scope === "viewer" ? null : touchGesture;
  memoryState.viewerAnimating = false;
  viewer.hidden = true;
  const content = document.getElementById("viewerContent");
  clearViewerInlineMotion(content);
  if (content) content.innerHTML = "";
  document.body.style.overflow = "";
}

function setMemoryFilter(filter) {
  memoryState.filter = ["photos", "videos"].includes(filter) ? filter : "all";
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === memoryState.filter);
  });
  renderMemories();
}

function updateMemoryStats() {
  const posts = memoryState.posts.length;
  const photos = memoryState.posts.reduce((total, post) => total + post.media.filter((item) => item.kind === "image").length, 0);
  const videos = memoryState.posts.reduce((total, post) => total + post.media.filter((item) => item.kind !== "image").length, 0);

  setText("postCount", posts);
  setText("mobilePostCount", posts);
  setText("photoCount", photos);
  setText("videoCount", videos);
}

function setDefaultMemoryDate() {
  const input = document.getElementById("memoryDate");
  if (!input || input.value) return;
  input.value = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function toDateInputValue(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (!isNaN(parsed)) {
    return parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  }

  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function setFeedStatus(message) {
  const status = document.getElementById("feedStatus");
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function formatHeartCount(value) {
  const count = Math.max(0, Number(value) || 0);
  return count === 1 ? "1 heart" : `${count.toLocaleString()} hearts`;
}

function getInitials(value) {
  const parts = String(value || "SFK").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SFK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isUnsupportedMemoryApiType(message) {
  const compact = String(message || "").toLowerCase().replace(/[\s_-]+/g, "");
  return compact.includes("unknownrequesttype:memoryuploadsession")
    || compact.includes("unknownfirebaserequesttype:memoryuploadsession")
    || compact.includes("unknownrequesttype:memoryuploadassets")
    || compact.includes("unknownfirebaserequesttype:memoryuploadassets")
    || compact.includes("invalidapiendpoint")
    || compact.includes("missingrequesttype");
}

async function postMemoryApi(type, payload) {
  // For memory create/update/photo upload, bypass the old Google Apps Script
  // upload endpoint completely. That endpoint is what shows:
  // "Your login is invalid or you are not authorized for this action."
  // This direct Firestore path works on Firebase Spark/no-billing because it stores
  // compressed photos in Firestore media documents, not Firebase Storage.
  if (isDirectFirebaseMemoryApiType(type)) {
    return postMemoryApiDirect(type, payload || {});
  }

  const uploadSessionId = payload?.UploadSessionID || payload?.MemoryUploadSession || "";
  const usingUploadSession = Boolean(uploadSessionId) && (type === "memoryUploadAssets" || type === "memoryCreate");
  let authToken = "";

  if (!usingUploadSession) {
    try {
      // Always request a fresh Firebase ID token for normal Apps Script writes.
      authToken = await window.SFKAuth?.getIdToken(true);
    } catch (error) {
      authToken = "";
    }
  }

  const roleHint = memoryState.auth?.role || payload?.Role || "";
  const url = new URL(MEMORIES_API_URL);
  if (authToken) url.searchParams.set("authToken", authToken);
  if (authToken && roleHint) url.searchParams.set("authRoleHint", roleHint);
  if (uploadSessionId) url.searchParams.set("uploadSessionId", uploadSessionId);

  const response = await fetch(url.toString(), {
    method: "POST",
    body: JSON.stringify({
      type,
      payload: {
        ...(authToken ? { AuthToken: authToken } : {}),
        ...(authToken && roleHint ? { AuthRoleHint: roleHint } : {}),
        ...(payload || {})
      }
    })
  });
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(text.slice(0, 160) || "Invalid server response.");
  }
}

function isDirectFirebaseMemoryApiType(type) {
  return [
    "memoryAuth",
    "memoryUploadSession",
    "memoryUploadAssets",
    "memoryCreate",
    "memoryHide",
    "memoryDelete",
    "memoryUpdate"
  ].includes(String(type || ""));
}

async function postMemoryApiDirect(type, payload) {
  const db = await waitForClassBoardFirestore(9000);
  if (!db) {
    throw new Error("Firebase is not ready. Refresh the page, then sign in again.");
  }

  const role = getDirectFirebaseMemoryRole();
  if (!role) {
    throw new Error("Please sign in again as Admin or Officer before sharing a memory.");
  }

  if (type === "memoryAuth") {
    return { success: true, role: role === "admin" ? "Admin" : "Officer" };
  }

  if (type === "memoryUploadSession") {
    return {
      success: true,
      sessionId: directMemoryGenerateId("memoryUploadSession"),
      mode: "firestore-direct-no-billing"
    };
  }

  if (type === "memoryUploadAssets") {
    return directUploadMemoryAssets(db, payload);
  }

  if (type === "memoryCreate") {
    return directCreateMemory(db, payload, role);
  }

  if (type === "memoryHide") {
    const id = getDirectMemoryPayloadId(payload);
    if (!id) throw new Error("Missing memory ID.");
    await db.collection("memories").doc(id).set({
      Publish: "NO",
      UpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      UpdatedAtText: new Date().toISOString(),
      UpdatedBy: role
    }, { merge: true });
    return { success: true, message: "Memory hidden." };
  }

  if (type === "memoryDelete") {
    const id = getDirectMemoryPayloadId(payload);
    if (!id) throw new Error("Missing memory ID.");
    await db.collection("memories").doc(id).delete();
    return { success: true, message: "Memory deleted." };
  }

  if (type === "memoryUpdate") {
    const id = getDirectMemoryPayloadId(payload);
    if (!id) throw new Error("Missing memory ID.");

    const next = directCleanFirestoreData({
      Title: payload.Title || "Untitled Memory",
      Date: payload.Date || "",
      Caption: payload.Caption || "",
      PostedBy: payload.PostedBy || "SFK",
      VideoURL: payload.VideoURL || "",
      MusicURL: payload.MusicURL || "",
      MusicTitle: String(payload.MusicTitle || payload.MusicDisplayTitle || payload.MusicName || "").trim(),
      UpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      UpdatedAtText: new Date().toISOString(),
      UpdatedBy: role
    });

    const music = directBuildMemoryMusic(payload);
    if (music) {
      next.music = music;
      next.MusicJSON = JSON.stringify(music);
    }

    await db.collection("memories").doc(id).set(next, { merge: true });
    return { success: true, message: "Memory updated." };
  }

  throw new Error(`Unsupported memory action: ${type}`);
}

function getDirectFirebaseMemoryRole() {
  try {
    const role = String(window.SFKAuth?.currentRole?.() || "").trim().toLowerCase();
    if (role === "admin") return "Admin";
    if (role === "officer") return "Officer";
  } catch (error) {
    // Fall back to the page auth state below.
  }

  const pageRole = String(memoryState.auth?.role || "").trim().toLowerCase();
  if (pageRole === "admin") return "Admin";
  if (pageRole === "officer") return "Officer";
  return "";
}

function getDirectMemoryPayloadId(payload) {
  return String(payload?.memoryId || payload?.MemoryID || payload?.ID || payload?.id || "").trim();
}

async function directUploadMemoryAssets(db, payload) {
  const files = Array.isArray(payload.MediaFiles) ? payload.MediaFiles : [];
  if (payload.MusicFile && payload.MusicFile.data) {
    throw new Error("No-billing mode supports music links, not uploaded music files. Use YouTube, JukeHost, or a direct MP3/M4A link instead.");
  }

  const memoryId = getDirectMemoryPayloadId(payload) || directMemoryGenerateId("MEM");
  const media = [];
  for (const [index, file] of files.entries()) {
    media.push(await directSaveMemoryMediaFile(db, memoryId, file, index));
  }

  return { success: true, media, music: null, mode: "firestore-direct-no-billing" };
}

async function directCreateMemory(db, payload, role) {
  const id = getDirectMemoryPayloadId(payload) || directMemoryGenerateId("MEM");
  const suppliedMedia = parseDirectUploadedMemoryMedia(payload);
  let uploadedMedia = [];

  if (Array.isArray(payload.MediaFiles) && payload.MediaFiles.length > 0) {
    const uploaded = await directUploadMemoryAssets(db, { ...payload, MemoryID: id });
    uploadedMedia = Array.isArray(uploaded.media) ? uploaded.media : [];
  }

  const media = dedupeMemoryMediaClient(suppliedMedia.concat(uploadedMedia).filter(Boolean)).slice(0, MAX_MEDIA_FILES);
  const music = directBuildMemoryMusic(payload);
  const now = new Date();
  const postedBy = String(payload.PostedBy || "SFK").trim() || "SFK";
  const title = String(payload.Title || "Untitled Memory").trim() || "Untitled Memory";

  const doc = directCleanFirestoreData({
    ID: id,
    MemoryID: id,
    Title: title,
    Date: payload.Date || "",
    Caption: payload.Caption || "",
    PostedBy: postedBy,
    Author: postedBy,
    Role: role,
    VideoURL: String(payload.VideoURL || "").trim(),
    media,
    MediaJSON: JSON.stringify(media),
    MediaItems: JSON.stringify(media),
    MusicURL: String(payload.MusicURL || "").trim(),
    MusicTitle: String(payload.MusicTitle || payload.MusicDisplayTitle || payload.MusicName || "").trim(),
    music: music || null,
    MusicJSON: music ? JSON.stringify(music) : "",
    Publish: "YES",
    HeartCount: 0,
    CreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    UpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    CreatedAtText: now.toISOString(),
    UpdatedAtText: now.toISOString()
  });

  await db.collection("memories").doc(id).set(doc, { merge: true });
  return { success: true, id, memoryId: id, message: "Memory shared.", mode: "firestore-direct-no-billing" };
}

function dedupeMemoryMediaClient(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!item) return false;
    const key = [item.fileId, item.id, item.url, item.viewerUrl, item.name]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join("|");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function directSaveMemoryMediaFile(db, memoryId, file, index) {
  if (!file || !file.data) {
    throw new Error("Selected photo could not be read. Please choose another image.");
  }

  const mimeType = String(file.mimeType || file.type || "image/jpeg").trim().toLowerCase();
  if (!mimeType.startsWith("image/")) {
    throw new Error("No-billing mode supports photo uploads only. Use a Drive/YouTube/direct link for videos or audio.");
  }

  const base64 = String(file.data || "").trim();
  if (!base64) throw new Error("Selected photo is empty. Please choose another image.");
  if (base64.length > 850000) {
    throw new Error(`${file.name || "This photo"} is still too large after compression. Try a smaller screenshot/photo.`);
  }

  const id = `${directSafeDocPart(memoryId || "memory")}_${Date.now()}_${Number(index || 0)}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 240);
  const name = String(file.name || "SFK memory photo").trim() || "SFK memory photo";
  const uri = `${NO_BILLING_MEDIA_REF_PREFIX}memory/${id}`;
  const smallDataUrl = base64.length <= 120000 ? `data:${mimeType};base64,${base64}` : "";

  await db.collection(NO_BILLING_MEMORY_MEDIA_COLLECTION).doc(id).set(directCleanFirestoreData({
    OwnerID: String(memoryId || ""),
    OwnerKind: "memory",
    Name: name,
    MimeType: mimeType,
    Data: base64,
    DataURL: smallDataUrl,
    PreviewURL: smallDataUrl,
    BytesApprox: Math.ceil(base64.length * 0.75),
    Publish: "YES",
    CreatedByRole: getDirectFirebaseMemoryRole(),
    CreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    CreatedAtText: new Date().toISOString()
  }));

  return {
    kind: "image",
    url: uri,
    viewerUrl: uri,
    fullUrl: uri,
    downloadUrl: uri,
    firestoreRef: uri,
    mediaId: id,
    storage: "firestore",
    name,
    mimeType,
    muted: true
  };
}

function parseDirectUploadedMemoryMedia(payload) {
  const rawCandidates = [payload?.UploadedMedia, payload?.uploadedMedia, payload?.MediaUploaded];
  const jsonCandidates = [payload?.UploadedMediaJSON, payload?.uploadedMediaJSON, payload?.MediaUploadedJSON, payload?.MediaJSON, payload?.MediaItems];
  const media = [];

  for (const raw of rawCandidates) {
    if (Array.isArray(raw)) media.push(...raw);
    else if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) media.push(...parsed);
        else if (parsed && typeof parsed === "object") media.push(parsed);
      } catch (error) {
        const ref = parseNoBillingMemoryMediaRef(raw);
        if (ref) media.push(raw);
      }
    }
  }

  for (const raw of jsonCandidates) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) media.push(...parsed);
      else if (parsed && typeof parsed === "object") media.push(parsed);
    } catch (error) {
      const ref = parseNoBillingMemoryMediaRef(raw);
      if (ref) media.push(raw);
    }
  }

  return media.map(normalizeDirectMemoryMediaItem).filter(Boolean).slice(0, MAX_MEDIA_FILES);
}

function normalizeDirectMemoryMediaItem(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const ref = parseNoBillingMemoryMediaRef(item);
    return ref ? {
      kind: "image",
      url: ref.raw,
      viewerUrl: ref.raw,
      fullUrl: ref.raw,
      downloadUrl: ref.raw,
      firestoreRef: ref.raw,
      mediaId: ref.id,
      storage: "firestore",
      name: "SFK memory",
      muted: true
    } : null;
  }

  if (typeof item !== "object") return null;
  const ref = getNoBillingMemoryMediaRef(item);
  if (ref) {
    return {
      ...item,
      kind: item.kind || "image",
      url: item.url || ref.raw,
      viewerUrl: item.viewerUrl || ref.raw,
      fullUrl: item.fullUrl || ref.raw,
      downloadUrl: item.downloadUrl || ref.raw,
      firestoreRef: item.firestoreRef || ref.raw,
      mediaId: item.mediaId || ref.id,
      storage: item.storage || "firestore",
      muted: item.muted !== false
    };
  }

  return item;
}

function directBuildMemoryMusic(payload) {
  const musicTitle = String(payload?.MusicTitle || payload?.MusicDisplayTitle || payload?.MusicName || "").trim();
  const url = safeHttpUrl(payload?.MusicURL || payload?.musicUrl || "");
  if (!url) return null;

  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "youtube-audio",
      videoId: youtubeId,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      name: musicTitle || "YouTube music",
      customTitle: musicTitle,
      muted: true,
      started: false
    };
  }

  const driveId = getDriveFileId(url);
  if (driveId) {
    return {
      kind: "drive-audio",
      fileId: driveId,
      url: getDriveStreamUrl(driveId) || getDriveAudioStreamUrl(driveId),
      fallbackUrl: getDriveAudioStreamUrl(driveId),
      previewUrl: url,
      name: musicTitle || deriveMusicNameFromUrl(url) || "Google Drive music",
      customTitle: musicTitle,
      muted: true,
      started: false
    };
  }

  return {
    kind: "direct-audio",
    url,
    name: musicTitle || deriveMusicNameFromUrl(url) || "Background music",
    customTitle: musicTitle,
    muted: true,
    started: false
  };
}

function directMemoryGenerateId(prefix) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function directSafeDocPart(value) {
  return String(value || "media")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "media";
}

function directCleanFirestoreData(value) {
  if (value === undefined) return "";
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(directCleanFirestoreData).filter(item => item !== undefined);
  if (value && typeof value === "object" && typeof value.toMillis !== "function" && typeof value.isEqual !== "function") {
    const clean = {};
    Object.entries(value).forEach(([key, item]) => {
      if (!key) return;
      const next = directCleanFirestoreData(item);
      if (next !== undefined) clean[key] = next;
    });
    return clean;
  }
  return value;
}

let toastTimer = null;
function showMemoryToast(message) {
  const toast = document.getElementById("memoryToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

/* ========================================================================
   STABLE MEMORY HEART LEDGER V3
   Source of truth: settings collection documents with Kind=ClassBoardHeartLedgerV3.
   This does not touch old HeartCount fields and is shared in spirit with the
   Subject Announcement heart system.
======================================================================== */
const MEMORY_HEART_LEDGER_KIND_V3 = "ClassBoardHeartLedgerV3";
const MEMORY_HEART_LEDGER_COLLECTION_V3 = "settings";
const MEMORY_HEART_LEDGER_PENDING = new Set();

function getMemoryHeartLedgerDbV3() {
  try {
    if (window.SFK_CLASSBOARD_FIREBASE_DB) return window.SFK_CLASSBOARD_FIREBASE_DB;
    if (!window.firebase || !window.SFK_FIREBASE_READY) return null;
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    const db = firebase.firestore();
    window.SFK_CLASSBOARD_FIREBASE_DB = db;
    return db;
  } catch (error) {
    console.warn("Memory heart ledger database unavailable:", error);
    return null;
  }
}

function makeMemoryHeartTargetKeyV3(postOrId) {
  const id = typeof postOrId === "object"
    ? String(postOrId?.docId || postOrId?.DocID || postOrId?.id || postOrId?.ID || postOrId?.MemoryID || postOrId?.memoryId || "").trim()
    : String(postOrId || "").trim();
  return `memory:${id}`;
}

function hashMemoryHeartLedgerTextV3(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function makeMemoryHeartLedgerDocIdV3(targetKey, deviceId) {
  return `heartV3_${hashMemoryHeartLedgerTextV3(targetKey)}_${hashMemoryHeartLedgerTextV3(deviceId)}`;
}

async function readMemoryHeartLedgerSummaryV3(targetKeys) {
  const db = getMemoryHeartLedgerDbV3();
  const uniqueKeys = Array.from(new Set((targetKeys || []).map(String).filter(Boolean)));
  const summary = {};
  uniqueKeys.forEach(key => {
    summary[key] = { count: 0, mine: false };
  });
  if (!db || uniqueKeys.length === 0) return summary;

  const targetSet = new Set(uniqueKeys);
  const deviceId = getClassBoardHeartDeviceId();

  try {
    const snap = await db.collection(MEMORY_HEART_LEDGER_COLLECTION_V3)
      .where("Kind", "==", MEMORY_HEART_LEDGER_KIND_V3)
      .get();

    snap.forEach(doc => {
      const data = doc.data() || {};
      const key = String(data.TargetKey || "").trim();
      if (!targetSet.has(key)) return;
      if (String(data.TargetType || "").trim() !== "memory") return;
      if (data.Active === false) return;
      summary[key].count += 1;
      if (String(data.DeviceID || "") === deviceId) summary[key].mine = true;
    });
  } catch (error) {
    console.warn("Unable to read memory heart ledger:", error);
  }

  return summary;
}

async function saveMemoryHeartLedgerStateV3(targetKey, shouldHeart) {
  const db = getMemoryHeartLedgerDbV3();
  if (!db) throw new Error("Firebase is not ready for memory hearts.");

  const deviceId = getClassBoardHeartDeviceId();
  const cleanTargetKey = String(targetKey || "").trim();
  if (!cleanTargetKey) throw new Error("Missing memory heart target.");

  const docId = makeMemoryHeartLedgerDocIdV3(cleanTargetKey, deviceId);
  const ref = db.collection(MEMORY_HEART_LEDGER_COLLECTION_V3).doc(docId);

  if (shouldHeart) {
    const payload = {
      Kind: MEMORY_HEART_LEDGER_KIND_V3,
      TargetType: "memory",
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
        Kind: MEMORY_HEART_LEDGER_KIND_V3,
        TargetType: "memory",
        TargetKey: cleanTargetKey,
        DeviceID: deviceId,
        Active: false,
        UpdatedAtText: new Date().toISOString()
      }, { merge: true });
    });
  }

  const summary = await readMemoryHeartLedgerSummaryV3([cleanTargetKey]);
  return {
    success: true,
    hearted: Boolean(summary[cleanTargetKey]?.mine),
    count: Number(summary[cleanTargetKey]?.count || 0),
    targetKey: cleanTargetKey
  };
}

async function hydrateMemoryHeartsV3(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return posts;
  const keys = posts.map(post => makeMemoryHeartTargetKeyV3(post));
  const summary = await readMemoryHeartLedgerSummaryV3(keys);
  posts.forEach(post => {
    const key = makeMemoryHeartTargetKeyV3(post);
    const info = summary[key] || { count: 0, mine: false };
    post._heartV3TargetKey = key;
    post._heartV3Count = Number(info.count || 0);
    post._heartV3Mine = Boolean(info.mine);
    post.heartCount = post._heartV3Count;
    post.HeartCount = post._heartV3Count;
  });
  return posts;
}

loadMemories = async function loadMemoriesWithHeartLedgerV3() {
  setFeedStatus("Loading memories...");
  try {
    const rows = await loadMemoriesFromFirebaseFirst();
    const posts = rows.map(normalizeMemoryPost);
    await hydrateMemoryHeartsV3(posts);
    memoryState.posts = posts;
    markLoadedMemoriesSeen(memoryState.posts);
    renderMemories();
    cacheMemoriesForFastLoad(memoryState.posts);
  } catch (error) {
    console.error("Memories load failed:", error);
    if (memoryState.posts.length === 0) {
      setFeedStatus("Memories will appear after the database loads correctly.");
    }
  }
};

readMemoryHeartCount = function readMemoryHeartCountV3(raw) {
  const ledgerCount = Number(raw?._heartV3Count);
  return Number.isFinite(ledgerCount) && ledgerCount >= 0 ? ledgerCount : 0;
};

isMemoryHeartedByThisDevice = function isMemoryHeartedByThisDeviceV3(post) {
  return Boolean(post?._heartV3Mine);
};

heartMemory = async function heartMemoryV3(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || MEMORY_HEART_LEDGER_PENDING.has(cleanId)) return false;

  const post = memoryState.posts.find((item) => item.id === cleanId);
  if (!post) return false;

  const targetKey = makeMemoryHeartTargetKeyV3(post);
  const nextHearted = !Boolean(post._heartV3Mine);
  MEMORY_HEART_LEDGER_PENDING.add(cleanId);
  setMemoryHeartButtonSaving(cleanId, true);

  try {
    const result = await saveMemoryHeartLedgerStateV3(targetKey, nextHearted);
    memoryState.posts = memoryState.posts.map((item) => {
      if (item.id !== cleanId) return item;
      return {
        ...item,
        _heartV3TargetKey: targetKey,
        _heartV3Count: result.count,
        _heartV3Mine: result.hearted,
        heartCount: result.count,
        HeartCount: result.count
      };
    });
    updateMemoryHeartDisplay(cleanId);
    saveMemoryCacheSnapshot();
  } catch (error) {
    console.error("Memory heart failed:", error);
    showToast("Unable to save heart. Please refresh and try again.");
  } finally {
    MEMORY_HEART_LEDGER_PENDING.delete(cleanId);
    setMemoryHeartButtonSaving(cleanId, false);
  }

  return false;
};

syncMemoryHeartStatesFromServer = function syncMemoryHeartStatesFromServerV3() {
  // No-op. Heart state now comes from the Firestore ledger during loadMemories().
};

/* ========================================================================
   FAST MEMORY HEART LEDGER V4 UI
   Optimistic UI: heart/count updates immediately; Firebase save is background.
======================================================================== */
async function writeMemoryHeartLedgerFastV4(targetKey, shouldHeart) {
  const db = getMemoryHeartLedgerDbV3();
  if (!db) throw new Error("Firebase is not ready for memory hearts.");
  const deviceId = getClassBoardHeartDeviceId();
  const cleanTargetKey = String(targetKey || "").trim();
  if (!cleanTargetKey) throw new Error("Missing memory heart target.");
  const docId = makeMemoryHeartLedgerDocIdV3(cleanTargetKey, deviceId);
  const ref = db.collection(MEMORY_HEART_LEDGER_COLLECTION_V3).doc(docId);
  if (shouldHeart) {
    const payload = {
      Kind: MEMORY_HEART_LEDGER_KIND_V3,
      TargetType: "memory",
      TargetKey: cleanTargetKey,
      DeviceID: deviceId,
      Active: true,
      UpdatedAtText: new Date().toISOString()
    };
    if (window.firebase?.firestore?.FieldValue) payload.UpdatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await ref.set(payload, { merge: true });
  } else {
    await ref.delete().catch(async () => {
      await ref.set({
        Kind: MEMORY_HEART_LEDGER_KIND_V3,
        TargetType: "memory",
        TargetKey: cleanTargetKey,
        DeviceID: deviceId,
        Active: false,
        UpdatedAtText: new Date().toISOString()
      }, { merge: true });
    });
  }
  return { success: true, targetKey: cleanTargetKey, hearted: Boolean(shouldHeart) };
}

function updateMemoryHeartRecordInstantV4(id, targetKey, hearted, count) {
  const safeCount = Math.max(0, Number(count) || 0);
  memoryState.posts = memoryState.posts.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      _heartV3TargetKey: targetKey,
      _heartV3Count: safeCount,
      _heartV3Mine: Boolean(hearted),
      heartCount: safeCount,
      HeartCount: safeCount
    };
  });
  updateMemoryHeartDisplay(id);
  saveMemoryCacheSnapshot();
}

setMemoryHeartButtonSaving = function setMemoryHeartButtonSavingFastV4(id, saving) {
  const article = Array.from(document.querySelectorAll(".memoryPost"))
    .find((item) => item.dataset.postId === String(id || ""));
  const button = article?.querySelector('.heartButton[data-action="heart"]');
  if (!button) return;
  // Do not disable the button or show wait cursor. The pending set still blocks double saves.
  button.classList.toggle("is-saving", Boolean(saving));
  button.disabled = false;
};

heartMemory = function heartMemoryFastV4(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId || MEMORY_HEART_LEDGER_PENDING.has(cleanId)) return false;

  const post = memoryState.posts.find((item) => item.id === cleanId);
  if (!post) return false;

  const targetKey = makeMemoryHeartTargetKeyV3(post);
  const previousHearted = Boolean(post._heartV3Mine);
  const previousCount = Math.max(0, Number(post._heartV3Count ?? post.heartCount) || 0);
  const nextHearted = !previousHearted;
  const optimisticCount = Math.max(0, previousCount + (nextHearted ? 1 : -1));

  MEMORY_HEART_LEDGER_PENDING.add(cleanId);
  updateMemoryHeartRecordInstantV4(cleanId, targetKey, nextHearted, optimisticCount);

  writeMemoryHeartLedgerFastV4(targetKey, nextHearted)
    .catch(error => {
      console.error("Memory heart save failed:", error);
      updateMemoryHeartRecordInstantV4(cleanId, targetKey, previousHearted, previousCount);
      showToast("Heart was not saved. Please try again.");
    })
    .finally(() => {
      MEMORY_HEART_LEDGER_PENDING.delete(cleanId);
      setMemoryHeartButtonSaving(cleanId, false);
    });

  return false;
};



/* v74: SFK Memories live photobooth */
const PHOTOBOOTH_LAYOUTS = {
  single: { shots: 1, label: "Single" },
  strip2: { shots: 2, label: "2-photo strip" },
  strip3: { shots: 3, label: "3-photo strip" },
  grid4: { shots: 4, label: "2 × 2 collage" },
  strip4: { shots: 4, label: "4-photo strip" }
};

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function loadPhotoboothFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PHOTOBOOTH_FAVORITES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map((item) => String(item || "").trim()).filter(Boolean)));
  } catch (error) {
    return [];
  }
}

function savePhotoboothFavorites() {
  try { localStorage.setItem(PHOTOBOOTH_FAVORITES_KEY, JSON.stringify(photoBoothState.favoriteFilters)); } catch (error) {}
}

function loadPhotoboothDefaultFilter() {
  try {
    const saved = String(localStorage.getItem(PHOTOBOOTH_DEFAULT_FILTER_KEY) || "normal").trim();
    return saved || "normal";
  } catch (error) {
    return "normal";
  }
}

function savePhotoboothDefaultFilter() {
  try { localStorage.setItem(PHOTOBOOTH_DEFAULT_FILTER_KEY, String(photoBoothState.defaultFilter || "normal")); } catch (error) {}
}

function loadPhotoboothFilterStrengths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PHOTOBOOTH_FILTER_STRENGTHS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function savePhotoboothFilterStrengths() {
  try { localStorage.setItem(PHOTOBOOTH_FILTER_STRENGTHS_KEY, JSON.stringify(photoBoothState.filterStrengths || {})); } catch (error) {}
}

function neutralMix(target, amount, neutral = 1) {
  const value = neutral + (target - neutral) * amount;
  return Math.round(value * 1000) / 1000;
}

function zeroMix(target, amount) {
  const value = target * amount;
  return Math.round(value * 1000) / 1000;
}

const PHOTOBOOTH_FILTER_META = {
  normal: { label:"Normal", category:"aesthetic" },
  clean: { label:"Clean", category:"aesthetic" },
  warm: { label:"Warm", category:"aesthetic" },
  cool: { label:"Cool", category:"aesthetic" },
  mono: { label:"B&W", category:"dramatic" },
  noir: { label:"Noir", category:"dramatic" },
  vintage: { label:"Vintage", category:"film" },
  retro: { label:"Retro", category:"film" },
  matte: { label:"Matte", category:"film" },
  kodak: { label:"Kodak-ish", category:"film" },
  fuji: { label:"Fuji-ish", category:"film" },
  soft: { label:"Soft", category:"cute" },
  peachy: { label:"Peachy", category:"cute" },
  creamy: { label:"Creamy", category:"cute" },
  dreamy: { label:"Dreamy", category:"cute" },
  sunset: { label:"Sunset", category:"cute" },
  cyber: { label:"Cyber", category:"dramatic" },
  contrast: { label:"Pop", category:"dramatic" },
  dramatic: { label:"Dramatic", category:"dramatic" },
  faded: { label:"Faded", category:"aesthetic" }
};

const PHOTOBOOTH_FILTER_CATEGORY_LABELS = {
  all: "All",
  aesthetic: "Aesthetic",
  film: "Film",
  cute: "Cute",
  dramatic: "Dramatic",
  favorites: "Favorites"
};

const PHOTOBOOTH_FILTERS = {
  normal: () => "none",
  clean: (t) => `contrast(${neutralMix(1.05,t)}) saturate(${neutralMix(1.04,t)}) brightness(${neutralMix(1.05,t)})`,
  warm: (t) => `sepia(${zeroMix(0.18,t)}) saturate(${neutralMix(1.22,t)}) brightness(${neutralMix(1.04,t)})`,
  cool: (t) => `saturate(${neutralMix(0.92,t)}) hue-rotate(${zeroMix(12,t)}deg) brightness(${neutralMix(1.04,t)})`,
  mono: (t) => `grayscale(${zeroMix(1,t)}) contrast(${neutralMix(1.08,t)})`,
  noir: (t) => `grayscale(${zeroMix(1,t)}) contrast(${neutralMix(1.35,t)}) brightness(${neutralMix(0.95,t)})`,
  vintage: (t) => `sepia(${zeroMix(0.5,t)}) saturate(${neutralMix(0.86,t)}) contrast(${neutralMix(0.95,t)})`,
  retro: (t) => `sepia(${zeroMix(0.28,t)}) saturate(${neutralMix(0.82,t)}) contrast(${neutralMix(0.88,t)}) brightness(${neutralMix(1.06,t)})`,
  matte: (t) => `contrast(${neutralMix(0.88,t)}) saturate(${neutralMix(0.92,t)}) brightness(${neutralMix(1.06,t)})`,
  kodak: (t) => `sepia(${zeroMix(0.16,t)}) saturate(${neutralMix(1.18,t)}) contrast(${neutralMix(1.08,t)}) brightness(${neutralMix(1.05,t)})`,
  fuji: (t) => `saturate(${neutralMix(1.12,t)}) hue-rotate(${zeroMix(-8,t)}deg) contrast(${neutralMix(1.04,t)}) brightness(${neutralMix(1.03,t)})`,
  soft: (t) => `brightness(${neutralMix(1.08,t)}) saturate(${neutralMix(0.9,t)}) contrast(${neutralMix(0.9,t)})`,
  peachy: (t) => `sepia(${zeroMix(0.14,t)}) saturate(${neutralMix(1.08,t)}) hue-rotate(${zeroMix(-8,t)}deg) brightness(${neutralMix(1.08,t)})`,
  creamy: (t) => `sepia(${zeroMix(0.12,t)}) saturate(${neutralMix(0.9,t)}) contrast(${neutralMix(0.9,t)}) brightness(${neutralMix(1.12,t)})`,
  dreamy: (t) => `brightness(${neutralMix(1.1,t)}) saturate(${neutralMix(0.95,t)}) contrast(${neutralMix(0.84,t)})`,
  sunset: (t) => `sepia(${zeroMix(0.28,t)}) saturate(${neutralMix(1.28,t)}) hue-rotate(${zeroMix(-12,t)}deg) contrast(${neutralMix(1.04,t)}) brightness(${neutralMix(1.02,t)})`,
  cyber: (t) => `hue-rotate(${zeroMix(165,t)}deg) saturate(${neutralMix(1.45,t)}) contrast(${neutralMix(1.15,t)}) brightness(${neutralMix(1.04,t)})`,
  contrast: (t) => `contrast(${neutralMix(1.22,t)}) saturate(${neutralMix(1.18,t)})`,
  dramatic: (t) => `contrast(${neutralMix(1.32,t)}) saturate(${neutralMix(0.96,t)}) brightness(${neutralMix(0.95,t)})`,
  faded: (t) => `contrast(${neutralMix(0.86,t)}) saturate(${neutralMix(0.78,t)}) brightness(${neutralMix(1.08,t)})`
};

function getPhotoboothStrength(filter = photoBoothState.filter) {
  const saved = Number(photoBoothState.filterStrengths?.[filter]);
  return Number.isFinite(saved) ? clampNumber(saved, 0, 100) : 100;
}

function getPhotoboothFilterString(filter = photoBoothState.filter, strength = getPhotoboothStrength(filter)) {
  const resolver = PHOTOBOOTH_FILTERS[filter] || PHOTOBOOTH_FILTERS.normal;
  const amount = clampNumber(strength, 0, 100) / 100;
  return resolver(amount) || "none";
}

function initPhotoboothMobileFilters() {
  const host = document.getElementById("photoboothMobileFilterOptions");
  if (!host || host.children.length) return;
  const fragment = document.createDocumentFragment();
  Object.entries(PHOTOBOOTH_FILTER_META).forEach(([filter, meta]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photoboothMobileFilterCard";
    button.dataset.mobileFilter = filter;
    button.innerHTML = `<span class="boothFilterSwatch filter-${filter}"></span><b>${escapeHtml(meta.label || filter)}</b>`;
    fragment.appendChild(button);
  });
  host.appendChild(fragment);
}

function syncPhotoboothMobileUi() {
  initPhotoboothMobileFilters();
  const filter = photoBoothState.filter || "normal";
  const meta = PHOTOBOOTH_FILTER_META[filter] || { label:"Normal", category:"aesthetic" };
  const strength = getPhotoboothStrength(filter);
  const favorites = new Set(photoBoothState.favoriteFilters || []);
  const category = photoBoothState.filterCategory || "all";
  const filterLabel = document.getElementById("mobilePhotoboothFilterLabel");
  const strengthLabel = document.getElementById("mobilePhotoboothStrengthLabel");
  const timerLabel = document.getElementById("mobilePhotoboothTimerLabel");
  const layoutLabel = document.getElementById("mobilePhotoboothLayoutLabel");
  const filterMeta = document.getElementById("mobilePhotoboothFilterMeta");
  const strengthMeta = document.getElementById("mobilePhotoboothStrengthMeta");
  if (filterLabel) filterLabel.textContent = meta.label;
  if (strengthLabel) strengthLabel.textContent = `${strength}%`;
  if (timerLabel) timerLabel.textContent = photoBoothState.timer ? `${photoBoothState.timer}s` : "Off";
  if (layoutLabel) {
    const labels = { single:"Single", strip2:"Strip 2", strip3:"Strip 3", grid4:"2×2", strip4:"Strip 4" };
    layoutLabel.textContent = labels[photoBoothState.layout] || "Single";
  }
  if (filterMeta) filterMeta.textContent = `${meta.label} • ${strength}%`;
  if (strengthMeta) strengthMeta.textContent = `${meta.label} • ${strength}%`;
  const paletteLabel = document.getElementById("mobilePhotoboothPaletteLabel");
  if (paletteLabel) paletteLabel.textContent = (FEAST_PALETTES[photoBoothState.palette] || FEAST_PALETTES.pink).label.split(" ")[0];
  document.getElementById("mobilePhotoboothPalette")?.toggleAttribute("hidden", photoBoothState.theme !== "feast-faustina");
  const mobileOrientation = document.getElementById("photoboothMobileOrientationGroup");
  if (mobileOrientation) mobileOrientation.hidden = photoBoothState.theme !== "feast-faustina";

  document.querySelectorAll("[data-mobile-filter]").forEach((button) => {
    const key = String(button.dataset.mobileFilter || "normal");
    const itemMeta = PHOTOBOOTH_FILTER_META[key] || {};
    const visible = category === "all"
      ? true
      : category === "favorites"
        ? favorites.has(key)
        : itemMeta.category === category;
    button.hidden = !visible;
    button.classList.toggle("is-active", key === filter);
    button.classList.toggle("is-favorite", favorites.has(key));
    button.classList.toggle("is-default", key === photoBoothState.defaultFilter);
  });
  document.querySelectorAll("[data-mobile-filter-category]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mobileFilterCategory === category);
  });
  document.querySelectorAll("[data-mobile-layout]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mobileLayout === photoBoothState.layout);
  });
  document.querySelectorAll("[data-mobile-timer]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.mobileTimer) === Number(photoBoothState.timer));
  });

  const soundButton = document.getElementById("mobilePhotoboothSound");
  if (soundButton) {
    soundButton.classList.toggle("is-active", Boolean(photoBoothState.sound));
    soundButton.setAttribute("aria-pressed", photoBoothState.sound ? "true" : "false");
    const icon = soundButton.querySelector("span");
    if (icon) icon.textContent = photoBoothState.sound ? "🔊" : "🔇";
  }
  const mirrorButton = document.getElementById("mobilePhotoboothMirror");
  if (mirrorButton) {
    mirrorButton.classList.toggle("is-active", Boolean(photoBoothState.mirror));
    mirrorButton.setAttribute("aria-pressed", photoBoothState.mirror ? "true" : "false");
  }
  const mobileFavorite = document.getElementById("mobilePhotoboothFavorite");
  if (mobileFavorite) {
    const active = favorites.has(filter);
    mobileFavorite.textContent = active ? "★ Favorited" : "☆ Favorite";
    mobileFavorite.classList.toggle("is-active", active);
  }
  const mobileDefault = document.getElementById("mobilePhotoboothDefault");
  if (mobileDefault) {
    const active = filter === photoBoothState.defaultFilter;
    mobileDefault.textContent = active ? "Default ✓" : "Set Default";
    mobileDefault.classList.toggle("is-active", active);
  }
  const mobileStrength = document.getElementById("mobilePhotoboothStrength");
  const mobileStrengthValue = document.getElementById("mobilePhotoboothStrengthValue");
  if (mobileStrength) mobileStrength.value = String(strength);
  if (mobileStrengthValue) mobileStrengthValue.textContent = `${strength}%`;
}

function closePhotoboothMobileTray() {
  const tray = document.getElementById("photoboothMobileTray");
  if (!tray) return;
  tray.hidden = true;
  tray.dataset.activePanel = "";
  tray.querySelectorAll("[data-mobile-panel]").forEach((panel) => { panel.hidden = true; });
  ["mobilePhotoboothFilter","mobilePhotoboothLayout","mobilePhotoboothPalette","mobilePhotoboothStrengthButton","mobilePhotoboothTimer"].forEach((id) => {
    document.getElementById(id)?.classList.remove("is-open");
  });
}

function togglePhotoboothMobileTray(panelName) {
  if (photoBoothState.busy || document.querySelector(".photoboothModal")?.classList.contains("is-result-mode")) return;
  const tray = document.getElementById("photoboothMobileTray");
  if (!tray) return;
  const next = String(panelName || "");
  if (!tray.hidden && tray.dataset.activePanel === next) {
    closePhotoboothMobileTray();
    return;
  }
  tray.hidden = false;
  tray.dataset.activePanel = next;
  tray.querySelectorAll("[data-mobile-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.mobilePanel !== next;
  });
  const map = { filters:"mobilePhotoboothFilter", layout:"mobilePhotoboothLayout", palette:"mobilePhotoboothPalette", strength:"mobilePhotoboothStrengthButton", timer:"mobilePhotoboothTimer" };
  Object.values(map).forEach((id) => document.getElementById(id)?.classList.remove("is-open"));
  document.getElementById(map[next])?.classList.add("is-open");
  syncPhotoboothMobileUi();
}

function handlePhotoboothMobileFilterClick(event) {
  const button = event.target.closest("[data-mobile-filter]");
  if (!button || photoBoothState.busy) return;
  applyPhotoboothFilterSelection(String(button.dataset.mobileFilter || "normal"));
}

function setPhotoboothFilterCategory(category) {
  photoBoothState.filterCategory = String(category || "all");
  const currentMeta = PHOTOBOOTH_FILTER_META[photoBoothState.filter] || {};
  const favorites = new Set(photoBoothState.favoriteFilters || []);
  const selectedVisible = photoBoothState.filterCategory === "all"
    || (photoBoothState.filterCategory === "favorites" ? favorites.has(photoBoothState.filter) : currentMeta.category === photoBoothState.filterCategory);
  if (!selectedVisible) {
    const firstMatch = Object.keys(PHOTOBOOTH_FILTER_META).find((filter) => photoBoothState.filterCategory === "favorites"
      ? favorites.has(filter)
      : photoBoothState.filterCategory === "all" || PHOTOBOOTH_FILTER_META[filter]?.category === photoBoothState.filterCategory);
    if (firstMatch) photoBoothState.filter = firstMatch;
  }
  updatePhotoboothFilterUi();
  applyPhotoboothLiveFilter();
}

function handlePhotoboothMobileCategoryClick(event) {
  const button = event.target.closest("[data-mobile-filter-category]");
  if (!button || photoBoothState.busy) return;
  setPhotoboothFilterCategory(button.dataset.mobileFilterCategory || "all");
}

function handlePhotoboothMobileLayoutClick(event) {
  const button = event.target.closest("[data-mobile-layout]");
  if (!button || photoBoothState.busy) return;
  const layout = String(button.dataset.mobileLayout || "single");
  if (!PHOTOBOOTH_LAYOUTS[layout]) return;
  photoBoothState.layout = layout;
  document.querySelectorAll("[data-booth-layout]").forEach((item) => item.classList.toggle("is-active", item.dataset.boothLayout === layout));
  const guide = document.getElementById("photoboothGuide");
  if (guide) guide.className = `photoboothGuide layout-${layout}`;
  resetPhotoboothResult({ keepCamera:true, quiet:true });
  syncPhotoboothCaptureButton();
  updatePhotoboothThemeUi();
  syncPhotoboothMobileUi();
  closePhotoboothMobileTray();
}

function handlePhotoboothMobileTimerClick(event) {
  const button = event.target.closest("[data-mobile-timer]");
  if (!button || photoBoothState.busy) return;
  const value = Number(button.dataset.mobileTimer || 0);
  const select = document.getElementById("photoboothTimer");
  if (select) select.value = String(value);
  syncPhotoboothSettingsFromUi();
  closePhotoboothMobileTray();
}

function togglePhotoboothMobileSound() {
  if (photoBoothState.busy) return;
  const checkbox = document.getElementById("photoboothSound");
  if (checkbox) checkbox.checked = !checkbox.checked;
  syncPhotoboothSettingsFromUi();
}

function togglePhotoboothMobileMirror() {
  if (photoBoothState.busy) return;
  const checkbox = document.getElementById("photoboothMirror");
  if (checkbox) checkbox.checked = !checkbox.checked;
  syncPhotoboothSettingsFromUi();
}

function setPhotoboothMobileBusy(busy) {
  const disabled = Boolean(busy);
  ["mobilePhotoboothCapture","mobilePhotoboothSwitch","mobilePhotoboothTimer","mobilePhotoboothSound","mobilePhotoboothFilter","mobilePhotoboothLayout","mobilePhotoboothPalette","mobilePhotoboothStrengthButton","mobilePhotoboothMirror"].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = disabled;
  });
  if (disabled) closePhotoboothMobileTray();
}

function renderPhotoboothFilterButtons() {
  const selected = photoBoothState.filter;
  const category = photoBoothState.filterCategory || "all";
  const favorites = new Set(photoBoothState.favoriteFilters || []);
  let visibleCount = 0;
  document.querySelectorAll("[data-booth-filter]").forEach((button) => {
    const filter = String(button.dataset.boothFilter || "normal");
    const meta = PHOTOBOOTH_FILTER_META[filter] || {};
    const visible = category === "all"
      ? true
      : category === "favorites"
        ? favorites.has(filter)
        : meta.category === category;
    button.hidden = !visible;
    button.classList.toggle("is-active", filter === selected);
    button.classList.toggle("is-favorite", favorites.has(filter));
    button.classList.toggle("is-default", filter === photoBoothState.defaultFilter);
    if (visible) visibleCount += 1;
  });
  document.querySelectorAll("[data-filter-category]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filterCategory === category);
  });
  const emptyState = document.getElementById("photoboothFilterEmptyState");
  if (emptyState) emptyState.hidden = !(category === "favorites" && visibleCount === 0);
  syncPhotoboothMobileUi();
}

function updatePhotoboothFilterUi() {
  renderPhotoboothFilterButtons();
  const selectedName = document.getElementById("photoboothSelectedFilterName");
  const selectedInfo = document.getElementById("photoboothSelectedFilterInfo");
  const strength = getPhotoboothStrength();
  const meta = PHOTOBOOTH_FILTER_META[photoBoothState.filter] || { label:"Normal", category:"all" };
  if (selectedName) selectedName.textContent = meta.label;
  if (selectedInfo) selectedInfo.textContent = `${PHOTOBOOTH_FILTER_CATEGORY_LABELS[meta.category] || "All"} • ${strength}%${photoBoothState.filter === photoBoothState.defaultFilter ? " • Default" : ""}`;
  const favoriteBtn = document.getElementById("photoboothFavoriteToggle");
  if (favoriteBtn) {
    const isFavorite = (photoBoothState.favoriteFilters || []).includes(photoBoothState.filter);
    favoriteBtn.textContent = isFavorite ? "★ Favorited" : "☆ Favorite";
    favoriteBtn.classList.toggle("is-active", isFavorite);
  }
  const defaultBtn = document.getElementById("photoboothSetDefaultButton");
  if (defaultBtn) {
    const isDefault = photoBoothState.filter === photoBoothState.defaultFilter;
    defaultBtn.textContent = isDefault ? "Default Filter ✓" : "Set as Default";
    defaultBtn.classList.toggle("is-active", isDefault);
  }
  const slider = document.getElementById("photoboothFilterStrength");
  const sliderValue = document.getElementById("photoboothFilterStrengthValue");
  if (slider) slider.value = String(strength);
  if (sliderValue) sliderValue.textContent = `${strength}%`;
}

function applyPhotoboothFilterSelection(filter, { reset = true } = {}) {
  const nextFilter = String(filter || "normal");
  if (!PHOTOBOOTH_FILTERS[nextFilter]) return;
  photoBoothState.filter = nextFilter;
  updatePhotoboothFilterUi();
  applyPhotoboothLiveFilter();
  if (reset) resetPhotoboothResult({ keepCamera:true, quiet:true });
}

function handlePhotoboothFilterCategoryClick(event) {
  const button = event.target.closest("[data-filter-category]");
  if (!button || photoBoothState.busy) return;
  setPhotoboothFilterCategory(button.dataset.filterCategory || "all");
}

function togglePhotoboothFavoriteFilter() {
  const filter = photoBoothState.filter;
  const favorites = new Set(photoBoothState.favoriteFilters || []);
  if (favorites.has(filter)) favorites.delete(filter); else favorites.add(filter);
  photoBoothState.favoriteFilters = Array.from(favorites);
  savePhotoboothFavorites();
  if (photoBoothState.filterCategory === "favorites" && !favorites.has(filter)) {
    const nextFavorite = photoBoothState.favoriteFilters[0];
    if (nextFavorite) photoBoothState.filter = nextFavorite;
  }
  updatePhotoboothFilterUi();
  applyPhotoboothLiveFilter();
}

function setPhotoboothDefaultFilterFromCurrent() {
  photoBoothState.defaultFilter = photoBoothState.filter;
  savePhotoboothDefaultFilter();
  updatePhotoboothFilterUi();
  setPhotoboothStatus(`${(PHOTOBOOTH_FILTER_META[photoBoothState.filter] || {}).label || "Selected"} is now your default filter.`);
}

function handlePhotoboothStrengthInput(event) {
  const value = clampNumber(event?.target?.value, 0, 100);
  photoBoothState.filterStrengths ||= {};
  photoBoothState.filterStrengths[photoBoothState.filter] = value;
  savePhotoboothFilterStrengths();
  updatePhotoboothFilterUi();
  applyPhotoboothLiveFilter();
  resetPhotoboothResult({ keepCamera:true, quiet:true });
}

function setPhotoboothStatus(message, error = false) {
  const status = document.getElementById("photoboothStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.classList.toggle("is-error", Boolean(error));
}

function syncPhotoboothSettingsFromUi() {
  const timer = Number(document.getElementById("photoboothTimer")?.value || 0);
  photoBoothState.timer = [0,3,5,10].includes(timer) ? timer : 3;
  photoBoothState.mirror = document.getElementById("photoboothMirror")?.checked !== false;
  photoBoothState.sound = document.getElementById("photoboothSound")?.checked !== false;
  const stage = document.getElementById("photoboothStage");
  stage?.classList.toggle("no-mirror", !photoBoothState.mirror);
  syncPhotoboothZoomUi();
  syncPhotoboothMobileUi();
}

function setPhotoboothSetupStep(step) {
  const allowed = ["layout", "design", "filter", "camera"];
  if (!allowed.includes(step)) return;
  document.querySelectorAll("#photoboothSetupTabs [data-booth-step]").forEach((button) => {
    const active = button.dataset.boothStep === step;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  document.querySelectorAll(".photoboothSettingsPanel[data-booth-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.boothPanel === step);
    panel.scrollTop = 0;
  });
}

function updatePhotoboothThemeUi() {
  document.querySelectorAll("#photoboothThemeOptions [data-booth-theme]").forEach((button) => {
    button.classList.toggle("is-active", String(button.dataset.boothTheme || "classic") === photoBoothState.theme);
  });
  const feastGroup = document.getElementById("photoboothFeastTemplateGroup");
  if (feastGroup) feastGroup.hidden = photoBoothState.theme !== "feast-faustina";
  document.querySelectorAll("#photoboothFeastTemplateOptions [data-feast-template]").forEach((button) => {
    button.classList.toggle("is-active", String(button.dataset.feastTemplate || "premium") === photoBoothState.themeVariant);
  });
  document.querySelectorAll("[data-feast-palette]").forEach((button) => {
    const active = button.dataset.feastPalette === photoBoothState.palette;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  document.querySelectorAll("[data-feast-orientation]").forEach((button) => {
    const active = button.dataset.feastOrientation === photoBoothState.feastOrientation;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  syncPhotoboothMobileUi();
}

function loadPhotoboothFeastOrientation() {
  try { return localStorage.getItem(PHOTOBOOTH_FEAST_ORIENTATION_KEY) === "portrait" ? "portrait" : "landscape"; }
  catch { return "landscape"; }
}

function handlePhotoboothOrientationClick(event) {
  const button = event.target.closest("button[data-feast-orientation]");
  if (!button || photoBoothState.busy) return;
  const orientation = button.dataset.feastOrientation;
  if (orientation !== "portrait" && orientation !== "landscape") return;
  photoBoothState.feastOrientation = orientation;
  try { localStorage.setItem(PHOTOBOOTH_FEAST_ORIENTATION_KEY, orientation); } catch {}
  updatePhotoboothThemeUi();
  resetPhotoboothResult({ keepCamera:true, quiet:true });
}

function loadPhotoboothFeastPalette() {
  try {
    const saved = localStorage.getItem(PHOTOBOOTH_FEAST_PALETTE_KEY);
    return Object.hasOwn(FEAST_PALETTES, saved) ? saved : "pink";
  } catch (error) { return "pink"; }
}

function handlePhotoboothPaletteClick(event) {
  const button = event.target.closest("button[data-feast-palette]");
  if (!button || photoBoothState.busy) return;
  const palette = button.dataset.feastPalette;
  if (!Object.hasOwn(FEAST_PALETTES, palette)) return;
  photoBoothState.palette = palette;
  try { localStorage.setItem(PHOTOBOOTH_FEAST_PALETTE_KEY, palette); } catch (error) {}
  updatePhotoboothThemeUi();
  resetPhotoboothResult({ keepCamera:true, quiet:true });
}

function handlePhotoboothFeastTemplateClick(event) {
  const button = event.target.closest("button[data-feast-template]");
  if (!button || photoBoothState.busy) return;
  photoBoothState.themeVariant = String(button.dataset.feastTemplate || "premium");
  updatePhotoboothThemeUi();
  resetPhotoboothResult({ keepCamera:true, quiet:true });
}

function handlePhotoboothThemeClick(event) {
  const button = event.target.closest("[data-booth-theme]");
  if (!button || photoBoothState.busy) return;
  photoBoothState.theme = String(button.dataset.boothTheme || "classic");
  updatePhotoboothThemeUi();
  resetPhotoboothResult({keepCamera:true, quiet:true});
}

function handlePhotoboothLayoutClick(event) {
  const button = event.target.closest("[data-booth-layout]");
  if (!button || photoBoothState.busy) return;
  const layout = String(button.dataset.boothLayout || "single");
  if (!PHOTOBOOTH_LAYOUTS[layout]) return;
  photoBoothState.layout = layout;
  document.querySelectorAll("[data-booth-layout]").forEach((item) => item.classList.toggle("is-active", item === button));
  const guide = document.getElementById("photoboothGuide");
  if (guide) guide.className = `photoboothGuide layout-${layout}`;
  resetPhotoboothResult({ keepCamera:true, quiet:true });
  syncPhotoboothCaptureButton();
  syncPhotoboothMobileUi();
}

function handlePhotoboothFilterClick(event) {
  const button = event.target.closest("[data-booth-filter]");
  if (!button || photoBoothState.busy) return;
  const filter = String(button.dataset.boothFilter || "normal");
  if (!PHOTOBOOTH_FILTERS[filter]) return;
  applyPhotoboothFilterSelection(filter);
}

function applyPhotoboothLiveFilter() {
  const video = document.getElementById("photoboothVideo");
  if (video) video.style.filter = getPhotoboothFilterString();
}

function syncPhotoboothCaptureButton() {
  const button = document.getElementById("photoboothCaptureButton");
  if (!button) return;
  const layout = PHOTOBOOTH_LAYOUTS[photoBoothState.layout] || PHOTOBOOTH_LAYOUTS.single;
  button.innerHTML = `<span aria-hidden="true">&#128247;</span> ${layout.shots > 1 ? `Start ${layout.shots}-Photo Session` : "Take Photo"}`;
}

function syncPhotoboothCameraSourceUi() {
  const phone = photoBoothState.source === "phone";
  ["photoboothUseWebcam", "photoboothUsePhone"].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    const active = (id === "photoboothUsePhone") === phone;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  const field = document.getElementById("photoboothDeviceField"); if (field) field.hidden = phone;
  const settings = document.getElementById("photoboothPhoneSettings"); if (settings) settings.hidden = !phone;
  const switchButton = document.getElementById("photoboothSwitchCamera"); if (switchButton) switchButton.hidden = phone;
  const overlay = document.getElementById("photoboothPairOverlay"); if (overlay) overlay.hidden = !phone || Boolean(photoBoothState.stream);
  syncPhotoboothZoomUi();
}

function syncPhotoboothZoomUi() {
  const slider = document.getElementById("photoboothZoom");
  if (slider) slider.value = String(photoBoothState.zoom);
  const label = document.getElementById("photoboothZoomValue");
  if (label) label.textContent = `${photoBoothState.zoom.toFixed(1)}×`;
  const video = document.getElementById("photoboothVideo");
  if (video) video.style.transform = `${photoBoothState.mirror ? "scaleX(-1) " : ""}scale(${photoBoothState.digitalZoom})`;
}

async function applyPhotoboothZoom(value) {
  const slider = document.getElementById("photoboothZoom");
  photoBoothState.zoom = Math.max(1, Math.min(Number(slider?.max) || 3, Number(value) || 1));
  if (photoBoothState.source === "phone") {
    window.SFKPhoneCamera?.sendControl({ type:"zoom-set", zoom:photoBoothState.zoom });
  } else {
    const track = photoBoothState.stream?.getVideoTracks()[0];
    const range = track?.getCapabilities?.().zoom;
    let digital = photoBoothState.zoom;
    if (range && Number.isFinite(range.min) && Number.isFinite(range.max) && track?.applyConstraints) {
      try { await track.applyConstraints({ advanced:[{ zoom:Math.max(range.min, Math.min(range.max, photoBoothState.zoom)) }] }); digital = 1; }
      catch { digital = photoBoothState.zoom; }
    }
    photoBoothState.digitalZoom = digital;
  }
  syncPhotoboothZoomUi();
}

function handlePhotoboothZoomInput(event) {
  if (photoBoothState.busy) return;
  const value = Number(event.target.value);
  photoBoothState.zoom = value;
  syncPhotoboothZoomUi();
  clearTimeout(photoBoothState.zoomTimer);
  photoBoothState.zoomTimer = setTimeout(() => applyPhotoboothZoom(value).catch(() => {}), 65);
}

async function setPhotoboothCameraSource(source) {
  if (photoBoothState.busy || photoBoothState.source === source) return;
  clearTimeout(photoBoothState.zoomTimer);
  photoBoothState.pairAttempt = (photoBoothState.pairAttempt || 0) + 1;
  if (photoBoothState.source === "webcam") stopPhotoboothCamera();
  else { window.SFKPhoneCamera?.disconnect(); stopPhotoboothCamera(); }
  photoBoothState.source = source;
  photoBoothState.zoom = 1;
  photoBoothState.digitalZoom = 1;
  const slider = document.getElementById("photoboothZoom"); if (slider) slider.max = "3";
  photoBoothState.pairUrl = "";
  const copy = document.getElementById("photoboothCopyPairLink"); if (copy) copy.disabled = true;
  syncPhotoboothCameraSourceUi();
  if (source === "phone") await startPhotoboothPhonePairing();
  else { setPhotoboothStatus("Starting this device's camera…"); await startPhotoboothCamera(); }
}

function setPhotoboothPhoneStatus(message, error = false) {
  const label = document.getElementById("photoboothPairStatus");
  if (label) label.textContent = message;
  setPhotoboothStatus(message, error);
}

async function startPhotoboothPhonePairing() {
  if (photoBoothState.source !== "phone" || photoBoothState.busy) return;
  const attempt = photoBoothState.pairAttempt = (photoBoothState.pairAttempt || 0) + 1;
  window.SFKPhoneCamera?.disconnect();
  stopPhotoboothCamera();
  photoBoothState.pairUrl = "";
  syncPhotoboothCameraSourceUi();
  const qr = document.getElementById("photoboothPairQr");
  if (qr) qr.replaceChildren();
  const link = document.getElementById("photoboothPairLink"); if (link) link.hidden = true;
  const copy = document.getElementById("photoboothCopyPairLink"); if (copy) copy.disabled = true;
  const newCode = document.getElementById("photoboothNewPairCode"); if (newCode) newCode.disabled = true;
  try {
    if (!window.SFKPhoneCamera) throw new Error("Phone camera module did not load. Reload this page.");
    const url = await window.SFKPhoneCamera.createRoom({
      onStatus: (message, ready) => {
        if (attempt !== photoBoothState.pairAttempt || photoBoothState.source !== "phone") return;
        setPhotoboothPhoneStatus(message);
        if (ready) { clearTimeout(photoBoothState.pairHintTimer); document.getElementById("photoboothPairOverlay").hidden = true; }
        if (ready && document.getElementById("photoboothVideo")?.videoWidth) window.SFKPhoneCamera?.sendControl({ type:"session-ready" });
      },
      onStream: async (stream) => {
        if (attempt !== photoBoothState.pairAttempt || photoBoothState.source !== "phone") return;
        photoBoothState.stream = stream;
        const video = document.getElementById("photoboothVideo");
        video.srcObject = stream;
        video.addEventListener("loadedmetadata", () => {
          if (attempt === photoBoothState.pairAttempt && photoBoothState.source === "phone" && !photoBoothState.busy) window.SFKPhoneCamera?.sendControl({ type:"session-ready" });
        }, { once:true });
        await video.play().catch(() => {});
        applyPhotoboothLiveFilter();
        document.getElementById("photoboothPairOverlay").hidden = true;
        const label = document.getElementById("photoboothLiveLabel"); if (label) label.textContent = "Phone camera live";
        if (video.videoWidth && !photoBoothState.busy) window.SFKPhoneCamera?.sendControl({ type:"session-ready" });
      },
      onStart: () => {
        if (attempt !== photoBoothState.pairAttempt || photoBoothState.source !== "phone" || document.getElementById("photoboothModal")?.hidden) return;
        startPhotoboothCaptureSequence({ fromPhone:true });
      },
      onZoom: (message) => {
        if (attempt !== photoBoothState.pairAttempt || photoBoothState.source !== "phone") return;
        const slider = document.getElementById("photoboothZoom");
        if (slider) slider.max = String(Number.isFinite(message.max) && message.max > 1 ? Math.min(6, message.max) : 3);
        photoBoothState.zoom = Math.max(1, Number(message.zoom) || 1);
        photoBoothState.digitalZoom = Math.max(1, Number(message.digital) || 1);
        syncPhotoboothZoomUi();
      },
      onDisconnected: () => {
        if (attempt !== photoBoothState.pairAttempt || photoBoothState.source !== "phone") return;
        window.SFKPhoneCamera?.disconnect();
        stopPhotoboothCamera();
        photoBoothState.pairUrl = "";
        const copy = document.getElementById("photoboothCopyPairLink"); if (copy) copy.disabled = true;
        const link = document.getElementById("photoboothPairLink"); if (link) link.hidden = true;
        const qr = document.getElementById("photoboothPairQr"); if (qr) qr.textContent = "Choose New QR code in Camera settings.";
        syncPhotoboothCameraSourceUi();
        setPhotoboothPhoneStatus("Phone disconnected. Tap New QR code to pair again.", true);
      }
    });
    if (attempt !== photoBoothState.pairAttempt || photoBoothState.source !== "phone") return;
    photoBoothState.pairUrl = url;
    if (link) { link.href = url; link.hidden = false; }
    if (copy) copy.disabled = false;
    try {
      if (window.QRCode && qr) new QRCode(qr, { text:url, width:236, height:236, colorDark:"#21180b", colorLight:"#ffffff", correctLevel:QRCode.CorrectLevel.M });
      else if (qr) qr.textContent = "Use the pairing link below";
    } catch { if (qr) qr.textContent = "Use the pairing link below"; }
    setPhotoboothPhoneStatus("Scan this QR with your phone, then tap Allow Camera & Connect.");
  } catch (error) {
    if (attempt === photoBoothState.pairAttempt && photoBoothState.source === "phone") {
      if (qr) qr.textContent = "Pairing unavailable";
      setPhotoboothPhoneStatus(`Unable to create QR code: ${error.message}`, true);
    }
  } finally { if (newCode && attempt === photoBoothState.pairAttempt) newCode.disabled = false; }
}

async function copyPhotoboothPairLink() {
  if (!photoBoothState.pairUrl) return;
  try { await navigator.clipboard.writeText(photoBoothState.pairUrl); setPhotoboothPhoneStatus("Pairing link copied. Open it on your phone."); }
  catch { setPhotoboothPhoneStatus("Copy unavailable. Open the link on the preview and share it with your phone.", true); }
}

async function openPhotobooth() {
  const modal = document.getElementById("photoboothModal");
  if (!modal) return;
  modal.hidden = false;
  window.SFK_PHONE_ORIENTATION?.allowPhotoboothLandscape?.(true);
  photoBoothState.source = "webcam";
  photoBoothState.zoom = 1;
  photoBoothState.digitalZoom = 1;
  syncPhotoboothCameraSourceUi();
  document.body.style.overflow = "hidden";
  photoBoothState.filter = photoBoothState.defaultFilter || "normal";
  setPhotoboothSetupStep("layout");
  closePhotoboothMobileTray();
  syncPhotoboothSettingsFromUi();
  syncPhotoboothCaptureButton();
  updatePhotoboothThemeUi();
  updatePhotoboothFilterUi();
  syncPhotoboothMobileUi();
  resetPhotoboothResult({ keepCamera:true, quiet:true });
  setPhotoboothStatus("Starting camera...");
  await startPhotoboothCamera();
}

function closePhotobooth() {
  const modal = document.getElementById("photoboothModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  clearTimeout(photoBoothState.zoomTimer);
  window.SFKPhoneCamera?.disconnect();
  stopPhotoboothCamera();
  photoBoothState.pairUrl = "";
  photoBoothState.busy = false;
  setPhotoboothMobileBusy(false);
  closePhotoboothMobileTray();
  hidePhotoboothCountdown();
  document.body.style.overflow = "";
  window.SFK_PHONE_ORIENTATION?.allowPhotoboothLandscape?.(false);
}

function stopPhotoboothCamera() {
  if (photoBoothState.stream && photoBoothState.source === "webcam") {
    photoBoothState.stream.getTracks().forEach((track) => { try { track.stop(); } catch (error) {} });
  }
  photoBoothState.stream = null;
  const video = document.getElementById("photoboothVideo");
  if (video) video.srcObject = null;
}

async function startPhotoboothCamera({ deviceId = photoBoothState.deviceId, facingMode = photoBoothState.facingMode } = {}) {
  if (photoBoothState.source !== "webcam") return false;
  const video = document.getElementById("photoboothVideo");
  const liveLabel = document.getElementById("photoboothLiveLabel");
  if (!video) return false;
  if (!navigator.mediaDevices?.getUserMedia) {
    setPhotoboothStatus("Camera access is not supported here. Open the site through HTTPS or localhost, or use photo upload instead.", true);
    if (liveLabel) liveLabel.textContent = "Camera unavailable";
    return false;
  }
  stopPhotoboothCamera();
  try {
    const videoConstraints = deviceId
      ? { deviceId: { exact: deviceId }, width:{ideal:1920}, height:{ideal:1080} }
      : { facingMode: { ideal: facingMode || "user" }, width:{ideal:1920}, height:{ideal:1080} };
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio:false });
    if (document.getElementById("photoboothModal")?.hidden || photoBoothState.source !== "webcam") {
      stream.getTracks().forEach((track) => { try { track.stop(); } catch (error) {} });
      return false;
    }
    photoBoothState.stream = stream;
    const zoomSlider = document.getElementById("photoboothZoom");
    const zoomRange = stream.getVideoTracks()[0]?.getCapabilities?.().zoom;
    if (zoomSlider) zoomSlider.max = String(zoomRange?.max > 1 ? Math.min(6, zoomRange.max) : 3);
    photoBoothState.zoom = 1;
    photoBoothState.digitalZoom = 1;
    syncPhotoboothZoomUi();
    video.srcObject = stream;
    await video.play().catch(() => {});
    const activeTrack = stream.getVideoTracks()[0];
    const settings = activeTrack?.getSettings?.() || {};
    photoBoothState.deviceId = String(settings.deviceId || deviceId || "");
    photoBoothState.facingMode = String(settings.facingMode || facingMode || "user");
    applyPhotoboothLiveFilter();
    await refreshPhotoboothDevices();
    if (liveLabel) liveLabel.textContent = "Live camera";
    setPhotoboothStatus("Camera ready. Choose your layout, filter, and timer, then capture.");
    return true;
  } catch (error) {
    console.warn("Photobooth camera failed", error);
    if (liveLabel) liveLabel.textContent = "Camera blocked";
    const reason = error?.name === "NotAllowedError"
      ? "Camera permission was blocked. Allow camera access in your browser, then open the photobooth again."
      : "Unable to start the camera. Check that another app is not using it, then try again.";
    setPhotoboothStatus(reason, true);
    return false;
  }
}

async function refreshPhotoboothDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter((item) => item.kind === "videoinput");
    photoBoothState.devices = devices;
    const select = document.getElementById("photoboothCameraSelect");
    if (!select) return;
    const previous = photoBoothState.deviceId;
    select.innerHTML = devices.length
      ? devices.map((item,index) => `<option value="${escapeAttr(item.deviceId)}">${escapeHtml(item.label || `Camera ${index+1}`)}</option>`).join("")
      : '<option value="">Default camera</option>';
    if (devices.some((item) => item.deviceId === previous)) select.value = previous;
  } catch (error) {}
}

async function handlePhotoboothCameraSelect() {
  if (photoBoothState.busy || photoBoothState.source !== "webcam") return;
  const select = document.getElementById("photoboothCameraSelect");
  const deviceId = String(select?.value || "");
  if (!deviceId) return;
  photoBoothState.deviceId = deviceId;
  setPhotoboothStatus("Switching camera...");
  await startPhotoboothCamera({ deviceId });
}

async function switchPhotoboothCamera() {
  if (photoBoothState.busy || photoBoothState.source !== "webcam") return;
  const devices = photoBoothState.devices || [];
  if (devices.length > 1) {
    const currentIndex = Math.max(0, devices.findIndex((item) => item.deviceId === photoBoothState.deviceId));
    const next = devices[(currentIndex + 1) % devices.length];
    photoBoothState.deviceId = next.deviceId;
    document.getElementById("photoboothCameraSelect").value = next.deviceId;
    setPhotoboothStatus("Switching camera...");
    await startPhotoboothCamera({ deviceId: next.deviceId });
    return;
  }
  photoBoothState.deviceId = "";
  photoBoothState.facingMode = photoBoothState.facingMode === "environment" ? "user" : "environment";
  setPhotoboothStatus("Switching camera...");
  await startPhotoboothCamera({ deviceId:"", facingMode:photoBoothState.facingMode });
}

function getPhotoboothAudioContext() {
  if (!photoBoothState.sound) return null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    photoBoothState.audioContext ||= new AudioContextClass();
    if (photoBoothState.audioContext.state === "suspended") photoBoothState.audioContext.resume().catch(() => {});
    return photoBoothState.audioContext;
  } catch (error) { return null; }
}

function playPhotoboothTone(kind = "beep") {
  const context = getPhotoboothAudioContext();
  if (!context) return;
  try {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === "shutter" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(kind === "shutter" ? 880 : 660, now);
    if (kind === "shutter") oscillator.frequency.exponentialRampToValueAtTime(180, now + .09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "shutter" ? .18 : .08, now + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, now + (kind === "shutter" ? .13 : .09));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now); oscillator.stop(now + .15);
  } catch (error) {}
}

function waitMs(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

function showPhotoboothCountdown(value, caption) {
  const overlay = document.getElementById("photoboothCountdown");
  if (!overlay) return;
  overlay.hidden = false;
  const strong = overlay.querySelector("strong");
  const small = overlay.querySelector("small");
  if (strong) strong.textContent = String(value);
  if (small) small.textContent = caption || "Get ready!";
}
function hidePhotoboothCountdown() { const overlay=document.getElementById("photoboothCountdown"); if(overlay) overlay.hidden=true; }

async function runPhotoboothCountdown(seconds, shotIndex, totalShots) {
  if (seconds <= 0) {
    showPhotoboothCountdown("•", totalShots > 1 ? `Photo ${shotIndex}/${totalShots}` : "Smile!");
    if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"countdown", value:"SMILE", shot:shotIndex, total:totalShots });
    await waitMs(520);
    hidePhotoboothCountdown();
    return;
  }
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    showPhotoboothCountdown(remaining, totalShots > 1 ? `Photo ${shotIndex}/${totalShots}` : "Get ready!");
    if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"countdown", value:remaining, shot:shotIndex, total:totalShots });
    playPhotoboothTone("beep");
    await waitMs(860);
  }
  showPhotoboothCountdown("SMILE", totalShots > 1 ? `Photo ${shotIndex}/${totalShots}` : "Ready!");
  if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"countdown", value:"SMILE", shot:shotIndex, total:totalShots });
  await waitMs(300);
  hidePhotoboothCountdown();
}

function flashPhotobooth() {
  const flash = document.getElementById("photoboothFlash");
  if (!flash) return;
  flash.classList.remove("is-flashing");
  void flash.offsetWidth;
  flash.classList.add("is-flashing");
}

async function capturePhotoboothFrame(shotIndex = 0) {
  const video = document.getElementById("photoboothVideo");
  if (!video || !video.videoWidth || !video.videoHeight) throw new Error("Camera image is not ready yet.");
  const startedAt = performance.now();
  const plan = getPhotoboothCanvasPlan(photoBoothState.layout, photoBoothState.theme);
  const slot = plan.slots[shotIndex] || plan.slots[0];
  const scale = photoBoothState.theme === "feast-faustina" ? 2 : 1;
  // A shot only needs the pixels its slot can show in the final photocard.
  // Preserve full-resolution capture and transfer; crop and filter once at export size.
  const targetWidth = Math.ceil(slot.w * scale);
  const targetHeight = Math.ceil(slot.h * scale);
  let photo = video;
  if (photoBoothState.source === "phone") {
    setPhotoboothStatus("Taking a high-quality photo on the phone…");
    const blob = await window.SFKPhoneCamera.requestPhoto({
      onStart:() => setPhotoboothStatus("Receiving the original phone photo…"),
      onTiming:(timing) => console.info("Photobooth photo transfer", timing)
    });
    if (window.createImageBitmap) photo = await createImageBitmap(blob);
    else photo = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read the phone photo.")); };
      image.src = url;
    });
  }
  const width = photo.width || photo.videoWidth;
  const height = photo.height || photo.videoHeight;
  if (photoBoothState.source === "phone") setPhotoboothStatus("Photo received. Preparing the next shot…");
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  try {
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.filter = getPhotoboothFilterString();
    if (photoBoothState.mirror) {
      ctx.translate(targetWidth,0);
      ctx.scale(-1,1);
    }
    const digitalZoom = Math.max(1, Number(photoBoothState.digitalZoom) || 1);
    let cropWidth = width / digitalZoom;
    let cropHeight = height / digitalZoom;
    const slotRatio = targetWidth / targetHeight;
    if (cropWidth / cropHeight > slotRatio) cropWidth = cropHeight * slotRatio;
    else cropHeight = cropWidth / slotRatio;
    ctx.drawImage(photo,(width-cropWidth)/2,(height-cropHeight)/2,cropWidth,cropHeight,0,0,targetWidth,targetHeight);
    ctx.restore();
    if (photoBoothState.source === "phone") console.info("Photobooth photo preparation", { originalWidth:width, originalHeight:height, slotWidth:targetWidth, slotHeight:targetHeight, ms:Math.round(performance.now()-startedAt) });
    return canvas;
  } finally {
    if (photo !== video && photo.close) photo.close();
  }
}

async function startPhotoboothCaptureSequence({ fromPhone = false } = {}) {
  if (photoBoothState.busy) {
    if (fromPhone) window.SFKPhoneCamera?.sendControl({ type:"session-busy" });
    return;
  }
  const video = document.getElementById("photoboothVideo");
  if (!photoBoothState.stream || !video?.videoWidth) {
    setPhotoboothStatus("Camera is not ready yet. Try again after the live preview appears.", true);
    if (fromPhone) window.SFKPhoneCamera?.sendControl({ type:"session-unavailable" });
    return;
  }
  if (photoBoothState.source === "phone" && !window.SFKPhoneCamera?.connected) {
    setPhotoboothStatus("Wait for the phone to connect before taking photos.", true);
    if (fromPhone) window.SFKPhoneCamera?.sendControl({ type:"session-unavailable" });
    return;
  }
  if (photoBoothState.resultBlob) resetPhotoboothResult({ keepCamera:true, quiet:true });
  syncPhotoboothSettingsFromUi();
  const layout = PHOTOBOOTH_LAYOUTS[photoBoothState.layout] || PHOTOBOOTH_LAYOUTS.single;
  photoBoothState.busy = true;
  if (photoBoothState.theme === "feast-faustina") getEmbeddedFeastPortrait().catch(() => {});
  if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"session-start" });
  setPhotoboothMobileBusy(true);
  photoBoothState.shots = [];
  const captureButton = document.getElementById("photoboothCaptureButton");
  const switchButton = document.getElementById("photoboothSwitchCamera");
  if (captureButton) captureButton.disabled = true;
  if (switchButton) switchButton.disabled = true;
  const zoomSlider = document.getElementById("photoboothZoom"); if (zoomSlider) zoomSlider.disabled = true;
  document.getElementById("photoboothShotProgress").hidden = false;
  try {
    for (let index = 0; index < layout.shots; index += 1) {
      const progress = document.getElementById("photoboothShotProgress");
      if (progress) progress.textContent = `Photo ${index+1} / ${layout.shots}`;
      setPhotoboothStatus(layout.shots > 1 ? `Get ready for photo ${index+1} of ${layout.shots}.` : "Get ready...");
      await runPhotoboothCountdown(photoBoothState.timer, index+1, layout.shots);
      if (document.getElementById("photoboothModal")?.hidden) return;
      flashPhotobooth();
      playPhotoboothTone("shutter");
      photoBoothState.shots.push(await capturePhotoboothFrame(index));
      if (index < layout.shots - 1) await waitMs(650);
    }
    setPhotoboothStatus("Preparing your high-quality photocard…");
    if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"photo-preparing" });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await renderPhotoboothCollage();
    if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"session-done" });
  } catch (error) {
    console.error("Photobooth capture failed", error);
    setPhotoboothStatus(error.message || "Unable to capture the photo.", true);
    if (photoBoothState.source === "phone") window.SFKPhoneCamera?.sendControl({ type:"session-error" });
  } finally {
    photoBoothState.busy = false;
    setPhotoboothMobileBusy(false);
    if (captureButton) captureButton.disabled = false;
    if (switchButton) switchButton.disabled = false;
    if (zoomSlider) zoomSlider.disabled = false;
    const progress = document.getElementById("photoboothShotProgress");
    if (progress) progress.hidden = true;
    hidePhotoboothCountdown();
  }
}

function drawPhotoboothCover(ctx, source, x, y, width, height) {
  const sw = source.width, sh = source.height;
  const sourceRatio = sw / sh;
  const targetRatio = width / height;
  let sx=0, sy=0, sWidth=sw, sHeight=sh;
  if (sourceRatio > targetRatio) {
    sWidth = sh * targetRatio;
    sx = (sw - sWidth) / 2;
  } else {
    sHeight = sw / targetRatio;
    sy = (sh - sHeight) / 2;
  }
  ctx.drawImage(source, sx, sy, sWidth, sHeight, x, y, width, height);
}

function getPhotoboothCanvasPlan(layout, theme = photoBoothState.theme) {
  const gap = 26, outer = 38, footer = 112;
  if (theme === "feast-faustina") return getFeastFaustinaCanvasPlan(layout, photoBoothState.feastOrientation);
  if (layout === "grid4") {
    const width=1400, height=1400, innerW=width-outer*2, innerH=height-footer-outer*2, cellW=(innerW-gap)/2, cellH=(innerH-gap)/2;
    return { width,height,footer,slots:[
      {x:outer,y:outer,w:cellW,h:cellH},{x:outer+cellW+gap,y:outer,w:cellW,h:cellH},
      {x:outer,y:outer+cellH+gap,w:cellW,h:cellH},{x:outer+cellW+gap,y:outer+cellH+gap,w:cellW,h:cellH}
    ]};
  }
  if (layout === "single") {
    const width=1200,height=1500;
    return {width,height,footer,slots:[{x:outer,y:outer,w:width-outer*2,h:height-footer-outer*2}]};
  }
  const count = layout === "strip2" ? 2 : layout === "strip3" ? 3 : 4;
  const width=900, photoH=layout === "strip4" ? 430 : layout === "strip3" ? 510 : 620;
  const height=outer*2 + footer + count*photoH + (count-1)*gap;
  const slots=Array.from({length:count},(_,i)=>({x:outer,y:outer+i*(photoH+gap),w:width-outer*2,h:photoH}));
  return {width,height,footer,slots};
}

function getFeastFaustinaCanvasPlan(layout, orientation = "landscape") {
  if (orientation === "portrait") {
    const width = 1100, height = 1600, footer = 145, top = 382, bottom = 1368;
    const outer = 80, gap = 26, inner = width - 2 * outer, span = bottom - top;
    const slots = [];
    if (layout === "single") slots.push({ x:outer, y:top, w:inner, h:span });
    else if (layout === "strip2") {
      const h = (span - gap) / 2;
      slots.push({ x:outer, y:top, w:inner, h }, { x:outer, y:top+h+gap, w:inner, h });
    } else if (layout === "strip3") {
      const firstH = 470, cellW = (inner - gap) / 2, rowY = top + firstH + gap;
      slots.push({ x:outer, y:top, w:inner, h:firstH },
        { x:outer, y:rowY, w:cellW, h:bottom-rowY },
        { x:outer+cellW+gap, y:rowY, w:cellW, h:bottom-rowY });
    } else {
      const w = (inner - gap) / 2, h = (span - gap) / 2;
      const left = outer, right = outer+w+gap, second = top+h+gap;
      if (layout === "strip4") slots.push({x:left,y:top,w,h}, {x:left,y:second,w,h},
        {x:right,y:top,w,h}, {x:right,y:second,w,h});
      else slots.push({x:left,y:top,w,h}, {x:right,y:top,w,h},
        {x:left,y:second,w,h}, {x:right,y:second,w,h});
    }
    return { width,height,footer,orientation,slots,saintBox:{x:788,y:67,w:245,h:190} };
  }
  const width = 1600, height = 1100, footer = 118, titleBlock = 258;
  const outer = 80, gap = 26, top = 342, bottom = 910;
  const h = bottom - top, inner = width - outer * 2, slots = [];
  const saintBox = { x: 1157, y: 59, w: 344, h: 198 };
  if (layout === "single") slots.push({ x: outer, y: top, w: inner, h });
  else if (layout === "strip2") {
    const w = (inner - gap) / 2;
    slots.push({ x: outer, y: top, w, h }, { x: outer + w + gap, y: top, w, h });
  } else if (layout === "strip3") {
    const leftW = 675, rightW = inner - leftW - gap, smallH = (h - gap) / 2;
    slots.push({ x: outer, y: top, w: leftW, h },
      { x: outer + leftW + gap, y: top, w: rightW, h: smallH },
      { x: outer + leftW + gap, y: top + smallH + gap, w: rightW, h: smallH });
  } else if (layout === "strip4") {
    const w = (inner - gap * 3) / 4;
    for (let i = 0; i < 4; i += 1) slots.push({ x: outer + i * (w + gap), y: top, w, h });
  } else {
    const w = (inner - gap) / 2, cellH = (h - gap) / 2;
    slots.push({ x: outer, y: top, w, h: cellH }, { x: outer + w + gap, y: top, w, h: cellH },
      { x: outer, y: top + cellH + gap, w, h: cellH }, { x: outer + w + gap, y: top + cellH + gap, w, h: cellH });
  }
  return { width, height, footer, titleBlock, slots, saintBox, orientation:"landscape" };
}

const FEAST_FAUSTINA_PORTRAIT = "data:image/webp;base64,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";
let feastFaustinaPortraitPromise;
function getEmbeddedFeastPortrait() {
  feastFaustinaPortraitPromise ||= loadImage(FEAST_FAUSTINA_PORTRAIT, { crossOrigin: null }).catch(() => null);
  return feastFaustinaPortraitPromise;
}

const photoboothThemeAssetCache = new Map();
const photoboothThemeAssetObjectUrls = new Set();

window.addEventListener("pagehide", () => {
  photoboothThemeAssetObjectUrls.forEach((url) => { try { URL.revokeObjectURL(url); } catch (error) {} });
  photoboothThemeAssetObjectUrls.clear();
});

async function loadPhotoboothThemeAsset(src) {
  if (photoboothThemeAssetCache.has(src)) return photoboothThemeAssetCache.get(src);
  const promise = (async () => {
    const normalizedSrc = String(src || "").trim();
    if (!normalizedSrc) return null;
    try {
      const assetUrl = new URL(normalizedSrc, window.location.href).href;
      const response = await fetch(assetUrl, { mode:"cors", credentials:"same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      photoboothThemeAssetObjectUrls.add(blobUrl);
      return await loadImage(blobUrl, { crossOrigin: null });
    } catch (error) {
      try {
        return await loadImage(normalizedSrc, { crossOrigin:"anonymous" });
      } catch (fallbackError) {
        console.warn("Photobooth theme asset failed", normalizedSrc, fallbackError || error);
        return null;
      }
    }
  })();
  photoboothThemeAssetCache.set(src, promise);
  return promise;
}

function photoboothRoundedRect(ctx, x, y, w, h, r = 22) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillPhotoboothRoundedRect(ctx, x, y, w, h, r, fillStyle, strokeStyle = "", lineWidth = 0) {
  ctx.save();
  photoboothRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle && lineWidth > 0) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function getFeastFaustinaTemplateSpec(variant = photoBoothState.themeVariant) {
  const key = ["formal", "cute", "premium"].includes(variant) ? variant : "premium";
  const specs = {
    formal: {
      key,
      titleKicker: "FORMAL FEAST DAY EDITION",
      titleSub: "A ceremonial keepsake honoring the Feast Day celebration.",
      footerLeft: "Formal Feast Day Portrait",
      footerRight: "Mercy • Grace • Reverence",
      badgeStamp: "FORMAL",
      stickerTop: "FAITHFUL &",
      stickerBottom: "GRACEFUL",
      bgStops: ["#fffefb", "#f7edd0", "#fffdf5", "#efe0a8"],
      borderFill: "rgba(255,250,238,0.16)",
      outerStroke: "#c8a43c",
      innerStroke: "rgba(17,17,17,0.72)",
      headerStops: ["#111111", "#382a14", "#111111"],
      titleText: "#fff8df",
      chipFill: "#d4af37",
      chipText: "#16120b",
      stickerOuter: "#fff8df",
      stickerInner: "#111111",
      stickerText: "#fff8df",
      stickerAccent: "#f3d169",
      accentPalette: ["#c9a227", "#111111", "#f0d676", "#8d6b13"],
      frameInner: "#fffdf8",
      photoTagBg: "rgba(17,17,17,0.80)",
      photoTagText: "#fff8df",
      footerStops: ["#111111", "#3a2a12", "#111111"],
      footerText: "#fff8df",
      footerAccent: "#f7d86d",
      banderitasPalette: ["#111111", "#d4af37", "#ffffff", "#c8a43c"],
      cuteShapes: false,
      premiumGlow: false,
      ribbonLabel: "SFK 2026",
      ribbonFill: "#111111",
      ribbonAccent: "#d4af37"
    },
    cute: {
      key,
      titleKicker: "CUTE FEAST DAY EDITION",
      titleSub: "Playful party vibes with joyful booth stickers and soft charm.",
      footerLeft: "Cute Feast Day Snap",
      footerRight: "Joy • Friendship • Mercy",
      badgeStamp: "CUTE",
      stickerTop: "SMILE WITH",
      stickerBottom: "MERCY & JOY",
      bgStops: ["#fffef7", "#fff2bf", "#fff9ef", "#fde4a8"],
      borderFill: "rgba(255,251,242,0.22)",
      outerStroke: "#e0b447",
      innerStroke: "rgba(91,70,15,0.48)",
      headerStops: ["#2d2110", "#6f5212", "#2d2110"],
      titleText: "#fff9e8",
      chipFill: "#ffefb8",
      chipText: "#41300f",
      stickerOuter: "#fff8df",
      stickerInner: "#5c4311",
      stickerText: "#fffef4",
      stickerAccent: "#ffe07e",
      accentPalette: ["#f3c94b", "#ffffff", "#111111", "#cfaa24"],
      frameInner: "#fff9f0",
      photoTagBg: "rgba(92,67,17,0.74)",
      photoTagText: "#fff8df",
      footerStops: ["#4f3a0f", "#a47a15", "#4f3a0f"],
      footerText: "#fffdf4",
      footerAccent: "#ffef98",
      banderitasPalette: ["#f3c94b", "#111111", "#ffffff", "#cfaa24"],
      cuteShapes: true,
      premiumGlow: false,
      ribbonLabel: "FEAST FUN",
      ribbonFill: "#d4af37",
      ribbonAccent: "#111111"
    },
    premium: {
      key,
      titleKicker: "PREMIUM FEAST DAY EDITION",
      titleSub: "Elegant keepsake layout with rich event graphics for a polished souvenir print.",
      footerLeft: "Feast Day Photobooth Keepsake",
      footerRight: "Jesus, I Trust in You",
      badgeStamp: "PREMIUM",
      stickerTop: "CELEBRATE WITH",
      stickerBottom: "MERCY & JOY",
      bgStops: ["#fffdfa", "#fff4cf", "#fff9ea", "#f5e3a9"],
      borderFill: "rgba(255,250,238,0.20)",
      outerStroke: "#c8a43c",
      innerStroke: "rgba(17, 17, 17, 0.68)",
      headerStops: ["#111111", "#2f220d", "#111111"],
      titleText: "#fff8df",
      chipFill: "#d4af37",
      chipText: "#16120b",
      stickerOuter: "#fff8df",
      stickerInner: "#111111",
      stickerText: "#fff8df",
      stickerAccent: "#f3d169",
      accentPalette: ["#d4af37", "#f3ce63", "#111111", "#b8860b"],
      frameInner: "#fffaf0",
      photoTagBg: "rgba(17,17,17,0.78)",
      photoTagText: "#fff8df",
      footerStops: ["#111111", "#3a2a12", "#111111"],
      footerText: "#fff8df",
      footerAccent: "#f7d86d",
      banderitasPalette: ["#111111", "#f3c94b", "#ffffff", "#cfaa24"],
      cuteShapes: false,
      premiumGlow: true,
      ribbonLabel: "S.Y. 2026–2027",
      ribbonFill: "#111111",
      ribbonAccent: "#d4af37"
    }
  };
  Object.assign(specs.formal, {
    bgStops: ["#fff8e8", "#f7deab", "#fff2dc", "#dfb9a2"],
    headerStops: ["#501a38", "#953f4c", "#501a38"],
    footerStops: ["#49162f", "#923f3e", "#49162f"],
    accentPalette: ["#e7b54c", "#9b3850", "#fff2d2", "#d48967"],
    banderitasPalette: ["#f2c75a", "#a83d53", "#fff2cf", "#d98168"],
    outerStroke: "#cc9b38", footerAccent: "#ffe5a1"
  });
  Object.assign(specs.cute, {
    bgStops: ["#fff5e8", "#ffddba", "#fff4d8", "#f8c5d4"],
    headerStops: ["#963f66", "#d36b75", "#a44873"],
    footerStops: ["#89375e", "#d36170", "#89375e"],
    accentPalette: ["#edbb4e", "#e7839d", "#85c7b3", "#f7db9a"],
    banderitasPalette: ["#ffc95d", "#f79aaa", "#fff1c8", "#91d3be"],
    outerStroke: "#d4a342", footerAccent: "#fff0a8"
  });
  Object.assign(specs.premium, {
    bgStops: ["#fffaea", "#f1dcb7", "#faf1e7", "#ddc0cd"],
    headerStops: ["#241836", "#6b315e", "#261733"],
    footerStops: ["#20172e", "#5d2d53", "#20172e"],
    accentPalette: ["#e4b954", "#aa688d", "#fff1c8", "#653254"],
    banderitasPalette: ["#e5b94d", "#aa5b86", "#fff2dc", "#472646"],
    outerStroke: "#cc9e4b", footerAccent: "#fce5a8"
  });
  const palette = FEAST_PALETTES[photoBoothState.palette] || FEAST_PALETTES.pink;
  // Keep each style's ornaments and typography while recoloring the complete printed card.
  if (photoBoothState.palette === "pink") return { ...palette, ...specs[key] };
  return { ...specs[key], ...palette, stickerInner:palette.headerStops[0], stickerAccent:palette.footerAccent,
    ribbonFill:palette.headerStops[0], ribbonAccent:palette.chipFill, frameInner:palette.sparkleBright };
}

function drawFeastFaustinaBackdrop(ctx, plan, spec) {
  const { width, height } = plan;
  const palette = spec.banderitasPalette;
  ctx.save();
  // Open cardstock margins leave room for the photographs; decorations sit outside the frames.
  [
    [64, 555, 108], [width - 64, 555, 108], [275, 25, 200],
    [width - 290, height + 65, 205], [width / 2, height + 110, 315]
  ].forEach(([x,y,r], i) => {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle = i % 2 ? "rgba(154,63,102,.23)" : "rgba(195,145,62,.28)";
    ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y,r-17,0,Math.PI*2);
    ctx.lineWidth = 2; ctx.stroke();
  });
  for(let i=0;i<92;i++) {
    const x=19+(i*187)%(width-38), y=22+(i*313)%(height-44);
    ctx.save();ctx.translate(x,y);ctx.rotate((i%8)*.4);
    ctx.fillStyle=palette[i%palette.length];ctx.globalAlpha=.56;
    if(i%4===0){ctx.font="900 24px Georgia";ctx.fillText("✦",0,0);}
    else ctx.fillRect(-4,-9,8+(i%3)*2,14+(i%4)*2);
    ctx.restore();
  }
  ctx.restore();
}

function drawFeastFaustinaBanderitas(ctx, width, y, spec = getFeastFaustinaTemplateSpec()) {
  const startX = 94, endX = width - 94, count = 19;
  const palette = spec.banderitasPalette || ["#f2c75a", "#9b3850", "#fff2cf"];
  ctx.save();
  ctx.strokeStyle = "#aa7936"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(startX, y);
  ctx.quadraticCurveTo(width / 2, y + 30, endX, y); ctx.stroke();
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1), x = startX + (endX - startX) * t;
    const yy = y + 14 * Math.sin(Math.PI * t) + 3;
    ctx.beginPath(); ctx.moveTo(x - 21, yy); ctx.lineTo(x + 21, yy);
    ctx.lineTo(x, yy + 30); ctx.closePath();
    ctx.fillStyle = palette[i % palette.length]; ctx.fill();
    ctx.strokeStyle = "rgba(82,42,35,.43)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, yy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe29c"; ctx.fill();
  }
  ctx.restore();
}

function drawFeastHeart(ctx, x, y, size, fill, stroke = "#fff4d4") {
  ctx.save(); ctx.translate(x,y); ctx.scale(size/50,size/50);
  ctx.beginPath();ctx.moveTo(0,20);ctx.bezierCurveTo(-36,-3,-32,-28,-13,-27);
  ctx.bezierCurveTo(-4,-27,0,-19,0,-15);ctx.bezierCurveTo(0,-19,4,-27,13,-27);
  ctx.bezierCurveTo(32,-28,36,-3,0,20);ctx.closePath();
  ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2.6;ctx.stroke();ctx.restore();
}
function drawFeastSparkle(ctx, x, y, size, fill, stroke = "#fff4d4") {
  ctx.save();ctx.translate(x,y);ctx.beginPath();
  for(let i=0;i<8;i++){
    const a=-Math.PI/2+i*Math.PI/4,r=i%2?size*.25:size;
    if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.stroke();ctx.restore();
}
function drawFeastMicroSparkles(ctx, plan, spec) {
  // Tiny four-point glints are placed only on the printed frame, never over a portrait or shot.
  const glint = (x, y, radius, onDark = false) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = spec.sparkleWarm;
    ctx.shadowBlur = onDark ? 12 : 6;
    ctx.strokeStyle = onDark ? spec.sparkleBright : spec.innerStroke;
    ctx.lineWidth = onDark ? 1.7 : 1.3;
    ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius); ctx.lineTo(0, radius); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, radius > 5 ? 2.2 : 1.5, 0, Math.PI * 2);
    ctx.fillStyle = spec.sparkleWarm; ctx.fill();
    ctx.restore();
  };
  if (plan.orientation === "portrait") {
    for (let side = 0; side < 2; side++) {
      const x = side ? plan.width - 46 : 46;
      for (let i = 0; i < 24; i++) glint(x + (i % 3 - 1) * 7, 390 + i * 40, i % 6 === 0 ? 6 : 3, i % 4 === 0);
    }
    for (let i = 0; i < 12; i++) glint(92 + i * 79, 345 + i % 3 * 8, 3 + i % 4);
    return;
  }
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 20; i++) {
      const x = (side ? plan.width - 1 : 0) + (side ? -1 : 1) * (35 + (i * 11) % 22);
      const y = 350 + (i * 139) % 555;
      glint(x, y, i % 7 === 0 ? 7 : 2.8 + (i % 4), i % 3 === 0);
    }
  }
  [[943,88,5],[998,105,8],[1072,92,4],[1120,124,6],[955,224,4],[1032,207,6],[1100,238,4]].forEach(([x,y,r]) => glint(x,y,r,true));
  for (let i = 0; i < 22; i++) {
    glint(110 + (i * 233) % (plan.width - 220), 281 + (i * 17) % 30, 2.5 + i % 4, false);
  }
}
function drawFeastRosette(ctx,x,y,r,fill) {
  ctx.save();ctx.translate(x,y);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.55,Math.sin(a)*r*.55,r*.42,r*.24,a,0,Math.PI*2);
    ctx.fillStyle=fill;ctx.fill();
  }
  ctx.beginPath();ctx.arc(0,0,r*.35,0,Math.PI*2);ctx.fillStyle="#fff6d5";ctx.fill();
  ctx.strokeStyle="#bd824b";ctx.lineWidth=2;ctx.stroke();ctx.restore();
}
function drawFeastKoala(ctx,x,y) {
  ctx.save();ctx.translate(x,y);
  ctx.beginPath();ctx.arc(0,0,52,0,Math.PI*2);ctx.fillStyle="#fff5d2";ctx.fill();
  ctx.strokeStyle="#d29f55";ctx.lineWidth=4;ctx.stroke();
  for(const side of [-1,1]){
    ctx.beginPath();ctx.arc(side*35,-10,21,0,Math.PI*2);ctx.fillStyle="#bec6d0";ctx.fill();
    ctx.beginPath();ctx.arc(side*35,-10,13,0,Math.PI*2);ctx.fillStyle="#efacbb";ctx.fill();
  }
  ctx.beginPath();ctx.ellipse(0,7,38,40,0,0,Math.PI*2);ctx.fillStyle="#d5dbe2";ctx.fill();
  ctx.fillStyle="#292c39";
  for(const ex of [-15,15]){ctx.beginPath();ctx.arc(ex,1,3.8,0,Math.PI*2);ctx.fill();}
  ctx.beginPath();ctx.ellipse(0,17,11,15,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(-24,-32);ctx.lineTo(-4,-77);ctx.lineTo(23,-35);ctx.closePath();
  ctx.fillStyle="#f493a5";ctx.fill();ctx.strokeStyle="#fff7d9";ctx.lineWidth=4;ctx.stroke();
  drawFeastSparkle(ctx,-4,-78,7,"#ffe084");ctx.restore();
}
function drawFeastFaustinaOrnaments(ctx, plan, spec) {
  const palette = spec.banderitasPalette;
  ctx.save();
  if (plan.orientation === "portrait") {
    [444,652,860,1070,1270].forEach((y,i) => {
      const left = 44, right = plan.width - 44;
      if (i % 2) { drawFeastHeart(ctx,left,y,17,palette[1]); drawFeastSparkle(ctx,right,y,12,palette[0]); }
      else { drawFeastSparkle(ctx,left,y,12,palette[0]); drawFeastHeart(ctx,right,y,17,palette[1]); }
    });
    drawFeastSparkle(ctx,738,111,15,palette[0]);
    if (spec.key === "cute") { ctx.save(); ctx.translate(957,1417); ctx.scale(.42,.42); drawFeastKoala(ctx,0,0); ctx.restore(); }
    else drawFeastRosette(ctx,949,1418,20,palette[0]);
    ctx.restore();
    return;
  }
  // Small hearts and starlets stay in the narrow print margin beside the wider photographs.
  [392,530,667,805].forEach((y,i)=>{
    const leftX=52,rightX=plan.width-52;
    if(i%2){drawFeastHeart(ctx,leftX,y,19,palette[1]);drawFeastSparkle(ctx,rightX,y,11,palette[0]);}
    else {drawFeastSparkle(ctx,leftX,y,11,palette[0]);drawFeastHeart(ctx,rightX,y,19,palette[1]);}
    if(i<3){drawFeastRosette(ctx,leftX,y+67,7,palette[0]);drawFeastRosette(ctx,rightX,y+67,7,palette[0]);}
  });
  drawFeastHeart(ctx,892,152,42,palette[1]);
  drawFeastSparkle(ctx,970,141,24,palette[0]);
  drawFeastSparkle(ctx,925,209,14,"#ffe68f");
  if(spec.key==="cute")drawFeastKoala(ctx,1073,169);
  else {drawFeastRosette(ctx,1073,162,33,palette[0]);drawFeastSparkle(ctx,1073,162,17,"#fff9db");}
  ctx.restore();
}

function drawFeastFaustinaBorder(ctx, width, height, spec = getFeastFaustinaTemplateSpec()) {
  ctx.save();
  fillPhotoboothRoundedRect(ctx, 20, 20, width - 40, height - 40, 34, spec.borderFill || "rgba(255, 250, 238, 0.2)", spec.outerStroke || "#c8a43c", 4);
  fillPhotoboothRoundedRect(ctx, 42, 42, width - 84, height - 84, 28, "rgba(255,255,255,0)", spec.innerStroke || "rgba(17, 17, 17, 0.68)", 2);
  if (spec.premiumGlow) {
    ctx.shadowColor = "rgba(212,175,55,0.22)";
    ctx.shadowBlur = 24;
    fillPhotoboothRoundedRect(ctx, 62, 62, width - 124, height - 124, 24, "rgba(255,255,255,0)", "rgba(212,175,55,0.34)", 2);
  }
  ctx.restore();
}

function drawFeastFaustinaTitle(ctx, plan, spec = getFeastFaustinaTemplateSpec()) {
  if (plan.orientation === "portrait") {
    const header = ctx.createLinearGradient(0,0,plan.width,0), stops=spec.headerStops;
    header.addColorStop(0,stops[0]);header.addColorStop(.5,stops[1]);header.addColorStop(1,stops[2]);
    fillPhotoboothRoundedRect(ctx,58,54,plan.width-116,230,30,header,spec.outerStroke,4);
    fillPhotoboothRoundedRect(ctx,93,69,382,34,17,spec.chipFill||"#d4af37");
    ctx.fillStyle=spec.chipText||"#20131d";ctx.font="800 16px Georgia";ctx.textAlign="center";
    ctx.fillText("GRADE 8 – ST. FAUSTINA KOWALSKA",284,92,360);
    ctx.save();ctx.textAlign="left";ctx.shadowColor="rgba(31,9,30,.8)";ctx.shadowBlur=6;ctx.shadowOffsetY=3;
    ctx.strokeStyle="rgba(92,30,58,.6)";ctx.lineWidth=2;
    const lettering=ctx.createLinearGradient(0,118,0,230);
    lettering.addColorStop(0,"#fffef4");lettering.addColorStop(.7,"#fff8e1");lettering.addColorStop(1,"#ffe6a3");
    ctx.fillStyle=lettering;ctx.font="italic 900 60px Georgia";
    ctx.strokeText("Happy Feast Day,",90,172,671);ctx.fillText("Happy Feast Day,",90,172,671);
    ctx.font="italic 900 69px Georgia";
    ctx.strokeText("St. Faustina!",90,234,671);ctx.fillText("St. Faustina!",90,234,671);
    ctx.restore();
    ctx.fillStyle=spec.footerAccent||"#f7d86d";ctx.font="700 17px Georgia";ctx.textAlign="left";
    ctx.fillText("SEPTEMBER 28, 2026  •  MERCY & JOY",93,265,673);
    return;
  }
  const header = ctx.createLinearGradient(0,0,plan.width,0),stops=spec.headerStops;
  header.addColorStop(0,stops[0]);header.addColorStop(.5,stops[1]);header.addColorStop(1,stops[2]);
  fillPhotoboothRoundedRect(ctx,58,54,plan.width-116,204,30,header,spec.outerStroke,4);
  ctx.save();ctx.strokeStyle="rgba(255,229,169,.65)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(106,111);ctx.lineTo(833,111);ctx.stroke();ctx.restore();
  fillPhotoboothRoundedRect(ctx,104,69,394,34,17,spec.chipFill||"#d4af37");
  ctx.textAlign="center";ctx.fillStyle=spec.chipText||"#20131d";ctx.font="800 16px Georgia";
  ctx.fillText("GRADE 8 – ST. FAUSTINA KOWALSKA",301,92,376);
  ctx.textAlign="left";ctx.save();ctx.shadowColor="rgba(31,9,30,.8)";ctx.shadowBlur=6;ctx.shadowOffsetY=3;
  ctx.strokeStyle="rgba(92,30,58,.6)";ctx.lineWidth=2;
  const lettering=ctx.createLinearGradient(0,118,0,233);
  lettering.addColorStop(0,"#fffef4");lettering.addColorStop(.7,"#fff8e1");lettering.addColorStop(1,"#ffe6a3");
  ctx.fillStyle=lettering;ctx.font="italic 900 72px Georgia";
  ctx.strokeText("Happy Feast Day,",105,170,795);
  ctx.fillText("Happy Feast Day,",105,170,795);
  ctx.font="italic 900 67px Georgia";
  ctx.strokeText("St. Faustina!",105,229,800);
  ctx.fillText("St. Faustina!",105,229,800);
  ctx.restore();
  ctx.fillStyle=spec.footerAccent||"#f7d86d";ctx.font="700 17px Georgia";
  ctx.fillText("SEPTEMBER 28, 2026  •  A CELEBRATION OF MERCY & JOY",108,250,815);
}

async function drawFeastFaustinaSaintPanel(ctx, plan) {
  const {x,y,w,h}=plan.saintBox;
  ctx.save();ctx.shadowColor="rgba(22,12,25,.7)";ctx.shadowBlur=19;
  fillPhotoboothRoundedRect(ctx,x,y,w,h,22,"#fff4d6","#f8d67e",5);ctx.restore();
  const image=await getEmbeddedFeastPortrait()
    || await loadPhotoboothThemeAsset("assets/photobooth/feastday/st-faustina-feast.webp")
    || await loadPhotoboothThemeAsset("st-faustina-portrait.png");
  if(image){ctx.save();photoboothRoundedRect(ctx,x+8,y+8,w-16,h-16,15);ctx.clip();
    drawPhotoboothCover(ctx,image,x+8,y+8,w-16,h-16);ctx.restore();}
  fillPhotoboothRoundedRect(ctx,x+w-171,y+h-41,157,30,11,"rgba(31,20,40,.88)","#f6d586",1.5);
  ctx.fillStyle="#fff6dd";ctx.textAlign="center";ctx.font="800 16px Georgia";
  ctx.fillText("ST. FAUSTINA",x+w-92,y+h-20,140);
}

function drawFeastFaustinaSticker(ctx, x, y, textTop, textBottom, spec = getFeastFaustinaTemplateSpec()) {
  fillPhotoboothRoundedRect(ctx, x, y, 216, 84, 22, spec.stickerOuter || "#fff8df", spec.innerStroke || "#111111", 2.2);
  fillPhotoboothRoundedRect(ctx, x + 9, y + 9, 198, 66, 18, spec.stickerInner || "#111111", spec.outerStroke || "#d4af37", 2);
  ctx.fillStyle = spec.stickerText || "#fff8df";
  ctx.textAlign = "center";
  ctx.font = "800 15px Arial";
  ctx.fillText(textTop, x + 108, y + 34);
  ctx.font = "900 18px Georgia";
  ctx.fillStyle = spec.stickerAccent || "#f3d169";
  ctx.fillText(textBottom, x + 108, y + 58);
}

function drawFeastFaustinaCelebrationLine(ctx, plan, spec) {
  if (plan.orientation === "portrait") {
    const x=plan.width/2,y=1417;
    fillPhotoboothRoundedRect(ctx,x-238,y-13,476,35,16,"#fff7dc",spec.outerStroke,2);
    ctx.fillStyle=spec.celebrationText;ctx.textAlign="center";ctx.font="900 19px Georgia";
    ctx.fillText("LOVE  •  MERCY  •  JOY",x,y+12,445);
    drawFeastHeart(ctx,267,y+4,29,spec.banderitasPalette[1]);
    drawFeastSparkle(ctx,220,y+4,17,spec.banderitasPalette[0]);
    drawFeastHeart(ctx,828,y+4,29,spec.banderitasPalette[1]);
    return;
  }
  const x=plan.width/2,y=947;
  fillPhotoboothRoundedRect(ctx,x-280,y-11,560,33,16,"#fff7dc",spec.outerStroke,2);
  ctx.fillStyle=spec.celebrationText;ctx.textAlign="center";ctx.font="900 19px Georgia";
  ctx.fillText("LOVE  •  MERCY  •  JOY",x,y+12,505);
  drawFeastHeart(ctx,379,y+5,37,spec.banderitasPalette[1]);
  drawFeastHeart(ctx,plan.width-379,y+5,37,spec.banderitasPalette[1]);
  drawFeastSparkle(ctx,314,y+5,21,spec.banderitasPalette[0]);
  drawFeastSparkle(ctx,plan.width-314,y+5,21,spec.banderitasPalette[0]);
}

function drawFeastFaustinaFooter(ctx, plan, spec = getFeastFaustinaTemplateSpec()) {
  if (plan.orientation === "portrait") {
    const y=plan.height-145;
    const bg=ctx.createLinearGradient(0,y,plan.width,y),stops=spec.footerStops;
    bg.addColorStop(0,stops[0]);bg.addColorStop(.5,stops[1]);bg.addColorStop(1,stops[2]);
    fillPhotoboothRoundedRect(ctx,58,y,plan.width-116,98,24,bg,spec.outerStroke,3);
    ctx.textAlign="center";ctx.fillStyle=spec.footerText||"#fff8df";
    ctx.font="italic 900 26px Georgia";ctx.fillText("A celebration of faith & friendship",plan.width/2,y+34,930);
    ctx.font="700 17px Georgia";ctx.fillText("Grade 8 – St. Faustina Kowalska  •  Feast Day 2026",plan.width/2,y+61,930);
    ctx.fillStyle=spec.footerAccent||"#f7d86d";ctx.font="italic 700 17px Georgia";
    ctx.fillText("Jesus, I Trust in You",plan.width/2,y+85,930);
    return;
  }
  const y = plan.height - plan.footer - 6;
  const bg = ctx.createLinearGradient(0, y, plan.width, y);
  const stops = spec.footerStops;
  bg.addColorStop(0, stops[0]); bg.addColorStop(.5, stops[1]); bg.addColorStop(1, stops[2]);
  fillPhotoboothRoundedRect(ctx, 58, y, plan.width - 116, 80, 24, bg, spec.outerStroke, 3);
  ctx.fillStyle = spec.footerText || "#fff8df"; ctx.textAlign = "left";
  ctx.font = "italic 900 29px Georgia";
  ctx.fillText("A celebration of faith & friendship", 88, y + 35, 880);
  ctx.font = "700 17px Georgia";
  ctx.fillText("Grade 8 – St. Faustina Kowalska  •  Feast Day 2026", 88, y + 61, 900);
  ctx.textAlign = "right"; ctx.font = "italic 900 26px Georgia";
  ctx.fillStyle = spec.footerAccent || "#f7d86d";
  ctx.fillText("Jesus, I Trust in You", plan.width - 88, y + 48, 460);
}

function drawFeastFaustinaLayoutBadges(ctx, plan, layout, spec = getFeastFaustinaTemplateSpec()) {
  const area = plan.badgeArea;
  if (!area) return;
  const label = (PHOTOBOOTH_LAYOUTS[layout] || PHOTOBOOTH_LAYOUTS.single).label.toUpperCase();
  fillPhotoboothRoundedRect(ctx, area.x, area.y, area.w, area.h, 14, "#fffaf0", spec.outerStroke || "#d4af37", 1.5);
  ctx.fillStyle = "#3b2b11"; ctx.textAlign = "left"; ctx.font = "800 16px Arial";
  ctx.fillText(`${label}  •  ${String(spec.badgeStamp || "PREMIUM").toUpperCase()} EDITION`, area.x + 15, area.y + 20, area.w - 30);
}

function drawFeastFaustinaFrame(ctx, slot, source, accentIndex = 0, spec = getFeastFaustinaTemplateSpec()) {
  const palette = spec.accentPalette;
  const radius = spec.key === "cute" ? 27 : 23;
  ctx.save(); ctx.shadowColor = "rgba(42,22,33,.28)"; ctx.shadowBlur = 14;
  fillPhotoboothRoundedRect(ctx, slot.x - 11, slot.y - 11, slot.w + 22, slot.h + 22, radius + 5,
    spec.frameInner || "#fffaf0", palette[accentIndex % palette.length], 4);
  ctx.restore();
  fillPhotoboothRoundedRect(ctx, slot.x - 5, slot.y - 5, slot.w + 10, slot.h + 10, radius,
    "#fffaf0", spec.outerStroke, 2);
  ctx.save(); photoboothRoundedRect(ctx, slot.x, slot.y, slot.w, slot.h, radius - 6);
  ctx.clip(); drawPhotoboothCover(ctx, source, slot.x, slot.y, slot.w, slot.h); ctx.restore();
}

function drawFeastFaustinaCornerRibbon(ctx, x, y, label, spec = getFeastFaustinaTemplateSpec()) {
  const width = 170;
  const height = 42;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width - 26, height / 2);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.lineTo(18, height / 2);
  ctx.closePath();
  ctx.fillStyle = spec.ribbonFill || "#111111";
  ctx.fill();
  ctx.strokeStyle = spec.ribbonAccent || spec.outerStroke || "#d4af37";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = spec.ribbonAccent || "#d4af37";
  ctx.textAlign = "center";
  ctx.font = "800 16px Arial";
  ctx.fillText(label || spec.ribbonLabel || "SFK", width / 2, 27);
  ctx.restore();
}

function drawFeastFaustinaSeal(ctx, cx, cy, spec = getFeastFaustinaTemplateSpec()) {
  ctx.save();
  for (let i = 0; i < 20; i += 1) {
    const angle = (Math.PI * 2 * i) / 20;
    const inner = 38;
    const outer = 54;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    const nextAngle = angle + Math.PI / 20;
    ctx.lineTo(cx + Math.cos(nextAngle) * outer, cy + Math.sin(nextAngle) * outer);
    ctx.lineTo(cx + Math.cos(angle + Math.PI / 10) * inner, cy + Math.sin(angle + Math.PI / 10) * inner);
    ctx.closePath();
    ctx.fillStyle = spec.outerStroke || "#d4af37";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fillStyle = spec.chipFill || "#d4af37";
  ctx.fill();
  ctx.strokeStyle = spec.innerStroke || "#111111";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = spec.chipText || "#111111";
  ctx.textAlign = "center";
  ctx.font = "900 14px Arial";
  ctx.fillText(String(spec.badgeStamp || "PREMIUM").toUpperCase(), cx, cy + 4);
  ctx.restore();
}

function drawFeastFaustinaCuteShapes(ctx, plan, spec = getFeastFaustinaTemplateSpec()) {
  if (!spec.cuteShapes) return;
  const shapes = [
    { x: 86, y: plan.height - plan.footer - 86, text: "♥", size: 26 },
    { x: plan.width - 120, y: 214, text: "★", size: 28 },
    { x: plan.width - 192, y: plan.height - plan.footer - 74, text: "✿", size: 24 },
    { x: 138, y: 196, text: "★", size: 22 }
  ];
  shapes.forEach((item, index) => {
    fillPhotoboothRoundedRect(ctx, item.x - 24, item.y - 26, 48, 48, 16, index % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,248,223,0.9)", spec.outerStroke || "#d4af37", 1.5);
    ctx.fillStyle = spec.accentPalette[index % spec.accentPalette.length] || "#d4af37";
    ctx.font = `900 ${item.size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(item.text, item.x, item.y + 8);
  });
}

async function canvasToJpegBlob(canvas, quality = 0.93) {
  return await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const payload = dataUrl.split(",")[1] || "";
          const binary = atob(payload);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
          resolve(new Blob([bytes], { type:"image/jpeg" }));
        } catch (fallbackError) {
          reject(new Error("Photobooth export was blocked by one of the booth graphics. The booth asset must stay local/same-origin before the canvas can be saved."));
        }
      }, "image/jpeg", quality);
    } catch (error) {
      reject(new Error("Photobooth export was blocked by one of the booth graphics. The booth asset must stay local/same-origin before the canvas can be saved."));
    }
  });
}

async function renderPhotoboothCollage() {
  const canvas = document.getElementById("photoboothResultCanvas");
  const stage = document.getElementById("photoboothStage");
  if (!canvas || !stage || !photoBoothState.shots.length) return;
  const renderStartedAt = performance.now();
  const feast = photoBoothState.theme === "feast-faustina";
  const feastSpec = getFeastFaustinaTemplateSpec(photoBoothState.themeVariant);
  const plan = getPhotoboothCanvasPlan(photoBoothState.layout, photoBoothState.theme);
  const exportScale = feast ? 2 : 1;
  canvas.width = plan.width * exportScale; canvas.height = plan.height * exportScale;
  const ctx = canvas.getContext("2d");
  ctx.scale(exportScale, exportScale);
  if (feast) {
    const backgroundGradient = ctx.createLinearGradient(0, 0, plan.width, plan.height);
    const stops = feastSpec.bgStops || ["#fffdfa", "#fff4cf", "#fff9ea", "#f5e3a9"];
    backgroundGradient.addColorStop(0, stops[0]);
    backgroundGradient.addColorStop(0.35, stops[1]);
    backgroundGradient.addColorStop(0.7, stops[2]);
    backgroundGradient.addColorStop(1, stops[3]);
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, plan.width, plan.height);
    for (let i = 0; i < 160; i += 1) {
      const x = (i * 97) % plan.width;
      const y = (i * 211) % plan.height;
      const r = 1.1 + (i % 4) * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? "rgba(212,175,55,0.22)" : i % 3 === 1 ? "rgba(17,17,17,0.05)" : "rgba(255,255,255,0.24)";
      ctx.fill();
    }
    drawFeastFaustinaBorder(ctx, plan.width, plan.height, feastSpec);
    drawFeastFaustinaBackdrop(ctx, plan, feastSpec);
    drawFeastFaustinaTitle(ctx, plan, feastSpec);
    drawFeastFaustinaBanderitas(ctx, plan.width, plan.orientation === "portrait" ? 306 : 263, feastSpec);
    drawFeastFaustinaOrnaments(ctx, plan, feastSpec);
    drawFeastMicroSparkles(ctx, plan, feastSpec);
    for (let index = 0; index < plan.slots.length; index += 1) {
      const slot = plan.slots[index];
      drawFeastFaustinaFrame(ctx, slot, photoBoothState.shots[index] || photoBoothState.shots[photoBoothState.shots.length - 1], index, feastSpec);
    }
    await drawFeastFaustinaSaintPanel(ctx, plan);
    drawFeastFaustinaCelebrationLine(ctx, plan, feastSpec);
    drawFeastFaustinaFooter(ctx, plan, feastSpec);
  } else {
    ctx.fillStyle = "#fffdf5"; ctx.fillRect(0,0,plan.width,plan.height);
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,plan.width,18);
    ctx.fillStyle = "#f7c600"; ctx.fillRect(0,18,plan.width,12);
    plan.slots.forEach((slot,index)=>{
      ctx.save();
      ctx.fillStyle="#111"; ctx.fillRect(slot.x-5,slot.y-5,slot.w+10,slot.h+10);
      drawPhotoboothCover(ctx, photoBoothState.shots[index] || photoBoothState.shots[photoBoothState.shots.length-1], slot.x,slot.y,slot.w,slot.h);
      ctx.restore();
    });
    const footerY=plan.height-plan.footer+22;
    ctx.fillStyle="#111"; ctx.font="900 34px Arial"; ctx.textAlign="left"; ctx.fillText("SFK MEMORIES",38,footerY);
    ctx.fillStyle="#7a6500"; ctx.font="800 22px Arial"; ctx.fillText("LIVE PHOTOBOOTH  •  #BeKind",38,footerY+36);
    ctx.textAlign="right"; ctx.fillStyle="#555148"; ctx.font="700 20px Arial";
    ctx.fillText(new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),plan.width-38,footerY+20);
  }
  photoBoothState.resultBlob = await canvasToJpegBlob(canvas, 0.96);
  if (!photoBoothState.resultBlob) throw new Error("Unable to prepare the final photobooth image.");
  console.info("Photobooth final render", { width:canvas.width, height:canvas.height, ms:Math.round(performance.now()-renderStartedAt) });
  // The finished photocard canvas owns the result; free large per-shot canvases.
  photoBoothState.shots = [];
  if (photoBoothState.resultUrl) URL.revokeObjectURL(photoBoothState.resultUrl);
  photoBoothState.resultUrl = URL.createObjectURL(photoBoothState.resultBlob);
  stage.classList.remove("is-live"); stage.classList.add("is-result");
  closePhotoboothMobileTray();
  document.querySelector(".photoboothModal")?.classList.add("is-result-mode");
  canvas.hidden=false;
  document.getElementById("photoboothCaptureButton").hidden=true;
  document.getElementById("photoboothSwitchCamera").hidden=true;
  document.getElementById("photoboothRetakeButton").hidden=false;
  document.getElementById("photoboothDownloadButton").hidden=false;
  document.getElementById("photoboothPostButton").hidden=false;
  const liveLabel=document.getElementById("photoboothLiveLabel"); if(liveLabel) liveLabel.textContent="Preview ready";
  setPhotoboothStatus("Looks good? Download it, post it to Memories, or retake the session.");
}

function resetPhotoboothResult({ keepCamera=true, quiet=false } = {}) {
  photoBoothState.shots=[];
  photoBoothState.resultBlob=null;
  if (photoBoothState.resultUrl) { URL.revokeObjectURL(photoBoothState.resultUrl); photoBoothState.resultUrl=""; }
  const stage=document.getElementById("photoboothStage");
  stage?.classList.add("is-live"); stage?.classList.remove("is-result");
  document.querySelector(".photoboothModal")?.classList.remove("is-result-mode");
  const canvas=document.getElementById("photoboothResultCanvas"); if(canvas) canvas.hidden=true;
  const capture=document.getElementById("photoboothCaptureButton"); if(capture) capture.hidden=false;
  const switcher=document.getElementById("photoboothSwitchCamera"); if(switcher) switcher.hidden=false;
  if (switcher && photoBoothState.source === "phone") switcher.hidden=true;
  const retake=document.getElementById("photoboothRetakeButton"); if(retake) retake.hidden=true;
  const download=document.getElementById("photoboothDownloadButton"); if(download) download.hidden=true;
  const post=document.getElementById("photoboothPostButton"); if(post) post.hidden=true;
  const liveLabel=document.getElementById("photoboothLiveLabel"); if(liveLabel) liveLabel.textContent=photoBoothState.stream?"Live camera":"Camera ready";
  if (!quiet) setPhotoboothStatus(photoBoothState.stream ? "Camera ready for another session." : "Starting camera...");
  if (!keepCamera && photoBoothState.stream) stopPhotoboothCamera();
  syncPhotoboothCaptureButton();
  syncPhotoboothMobileUi();
}

function makePhotoboothFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
  return `SFK-Photobooth-${stamp}.jpg`;
}

function downloadPhotoboothResult() {
  if (!photoBoothState.resultBlob) return;
  const url = photoBoothState.resultUrl || URL.createObjectURL(photoBoothState.resultBlob);
  const link=document.createElement("a"); link.href=url; link.download=makePhotoboothFilename(); document.body.appendChild(link); link.click(); link.remove();
  showMemoryToast("Photobooth photo downloaded.");
}

function photoboothBlobToFile(blob) {
  return new File([blob], makePhotoboothFilename(), { type:"image/jpeg", lastModified:Date.now() });
}

function sendPhotoboothToMemories() {
  if (!photoBoothState.resultBlob) return;
  const file=photoboothBlobToFile(photoBoothState.resultBlob);
  const existing=memoryState.selectedFiles.filter((item)=>item instanceof File);
  memoryState.selectedFiles=[file,...existing].slice(0,MAX_MEDIA_FILES);
  memoryState.coverIndex=0;
  memoryState.previewObjectUrls.forEach((url)=>URL.revokeObjectURL(url));
  memoryState.previewObjectUrls=[];
  syncMemoryFileInput();
  renderSelectedMediaPreview();
  const title=document.getElementById("memoryTitle");
  if (title && !title.value.trim()) title.value="Photobooth Memory";
  renderComposePreview();
  closePhotobooth();
  openComposeModal();
  showMemoryToast(memoryState.auth ? "Photobooth photo added to your Memory post." : "Photobooth photo is ready. Unlock posting to share it.");
}

window.addEventListener("pagehide", stopPhotoboothCamera);

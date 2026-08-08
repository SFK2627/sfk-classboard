/* =========================================================
   SFK MEMORY ARCHIVE — v336
   Reuses published photo data from the existing Memories / IG-style page.
========================================================= */
(function initSfkMemoryArchive() {
  const API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";
  const CACHE_KEY = "sfkMemoriesCacheV4";
  const PHONE_QUERY = "(max-width: 700px)";

  const state = {
    photos: [],
    loaded: false,
    loading: false,
    viewerIndex: -1,
    lastTrigger: null,
    observer: null,
    swipeStartX: null,
    swipeStartY: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    baseWidth: 0,
    baseHeight: 0,
    pointers: new Map(),
    dragPointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragStartPanX: 0,
    dragStartPanY: 0,
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    pinchStartMidX: 0,
    pinchStartMidY: 0,
    pinchStartPanX: 0,
    pinchStartPanY: 0,
    gesturePinched: false
  };

  function els() {
    return {
      modal: document.getElementById("sfkMemoryArchiveModal"),
      shell: document.querySelector("#sfkMemoryArchiveModal .sfkMemoryArchiveShell"),
      scroll: document.getElementById("sfkMemoryArchiveScroll"),
      grid: document.getElementById("sfkMemoryArchiveGrid"),
      status: document.getElementById("sfkMemoryArchiveStatus"),
      count: document.getElementById("sfkMemoryArchiveCount"),
      close: document.getElementById("sfkMemoryArchiveClose"),
      viewer: document.getElementById("sfkMemoryViewer"),
      viewerImage: document.getElementById("sfkMemoryViewerImage"),
      viewerBackdrop: document.getElementById("sfkMemoryViewerBackdrop"),
      viewerStage: document.querySelector("#sfkMemoryViewer .sfkMemoryViewerStage"),
      zoomViewport: document.getElementById("sfkMemoryViewerZoomViewport"),
      panLayer: document.getElementById("sfkMemoryViewerPanLayer"),
      zoomOut: document.getElementById("sfkMemoryViewerZoomOut"),
      zoomIn: document.getElementById("sfkMemoryViewerZoomIn"),
      zoomValue: document.getElementById("sfkMemoryViewerZoomValue"),
      viewerLoading: document.getElementById("sfkMemoryViewerLoading"),
      viewerIndex: document.getElementById("sfkMemoryViewerIndex"),
      viewerTitle: document.getElementById("sfkMemoryViewerTitle"),
      viewerCaption: document.getElementById("sfkMemoryViewerCaptionText"),
      viewerDate: document.getElementById("sfkMemoryViewerDate"),
      prev: document.getElementById("sfkMemoryViewerPrev"),
      next: document.getElementById("sfkMemoryViewerNext"),
      viewerClose: document.getElementById("sfkMemoryViewerClose")
    };
  }

  function isPhone() {
    return window.matchMedia ? window.matchMedia(PHONE_QUERY).matches : window.innerWidth <= 700;
  }

  function safeText(value, fallback = "") {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    return text || fallback;
  }

  function safeHttpUrl(value) {
    const raw = String(value || "").trim();
    if (/^data:image\//i.test(raw) || /^blob:/i.test(raw)) return raw;
    try {
      const url = new URL(raw, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function driveFileId(value) {
    const raw = String(value || "");
    const path = raw.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
    if (path) return path[1];
    const query = raw.match(/[?&]id=([^&#]+)/i);
    return query ? decodeURIComponent(query[1]) : "";
  }

  function toDisplayUrl(value) {
    const raw = safeHttpUrl(value);
    if (!raw) return "";
    const id = driveFileId(raw);
    if (id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w4000`;
    return raw;
  }

  function mediaRefFrom(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (typeof window.parseClassBoardMediaRef === "function") {
      const parsed = window.parseClassBoardMediaRef(raw);
      return parsed?.kind === "memory" ? parsed.raw : "";
    }
    const match = raw.match(/^sfk-media:\/(?:memory|memories|memoryMedia)\/([A-Za-z0-9_-]{1,240})$/i);
    return match ? `sfk-media://memory/${match[1]}` : "";
  }

  function parseMaybeMediaArray(row) {
    if (Array.isArray(row?.media)) return row.media;
    const fields = [
      row?.MediaJSON, row?.mediaJSON,
      row?.MediaItems, row?.mediaItems,
      row?.UploadedMedia, row?.uploadedMedia,
      row?.UploadedMediaJSON, row?.uploadedMediaJSON,
      row?.Media
    ];
    for (const value of fields) {
      if (Array.isArray(value)) return value;
      if (!value) continue;
      try {
        const parsed = JSON.parse(String(value));
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];
      } catch (error) {}
    }
    return [];
  }

  function looksLikeVideo(item, source) {
    const kind = safeText(item?.kind || item?.Kind).toLowerCase();
    const mime = safeText(item?.mimeType || item?.MimeType || item?.Type).toLowerCase();
    const url = String(source || "").toLowerCase();
    return kind.includes("video") || mime.startsWith("video/") ||
      /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url) ||
      /\.(?:mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url);
  }

  function normalizeImageMedia(item) {
    if (!item) return null;

    if (typeof item === "string") {
      const ref = mediaRefFrom(item);
      if (ref) return { src: "", fullSrc: "", ref, name: "SFK memory", ratio: 0 };
      if (looksLikeVideo(null, item)) return null;
      const src = toDisplayUrl(item);
      return src ? { src, fullSrc: src, ref: "", name: "SFK memory", ratio: 0 } : null;
    }

    if (typeof item !== "object") return null;

    const refCandidates = [
      item.firestoreRef, item.mediaRef, item.MediaRef, item.Ref, item.ref,
      item.url, item.viewerUrl, item.fullUrl, item.downloadUrl
    ];
    const ref = refCandidates.map(mediaRefFrom).find(Boolean) || "";

    /*
      Keep TWO sources:
      - src: fast gallery/preview image
      - fullSrc: best available original/full viewer image
      This prevents a cropped thumbnail/preview from being reused in fullscreen.
    */
    const previewCandidates = [
      item.previewUrl, item.PreviewURL,
      item.inlinePreviewUrl, item.InlinePreviewURL,
      item.thumbnailUrl, item.ThumbnailURL,
      item.thumbUrl, item.ThumbURL,
      item.viewerUrl, item.ViewerURL,
      item.url, item.Url,
      item.fullUrl, item.FullURL,
      item.downloadUrl, item.DownloadURL,
      item.dataUrl, item.DataURL
    ];

    const fullCandidates = [
      item.viewerUrl, item.ViewerURL,
      item.fullUrl, item.FullURL,
      item.url, item.Url,
      item.downloadUrl, item.DownloadURL,
      item.dataUrl, item.DataURL,
      item.previewUrl, item.PreviewURL,
      item.inlinePreviewUrl, item.InlinePreviewURL,
      item.thumbnailUrl, item.ThumbnailURL,
      item.thumbUrl, item.ThumbURL
    ];

    const rawPreview = previewCandidates.map(value => String(value || "").trim()).find(value => value && !mediaRefFrom(value)) || "";
    const rawFull = fullCandidates.map(value => String(value || "").trim()).find(value => value && !mediaRefFrom(value)) || rawPreview;
    if (looksLikeVideo(item, rawFull || rawPreview)) return null;

    const kind = safeText(item.kind || item.Kind).toLowerCase();
    const mime = safeText(item.mimeType || item.MimeType || item.Type).toLowerCase();
    if (kind && kind !== "image" && !ref && !mime.startsWith("image/")) return null;

    const src = toDisplayUrl(rawPreview || rawFull);
    const fullSrc = toDisplayUrl(rawFull || rawPreview);
    if (!src && !fullSrc && !ref) return null;

    return {
      src: src || fullSrc,
      fullSrc: fullSrc || src,
      ref,
      name: safeText(item.name || item.Name, "SFK memory"),
      ratio: Number(item.ratio || item.Ratio || 0) || 0
    };
  }

  function rowTimeValue(row) {
    const values = [row?.Date, row?.date, row?.CreatedAt, row?.createdAt, row?.Timestamp, row?.timestamp];
    for (const value of values) {
      if (!value) continue;
      if (typeof value?.toDate === "function") {
        const ms = value.toDate().getTime();
        if (Number.isFinite(ms)) return ms;
      }
      const parsed = Date.parse(String(value));
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }

  function normalizeRowsToPhotos(rows) {
    const sorted = (Array.isArray(rows) ? rows.slice() : [])
      .filter(row => safeText(row?.Publish || row?.publish || "YES").toUpperCase() === "YES")
      .sort((a, b) => rowTimeValue(b) - rowTimeValue(a));

    const photos = [];
    const seen = new Set();

    sorted.forEach((row, rowIndex) => {
      const title = safeText(row?.Title || row?.title, "SFK Memory");
      const caption = safeText(row?.Caption || row?.caption);
      const date = safeText(row?.Date || row?.date || row?.CreatedAt || row?.createdAt, "SFK 2026–2027");
      const postedBy = safeText(row?.PostedBy || row?.postedBy, "SFK");
      const postId = safeText(row?.docId || row?.id || row?.ID || row?.MemoryID || row?.memoryId, `memory-${rowIndex + 1}`);

      parseMaybeMediaArray(row).forEach((rawMedia, mediaIndex) => {
        const media = normalizeImageMedia(rawMedia);
        if (!media) return;
        const key = media.ref || media.src || `${postId}:${mediaIndex}`;
        if (seen.has(key)) return;
        seen.add(key);
        photos.push({
          ...media,
          key,
          postId,
          mediaIndex,
          title,
          caption,
          date,
          postedBy
        });
      });
    });

    return photos;
  }

  function cachedRows() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  async function firestoreRows() {
    const getDb = typeof window.waitForClassBoardFirestore === "function"
      ? window.waitForClassBoardFirestore
      : null;
    if (!getDb) return [];

    const db = await getDb(8500);
    if (!db) return [];

    const snap = await db.collection("memories").get();
    const rows = [];
    snap.forEach(doc => rows.push({ ...(doc.data() || {}), docId: doc.id, id: doc.id }));
    return rows;
  }

  async function apiRows() {
    const response = await fetch(`${API_URL}?type=memories`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!Array.isArray(result?.memories)) throw new Error("Invalid memories response");
    return result.memories;
  }

  function layoutClass(index) {
    if (index % 11 === 0) return "is-featured";
    if (index % 11 === 4 || index % 11 === 8) return "is-wide";
    if (index % 11 === 2 || index % 11 === 7) return "is-tall";
    return "";
  }

  function setStatus(text, show = true) {
    const { status } = els();
    if (!status) return;
    status.textContent = text;
    status.hidden = !show;
  }

  function renderPhotos(photos) {
    const { grid, count } = els();
    if (!grid) return;

    state.photos = photos;
    if (count) count.textContent = String(photos.length).padStart(2, "0");
    grid.replaceChildren();

    if (!photos.length) {
      setStatus("No published memory photos yet.", true);
      return;
    }

    setStatus("", false);

    photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `sfkMemoryTile ${layoutClass(index)}`.trim();
      button.dataset.archiveIndex = String(index);
      button.setAttribute("aria-label", `Open memory photo ${index + 1}: ${photo.title}`);

      const placeholder = document.createElement("span");
      placeholder.className = "sfkMemoryTilePlaceholder";
      placeholder.setAttribute("aria-hidden", "true");
      button.appendChild(placeholder);

      const img = document.createElement("img");
      img.className = "sfkMemoryTileImage";
      img.alt = photo.title;
      img.loading = "lazy";
      img.decoding = "async";
      if (photo.src) {
        img.src = photo.src;
      } else if (photo.ref) {
        img.dataset.archiveMediaRef = photo.ref;
      }
      img.addEventListener("load", () => {
        placeholder.remove();
        const ratio = img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0;
        if (ratio > 1.6 && !button.classList.contains("is-featured")) button.classList.add("is-wide");
        if (ratio && ratio < .74 && !button.classList.contains("is-featured")) button.classList.add("is-tall");
      }, { once: true });
      img.addEventListener("error", () => {
        placeholder.style.animation = "none";
      });
      button.appendChild(img);

      const no = document.createElement("span");
      no.className = "sfkMemoryTileNo";
      no.textContent = `#${String(index + 1).padStart(2, "0")}`;
      button.appendChild(no);

      const meta = document.createElement("span");
      meta.className = "sfkMemoryTileMeta";
      const title = document.createElement("span");
      title.className = "sfkMemoryTileTitle";
      title.textContent = photo.title;
      const date = document.createElement("span");
      date.className = "sfkMemoryTileDate";
      date.textContent = photo.date;
      meta.append(title, date);
      button.appendChild(meta);

      grid.appendChild(button);
    });

    setupLazyRefHydration();
  }

  async function resolvePhotoSource(photo, purpose = "tile") {
    if (!photo) return "";

    /*
      FULLSCREEN RULE:
      If this memory has an sfk-media reference, resolve that original stored
      image FIRST. A preview URL may already be cropped and cannot be repaired
      by CSS after the fact.
    */
    if (purpose === "viewer" && photo.ref) {
      try {
        if (typeof window.resolveClassBoardMediaDataUrlWithRetryV7 === "function") {
          const dataUrl = await window.resolveClassBoardMediaDataUrlWithRetryV7(photo.ref, 7);
          if (dataUrl) {
            const resolved = typeof window.classBoardMediaDisplayUrl === "function"
              ? window.classBoardMediaDisplayUrl(dataUrl, `archive-viewer:${photo.ref}`)
              : dataUrl;
            photo.viewerResolvedSrc = resolved;
            return resolved;
          }
        }
      } catch (error) {
        console.warn("Memory Archive original viewer photo could not be resolved; using URL fallback.", error);
      }
    }

    if (purpose === "viewer") {
      return photo.viewerResolvedSrc || photo.fullSrc || photo.src || "";
    }

    if (photo.src) return photo.src;
    if (photo.fullSrc) return photo.fullSrc;
    if (!photo.ref) return "";

    try {
      if (typeof window.resolveClassBoardMediaDataUrlWithRetryV7 === "function") {
        const dataUrl = await window.resolveClassBoardMediaDataUrlWithRetryV7(photo.ref, 5);
        if (dataUrl) {
          const resolved = typeof window.classBoardMediaDisplayUrl === "function"
            ? window.classBoardMediaDisplayUrl(dataUrl, `archive:${photo.ref}`)
            : dataUrl;
          photo.src = resolved;
          if (!photo.fullSrc) photo.fullSrc = resolved;
        }
      }
    } catch (error) {
      console.warn("Memory Archive photo could not be resolved:", error);
    }

    return photo.src || photo.fullSrc || "";
  }

  async function hydrateTileImage(img) {
    if (!img || img.dataset.archiveResolved === "true") return;
    img.dataset.archiveResolved = "true";
    const tile = img.closest("[data-archive-index]");
    const index = Number(tile?.dataset.archiveIndex);
    const photo = state.photos[index];
    const src = await resolvePhotoSource(photo);
    if (src && img.isConnected) img.src = src;
  }

  function setupLazyRefHydration() {
    state.observer?.disconnect();
    const { scroll, grid } = els();
    if (!grid) return;
    const images = Array.from(grid.querySelectorAll("img[data-archive-media-ref]"));
    if (!images.length) return;

    if (!("IntersectionObserver" in window)) {
      images.forEach(img => hydrateTileImage(img));
      return;
    }

    state.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        state.observer.unobserve(entry.target);
        hydrateTileImage(entry.target);
      });
    }, { root: scroll || null, rootMargin: "500px 0px", threshold: .01 });

    images.forEach(img => state.observer.observe(img));
  }

  async function refreshPhotos() {
    if (state.loading) return;
    state.loading = true;
    try {
      let rows = [];
      try {
        rows = await firestoreRows();
      } catch (error) {
        console.warn("Memory Archive Firebase load failed; using API fallback.", error);
      }
      if (!rows.length) rows = await apiRows();
      const photos = normalizeRowsToPhotos(rows);
      renderPhotos(photos);
      state.loaded = true;
    } catch (error) {
      console.error("Memory Archive load failed:", error);
      if (!state.photos.length) setStatus("Memories could not be loaded right now.", true);
    } finally {
      state.loading = false;
    }
  }

  function loadArchiveIfNeeded() {
    if (!state.loaded && !state.photos.length) {
      const cachePhotos = normalizeRowsToPhotos(cachedRows());
      if (cachePhotos.length) renderPhotos(cachePhotos);
      else setStatus("Loading the archive…", true);
    }
    refreshPhotos();
  }

  function updateMobileHeartAccessibility() {
    const topbar = document.querySelector(".topbar.mobile-header-rotator");
    const heart = topbar?.querySelector(".sfkMobileHeaderHeart");
    if (!heart) return;
    const active = isPhone() && topbar.classList.contains("mobile-show-quote");
    heart.tabIndex = active ? 0 : -1;
    heart.setAttribute("role", active ? "button" : "presentation");
    heart.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) {
      heart.setAttribute("aria-label", "Open SFK Memory Archive");
      heart.setAttribute("title", "Open SFK Memory Archive");
    } else {
      heart.removeAttribute("aria-label");
      heart.removeAttribute("title");
    }
  }

  function openArchive(trigger) {
    const { modal, close } = els();
    if (!modal) return;
    state.lastTrigger = trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("sfkMemoryArchiveOpen");
    requestAnimationFrame(() => close?.focus({ preventScroll: true }));
    loadArchiveIfNeeded();
  }

  function closeArchive() {
    const { modal } = els();
    if (!modal || modal.hidden) return;
    closeViewer(false);
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sfkMemoryArchiveOpen");
    const target = state.lastTrigger;
    state.lastTrigger = null;
    if (target && typeof target.focus === "function" && target.isConnected) {
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  }


  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const BUTTON_ZOOM_STEP = 0.35;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateZoomUi() {
    const { viewer, zoomOut, zoomIn, zoomValue, zoomViewport } = els();
    const zoomed = state.zoom > MIN_ZOOM + 0.001;
    viewer?.classList.toggle("is-zoomed", zoomed);
    if (zoomOut) zoomOut.disabled = state.zoom <= MIN_ZOOM + 0.001;
    if (zoomIn) zoomIn.disabled = state.zoom >= MAX_ZOOM - 0.001;
    if (zoomValue) zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    if (zoomViewport) zoomViewport.setAttribute("aria-label", zoomed ? "Zoomed photo. Drag to pan." : "Photo. Use wheel or plus button to zoom.");
  }

  function clampViewerPan() {
    const { zoomViewport } = els();
    if (!zoomViewport || state.zoom <= MIN_ZOOM + 0.001) {
      state.panX = 0;
      state.panY = 0;
      return;
    }

    const viewportWidth = zoomViewport.clientWidth || 0;
    const viewportHeight = zoomViewport.clientHeight || 0;
    const scaledWidth = state.baseWidth * state.zoom;
    const scaledHeight = state.baseHeight * state.zoom;
    const maxX = Math.max(0, (scaledWidth - viewportWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - viewportHeight) / 2);

    state.panX = clamp(state.panX, -maxX, maxX);
    state.panY = clamp(state.panY, -maxY, maxY);
  }

  function applyViewerTransform() {
    const { panLayer, viewerImage } = els();
    if (panLayer) {
      panLayer.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0)`;
    }
    if (viewerImage) {
      viewerImage.style.setProperty("transform", `scale(${state.zoom})`, "important");
    }
    updateZoomUi();
  }

  function fitViewerImage() {
    const { zoomViewport, panLayer, viewerImage } = els();
    if (!zoomViewport || !panLayer || !viewerImage) return;

    const naturalWidth = viewerImage.naturalWidth || Number(viewerImage.dataset.naturalWidth) || 0;
    const naturalHeight = viewerImage.naturalHeight || Number(viewerImage.dataset.naturalHeight) || 0;
    const viewportWidth = zoomViewport.clientWidth || 0;
    const viewportHeight = zoomViewport.clientHeight || 0;
    if (!naturalWidth || !naturalHeight || !viewportWidth || !viewportHeight) return;

    const fit = Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight);
    state.baseWidth = Math.max(1, naturalWidth * fit);
    state.baseHeight = Math.max(1, naturalHeight * fit);

    panLayer.style.width = `${state.baseWidth}px`;
    panLayer.style.height = `${state.baseHeight}px`;
    viewerImage.style.width = "100%";
    viewerImage.style.height = "100%";

    clampViewerPan();
    applyViewerTransform();
  }

  function resetViewerTransform(refit = true) {
    state.zoom = MIN_ZOOM;
    state.panX = 0;
    state.panY = 0;
    state.baseWidth = 0;
    state.baseHeight = 0;
    state.pointers.clear();
    state.dragPointerId = null;
    state.pinchStartDistance = 0;
    state.gesturePinched = false;
    const { viewer, panLayer, viewerImage } = els();
    viewer?.classList.remove("is-dragging", "is-zoomed");
    if (panLayer) panLayer.style.transform = "translate3d(0, 0, 0)";
    if (viewerImage) viewerImage.style.setProperty("transform", "scale(1)", "important");
    if (refit) fitViewerImage();
    else updateZoomUi();
  }

  function setViewerZoom(nextZoom, focusClientX = null, focusClientY = null) {
    const { zoomViewport } = els();
    if (!zoomViewport) return;

    const oldZoom = state.zoom;
    const newZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    if (Math.abs(newZoom - oldZoom) < 0.0001) return;

    if (Number.isFinite(focusClientX) && Number.isFinite(focusClientY) && oldZoom > 0) {
      const rect = zoomViewport.getBoundingClientRect();
      const fx = focusClientX - (rect.left + rect.width / 2);
      const fy = focusClientY - (rect.top + rect.height / 2);
      const ratio = newZoom / oldZoom;
      state.panX = fx - ratio * (fx - state.panX);
      state.panY = fy - ratio * (fy - state.panY);
    }

    state.zoom = newZoom;
    if (state.zoom <= MIN_ZOOM + 0.001) {
      state.zoom = MIN_ZOOM;
      state.panX = 0;
      state.panY = 0;
    }
    clampViewerPan();
    applyViewerTransform();
  }

  function viewerZoomBy(delta, focusClientX = null, focusClientY = null) {
    setViewerZoom(state.zoom + delta, focusClientX, focusClientY);
  }

  function pointDistance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function pointMidpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function beginPinchIfReady() {
    if (state.pointers.size < 2) return false;
    const points = Array.from(state.pointers.values()).slice(0, 2);
    const distance = pointDistance(points[0], points[1]);
    if (!distance) return false;
    const mid = pointMidpoint(points[0], points[1]);
    state.pinchStartDistance = distance;
    state.pinchStartZoom = state.zoom;
    state.pinchStartMidX = mid.x;
    state.pinchStartMidY = mid.y;
    state.pinchStartPanX = state.panX;
    state.pinchStartPanY = state.panY;
    state.gesturePinched = true;
    return true;
  }

  async function showViewerPhoto(index) {
    const {
      viewerImage, viewerBackdrop, viewerIndex, viewerTitle,
      viewerCaption, viewerDate, prev, next
    } = els();
    const photo = state.photos[index];
    if (!photo || !viewerImage) return;

    state.viewerIndex = index;
    resetViewerTransform(false);
    if (viewerIndex) viewerIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(state.photos.length).padStart(2, "0")}`;
    if (viewerTitle) viewerTitle.textContent = photo.title;
    if (viewerCaption) viewerCaption.textContent = photo.caption || `Posted by ${photo.postedBy}`;
    if (viewerDate) viewerDate.textContent = photo.date;
    if (prev) prev.disabled = state.photos.length < 2;
    if (next) next.disabled = state.photos.length < 2;

    viewerImage.removeAttribute("src");
    viewerImage.alt = photo.title;
    if (viewerBackdrop) {
      viewerBackdrop.removeAttribute("src");
      viewerBackdrop.alt = "";
    }

    /* Fullscreen MUST prefer the original/full media, never a cropped tile preview. */
    const src = await resolvePhotoSource(photo, "viewer");
    if (state.viewerIndex !== index) return;
    if (!src) return;

    /* If a full/original URL fails, gracefully fall back to the tile/preview source. */
    const fallback = photo.src && photo.src !== src ? photo.src : "";
    let fallbackUsed = false;
    viewerImage.onerror = () => {
      if (!fallbackUsed && fallback) {
        fallbackUsed = true;
        viewerImage.src = fallback;
        if (viewerBackdrop) viewerBackdrop.src = fallback;
      }
    };

    viewerImage.onload = () => {
      viewerImage.dataset.naturalWidth = String(viewerImage.naturalWidth || 0);
      viewerImage.dataset.naturalHeight = String(viewerImage.naturalHeight || 0);
      state.zoom = MIN_ZOOM;
      state.panX = 0;
      state.panY = 0;
      requestAnimationFrame(() => requestAnimationFrame(fitViewerImage));
    };
    viewerImage.src = src;
    if (viewerBackdrop) viewerBackdrop.src = src;
  }

  function openViewer(index) {
    const { viewer, viewerClose } = els();
    if (!viewer || !state.photos[index]) return;
    viewer.hidden = false;
    viewer.setAttribute("aria-hidden", "false");
    showViewerPhoto(index);
    requestAnimationFrame(() => viewerClose?.focus({ preventScroll: true }));
  }

  function closeViewer(returnFocus = true) {
    const { viewer } = els();
    if (!viewer || viewer.hidden) return;
    const index = state.viewerIndex;
    resetViewerTransform(false);
    viewer.hidden = true;
    viewer.setAttribute("aria-hidden", "true");
    state.viewerIndex = -1;
    if (returnFocus && index >= 0) {
      document.querySelector(`[data-archive-index="${index}"]`)?.focus({ preventScroll: true });
    }
  }

  function moveViewer(delta) {
    if (!state.photos.length || state.viewerIndex < 0) return;
    const next = (state.viewerIndex + delta + state.photos.length) % state.photos.length;
    showViewerPhoto(next);
  }

  function bindEvents() {
    const {
      modal, close, grid, viewer, viewerClose, prev, next, viewerImage,
      zoomViewport, zoomOut, zoomIn
    } = els();
    if (!modal) return;

    document.getElementById("sfkMemoryArchiveTickerTrigger")?.addEventListener("click", event => {
      if (isPhone()) return;
      openArchive(event.currentTarget);
    });

    /* Mobile header heart exists dynamically; event delegation keeps it reliable. */
    document.addEventListener("click", event => {
      const heart = event.target?.closest?.(".sfkMobileHeaderHeart");
      const topbar = heart?.closest?.(".topbar.mobile-header-rotator");
      if (!heart || !topbar || !isPhone() || !topbar.classList.contains("mobile-show-quote")) return;
      event.preventDefault();
      event.stopPropagation();
      openArchive(heart);
    });

    document.addEventListener("keydown", event => {
      const heart = event.target?.closest?.(".sfkMobileHeaderHeart");
      const topbar = heart?.closest?.(".topbar.mobile-header-rotator");
      if (heart && topbar && isPhone() && topbar.classList.contains("mobile-show-quote") && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openArchive(heart);
        return;
      }

      if (modal.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (viewer && !viewer.hidden) closeViewer();
        else closeArchive();
      } else if (viewer && !viewer.hidden && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        viewerZoomBy(BUTTON_ZOOM_STEP);
      } else if (viewer && !viewer.hidden && (event.key === "-" || event.key === "_")) {
        event.preventDefault();
        viewerZoomBy(-BUTTON_ZOOM_STEP);
      } else if (viewer && !viewer.hidden && event.key === "ArrowLeft" && state.zoom <= MIN_ZOOM + 0.001) {
        event.preventDefault();
        moveViewer(-1);
      } else if (viewer && !viewer.hidden && event.key === "ArrowRight" && state.zoom <= MIN_ZOOM + 0.001) {
        event.preventDefault();
        moveViewer(1);
      }
    }, true);

    close?.addEventListener("click", closeArchive);
    modal.querySelector("[data-sfk-memory-archive-close]")?.addEventListener("click", closeArchive);

    grid?.addEventListener("click", event => {
      const tile = event.target.closest("[data-archive-index]");
      if (!tile) return;
      openViewer(Number(tile.dataset.archiveIndex));
    });

    viewerClose?.addEventListener("click", () => closeViewer());
    prev?.addEventListener("click", () => moveViewer(-1));
    next?.addEventListener("click", () => moveViewer(1));

    zoomOut?.addEventListener("click", () => viewerZoomBy(-BUTTON_ZOOM_STEP));
    zoomIn?.addEventListener("click", () => viewerZoomBy(BUTTON_ZOOM_STEP));

    /* Desktop mouse wheel zooms toward the cursor position. */
    zoomViewport?.addEventListener("wheel", event => {
      if (isPhone()) return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.18 : (1 / 1.18);
      setViewerZoom(state.zoom * factor, event.clientX, event.clientY);
    }, { passive: false });

    /* Pointer Events power both desktop drag-pan and phone pinch/pan. */
    zoomViewport?.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      try { zoomViewport.setPointerCapture(event.pointerId); } catch (error) {}

      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType });

      if (state.pointers.size >= 2) {
        beginPinchIfReady();
        state.dragPointerId = null;
        viewer?.classList.add("is-dragging");
        event.preventDefault();
        return;
      }

      state.gesturePinched = false;
      state.swipeStartX = event.clientX;
      state.swipeStartY = event.clientY;

      if (state.zoom > MIN_ZOOM + 0.001) {
        state.dragPointerId = event.pointerId;
        state.dragStartX = event.clientX;
        state.dragStartY = event.clientY;
        state.dragStartPanX = state.panX;
        state.dragStartPanY = state.panY;
        viewer?.classList.add("is-dragging");
        event.preventDefault();
      }
    });

    zoomViewport?.addEventListener("pointermove", event => {
      if (!state.pointers.has(event.pointerId)) return;
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType });

      if (state.pointers.size >= 2) {
        const points = Array.from(state.pointers.values()).slice(0, 2);
        const distance = pointDistance(points[0], points[1]);
        const mid = pointMidpoint(points[0], points[1]);
        if (!state.pinchStartDistance) beginPinchIfReady();
        if (state.pinchStartDistance) {
          state.zoom = clamp(
            state.pinchStartZoom * (distance / state.pinchStartDistance),
            MIN_ZOOM,
            MAX_ZOOM
          );
          state.panX = state.pinchStartPanX + (mid.x - state.pinchStartMidX);
          state.panY = state.pinchStartPanY + (mid.y - state.pinchStartMidY);
          if (state.zoom <= MIN_ZOOM + 0.001) {
            state.zoom = MIN_ZOOM;
            state.panX = 0;
            state.panY = 0;
          }
          clampViewerPan();
          applyViewerTransform();
          event.preventDefault();
        }
        return;
      }

      if (state.dragPointerId === event.pointerId && state.zoom > MIN_ZOOM + 0.001) {
        state.panX = state.dragStartPanX + (event.clientX - state.dragStartX);
        state.panY = state.dragStartPanY + (event.clientY - state.dragStartY);
        clampViewerPan();
        applyViewerTransform();
        event.preventDefault();
      }
    });

    function endViewerPointer(event) {
      const wasOnlyPointer = state.pointers.size === 1 && state.pointers.has(event.pointerId);
      const startX = state.swipeStartX;
      const startY = state.swipeStartY;
      state.pointers.delete(event.pointerId);
      try { zoomViewport?.releasePointerCapture(event.pointerId); } catch (error) {}

      if (state.pointers.size >= 2) {
        beginPinchIfReady();
        return;
      }

      if (state.pointers.size === 1 && state.zoom > MIN_ZOOM + 0.001) {
        const [remainingId, remaining] = Array.from(state.pointers.entries())[0];
        state.dragPointerId = remainingId;
        state.dragStartX = remaining.x;
        state.dragStartY = remaining.y;
        state.dragStartPanX = state.panX;
        state.dragStartPanY = state.panY;
        state.pinchStartDistance = 0;
        return;
      }

      viewer?.classList.remove("is-dragging");
      state.dragPointerId = null;
      state.pinchStartDistance = 0;

      /* At fit view, one-finger horizontal swipe still changes photo on phone. */
      if (isPhone() && wasOnlyPointer && !state.gesturePinched && state.zoom <= MIN_ZOOM + 0.001 && Number.isFinite(startX) && Number.isFinite(startY)) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          moveViewer(dx > 0 ? -1 : 1);
        }
      }

      state.swipeStartX = null;
      state.swipeStartY = null;
      state.gesturePinched = false;
    }

    zoomViewport?.addEventListener("pointerup", endViewerPointer);
    zoomViewport?.addEventListener("pointercancel", endViewerPointer);
    zoomViewport?.addEventListener("lostpointercapture", event => {
      if (state.pointers.has(event.pointerId)) endViewerPointer(event);
    });

    const topbar = document.querySelector(".topbar");
    if (topbar && "MutationObserver" in window) {
      new MutationObserver(updateMobileHeartAccessibility).observe(topbar, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true
      });
    }
    window.addEventListener("resize", () => {
      updateMobileHeartAccessibility();
      const { viewer } = els();
      if (viewer && !viewer.hidden) {
        resetViewerTransform(false);
        requestAnimationFrame(() => requestAnimationFrame(fitViewerImage));
      }
    }, { passive: true });
    [0, 100, 500, 1200].forEach(delay => window.setTimeout(updateMobileHeartAccessibility, delay));
  }

  function boot() {
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

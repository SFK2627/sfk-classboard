/* =========================================================
   SFK QUOTE ARCHIVE v341
   Firebase-only DailyQuotes archive.
   Order: CURRENT -> FUTURE -> PAST.
========================================================= */
(function initSfkQuoteArchive() {
  const QUOTE_AUDIO_URL = "https://audio.jukehost.co.uk/019efe86-fd8f-72dd-9b85-e599fae9da2c";

  const KINDNESS_VIDEOS = [
    {
      id: "O9UByLyOjBM",
      title: "The Science of Kindness",
      source: "Random Acts of Kindness Foundation",
      note: "A concise look at how kind actions can affect well-being, connection, and the people around us."
    },
    {
      id: "1Evwgu369Jw",
      title: "Brené Brown on Empathy",
      source: "RSA Short",
      note: "A memorable animated explanation of why real empathy means connecting with another person's experience."
    },
    {
      id: "qLGNj-xrgvY",
      title: "Mr Indifferent",
      source: "Animated Short Film",
      note: "A visual story about what changes when a person begins to notice others and chooses to help."
    },
    {
      id: "QMnEP2DYfmI",
      title: "Ripple",
      source: "Short Film · Daniel Yam",
      note: "A short film about how one good deed can travel farther than the person who first offered it."
    },
    {
      id: "elW69hyPUuI",
      title: "How 40 Seconds of Compassion Could Save a Life",
      source: "TEDx · Stephen Trzeciak",
      note: "An evidence-based talk on how even brief moments of compassion can have meaningful effects."
    },
    {
      id: "DqAJU7z9lRE",
      title: "Connecting Mindfulness & Kindness",
      source: "Be Fearless Be Kind",
      note: "A youth-friendly connection between mindful attention, empathy, inclusion, and courageous kindness."
    },
    {
      id: "ju3ygNPFH98",
      title: "Changing the World With Kindness",
      source: "Random Acts of Kindness Foundation",
      note: "A reminder that ordinary choices can create a ripple of generosity, belonging, and positive action."
    }
  ];

  let modal = null;
  let statusEl = null;
  let sectionsEl = null;
  let countsEl = null;
  let lastFocus = null;
  let audio = null;
  let loadedOnce = false;
  let quoteCache = [];
  let kindnessVideoIndex = 0;
  let kindnessVideoPlaying = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanQuote(value) {
    return String(value || "")
      .trim()
      .replace(/^[\s\"'“”‘’]+/, "")
      .replace(/[\s\"'“”‘’]+$/, "");
  }

  function manilaParts(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day)
    };
  }

  function dateKeyFromParts(year, month, day) {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!y || !m || !d || m > 12 || d > 31) return "";
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function manilaDateKey(date) {
    const parts = manilaParts(date);
    return dateKeyFromParts(parts.year, parts.month, parts.day);
  }

  function manilaTodayKey() {
    return manilaDateKey(new Date());
  }

  function keyToLabel(key) {
    if (!key) return "No date";
    const [year, month, day] = key.split("-").map(Number);
    if (!year || !month || !day) return key;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(year, month - 1, day));
  }

  function firestoreDate(value) {
    if (!value) return null;
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;

    if (typeof value?.toDate === "function") {
      try {
        const date = value.toDate();
        if (date instanceof Date && Number.isFinite(date.getTime())) return date;
      } catch (error) {}
    }

    if (typeof value === "object") {
      const seconds = Number(value.seconds ?? value._seconds);
      const nanos = Number(value.nanoseconds ?? value._nanoseconds ?? 0);
      if (Number.isFinite(seconds) && seconds > 0) {
        const date = new Date((seconds * 1000) + Math.floor(nanos / 1e6));
        if (Number.isFinite(date.getTime())) return date;
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const millis = value > 1e12 ? value : value * 1000;
      const date = new Date(millis);
      if (Number.isFinite(date.getTime())) return date;
    }

    return null;
  }

  function parseQuoteDate(value) {
    const firestoreValue = firestoreDate(value);
    if (firestoreValue) {
      const key = manilaDateKey(firestoreValue);
      return { key, label: keyToLabel(key) };
    }

    const raw = String(value ?? "").trim();
    if (!raw || raw === "[object Object]") return { key: "", label: "No date" };

    let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    let key = match ? dateKeyFromParts(match[1], match[2], match[3]) : "";

    if (!key) {
      match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (match) key = dateKeyFromParts(match[3], match[1], match[2]);
    }

    if (!key) {
      const monthNames = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
        jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
        sep: 9, sept: 9, oct: 10, nov: 11, dec: 12
      };
      match = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
      if (match && monthNames[match[1].toLowerCase()]) {
        key = dateKeyFromParts(match[3], monthNames[match[1].toLowerCase()], match[2]);
      }
    }

    if (!key) {
      const parsed = Date.parse(raw);
      if (Number.isFinite(parsed)) key = manilaDateKey(new Date(parsed));
    }

    return { key, label: key ? keyToLabel(key) : raw };
  }

  function normalizedRecord(row, index) {
    const dateValue = row?.Date ?? row?.date ?? row?.QuoteDate ?? row?.quoteDate ?? row?.ScheduledDate ?? row?.scheduledDate ?? "";
    const parsedDate = parseQuoteDate(dateValue);
    return {
      quote: cleanQuote(row?.Quote ?? row?.quote ?? row?.Text ?? row?.text ?? ""),
      author: String(row?.Author ?? row?.author ?? row?.By ?? row?.by ?? "SFK ClassBoard").trim() || "SFK ClassBoard",
      dateKey: parsedDate.key,
      dateLabel: parsedDate.label,
      docId: String(row?.docId ?? row?.id ?? ""),
      sourceIndex: index
    };
  }

  function classifyQuotes(rows) {
    const today = manilaTodayKey();
    const records = (rows || [])
      .map(normalizedRecord)
      .filter(item => item.quote);

    const current = records
      .filter(item => item.dateKey === today)
      .sort((a, b) => a.sourceIndex - b.sourceIndex);

    const future = records
      .filter(item => !item.dateKey || item.dateKey > today)
      .sort((a, b) => {
        if (!a.dateKey && !b.dateKey) return a.sourceIndex - b.sourceIndex;
        if (!a.dateKey) return 1;
        if (!b.dateKey) return -1;
        return a.dateKey.localeCompare(b.dateKey) || a.sourceIndex - b.sourceIndex;
      });

    const past = records
      .filter(item => item.dateKey && item.dateKey < today)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.sourceIndex - a.sourceIndex);

    return { current, future, past };
  }

  function renderEntry(item, index, eraKey) {
    const number = String(index + 1).padStart(2, "0");
    return `
      <article class="sfkQuoteLedgerRow sfkQuoteLedgerRow--${eraKey}">
        <div class="sfkQuoteLedgerNo">${number}</div>
        <time class="sfkQuoteLedgerDate">${escapeHtml(item.dateLabel)}</time>
        <blockquote class="sfkQuoteLedgerText">${escapeHtml(item.quote)}</blockquote>
        <div class="sfkQuoteLedgerAuthor">${escapeHtml(item.author)}</div>
      </article>`;
  }

  function renderEra(key, sequence, title, note, records) {
    const entries = records.length
      ? records.map((item, index) => renderEntry(item, index, key)).join("")
      : `<div class="sfkQuoteLedgerEmpty">No ${title.toLowerCase()} quotes saved in Firebase.</div>`;

    return `
      <section class="sfkQuoteLedgerEra sfkQuoteLedgerEra--${key}">
        <header class="sfkQuoteLedgerEraHead">
          <span class="sfkQuoteLedgerEraSeq">${sequence}</span>
          <div>
            <h3>${title}</h3>
            <p>${note}</p>
          </div>
          <span class="sfkQuoteLedgerEraCount">${records.length}</span>
        </header>
        <div class="sfkQuoteLedgerEntries">${entries}</div>
      </section>`;
  }

  function videoPosterUrl(id) {
    return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  }

  function renderKindnessMotion() {
    return `
      <section class="sfkKindnessMotion" aria-labelledby="sfkKindnessMotionTitle">
        <header class="sfkKindnessMotionHead">
          <div class="sfkKindnessMotionKicker">WATCH KINDNESS · FIELD NOTES IN MOTION</div>
          <h3 id="sfkKindnessMotionTitle">Kindness becomes clearer when we can <em>see it move.</em></h3>
          <p>Short films, animation, science, and talks that explore empathy, compassion, generosity, and the quiet choices that make people feel seen.</p>
        </header>

        <div class="sfkKindnessMotionDesk" data-sfk-kindness-video-swipe>
          <div class="sfkKindnessMotionScreen" id="sfkKindnessMotionScreen" tabindex="0" aria-label="Kindness video viewer"></div>
          <aside class="sfkKindnessMotionNotes">
            <div class="sfkKindnessMotionCounter" id="sfkKindnessMotionCounter">01 / ${String(KINDNESS_VIDEOS.length).padStart(2, "0")}</div>
            <h4 id="sfkKindnessMotionVideoTitle"></h4>
            <div class="sfkKindnessMotionSource" id="sfkKindnessMotionSource"></div>
            <p id="sfkKindnessMotionNote"></p>
            <div class="sfkKindnessMotionNav" aria-label="Kindness video navigation">
              <button type="button" data-sfk-kindness-video="prev" aria-label="Previous kindness video">←</button>
              <span>SLIDE / SWIPE</span>
              <button type="button" data-sfk-kindness-video="next" aria-label="Next kindness video">→</button>
            </div>
          </aside>
        </div>
      </section>`;
  }

  function stopKindnessVideo() {
    kindnessVideoPlaying = false;
    const screen = modal?.querySelector("#sfkKindnessMotionScreen");
    if (screen && KINDNESS_VIDEOS.length) paintKindnessVideo(kindnessVideoIndex, false);
  }

  function paintKindnessVideo(index, autoplay = false) {
    if (!modal || !KINDNESS_VIDEOS.length) return;
    kindnessVideoIndex = (index + KINDNESS_VIDEOS.length) % KINDNESS_VIDEOS.length;
    const item = KINDNESS_VIDEOS[kindnessVideoIndex];
    const screen = modal.querySelector("#sfkKindnessMotionScreen");
    const counter = modal.querySelector("#sfkKindnessMotionCounter");
    const title = modal.querySelector("#sfkKindnessMotionVideoTitle");
    const source = modal.querySelector("#sfkKindnessMotionSource");
    const note = modal.querySelector("#sfkKindnessMotionNote");
    if (!screen || !counter || !title || !source || !note) return;

    counter.textContent = `${String(kindnessVideoIndex + 1).padStart(2, "0")} / ${String(KINDNESS_VIDEOS.length).padStart(2, "0")}`;
    title.textContent = item.title;
    source.textContent = item.source;
    note.textContent = item.note;

    if (autoplay) {
      kindnessVideoPlaying = true;
      stopArchiveMusic();
      screen.innerHTML = `<iframe
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.id)}?autoplay=1&rel=0&modestbranding=1"
        title="${escapeHtml(item.title)}"
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>`;
    } else {
      kindnessVideoPlaying = false;
      screen.innerHTML = `
        <button class="sfkKindnessMotionPoster" type="button" data-sfk-kindness-play aria-label="Play ${escapeHtml(item.title)}">
          <img src="${videoPosterUrl(item.id)}" alt="" loading="lazy" referrerpolicy="no-referrer">
          <span class="sfkKindnessMotionPosterShade" aria-hidden="true"></span>
          <span class="sfkKindnessMotionPlayMark" aria-hidden="true">▶</span>
          <span class="sfkKindnessMotionPlayText">PLAY CURRENT FILM</span>
        </button>`;
    }
  }

  function stepKindnessVideo(delta) {
    paintKindnessVideo(kindnessVideoIndex + delta, false);
  }

  function setupKindnessMotion() {
    const root = modal?.querySelector(".sfkKindnessMotion");
    const swipe = modal?.querySelector("[data-sfk-kindness-video-swipe]");
    if (!root || !swipe) return;

    paintKindnessVideo(kindnessVideoIndex, false);

    if (root.dataset.bound === "true") return;
    root.dataset.bound = "true";

    root.addEventListener("click", event => {
      const nav = event.target.closest("[data-sfk-kindness-video]");
      if (nav) {
        stepKindnessVideo(nav.dataset.sfkKindnessVideo === "next" ? 1 : -1);
        return;
      }
      if (event.target.closest("[data-sfk-kindness-play]")) {
        paintKindnessVideo(kindnessVideoIndex, true);
      }
    });

    root.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepKindnessVideo(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepKindnessVideo(1);
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    swipe.addEventListener("touchstart", event => {
      const touch = event.changedTouches?.[0];
      if (!touch || event.target.closest("iframe")) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    swipe.addEventListener("touchend", event => {
      const touch = event.changedTouches?.[0];
      if (!touch || event.target.closest("iframe")) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        stepKindnessVideo(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  function renderArchive(rows) {
    const grouped = classifyQuotes(rows);
    countsEl.textContent = `${grouped.current.length} current · ${grouped.future.length} future · ${grouped.past.length} past`;
    sectionsEl.innerHTML = [
      renderEra("current", "01", "Current", "For today in Manila", grouped.current),
      renderKindnessMotion(),
      renderEra("future", "02", "Future", "Scheduled next", grouped.future),
      renderEra("past", "03", "Past", "Previous entries · newest first", grouped.past)
    ].join("");
    statusEl.hidden = true;
    setupKindnessMotion();
  }

  async function waitForFirebaseAdapter(timeoutMs = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const adapter = window.SFKClassBoardFirebaseAdapter;
      if (adapter && typeof adapter.getRows === "function") {
        if (typeof adapter.ready === "function") await adapter.ready(Math.max(1000, timeoutMs - (Date.now() - started)));
        return adapter;
      }
      await new Promise(resolve => window.setTimeout(resolve, 90));
    }
    throw new Error("Firebase adapter is not ready.");
  }

  async function fetchQuotes(force = false) {
    if (loadedOnce && !force) {
      renderArchive(quoteCache);
      return;
    }

    statusEl.hidden = false;
    statusEl.textContent = "Reading quotes from Firebase…";
    sectionsEl.innerHTML = "";

    try {
      const adapter = await waitForFirebaseAdapter();
      const rows = await adapter.getRows("DailyQuotes");
      if (!Array.isArray(rows)) throw new Error("DailyQuotes did not return a list.");
      quoteCache = rows;
      loadedOnce = true;
      renderArchive(rows);
    } catch (error) {
      console.error("SFK Quote Archive Firebase load failed:", error);
      statusEl.hidden = false;
      statusEl.innerHTML = "Quotes could not be read from Firebase right now.<br><small>Please check the Firebase connection and dailyQuotes read permission.</small>";
    }
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio(QUOTE_AUDIO_URL);
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0.38;
    return audio;
  }

  function playArchiveMusic() {
    const player = ensureAudio();
    try { player.currentTime = 0; } catch (error) {}
    const promise = player.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(error => console.warn("Quote Archive music autoplay was blocked:", error));
    }
  }

  function stopArchiveMusic() {
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch (error) {}
  }

  function buildModal() {
    if (modal) return;

    modal = document.createElement("div");
    modal.className = "sfkQuoteArchiveModal";
    modal.id = "sfkQuoteArchiveModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="sfkQuoteArchiveBackdrop" data-sfk-quote-close="true"></div>
      <section class="sfkQuoteArchivePaper" role="dialog" aria-modal="true" aria-labelledby="sfkQuoteArchiveTitle">
        <button class="sfkQuoteArchiveClose" type="button" aria-label="Close quote archive" data-sfk-quote-close="true">×</button>

        <header class="sfkKindnessIndexHead">
          <aside class="sfkKindnessIndexRail" aria-hidden="true">
            <span>SFK</span>
            <b>KINDNESS</b>
            <span>2026—27</span>
          </aside>

          <div class="sfkKindnessIndexMain">
            <div class="sfkKindnessIndexEyebrow">A living index of words worth carrying</div>
            <div class="sfkKindnessIndexLead">
              <h2 id="sfkQuoteArchiveTitle">Kindness,<br><em>in practice.</em></h2>
              <p>Kindness is not decoration. It is what care looks like when it becomes an action: a helpful choice, a generous response, respect offered without being asked, and attention given when it would be easier to look away.</p>
            </div>

            <div class="sfkKindnessIndexNotes" aria-label="Perspectives on kindness">
              <div><sup>01</sup><strong>Merriam-Webster</strong><p>A quality of being kind, and also a kind act or favor.</p></div>
              <div><sup>02</sup><strong>Cambridge</strong><p>The quality of being generous, helpful, and caring about other people.</p></div>
              <div><sup>03</sup><strong>Greater Good · Berkeley</strong><p>Kind actions belong to prosocial behavior that can strengthen connection, cooperation, and well-being.</p></div>
              <div><sup>04</sup><strong>SFK ClassBoard</strong><p>Kindness becomes real in ordinary choices: how we speak, include, listen, help, forgive, and show up for one another.</p></div>
            </div>
          </div>
        </header>

        <main class="sfkQuoteArchiveBody">
          <div class="sfkQuoteIndexBar">
            <span>QUOTE INDEX</span>
            <strong>Current → Future → Past</strong>
            <span id="sfkQuoteArchiveCounts">Reading Firebase…</span>
          </div>
          <div class="sfkQuoteArchiveStatus" id="sfkQuoteArchiveStatus">Reading quotes from Firebase…</div>
          <div class="sfkQuoteArchiveSections" id="sfkQuoteArchiveSections"></div>
        </main>
      </section>`;

    document.body.appendChild(modal);
    statusEl = modal.querySelector("#sfkQuoteArchiveStatus");
    sectionsEl = modal.querySelector("#sfkQuoteArchiveSections");
    countsEl = modal.querySelector("#sfkQuoteArchiveCounts");

    modal.addEventListener("click", event => {
      if (event.target.closest('[data-sfk-quote-close="true"]')) closeArchive();
    });
  }

  function openArchive() {
    buildModal();
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("sfkQuoteArchiveOpen");
    playArchiveMusic();
    fetchQuotes(true);
    requestAnimationFrame(() => modal.querySelector(".sfkQuoteArchiveClose")?.focus({ preventScroll: true }));
  }

  function closeArchive() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sfkQuoteArchiveOpen");
    stopArchiveMusic();
    stopKindnessVideo();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
  }

  function isPhone() {
    return window.matchMedia?.("(max-width: 700px)")?.matches;
  }

  function quoteCardCanOpen() {
    if (!isPhone()) return true;
    const topbar = document.querySelector(".topbar");
    return Boolean(topbar?.classList.contains("mobile-show-quote"));
  }

  function setupTrigger() {
    const quoteBox = document.querySelector(".topQuoteBox");
    if (!quoteBox) return;

    quoteBox.classList.add("sfkQuoteArchiveTrigger");
    quoteBox.setAttribute("role", "button");
    quoteBox.setAttribute("tabindex", "0");
    quoteBox.setAttribute("aria-label", "Open the SFK Quote Archive");

    quoteBox.addEventListener("click", event => {
      if (!quoteCardCanOpen()) return;
      if (event.target.closest("a, button, input, select, textarea")) return;
      openArchive();
    });

    quoteBox.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && quoteCardCanOpen()) {
        event.preventDefault();
        openArchive();
      }
    });
  }

  function boot() {
    buildModal();
    setupTrigger();

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && modal?.classList.contains("is-open")) closeArchive();
    });

    window.addEventListener("pagehide", () => { stopArchiveMusic(); stopKindnessVideo(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

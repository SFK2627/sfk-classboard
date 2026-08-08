/* =========================================================
   SFK QUOTE ARCHIVE v344
   Firebase-only DailyQuotes archive.
   Order: CURRENT -> FUTURE -> PAST.
========================================================= */
(function initSfkQuoteArchive() {
  const QUOTE_AUDIO_URL = "https://audio.jukehost.co.uk/019efe86-fd8f-72dd-9b85-e599fae9da2c";

  const KINDNESS_VIDEO_CATEGORIES = [
    { id: "all", label: "ALL", note: "Every kindness film in the archive" },
    { id: "short", label: "SHORT FILMS", note: "Narrative stories where one choice changes another person's day" },
    { id: "campaign", label: "ADS & CAMPAIGNS", note: "Brand and nonprofit stories that use kindness as a public message" },
    { id: "animation", label: "ANIMATION", note: "Animated stories about empathy, service, acceptance, and care" },
    { id: "talk", label: "TALKS", note: "Speakers unpacking empathy, compassion, mindfulness, and human connection" },
    { id: "science", label: "SCIENCE", note: "Research-informed explanations of why kindness affects people and communities" },
    { id: "compilation", label: "COMPILATIONS", note: "Collections of real-world acts of generosity and help" },
    { id: "reflection", label: "REFLECTION", note: "Motivational pieces that invite a deliberate choice to be kind" }
  ];

  const KINDNESS_VIDEOS = [
    {
      id: "uaWA2GbcnJU",
      category: "campaign",
      title: "Unsung Hero",
      source: "Thai Life Insurance (TLI)",
      note: "A man repeatedly chooses small, quiet acts of help without asking for recognition. It frames kindness as a daily habit whose value is found in changed lives, not applause."
    },
    {
      id: "iVrQqWIs6ZE",
      category: "campaign",
      title: "Tear-Jerker Commercials Create Internet Challenge",
      source: "The Wall Street Journal · featuring TrueMove H 'Giving'",
      note: "A look at the Thai 'Giving' story, where help offered during hardship returns years later. It connects kindness with memory, dignity, and the long reach of generosity."
    },
    {
      id: "nwAYpLVyeFU",
      category: "campaign",
      title: "Kindness Boomerang — One Day",
      source: "Life Vest Inside",
      note: "One helpful act moves from stranger to stranger and eventually circles back. A clear visual model of how kindness can spread through a community."
    },
    {
      id: "8x_bSH1A5rA",
      category: "compilation",
      title: "Random Acts of Kindness That Will Restore Your Faith In Humanity",
      source: "Akimbo",
      note: "A compilation of spontaneous real-world help and generosity. It shows that kindness can be practical, immediate, and visible in ordinary situations."
    },
    {
      id: "NXkJ9eNpWNw",
      category: "reflection",
      title: "BE KIND",
      source: "Above Inspiration",
      note: "A motivational reflection on treating people gently because we rarely know the private battles they carry. Kindness becomes a choice in how we speak, judge, and respond."
    },
    {
      id: "WXudxua0IKo",
      category: "short",
      title: "Be Kind To Others",
      source: "Inspire USA",
      note: "A short story built around noticing another person's unseen struggle. It invites viewers to slow down before judging and to let empathy guide action."
    },
    {
      id: "1qrAJWmjG18",
      category: "animation",
      title: "Animated Short: Kindness Sparks Joy",
      source: "Holly Hatam",
      note: "A young girl deliberately spreads joy through simple acts of care. The animation makes the ripple effect of kindness easy to see and discuss."
    },
    {
      id: "07d2dXHYb94",
      category: "animation",
      title: "Pip",
      source: "Dogs Inc",
      note: "Pip's journey toward becoming a guide dog connects perseverance with service: developing one's abilities so they can ultimately help someone else live more independently."
    },
    {
      id: "mdA2sByFX1I",
      category: "campaign",
      title: "Color Your World With Kindness",
      source: "A Better World / BetterWorldians",
      note: "A wordless chain of small gestures literally brings color into people's lives. It turns kindness into a simple challenge: notice, help, and pass the good forward."
    },
    {
      id: "ET4B3UfWrYY",
      category: "campaign",
      title: "When Nobody's Watching",
      source: "Klick",
      note: "An animated campaign about doing good when there is no audience or reward. It focuses on character: kindness matters even when nobody is keeping score."
    },
    {
      id: "3XA0bB79oGc",
      category: "animation",
      title: "The Present",
      source: "Jacob Frey · Filmakademie Baden-Württemberg",
      note: "A boy's reaction to a three-legged puppy changes as he recognizes shared experience. The story opens a conversation about acceptance, disability, empathy, and looking beyond first impressions."
    },
    {
      id: "mdSfg8qO8ts",
      category: "short",
      title: "The Gift of Giving",
      source: "MUIS Singapore",
      note: "Hakim learns by watching generosity practiced around him. The film presents kindness as something modeled, learned, and carried forward through concrete acts of giving."
    },
    {
      id: "FGh0iduZOJQ",
      category: "short",
      title: "The Other Pair",
      source: "Sarah Rozik",
      note: "Inspired by a story associated with Gandhi, two children respond to loss with generosity rather than possession. It is a quiet lesson in empathy and giving what will truly help another person."
    },
    {
      id: "O9UByLyOjBM",
      category: "science",
      title: "The Science of Kindness",
      source: "Random Acts of Kindness Foundation",
      note: "A concise introduction to how kind actions can influence well-being, connection, and the people around us."
    },
    {
      id: "1Evwgu369Jw",
      category: "talk",
      title: "Brené Brown on Empathy",
      source: "RSA Short",
      note: "A memorable explanation of empathy as connection rather than immediately fixing, judging, or minimizing another person's pain."
    },
    {
      id: "qLGNj-xrgvY",
      category: "animation",
      title: "Mr Indifferent",
      source: "Animated Short Film",
      note: "A visually driven story about an indifferent man who begins to notice other people. Kindness starts when attention turns into action."
    },
    {
      id: "QMnEP2DYfmI",
      category: "short",
      title: "Ripple",
      source: "Daniel Yam",
      note: "A short film about one good deed traveling farther than the person who first offered it, emphasizing the social ripple created by generosity."
    },
    {
      id: "elW69hyPUuI",
      category: "science",
      title: "How 40 Seconds of Compassion Could Save a Life",
      source: "TEDx · Stephen Trzeciak",
      note: "An evidence-focused case for compassion, showing why even brief moments of genuine human care can matter in high-stakes settings."
    },
    {
      id: "DqAJU7z9lRE",
      category: "talk",
      title: "Connecting Mindfulness & Kindness",
      source: "Be Fearless Be Kind",
      note: "Connects mindful attention with empathy, inclusion, and the courage to notice when another person needs support."
    },
    {
      id: "ju3ygNPFH98",
      category: "campaign",
      title: "Changing the World With Kindness",
      source: "Random Acts of Kindness Foundation",
      note: "A campaign-style reminder that ordinary choices can build belonging and positive action when kindness is repeated, shared, and normalized."
    },
    {
      id: "6L5SpMFtwuU",
      category: "science",
      title: "The Extraordinary Power of Kindness",
      source: "BBC Ideas",
      note: "Explores what happened when Bernadette Russell committed to a year of daily kindness and connects the experience to what kindness can do for our brains and relationships."
    },
    {
      id: "1XMZPmJqFDU",
      category: "science",
      title: "The Scientific POWER of Kindness",
      source: "Simon Sinek",
      note: "Uses the role of oxytocin to explain why helping and being helped can reinforce trust, connection, and more prosocial behavior."
    },
    {
      id: "ccvFBGhBKg4",
      category: "science",
      title: "Train Your Brain to Be Kinder",
      source: "Greater Good Science Center · UC Berkeley",
      note: "A brief guided practice in sending kind thoughts to people we love and even people we find difficult—turning kindness into a trainable mental habit."
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
  let kindnessVideoCategory = "all";

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

  function activeKindnessVideos() {
    if (kindnessVideoCategory === "all") return KINDNESS_VIDEOS;
    return KINDNESS_VIDEOS.filter(item => item.category === kindnessVideoCategory);
  }

  function activeKindnessCategory() {
    return KINDNESS_VIDEO_CATEGORIES.find(item => item.id === kindnessVideoCategory) || KINDNESS_VIDEO_CATEGORIES[0];
  }

  function categoryCount(id) {
    return id === "all"
      ? KINDNESS_VIDEOS.length
      : KINDNESS_VIDEOS.filter(item => item.category === id).length;
  }

  function renderKindnessCategoryRail() {
    return KINDNESS_VIDEO_CATEGORIES.map(category => `
      <button
        type="button"
        class="sfkKindnessMotionCategory${category.id === kindnessVideoCategory ? " is-active" : ""}"
        data-sfk-kindness-category="${escapeHtml(category.id)}"
        aria-pressed="${category.id === kindnessVideoCategory ? "true" : "false"}">
        <span>${escapeHtml(category.label)}</span>
        <small>${String(categoryCount(category.id)).padStart(2, "0")}</small>
      </button>`).join("");
  }

  function renderKindnessMotion() {
    const selected = activeKindnessCategory();
    const pool = activeKindnessVideos();
    return `
      <section class="sfkKindnessMotion" aria-labelledby="sfkKindnessMotionTitle">
        <header class="sfkKindnessMotionHead">
          <div class="sfkKindnessMotionKicker">WATCH KINDNESS · FIELD NOTES IN MOTION</div>
          <h3 id="sfkKindnessMotionTitle">Kindness becomes clearer when we can <em>see it move.</em></h3>
          <p>Choose a collection—short films, campaigns, animation, talks, science, compilations, or reflection—then explore only that kind of story.</p>
        </header>

        <div class="sfkKindnessMotionCategoryFrame">
          <div class="sfkKindnessMotionCategoryLabel">
            <b>CHOOSE A COLLECTION</b>
            <span id="sfkKindnessMotionCategoryNote">${escapeHtml(selected.note)}</span>
          </div>
          <nav class="sfkKindnessMotionCategories" aria-label="Kindness video collections">
            ${renderKindnessCategoryRail()}
          </nav>
        </div>

        <div class="sfkKindnessMotionDesk" data-sfk-kindness-video-swipe>
          <div class="sfkKindnessMotionScreen" id="sfkKindnessMotionScreen" tabindex="0" aria-label="Kindness video viewer"></div>
          <aside class="sfkKindnessMotionNotes">
            <div class="sfkKindnessMotionCounter" id="sfkKindnessMotionCounter">01 / ${String(pool.length).padStart(2, "0")}</div>
            <div class="sfkKindnessMotionType" id="sfkKindnessMotionType">${escapeHtml(selected.label)}</div>
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
    if (screen && activeKindnessVideos().length) paintKindnessVideo(kindnessVideoIndex, false);
  }

  function syncKindnessCategoryUi() {
    if (!modal) return;
    const selected = activeKindnessCategory();
    modal.querySelectorAll("[data-sfk-kindness-category]").forEach(button => {
      const active = button.dataset.sfkKindnessCategory === kindnessVideoCategory;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const note = modal.querySelector("#sfkKindnessMotionCategoryNote");
    const type = modal.querySelector("#sfkKindnessMotionType");
    if (note) note.textContent = selected.note;
    if (type) type.textContent = selected.label;
  }

  function paintKindnessVideo(index, autoplay = false) {
    if (!modal) return;
    const pool = activeKindnessVideos();
    if (!pool.length) return;

    kindnessVideoIndex = (index + pool.length) % pool.length;
    const item = pool[kindnessVideoIndex];
    const selected = activeKindnessCategory();
    const screen = modal.querySelector("#sfkKindnessMotionScreen");
    const counter = modal.querySelector("#sfkKindnessMotionCounter");
    const title = modal.querySelector("#sfkKindnessMotionVideoTitle");
    const source = modal.querySelector("#sfkKindnessMotionSource");
    const note = modal.querySelector("#sfkKindnessMotionNote");
    if (!screen || !counter || !title || !source || !note) return;

    syncKindnessCategoryUi();
    counter.textContent = `${String(kindnessVideoIndex + 1).padStart(2, "0")} / ${String(pool.length).padStart(2, "0")}`;
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
          <span class="sfkKindnessMotionPlayText">PLAY · ${escapeHtml(selected.label)}</span>
        </button>`;
    }
  }

  function stepKindnessVideo(delta) {
    paintKindnessVideo(kindnessVideoIndex + delta, false);
  }

  function selectKindnessCategory(categoryId) {
    if (!KINDNESS_VIDEO_CATEGORIES.some(item => item.id === categoryId)) return;
    kindnessVideoCategory = categoryId;
    kindnessVideoIndex = 0;
    kindnessVideoPlaying = false;
    paintKindnessVideo(0, false);
  }

  function setupKindnessMotion() {
    const root = modal?.querySelector(".sfkKindnessMotion");
    const swipe = modal?.querySelector("[data-sfk-kindness-video-swipe]");
    if (!root || !swipe) return;

    kindnessVideoIndex = 0;
    paintKindnessVideo(kindnessVideoIndex, false);

    if (root.dataset.bound === "true") return;
    root.dataset.bound = "true";

    root.addEventListener("click", event => {
      const category = event.target.closest("[data-sfk-kindness-category]");
      if (category) {
        selectKindnessCategory(category.dataset.sfkKindnessCategory || "all");
        return;
      }

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

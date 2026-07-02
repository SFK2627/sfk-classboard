(function () {
  "use strict";

  const DEFAULT_UNLOCK_AT = new Date(2027, 3, 3, 12, 0, 0);
  const DEFAULT_DEADLINE = new Date(2027, 2, 31, 23, 59, 0);
  const ENTRY_TYPES = {
    memory: "Favorite Memory",
    message: "Message",
    goal: "Goal",
    prediction: "Prediction",
    photo: "Photo Memory"
  };
  const ENTRY_PROMPTS = {
    memory: "What moment from this class do you never want to forget?",
    message: "What would you like to tell your future classmates and yourself?",
    goal: "What do you hope you will have achieved by unlock day?",
    prediction: "What do you think will be different when we open this capsule?",
    photo: "What story or feeling should future-you remember about this photo?"
  };

  const CAPSULE_MEDIA_COLLECTION = "timeCapsuleMedia";
  const CAPSULE_MEDIA_REF_PREFIX = "sfk-media://capsule/";
  const CAPSULE_MEDIA_MAX_BASE64_CHARS = 850000;
  const CAPSULE_TARGET_IMAGE_BYTES = 620000;

  const state = {
    context: null,
    settings: null,
    entries: [],
    settingsUnsubscribe: null,
    entriesUnsubscribe: null,
    publicUnsubscribe: null,
    statusUnsubscribe: null,
    publicStatus: null,
    entriesLoaded: false,
    publishedStatusSignature: "",
    statusRetryTimer: null,
    countdownTimer: null,
    presentationTimer: null,
    presentationEntries: [],
    slideIndex: 0,
    settingsCreating: false,
    selectedImage: null,
    imageCache: new Map(),
    initialized: false
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", initialize);

  function initialize() {
    if (state.initialized) return;
    state.initialized = true;
    cacheElements();
    if (!elements.room) return;

    elements.back.addEventListener("click", close);
    elements.adminToggle.addEventListener("click", toggleAdminPanel);
    elements.composeToggle.addEventListener("click", toggleCompose);
    elements.form.addEventListener("submit", submitEntry);
    elements.cancelEdit.addEventListener("click", resetForm);
    elements.entries.addEventListener("click", handleEntryAction);
    elements.reviewList.addEventListener("click", handleEntryAction);
    elements.settingsForm.addEventListener("submit", saveSettings);
    elements.unlockNow.addEventListener("click", unlockNow);
    elements.reviewFilter.addEventListener("change", renderReviewEntries);
    elements.present.addEventListener("click", openPresentation);
    elements.presentationClose.addEventListener("click", closePresentation);
    elements.previous.addEventListener("click", () => showSlide(state.slideIndex - 1));
    elements.next.addEventListener("click", () => showSlide(state.slideIndex + 1));
    elements.play.addEventListener("click", togglePresentationPlayback);
    elements.print.addEventListener("click", printCapsule);
  }

  function cacheElements() {
    elements.room = document.getElementById("timeCapsuleRoom");
    elements.back = document.getElementById("timeCapsuleBack");
    elements.headerStatus = document.getElementById("timeCapsuleHeaderStatus");
    elements.adminToggle = document.getElementById("timeCapsuleAdminToggle");
    elements.eyebrow = document.getElementById("timeCapsuleEyebrow");
    elements.heroTitle = document.getElementById("timeCapsuleHeroTitle");
    elements.countdown = document.getElementById("timeCapsuleCountdown");
    elements.present = document.getElementById("timeCapsulePresent");
    elements.lockMark = document.getElementById("timeCapsuleLockMark");
    elements.entryCount = document.getElementById("timeCapsuleEntryCount");
    elements.classCount = document.getElementById("timeCapsuleClassCount");
    elements.contributorCount = document.getElementById("timeCapsuleContributorCount");
    elements.composeCard = document.getElementById("timeCapsuleComposeCard");
    elements.composeToggle = document.getElementById("timeCapsuleComposeToggle");
    elements.form = document.getElementById("timeCapsuleForm");
    elements.editId = document.getElementById("timeCapsuleEditId");
    elements.type = document.getElementById("timeCapsuleType");
    elements.promptText = document.getElementById("timeCapsulePromptText");
    elements.text = document.getElementById("timeCapsuleText");
    elements.characterCount = document.getElementById("timeCapsuleCharacterCount");
    elements.imageUrl = document.getElementById("timeCapsuleImageUrl");
    elements.imageRef = document.getElementById("timeCapsuleImageRef") || { value: "" };
    elements.imageFile = document.getElementById("timeCapsuleImageFile");
    elements.imagePreview = document.getElementById("timeCapsuleImagePreview");
    elements.imagePreviewImg = document.getElementById("timeCapsuleImagePreviewImg");
    elements.imagePreviewText = document.getElementById("timeCapsuleImagePreviewText");
    elements.clearImage = document.getElementById("timeCapsuleClearImage");
    elements.cancelEdit = document.getElementById("timeCapsuleCancelEdit");
    elements.submit = document.getElementById("timeCapsuleSubmit");
    elements.formMessage = document.getElementById("timeCapsuleFormMessage");
    elements.entriesTitle = document.getElementById("timeCapsuleEntriesTitle");
    elements.entriesHint = document.getElementById("timeCapsuleEntriesHint");
    elements.entries = document.getElementById("timeCapsuleEntries");
    elements.adminPanel = document.getElementById("timeCapsuleAdminPanel");
    elements.settingsForm = document.getElementById("timeCapsuleSettingsForm");
    elements.deadline = document.getElementById("timeCapsuleDeadline");
    elements.unlockAt = document.getElementById("timeCapsuleUnlockAt");
    elements.allowSubmissions = document.getElementById("timeCapsuleAllowSubmissions");
    elements.unlockNow = document.getElementById("timeCapsuleUnlockNow");
    elements.settingsMessage = document.getElementById("timeCapsuleSettingsMessage");
    elements.reviewFilter = document.getElementById("timeCapsuleReviewFilter");
    elements.reviewList = document.getElementById("timeCapsuleReviewList");
    elements.presentation = document.getElementById("timeCapsulePresentation");
    elements.presentationClose = document.getElementById("timeCapsulePresentationClose");
    elements.slideCount = document.getElementById("timeCapsuleSlideCount");
    elements.slide = document.getElementById("timeCapsuleSlide");
    elements.previous = document.getElementById("timeCapsulePrevious");
    elements.play = document.getElementById("timeCapsulePlay");
    elements.next = document.getElementById("timeCapsuleNext");
    elements.print = document.getElementById("timeCapsulePrint");
    elements.type.addEventListener("change", updateEntryPrompt);
    elements.text.addEventListener("input", updateCharacterCount);
    elements.imageFile?.addEventListener("change", handleImageFileChange);
    elements.imageUrl?.addEventListener("input", handleImageUrlInput);
    elements.clearImage?.addEventListener("click", clearImageSelection);
  }

  function open(context) {
    initialize();
    if (!elements.room || !context?.profile || !context?.db) return;
    destroyListeners();
    state.context = context;
    state.settings = null;
    state.entries = [];
    state.slideIndex = 0;
    state.publicStatus = null;
    state.entriesLoaded = false;
    state.selectedImage = null;
    state.publishedStatusSignature = "";
    window.clearTimeout(state.statusRetryTimer);
    state.statusRetryTimer = null;
    elements.room.hidden = false;
    elements.adminPanel.hidden = true;
    elements.adminToggle.hidden = context.profile.role !== "admin";
    elements.adminToggle.textContent = "Manage";
    elements.headerStatus.textContent = `${context.profile.name} · Capsule contributor`;
    context.panel?.classList.add("is-time-capsule-open");
    resetForm();
    startPublicStatusListener();
    startSettingsListener();
    startCountdown();
  }

  function close() {
    closePresentation();
    destroyListeners();
    elements.room.hidden = true;
    state.context?.panel?.classList.remove("is-time-capsule-open");
    const callback = state.context?.onClose;
    state.context = null;
    if (typeof callback === "function") callback();
  }

  function destroy() {
    closePresentation();
    destroyListeners();
    if (elements.room) elements.room.hidden = true;
    state.context?.panel?.classList.remove("is-time-capsule-open");
    state.context = null;
  }

  function destroyListeners() {
    state.settingsUnsubscribe?.();
    state.entriesUnsubscribe?.();
    state.publicUnsubscribe?.();
    state.statusUnsubscribe?.();
    state.settingsUnsubscribe = null;
    state.entriesUnsubscribe = null;
    state.publicUnsubscribe = null;
    state.statusUnsubscribe = null;
    window.clearInterval(state.countdownTimer);
    window.clearTimeout(state.statusRetryTimer);
    state.countdownTimer = null;
    state.statusRetryTimer = null;
  }

  function startSettingsListener() {
    const settingsRef = state.context.db.collection("timeCapsuleSettings").doc("main");
    state.settingsUnsubscribe = settingsRef.onSnapshot(async (snapshot) => {
      if (snapshot.exists) {
        state.settings = snapshot.data() || {};
      } else if (isAdmin() && !state.settingsCreating) {
        state.settingsCreating = true;
        await settingsRef.set(defaultSettings()).catch((error) => {
          elements.settingsMessage.textContent = readableError(error);
        });
        state.settingsCreating = false;
        return;
      } else {
        state.settings = null;
      }
      renderSettings();
      startEntriesListeners();
      renderAll();
      syncPublicStatus();
    }, (error) => {
      elements.headerStatus.textContent = readableError(error);
    });
  }

  function startPublicStatusListener() {
    state.statusUnsubscribe?.();
    state.statusUnsubscribe = state.context.db.collection("settings").doc("timeCapsulePublic")
      .onSnapshot((snapshot) => {
        state.publicStatus = snapshot.exists ? snapshot.data() || {} : null;
        renderStats();
        if (isAdmin() && !snapshot.exists) syncPublicStatus();
      }, () => {
        state.publicStatus = null;
        renderStats();
        if (isAdmin()) schedulePublicStatusRetry();
      });
  }

  function defaultSettings() {
    return {
      Title: "SFK Time Capsule",
      UnlockAt: firebase.firestore.Timestamp.fromDate(DEFAULT_UNLOCK_AT),
      SubmissionDeadline: firebase.firestore.Timestamp.fromDate(DEFAULT_DEADLINE),
      AllowSubmissions: true,
      UpdatedBy: state.context.profile.uid,
      UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
  }

  function startEntriesListeners() {
    state.entriesUnsubscribe?.();
    state.publicUnsubscribe?.();
    state.entriesUnsubscribe = null;
    state.publicUnsubscribe = null;
    state.entries = [];

    if (isAdmin()) {
      state.entriesUnsubscribe = state.context.db.collection("timeCapsuleEntries")
        .onSnapshot((snapshot) => {
          state.entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          state.entriesLoaded = true;
          renderAll();
          syncPublicStatus();
        }, showEntriesError);
      return;
    }

    state.entriesUnsubscribe = state.context.db.collection("timeCapsuleEntries")
      .where("AuthorUID", "==", state.context.profile.uid)
      .onSnapshot((snapshot) => {
        mergeEntries(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), true);
      }, showEntriesError);

    if (isUnlocked()) {
      state.publicUnsubscribe = state.context.db.collection("timeCapsuleEntries")
        .where("Status", "==", "approved")
        .onSnapshot((snapshot) => {
          mergeEntries(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), false);
        }, showEntriesError);
    }
  }

  function mergeEntries(incoming, replaceOwn) {
    const ownUid = state.context.profile.uid;
    const retained = state.entries.filter((entry) => (
      replaceOwn ? entry.AuthorUID !== ownUid : entry.Status !== "approved"
    ));
    const merged = new Map(retained.concat(incoming).map((entry) => [entry.id, entry]));
    state.entries = Array.from(merged.values());
    renderAll();
  }

  function showEntriesError(error) {
    elements.entries.innerHTML = `<p class="timeCapsuleEmpty">${escapeHtml(readableError(error))}</p>`;
  }

  function renderAll() {
    if (!state.context) return;
    renderHero();
    renderStats();
    renderComposeState();
    renderMainEntries();
    if (isAdmin()) renderReviewEntries();
  }

  function renderHero() {
    const unlocked = isUnlocked();
    const deadline = settingsDate("SubmissionDeadline", DEFAULT_DEADLINE);
    elements.present.hidden = !unlocked && !isAdmin();
    elements.present.textContent = unlocked ? "View Capsule" : "Preview";
    elements.lockMark.classList.toggle("is-unlocked", unlocked);
    elements.eyebrow.textContent = unlocked ? "CAPSULE UNLOCKED" : "SEALED FOR NOW";
    elements.heroTitle.textContent = unlocked
      ? "Our SFK memories are ready."
      : "Our memories are growing.";
    if (!state.settings) {
      elements.countdown.textContent = isAdmin()
        ? "Creating capsule settings..."
        : "The Adviser is still preparing the capsule.";
    } else if (unlocked) {
      elements.countdown.textContent = `Unlocked ${formatDate(settingsDate("UnlockAt", DEFAULT_UNLOCK_AT), true)}`;
    } else if (Date.now() > deadline.getTime()) {
      elements.countdown.textContent = "Submissions are closed. Waiting for unlock day.";
    }
  }

  function renderStats() {
    const own = state.entries.filter((entry) => entry.AuthorUID === state.context.profile.uid);
    const visibleClassEntries = isAdmin() || isUnlocked()
      ? state.entries.filter((entry) => entry.Status === "approved")
      : null;
    const contributors = visibleClassEntries
      ? new Set(visibleClassEntries.map((entry) => entry.AuthorUID).filter(Boolean)).size
      : null;
    elements.entryCount.textContent = String(own.length);
    const publicSealedCount = safeCount(state.publicStatus?.SealedCount);
    const publicContributorCount = safeCount(state.publicStatus?.ContributorCount);
    const ownApprovedCount = own.filter((entry) => entry.Status === "approved").length;
    const sealedCount = Math.max(publicSealedCount, ownApprovedCount);
    const contributorCount = Math.max(publicContributorCount, ownApprovedCount > 0 ? 1 : 0);
    elements.classCount.textContent = visibleClassEntries
      ? String(visibleClassEntries.length)
      : String(sealedCount);
    elements.contributorCount.textContent = contributors == null
      ? String(contributorCount)
      : String(contributors);
  }

  function safeCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  }

  function syncPublicStatus() {
    if (!isAdmin() || !state.settings || !state.entriesLoaded) return;
    const sealedEntries = state.entries.filter((entry) => entry.Status === "approved");
    const contributorCount = new Set(
      sealedEntries.map((entry) => entry.AuthorUID).filter(Boolean)
    ).size;
    const unlockAt = settingsDate("UnlockAt", DEFAULT_UNLOCK_AT);
    const deadline = settingsDate("SubmissionDeadline", DEFAULT_DEADLINE);
    const signature = [
      unlockAt.getTime(),
      deadline.getTime(),
      sealedEntries.length,
      contributorCount
    ].join(":");
    if (state.publishedStatusSignature === signature) return;
    state.publishedStatusSignature = signature;
    state.context.db.collection("settings").doc("timeCapsulePublic").set({
      UnlockAt: firebase.firestore.Timestamp.fromDate(unlockAt),
      SubmissionDeadline: firebase.firestore.Timestamp.fromDate(deadline),
      SealedCount: sealedEntries.length,
      ContributorCount: contributorCount,
      UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
      window.clearTimeout(state.statusRetryTimer);
      state.statusRetryTimer = null;
      state.publicStatus = {
        ...(state.publicStatus || {}),
        SealedCount: sealedEntries.length,
        ContributorCount: contributorCount,
        UnlockAt: firebase.firestore.Timestamp.fromDate(unlockAt)
      };
      renderStats();
    }).catch((error) => {
      state.publishedStatusSignature = "";
      console.warn("Time Capsule totals could not be published:", error);
      schedulePublicStatusRetry();
    });
  }

  function schedulePublicStatusRetry() {
    if (!isAdmin() || state.statusRetryTimer) return;
    state.statusRetryTimer = window.setTimeout(() => {
      state.statusRetryTimer = null;
      syncPublicStatus();
    }, 3000);
  }

  function renderComposeState() {
    const available = isSubmissionOpen();
    elements.composeCard.hidden = !available;
    if (!available && !elements.form.hidden) resetForm();
  }

  function renderMainEntries() {
    const unlocked = isUnlocked();
    let entries;
    if (unlocked) {
      entries = state.entries.filter((entry) => entry.Status === "approved");
      elements.entriesTitle.textContent = "Unlocked Entries";
      elements.entriesHint.textContent = "Approved memories from the SFK class.";
    } else {
      entries = state.entries.filter((entry) => entry.AuthorUID === state.context.profile.uid);
      elements.entriesTitle.textContent = "My Sealed Entries";
      elements.entriesHint.textContent = "Only you and the Adviser can view these before unlock day.";
    }
    entries.sort(sortEntriesNewest);
    elements.entries.innerHTML = entries.length
      ? entries.map((entry) => entryCard(entry, false)).join("")
      : `<p class="timeCapsuleEmpty">${unlocked ? "No approved entries yet." : "You have not sealed an entry yet."}</p>`;
    hydrateCapsuleImages(elements.entries);
  }

  function renderReviewEntries() {
    if (!isAdmin()) return;
    const filter = elements.reviewFilter.value;
    const entries = state.entries
      .filter((entry) => filter === "all" || entry.Status === filter)
      .sort(sortEntriesNewest);
    elements.reviewList.innerHTML = entries.length
      ? entries.map((entry) => entryCard(entry, true)).join("")
      : `<p class="timeCapsuleEmpty">No ${escapeHtml(filter)} entries.</p>`;
    hydrateCapsuleImages(elements.reviewList);
  }

  function entryCard(entry, forReview) {
    const imageMarkup = capsuleImageMarkup(entry.ImageURL, `Time capsule photo by ${entry.AuthorName || "SFK"}`, true);
    const ownPending = entry.AuthorUID === state.context.profile.uid
      && entry.Status === "pending"
      && isSubmissionOpen();
    const actions = forReview
      ? `<div class="timeCapsuleEntryActions">
          <button type="button" data-capsule-action="edit" data-entry-id="${entry.id}">Edit</button>
          ${entry.Status !== "approved" ? `<button type="button" data-capsule-action="approve" data-entry-id="${entry.id}">Approve</button>` : ""}
          ${entry.Status !== "rejected" ? `<button type="button" data-capsule-action="reject" data-entry-id="${entry.id}">Reject</button>` : ""}
          <button type="button" data-capsule-action="delete" data-entry-id="${entry.id}">Delete</button>
        </div>`
      : ownPending
        ? `<div class="timeCapsuleEntryActions">
            <button type="button" data-capsule-action="edit" data-entry-id="${entry.id}">Edit</button>
            <button type="button" data-capsule-action="delete" data-entry-id="${entry.id}">Delete</button>
          </div>`
        : "";
    return `<article class="timeCapsuleEntry" data-status="${escapeHtml(entry.Status || "pending")}">
      ${imageMarkup}
      <div class="timeCapsuleEntryBody">
        <div class="timeCapsuleEntryMeta">
          <span>${escapeHtml(ENTRY_TYPES[entry.Type] || "Memory")}</span>
          <b>${escapeHtml(entry.Status || "pending")}</b>
        </div>
        ${entry.Text ? `<p>${escapeHtml(entry.Text)}</p>` : ""}
        <footer><strong>${escapeHtml(entry.AuthorName || "SFK")}</strong><time>${escapeHtml(formatDate(timestampDate(entry.CreatedAt), false))}</time></footer>
        ${actions}
      </div>
    </article>`;
  }

  function toggleCompose() {
    if (!isSubmissionOpen()) return;
    const opening = elements.form.hidden;
    elements.form.hidden = !opening;
    elements.composeToggle.setAttribute("aria-expanded", String(opening));
    elements.composeCard.classList.toggle("is-composing", opening);
    if (opening) {
      updateEntryPrompt();
      updateCharacterCount();
      window.setTimeout(() => elements.text.focus(), 50);
    }
  }

  function updateEntryPrompt() {
    if (!elements.promptText) return;
    elements.promptText.textContent = ENTRY_PROMPTS[elements.type.value] || ENTRY_PROMPTS.memory;
  }

  function updateCharacterCount() {
    if (!elements.characterCount) return;
    elements.characterCount.textContent = `${elements.text.value.length} / 1200`;
  }

  async function submitEntry(event) {
    event.preventDefault();
    if (!state.context || !isSubmissionOpen()) return;

    const text = elements.text.value.trim();
    let imageUrl = getCurrentImageReference();

    if (!text && !imageUrl && !state.selectedImage) {
      elements.formMessage.textContent = "Add a message, attach a photo, or paste a valid photo link.";
      return;
    }

    if (elements.imageUrl.value.trim() && !safeImageUrl(elements.imageUrl.value)) {
      elements.formMessage.textContent = "Photo link must be a valid public HTTPS image link.";
      return;
    }

    elements.submit.disabled = true;
    elements.formMessage.textContent = elements.editId.value ? "Updating entry..." : "Sealing entry...";

    try {
      const collection = state.context.db.collection("timeCapsuleEntries");
      const reference = elements.editId.value ? collection.doc(elements.editId.value) : collection.doc();

      if (state.selectedImage) {
        elements.formMessage.textContent = "Saving photo safely without billing...";
        imageUrl = await saveCapsuleImageNoBilling(reference.id, state.selectedImage);
      }

      const payload = {
        Type: ENTRY_TYPES[elements.type.value] ? elements.type.value : "memory",
        Text: text,
        ImageURL: imageUrl,
        UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (elements.editId.value) {
        await reference.update(payload);
        elements.formMessage.textContent = "Entry updated.";
      } else {
        await reference.set({
          ...payload,
          AuthorUID: state.context.profile.uid,
          AuthorName: state.context.profile.name,
          AuthorRole: state.context.profile.role,
          Status: isAdmin() ? "approved" : "pending",
          CreatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        elements.formMessage.textContent = "Entry sealed.";
      }
      window.setTimeout(resetForm, 450);
    } catch (error) {
      elements.formMessage.textContent = readableError(error);
    } finally {
      elements.submit.disabled = false;
    }
  }

  async function handleEntryAction(event) {
    const button = event.target.closest("[data-capsule-action]");
    if (!button || !state.context) return;
    const entry = state.entries.find((item) => item.id === button.dataset.entryId);
    if (!entry) return;
    const action = button.dataset.capsuleAction;
    if (action === "edit") {
      elements.editId.value = entry.id;
      elements.type.value = ENTRY_TYPES[entry.Type] ? entry.Type : "memory";
      elements.text.value = entry.Text || "";
      setFormImageFromEntry(entry.ImageURL || "");
      elements.cancelEdit.hidden = false;
      elements.submit.textContent = "Update Entry";
      elements.form.hidden = false;
      elements.composeCard.classList.add("is-composing");
      elements.composeToggle.setAttribute("aria-expanded", "true");
      updateEntryPrompt();
      updateCharacterCount();
      elements.form.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (action === "delete" && !window.confirm("Delete this capsule entry?")) return;

    button.disabled = true;
    try {
      const reference = state.context.db.collection("timeCapsuleEntries").doc(entry.id);
      if (action === "approve") {
        await reference.update({
          Status: "approved",
          ReviewedBy: state.context.profile.uid,
          ReviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
          UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === "reject") {
        await reference.update({
          Status: "rejected",
          ReviewedBy: state.context.profile.uid,
          ReviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
          UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === "delete") {
        await reference.delete();
        if (elements.editId.value === entry.id) resetForm();
      }
    } catch (error) {
      window.alert(readableError(error));
      button.disabled = false;
    }
  }

  function resetForm() {
    if (!elements.form) return;
    elements.form.reset();
    elements.editId.value = "";
    clearImageSelection(null, { keepMessage: true });
    elements.cancelEdit.hidden = true;
    elements.submit.textContent = "Seal Entry";
    elements.formMessage.textContent = "";
    elements.form.hidden = true;
    elements.composeCard.classList.remove("is-composing");
    elements.composeToggle.setAttribute("aria-expanded", "false");
    updateEntryPrompt();
    updateCharacterCount();
  }

  function toggleAdminPanel() {
    if (!isAdmin()) return;
    const opening = elements.adminPanel.hidden;
    elements.adminPanel.hidden = !opening;
    elements.adminToggle.textContent = opening ? "Close" : "Manage";
    if (opening) {
      renderReviewEntries();
      elements.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderSettings() {
    const deadline = settingsDate("SubmissionDeadline", DEFAULT_DEADLINE);
    const unlockAt = settingsDate("UnlockAt", DEFAULT_UNLOCK_AT);
    elements.deadline.value = toLocalInputValue(deadline);
    elements.unlockAt.value = toLocalInputValue(unlockAt);
    elements.allowSubmissions.checked = state.settings?.AllowSubmissions !== false;
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!isAdmin()) return;
    const deadline = new Date(elements.deadline.value);
    const unlockAt = new Date(elements.unlockAt.value);
    if (!Number.isFinite(deadline.getTime()) || !Number.isFinite(unlockAt.getTime())) {
      elements.settingsMessage.textContent = "Enter valid dates.";
      return;
    }
    elements.settingsMessage.textContent = "Saving settings...";
    try {
      await state.context.db.collection("timeCapsuleSettings").doc("main").set({
        Title: "SFK Time Capsule",
        SubmissionDeadline: firebase.firestore.Timestamp.fromDate(deadline),
        UnlockAt: firebase.firestore.Timestamp.fromDate(unlockAt),
        AllowSubmissions: elements.allowSubmissions.checked,
        UpdatedBy: state.context.profile.uid,
        UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      elements.settingsMessage.textContent = "Settings saved.";
    } catch (error) {
      elements.settingsMessage.textContent = readableError(error);
    }
  }

  async function unlockNow() {
    if (!isAdmin() || !window.confirm("Unlock the SFK Time Capsule now?")) return;
    elements.settingsMessage.textContent = "Unlocking capsule...";
    await state.context.db.collection("timeCapsuleSettings").doc("main").set({
      UnlockAt: firebase.firestore.FieldValue.serverTimestamp(),
      UpdatedBy: state.context.profile.uid,
      UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch((error) => {
      elements.settingsMessage.textContent = readableError(error);
    });
  }

  function startCountdown() {
    window.clearInterval(state.countdownTimer);
    updateCountdown();
    state.countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    if (!state.context || !state.settings) return;
    if (isUnlocked()) {
      if (elements.eyebrow.textContent !== "CAPSULE UNLOCKED") {
        startEntriesListeners();
        renderAll();
      }
      return;
    }
    const difference = settingsDate("UnlockAt", DEFAULT_UNLOCK_AT).getTime() - Date.now();
    if (difference <= 0) {
      renderAll();
      return;
    }
    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);
    elements.countdown.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s until unlock`;
  }

  function openPresentation() {
    const approved = state.entries.filter((entry) => entry.Status === "approved").sort(sortEntriesOldest);
    if (!approved.length) {
      window.alert("No approved capsule entries yet.");
      return;
    }
    state.presentationEntries = approved;
    state.slideIndex = 0;
    elements.presentation.hidden = false;
    showSlide(0);
  }

  function closePresentation() {
    window.clearInterval(state.presentationTimer);
    state.presentationTimer = null;
    if (elements.presentation) elements.presentation.hidden = true;
    if (elements.play) elements.play.innerHTML = "&#9654;";
  }

  function showSlide(index) {
    const entries = state.presentationEntries;
    if (!entries.length) return;
    state.slideIndex = (index + entries.length) % entries.length;
    const entry = entries[state.slideIndex];
    const imageMarkup = capsuleImageMarkup(entry.ImageURL, "SFK Time Capsule memory", false);
    elements.slideCount.textContent = `${state.slideIndex + 1} / ${entries.length}`;
    elements.slide.innerHTML = `<article class="timeCapsuleSlideCard">
      ${imageMarkup}
      <div>
        <span>${escapeHtml(ENTRY_TYPES[entry.Type] || "Memory")}</span>
        ${entry.Text ? `<p>${escapeHtml(entry.Text)}</p>` : ""}
        <footer>${escapeHtml(entry.AuthorName || "SFK")} · ${escapeHtml(formatDate(timestampDate(entry.CreatedAt), false))}</footer>
      </div>
    </article>`;
    hydrateCapsuleImages(elements.slide);
  }

  function togglePresentationPlayback() {
    if (state.presentationTimer) {
      window.clearInterval(state.presentationTimer);
      state.presentationTimer = null;
      elements.play.innerHTML = "&#9654;";
      return;
    }
    elements.play.innerHTML = "&#10074;&#10074;";
    state.presentationTimer = window.setInterval(() => showSlide(state.slideIndex + 1), 7000);
  }

  async function printCapsule() {
    const original = elements.slide.innerHTML;
    elements.slide.innerHTML = state.presentationEntries.map((entry) => {
      const imageMarkup = capsuleImageMarkup(entry.ImageURL, "SFK Time Capsule memory", false);
      return `<article class="timeCapsuleSlideCard">
        ${imageMarkup}
        <div><span>${escapeHtml(ENTRY_TYPES[entry.Type] || "Memory")}</span>
        ${entry.Text ? `<p>${escapeHtml(entry.Text)}</p>` : ""}
        <footer>${escapeHtml(entry.AuthorName || "SFK")}</footer></div>
      </article>`;
    }).join("");
    await hydrateCapsuleImages(elements.slide);
    document.body.classList.add("timeCapsulePrinting");
    window.print();
    document.body.classList.remove("timeCapsulePrinting");
    elements.slide.innerHTML = original;
  }

  function isAdmin() {
    return state.context?.profile?.role === "admin";
  }

  function isUnlocked() {
    if (!state.settings) return false;
    return Date.now() >= settingsDate("UnlockAt", DEFAULT_UNLOCK_AT).getTime();
  }

  function isSubmissionOpen() {
    if (!state.context || !state.settings) return false;
    if (isAdmin()) return true;
    return state.settings.AllowSubmissions !== false
      && Date.now() <= settingsDate("SubmissionDeadline", DEFAULT_DEADLINE).getTime();
  }

  function settingsDate(field, fallback) {
    return timestampDate(state.settings?.[field]) || new Date(fallback);
  }

  function timestampDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function toLocalInputValue(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function formatDate(date, includeTime) {
    if (!date || !Number.isFinite(date.getTime())) return "Just now";
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {})
    }).format(date);
  }

  function sortEntriesNewest(a, b) {
    return (timestampDate(b.CreatedAt)?.getTime() || 0) - (timestampDate(a.CreatedAt)?.getTime() || 0);
  }

  function sortEntriesOldest(a, b) {
    return (timestampDate(a.CreatedAt)?.getTime() || 0) - (timestampDate(b.CreatedAt)?.getTime() || 0);
  }

  function capsuleImageMarkup(value, alt, lazy) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const ref = parseCapsuleMediaRef(raw);
    if (ref) {
      return `<img data-capsule-image-ref="${escapeHtml(raw)}" alt="${escapeHtml(alt)}" ${lazy ? 'loading="lazy"' : ""} hidden />`;
    }

    const imageUrl = safeImageUrl(raw);
    return imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}" ${lazy ? 'loading="lazy"' : ""} referrerpolicy="no-referrer" />`
      : "";
  }

  async function hydrateCapsuleImages(root) {
    if (!root) return;
    const images = Array.from(root.querySelectorAll("img[data-capsule-image-ref]"));
    await Promise.all(images.map(async (image) => {
      const reference = image.getAttribute("data-capsule-image-ref") || "";
      const src = await resolveCapsuleImage(reference);
      if (src) {
        image.src = src;
        image.hidden = false;
        image.removeAttribute("data-capsule-image-ref");
      } else {
        image.remove();
      }
    }));
  }

  function parseCapsuleMediaRef(value) {
    const raw = String(value || "").trim();
    if (!raw.startsWith(CAPSULE_MEDIA_REF_PREFIX)) return null;
    const id = raw.slice(CAPSULE_MEDIA_REF_PREFIX.length).trim();
    if (!/^[A-Za-z0-9_-]{1,240}$/.test(id)) return null;
    return { id, uri: `${CAPSULE_MEDIA_REF_PREFIX}${id}` };
  }

  async function resolveCapsuleImage(value) {
    const raw = String(value || "").trim();
    const direct = safeImageUrl(raw);
    if (direct) return direct;

    const reference = parseCapsuleMediaRef(raw);
    if (!reference || !state.context?.db) return "";
    if (state.imageCache.has(reference.uri)) return state.imageCache.get(reference.uri);

    try {
      const snapshot = await state.context.db.collection(CAPSULE_MEDIA_COLLECTION).doc(reference.id).get();
      if (!snapshot.exists) return "";
      const data = snapshot.data() || {};
      const mimeType = String(data.MimeType || data.mimeType || "image/jpeg").trim().toLowerCase();
      const base64 = String(data.Data || data.data || "").trim();
      if (!base64 || !mimeType.startsWith("image/")) return "";
      const dataUrl = `data:${mimeType};base64,${base64}`;
      state.imageCache.set(reference.uri, dataUrl);
      return dataUrl;
    } catch (error) {
      console.warn("Unable to load Time Capsule photo:", error);
      return "";
    }
  }

  async function handleImageFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      clearSelectedFileOnly();
      return;
    }

    elements.formMessage.textContent = "Preparing photo preview...";
    try {
      const prepared = await prepareCapsuleImageFile(file);
      state.selectedImage = prepared;
      elements.imageRef.value = "";
      elements.imageUrl.value = "";
      showImagePreview(prepared.previewUrl, prepared.name, "Ready to attach");
      elements.formMessage.textContent = "Photo ready. It will be compressed and saved without billing.";
    } catch (error) {
      clearSelectedFileOnly();
      elements.formMessage.textContent = readableError(error);
    }
  }

  function handleImageUrlInput() {
    if (!elements.imageUrl.value.trim()) {
      if (!elements.imageRef.value) hideImagePreview();
      return;
    }
    state.selectedImage = null;
    elements.imageRef.value = "";
    if (elements.imageFile) elements.imageFile.value = "";
    const imageUrl = safeImageUrl(elements.imageUrl.value);
    if (imageUrl) {
      showImagePreview(imageUrl, "Linked photo", "This link will be used");
    } else {
      hideImagePreview();
    }
  }

  function clearImageSelection(event, options = {}) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    state.selectedImage = null;
    if (elements.imageFile) elements.imageFile.value = "";
    if (elements.imageUrl) elements.imageUrl.value = "";
    if (elements.imageRef) elements.imageRef.value = "";
    hideImagePreview();
    if (!options.keepMessage && elements.formMessage) elements.formMessage.textContent = "Photo removed.";
  }

  function clearSelectedFileOnly() {
    state.selectedImage = null;
    if (elements.imageFile) elements.imageFile.value = "";
  }

  function showImagePreview(src, name, status) {
    if (!elements.imagePreview || !elements.imagePreviewImg) return;
    elements.imagePreview.hidden = false;
    elements.imagePreviewImg.src = src;
    elements.imagePreviewImg.alt = name || "Selected Time Capsule photo";
    if (elements.imagePreviewText) {
      elements.imagePreviewText.textContent = `${status || "Photo selected"}: ${name || "photo"}`;
    }
  }

  function hideImagePreview() {
    if (elements.imagePreview) elements.imagePreview.hidden = true;
    if (elements.imagePreviewImg) {
      elements.imagePreviewImg.removeAttribute("src");
      elements.imagePreviewImg.alt = "";
    }
    if (elements.imagePreviewText) elements.imagePreviewText.textContent = "";
  }

  function setFormImageFromEntry(value) {
    const raw = String(value || "").trim();
    state.selectedImage = null;
    if (elements.imageFile) elements.imageFile.value = "";
    if (parseCapsuleMediaRef(raw)) {
      elements.imageRef.value = raw;
      elements.imageUrl.value = "";
      resolveCapsuleImage(raw).then((src) => {
        if (src && elements.imageRef.value === raw) showImagePreview(src, "Attached photo", "Saved photo");
      });
      return;
    }

    elements.imageRef.value = "";
    elements.imageUrl.value = raw;
    const imageUrl = safeImageUrl(raw);
    if (imageUrl) showImagePreview(imageUrl, "Linked photo", "Saved link");
    else hideImagePreview();
  }

  function getCurrentImageReference() {
    const savedRef = String(elements.imageRef?.value || "").trim();
    if (parseCapsuleMediaRef(savedRef)) return savedRef;
    return safeImageUrl(elements.imageUrl?.value || "");
  }

  async function saveCapsuleImageNoBilling(entryId, prepared) {
    if (!state.context?.db) throw new Error("Firebase is not ready. Refresh and try again.");
    if (!prepared || !prepared.data) throw new Error("Selected photo could not be read. Choose another image.");

    const id = `${safeDocPart(entryId)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 240);
    await state.context.db.collection(CAPSULE_MEDIA_COLLECTION).doc(id).set({
      EntryID: String(entryId || ""),
      OwnerUID: state.context.profile.uid,
      OwnerName: state.context.profile.name,
      OwnerRole: state.context.profile.role,
      Name: prepared.name,
      MimeType: prepared.mimeType,
      Data: prepared.data,
      BytesApprox: Math.ceil(prepared.data.length * 0.75),
      CreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    const uri = `${CAPSULE_MEDIA_REF_PREFIX}${id}`;
    state.imageCache.set(uri, `data:${prepared.mimeType};base64,${prepared.data}`);
    return uri;
  }

  async function prepareCapsuleImageFile(file) {
    if (!file || !String(file.type || "").toLowerCase().startsWith("image/")) {
      throw new Error("Time Capsule no-billing upload supports photos only.");
    }

    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadCapsuleImage(originalDataUrl);
    const blob = await compressCapsuleImage(image);
    if (!blob) throw new Error("Unable to compress this photo. Try a smaller image.");

    const dataUrl = await readFileAsDataUrl(blob);
    const base64 = String(dataUrl).split(",")[1] || "";
    if (!base64 || base64.length > CAPSULE_MEDIA_MAX_BASE64_CHARS) {
      throw new Error("This photo is still too large after compression. Try a smaller screenshot/photo.");
    }

    return {
      name: `${String(file.name || "time-capsule-photo").replace(/\.[^.]+$/, "") || "time-capsule-photo"}.jpg`,
      mimeType: "image/jpeg",
      data: base64,
      previewUrl: dataUrl
    };
  }

  async function compressCapsuleImage(image) {
    const dimensions = [1200, 1000, 820, 680, 560];
    const qualities = [0.72, 0.64, 0.56, 0.48, 0.4, 0.34];
    let fallback = null;

    for (const maxDimension of dimensions) {
      const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * ratio));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) continue;
        fallback = blob;
        if (blob.size <= CAPSULE_TARGET_IMAGE_BYTES) return blob;
      }
    }
    return fallback;
  }

  function readFileAsDataUrl(fileOrBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read selected photo."));
      reader.readAsDataURL(fileOrBlob);
    });
  }

  function loadCapsuleImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to preview this photo. Try a JPG or PNG."));
      image.src = src;
    });
  }

  function safeDocPart(value) {
    return String(value || "capsule")
      .replace(/[^A-Za-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "capsule";
  }

  function safeImageUrl(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^data:image\//i.test(text)) return text;
    if (parseCapsuleMediaRef(text)) return "";

    try {
      const url = new URL(text);
      if (url.protocol !== "https:") return "";
      const driveId = getDriveFileId(url.href);
      if (driveId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w2000`;
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function getDriveFileId(value) {
    const text = String(value || "").trim();
    if (!/drive\.google\.com|drive\.usercontent\.google\.com/i.test(text)) return "";
    const pathMatch = text.match(/\/file\/d\/([^/?#]+)/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]);
    const openMatch = text.match(/[?&]id=([^&#]+)/i);
    if (openMatch) return decodeURIComponent(openMatch[1]);
    const ucMatch = text.match(/\/uc\?[^#]*id=([^&#]+)/i);
    if (ucMatch) return decodeURIComponent(ucMatch[1]);
    return "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function readableError(error) {
    const message = String(error?.message || error || "Something went wrong.");
    if (message.includes("permission")) return "This action is not allowed. Publish the latest Firebase rules.";
    return message.replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\.?$/, "");
  }

  window.SFKTimeCapsule = { open, close, destroy };
})();

(function () {
  "use strict";

  const REACTIONS = ["🫶", "👍", "❤️", "😂", "😮", "😢", "🙏", "✅"];
  const MESSAGE_LIMIT_STEP = 30;
  const OWN_DELETE_WINDOW_MS = 5 * 60 * 1000;
  const STAFF_EMAILS = {
    admin: String(window.SFK_AUTH_ACCOUNTS?.admin || "").trim().toLowerCase(),
    officer: String(window.SFK_AUTH_ACCOUNTS?.officer || "").trim().toLowerCase()
  };

  let chatApp = null;
  let auth = null;
  let db = null;
  let currentProfile = null;
  let selectedRole = "student";
  let messageLimit = MESSAGE_LIMIT_STEP;
  let messagesUnsubscribe = null;
  let typingUnsubscribe = null;
  let currentMessages = [];
  let replyTarget = null;
  let reactionMessageId = "";
  let longPressTimer = null;
  let typingTimer = null;
  let typingClearTimer = null;
  let messageGesture = null;

  const elements = {};

  document.addEventListener("DOMContentLoaded", initClassChat);

  function initClassChat() {
    cacheElements();
    if (!elements.open || !elements.layer) return;

    elements.open.addEventListener("click", openChat);
    elements.layer.querySelectorAll("[data-chat-close]").forEach((button) => {
      button.addEventListener("click", closeChat);
    });
    elements.logout.addEventListener("click", leaveChat);
    elements.roleTabs.forEach((button) => {
      button.addEventListener("click", () => selectRole(button.dataset.chatRole));
    });
    elements.studentForm.addEventListener("submit", signInStudent);
    elements.staffForm.addEventListener("submit", signInStaff);
    elements.changePinForm.addEventListener("submit", saveFirstPin);
    elements.composer.addEventListener("submit", sendMessage);
    elements.input.addEventListener("input", handleComposerInput);
    elements.replyCancel.addEventListener("click", clearReply);
    elements.loadEarlier.addEventListener("click", loadEarlier);
    elements.messages.addEventListener("click", handleMessageClick);
    elements.messages.addEventListener("dblclick", handleMessageDoubleClick);
    elements.messages.addEventListener("pointerdown", startLongPress);
    elements.messages.addEventListener("pointerup", finishMessageGesture);
    elements.messages.addEventListener("pointercancel", cancelMessageGesture);
    elements.messages.addEventListener("pointermove", moveMessageGesture);
    document.addEventListener("click", handleOutsideReactionTray);
    document.addEventListener("keydown", handleChatKeydown);
  }

  function cacheElements() {
    elements.open = document.getElementById("classChatOpen");
    elements.unread = document.getElementById("classChatUnread");
    elements.layer = document.getElementById("classChatLayer");
    elements.status = document.getElementById("classChatStatus");
    elements.logout = document.getElementById("classChatLogout");
    elements.login = document.getElementById("classChatLogin");
    elements.room = document.getElementById("classChatRoom");
    elements.roleTabs = Array.from(document.querySelectorAll("[data-chat-role]"));
    elements.roleTabsWrap = document.querySelector(".classChatRoleTabs");
    elements.studentForm = document.getElementById("classChatStudentForm");
    elements.staffForm = document.getElementById("classChatStaffForm");
    elements.changePinForm = document.getElementById("classChatChangePinForm");
    elements.studentId = document.getElementById("classChatStudentId");
    elements.studentPin = document.getElementById("classChatStudentPin");
    elements.staffRole = document.getElementById("classChatStaffRole");
    elements.staffPin = document.getElementById("classChatStaffPin");
    elements.newPin = document.getElementById("classChatNewPin");
    elements.confirmPin = document.getElementById("classChatConfirmPin");
    elements.loginMessage = document.getElementById("classChatLoginMessage");
    elements.messages = document.getElementById("classChatMessages");
    elements.loadEarlier = document.getElementById("classChatLoadEarlier");
    elements.typing = document.getElementById("classChatTyping");
    elements.reply = document.getElementById("classChatReply");
    elements.replyName = document.getElementById("classChatReplyName");
    elements.replyText = document.getElementById("classChatReplyText");
    elements.replyCancel = document.getElementById("classChatReplyCancel");
    elements.composer = document.getElementById("classChatComposer");
    elements.input = document.getElementById("classChatInput");
    elements.send = document.getElementById("classChatSend");
    elements.reactionTray = document.getElementById("classChatReactionTray");
  }

  function ensureFirebase() {
    if (!window.firebase || !window.SFK_FIREBASE_READY) {
      throw new Error("Class chat is not configured yet.");
    }

    try {
      chatApp = firebase.app("sfkClassChat");
    } catch (error) {
      chatApp = firebase.initializeApp(window.SFK_FIREBASE_CONFIG, "sfkClassChat");
    }

    auth = chatApp.auth();
    db = chatApp.firestore();
  }

  async function openChat() {
    elements.layer.hidden = false;
    document.body.classList.add("classChatIsOpen");
    elements.loginMessage.textContent = "";

    try {
      ensureFirebase();
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      if (auth.currentUser) {
        await restoreCurrentProfile(auth.currentUser);
      } else {
        showLogin();
        window.setTimeout(() => elements.studentId.focus(), 80);
      }
    } catch (error) {
      showLogin();
      elements.loginMessage.textContent = readableError(error);
    }
  }

  async function closeChat() {
    elements.layer.hidden = true;
    document.body.classList.remove("classChatIsOpen");
    hideReactionTray();
    clearReply();
    stopRealtimeListeners();
    await clearTyping();

    if (auth?.currentUser) {
      await auth.signOut().catch(() => {});
    }
    currentProfile = null;
    showLogin();
  }

  async function leaveChat() {
    await closeChat();
  }

  function showLogin() {
    elements.login.hidden = false;
    elements.room.hidden = true;
    elements.logout.hidden = true;
    elements.status.textContent = "Sign in to join the conversation";
    elements.messages.innerHTML = "";
    elements.studentPin.value = "";
    elements.staffPin.value = "";
    elements.newPin.value = "";
    elements.confirmPin.value = "";
    elements.changePinForm.hidden = true;
    elements.roleTabsWrap.hidden = false;
    selectRole(selectedRole);
  }

  function showRoom() {
    elements.login.hidden = true;
    elements.room.hidden = false;
    elements.logout.hidden = false;
    elements.status.textContent = `${currentProfile.name} · Class member`;
    elements.loginMessage.textContent = "";
    startRealtimeListeners();
    window.setTimeout(() => elements.input.focus(), 80);
  }

  function selectRole(role) {
    selectedRole = role === "staff" ? "staff" : "student";
    elements.roleTabs.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.chatRole === selectedRole);
    });
    elements.studentForm.hidden = selectedRole !== "student";
    elements.staffForm.hidden = selectedRole !== "staff";
    elements.changePinForm.hidden = true;
    elements.loginMessage.textContent = "";
  }

  async function signInStudent(event) {
    event.preventDefault();
    const studentId = normalizeStudentId(elements.studentId.value);
    const pin = elements.studentPin.value.trim();

    if (!studentId || pin.length < 6) {
      elements.loginMessage.textContent = "Enter your Student ID and assigned 6-digit Chat PIN.";
      return;
    }

    await performLogin(async () => {
      ensureFirebase();
      const credential = await auth.signInWithEmailAndPassword(studentEmail(studentId), pin);
      const snapshot = await db.collection("chatProfiles").doc(credential.user.uid).get();
      if (!snapshot.exists) throw new Error("Your chat profile has not been activated.");

      const profile = snapshot.data() || {};
      if (String(profile.StudentID || "") !== studentId || profile.Active === false) {
        throw new Error("This chat account is not active.");
      }
      if (profile.Blocked === true) {
        throw new Error("This chat account is blocked. Please contact the adviser.");
      }

      currentProfile = {
        uid: credential.user.uid,
        studentId,
        name: String(profile.Name || "Student").trim(),
        role: "student",
        mutedUntil: timestampToMillis(profile.MutedUntil),
        mustChangePin: profile.MustChangePin === true
      };
    });
  }

  async function signInStaff(event) {
    event.preventDefault();
    const role = elements.staffRole.value === "officer" ? "officer" : "admin";
    const email = STAFF_EMAILS[role];
    const pin = elements.staffPin.value.trim();

    if (!email || !pin) {
      elements.loginMessage.textContent = "Enter the account PIN.";
      return;
    }

    await performLogin(async () => {
      ensureFirebase();
      const credential = await auth.signInWithEmailAndPassword(email, pin);
      const signedEmail = String(credential.user.email || "").toLowerCase();
      if (signedEmail !== email) throw new Error("This account is not allowed.");

      currentProfile = {
        uid: credential.user.uid,
        studentId: "",
        name: role === "admin" ? "SFK Adviser" : "SFK Officer",
        role,
        mutedUntil: 0
      };
    });
  }

  async function performLogin(loginAction) {
    elements.loginMessage.textContent = "Opening class chat...";
    setLoginDisabled(true);
    try {
      await loginAction();
      if (currentProfile?.mustChangePin) showFirstPinChange();
      else showRoom();
    } catch (error) {
      await auth?.signOut().catch(() => {});
      currentProfile = null;
      elements.loginMessage.textContent = readableError(error);
    } finally {
      setLoginDisabled(false);
    }
  }

  async function restoreCurrentProfile(user) {
    const email = String(user.email || "").toLowerCase();
    if (email === STAFF_EMAILS.admin || email === STAFF_EMAILS.officer) {
      currentProfile = {
        uid: user.uid,
        studentId: "",
        name: email === STAFF_EMAILS.admin ? "SFK Adviser" : "SFK Officer",
        role: email === STAFF_EMAILS.admin ? "admin" : "officer",
        mutedUntil: 0
      };
      showRoom();
      return;
    }

    const snapshot = await db.collection("chatProfiles").doc(user.uid).get();
    const profile = snapshot.data() || {};
    if (!snapshot.exists || profile.Active === false || profile.Blocked === true) {
      await auth.signOut();
      showLogin();
      return;
    }

    currentProfile = {
      uid: user.uid,
      studentId: String(profile.StudentID || ""),
      name: String(profile.Name || "Student"),
      role: "student",
      mutedUntil: timestampToMillis(profile.MutedUntil),
      mustChangePin: profile.MustChangePin === true
    };
    if (currentProfile.mustChangePin) showFirstPinChange();
    else showRoom();
  }

  function showFirstPinChange() {
    elements.studentForm.hidden = true;
    elements.staffForm.hidden = true;
    elements.changePinForm.hidden = false;
    elements.roleTabsWrap.hidden = true;
    elements.loginMessage.textContent = "";
    elements.status.textContent = "Create your personal Chat PIN";
    window.setTimeout(() => elements.newPin.focus(), 80);
  }

  async function saveFirstPin(event) {
    event.preventDefault();
    const newPin = elements.newPin.value.trim();
    const confirmPin = elements.confirmPin.value.trim();

    if (!/^\d{6}$/.test(newPin)) {
      elements.loginMessage.textContent = "Your new PIN must contain exactly 6 digits.";
      return;
    }
    if (newPin === "123456") {
      elements.loginMessage.textContent = "Choose a PIN different from the default 123456.";
      return;
    }
    if (newPin !== confirmPin) {
      elements.loginMessage.textContent = "The two PIN entries do not match.";
      return;
    }

    const button = elements.changePinForm.querySelector("button");
    button.disabled = true;
    elements.loginMessage.textContent = "Saving your personal PIN...";
    try {
      await auth.currentUser.updatePassword(newPin);
      await db.collection("chatProfiles").doc(currentProfile.uid).update({
        MustChangePin: false,
        UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      currentProfile.mustChangePin = false;
      elements.changePinForm.hidden = true;
      elements.roleTabsWrap.hidden = false;
      showRoom();
    } catch (error) {
      elements.loginMessage.textContent = readableError(error);
    } finally {
      button.disabled = false;
    }
  }

  function setLoginDisabled(disabled) {
    elements.studentForm.querySelectorAll("input, button").forEach((node) => { node.disabled = disabled; });
    elements.staffForm.querySelectorAll("input, select, button").forEach((node) => { node.disabled = disabled; });
  }

  function startRealtimeListeners() {
    stopRealtimeListeners();
    messageLimit = Math.max(MESSAGE_LIMIT_STEP, messageLimit);

    messagesUnsubscribe = db.collection("chatMessages")
      .orderBy("CreatedAt", "desc")
      .limit(messageLimit)
      .onSnapshot((snapshot) => {
        const wasNearBottom = isNearBottom();
        currentMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).reverse();
        renderMessages();
        markRead();
        if (wasNearBottom || currentMessages.some((message) => message.SenderUID === currentProfile.uid)) {
          scrollToBottom();
        }
      }, (error) => {
        elements.messages.innerHTML = `<p class="classChatDay">${escapeHtml(readableError(error))}</p>`;
      });

    typingUnsubscribe = db.collection("chatTyping").onSnapshot((snapshot) => {
      const now = Date.now();
      const names = snapshot.docs
        .map((doc) => doc.data() || {})
        .filter((entry) => entry.UID !== currentProfile.uid && timestampToMillis(entry.ExpiresAt) > now)
        .map((entry) => String(entry.Name || "Someone"));

      if (!names.length) {
        elements.typing.hidden = true;
        return;
      }
      elements.typing.textContent = names.length === 1
        ? `${names[0]} is typing...`
        : `${names.slice(0, 2).join(" and ")} are typing...`;
      elements.typing.hidden = false;
    }, () => {
      elements.typing.hidden = true;
    });
  }

  function stopRealtimeListeners() {
    if (messagesUnsubscribe) messagesUnsubscribe();
    if (typingUnsubscribe) typingUnsubscribe();
    messagesUnsubscribe = null;
    typingUnsubscribe = null;
  }

  function loadEarlier() {
    messageLimit += MESSAGE_LIMIT_STEP;
    startRealtimeListeners();
  }

  function renderMessages() {
    if (!currentMessages.length) {
      elements.messages.innerHTML = `<p class="classChatDay">No messages yet. Start the class conversation.</p>`;
      return;
    }

    let lastDay = "";
    elements.messages.innerHTML = currentMessages.map((message, index) => {
      const previous = currentMessages[index - 1];
      const createdAt = timestampToDate(message.CreatedAt);
      const day = formatDayLabel(createdAt);
      const showDay = day !== lastDay;
      lastDay = day;

      const own = message.SenderUID === currentProfile.uid;
      const grouped = previous
        && previous.SenderUID === message.SenderUID
        && timestampToMillis(message.CreatedAt) - timestampToMillis(previous.CreatedAt) < 3 * 60 * 1000
        && formatDayLabel(timestampToDate(previous.CreatedAt)) === day;
      const canDeleteOwn = own && Date.now() - createdAt.getTime() <= OWN_DELETE_WINDOW_MS;
      const canModerate = currentProfile.role === "admin";
      const removed = message.Removed === true;

      const replySource = message.ReplyToID ? findMessage(message.ReplyToID) : null;
      const replyIsUnavailable = removed
        || message.ReplySourceRemoved === true
        || replySource?.Removed === true;
      const quoted = message.ReplyToID && !replyIsUnavailable ? `
        <div class="classChatQuoted" data-quoted-message-id="${message.ReplyToID}">
          <strong>${escapeHtml(message.ReplyToName || "Message")}</strong>
          <span>${escapeHtml(message.ReplyToText || "Original message")}</span>
        </div>` : "";

      const actionButtons = !removed ? `
        <div class="classChatMessageActions">
          <button type="button" data-chat-action="reply" data-message-id="${message.id}">Reply</button>
          <button type="button" data-chat-action="react" data-message-id="${message.id}">React</button>
          ${(canDeleteOwn || canModerate) ? `<button type="button" data-chat-action="delete" data-message-id="${message.id}">Remove</button>` : ""}
        </div>` : "";

      return `
        ${showDay ? `<div class="classChatDay">${escapeHtml(day)}</div>` : ""}
        <article class="classChatMessage ${own ? "is-own" : ""} ${grouped ? "is-grouped" : "is-first"} ${removed ? "has-removed" : ""}"
                 data-message-id="${message.id}">
          ${own ? "" : `<span class="classChatMessageAvatar">${escapeHtml(initials(message.SenderName))}</span>`}
          <div class="classChatBubbleWrap">
            ${own ? "" : `<p class="classChatSender">${escapeHtml(message.SenderName || "Student")}</p>`}
            <div class="classChatBubble">
              ${quoted}
              <span class="${removed ? "classChatRemoved" : ""}">${escapeHtml(removed ? "Message removed by the Adviser." : message.Text || "")}</span>
            </div>
            <div class="classChatReactionSummary" data-reactions-for="${message.id}"></div>
            <div class="classChatMeta">${formatTime(createdAt)}</div>
            ${actionButtons}
          </div>
        </article>`;
    }).join("");

    currentMessages.forEach((message) => loadReactions(message.id));
    verifyQuotedMessages();
  }

  async function verifyQuotedMessages() {
    const quotedItems = Array.from(elements.messages.querySelectorAll("[data-quoted-message-id]"));
    const missingIds = [...new Set(quotedItems
      .map((node) => node.dataset.quotedMessageId)
      .filter((id) => id && !findMessage(id)))];

    await Promise.all(missingIds.map(async (messageId) => {
      try {
        const snapshot = await db.collection("chatMessages").doc(messageId).get();
        if (!snapshot.exists || snapshot.data()?.Removed === true) {
          elements.messages
            .querySelectorAll(`[data-quoted-message-id="${cssEscape(messageId)}"]`)
            .forEach((node) => node.remove());
        }
      } catch (error) {
        elements.messages
          .querySelectorAll(`[data-quoted-message-id="${cssEscape(messageId)}"]`)
          .forEach((node) => node.remove());
      }
    }));
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = elements.input.value.trim();
    if (!text || !currentProfile) return;

    if (currentProfile.mutedUntil > Date.now()) {
      window.alert(`Messaging is muted until ${new Date(currentProfile.mutedUntil).toLocaleString()}.`);
      return;
    }

    elements.send.disabled = true;
    try {
      const payload = {
        Text: text,
        SenderUID: currentProfile.uid,
        SenderName: currentProfile.name,
        SenderRole: currentProfile.role,
        Removed: false,
        CreatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (replyTarget) {
        payload.ReplyToID = replyTarget.id;
        payload.ReplyToName = replyTarget.SenderName || "Message";
        payload.ReplyToText = String(replyTarget.Text || "").slice(0, 100);
      }

      await db.collection("chatMessages").add(payload);
      elements.input.value = "";
      resizeComposer();
      clearReply();
      await clearTyping();
      scrollToBottom();
    } catch (error) {
      window.alert(readableError(error));
    } finally {
      elements.send.disabled = false;
      elements.input.focus();
    }
  }

  function handleComposerInput() {
    resizeComposer();
    scheduleTyping();
  }

  function resizeComposer() {
    elements.input.style.height = "auto";
    elements.input.style.height = `${Math.min(elements.input.scrollHeight, 112)}px`;
  }

  function scheduleTyping() {
    if (!currentProfile || !elements.input.value.trim()) {
      clearTyping();
      return;
    }

    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(async () => {
      const expiresAt = firebase.firestore.Timestamp.fromMillis(Date.now() + 7000);
      await db.collection("chatTyping").doc(currentProfile.uid).set({
        UID: currentProfile.uid,
        Name: currentProfile.name,
        ExpiresAt: expiresAt
      }).catch(() => {});
    }, 280);

    window.clearTimeout(typingClearTimer);
    typingClearTimer = window.setTimeout(clearTyping, 6500);
  }

  async function clearTyping() {
    window.clearTimeout(typingTimer);
    window.clearTimeout(typingClearTimer);
    if (db && currentProfile?.uid) {
      await db.collection("chatTyping").doc(currentProfile.uid).delete().catch(() => {});
    }
  }

  function handleMessageClick(event) {
    const quoted = event.target.closest("[data-quoted-message-id]");
    if (quoted) {
      focusOriginalMessage(quoted.dataset.quotedMessageId);
      return;
    }

    const button = event.target.closest("[data-chat-action]");
    if (!button) return;
    const message = findMessage(button.dataset.messageId);
    if (!message) return;

    if (button.dataset.chatAction === "reply") setReply(message);
    if (button.dataset.chatAction === "react") showReactionTray(message.id, button);
    if (button.dataset.chatAction === "delete") removeMessage(message);
  }

  function focusOriginalMessage(messageId) {
    const original = elements.messages.querySelector(`.classChatMessage[data-message-id="${cssEscape(messageId)}"]`);
    if (!original) return;
    original.scrollIntoView({ behavior: "smooth", block: "center" });
    original.classList.remove("is-highlighted");
    window.requestAnimationFrame(() => original.classList.add("is-highlighted"));
    window.setTimeout(() => original.classList.remove("is-highlighted"), 1100);
  }

  function handleMessageDoubleClick(event) {
    const article = event.target.closest(".classChatMessage");
    if (!article || event.target.closest("button")) return;
    showQuickHeart(article);
    reactToMessage(article.dataset.messageId, "🫶");
  }

  function startLongPress(event) {
    if (event.target.closest("button")) return;
    const article = event.target.closest(".classChatMessage");
    if (!article) return;
    messageGesture = {
      article,
      messageId: article.dataset.messageId,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      translated: false
    };
    if (event.pointerType === "mouse") return;
    window.clearTimeout(longPressTimer);
    longPressTimer = window.setTimeout(() => {
      showReactionTray(article.dataset.messageId, article.querySelector(".classChatBubble"));
      navigator.vibrate?.(24);
    }, 520);
  }

  function moveMessageGesture(event) {
    if (!messageGesture || messageGesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - messageGesture.startX;
    const dy = event.clientY - messageGesture.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) window.clearTimeout(longPressTimer);
    if (messageGesture.pointerType === "mouse" || Math.abs(dx) <= Math.abs(dy)) return;

    const message = findMessage(messageGesture.messageId);
    if (!message || message.Removed) return;
    const own = message.SenderUID === currentProfile.uid;
    const direction = own ? -1 : 1;
    const distance = Math.min(54, Math.max(0, dx * direction));
    if (!distance) return;

    event.preventDefault();
    messageGesture.translated = true;
    messageGesture.article.style.setProperty("--chat-swipe", `${distance * direction}px`);
    messageGesture.article.classList.toggle("is-reply-ready", distance >= 46);
  }

  function finishMessageGesture(event) {
    window.clearTimeout(longPressTimer);
    if (!messageGesture || messageGesture.pointerId !== event.pointerId) return;
    const gesture = messageGesture;
    messageGesture = null;
    const shouldReply = gesture.article.classList.contains("is-reply-ready");
    resetGestureArticle(gesture.article);
    if (shouldReply) {
      const message = findMessage(gesture.messageId);
      if (message && !message.Removed) {
        setReply(message);
        navigator.vibrate?.(18);
      }
    }
  }

  function cancelMessageGesture() {
    window.clearTimeout(longPressTimer);
    if (messageGesture?.article) resetGestureArticle(messageGesture.article);
    messageGesture = null;
  }

  function resetGestureArticle(article) {
    article.classList.remove("is-reply-ready");
    article.style.removeProperty("--chat-swipe");
  }

  function setReply(message) {
    if (message.Removed) return;
    replyTarget = message;
    elements.replyName.textContent = message.SenderName || "Message";
    elements.replyText.textContent = message.Text || "";
    elements.reply.hidden = false;
    elements.input.focus();
  }

  function clearReply() {
    replyTarget = null;
    elements.reply.hidden = true;
  }

  function showReactionTray(messageId, anchor) {
    const message = findMessage(messageId);
    if (!message || message.Removed) return;
    reactionMessageId = messageId;
    const own = message.SenderUID === currentProfile.uid;
    const canDeleteOwn = own && Date.now() - timestampToMillis(message.CreatedAt) <= OWN_DELETE_WINDOW_MS;
    const canRemove = currentProfile.role === "admin" || canDeleteOwn;
    elements.reactionTray.innerHTML = `
      <div class="classChatReactionChoices">
        ${REACTIONS.map((emoji) => (
          `<button type="button" data-chat-emoji="${emoji}" aria-label="React ${emoji}">${emoji}</button>`
        )).join("")}
      </div>
      <div class="classChatTrayActions">
        <button type="button" data-chat-tray-action="reply"><span aria-hidden="true">&#8617;</span> Reply</button>
        ${canRemove ? `<button type="button" data-chat-tray-action="delete"><span aria-hidden="true">&#9003;</span> Remove</button>` : ""}
      </div>`;

    elements.reactionTray.querySelectorAll("[data-chat-emoji]").forEach((button) => {
      button.addEventListener("click", () => reactToMessage(messageId, button.dataset.chatEmoji));
    });
    elements.reactionTray.querySelectorAll("[data-chat-tray-action]").forEach((button) => {
      button.addEventListener("click", () => {
        hideReactionTray();
        if (button.dataset.chatTrayAction === "reply") setReply(message);
        if (button.dataset.chatTrayAction === "delete") removeMessage(message);
      });
    });

    elements.reactionTray.hidden = false;
    const panelRect = elements.layer.querySelector(".classChatPanel").getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const trayWidth = Math.min(360, panelRect.width - 24);
    const left = Math.max(12, Math.min(anchorRect.left - panelRect.left, panelRect.width - trayWidth - 12));
    const top = Math.max(74, anchorRect.top - panelRect.top - 112);
    elements.reactionTray.style.left = `${left}px`;
    elements.reactionTray.style.top = `${top}px`;
  }

  function hideReactionTray() {
    reactionMessageId = "";
    elements.reactionTray.hidden = true;
  }

  function showQuickHeart(article) {
    const bubble = article.querySelector(".classChatBubble");
    if (!bubble) return;
    const heart = document.createElement("span");
    heart.className = "classChatQuickHeart";
    heart.textContent = "🫶";
    bubble.appendChild(heart);
    window.setTimeout(() => heart.remove(), 620);
  }

  function handleOutsideReactionTray(event) {
    if (elements.reactionTray.hidden) return;
    if (!elements.reactionTray.contains(event.target) && !event.target.closest("[data-chat-action='react']")) {
      hideReactionTray();
    }
  }

  async function reactToMessage(messageId, emoji) {
    if (!REACTIONS.includes(emoji) || !currentProfile) return;
    hideReactionTray();

    const ref = db.collection("chatMessages").doc(messageId).collection("reactions").doc(currentProfile.uid);
    try {
      const existing = await ref.get();
      if (existing.exists && existing.data()?.Emoji === emoji) {
        await ref.delete();
      } else {
        await ref.set({
          Emoji: emoji,
          UID: currentProfile.uid,
          Name: currentProfile.name,
          UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      await loadReactions(messageId);
    } catch (error) {
      window.alert(readableError(error));
    }
  }

  async function loadReactions(messageId) {
    const container = elements.messages.querySelector(`[data-reactions-for="${cssEscape(messageId)}"]`);
    if (!container || !db) return;

    try {
      const snapshot = await db.collection("chatMessages").doc(messageId).collection("reactions").get();
      const groups = new Map();
      snapshot.docs.forEach((doc) => {
        const reaction = doc.data() || {};
        if (!REACTIONS.includes(reaction.Emoji)) return;
        if (!groups.has(reaction.Emoji)) groups.set(reaction.Emoji, []);
        groups.get(reaction.Emoji).push({ uid: doc.id, name: reaction.Name || "Classmate" });
      });

      container.innerHTML = Array.from(groups.entries()).map(([emoji, users]) => {
        const mine = users.some((user) => user.uid === currentProfile.uid);
        const names = users.map((user) => user.name).join(", ");
        return `<button type="button" class="classChatReactionChip ${mine ? "is-mine" : ""}"
                  data-existing-reaction="${emoji}" data-message-id="${messageId}"
                  title="${escapeHtml(names)}">${emoji} ${users.length}</button>`;
      }).join("");

      container.querySelectorAll("[data-existing-reaction]").forEach((button) => {
        button.addEventListener("click", () => {
          reactToMessage(button.dataset.messageId, button.dataset.existingReaction);
        });
      });
    } catch (error) {
      container.innerHTML = "";
    }
  }

  async function removeMessage(message) {
    const own = message.SenderUID === currentProfile.uid;
    const canDeleteOwn = own && Date.now() - timestampToMillis(message.CreatedAt) <= OWN_DELETE_WINDOW_MS;
    const canModerate = currentProfile.role === "admin";
    if (!canDeleteOwn && !canModerate) return;
    if (!window.confirm("Remove this message from the class chat?")) return;

    const ref = db.collection("chatMessages").doc(message.id);
    try {
      if (canModerate && !own) {
        await db.collection("chatModerationLogs").add({
          Action: "MESSAGE_REMOVED",
          MessageID: message.id,
          OriginalText: message.Text || "",
          SenderUID: message.SenderUID || "",
          SenderName: message.SenderName || "",
          ModeratorUID: currentProfile.uid,
          ModeratorName: currentProfile.name,
          CreatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      await ref.update({
        Text: "",
        Removed: true,
        RemovedBy: currentProfile.uid,
        RemovedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (canModerate) {
        const replies = await db.collection("chatMessages").where("ReplyToID", "==", message.id).get();
        if (!replies.empty) {
          const batch = db.batch();
          replies.docs.forEach((replyDoc) => {
            batch.update(replyDoc.ref, {
              ReplyToText: "",
              ReplySourceRemoved: true
            });
          });
          await batch.commit();
        }
      }
    } catch (error) {
      window.alert(readableError(error));
    }
  }

  async function markRead() {
    if (!currentProfile || !db) return;
    await db.collection("chatReadReceipts").doc(currentProfile.uid).set({
      UID: currentProfile.uid,
      Name: currentProfile.name,
      LastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }

  function findMessage(id) {
    return currentMessages.find((message) => message.id === id);
  }

  function isNearBottom() {
    const node = elements.messages;
    return !node || node.scrollHeight - node.scrollTop - node.clientHeight < 100;
  }

  function scrollToBottom() {
    window.requestAnimationFrame(() => {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    });
  }

  function handleChatKeydown(event) {
    if (event.key === "Escape" && !elements.layer.hidden) closeChat();
    if (event.key === "Enter" && !event.shiftKey && document.activeElement === elements.input) {
      event.preventDefault();
      elements.composer.requestSubmit();
    }
  }

  function normalizeStudentId(value) {
    return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
  }

  function studentEmail(studentId) {
    const encoded = Array.from(studentId)
      .map((character) => character.codePointAt(0).toString(16).padStart(2, "0"))
      .join("");
    return `student.${encoded}@sfk-classboard.app`;
  }

  function initials(name) {
    return String(name || "S")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "S";
  }

  function timestampToMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function timestampToDate(value) {
    const millis = timestampToMillis(value);
    return millis ? new Date(millis) : new Date();
  }

  function formatDayLabel(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatTime(date) {
    return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
  }

  function readableError(error) {
    const code = String(error?.code || "");
    if (code.includes("wrong-password") || code.includes("invalid-credential") || code.includes("user-not-found")) {
      return "Student ID or PIN is incorrect.";
    }
    if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
    if (code.includes("permission-denied")) return "This account is not allowed to access the class chat.";
    if (code.includes("network-request-failed")) return "No connection. Check your internet and try again.";
    return String(error?.message || "Class chat could not be opened.").replace(/^Firebase:\s*/i, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value);
    return String(value).replace(/["\\]/g, "\\$&");
  }
})();

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", injectChatRosterTool);

  function injectChatRosterTool() {
    const grid = document.querySelector(".adminGrid");
    if (!grid || document.getElementById("chatRosterImport")) return;

    const card = document.createElement("div");
    card.className = "formCard chatRosterCard";
    card.innerHTML = `
      <h2>Class Chat Students</h2>
      <p class="fieldHint">One student per line: <strong>Student ID | Full Name</strong>. New accounts use the default PIN <strong>123456</strong> and must change it on first login.</p>
      <label for="chatRosterImport">Add student chat accounts</label>
      <textarea id="chatRosterImport" rows="8" placeholder="20260001 | Juan Dela Cruz"></textarea>
      <button id="chatRosterCreate" type="button">Create Chat Accounts</button>
      <small id="chatRosterMessage" class="fieldHint"></small>
      <div class="chatRosterToolbar">
        <button id="chatRosterRefresh" type="button">Refresh Student List</button>
      </div>
      <div id="chatRosterList" class="chatRosterList"></div>
      <div class="chatDangerZone">
        <div>
          <strong>Clear class conversation</strong>
          <small>Deletes messages, reactions, poll votes, scheduled posts, and saved copies. Student accounts are not affected.</small>
        </div>
        <button id="chatClearAll" type="button">Clear Entire Chat</button>
      </div>
    `;
    grid.appendChild(card);

    document.getElementById("chatRosterCreate").addEventListener("click", createChatAccounts);
    document.getElementById("chatRosterRefresh").addEventListener("click", loadChatRoster);
    document.getElementById("chatClearAll").addEventListener("click", clearEntireChat);
  }

  async function clearEntireChat() {
    const button = document.getElementById("chatClearAll");
    const message = document.getElementById("chatRosterMessage");
    const confirmed = window.confirm(
      "Delete every class chat message and reaction? Student accounts will remain."
    );
    if (!confirmed) return;

    const phrase = window.prompt('Type DELETE ALL to confirm. This cannot be undone.');
    if (String(phrase || "").trim().toUpperCase() !== "DELETE ALL") {
      message.textContent = "Chat cleanup cancelled.";
      return;
    }

    button.disabled = true;
    message.textContent = "Clearing the class conversation...";
    try {
      const { db } = getServices();
      let deletedMessages = 0;

      while (true) {
        const snapshot = await db.collection("chatMessages").limit(50).get();
        if (snapshot.empty) break;

        for (const messageDoc of snapshot.docs) {
          const reactions = await messageDoc.ref.collection("reactions").get();
          const votes = await messageDoc.ref.collection("votes").get();
          const refs = reactions.docs.map((doc) => doc.ref)
            .concat(votes.docs.map((doc) => doc.ref));
          refs.push(messageDoc.ref);
          await deleteRefsInBatches(db, refs);
          deletedMessages += 1;
          message.textContent = `Clearing chat... ${deletedMessages} messages removed`;
        }
      }

      await deleteFlatCollection(db, "chatTyping");
      await deleteFlatCollection(db, "chatReadReceipts");
      await deleteFlatCollection(db, "chatScheduled");
      const profiles = await db.collection("chatProfiles").get();
      for (const profile of profiles.docs) {
        const saved = await db.collection("chatSaved").doc(profile.id).collection("items").get();
        await deleteRefsInBatches(db, saved.docs.map((doc) => doc.ref));
      }
      message.textContent = `Class conversation cleared. ${deletedMessages} message${deletedMessages === 1 ? "" : "s"} removed.`;
    } catch (error) {
      message.textContent = friendlyError(error);
    } finally {
      button.disabled = false;
    }
  }

  async function deleteFlatCollection(db, collectionName) {
    while (true) {
      const snapshot = await db.collection(collectionName).limit(400).get();
      if (snapshot.empty) return;
      await deleteRefsInBatches(db, snapshot.docs.map((doc) => doc.ref));
    }
  }

  async function deleteRefsInBatches(db, refs) {
    for (let index = 0; index < refs.length; index += 400) {
      const batch = db.batch();
      refs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  }

  async function createChatAccounts() {
    const input = document.getElementById("chatRosterImport");
    const button = document.getElementById("chatRosterCreate");
    const message = document.getElementById("chatRosterMessage");
    const entries = parseEntries(input.value);

    if (!entries.length) {
      message.textContent = "Enter at least one valid Student ID | Full Name entry.";
      return;
    }

    button.disabled = true;
    message.textContent = `Creating 0 of ${entries.length} accounts...`;
    let created = 0;
    const errors = [];

    try {
      const services = getServices();
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        message.textContent = `Creating ${index + 1} of ${entries.length}: ${entry.name}`;
        try {
          const credential = await services.provisionAuth.createUserWithEmailAndPassword(
            studentEmail(entry.studentId),
            "123456"
          );
          await services.db.collection("chatProfiles").doc(credential.user.uid).set({
            StudentID: entry.studentId,
            Name: entry.name,
            Role: "student",
            Active: true,
            Blocked: false,
            MustChangePin: true,
            AvatarColor: "#F7C600",
            CreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await services.db.collection("chatDirectory").doc(credential.user.uid).set({
            Name: entry.name,
            Role: "student",
            AvatarColor: "#F7C600",
            UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await services.provisionAuth.signOut();
          created += 1;
        } catch (error) {
          errors.push(`${entry.studentId}: ${friendlyError(error)}`);
          await services.provisionAuth.signOut().catch(() => {});
        }
      }

      input.value = "";
      message.textContent = `${created} account${created === 1 ? "" : "s"} created.${errors.length ? ` ${errors.length} skipped: ${errors.slice(0, 3).join("; ")}` : ""}`;
      await loadChatRoster();
    } catch (error) {
      message.textContent = friendlyError(error);
    } finally {
      button.disabled = false;
    }
  }

  async function loadChatRoster() {
    const list = document.getElementById("chatRosterList");
    const message = document.getElementById("chatRosterMessage");
    if (!list) return;
    list.innerHTML = `<p class="fieldHint">Loading student accounts...</p>`;

    try {
      const { db } = getServices();
      const snapshot = await db.collection("chatProfiles").orderBy("Name").get();
      if (snapshot.empty) {
        list.innerHTML = `<p class="fieldHint">No student chat accounts yet.</p>`;
        return;
      }

      const directoryBatch = db.batch();
      snapshot.docs.forEach((doc) => {
        directoryBatch.set(db.collection("chatDirectory").doc(doc.id), {
          Name: doc.data()?.Name || "Student",
          Role: "student",
          AvatarColor: doc.data()?.AvatarColor || "#F7C600",
          UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      directoryBatch.set(db.collection("chatDirectory").doc("staff_adviser"), {
        Name: "SFK Adviser",
        Role: "admin",
        AvatarColor: "#F7C600",
        UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      directoryBatch.set(db.collection("chatDirectory").doc("staff_officer"), {
        Name: "SFK Officer",
        Role: "officer",
        AvatarColor: "#A9B1BD",
        UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await directoryBatch.commit();

      list.innerHTML = snapshot.docs.map((doc) => {
        const profile = doc.data() || {};
        const active = profile.Active !== false && profile.Blocked !== true;
        return `
          <div class="chatRosterRow">
            <div>
              <strong>${escapeHtml(profile.Name || "Student")}</strong>
              <small>${escapeHtml(profile.StudentID || "")} · ${active ? "Active" : "Disabled"}</small>
            </div>
            <button type="button" data-chat-profile="${doc.id}" data-chat-active="${active ? "true" : "false"}">
              ${active ? "Disable" : "Enable"}
            </button>
          </div>`;
      }).join("");

      list.querySelectorAll("[data-chat-profile]").forEach((button) => {
        button.addEventListener("click", () => toggleProfile(button));
      });
    } catch (error) {
      list.innerHTML = "";
      message.textContent = friendlyError(error);
    }
  }

  async function toggleProfile(button) {
    const currentlyActive = button.dataset.chatActive === "true";
    button.disabled = true;
    try {
      const { db } = getServices();
      await db.collection("chatProfiles").doc(button.dataset.chatProfile).update({
        Active: !currentlyActive,
        Blocked: false,
        UpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await loadChatRoster();
    } catch (error) {
      document.getElementById("chatRosterMessage").textContent = friendlyError(error);
      button.disabled = false;
    }
  }

  function getServices() {
    if (!window.firebase || !window.SFK_FIREBASE_READY) throw new Error("Firebase is not configured.");
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);

    let provisionApp;
    try {
      provisionApp = firebase.app("sfkChatProvisioner");
    } catch (error) {
      provisionApp = firebase.initializeApp(window.SFK_FIREBASE_CONFIG, "sfkChatProvisioner");
    }

    return {
      db: firebase.firestore(),
      provisionAuth: provisionApp.auth()
    };
  }

  function parseEntries(raw) {
    const seen = new Set();
    return String(raw || "").split(/\r?\n/).map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const studentId = normalizeStudentId(parts[0]);
      const name = parts[1] || "";
      if (!studentId || !name || seen.has(studentId)) return null;
      seen.add(studentId);
      return { studentId, name };
    }).filter(Boolean);
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

  function friendlyError(error) {
    const code = String(error?.code || "");
    if (code.includes("email-already-in-use")) return "Account already exists";
    if (code.includes("weak-password")) return "PIN must be at least 6 characters";
    if (code.includes("permission-denied")) return "Admin permission is required";
    return String(error?.message || "The account could not be created.").replace(/^Firebase:\s*/i, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();

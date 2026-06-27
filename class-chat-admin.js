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
    `;
    grid.appendChild(card);

    document.getElementById("chatRosterCreate").addEventListener("click", createChatAccounts);
    document.getElementById("chatRosterRefresh").addEventListener("click", loadChatRoster);
  }

  async function createChatAccounts() {
    const input = document.getElementById("chatRosterImport");
    const button = document.getElementById("chatRosterCreate");
    const message = document.getElementById("chatRosterMessage");
    const entries = parseEntries(input.value);

    if (!entries.length) {
      message.textContent = "Enter at least one valid Student ID | Name | PIN entry.";
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
            CreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
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

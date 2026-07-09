const ADMIN_API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";

let currentAdminSheet = "";
let editingRecord = null;
let latestAdminTableData = null;
let selectedAdminRows = new Set();
let activeAdminTool = null;
let currentAdminFilteredRows = [];

const TEACHER_OPTIONS = [
  "Mr. John Rey Tubello",
  "Ms. Chiarah De Castro",
  "Mrs. Melanie Sebastian",
  "Ms. Hannah Lee Cillo",
  "Ms Christine Tolentino",
  "Ms. Kamille Lajom",
  "Mr. Alexis Pastrana",
  "Ms. Gina Soriano",
  "Mr. Runmar Quipanes"
];

const TEXT_FORMAT_OPTIONS = ["center", "left", "right", "bullets", "numbers"];
const MAX_ANNOUNCEMENT_ATTACHMENTS = 5;
const MAX_ANNOUNCEMENT_ATTACHMENT_BYTES = 12 * 1024 * 1024;
const TARGET_ANNOUNCEMENT_IMAGE_BYTES = 360 * 1024;

document.addEventListener("DOMContentLoaded", () => {
  initAdminToolLauncher();
  initRichTextEditors();
  renderHomepagePresetGallery();

  window.SFKAuth?.onAuthStateChanged((user, role) => {
    if (user && role === "admin") showAdminPanel();
    else showAdminLogin();
  });

  const pinInput = document.getElementById("adminPin");
  if (pinInput) {
    pinInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        loginAdmin();
      }
    });
  }

  setTodayForDateInputs();
});

async function loginAdmin() {
  const pinInput = document.getElementById("adminPin");
  const message = document.getElementById("loginMessage");
  const pin = pinInput.value.trim();

  if (!pin) {
    message.textContent = "Enter the Admin PIN.";
    pinInput.focus();
    return;
  }

  message.textContent = "Checking access...";
  try {
    await window.SFKAuth.signInWithPin("admin", pin);
    pinInput.value = "";
    message.textContent = "";
  } catch (error) {
    message.textContent = "Incorrect PIN. Please try again.";
    pinInput.value = "";
    pinInput.focus();
  }
}

async function logoutAdmin() {
  closeAdminTool();
  await window.SFKAuth?.signOut();
  showAdminLogin();
}

function showAdminLogin() {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("adminPanel").classList.add("hidden");
}

function showAdminPanel() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");

  initAdminToolLauncher();
  initRichTextEditors();
  setTodayForDateInputs();
  loadHomepageDesignSettings();
}

function initAdminToolLauncher() {
  const panel = document.getElementById("adminPanel");
  const grid = document.querySelector(".adminGrid");
  const managePanel = document.querySelector(".managePanel");
  if (!panel || !grid || panel.dataset.toolsReady === "true") return;

  panel.dataset.toolsReady = "true";
  panel.classList.add("toolsReady");

  const launcher = document.createElement("section");
  launcher.className = "toolLauncher";
  launcher.setAttribute("aria-label", "Admin tools");
  launcher.innerHTML = `
    <div class="toolLauncherHeader">
      <div>
        <p class="toolEyebrow">Choose action</p>
        <h2>What do you want to open?</h2>
      </div>
      <span>Forms are hidden until needed.</span>
    </div>
    <div class="toolLauncherGrid"></div>
  `;

  const launcherGrid = launcher.querySelector(".toolLauncherGrid");
  Array.from(grid.querySelectorAll(".formCard")).forEach((card, index) => {
    const title = card.querySelector("h2")?.textContent?.trim() || `Tool ${index + 1}`;
    const button = document.createElement("button");
    button.className = "toolLaunchButton";
    button.type = "button";
    button.innerHTML = `<strong>${escapeAdminText(title)}</strong><small>Create or publish this item</small>`;
    button.addEventListener("click", () => openAdminTool(card, title));
    launcherGrid.appendChild(button);
  });

  if (managePanel) {
    const button = document.createElement("button");
    button.className = "toolLaunchButton manageLaunchButton";
    button.type = "button";
    button.innerHTML = `<strong>🗂 Manage Existing Data</strong><small>View, edit, hide, or delete records</small>`;
    button.addEventListener("click", () => openAdminTool(managePanel, "Manage Existing Data"));
    launcherGrid.appendChild(button);
  }

  panel.insertBefore(launcher, grid);

  const modal = document.createElement("div");
  modal.id = "adminToolModal";
  modal.className = "toolModal hidden";
  modal.innerHTML = `
    <div class="toolModalBackdrop" data-admin-tool-close></div>
    <section class="toolModalCard" role="dialog" aria-modal="true" aria-labelledby="adminToolModalTitle">
      <header class="toolModalHeader">
        <div>
          <p class="toolEyebrow">SFK Admin</p>
          <h2 id="adminToolModalTitle">Tool</h2>
        </div>
        <button class="toolModalClose" type="button" data-admin-tool-close aria-label="Close">×</button>
      </header>
      <div id="adminToolModalContent" class="toolModalContent"></div>
    </section>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-admin-tool-close]")) closeAdminTool();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) closeAdminTool();
  });
}

function openAdminTool(element, title) {
  if (!element) return;
  closeAdminTool();

  const modal = document.getElementById("adminToolModal");
  const content = document.getElementById("adminToolModalContent");
  const titleElement = document.getElementById("adminToolModalTitle");
  if (!modal || !content || !titleElement) return;

  activeAdminTool = {
    element,
    parent: element.parentNode,
    nextSibling: element.nextSibling
  };

  titleElement.textContent = title.replace(/^[^\w]+/, "").trim() || title;
  content.appendChild(element);
  element.classList.add("toolModalPanel");
  modal.classList.toggle("toolModalManage", element.classList.contains("managePanel"));
  modal.classList.remove("hidden");
  document.body.classList.add("toolModalOpen");

  const firstInput = element.querySelector("input, textarea, select, button");
  window.setTimeout(() => firstInput?.focus({ preventScroll: true }), 80);
}

function closeAdminTool() {
  const modal = document.getElementById("adminToolModal");
  const content = document.getElementById("adminToolModalContent");

  if (activeAdminTool?.element && activeAdminTool.parent) {
    activeAdminTool.element.classList.remove("toolModalPanel");
    activeAdminTool.parent.insertBefore(activeAdminTool.element, activeAdminTool.nextSibling);
  }

  activeAdminTool = null;
  if (content) content.innerHTML = "";
  modal?.classList.add("hidden");
  modal?.classList.remove("toolModalManage");
  document.body.classList.remove("toolModalOpen");
}

function escapeAdminText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setTodayForDateInputs() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila"
  });

  const dateInputs = [
    "announcementDeadline",
    "announcementPublishDate",
    "thingsDate",
    "adviserDate",
    "prayerDate",
    "quoteDateInput",
    "birthdayDate"
  ];

  dateInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.value) {
      input.value = today;
    }
  });
}

async function sendAdminData(type, payload) {
  showToast("Saving...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type,
        payload
      })
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText.slice(0, 180) || "Invalid server response.");
    }

    if (result.success) {
      showToast("Saved successfully.");

      if (currentAdminSheet) {
        refreshCurrentAdminTable();
      }

      return true;
    }

    showToast(result.message || "Failed to save.");
    return false;

  } catch (error) {
    console.error(error);
    showToast("Error saving data.");
    return false;
  }
}

function showToast(message) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function showToastAction(message, actionLabel, callback) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;

  toast.innerHTML = `<span>${escapeHtml(message)}</span><button type="button">${escapeHtml(actionLabel)}</button>`;
  toast.classList.remove("hidden");

  const button = toast.querySelector("button");
  button?.addEventListener("click", () => {
    toast.classList.add("hidden");
    callback?.();
  });

  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 6500);
}

function clearFields(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.classList && el.classList.contains("richHiddenTextarea")) {
      clearRichEditorForTarget(id);
    } else if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });

  setTodayForDateInputs();
}


/* RICH TEXT EDITOR FOR ANNOUNCEMENTS / THINGS TO BRING */
const RICH_TEXT_PREFIX = "[rich]";
const RICH_LIST_STYLES = ["disc", "circle", "square", "decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman"];
const RICH_ALIGNMENTS = ["left", "center", "right"];
const RICH_INDENT_STEP_EM = 1.25;
const RICH_MAX_INDENT_LEVEL = 6;

function initRichTextEditors() {
  if (!window.__sfkRichSelectionWatcherAttached) {
    window.__sfkRichSelectionWatcherAttached = true;
    document.addEventListener("selectionchange", () => {
      const activeComposer = document.activeElement && document.activeElement.closest ? document.activeElement.closest(".richComposer") : null;
      if (activeComposer) saveRichSelection(activeComposer);
    });
  }

  document.querySelectorAll(".richComposer").forEach(composer => {
    if (composer.dataset.richReady === "true") return;
    const targetId = composer.dataset.richTarget;
    const editor = composer.querySelector(".richEditor");
    if (!targetId || !editor) return;

    composer.dataset.richReady = "true";

    editor.addEventListener("input", () => syncRichEditorToTextarea(targetId));
    editor.addEventListener("blur", () => {
      saveRichSelection(composer);
      syncRichEditorToTextarea(targetId);
    });
    editor.addEventListener("keyup", () => saveRichSelection(composer));
    editor.addEventListener("mouseup", () => saveRichSelection(composer));
    editor.addEventListener("touchend", () => setTimeout(() => saveRichSelection(composer), 0));
    editor.addEventListener("paste", (event) => handleRichEditorPaste(event, targetId));

    composer.querySelectorAll("[data-rich-command], [data-rich-list], [data-rich-align], [data-rich-indent], [data-rich-color]").forEach(button => {
      button.addEventListener("mousedown", event => event.preventDefault());
      button.addEventListener("click", () => runRichEditorToolbarAction(composer, button));
    });

    composer.querySelectorAll("[data-rich-color-picker]").forEach(input => {
      input.addEventListener("mousedown", () => saveRichSelection(composer));
      input.addEventListener("input", () => runRichEditorColorPickerAction(composer, input.value));
      input.addEventListener("change", () => runRichEditorColorPickerAction(composer, input.value));
    });

    syncRichEditorToTextarea(targetId);
  });
}

function getRichEditorToolbarMarkup(label = "Formatting tools") {
  return `
    <div class="richToolbar" aria-label="${escapeHtml(label)}">
      <div class="richToolbarGroup" aria-label="Text style">
        <button type="button" data-rich-command="bold" title="Bold selected text"><b>B</b></button>
        <button type="button" data-rich-command="italic" title="Italic selected text"><i>I</i></button>
        <button type="button" data-rich-command="underline" title="Underline selected text"><u>U</u></button>
      </div>
      <div class="richToolbarGroup" aria-label="Bullets and numbering">
        <button type="button" data-rich-list="disc" title="Bullet list">•</button>
        <button type="button" data-rich-list="circle" title="Circle bullet">○</button>
        <button type="button" data-rich-list="square" title="Square bullet">▪</button>
        <button type="button" data-rich-list="decimal" title="Numbered list">1.</button>
        <button type="button" data-rich-list="lower-alpha" title="Letter list">a.</button>
        <button type="button" data-rich-list="upper-alpha" title="Capital letter list">A.</button>
      </div>
      <div class="richToolbarGroup" aria-label="Indent">
        <button type="button" data-rich-indent="out" title="Decrease indent">⇤</button>
        <button type="button" data-rich-indent="in" title="Increase indent">⇥</button>
      </div>
      <div class="richToolbarGroup" aria-label="Text color">
        <button type="button" class="richColorChip richColorBlack" data-rich-color="#111111" title="Black text">A</button>
        <button type="button" class="richColorChip richColorRed" data-rich-color="#d62828" title="Red text">A</button>
        <button type="button" class="richColorChip richColorBlue" data-rich-color="#2563eb" title="Blue text">A</button>
        <button type="button" class="richColorChip richColorGreen" data-rich-color="#0f766e" title="Green text">A</button>
        <button type="button" class="richColorChip richColorPurple" data-rich-color="#7c3aed" title="Purple text">A</button>
        <label class="richColorPickerLabel" title="Custom text color"><span>Color</span><input type="color" data-rich-color-picker value="#111111" aria-label="Custom text color"></label>
      </div>
      <div class="richToolbarGroup" aria-label="Alignment">
        <button type="button" data-rich-align="left" title="Align left">Left</button>
        <button type="button" data-rich-align="center" title="Align center">Center</button>
        <button type="button" data-rich-align="right" title="Align right">Right</button>
        <button type="button" data-rich-command="removeFormat" title="Clear selected formatting">Clear</button>
      </div>
    </div>`;
}

function runRichEditorToolbarAction(composer, button) {
  const targetId = composer.dataset.richTarget;
  const editor = composer.querySelector(".richEditor");
  if (!editor) return;

  editor.focus();
  restoreRichSelection(composer);

  const command = button.dataset.richCommand;
  const listStyle = button.dataset.richList;
  const align = button.dataset.richAlign;
  const indent = button.dataset.richIndent;
  const color = button.dataset.richColor;

  if (command) {
    document.execCommand(command, false, null);
  }

  if (align && RICH_ALIGNMENTS.includes(align)) {
    const commandName = align === "center" ? "justifyCenter" : align === "right" ? "justifyRight" : "justifyLeft";
    document.execCommand(commandName, false, null);
    applyAlignmentToSelectedBlocks(editor, align);
  }

  if (listStyle && RICH_LIST_STYLES.includes(listStyle)) {
    applyListStyleToSelection(editor, listStyle);
  }

  if (indent === "in" || indent === "out") {
    applyRichIndentToSelection(editor, indent === "in" ? 1 : -1);
  }

  if (color) {
    applyRichTextColor(editor, color);
  }

  saveRichSelection(composer);
  syncRichEditorToTextarea(targetId);
}

function runRichEditorColorPickerAction(composer, color) {
  const targetId = composer.dataset.richTarget;
  const editor = composer.querySelector(".richEditor");
  if (!editor) return;

  editor.focus();
  restoreRichSelection(composer);
  applyRichTextColor(editor, color);
  saveRichSelection(composer);
  syncRichEditorToTextarea(targetId);
}

function saveRichSelection(composer) {
  const editor = composer.querySelector(".richEditor");
  const selection = window.getSelection && window.getSelection();
  if (!editor || !selection || !selection.rangeCount) return;

  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  if ((anchor && editor.contains(anchor)) || (focus && editor.contains(focus))) {
    composer.__savedRichRange = selection.getRangeAt(0).cloneRange();
  }
}

function restoreRichSelection(composer) {
  const editor = composer.querySelector(".richEditor");
  const selection = window.getSelection && window.getSelection();
  const range = composer.__savedRichRange;
  if (!editor || !selection || !range) return;

  const startInside = range.startContainer === editor || editor.contains(range.startContainer);
  const endInside = range.endContainer === editor || editor.contains(range.endContainer);
  if (!startInside || !endInside) return;

  selection.removeAllRanges();
  selection.addRange(range);
}

function handleRichEditorPaste(event, targetId) {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData)?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
  syncRichEditorToTextarea(targetId);
}

function applyListStyleToSelection(editor, listStyle) {
  const needsOrdered = ["decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman"].includes(listStyle);
  const desiredTag = needsOrdered ? "OL" : "UL";
  let list = getCurrentListElement(editor);

  if (!list || list.tagName !== desiredTag) {
    document.execCommand(needsOrdered ? "insertOrderedList" : "insertUnorderedList", false, null);
    list = getCurrentListElement(editor);
  }

  if (list && RICH_LIST_STYLES.includes(listStyle)) {
    list.style.listStyleType = listStyle;
  }
}

function getCurrentListElement(editor) {
  const selection = window.getSelection && window.getSelection();
  let node = selection && selection.rangeCount ? selection.anchorNode : null;

  if (!node || !editor.contains(node)) {
    node = editor;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editor) {
    if (node.tagName === "UL" || node.tagName === "OL") return node;
    node = node.parentElement;
  }

  return editor.querySelector("ul, ol");
}

function applyAlignmentToSelectedBlocks(editor, align) {
  const blocks = getSelectedRichBlocks(editor);
  const listTargets = new Set();

  blocks.forEach(block => {
    const list = getClosestRichList(editor, block);
    if (list) {
      listTargets.add(list);
    } else {
      block.style.textAlign = align;
    }
  });

  listTargets.forEach(list => applyRichListAlignment(list, align));
}

function applyRichListAlignment(list, align) {
  list.style.textAlign = align;

  if (align === "left") {
    list.style.width = "100%";
    list.style.marginLeft = "0";
    list.style.marginRight = "0";
  } else if (align === "center") {
    list.style.width = "fit-content";
    list.style.marginLeft = "auto";
    list.style.marginRight = "auto";
  } else if (align === "right") {
    list.style.width = "100%";
    list.style.marginLeft = "0";
    list.style.marginRight = "0";
  }
}

function applyRichIndentToSelection(editor, direction) {
  const blocks = getSelectedRichBlocks(editor);
  if (!blocks.length) return;

  const targets = [];
  const seen = new Set();

  blocks.forEach(block => {
    const target = getRichIndentTarget(editor, block);
    if (target && !seen.has(target)) {
      seen.add(target);
      targets.push(target);
    }
  });

  targets.forEach(target => {
    const current = parseRichIndentValue(target.style.marginLeft);
    const next = Math.max(0, Math.min(RICH_MAX_INDENT_LEVEL * RICH_INDENT_STEP_EM, current + (direction * RICH_INDENT_STEP_EM)));

    if (next <= 0.01) {
      target.style.removeProperty("margin-left");
    } else {
      target.style.marginLeft = formatRichIndentValue(next);
    }
  });
}

function getRichIndentTarget(editor, block) {
  const list = getClosestRichList(editor, block);
  return list || block;
}

function getClosestRichList(editor, node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  while (node && node !== editor) {
    if (node.tagName === "UL" || node.tagName === "OL") return node;
    node = node.parentElement;
  }

  return null;
}

function applyRichTextColor(editor, color) {
  const cleanColor = normalizeRichColor(color);
  if (!cleanColor) return;
  document.execCommand("foreColor", false, cleanColor);
}

function getSelectedRichBlocks(editor) {
  const selection = window.getSelection && window.getSelection();
  if (!selection || !selection.rangeCount) return [];

  const range = selection.getRangeAt(0);
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  if ((!anchor || !editor.contains(anchor)) && (!focus || !editor.contains(focus))) return [];

  const candidates = Array.from(editor.querySelectorAll("p, div, li"))
    .filter(el => {
      try {
        return range.intersectsNode(el);
      } catch (error) {
        return false;
      }
    });

  const smallestBlocks = candidates.filter(el => !candidates.some(other => other !== el && el.contains(other)));
  if (smallestBlocks.length) return smallestBlocks;

  const closest = getClosestRichBlock(editor, anchor || focus);
  if (closest) return [closest];

  document.execCommand("formatBlock", false, "div");
  const created = getClosestRichBlock(editor, selection.anchorNode);
  return created ? [created] : [];
}

function getClosestRichBlock(editor, node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  while (node && node !== editor) {
    if (["P", "DIV", "LI"].includes(node.tagName)) return node;
    node = node.parentElement;
  }

  return null;
}

function parseRichIndentValue(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return 0;

  if (raw.endsWith("em")) return Number.parseFloat(raw) || 0;
  if (raw.endsWith("px")) return (Number.parseFloat(raw) || 0) / 16;
  return Number.parseFloat(raw) || 0;
}

function formatRichIndentValue(value) {
  const rounded = Math.round(value * 100) / 100;
  return `${String(rounded).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}em`;
}

function normalizeRichColor(value) {
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

function normalizeRichIndent(value) {
  const parsed = parseRichIndentValue(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  const max = RICH_MAX_INDENT_LEVEL * RICH_INDENT_STEP_EM;
  return formatRichIndentValue(Math.min(max, parsed));
}

function syncRichEditorToTextarea(targetId) {
  const hidden = document.getElementById(targetId);
  const editor = document.querySelector(`.richComposer[data-rich-target="${targetId}"] .richEditor`);
  if (!hidden || !editor) return;

  const html = sanitizeRichEditorHtml(editor.innerHTML);
  const plainText = getRichEditorPlainText(targetId);
  hidden.value = plainText ? `${RICH_TEXT_PREFIX}\n${html}` : "";
}

function getRichEditorStorageValue(targetId) {
  syncRichEditorToTextarea(targetId);
  const hidden = document.getElementById(targetId);
  return hidden ? hidden.value.trim() : "";
}

function isRichTextStorageValue(value) {
  return /^\[rich\]\s*\n/i.test(String(value || "").replace(/\r/g, ""));
}

function getRichTextStorageHtml(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/^\[rich\]\s*\n?/i, "")
    .trim();
}

function getRichEditorPlainText(targetId) {
  const editor = document.querySelector(`.richComposer[data-rich-target="${targetId}"] .richEditor`);
  return editor ? String(editor.innerText || "").replace(/\u00a0/g, " ").trim() : "";
}

function clearRichEditorForTarget(targetId) {
  const hidden = document.getElementById(targetId);
  const editor = document.querySelector(`.richComposer[data-rich-target="${targetId}"] .richEditor`);
  if (hidden) hidden.value = "";
  if (editor) editor.innerHTML = "";
}

function sanitizeRichEditorHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const fragment = sanitizeRichNode(template.content);
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML
    .replace(/<div><br><\/div>/gi, "")
    .replace(/<p><br><\/p>/gi, "")
    .trim();
}

function sanitizeRichNode(node) {
  const fragment = document.createDocumentFragment();

  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      fragment.appendChild(document.createTextNode(child.textContent || ""));
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const tag = child.tagName.toLowerCase();
    const allowed = ["b", "strong", "i", "em", "u", "br", "div", "p", "ul", "ol", "li", "span", "font"];

    if (!allowed.includes(tag)) {
      fragment.appendChild(sanitizeRichNode(child));
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
    const color = normalizeRichColor(child.getAttribute("color") || child.style?.color || "");
    const indent = normalizeRichIndent(child.style?.marginLeft || "");

    if (RICH_ALIGNMENTS.includes(textAlign)) styleParts.push(`text-align:${textAlign}`);
    if ((cleanTag === "ul" || cleanTag === "ol") && RICH_LIST_STYLES.includes(listStyleType)) {
      styleParts.push(`list-style-type:${listStyleType}`);
    }
    if (["div", "p", "li", "ul", "ol"].includes(cleanTag) && indent) styleParts.push(`margin-left:${indent}`);
    if (cleanTag === "span" && (fontWeight === "bold" || Number(fontWeight) >= 600)) styleParts.push("font-weight:700");
    if (cleanTag === "span" && fontStyle === "italic") styleParts.push("font-style:italic");
    if (cleanTag === "span" && textDecoration.includes("underline")) styleParts.push("text-decoration:underline");
    if (cleanTag === "span" && color) styleParts.push(`color:${color}`);
    if (styleParts.length) clean.setAttribute("style", styleParts.join(";"));

    clean.appendChild(sanitizeRichNode(child));
    fragment.appendChild(clean);
  });

  return fragment;
}

/* SUBJECT ANNOUNCEMENT */
async function saveAnnouncement() {
  const announcementText = getRichEditorStorageValue("announcementText");
  const attachmentFiles = await buildAttachmentPayload("announcementAttachments", showToast);

  if (attachmentFiles === null) return;

  const payload = {
    Date: document.getElementById("announcementPublishDate").value,
    Subject: document.getElementById("announcementSubject").value,
    Announcement: announcementText,
    Teacher: document.getElementById("announcementTeacher").value,
    Deadline: document.getElementById("announcementDeadline").value,
    PublishDate: document.getElementById("announcementPublishDate").value,
    ExpiryDate: document.getElementById("announcementExpiryDate").value,
    ShowDeadline: document.getElementById("announcementShowDeadline").value,
    AttachmentFiles: attachmentFiles,
    Priority: document.getElementById("announcementPriority").value,
    Publish: document.getElementById("announcementPublish").value
  };

  if (!payload.PublishDate || !payload.Subject || !payload.Announcement || !payload.Teacher) {
    showToast("Publish date, subject, teacher, and announcement are required.");
    return;
  }

  if (payload.PublishDate && payload.ExpiryDate && payload.ExpiryDate <= payload.PublishDate) {
    showToast("Expiry Date must be after the Publish Date.");
    return;
  }

  const saved = await sendAdminData("announcement", payload);

  if (saved) {
    clearFields([
      "announcementSubject",
      "announcementText",
      "announcementFormat",
      "announcementAttachments",
      "announcementTeacher",
      "announcementDeadline",
      "announcementPublishDate",
      "announcementExpiryDate",
      "announcementShowDeadline",
      "announcementPriority",
      "announcementPublish"
    ]);
  }
}

/* THINGS TO BRING */
async function saveThingsToBring() {
  const itemText = getRichEditorStorageValue("thingsItem");

  const payload = {
    Date: document.getElementById("thingsDate").value,
    Subject: document.getElementById("thingsSubject").value,
    Item: itemText,
    Publish: document.getElementById("thingsPublish").value
  };

  if (!payload.Date || !payload.Subject || !payload.Item) {
    showToast("Date needed, subject, and item are required.");
    return;
  }

  const saved = await sendAdminData("things", payload);

  if (saved) {
    clearFields([
      "thingsDate",
      "thingsSubject",
      "thingsItem",
      "thingsFormat",
      "thingsPublish"
    ]);
  }
}

/* ADVISER REMINDER */
async function saveAdviserReminder() {
  const reminderText = document.getElementById("adviserReminder").value.trim();
  const reminderFormat = document.getElementById("adviserFormat").value;

  const payload = {
    Date: document.getElementById("adviserDate").value,
    Reminder: applyTextFormat(reminderText, reminderFormat),
    Publish: document.getElementById("adviserPublish").value
  };

  if (!payload.Date || !payload.Reminder) {
    showToast("Date and reminder are required.");
    return;
  }

  const saved = await sendAdminData("reminder", payload);

  if (saved) {
    clearFields([
      "adviserDate",
      "adviserReminder",
      "adviserFormat",
      "adviserPublish"
    ]);
  }
}

/* PRAYER LEADER */
async function savePrayerLeader() {
  const payload = {
    Date: document.getElementById("prayerDate").value,
    PrayerLeader: document.getElementById("prayerName").value.trim(),
    Publish: document.getElementById("prayerPublish").value
  };

  if (!payload.Date || !payload.PrayerLeader) {
    showToast("Date and prayer leader are required.");
    return;
  }

  const saved = await sendAdminData("prayer", payload);

  if (saved) {
    clearFields([
      "prayerDate",
      "prayerName",
      "prayerPublish"
    ]);
  }
}

/* DAILY KINDNESS QUOTE */
async function saveQuote() {
  const payload = {
    Date: document.getElementById("quoteDateInput").value,
    Quote: document.getElementById("quoteTextInput").value.trim(),
    Author: document.getElementById("quoteAuthorInput").value.trim(),
    Publish: document.getElementById("quotePublishInput").value
  };

  if (!payload.Date || !payload.Quote) {
    showToast("Date and quote are required.");
    return;
  }

  const saved = await sendAdminData("quote", payload);

  if (saved) {
    clearFields([
      "quoteDateInput",
      "quoteTextInput",
      "quoteAuthorInput",
      "quotePublishInput"
    ]);
  }
}

/* BIRTHDAY */
async function saveBirthday() {
  const payload = {
    Name: document.getElementById("birthdayName").value.trim(),
    Birthday: document.getElementById("birthdayDate").value,
    Publish: document.getElementById("birthdayPublish").value
  };

  if (!payload.Name || !payload.Birthday) {
    showToast("Name and birthday are required.");
    return;
  }

  const saved = await sendAdminData("birthday", payload);

  if (saved) {
    clearFields([
      "birthdayName",
      "birthdayDate",
      "birthdayPublish"
    ]);
  }
}

/* TICKER MESSAGE */
async function saveTickerMessage() {
  const payload = {
    Message: document.getElementById("tickerMessage").value.trim(),
    Priority: "Normal",
    Publish: document.getElementById("tickerPublish").value
  };

  if (!payload.Message) {
    showToast("Ticker message is required.");
    return;
  }

  const saved = await sendAdminData("ticker", payload);

  if (saved) {
    clearFields([
      "tickerMessage",
      "tickerPublish"
    ]);
  }
}

async function buildAttachmentPayload(inputId, notify) {
  const input = document.getElementById(inputId);
  const files = input && input.files ? Array.from(input.files) : [];

  if (files.length === 0) return [];

  if (files.length > MAX_ANNOUNCEMENT_ATTACHMENTS) {
    notify(`Maximum of ${MAX_ANNOUNCEMENT_ATTACHMENTS} photos only.`);
    return null;
  }

  const unsupported = files.find(file => !String(file.type || "").startsWith("image/"));
  if (unsupported) {
    notify("No-billing mode supports image uploads only. Use a public link for PDFs/docs.");
    return null;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (totalBytes > MAX_ANNOUNCEMENT_ATTACHMENT_BYTES) {
    notify("Photos are too large. Keep selected photos under 12 MB before compression.");
    return null;
  }

  try {
    return await Promise.all(files.map(file => readAttachmentFile(file)));
  } catch (error) {
    notify(error.message || "Unable to prepare one of the photos.");
    return null;
  }
}

async function readAttachmentFile(file) {
  const imageUrl = await readAdminAttachmentDataUrl(file);
  const image = await loadAdminAttachmentImage(imageUrl);
  const blob = await compressAdminAttachmentImage(image);
  const dataUrl = await readAdminAttachmentDataUrl(blob || file);

  return {
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    data: String(dataUrl || "").split(",")[1] || ""
  };
}

function readAdminAttachmentDataUrl(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read attachment."));
    reader.readAsDataURL(fileOrBlob);
  });
}

function loadAdminAttachmentImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to prepare one of the photos."));
    image.src = src;
  });
}

async function compressAdminAttachmentImage(image) {
  const dimensions = [1280, 1100, 900, 760, 640];
  const qualities = [.74, .66, .58, .5, .42];
  let bestBlob = null;

  for (const maxDimension of dimensions) {
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;
      bestBlob = blob;
      if (blob.size <= TARGET_ANNOUNCEMENT_IMAGE_BYTES) return blob;
    }
  }

  return bestBlob;
}

/* CLASS SCHEDULE */
async function saveClassSchedule() {
  const payload = {
    Day: document.getElementById("scheduleDay").value,
    StartTime: normalizeScheduleTimeInput(document.getElementById("scheduleStartTime").value),
    EndTime: normalizeScheduleTimeInput(document.getElementById("scheduleEndTime").value),
    Subject: document.getElementById("scheduleSubject").value.trim(),
    Teacher: document.getElementById("scheduleTeacher").value.trim(),
    Room: document.getElementById("scheduleRoom").value.trim(),
    Color: normalizeScheduleColorInput(document.getElementById("scheduleColor").value),
    Publish: document.getElementById("schedulePublish").value
  };

  if (!payload.Day || !payload.StartTime || !payload.EndTime || !payload.Subject) {
    showToast("Day, start time, end time, and subject/block are required.");
    return;
  }

  if (scheduleTimeToMinutes(payload.EndTime) <= scheduleTimeToMinutes(payload.StartTime)) {
    showToast("End time must be after the start time.");
    return;
  }

  const saved = await sendAdminData("schedule", payload);

  if (saved) {
    clearFields([
      "scheduleStartTime",
      "scheduleEndTime",
      "scheduleSubject",
      "scheduleTeacher",
      "scheduleRoom",
      "scheduleColor",
      "schedulePublish"
    ]);
  }
}

function normalizeScheduleColorInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const hex = text.match(/^#?([0-9a-fA-F]{6})$/);
  if (hex) return `#${hex[1].toUpperCase()}`;

  return text.replace(/\s+/g, " ");
}

function normalizeScheduleTimeInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${meridiem}`;
}

function scheduleTimeToMinutes(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 99999;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = String(match[3] || "").toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/* DAILY SCHEDULE INFO */
async function saveDailyInfo() {
  const payload = {
    Day: document.getElementById("dailyInfoDay").value,
    EntryGate: document.getElementById("dailyInfoEntryGate").value.trim(),
    ExitGate: document.getElementById("dailyInfoExitGate").value.trim(),
    Uniform: document.getElementById("dailyInfoUniform").value.trim(),
    Publish: document.getElementById("dailyInfoPublish").value
  };

  if (!payload.Day || !payload.EntryGate || !payload.ExitGate || !payload.Uniform) {
    showToast("Day, entry gate, exit gate, and uniform are required.");
    return;
  }

  const saved = await sendAdminData("dailyInfo", payload);

  if (saved) {
    clearFields([
      "dailyInfoEntryGate",
      "dailyInfoExitGate",
      "dailyInfoUniform",
      "dailyInfoPublish"
    ]);
  }
}

/* MANAGE EXISTING DATA - EDIT / HIDE / DELETE */
async function loadAdminTable(sheetName, buttonEl) {
  currentAdminSheet = sheetName;
  selectedAdminRows = new Set();

  setActiveManageTab(buttonEl);
  setManageStatus(`Loading ${formatSheetLabel(sheetName)}...`);

  const tableHead = document.querySelector("#adminDataTable thead");
  const tableBody = document.querySelector("#adminDataTable tbody");

  if (!tableHead || !tableBody) {
    showToast("Manage table not found in admin.html.");
    return;
  }

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  try {
    const response = await fetch(`${ADMIN_API_URL}?type=adminList&sheet=${encodeURIComponent(sheetName)}`, {
      cache: "no-store"
    });

    const result = await response.json();

    if (result.status !== "success") {
      setManageStatus(result.message || "Unable to load data.");
      return;
    }

    latestAdminTableData = result;
    resetAdminManageFilters();
    renderAdminTable(getAdminFilteredTableData());

  } catch (error) {
    console.error(error);
    setManageStatus("Error loading data.");
  }
}


function getVisibleManageColumnIndexes(headers) {
  const seen = new Set();

  return (headers || [])
    .map((header, index) => ({ header, index }))
    .filter(item => {
      const key = normalizeManageHeaderKey(item.header);

      if (!key) return true;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .map(item => item.index);
}

function normalizeManageHeaderKey(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getAdminManageFilters() {
  return {
    search: document.getElementById("adminManageSearch")?.value.trim().toLowerCase() || "",
    publish: document.getElementById("adminPublishFilter")?.value || "all"
  };
}

function resetAdminManageFilters() {
  const search = document.getElementById("adminManageSearch");
  const publish = document.getElementById("adminPublishFilter");
  if (search) search.value = "";
  if (publish) publish.value = "all";
}

function getRowPublishValue(headers, row) {
  const publishIndex = (headers || []).findIndex(header => {
    const key = normalizeManageHeaderKey(header);
    return key === "publish" || key === "published";
  });

  if (publishIndex === -1) return "YES";
  return String(row?.cells?.[publishIndex] || "YES").trim().toUpperCase();
}

function rowMatchesManageFilters(headers, row, filters) {
  const publish = getRowPublishValue(headers, row);

  if (filters.publish === "published" && publish === "NO") return false;
  if (filters.publish === "hidden" && publish !== "NO") return false;

  if (!filters.search) return true;

  const haystack = [
    row.rowNumber,
    ...(row.cells || [])
  ].join(" ").toLowerCase();

  return haystack.includes(filters.search);
}

function getAdminFilteredTableData() {
  if (!latestAdminTableData) return null;

  const filters = getAdminManageFilters();
  const allRows = latestAdminTableData.rows || [];
  const rows = allRows.filter(row => rowMatchesManageFilters(latestAdminTableData.headers || [], row, filters));

  currentAdminFilteredRows = rows;

  return {
    ...latestAdminTableData,
    rows,
    totalRows: allRows.length
  };
}

function applyAdminManageFilters() {
  if (!latestAdminTableData) return;

  const filteredData = getAdminFilteredTableData();
  const visibleRows = new Set(currentAdminFilteredRows.map(row => Number(row.rowNumber)));
  selectedAdminRows = new Set([...selectedAdminRows].filter(rowNumber => visibleRows.has(Number(rowNumber))));
  renderAdminTable(filteredData);
  syncAdminSelectedRows();
}

function renderAdminTable(result) {
  const tableHead = document.querySelector("#adminDataTable thead");
  const tableBody = document.querySelector("#adminDataTable tbody");

  if (!result) return;

  const headers = result.headers || [];
  const rows = result.rows || [];
  const totalRows = Number.isFinite(result.totalRows) ? result.totalRows : rows.length;
  const isAnnouncementsSheet = result.sheetName === "Announcements";
  const visibleColumnIndexes = getVisibleManageColumnIndexes(headers);

  if (!tableHead || !tableBody) return;

  if (headers.length === 0) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    setManageStatus(`${formatSheetLabel(result.sheetName)} has no headers.`);
    return;
  }

  tableHead.innerHTML = `
    <tr>
      <th>Select</th>
      <th>Actions</th>
      <th>Row</th>
      ${isAnnouncementsSheet ? "<th>Noted</th>" : ""}
      ${visibleColumnIndexes.map(index => `<th>${escapeHtml(getManageHeaderLabel(result.sheetName, headers[index]))}</th>`).join("")}
    </tr>
  `;

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="${visibleColumnIndexes.length + 3 + (isAnnouncementsSheet ? 1 : 0)}" class="emptyCell">
          ${totalRows > 0 ? "No matching records found." : "No data found."}
        </td>
      </tr>
    `;

    setManageStatus(totalRows > 0
      ? `${formatSheetLabel(result.sheetName)} loaded. Showing 0 of ${totalRows} record(s).`
      : `${formatSheetLabel(result.sheetName)} loaded. No records yet.`
    );
    return;
  }

  tableBody.innerHTML = rows.map(row => {
    return `
      <tr>
        <td class="selectCell" data-label="Select">
          <input type="checkbox" class="rowSelectInput" data-row="${row.rowNumber}" onchange="toggleAdminRowSelection(${row.rowNumber}, this.checked)" />
        </td>

        <td class="actionsDataCell" data-label="Actions">
          <div class="actionCell">
            <button class="tableActionBtn editBtn" onclick="openEditModal(${row.rowNumber})">Edit</button>
            <button class="tableActionBtn hideBtn" onclick="hideAdminRecord(${row.rowNumber})">Hide</button>
            <button class="tableActionBtn deleteBtn" onclick="deleteAdminRecord(${row.rowNumber})">Delete</button>
          </div>
        </td>

        <td class="rowNumberCell" data-label="Row">#${row.rowNumber}</td>

        ${isAnnouncementsSheet ? renderAdminNotedCountCell(row) : ""}

        ${visibleColumnIndexes.map(index => {
          const header = headers[index];
          const value = row.cells[index] || "";
          return `
            <td class="${value ? "" : "emptyCell"}" data-label="${escapeAttribute(getManageHeaderLabel(result.sheetName, header))}">
              ${formatManageCellDisplay(value)}
            </td>
          `;
        }).join("")}
      </tr>
    `;
  }).join("");

  setManageStatus(`${formatSheetLabel(result.sheetName)} loaded. ${rows.length}${totalRows !== rows.length ? ` of ${totalRows}` : ""} record(s) shown.`);
  attachAdminLongPressSelection();
}


function formatManageCellDisplay(value) {
  if (!value) return "—";

  if (typeof isRichTextStorageValue === "function" && isRichTextStorageValue(value)) {
    const safeHtml = sanitizeRichEditorHtml(getRichTextStorageHtml(value));
    return safeHtml ? `<div class="manageRichPreview">${safeHtml}</div>` : "—";
  }

  return escapeHtml(stripTextFormatTag(value));
}

function renderAdminNotedCountCell(row) {
  const count = getManageHeartCount(row);

  return `
    <td class="adminNotedCountCell" data-label="Noted" title="Students who clicked Noted / Heart">
      <span class="adminNotedPill">❤️ ${count}</span>
    </td>
  `;
}


function getManageHeartCount(row) {
  const users = normalizeManageHeartUsers(row?.HeartUsersV2 || row?.heartUsersV2 || row?.NotedDevicesV2 || row?.notedDevicesV2);
  const mapCount = Object.keys(users).length;
  if (mapCount > 0) return mapCount;
  const values = [row?.NotedCountV2, row?.notedCountV2, row?.HeartCountV2, row?.heartCountV2]
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);
  return values.length ? Math.max(...values) : 0;
}

function normalizeManageHeartUsers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, isHearted]) => key && Boolean(isHearted)));
}

function toggleAdminRowSelection(rowNumber, checked) {
  const numericRow = Number(rowNumber);

  if (checked) {
    selectedAdminRows.add(numericRow);
  } else {
    selectedAdminRows.delete(numericRow);
  }

  syncAdminSelectedRows();
}

function syncAdminSelectedRows() {
  document.querySelectorAll("#adminDataTable tbody tr").forEach(row => {
    const checkbox = row.querySelector(".rowSelectInput");
    if (!checkbox) return;

    const rowNumber = Number(checkbox.dataset.row);
    const selected = selectedAdminRows.has(rowNumber);
    checkbox.checked = selected;
    row.classList.toggle("selectedRow", selected);
  });

  const count = selectedAdminRows.size;
  if (currentAdminSheet && latestAdminTableData) {
    const visibleCount = currentAdminFilteredRows.length || 0;
    const totalCount = latestAdminTableData.rows.length;
    setManageStatus(`${formatSheetLabel(currentAdminSheet)} loaded. ${visibleCount}${visibleCount !== totalCount ? ` of ${totalCount}` : ""} record(s) shown. ${count} selected.`);
  }
}

function selectAllAdminRows() {
  if (!latestAdminTableData || !latestAdminTableData.rows) return;
  const rows = getAdminFilteredTableData()?.rows || [];
  selectedAdminRows = new Set(rows.map(row => Number(row.rowNumber)));
  syncAdminSelectedRows();
}

function clearAdminSelection() {
  selectedAdminRows = new Set();
  syncAdminSelectedRows();
}

function attachAdminLongPressSelection() {
  document.querySelectorAll("#adminDataTable tbody tr").forEach(row => {
    const checkbox = row.querySelector(".rowSelectInput");
    if (!checkbox) return;

    const rowNumber = Number(checkbox.dataset.row);
    let timer = null;

    row.addEventListener("touchstart", () => {
      timer = setTimeout(() => {
        toggleAdminRowSelection(rowNumber, !selectedAdminRows.has(rowNumber));
      }, 550);
    }, { passive: true });

    row.addEventListener("touchend", () => clearTimeout(timer));
    row.addEventListener("touchmove", () => clearTimeout(timer));
    row.addEventListener("touchcancel", () => clearTimeout(timer));
  });
}

async function hideSelectedAdminRecords() {
  await runAdminBatchAction("adminBatchUnpublish", "hide");
}

async function deleteSelectedAdminRecords() {
  await runAdminBatchAction("adminBatchDelete", "delete");
}

async function runAdminBatchAction(type, actionLabel) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const rowNumbers = Array.from(selectedAdminRows).sort((a, b) => a - b);

  if (rowNumbers.length === 0) {
    showToast("Select at least one record.");
    return;
  }

  const confirmed = confirm(`${actionLabel === "delete" ? "Delete" : "Hide"} ${rowNumbers.length} selected record(s)?`);
  if (!confirmed) return;

  if (actionLabel === "delete") {
    const secondConfirm = confirm("Last check: delete permanently? This cannot be undone.");
    if (!secondConfirm) return;
  }

  showToast(`${actionLabel === "delete" ? "Deleting" : "Hiding"} selected records...`);

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type,
        payload: {
          sheetName: currentAdminSheet,
          rowNumbers
        }
      })
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText.slice(0, 180) || "Invalid server response.");
    }

    if (result.success) {
      if (actionLabel === "hide") {
        showToastAction(result.message || "Selected records hidden.", "Undo", () => restoreAdminRecords(rowNumbers));
      } else {
        showToast(result.message || "Batch action complete.");
      }
      selectedAdminRows = new Set();
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Batch action failed.");
  } catch (error) {
    console.error(error);
    showToast("Error running batch action.");
  }
}

function openEditModal(rowNumber) {
  if (!latestAdminTableData) {
    showToast("Load a category first.");
    return;
  }

  const row = latestAdminTableData.rows.find(item => Number(item.rowNumber) === Number(rowNumber));

  if (!row) {
    showToast("Record not found.");
    return;
  }

  editingRecord = {
    sheetName: latestAdminTableData.sheetName,
    rowNumber: row.rowNumber,
    headers: latestAdminTableData.headers,
    cells: row.cells
  };

  const modalTitle = document.getElementById("editModalTitle");
  const modalSubtitle = document.getElementById("editModalSubtitle");
  const editFields = document.getElementById("editFields");
  const editModal = document.getElementById("editModal");

  if (!modalTitle || !modalSubtitle || !editFields || !editModal) {
    showToast("Edit modal not found in admin.html.");
    return;
  }

  modalTitle.textContent = `Edit ${formatSheetLabel(editingRecord.sheetName)}`;
  modalSubtitle.textContent = `Editing row #${editingRecord.rowNumber}`;

  editFields.innerHTML = editingRecord.headers.map((header, index) => {
    const value = editingRecord.cells[index] || "";
    const lowerHeader = String(header).trim().toLowerCase();
    const labelText = getManageHeaderLabel(editingRecord.sheetName, header);

    const isLongText = isFormattedTextField(
      editingRecord.sheetName,
      header,
      index,
      editingRecord.headers
    );
    const isDuplicateAnnouncementField =
      editingRecord.sheetName === "Announcements" &&
      normalizeFieldName(header) === "announcement" &&
      !isLongText;

    if (isDuplicateAnnouncementField) {
      return "";
    }

    const isPublish =
	  lowerHeader === "publish" ||
	  lowerHeader === "published";

	const isTeacher =
	  lowerHeader === "teacher";

	const isId =
	  lowerHeader === "id";
    const isAnnouncementScheduleDate =
      editingRecord.sheetName === "Announcements" &&
      ["publishdate", "expirydate"].includes(normalizeFieldName(header));

    const fieldClass = isLongText ? "editField editFieldFull" : "editField";

    if (isId) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <input 
        class="editInput readOnlyField"
        data-index="${index}"
        value="${escapeAttribute(value)}"
        readonly
      />
    </div>
  `;
}

if (isPublish) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <select class="editInput" data-index="${index}">
        <option value="YES" ${String(value).toUpperCase() === "YES" ? "selected" : ""}>YES</option>
        <option value="NO" ${String(value).toUpperCase() === "NO" ? "selected" : ""}>NO</option>
      </select>
    </div>
  `;
}

if (isAnnouncementScheduleDate) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <input
        class="editInput"
        type="date"
        data-index="${index}"
        value="${escapeAttribute(toDateInputValue(value))}"
      />
    </div>
  `;
}

if (isTeacher) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <select class="editInput" data-index="${index}">
        ${renderTeacherOptions(value)}
      </select>
    </div>
  `;
}

    if (isLongText) {
      if (isRichTextStorageValue(value)) {
        const targetId = `editRichText_${index}`;
        const safeHtml = sanitizeRichEditorHtml(getRichTextStorageHtml(value));

        return `
          <div class="${fieldClass}">
            <label>${escapeHtml(labelText)}</label>
            <div class="richComposer editRichComposer" data-rich-target="${targetId}">
              ${getRichEditorToolbarMarkup("Edit formatting tools")}
              <div class="richEditor" contenteditable="true" data-placeholder="Edit formatted text here...">${safeHtml}</div>
              <textarea id="${targetId}" class="editInput richHiddenTextarea" data-rich-storage="YES" data-index="${index}" aria-hidden="true" tabindex="-1"></textarea>
            </div>
          </div>
        `;
      }

      const parsedFormat = parseTextFormat(value);

      return `
        <div class="${fieldClass}">
          <label>${escapeHtml(labelText)}</label>
          <select class="editFormatSelect" data-index="${index}">
            ${renderTextFormatOptions(parsedFormat.format)}
          </select>
          <textarea class="editInput textFormatInput" data-format-enabled="YES" data-index="${index}">${escapeHtml(parsedFormat.text)}</textarea>
        </div>
      `;
    }

    return `
      <div class="${fieldClass}">
        <label>${escapeHtml(labelText)}</label>
        <input 
          class="editInput"
          data-index="${index}"
          value="${escapeAttribute(stripTextFormatTag(value))}"
        />
      </div>
    `;
  }).join("");

  editModal.classList.remove("hidden");
  initRichTextEditors();
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  editingRecord = null;
}

async function saveEditedRecord() {
  if (!editingRecord) {
    showToast("No record selected.");
    return;
  }

  const inputs = document.querySelectorAll(".editInput");
  const updatedValues = [...editingRecord.cells];

  inputs.forEach(input => {
    const index = Number(input.dataset.index);
    if (input.dataset.richStorage === "YES") {
      updatedValues[index] = getRichEditorStorageValue(input.id);
    } else if (input.dataset.formatEnabled === "YES") {
      const formatSelect = document.querySelector(`.editFormatSelect[data-index="${index}"]`);
      updatedValues[index] = applyTextFormat(input.value.trim(), formatSelect ? formatSelect.value : "left");
    } else {
      updatedValues[index] = input.value;
    }
  });

  showToast("Saving changes...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminUpdate",
        payload: {
          sheetName: editingRecord.sheetName,
          rowNumber: editingRecord.rowNumber,
          values: updatedValues
        }
      })
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText.slice(0, 180) || "Invalid server response.");
    }

    if (result.success) {
      showToast("Record updated.");
      closeEditModal();
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Failed to update record.");

  } catch (error) {
    console.error(error);
    showToast(`Error updating record: ${error.message || "unknown error"}`);
  }
}

async function hideAdminRecord(rowNumber) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const confirmed = confirm("Hide this record? This will set Publish to NO.");

  if (!confirmed) return;

  showToast("Hiding record...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminUnpublish",
        payload: {
          sheetName: currentAdminSheet,
          rowNumber
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      showToastAction("Record hidden.", "Undo", () => restoreAdminRecords([rowNumber]));
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Failed to hide record.");

  } catch (error) {
    console.error(error);
    showToast("Error hiding record.");
  }
}

async function deleteAdminRecord(rowNumber) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const confirmed = confirm("Delete this record permanently? This cannot be undone.");

  if (!confirmed) return;

  const secondConfirm = confirm("Last check: delete this record now?");
  if (!secondConfirm) return;

  showToast("Deleting record...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminDelete",
        payload: {
          sheetName: currentAdminSheet,
          rowNumber
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast("Record deleted.");
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Failed to delete record.");

  } catch (error) {
    console.error(error);
    showToast("Error deleting record.");
  }
}

async function restoreAdminRecords(rowNumbers) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const rows = (rowNumbers || []).map(Number).filter(rowNumber => rowNumber >= 2);
  if (rows.length === 0) return;

  showToast("Restoring record...");

  try {
    await Promise.all(rows.map(rowNumber => fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminRestore",
        payload: {
          sheetName: currentAdminSheet,
          rowNumber
        }
      })
    }).then(async response => {
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Restore failed.");
      return result;
    })));

    showToast(rows.length === 1 ? "Record restored." : `${rows.length} records restored.`);
    refreshCurrentAdminTable();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Error restoring record.");
  }
}

function refreshCurrentAdminTable() {
  if (!currentAdminSheet) {
    setManageStatus("Select a category first.");
    return;
  }

  loadAdminTable(currentAdminSheet);
}

function setActiveManageTab(buttonEl) {
  document.querySelectorAll(".manageTabs button").forEach(btn => {
    btn.classList.remove("active");
  });

  if (buttonEl) {
    buttonEl.classList.add("active");
    return;
  }

  const buttons = document.querySelectorAll(".manageTabs button");

  buttons.forEach(btn => {
    const onclickValue = btn.getAttribute("onclick") || "";

    if (onclickValue.includes(currentAdminSheet)) {
      btn.classList.add("active");
    }
  });
}

function setManageStatus(message) {
  const status = document.getElementById("manageStatus");
  if (status) {
    status.textContent = message;
  }
}

function isFormattedTextField(sheetName, header, index, headers = []) {
  const cleanHeader = normalizeFieldName(header);
  const hasIdColumn = normalizeFieldName(headers[0] || "") === "id";

  if (sheetName === "Announcements") {
    return hasIdColumn ? index === 3 : index === 2;
  }

  if (sheetName === "ThingsToBring") {
    return index === 2;
  }

  if (sheetName === "AdviserReminders") {
    return index === 1;
  }

  if (sheetName === "DailyQuotes") {
    return index === 1;
  }

  if (sheetName === "TickerMessages") {
    return index === 0;
  }

  const formattedFields = {
    ThingsToBring: ["item", "things", "materials", "reminder", "description", "task"],
    AdviserReminders: ["reminder", "message", "description"],
    DailyQuotes: ["quote"],
    TickerMessages: ["message"]
  };

  return (formattedFields[sheetName] || []).includes(cleanHeader);
}

function normalizeFieldName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function applyTextFormat(text, format) {
  const cleanText = stripTextFormatTag(text).trim();
  const cleanFormat = TEXT_FORMAT_OPTIONS.includes(format) ? format : "left";

  if (!cleanText) return "";

  return `[${cleanFormat}]\n${cleanText}`;
}

function parseTextFormat(value) {
  const raw = String(value || "").replace(/\r/g, "").trim();
  const match = raw.match(/^\[(center|left|right|bullets|numbers)\]\s*\n?/i);

  if (!match) {
    return {
      format: "left",
      text: raw
    };
  }

  return {
    format: match[1].toLowerCase(),
    text: raw.replace(match[0], "").trim()
  };
}

function stripTextFormatTag(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/^\[(center|left|right|bullets|numbers)\]\s*\n?/i, "");
}

function renderTextFormatOptions(selectedValue) {
  const labels = {
    center: "Center",
    left: "Left",
    right: "Right",
    bullets: "Bullets",
    numbers: "Numbers"
  };

  return TEXT_FORMAT_OPTIONS.map(value => {
    const selected = value === selectedValue ? "selected" : "";
    return `<option value="${value}" ${selected}>${labels[value]}</option>`;
  }).join("");
}

function formatSheetLabel(sheetName) {
  const labels = {
    Announcements: "Announcements",
    ThingsToBring: "Things to Bring",
    AdviserReminders: "Adviser Reminders",
    PrayerLeaders: "Prayer Leaders",
    DailyQuotes: "Daily Quotes",
    Birthdays: "Birthdays",
    TickerMessages: "Ticker Messages",
    DailyInfo: "Daily Info"
  };

  return labels[sheetName] || sheetName;
}

function getManageHeaderLabel(sheetName, header) {
  const rawHeader = String(header || "").trim();
  const key = normalizeManageHeaderKey(rawHeader);

  if (sheetName === "ThingsToBring" && key === "date") {
    return "Date Needed";
  }

  return rawHeader || header;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function toDateInputValue(value) {
  const text = String(value || "").trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function renderTeacherOptions(selectedValue) {
  const selected = String(selectedValue || "").trim();

  let options = `<option value="">Select Teacher</option>`;

  TEACHER_OPTIONS.forEach(teacher => {
    options += `
      <option value="${escapeAttribute(teacher)}" ${selected === teacher ? "selected" : ""}>
        ${escapeHtml(teacher)}
      </option>
    `;
  });

  if (selected && !TEACHER_OPTIONS.includes(selected)) {
    options += `
      <option value="${escapeAttribute(selected)}" selected>
        ${escapeHtml(selected)}
      </option>
    `;
  }

  return options;
}


/* HOMEPAGE DESIGN SETTINGS - v69 DESIGN STUDIO */
const HOMEPAGE_DESIGN_FIELDS = {
  "HomepageBgColor": "designHomepageBgColor",
  "HomepageTextColor": "designHomepageTextColor",
  "HomepageCardBgColor": "designCardBgColor",
  "HomepageCardTextColor": "designCardTextColor",
  "HomepageCardBorderColor": "designCardBorderColor",
  "HomepageCardShadowColor": "designCardShadowColor",
  "HomepageAccentColor": "designAccentColor",
  "HomepageAccentTextColor": "designAccentTextColor",
  "HomepageCardRadius": "designCardRadius",
  "HomepageShadowStyle": "designShadowStyle",
  "HomepageTopbarBg": "designTopbarBg",
  "HomepageTopbarText": "designTopbarText",
  "HomepageBrandTitleColor": "designBrandTitleColor",
  "HomepageBrandSubtitleColor": "designBrandSubtitleColor",
  "HomepageQuoteBg": "designQuoteBg",
  "HomepageQuoteText": "designQuoteText",
  "HomepageQuoteLabelBg": "designQuoteLabelBg",
  "HomepageQuoteLabelText": "designQuoteLabelText",
  "HomepageTimeBoxBg": "designTimeBoxBg",
  "HomepageTimeBoxText": "designTimeBoxText",
  "HomepageQuoteLabelTextValue": "designQuoteLabelTextValue",
  "HomepageUseSubjectPeriodColors": "designUseSubjectPeriodColors",
  "HomepageOverridePeriodTextColors": "designOverridePeriodTextColors",
  "HomepageCurrentLabelText": "designCurrentLabelText",
  "HomepageCurrentLabelColor": "designCurrentLabelColor",
  "HomepageCurrentCardBg": "designCurrentCardBg",
  "HomepageCurrentSubjectColor": "designCurrentSubjectColor",
  "HomepageCurrentDetailsColor": "designCurrentDetailsColor",
  "HomepageCurrentCountdownBg": "designCurrentCountdownBg",
  "HomepageCurrentCountdownText": "designCurrentCountdownText",
  "HomepageNextLabelText": "designNextLabelText",
  "HomepageNextLabelColor": "designNextLabelColor",
  "HomepageNextCardBg": "designNextCardBg",
  "HomepageNextSubjectColor": "designNextSubjectColor",
  "HomepageNextDetailsColor": "designNextDetailsColor",
  "HomepageNextCountdownBg": "designNextCountdownBg",
  "HomepageNextCountdownText": "designNextCountdownText",
  "HomepageUseSubjectScheduleColors": "designUseSubjectScheduleColors",
  "HomepageTodayScheduleTitle": "designTodayScheduleTitle",
  "HomepageScheduleTitleColor": "designScheduleTitleColor",
  "HomepageSchedulePanelBg": "designSchedulePanelBg",
  "HomepageScheduleCardBg": "designScheduleCardBg",
  "HomepageScheduleCardText": "designScheduleCardText",
  "HomepageScheduleTimeColor": "designScheduleTimeColor",
  "HomepageScheduleDetailsColor": "designScheduleDetailsColor",
  "HomepageScheduleCurrentBadgeBg": "designScheduleCurrentBadgeBg",
  "HomepageScheduleCurrentBadgeText": "designScheduleCurrentBadgeText",
  "HomepageScheduleButtonBg": "designScheduleButtonBg",
  "HomepageScheduleButtonText": "designScheduleButtonText",
  "HomepageAnnouncementsTitleText": "designAnnouncementsTitleText",
  "HomepageAnnouncementsTitleColor": "designAnnouncementsTitleColor",
  "HomepageAnnouncementPanelBg": "designAnnouncementPanelBg",
  "HomepageAnnouncementCardBg": "designAnnouncementCardBg",
  "HomepageAnnouncementTextColor": "designAnnouncementTextColor",
  "HomepageAnnouncementChipBg": "designAnnouncementChipBg",
  "HomepageAnnouncementChipText": "designAnnouncementChipText",
  "HomepageAnnouncementButtonBg": "designAnnouncementButtonBg",
  "HomepageAnnouncementButtonText": "designAnnouncementButtonText",
  "HomepageThingsTitleText": "designThingsTitleText",
  "HomepageThingsTitleColor": "designThingsTitleColor",
  "HomepageThingsPanelBg": "designThingsPanelBg",
  "HomepageThingsItemBg": "designThingsItemBg",
  "HomepageThingsItemText": "designThingsItemText",
  "HomepageThingsSubjectText": "designThingsSubjectText",
  "HomepageThingsStatusBg": "designThingsStatusBg",
  "HomepageThingsStatusText": "designThingsStatusText",
  "HomepageThingsSummaryBg": "designThingsSummaryBg",
  "HomepageThingsSummaryText": "designThingsSummaryText",
  "HomepagePrayerLabelText": "designPrayerLabelText",
  "HomepagePrayerLabelColor": "designPrayerLabelColor",
  "HomepagePrayerCardBg": "designPrayerCardBg",
  "HomepagePrayerCardBorder": "designPrayerCardBorder",
  "HomepagePrayerCardText": "designPrayerCardText",
  "HomepagePrayerNameColor": "designPrayerNameColor",
  "HomepagePrayerDividerColor": "designPrayerDividerColor",
  "HomepagePrayerLinkHoverBg": "designPrayerLinkHoverBg",
  "HomepageCleanersLabelText": "designCleanersLabelText",
  "HomepageCleanersBoxBg": "designCleanersBoxBg",
  "HomepageCleanersBorderColor": "designCleanersBorderColor",
  "HomepageCleanersLabelColor": "designCleanersLabelColor",
  "HomepageCleanersTextColor": "designCleanersTextColor",
  "HomepageCleanersShadowColor": "designCleanersShadowColor",
  "HomepageBirthdayLabelText": "designBirthdayLabelText",
  "HomepageBirthdayLabelColor": "designBirthdayLabelColor",
  "HomepageBirthdayCardBg": "designBirthdayCardBg",
  "HomepageBirthdayCardBorder": "designBirthdayCardBorder",
  "HomepageBirthdayCardAccent": "designBirthdayCardAccent",
  "HomepageBirthdayDateBg": "designBirthdayDateBg",
  "HomepageBirthdayDateTextColor": "designBirthdayDateTextColor",
  "HomepageBirthdayDateBorder": "designBirthdayDateBorder",
  "HomepageBirthdayInnerBg": "designBirthdayInnerBg",
  "HomepageBirthdayInnerBorder": "designBirthdayInnerBorder",
  "HomepageBirthdayIconBg": "designBirthdayIconBg",
  "HomepageBirthdayIconText": "designBirthdayIconText",
  "HomepageBirthdayGreetingColor": "designBirthdayGreetingColor",
  "HomepageBirthdayCelebrantColor": "designBirthdayCelebrantColor",
  "HomepageBirthdayMessageColor": "designBirthdayMessageColor",
  "HomepageBirthdayEmptyBg": "designBirthdayEmptyBg",
  "HomepageBirthdayEmptyText": "designBirthdayEmptyText",
  "HomepageBirthdayTextColor": "designBirthdayTextColor",
  "HomepageAdviserRemindersTitleText": "designAdviserRemindersTitleText",
  "HomepageAdviserRemindersTitleColor": "designAdviserRemindersTitleColor",
  "HomepageTickerBg": "designTickerBg",
  "HomepageTickerText": "designTickerText"
};

const HOMEPAGE_DESIGN_DEFAULTS = {
  "HomepageBgColor": "#f7c600",
  "HomepageTextColor": "#111111",
  "HomepageCardBgColor": "#ffffff",
  "HomepageCardTextColor": "#111111",
  "HomepageCardBorderColor": "#111111",
  "HomepageCardShadowColor": "#111111",
  "HomepageAccentColor": "#f7c600",
  "HomepageAccentTextColor": "#111111",
  "HomepageCardRadius": "16px",
  "HomepageShadowStyle": "classic",
  "HomepageTopbarBg": "#111111",
  "HomepageTopbarText": "#ffffff",
  "HomepageBrandTitleColor": "#ffffff",
  "HomepageBrandSubtitleColor": "#ffd700",
  "HomepageQuoteBg": "#1f1f1f",
  "HomepageQuoteText": "#ffffff",
  "HomepageQuoteLabelBg": "#ffd700",
  "HomepageQuoteLabelText": "#111111",
  "HomepageTimeBoxBg": "#ffd700",
  "HomepageTimeBoxText": "#111111",
  "HomepageQuoteLabelTextValue": "Daily Kindness Quote",
  "HomepageUseSubjectPeriodColors": "YES",
  "HomepageOverridePeriodTextColors": "NO",
  "HomepageCurrentLabelText": "Current Period",
  "HomepageCurrentLabelColor": "#ffd700",
  "HomepageCurrentCardBg": "#111111",
  "HomepageCurrentSubjectColor": "#ffffff",
  "HomepageCurrentDetailsColor": "#ffffff",
  "HomepageCurrentCountdownBg": "#ffd700",
  "HomepageCurrentCountdownText": "#111111",
  "HomepageNextLabelText": "Next Period",
  "HomepageNextLabelColor": "#111111",
  "HomepageNextCardBg": "#fff7c7",
  "HomepageNextSubjectColor": "#111111",
  "HomepageNextDetailsColor": "#111111",
  "HomepageNextCountdownBg": "#111111",
  "HomepageNextCountdownText": "#ffffff",
  "HomepageUseSubjectScheduleColors": "YES",
  "HomepageTodayScheduleTitle": "Today's Schedule",
  "HomepageScheduleTitleColor": "#111111",
  "HomepageSchedulePanelBg": "#ffffff",
  "HomepageScheduleCardBg": "#ffffff",
  "HomepageScheduleCardText": "#111111",
  "HomepageScheduleTimeColor": "#111111",
  "HomepageScheduleDetailsColor": "#111111",
  "HomepageScheduleCurrentBadgeBg": "#111111",
  "HomepageScheduleCurrentBadgeText": "#ffd700",
  "HomepageScheduleButtonBg": "#111111",
  "HomepageScheduleButtonText": "#ffd700",
  "HomepageAnnouncementsTitleText": "Subject Announcements",
  "HomepageAnnouncementsTitleColor": "#111111",
  "HomepageAnnouncementPanelBg": "#ffffff",
  "HomepageAnnouncementCardBg": "#fff7c7",
  "HomepageAnnouncementTextColor": "#111111",
  "HomepageAnnouncementChipBg": "#111111",
  "HomepageAnnouncementChipText": "#ffd700",
  "HomepageAnnouncementButtonBg": "#111111",
  "HomepageAnnouncementButtonText": "#ffd700",
  "HomepageThingsTitleText": "Things to Bring",
  "HomepageThingsTitleColor": "#111111",
  "HomepageThingsPanelBg": "#ffffff",
  "HomepageThingsItemBg": "#fff7c7",
  "HomepageThingsItemText": "#111111",
  "HomepageThingsSubjectText": "#111111",
  "HomepageThingsStatusBg": "#111111",
  "HomepageThingsStatusText": "#ffd700",
  "HomepageThingsSummaryBg": "#111111",
  "HomepageThingsSummaryText": "#ffd700",
  "HomepagePrayerLabelText": "Prayer Leader",
  "HomepagePrayerLabelColor": "#555555",
  "HomepagePrayerCardBg": "#ffffff",
  "HomepagePrayerCardBorder": "#111111",
  "HomepagePrayerCardText": "#111111",
  "HomepagePrayerNameColor": "#111111",
  "HomepagePrayerDividerColor": "#ffd700",
  "HomepagePrayerLinkHoverBg": "#fff7c7",
  "HomepageCleanersLabelText": "Cleaners Today",
  "HomepageCleanersBoxBg": "#111111",
  "HomepageCleanersBorderColor": "#ffd700",
  "HomepageCleanersLabelColor": "#ffffff",
  "HomepageCleanersTextColor": "#ffd700",
  "HomepageCleanersShadowColor": "#111111",
  "HomepageBirthdayLabelText": "Birthday Corner",
  "HomepageBirthdayLabelColor": "#111111",
  "HomepageBirthdayCardBg": "#fffdf0",
  "HomepageBirthdayCardBorder": "#111111",
  "HomepageBirthdayCardAccent": "#ffd700",
  "HomepageBirthdayDateBg": "#111111",
  "HomepageBirthdayDateTextColor": "#ffd700",
  "HomepageBirthdayDateBorder": "#ffd700",
  "HomepageBirthdayInnerBg": "#111111",
  "HomepageBirthdayInnerBorder": "#ffd700",
  "HomepageBirthdayIconBg": "#ffd700",
  "HomepageBirthdayIconText": "#111111",
  "HomepageBirthdayGreetingColor": "#ffd700",
  "HomepageBirthdayCelebrantColor": "#ffffff",
  "HomepageBirthdayMessageColor": "#f5f5f5",
  "HomepageBirthdayEmptyBg": "#111111",
  "HomepageBirthdayEmptyText": "#ffd700",
  "HomepageBirthdayTextColor": "#111111",
  "HomepageAdviserRemindersTitleText": "Adviser Reminders",
  "HomepageAdviserRemindersTitleColor": "#111111",
  "HomepageTickerBg": "#111111",
  "HomepageTickerText": "#ffd700"
};

const HOMEPAGE_DESIGN_CHECKBOX_KEYS = [
  "HomepageUseSubjectPeriodColors",
  "HomepageOverridePeriodTextColors",
  "HomepageUseSubjectScheduleColors"
];

function normalizeHomepageDesignValue(key, value) {
  if (HOMEPAGE_DESIGN_CHECKBOX_KEYS.includes(key)) {
    return String(value || "").trim().toUpperCase() === "YES" ? "YES" : "NO";
  }
  return String(value || "").trim();
}

function fillHomepageDesignForm(settings = {}) {
  Object.entries(HOMEPAGE_DESIGN_FIELDS).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (!input) return;
    const value = normalizeHomepageDesignValue(key, settings[key] || HOMEPAGE_DESIGN_DEFAULTS[key] || "");
    if (input.type === "checkbox") {
      input.checked = value === "YES";
    } else {
      input.value = value;
    }
  });
}

async function loadHomepageDesignSettings() {
  try {
    const response = await fetch(`${ADMIN_API_URL}?type=settings`, { cache: "no-store" });
    const settings = await response.json();
    fillHomepageDesignForm(settings || {});
  } catch (error) {
    fillHomepageDesignForm(HOMEPAGE_DESIGN_DEFAULTS);
  }
}

function collectHomepageDesignSettings() {
  const payload = {};
  Object.entries(HOMEPAGE_DESIGN_FIELDS).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (!input) return;
    payload[key] = input.type === "checkbox" ? (input.checked ? "YES" : "NO") : String(input.value || "").trim();
  });
  return payload;
}

async function saveHomepageDesignSettings() {
  const status = document.getElementById("homepageDesignStatus");
  if (status) status.textContent = "Saving homepage design...";
  const saved = await sendAdminData("homepageDesign", collectHomepageDesignSettings());
  if (status) {
    status.textContent = saved
      ? "Saved. Open Homepage or hard refresh to see the design."
      : "Unable to save design settings. Upload firebase-adapter.js v74, open reset-cache.html, then hard refresh this phone.";
  }
}

function resetHomepageDesignForm(ask = false) {
  if (ask && !confirm("Restore the original ClassBoard design in this form? Click Save after this to apply it.")) return;
  fillHomepageDesignForm(HOMEPAGE_DESIGN_DEFAULTS);
}

async function restoreHomepageDesignDefaults() {
  if (!confirm("Restore original homepage colors and labels now?")) return;
  fillHomepageDesignForm(HOMEPAGE_DESIGN_DEFAULTS);
  await saveHomepageDesignSettings();
}


function buildHomepagePreset(id, name, category, description, swatches, overrides = {}) {
  return {
    id,
    name,
    category,
    description,
    swatches,
    settings: {
      ...HOMEPAGE_DESIGN_DEFAULTS,
      ...overrides
    }
  };
}

const HOMEPAGE_CUSTOM_PRESETS_KEY = "sfk_homepage_custom_presets_v1";

function getCustomHomepagePresets() {
  try {
    const raw = localStorage.getItem(HOMEPAGE_CUSTOM_PRESETS_KEY);
    const presets = JSON.parse(raw || "[]");
    if (!Array.isArray(presets)) return [];
    return presets
      .filter(item => item && item.id && item.name && item.settings)
      .map(item => ({
        ...item,
        category: "custom",
        custom: true,
        description: item.description || "Your saved custom homepage design."
      }));
  } catch (error) {
    return [];
  }
}

function saveCustomHomepagePresets(presets = []) {
  localStorage.setItem(HOMEPAGE_CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

function getAllHomepageThemePresets() {
  return [
    ...HOMEPAGE_THEME_PRESETS,
    ...getCustomHomepagePresets()
  ];
}

function getPresetSwatchesFromSettings(settings = {}) {
  return [
    settings.HomepageBgColor,
    settings.HomepageTopbarBg,
    settings.HomepageCardBgColor,
    settings.HomepageAccentColor,
    settings.HomepageBirthdayCardAccent,
    settings.HomepageCleanersBoxBg
  ].filter(Boolean).slice(0, 6);
}

function saveCurrentDesignAsCustomPreset() {
  const currentSettings = collectHomepageDesignSettings();
  const defaultName = `My Theme ${getCustomHomepagePresets().length + 1}`;
  const name = prompt("Name this custom preset:", defaultName);
  if (!name) return;

  const cleanName = String(name).trim().slice(0, 40);
  if (!cleanName) return;

  const presets = getCustomHomepagePresets();
  const id = `custom-${Date.now()}`;
  const newPreset = {
    id,
    name: cleanName,
    category: "custom",
    custom: true,
    description: "Saved from your edited Homepage Design Studio settings.",
    swatches: getPresetSwatchesFromSettings(currentSettings),
    settings: {
      ...HOMEPAGE_DESIGN_DEFAULTS,
      ...currentSettings
    },
    createdAt: new Date().toISOString()
  };

  presets.push(newPreset);
  saveCustomHomepagePresets(presets);
  const categorySelect = document.getElementById("homepagePresetCategory");
  if (categorySelect) categorySelect.value = "custom";
  renderHomepagePresetGallery();

  const status = document.getElementById("homepageDesignStatus");
  if (status) status.textContent = `"${cleanName}" saved as a custom preset.`;
  showToast(`Custom preset "${cleanName}" saved.`);
}

function deleteCustomHomepagePreset(id) {
  const preset = getCustomHomepagePresets().find(item => item.id === id);
  if (!preset) return;
  if (!confirm(`Delete custom preset "${preset.name}"?`)) return;

  const remaining = getCustomHomepagePresets().filter(item => item.id !== id);
  saveCustomHomepagePresets(remaining);
  renderHomepagePresetGallery();
  showToast("Custom preset deleted.");
}

const HOMEPAGE_THEME_PRESETS = [
  buildHomepagePreset("classic", "Original ClassBoard", "classic", "The default yellow, black, and white ClassBoard look.", ["#f7c600", "#111111", "#ffffff", "#ffd700"], {}),
  buildHomepagePreset("schoolGold", "School Gold", "classic", "Bold school-board look with strong black and gold contrast.", ["#f7c600", "#111111", "#ffffff", "#ffd700"], {
    HomepageBgColor: "#f7c600", HomepageTopbarBg: "#111111", HomepageAccentColor: "#ffd700", HomepageScheduleButtonBg: "#111111", HomepageScheduleButtonText: "#ffd700",
    HomepagePrayerDividerColor: "#ffd700", HomepageCleanersBoxBg: "#111111", HomepageCleanersTextColor: "#ffd700", HomepageBirthdayCardAccent: "#ffd700"
  }),
  buildHomepagePreset("sfkPremium", "SFK Premium Gold", "premium", "Premium black-and-gold style, clean and strong for displays.", ["#0b0b0b", "#ffd000", "#fff7cf", "#2b2410"], {
    HomepageBgColor: "#c7a300", HomepageTextColor: "#111111", HomepageCardBgColor: "#fff7cf", HomepageCardTextColor: "#111111", HomepageCardBorderColor: "#0b0b0b", HomepageCardShadowColor: "#0b0b0b",
    HomepageTopbarBg: "#0b0b0b", HomepageTopbarText: "#fff7cf", HomepageBrandSubtitleColor: "#ffd000", HomepageAccentColor: "#ffd000", HomepageAccentTextColor: "#111111",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0b0b0b", HomepageCurrentSubjectColor: "#ffd000", HomepageCurrentDetailsColor: "#fff7cf", HomepageNextCardBg: "#fff7cf", HomepageNextSubjectColor: "#111111",
    HomepageSchedulePanelBg: "#fff7cf", HomepageAnnouncementPanelBg: "#fff7cf", HomepageThingsPanelBg: "#fff7cf",
    HomepagePrayerCardBg: "#fff7cf", HomepagePrayerCardBorder: "#111111", HomepagePrayerDividerColor: "#ffd000", HomepageCleanersBoxBg: "#111111", HomepageCleanersTextColor: "#ffd000",
    HomepageBirthdayCardBg: "#fff7cf", HomepageBirthdayDateBg: "#111111", HomepageBirthdayDateTextColor: "#ffd000", HomepageBirthdayInnerBg: "#111111", HomepageBirthdayCelebrantColor: "#ffffff"
  }),
  buildHomepagePreset("pastel", "Soft Pastel", "soft", "Soft pink, violet, and gentle classroom colors.", ["#fff1f7", "#f9a8d4", "#7c3aed", "#ffffff"], {
    HomepageBgColor: "#fff1f7", HomepageTopbarBg: "#6d28d9", HomepageCardBorderColor: "#f9a8d4", HomepageAccentColor: "#f9a8d4", HomepageAccentTextColor: "#111111",
    HomepageCurrentLabelColor: "#be185d", HomepageNextLabelColor: "#7c3aed", HomepageScheduleTitleColor: "#be185d", HomepageAnnouncementsTitleColor: "#be185d", HomepageThingsTitleColor: "#7c3aed",
    HomepagePrayerCardBg: "#ffffff", HomepagePrayerDividerColor: "#f9a8d4", HomepageCleanersBoxBg: "#7c3aed", HomepageCleanersTextColor: "#fff1f7",
    HomepageBirthdayCardBg: "#fff1f7", HomepageBirthdayCardAccent: "#f9a8d4", HomepageBirthdayInnerBg: "#7c3aed", HomepageBirthdayGreetingColor: "#f9a8d4", HomepageBirthdayCelebrantColor: "#ffffff"
  }),
  buildHomepagePreset("cottonCandy", "Cotton Candy", "fun", "Cute bright pink and sky blue theme for cheerful classroom vibes.", ["#ffe4f3", "#38bdf8", "#ec4899", "#ffffff"], {
    HomepageBgColor: "#ffe4f3", HomepageTopbarBg: "#0ea5e9", HomepageBrandSubtitleColor: "#ffe4f3", HomepageCardBorderColor: "#38bdf8", HomepageAccentColor: "#ec4899", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#ec4899", HomepageCurrentLabelColor: "#ffffff", HomepageCurrentSubjectColor: "#ffffff", HomepageCurrentDetailsColor: "#fff7fb", HomepageNextCardBg: "#e0f2fe",
    HomepageScheduleTitleColor: "#ec4899", HomepageAnnouncementsTitleColor: "#0ea5e9", HomepageThingsTitleColor: "#ec4899", HomepageCleanersBoxBg: "#0ea5e9", HomepageCleanersTextColor: "#ffffff",
    HomepageBirthdayCardBg: "#fff7fb", HomepageBirthdayCardAccent: "#ec4899", HomepageBirthdayDateBg: "#0ea5e9", HomepageBirthdayInnerBg: "#ec4899", HomepageBirthdayGreetingColor: "#ffffff"
  }),
  buildHomepagePreset("sakura", "Sakura Bloom", "soft", "Warm cherry blossom colors with soft cream panels.", ["#fff1f2", "#fb7185", "#9f1239", "#fff7ed"], {
    HomepageBgColor: "#fff1f2", HomepageCardBgColor: "#fff7ed", HomepageCardBorderColor: "#fb7185", HomepageTopbarBg: "#9f1239", HomepageBrandSubtitleColor: "#fecdd3", HomepageAccentColor: "#fb7185", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#9f1239", HomepageCurrentLabelColor: "#fecdd3", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ffe4e6",
    HomepageScheduleTitleColor: "#9f1239", HomepageAnnouncementsTitleColor: "#be123c", HomepageThingsTitleColor: "#9f1239", HomepageCleanersBoxBg: "#9f1239", HomepageCleanersTextColor: "#fecdd3",
    HomepageBirthdayCardBg: "#fff7ed", HomepageBirthdayCardAccent: "#fb7185", HomepageBirthdayInnerBg: "#9f1239", HomepageBirthdayGreetingColor: "#fecdd3"
  }),
  buildHomepagePreset("lavender", "Lavender Calm", "soft", "Relaxing purple classroom theme, easy on the eyes.", ["#f5f3ff", "#8b5cf6", "#4c1d95", "#ffffff"], {
    HomepageBgColor: "#f5f3ff", HomepageTopbarBg: "#4c1d95", HomepageCardBorderColor: "#c4b5fd", HomepageAccentColor: "#8b5cf6", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#6d28d9", HomepageCurrentLabelColor: "#ddd6fe", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ede9fe",
    HomepageScheduleTitleColor: "#6d28d9", HomepageAnnouncementsTitleColor: "#6d28d9", HomepageThingsTitleColor: "#4c1d95", HomepageCleanersBoxBg: "#4c1d95", HomepageCleanersTextColor: "#ddd6fe",
    HomepageBirthdayCardBg: "#f5f3ff", HomepageBirthdayCardAccent: "#8b5cf6", HomepageBirthdayDateBg: "#4c1d95", HomepageBirthdayDateTextColor: "#ddd6fe", HomepageBirthdayInnerBg: "#6d28d9"
  }),
  buildHomepagePreset("modernBlue", "Modern Blue", "modern", "Clean blue interface with professional dashboard feel.", ["#dbeafe", "#2563eb", "#0f172a", "#ffffff"], {
    HomepageBgColor: "#dbeafe", HomepageTopbarBg: "#0f172a", HomepageBrandSubtitleColor: "#93c5fd", HomepageAccentColor: "#2563eb", HomepageAccentTextColor: "#ffffff", HomepageCardBorderColor: "#1d4ed8",
    HomepageCurrentLabelText: "Now Learning", HomepageNextLabelText: "Up Next", HomepageCurrentLabelColor: "#dbeafe", HomepageNextLabelColor: "#1d4ed8", HomepageScheduleTitleColor: "#1d4ed8", HomepageAnnouncementsTitleColor: "#1d4ed8", HomepageThingsTitleColor: "#1d4ed8",
    HomepageScheduleButtonBg: "#1d4ed8", HomepageScheduleButtonText: "#ffffff", HomepageCleanersBoxBg: "#0f172a", HomepageCleanersTextColor: "#93c5fd", HomepageBirthdayCardAccent: "#2563eb"
  }),
  buildHomepagePreset("skyClass", "Sky Classroom", "modern", "Light sky theme with clear blue labels and soft panels.", ["#e0f2fe", "#0284c7", "#075985", "#ffffff"], {
    HomepageBgColor: "#e0f2fe", HomepageCardBgColor: "#ffffff", HomepageCardBorderColor: "#7dd3fc", HomepageTopbarBg: "#075985", HomepageBrandSubtitleColor: "#bae6fd", HomepageAccentColor: "#0284c7", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#075985", HomepageCurrentLabelColor: "#bae6fd", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f0f9ff",
    HomepageScheduleTitleColor: "#0369a1", HomepageAnnouncementsTitleColor: "#0369a1", HomepageThingsTitleColor: "#0369a1", HomepageCleanersBoxBg: "#075985", HomepageCleanersTextColor: "#bae6fd",
    HomepageBirthdayCardBg: "#f0f9ff", HomepageBirthdayCardAccent: "#0284c7", HomepageBirthdayDateBg: "#075985", HomepageBirthdayDateTextColor: "#bae6fd", HomepageBirthdayInnerBg: "#0369a1"
  }),
  buildHomepagePreset("forest", "Forest Green", "nature", "Natural green theme with calm earthy details.", ["#dcfce7", "#166534", "#052e16", "#fefce8"], {
    HomepageBgColor: "#dcfce7", HomepageCardBgColor: "#fefce8", HomepageCardBorderColor: "#166534", HomepageTopbarBg: "#052e16", HomepageBrandSubtitleColor: "#bbf7d0", HomepageAccentColor: "#22c55e", HomepageAccentTextColor: "#052e16",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#14532d", HomepageCurrentLabelColor: "#bbf7d0", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f0fdf4",
    HomepageScheduleTitleColor: "#166534", HomepageAnnouncementsTitleColor: "#166534", HomepageThingsTitleColor: "#166534", HomepageCleanersBoxBg: "#052e16", HomepageCleanersTextColor: "#bbf7d0",
    HomepageBirthdayCardBg: "#fefce8", HomepageBirthdayCardAccent: "#22c55e", HomepageBirthdayInnerBg: "#14532d", HomepageBirthdayGreetingColor: "#bbf7d0"
  }),
  buildHomepagePreset("mint", "Mint Fresh", "nature", "Fresh mint and teal theme, clean but playful.", ["#ccfbf1", "#0f766e", "#134e4a", "#ffffff"], {
    HomepageBgColor: "#ccfbf1", HomepageCardBorderColor: "#5eead4", HomepageTopbarBg: "#134e4a", HomepageBrandSubtitleColor: "#99f6e4", HomepageAccentColor: "#14b8a6", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0f766e", HomepageCurrentLabelColor: "#ccfbf1", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f0fdfa",
    HomepageScheduleTitleColor: "#0f766e", HomepageAnnouncementsTitleColor: "#0f766e", HomepageThingsTitleColor: "#0f766e", HomepageCleanersBoxBg: "#134e4a", HomepageCleanersTextColor: "#99f6e4",
    HomepageBirthdayCardAccent: "#14b8a6", HomepageBirthdayDateBg: "#134e4a", HomepageBirthdayDateTextColor: "#99f6e4", HomepageBirthdayInnerBg: "#0f766e"
  }),
  buildHomepagePreset("sunset", "Sunset Orange", "fun", "Warm orange, coral, and cream for a lively homepage.", ["#ffedd5", "#f97316", "#9a3412", "#fff7ed"], {
    HomepageBgColor: "#ffedd5", HomepageCardBgColor: "#fff7ed", HomepageCardBorderColor: "#fb923c", HomepageTopbarBg: "#9a3412", HomepageBrandSubtitleColor: "#fed7aa", HomepageAccentColor: "#f97316", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#c2410c", HomepageCurrentLabelColor: "#fed7aa", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fff7ed",
    HomepageScheduleTitleColor: "#c2410c", HomepageAnnouncementsTitleColor: "#c2410c", HomepageThingsTitleColor: "#9a3412", HomepageCleanersBoxBg: "#9a3412", HomepageCleanersTextColor: "#fed7aa",
    HomepageBirthdayCardBg: "#fff7ed", HomepageBirthdayCardAccent: "#f97316", HomepageBirthdayInnerBg: "#c2410c", HomepageBirthdayGreetingColor: "#fed7aa"
  }),
  buildHomepagePreset("coral", "Coral Pop", "fun", "Energetic coral theme with bright readable cards.", ["#fff1f2", "#ef4444", "#7f1d1d", "#ffffff"], {
    HomepageBgColor: "#fff1f2", HomepageCardBorderColor: "#fca5a5", HomepageTopbarBg: "#7f1d1d", HomepageAccentColor: "#ef4444", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#b91c1c", HomepageCurrentLabelColor: "#fee2e2", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fee2e2",
    HomepageScheduleTitleColor: "#b91c1c", HomepageAnnouncementsTitleColor: "#b91c1c", HomepageThingsTitleColor: "#991b1b", HomepageCleanersBoxBg: "#7f1d1d", HomepageCleanersTextColor: "#fecaca",
    HomepageBirthdayCardAccent: "#ef4444", HomepageBirthdayDateBg: "#7f1d1d", HomepageBirthdayDateTextColor: "#fecaca", HomepageBirthdayInnerBg: "#991b1b"
  }),
  buildHomepagePreset("royalPurple", "Royal Purple", "premium", "Bold purple with gold accents for a premium look.", ["#2e1065", "#a855f7", "#facc15", "#faf5ff"], {
    HomepageBgColor: "#581c87", HomepageTextColor: "#faf5ff", HomepageCardBgColor: "#faf5ff", HomepageCardTextColor: "#2e1065", HomepageCardBorderColor: "#2e1065", HomepageTopbarBg: "#2e1065", HomepageBrandSubtitleColor: "#facc15", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#2e1065",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#2e1065", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f3e8ff",
    HomepageScheduleTitleColor: "#2e1065", HomepageAnnouncementsTitleColor: "#2e1065", HomepageThingsTitleColor: "#2e1065", HomepageCleanersBoxBg: "#2e1065", HomepageCleanersTextColor: "#facc15",
    HomepageBirthdayCardBg: "#faf5ff", HomepageBirthdayCardAccent: "#facc15", HomepageBirthdayDateBg: "#2e1065", HomepageBirthdayInnerBg: "#2e1065", HomepageBirthdayGreetingColor: "#facc15"
  }),
  buildHomepagePreset("dark", "Dark Premium", "premium", "Dark mode with gold accents, best for projector displays.", ["#101014", "#ffd000", "#1d1d24", "#fff8d8"], {
    HomepageBgColor: "#101014", HomepageTextColor: "#fff8d8", HomepageCardBgColor: "#1d1d24", HomepageCardTextColor: "#fff8d8", HomepageCardBorderColor: "#ffd000", HomepageCardShadowColor: "#000000", HomepageTopbarBg: "#000000", HomepageTopbarText: "#fff8d8", HomepageAccentColor: "#ffd000", HomepageAccentTextColor: "#111111",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#000000", HomepageCurrentLabelColor: "#ffd000", HomepageCurrentSubjectColor: "#fff8d8", HomepageCurrentDetailsColor: "#fff8d8", HomepageNextCardBg: "#1d1d24", HomepageNextLabelColor: "#ffd000", HomepageNextSubjectColor: "#fff8d8", HomepageNextDetailsColor: "#fff8d8",
    HomepageScheduleTitleColor: "#ffd000", HomepageSchedulePanelBg: "#1d1d24", HomepageScheduleCardBg: "#2b2b35", HomepageScheduleCardText: "#fff8d8", HomepageAnnouncementPanelBg: "#1d1d24", HomepageAnnouncementCardBg: "#2b2b35", HomepageAnnouncementTextColor: "#fff8d8", HomepageThingsPanelBg: "#1d1d24", HomepageThingsItemBg: "#2b2b35", HomepageThingsItemText: "#fff8d8",
    HomepagePrayerCardBg: "#1d1d24", HomepagePrayerCardBorder: "#ffd000", HomepagePrayerCardText: "#fff8d8", HomepagePrayerNameColor: "#fff8d8", HomepagePrayerDividerColor: "#ffd000", HomepageCleanersBoxBg: "#000000", HomepageCleanersBorderColor: "#ffd000", HomepageCleanersLabelColor: "#fff8d8", HomepageCleanersTextColor: "#ffd000",
    HomepageBirthdayCardBg: "#1d1d24", HomepageBirthdayCardBorder: "#ffd000", HomepageBirthdayCardAccent: "#ffd000", HomepageBirthdayDateBg: "#000000", HomepageBirthdayDateTextColor: "#ffd000", HomepageBirthdayDateBorder: "#ffd000", HomepageBirthdayInnerBg: "#000000", HomepageBirthdayInnerBorder: "#ffd000", HomepageBirthdayGreetingColor: "#ffd000", HomepageBirthdayCelebrantColor: "#ffffff", HomepageBirthdayMessageColor: "#fff8d8", HomepageBirthdayEmptyBg: "#000000", HomepageBirthdayEmptyText: "#ffd000", HomepageTickerBg: "#000000", HomepageTickerText: "#ffd000"
  }),
  buildHomepagePreset("chalkboard", "Chalkboard", "classic", "Green board classroom style with chalk-like warm text.", ["#052e16", "#166534", "#fef3c7", "#ffffff"], {
    HomepageBgColor: "#14532d", HomepageTextColor: "#fef3c7", HomepageCardBgColor: "#fefce8", HomepageCardTextColor: "#052e16", HomepageCardBorderColor: "#052e16", HomepageTopbarBg: "#052e16", HomepageBrandSubtitleColor: "#fef3c7", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#052e16",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#052e16", HomepageCurrentLabelText: "Now on Board", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#fef3c7", HomepageNextCardBg: "#fefce8",
    HomepageScheduleTitleColor: "#052e16", HomepageAnnouncementsTitleColor: "#052e16", HomepageThingsTitleColor: "#052e16", HomepageCleanersBoxBg: "#052e16", HomepageCleanersTextColor: "#facc15", HomepageBirthdayInnerBg: "#052e16", HomepageBirthdayGreetingColor: "#facc15"
  }),
  buildHomepagePreset("minimal", "Clean Minimal", "modern", "Simple white, black, and gray layout with less visual noise.", ["#f8fafc", "#111827", "#e5e7eb", "#ffffff"], {
    HomepageBgColor: "#f8fafc", HomepageCardBgColor: "#ffffff", HomepageCardTextColor: "#111827", HomepageCardBorderColor: "#d1d5db", HomepageCardShadowColor: "#9ca3af", HomepageAccentColor: "#111827", HomepageAccentTextColor: "#ffffff", HomepageTopbarBg: "#111827", HomepageBrandSubtitleColor: "#d1d5db", HomepageShadowStyle: "soft",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#111827", HomepageCurrentLabelColor: "#d1d5db", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ffffff", HomepageNextLabelColor: "#111827",
    HomepageScheduleTitleColor: "#111827", HomepageAnnouncementsTitleColor: "#111827", HomepageThingsTitleColor: "#111827", HomepageCleanersBoxBg: "#111827", HomepageCleanersTextColor: "#ffffff", HomepageBirthdayCardAccent: "#111827", HomepageTickerBg: "#111827", HomepageTickerText: "#ffffff"
  }),
  buildHomepagePreset("creamCafe", "Cream Café", "soft", "Warm cream and coffee colors for calm readable homepage.", ["#fef3c7", "#92400e", "#451a03", "#fff7ed"], {
    HomepageBgColor: "#fef3c7", HomepageCardBgColor: "#fff7ed", HomepageCardBorderColor: "#92400e", HomepageTopbarBg: "#451a03", HomepageBrandSubtitleColor: "#fde68a", HomepageAccentColor: "#d97706", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#78350f", HomepageCurrentLabelColor: "#fde68a", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fff7ed",
    HomepageScheduleTitleColor: "#78350f", HomepageAnnouncementsTitleColor: "#78350f", HomepageThingsTitleColor: "#78350f", HomepageCleanersBoxBg: "#451a03", HomepageCleanersTextColor: "#fde68a", HomepageBirthdayCardAccent: "#d97706", HomepageBirthdayInnerBg: "#78350f", HomepageBirthdayGreetingColor: "#fde68a"
  }),
  buildHomepagePreset("cyber", "Cyber Neon", "premium", "Futuristic dark theme with cyan and neon accents.", ["#020617", "#22d3ee", "#a3e635", "#111827"], {
    HomepageBgColor: "#020617", HomepageTextColor: "#e0f2fe", HomepageCardBgColor: "#0f172a", HomepageCardTextColor: "#e0f2fe", HomepageCardBorderColor: "#22d3ee", HomepageCardShadowColor: "#000000", HomepageTopbarBg: "#020617", HomepageBrandSubtitleColor: "#a3e635", HomepageAccentColor: "#22d3ee", HomepageAccentTextColor: "#020617", HomepageShadowStyle: "soft",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0f172a", HomepageCurrentLabelColor: "#22d3ee", HomepageCurrentSubjectColor: "#a3e635", HomepageCurrentDetailsColor: "#e0f2fe", HomepageNextCardBg: "#111827", HomepageNextSubjectColor: "#e0f2fe", HomepageNextLabelColor: "#22d3ee",
    HomepageScheduleTitleColor: "#22d3ee", HomepageAnnouncementsTitleColor: "#22d3ee", HomepageThingsTitleColor: "#a3e635", HomepageCleanersBoxBg: "#020617", HomepageCleanersBorderColor: "#22d3ee", HomepageCleanersTextColor: "#a3e635", HomepageBirthdayInnerBg: "#020617", HomepageBirthdayGreetingColor: "#22d3ee", HomepageBirthdayCelebrantColor: "#a3e635", HomepageTickerBg: "#020617", HomepageTickerText: "#22d3ee"
  }),
  buildHomepagePreset("ice", "Ice Crystal", "modern", "Cool icy blue theme with crisp white cards.", ["#ecfeff", "#67e8f9", "#155e75", "#ffffff"], {
    HomepageBgColor: "#ecfeff", HomepageCardBorderColor: "#67e8f9", HomepageTopbarBg: "#155e75", HomepageBrandSubtitleColor: "#cffafe", HomepageAccentColor: "#06b6d4", HomepageAccentTextColor: "#ffffff", HomepageShadowStyle: "soft",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#155e75", HomepageCurrentLabelColor: "#cffafe", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ffffff",
    HomepageScheduleTitleColor: "#155e75", HomepageAnnouncementsTitleColor: "#155e75", HomepageThingsTitleColor: "#155e75", HomepageCleanersBoxBg: "#155e75", HomepageCleanersTextColor: "#cffafe", HomepageBirthdayCardAccent: "#06b6d4", HomepageBirthdayDateBg: "#155e75", HomepageBirthdayInnerBg: "#0e7490"
  }),
  buildHomepagePreset("rainbowSoft", "Rainbow Soft", "fun", "Colorful but still readable classroom display theme.", ["#fde68a", "#f472b6", "#60a5fa", "#34d399"], {
    HomepageBgColor: "#fef9c3", HomepageCardBgColor: "#ffffff", HomepageCardBorderColor: "#f472b6", HomepageTopbarBg: "#111827", HomepageBrandSubtitleColor: "#fde68a", HomepageAccentColor: "#60a5fa", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#f472b6", HomepageCurrentLabelColor: "#ffffff", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#dbeafe", HomepageNextLabelColor: "#2563eb",
    HomepageScheduleTitleColor: "#2563eb", HomepageAnnouncementsTitleColor: "#db2777", HomepageThingsTitleColor: "#059669", HomepageCleanersBoxBg: "#111827", HomepageCleanersTextColor: "#fde68a", HomepageBirthdayCardAccent: "#f472b6", HomepageBirthdayDateBg: "#2563eb", HomepageBirthdayInnerBg: "#db2777"
  }),
  buildHomepagePreset("graphite", "Graphite Gray", "premium", "Dark gray professional theme with yellow highlights.", ["#18181b", "#3f3f46", "#facc15", "#f4f4f5"], {
    HomepageBgColor: "#27272a", HomepageTextColor: "#f4f4f5", HomepageCardBgColor: "#f4f4f5", HomepageCardTextColor: "#18181b", HomepageCardBorderColor: "#18181b", HomepageTopbarBg: "#18181b", HomepageBrandSubtitleColor: "#facc15", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#18181b",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#18181b", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#e4e4e7",
    HomepageScheduleTitleColor: "#18181b", HomepageAnnouncementsTitleColor: "#18181b", HomepageThingsTitleColor: "#18181b", HomepageCleanersBoxBg: "#18181b", HomepageCleanersTextColor: "#facc15", HomepageBirthdayCardAccent: "#facc15", HomepageBirthdayInnerBg: "#18181b"
  }),
  buildHomepagePreset("berry", "Berry Classroom", "fun", "Deep berry and pink for lively but still clean visuals.", ["#fce7f3", "#be185d", "#831843", "#ffffff"], {
    HomepageBgColor: "#fce7f3", HomepageCardBorderColor: "#f9a8d4", HomepageTopbarBg: "#831843", HomepageBrandSubtitleColor: "#fbcfe8", HomepageAccentColor: "#be185d", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#9d174d", HomepageCurrentLabelColor: "#fbcfe8", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fdf2f8",
    HomepageScheduleTitleColor: "#9d174d", HomepageAnnouncementsTitleColor: "#be185d", HomepageThingsTitleColor: "#831843", HomepageCleanersBoxBg: "#831843", HomepageCleanersTextColor: "#fbcfe8", HomepageBirthdayCardAccent: "#be185d", HomepageBirthdayInnerBg: "#831843"
  }),
  buildHomepagePreset("lemonade", "Lemonade", "fun", "Bright yellow and fresh green, sunny but readable.", ["#fef9c3", "#84cc16", "#365314", "#ffffff"], {
    HomepageBgColor: "#fef9c3", HomepageCardBorderColor: "#a3e635", HomepageTopbarBg: "#365314", HomepageBrandSubtitleColor: "#fef08a", HomepageAccentColor: "#84cc16", HomepageAccentTextColor: "#111111",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#365314", HomepageCurrentLabelColor: "#fef08a", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f7fee7",
    HomepageScheduleTitleColor: "#365314", HomepageAnnouncementsTitleColor: "#4d7c0f", HomepageThingsTitleColor: "#365314", HomepageCleanersBoxBg: "#365314", HomepageCleanersTextColor: "#fef08a", HomepageBirthdayCardAccent: "#84cc16", HomepageBirthdayDateBg: "#365314", HomepageBirthdayInnerBg: "#4d7c0f"
  }),
  buildHomepagePreset("navy", "Navy Academy", "classic", "Formal navy and gold, clean for school announcements.", ["#0f172a", "#facc15", "#dbeafe", "#ffffff"], {
    HomepageBgColor: "#dbeafe", HomepageTextColor: "#0f172a", HomepageCardBgColor: "#ffffff", HomepageCardBorderColor: "#0f172a", HomepageTopbarBg: "#0f172a", HomepageBrandSubtitleColor: "#facc15", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#0f172a",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0f172a", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#eff6ff",
    HomepageScheduleTitleColor: "#0f172a", HomepageAnnouncementsTitleColor: "#0f172a", HomepageThingsTitleColor: "#0f172a", HomepageCleanersBoxBg: "#0f172a", HomepageCleanersTextColor: "#facc15", HomepageBirthdayCardAccent: "#facc15", HomepageBirthdayInnerBg: "#0f172a"
  })
];

function getHomepageThemePreset(name) {
  return getAllHomepageThemePresets().find(preset => preset.id === name) || HOMEPAGE_THEME_PRESETS[0];
}

function applyHomepageDesignPreset(name) {
  const preset = getHomepageThemePreset(name);
  fillHomepageDesignForm(preset.settings || HOMEPAGE_DESIGN_DEFAULTS);
  const status = document.getElementById("homepageDesignStatus");
  if (status) status.textContent = `${preset.name} applied. Click Save Homepage Design to publish it.`;
}

async function applyAndSaveHomepageDesignPreset(name) {
  applyHomepageDesignPreset(name);
  await saveHomepageDesignSettings();
}

function renderHomepagePresetGallery() {
  const gallery = document.getElementById("homepagePresetGallery");
  if (!gallery) return;

  const searchInput = document.getElementById("homepagePresetSearch");
  const categorySelect = document.getElementById("homepagePresetCategory");

  if (!gallery.dataset.bound) {
    searchInput?.addEventListener("input", renderHomepagePresetGallery);
    categorySelect?.addEventListener("change", renderHomepagePresetGallery);
    gallery.dataset.bound = "true";
  }

  const query = String(searchInput?.value || "").trim().toLowerCase();
  const category = String(categorySelect?.value || "all");

  const allPresets = getAllHomepageThemePresets();
  const filtered = allPresets.filter((preset) => {
    const matchesCategory = category === "all" || preset.category === category;
    const haystack = `${preset.name} ${preset.category} ${preset.description}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    gallery.innerHTML = `<p class="fieldHint">No preset found. Try another keyword, choose All themes, or save your current colors as a custom preset.</p>`;
    return;
  }

  gallery.innerHTML = filtered.map((preset) => {
    const settings = preset.settings || {};
    const swatches = (preset.swatches || []).map(color => `<span style="background:${escapeAdminText(color)}"></span>`).join("");
    return `
      <article class="themePresetCard">
        <div class="themePresetPreview"
          style="--preset-bg:${escapeAdminText(settings.HomepageBgColor || '#f7c600')}; --preset-top:${escapeAdminText(settings.HomepageTopbarBg || '#111111')}; --preset-card:${escapeAdminText(settings.HomepageCardBgColor || '#ffffff')}; --preset-accent:${escapeAdminText(settings.HomepageAccentColor || '#ffd000')}; --preset-border:${escapeAdminText(settings.HomepageCardBorderColor || '#111111')};">
          <div class="presetMiniTop"></div>
          <div class="presetMiniCard"></div>
          <div class="presetMiniSide"></div>
        </div>
        <div class="themePresetBadgeRow">
          <span class="themePresetBadge ${preset.custom ? "custom" : ""}">${preset.custom ? "custom" : escapeAdminText(preset.category)}</span>
          ${preset.custom ? `<button type="button" class="themePresetDeleteBtn" onclick="deleteCustomHomepagePreset('${escapeAdminText(preset.id)}')" title="Delete custom preset">Delete</button>` : ""}
        </div>
        <div class="themePresetSwatches">${swatches}</div>
        <div class="themePresetMeta">
          <strong>${escapeAdminText(preset.name)}</strong>
          <small>${escapeAdminText(preset.description)}</small>
        </div>
        <div class="themePresetActions">
          <button type="button" onclick="applyHomepageDesignPreset('${escapeAdminText(preset.id)}')">Preview</button>
          <button type="button" onclick="applyAndSaveHomepageDesignPreset('${escapeAdminText(preset.id)}')">Pick + Save</button>
        </div>
      </article>
    `;
  }).join("");
}
// v75 preset gallery marker

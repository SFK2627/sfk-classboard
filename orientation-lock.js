(function sfkPortraitOnlyReminderOnPhones() {
  "use strict";

  const STYLE_ID = "sfkPortraitReminderStyleV2";
  const OVERLAY_ID = "sfkPortraitReminder";
  let allowLandscape = false;

  function isMobileLikeDevice() {
    const ua = navigator.userAgent || "";
    const uaMobile = /Android.+Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const userAgentDataMobile = navigator.userAgentData && navigator.userAgentData.mobile === true;
    const coarse = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const shortestScreenSide = Math.min(screen.width || 0, screen.height || 0);
    const shortestViewportSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    return userAgentDataMobile || uaMobile || (coarse && (shortestScreenSide <= 820 || shortestViewportSide <= 820));
  }

  function isLandscapeViewport() {
    return window.innerWidth > window.innerHeight;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #sfkPortraitReminder {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483000 !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 22px !important;
        background: linear-gradient(135deg, #ffeaa7 0%, #fff7d6 48%, #ffffff 100%) !important;
        color: #111 !important;
        text-align: center !important;
      }

      html.sfkPortraitReminderOn,
      html.sfkPortraitReminderOn body {
        overflow: hidden !important;
      }

      html.sfkPortraitReminderOn #sfkPortraitReminder {
        display: flex !important;
      }

      .sfkPortraitReminderCard {
        width: min(92vw, 440px) !important;
        border: 3px solid #111 !important;
        border-radius: 24px !important;
        background: rgba(255, 255, 255, .94) !important;
        box-shadow: 8px 8px 0 rgba(0, 0, 0, .22) !important;
        padding: 24px 22px !important;
        font-family: inherit !important;
      }

      .sfkPortraitReminderIcon {
        display: grid !important;
        place-items: center !important;
        width: 70px !important;
        height: 70px !important;
        margin: 0 auto 14px !important;
        border-radius: 22px !important;
        border: 3px solid #111 !important;
        background: #ffd700 !important;
        font-size: 2.1rem !important;
        box-shadow: 4px 4px 0 rgba(0,0,0,.18) !important;
      }

      .sfkPortraitReminderCard h2 {
        margin: 0 0 8px !important;
        color: #111 !important;
        font-size: clamp(1.35rem, 4vw, 2rem) !important;
        line-height: 1.05 !important;
        font-weight: 950 !important;
      }

      .sfkPortraitReminderCard p {
        margin: 0 !important;
        color: #333 !important;
        font-size: clamp(.95rem, 2.6vw, 1.08rem) !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    injectStyle();
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("role", "alert");
    overlay.setAttribute("aria-live", "assertive");
    overlay.innerHTML = `
      <div class="sfkPortraitReminderCard">
        <div class="sfkPortraitReminderIcon">📱</div>
        <h2>View in Portrait Mode</h2>
        <p>Please rotate your phone upright para maayos at hindi masira ang ClassBoard layout.</p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  async function tryNativePortraitLock() {
    if (!isMobileLikeDevice()) return;
    try {
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock("portrait-primary");
        } catch (error) {
          await screen.orientation.lock("portrait");
        }
      }
    } catch (error) {
      // Many mobile browsers only allow real orientation lock in installed PWAs.
      // The reminder overlay below protects the portrait layout when lock is unavailable.
    }
  }

  function applyPortraitReminder() {
    ensureOverlay();
    const shouldShow = isMobileLikeDevice() && isLandscapeViewport() && !allowLandscape;
    document.documentElement.classList.toggle("sfkPortraitReminderOn", shouldShow);
  }

  function scheduleApply() {
    requestAnimationFrame(() => {
      applyPortraitReminder();
      setTimeout(applyPortraitReminder, 120);
      setTimeout(applyPortraitReminder, 360);
    });
  }

  function start() {
    ensureOverlay();
    applyPortraitReminder();
    tryNativePortraitLock();
  }

  window.SFK_PHONE_ORIENTATION = {
    allowWatchLandscape(value) {
      allowLandscape = Boolean(value);
      applyPortraitReminder();
      if (!allowLandscape) tryNativePortraitLock();
    },
    refresh: applyPortraitReminder
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("resize", scheduleApply, { passive: true });
  window.addEventListener("orientationchange", () => {
    tryNativePortraitLock();
    scheduleApply();
  }, { passive: true });
  window.addEventListener("pageshow", scheduleApply, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tryNativePortraitLock();
      scheduleApply();
    }
  });
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener("change", () => {
      tryNativePortraitLock();
      scheduleApply();
    });
  }
  document.addEventListener("pointerdown", () => tryNativePortraitLock(), { capture: true, passive: true });
})();

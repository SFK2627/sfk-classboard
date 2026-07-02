(function sfkMobilePortraitOnly() {
  "use strict";

  const OVERLAY_ID = "sfkPortraitOnlyOverlay";
  const STYLE_ID = "sfkPortraitOnlyStyle";

  function isMobileLikeDevice() {
    const ua = navigator.userAgent || "";
    const uaMobile = /Android.+Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const uaTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);
    const coarse = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
    const smallSide = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 540;
    const mobileWidth = Math.min(screen.width || 0, screen.height || 0) <= 600;
    return uaMobile || (coarse && (smallSide || mobileWidth)) || (uaTablet && coarse && Math.min(screen.width || 0, screen.height || 0) <= 820);
  }

  function isLandscape() {
    const type = screen.orientation?.type || "";
    if (type) return String(type).startsWith("landscape");
    return window.innerWidth > window.innerHeight;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        padding: max(18px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left)) !important;
        box-sizing: border-box !important;
        background:
          radial-gradient(circle at top, rgba(247, 198, 0, .22), transparent 38%),
          linear-gradient(135deg, #111 0%, #050505 100%) !important;
        color: #fff !important;
        font-family: Arial, Helvetica, sans-serif !important;
        text-align: center !important;
        pointer-events: auto !important;
        touch-action: none !important;
      }

      #${OVERLAY_ID}.show {
        display: flex !important;
      }

      #${OVERLAY_ID} .sfkPortraitCard {
        max-width: 380px !important;
        width: min(86vw, 380px) !important;
        border: 3px solid #f7c600 !important;
        border-radius: 24px !important;
        background: rgba(255, 248, 220, .97) !important;
        color: #111 !important;
        padding: 22px 20px !important;
        box-shadow: 0 22px 60px rgba(0,0,0,.48) !important;
      }

      #${OVERLAY_ID} .sfkPortraitIcon {
        width: 76px !important;
        height: 76px !important;
        margin: 0 auto 12px !important;
        display: grid !important;
        place-items: center !important;
        border-radius: 22px !important;
        background: #111 !important;
        color: #f7c600 !important;
        font-size: 42px !important;
        transform: rotate(90deg) !important;
      }

      #${OVERLAY_ID} h2 {
        margin: 0 0 8px !important;
        font-size: 1.45rem !important;
        line-height: 1.08 !important;
        font-weight: 1000 !important;
        letter-spacing: -.03em !important;
      }

      #${OVERLAY_ID} p {
        margin: 0 !important;
        font-size: .98rem !important;
        line-height: 1.35 !important;
        font-weight: 800 !important;
      }

      html.sfkPortraitOnlyBlocked,
      html.sfkPortraitOnlyBlocked body {
        overflow: hidden !important;
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
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-live", "assertive");
    overlay.innerHTML = `
      <div class="sfkPortraitCard">
        <div class="sfkPortraitIcon" aria-hidden="true">📱</div>
        <h2>Portrait mode only</h2>
        <p>Please rotate your phone upright to continue using SFK ClassBoard.</p>
      </div>
    `;
    overlay.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
    document.body.appendChild(overlay);
    return overlay;
  }

  function applyPortraitBlock() {
    const shouldBlock = isMobileLikeDevice() && isLandscape();
    const overlay = ensureOverlay();
    overlay.classList.toggle("show", shouldBlock);
    document.documentElement.classList.toggle("sfkPortraitOnlyBlocked", shouldBlock);
  }

  async function tryNativePortraitLock() {
    if (!isMobileLikeDevice()) return;
    try {
      if (screen.orientation?.lock) {
        try {
          await screen.orientation.lock("portrait-primary");
        } catch (error) {
          await screen.orientation.lock("portrait");
        }
      }
    } catch (error) {
      // Many mobile browsers only allow orientation lock in installed PWA/fullscreen.
      // The overlay above still blocks landscape use.
    }
  }

  function scheduleApply() {
    requestAnimationFrame(() => {
      applyPortraitBlock();
      setTimeout(applyPortraitBlock, 150);
    });
  }

  function start() {
    ensureOverlay();
    applyPortraitBlock();
    tryNativePortraitLock();
  }

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
  screen.orientation?.addEventListener?.("change", () => {
    tryNativePortraitLock();
    scheduleApply();
  });

  document.addEventListener("pointerdown", () => tryNativePortraitLock(), { capture: true, passive: true });
})();

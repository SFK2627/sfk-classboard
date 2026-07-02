(function sfkFreezePortraitLayoutOnPhones() {
  "use strict";

  const STYLE_ID = "sfkPortraitFreezeStyle";
  const ROOT = document.documentElement;

  function isMobileLikeDevice() {
    const ua = navigator.userAgent || "";
    const uaMobile = /Android.+Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const userAgentDataMobile = navigator.userAgentData && navigator.userAgentData.mobile === true;
    const coarse = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const shortestScreenSide = Math.min(screen.width || 0, screen.height || 0);
    const shortestViewportSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    return userAgentDataMobile || uaMobile || (coarse && (shortestScreenSide <= 700 || shortestViewportSide <= 700));
  }

  function isLandscapeViewport() {
    return window.innerWidth > window.innerHeight;
  }

  function getRotationDirectionClass() {
    const angle = Number(screen.orientation && screen.orientation.angle);
    if (angle === 270 || angle === -90) return "sfkPortraitRotateCCW";
    return "sfkPortraitRotateCW";
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.sfkPortraitFreeze {
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
        background: #111 !important;
      }

      html.sfkPortraitFreeze body {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        width: var(--sfk-freeze-short-side) !important;
        height: var(--sfk-freeze-long-side) !important;
        min-width: var(--sfk-freeze-short-side) !important;
        min-height: var(--sfk-freeze-long-side) !important;
        max-width: none !important;
        max-height: none !important;
        transform-origin: top left !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: none !important;
        touch-action: pan-y !important;
        backface-visibility: hidden !important;
      }

      html.sfkPortraitFreeze.sfkPortraitRotateCW body {
        transform: translateX(var(--sfk-freeze-viewport-width)) rotate(90deg) !important;
      }

      html.sfkPortraitFreeze.sfkPortraitRotateCCW body {
        transform: translateY(var(--sfk-freeze-viewport-height)) rotate(-90deg) !important;
      }

      html.sfkPortraitFreeze body #sfkIntroOverlay,
      html.sfkPortraitFreeze body .sfkStartIntro,
      html.sfkPortraitFreeze body .announcementImageOverlay,
      html.sfkPortraitFreeze body #announcementImageOverlay {
        max-width: var(--sfk-freeze-short-side) !important;
      }
    `;
    document.head.appendChild(style);
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
      // Browsers often allow real orientation lock only inside installed PWAs.
      // The CSS freeze below keeps the app in portrait layout when lock is unavailable.
    }
  }

  function applyPortraitFreeze() {
    injectStyle();
    const shouldFreeze = isMobileLikeDevice() && isLandscapeViewport();
    const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);

    ROOT.style.setProperty("--sfk-freeze-viewport-width", `${width}px`);
    ROOT.style.setProperty("--sfk-freeze-viewport-height", `${height}px`);
    ROOT.style.setProperty("--sfk-freeze-short-side", `${shortSide}px`);
    ROOT.style.setProperty("--sfk-freeze-long-side", `${longSide}px`);

    ROOT.classList.toggle("sfkPortraitFreeze", shouldFreeze);
    ROOT.classList.remove("sfkPortraitRotateCW", "sfkPortraitRotateCCW");
    if (shouldFreeze) ROOT.classList.add(getRotationDirectionClass());
  }

  function scheduleApply() {
    requestAnimationFrame(() => {
      applyPortraitFreeze();
      setTimeout(applyPortraitFreeze, 120);
      setTimeout(applyPortraitFreeze, 360);
    });
  }

  function start() {
    injectStyle();
    applyPortraitFreeze();
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
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener("change", () => {
      tryNativePortraitLock();
      scheduleApply();
    });
  }
  document.addEventListener("pointerdown", () => tryNativePortraitLock(), { capture: true, passive: true });
})();

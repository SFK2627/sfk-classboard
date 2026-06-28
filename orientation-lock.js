(function lockSfkPhoneToPortrait() {
  const orientation = window.screen?.orientation;
  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isPhone = () => {
    const userAgentDataMobile = window.navigator.userAgentData?.mobile;
    const phoneUserAgent = /iPhone|iPod|Android.+Mobile|Windows Phone|webOS|BlackBerry/i
      .test(window.navigator.userAgent || "");
    return userAgentDataMobile === true || phoneUserAgent;
  };
  const isWatchLandscapeAllowed = () => window.SFK_WATCH_PARTY_LANDSCAPE === true;

  let locking = false;
  let portraitLocked = false;

  async function lockPortrait(allowFullscreen) {
    if (locking || portraitLocked || !isPhone() || !orientation?.lock || isWatchLandscapeAllowed()) return;
    locking = true;

    try {
      if (
        allowFullscreen &&
        !isStandalone() &&
        !document.fullscreenElement &&
        document.fullscreenEnabled &&
        document.documentElement.requestFullscreen
      ) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }

      if (isWatchLandscapeAllowed()) return;
      try {
        await orientation.lock("portrait-primary");
      } catch (error) {
        await orientation.lock("portrait");
      }
      portraitLocked = true;
    } catch (error) {
      // Installed PWAs and supported Android browsers enforce the lock.
    } finally {
      locking = false;
    }
  }

  async function allowWatchLandscape(allowed) {
    window.SFK_WATCH_PARTY_LANDSCAPE = allowed === true;
    if (allowed) {
      portraitLocked = false;
      try {
        orientation?.unlock?.();
      } catch (error) {
        // The browser may use device auto-rotate without exposing unlock().
      }
      return;
    }
    await lockPortrait(false);
  }

  window.SFK_PHONE_ORIENTATION = { allowWatchLandscape };

  const retryLock = () => lockPortrait(false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", retryLock, { once: true });
  } else {
    retryLock();
  }

  window.addEventListener("pageshow", retryLock);
  window.addEventListener("orientationchange", () => {
    portraitLocked = false;
    retryLock();
  });
  orientation?.addEventListener?.("change", () => {
    if (!String(orientation.type || "").startsWith("portrait")) portraitLocked = false;
    retryLock();
  });
  document.addEventListener("fullscreenchange", () => {
    const fullscreenElement = document.fullscreenElement;
    const watchStage = document.querySelector(".classChatWatchStage");
    const watchFullscreen = fullscreenElement === watchStage
      || Boolean(fullscreenElement && watchStage?.contains(fullscreenElement));
    allowWatchLandscape(watchFullscreen);
  });
  document.addEventListener("webkitfullscreenchange", () => {
    const fullscreenElement = document.webkitFullscreenElement;
    const watchStage = document.querySelector(".classChatWatchStage");
    const watchFullscreen = fullscreenElement === watchStage
      || Boolean(fullscreenElement && watchStage?.contains(fullscreenElement));
    allowWatchLandscape(watchFullscreen);
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.("#classChatWatchFullscreen")) allowWatchLandscape(true);
  }, { capture: true, passive: true });
  document.addEventListener("pointerup", () => lockPortrait(true), {
    capture: true,
    passive: true
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) retryLock();
  });
})();

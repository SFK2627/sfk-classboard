(() => {
  let deferredInstallPrompt = null;

  const installButton = document.getElementById("installAppBtn");
  const SW_URL = "./sw.js?v=top-pill-long-v97";
  const CONTROLLER_RELOAD_KEY = "sfkPwaControllerReloadV97TopPillLong";
  const STANDALONE_BOOT_RELOAD_KEY = "sfkPwaStandaloneBootReloadV97TopPillLong";

  function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function reloadOnce(key) {
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
      window.location.reload();
    } catch (error) {
      window.location.reload();
    }
  }

  function askWorkerToActivate(worker) {
    if (!worker) return;
    try {
      worker.postMessage({ type: "SFK_SKIP_WAITING_TOP_PILL_LONG_V97" });
    } catch (error) {}
  }

  async function setupServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: "./",
        updateViaCache: "none"
      });

      registration.update().catch(() => {});
      askWorkerToActivate(registration.waiting);

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            askWorkerToActivate(worker);
          }
        });
      });

      window.addEventListener("pageshow", () => registration.update().catch(() => {}));
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    } catch (error) {
      console.warn("Service worker registration failed:", error);
    }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      reloadOnce(CONTROLLER_RELOAD_KEY);
    });

    window.addEventListener("load", () => {
      setupServiceWorker();

      if (isStandaloneApp()) {
        window.setTimeout(() => {
          if (!navigator.serviceWorker.controller) {
            reloadOnce(STANDALONE_BOOT_RELOAD_KEY);
          }
        }, 4000);
      }
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    installButton.hidden = true;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  if (isStandaloneApp() && installButton) {
    installButton.hidden = true;
  }
})();

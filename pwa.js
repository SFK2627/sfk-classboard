let deferredInstallPrompt = null;

const installButton = document.getElementById("installAppBtn");
const MEDIA_FIX_RELOAD_KEY = "sfkMediaFixV8ControllerReloaded";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      registration.update().catch(() => {});

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SFK_SKIP_WAITING_V8" });
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SFK_SKIP_WAITING_V8" });
          }
        });
      });
    }).catch((error) => {
      console.warn("Service worker registration failed:", error);
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      try {
        if (sessionStorage.getItem(MEDIA_FIX_RELOAD_KEY) === "1") return;
        sessionStorage.setItem(MEDIA_FIX_RELOAD_KEY, "1");
        window.location.reload();
      } catch (error) {
        window.location.reload();
      }
    });
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

if (window.matchMedia("(display-mode: standalone)").matches && installButton) {
  installButton.hidden = true;
}

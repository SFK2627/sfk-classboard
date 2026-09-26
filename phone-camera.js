(() => {
  "use strict";
  const ICE = window.SFK_PHOTOBOOTH_ICE_SERVERS || [{ urls: "stun:stun.l.google.com:19302" }];
  const preview = document.getElementById("phonePreview");
  const start = document.getElementById("phoneStart");
  const capture = document.getElementById("phoneCapture");
  const flip = document.getElementById("phoneFlip");
  const stop = document.getElementById("phoneStop");
  const area = document.querySelector(".cameraArea");
  const status = document.getElementById("phoneStatus");
  const zoomInput = document.getElementById("phoneZoom");
  const zoomLabel = document.getElementById("phoneZoomValue");
  const countdown = document.getElementById("phoneCountdown");
  const id = new URLSearchParams(location.hash.slice(1)).get("pair");
  let ref, stream, peer, channel, mode = "environment", busy = false, zoom = 1, zoomTimer, photoAck, activePhotoId;
  let sessionReady = false, sessionActive = false;

  function say(message, error = false) { status.textContent = message; status.classList.toggle("error", error); }
  function showCountdown(value, caption) {
    countdown.hidden = false;
    document.getElementById("phoneCountdownNumber").textContent = String(value);
    document.getElementById("phoneCountdownCaption").textContent = caption || "Get ready!";
  }
  function sendState(message) {
    if (channel?.readyState !== "open") return false;
    try { channel.send(JSON.stringify(message)); return true; } catch { return false; }
  }
  function updateCaptureButton(label = "Start Photo Session") {
    capture.hidden = channel?.readyState !== "open";
    capture.disabled = !sessionReady || sessionActive;
    capture.textContent = `📸 ${label}`;
    capture.setAttribute("aria-label", label);
  }
  function requestSession() {
    if (!sessionReady || sessionActive || busy || channel?.readyState !== "open") return;
    sessionActive = true;
    updateCaptureButton();
    say("Starting photo session on the booth screen… ✨");
    if (!sendState({ type:"start-session" })) {
      sessionActive = false;
      updateCaptureButton();
      say("Connection interrupted. Try again.", true);
    }
  }
  async function applyZoom(value = zoom) {
    zoom = Math.max(1, Math.min(Number(zoomInput.max) || 3, Number(value) || 1));
    zoomInput.value = String(zoom);
    zoomLabel.textContent = `${zoom.toFixed(1)}×`;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const range = track.getCapabilities?.().zoom;
    let digital = zoom;
    if (range && Number.isFinite(range.min) && Number.isFinite(range.max) && track.applyConstraints) {
      try { await track.applyConstraints({ advanced:[{ zoom:Math.max(range.min, Math.min(range.max, zoom)) }] }); digital = 1; }
      catch { digital = zoom; }
    }
    area.style.setProperty("--camera-digital-zoom", String(digital));
    sendState({ type:"zoom-state", zoom, digital, max:Number(zoomInput.max) });
  }
  function configureZoom() {
    const track = stream?.getVideoTracks()[0];
    const range = track?.getCapabilities?.().zoom;
    zoomInput.min = "1";
    zoomInput.max = String(range && range.max > 1 ? Math.min(6, range.max) : 3);
    zoom = 1;
    applyZoom(1).catch(() => {});
  }
  async function tunePreview(sender) {
    try {
      const parameters = sender?.getParameters?.();
      if (!parameters?.encodings?.length) return;
      parameters.encodings[0].scaleResolutionDownBy = 1.5;
      parameters.encodings[0].maxBitrate = 1200000;
      parameters.encodings[0].maxFramerate = 24;
      await sender.setParameters(parameters);
    } catch {} // The camera track remains full resolution for still capture.
  }
  async function prioritizePhotoTransfer(limited) {
    const sender = peer?.getSenders?.().find((item) => item.track?.kind === "video");
    try {
      const parameters = sender?.getParameters?.();
      if (!parameters?.encodings?.length) return;
      // Reduce the *network preview* briefly; this does not resize or recompress
      // the camera's original still photo or change its capture track.
      parameters.encodings[0].scaleResolutionDownBy = limited ? 2.5 : 1.5;
      parameters.encodings[0].maxBitrate = limited ? 300000 : 1200000;
      parameters.encodings[0].maxFramerate = limited ? 20 : 24;
      await sender.setParameters(parameters);
    } catch {} // Some browsers do not support updating sender encodings.
  }
  function waitForPhotoAck(id) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { photoAck = null; reject(new Error("Photo confirmation timed out. Check the booth screen.")); }, 15000);
      photoAck = { id, resolve:() => { clearTimeout(timer); photoAck = null; resolve(); }, reject:(error) => { clearTimeout(timer); photoAck = null; reject(error); } };
    });
  }
  function cleanup(message = "Disconnected.") {
    clearTimeout(zoomTimer);
    photoAck?.reject(new Error("Connection lost."));
    activePhotoId = null;
    try { channel?.close(); } catch {}
    try { peer?.close(); } catch {}
    stream?.getTracks().forEach((track) => track.stop());
    channel = peer = stream = null;
    preview.srcObject = null;
    area.classList.remove("is-live", "is-front");
    area.style.removeProperty("--camera-digital-zoom");
    countdown.hidden = true;
    document.getElementById("phoneZoomControl").hidden = true;
    zoomInput.disabled = false;
    flip.hidden = stop.hidden = true;
    start.hidden = false;
    start.disabled = false;
    busy = false;
    sessionReady = sessionActive = false;
    updateCaptureButton();
    say(message);
  }
  function waitForIce(connection) {
    if (connection.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => { clearTimeout(timer); connection.removeEventListener("icegatheringstatechange", check); resolve(); };
      const check = () => { if (connection.iceGatheringState === "complete") finish(); };
      const timer = setTimeout(finish, 12000);
      connection.addEventListener("icegatheringstatechange", check);
    });
  }

  async function takePhoto() {
    const track = stream?.getVideoTracks()[0];
    if (!track || track.readyState !== "live") throw new Error("Camera is off.");
    if (window.ImageCapture) {
      try {
        const camera = new ImageCapture(track);
        const size = camera.getPhotoCapabilities ? await camera.getPhotoCapabilities().catch(() => null) : null;
        let blob;
        if (size?.imageWidth?.max && size?.imageHeight?.max) {
          try { blob = await camera.takePhoto({ imageWidth:size.imageWidth.max, imageHeight:size.imageHeight.max }); } catch {}
        }
        blob ||= await camera.takePhoto();
        if (blob.size > 0) return blob;
      } catch {}
    }
    if (!preview.videoWidth) throw new Error("Camera image not ready.");
    // Browsers without ImageCapture can temporarily request a larger video frame
    // for the still; the WebRTC preview's bitrate limit remains in place.
    const prior = track.getConstraints?.();
    let changed = false;
    try {
      if (prior && track.applyConstraints) {
        try {
          const oldWidth = preview.videoWidth;
          await track.applyConstraints({ ...prior, width:{ideal:3840}, height:{ideal:2160}, frameRate:{ideal:15} });
          changed = true;
          const deadline = Date.now() + 650;
          while (preview.videoWidth === oldWidth && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 70));
        } catch {} // Keep the original track if the camera cannot offer a larger frame.
      }
      const canvas = document.createElement("canvas");
      canvas.width = preview.videoWidth;
      canvas.height = preview.videoHeight;
      canvas.getContext("2d").drawImage(preview, 0, 0);
      return await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to save image.")), "image/jpeg", .97));
    } finally {
      if (changed) await track.applyConstraints(prior).catch(() => {});
    }
  }
  async function sendPhoto(id) {
    if (busy || !channel || channel.readyState !== "open") return;
    busy = true;
    activePhotoId = id;
    let previewLimited = false;
    const startedAt = performance.now();
    try {
      showCountdown("✦", "Taking a high-quality photo…");
      say("Taking photo… ✦");
      const blob = await takePhoto();
      const captureMs = Math.round(performance.now() - startedAt);
      if (blob.size > 64 * 1024 * 1024) throw new Error("This photo exceeds the browser transfer limit. Choose another camera resolution.");
      await prioritizePhotoTransfer(true);
      previewLimited = true;
      const buffer = await blob.arrayBuffer();
      channel.send(JSON.stringify({ type: "photo", id, bytes: buffer.byteLength, mime: blob.type }));
      channel.bufferedAmountLowThreshold = 192 * 1024;
      say("Sending original phone photo to the booth…");
      countdown.hidden = true;
      const maxMessageSize = peer?.sctp?.maxMessageSize;
      const chunkSize = maxMessageSize === 0 || maxMessageSize >= 32768 ? 32768 :
        Number.isFinite(maxMessageSize) && maxMessageSize > 0 ? Math.min(16384, maxMessageSize) : 16384;
      for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
        if (channel.readyState !== "open") throw new Error("Connection lost.");
        if (channel.bufferedAmount > 384 * 1024) await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { done(new Error("Connection slowed down.")); }, 30000);
          let finished = false;
          function done(error) { if (finished) return; finished = true; clearTimeout(timer); channel.removeEventListener("bufferedamountlow", drained); channel.removeEventListener("close", closed); error ? reject(error) : resolve(); }
          function drained() { done(); }
          function closed() { done(new Error("Connection lost.")); }
          channel.addEventListener("bufferedamountlow", drained);
          channel.addEventListener("close", closed);
          if (channel.readyState !== "open") closed();
          else if (channel.bufferedAmount <= channel.bufferedAmountLowThreshold) drained();
        });
        // A view avoids copying every chunk into another JS ArrayBuffer.
        channel.send(new Uint8Array(buffer, offset, Math.min(chunkSize, buffer.byteLength - offset)));
        // Keep the camera preview and controls responsive during a large still.
        if ((offset + chunkSize) % (256 * 1024) < chunkSize) await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const acknowledgment = waitForPhotoAck(id);
      try { channel.send(JSON.stringify({ type: "photo-end", id })); }
      catch (error) { photoAck?.reject(error); }
      await acknowledgment;
      countdown.hidden = true;
      say("Photo received! Getting ready for the next shot. ✨");
      console.info("Photobooth phone capture and transfer", { bytes:blob.size, captureMs, transferMs:Math.round(performance.now()-startedAt-captureMs) });
    } catch (error) {
      if (channel?.readyState === "open") sendState({ type: "photo-error", id });
      countdown.hidden = true;
      if (channel?.readyState === "open") say(error.message || "Could not take photo.", true);
    } finally {
      photoAck?.id === id && photoAck.reject(new Error("Photo transfer stopped."));
      if (previewLimited) await prioritizePhotoTransfer(false);
      if (activePhotoId === id) activePhotoId = null;
      busy = false;
    }
  }

  async function connect() {
    start.disabled = true;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("Open this page through HTTPS in a modern browser.");
      if (!ref) throw new Error("The pairing code is unavailable.");
      say("Starting camera…");
      const room = await ref.get();
      const data = room.data();
      if (!room.exists || !data?.offer || data.answer || !data.expiresAt || data.expiresAt.toMillis() < Date.now()) throw new Error("This code has expired or was already used. Generate a new code on the photobooth screen.");
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      preview.srcObject = stream;
      await preview.play();
      area.classList.add("is-live");
      area.classList.toggle("is-front", mode === "user");
      configureZoom();
      peer = new RTCPeerConnection({ iceServers: ICE });
      stream.getTracks().forEach((track) => tunePreview(peer.addTrack(track, stream)));
      peer.ondatachannel = (event) => {
        channel = event.channel;
        channel.onopen = () => {
          document.getElementById("phoneZoomControl").hidden = false;
          sendState({ type:"zoom-state", zoom, digital:Number(area.style.getPropertyValue("--camera-digital-zoom")) || 1, max:Number(zoomInput.max) });
          updateCaptureButton();
          say("Connected! Waiting for the booth preview… ✨");
        };
        channel.onmessage = (message) => {
          try {
            const data = JSON.parse(message.data);
            if (data.type === "capture" && typeof data.id === "string") sendPhoto(data.id);
            else if (data.type === "countdown" && Number.isFinite(data.shot) && Number.isFinite(data.total)) {
              zoomInput.disabled = true;
              showCountdown(data.value, `Photo ${data.shot} of ${data.total}`);
              say(`Photo ${data.shot}/${data.total}: ${data.value === "SMILE" ? "Smile!" : "Get ready!"}`);
            } else if (data.type === "session-ready") {
              sessionReady = true;
              if (!sessionActive) { updateCaptureButton(); say("Ready! Start the photo session here or on the booth screen. ✨"); }
            } else if (data.type === "session-start" || data.type === "session-busy") {
              sessionActive = true;
              zoomInput.disabled = flip.disabled = true;
              updateCaptureButton();
              say(data.type === "session-busy" ? "A photo session is already running. Please wait…" : "Photo session started! Get ready to pose. ✨");
            } else if (data.type === "session-unavailable") {
              sessionActive = sessionReady = false;
              updateCaptureButton();
              say("Booth camera is getting ready. Wait for the live preview.", true);
            } else if (data.type === "zoom-set" && Number.isFinite(data.zoom) && !busy && !sessionActive) applyZoom(data.zoom).catch(() => {});
            else if (data.type === "photo-ack" && data.id === photoAck?.id) photoAck.resolve();
            else if (data.type === "photo-preparing") say("Preparing your photocard on the booth screen… ✨");
            else if (data.type === "session-done") {
              countdown.hidden = true;
              sessionActive = false;
              sessionReady = true;
              zoomInput.disabled = flip.disabled = false;
              updateCaptureButton("Start Another Session");
              say("Session complete! View your photocard on the booth screen, or take another. ✨");
            } else if (data.type === "session-error") {
              countdown.hidden = true;
              sessionActive = false;
              sessionReady = true;
              zoomInput.disabled = flip.disabled = false;
              updateCaptureButton("Retry Photo Session");
              say("Photo session interrupted. Check the booth screen, then retry.", true);
            }
          } catch {}
        };
        channel.onclose = () => cleanup("Photobooth disconnected. Generate a new pairing code to reconnect.");
      };
      peer.onconnectionstatechange = () => {
        if (peer?.connectionState === "failed" || peer?.connectionState === "closed") cleanup("Connection lost. Generate a new pairing code to reconnect.");
        else if (peer?.connectionState === "disconnected") { capture.disabled = true; say("Signal interrupted. Reconnecting…"); }
        else if (peer?.connectionState === "connected") {
          updateCaptureButton();
          peer.getSenders?.().filter((sender) => sender.track?.kind === "video").forEach((sender) => activePhotoId ? prioritizePhotoTransfer(true) : tunePreview(sender));
        }
      };
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      await peer.setLocalDescription(await peer.createAnswer());
      await waitForIce(peer);
      await ref.update({ answer: { type: peer.localDescription.type, sdp: peer.localDescription.sdp } });
      start.hidden = true;
      flip.hidden = stop.hidden = false;
      say("Pairing… keep this page open.");
    } catch (error) {
      cleanup(error?.name === "NotAllowedError" ? "Camera permission denied. Allow camera access and try again." : error.message);
      status.classList.add("error");
    }
  }

  async function flipCamera() {
    if (!peer || busy || sessionActive) return;
    flip.disabled = true;
    const next = mode === "environment" ? "user" : "environment";
    try {
      const replacement = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: next }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      const sender = peer.getSenders().find((item) => item.track?.kind === "video");
      if (!sender) throw new Error("Video connection unavailable.");
      await sender.replaceTrack(replacement.getVideoTracks()[0]);
      stream?.getTracks().forEach((track) => track.stop());
      stream = replacement;
      preview.srcObject = stream;
      await preview.play();
      mode = next;
      configureZoom();
      await tunePreview(sender);
      area.classList.toggle("is-front", mode === "user");
      say(`${mode === "user" ? "Front" : "Rear"} camera ready. ✨`);
    } catch (error) { say("Could not switch camera. Try again.", true); }
    finally { flip.disabled = false; }
  }

  async function init() {
    if (!id || !/^[a-f0-9]{48}$/.test(id)) { say("Open this page using the QR code on the photobooth screen.", true); return; }
    if (!window.firebase?.firestore) { say("Unable to load pairing. Check your connection and reload.", true); return; }
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    ref = (window.SFK_CLASSBOARD_FIREBASE_DB || firebase.firestore()).collection("photoboothPairs").doc(id);
    try {
      const snapshot = await ref.get();
      if (!snapshot.exists || !snapshot.data()?.expiresAt || snapshot.data().expiresAt.toMillis() < Date.now() || snapshot.data().answer) throw new Error("Pairing code expired or already used. Get a new one from the photobooth.");
      start.disabled = false;
      say("Ready! Tap below to allow camera and connect.");
    } catch (error) { say(error.message || "Pairing unavailable. Check your connection.", true); }
  }
  start.addEventListener("click", connect);
  capture.addEventListener("click", requestSession);
  zoomInput.addEventListener("input", () => {
    zoomLabel.textContent = `${Number(zoomInput.value).toFixed(1)}×`;
    clearTimeout(zoomTimer);
    zoomTimer = setTimeout(() => applyZoom(Number(zoomInput.value)).catch(() => {}), 65);
  });
  flip.addEventListener("click", flipCamera);
  stop.addEventListener("click", () => { ref?.delete().catch(() => {}); cleanup(); });
  window.addEventListener("pagehide", () => { stream?.getTracks().forEach((track) => track.stop()); try { peer?.close(); } catch {} });
  init();
})();

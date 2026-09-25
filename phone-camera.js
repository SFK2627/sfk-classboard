(() => {
  "use strict";
  const ICE = window.SFK_PHOTOBOOTH_ICE_SERVERS || [{ urls: "stun:stun.l.google.com:19302" }];
  const preview = document.getElementById("phonePreview");
  const start = document.getElementById("phoneStart");
  const flip = document.getElementById("phoneFlip");
  const stop = document.getElementById("phoneStop");
  const area = document.querySelector(".cameraArea");
  const status = document.getElementById("phoneStatus");
  const id = new URLSearchParams(location.hash.slice(1)).get("pair");
  let ref, stream, peer, channel, mode = "environment", busy = false;

  function say(message, error = false) { status.textContent = message; status.classList.toggle("error", error); }
  function cleanup(message = "Disconnected.") {
    try { channel?.close(); } catch {}
    try { peer?.close(); } catch {}
    stream?.getTracks().forEach((track) => track.stop());
    channel = peer = stream = null;
    preview.srcObject = null;
    area.classList.remove("is-live", "is-front");
    flip.hidden = stop.hidden = true;
    start.hidden = false;
    start.disabled = false;
    busy = false;
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
      try { const blob = await new ImageCapture(track).takePhoto(); if (blob.size > 0 && blob.size < 10 * 1024 * 1024) return blob; } catch {}
    }
    if (!preview.videoWidth) throw new Error("Camera image not ready.");
    const canvas = document.createElement("canvas");
    canvas.width = preview.videoWidth;
    canvas.height = preview.videoHeight;
    canvas.getContext("2d").drawImage(preview, 0, 0);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to save image.")), "image/jpeg", .92));
  }
  async function sendPhoto(id) {
    if (busy || !channel || channel.readyState !== "open") return;
    busy = true;
    try {
      say("Taking photo… ✦");
      const blob = await takePhoto();
      if (blob.size > 12 * 1024 * 1024) throw new Error("Photo is too large.");
      const buffer = await blob.arrayBuffer();
      channel.send(JSON.stringify({ type: "photo", id, bytes: buffer.byteLength, mime: blob.type }));
      channel.bufferedAmountLowThreshold = 256 * 1024;
      for (let offset = 0; offset < buffer.byteLength; offset += 16384) {
        if (channel.readyState !== "open") throw new Error("Connection lost.");
        if (channel.bufferedAmount > 512 * 1024) await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { channel.removeEventListener("bufferedamountlow", drained); reject(new Error("Connection slowed down.")); }, 15000);
          function drained() { clearTimeout(timer); channel.removeEventListener("bufferedamountlow", drained); resolve(); }
          channel.addEventListener("bufferedamountlow", drained);
          if (channel.bufferedAmount <= channel.bufferedAmountLowThreshold) drained();
        });
        channel.send(buffer.slice(offset, offset + 16384));
      }
      channel.send(JSON.stringify({ type: "photo-end", id }));
      say("Photo sent! Ready for the next shot. ✨");
    } catch (error) {
      if (channel?.readyState === "open") channel.send(JSON.stringify({ type: "photo-error", id }));
      say(error.message || "Could not take photo.", true);
    } finally { busy = false; }
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
      peer = new RTCPeerConnection({ iceServers: ICE });
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ondatachannel = (event) => {
        channel = event.channel;
        channel.onopen = () => say("Connected! Pose and use the photobooth screen to take photos. ✨");
        channel.onmessage = (message) => {
          try { const data = JSON.parse(message.data); if (data.type === "capture" && typeof data.id === "string") sendPhoto(data.id); } catch {}
        };
        channel.onclose = () => { if (peer && peer.connectionState !== "connected") cleanup("Photobooth disconnected. Generate a new pairing code to reconnect."); };
      };
      peer.onconnectionstatechange = () => {
        if (peer?.connectionState === "failed" || peer?.connectionState === "closed") cleanup("Connection lost. Generate a new pairing code to reconnect.");
        else if (peer?.connectionState === "disconnected") say("Signal interrupted. Reconnecting…");
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
    if (!peer || busy) return;
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
  flip.addEventListener("click", flipCamera);
  stop.addEventListener("click", () => { ref?.delete().catch(() => {}); cleanup(); });
  window.addEventListener("pagehide", () => { stream?.getTracks().forEach((track) => track.stop()); try { peer?.close(); } catch {} });
  init();
})();

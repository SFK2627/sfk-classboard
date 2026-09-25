/* One-use WebRTC camera room. Firestore carries SDP only; images stay on the peer connection. */
(() => {
  "use strict";
  const ICE = window.SFK_PHOTOBOOTH_ICE_SERVERS || [{ urls: "stun:stun.l.google.com:19302" }];
  const TTL = 15 * 60 * 1000;
  let room = null;

  function waitForIce(peer) {
    if (peer.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => { clearTimeout(timer); peer.removeEventListener("icegatheringstatechange", check); resolve(); };
      const check = () => { if (peer.iceGatheringState === "complete") finish(); };
      const timer = setTimeout(finish, 12000);
      peer.addEventListener("icegatheringstatechange", check);
    });
  }

  function failPending(session, message) {
    if (session.pending) {
      clearTimeout(session.pending.timer);
      session.pending.reject(new Error(message));
      session.pending = null;
    }
    session.photo = null;
  }

  function handleMessage(session, event) {
    if (typeof event.data === "string") {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (!session.pending || message.id !== session.pending.id) return;
      if (message.type === "photo" && Number.isInteger(message.bytes) && message.bytes > 0 && message.bytes <= 12 * 1024 * 1024) {
        session.photo = { id: message.id, expected: message.bytes, mime: message.mime === "image/png" ? "image/png" : "image/jpeg", chunks: [], size: 0 };
      } else if (message.type === "photo-end") {
        const photo = session.photo;
        if (!photo || photo.id !== message.id || photo.size !== photo.expected) { failPending(session, "The phone photo was incomplete. Please try again."); return; }
        const pending = session.pending;
        session.pending = null;
        session.photo = null;
        clearTimeout(pending.timer);
        pending.resolve(new Blob(photo.chunks, { type: photo.mime }));
      } else if (message.type === "photo-error") {
        failPending(session, "The phone could not take a photo. Please try again.");
      }
      return;
    }
    if (!session.photo || !session.pending) return;
    const add = (buffer) => {
      if (session !== room || !session.photo) return;
      session.photo.size += buffer.byteLength;
      if (session.photo.size > session.photo.expected) { failPending(session, "The phone photo was too large."); return; }
      session.photo.chunks.push(buffer);
    };
    if (event.data instanceof ArrayBuffer) add(event.data);
    else if (event.data instanceof Blob) event.data.arrayBuffer().then(add).catch(() => failPending(session, "Unable to receive the phone photo."));
  }

  function disconnect() {
    const session = room;
    if (!session) return;
    room = null;
    clearTimeout(session.expiryTimer);
    failPending(session, "Phone camera disconnected.");
    session.unsubscribe?.();
    try { session.channel?.close(); } catch {}
    try { session.peer?.close(); } catch {}
    // Removing the room invalidates the QR; the TTL also protects abandoned rooms.
    session.ref?.delete().catch(() => {});
  }

  async function createRoom({ onStream, onStatus, onDisconnected }) {
    disconnect();
    if (!window.isSecureContext || !window.RTCPeerConnection || !crypto?.getRandomValues) throw new Error("Phone pairing requires HTTPS and WebRTC.");
    if (!window.firebase?.firestore) throw new Error("Firebase is unavailable. Check your connection.");
    if (!firebase.apps.length) firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    const db = window.SFK_CLASSBOARD_FIREBASE_DB || window.firebase.firestore();
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
    const session = { id, ref: db.collection("photoboothPairs").doc(id), peer: new RTCPeerConnection({ iceServers: ICE }), onStatus, onDisconnected, pending: null };
    room = session;
    const peer = session.peer;
    peer.addTransceiver("video", { direction: "recvonly" });
    session.channel = peer.createDataChannel("photos", { ordered: true });
    session.channel.binaryType = "arraybuffer";
    session.channel.onmessage = (event) => handleMessage(session, event);
    session.channel.onopen = () => {
      if (room !== session) return;
      clearTimeout(session.expiryTimer);
      session.unsubscribe?.();
      session.unsubscribe = null;
      session.ref.delete().catch(() => {}); // The QR is now spent; the peer connection remains live.
      onStatus("Phone connected. Ready for photos!", true);
    };
    session.channel.onclose = () => { if (room === session) { failPending(session, "Phone camera disconnected."); onDisconnected(); } };
    peer.ontrack = (event) => { if (room === session) onStream(event.streams[0] || new MediaStream([event.track])); };
    peer.onconnectionstatechange = () => {
      if (room !== session) return;
      if (peer.connectionState === "failed" || peer.connectionState === "closed") { failPending(session, "Phone connection lost."); onDisconnected(); }
      else if (peer.connectionState === "disconnected") onStatus("Phone signal interrupted. Waiting to reconnect…", false);
    };
    try {
      onStatus("Creating private pairing code…", false);
      await peer.setLocalDescription(await peer.createOffer());
      await waitForIce(peer);
      if (room !== session) throw new Error("Pairing was cancelled.");
      await session.ref.set({
        offer: { type: peer.localDescription.type, sdp: peer.localDescription.sdp },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: firebase.firestore.Timestamp.fromMillis(Date.now() + TTL)
      });
      if (room !== session) { session.ref.delete().catch(() => {}); throw new Error("Pairing was cancelled."); }
      session.unsubscribe = session.ref.onSnapshot(async (snap) => {
        if (room !== session) return;
        if (!snap.exists) { if (session.channel.readyState !== "open") onDisconnected(); return; }
        const answer = snap.data()?.answer;
        if (answer && !peer.currentRemoteDescription && !session.answerStarted) {
          session.answerStarted = true;
          try { await peer.setRemoteDescription(new RTCSessionDescription(answer)); onStatus("Connecting phone camera…", false); }
          catch (error) { onStatus("Could not connect to this phone. Generate a new code.", false); onDisconnected(); }
        }
      }, (error) => { if (room === session) { onStatus(`Pairing error: ${error.message}`, false); onDisconnected(); } });
      session.expiryTimer = setTimeout(() => { if (room === session) { onStatus("Pairing code expired. Generate another code.", false); disconnect(); onDisconnected(); } }, TTL);
      const url = new URL("phone-camera.html", location.href);
      url.hash = `pair=${id}`;
      return url.href;
    } catch (error) {
      if (room === session) disconnect();
      throw error;
    }
  }

  function requestPhoto() {
    const session = room;
    if (!session || session.channel?.readyState !== "open") return Promise.reject(new Error("Phone is not connected. Reconnect it and try again."));
    if (session.pending) return Promise.reject(new Error("The phone is still taking a photo."));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => failPending(session, "Phone photo timed out. Please try again."), 25000);
      session.pending = { id, resolve, reject, timer };
      try { session.channel.send(JSON.stringify({ type: "capture", id })); }
      catch (error) { failPending(session, "Unable to ask the phone to take a photo."); }
    });
  }

  window.SFKPhoneCamera = { createRoom, requestPhoto, disconnect, get connected() { return room?.channel?.readyState === "open"; } };
})();

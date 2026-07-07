(function () {
  const ROLE_EMAILS = Object.freeze({
    admin: String(window.SFK_AUTH_ACCOUNTS?.admin || "").trim().toLowerCase(),
    officer: String(window.SFK_AUTH_ACCOUNTS?.officer || "").trim().toLowerCase()
  });

  let cachedAuth = null;

  function firebaseLooksReady() {
    return Boolean(window.firebase && window.SFK_FIREBASE_READY && window.SFK_FIREBASE_CONFIG);
  }

  function getAuth() {
    if (!firebaseLooksReady()) {
      throw new Error("Firebase Authentication is still loading.");
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    }

    cachedAuth = firebase.auth();
    return cachedAuth;
  }

  async function waitForAuth(timeoutMs = 10000) {
    const started = Date.now();
    let delay = 80;

    while (Date.now() - started < timeoutMs) {
      try {
        return getAuth();
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(650, Math.round(delay * 1.45));
      }
    }

    return getAuth();
  }

  function normalizeRole(role) {
    return String(role || "").trim().toLowerCase() === "admin" ? "admin" : "officer";
  }

  function roleForUser(user) {
    const email = String(user?.email || "").trim().toLowerCase();
    if (email && email === ROLE_EMAILS.admin) return "admin";
    if (email && email === ROLE_EMAILS.officer) return "officer";
    return "";
  }

  async function signInWithPin(role, pin) {
    const cleanRole = normalizeRole(role);
    const email = ROLE_EMAILS[cleanRole];
    if (!email) {
      throw new Error(`${cleanRole === "admin" ? "Admin" : "Officer"} account is not configured.`);
    }

    const auth = await waitForAuth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const credential = await auth.signInWithEmailAndPassword(email, String(pin || ""));

    if (roleForUser(credential.user) !== cleanRole) {
      await auth.signOut();
      throw new Error("This account is not allowed for that role.");
    }

    return credential.user;
  }

  async function signOut() {
    const auth = await waitForAuth();
    await auth.signOut();
  }

  function onAuthStateChanged(callback) {
    let unsubscribe = null;
    let cancelled = false;

    waitForAuth()
      .then((auth) => {
        if (cancelled) return;
        unsubscribe = auth.onAuthStateChanged((user) => {
          callback(user, roleForUser(user));
        });
      })
      .catch((error) => {
        console.warn("Auth state listener could not start:", error);
        if (!cancelled) callback(null, "");
      });

    return () => {
      cancelled = true;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }

  async function getIdToken(forceRefresh) {
    const auth = await waitForAuth();
    const user = auth.currentUser;
    return user ? user.getIdToken(Boolean(forceRefresh)) : "";
  }

  function currentRole() {
    try {
      const auth = cachedAuth || getAuth();
      return roleForUser(auth.currentUser);
    } catch (error) {
      return "";
    }
  }

  window.SFKAuth = {
    signInWithPin,
    signOut,
    onAuthStateChanged,
    getIdToken,
    currentRole,
    roleForUser,
    ready: waitForAuth
  };
}());

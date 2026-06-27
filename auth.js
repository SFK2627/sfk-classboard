(function () {
  const ROLE_EMAILS = Object.freeze({
    admin: String(window.SFK_AUTH_ACCOUNTS?.admin || "").trim().toLowerCase(),
    officer: String(window.SFK_AUTH_ACCOUNTS?.officer || "").trim().toLowerCase()
  });

  function getAuth() {
    if (!window.firebase || !window.SFK_FIREBASE_READY) {
      throw new Error("Firebase Authentication is not configured.");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(window.SFK_FIREBASE_CONFIG);
    }
    return firebase.auth();
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
    if (!email) throw new Error(`${cleanRole === "admin" ? "Admin" : "Officer"} account is not configured.`);

    const auth = getAuth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const credential = await auth.signInWithEmailAndPassword(email, String(pin || ""));
    if (roleForUser(credential.user) !== cleanRole) {
      await auth.signOut();
      throw new Error("This account is not allowed for that role.");
    }
    return credential.user;
  }

  async function signOut() {
    await getAuth().signOut();
  }

  function onAuthStateChanged(callback) {
    return getAuth().onAuthStateChanged((user) => {
      callback(user, roleForUser(user));
    });
  }

  async function getIdToken(forceRefresh) {
    const user = getAuth().currentUser;
    return user ? user.getIdToken(Boolean(forceRefresh)) : "";
  }

  function currentRole() {
    return roleForUser(getAuth().currentUser);
  }

  window.SFKAuth = {
    signInWithPin,
    signOut,
    onAuthStateChanged,
    getIdToken,
    currentRole,
    roleForUser
  };
})();

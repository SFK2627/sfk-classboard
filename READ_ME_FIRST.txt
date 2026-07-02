SFK ClassBoard media + phone admin fix v8 - needed files only

Fixes included:
1. Phone Admin login button not responding.
   - /admin/ no longer keeps the admin page inside an iframe on phones.
   - Login uses a real form submit plus click/touch fallback.
   - auth.js waits for Firebase Auth on slower phones.
2. Memories photo posting no longer uses the old Google Apps Script upload path.
   - This should stop: "Your login is invalid or you are not authorized for this action."
   - Photos are saved in Firestore memoryMedia docs, not Firebase Storage.
3. Subject Announcement photos use Firestore refs and retry hydration on the public board.
   - This targets the blank/black photo until refresh issue.
4. Time Capsule no-billing image support/rules are kept.
5. No Firebase Storage. No billing.

Install exactly:
1. Upload/replace EVERY file in this ZIP to the same paths in your GitHub repo.
2. Firebase Console > Firestore Database > Rules.
3. Paste the whole FIREBASE_RULES.txt from this ZIP.
4. Click Publish.
5. Wait for GitHub Pages to update.
6. On phone/PWA: remove/uninstall the old shortcut/app first, then open the site again.
7. Test with one small photo first.

Important:
- Do not enable Firebase Storage.
- No-billing upload supports photos only.
- For videos, use Drive/YouTube/direct links.
- For Memories music, use YouTube/JukeHost/Drive/direct audio links. Do not upload audio files.
- Staff posting requires the Firebase Auth emails in your rules: admin@sfk-classboard.app or officers@sfk-classboard.app.

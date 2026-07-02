SFK ClassBoard - Media Fix v2 (no billing)

Replace/upload these files to the same paths in your GitHub Pages repo:

Root files:
- index.html
- script.js
- firebase-adapter.js
- memories.html
- memories.js
- memories.css
- time-capsule.js
- time-capsule.css
- sw.js
- admin.html
- admin.js
- officer.html
- officer.js

Folder files:
- admin/index.html
- admin/sw.js
- officers/index.html
- officers/sw.js

Firebase rules:
1. Open Firebase Console > Firestore Database > Rules.
2. Copy the whole FIREBASE_RULES.txt from this folder.
3. Paste and Publish.

What this fixes:
- Memories photos saved as sfk-media://memory/... are resolved from Firestore and shown in the feed and viewer.
- Cached Memories posts with only firestoreRef are hydrated instead of disappearing.
- Memories loader now also reads MediaItems/MediaJSON fallback fields.
- Subject Announcement image attachments saved as sfk-media://announcement/... are resolved on the page without needing a refresh.
- ClassBoard cache failures from large no-billing images no longer stop rendering.
- Keeps the Time Capsule no-billing image attach fix.
- No Firebase Storage and no billing required.

After upload:
- Hard refresh on browser.
- On phone/PWA, remove the old installed shortcut/app first, then open the site again.
- Test with one small photo first.

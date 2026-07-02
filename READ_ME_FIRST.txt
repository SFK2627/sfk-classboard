SFK ClassBoard - Needed Files Only

Purpose:
- Fix announcement photo upload without billing.
- Fix memories photo upload without billing.
- Keep Firebase Storage disabled.
- Keep the original loading screen.

Upload/replace these files in your GitHub Pages repo using the same folders:
- index.html
- script.js
- firebase-adapter.js
- admin.html
- admin.js
- officer.html
- officer.js
- memories.html
- memories.js
- sw.js
- admin/index.html
- admin/sw.js
- officers/index.html
- officers/sw.js

Firebase Console step:
- Open Firestore Database > Rules.
- Copy/paste the included FIREBASE_RULES.txt.
- Publish.

Important:
- No Firebase Storage is needed.
- No billing/Blaze is needed.
- No-billing upload supports photos only. For videos/music/docs, use Drive/YouTube/direct public links.
- After replacing files, hard refresh. On phone/PWA, remove old shortcut/app then open/install again.

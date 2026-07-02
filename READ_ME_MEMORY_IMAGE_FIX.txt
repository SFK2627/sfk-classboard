SFK ClassBoard - Memories image display fix

Replace/upload these files in the same locations in your GitHub Pages repo:

1. memories.js
2. memories.html
3. sw.js
4. firebase-adapter.js  (included only to keep your no-billing upload adapter together)

Firebase rules:
- Your latest rules already have memoryMedia read/write permissions.
- FIREBASE_RULES.txt is included only as a backup/reference.

What was fixed:
- Uploaded no-billing memory photos are saved in Firestore as memoryMedia documents.
- The memories page was reading the memories collection directly, so it saw sfk-media://memory/... references but did not convert them into displayable data:image URLs.
- memories.js now resolves those memoryMedia references before rendering.
- LocalStorage cache failures from large inline image data no longer stop rendering.
- sw.js and memories.html were bumped so the old cached memories.js is less likely to remain stuck.

After uploading:
- Hard refresh the site.
- On phone/PWA, remove the old installed shortcut/app, then open/install again.

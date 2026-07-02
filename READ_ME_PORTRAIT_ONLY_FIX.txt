SFK Portrait Only Mobile Fix

Upload/replace these files in the same locations on GitHub Pages:

- orientation-lock.js
- manifest.webmanifest
- admin.webmanifest
- officer.webmanifest
- index.html
- admin.html
- officer.html
- memories.html
- sw.js
- admin/index.html
- admin/manifest.webmanifest
- admin/sw.js
- officers/index.html
- officers/manifest.webmanifest
- officers/sw.js

What this does:
- Installed PWA uses portrait-primary orientation in the manifest.
- Mobile browsers that support Screen Orientation API are requested to lock to portrait.
- If the phone is rotated landscape, the app is covered by a portrait-only blocker until the device is upright again.
- Desktop/TV landscape view should not be blocked.

After upload:
1. Hard refresh.
2. On phone/PWA, remove the old installed shortcut/app first.
3. Open the site again and reinstall if needed.

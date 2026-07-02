SFK Admin/Officers Route Clean v9

Problem fixed:
- Admin/Officers pages showing raw service-worker JavaScript or manifest JSON instead of the real page.
- Root manifest.webmanifest was broken and contained JavaScript instead of JSON.

Upload/replace these files in the same locations:
- manifest.webmanifest
- reset-cache.html
- 404.html
- admin/index.html
- admin/manifest.webmanifest
- admin/sw.js
- officers/index.html
- officers/manifest.webmanifest
- officers/sw.js

After upload:
1. Wait for GitHub Pages to finish updating.
2. Open: reset-cache.html?go=admin
3. Then test admin.html and officer.html directly.
4. On phone, remove/uninstall the old PWA/shortcut first, then open the site fresh in the browser.

This does not change Firebase, Memories, Announcements, login logic, or the original loading screen.

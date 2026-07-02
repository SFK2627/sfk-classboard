SFK ADMIN/OFFICERS RESCUE V2

Problem fixed:
- manifest.webmanifest had service worker JavaScript instead of JSON.
- admin.html had service worker JavaScript instead of HTML.
- admin.css had HTML instead of CSS.
- admin.js had CSS instead of JavaScript.
- officer.html had manifest JSON instead of HTML.

Those file swaps are why Admin/Officers showed raw code or a blank/broken screen.

What this package changes:
- Restores the real admin.html, admin.css, admin.js, officer.html, and manifest.webmanifest from your last working uploaded ZIP.
- Keeps the rest of your current GitHub files as-is.
- Adds reset-cache.html to clear old PWA/service worker cache.

After uploading:
1. Replace/upload all files in this ZIP to the same GitHub repo locations.
2. Wait for GitHub Pages to finish updating.
3. Open: reset-cache.html?go=admin
4. Test: admin.html and officer.html
5. On phone, remove/uninstall old PWA shortcut first, then open the site fresh.

This package does not change Firebase rules, credentials, or database settings.

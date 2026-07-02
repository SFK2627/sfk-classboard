SFK Admin/Officers route repair

Problem fixed:
- Admin or Officers shortcut can show JavaScript service worker code instead of the login page.
- Mobile admin login can become unresponsive when opened inside the old /admin/ iframe shortcut.

What changed:
- /admin/ now redirects to /admin.html directly.
- /officers/ now redirects to /officer.html directly.
- The old /admin/ and /officers/ service workers are self-removing reset workers.
- admin.html and officer.html clean old admin/officers shortcut caches after loading.
- Added reset-cache.html for a one-time full cache reset.
- Bumped the root PWA cache to sfk-classboard-v197-route-repair-v1.

Upload these files to the same paths in your GitHub repo.

After uploading:
1. Wait for GitHub Pages to update.
2. Open: reset-cache.html?go=admin
3. It will clear old PWA/service worker cache and redirect to admin.html.
4. On phone, remove/uninstall the old installed shortcut, then open the site again.

If you still see JavaScript code after uploading, the browser is still using the old cached service worker. Open reset-cache.html?go=admin from the same website, then refresh.

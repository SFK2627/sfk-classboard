SFK ClassBoard media repair v5 - needed files only

This keeps the original loading screen and uses NO Firebase Storage, so no billing is needed.

Fixes included:
- Time Capsule attached photos now save as compressed inline images, so preview/presentation should not show a broken black strip.
- Old sfk-media://capsule/... Time Capsule entries still have backward-compatible loader/rules support.
- Memories image rendering is fixed for no-billing Firestore media refs, preview URLs, mediaRef/mediaId variants, and cached posts.
- A runtime bug in Memories where previewUrl could stop rendering has been fixed.
- Subject Announcement photo attachments now use safer blob/data display URLs and retry hydration, so images should not stay black/blank before refresh.
- Service workers now fetch JS/CSS/HTML network-first, so the PWA will not keep showing old broken media code just because the old cache ignores query strings.

How to apply:
1. Upload/replace every file in this ZIP to the same path in your GitHub Pages repo.
2. In Firebase Console > Firestore Database > Rules, copy the full FIREBASE_RULES.txt and Publish.
3. Wait for GitHub Pages to update.
4. Hard refresh your browser.
5. On phone/PWA, remove the old installed shortcut/app first, then open/install again.

Notes:
- Do not enable Firebase Storage. This build stays no-billing.
- Existing broken Time Capsule/Memories entries can only be recovered if their media document/data was saved before. If an old entry only saved a broken reference, re-upload/re-edit the image.
- Test with a small JPG/PNG first.

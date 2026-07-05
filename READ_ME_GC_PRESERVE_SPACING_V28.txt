SFK ClassBoard - GC Preserve Spacing v28

Fix:
- GC messages now preserve line breaks.
- Blank lines in announcements now show.
- Multiple spaces are preserved visually.
- Long announcement single-message behavior from v27 is retained.
- @everyone highlight is retained.
- Hidden Seen-by, custom dialogs, and student delete fallback are retained.

Important:
- If a long single announcement is still blocked, keep using the fixed Firestore rules that allow Admin/Officer Text up to 5000 characters.

After upload:
1. Open reset-cache.html once.
2. Hard refresh.
3. Send a message with line breaks and spaces to test.

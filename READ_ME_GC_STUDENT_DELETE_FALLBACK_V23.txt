SFK ClassBoard - GC Student Delete Fallback v23

Fix:
- Student self-delete now has multiple fallback attempts for stricter Firebase rules.
- Attempt 1: normal Removed marker.
- Attempt 2: edit-safe blank text with Edited fields.
- Attempt 3: text-only blank fallback.
- The UI now treats blank plain-text messages as removed, so it will show:
  Message removed by the sender
  or
  You removed this message.
- This is designed for Firebase rules that allow students to edit their own message text but block extra Removed fields.
- Adviser/Admin delete behavior is unchanged.
- Custom GC dialogs and hidden Seen-by behavior are retained.

After upload:
1. Open reset-cache.html once.
2. Hard refresh.
3. Test using a fresh plain-text student message.

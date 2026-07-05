SFK ClassBoard - GC Delete Fix v22

Fix:
- Student self-delete no longer writes to audit/moderation collections.
- Student self-delete now uses a minimal update on the student's own message:
  Text blank, Removed true, RemovedBy uid, RemovedAt timestamp.
- This avoids the permission-denied issue that showed:
  "This account is not allowed to access the class chat."
- Adviser/Admin delete remains full moderation delete with logs.
- Removed-message label fix is retained:
  student delete = Message removed by the sender / You removed this message
  adviser delete = Message removed by the Adviser
- Seen-by remains hidden until the message is clicked.
- Custom GC dialogs are retained.

After upload:
1. Open reset-cache.html once.
2. Hard refresh.
3. Test delete using a fresh student message.

SFK ClassBoard - GC Admin Tools Restore v11

Fix:
- Restores the GC Admin Tools card in the Admin Panel.
- The card can add GC members using Student ID | Full Name.
- The card can refresh/enable/disable GC members.
- The danger zone button can delete the entire GC conversation.
- Cache/version strings were updated.

Why it disappeared:
- class-chat-admin.js existed, but admin.html was not loading it.

After uploading:
- Hard refresh the Admin Panel.
- If it still does not appear, open reset-cache.html once and reload admin.html.

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#f7c600" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="SFK Admin" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>SFK Admin</title>
  <link rel="manifest" href="manifest.webmanifest?v=admin-mobile-v8" />
  <link rel="icon" type="image/png" sizes="192x192" href="../icons/icon-192.png?v=3" />
  <link rel="apple-touch-icon" href="../icons/icon-192.png?v=3" />
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center; font-family:Arial,sans-serif; background:#fff8dc; color:#111; }
    .card { width:min(92vw,420px); padding:24px; border:2px solid #f7c600; border-radius:22px; background:#fff; box-shadow:0 14px 40px rgba(0,0,0,.12); text-align:center; }
    a, button { display:inline-flex; justify-content:center; align-items:center; min-height:46px; padding:0 18px; border-radius:12px; border:2px solid #111; background:#f7c600; color:#111; font-weight:800; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Opening Admin...</h1>
    <p>If it does not open automatically, tap the button below.</p>
    <a id="openAdminLink" href="../admin.html?shortcut=admin&v=admin-mobile-v8">Open Admin Login</a>
  </div>
  <script>
    (function () {
      var target = new URL('../admin.html?shortcut=admin&v=admin-mobile-v8', window.location.href);
      window.setTimeout(function () { window.location.replace(target.toString()); }, 60);
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('./sw.js').catch(function (error) {
            console.warn('Admin service worker registration failed:', error);
          });
        });
      }
    }());
  </script>
</body>
</html>

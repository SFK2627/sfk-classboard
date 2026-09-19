(function () {
  'use strict';
  const STORAGE_KEY = 'sfkAdminAppearanceV1';
  const root = document.documentElement;
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function cleanMode(value) {
    const mode = String(value || '').trim().toLowerCase();
    return mode === 'light' || mode === 'dark' || mode === 'system' ? mode : 'system';
  }

  function savedMode() {
    try { return cleanMode(localStorage.getItem(STORAGE_KEY)); }
    catch (error) { return 'system'; }
  }

  function resolvedTheme(mode) {
    return cleanMode(mode) === 'system' ? (media && media.matches ? 'dark' : 'light') : cleanMode(mode);
  }

  function apply(mode, persist) {
    const nextMode = cleanMode(mode);
    const theme = resolvedTheme(nextMode);
    root.dataset.adminThemeMode = nextMode;
    root.dataset.adminTheme = theme;
    root.style.colorScheme = theme;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, nextMode); } catch (error) {}
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#111317' : '#f7c600');
    const select = document.getElementById('adminThemeMode');
    if (select && select.value !== nextMode) select.value = nextMode;
    const label = document.getElementById('adminThemeResolved');
    if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
    try { window.dispatchEvent(new CustomEvent('sfk-admin-theme-change', { detail: { mode: nextMode, theme } })); } catch (error) {}
  }

  const initialMode = savedMode();
  apply(initialMode, false);

  function bind() {
    const select = document.getElementById('adminThemeMode');
    if (select && !select.dataset.themeBound) {
      select.dataset.themeBound = '1';
      select.value = cleanMode(root.dataset.adminThemeMode || initialMode);
      select.addEventListener('change', function () { apply(select.value, true); });
    }
    apply(root.dataset.adminThemeMode || initialMode, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();

  if (media) {
    const onChange = function () {
      if (cleanMode(root.dataset.adminThemeMode) === 'system') apply('system', false);
    };
    if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange);
    else if (typeof media.addListener === 'function') media.addListener(onChange);
  }

  window.setSfkAdminTheme = function (mode) { apply(mode, true); };
})();

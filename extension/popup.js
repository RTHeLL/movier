'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var el = document.getElementById('version');
  if (!el) return;
  var manifest = chrome.runtime.getManifest();
  el.textContent = 'Версия ' + manifest.version;
});

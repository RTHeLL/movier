'use strict';

(function () {
  try {
    if (window.top === window) {
      var host = location.hostname || '';
      if (
        host.indexOf('kinopoisk.ru') !== -1 ||
        host === 'localhost' ||
        host === '127.0.0.1'
      ) {
        return;
      }
    }
  } catch (e) {
    /* cross-origin frame: continue */
  }

  var CSS =
    '.ads,.ad,.advert,.advertisement,.ad-container,.ad-wrapper,.adsbox,' +
    '.adsbygoogle,[id*="google_ads"],[class*="ad-banner"],[class*="ad_banner"],' +
    '[class*="preroll"],[class*="midroll"],[id*="preroll"],[id*="vast"],' +
    '.vjs-ad,.jw-ad,.fp-ads,[class*="AdOverlay"],[class*="ad-overlay"],' +
    '[class*="video-ads"],[id*="video-ads"],[class*="banner-ad"],' +
    'iframe[src*="doubleclick"],iframe[src*="googlesyndication"],' +
    'iframe[src*="yandex.ru/ads"],iframe[src*="adfox"],iframe[id*="google_ads"]' +
    '{display:none!important;visibility:hidden!important;pointer-events:none!important;' +
    'height:0!important;width:0!important;max-height:0!important;opacity:0!important;}';

  function inject() {
    if (document.getElementById('movier-adblock-style')) return;
    var root = document.documentElement || document.head || document.body;
    if (!root) return;
    var style = document.createElement('style');
    style.id = 'movier-adblock-style';
    style.textContent = CSS;
    root.appendChild(style);
  }

  function hideMatches(root) {
    if (!root || !root.querySelectorAll) return;
    var nodes = root.querySelectorAll(
      '[class*="preroll"],[class*="midroll"],[id*="vast"],[class*="ad-overlay"],[class*="video-ads"]',
    );
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty('display', 'none', 'important');
    }
  }

  inject();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      inject();
      hideMatches(document);
    });
  } else {
    hideMatches(document);
  }

  var scheduled = false;
  function scheduleScan(node) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      inject();
      hideMatches(node || document);
    });
  }

  try {
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        for (var j = 0; j < mutations[i].addedNodes.length; j++) {
          var n = mutations[i].addedNodes[j];
          if (n.nodeType === 1) {
            scheduleScan(n);
            return;
          }
        }
      }
    }).observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  } catch (e2) {
    /* ignore */
  }
})();

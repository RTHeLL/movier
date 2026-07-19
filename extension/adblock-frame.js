(function () {
  'use strict';

  try {
    if (window.top === window) {
      var host = location.hostname || '';
      if (
        host.indexOf('kinopoisk.ru') !== -1 ||
        host.indexOf('localhost') !== -1 ||
        host.indexOf('127.0.0.1') !== -1
      ) {
        return;
      }
    }
  } catch (e) {}

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
    var style = document.createElement('style');
    style.id = 'movier-adblock-style';
    style.textContent = CSS;
    (document.documentElement || document.head || document.body).appendChild(style);
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

  try {
    new MutationObserver(function (mutations) {
      inject();
      for (var i = 0; i < mutations.length; i++) {
        for (var j = 0; j < mutations[i].addedNodes.length; j++) {
          var n = mutations[i].addedNodes[j];
          if (n.nodeType === 1) hideMatches(n);
        }
      }
    }).observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  } catch (e2) {}

  try {
    window.open = function () {
      return null;
    };
  } catch (e3) {}
})();

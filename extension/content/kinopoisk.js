'use strict';

(function () {
  var filmId = null;
  var uiBuilt = false;
  var playersLoaded = false;
  var PRIVACY_URL = 'https://kurduk.store/privacy.html';

  function parseFilmId() {
    var parts = location.pathname.split('/');
    if (
      (parts[1] === 'film' || parts[1] === 'series') &&
      location.hostname === 'www.kinopoisk.ru'
    ) {
      var id = parseInt(parts[2], 10);
      return Number.isInteger(id) && id > 0 ? id : null;
    }
    return null;
  }

  function sendMessage(payload) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage(payload, function (response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  function adjustButtonPosition() {
    var button = document.querySelector('#uni_id_button');
    if (!button) return;
    var header = document.querySelector(
      'header[class*="header"], header[class*="styles_header"], [class*="styles_header"]',
    );
    if (!header) return;
    var rect = header.getBoundingClientRect();
    button.style.top = rect.top + rect.height / 2 + 'px';
  }

  function togglePanel() {
    var el = document.querySelector('#div_all_content');
    if (!el) return;
    el.classList.toggle('hidden_div');
  }

  function pauseVideos() {
    document.querySelectorAll('#div_player_window iframe').forEach(function (frame) {
      try {
        frame.contentWindow.postMessage({ method: 'pause' }, '*');
      } catch (e) {
        /* ignore */
      }
    });
  }

  function openTab(evt, cityName) {
    document.querySelectorAll('.tabcontent').forEach(function (node) {
      node.style.display = 'none';
    });
    document.querySelectorAll('.tablinks').forEach(function (node) {
      node.classList.remove('active');
    });
    var panel = document.getElementById(cityName);
    if (panel) panel.style.display = 'block';
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
    pauseVideos();
  }

  function setPlayerWindowMessage(htmlText) {
    var win = document.querySelector('#div_player_window');
    if (!win) return;
    win.replaceChildren();
    var box = document.createElement('div');
    box.className = 'alert alert-danger';
    box.setAttribute('role', 'alert');
    box.textContent = htmlText;
    win.appendChild(box);
  }

  function renderConsent(container) {
    container.replaceChildren();
    var wrap = document.createElement('div');
    wrap.className = 'movier-consent';

    var title = document.createElement('p');
    title.className = 'movier-consent-title';
    title.textContent = 'Перед загрузкой плееров';

    var text = document.createElement('p');
    text.className = 'movier-consent-text';
    text.textContent =
      'Movier запрашивает список плееров у kp.apiget.ru по ID фильма. ' +
      'Передаются технические идентификаторы расширения (не пароли и не платёжные данные). ' +
      'Полный HTML страницы и cookie Кинопоиска не отправляются.';

    var link = document.createElement('a');
    link.href = PRIVACY_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Политика конфиденциальности';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'movier-consent-btn';
    btn.textContent = 'Согласен, загрузить плееры';
    btn.addEventListener('click', function () {
      chrome.storage.local.set({ privacyAccepted: true }, function () {
        void loadPlayers(true);
      });
    });

    wrap.append(title, text, link, btn);
    container.appendChild(wrap);
  }

  function createIframe(src) {
    var iframe = document.createElement('iframe');
    iframe.id = 'player_frame_pro';
    iframe.src = src;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-presentation',
    );
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.title = 'Плеер Movier';
    iframe.style.cssText =
      'border:none;width:100%;height:100%;border-radius:10px;';
    return iframe;
  }

  function renderPlayers(players) {
    var win = document.querySelector('#div_player_window');
    if (!win) return;
    win.replaceChildren();

    if (!players.length) {
      setPlayerWindowMessage('Материал не найден');
      return;
    }

    var list = players.length > 1 ? players.slice(0, -1) : players;
    if (!list.length) list = players;

    var root = document.createElement('div');
    root.className = 'div_one';
    var tabs = document.createElement('div');
    tabs.id = 'all_tablinks';

    list.forEach(function (src, sum_player) {
      var panel = document.createElement('div');
      panel.className = 'tabcontent';
      panel.id = 'tabcontent' + sum_player;
      panel.style.padding = '0px';
      panel.style.borderTop = 'none';
      panel.style.display = sum_player === 0 ? 'block' : 'none';
      panel.appendChild(createIframe(src));
      root.appendChild(panel);

      if (list.length > 1) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = sum_player === 0 ? 'tablinks active' : 'tablinks';
        btn.name = 'tabcontent' + sum_player;
        btn.textContent = 'Плеер ' + (sum_player + 1);
        btn.addEventListener('click', function (el) {
          openTab(el, el.currentTarget.name);
        });
        tabs.appendChild(btn);
      }
    });

    root.appendChild(tabs);
    win.appendChild(root);
  }

  async function loadPlayers(force) {
    var win = document.querySelector('#div_player_window');
    if (!win || !filmId) return;

    if (playersLoaded && !force) return;

    var privacy = await sendMessage({ type: 'GET_PRIVACY_STATUS' }).catch(
      function () {
        return { ok: false, accepted: false };
      },
    );
    if (!privacy || !privacy.accepted) {
      renderConsent(win);
      return;
    }

    win.replaceChildren();
    var loading = document.createElement('div');
    loading.className = 'alert';
    loading.setAttribute('role', 'status');
    loading.textContent = 'Загрузка плееров…';
    win.appendChild(loading);

    try {
      var response = await sendMessage({
        type: 'GET_PLAYERS',
        filmId: filmId,
      });
      if (!response || !response.ok || !response.result) {
        setPlayerWindowMessage('Сервер недоступен');
        return;
      }
      var message = response.result;
      if (message.error === 0) {
        renderPlayers(message.all_player || []);
        playersLoaded = true;
      } else {
        var btn = document.querySelector('#uni_id_button');
        if (btn) {
          btn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        }
        setPlayerWindowMessage('Error ' + message.error + '. Материал не найден');
      }
    } catch (e) {
      setPlayerWindowMessage('Сервер недоступен');
    }
  }

  function replaceOfferButton() {
    var offer = document.querySelector('[data-tid="OfferButton"]');
    if (!offer || offer.dataset.movierReplaced === '1') return;
    offer.dataset.movierReplaced = '1';
    offer.className = 'Replace_button';
    offer.replaceChildren();
    offer.dataset.tid = '';
    var btn = document.createElement('input');
    btn.type = 'button';
    btn.id = 'uni_id_button_c';
    btn.value = 'Смотреть бесплатно!';
    offer.appendChild(btn);
  }

  function buildUi() {
    if (uiBuilt) return;
    uiBuilt = true;

    var create_button_play = document.createElement('input');
    create_button_play.type = 'button';
    create_button_play.id = 'uni_id_button';
    create_button_play.value = 'Смотреть бесплатно!';
    document.body.appendChild(create_button_play);

    var create_div_all_content = document.createElement('div');
    create_div_all_content.id = 'div_all_content';
    create_div_all_content.className = 'hidden_div';
    document.body.appendChild(create_div_all_content);

    var create_button_close_content = document.createElement('button');
    create_button_close_content.type = 'button';
    create_button_close_content.id = 'close_content';
    create_button_close_content.title = 'Закрыть';
    create_div_all_content.appendChild(create_button_close_content);

    var create_div_player_window = document.createElement('div');
    create_div_player_window.id = 'div_player_window';
    create_div_all_content.appendChild(create_div_player_window);

    setPlayerWindowMessage('Нажмите «Смотреть бесплатно», чтобы загрузить плееры.');

    document.addEventListener('click', function (evt) {
      var t = evt.target;
      if (!(t instanceof Element)) return;
      if (
        t.id === 'uni_id_button' ||
        t.id === 'uni_id_button_c' ||
        t.id === 'close_content'
      ) {
        if (t.id === 'uni_id_button' || t.id === 'uni_id_button_c') {
          var panel = document.querySelector('#div_all_content');
          if (panel && panel.classList.contains('hidden_div')) {
            void loadPlayers(false);
          }
        }
        togglePanel();
      }
    });

    setTimeout(function () {
      adjustButtonPosition();
      window.addEventListener('resize', adjustButtonPosition, { passive: true });
      window.addEventListener('scroll', adjustButtonPosition, { passive: true });
    }, 400);

    var offerTries = 0;
    var offerTimer = setInterval(function () {
      replaceOfferButton();
      offerTries += 1;
      if (offerTries > 50) clearInterval(offerTimer);
    }, 200);
  }

  function onRouteMaybeChanged() {
    var nextId = parseFilmId();
    if (!nextId) return;
    if (filmId && filmId !== nextId) {
      location.reload();
      return;
    }
    filmId = nextId;
    buildUi();
  }

  filmId = parseFilmId();
  if (!filmId) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUi);
  } else {
    buildUi();
  }

  var lastHref = location.href;
  setInterval(function () {
    if (location.href !== lastHref) {
      lastHref = location.href;
      onRouteMaybeChanged();
    }
  }, 800);
})();

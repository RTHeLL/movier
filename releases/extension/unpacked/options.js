'use strict';

var DEFAULT_FILTERS_BASE = 'https://kurduk.store';
var ADBLOCK_ORIGINS = ['http://*/*', 'https://*/*'];

var ALLOWED_FILTER_BASES = [
  'https://kurduk.store',
  'https://rthell.github.io/movier',
  'http://127.0.0.1:8787',
  'http://localhost:8787',
  'http://127.0.0.1:8080',
  'http://localhost:8080',
];

function normalizeBase(url) {
  return String(url || '')
    .trim()
    .replace(/\/$/, '');
}

function isAllowedFiltersBase(base) {
  var n = normalizeBase(base);
  if (!n) return false;
  return ALLOWED_FILTER_BASES.some(function (allowed) {
    return n === allowed || n.indexOf(allowed + '/') === 0;
  });
}

function setStatus(text, isError) {
  var el = document.getElementById('status');
  if (!el) return;
  el.textContent = text;
  el.className = 'status' + (isError ? ' status-error' : '');
}

function setAdblockStatus(text, isError) {
  var el = document.getElementById('adblockStatus');
  if (!el) return;
  el.textContent = text;
  el.className = 'status' + (isError ? ' status-error' : '');
}

function refreshAdblockUi() {
  var frameEl = document.getElementById('frameAdblockEnabled');
  chrome.runtime.sendMessage({ type: 'GET_FRAME_ADBLOCK_STATUS' }, function (response) {
    if (chrome.runtime.lastError) {
      setAdblockStatus(chrome.runtime.lastError.message, true);
      return;
    }
    var enabled = !!(response && response.enabled);
    frameEl.checked = enabled;
    setAdblockStatus(
      enabled
        ? 'Element-hiding во фреймах включён.'
        : 'Сейчас только сетевая блокировка DNR (без доступа ко всем сайтам).',
    );
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var privacyEl = document.getElementById('privacyAccepted');
  var baseEl = document.getElementById('filtersBaseUrl');
  var saveBtn = document.getElementById('saveBtn');
  var refreshBtn = document.getElementById('refreshBtn');
  var frameEl = document.getElementById('frameAdblockEnabled');

  chrome.storage.local.get(['privacyAccepted', 'filtersBaseUrl'], function (stored) {
    privacyEl.checked = !!stored.privacyAccepted;
    baseEl.value = stored.filtersBaseUrl || DEFAULT_FILTERS_BASE;
  });

  refreshAdblockUi();

  privacyEl.addEventListener('change', function () {
    chrome.storage.local.set({ privacyAccepted: privacyEl.checked }, function () {
      setStatus(
        privacyEl.checked
          ? 'Согласие сохранено.'
          : 'Согласие снято — плееры не загрузятся, пока не подтвердите снова.',
      );
    });
  });

  frameEl.addEventListener('change', function () {
    if (frameEl.checked) {
      chrome.permissions.request({ origins: ADBLOCK_ORIGINS }, function (granted) {
        if (!granted) {
          frameEl.checked = false;
          setAdblockStatus('Разрешение не выдано — element-hiding не включён.', true);
          chrome.runtime.sendMessage({ type: 'SET_FRAME_ADBLOCK', enabled: false });
          return;
        }
        chrome.runtime.sendMessage(
          { type: 'SET_FRAME_ADBLOCK', enabled: true },
          function (response) {
            if (chrome.runtime.lastError) {
              frameEl.checked = false;
              setAdblockStatus(chrome.runtime.lastError.message, true);
              return;
            }
            frameEl.checked = !!(response && response.enabled);
            setAdblockStatus(
              frameEl.checked
                ? 'Element-hiding во фреймах включён.'
                : 'Не удалось включить element-hiding.',
              !frameEl.checked,
            );
          },
        );
      });
      return;
    }

    chrome.runtime.sendMessage(
      { type: 'SET_FRAME_ADBLOCK', enabled: false },
      function () {
        chrome.permissions.remove({ origins: ADBLOCK_ORIGINS }, function () {
          setAdblockStatus('Element-hiding выключен. Остаётся сетевая блокировка DNR.');
        });
      },
    );
  });

  saveBtn.addEventListener('click', function () {
    var base = normalizeBase(baseEl.value) || DEFAULT_FILTERS_BASE;
    if (!isAllowedFiltersBase(base)) {
      setStatus(
        'URL не из списка разрешённых. Используйте kurduk.store или localhost для разработки.',
        true,
      );
      return;
    }
    chrome.storage.local.set({ filtersBaseUrl: base }, function () {
      baseEl.value = base;
      setStatus('Сохранено.');
    });
  });

  refreshBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'REFRESH_FILTERS' }, function (response) {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message, true);
        return;
      }
      setStatus(
        response && response.ok ? 'Фильтры обновлены.' : 'Не удалось обновить фильтры.',
        !(response && response.ok),
      );
    });
  });
});

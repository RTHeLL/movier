'use strict';

var DYNAMIC_RULE_ID_START = 10000;
var MAX_DYNAMIC_RULES = 200;
var ALARM_FILTERS = 'movier-refresh-filters';
var DEFAULT_FILTERS_BASE = 'https://kurduk.store';
var APIGET_ORIGIN = 'https://kp.apiget.ru';
/** Совместимость с upstream API (как у Kinopoisk Player 16.2.3). */
var APIGET_CLIENT_VERSION = '16.2.3';

var ALLOWED_FILTER_BASES = [
  'https://kurduk.store',
  'https://rthell.github.io/movier',
  'http://127.0.0.1:8787',
  'http://localhost:8787',
  'http://127.0.0.1:8080',
  'http://localhost:8080',
];

function makeId(length) {
  var chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  var values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (var i = 0; i < length; i++) {
    result += chars.charAt(values[i] % chars.length);
  }
  return result;
}

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

function buildStubHtml(filmId) {
  return (
    '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Кинопоиск</title></head><body>' +
    '<div id="root" data-film-id="' +
    filmId +
    '">https://www.kinopoisk.ru/film/' +
    filmId +
    '/</div></body></html>'
  );
}

function isSafePlayerUrl(url) {
  try {
    var u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (u.username || u.password) return false;
    if (u.protocol === 'javascript:') return false;
    return true;
  } catch (e) {
    return false;
  }
}

function makeLowerId(length) {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  var values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (var i = 0; i < length; i++) {
    result += chars.charAt(values[i] % chars.length);
  }
  return result;
}

async function ensureIds() {
  var stored = await chrome.storage.local.get([
    'UID',
    'fake_yandex_login',
    'apiget_uid',
  ]);
  var patch = {};
  if (!stored.UID) patch.UID = makeId(32);
  if (!stored.fake_yandex_login) patch.fake_yandex_login = makeLowerId(12);
  if (!stored.apiget_uid) patch.apiget_uid = makeLowerId(16);
  if (Object.keys(patch).length) {
    await chrome.storage.local.set(patch);
  }
  return chrome.storage.local.get(['UID', 'fake_yandex_login', 'apiget_uid']);
}

async function fetchPlayers(filmId) {
  if (!Number.isInteger(filmId) || filmId <= 0) {
    return { error: -1, all_player: [] };
  }

  var ids = await ensureIds();
  var fd = new FormData();
  fd.append('id', String(filmId));
  fd.append('version_extension', APIGET_CLIENT_VERSION);
  fd.append('Manifest_extension', '{}');
  fd.append('uid', ids.apiget_uid);
  fd.append('yandex_login', ids.fake_yandex_login);
  fd.append('UID_KP', ids.UID);
  fd.append('html_code', buildStubHtml(filmId));

  var res = await fetch(APIGET_ORIGIN + '/array_player.php', {
    method: 'POST',
    body: fd,
    credentials: 'omit',
    cache: 'no-store',
  });

  var text = await res.text();
  var data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { error: -2, all_player: [] };
  }

  var players = Array.isArray(data.all_player) ? data.all_player : [];
  var safe = players.filter(isSafePlayerUrl);
  var err = typeof data.error === 'number' ? data.error : -1;
  return { error: err, all_player: safe };
}

async function refreshRemoteFilters() {
  try {
    var stored = await chrome.storage.local.get(['filtersBaseUrl']);
    var base = normalizeBase(stored.filtersBaseUrl || DEFAULT_FILTERS_BASE);
    if (!isAllowedFiltersBase(base)) return;

    var res = await fetch(base + '/filters/movier-dnr.json', {
      cache: 'no-cache',
      credentials: 'omit',
    });
    if (!res.ok) return;

    var rules = await res.json();
    if (!Array.isArray(rules) || rules.length === 0) return;

    var existing = await chrome.declarativeNetRequest.getDynamicRules();
    var removeRuleIds = existing
      .filter(function (r) {
        return r.id >= DYNAMIC_RULE_ID_START;
      })
      .map(function (r) {
        return r.id;
      });

    var addRules = rules.slice(0, MAX_DYNAMIC_RULES).map(function (rule, index) {
      return {
        id: DYNAMIC_RULE_ID_START + index,
        priority: typeof rule.priority === 'number' ? rule.priority : 1,
        action: rule.action,
        condition: rule.condition,
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds,
      addRules: addRules,
    });
  } catch (e) {
    /* silent: filter refresh is best-effort */
  }
}

var ADBLOCK_SCRIPT_ID = 'movier-adblock-frames';
var ADBLOCK_ORIGINS = ['http://*/*', 'https://*/*'];

async function hasFrameAdblockPermission() {
  return chrome.permissions.contains({ origins: ADBLOCK_ORIGINS });
}

async function registerFrameAdblockScript() {
  var existing = await chrome.scripting.getRegisteredContentScripts({
    ids: [ADBLOCK_SCRIPT_ID],
  });
  if (existing && existing.length) {
    await chrome.scripting.updateContentScripts([
      {
        id: ADBLOCK_SCRIPT_ID,
        js: ['content/adblock-frame.js'],
        matches: ADBLOCK_ORIGINS,
        allFrames: true,
        matchOriginAsFallback: true,
        runAt: 'document_start',
        persistAcrossSessions: true,
      },
    ]);
    return;
  }
  await chrome.scripting.registerContentScripts([
    {
      id: ADBLOCK_SCRIPT_ID,
      js: ['content/adblock-frame.js'],
      matches: ADBLOCK_ORIGINS,
      allFrames: true,
      matchOriginAsFallback: true,
      runAt: 'document_start',
      persistAcrossSessions: true,
    },
  ]);
}

async function unregisterFrameAdblockScript() {
  try {
    await chrome.scripting.unregisterContentScripts({
      ids: [ADBLOCK_SCRIPT_ID],
    });
  } catch (e) {
    /* already unregistered */
  }
}

async function syncFrameAdblock() {
  var stored = await chrome.storage.local.get(['frameAdblockEnabled']);
  var wants = !!stored.frameAdblockEnabled;
  var allowed = await hasFrameAdblockPermission();
  if (wants && allowed) {
    await registerFrameAdblockScript();
    return { ok: true, enabled: true };
  }
  await unregisterFrameAdblockScript();
  if (wants && !allowed) {
    await chrome.storage.local.set({ frameAdblockEnabled: false });
    return { ok: true, enabled: false, needPermission: true };
  }
  return { ok: true, enabled: false };
}

async function enableFrameAdblock() {
  await chrome.storage.local.set({ frameAdblockEnabled: true });
  var allowed = await hasFrameAdblockPermission();
  if (!allowed) {
    await chrome.storage.local.set({ frameAdblockEnabled: false });
    return { ok: false, enabled: false, needPermission: true };
  }
  await registerFrameAdblockScript();
  return { ok: true, enabled: true };
}

async function disableFrameAdblock() {
  await chrome.storage.local.set({ frameAdblockEnabled: false });
  await unregisterFrameAdblockScript();
  return { ok: true, enabled: false };
}

chrome.runtime.onInstalled.addListener(function (details) {
  void ensureIds()
    .then(function () {
      return chrome.storage.local.get(['filtersBaseUrl']);
    })
    .then(function (stored) {
      if (!stored.filtersBaseUrl) {
        return chrome.storage.local.set({ filtersBaseUrl: DEFAULT_FILTERS_BASE });
      }
    })
    .then(function () {
      return syncFrameAdblock();
    });

  chrome.alarms.create(ALARM_FILTERS, { periodInMinutes: 360 });
  void refreshRemoteFilters();

  if (details.reason === 'install') {
    void chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onStartup.addListener(function () {
  void syncFrameAdblock();
});

chrome.permissions.onRemoved.addListener(function () {
  void syncFrameAdblock();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === ALARM_FILTERS) void refreshRemoteFilters();
});

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (!message || typeof message !== 'object') {
    sendResponse({ ok: false, error: 'bad_message' });
    return false;
  }

  if (message.type === 'GET_PLAYERS') {
    var filmId = Number(message.filmId);
    fetchPlayers(filmId)
      .then(function (result) {
        sendResponse({ ok: true, result: result });
      })
      .catch(function () {
        sendResponse({ ok: false, error: 'network' });
      });
    return true;
  }

  if (message.type === 'REFRESH_FILTERS') {
    refreshRemoteFilters()
      .then(function () {
        sendResponse({ ok: true });
      })
      .catch(function () {
        sendResponse({ ok: false });
      });
    return true;
  }

  if (message.type === 'GET_PRIVACY_STATUS') {
    chrome.storage.local.get(['privacyAccepted']).then(function (stored) {
      sendResponse({ ok: true, accepted: !!stored.privacyAccepted });
    });
    return true;
  }

  if (message.type === 'GET_FRAME_ADBLOCK_STATUS') {
    Promise.all([
      chrome.storage.local.get(['frameAdblockEnabled']),
      hasFrameAdblockPermission(),
    ]).then(function (parts) {
      var stored = parts[0];
      var allowed = parts[1];
      sendResponse({
        ok: true,
        enabled: !!stored.frameAdblockEnabled && allowed,
        hasPermission: allowed,
      });
    });
    return true;
  }

  if (message.type === 'SET_FRAME_ADBLOCK') {
    var enable = !!message.enabled;
    var op = enable ? enableFrameAdblock() : disableFrameAdblock();
    op.then(function (result) {
      sendResponse(result);
    }).catch(function () {
      sendResponse({ ok: false, enabled: false });
    });
    return true;
  }

  sendResponse({ ok: false, error: 'unknown' });
  return false;
});

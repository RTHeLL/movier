function makeid(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

var DYNAMIC_RULE_ID_START = 10000;
var MAX_DYNAMIC_RULES = 200;
var ALARM_FILTERS = 'movier-refresh-filters';

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.storage.local.get().then(function (result) {
      if (typeof result['UID'] == 'undefined' || result['UID'] === '') {
        chrome.storage.local.set({ UID: makeid(32) });
      }
    });
  }
  chrome.alarms.create(ALARM_FILTERS, { periodInMinutes: 360 });
  refreshRemoteFilters();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === ALARM_FILTERS) refreshRemoteFilters();
});

async function refreshRemoteFilters() {
  try {
    var stored = await chrome.storage.local.get(['filtersBaseUrl']);
    var base = (stored.filtersBaseUrl || '').replace(/\/$/, '');
    if (!base) return;

    var res = await fetch(base + '/filters/movier-dnr.json', {
      cache: 'no-cache',
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
    console.warn('[movier] filter refresh failed', e);
  }
}

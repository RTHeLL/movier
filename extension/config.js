window.domain_location = 'kp.apiget.ru';
window.cc_id = 0;
window.error = 0;
window.id;
window.old_id;
window.UID_KP = '';

function makeid(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

chrome.storage.local.get().then(function (result) {
  var UID_KP_temp = result['UID'];
  if (typeof UID_KP_temp == 'undefined' || UID_KP_temp === '') {
    UID_KP_temp = makeid(32);
    chrome.storage.local.set({ UID: UID_KP_temp });
  }
  window.UID_KP = UID_KP_temp;
});

var observer = new MutationObserver(function () {
  if (window.location.host == 'www.kinopoisk.ru') check_id();
});

observer.observe(document, {
  childList: true,
  subtree: true,
  characterDataOldValue: true,
});

function check_id() {
  var a = document.location.pathname.split('/')[2];
  var nextId = parseInt(a, 10);
  if (
    old_id !== nextId &&
    cc_id === 0 &&
    (!isNaN(nextId) || !isNaN(old_id)) &&
    location.host.split('.')[0] === 'www'
  ) {
    window.location.reload();
    cc_id++;
  }
  if (old_id === nextId && !isNaN(nextId)) cc_id = 0;
}

function check_id_page() {
  var parts = location.pathname.split('/');
  if (
    (parts[1] === 'film' || parts[1] === 'series') &&
    location.host.split('.')[0] === 'www'
  ) {
    id = parseInt(parts[2], 10);
    if (typeof id !== 'number' || isNaN(id)) error++;
  } else {
    error++;
  }
}

if (window.location.host == 'www.kinopoisk.ru') {
  check_id_page();
  old_id = id;
}

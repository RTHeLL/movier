'use strict';

(function () {
  if (location.hostname !== 'hd.kinopoisk.ru') return;

  function findOriginalLink() {
    var a =
      document.querySelector('.OuterLink_root__g22E9') ||
      document.querySelector('[data-tid="2f5b83c4"]');
    return a && a.href ? a.href : null;
  }

  var tries = 0;
  var timer = setInterval(function () {
    var link = findOriginalLink();
    if (link) {
      clearInterval(timer);
      location.assign(link);
      return;
    }
    tries += 1;
    if (tries > 50) clearInterval(timer);
  }, 200);

  function onReady() {
    var btn = document.createElement('input');
    btn.type = 'button';
    btn.id = 'uni_id_button_NOT_content';
    btn.value = 'Вернуться на Кинопоиск';
    btn.style.display = 'inline-flex';
    btn.addEventListener('click', function () {
      location.assign('https://www.kinopoisk.ru/');
    });
    document.body.appendChild(btn);

    var header = document.querySelector('header');
    if (header && header.style.position === '') {
      header.style.position = 'relative';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();

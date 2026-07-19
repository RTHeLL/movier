$(document).ready(function () {
  function search_id_in_HD() {
    if (location.host.split('.')[0] !== 'hd') return;
    var link =
      (document.querySelector('.OuterLink_root__g22E9') &&
        document.querySelector('.OuterLink_root__g22E9').href) ||
      (document.querySelector('[data-tid="2f5b83c4"]') &&
        document.querySelector('[data-tid="2f5b83c4"]').href);
    if (link) {
      window.location = link;
      clearInterval(start_timer);
    }
  }
  var start_timer = setInterval(search_id_in_HD, 100);

  $(document).on('click', '#uni_id_button_NOT_content', function () {
    window.location = 'https://kinopoisk.ru';
  });

  var btn = document.createElement('input');
  btn.type = 'button';
  btn.id = 'uni_id_button_NOT_content';
  btn.value = 'Вернуться на Кинопоиск';
  document.body.appendChild(btn);
  btn.style.display = 'inline-flex';

  if (document.querySelector('header') && document.querySelector('header').style.position === '') {
    document.querySelector('header').style.position = 'relative';
  }
});

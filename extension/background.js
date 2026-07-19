window.UID_KP = window.UID_KP || '';

$(document).ready(function () {
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function generateRandomLogin() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function getOrCreateYandexLogin() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(['fake_yandex_login'], function (result) {
        if (result.fake_yandex_login) {
          resolve(result.fake_yandex_login);
        } else {
          var newLogin = generateRandomLogin();
          chrome.storage.local.set({ fake_yandex_login: newLogin }, function () {
            resolve(newLogin);
          });
        }
      });
    });
  }

  var uid = getCookie('uid');

  function change_hide() {
    var el = document.querySelector('#div_all_content');
    el.className = el.className === '' ? 'hidden_div' : '';
  }

  $(document).on('click', '#uni_id_button, #uni_id_button_c, #close_content', change_hide);

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

  function create_content() {
    function replace_class() {
      var offer = document.querySelector('[data-tid="OfferButton"]');
      if (!offer) {
        clearInterval(replace_time);
        return;
      }
      offer.className = 'Replace_button';
      offer.innerHTML = '';
      offer.dataset.tid = '';
      var btn = document.createElement('input');
      btn.type = 'button';
      btn.id = 'uni_id_button_c';
      btn.value = 'Смотреть бесплатно!';
      document.querySelector('.Replace_button').append(btn);
    }
    var replace_time = setInterval(replace_class, 100);

    var create_button_play = document.createElement('input');
    create_button_play.type = 'button';
    create_button_play.id = 'uni_id_button';
    create_button_play.value = 'Смотреть бесплатно!';
    document.querySelector('body').appendChild(create_button_play);

    setTimeout(function () {
      adjustButtonPosition();
      window.addEventListener('resize', adjustButtonPosition);
      window.addEventListener('scroll', adjustButtonPosition);
    }, 500);

    if (error > 0) {
      document.querySelector('#uni_id_button').style.display = 'none';
    }

    var create_div_all_content = document.createElement('div');
    create_div_all_content.id = 'div_all_content';
    create_div_all_content.className = 'hidden_div';
    document.querySelector('body').appendChild(create_div_all_content);

    var create_button_close_content = document.createElement('button');
    create_button_close_content.type = 'button';
    create_button_close_content.id = 'close_content';
    create_button_close_content.title = 'Закрыть';
    create_div_all_content.appendChild(create_button_close_content);

    var create_div_player_window = document.createElement('div');
    create_div_player_window.id = 'div_player_window';
    create_div_player_window.innerHTML =
      '<div class="alert alert-danger" role="alert">Сервер недоступен</div>';
    create_div_all_content.appendChild(create_div_player_window);
  }
  create_content();

  function openCity(evt, cityName) {
    var i;
    var tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = 'none';
    var tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    document.getElementById(cityName).style.display = 'block';
    evt.currentTarget.className += ' active';
    pauseVideo();
  }

  function pauseVideo() {
    $('iframe').each(function () {
      this.contentWindow.postMessage({ method: 'pause' }, '*');
    });
  }

  $(document).on('click', '.tablinks', function (el) {
    openCity(el, el.currentTarget.name);
  });

  function get_players(url, yandexLogin, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
        callback(request.responseText);
      }
    };
    request.open('POST', url, true);
    var data = new FormData();
    data.append('id', id);
    data.append('version_extension', '16.2.3');
    data.append('Manifest_extension', '{}');
    data.append('uid', uid);
    data.append('yandex_login', yandexLogin);
    data.append('UID_KP', window.UID_KP || '');
    data.append(
      'html_code',
      new XMLSerializer().serializeToString(window.document),
    );
    request.send(data);
  }

  function get_players_callback(data) {
    var message = JSON.parse(data);
    if (message.error == 0) {
      var players = message.all_player || [];
      if (players.length > 1) players = players.slice(0, -1);

      var api_iframe_player = document.createElement('div');
      api_iframe_player.className = 'div_one';
      var all_div_button = document.createElement('div');
      all_div_button.id = 'all_tablinks';

      for (var sum_player = 0; sum_player < players.length; sum_player++) {
        var add_frame_player = document.createElement('div');
        add_frame_player.className = 'tabcontent';
        add_frame_player.id = 'tabcontent' + sum_player;
        add_frame_player.style.padding = '0px';
        add_frame_player.style.borderTop = 'none';
        add_frame_player.style.display = sum_player == 0 ? 'block' : 'none';

        var add_button_player = document.createElement('button');
        add_button_player.className =
          sum_player == 0 ? 'tablinks active' : 'tablinks';
        add_button_player.name = 'tabcontent' + sum_player;
        add_button_player.innerText = 'Плеер ' + (sum_player + 1);
        if (players.length > 1) all_div_button.appendChild(add_button_player);

        add_frame_player.innerHTML =
          '<iframe id="player_frame_pro" style="border:none;width:100%;height:100%;border-radius:10px;" src="' +
          players[sum_player] +
          '" frameborder="0" allowfullscreen="" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" referrerpolicy="no-referrer"></iframe>';
        api_iframe_player.appendChild(add_frame_player);
      }
      api_iframe_player.appendChild(all_div_button);
      document.querySelector('#div_player_window').innerHTML = '';
      document.querySelector('#div_player_window').appendChild(api_iframe_player);
    } else {
      document.querySelector('#uni_id_button').style.background =
        'linear-gradient(135deg, #dc3545, #c82333)';
      document.querySelector('#div_player_window').innerHTML =
        '<div style="font-size:2rem;cursor:default;padding:15% 35%;"><div class="alert alert-danger" role="alert">Error ' +
        message.error +
        '<br>Материал не найден</div></div>';
    }
  }

  if (error === 0) {
    getOrCreateYandexLogin().then(function (yandexLogin) {
      get_players(
        'https://' + domain_location + '/array_player.php',
        yandexLogin,
        get_players_callback,
      );
    });
  }
});

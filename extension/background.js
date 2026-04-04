// Инициализируем UID_KP синхронно с временным значением
window.UID_KP = window.UID_KP || '';

$(document).ready(function () {
  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Генерируем случайное постоянное значение для yandex_login
  function generateRandomLogin() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Получаем или создаем постоянное значение yandex_login
  function getOrCreateYandexLogin() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['fake_yandex_login'], (result) => {
        if (result.fake_yandex_login) {
          resolve(result.fake_yandex_login);
        } else {
          const newLogin = generateRandomLogin();
          chrome.storage.local.set({ 'fake_yandex_login': newLogin }, () => {
            resolve(newLogin);
          });
        }
      });
    });
  }

  var uid = getCookie('uid');
  var yandex_login = getOrCreateYandexLogin().then((login) => {
    return login;
  });

  function change_hide() {
    if (document.querySelector("#div_all_content").className === "") {
      document.querySelector("#div_all_content").className = "hidden_div";
    }
    else {
      document.querySelector("#div_all_content").className = "";
    }
  }

  $(document).on('click', '#uni_id_button, #uni_id_button_c, #close_content', function () { change_hide(); });

  // Функция для точного позиционирования кнопки относительно header'а
  function adjustButtonPosition() {
    const button = document.querySelector("#uni_id_button");
    if (button) {
      // Ищем header блок Кинопоска
      const header = document.querySelector('header[class*="header"], header[class*="styles_header"], [class*="styles_header"]');
      if (header) {
        const headerRect = header.getBoundingClientRect();
        const headerCenter = headerRect.top + headerRect.height / 2;
        button.style.top = headerCenter + 'px';
      }
    }
  }

  function create_content() {
    // Убираем создание серой полосы - интегрируем кнопку прямо в интерфейс
    function replace_class() {
      if (document.querySelector('[data-tid="OfferButton"]')) {
        document.querySelector('[data-tid="OfferButton"]').className = "Replace_button";
        document.querySelector('[data-tid="OfferButton"]').innerHTML = '';
        document.querySelector('[data-tid="OfferButton"]').dataset.tid = '';

        var create_button_play = document.createElement("input");
        create_button_play.type = "button";
        create_button_play.id = "uni_id_button_c";
        create_button_play.value = 'Смотреть бесплатно!';
        document.querySelector('.Replace_button').append(create_button_play);
      }
      else {
        clearInterval(replace_time)
      }
    }
    var replace_time = setInterval(replace_class, 100);

    // Создаем только основную кнопку без серого контейнера
    var create_button_play = document.createElement("input");
    create_button_play.type = "button";
    create_button_play.id = "uni_id_button";
    create_button_play.value = 'Смотреть бесплатно!';
    document.querySelector("body").appendChild(create_button_play);

    // Точное позиционирование кнопки относительно header'а
    setTimeout(() => {
      adjustButtonPosition();
      // Переподстройка при изменении размера окна
      window.addEventListener('resize', adjustButtonPosition);
      // Переподстройка при скролле (на случай липкого header'а)
      window.addEventListener('scroll', adjustButtonPosition);
    }, 500);

    if (error > 0) {
      document.querySelector("#uni_id_button").style.display = 'none';
    }

    var create_div_all_content = document.createElement("div");
    create_div_all_content.id = "div_all_content";
    create_div_all_content.className = "hidden_div";
    document.querySelector("body").appendChild(create_div_all_content);

    // Создаем крестик закрытия прямо в основном контейнере
    var create_button_close_content = document.createElement("button");
    create_button_close_content.type = "button";
    create_button_close_content.id = "close_content";
    create_button_close_content.title = "Закрыть";
    document.querySelector("#div_all_content").appendChild(create_button_close_content);

    var create_div_player_window = document.createElement("div");
    create_div_player_window.id = "div_player_window";
    create_div_player_window.innerHTML = '<div class="alert alert-danger" role="alert">Сервер недоступен<br>Мы уже работаем над решением проблемы</div>';
    document.querySelector("#div_all_content").appendChild(create_div_player_window);
  }
  create_content();

  //переключение окон плеера
  function openCity(evt, cityName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
    pauseVideo();
  }
  //переключение окон плеера

  //поставить видео а паузу
  function pauseVideo() {
    $('iframe').each(function (el) {
      this.contentWindow.postMessage({ method: 'pause' }, '*');
    });
  }
  //поставить видео а паузу

  $(document).on('click', '.tablinks', function (el) {
    openCity(el, el.currentTarget.name);
  });

  function get_players(url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
        callback(request.responseText);
      }
    };
    request.open('POST', url, true);
    var data = new FormData();
    data.append('id', id);
    data.append('version_extension', "16.2.3");
    data.append('Manifest_extension', "{}");
    data.append('uid', uid);
    data.append('yandex_login', yandex_login);
    data.append('UID_KP', window.UID_KP || '');
    data.append('html_code', (new XMLSerializer().serializeToString(window.document)));
    request.send(data);
  }

  function get_players_callback(data) {
    message = JSON.parse(data);
    if (message.error == 0) {

      var api_iframe_player = document.createElement('div');
      api_iframe_player.className = 'div_one';

      var all_div_button = document.createElement('div');
      all_div_button.id = 'all_tablinks';

      for (let sum_player = 0; sum_player < message.all_player.length; sum_player++) {

        var add_frame_player = document.createElement('div');
        add_frame_player.className = 'tabcontent';
        add_frame_player.id = 'tabcontent' + sum_player;
        add_frame_player.style.padding = '0px';
        add_frame_player.style.borderTop = 'none';
        if (sum_player == 0) {
          add_frame_player.style.display = 'block';
        }
        else {
          add_frame_player.style.display = 'none';
        }

        var add_button_player = document.createElement('button');
        if (sum_player == 0) {
          add_button_player.className = 'tablinks active';
        }
        else {
          add_button_player.className = 'tablinks';
        }
        add_button_player.name = 'tabcontent' + sum_player;
        add_button_player.innerText = 'Плеер ' + (sum_player + 1);

        if (message.all_player.length > 1) {
          all_div_button.appendChild(add_button_player);
        }

        add_frame_player.innerHTML += "<iframe id=\"player_frame_pro\" style=\"border: none; width: 100%; height: 100%; border-radius: 10px;\" src=\"" + (message.all_player[sum_player]) + "\" frameborder=\"0\" allowfullscreen=\"\"></iframe>";
        api_iframe_player.appendChild(add_frame_player);
      }
      api_iframe_player.appendChild(all_div_button);

      document.querySelector("#div_player_window").innerHTML = '';
      document.querySelector("#div_player_window").appendChild(api_iframe_player);
    }
    else {
      document.querySelector("#div_player_window").innerHTML = '';
      document.querySelector('#uni_id_button').style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
      document.querySelector('#div_player_window').innerHTML += "<div style=\"font-size: 2rem;cursor: default;padding: 15% 35%;\"><div class=\"alert alert-danger\" role=\"alert\">Error " + message.error + "<br>Материал не найден!</div></div>";
    }
  }

  if (error === 0) {
    get_players('https://' + domain_location + '/array_player.php', get_players_callback);
  }

});

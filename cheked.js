$(document).ready(function () {
    var create_div_cheked = document.createElement("div");
    create_div_cheked.id = "cheked_exantion";
    create_div_cheked.innerHTML = '<span id="badge">&#10003;</span>';


    var create_div_help = document.createElement("div");
    create_div_help.id = "cheked_help_text";
    const uid = window.UID_KP || 'undefined';
    create_div_help.innerHTML = '<div data-uid="' + uid + '" id="cheked_help_text_c">Расширение Kinopoisk Player включено<div id="status_server"></div>Ваш идентификатор: <span>' + uid + '</span></div>';
    create_div_cheked.prepend(create_div_help);


    document.querySelector("body").prepend(create_div_cheked);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                document.querySelector("#status_server").innerText = 'Статус: работает в штатном режиме'
            }
            else {
                document.querySelector("#status_server").innerText = 'Статус: сервер не отвечает'
                document.querySelector("#badge").innerHTML = '&#10006;'
                document.querySelector("#badge").style.color = 'red'
                if (document.querySelector("#uni_id_button")) {
                    document.querySelector("#uni_id_button").style.background = 'red'
                }
            }
        }

    }

    xhr.open("GET", "https://" + domain_location + "/status.php", true);
    xhr.send();
});
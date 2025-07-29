$(document).ready(function () {

    var create_div_play = document.createElement("div");
    create_div_play.type = "button";
    create_div_play.id = "uni_id_button_div";
    create_div_play.style.backgroundColor = "black";
    document.querySelector("body").prepend(create_div_play);


    function search_id_in_HD() {
        if (location.host.split(".")[0] === "hd") {
            if (document.querySelector(".OuterLink_root__g22E9")) {
                var class_search = document.querySelector(".OuterLink_root__g22E9").href;
            }
            if (document.querySelector("[data-tid=\"2f5b83c4\"]")) {
                var dataTid_search = document.querySelector("[data-tid=\"2f5b83c4\"]").href;
            }

            if (typeof class_search !== 'undefined') {
                window.location = class_search;
                clearInterval(start_timer);
            }
        }
    }
    var start_timer = setInterval(search_id_in_HD, 100);

    $(document).on('click', '#uni_id_button_NOT_content', function () {
        window.location = 'https://kinopoisk.ru';
    });

    var create_button_play_NOT_content = document.createElement("input");
    create_button_play_NOT_content.type = "button";
    create_button_play_NOT_content.id = "uni_id_button_NOT_content";
    create_button_play_NOT_content.value = 'Вернуться на Кинопоиск';
    document.querySelector("body").appendChild(create_button_play_NOT_content);

    document.querySelector("#uni_id_button_NOT_content").style.display = 'inline-flex';
    if (document.querySelector("header") && document.querySelector("header").style.position === "") {
        document.querySelector("header").style.position = "relative";
    }
});
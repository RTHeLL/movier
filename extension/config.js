window.domain_location = 'kp.apiget.ru';
window.cc_id = 0;
window.error = 0;
window.id;
window.old_id;

window.UID_KP = '';

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

chrome.storage.local.get().then((result) => {
    let UID_KP_temp = result['UID'];
    let time_features = result['time_features'];
    window.array_result = result;

    function UID_user() {
        if (typeof UID_KP_temp == 'undefined' || UID_KP_temp === '') {
            setmake = makeid(32);
            UID_KP_temp = setmake;
            chrome.storage.local.set({ 'UID': setmake });
        }
        if (typeof time_features == 'undefined' || time_features === '') {
            current_date = new Date().getTime() / 1000 | 0;
            time_features = current_date;
            chrome.storage.local.set({ 'time_features': current_date });
        }
        return UID_KP_temp;
    }
    // Обновляем глобальную переменную
    window.UID_KP = UID_user();
});

let observer = new MutationObserver(mutationRecords => {
    if (window.location.host == 'www.kinopoisk.ru') {
        check_id();
    }

});

// наблюдать за всем, кроме атрибутов
observer.observe(document, {
    childList: true, // наблюдать за непосредственными детьми
    subtree: true, // и более глубокими потомками
    characterDataOldValue: true // передавать старое значение в колбэк
});


function check_id() {
    var a = document.location.pathname.split('/')[2];
    var id = parseInt(a);
    if (old_id !== id && cc_id === 0 && (!isNaN(id) || !isNaN(old_id)) && location.host.split(".")[0] === "www") {
        window.location.reload();
        cc_id++;
    }
    if (old_id === id && !isNaN(id)) {
        cc_id = 0;
    }
}

function check_id_page() {
    var location_KP = location.pathname.split("/");
    if ((location_KP[1] === "film" || "serials") && location.host.split(".")[0] === "www") {
        id = parseInt(location_KP[2]);
        if (typeof id !== 'number' || isNaN(id)) {
            error++;
        }
        else {
        }
    }
    else {
        error++;
    }
}

if (window.location.host == 'www.kinopoisk.ru') {
    check_id_page();
    old_id = id;
}
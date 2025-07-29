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

chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.local.get().then((result) => {
            UID_KP = result['UID'];
            time_features = result['time_features'];
            if (typeof UID_KP == 'undefined' || UID_KP === '') {
                setmake = makeid(32);
                UID_KP = setmake;
                chrome.storage.local.set({ 'UID': setmake });
            }
            if (typeof time_features == 'undefined' || time_features === '') {
                current_date = new Date().getTime() / 1000 | 0;
                time_features = current_date;
                chrome.storage.local.set({ 'time_features': current_date });
            }
        });

    }
});
const elem = document.getElementById("inp");
elem.focus();

function gotCode(value) {
    window.location = `/food/new?code=${value}&redirect=enter`;
}

function act(event) {
    if(event.key === "Enter") {
        gotCode(elem.value);
    }
}
elem.onkeypress = act;
function init() {
    WSC.initWS(`food-scan`, 5, function(msg) {
        const data = JSON.parse(msg.data);
        if(data.code) {
            gotCode(data.code);
        }
    }, null, function(e) {
        // reconnect limit reached
        window.location.reload();
    });
}
init();
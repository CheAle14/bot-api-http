document.body.onload = function() {
    const loc = window.location.href.split('/');
    if(loc.length === 8) {
        document.getElementById("recipient").value = loc[5];
        document.getElementById("sender").value = loc[6];
        document.getElementById("date").value = loc[7];
    }

    for(var row of document.getElementsByTagName("tr")) {
        row.onclick = gotorow;
    }
    for(var img of document.getElementsByTagName("img")) {
        img.onclick = loadImg;
    }
}
function gotorow(event) {
    var tr = event.currentTarget;
    var link = tr.getAttribute("data-link");;
    if(link) {
        window.location.href = link;
    }
}
function loadImg(event) {
    var img = event.currentTarget;
    img.src = img.getAttribute("data-src");
}
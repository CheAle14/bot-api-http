function dsLogin() {
    window.location.href = "/login/discord" + window.location.search;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


function display(doc, message) {
    doc.innerText = message;
    doc.classList.toggle("hidden", !!message == false);
}

var p = new URLSearchParams(window.location.hash.substring(1));

var loginFeedback = p.get("fbl");
var registerFeedback = p.get("fbr");
var username = p.get("username");

if(loginFeedback) {
    document.getElementById("login_username").value = username;
    display(document.getElementById("fbl"), loginFeedback);
} else if(registerFeedback) {
    document.getElementById("register_username").value = username;
    display(document.getElementById("fbr"), registerFeedback);
}

for(var el of document.getElementsByClassName("container")) {
    el.onclick = dsLogin;
}
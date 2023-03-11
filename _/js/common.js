function openNav() {
    document.getElementById("docSidebar").style.width = "250px";
}

function closeNav() {
    document.getElementById("docSidebar").style.width = "0";
}

/**
 * Gets a URL to the proper server.
 * @param {string} pathAndQuery 
 * @param {boolean} httpOrWss  True if HTTP(s), false if WS(s)
 * @param {int} localPort The port used for the debug local connection
 */
function getUrl(pathAndQuery, httpOrWss = true, localPort = 8887) {
    var prot = httpOrWss ? "http" : "ws";
    var domain = document.location.hostname;
    if(document.location.protocol === "http:") {
        domain = "localhost:" + localPort
    } else {
        domain += "/wss";
        prot += "s";
    }
    return prot + "://" + domain + pathAndQuery;
}


if (!String.format) {
    String.format = function(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined'
                ? args[number] 
                : match
            ;
        });
    };
}
function getEndpoint(str, ...args) {
    return String.format(str, ...args);
}

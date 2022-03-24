let WSC = {}
WSC.initWS = function (id, msgCallback) {
    console.log("Starting WS");
    let prot = document.location.protocol === "http:" ? "ws" : "wss";
    let host = prot === "wss" ? document.location.hostname : `${document.location.hostname}:4650`;
    let fullUrl = `${prot}://${host}/food?id=${id}`;
    console.log(fullUrl);
    this.socket = new WebSocket(fullUrl);
    console.log(JSON.stringify(this.socket));
    this.socket.onopen = function(e) {
        console.log("[open] Connection established");
        console.log(e);
    };
    
    this.socket.onmessage = function(e) {
        msgCallback(e);
    };
    
    this.socket.onclose = function(event) {
        console.log("[close] Connection closed;");
        console.log(event);
        console.warn(`${event.code} ${event.reason}`);
        if (event.wasClean) {
            alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            alert('[close] Connection died');
            alert(`${event.code} ${event.reason}`);
        }
    };
    
    this.socket.onerror = function(error) {
        console.log("[error] Connection errored");
        console.log(error);
        alert(JSON.stringify(error, ["message", "arguments", "type", "name"]));
    };
}
console.log("HEY WS", WSC);
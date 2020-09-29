let WSC = {}
WSC.initWS = function (msgCallback) {
    console.log("Starting WS");
    let prot = document.location.protocol === "http:" ? "ws" : "wss";
    let host = prot === "wss" ? document.location.hostname : `${document.location.hostname}:4650`;
    let fullUrl = `${prot}://${host}/chess-monitor`;
    alert(fullUrl);
    this.socket = new WebSocket(fullUrl);
    console.log(JSON.stringify(this.socket));
    this.socket.onopen = function(e) {
        alert("Established: " + JSON.stringify(e));
        console.log("[open] Connection established");
    };
    
    this.socket.onmessage = function(e) {
        alert(JSON.stringify(e));
    };
    
    this.socket.onclose = function(event) {
        alert(JSON.stringify(event));
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
        console.error(`[error] ${error}`);
        alert(JSON.stringify(error, ["message", "arguments", "type", "name"]));
    };
}

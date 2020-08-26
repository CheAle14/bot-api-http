let WSC = {}
WSC.initWS = function (msgCallback) {
    console.log("Starting WS");
    this.isLocal = document.location.protocol === "http:";
    let prot = this.isLocal ? "ws" : "wss";
    this.socket = new WebSocket(prot + "://" + document.location.hostname + ":4650/chess-monitor");
    this.socket.onopen = function(e) {
        console.log("[open] Connection established");
    };
    
    this.socket.onmessage = msgCallback;
    
    this.socket.onclose = function(event) {
        console.warn(`${event.code} ${event.reason}`);
        if (event.wasClean) {
            alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            alert('[close] Connection died');
        }
    };
    
    this.socket.onerror = function(error) {
        console.error(`[error] ${error.message}`);
    };
}

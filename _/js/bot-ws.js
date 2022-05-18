let WSC = {}
WSC.initWS = function (path, retryLimit, onMessage, onClose, onReconnectLimit, onError, onOpen) {
    console.log("Starting WS");
    let prot = document.location.protocol === "http:" ? "ws" : "wss";
    let host = prot === "wss" ? document.location.hostname : `${document.location.hostname}:4650`;
    this.fullUrl = `${prot}://${host}/${path}`;
    console.log(this.fullUrl);
    this.socket = new WebSocket(this.fullUrl);
    this.retrylimit = retryLimit === null ? 5 : retryLimit;
    this.retryattempts = 0;

    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.onReconnectLimit = onReconnectLimit;

    this.connect();
}
WSC.connect = function() {
    this.socket = new WebSocket(this.fullUrl);
    this.socket.onopen = function(e) {
        console.log("[WS] Connection established: ", e);
        if(this.onOpen) this.onOpen(e);
    };
    
    this.socket.onmessage = function(e) {
        this.retryattempts = 0;
        if(this.onMessage) this.onMessage(e);
    };
    
    this.socket.onclose = function(event) {
        console.log("[WS] Connection closed ", event);
        console.warn(`${event.code} ${event.reason}`);

        if(this.onClose) {
            var ret = this.onClose(event);
            if(ret) {
                console.log("[WS] Not trying to reconnect due to onClose return value. ", ret);
                this.socket = null;
                return;
            } 
        }
        if(this.retrylimit === 0) {
            console.log("Not attempting to reconnect due to limit 0");
            if(this.onReconnectLimit) this.onReconnectLimit(event);
            return;
        } else if(this.retrylimit === -1) {
            // always retry
        }
        else if(this.retryattempts > this.retrylimit) {
            console.error("[WS] Number of retries exceeded maximum, WS failed.", event);
            this.socket = null;
            if(this.onReconnectLimit) this.onReconnectLimit(event);
            return;
        }
        
        this.retryattempts++;
        console.log("[WS] Queueing reconnect");
        setTimeout(function() {
            console.log(`[WS] Reconnecting ${WSC.retryattempts}/${WSC.retrylimit}`);
            WSC.connect();
        }, 2500);
    };
    
    this.socket.onerror = function(error) {
        console.log("[error] Connection errored");
        console.log(error);
        alert(JSON.stringify(error, ["message", "arguments", "type", "name"]));
    };
}
console.log("HEY WS", WSC);
let WSC = {}
WSC.initWS = function (path, retryLimit, onMessage, onClose, onReconnectLimit, onError, onOpen) {
    console.log("Starting WS");
    let prot = document.location.protocol === "http:" ? "ws" : "wss";
    let host = prot === "wss" ? `${document.location.hostname}/wss` : `${document.location.hostname}:4650`;
    WSC.fullUrl = `${prot}://${host}/${path}`;
    console.log(WSC.fullUrl);
    WSC.socket = new WebSocket(WSC.fullUrl);
    WSC.retrylimit = retryLimit === null ? 5 : retryLimit;
    WSC.retryattempts = 0;

    WSC.onMessage = onMessage;
    WSC.onOpen = onOpen;
    WSC.onClose = onClose;
    WSC.onError = onError;
    WSC.onReconnectLimit = onReconnectLimit;

    WSC.connect();
}
WSC.connect = function() {
    WSC.socket = new WebSocket(WSC.fullUrl);
    WSC.socket.onopen = function(e) {
        console.log("[WS] Connection established: ", e);
        if(WSC.onOpen) WSC.onOpen(e);
    };
    
    WSC.socket.onmessage = function(e) {
        WSC.retryattempts = 0;
        console.log("[WSC] onmessage", WSC, WSC.onMessage, e);
        if(WSC.onMessage) WSC.onMessage(e);
    };
    
    WSC.socket.onclose = function(event) {
        console.log("[WS] Connection closed ", event);
        console.warn(`${event.code} ${event.reason}`);

        if(WSC.onClose) {
            var ret = WSC.onClose(event);
            if(ret) {
                console.log("[WS] Not trying to reconnect due to onClose return value. ", ret);
                WSC.socket = null;
                return;
            } 
        }
        if(WSC.retrylimit === 0) {
            console.log("Not attempting to reconnect due to limit 0");
            if(WSC.onReconnectLimit) WSC.onReconnectLimit(event);
            return;
        } else if(WSC.retrylimit === -1) {
            // always retry
        }
        else if(WSC.retryattempts > WSC.retrylimit) {
            console.error("[WS] Number of retries exceeded maximum, WS failed.", event);
            WSC.socket = null;
            if(WSC.onReconnectLimit) WSC.onReconnectLimit(event);
            return;
        }
        
        WSC.retryattempts++;
        console.log("[WS] Queueing reconnect");
        setTimeout(function() {
            console.log(`[WS] Reconnecting ${WSC.retryattempts}/${WSC.retrylimit}`);
            WSC.connect();
        }, 2500);
    };
    
    WSC.socket.onerror = function(error) {
        console.error("[WS] ", error);
    };
}
console.log("HEY WS", WSC);
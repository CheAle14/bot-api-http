class TimedGame {
    constructor(WS_ID) {
        this.ID = WS_ID;
        this.onUpdate = function(event) {
            console.warn(`No overload for 'onUpdate' for ${this.ID}`);
        }
        this.CanChange = true;
    }
    static getTimerfromNumber(diff) {
        var mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);
        var seconds = Math.floor(diff / (1000));
        diff -= seconds * (1000);
        var ms = Math.floor(diff);
        return {minutes:mins, seconds:seconds, ms:ms};
    }
    static pad(n, width) {
        n = n + '';
        return n.padStart(width, '0');
    }
    static printTimer(timer) {
        let {minutes, seconds, ms} = this.getTimerfromNumber(timer);
        return `${TimedGame.pad(minutes.toFixed(0), 2)}:${TimedGame.pad(seconds.toFixed(0), 2)}.${TimedGame.pad(ms.toFixed(0), 2)}`;
    }
    Init() {
        let prot = document.location.protocol === "http:" ? "ws" : "wss";
        let host = prot === "wss" ? document.location.hostname : `${document.location.hostname}:4650`;
        this.socket = new WebSocket(`${prot}://${host}/chess-timer?id=${this.ID}`);
        this.socket.parent = this;
        this.socket.onopen = function() {
        };
        this.socket.onmessage = function(event) {
            let jobj = JSON.parse(event.data);
            console.log(jobj);
            if(jobj.id === "Status") {
                let GAME_INFO = {};
                GAME_INFO.WhiteTime = jobj.content.wt;
                GAME_INFO.BlackTime = jobj.content.bt;

                if(GAME_INFO.WhiteTime < 0)
                    GAME_INFO.WhiteTime = 0;
                if(GAME_INFO.BlackTime < 0)
                    GAME_INFO.BlackTime = 0;
                GAME_INFO.Paused = jobj.content.paused;
                GAME_INFO.HalfMoves = jobj.content.hmvs;
                GAME_INFO.Side = jobj.content.side;
                GAME_INFO.Ended = jobj.content.end ?? false;
                GAME_INFO.White = jobj.content.wn;
                GAME_INFO.Black = jobj.content.bn;
                this.CanChange = jobj.content.change ?? this.CanChange;
                this.parent.onUpdate(GAME_INFO);
            }
        };
    }
    Start() {
        this.Send("Start", null);
    }
    Send(id, data) {
        if(!this.CanChange)
            return;
        let o = {
            id: id,
            t: Date.now(),
            content: data
        };
        this.socket.send(JSON.stringify(o));
    }
    Pause() {
        this.Send("Pause", null);
    }
    Switch() {
        this.Send("Switch", null);
    }
}
const volumeLbl = document.getElementById("volumeLbl");
const volumeSlider = document.getElementById("volumeSlider");
function setVolume(volume, muted) {
    console.log(`setVolume(${volume}, ${muted})`)
    if(muted === undefined) 
        muted = false;
    volumeLbl.innerText = "Volume: " + volume;
    audio.volume = volume;
    if(!muted) {
        forceAudio = true;
        checkAudio();
    }
    setTimeout(function() {
        forceAudio = null;
        if(!muted) {
            forceAudio = null;
            checkAudio();
        }
    }, 3000);
    Cookies.set("volume", volume, { expires: 365 });
}
volumeSlider.oninput = function() {
    volume = parseInt(this.value) / 100;
    setVolume(volume);
}
function orderedInsert(array, element, isBefore) {
    var ind = 0;
    for(let other of array) {
        if(isBefore(other, element) ) {
            ind += 1;
        } else {
            break;
        }
    }
    array.splice(ind, 0, element);
    return array;
}
function pad(str, nfill, chr = '0') {
    str = `${str}`;
    if(str.length > nfill) {
        return str;
    } else {
        return (chr.repeat(nfill - str.length)) + str;
    }
}
function formatTimer(seconds) {
    if(seconds < 0) {
        return "-" + formatTimer(seconds * -1);
    }
    var hours = Math.floor(seconds / 3600);
    if(hours > 0) {
        seconds -= (hours * 3600);
    }
    var minutes = Math.floor(seconds / 60);
    if(minutes > 0) {
        seconds -= (minutes * 60);
    }
    seconds = Math.round(seconds);
    return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
}
const STATE = {
    PENDING: "pending",
    ONGOING: "ongoing",
    COMPLETE: "complete"
};
class Step {
    constructor(text, originalDuration) {
        this.text = text;
        this.duration = originalDuration;
        this.remaining = originalDuration;
        this.state = STATE.PENDING;

        this.actualDelay = null;
        this.startedAt = null;
        this.tentativeStartTime = null;
    }

    static load(obj) {
        var step = new Step(obj.text, obj.duration);
        step.remaining = obj.remain;
        step.state = `${obj.state}`.toLowerCase();
        step.startedAt = obj.startedAt;
        step.tentativeStartTime = obj.tentativeStart;
        return step;
    }

    tick(elapsed) {
        this.remaining -= elapsed;
    }
}
class Recipe {
    constructor(catalyst) {
        this.steps = [];
        this.current = 0;
        this.catalyst = catalyst;
    }
    static load(obj) {
        var recipe = new Recipe(obj.catalyst);
        recipe.current = obj.current;
        for(let ostep of obj.steps) {
            var step = Step.load(ostep);
            recipe.steps.push(step);
        }
        return recipe;
    }
    get workingOn() {
        if(this.current >= this.steps.length) return null;
        return this.steps[this.current];
    }
    get nextUp() {
        var n = this.current + 1;
        if(n >= this.steps.length) return null;
        return this.steps[n];
    }

    withStep(text, duration) {
        var s = new Step(text, duration || 0);
        this.steps.push(s);
        return this;
    }

    _sumLength(original) {
        var sum = 0;
        for(let step of this.steps) {
            if(original) {
                sum += step.duration;
            } else {
                sum += step.remaining;
            }
        }
        return sum;
    }

    sumOriginalLength() {
        return this._sumLength(true);
    }
    sumRemainLength() {
        return this._sumLength(false);
    }
}

function getOrCreate(id, tag, parent) {
    var d = document.getElementById(id);
    if(d) return d;
    d = document.createElement(tag);
    d.id = id;
    parent.appendChild(d);
    return d;
}

class RecipeGroup {
    constructor(initRecipe) {
        if(initRecipe) {
            this.catalyst = initRecipe.catalyst;
            this.recipes = [initRecipe];
        } else {
            this.catalyst = null;
            this.recipes = [];
        }
        this.simpleSteps = [];
        this.delayTime = null;
        
        this.muted = null;
        this.alarm = false;
        this.completedAt = null;
    }

    static load(obj) {
        var group = new RecipeGroup();
        group.catalyst = obj.catalyst;
        group.alarm = obj.alarm;
        if(obj.muted !== undefined) {
            group.muted = obj.muted;
        }
        if(obj.completedAt !== undefined) {
            group.completedAt = obj.completedAt;
        }
        if(obj.recipe) {
            for(let recipe of obj.recipes) {
                var loaded = Recipe.load(recipe);
                group.withRecipe(loaded);
            }
        }
        if(obj.steps) {
            group.simpleSteps = [];
            for(let ostep of obj.steps) {
                var step = Step.load(ostep);
                group.simpleSteps.push(step);
            }
        }
        return group;
    }

    tick(elapsed) {
        for(let step of this.simpleSteps) {
            if(step.state === STATE.ONGOING)
                step.tick(elapsed);
        }
    }

    _sumLength(original) {
        var length = 0;
        for(let step of this.simpleSteps) {
            if(original) {
                length += step.duration;
            } else {
                length += step.remaining;
            }
        }
        return length;
    }
    sumOriginalLength() {
        return this._sumLength(true);
    }
    sumRemainLength() {
        return this._sumLength(false);
    }
    /*flattenForEnd(targetEnd) {
        // e.g. target end is 200 seconds.
        // recipe 
        var simpleSteps = [];
        var lastTime = null;
        for(let recipe of this.recipes) {
            var recipeDelay = targetEnd - recipe.sumRemainLength();
            for(let step of recipe.steps) {
                step.tentativeStartTime = recipeDelay;
                simpleSteps = orderedInsert(simpleSteps, step, (other, inserting) => other.tentativeStartTime < inserting.tentativeStartTime);
                if(step.state != STATE.COMPLETE) {
                    recipeDelay += step.remaining;
                }
                lastTime = step.tentativeStartTime + step.remaining;
            }
        }

        this.simpleSteps = simpleSteps;
        const end = this.simpleSteps.length - 1;
        if(this.simpleSteps[end].duration > 0) {
            var dishStep = new Step("Dish up", 0);
            dishStep.tentativeStartTime = lastTime || 0;
            this.simpleSteps.splice(end + 1, 0, dishStep);
        }
        this.delayTime = this.simpleSteps[0].tentativeStartTime;

        // go through and correct durations
        var nextStart  = null;
        for(let index = this.simpleSteps.length - 1; index >= 0; index--) {
            const step = this.simpleSteps[index];
            if(nextStart) {
                step.duration = nextStart - step.tentativeStartTime;
                step.remaining = step.duration;
            }
            nextStart = step.tentativeStartTime;
        }
    }*/
    withRecipe(recipe) {
        this.recipes.push(recipe);
    }

    getDisplayText() {
        var shownText = null;
        var shownTime = null;
        for(let index = 0; index < this.simpleSteps.length; index++) {
            const step = this.simpleSteps[index];
            if(step.state === STATE.COMPLETE) {
                continue;
            }
            else if(step.state === STATE.ONGOING) {
                var next = this.simpleSteps[index + 1];
                if(next)
                    shownText = next.text;
                else 
                    shownText = "Dish up";
                shownTime = step.remaining;
                break;
            }
            else if(step.state === STATE.PENDING) {
                shownText = step.text;
                if(globalStartedAt) {
                    var diff = (Date.now() - globalStartedAt) / 1000;
                    shownTime = step.tentativeStartTime - diff;
                } else {
                    shownTime = step.tentativeStartTime;
                }
                break;
            }
        }
        if(shownText === null) {
            // all complete
            shownText = "Complete";
            shownTime = 0;
            if(this.completedAt == null) {
                console.log("Setting all complete since all steps done:", this.simpleSteps);
                this.completedAt = Date.now();
            }
        }
        if(this.muted) {
            shownText = "(M) " + shownText;
        }
        return {
            text: shownText,
            time: shownTime
        };
    }

    getCompletedDiffTime() {
        var sum = 0;
        for(let step of this.simpleSteps) {
            sum += step.remaining;
        }
        return sum;
    }

    toHTML(isSelected, parent) {
        const CAT = this.catalyst.replace(' ', '-');
        const ID = `timer-${CAT}`;                    
        const DATA = this.getDisplayText();
        const shownText = DATA.text;
        const shownTime = DATA.time;
        var mainDiv = getOrCreate(ID, "div", parent);
        mainDiv.classList.add("group");
        mainDiv.classList.add(CAT);
        const _this = this;

        mainDiv.onclick = function() {
            if(_this.muted) {
                _this.onAdvance();
            } else {
                _this.onMute();
            }
        };
        if(isSelected) {
            mainDiv.classList.add("selected");
        } else {
            mainDiv.classList.remove("selected");
        }
        var text = getOrCreate(ID + "-text", "h2", mainDiv);
        text.innerText = shownText;
        var timer = getOrCreate(ID + "-time", "h1", mainDiv);
        if(this.completedAt) {
            mainDiv.classList.add("complete");
            mainDiv.classList.remove("alarm", "notice");
            var diffFromTarget = this.getCompletedDiffTime();
            if(diffFromTarget < 0) {
                timer.innerText = "over +" + formatTimer(diffFromTarget) + "+";
            } else {
                timer.innerText = "under " + formatTimer(diffFromTarget) + "-";
            }
        } else {
            mainDiv.classList.remove("complete");
            if(shownTime < 3) {
                mainDiv.classList.add("alarm");
                mainDiv.classList.remove("notice");
                this.alarm = true;
                if(this.muted === null) {
                    this.muted = false;
                }
                checkAudio();
            } else if (shownTime < 30) {
                mainDiv.classList.remove("alarm");
                mainDiv.classList.add("notice");
            } else {
                mainDiv.classList.remove("alarm", "notice");
            }
            timer.innerText = formatTimer(shownTime);
        }
        return mainDiv;
    }

    onMute() {
        const data = this.getDisplayText();
        console.log("Try", this.catalyst, data);
        if(data.time <= 3) {
            this.muted = true;
            var ws = {};
            sendWs({mute: this.catalyst});
        }
    }
    onAdvance(data = null) {
        if(data === null) {
            data = {};
            data.when = Date.now();
            data.globalStartedAt = globalStartedAt ?? data.when;
            data.ws = true;
        }
        var diff = (Date.now() - data.when) / 1000;
        console.log("Advance catalyst=", this.catalyst, " diff=", diff, data);
        this.muted = null;
        this.alarm = false;
        refreshTableNextTick = true;

        if(globalStartedAt === null) {
            globalStartedAt = data.globalStartedAt;
        }

        for(let index = 0; index < this.simpleSteps.length; index++) {
            const step = this.simpleSteps[index];
            if(step.state === STATE.COMPLETE) continue;
            if(step.state === STATE.PENDING) {
                step.state = STATE.ONGOING;
                this.startedAt = data.when;
                step.tick(diff);
                console.log("Started with", step.text, ", next up is", this.simpleSteps[index + 1]);
                break;
            }
            if(step.state === STATE.ONGOING) {
                step.state = STATE.COMPLETE;
                step.remaining += diff;
                var next = this.simpleSteps[index + 1];
                if(next) {
                    next.state = STATE.ONGOING;
                    console.log("Moving to", next.text, "in", step.duration);
                    if(data.time) {
                        var diff = (Date.now() - parseInt(data.time)) / 1000;
                        console.log("Skipping ", diff, "ms from next");
                        next.tick(diff);
                    }
                    if(next.duration > 0) {
                        break;
                    }
                } else {
                    console.log("Finished group with final", step.text);
                    this.completedAt = data.time;
                }
            }
        }
        if(!data.ws) return;
        sendWs({
            advance: {
                catalyst: this.catalyst,
                globalStartedAt: globalStartedAt,
                when: data.when,
            }
        });
    }
}

const RECIPE_ID = new URLSearchParams(window.location.search).get("id");
var globalStartedAt = null;
var recipeGroups = null; //groupRecipes(recipes);
var catalystOrder = [];
var selected = null;
var lastTick = null;
var refreshTableNextTick = false;
var audio = new Audio("../_/assets/alarm.mp3");
var intervalId = null;
var forceAudio = null;

function wsOpen(e) {
    //console.log("[WS/Open] ", e);
}
function wsMessage(e) {
    //console.log("[WS/Msg] ", e);

    const jobj = JSON.parse(e.data);
    console.log("[WS/JSON]", jobj);
    if(recipeGroups === null && jobj.recipe) {
        recipeGroups = {};
        if(jobj.startedAt) {
            globalStartedAt = parseInt(jobj.startedAt);
        }
        for(let key in jobj.recipe) {
            const value = jobj.recipe[key];
            var group = RecipeGroup.load(value);
            recipeGroups[key] = group;
        }
        console.log("Set groups:", recipeGroups);
        init();
    } else if(jobj.data) {
        const data = jobj.data;
        refreshTableNextTick = true;
        if(data.mute) {
            var group = recipeGroups[data.mute];
            if(group) {
                group.muted = true;
            }
        } else if(data.advance) {
            const payload = data.advance;
            var {catalyst, ...rest} = payload;
            var group = recipeGroups[catalyst];
            group.onAdvance(rest);
        }
    }
}
function wsClose(e) {
    //console.warn("[WS/Close] ", e);
}
function wsError(e) {
    //console.error("[WS/Err] ", e);
}

function sendWs(data) {
    const packet = {
        data: data
    }
    WSC.send(JSON.stringify(packet));
}

WSC.initWS(`food?id=${RECIPE_ID}`, 0, wsMessage, wsClose, null, wsError, wsOpen);



function groupRecipes(recipes) {
    var groups = {};
    for(let recipe of recipes) {
        var existing = groups[recipe.catalyst];
        if(existing) {
            existing.withRecipe(recipe);
        } else {
            groups[recipe.catalyst] = new RecipeGroup(recipe);
        }
    }
    return groups;
}

function setAudio(v, reason) {
    try {
        if(v && audio.paused) {
            console.debug("[audio/play]", reason)
            audio.play().catch(function(err) {});
        }
        else if(!v && !audio.paused) {
            console.debug("[audio/pause]", reason)   
            audio.pause();
        }
    } catch {}
}

var forceAudio = null;
function checkAudio() {
    if(forceAudio !== null) {
        setAudio(forceAudio, "force audio");
        return;
    }
    if(globalStartedAt == null) {
        setAudio(false, "not yet started");
        return;
    }
    var anyAlarm = false;
    var allMuted = true;
    for(let catalyst of catalystOrder) {
        const group = recipeGroups[catalyst];
        if(group.alarm) {
            anyAlarm = true;
            if(!group.muted) {
                allMuted = false;
            }
        }
    }
    if(anyAlarm && !allMuted) {
        setAudio(true, "active group");
    } else {
        setAudio(false, `no active group (${forceAudio})`);
    }
}

function init() {
    /*var longest = 0;
    for(let catalyst in recipeGroups) {
        catalystOrder.push(catalyst);
        var group = recipeGroups[catalyst];
        var length = group.sumRemainLength();
        if(length > longest) {
            longest = length;
        }
    }*/
    for(let catalyst in recipeGroups) {
        catalystOrder.push(catalyst);
        var group = recipeGroups[catalyst];
        //group.flattenForEnd(longest);
        if(selected === null && group.delayTime === 0) {
            selected = catalyst;
        }
    }
    refreshHtml(true);

    lastTick = window.performance.now() / 1000;
    intervalId = setInterval(globalTick, 50);
}

class Row {
    constructor(initStep, catalyst) {
        this.time = initStep.tentativeStartTime;
        this.steps = [];
        for(let other of catalystOrder) {
            if(other === catalyst) {
                this.steps.push(initStep);
            } else {
                this.steps.push(null);
            }
        }
    }
    tryAdd(step, catalystIndex) {
        var diff = Math.abs(this.time - step.tentativeStartTime);
        if(diff <= 1) {
            this.steps[catalystIndex] = step;
            return true;
        }
        return false;
    }
    toHTML() {
        var tr = document.createElement("tr");

        var tdTime = document.createElement("td");
        tdTime.innerText = formatTimer(this.time);
        tr.appendChild(tdTime);

        var numNulls = 0;
        for(let step of this.steps) {
            if(step === null) {
                numNulls += 1;
                continue;
            }
            if(numNulls > 0) {
                var nltd = document.createElement("td");
                nltd.colSpan = numNulls;
                tr.appendChild(nltd);
                numNulls = 0;
            }
            var td = document.createElement("td");
            if(step.state === STATE.PENDING) {
                td.innerText = step.text;
            } else {
                var st = document.createElement("del");
                st.innerText = step.text;
                td.appendChild(st);
            }
            tr.appendChild(td);
        }
        if(numNulls > 0) {
            var nltd = document.createElement("td");
            nltd.colSpan = numNulls;
            tr.appendChild(nltd);
        }
        return tr;
    }
}

function generateTable() {
    var rows = [];
    var catIndex = 0;
    for(let catalyst of catalystOrder) {
        const group = recipeGroups[catalyst];
        for(let step of group.simpleSteps) {
            var done = false;
            for(var row of rows) {
                if(row.tryAdd(step, catIndex)) {
                    done = true;
                    break;
                }
            }
            if(done) continue;

            var newRow = new Row(step, catalyst);
            rows = orderedInsert(rows, newRow, (before, next) => before.time < next.time);
        }
        catIndex += 1;
    }
    var table = document.createElement("table");
    var headTr = document.createElement("tr");
    var timeTh = document.createElement("th");
    timeTh.innerText = "Time";
    headTr.appendChild(timeTh);
    table.appendChild(headTr);
    for(let catalyst of catalystOrder) {
        var th = document.createElement("th");
        th.innerText = catalyst;
        headTr.appendChild(th);
    }
    for(var row of rows) {
        table.appendChild(row.toHTML());
    }
    return table;
}

function refreshHtml(updateTable) {
    var container = document.getElementById("container");
    var widthPerc = (1 / catalystOrder.length) * 100;
    for(let catalyst of catalystOrder) {
        const group = recipeGroups[catalyst];
        var div = group.toHTML(group.catalyst === selected, container);
        div.style.flex = `${widthPerc}%`;
    }

    if(globalStartedAt) {
        var startDiff = Math.round((Date.now() - globalStartedAt) / 1000);
        document.getElementById("startTimer").innerText = formatTimer(startDiff);
    } else {
        document.getElementById("startTimer").innerText = "n.y.s";
    }

    if(!updateTable) return;
    var table = document.getElementById("tableContainer");
    table.innerHTML = "";
    table.appendChild(generateTable());
    checkAudio();
}

//init(recipeGroups);


function globalTick() {
    var nextTick = window.performance.now() / 1000;
    var tickDelta = nextTick - lastTick;
    lastTick = nextTick;

    var allcomplete = true;
    for(let catalyst of catalystOrder) {
        const group = recipeGroups[catalyst];
        group.tick(tickDelta);
        if(group.completedAt == null) {
            allcomplete = false;
        }
    }
    if(allcomplete) {
        console.log("All", catalystOrder.length,"groups are complete!");
        clearInterval(intervalId);
        audio.pause();
        WSC.send(JSON.stringify({"done": "done"}));
    }


    refreshHtml(refreshTableNextTick);
    refreshTableNextTick = false;
}

document.body.onkeyup = function(event) {
    if(event.key === "Enter") {
        const group = recipeGroups[selected];
        if(group) {
            if(group.muted) {
                group.onAdvance();
            } else {
                group.onMute();
            }
        }
        checkAudio();
        event.preventDefault();
        return false;
    } else if(event.key === "Tab" || event.key === "t" || event.key === "T") {
        var found = false;
        var curIndex = catalystOrder.indexOf(selected);
        if(curIndex === -1) curIndex = 0;
        if(event.shiftKey) {
            curIndex -= 1;
        } else {
            curIndex += 1;
        }
        if(curIndex >= catalystOrder.length)
            curIndex = 0;
        if(curIndex < 0)
            curIndex = catalystOrder.length - 1;
        selected = catalystOrder[curIndex];
    } else if(event.key === "ArrowRight") {
        var time = 1;
        if(event.ctrlKey) {
            time = 10;
        }
        if(event.shiftKey) {
            time *= 6;
        }
        console.log("Skipping", time);

        for(let catalyst of catalystOrder) {
            const group = recipeGroups[catalyst];
            group.tick(time);
        }
        globalStartedAt -= (time * 1000);
    }
}
var maybeVolume = Cookies.get("volume");
if(maybeVolume) {
    volumeSlider.value = parseFloat(maybeVolume) * 100;
    setVolume(parseFloat(maybeVolume), true);
}
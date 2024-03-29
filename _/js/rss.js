const MARK_READ = "/_/img/mark_read.svg";
const MARK_UNREAD = "/_/img/unread.png";
const MARK_IMPORTANT = "/_/img/warning.png";
const FEEDS = [];
var ARTICLES = [];

const SCRIPT_PARSE = "function parse(";
const SCRIPT_FILTER = "function checkFilter(";

var ACTIVE_FEED = null;
var SEARCH_INPUT = document.getElementById("search");

function getInput(type, name, value, label = null) {
    var inpt = document.createElement("input");
    inpt.classList.add("main");
    inpt.type = type;
    inpt.id = name;
    inpt.name = name;
    inpt.value = value;
    if(label) {
        var div = document.createElement("div");
        div.classList.add("input-group");
        var lbl = document.createElement("label");
        lbl.innerText = label;
        lbl.for = name;
        div.appendChild(lbl);
        div.appendChild(inpt);
        return div;
    }
    return inpt;
}
function getButton(value, onclick = null) {
    var inpt = document.createElement("input");
    inpt.type = onclick == null ? "submit" : "button";
    inpt.value = value;
    if(onclick) inpt.onclick = onclick;
    return inpt;
}

function setModal(content) {
    console.log("Setting modal:", content);
    var modal = document.getElementById("modal");
    modal.classList.toggle("hidden", content == null);
    var modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = "";
    if(content) {
        modalContent.appendChild(content);
    }
}

class RssFeed {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.nextCheck = new Date(data.nextCheck);
        this.interval = data.interval;
        this.parser = data.parser;
        this.filters = data.filters;
        this.unread = data.unread;
        this.url = data.url;

        this._elements = null;
        this._hover = false;
    }
    createSidebar() {
        var div = document.createElement("div");
        var title = document.createElement("span");
        div.appendChild(title);
        const feed = this;
        var editButton = getButton("E", async function(event) {
            event.stopImmediatePropagation();
            setModal(await feed.toEditModal());
        });
        var syncButton = getButton("R", async function(event) {
            event.stopImmediatePropagation();
            var refilter = event.shiftKey ? "?refilter=true" : "";
            await fetch(`/api/rss/refresh/${feed.id}${refilter}`, {
                method: "POST"
            });
            window.location.reload();
        })
        div.appendChild(syncButton);
        div.appendChild(editButton);

        div.onclick = function() {
            const beforeFeed = ACTIVE_FEED;
            SEARCH_INPUT.value = "";
            showArticlesFor(feed.id, 0, newTableInsert);
            feed.refresh();
            if(beforeFeed) beforeFeed.refresh();
        }
        div.onpointerenter = function() {
            feed._hover = true;
            feed.refresh();
        }
        div.onpointerleave = function() {
            feed._hover = false;
            feed.refresh();
        }

        this._elements = {div, title, editButton, syncButton};
        return this._elements;
    }
    updateSidebar() {
        const {div, title, editButton, syncButton} = this._elements;
        div.classList.toggle("sidefeed", true);
        div.classList.toggle("active", ACTIVE_FEED && ACTIVE_FEED.id === this.id)
        title.classList.toggle("title", true);
        title.innerText = this.name;
        div.classList.toggle("unread", this.unread > 0);
        if(this.unread > 0) {
            title.innerText += ` (${this.unread})`
        }
        editButton.classList.toggle("edit", true);
        editButton.classList.toggle("hidden", !this._hover);
        syncButton.classList.toggle("sync", true);
        syncButton.classList.toggle("hidden", !this._hover);
    }

    async toEditModal() {
        var form = document.createElement("form");
        form.action = "/api/rss/feeds";
        form.method = "post";
        var idInput = getInput("number", "id", this.id, "Id");
        if(this.id === 0) {
            idInput.hidden = true;
        }
        form.appendChild(idInput);
        form.appendChild(getInput("text", "name", this.name, "Name"));
        var urlDiv = getInput("url", "url", this.url, "URL")
        urlDiv.appendChild(getButton("Test", function() {
            testUrl(form);
        }))
        form.appendChild(urlDiv);

        form.appendChild(getInput("number", "interval", this.interval || 720, "Interval (mins)"));
        form.appendChild(await getScriptSelect("parser", this.parser == null ? [] : [this.parser], false, "Parser", SCRIPT_PARSE));
        form.appendChild(await getScriptSelect("filters", this.filters, true, "Filters", SCRIPT_FILTER));

        const feed = this;
        form.appendChild(getButton("Submit"))
        form.appendChild(getButton("Delete", async function() {
            if(confirm("Are you sure you want to delete this feed?")) {
                await fetch(`/api/rss/feed/${feed.id}`, {method: "DELETE"});
                window.location.reload();
            }
        }))
        return form;
    }

    refresh() {
        this.updateSidebar();
    }
}

function toTimeSpan(diff) {
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -=  days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);
    return {
        days, hours, mins, seconds, milliseconds: diff
    };
}
function addPlural(array, value, singular, plural = null) {
    if(value == 0) return;
    plural = plural ?? (singular + "s");
    array.push(`${value}`);
    if(value == 1 || value == 11) array.push(singular)
    else array.push(plural);
}
function getDateString(number) {
    var now = new Date();
    var date = new Date(number);

    var diff = now - date;
    var future = false;
    if(diff < 0) {
        future = true;
        diff = diff * -1;
    }
    
    const {days, hours, mins, seconds} = toTimeSpan(diff);
    var words = [];
    addPlural(words, days, "day");
    if(days < 2) {
        addPlural(words, hours, "hour");
        if(days == 0 && hours < 2) {
            addPlural(words, mins, "minute");
            if(hours == 0 && mins < 2) {
                addPlural(words, seconds, "second");
            }
        }
    }
    if(words.length == 0) return "-";
    return (future ? "in " : "") + words.join(" ") + (future ? "" : " ago");
}

class RssArticle {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.url = data.url;
        this.author = data.author;
        this.read = data.read;
        this.important = data.important;
        this.feed = data.feed;
        this.seenDate = parseInt(data.seenDate);
        this.pubDate = parseInt(data.pubDate);


        this._row = null;
    }

    async updateAndRefresh(obj) {
        var result = await updateArticle(this.id, obj);
        if(result) {
            var changed = {};
            for(let key in obj) {
                if(this[key] != obj[key]) {
                    changed[key] = obj[key];
                    this[key] = obj[key];
                }
            }
            var oldRow = this._row;
            var parent = this._row.parentElement;
            var newRow = this.toRow();
            parent.insertBefore(newRow, oldRow);
            parent.removeChild(oldRow);
            console.log(obj);
            var readChange = changed["read"];
            if(readChange !== undefined) {
                const feed = FEEDS.find(f => f.id == this.feed);
                feed.unread += readChange ? -1 : 1;
                feed.refresh();
            }
        }
    }

    getActionButton(icon, property, value) {
        var img = document.createElement("img");
        img.classList.add("action");
        img.src = icon;
        img.width = "16";
        const article = this;
        img.onclick = async function() {
            var o = {};
            o[property] = value;
            await article.updateAndRefresh(o);
        }
        return img;
    }


    toRow() {
        var tr = document.createElement("tr");
        this._row = tr;
        tr.classList.add(this.read ? "read" : "unread")
        if(this.important && !this.read) {
            tr.classList.add("important");
        }

        var actionsTd = document.createElement("td");
        actionsTd.appendChild(this.getActionButton(this.read ? MARK_UNREAD : MARK_READ, "read", !this.read));
        if(this.important) {
            actionsTd.appendChild(this.getActionButton(MARK_IMPORTANT, "important", !this.important));
        }
        tr.appendChild(actionsTd);

        //var idTd = document.createElement("td");
        //idTd.innerText = this.id;
        //tr.appendChild(idTd);

        var titleTd = document.createElement("td");
        var anchor = document.createElement("a");
        anchor.href = this.url;
        anchor.innerText = this.title;
        const article = this;
        anchor.onclick = function() {
            article.updateAndRefresh({read: true});
        }
        anchor.onauxclick = function() {
            article.updateAndRefresh({read: true});
        }
        titleTd.appendChild(anchor);
        if(this.author) {
            titleTd.appendChild(document.createElement("br"));
            var authorSpan = document.createElement("span");
            authorSpan.innerText = this.author;
            authorSpan.classList.add("author");
            titleTd.appendChild(authorSpan);
        }
        tr.appendChild(titleTd);

        var seenTd = document.createElement("td");
        seenTd.innerText = getDateString(this.seenDate);
        tr.appendChild(seenTd);

        var pubTd = document.createElement("td");
        pubTd.innerText = getDateString(this.pubDate);
        tr.appendChild(pubTd);

        return tr;
    }
}

async function updateArticle(articleId, properties) {
    var result = await fetch(`/api/rss/article/${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify(properties)
    });
    return result.ok;
}

function newTableInsert(TABLE, feedId, page, articles) {
    TABLE.innerHTML = "";
    for (let art of articles) {
        TABLE.appendChild(art.toRow());
    }
    
    let deleteRow = document.createElement("tr");
    let deleteCell = document.createElement("td");
    deleteCell.colSpan = 4;
    deleteRow.appendChild(deleteCell);
    let btn = document.createElement("button");
    btn.innerText = "Load more articles";
    btn.style.width = "100%";
    btn.setAttribute("data-feed", feedId);
    btn.setAttribute("data-page", page + 1);
    btn.onclick = showMoreArticles;
    deleteCell.appendChild(btn);

    TABLE.appendChild(deleteRow);
}   
function appendBeforeLoadMoreBtn(TABLE, feedId, page, articles) {
    let lastRow = TABLE.children[TABLE.children.length - 1];
    for(let art of articles) {
        TABLE.insertBefore(art.toRow(), lastRow);
    }
    let b = lastRow.querySelector("button");
    b.setAttribute("data-page", page + 1);
}

async function showMoreArticles(event) {
    let btn = event.target;
    let feedId = parseInt(btn.getAttribute("data-feed"), 10);
    let page = parseInt(btn.getAttribute("data-page"), 10);
    await showArticlesFor(feedId, page, appendBeforeLoadMoreBtn, SEARCH_INPUT.value);
}
async function showArticlesFor(feedId, page, addFunction, search) {
    const feed = FEEDS.find(x => x.id == feedId);
    history.replaceState(null, null, `#${feedId}`)
    ACTIVE_FEED = feed;
    var url = `/api/rss/articles/${feedId}?page=${encodeURIComponent(page)}`
    if (search) {
        url += "&search=" + encodeURIComponent(search);
    }
    var data = await fetch(url);
    var array = await data.json();
    console.log(array);
    const TABLE = document.getElementById("articles");

    if (page === 0) {
        ARTICLES = [];
    }
    let newArticlesOnly = [];
    for(let json of array) {
        var art = new RssArticle(json);
        ARTICLES.push(art);
        newArticlesOnly.push(art);
    }
    addFunction(TABLE, feedId, page, newArticlesOnly);
}

async function loadFeeds() {
    const url = `/api/rss/feeds`;
    var data = await fetch(url);
    var array = await data.json();
    var div = document.getElementById("feeds");

    const allFeed = {id: 0, name: "[All]"}
    array = [allFeed, ...array];
    console.log("Feeds:", array);

    for(let x of array) {
        var feed = new RssFeed(x);
        FEEDS.push(feed);
        var {div: sb} = feed.createSidebar();
        feed.updateSidebar();
        console.log("Add:", sb);
        div.appendChild(sb);
    }
}

function getElementById(element, id) {
    if(element.id === id) return element;
    for(let child of element.childNodes) {
        if(child.id === id) return child;
        var found = getElementById(child, id);
        if(found) return found;
    }
    return null;
}

async function testUrl(form) {
    var data = new FormData(form);
    const url = data.get("url");
    const result = await fetch("/api/rss/test", {
        method: "POST",
        body: JSON.stringify({url})
    });
    var back = await result.json();
    for(let key in back) {
        const value = back[key];
        var input = getElementById(form, key);
        input.value = value;
    }
}

function createRow(type, ...items) {
    console.log(type, items);
    var row = document.createElement("tr");
    for(let item of items) {
        var cell = document.createElement(type);
        if(typeof(item) ==="object") {
            cell.appendChild(item);
        } else {
            cell.innerText = `${item}`;
        }
        row.appendChild(cell);
    }
    return row;
}

var SCRIPTS = null;

async function getScriptSelect(name, existing, multiple, label = null, mustContain = null) {
    var select = document.createElement("select");
    select.name = name;
    select.multiple = !!multiple;
    for(let script of (await getScripts(false))) {
        if(script.id === 0) continue;
        if(mustContain) {
            if(script.code.indexOf(mustContain) === -1) continue;
        }
        var option = document.createElement("option");
        option.value = script.id;
        option.innerText = script.name;
        if(existing && existing.some(i => i == script.id)) {
            option.selected = true;
        }
        select.appendChild(option);
    }
    if(label) {
        var lbl = document.createElement("label");
        lbl.for = name;
        lbl.innerText = label;
        var div = document.createElement("div");
        div.classList.add("input-group");
        div.appendChild(lbl);
        div.appendChild(select);
        return div;
    }
    return select;
}

async function saveScript(id) {
    var script = SCRIPTS.find(s => s.id === id);
    var response = await fetch("/api/rss/scripts", {
        method: "POST",
        body: JSON.stringify(script)
    });
    if(response.ok) {
        window.location.reload();
    }
}

async function onScriptChange(event) {
    var element = event.currentTarget || event.target;
    var id = parseInt(element.getAttribute("data-id"));
    const script = SCRIPTS.find(s => s.id === id);
    script[element.name] = element.value;
}

async function onSaveScript(event) {
    var element = event.currentTarget || event.target;
    var id = parseInt(element.getAttribute("data-id"));
    const script = SCRIPTS.find(s => s.id === id);

    var response = await fetch("/api/rss/scripts", {
        method: "POST",
        body: JSON.stringify(script)
    });
    if(response.ok) window.location.reload();
}

async function getScripts(force = false) {
    if(force || SCRIPTS === null) {
        SCRIPTS = await (await fetch("/api/rss/scripts")).json();
        SCRIPTS.push({id: 0, name: "[Add]", code: "function checkFilter(){\r\n    // Code here\r\n}"})
    }
    return SCRIPTS;
}

function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

async function showScripts() {
    var table = document.createElement("table");
    table.appendChild(createRow("th", "Id", "Name", "Code", "Delete"));

    for(let script of await getScripts(true)) {
        const _aa = script;
        var btn = getButton(script.id === 0 ? "Add" : (`Save: ${script.id}`), onSaveScript);
        btn.setAttribute("data-id", script.id);

        var name = getInput("text", "name", script.name);
        name.setAttribute("data-id", script.id);
        name.onchange = onScriptChange;

        var pre = document.createElement("pre");
        var code = document.createElement("code");
        pre.appendChild(code);
        code.setAttribute("data-id", script.id);
        //code.classList.add("language-javascript");
        code.name = "code";
        const highlighted = hljs.highlight(script.code, {language: "javascript", ignoreIllegals: true});
        code.innerHTML = highlighted.value;
        code.contentEditable = true;
        code.onblur = (ev) => {
            console.log("Focus out:", ev);
            var script = SCRIPTS.find(s => s.id == parseInt(ev.currentTarget.getAttribute("data-id")));
            script.code = ev.currentTarget.innerText;
            const highlighted = hljs.highlight(script.code, {language: "javascript", ignoreIllegals: true});
            ev.currentTarget.innerHTML = highlighted.value;
        }
        code.onkeydown = (ev) => {
            if(ev.keyCode == 9) {
                document.execCommand("insertHTML", false, '  ');
                ev.preventDefault();
            }
        }
        console.log("CODE:", code.innerHTML);
        //hljs.highlightElement(code);

        
        var delBtn = getButton("Delete", async function() {
            if(confirm("Are you sure you want to delete this script?")) {
                var resp = await fetch(`/api/rss/script/${_aa.id}`, {method: "DELETE"});
                console.log(resp, await resp.text());
                window.location.reload();
            }
        });

        table.appendChild(createRow("td", btn, name, pre, delBtn));
    }

    var div = document.createElement("div");
    div.appendChild(table);

    setModal(div);
}

function modalAreaClick(event) {
    if(event.target === event.currentTarget) {
        setModal(null);
    }
}

async function markAllRead() {
    var unread = ARTICLES.filter(a => a.read === false).map(s => s.id);
    var args = {};
    unread.forEach(f => args[f] = {read: true});
    var result = await fetch(`/api/rss/articles`, {
        method: 'PATCH',
        body: JSON.stringify(args)
    });
    if(result.ok) {
        window.location.reload();
    }
}

async function searchInput() {
    const feedId = !!ACTIVE_FEED ? ACTIVE_FEED.id : null;
    await showArticlesFor(feedId, 0, newTableInsert, SEARCH_INPUT.value);
}



async function init() {
    await loadFeeds();
    var id = undefined;
    var hash = window.location.hash;
    if(hash && hash[0] == '#') hash = hash.substring(1);
    try {
        id = parseInt(hash, 10);
    } catch {
    }
    if(id) {
        await showArticlesFor(id, 0, newTableInsert);
    }
}

document.getElementById("imgMarkAllRead").onclick = markAllRead;
document.getElementById("imgShowsScripts").onclick = showScripts;
document.getElementById("modal").onclick = modalAreaClick;
document.getElementById("btnCloseModal").onclick = () => setModal(null);
document.getElementById("search").oninput = searchInput;

init();
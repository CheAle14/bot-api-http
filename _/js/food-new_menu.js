function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
const idempotent = getRandomInt(65565);
const htmlTable = document.getElementById("table");
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PRODUCT_CACHE = {};
const MODIFYING = new URLSearchParams(window.location.search).get("overwrite");

function createElementWithText(tagName, text) {
    var el = document.createElement(tagName);
    el.innerText = text;
    return el;
}
function createOptionWithArgs(text, selected) {
    var o = createElementWithText("option", text);
    o.selected = selected;
    return o;
}
function createHoverDeleteText(text) {
    var span = document.createElement("span");
    span.classList.add("dangerhover");
    span.innerText = text;
    return span;
}
function getProductInfo(id) {
    id = id.replace(" ", "");
    var data = PRODUCT_CACHE[id];
    if(data === null) {
        return createHoverDeleteText(`~${id}~`)
    }
    if(data) {
        return createHoverDeleteText(data.name);
    } else {
        fetch(`/api/food/product?query=${id}`).then(function(resp) {
            if(resp.ok) {
                resp.json().then(function (arr) {
                    var prod = arr[0];
                    if(prod === undefined) {
                        PRODUCT_CACHE[id] = null;
                    } else {
                        PRODUCT_CACHE[id] = arr[0];
                    }
                    refreshHtml();
                })
            } else {
                PRODUCT_CACHE[id] = null;
            }
        }).catch(function(err) {
            PRODUCT_CACHE[id] = null;
            console.error(id, err);
        })
        return createHoverDeleteText(id);
    }
}

function createManySpans(...args) {
    var root = document.createElement("span");
    for(const text of args) {
        if(typeof text === "string") {
            root.appendChild(createElementWithText("span", text));
        } else {
            root.appendChild(text);
        }
    }
    return root;
}

class MenuDayItem {
    constructor(day, grp) {
        this._parent = day;
        this._group = grp;
        this.type = "";
        this.value = null;
        this.uses = 1;
    }

    load(data) {
        this.type = data.type;
        this.value = data.value;
        this.uses = data.uses;
    }


    toHtml(index) {
        const _this = this;
        var div = document.createElement("div");
        div.style.border = "1px solid blue";
        div.style.margin = "1px 1px 1px 1px";
        
        var typeSelect = document.createElement("select");
        typeSelect.appendChild(createOptionWithArgs("", this.type === ""));
        typeSelect.appendChild(createOptionWithArgs("Id", this.type === "id"));
        typeSelect.appendChild(createOptionWithArgs("Tag", this.type === "tag"));

        typeSelect.onchange = function(e) {
            if(typeSelect.value) {
                _this.type = typeSelect.value.toLowerCase();
                if(_this.type === "id" || _this.type === "tag")
                    _this.value = [];

                refreshHtml();
            }
        }

        div.appendChild(typeSelect);
        div.appendChild(createElementWithText("br"));

        if(this.type === "id" || this.type === "tag") {
            if(this.value.length > 0) {
                var t = [this.type === "id" ? "Products " : "Tags "];
                for(let ind in this.value) {
                    const x = this.value[ind];
                    var span = this.type === "id" ? getProductInfo(x) : createHoverDeleteText(x);
                    span.onclick = function(e) {
                        _this.value.splice(ind, 1);
                        console.log(e);
                        refreshHtml();
                    }
                    t.push(span);
                    t.push(" or ");
                }

                div.appendChild(createManySpans(...t));
            }


            var addI = document.createElement("input");
            addI.type = "button";
            addI.value = "+";
            addI.onclick = function() {
                var x = prompt("Enter " + (_this.type === "id" ? "ID" : "Tag"));
                _this.value.push(x);
                refreshHtml();
            }
            div.appendChild(addI);
        } 

        var countInput = document.createElement("input");
        countInput.type = "number";
        countInput.placeholder = "Uses";
        countInput.value = this.uses;
        countInput.onchange = function(event) {
            _this.uses = event.target.value;
            refreshHtml();
        }
        div.appendChild(countInput);

        var remI = document.createElement("input");
        remI.type = "button";
        remI.value = "-";
        remI.classList.add("danger");
        remI.onclick = function() {
            _this._parent.removeItem(_this._group, index);
            refreshHtml();
        }
        div.appendChild(remI);

        return div;
    }
}

class MenuDay {
    constructor(i) {
        this._index = i;
        this.text = {};
        this.items = {};
    }

    load(data) {
        console.log("day: ", data);
        this.text = data.text;
        for(let key in data.items) {
            var _new = [];
            var ls = data.items[key];
            for(let itemData of ls) {
                var item = new MenuDayItem(this, key);
                item.load(itemData);
                _new.push(item);
            }
            this.items[key] = _new;
        }
    }

    getGroups() {
        var ls = Object.keys(this.items);
        for(let key in this.text) {
            if(ls.indexOf(key) === -1)
                ls.push(key);
        }
        return ls;
    }

    addItem(group) {
        var ls = this.items[group];
        if(!ls) {
            ls = [];
        }
        var newItem = new MenuDayItem(this, group, ls.length)
        ls.push(newItem);

        this.items[group] = ls;
    }
    removeItem(group, index) {
        this.items[group].splice(index, 1);
    }

    toHtml(dayRow, groups) {
        const _this = this;



        var mergedItem = this.items["*"];
        console.log(mergedItem);
        if(mergedItem) {
            var mergedCell = document.createElement("td");
            mergedCell.style.paddingLeft = "15px";
            mergedCell.style.borderLeft = "4px solid black";
            mergedCell.colSpan = MENU.getGroups().length;

            
            let index = 0;
            for(let item of mergedItem) {
                mergedCell.appendChild(item.toHtml(index++));
            }

            var textI = document.createElement("input");
            textI.type = "text";
            textI.placeholder = "Display text";
            textI.value = this.text["*"] || "";
            textI.onchange = function(event) {
                _this.text["*"] = event.target.value;
                console.log(event, _this);
            }
            mergedCell.appendChild(textI);

            var addI = document.createElement("input");
            addI.type = "button";
            addI.value = "Add";
            addI.onclick = function() {
                _this.addItem("*");
                console.log(_this, "*");
                refreshHtml();
            }
            mergedCell.appendChild(addI);

            dayRow.appendChild(mergedCell);
        } else {
            var addedI = false;
            for(let group of groups) {
                var groupCell = document.createElement("td");

                
                var textI = document.createElement("input");
                textI.type = "text";
                textI.placeholder = "Display text";
                textI.value = this.text[group] || "";
                textI.onchange = function(event) {
                    _this.text[group] = event.target.value;
                    console.log(event, _this);
                }
                groupCell.appendChild(textI);

                let index = 0;
                var children = this.items[group];
                if(children) {
                    for(let item of this.items[group]) {
                        groupCell.appendChild(item.toHtml(index++));
                    }
                }

                var addI = document.createElement("input");
                addI.type = "button";
                addI.value = "Add";
                addI.onclick = function() {
                    _this.addItem(group);
                    console.log(_this, group);
                    refreshHtml();
                }
                groupCell.appendChild(addI);

                dayRow.appendChild(groupCell);
            }
        }
        if(mergedItem || groups.length > 1) {
            var mergeC = document.createElement("input");
            mergeC.type = "checkbox";
            mergeC.value = "M";
            mergeC.checked = mergedItem !== undefined;
            mergeC.style.right = "8px";
            mergeC.style.position = "fixed";
            mergeC.onclick = function(e) {
                _this.text = {};
                if(e.target.checked) {
                    _this.items = {};
                    _this.items["*"] = [];
                } else {
                    _this.items = {};
                    for(let group of MENU.getGroups()) {
                        _this.items[group] = [];
                    }
                }
                console.log("mergeC", _this);
                refreshHtml();
            }
            dayRow.appendChild(mergeC);
        }
    }
}

class Menu {
    constructor() {
        this.title = "";
        this.days = [];
        for(let i = 0; i < 7; i++)
            this.days.push(new MenuDay(i));
    }

    getGroups() {
        var groups = [];
        for(const day of this.days) {
            var grps = day.getGroups();
            for(const maybe of grps) {
                if(maybe === "*") continue;
                if(groups.indexOf(maybe) === -1) {
                    groups.push(maybe);
                }
            }
        }
        return groups;
    }

    load(data) {
        this.title = data.title;
        for(var i = 0; i < 7; i++) {
            this.days[i].load(data.days[i]);
        }
    }

    addGroup(name) {
        for(const day of this.days) {
            day.items[name] = [];
        }
    }

    toHtml(table) {
        console.log(this);
        var headerRow = document.createElement("tr");
        headerRow.appendChild(createElementWithText("th", "Day"));
        var groups = this.getGroups();
        for(let group of groups) {
            headerRow.appendChild(createElementWithText("th", group));
        }
        table.appendChild(headerRow);

        for(let day of this.days) {
            var dayRow = document.createElement("tr");
            dayRow.appendChild(createElementWithText("td", DAY_NAMES[day._index]));

            day.toHtml(dayRow, groups);

            table.appendChild(dayRow);
        }
    }
}

var MENU = new Menu();
function refreshHtml() {
    htmlTable.innerHTML = "";

    MENU.toHtml(htmlTable);

}

function addNewGroup() {
    var name = prompt("Enter new group name");
    if(name) {
        MENU.addGroup(name);
    }

    refreshHtml();
}
function updateTitle(e) {
    MENU.title = e.target.value;
    console.log("updateTitle", MENU, e);
}

function replacer(k, v) {
    if(k.startsWith("_")) return undefined;
    return v;
}

function shiftHandler(event) {
    shift = event.shiftKey;
    document.body.className = shift ? 'shift-pressed' : '';
};
document.body.onkeyup = shiftHandler;

function submit() {
    var url = "/api/food/menus";
    if(MODIFYING) {
        url += "?modify=" + MODIFYING;
    }
    fetch(url, {
        method: 'POST',
        headers: {"X-Idempotency": idempotent, "Content-Type": "application/json"},
        body: JSON.stringify(MENU, replacer)
    }).then(function(response) {
        console.log(response);
        response.text().then(function(body) {
            if(response.ok) {
                window.location = "/food/menu";
            } else {
                console.log(body);
                alert(response.status);
            }
        });
    }).catch(function(err) {
        console.log(err);
    })
}
function init() {
    if(MODIFYING) {
        console.log("Fetching menu ", MODIFYING);
        fetch(`/api/food/menu?id=${MODIFYING}`)
        .then(function(resp) {
            if(resp.ok) {
                resp.json().then(function(body) {
                    console.log(MENU, body, MENU.title, MENU.getGroups());
                    try {
                        MENU.load(body);
                    } catch(err) {
                        console.error(err);
                        console.log(MENU);
                        return;
                    }
                    console.log(MENU);
                    refreshHtml();
                });
            } else {
                alert(resp.status)
            }
        })




    } else {
        refreshHtml();
    }
}
document.getElementById("title").onchange = updateTitle;
document.getElementById("newGroup").onclick = addNewGroup;
document.getElementById("submit").onclick = submit;
init();
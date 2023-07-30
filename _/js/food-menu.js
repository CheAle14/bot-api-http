const EDITING = !!document.getElementById("edit");
const searchResults = document.getElementById("searchResults");
document.getElementById("editThings").style.display = (!!EDITING) ? "" : "none";
function selectMenu(id) {
    if(!EDITING) return;
    fetch(`/api/food/menu?id=${id}`, {
        method: "POST"
    })
    .then(function(resp) {
        if(resp.ok) {
            window.location.reload();
        } else {
            alert("Failed!");
        }
    }).catch(function(err) {
        console.error(err);
    })
}
function formatDate(date) {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options);
}
function getExistingItems() {
    var items = document.getElementsByClassName("item");
    var ls = {};
    for(var item of items) {
        var id = item.getAttribute("data-id");
        var itemls = ls[id] ?? [];
        itemls.push(item);
        ls[id] = itemls;
    }
    return ls;
}

function getDateForRow(element) {
    if(typeof(element) === "string") {
        return parseInt(element.split('-')[1], 10);
    } else {
        const split = element.id.split('-');
        if(split[0] === "day") {
            return parseInt(split[1], 10);
        }
        return getDateForRow(element.parentElement);
    }
}

function getTodaysDate() {
    return getDateForRow(document.getElementsByClassName("today-row")[0]);
}

function searchItems(event) {
    if(!EDITING) return;
    fetch(`/api/food/query`, {
        method: "POST",
        body: `query=${encodeURIComponent(event.target.value)}&sort=expires`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
    .then(function(resp) {
        resp.json().then(function(value) {
            console.log(value);

            var existingItems = getExistingItems();
            console.log(existingItems);

            searchResults.innerHTML = "";
            const today = getTodaysDate();
            var now = new Date();
            for(let item of value) {
                var existing = existingItems[item.id];
                console.log(item.id, existing);

                var div = document.createElement("li");
                if(existing) {
                    div.classList.add("already-exists");
                }
                div.id = item.id + "-n";
                var date = new Date(item.expires);
                if(date < now) {
                    div.classList.add("expired");
                }
                var t = "";
                if(item.max_uses > 1) {
                    var alreadyUsing = item.times_used ?? 0;
                    if(existing) {
                        alreadyUsing += existing.filter(i => getDateForRow(i) >= getTodaysDate())
                                                .map(i => parseInt(i.getAttribute("data-uses"), 10))
                                                .reduce((sofar, next) => sofar + next, 0);
                    }
                    var rem = item.max_uses - alreadyUsing;
                    t += `${rem}x `;
                }
                if(item.manu) {
                    t += `(${item.manu}) `;
                }
                div.innerText = t + `${item.name} expires ${formatDate(date)}`;
                div.setAttribute("draggable", "true");
                div.setAttribute("data-id", item.id);
                div.ondragstart = onDragStart;
                searchResults.appendChild(div);
            }
        })
    }).catch(function(err) {
        console.error(err);
    })
}

function onDragStart(event) {
    if(!EDITING) return;
    console.log(event);
    event.dataTransfer.setData("text", event.target.id);
}
function onDragOver(event) {
    if(!EDITING) return;
    if(event.target.tagName === "TR") {
        console.log(event);
    } else {
        event.preventDefault();
    }
}
function toggleShare(event) {
    if(!EDITING) return;
    var td = event.target.parentElement;
    var tr = td.parentElement;
    fetch(`/api/food/menu/shared?day=${tr.id.split('-')[1]}`, {
        method: "POST"
    })
    .then(function(resp) {
        if(resp.ok) {
            window.location.reload();
        } else {
            alert("Failed!");
        }
    }).catch(function(err) {
        console.error(err);
    })
}
function togglemanual(event) {
    if(!EDITING) return;
    var td = event.target.parentElement;
    var tr = td.parentElement;
    fetch(`/api/food/menu/manual?day=${tr.id.split('-')[1]}&manual=${event.target.checked}`, {
        method: "PATCH"
    })
    .then(function(resp) {
        if(resp.ok) {
            window.location.reload();
        } else {
            alert("Failed!");
        }
    }).catch(function(err) {
        console.error(err);
    })
}
function setText(event) {
    if(!EDITING) return;
    if(event.altKey) {
        var td = event.currentTarget;
        var tr = td.parentElement;
        var group = td.getAttribute("data-group");
        var text = prompt("What text to set, or 'none' to remove", td.innerText);
        if(text) {
            fetch(`/api/food/menu/text?day=${encodeURIComponent(tr.id.split('-')[1])}&group=${encodeURIComponent(group)}&text=${encodeURIComponent(text)}`, {
                method: "PATCH"
            })
            .then(function(resp) {
                if(resp.ok) {
                    window.location.reload();
                } else {
                    alert("Failed!");
                }
            }).catch(function(err) {
                console.error(err);
            })
        }
    }
}
function getTd(elem) {
    if(elem === null) return null;
    if(elem.tagName === "TD") return elem;
    return getTd(elem.parentElement);
}

function onItemClick(event)  {
    if(!EDITING) return;
    console.log(event);
    var thing = getTd(event.target);
    var curTarget = event.currentTarget;
    if(event.ctrlKey) {
        var uses = parseInt(prompt("How many uses?", curTarget.getAttribute("data-uses")));
        fetch(`/api/food/menu/item?day=${thing.getAttribute("data-date")}&group=${thing.getAttribute("data-group")}&id=${curTarget.getAttribute("data-id")}&uses=${uses}`, {
            method: "PATCH"
        })
        .then(function(resp) {
            if(resp.ok) {
                window.location.reload();
            }
        }).catch(function(err) {
            console.error(err);
        })

    } else if(event.shiftKey) {
        fetch(`/api/food/menu/item?day=${thing.getAttribute("data-date")}&group=${thing.getAttribute("data-group")}&id=${curTarget.getAttribute("data-id")}`, {
            method: "DELETE"
        })
        .then(function(resp) {
            if(resp.ok) {
                curTarget.parentElement.removeChild(curTarget);
            } else {
                alert("Failed!");
            }
        }).catch(function(err) {
            console.error(err);
        })
    }
}

function onDrop(event) {
    if(!EDITING) return;
    const data = event.dataTransfer.getData("text");
    const fromElem = document.getElementById(data);
    const toElem = getTd(event.target);
    console.log(fromElem, "->", toElem);
    var fromGroup = fromElem.parentElement.getAttribute("data-group");
    var fromDay = fromElem.parentElement.getAttribute("data-date");
    var toGroup = toElem.getAttribute("data-group");
    var toDay = toElem.getAttribute("data-date");

    const evData = {
        "toDay": toDay,
        "toGroup": toGroup,
        "id": fromElem.getAttribute("data-id"),
        "uses": 1
    };
    if(fromGroup) {
        evData.fromGroup = fromGroup;
    } else {
        evData.uses = parseInt(prompt("How many uses will this use?", "1"));
    }
    if(fromDay)
        evData.fromDay = fromDay;

    console.log(evData);
    
    fetch(`/api/food/menu/move`, {
        method: "POST",
        body: JSON.stringify(evData),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(function(resp) {
        if(resp.ok) {
            toElem.appendChild(fromElem);
        } else {
            resp.body().then(function(err) {
                alert(err);
            })
        }
    }).catch(function(err) {
        console.error(err);
    })
}

document.getElementById("search").onchange = searchItems;
for(var el of document.getElementsByClassName("cbManual")) {
    el.onclick = togglemanual;
}
for(var el of document.getElementsByClassName("drag-over")) {
    el.ondragover = onDragOver;
    el.ondrop = onDrop;
    el.onclick = setText;
}
for(var el of document.getElementsByClassName("drag-start")) {
    el.ondragstart = onDragStart;
    el.onclick = onItemClick;
}
for(var el of document.getElementsByClassName("cbToggleShare")) {
    if(EDITING) {
        el.onclick = toggleShare;
    } else {
        el.setAttribute("disabled", "");
    }
}
var sMenu = document.getElementById("selectMenu");
if(sMenu) {
    sMenu.onclick = function(event) {
        selectMenu(event.target.getAttribute("title"));
    }
}
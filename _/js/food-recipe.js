function cbToggled(e) {
    console.log(e);
    var id = e.target.id;
    var inp = document.getElementById("delay-" + id);
    inp.classList.toggle("hidden", !e.target.checked);
}

function containsFilter(td, str) {
    if(td.innerText.toLowerCase().indexOf(str) !== -1) return true;

    var unorderedList = td.children[0];
    for(let listItem of unorderedList.children) {
        var attr = listItem.getAttribute("data-id");
        if(attr.toLowerCase() == str) return true;
    }
    return false;
}

function setFilter(event) {
    console.log("Setting filter");
    var filter = event.target.value;
    if(filter) filter = filter.toLowerCase();
    const rows = document.getElementsByTagName("tr");

    for(let row of rows) {
        const firstCell = row.children[0];
        if(firstCell.tagName === "TD") {
            row.classList.toggle("hidden", !containsFilter(firstCell, filter));
        }
    }
}

function startRecipe() {
    var doing = {};
    var selects = document.getElementsByClassName("recipe-selects");
    for(let x of selects) {
        if(x.checked) {
            var offset = document.getElementById("delay-" + x.id);
            console.log(x, offset);
            doing[parseInt(x.id)] = parseInt(offset.value || 0);
        }
    }
    console.log(doing);

    fetch(`/api/food/recipes`, {
        method: 'PUT',
        body: JSON.stringify(doing)
    }).then(function(resp) {
        console.log(resp);
        if(resp.ok) {
            resp.text().then(function(t) {
                window.location = `/food/ongoing-recipe?id=${t}`;
            })
        }
    }).catch(function(err) {
        console.log(err);
    })
}
function deleteRecipe(event) {
    var x = prompt("Are you sure you want to delete this? Type yes to continue", "")
    if(x !== "yes")
        return;
    fetch(`/api/food/recipe?id=${event.target.getAttribute("data-id")}`, {method: "DELETE"}).then(function(resp) {
        console.log(resp);
        if(resp.ok) {
            window.location.reload();
        } else {
            console.error(resp);
        }
    }).catch(function(err) {
        console.error(err);
    })
}
function editRecipe(event) {
    window.location.href = "/food/add-recipe?modifyId=" + encodeURIComponent(event.target.getAttribute("data-id"));
}
function init() {
    WSC.initWS(`food-scan`, 5, function(msg) {
        const data = JSON.parse(msg.data);
        if(data.code) {
            const inp = document.getElementById("inFilter");
            inp.value = data.code;
            console.log("Set to", data.code);
            inp.dispatchEvent(new Event("change"));
        }
    }, null, function(e) {
        // reconnect limit reached
        window.location.reload();
    });
}
document.getElementById("inFilter").onchange = setFilter;
document.getElementById("btnStart").onclick = startRecipe;
for(var el of document.getElementsByClassName("recipe-selects")) {
    el.onclick = cbToggled;
}
for(var el of document.getElementsByClassName("edit-recipe")) {
    el.onclick = editRecipe;
}
for(var el of document.getElementsByClassName("delete-recipe")) {
    el.onclick = deleteRecipe;
}
init();
var textarea = document.getElementById("text");
var temptext = document.getElementById("template");
var textname = document.getElementById("name");
function getId() {
    var id = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
    if(id === "new") return "00000000-0000-0000-0000-000000000000";
    return id;
}
function dirty(event) {
    var text = event.srcElement;
    text.classList.add("dirty");
}
async function load() {
    const ID = getId();
    var response = await fetch(`/api/filters/${ID}`);
    var body = await response.json();
    if(!response.ok) {
        console.error("Error: ", response, body);
        textarea.value = ":Error: " + body;
    } else {
        textarea.value = body.text;
        temptext.value = body.template;
        textname.value = body.name;
    }

}
async function addnew() {
    var template = temptext.value;
    var url = prompt("Enter URL:");
    if(url) {
        var date = new Date().toISOString()
        textarea.value += "\r\n\r\n" + String.format(template, date, url) + "\r\n";
        await save();
    }
}
async function save() {
    var data = {};
    data["name"] = textname.value;
    data["text"] = textarea.value;
    data["template"] = temptext.value;
    
    const ID = getId();
    var response = await fetch(`/api/filters/${ID}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
    if(response.ok) {
        temptext.classList.remove("dirty");
        textarea.classList.remove("dirty");
        textname.classList.remove("dirty");

        var id = await response.text();
        if(id != ID) {
            window.location.href = `/filters/${id}`;
        }
    }
}
async function del() {
    if(confirm("Are you sure you wish to delete?")) {
        var response = await fetch("/api/filters/" + getId(), {
            method: "DELETE"
        });
        if(response.redirected) {
            window.location.href = response.url;
        }
    }
}
async function cpy(asScript) {
    var name = window.location.href.replace('/filters/', '/filters-raw/');
    if(asScript) {
        name += "?script.user.js"
    }
    await navigator.clipboard.writeText(name);
}
document.getElementById("btnSave").onclick = save;
document.getElementById("btnAdd").onclick = addnew;
document.getElementById("btnDelete").onclick = del;
document.getElementById("btnCopy").onclick = async () => await cpy(false);
document.getElementById("btnCopyAsScript").onclick = async () => await cpy(true);
for(let el of document.getElementsByClassName("dirtyable")) {
    el.addEventListener("keyup", dirty);
}

load();
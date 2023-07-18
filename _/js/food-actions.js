function removeInvItem(event) {
    const invId = event.target.getAttribute("data-id");
    const shouldUse = event.target.innerText == "Use";
    var uses = 99;
    if(shouldUse) {
        var test = parseInt(prompt(`Please enter uses for this item`, 1), 10);
        if(isNaN(test)) {
            alert("Number was not an integer. you fail");
            return;
        }
        uses = test;
    }
    fetch(`/api/food/inventory?invId=${invId}&uses=${uses}`, {
        method: "DELETE"
    }).then(function(r) {
        if(r.ok) {
            window.location.reload();
        } else {
            console.error(r);
            alert("Failed.");
        }
    }).catch(function(x) {
        console.error(x);
        alert("Errored.");
    })
}
function toggleFrozen(event) {
    const invId = event.target.getAttribute("data-id");
    const isFrozen = event.target.value == "Unfreeze";
    console.log(event.target, event.target.value, isFrozen);
    console.log(invId);
    fetch(`/api/food/inventory?invId=${invId}&frozen=${!isFrozen}`, {
        method: "PATCH"
    }).then(function(r) {
        if(r.ok) {
            window.location.reload();
        } else {
            console.error(r);
            alert("Failed.");
        }
    }).catch(function(x) {
        console.error(x);
        alert("Errored.");
    })
}

for(var el of document.getElementsByClassName("remove-item")) {
    el.addEventListener("click", removeInvItem);
}
for(var el of document.getElementsByClassName("freeze-item")) {
    el.addEventListener("click", toggleFrozen);
}
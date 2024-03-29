const dates = {
    last: null,
    next: null
}
function dateChanged(event) {
    console.log(event);
    const v = event.target.value;
    if(event.target.id === "lastShop") {
        dates.last = v;
    } else {
        dates.next = v;
    }
    if(dates.last !== null && dates.next !== null) {
        fetch(`/api/food/future?date=${dates.next}&prev=${dates.last}`).then(function(resp) {
            console.log(resp);
            resp.json().then(function(body) {
                console.log(body);

                setExpiring(body.expiring);
                setPredicted(body.products, body.predicted);
                setRemoved(body.products, body.recent);
            })
        }).catch(function(err) {
            console.error(err);
        });
    }
}

function createNode(tag, inner) {
    var node = document.createElement(tag);
    node.innerHTML = inner;
    return node;
}

function createNodeSafe(tag, text) {
    var node = document.createElement(tag);
    node.innerText = text;
    return node;
}

function createTd(value) {
    return createNode("td", value);
}

function setExpiring(items) {
    const table = document.getElementById("expiring");
    table.innerHTML = "";
    const headerRow = createNode("tr", "");
    headerRow.appendChild(createNode("th", "Item"));
    headerRow.appendChild(createNode("th", "Expires At"));
    table.appendChild(headerRow);

    for(let item of items) {
        const itemRow = createNode("tr", "");
        itemRow.appendChild(createNodeSafe("td", item.name))
        const dt = new Date(item.expires);
        itemRow.appendChild(createNodeSafe("td", dt.toDateString()));

        table.appendChild(itemRow);
    }

}

function msToString(ms) {
    seconds = ms / 1000;
    if(seconds < 60) return `${seconds} seconds`;
    minutes = seconds / 60;
    if(minutes < 60) return `${minutes} minutes`;
    hours = minutes / 60;
    if(hours < 24) return `${hours} hours`;
    days = hours / 24;
    if(days < 7) return `${days} days`;
    weeks = days / 7;
    return `${weeks} weeks`;
}

function setPredicted(products, predicted) {
    const table = document.getElementById("predicted");
    table.innerHTML = "";

    const headerRow = createNode("tr", "");
    headerRow.appendChild(createNode("th", "Item or Group"));
    headerRow.appendChild(createNode("th", "Added per week"));
    headerRow.appendChild(createNode("th", "Removed per week"));
    headerRow.appendChild(createNode("th", "Avg time between adds"));
    headerRow.appendChild(createNode("th", "Avg time between removes"));
    headerRow.appendChild(createNode("th", "Average lifetime"));
    headerRow.appendChild(createNode("th", "Est. Needed"));
    
    table.appendChild(headerRow);

    for(let tagName in predicted.tags) {
        const row = createNode("tr", "");
        const data = predicted.tags[tagName];
        row.appendChild(createNode("td", `<strong>${tagName}</strong>`));
        row.appendChild(createNode("td", data.add));
        row.appendChild(createNode("td", data.rem));
        row.appendChild(createNode("td", msToString(data.avgAdd)));
        row.appendChild(createNode("td", msToString(data.avgRem)));
        row.appendChild(createNode("td", msToString(data.avgLifetime)));
        row.appendChild(createNode("td", data.estimation));
        table.appendChild(row);
    }

    for(let prodId in predicted.products) {
        const product = products[prodId];
        console.log(product);
        
        const row = createNode("tr", "");
        const data = predicted.products[prodId];
        row.appendChild(createNodeSafe("td", `${product.name}`));
        row.appendChild(createNode("td", data.add));
        row.appendChild(createNode("td", data.rem));
        row.appendChild(createNode("td", msToString(data.avgAdd)));
        row.appendChild(createNode("td", msToString(data.avgRem)));
        row.appendChild(createNode("td", msToString(data.avgLifetime)));
        row.appendChild(createNode("td", data.estimation));
        table.appendChild(row);
    }
}

function setRemoved(products, items) {
    const table = document.getElementById("removed");
    table.innerHTML = "";
    const headerRow = createNode("tr", "");
    headerRow.appendChild(createNode("th", "Item"));
    headerRow.appendChild(createNode("th", "Removed At"));
    table.appendChild(headerRow);

    for(let itemId in items) {
        const item = items[itemId];
        const itemRow = createNode("tr", "");
        itemRow.appendChild(createNodeSafe("td", item.name))
        const dt = new Date(item.removed);
        itemRow.appendChild(createNodeSafe("td", dt.toDateString()));

        table.appendChild(itemRow);
    }
}

document.getElementById("lastShop").onchange = dateChanged;
document.getElementById("nextShop").onchange = dateChanged;
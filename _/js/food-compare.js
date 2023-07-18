const STRINGS = {
    "weight": ["g", "gram"],
    "uses": [" uses", "use"]
}
class Item {
    constructor(name, pence = null, weight = null, uses = null) {
        this.name = name;
        this.pence = pence;
        this.weight = weight;
        this.uses = uses;
    }
    getRankedDisplay(rank) {
        var span = document.createElement("div");
        span.innerText = "#" + rank;
        span.className = "rank rank-" + rank;
        return span;
    }
    getInput(v, dataFor) {
        var inp = document.createElement("input");
        inp.type = "number";
        inp.value = v;
        inp.setAttribute("data-item", this.name);
        inp.setAttribute("data-for", dataFor);
        inp.onchange = function(event) {
            var _i = event.currentTarget;
            var name = _i.getAttribute("data-item");
            var fr = _i.getAttribute("data-for");
            console.log(_i);
            for(let item of ITEMS) {
                if(item.name === name) {
                    item[fr] = _i.value;
                    break;
                }
            }
            refreshTable();
        }
        return inp; 
    }
    getLabel(text) { 
        var lbl = document.createElement("label");
        lbl.innerText = text;
        return lbl;
    }
    getRoundedLabel(value, text) {
        var val = `${Math.round((value + Number.EPSILON) * 100) / 100}`;
        return this.getLabel(`${val}${text}`);
    }
    toHTML(ourRankings) {
        var row = document.createElement("tr");
        
        var nameTd = document.createElement("td");
        row.appendChild(nameTd);
        nameTd.appendChild(this.getLabel(this.name));

        var penceTd=  document.createElement("td");
        row.appendChild(penceTd);
        penceTd.appendChild(this.getInput(this.pence, "pence"));
        penceTd.appendChild(this.getLabel("p"));

        for(let value of COMPARE) {
            var td = document.createElement("td");
            row.appendChild(td);
            td.appendChild(this.getInput(this[value], value));
            td.appendChild(this.getLabel("g"));
            td.appendChild(document.createElement("br"));
            var normal = this[value + "PerPence"];
            if(normal) {
                var div = document.createElement("div");
                div.className = "container";
                div.appendChild(this.getRankedDisplay(ourRankings[value]));
                var span = document.createElement("div");
                span.className = "column right";
                span.appendChild(this.getRoundedLabel(normal, `${STRINGS[value][0]} per pence.`));
                span.appendChild(document.createElement("br"));
                span.appendChild(this.getRoundedLabel(1/normal, ` pence per ${STRINGS[value][1]}.`));
                div.appendChild(span);
                td.appendChild(div);
            }
        }

        return row;
    }
    get weightPerPence() {
        if(!this.weight || !this.pence) return null;
        return this.weight / this.pence;
    }
    get usesPerPence() {
        if(!this.uses || !this.pence) return null;
        return this.uses / this.pence;
    }
}
class ValuePair {
    constructor(value, item) {
        this.value = value;
        this.item = item;
    }
}
const ITEMS = [
    //new Item("Bold", 1200, 2000, 30),
    //new Item("Surf", 1450, 1800, 35)
];
const PENCE_FOR = 1;
var COMPARE = ["weight"];
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
function getRankings() {
    var results = {}; // {'name': {'value': [rank]}}

    var tracking = {};
    for(let value of COMPARE)
        tracking[value] = [];
    
    for(let item of ITEMS) {
        results[item.name] = {};
        // e.g. item.pence = 100; item.weight = 200; item.uses = 50
        // 1pence gives: 2g       (200 / 100)
        // 1pence gives: 0.5 uses (50/100)

        // e.g. another item.pence = 75; item.weight=150; item.uses=50
        // 1pence gives: 2g    (150 / 75)
        // 1pence gives: 0.666 (50/75)
        for(let value of COMPARE) {
            var normalised = item[value + "PerPence"];
            if(normalised) {
                normalised = normalised * PENCE_FOR;
                var pair = new ValuePair(normalised, item);
                tracking[value] = orderedInsert(tracking[value], pair, function(other, el) {
                    return other.value > el.value;
                });
            }
        }
    }
    for(let value of COMPARE) {
        let index = 1;
        for(let itemPair of tracking[value]) {
            results[itemPair.item.name][value] = index++;
        }
    }
    console.log(results);
    return results;
}

function refreshTable() {
    var table = document.getElementById("data");
    var s = "<tr><th>Product</th><th>Price</th>";
    for(let value of COMPARE) {
        s += `<th>${value[0].toUpperCase() + value.substring(1)}</th>`
    }
    table.innerHTML = s;
    var rankings = getRankings();
    for(let item of ITEMS) {
        console.log(item);
        table.children[0].appendChild(item.toHTML(rankings[item.name]));
    }
}
const alphabet = ["A", "B", "C", "D", "E", "F", "G"]
function addNew() {
    var df = null;
    if(ITEMS.length < alphabet.length) {
        df = alphabet[ITEMS.length];
    } else {
        df = ITEMS.length.toString();
    }
    var name = prompt("Item name", df);
    var pence = prompt("Item price, either £x or raw pence");
    if(pence[0] === "£") {
        pence = parseInt(pence.substring(1)) * 100;
    }
    var weight = null;
    if(COMPARE.indexOf("weight") >= 0)
        weight = prompt("Item weight in grams");
    var uses = null;
    if(COMPARE.indexOf("uses") >= 0)
        uses = prompt("Number of uses");
    var item = new Item(name, pence, weight, uses);
    ITEMS.push(item);
    refreshTable();
}
function changeCompare(event) {
    var sel = event.currentTarget;
    COMPARE = sel.value.split(',');
    refreshTable();
}
document.getElementById("addNew").onclick = addNew;
document.getElementById("selectComparison").onchange = changeCompare;
refreshTable();
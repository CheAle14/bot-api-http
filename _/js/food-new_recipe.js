function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
const ulIngredients = document.getElementById("ingredients");
const ulSteps = document.getElementById("steps");
const ulChildren = document.getElementById("children");
const rTitle = document.getElementById("title");
const rCatalyst = document.getElementById("catalyst");
const rOrder = document.getElementById("rootOrder");
const disableValue = 123765;
const idempotent = getRandomInt(65565);
const MODIFYING = new URLSearchParams(window.location.search).get("modifyId");

function getSpanText(txt) {
    var s = document.createElement("span");
    s.innerText = txt;
    return s;
}

class Ingredient {
    constructor() {
        this.id = null;
        this.unitsUsed = 1;
        this.frozen = false;
    }

    toHTML() {
        const _this = this;
        var li = document.createElement("li");
        li.id = "ingredient-" + this._index;

        var inpt = document.createElement("input");
        inpt.type = "text";
        inpt.placeholder = "Product ID";
        inpt.onchange = function(e) {
            _this.id = inpt.value;
            this.style.backgroundColor = (!!inpt.value) ? "" : "red";
            console.log(_this);
        }
        inpt.value = this.id;

        li.appendChild(inpt);

        li.appendChild(getSpanText(", used: "));

        var units = document.createElement("input");
        units.type = "number";
        units.placeholder = "units used";
        units.value = this.unitsUsed;
        units.onchange = function() {
            _this.unitsUsed = units.value;
            this.style.backgroundColor = (this.value !== null && this.value > 0) ? "" : "red";
            console.log(_this);
        }
        li.appendChild(units);

        li.appendChild(getSpanText(", from frozen: "));
        var frozen = document.createElement("input");
        frozen.type = "checkbox"
        frozen.checked = this.frozen;
        frozen.onclick = function() {
            _this.frozen = frozen.checked;
        };
        li.appendChild(frozen);

        return li;
    }
}
class Step {
    constructor() {
        this.description = null;
        this.duration = null;
        this.delay = null;
        this.parent = null;
        this.order = false;
    }
    addChild(step) {
        if(this.children === undefined || this.children === null) {
            this.children = [];
        }
        step._index = this.children.length;
        step.parent = this;
        this.duration = disableValue;
        this.delay = disableValue;
        this.children.push(step);
    }
    removeChild(step) {
        var ind = this.children.indexOf(step);
        console.log("(remove)", step, ind);
        if(ind >= 0) {
            this.children.splice(ind, 1);
        }
        if(this.children.length === 0) {
            this.duration = null;
            this.delay = null;
            this.children = undefined;
        }
    }

    toHTML() {
        const _this = this;
        var li = document.createElement("li");
        li.id = "step-" + this._index;

        var inD = document.createElement("input");
        inD.type = "text";
        inD.value = this.description;
        inD.onchange = function(e) {
            _this.description = inD.value;
            this.style.backgroundColor = (!!this.value) ? "" : "red";
            console.log(_this);
        }
        li.appendChild(inD);


        li.appendChild(getSpanText(", taking "))

        var inL = document.createElement("input");
        inL.type = "number";
        inL.value = this.duration;
        inL.placeholder = "duration (s)";
        inL.onchange = function(ein) {
            _this.duration = inL.value;
            this.style.backgroundColor = (this.value !== null && this.value >= 0) ? "" : "red";
            console.log(_this);
        }
        if(this.duration == disableValue) {
            inL.value = null;
            inL.placeholder = "disabled: has children";
            inL.setAttribute("readonly", "");
        }
        li.appendChild(inL);

        li.appendChild(getSpanText("; after "));
        var del = document.createElement("input");
        del.type = "number";
        del.value = this.delay;
        del.placeholder = "delay (s)";
        del.onchange = function() {
            _this.delay = del.value;
            this.style.backgroundColor = (this.value !== null && this.value >= 0) ? "" : "red";
            console.log(_this);
        }
        if(this.delay == disableValue) {
            del.value = null;
            del.placeholder = "disabled: has children";
            del.setAttribute("readonly", "");
        }
        li.appendChild(del);

        var addC = document.createElement("input");
        addC.type = "button";
        addC.value = "+";
        addC.onclick = function() {
            var newStep = new Step(null, null, null);
            _this.addChild(newStep);
            console.log(_this);
            refreshHtml();
        }
        li.appendChild(addC);
        var remC = document.createElement("input");
        remC.type = "button";
        remC.value = "-";
        remC.onclick = function() {
            if(_this.parent) {
                _this.parent.removeChild(_this);
                console.log("(parent)", _this.parent);
            } else {
                MAKING.removeStep(_this);
                console.log("(making)", MAKING);
            }
            refreshHtml();
        }
        li.appendChild(remC);


        if(this.children !== undefined) {
            var selOrder = document.createElement("input");
            selOrder.type = "checkbox";
            selOrder.checked = _this.order;
            selOrder.onclick = function() {
                _this.order = selOrder.checked;
                refreshHtml();
            }
            li.appendChild(selOrder);

            li.appendChild(getSpanText("  Sub-steps: "))
            var inner = document.createElement(_this.order ? "ol" : "ul");
            for(var k of this.children) {
                inner.appendChild(k.toHTML());
            }
            li.appendChild(inner);
        }

        return li;
    }
}

class Child {
    constructor() {
        this.id = null;
        this.offset = 0;
    }
    toHTML (){
        const _this = this;
        var li = document.createElement("li");
        li.id = "ingredient-" + this._index;

        var inpt = document.createElement("input");
        inpt.type = "text";
        inpt.placeholder = "Recipe ID";
        inpt.onchange = function(e) {
            _this.id = inpt.value;
            this.style.backgroundColor = (!!inpt.value) ? "" : "red";
        }
        inpt.value = this.id;

        li.appendChild(inpt);
        li.appendChild(getSpanText(", offset: "));

        var offsetInp = document.createElement("input");
        offsetInp.type = "number";
        offsetInp.placeholder = "(seconds)";
        offsetInp.value = this.offset;
        offsetInp.onchange = function() {
            _this.offset = offsetInp.value;
            this.style.backgroundColor = (this.value !== null && this.value > 0) ? "" : "red";
            console.log(_this);
        }
        li.appendChild(offsetInp);
        return li;
    }
}
class Recipe {
    constructor() {
        this.ingredients = [];
        this.steps = [];
        this.order = false;
        this.title = null;
        this.catalyst = null;
        this.children = [];
    }

    addIngredient(ingred) {
        ingred._index = this.ingredients.length;
        this.ingredients.push(ingred);
    }
    addStep(step) {
        step._index = this.steps.length;
        this.steps.push(step);
    }
    addChild(child) {
        child._index = this.children.length;
        this.children.push(child);
    }
    removeStep(step) {
        var ind = this.steps.indexOf(step);
        console.log("(remove)", step, ind);
        if(ind >= 0) {
            this.steps.splice(ind, 1);
        }
    }

    toHTML() {
        rTitle.value = this.title;
        rCatalyst.value = this.catalyst;
        rOrder.checked = this.order;

        ulIngredients.innerHTML = "";
        for(var k of this.ingredients) {
            ulIngredients.appendChild(k.toHTML());
        }

        ulSteps.innerHTML = "";
        for(var k of this.steps) {
            ulSteps.appendChild(k.toHTML());
        }

        ulChildren.innerHTML = "";
        for(var k of this.children) {
            ulChildren.appendChild(k.toHTML());
        }
    }

    load(obj) {
        this.title = obj.title;
        this.catalyst = obj.catalyst;
        this.order = obj.order;

        for(let i of obj.ingredients) {
            var newI = new Ingredient();
            newI.id = i.id;
            newI.frozen = i.frozen;
            newI.unitsUsed = i.unitsUsed;
            this.addIngredient(newI);
        }
        for(let s of obj.steps) {
            var newS = new Step();
            newS.description = s.description;
            newS.duration = s.duration;
            newS.delay = s.delay;
            newS.order = s.order;
            this.addStep(newS);
        }
        if(obj.children) {
            for(let c of obj.children) {
                var newC = new Child();
                newC.id = c.id;
                newC.offset = c.offset;
                this.addChild(newC);
            }
        }
    }
}
const MAKING = new Recipe();

function updateTitle(event) {
    MAKING.title = event.target.value;
    console.log("updateTitle", MAKING);
}
rTitle.onchange = updateTitle;
function updateCatalyst(event) {
    MAKING.catalyst = event.target.value;
    console.log("updateCatalyst", MAKING);
}
rCatalyst.onchange = updateCatalyst;

function addNewIngredient(optId) {
    var i = new Ingredient();
    if(optId) i.id = optId;
    MAKING.addIngredient(i);

    refreshHtml();
}
document.getElementById("btnNewIngredient").onclick = addNewIngredient;

function addNewChild() {
    var c = new Child();
    MAKING.addChild(c);
    refreshHtml();
}
document.getElementById("btnAddNewChild").onclick = addNewChild;

function addNewStep() {
    var step = new Step();
    MAKING.addStep(step);
    refreshHtml();
}
document.getElementById("btnNewStep").onclick = addNewStep;

function refreshHtml() {
    MAKING.toHTML();
}

function replacer(k, v) {
    if(k === "parent") return undefined;
    if(k === "_index") return undefined;
    if(v === disableValue) return null;
    return v;
}

function submit() {
    var url = "/api/food/recipes";
    if(MODIFYING) {
        url += "?overwrite=" + MODIFYING;
    }
    fetch(url, {
        method: 'POST',
        headers: {"X-Idempotency": idempotent, "Content-Type": "application/json"},
        body: JSON.stringify(MAKING, replacer)
    }).then(function(response) {
        console.log(response);
        response.text().then(function(body) {
            if(response.ok) {
                window.location = "/food/recipes";
            } else {
                console.error(body);
                alert(response.status + ":" + body);
            }
        });
    }).catch(function(err) {
        console.log(err);
    })
}
document.getElementById("btnSubmit").onclick = submit;

function rootOrderChange(event){
    MAKING.order = event.target.checked;
    refreshHtml();
}
rOrder.onclick = rootOrderChange;



function init() {
    if(MODIFYING) {
        console.log("We are modifying recipe of ID ", MODIFYING);
        fetch(`/api/food/recipe?id=${MODIFYING}`).then(function(r) {
            console.log(r);
            r.json().then(function(value) {
                console.log(value);

                MAKING.load(value);
                console.log("After load:", MAKING);
                refreshHtml();


            }).catch(function(err2) {
                console.error(err2);
            });
        }).catch(function(err) {
            console.error(err);
        })
    }


    WSC.initWS(`food-scan`, 5, function(msg) {
        const data = JSON.parse(msg.data);
        if(data.code) {
            console.log("Adding ", data.code);
            addNewIngredient(data.code);
        }
    }, null, function(e) {
       console.error("WS reached reconnect limit.");
    });
}
document.getElementById("title")
init();
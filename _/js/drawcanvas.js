var flag = false,
    x = "black",
    y = 3,
    typing = true,
    dot_flag = false;

var canvases = [];
var pos = {x: 0, y: 0};
function setPosition(e, canvas) {
    pos.x = e.offsetX - canvas.offsetLeft;
    pos.y = e.offsetY - canvas.offsetTop;
}

function initFor(container, canvas) {
    var paint_style = getComputedStyle(container);
    canvases[canvases.length] = {canvas, container}; 
    canvas.width = parseInt(paint_style.getPropertyValue('width'));
    canvas.height = parseInt(paint_style.getPropertyValue('height'));

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e, this)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e, this)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e, this)
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e, this)
    }, false);
}

function init() {
    var containers = document.getElementsByClassName("container");
    for(let container of containers) {
        var qName = container.id.substring("container-".length);
        var id = "canvas-" + qName;
        var canvas = document.getElementById(id);
        initFor(container, canvas);
    }
    
}

function swap(btn) {
    canvases.forEach(element => {
        console.log(element);
        var canvas = element.canvas;
        if(typing) {
            canvas.style.zIndex = "1";
            btn.value = "Type";
        } else {
            canvas.style.zIndex = "-1";
            btn.value = "Draw";
        }
    });
    typing = !typing;
}

function draw(e, canvas, ctx) {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setPosition(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = x;
    ctx.lineWidth = y;
    ctx.stroke();
    ctx.closePath();
}

function findxy(res, e, canvas) {
    var ctx = canvas.getContext("2d");
    if (res == 'down') {
        setPosition(e, canvas);

        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = x;
            ctx.fillRect(pos.x, pos.y, 2, 2);
            ctx.closePath();
            dot_flag = false;
        }
    }
    if (res == 'up' || res == "out") {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            draw(e, canvas, ctx);
        }
    }
}
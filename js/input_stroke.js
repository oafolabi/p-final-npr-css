var gui_size = 400;

var resolution = gui_size;
var unitLength = gui_size;

var input_canvas;
var input_ctx;
var bounds;

var input_array = []
//
// setup canvas
function setup_canvas() {
    input_width = resolution;
    input_height = 100;
    input_canvas = document.getElementById('input_canvas1');
    input_canvas.width = input_width;
    input_canvas.height = input_height;
    input_ctx = input_canvas.getContext("2d");
    bounds = input_canvas.getBoundingClientRect();
    input_canvas.style = "right: 0; display:block; z-index:11; box-shadow: 0px 0px 10px grey;"
    input_canvas.style.width = input_width.toString() + "px";
    input_canvas.style.height = input_height.toString() + "px";
    input_array.push(input_canvas)
}
function new_input() {
    input_width = resolution;
    input_height = 100;
    above_canvas = document.getElementById('input_canvas' + (input_array.length).toString());

    input_canvas = document.createElement("CANVAS");
    input_canvas.id = 'input_canvas' + (input_array.length + 1).toString();
    input_canvas.width = input_width;
    input_canvas.height = input_height;
    input_ctx = input_canvas.getContext("2d");
    bounds = input_canvas.getBoundingClientRect();
    input_canvas.style = "right: 0; display:block; z-index:11; box-shadow: 0px 0px 10px grey;";
    input_canvas.style.top = above_canvas.getBoundingClientRect().bottom.toString() + "px";
    input_canvas.style.width = input_width.toString() + "px";
    input_canvas.style.height = input_height.toString() + "px";
    input_array.push(input_canvas)
}
setup_canvas();
// end setup canvas
//

// reference base path is in the middle of the screen
var basePathY = Math.floor(input_height / 2);

// array holds a single stroke instance
// order acts as time
// !!deprecated
var stroke = [];

// path holds multiple separate strokes
var path = [];
var pathIndex = 0;

// sets whether mouse has been pressed
var mouseDown = false;

var strokeHistory = [];

var prevVertex = {x: -1, y: -1};

function recordVertex(event) {
    console.log(event);
    var offset = event.layerY - basePathY;
    var basePathX = event.layerX;
    var vertex = [basePathX, offset];
    try {
        path[pathIndex].push(vertex);
    }
    catch(err) {
        path.push([vertex]);
    }
    stroke.push(new THREE.Vector2(basePathX, offset));
    mouseDown = true;
    canvasX = event.layerX;
    canvasY = event.layerY;
    thicknessOrder.push(user_lineWidth);
    addLineSegment({x: canvasX, y: canvasY}, user_lineWidth);
}

function addLineSegment(nextVertex, lineWidth) {
    if (prevVertex.x != -1) {
        console.log("draw")
        console.log(nextVertex);
        drawLine(prevVertex, nextVertex, lineWidth);
    }
    console.log(prevVertex);
    strokeHistory.push(prevVertex);
    prevVertex = nextVertex;
    stroke_input = stroke;
}

function drawLine(from, to, lineWidth) {
    input_ctx.lineWidth = lineWidth;
    input_ctx.beginPath();
    input_ctx.moveTo(from.x, from.y);
    input_ctx.lineTo(to.x, to.y);
    input_ctx.stroke();
}

function addPath() {
    mouseDown = false;
    prevVertex.x = -1;
    pathIndex += 1;
}

function rerender() {
    for (var i = 1; i < strokeHistory.length - 1; i += 1) {
        drawLine(strokeHistory[i], strokeHistory[i+1], user_lineWidth);
    }
}

function undo_action() {
    spawn_gui();
    if (path.length < pathIndex + 1) {
        pathIndex -= 1;
    }
    if (path.length > 0 && path[pathIndex].length > 0) {
        path[pathIndex].pop();
        if (path[pathIndex].length == 0) {
            path.pop();
        }
    }
    if (stroke.length > 0) {
        stroke.pop();
        stroke_input.pop();
        rerender();
        prevVertex = strokeHistory.pop();
        thicknessOrder.pop();
    }
    if (stroke.length == 0) {
        reset();
    }
}

// construct window for input gui
function spawn_gui() {
    console.log("spawn");
    input_width = gui_size;
    input_ctx.clearRect(window.innerWidth - bounds.width, 0, bounds.width, window.innerHeight);
    input_canvas.width = input_width;
    input_canvas.height = input_height;
    input_canvas.style.width = input_width.toString() + "px";
    input_canvas.style.height = input_height.toString() + "px";
    // input_ctx.font = "100px Arial";
    // input_ctx.fillStyle = "black";
    // input_ctx.fillText("HELLO WORLD", 10, 100);
    console.log(input_ctx.fillStyle);
    input_ctx.setLineDash([4, 2]);
    input_ctx.strokeStyle = "grey";
    drawLine({x: window.innerWidth - bounds.width, y: basePathY}, {x: window.innerWidth, y: basePathY}, 1);
    input_ctx.setLineDash([]);
    input_ctx.strokeStyle = "black";
}

function reset() {
    console.log("reset");
    resolution = gui_size;
    unitLength = gui_size;
    stroke_input = lowWavyStroke;
    stroke.length = 0;
    path.length = 0;
    pathIndex = 0;
    prevVertex = {x: -1, y: -1};
    strokeHistory.length = 0;
    thicknessOrder.length = 0;
    spawn_gui();
}

// define actions for different key presses
function gui_action(event) {
    switch(event.key) {
        // reset
        case 'r':
            reset();
            break;
        // increase brush width
        case '=':
            user_lineWidth += 1;
            break;
        // decrease brush width
        case '-':
            user_lineWidth -= 1;
            break;
        // undo
        case 'z':
            undo_action();
            break;
        // increase gui size
        case ']':
            gui_size += 100;
            reset();
            break;
        // decrease gui size
        case '[':
            gui_size -= 100;
            reset();
            break;
    }
}

spawn_gui();

// event handlers
input_canvas.onmousedown = recordVertex;
input_canvas.onmousemove = function(event) {
    if (mouseDown) {
        recordVertex(event);
    }
};
input_canvas.onmouseup = addPath;
document.onkeydown = gui_action;
new_input()

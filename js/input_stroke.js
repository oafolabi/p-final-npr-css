//
// setup canvas
var input_canvas = document.createElement('canvas');
input_canvas.width = window.innerWidth;
input_canvas.height = window.innerHeight;
var input_ctx = input_canvas.getContext("2d");
var bounds = input_canvas.getBoundingClientRect();
input_canvas.style = "pointer-events: none; z-index:11"
document.body.appendChild(input_canvas);
// end setup canvas
//

// reference base path is in the middle of the screen
var basePathY = Math.floor(window.innerHeight / 2);

// array holds a single stroke instance
// order acts as time
// !!deprecated
var stroke = [];

// path holds multiple separate strokes
var path = [];
var pathIndex = 0;

// sets whether mouse has been pressed
var mouseDown = false;

var prevVertex = {x: -1, y: -1};

function recordVertex(event) {
    var offset = event.clientY - basePathY;
    var basePathX = event.clientX;
    var vertex = [basePathX, offset];
    try {
        path[pathIndex].push(vertex);
    }
    catch(err) {
        path.push([vertex]);
    }
    stroke.push(new THREE.Vector2(basePathX, offset));
    mouseDown = true;
    canvasX = event.clientX - bounds.left - scrollX;
    canvasY = event.clientY - bounds.top - scrollY;
    requestAnimationFrame(addLineSegment({x: canvasX, y: canvasY}));
}

function addLineSegment(nextVertex) {
    if (prevVertex.x != -1) {
        console.log("draw")
        input_ctx.lineWidth = 5;
        input_ctx.beginPath();
        input_ctx.moveTo(prevVertex.x, prevVertex.y);
        input_ctx.lineTo(nextVertex.x, nextVertex.y);
        input_ctx.stroke();
    }
    prevVertex = nextVertex;
    stroke_input = stroke;
}

function addPath() {
    mouseDown = false;
    prevVertex.x = -1;
    pathIndex += 1;
}

document.onmousedown = recordVertex;
document.onmousemove = function(event) {
    if (mouseDown) {
        recordVertex(event);
    }
};
document.onmouseup = addPath;
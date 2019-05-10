//
// setup canvas
var canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
var bounds = canvas.getBoundingClientRect();
canvas.style = "pointer-events: none; z-index:10"
document.body.appendChild(canvas);
// end setup canvas
//

// reference base path is in the middle of the screen
var basePathY = Math.floor(window.innerHeight / 2);

// array holds a single stroke instance
// order acts as time
// !!deprecated
// var stroke = [];

// path holds multiple separate strokes
var path = [];
var pathIndex = 0;

// sets whether mouse has been pressed
var mouseDown = false;

var prevVertex = {x: -1, y: -1};

//offsets are stored as floats with a range of 0.0-1.0
function recordVertex(event) {
    var offset = (event.clientY - basePathY) / window.innerHeight;
    var basePathX = event.clientX / window.innerWidth;
    var vertex = [basePathX, offset];
    try {
        path[pathIndex].push(vertex);
    }
    catch(err) {
        path.push([vertex]);
    }
    mouseDown = true;
    canvasX = event.clientX - bounds.left - scrollX;
    canvasY = event.clientY - bounds.top - scrollY;
    requestAnimationFrame(addLineSegment({x: canvasX, y: canvasY}));
}

function addLineSegment(nextVertex) {
    if (prevVertex.x != -1) {
        console.log("draw")
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(prevVertex.x, prevVertex.y);
        ctx.lineTo(nextVertex.x, nextVertex.y);
        ctx.stroke();
    }
    prevVertex = nextVertex;
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
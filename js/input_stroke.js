//
// setup threejs canvas
var scene = new THREE.Scene();
var renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

canvas.style = "pointer-events: none; z-index:10"

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);
document.body.appendChild(canvas);
// end setup threejs canvas
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
}

function addPath() {
    mouseDown = false;
    pathIndex += 1;
}

document.onmousedown = recordVertex;
document.onmousemove = function(event) {
    if (mouseDown) {
        recordVertex(event);
    }
};
document.onmouseup = addPath;
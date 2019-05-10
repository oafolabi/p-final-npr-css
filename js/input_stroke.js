var gui_size = 300;

var resolution = gui_size;
var unitLength = gui_size;

//
// setup canvas
input_width = resolution;
input_height = window.innerHeight;
var input_canvas = document.getElementById('input_canvas');
input_canvas.width = input_width;
input_canvas.height = input_height;
var input_ctx = input_canvas.getContext("2d");
var bounds = input_canvas.getBoundingClientRect();
input_canvas.style = "right: 0; display:block; z-index:11; box-shadow: 0px 0px 10px grey;"
input_canvas.style.width = input_width.toString() + "px";
input_canvas.style.height = input_height.toString() + "px";
document.body.appendChild(input_canvas);
// end setup canvas
//

// reference base path is in the middle of the screen
var basePathY = Math.floor(bounds.height / 2);
var startX = 0;

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
    var offset = event.layerY - basePathY;
    var basePathX = event.layerX;
    var vertex = [basePathX, offset];
    // try {
    //     path[pathIndex].push(vertex);
    // }
    // catch(err) {
    //     path.push([vertex]);
    // }
    if (!mouseDown) {
        stroke = [];
        startX = basePathX;
        stroke.push(new THREE.Vector2(0, 0));
        // stroke_input.push(new THREE.Vector2(0.01, 0));
    }
    var np = new THREE.Vector2(basePathX - startX, offset);
    console.log(np, stroke[stroke.length - 1], stroke);
    if (np.distanceTo(stroke[stroke.length - 1]) > 5) {
        stroke.push(np);
    }
    // stroke.push(new THREE.Vector2(basePathX - startX + 0.05, offset));
    console.log(stroke);
    mouseDown = true;
    // canvasX = event.layerX;
    // canvasY = event.layerY;
    if (stroke.length > 1) {
        stroke_input = stroke;
    } else {
        stroke_input = [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)];
    }
//         console.log("draw")
//         console.log(nextVertex);
//         drawLine(prevVertex, nextVertex, lineWidth)
//     }
    // addLineSegment({x: canvasX, y: canvasY}, 5);
}

// function addLineSegment(nextVertex, lineWidth) {
//     if (prevVertex.x != -1) {
//         console.log("draw")
//         console.log(nextVertex);
//         drawLine(prevVertex, nextVertex, lineWidth)
//     }
//     prevVertex = nextVertex;
//     stroke_input = stroke;
// }

function drawLine(from, to, lineWidth) {
    input_ctx.lineWidth = lineWidth;
    input_ctx.beginPath();
    input_ctx.moveTo(from.x, from.y);
    input_ctx.lineTo(to.x, to.y);
    input_ctx.stroke();
}

function getMousePos(canvas, evt) {
    var rect = input_canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function addPath() {
    mouseDown = false;
    prevVertex.x = -1;
    // pathIndex += 1;
}

input_canvas.onmousedown = recordVertex;
input_canvas.onmousemove = function(event) {
    if (mouseDown) {
        recordVertex(event);
    }
};
input_canvas.onmouseup = addPath;
var mouseX = 0;
var mouseY = 0;
document.addEventListener('mousemove', function(e) {
    var rect = input_canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
})

function animateInput() {
    requestAnimationFrame(animateInput);
    input_ctx.clearRect(0, 0, input_ctx.canvas.width, input_ctx.canvas.height);
    input_ctx.setLineDash([4, 2]);
    input_ctx.strokeStyle = "grey";
    drawLine({x: window.innerWidth - bounds.width, y: basePathY}, {x: window.innerWidth, y: basePathY});
    input_ctx.setLineDash([]);
    input_ctx.strokeStyle = "black";
    input_ctx.beginPath();
    input_ctx.lineWidth = 5;
    var down = false;
    for (var i = 0; i < stroke_input.length; i++) {
        var point = stroke_input[i];
        if (!down) {
            input_ctx.moveTo(point.x + startX, point.y + basePathY);
            down = true;
        } else {
            input_ctx.lineTo(point.x + startX, point.y + basePathY);
        }
    }
    input_ctx.stroke();
    if (mouseX > 0 && mouseDown) {
        input_ctx.beginPath();
        input_ctx.moveTo(point.x + startX, point.y + basePathY);
        down = true;
        input_ctx.strokeStyle = "#dbdbdb";
        for (var i = 0; i < stroke_input.length; i++) {
            var point = stroke_input[i];
            if (!down) {
                input_ctx.moveTo(point.x + mouseX, point.y + mouseY);
                down = true;
            } else {
                input_ctx.lineTo(point.x + mouseX, point.y + mouseY);
            }
        }
        input_ctx.stroke();
    }
    
}
animateInput();

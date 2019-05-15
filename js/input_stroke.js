var gui_size = 400;
// stroke init
var stroke_input;
var total_strokes = 3; // number of strokes specified
var user_lineWidth = 5;
var thicknessOrder = [];
var seed = 0;
var total_synth = 3; // total amount of strokes synthesized

// global stroke res controls
var resolution = 100;
var unitLength = 100;

var resolution = gui_size;
var unitLength = gui_size;

// contains the different input canvases and corresponding contexts via index
var canvas_array = [];
var context_array = [];
// used to initalize instances for the input array
var input_ctx;
var bounds;
var canvas_sep = 5;
var shuffle = 0;
var isCube = true;

class CanvasBlock {
    constructor(input_width, input_height, parent) {
        this.input_canvas = document.createElement("CANVAS");
        this.input_ctx = this.input_canvas.getContext("2d");
        if (parent == null) {
            this.id = 1;
        } else {
            this.id = parent.id + 1;
        }
        this.input_canvas.id = 'input_canvas' + (this.id).toString();
        this.input_width = input_width;
        this.input_height = input_height;
        this.input_canvas.width = input_width;
        this.input_canvas.height = input_height;
        this.input_ctx = this.input_canvas.getContext("2d");
        this.input_canvas.style = "right: 0; display:block; z-index:11; box-shadow: 0px 0px 10px grey;";
        this.input_canvas.style.width = input_width.toString() + "px";
        this.input_canvas.style.height = input_height.toString() + "px";
        if (parent != null) {
            this.input_canvas.style.top = (canvas_sep + parent.bounds.bottom).toString() + "px";
        }
        document.body.appendChild(this.input_canvas);
        this.bounds = this.input_canvas.getBoundingClientRect();
        this.thicknessOrder = [];

        this.basePathY = Math.floor(input_height / 2);//TODO?

        // array holds a single stroke instance
        // order acts as time
        // !!deprecated
        this.stroke = [];
        // path holds multiple separate strokes
        this.path = [];
        this.pathIndex = 0;
        // sets whether mouse has been pressed
        this.mouseDown = false;
        this.strokeHistory = [];
        this.prevVertex = {x: -1, y: -1};

        
        this.spawn_gui();
        var that = this;
        // event handlers
        // need to register event handlers for each input we have
        this.input_canvas.onmousedown = this.recordVertex.bind(this);
        this.input_canvas.onmousemove = function(event) {
            if (that.mouseDown) {
                that.recordVertex(event);
            }
        };
        this.input_canvas.onmouseup = this.addPath.bind(this);
    }
    // what goes in this object?
    // strokes
    // "basepath"

    recordVertex(event) {
        console.log(event);
        if (Math.abs(this.prevVertex.y - event.layerY) > 0 && Math.abs(this.prevVertex.x - event.layerX) > 0) {
            var offset = event.layerY - this.basePathY;
            var basePathX = event.layerX;
            var vertex = [basePathX, offset];
            try {
                this.path[this.pathIndex].push(vertex);
            }
            catch(err) {
                this.path.push([vertex]);
            }
            this.stroke.push(new THREE.Vector2(basePathX, offset));
            this.mouseDown = true;
            this.thicknessOrder.push(user_lineWidth);
            this.addLineSegment({x: event.layerX, y: event.layerY}, user_lineWidth);
        }
    }
    
    addLineSegment(nextVertex, lineWidth) {
        if (this.prevVertex.x != -1) {
            console.log("draw");
            console.log(nextVertex);
            this.drawLine(this.prevVertex, nextVertex, lineWidth);
        }
        console.log(this.prevVertex);
        this.strokeHistory.push(this.prevVertex);
        this.prevVertex = nextVertex;
        stroke_input = this.stroke;
    }

    drawLine(from, to, lineWidth) {
        this.input_ctx.lineWidth = lineWidth;
        this.input_ctx.beginPath();
        this.input_ctx.moveTo(from.x, from.y);
        this.input_ctx.lineTo(to.x, to.y);
        this.input_ctx.stroke();
    }
    
    addPath(event) {
        this.mouseDown = false;
        this.prevVertex.x = -1;
        this.pathIndex += 1;
    }

    rerender() {
        this.spawn_gui();
        for (var i = 1; i < this.strokeHistory.length - 1; i += 1) {
            this.drawLine(this.strokeHistory[i], this.strokeHistory[i+1], user_lineWidth);
        }
    }

    
    // construct window for input gui
    spawn_gui() {
        console.log("spawn");
        this.input_width = gui_size;
        console.log(this.input_ctx);
        this.input_ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.input_canvas.width = this.input_width;
        this.input_canvas.height = this.input_height;
        this.input_canvas.style.width = this.input_width.toString() + "px";
        this.input_canvas.style.height = this.input_height.toString() + "px";
        // input_ctx.font = "100px Arial";
        // input_ctx.fillStyle = "black";
        // input_ctx.fillText("HELLO WORLD", 10, 100);
        console.log(this.input_ctx.fillStyle);
        this.input_ctx.setLineDash([4, 2]);
        this.input_ctx.strokeStyle = "grey";
        console.log(this.basePathY);
        this.drawLine({x: 0, y: this.basePathY}, {x: window.innerWidth, y: this.basePathY}, 1);
        this.input_ctx.setLineDash([]);
        this.input_ctx.strokeStyle = "black";
    }
    
    undo_action() {
        this.spawn_gui();
        if (this.path.length < this.pathIndex + 1) {
            this.pathIndex -= 1;
        }
        if (this.path.length > 0 && this.path[this.pathIndex].length > 0) {
            this.path[this.pathIndex].pop();
            if (this.path[this.pathIndex].length == 0) {
                this.path.pop();
            }
        }
        if (this.stroke.length > 0) {
            this.stroke.pop();
            stroke_input.pop();
            this.rerender();
            this.prevVertex = this.strokeHistory.pop();
            this.thicknessOrder.pop();
        }
        if (this.stroke.length == 0) {
            this.reset();
        }
    }




    // define actions for different key presses
    gui_action (event) {
        switch(event.key) {
            // reset
            case 'r':
                this.reset();
                break;
            // increase brush width
            case '=':
                this.rerender();
                break;
            // decrease brush width
            case '-':
                this.rerender();
                break;
            // undo
            case 'z':
                this.undo_action();
                break;
            // increase gui size
            case ']':
                this.reset();
                break;
            // decrease gui size
            case '[':
                this.reset();
                break;
        }
    }

    reset() {
        console.log("reset");
        stroke_input = lowWavyStroke;
        this.stroke.length = 0;
        this.path.length = 0;
        this.pathIndex = 0;
        this.prevVertex = {x: -1, y: -1};
        this.strokeHistory.length = 0;
        this.thicknessOrder.length = 0;
        this.spawn_gui();
    }
}


// var cb1 = CanvasBlock(2, 2, null);
// var cb2 = CanvasBlock(2, 2, cb1);

//
// setup canvas
function new_input() {
    input_width = resolution;
    input_height = 100;
    parent = null;
    if (canvas_array.length > 0) {
        parent = canvas_array[canvas_array.length-1];
    }

    canvas_array.push(new CanvasBlock(input_width, input_height, parent));
    
}
// end setup canvas
//

for (var i = 0; i < total_strokes; i += 1) {
    new_input();
}

// global key commands
document.onkeydown = function(event) {
    switch(event.key) {
        // shuffle between the shown stroke
        case 's':
            seed = (seed + 1) % 100;
            shuffle += 1;
            stroke_input = canvas_array[shuffle % canvas_array.length].stroke;
            break;
        // switch between fox and cube
        case 'c':
        	if (cupHE != undefined && cupMesh != undefined) {
                if (isCube) {
                    obj = cupMesh;
                    objCreases = cupCreases;
                    objHE = cupHE;
                } else {
                    obj = cube;
                    objCreases = cubeCreases;
                    objHE = cubeHE;
                }
                isCube = !isCube;
            }
            break;
        // increase brush width
        case '=':
            user_lineWidth += 1;
            break;
        // decrease brush width
        case '-':
            user_lineWidth -= 1;
            break;
        // increase gui size
        case ']':
            gui_size += 100;
            break;
        // decrease gui size
        case '[':
            gui_size -= 100;
            break;
        // create MRF and synthesize strokes
        case 'm':
            gen_synth(total_synth);
            break;
    }
    canvas_array.forEach(function(element) {
        element.gui_action(event);
    });
};
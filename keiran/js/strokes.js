

var scene = new THREE.Scene();
var renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var canvas = document.getElementById('render_canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

canvas.style = "pointer-events: none; z-index:10"

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);
document.body.appendChild(canvas);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();

var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
//boxGeometry = new THREE.TorusGeometry(0.6, 0.3, 8, 12);
var octohedronGeometry = new THREE.OctahedronGeometry();
var cupHE;
var cupMesh;
var cupWireframe;
var cupLines;
var cupCreases;

{
    const loader = new THREE.ColladaLoader();
    loader.load('https://raw.githubusercontent.com/rayneong/p-final-npr-css/master/models/meshedit/teapot.dae', (gltf) => {
      var root = gltf.scene;
	  var cup = root.getObjectByName('Scene');
	  cup = false;
      if (cup) {
        var queue = [cup];
        while (queue.length > 0) {
            var element = queue[0];
            if (element instanceof THREE.Mesh) {
              var ge = new THREE.Geometry().fromBufferGeometry( element.geometry );
              var me = new THREE.Mesh( ge, redMaterial);
              cupMesh = me;
              scene.add(me);
              // cupMesh.push(me);

              var he = convertToHalfEdge(ge);
              cupHE = he;
              // cupHE.push(he);
              // addSillhouetteStrokes(he, ge, me);
              me.position.set(4, 0, 0);
			  createEdgeDetectionMesh(me, he.edges);
			  cupWireframe = new THREE.WireframeGeometry(ge);
			  cupLines = new THREE.LineSegments(cupWireframe);
			  cupLines.position.set(4, 0, 0);
			  scene.add(cupLines);
			  cupLines.visible = false;
			  cupCreases = getCreases(me, he.edges);

            }
            for (const e of element.children) {
                queue.push(e);
            }
            queue.shift();
        }
	}}, undefined, undefined);
}

{
    const loader = new THREE.OBJLoader();
    loader.load('https://raw.githubusercontent.com/rayneong/p-final-npr-css/master/models/ucbugg_fox_lowpoly.obj', (gltf) => {
	  var root = gltf;
		var cup = root.getObjectByName('fox:fox_mesh');
	  // var cup = root.getObjectByName('pCubeShape1_MASH1_Instancer_120');
	// var cup = root.getObjectByName('polySurface1');
	// var cup = root.getObjectByName('pPlane1');
	//   cup = false;
      if (cup) {
        var queue = [cup];
        while (queue.length > 0) {
            var element = queue[0];
            if (element instanceof THREE.Mesh) {
			  var ge = new THREE.Geometry().fromBufferGeometry( element.geometry );
			  ge.scale(0.2, 0.2, 0.2);
              var me = new THREE.Mesh( ge, redMaterial);
              cupMesh = me;
              scene.add(me);

              var he = convertToHalfEdge(ge);
              cupHE = he;
              // addSillhouetteStrokes(he, ge, me);
              me.position.set(-2, -1, 0);
			  createEdgeDetectionMesh(me, he.edges);
			  cupWireframe = new THREE.WireframeGeometry(ge);
			  cupLines = new THREE.LineSegments(cupWireframe);
			  cupLines.position.set(-2, -1, 0);
			  scene.add(cupLines);
			  cupLines.visible = false;
			  cupCreases = getCreases(me, he.edges);

            }
            for (const e of element.children) {
                queue.push(e);
            }
            queue.shift();
        }
    }}, undefined, undefined);
}


var greenMaterial = new THREE.MeshToonMaterial({color: 0x00ff00, shininess: 5});
var blueMaterial = new THREE.MeshToonMaterial({color: 0x0000ff, shininess: 5});
var redMaterial = new THREE.MeshToonMaterial({color: 0xff0000, shininess: 5});
var whiteMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
var cube = new THREE.Mesh(boxGeometry, greenMaterial);
var octohedron = new THREE.Mesh(octohedronGeometry, blueMaterial);

scene.add(cube);
scene.add(octohedron);

var dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-1, 1, 1).normalize();
var ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
scene.add(dirLight);

octohedron.position.set(2, 0, 0);

var boxHalfedgeGeometry = convertToHalfEdge(boxGeometry);
var octohedronHalfedgeGeometry = convertToHalfEdge(octohedronGeometry);

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '0x';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return parseInt(color, 16);
}

var usedEdgeID = new Set();

function createEdgeDetectionMesh(mesh, edges) {
	mesh.geometry.computeVertexNormals();
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		var v1 = mesh.geometry.vertices[edge.halfedge.vertex.idx];
		var f1 = mesh.geometry.faces[edge.halfedge.face.idx];
		var n1 = f1.normal;
		var v2 = mesh.geometry.vertices[edge.halfedge.twin.vertex.idx];
		var f2 = mesh.geometry.faces[edge.halfedge.twin.face.idx];
		var n2 = f2.normal;
		var n = n1.add(n2).normalize();
		var g = new THREE.Geometry();
		g.vertices = [v1.clone().addScaledVector(n, 0.01), v2.clone().addScaledVector(n, 0.01)];
		var color = 0x000000;
		do {
			color = getRandomColor();
		} while (usedEdgeID.has(color));
		edge.id = color;
		var material = new MeshLineMaterial({
			color: color,
			lineWidth: 5,
			sizeAttenuation: false,
			resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
			near: camera.near,
			far: camera.far,
		});
		var line = new MeshLine();
		line.setGeometry(g);
		var m = new THREE.Mesh(line.geometry, material);
		
		// var m = new THREE.Line(g, new THREE.LineBasicMaterial({color: color}));
		m.position.copy(mesh.position);
		scene.add(m);
		edge.line = m;
	}
}

function setEdgeIDEnabled(edges, enabled) {
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		edge.line.visible = enabled;
	}
}

createEdgeDetectionMesh(cube, boxHalfedgeGeometry.edges);
createEdgeDetectionMesh(octohedron, octohedronHalfedgeGeometry.edges);

function getSilhouetteLines(silhouettes, mesh, edges, stroke, buffer) {
	var edgesHash = {};
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		var v1 = edge.halfedge.vertex.idx;
		var v2 = edge.halfedge.twin.vertex.idx;
		edgesHash[[v1, v2].join()] = edge.id;
		edgesHash[[v2, v1].join()] = edge.id;
	}
	var lines = [];
	var rng = new Math.seedrandom(seed);
	for (var j = 0; j < silhouettes.length; j++) {
		var vertices = silhouettes[j];
		var waypoints = [];
		// vertices.push(vertices[0]);
		for (var i = 0; i < vertices.length; i++) {
			waypoints.push(mesh.geometry.vertices[vertices[i]]);
		}

		for (var i = 0; i < waypoints.length; i++) {
			waypoints[i] = pointToScreenPosition(waypoints[i].clone().applyMatrix4(mesh.matrixWorld), camera, renderer);
			waypoints[i] = new THREE.Vector2(waypoints[i].x, waypoints[i].y);
		}

		// Randomly select stroke style for line
		stroke = canvas_array[Math.floor(rng() * canvas_array.length)].stroke;
		if (stroke.length == 0) {
			stroke = lowWavyStroke;
		}
		var v = waypointsToStylized(stroke, waypoints);
		for (var i = 0; i < v.length; i++) {

			var v1 = vertices[v[i].waypoint];
			var v2 = vertices[v[i].waypoint - 1];
			v[i].visible = checkVisibility(v[i].reference, edgesHash[[v1, v2].join()], buffer);
		}
		lines.push(v);
	}
	return lines;
}

function getCreaseLines(creases, silhouettes, mesh, stroke, buffer) {
	var lines = [];
	var silhouetteEdges = new Set();
	for (var i = 0; i < silhouettes.length; i++) {
		var vertices = silhouettes[i];
		for (var j = 0; j < vertices.length; j++) {
			silhouetteEdges.add([vertices[j], vertices[(j + 1)  % vertices.length]].join());
			silhouetteEdges.add([vertices[(j + 1)  % vertices.length], vertices[j]].join());
		}
	}
	var rng = new Math.seedrandom(seed);
	for (var i = 0; i < creases.length; i++) {
		var edge = creases[i];
		var v1 = edge.halfedge.vertex.idx;
		var v2 = edge.halfedge.twin.vertex.idx;
		var crease = [v1, v2];
		if (!silhouetteEdges.has(crease.join())) {
			var waypoints = [];
			for (var j = 0; j < crease.length; j++) {
				waypoints.push(mesh.geometry.vertices[crease[j]]);
			}

			for (var j = 0; j < waypoints.length; j++) {
				waypoints[j] = pointToScreenPosition(waypoints[j].clone().applyMatrix4(mesh.matrixWorld), camera, renderer);
				waypoints[j] = new THREE.Vector2(waypoints[j].x, waypoints[j].y);
			}

			// Randomly select stroke style for line
			stroke = canvas_array[Math.floor(rng() * canvas_array.length)].stroke;
			if (stroke.length == 0) {
				stroke = lowWavyStroke;
			}
			var v = waypointsToStylized(stroke, waypoints);
			for (var j = 0; j < v.length; j++) {
				v[j].visible = checkVisibility(v[j].reference, edge.id, buffer);
			}
			lines.push(v);
		}
	}
	return lines;
}

const rgbToHex = (r, g, b) => '0x' + [r, g, b].map(x => {
  	const hex = x.toString(16)
	return hex.length === 1 ? '0' + hex : hex
}).join('')

function checkVisibility(point, id, buffer) {
	var detectionRadius = 5;
	point = point.clone().floor();
	point.y = window.innerHeight - point.y;
	for (var i = -detectionRadius; i < detectionRadius; i++) {
		for (var j = -detectionRadius; j < detectionRadius; j++) {
			var offset = new THREE.Vector2(i, j);
			var p = offset.add(point);
			var pixelIndex = ((p.y * window.innerWidth) + p.x) * 4;
			if (pixelIndex < buffer.length - 2 && pixelIndex >= 0) {
				var r = buffer[pixelIndex + 0];
				var g = buffer[pixelIndex + 1];
				var b = buffer[pixelIndex + 2];
				var hex = (r << 16) | (g << 8) | (b);
				if (hex == id) {
					return true;
				}			
			}
		}
	}
	return false;
}

camera.position.z = 5;

var cubeWireframe = new THREE.WireframeGeometry(boxGeometry);
var cubeLines = new THREE.LineSegments(cubeWireframe);
var octWireframe = new THREE.WireframeGeometry(octohedronGeometry);
var octLines = new THREE.LineSegments(octWireframe);
octLines.position.set(2, 0, 0);
scene.add(cubeLines);
scene.add(octLines);

cubeLines.visible = false;
octLines.visible = false;

var wavyStroke = [];
for (var i = 0; i < resolution; i++) {
	wavyStroke.push(new THREE.Vector2(i * unitLength / resolution, 3 * Math.sin(2 * Math.PI * (i / (0.2 * resolution)))));
}

var loopyStroke = [];
for (var j = 0; j < 6 * Math.PI; j += 2 * Math.PI / 30) {
	var v = new THREE.Vector2(0.1 * unitLength * Math.cos(j) + ((j * unitLength) / (6 * Math.PI)), 0.07 * unitLength * Math.sin(j));
	loopyStroke.push(v);
}

var lowWavyStroke = [];
for (var j = 0; j < 6 * Math.PI; j += 2 * Math.PI / 30) {
	var v = new THREE.Vector2(Math.cos(j) + ((j * unitLength) / (6 * Math.PI)), Math.sin(j));
	lowWavyStroke.push(v);
}

var randomStroke = [];
for (var j = 0; j < 6 * Math.PI; j += 2 * Math.PI / 30) {
	var v = new THREE.Vector2(unitLength * (j * 0.9 + Math.random() * 0.03), unitLength * Math.random() * 0.04);
	randomStroke.push(v);
}

var straightStroke = [];
for (var j = 0; j < 10; j++) {
	var v = new THREE.Vector2(j * unitLength / 10, 0);
	straightStroke.push(v);
}

stroke_input = lowWavyStroke;

function render2DLines(lines) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.lineWidth = user_lineWidth;
	for (var j = 0; j < lines.length; j++) {
		var visible = false;
		ctx.beginPath();
		for (var i = 0; i < lines[j].length; i++) {
			var p = lines[j][i];
			if (p.visible && !visible) {
				visible = true;
				ctx.moveTo(p.point.x, p.point.y);
			} else if (p.visible) {
				ctx.lineTo(p.point.x, p.point.y);
			} else {
				visible = false;
			}
		}
		ctx.stroke();
	}
}

var cubeCreases = getCreases(cube, boxHalfedgeGeometry.edges);
var octCreases = getCreases(octohedron, octohedronHalfedgeGeometry.edges);

var objCreases = cubeCreases;
var obj = cube;
var cubeHE = boxHalfedgeGeometry.edges;
var objHE = cubeHE;

function animate() {

	requestAnimationFrame(animate);

	var objSilhouettes = getSilhouettes(camera, obj, objHE);
	var octSilhouettes = getSilhouettes(camera, octohedron, octohedronHalfedgeGeometry.edges);
	if (cupHE != undefined) {
		var cupSilhouettes = getSilhouettes(camera, cupMesh, cupHE.edges);
	}

	controls.update();

	setEdgeIDEnabled(objHE, true);
	setEdgeIDEnabled(octohedronHalfedgeGeometry.edges, true);
	if (cupHE != undefined) {
		setEdgeIDEnabled(cupHE.edges, true);
	}

	renderer.setRenderTarget(renderTarget);
	renderer.render(scene, camera);
	var outputBuffer = new Uint8Array(window.innerWidth * window.innerHeight * 4);
	renderer.readRenderTargetPixels(renderTarget, 0, 0, window.innerWidth, window.innerHeight, outputBuffer);

	setEdgeIDEnabled(objHE, false);
	setEdgeIDEnabled(octohedronHalfedgeGeometry.edges, false);
	if (cupHE != undefined) {
		setEdgeIDEnabled(cupHE.edges, false);
	}

	renderer.setRenderTarget(null);
	renderer.render(scene, camera);

	var lines = [];

	lines.push(...getSilhouetteLines(objSilhouettes, obj, objHE, canvas_array, outputBuffer));
	lines.push(...getSilhouetteLines(octSilhouettes, octohedron, octohedronHalfedgeGeometry.edges, canvas_array, outputBuffer));

	lines.push(...getCreaseLines(objCreases, objSilhouettes, obj, canvas_array, outputBuffer));
	lines.push(...getCreaseLines(octCreases, octSilhouettes, octohedron, canvas_array, outputBuffer));

	if (cupHE != undefined && cupMesh != undefined) {
		lines.push(...getSilhouetteLines(cupSilhouettes, cupMesh, cupHE.edges, randomStroke, outputBuffer));
		lines.push(...getCreaseLines(cupCreases, cupSilhouettes, cupMesh, randomStroke, outputBuffer));
	}

	render2DLines(lines);
}
animate();

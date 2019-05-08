var scene = new THREE.Scene();
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

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();

var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
var octohedronGeometry = new THREE.OctahedronGeometry();

var greenMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
var blueMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
var cube = new THREE.Mesh(boxGeometry, greenMaterial);
var octohedron = new THREE.Mesh(octohedronGeometry, blueMaterial);
scene.add(cube);
scene.add(octohedron);

octohedron.position.set(2, 0, 0);

var boxHalfedgeGeometry = convertToHalfEdge(boxGeometry);
var octohedronHalfedgeGeometry = convertToHalfEdge(octohedronGeometry);

function initSilhouetteGeometry(mesh) {
	var lineGeometry = new THREE.Geometry();
	var v1pos = new THREE.Vector3(0, 0, 0);
	var v2pos = new THREE.Vector3(1, 0, 0);
	lineGeometry.vertices = [v1pos, v2pos];
	var line = new MeshLine();
	line.setGeometry(lineGeometry);
	var lineMesh = new THREE.Mesh(line.geometry, new MeshLineMaterial({
		sizeAttenuation: false,
		resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
		near: camera.near,
		far: camera.far,
		lineWidth: 10,
		color: 0x000000,
		depthTest: false
	}));
	lineMesh.position.copy(mesh.position);
	return lineMesh;
}

var cubeSilhouetteMesh = initSilhouetteGeometry(cube);
var octSilhouetteMesh = initSilhouetteGeometry(octohedron);

scene.add(cubeSilhouetteMesh);
scene.add(octSilhouetteMesh);

function setSilhouetteGeometry(silhouetteMesh, vertices, mesh) {
	var lineGeometry = new THREE.Geometry();
	var v = [];
	for (var i = 0; i < vertices.length; i++) {
		v.push(mesh.geometry.vertices[vertices[i]]);
	}
	v.push(mesh.geometry.vertices[vertices[0]]);
	lineGeometry.vertices = v;
	var line = new MeshLine();
	line.setGeometry(lineGeometry);
	silhouetteMesh.geometry = line.geometry;
}

function getSilhouetteLine(vertices, mesh, stroke) {
	var waypoints = [];
	for (var i = 0; i < vertices.length; i++) {
		waypoints.push(mesh.geometry.vertices[vertices[i]]);
	}
	waypoints.push(mesh.geometry.vertices[vertices[0]]);

	for (var i = 0; i < waypoints.length; i++) {
		waypoints[i] = pointToScreenPosition(waypoints[i].clone().applyMatrix4(mesh.matrixWorld), camera, renderer);
		waypoints[i] = new THREE.Vector2(waypoints[i].x, waypoints[i].y);
	}

	var v = waypointsToStylized(stroke, waypoints);

	return v;
}

function getCreaseLines(creases, silhouette, mesh, stroke) {
	var lines = [];
	var silhouetteEdges = new Set();
	for (var i = 0; i < silhouette.length; i++) {
		silhouetteEdges.add([silhouette[i], silhouette[(i + 1)  % silhouette.length]].join());
		silhouetteEdges.add([silhouette[(i + 1)  % silhouette.length], silhouette[i]].join());
	}
	for (var i = 0; i < creases.length; i++) {
		var crease = creases[i];
		if (!silhouetteEdges.has(crease.join())) {
			var waypoints = [];
			for (var j = 0; j < crease.length; j++) {
				waypoints.push(mesh.geometry.vertices[crease[j]]);
			}

			for (var j = 0; j < waypoints.length; j++) {
				waypoints[j] = pointToScreenPosition(waypoints[j].clone().applyMatrix4(mesh.matrixWorld), camera, renderer);
				waypoints[j] = new THREE.Vector2(waypoints[j].x, waypoints[j].y);
			}

			var v = waypointsToStylized(stroke, waypoints);
			lines.push(v);
		}
	}
	return lines;
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
cubeSilhouetteMesh.visible = false;
octSilhouetteMesh.visible = false;

var wavyStroke = [];
var resolution = 100;
var unitLength = 100;
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

function render2DLines(lines) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.lineWidth = 5;
	for (var j = 0; j < lines.length; j++) {
		ctx.beginPath();
		ctx.moveTo(lines[j][0].x, lines[j][0].y);
		for (var i = 1; i < lines[j].length; i++) {
			ctx.lineTo(lines[j][i].x, lines[j][i].y);
		}
		ctx.stroke();
	}
}

var cubeCreases = getCreases(cube, boxHalfedgeGeometry.edges);
var octCreases = getCreases(octohedron, octohedronHalfedgeGeometry.edges);

function animate() {

	requestAnimationFrame(animate);

	var cubeSilhouetteVertices = getSilhouetteVertices(camera, cube, boxHalfedgeGeometry.edges);
	var octSilhouetteVertices = getSilhouetteVertices(camera, octohedron, octohedronHalfedgeGeometry.edges);


	// setSilhouetteGeometry(cubeSilhouetteMesh, cubeSilhouetteVertices, cube);
	// setSilhouetteGeometry(octSilhouetteMesh, octSilhouetteVertices, octohedron);

	controls.update();
	renderer.render(scene, camera);

	var lines = [];

	lines.push(getSilhouetteLine(cubeSilhouetteVertices, cube, randomStroke));
	lines.push(getSilhouetteLine(octSilhouetteVertices, octohedron, randomStroke));

	lines.push(...getCreaseLines(cubeCreases, cubeSilhouetteVertices, cube, randomStroke));
	lines.push(...getCreaseLines(octCreases, octSilhouetteVertices, octohedron, randomStroke));

	render2DLines(lines);
}
animate();
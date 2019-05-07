var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

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
// cubeSilhouetteMesh.visible = false;
// octSilhouetteMesh.visible = false;

function testStrokeTransform() {
	var wavyStroke = [];
	var resolution = 100;
	for (var i = 0; i < resolution; i++) {
		wavyStroke.push(new THREE.Vector2(i / resolution, 0.05 * Math.sin(2 * Math.PI * (i / (0.2 * resolution)))));
	}

	var waypoints = [];

	for(var j = 0; j < 2 * Math.PI; j += 2 * Math.PI / 100) {
		waypoints.push(new THREE.Vector2(Math.cos(j), Math.sin(j)));
	}

	var v = waypointsToStylized(wavyStroke, waypoints);
	for (var i = 0; i < v.length; i++) {
		v[i] = new THREE.Vector3(v[i].x, v[i].y, 0);
	}

	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices = v;
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
	scene.add(lineMesh);
}

testStrokeTransform();

function animate() {

	requestAnimationFrame(animate);

	var cubeSilhouetteVertices = getSilhouetteVertices(camera, cube, boxHalfedgeGeometry.edges);
	var octSilhouetteVertices = getSilhouetteVertices(camera, octohedron, octohedronHalfedgeGeometry.edges);

	setSilhouetteGeometry(cubeSilhouetteMesh, cubeSilhouetteVertices, cube);
	setSilhouetteGeometry(octSilhouetteMesh, octSilhouetteVertices, octohedron);

	controls.update();
	renderer.render(scene, camera);
}
animate();
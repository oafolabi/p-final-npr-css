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
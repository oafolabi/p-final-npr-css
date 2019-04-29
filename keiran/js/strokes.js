var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
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

function addSillhouetteStrokes(halfedgeGeometry, geometry, mesh) {
	var group = new THREE.Group();
	scene.add(group);
	for (var i = 0 ; i < halfedgeGeometry.edges.length; i++) {
		var edge = halfedgeGeometry.edges[i];
		var v1 = edge.halfedge.vertex.idx;
		var v2 = edge.halfedge.twin.vertex.idx;
		var lineGeometry = new THREE.Geometry();
		lineGeometry.vertices = [geometry.vertices[v1].clone(), geometry.vertices[v2].clone()];
		var line = new MeshLine();
		line.setGeometry(lineGeometry);
		var lineMesh = new THREE.Mesh(line.geometry, new MeshLineMaterial({
			sizeAttenuation: false,
			resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
			near: camera.near,
			far: camera.far,
			lineWidth: 6,
			color: 0xffffff
		}));
		edge.line = lineMesh;
		group.add(lineMesh);
	}
	group.position.copy(mesh.position);
}

addSillhouetteStrokes(boxHalfedgeGeometry, boxGeometry, cube);
addSillhouetteStrokes(octohedronHalfedgeGeometry, octohedronGeometry, octohedron);

camera.position.z = 5;

function animate() {

	requestAnimationFrame(animate);

	updateSilhouette(camera, cube, boxHalfedgeGeometry.edges);
	updateSilhouette(camera, octohedron, octohedronHalfedgeGeometry.edges);

	controls.update();
	renderer.render(scene, camera);
}
animate();
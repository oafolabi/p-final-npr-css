var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

var group = new THREE.Group();
scene.add(group);

var boxGeometry = new THREE.BoxGeometry(1, 1, 1);

var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
var cube = new THREE.Mesh(boxGeometry, material);
// group.add(cube);

var he = convertToHalfEdge(boxGeometry);

for (var i = 0 ; i < he.edges.length; i++) {
	var edge = he.edges[i];
	var v1 = edge.halfedge.vertex.idx;
	var v2 = edge.halfedge.twin.vertex.idx;
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices = [boxGeometry.vertices[v1], boxGeometry.vertices[v2]];
	console.log(lineGeometry.vertices);
	var line = new MeshLine();
	line.setGeometry(lineGeometry);
	var mesh = new THREE.Mesh(line.geometry, new MeshLineMaterial({
		sizeAttenuation: false,
		resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
		near: camera.near,
		far: camera.far,
		lineWidth: 5,
		color: 0xffffff
	}));
	group.add(mesh);
	// lineGeometry.verticies = 
}

camera.position.z = 5;

function animate() {

	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}
animate();
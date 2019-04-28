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

camera.position.z = 5;

function animate() {

	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}
animate();
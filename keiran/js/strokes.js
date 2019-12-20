var scene = new THREE.Scene();
var renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var canvas = document.getElementById('render_canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

canvas.style = "pointer-events: none; z-index:10"

var renderer = new THREE.WebGLRenderer({alpha : true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 0);
document.body.appendChild(renderer.domElement);
document.body.appendChild(canvas);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();


{
    const loader = new THREE.OBJLoader();
    loader.load('https://raw.githubusercontent.com/oafolabi/p-final-npr-css/master/models/model.obj', // called when resource is loaded
	function ( object ) {

		scene.add( object );

	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	});
}


var greenMaterial = new THREE.MeshToonMaterial({color: 0x00ff00, shininess: 5});
var blueMaterial = new THREE.MeshToonMaterial({color: 0x0000ff, shininess: 5});
var redMaterial = new THREE.MeshToonMaterial({color: 0xff0000, shininess: 5});
var whiteMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});

var dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-1, 1, 1).normalize();
var ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
scene.add(dirLight);

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '0x';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return parseInt(color, 16);
}

const rgbToHex = (r, g, b) => '0x' + [r, g, b].map(x => {
  	const hex = x.toString(16)
	return hex.length === 1 ? '0' + hex : hex
}).join('')

camera.position.z = 1;

function animate() {

	requestAnimationFrame(animate);

	controls.update();

	renderer.setRenderTarget(renderTarget);
	renderer.render(scene, camera);
	var outputBuffer = new Uint8Array(window.innerWidth * window.innerHeight * 4);
	renderer.readRenderTargetPixels(renderTarget, 0, 0, window.innerWidth, window.innerHeight, outputBuffer);
	renderer.setRenderTarget(null);
	renderer.render(scene, camera);
}
animate();

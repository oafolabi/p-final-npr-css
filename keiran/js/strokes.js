var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
var cup;
var root;

  function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
      const isLast = ndx === lastNdx;
      dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
  }

var cupArr = [];
var cupHE = [];
//var cupGeo = [];
var cupMesh = [];
{
    const gltfLoader = new THREE.LegacyGLTFLoader();
    gltfLoader.load('https://raw.githubusercontent.com/rayneong/p-final-npr-css/master/models/teapot/teapot.gltf', (gltf) => {
      root = gltf.scene;
      cup = root.getObjectByName('teacup_HR_Geometryobjcleanermaterialmergergles');
      scene.add(root);
      console.log("loaded");
      console.log(dumpObject(root).join('\n'));
     // cars = root.getObjectByName('teacup_HR_Geometryobjcleanermaterialmergergles');
      // compute the box that contains all the stuff
      // from root and below
      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      // set the camera to frame the box
      //frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

      // update the Trackball controls to handle the new size
      controls.maxDistance = boxSize * 10;
      controls.target.copy(boxCenter);
      controls.update();
        if (cup) {
          var queue = [cup];
          while (queue.length > 0) {
              var element = queue[0];
              if (element instanceof THREE.Mesh) {
                var ge = new THREE.Geometry().fromBufferGeometry( element.geometry );
                var me = new THREE.Mesh( ge, element.material);
                cupMesh.push();
                var he = convertToHalfEdge(ge);
                cupHE.push(he);
                addSillhouetteStrokes(he, ge, me);
              }
              for (const e of element.children) {
                  queue.push(e);
              }
              queue.shift();
        }
    }


    }, undefined, undefined);
}


//var geometries = [];
var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
var octohedronGeometry = new THREE.OctahedronGeometry();
//geometries.push(boxGeometry);
//geometries.push(octohedronGeometry);


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
    for (var i =0; i < cupMesh.length; i++) {
        var element = cupMesh[i];
        var he = cupHE[i];
	    updateSilhouette(camera, element, he.edges);
    }

	controls.update();
	renderer.render(scene, camera);
}
animate();

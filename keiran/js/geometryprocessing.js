/* Define half-edge data structure and convert from Geometry to AHalfEdge. */

class AHalfEdge {
	constructor(twin, next, vertex, edge, face) {
		this.twin = twin;
		this.next = next;
		this.vertex = vertex;
		this.edge = edge;
		this.face = face;
	}
}

class AVertex {
	constructor(idx, faceidx, halfedge) {
		this.idx = idx;
		this.faceidx = faceidx;
		this.halfedge = halfedge;
	}
}

class AEdge {
	constructor(halfedge) {
		this.halfedge = halfedge;
	}
}

class AFace {
	constructor(idx, halfedge) {
		this.idx = idx;
		this.halfedge = halfedge;
	}
}

function convertToHalfEdge(geometry) {
	geometry.mergeVertices();
	var vertices = geometry.vertices;
	var faces = geometry.faces;
	var keys = ['a', 'b', 'c'];
	var halfedges = [];
	var aHalfEdges = {};
    var bHalfEdges = {};
	var aVertices = {};
	var aFaces = {};
	for (var i = 0; i < faces.length; i++) {
		var hs = [];
		for (var j = 0; j < keys.length; j++) {
			var vertex = faces[i][keys[j]];
			var nextVertex = faces[i][keys[(j + 1) % keys.length]];

			var halfedge = new AHalfEdge();

			if (aVertices[vertex] == undefined) {
				halfedge.vertex = new AVertex(vertex, j, halfedge);
				aVertices[vertex] = halfedge.vertex;
			} else {
				halfedge.vertex = aVertices[vertex];
			}

			if (aFaces[i] == undefined) {
				halfedge.face = new AFace(i, halfedge);
				aFaces[i] = halfedge.face;
			} else {
				halfedge.face = aFaces[i];
			}

			var edgeKey = [vertex, nextVertex].sort().join();
			if (aHalfEdges[edgeKey] == undefined) {
				halfedge.edge = new AEdge(halfedge);
				aHalfEdges[edgeKey] = halfedge;
			} else {
				var other = aHalfEdges[edgeKey];
				halfedge.edge = aHalfEdges[edgeKey].edge;
				halfedge.twin = other;
				other.twin = halfedge;
			}
			
			hs.push(halfedge);
		}
		for (var j = 0; j < hs.length; j++) {
			hs[j].next = hs[(j + 1) % keys.length];
		}
		halfedges.push(...hs);
	}

    var boundaryHE = new Set();
    for (var key in aHalfEdges) {
        if (aHalfEdges[key].twin == undefined) {
            var halfedge = new AHalfEdge();
            boundaryHE.add(halfedge);
            halfedge.twin = aHalfEdges[key];
            halfedge.vertex = aHalfEdges[key].next.vertex;
            halfedge.edge = aHalfEdges[key];
            // need to assign next
            aHalfEdges[key].twin = halfedge;
        }
    }
    var unconnectedHE = new Set(boundaryHE);
    while (unconnectedHE.size != 0) {
        var he = unconnectedHE.values().next().value;
        var firsthe = he;
        // loop around and connect to all the halfedges in this boundary
        while (he.next == undefined) {
            var ne = he;
            while (ne.twin.face != undefined) {
                ne = ne.twin.next.next;
            } 
            unconnectedHE.delete(he);
            ne = ne.twin;
            he.next = ne;
            he = ne;
        }
        unconnectedHE.delete(he);
    }

	var allVertices = [];
	for (var key in aVertices) {
		allVertices.push(aVertices[key]);
	}
	var allEdges = [];
	for (var key in aHalfEdges) {
		allEdges.push(aHalfEdges[key].edge);
	}
	return {
		'halfedges': halfedges,
		'vertices': allVertices,
		'edges': allEdges
	};
}

/* Geometry processing algorithms */

function getVertexNormals(geometry) {
	var vertices = geometry.vertices;
	var faces = geometry.faces;
	var keys = ['a', 'b', 'c'];
	var vertexNormals = {};
	for (var i = 0; i < faces.length; i++) {
		var face = faces[i];
		for (var j = 0; j < face.vertexNormals.length; j++) {
			var normal = face.vertexNormals[j];
			vertexNormals[face[keys[j]]] = normal;
		}
	}
	return vertexNormals;
}

function getVertexNormalsHE(geometry) {
	var vertices = convertToHalfEdge(geometry).vertices;
	var vertexNormals = {};
	for (var i = 0; i < vertices.length; i++) {
		var face = geometry.faces[vertices[i].halfedge.face.idx];
		vertexNormals[vertices[i].idx] = face.vertexNormals[vertices[i].faceidx];
	}
	return vertexNormals;
}

function getSilhouettes(camera, mesh, edges) {
	var matrixWorld = mesh.matrixWorld;
	var cameraPos = camera.position.clone().applyMatrix4(camera.matrixWorldInverse);
	mesh.geometry.computeFaceNormals();
	var faces = mesh.geometry.faces;
	var sEdges = {};
	var edgelist = [];
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		if (edge.halfedge.face == undefined || edge.halfedge.twin.face == undefined) {
			edge.sil = true;
		} else {
			var v = mesh.geometry.vertices[edge.halfedge.vertex.idx].clone().applyMatrix4(mesh.modelViewMatrix);
			var cameraDir = cameraPos.clone().sub(v);
			var f1 = faces[edge.halfedge.face.idx];
			var f2 = faces[edge.halfedge.twin.face.idx];
			var n1 = f1.normal.clone().applyMatrix3(mesh.normalMatrix);
			var n2 = f2.normal.clone().applyMatrix3(mesh.normalMatrix);
			var d1 = n1.dot(cameraDir);
			var d2 = n2.dot(cameraDir);
			edge.sil = d1 * d2 <= 0.00002;
		}
		if (edge.sil) {
			if (sEdges[edge.halfedge.vertex.idx] == undefined) {
				sEdges[edge.halfedge.vertex.idx] = [];
			}
			if (sEdges[edge.halfedge.twin.vertex.idx] == undefined) {
				sEdges[edge.halfedge.twin.vertex.idx] = [];
			}
			sEdges[edge.halfedge.vertex.idx].push(edge.halfedge.twin.vertex.idx);
			sEdges[edge.halfedge.twin.vertex.idx].push(edge.halfedge.vertex.idx);
			edgelist.push([edge.halfedge.vertex.idx, edge.halfedge.twin.vertex.idx]);
		}
	}
	

	var findCycle = function(graph, start, prev, v, visited) {
		var neighbors = graph[v];
		visited.add(v);
		// var candidates = [];
		if (neighbors != undefined) {
			for (var i = 0; i < neighbors.length; i++) {
				if (neighbors[i] != prev && neighbors[i] == start) {
					return [neighbors[i]];
				}
				if (neighbors[i] != prev && !visited.has(neighbors[i])) {
					var res = findCycle(graph, start, v, neighbors[i], visited);
					if (res != undefined) {
						return [neighbors[i]].concat(res);
					}
				}
			}
		}
		return undefined;
	}

	var visited = new Set();
	var nextCycle = undefined;
	var silhouettes = [];
	do {
		var start = 0;
		for (var key in sEdges) {
			if (!visited.has(parseInt(key))) {
				start = parseInt(key);
				break;
			}
		}
		nextCycle = findCycle(sEdges, start, start, start, visited);
		if (nextCycle != undefined) {
			silhouettes.push(nextCycle);
		}
	} while (nextCycle != undefined);
	return silhouettes;
}

function getCreases(mesh, edges) {
	mesh.geometry.computeFaceNormals();
	var faces = mesh.geometry.faces;
	var creases = [];
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		if (edge.halfedge.face == undefined || edge.halfedge.twin.face == undefined) {
			continue;
		}
		var f1 = faces[edge.halfedge.face.idx];
		var f2 = faces[edge.halfedge.twin.face.idx];
		var d = f1.normal.clone().dot(f2.normal);
		// right now we check if the cosine of the angle is less than a value
		if (d < 0.5) {
			creases.push(edge);
		}
	}
	return creases;
}

function transformPoint(strokePoint, waypoints) {
	var distance = 0;
	var latestDistance = 1;
	var p = waypoints[0];
	var i = 0;
	waypoints[-1] = waypoints[0];
	while (distance < strokePoint.x && i < waypoints.length - 1) {
		i++;
		latestDistance = p.distanceTo(waypoints[i]);
		p = waypoints[i];
		distance += latestDistance;
	}
	var t = (strokePoint.x - (distance - latestDistance)) / latestDistance;
	if (t > 1) {
		t = 1;
	}
	var basePoint = waypoints[i - 1].clone().lerp(p, t);
	var dir = p.clone().sub(waypoints[i - 1]);
	if (dir.x == 0) {
		var normal = new THREE.Vector2(1, 0).normalize();
	} else {
		var normal = new THREE.Vector2(-dir.y / dir.x, 1).normalize();
	}
	var displacement = strokePoint.y;
	if (t == 0 || t == 1) {
		displacement = 0;
	}
	var res = basePoint.clone().addScaledVector(normal, displacement);
	return {
		point: res,
		reference: basePoint,
		waypoint: i
	};
}

function waypointsToStylized(strokePoints, waypoints) {
	var totalDistance = 0;
	for (var i = 0; i < waypoints.length - 1; i++) {
		totalDistance += waypoints[i].distanceTo(waypoints[i + 1])
	}
	var totalDistanceCovered = 0;
	var vertices = [];
	var i = 0;
	var clippedDistance = 0;
	while (totalDistanceCovered < totalDistance) {
		totalDistanceCovered = strokePoints[i].x + clippedDistance;
		var shiftedPoint = strokePoints[i].clone();
		shiftedPoint.x += clippedDistance;
		vertices.push(transformPoint(shiftedPoint, waypoints));
		i++;
		if (i == strokePoints.length) {
			clippedDistance += strokePoints[i - 1].x;
			i = 0;
		}
	}
	return vertices;
}

function pointToScreenPosition(point, camera, renderer) {
	camera.updateMatrixWorld();
	var widthHalf = 0.5 * renderer.context.canvas.width;
    var heightHalf = 0.5 * renderer.context.canvas.height;
	var vector = point.clone();
	vector.project(camera);
	vector.x = (vector.x * widthHalf) + widthHalf;
	vector.y = -(vector.y * heightHalf) + heightHalf;
	return { 
        x: vector.x,
        y: vector.y
    };
}



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

function getSilhouetteVertices(camera, mesh, edges) {
	var matrixWorld = mesh.matrixWorld;
	var cameraPos = camera.position.clone().applyMatrix4(camera.matrixWorldInverse);
	mesh.geometry.computeFaceNormals();
	var faces = mesh.geometry.faces;
	var sEdges = {};
	var vertices = [];
	var edgelist = [];
	for (var i = 0; i < edges.length; i++) {
		var edge = edges[i];
		var v = mesh.geometry.vertices[edge.halfedge.vertex.idx].clone().applyMatrix4(mesh.modelViewMatrix);
		var cameraDir = cameraPos.clone().sub(v);
		var f1 = faces[edge.halfedge.face.idx];
		var f2 = faces[edge.halfedge.twin.face.idx];
		var n1 = f1.normal.clone().applyMatrix3(mesh.normalMatrix);
		var n2 = f2.normal.clone().applyMatrix3(mesh.normalMatrix);
		var d1 = n1.dot(cameraDir);
		var d2 = n2.dot(cameraDir);
		edge.sil = d1 * d2 <= 0.0002;
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
	var start = 0;
	for (var key in sEdges) {
		if (sEdges[parseInt(key)].length > 1) {
			start = parseInt(key);
			break;
		}
	}
	vertices.push(start);

	var findCycle = function(graph, start, prev, v, visited) {
		var neighbors = graph[v];
		visited.add(v);
		var candidates = [];
		for (var i = 0; i < neighbors.length; i++) {
			if (neighbors[i] != prev && neighbors[i] == start) {
				return [neighbors[i]];
			}
			if (neighbors[i] != prev && !visited.has(neighbors[i])) {
				var res = findCycle(graph, start, v, neighbors[i], visited);
				if (res != undefined) {
					candidates.push([neighbors[i]].concat(res));
				}
			}
		}
		// TODO: We need to filter out cycles that show up
		// that aren't the main one. Not sure how though.
		if (candidates.length > 0) {
			var max = candidates[0];
			var maxLen = candidates[0].length;
			for (var i = 1; i < candidates.length; i++) {
				if (candidates[i].length > maxLen) {
					maxLen = candidates[i].length;
					max = candidates[i];
				}
			}
			return max;
		}
		return undefined;
	}

	return findCycle(sEdges, start, start, start, new Set());
}
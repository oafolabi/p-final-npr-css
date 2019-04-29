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
			console.log(vertex, nextVertex);
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
// for performing stroke synthesis based on user's example stroke inputs

var K = Math.pow(10, 4); // constant
var m = 4; // constant
var p = 2;
var alpha = 0.9;
var max_offset = 0;
var offset_list = [];
var starting_indices = [];
var offset_length = 100;

// concatenate all existing stroke offsets into a vector
// denote separators as an undefined offset
// TODO: support range?
function concatStrokes(input_array) {
    var i;
    var y = []; // vector of offsets
    var index = 0;
    starting_indices = [];
    for (i = 0; i < total_strokes; i += 1) {
        index = pushStrokes(input_array[i], y, index);
    }
    offset_list = y;
    return y;
}

// pushes strokes for a particular canvas onto the y-vector
// add 'separator' to end of each example stroke as 'undefined'
function pushStrokes(canvas_inst, y, index) {
    var canvas_strokes = canvas_inst.stroke;
    var i;
    for (i = 0; i <= canvas_strokes.length; i += 1) {
        if (i == canvas_strokes.length) {
            y.push(undefined);
        } else {
            if (i == 0) {
                starting_indices.push(index);
            }
            if (canvas_strokes[i].y > max_offset) {
                max_offset = canvas_strokes[i].y;
            }
            y.push(canvas_strokes[i].y);
        }
        index += 1;
    }
    return index;
}

// construct D matrix, given y-vector
function constructDMat(y) {
    var D = [];
    var i;
    for (i = 0; i < y.length; i += 1) {
        var D_i = [];
        var j;
        for (j = 0; j < y.length; j += 1) {
            D_i.push(evalD_ij(y[i], y[j]));
        }
        D.push(D_i);
    }
    return D;
}

// where D_ij is assigned based on a piecewise function
function evalD_ij(offset_i, offset_j) {
    if (offset_j == undefined) {
        return K;
    } else if (offset_j == offset_i) {
        return 2;
    } else if (offset_i == undefined) {
        return 2;
    } else {
        return Math.abs(offset_i - offset_j);
    }
}

// D', differences between two windows of offsets
function evalD_prime(D) {
    D_prime = [];
    var i;
    for (i = 0; i < D.length; i += 1) {
        var j;
        var D_prime_i = [];
        for (j = 0; j < D[i].length; j += 1) {
            D_prime_i.push(kernel(D, i, j));
        }
        D_prime.push(D_prime_i);
    }
    return D_prime;
}

// Diagonal kernel w_i
function kernel(D, i, j) {
    var sum = 0;
    var k;
    for (k = 0; k <= m; k += 1) {
        sum += (1 / m) * safe_index(D, i - k, j - k);
    }
    return sum;
}

// check if out of bounds
function safe_index(D, i, j){
    if (i < 0 || i >= D.length) {
        return 0;
    }
    if (j < 0 || j >= D[i].length) {
        return 0;
    }
    return D[i][j];
}

// Computing D"
function value_iteration(D_prime) {
    var D_prime2 = [];
    for (i = 0; i < D_prime.length; i++) {
        var D_i = [];
        for (j = 0; j < D_prime[0].length; j++) {
            D_i.push( Math.pow(D_prime[i][j], p)  );
        }
        D_prime2.push(D_i);
    }
    var D_prime2_new = [];
    converged = false;
    var i, j;
    var steps = 0;
    while (!converged) {
        for (i = 0; i < D_prime2.length; i++) {
            var D_i = [];
            for (j = 0; j < D_prime2[0].length; j++) {
                var mj = alpha * Math.min(...D_prime2[j]);
                D_i.push( Math.pow(D_prime[i][j], p) + mj  );
            }
            D_prime2_new.push(D_i);
        }
        if (arraysEqual(D_prime2, D_prime2_new) || steps > 200000) {
            converged = true;
        }
        D_prime2 = D_prime2_new;
        D_prime2_new = [];
        steps += 1;
    }
    
    return D_prime2;
}

// deep equality
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
  
    for (var i = 0; i < a.length; ++i) {
        if (a[i].length != b[i].length) return false;
        for (var j = 0; j < a[i].length; ++j) {
            if (a[i][j] != b[i][j]) return false;
        }
    }
    return true;
}

const arrSum = arr => arr.reduce((a,b) => a + b, 0)

function normalize(P) {
    var sum = 0;
    var i;
    var j;
    for (i = 0; i < P.length; i++) {
        sum += arrSum(P[i]);
    }
    for (i = 0; i < P.length; i++) {
        for (j = 0; j < P.length[0]; j++) {
            P[i][j] /= sum;
        }
    }
    return P;
}

function get_rho(D_prime2) {
    var sum = 0;
    var count = 0;
    var i;
    for (i = 0; i < D_prime2.length; i += 1) {
        var j;
        for (j = 0; j < D_prime2[i].length; j += 1) {
            if (D_prime2[i][j] > 0 && D_prime2[i][j] < max_offset) {
                sum += D_prime2[i][j];
                count += 1;
            }
        }
    }
    return 0.01 * (sum / count);
}

// probability matrix
function P(D_prime2) {
    var rho = get_rho(D_prime2);
    var P_mat = [];
    var i;
    var j;
    for (i = 0; i < D_prime2.length; i++) {
        var P_i = [];
        for (j = 0; j < D_prime2[0].length; j++) {
            P_i.push(  Math.exp(-1*safe_index(D_prime2, i+1, j)/rho));
        }
        P_mat.push(P_i);
    }
    return normalize(P_mat);
}

// Random helper method
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// Sample from the distribution given by [P], conditioned on row i
function sample(i, P_mat) {
    // if (i >= P_mat.length) {
    //     console.log(i);
    //     console.log(P_mat.length);
    //     console.log("bad news");
    // } else {
    //     console.log("its ok");
    // }
    var row = P_mat[i];
    var CDF = [];
    var j;
    var sum = arrSum(row);
    for (j = 0; j < row.length; j++) {
        row[j] /= sum;
    }
    for (j = 0; j < row.length; j++) {
        if (j == 0) {
            CDF.push(row[j]);
        } else {
            CDF.push(row[j] + CDF[j-1]);
        }
    }
    var CDFindex = 0;
    var s = Math.random();
    while (CDF[CDFindex] <= s) {
        CDFindex++;
    }
    return Math.max(0, Math.min(CDFindex, row.length-1));
}

// given list of canvas inputs, generate probablity matrix for synthesized strokes
function get_MRF(input) {
    return P( value_iteration( evalD_prime( constructDMat( concatStrokes(input) ) ) ) );
}

// given desired number of offsets, synthesize new stroke
function synthesize_stroke(offset_num, P_mat) {
    var prev_index = starting_indices[getRandomInt(0, starting_indices.length)];
    var gen_stroke = [new THREE.Vector2(0, offset_list[prev_index])];
    var ind = 1;

    while (gen_stroke.length < offset_num) {
        next_index = sample(prev_index, P_mat);
        console.log(next_index);
        gen_stroke.push(new THREE.Vector2(ind, offset_list[prev_index]));
        prev_index = next_index;
        ind++;
    }
    return gen_stroke;
}

// generate synthesized stroke, based on desired number of new strokes
function gen_synth(stroke_num) {
    var P_mat = get_MRF(canvas_array);
    var i;
    var strokes = [];
    for (i = 0; i < stroke_num; i += 1) {
        new_input();
        var cb = canvas_array[canvas_array.length-1];
        cb.stroke = synthesize_stroke(offset_length, P_mat);
        cb.rerender();
    }
}
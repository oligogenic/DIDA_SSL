'use strict';
/** @license
* The MIT License (MIT)
* Copyright (c) 2015 Andrej Karpathy
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

//goog.provide('tsnejs');

/**
*  @type {string}
*/
//tsnejs.REVISION = 'ALPHA';
const tsnejs = {}

// utility function
const assert = (condition, message) => {
    if (!condition) { throw message || 'Assertion failed'; }
}


// syntax sugar
const getopt = (opt, field, defaultval) => {
    return (opt.hasOwnProperty(field)) ? opt[field] : defaultval;
};

// return 0 mean unit standard deviation random number
let return_v = false;
let v_val = 0.0;

function gaussRandom(rng) {
    if (return_v) {
        return_v = false;
        return v_val;
    }
    const u = 2 * rng() - 1;
    const v = 2 * rng() - 1;
    const r = u * u + v * v;

    // One does not want exact values or values greater than one
    if (r == 0 || r > 1) return gaussRandom(rng);

    const c = Math.sqrt(-2 * Math.log(r) / r);
    v_val = v * c; // cache this for next function call for efficiency
    return_v = true;
    return u * c;
};

// return random normal number
const randn = (rng, mu, std) => mu + gaussRandom(rng) * std;

// utilitity that creates contiguous vector of zeros of size n
function zeros(n) {
    if (typeof(n) === 'undefined' || isNaN(n)) { return []; }
    if (typeof ArrayBuffer === 'undefined') {
        // lacking browser support
        const arr = new Array(n);
        for (let i = 0; i < n; i++) { arr[i] = 0; }
        return arr;
    } else {
        return new Float64Array(n); // typed arrays are faster
    }
};

// utility that returns 2d array filled with random numbers from generator rng
function randn2d(n, d, rng) {
    const x = [];
    for (let i = 0; i < n; i++) {
        const xhere = [];
        for (let j = 0; j < d; j++) {
            xhere.push(randn(rng, 0.0, 1e-4));
        }
        x.push(xhere);
    }
    return x;
};

// utility that returns 2d array filled with value s
function arrayofs(n, d, s) {
    const x = [];
    for (let i = 0; i < n; i++) {
        const xhere = [];
        for (let j = 0; j < d; j++) {
            xhere.push(s);
        }
        x.push(xhere);
    }
    return x;
};

// compute L2 distance between two vectors
function L2(x1, x2) {
    const D = x1.length;
    let d = 0;
    for (let i = 0; i < D; i++) {
        const x1i = x1[i];
        const x2i = x2[i];
        d += (x1i - x2i) * (x1i - x2i);
    }
    return d;
};

// compute pairwise distance in all vectors in X
function xtod(X) {
    const N = X.length;
    const dist = zeros(N * N); // allocate contiguous array
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            const d = L2(X[i], X[j]);
            dist[i * N + j] = d;
            dist[j * N + i] = d;
        }
    }
    return dist;
};

// compute (p_{i|j} + p_{j|i})/(2n)
function d2p(D, perplexity, tol) {

    // this better be an integer
    const Nf = Math.sqrt(D.length);
    const N = Math.floor(Nf);
    assert(N === Nf, 'D should have square number of elements.');

    const Htarget = Math.log(perplexity); // target entropy of distribution
    const P = zeros(N * N); // temporary probability matrix

    const prow = zeros(N); // a temporary storage compartment
    for (let i = 0; i < N; i++) {
        let betamin = -Infinity;
        let betamax = Infinity;
        let beta = 1; // initial value of precision
        let done = false;
        const maxtries = 50;

        // perform binary search to find a suitable precision beta
        // so that the entropy of the distribution is appropriate
        let num = 0;
        while (!done) {
            //debugger;

            // compute entropy and kernel row with beta precision
            let psum = 0.0;
            for (let j = 0; j < N; j++) {
                let pj = Math.exp(- D[i * N + j] * beta);
                if (i === j) { pj = 0; } // we dont care about diagonals
                prow[j] = pj;
                psum += pj;
            }
            // normalize p and compute entropy
            let Hhere = 0.0;
            for (var j = 0; j < N; j++) {
                let pj = prow[j] / psum;
                prow[j] = pj;
                if (pj > 1e-7) Hhere -= pj * Math.log(pj);
            }

            // adjust beta based on result
            if (Hhere > Htarget) {
                // entropy was too high (distribution too diffuse)
                // so we need to increase the precision for more peaky distribution
                betamin = beta; // move up the bounds
                if (betamax === Infinity) { beta = beta * 2; }
                else { beta = (beta + betamax) / 2; }

            } else {
                // converse case. make distrubtion less peaky
                betamax = beta;
                if (betamin === -Infinity) { beta = beta / 2; }
                else { beta = (beta + betamin) / 2; }
            }

            // stopping conditions: too many tries or got a good precision
            num++;
            if (Math.abs(Hhere - Htarget) < tol) { done = true; }
            if (num >= maxtries) { done = true; }
        }

        // copy over the final prow to P at row i
        for (var j = 0; j < N; j++) { P[i * N + j] = prow[j]; }

    } // end loop over examples i

    // symmetrize P and normalize it to sum to 1 over all ij
    const Pout = zeros(N * N);
    const N2 = N * 2;
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            Pout[i * N + j] = Math.max((P[i * N + j] + P[j * N + i]) / N2, 1e-100);
        }
    }

    return Pout;
};

// helper function
function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

/**
* @param {?Object} opt Options.
* @constructor
*/
class tSNE {
    constructor(opt) {
        opt = opt || {};
        this.perplexity = getopt(opt, 'perplexity', 30);
        this.dim = getopt(opt, 'dim', 2); // by default 2-D tSNE
        this.epsilon = getopt(opt, 'epsilon', 10); // learning rate
        this.rng = getopt(opt, 'rng', Math.random);

        this.iter = 0;
    }

    // this function takes a set of high-dimensional points
    // and creates matrix P from them using gaussian kernel
    initDataRawn(X) {
        const N = X.length;
        const D = X[0].length;
        assert(N > 0, ' X is empty? You must have some data!');
        assert(D > 0, ' X[0] is empty? Where is the data?');
        const dists = xtod(X); // convert X to distances using gaussian kernel
        this.P = d2p(dists, this.perplexity, 1e-4); // attach to object
        this.N = N; // back up the size of the dataset
        this.initSolution(); // refresh this
    }

    // this function takes a fattened distance matrix and creates
    // matrix P from them.
    // D is assumed to be provided as an array of size N^2.
    initDataDist(D) {
        const N = Math.sqrt(D.length);
        this.P = d2p(D, this.perplexity, 1e-4);
        this.N = N;
        this.initSolution(); // refresh this
    }

    // (re)initializes the solution to random
    initSolution() {
        // generate random solution to t-SNE
        this.Y = randn2d(this.N, this.dim, this.rng); // the solution
        this.gains = arrayofs(this.N, this.dim, 1.0); // step gains
        // to accelerate progress in unchanging directions
        this.ystep = arrayofs(this.N, this.dim, 0.0); // momentum accumulator
        this.iter = 0;
    },

    // return pointer to current solution
    getSolution() {
        return this.Y;
    },

    // perform a single step of optimization to improve the embedding
    step() {
        this.iter += 1;
        const N = this.N;

        const cg = this.costGrad(this.Y); // evaluate gradient
        const cost = cg.cost;
        const grad = cg.grad;

        // perform gradient step
        const ymean = zeros(this.dim);
        for (let i = 0; i < N; i++) {
            for (let d = 0; d < this.dim; d++) {
                const gid = grad[i][d];
                const sid = this.ystep[i][d];
                const gainid = this.gains[i][d];

                // compute gain update
                const newgain = sign(gid) === sign(sid) ? gainid * 0.8 : gainid + 0.2;
                if (newgain < 0.01) newgain = 0.01; // clamp
                this.gains[i][d] = newgain; // store for next turn

                // compute momentum step direction
                const momval = this.iter < 250 ? 0.5 : 0.8;
                const newsid = momval * sid - this.epsilon * newgain * grad[i][d];
                this.ystep[i][d] = newsid; // remember the step we took

                // step!
                this.Y[i][d] += newsid;

                ymean[d] += this.Y[i][d]; // accumulate mean so that we
                // can center later
            }
        }

        // reproject Y to be zero mean
        for (var i = 0; i < N; i++) {
            for (var d = 0; d < this.dim; d++) {
                this.Y[i][d] -= ymean[d] / N;
            }
        }

        //if(this.iter%100===0) console.log('iter ' + this.iter + ',
        //cost: ' + cost);
        return cost; // return current cost
    }

    // for debugging: gradient check
    debugGrad() {
        const N = this.N;

        const cg = this.costGrad(this.Y); // evaluate gradient
        const cost = cg.cost;
        const grad = cg.grad;

        const e = 1e-5;
        for (let i = 0; i < N; i++) {
            for (let d = 0; d < this.dim; d++) {
                const yold = this.Y[i][d];

                this.Y[i][d] = yold + e;
                const cg0 = this.costGrad(this.Y);

                this.Y[i][d] = yold - e;
                const cg1 = this.costGrad(this.Y);
                const analytic = grad[i][d];
                const numerical = (cg0.cost - cg1.cost) / (2 * e);
                console.log(i + ',' + d + ': gradcheck analytic: ' + analytic +
                ' vs. numerical: ' + numerical);

                this.Y[i][d] = yold;
            }
        }
    }

    // return cost and gradient, given an arrangement
    costGrad(Y) {
        const N = this.N;
        const dim = this.dim; // dim of output space
        const P = this.P;

        const pmul = this.iter < 100 ? 4 : 1; // trick that helps with local optima

        // compute current Q distribution, unnormalized first
        const Qu = zeros(N * N);
        let qsum = 0.0;
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dsum = 0.0;
                for (let d = 0; d < dim; d++) {
                    const dhere = Y[i][d] - Y[j][d];
                    dsum += dhere * dhere;
                }
                const qu = 1.0 / (1.0 + dsum); // Student t-distribution
                Qu[i * N + j] = qu;
                Qu[j * N + i] = qu;
                qsum += 2 * qu;
            }
        }

        let cost = 0.0;
        const grad = [];
        for (let i = 0; i < N; i++) {
            const gsum = new Array(dim); // init grad for point i
            for (let d = 0; d < dim; d++) { gsum[d] = 0.0; }
            for (let j = 0; j < N; j++) {
                const normedProb = Math.max(Qu[i * N + j] / qsum, 1e-100);
                cost += - P[i * N + j] * Math.log(normedProb); // accumulate cost
                const premult = 4 * (pmul * P[i * N + j] - normedProb) * Qu[i * N + j];
                for (let d = 0; d < dim; d++) {
                    gsum[d] += premult * (Y[i][d] - Y[j][d]);
                }
            }
            grad.push(gsum);
        }

        return {cost: cost, grad: grad};
    }
};

tsnejs.tSNE = tSNE; // export tSNE class
if(typeof module != "undefined")  module.exports = tsnejs

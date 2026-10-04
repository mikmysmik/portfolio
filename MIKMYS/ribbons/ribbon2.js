const points = [
  [4.898, 0.535, 1.002],
  [3.811, 0.194, 1.042],
  [3.468, -0.072, 0.540],
  [2.971, -1.007, -0.608],
  [2.204, -1.386, -0.075],
  [1.348, -1.440, 0.793],
  [0.062, -1.456, 1.191],
  [-1.450, -1.529, 0.392],
  [-2.357, -0.819, 0.917],
  [-2.039, 0.297, 1.036],
  [-1.371, -0.081, 0.664],
  [-2.217, -0.480, -0.051],
  [-2.930, 0.163, -0.068],
  [-2.939, 0.642, 0.096],
  [-2.651, 1.239, 0.381],
  [-2.315, 1.802, 0.698],
  [-2.181, 2.180, 0.954],
  [-2.968, 3.349, 0.687],
  [-3.502, 4.360, 0.230],
];

const width = [
    { point: 0,  w: 0.80 },
    { point: 2,  w: 1.90 },

    { point: 3,  w: 1.30 },

    { point: 6,  w: 1.30 },
    { point: 8,  w: 1.50 },
    { point: 9,  w: 1.20 },
    { point: 11,  w: 0.90 },

    { point: 12, w: 0.85 },
    { point: 13, w: 1.15 },

    { point: 15, w: 1.10 },
    { point: 16, w: 1.10 },
    { point: 17, w: 0.90 },

    { point: 19, w: 0.50 },

];
const rotations = [
    { point: 1,  angle: 0 },
    { point: 3,  angle:  Math.PI/2},
    { point: 7,  angle:  0},
    { point: 11,  angle:  Math.PI/2},
    { point: 12,  angle:  Math.PI/3},
    { point: 14,  angle:-  Math.PI/3},
    { point: 15,  angle:- Math.PI/2},
    { point: 16,  angle: - Math.PI/2},
    { point: 17,  angle: - Math.PI/2},

];

const transformDesktop = {
    scale: {
        x: 2.75,
        y: 1.95,
        z: 3.45
    },

    offset: {
        x: -2,
        y: -2,
        z: 0
    }
};

const transformMobile = {
    scale: {
        x: 1.8,
        y: 2,
        z: 2.2
    },

    offset: {
        x: 1.5,
        y: -2,
        z: 2
    }
};

const color = 0xf3efd3;

const segments = 1000;

const reverseProgress = true;


export default {
    points,
    width,
    rotations,

    transformDesktop,
    transformMobile,

    color,
    segments,
    reverseProgress
};
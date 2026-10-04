
const points = [
    [-2.759, 1.931, 0.160],
    [-1.163, 0.702, -0.429],
    [-0.442, -0.287, -0.479],
    [0.277, -0.699, -0.078],
    [0.736, -0.815, 0.348],
    [1.385, -1.047, -0.287],
    [2.184, -0.910, -0.384],
    [2.345, 0.325, 0.061],
    [1.726, 0.831, 0.415],
    [2.517, 1.620, -0.117],
];

const width = [
    { point: 0,  w: 0.60 },
    { point: 2,  w: 0.40 },

    { point: 3,  w: 1.30 },

    { point: 6,  w: 1.30 },
    { point: 8,  w: 0.90 },
    { point: 9,  w: 0.60 },

];


const transform = {
    scale: {
        x: 2.65,
        y: 2.35,
        z: 1.25
    },

    offset: {
        x: 0,
        y: 0,
        z: 0
    }
};

const color = 0x4f7fff;

const segments = 1000;

const reverseProgress = true;


export default {
    points,
    width,
    transform,
    color,
    segments,
    reverseProgress
};
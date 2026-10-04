const points = [
    [-6,-2,0],        // 0
    [-4.5,-1.5,1.2],  // 1
    [-3.8,0,1.8],     // 2
    [-3.3,1.3,1.4],   // 3
    [-3,2,0],         // 4
    [-2.9,1.5,-1],    // 5
    [-2.6,-0.5,-1],   // 6
    [-2.16,-0.3,0.58],// 7
    [-1.87,0.3,0],    // 8
    [-1.64,0,-1],     // 9
    [-1.3,-1,-1.4],   // 10
    [-0.6,-2.3,0],    // 11
    [0,-2,1.3],       // 12
    [0.68,-1,2.1],    // 13
    [1.1,0,2.3],      // 14
    [1.4,1,2.1],      // 15
    [1.8,2.3,0],      // 16
    [2.1,1.4,-1],     // 17
    [2.5,0.5,0],      // 18
    [3,2.1,0],        // 19
    [3.3,1.8,-0.4],   // 20
    [3.9,1.4,0],      // 21
    [4.5,1.7,0.7],    // 22
    [5.3,2.6,0.7],    // 23
    [5.6,3,0],        // 24
    [6.2,3.5,-0.3]    // 25
];

const width = [
    { point: 0,  w: 0.80 },
    { point: 1,  w: 0.90 },

    { point: 3,  w: 1.30 },
    

    { point: 6,  w: 1.00 },
    { point: 7,  w: 0.90 },
    { point: 8,  w: 0.80 },

    { point: 10, w: 0.80 },
    { point: 11, w: 1.10 },
    { point: 12, w: 1.15 },

    { point: 13, w: 1.59 },
    { point: 14, w: 1.85 },
    { point: 15, w: 1.90 },

    { point: 16, w: 1.70 },

    { point: 18, w: 0.80 },
    { point: 20, w: 0.90 },

    { point: 21, w: 0.50 },

    { point: 24, w: 0.90 }
];

const rotations = [
    { point: 7,  angle: 0 },
    { point: 8,  angle: - Math.PI / 2 },
    { point: 10,  angle: 0 },
    { point: 16,  angle: 0 },                 
    { point: 18,  angle: - Math.PI / 2 },        
    { point: 21, angle:  - Math.PI},           
    { point: 23, angle:  0}                   
];
const transform = {
    scale: {
        x: 2.10,
        y: 1.35,
        z: 3.00
    },

    offset: {
        x: 0,
        y: 0,
        z: 0
    }
};

const color = 0xf3efd3;

const segments = 1000;

export default {
    points,
    width,
    rotations, 
    transform,
    color,
    segments
};
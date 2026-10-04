import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180/build/three.module.js";
const _side = new THREE.Vector3();
const _left = new THREE.Vector3();
const _right = new THREE.Vector3();
const _offset = new THREE.Vector3();
export default class RibbonGeometry extends THREE.BufferGeometry {

    constructor({

        frames,
        width = 0.2,
        twist = () => 0,
        start = 0,
        length = 1,
        pointCount = 28

    }) {

        super();

        this.frames = frames;
        this.segments = frames.segments;
        this.start = start;
        this.length = length;
        this.pointCount = pointCount;
        this.widthFunction = 
          typeof width === "function"
          ? width
          : () => width;
        this.twist = twist;
        this.positions = [];
        this.normals = [];
        this.uvs = [];
        this.indices = [];

        this.build();

    }

    build() {
        this.buildVertices();
        this.buildIndices();

        this.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(this.positions, 3)
        );
        this.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(this.uvs, 2)
        );
        this.setIndex(this.indices);
        this.computeVertexNormals();
        this.computeBoundingSphere();
    }

    buildVertices() {
        for (let i = 0; i <= this.segments; i++) {
            const u = i / this.segments;
            const t = this.start + u * this.length;

            const frame = this.frames.getFrameAt(t);
            const point = frame.point;
            const tangent = frame.tangent;
            
            _side.copy(frame.normal);

            if (_side.lengthSq() < 0.00001) {
                _side.set(1, 0, 0);
            }
            _side.normalize();

            const clampedT = THREE.MathUtils.clamp(t, 0, 1);
            const pointIndex = clampedT * this.pointCount;

            const half = this.widthFunction(pointIndex) * 0.5;
            
            const angle = this.twist(pointIndex); 

            _side.applyAxisAngle(tangent, angle);

            _offset.copy(_side).multiplyScalar(half);
            _left.copy(point).add(_offset);
            
            _offset.copy(_side).multiplyScalar(-half);
            _right.copy(point).add(_offset);

            this.positions.push(_left.x, _left.y, _left.z);
            this.positions.push(_right.x, _right.y, _right.z);

            this.uvs.push(0, t);
            this.uvs.push(1, t);
        }
    }


    buildIndices() {

        for (let i = 0; i < this.segments; i++) {

            const a = i * 2;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;

            this.indices.push(a, c, b);
            this.indices.push(c, d, b);

        }

    }

    updateProgress(progress) {
        
        const totalIndices = this.index.count; 
        const drawCount = Math.floor(totalIndices * THREE.MathUtils.clamp(progress, 0, 1));

        if (this.reverseProgress) {
            const startTriangle = totalIndices - drawCount;
            const alignedStart = startTriangle - (startTriangle % 3);
            
            this.setDrawRange(alignedStart, totalIndices - alignedStart);
        } else {
            const alignedCount = drawCount - (drawCount % 3);
            
            this.setDrawRange(0, alignedCount);
        }
    }


}
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180/build/three.module.js";
const _tmpPoint = new THREE.Vector3();
const _tmpTangent = new THREE.Vector3();
const _tmpNormal = new THREE.Vector3();
const _tmpBinormal = new THREE.Vector3();
const _frameResult = {
    point: _tmpPoint,
    tangent: _tmpTangent,
    normal: _tmpNormal,
    binormal: _tmpBinormal
};

export default class RibbonFrames {

    constructor(curve, segments = 200) {

        this.curve = curve;
        this.segments = segments;

        this.points = [];
        this.tangents = [];
        this.normals = [];
        this.binormals = [];

        this.compute();
    }
    
    getFrameAt(t) {
        t = THREE.MathUtils.clamp(t, 0, 1);
        const f = t * this.segments;
        const i0 = Math.floor(f);
        const i1 = Math.min(i0 + 1, this.segments);
        const alpha = f - i0;

        _tmpPoint.copy(this.points[i0]).lerp(this.points[i1], alpha);
        _tmpTangent.copy(this.tangents[i0]).lerp(this.tangents[i1], alpha).normalize();
        _tmpNormal.copy(this.normals[i0]).lerp(this.normals[i1], alpha).normalize();
        _tmpBinormal.copy(this.binormals[i0]).lerp(this.binormals[i1], alpha).normalize();

        return _frameResult;
    };


    compute() {


        for (let i = 0; i <= this.segments; i++) {

            const t = i / this.segments;

            this.points.push(
                this.curve.getPointAt(t)
            );

            this.tangents.push(
                this.curve
                    .getTangentAt(t)
                    .normalize()
            );
        }


        const tangent0 = this.tangents[0];

        const up = new THREE.Vector3(0, 0, 1);

        let normal = new THREE.Vector3()
            .crossVectors(up, tangent0);

        if(Math.abs(tangent0.dot(up)) > 0.9){
            up.set(0,1,0);
        }

        normal.normalize();

        let binormal = new THREE.Vector3()
            .crossVectors(tangent0, normal)
            .normalize();

        this.normals[0] = normal;
        this.binormals[0] = binormal;


        for (let i = 1; i <= this.segments; i++) {

            const prevTangent = this.tangents[i - 1];
            const tangent = this.tangents[i];

            const axis = new THREE.Vector3()
                .crossVectors(prevTangent, tangent);

            if (axis.lengthSq() < 1e-8) {

                this.normals[i] =
                    this.normals[i - 1].clone();

                this.binormals[i] =
                    this.binormals[i - 1].clone();

                continue;
            }

            axis.normalize();

            const angle = Math.acos(
                THREE.MathUtils.clamp(
                    prevTangent.dot(tangent),
                    -1,
                    1
                )
            );

            const q = new THREE.Quaternion()
                .setFromAxisAngle(
                    axis,
                    angle
                );

            this.normals[i] =
                this.normals[i - 1]
                    .clone()
                    .applyQuaternion(q);

            this.binormals[i] =
                this.binormals[i - 1]
                    .clone()
                    .applyQuaternion(q);
            
            this.normals[i]
                .addScaledVector(
                    tangent,
                    -this.normals[i].dot(tangent)
                )
                .normalize();
            
            this.binormals[i]
                .crossVectors(
                    tangent,
                    this.normals[i]
                )
                .normalize();
            
        }
        
    }

    
}
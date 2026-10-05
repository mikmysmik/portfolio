import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function createNailPolish({
    scene,
    camera,
    section
}) {

    // ============================================
    // MODEL
    // ============================================

    let nailPolish = null;
    let mixer = null;
    let animationAction = null;

    let mouseOver = false;
    let targetProgress = 0;
    let progress = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let cachedOffsetTop = section.offsetTop;
    let cachedHeight = section.offsetHeight;

    function cacheSection() {
        cachedOffsetTop = section.offsetTop;
        cachedHeight = section.offsetHeight;
    }

    window.addEventListener("resize", () => {
        cacheSection();
        updateResponsivePosition();
        updateResponsiveScale();
    }, { passive: true });


    // ============================================
    // CAMERA SETTINGS
    // ============================================

    const viewHeight = 9.2376;


    // ============================================
    // LOCAL POSITION INSIDE SECTION
    // ============================================
    const desktopPosition = {
        x: 6.5,
        y: -1.5,
        z: 2
    };

    const mobilePosition = {
        x: 1,
        y: -2,
        z: 2
    };

    let localPosition = window.innerWidth <= 768
        ? { ...mobilePosition }
        : { ...desktopPosition };

    function updateResponsivePosition() {
        const isMobile = window.innerWidth <= 768;

        localPosition = isMobile
            ? { ...mobilePosition }
            : { ...desktopPosition };

        if (nailPolish) {
            nailPolish.position.set(
                localPosition.x,
                localPosition.y,
                localPosition.z
            );
        }
    }


    // ============================================
    // RESPONSIVE SCALE
    // ============================================

    const desktopScale = 0.35;
    const mobileScale = 0.15;

    function updateResponsiveScale() {
        if (!nailPolish) return;

        const isMobile = window.innerWidth <= 768;

        nailPolish.scale.setScalar(
            isMobile ? mobileScale : desktopScale
        );
    }


    // ============================================
    // LOADER
    // ============================================

    const loader = new GLTFLoader();

    loader.load(
        "./models/nail_polish.glb",

        (gltf) => {
            nailPolish = gltf.scene;

            // ANIMATION
            mixer = new THREE.AnimationMixer(nailPolish);

            if (gltf.animations.length > 0) {
                animationAction = mixer.clipAction(gltf.animations[0]);

                animationAction.setLoop(THREE.LoopOnce, 1);
                animationAction.clampWhenFinished = true;
                animationAction.play();
                animationAction.paused = true;
                animationAction.time = 0;

                mixer.update(0);
            }

            // SCALE
            updateResponsiveScale();

            // START POSITION
            nailPolish.position.set(
                localPosition.x,
                localPosition.y,
                localPosition.z
            );

            // ADD TO SCENE
            scene.add(nailPolish);

            // HIDE
            nailPolish.visible = false;
        },

        undefined,

        (error) => {
            console.error("NAIL POLISH ERROR:", error);
        }
    );


    // ============================================
    // HOVER
    // ============================================

    function onMouseMove(event) {
        if (!nailPolish || !nailPolish.visible) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(nailPolish, true);
        const isOver = intersects.length > 0;

        if (isOver && !mouseOver) {
            mouseOver = true;
            targetProgress = 1;
        } else if (!isOver && mouseOver) {
            mouseOver = false;
            targetProgress = 0;
        }
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });


    // ============================================
    // UPDATE
    // ============================================

    function update(delta) {

        if (!nailPolish) {
            return;
        }

        const scrollY = window.scrollY;
        const vh = window.innerHeight;

        const isMobile = window.innerWidth <= 768;


        // ========================================
        // VISIBILITY
        // ========================================

        const relativeTop =
            cachedOffsetTop - scrollY;

        const relativeBottom =
            relativeTop + cachedHeight;


        if (
            relativeBottom <= 0 ||
            relativeTop >= vh
        ) {
            nailPolish.visible = false;
            return;
        }


        // ========================================
        // SHOW MODEL
        // ========================================

        nailPolish.visible = true;


        // ========================================
        // POSITIONING
        // ========================================

        const sectionCenterY =
            relativeTop + cachedHeight / 2;

        const screenCenterY =
            vh / 2;

        const offsetPixelsY =
            sectionCenterY - screenCenterY;

        const offsetWorldY =
            (offsetPixelsY * viewHeight) / vh;


        nailPolish.position.x =
            localPosition.x;

        nailPolish.position.y =
            localPosition.y - offsetWorldY;

        nailPolish.position.z =
            localPosition.z;


        // ========================================
        // MOBILE SCROLL TRIGGER
        // ========================================

        if (isMobile) {

            const triggerY = vh * 0.5;
            const triggerZone = 70;

            const nailPolishScreenY =
                screenCenterY -
                (nailPolish.position.y - localPosition.y)
                * vh / viewHeight;

            if (
                nailPolishScreenY >= triggerY - triggerZone &&
                nailPolishScreenY <= triggerY + triggerZone
            ) {
                targetProgress = 1;
            } else {
                targetProgress = 0;
            }
        }


        // ========================================
        // ANIMATION UPDATE
        // ========================================

        if (animationAction) {

            progress = THREE.MathUtils.damp(
                progress,
                targetProgress,
                0.5,
                delta
            );

            const duration =
                animationAction.getClip().duration;

            animationAction.time =
                progress * duration;

            mixer.update(0);
        }
    }


    // ============================================
    // RETURN
    // ============================================

    return {
        update,
        get mesh() {
            return nailPolish;
        },
        setTargetProgress(value) {
            targetProgress = value;
        }
    };
}
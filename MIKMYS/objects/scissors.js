import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function createScissors({
    scene,
    camera,
    section
}) {

    // ============================================
    // MODEL & STATE
    // ============================================

    let scissors = null;
    let mixer = null;
    let openAction = null;

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
        x: 2.1,
        y: -1.7,
        z: 2
    };

    const mobilePosition = {
        x: -0.8,
        y: -0.5,
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

        if (scissors) {
            scissors.position.set(
                localPosition.x,
                localPosition.y,
                localPosition.z
            );
        }
    }


    // ============================================
    // RESPONSIVE SCALE
    // ============================================

    const desktopScale = 0.4;
    const mobileScale = 0.195;

    function updateResponsiveScale() {
        if (!scissors) return;

        const isMobile = window.innerWidth <= 768;

        scissors.scale.setScalar(
            isMobile ? mobileScale : desktopScale
        );
    }


    // ============================================
    // LOADER
    // ============================================

    const loader = new GLTFLoader();

    loader.load(
        "./models/scissors.glb",

        (gltf) => {
            scissors = gltf.scene;

            // ========================================
            // ANIMATION
            // ========================================

            mixer = new THREE.AnimationMixer(scissors);

            if (gltf.animations.length > 0) {

                openAction = mixer.clipAction(
                    gltf.animations[0]
                );

                openAction.setLoop(
                    THREE.LoopOnce,
                    1
                );

                openAction.clampWhenFinished = true;

                openAction.play();

                openAction.paused = true;

                openAction.time = 0;

                mixer.update(0);
            }


            // ========================================
            // SCALE
            // ========================================

            updateResponsiveScale();


            // ========================================
            // START POSITION
            // ========================================

            scissors.position.set(
                localPosition.x,
                localPosition.y,
                localPosition.z
            );


            // ========================================
            // ADD TO SCENE
            // ========================================

            scene.add(scissors);


            // ========================================
            // HIDE INITIALLY
            // ========================================

            scissors.visible = false;
        },

        undefined,

        (error) => {
            console.error(
                "Ошибка загрузки scissors.glb:",
                error
            );
        }
    );


    // ============================================
    // HOVER
    // ============================================

    function onMouseMove(event) {

        if (!scissors || !scissors.visible) {
            return;
        }

        mouse.x =
            (event.clientX / window.innerWidth) * 2 - 1;

        mouse.y =
            -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(
            mouse,
            camera
        );

        const intersects =
            raycaster.intersectObject(
                scissors,
                true
            );

        const isOver =
            intersects.length > 0;


        if (isOver && !mouseOver) {

            mouseOver = true;

            targetProgress = 1;

        } else if (!isOver && mouseOver) {

            mouseOver = false;

            targetProgress = 0;
        }
    }

    window.addEventListener(
        "mousemove",
        onMouseMove,
        { passive: true }
    );

    // ============================================
    // UPDATE
    // ============================================

    function update(delta) {

        if (!scissors) {
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
            scissors.visible = false;
            return;
        }


        // ========================================
        // SHOW MODEL
        // ========================================

        scissors.visible = true;


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


        scissors.position.x =
            localPosition.x;

        scissors.position.y =
            localPosition.y - offsetWorldY;

        scissors.position.z =
            localPosition.z;


        // ========================================
        // MOBILE SCROLL TRIGGER
        // ========================================

        if (isMobile) {

            const triggerY = vh * 0.65;
            const triggerZone = 70;


            const scissorsScreenY =
                screenCenterY -
                (scissors.position.y - localPosition.y)
                * vh / viewHeight;

            if (
                scissorsScreenY >= triggerY - triggerZone &&
                scissorsScreenY <= triggerY + triggerZone
            ) {

                targetProgress = 1;

            } else {

                targetProgress = 0;
            }
        }


        // ========================================
        // ANIMATION UPDATE
        // ========================================

        if (openAction) {

            progress = THREE.MathUtils.damp(
                progress,
                targetProgress,
                1.5,
                delta
            );

            const duration =
                openAction.getClip().duration;

            openAction.time =
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
            return scissors;
        },

        setTargetProgress(value) {
            targetProgress = value;
        }

    };
}
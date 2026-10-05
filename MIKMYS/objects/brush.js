import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function createBrush({
    scene,
    camera,
    section
}) {

    // ============================================
    // MODEL & STATE
    // ============================================

    let brush = null;
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
        x: -4.5,
        y: -2.7,
        z: 2
    };


    
    const mobilePosition = {
        x: 0.5,
        y: 0.6,
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

        if (brush) {
            brush.position.set(
                localPosition.x,
                localPosition.y,
                localPosition.z
            );
        }
    }


    // ============================================
    // RESPONSIVE SCALE
    // ============================================

    const desktopScale = 0.55;
    const mobileScale = 0.25;

    function updateResponsiveScale() {
        if (!brush) return;

        const isMobile = window.innerWidth <= 768;

        brush.scale.setScalar(
            isMobile ? mobileScale : desktopScale
        );
    }


    // ============================================
    // LOADER
    // ============================================

    const loader = new GLTFLoader();

    loader.load(
        "./models/brush.glb",

        (gltf) => {
            brush = gltf.scene;

            // ANIMATION
            mixer = new THREE.AnimationMixer(brush);

            if (gltf.animations.length > 0) {

                openAction = mixer.clipAction(gltf.animations[0]);

                openAction.setLoop(THREE.LoopOnce, 1);
                openAction.clampWhenFinished = true;
                openAction.play();
                openAction.paused = true;
                openAction.time = 0;

                mixer.update(0);
            }

            // SCALE
            updateResponsiveScale();

            // START POSITION
            brush.position.set(
                localPosition.x,
                localPosition.y,
                localPosition.z
            );

            // ADD TO SCENE
            scene.add(brush);

            // HIDE
            brush.visible = false;
        },

        undefined,

        (error) => {
            console.error("Ошибка загрузки brush.glb:", error);
        }
    );


    // ============================================
    // HOVER
    // ============================================

    function onMouseMove(event) {
        if (!brush || !brush.visible) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(brush, true);
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
        if (!brush) return;

        const scrollY = window.scrollY;
        const vh = window.innerHeight;

        const relativeTop = cachedOffsetTop - scrollY;
        const relativeBottom = relativeTop + cachedHeight;

        if (relativeBottom <= 0 || relativeTop >= vh) {
            brush.visible = false;
            return;
        }

        brush.visible = true;

        // ============================================
        // POSITIONING
        // ============================================

        const sectionCenterY = relativeTop + cachedHeight / 2;
        const screenCenterY = vh / 2;

        const offsetPixelsY = sectionCenterY - screenCenterY;
        const offsetWorldY = (offsetPixelsY * viewHeight) / vh;

        brush.position.x = localPosition.x;
        brush.position.y = localPosition.y - offsetWorldY;
        brush.position.z = localPosition.z;


        // ============================================
        // MOBILE SCROLL TRIGGER
        // ============================================

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {

            const brushScreenY =
                screenCenterY -
                (brush.position.y - localPosition.y) * vh / viewHeight;

            const triggerY = vh * 1;

            const threshold = 30;

            if (brushScreenY <= triggerY + threshold) {
                targetProgress = 1;
            } else {
                targetProgress = 0;
            }
        }


        // ============================================
        // DESKTOP HOVER
        // ============================================

        if (openAction) {

            progress = THREE.MathUtils.damp(
                progress,
                targetProgress,
                0.8,
                delta
            );

            const duration = openAction.getClip().duration;

            openAction.time = progress * duration;

            mixer.update(0);
        }
    }


    // ============================================
    // RETURN
    // ============================================

    return {
        update,

        get mesh() {
            return brush;
        },

        setTargetProgress(value) {
            targetProgress = value;
        }
    };
}
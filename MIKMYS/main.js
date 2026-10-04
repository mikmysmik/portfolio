import * as THREE from "three";

import RibbonGeometry from "./RibbonGeometry.js";
import RibbonFrames from "./RibbonFrames.js";

import ribbon1 from "./ribbons/ribbon1.js";
import ribbon2 from "./ribbons/ribbon2.js";

import { createNailPolish } from "./objects/nailPolish.js";
import { createScissors } from "./objects/scissors.js";
import { createBrush } from "./objects/brush.js";

import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";


// ============================================================
// SCENE
// ============================================================

const scene = new THREE.Scene();


// ============================================================
// CAMERA
// ============================================================

const viewHeight = 9.2376;

const camera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0.1,
    100
);

const aspect = window.innerWidth / window.innerHeight;

camera.left = -viewHeight * aspect / 2;
camera.right = viewHeight * aspect / 2;
camera.top = viewHeight / 2;
camera.bottom = -viewHeight / 2;

camera.updateProjectionMatrix();

camera.position.set(0, 0, 8);
camera.lookAt(0, 0, 0);


// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    stencil: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.debug.checkShaderErrors = false;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);

document
    .getElementById("scene")
    .appendChild(renderer.domElement);


// ============================================================
// ENVIRONMENT FOR METAL
// ============================================================

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment(renderer);

scene.environment = pmremGenerator.fromScene(environment).texture;

environment.dispose();
pmremGenerator.dispose();


// ============================================================
// LIGHT
// ============================================================

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 5, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 1));


// ============================================================
// WIDTH FUNCTION
// ============================================================

function createWidthFunction(widthPoints) {
    return function(index) {
        if (index <= widthPoints[0].point) {
            return widthPoints[0].w;
        }

        for (let i = 0; i < widthPoints.length - 1; i++) {
            const a = widthPoints[i];
            const b = widthPoints[i + 1];

            if (index <= b.point) {
                const k = (index - a.point) / (b.point - a.point);
                const s = k * k * (3 - 2 * k);

                return THREE.MathUtils.lerp(a.w, b.w, s);
            }
        }

        return widthPoints.at(-1).w;
    };
}


// ============================================================
// TWIST FUNCTION
// ============================================================

function createTwistFunction(rotations) {
    if (!rotations || rotations.length === 0) return () => 0;

    return function(index) {
        if (index <= rotations[0].point) {
            return rotations[0].angle;
        }

        for (let i = 0; i < rotations.length - 1; i++) {
            const a = rotations[i];
            const b = rotations[i + 1];

            if (index <= b.point) {
                const k = (index - a.point) / (b.point - a.point);
                const s = k * k * (3 - 2 * k);

                return THREE.MathUtils.lerp(a.angle, b.angle, s);
            }
        }

        return rotations.at(-1).angle;
    };
}


// ============================================================
// CREATE RIBBON
// ============================================================

function createRibbon(data) {
    const curvePoints = [];

    const isMobile = window.innerWidth <= 768;

    const transform = isMobile && data.transformMobile
        ? data.transformMobile
        : data.transformDesktop || data.transform;

    const { scale, offset } = transform;

    for (const p of data.points) {
        curvePoints.push(
            new THREE.Vector3(
                p[0] * scale.x + offset.x,
                p[1] * scale.y + offset.y,
                p[2] * scale.z + offset.z
            )
        );
    }

    const curve = new THREE.CatmullRomCurve3(
        curvePoints,
        false,
        "centripetal",
        0
    );

    const frames = new RibbonFrames(curve, data.segments ?? 200);
    const widthFunction = createWidthFunction(data.width);
    const twistFunction = createTwistFunction(data.rotations);

    const geometry = new RibbonGeometry({
        frames,
        width: widthFunction,
        twist: twistFunction,
        pointCount: data.points.length - 1
    });
    
    geometry.reverseProgress = data.reverseProgress ?? false;

    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vec3 frontColor = vec3(0.45, 0.28, 0.18); 
                vec3 backColor  = vec3(0.88, 0.80, 0.62); 

                vec3 normal = normalize(vNormal);
                if (!gl_FrontFacing) {
                    normal = -normal;
                }

                vec3 viewDir = normalize(vViewPosition);
                
                float light = max(dot(normal, vec3(0.3, 0.5, 0.8)), 0.0);
                float ambient = 0.45;
                float shading = ambient + light * 0.55;

                vec3 baseColor = gl_FrontFacing ? frontColor : backColor;

                gl_FragColor = vec4(baseColor * shading, 1.0);
            }
        `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return { mesh, geometry };
}


// ============================================================
// RIBBONS
// ============================================================

const ribbonA = createRibbon(ribbon1);
const ribbonB = createRibbon(ribbon2);


// ============================================================
// PIXELS → WORLD
// ============================================================

function pixelsToWorld(px) {
    return px * viewHeight / window.innerHeight;
}


// ============================================================
// SECTIONS
// ============================================================

const heroSection = document.getElementById("hero");
const ribbon1Section = document.getElementById("ribbon-1");


// ============================================================
// 3D OBJECTS
// ============================================================

const nailPolish = createNailPolish({ scene, camera, section: ribbon1Section });
const scissors = createScissors({ scene, camera, section: ribbon1Section });
const brush = createBrush({ scene, camera, section: ribbon1Section });

// ============================================================
// HOVER 
// ============================================================

if (window.innerWidth > 768) {

    const polishButton = document.querySelector('.object-label.label-polish');
    const scissorsButton = document.querySelector('.object-label.label-scissors');
    const brushButton = document.querySelector('.object-label.label-brush');

    // NAIL POLISH
    if (polishButton) {
        polishButton.addEventListener('mouseenter', () => {
            nailPolish.setTargetProgress(1);
        });

        polishButton.addEventListener('mouseleave', () => {
            nailPolish.setTargetProgress(0);
        });
    }

    // SCISSORS
    if (scissorsButton) {
        scissorsButton.addEventListener('mouseenter', () => {
            scissors.setTargetProgress(1);
        });

        scissorsButton.addEventListener('mouseleave', () => {
            scissors.setTargetProgress(0);
        });
    }

    // BRUSH
    if (brushButton) {
        brushButton.addEventListener('mouseenter', () => {
            brush.setTargetProgress(1);
        });

        brushButton.addEventListener('mouseleave', () => {
            brush.setTargetProgress(0);
        });
    }
}


// ============================================================
// PHOTOS
// ============================================================

const squareGeometry = new THREE.PlaneGeometry(5.6, 5.6);
const textureLoader = new THREE.TextureLoader();

const squareTexture = textureLoader.load("./images/photo1.png");
squareTexture.colorSpace = THREE.SRGBColorSpace;

const secondTexture = textureLoader.load("./images/photo2.png");
secondTexture.colorSpace = THREE.SRGBColorSpace;


// FIRST PHOTO
const squareMaterial = new THREE.MeshBasicMaterial({
    map: squareTexture,
    side: THREE.DoubleSide,
    transparent: true
});

const square = new THREE.Mesh(squareGeometry, squareMaterial);
square.position.set(0, 0, 0.1);
scene.add(square);


// SECOND PHOTO
const photo2Material = new THREE.MeshBasicMaterial({
    map: secondTexture,
    side: THREE.DoubleSide,
    transparent: true
});

const photo2 = new THREE.Mesh(squareGeometry, photo2Material);
photo2.position.copy(square.position);
scene.add(photo2);

photo2.visible = false;

// RENDER ORDER
square.renderOrder = 1;
ribbonA.mesh.renderOrder = 2;
photo2.renderOrder = 3;


// ============================================================
// RIBBON BINDINGS
// ============================================================

const ribbonBindings = [
    {
        object: ribbonA.mesh,
        section: heroSection,
        startY: ribbonA.mesh.position.y
    },
    {
        object: square,
        section: heroSection,
        startY: square.position.y
    },
    {
        object: photo2,
        section: heroSection,
        startY: photo2.position.y
    },
    {
        object: ribbonB.mesh,
        section: ribbon1Section,
        startY: ribbonB.mesh.position.y
    }
];


// ============================================================
// SCROLL LOGIC & POSITIONS
// ============================================================

let scrollNeedsUpdate = true;

function cacheSectionPositions() {
    for (const item of ribbonBindings) {
        if (item.section) {
            item.cachedOffsetTop = item.section.offsetTop;
            item.cachedHeight = item.section.offsetHeight;
        }
    }
}

window.addEventListener("scroll", () => { scrollNeedsUpdate = true; }, { passive: true });

window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const aspect = width / height;

    camera.left = -viewHeight * aspect / 2;
    camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    cacheSectionPositions();
    scrollNeedsUpdate = true;
});

cacheSectionPositions();


function updateScrollState() {
    updateRibbonPositions();
    updateRibbonScrollProgress();
    updateRibbonVisibility();
}

function updateRibbonPositions() {
    const scrollY = window.scrollY;

    for (const item of ribbonBindings) {
        const relativeTop = item.cachedOffsetTop - scrollY;
        item.object.position.y = item.startY + pixelsToWorld(-relativeTop);
    }
}

function getSectionProgress(sectionItem) {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    const relativeTop = sectionItem.cachedOffsetTop - scrollY;
    const scrollDistance = vh - relativeTop;
    const totalDistance = vh + sectionItem.cachedHeight;

    const progress = scrollDistance / totalDistance;

    return THREE.MathUtils.clamp(progress, 0, 1);
}


function updateRibbonScrollProgress() {
    const ribbon1Binding = ribbonBindings[3]; 
    const progressB = getSectionProgress(ribbon1Binding);

    if (ribbonB.geometry && ribbonB.geometry.updateProgress) {
        ribbonB.geometry.updateProgress(progressB);
    }
}


function updateRibbonVisibility() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    const heroBinding = ribbonBindings[0];
    const ribbon1Binding = ribbonBindings[3];

    const heroVisible = (scrollY < heroBinding.cachedOffsetTop + heroBinding.cachedHeight);
    const ribbon1Visible = (scrollY + vh > ribbon1Binding.cachedOffsetTop && scrollY < ribbon1Binding.cachedOffsetTop + ribbon1Binding.cachedHeight);

    ribbonA.mesh.visible = heroVisible;
    square.visible = heroVisible;

    ribbonB.mesh.visible = ribbon1Visible;

    if (nailPolish.mesh) nailPolish.mesh.visible = ribbon1Visible;
    if (scissors.mesh) scissors.mesh.visible = ribbon1Visible;
    if (brush.mesh) brush.mesh.visible = ribbon1Visible;
}


// ============================================================
// WORKERS CAROUSEL
// ============================================================

const track = document.querySelector(".workers-track");
const nextButton = document.querySelector(".carousel-btn.next");
const prevButton = document.querySelector(".carousel-btn.prev");
const carouselWindow = document.querySelector(".workers-window");

let currentPosition = 0;

function getCarouselStep() {
    const card = track?.querySelector(".worker-card");

    if (!card) return 0;

    const cardWidth = card.getBoundingClientRect().width;

    const trackStyles = window.getComputedStyle(track);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return cardWidth + gap;
}

function getVisibleCards() {
    if (!carouselWindow || !track) return 1;

    const card = track.querySelector(".worker-card");

    if (!card) return 1;

    const cardWidth = card.getBoundingClientRect().width;

    const trackStyles = window.getComputedStyle(track);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    return Math.max(
        1,
        Math.floor(
            (carouselWindow.clientWidth + gap) /
            (cardWidth + gap)
        )
    );
}

function getMaxPosition() {
    if (!track || !carouselWindow) return 0;

    const totalCards = track.querySelectorAll(".worker-card").length;
    const visibleCards = getVisibleCards();

    return Math.max(0, totalCards - visibleCards);
}

function updateCarousel() {
    if (!track) return;

    const step = getCarouselStep();
    const maxPosition = getMaxPosition();

    currentPosition = Math.max(
        0,
        Math.min(currentPosition, maxPosition)
    );

    track.style.transform = `translateX(-${currentPosition * step}px)`;

    if (prevButton) {
        prevButton.disabled = currentPosition === 0;
    }

    if (nextButton) {
        nextButton.disabled = currentPosition >= maxPosition;
    }
}

nextButton?.addEventListener("click", () => {
    const maxPosition = getMaxPosition();

    if (currentPosition < maxPosition) {
        currentPosition++;
        updateCarousel();
    }
});

prevButton?.addEventListener("click", () => {
    if (currentPosition > 0) {
        currentPosition--;
        updateCarousel();
    }
});

window.addEventListener("resize", () => {
    updateCarousel();
});

updateCarousel();


// ============================================================
// START & WARMUP
// ============================================================

let isWarmedUp = false;

const isMobile = window.innerWidth <= 768;
const ribbonSpeed = isMobile ? 0.7 : 0.3;

let ribbon1Progress = 0; 
let ribbon1Finished = false; 

const clock = new THREE.Clock(); 

function warmupIfNeeded() {
    if (isWarmedUp) return;

    const hasNailPolish = nailPolish && nailPolish.mesh;
    const hasScissors = scissors && scissors.mesh;
    const hasBrush = brush && brush.mesh;

    if (hasNailPolish && hasScissors && hasBrush) {
        nailPolish.mesh.visible = true;
        scissors.mesh.visible = true;
        brush.mesh.visible = true;

        scene.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;
            }
        });

        renderer.compile(scene, camera);
        renderer.render(scene, camera);

        scene.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = true;
            }
        });

        updateRibbonVisibility();

        isWarmedUp = true;
        document.body.classList.remove("is-loading");

        console.log("🔥 All 3D models compiled, scroll unlocked!");
    }
}


// ============================================================
// ANIMATION LOOP 
// ============================================================

function animate() { 
    requestAnimationFrame(animate); 

    warmupIfNeeded();

    const delta = clock.getDelta(); 

    if (scrollNeedsUpdate) { 
        updateScrollState(); 
        scrollNeedsUpdate = false; 
    } 

    if (!ribbon1Finished) { 
        ribbon1Progress += delta * ribbonSpeed; 
        ribbon1Progress = Math.min(ribbon1Progress, 1); 
        
        if (ribbonA.geometry && ribbonA.geometry.updateProgress) {
            ribbonA.geometry.updateProgress(ribbon1Progress); 
        }

        if (ribbon1Progress >= 1) {
            ribbon1Finished = true; 
        }
    } 

    if (ribbonB.mesh.visible) { 
        if (nailPolish && nailPolish.update) nailPolish.update(delta); 
        if (scissors && scissors.update) scissors.update(delta); 
        if (brush && brush.update) brush.update(delta); 
    } 

    renderer.render(scene, camera);
}

animate();


// ============================================================
// ADAPTIVE / MOBILE MENU
// ============================================================

const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (burgerBtn && mobileMenu) {

    burgerBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        mobileMenu.classList.toggle('active');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    document.addEventListener('click', (event) => {
        if (
            !mobileMenu.contains(event.target) &&
            !burgerBtn.contains(event.target)
        ) {
            mobileMenu.classList.remove('active');
        }
    });
}


// ============================================================
// AUTH MODAL
// ============================================================

const loginBtn = document.getElementById('loginBtn');
const signinBtn = document.getElementById('signinBtn');

const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');

const authModalLabel = document.getElementById('authModalLabel');
const authModalTitle = document.getElementById('authModalTitle');

const authModalSwitch = document.getElementById('authModalSwitch');
const switchAuthBtn = document.getElementById('switchAuth');

const signupOnlyFields = document.querySelectorAll('.signup-only');
const loginOnlyFields = document.querySelectorAll('.login-only');

let currentMode = 'login';

function setAuthMode(type) {
    currentMode = type;

    if (type === 'login') {
        if (authModalLabel) authModalLabel.textContent = 'WELCOME BACK';
        if (authModalTitle) authModalTitle.textContent = 'Log In';
        
        if (authModalSwitch) {
            authModalSwitch.childNodes[0].textContent = "Don't have an account? ";
        }
        if (switchAuthBtn) switchAuthBtn.textContent = 'Sign Up';

        signupOnlyFields.forEach(el => el.style.display = 'none');
        loginOnlyFields.forEach(el => el.style.display = 'block');

    } else {
        if (authModalLabel) authModalLabel.textContent = 'CREATE ACCOUNT';
        if (authModalTitle) authModalTitle.textContent = 'Sign Up';

        if (authModalSwitch) {
            authModalSwitch.childNodes[0].textContent = 'Already have an account? ';
        }
        if (switchAuthBtn) switchAuthBtn.textContent = 'Log In';

        signupOnlyFields.forEach(el => el.style.display = 'block');
        loginOnlyFields.forEach(el => el.style.display = 'none');
    }
}

function openAuthModal(type) {
    setAuthMode(type);
    authModal?.classList.add('active');
}

function closeAuthModal() {
    authModal?.classList.remove('active');
}

loginBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openAuthModal('login');
});

signinBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openAuthModal('signin');
});

switchAuthBtn?.addEventListener('click', () => {
    setAuthMode(currentMode === 'login' ? 'signin' : 'login');
});

authModalClose?.addEventListener('click', closeAuthModal);

authModal?.addEventListener('click', (event) => {
    if (event.target === authModal) {
        closeAuthModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && authModal?.classList.contains('active')) {
        closeAuthModal();
    }
});

// ============================================================
// TOGGLE PASSWORD VISIBILITY
// ============================================================

const togglePasswordBtn = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');

if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    });
}
import * as THREE from 'three';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'; // REMOVED
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'; // REMOVED
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // ADDED for GLB loading
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'; // ADDED for controls
// Post-processing imports - ADDED
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'; 

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf5b9c6, 10, 250); // Add subtle fog matching sky gradient

// Add visual debugging aids // REMOVED
// const axesHelper = new THREE.AxesHelper(10); // RGB corresponds to XYZ // REMOVED
// scene.add(axesHelper); // REMOVED

// const gridHelper = new THREE.GridHelper(50, 50); // REMOVED
// scene.add(gridHelper); // REMOVED

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(-10, 2, 10); // Adjusted position: closer, slightly lower
camera.lookAt(-11, 2, 4); // Adjusted lookAt: focus slightly higher on the tree area

// Renderer
const canvas = document.querySelector('#threeCanvas');
if (!canvas) {
    console.error("Canvas element not found!");
    throw new Error("Canvas element not found!");
}

const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true,
    alpha: false // Changed to false to ensure background color
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x6495ED, 1); // Changed clear color to darker blue (CornflowerBlue)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

// Test that renderer is working
console.log("Renderer initialized:", renderer);
console.log("Renderer size:", renderer.getSize(new THREE.Vector2()));

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xFFB7C5, 1); // Light cherry blossom pink ground reflection
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); // Reduced intensity for softer light
dirLight.position.set(10, 20, 15); // Adjusted sun position slightly
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
// Adjust shadow camera frustum for better shadow quality in the focused area
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 60;
scene.add(dirLight);

// --- Controls --- ADDED Section
const instructions = document.getElementById('instructions');
const controls = new PointerLockControls(camera, renderer.domElement);

// Lock pointer on click
instructions.addEventListener('click', function () {
    controls.lock();
});

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', function () {
    instructions.style.display = 'flex'; // Use flex to re-center
});

// Add controls to the scene (needed for some internal logic)
scene.add(controls.object);

// Keyboard state
const keyboard = {};
const moveSpeed = 5.0; // Units per second
const moveDirection = new THREE.Vector3(); // Reusable vector for movement direction

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    keyboard[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keyboard[event.code] = false;
});
// --- End Controls Section ---

// --- Animation Variables ---
// let bouquetArrived = false; // REMOVED
// const bouquetSpeed = 0.08; // REMOVED
// const bouquetTargetZ = 2.5; // REMOVED
let elementsAdded = false; // Still useful if we add other timed events
const clock = new THREE.Clock();
let clouds = []; // Array to hold cloud meshes
let fallenPetals = []; // ADDED: Array for animating petals
let simpleFlowers = []; // ADDED: Array for flowers
let bushes = []; // ADDED: Array for bushes

// Get reference to HTML message element // REMOVED
// const messageElement = document.getElementById('message');

// --- Post Processing Setup --- ADDED Section
let composer, bloomPass, bokehPass;
composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom Pass (for glow)
bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 
    0.35, // strength - REDUCED significantly
    0.4, // radius - Increased slightly for softer spread
    0.8  // threshold - INCREASED so only brighter parts bloom
);
composer.addPass(bloomPass);

// Bokeh Pass (Depth of Field)
bokehPass = new BokehPass(scene, camera, {
    focus: 20.0,     // Initial focus distance (adjust based on tree distance)
    aperture: 0.0001, // Aperture size (controls blur intensity)
    maxblur: 0.005,  // Max blur amount
    width: window.innerWidth,
    height: window.innerHeight
});
bokehPass.needsSwap = true; // Important for chaining passes
bokehPass.enabled = false;  // DISABLED DOF
composer.addPass(bokehPass);

// Adjust composer size on resize
window.addEventListener('resize', () => {
    // ... existing camera/renderer resize ...
    composer.setSize(window.innerWidth, window.innerHeight); 
    // Update bloom pass resolution if needed
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    // Update bokeh pass aspect
    bokehPass.uniforms['aspect'].value = camera.aspect;
});
// --- End Post Processing Setup ---

// --- Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime(); // Need elapsed time for animations

    // --- Movement Logic --- CORRECTED Section
    if (controls.isLocked === true) {
        const moveDistance = moveSpeed * deltaTime; // Calculate distance to move based on speed and time

        // Reset movement flags or apply movement directly
        if (keyboard['KeyW']) {
            controls.moveForward(moveDistance);
        }
        if (keyboard['KeyS']) {
            controls.moveForward(-moveDistance);
        }
        if (keyboard['KeyA']) {
            controls.moveRight(-moveDistance);
        }
        if (keyboard['KeyD']) {
            controls.moveRight(moveDistance);
        }
        
        // Prevent moving below ground (simple clamping)
        if (controls.object.position.y < 1.0) {
             controls.object.position.y = 1.0; // Set minimum height (e.g., head height)
        }

    }
    // --- End Movement Logic ---

    // Animate Clouds
    clouds.forEach(cloud => {
        cloud.position.x += deltaTime * 0.3; // SLOWED DOWN cloud speed
        // Wrap clouds around
        if (cloud.position.x > 120) { // Adjusted wrap boundary
             cloud.position.x = -120;
             // Optionally randomize Y and Z again for variation
             cloud.position.y = 25 + Math.random() * 15;
             cloud.position.z = -60 + Math.random() * 120; // Wider spread
             // Subtle opacity change on wrap?
             // cloud.material.opacity = 0.7 + Math.random() * 0.2;
        }
    });
    
    // --- Animate Fallen Petals --- ADDED
    fallenPetals.forEach(petal => {
        // Gentle rotation
        petal.rotation.z += Math.sin(elapsedTime * 0.5 + petal.position.x) * 0.005;
        // Subtle opacity pulsing (optional)
        // petal.material.opacity = 0.8 + Math.sin(elapsedTime + petal.position.z) * 0.1;
    });
    // --- End Petal Animation ---

    // renderer.render(scene, camera); // REMOVED - Composer handles rendering
    composer.render(deltaTime); // Use EffectComposer to render
}

// --- Scene Elements ---

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Ground (Grass) with Hills // CHANGED to flat ground
const groundSize = 200;
// const groundSegments = 100; // REMOVED - not needed for flat plane
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize); // SIMPLIFIED - flat plane

// Load grass texture from file
const grassTexture = textureLoader.load('/textures/grass.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(15, 15); // Slightly less repetition

const groundMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.8, // Slightly less rough
    metalness: 0.05 // Very low metalness
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0; // Set ground level to y=0
ground.receiveShadow = true;
scene.add(ground);

// Sun Object (Visual)
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
// const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00, fog: false }); // REMOVED
const sunMaterial = new THREE.MeshStandardMaterial({ // CHANGED to StandardMaterial
    emissive: 0xFFFF00,    // Make it glow yellow
    emissiveIntensity: 2, // Adjust intensity as needed
    color: 0xFFFF00,       // Base color (can be same as emissive)
    fog: false,            // Still ignore fog
    roughness: 0,          // Make it appear smooth
    metalness: 0
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.copy(dirLight.position).normalize().multiplyScalar(100); // Place far away in light direction
scene.add(sunMesh);


// --- Tree Model Loading --- // CHANGED to GLTF/GLB Loading

// Fallback function to create a simple tree if model loading fails // REMOVED
// function createSimpleTree() { ... } // REMOVED

// Try to load the GLB tree model
try {
    const loader = new GLTFLoader();
    loader.setPath('/models/'); // Set path for GLTF loader
    
    loader.load('cherry_blossom_tree_1.glb', function (gltf) {
        console.log("GLB tree model loaded successfully");
        const treeModel = gltf.scene;
        setupTree(treeModel);
        
    }, function (xhr) {
        // Progress callback (optional)
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log('Model ' + Math.round(percentComplete, 2) + '% downloaded');
        }
    }, function (error) {
        // Error callback
        console.error('An error happened loading the GLB model:', error);
        // No fallback tree - log the error only.
    });

} catch (e) {
    console.error("Exception during GLB tree loading:", e);
}

function setupTree(treeObject) {
    treeObject.scale.set(2, 2, 2);
    treeObject.position.set(-15, 0, 4); // Place tree base at y=0

    treeObject.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    scene.add(treeObject);

    // --- Add Fallen Petals --- MODIFIED to add to array
    const petalCount = 500; // Slightly more petals
    const petalSpreadRadius = 14; 
    const petalGeometry = new THREE.PlaneGeometry(0.1, 0.1); 
    const petalMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFB6C1, 
        side: THREE.DoubleSide,
        transparent: true, 
        opacity: 0.85 // Base opacity
    });

    fallenPetals = []; // Clear previous petals if re-loading
    for (let i = 0; i < petalCount; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial.clone()); // Clone material for unique opacity/anim
        // Random position around the tree base
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * petalSpreadRadius;
        const petalX = treeObject.position.x + Math.cos(angle) * radius;
        const petalZ = treeObject.position.z + Math.sin(angle) * radius;
        const petalY = 0.01; // Slightly above ground to prevent z-fighting

        petal.position.set(petalX, petalY, petalZ);

        // Random rotation
        petal.rotation.x = -Math.PI / 2; // Lay flat on ground initially
        petal.rotation.y = Math.random() * Math.PI * 2; // Random orientation on ground
        petal.rotation.z = Math.random() * 0.5 - 0.25; // Slight tilt
        
        petal.receiveShadow = true; // Petals can receive shadows (optional)
        scene.add(petal);
        fallenPetals.push(petal); // ADDED: Add to array for animation
    }
    // --- End Fallen Petals ---
    
    // Update DOF focus to the tree
    bokehPass.uniforms[ 'focus' ].value = camera.position.distanceTo(treeObject.position) * 0.9;
    // console.log("DOF Focus updated to:", bokehPass.uniforms[ 'focus' ].value); 
}

const onProgress = function (xhr) {
    if (xhr.lengthComputable) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
};

const onError = function (error) {
     console.error('An error happened loading the model:', error);
};

// --- Flowers --- ADDED Section
const flowerCount = 50;
const flowerSpread = 80; // How far flowers spread across the ground
const flowerGeometry = new THREE.SphereGeometry(0.15, 8, 6); // Simple low-poly sphere
const flowerColors = [0xFFFF00, 0xFFFFFF, 0xADD8E6]; // Yellow, White, Light Blue

for (let i = 0; i < flowerCount; i++) {
    const flowerMaterial = new THREE.MeshStandardMaterial({
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        roughness: 0.7
    });
    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);

    // Random position, avoiding near the tree base slightly
    let flowerX, flowerZ;
    do {
        flowerX = (Math.random() - 0.5) * flowerSpread;
        flowerZ = (Math.random() - 0.5) * flowerSpread;
    } while (Math.sqrt((flowerX - (-15))**2 + (flowerZ - 4)**2) < 8); // Keep away from petal area
    
    const flowerY = 0.1;
    flower.position.set(flowerX, flowerY, flowerZ);
    flower.castShadow = true;
    scene.add(flower);
    simpleFlowers.push(flower);
}
// --- End Flowers ---

// --- Bushes --- ADDED Section
const bushCount = 10;
const bushSpread = 90;
const bushBaseGeometry = new THREE.SphereGeometry(0.8, 12, 8);
const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.9 }); // SeaGreen

for (let i = 0; i < bushCount; i++) {
    const bush = new THREE.Mesh(bushBaseGeometry, bushMaterial);
    let bushX, bushZ;
    do {
        bushX = (Math.random() - 0.5) * bushSpread;
        bushZ = (Math.random() - 0.5) * bushSpread;
    } while (Math.sqrt((bushX - (-15))**2 + (bushZ - 4)**2) < 10); // Keep away from tree/petals

    const bushY = 0.5;
    bush.position.set(bushX, bushY, bushZ);
    bush.scale.set(1, 0.8 + Math.random() * 0.4, 1); // Vary height slightly
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
    bushes.push(bush);
}
// --- End Bushes ---

// --- Clouds ---
// Load cloud texture from file
const cloudTexture = textureLoader.load('/textures/cloud.png');
const cloudMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.8, // Keep opacity for potentially softer clouds
    depthWrite: false, // Important for transparent textures
    side: THREE.DoubleSide
});

const numClouds = 45; // INCREASED number of clouds further
for (let i = 0; i < numClouds; i++) {
    const cloudGeometry = new THREE.PlaneGeometry(10 + Math.random() * 10, 5 + Math.random() * 5); // Random size
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

    cloud.position.x = -100 + Math.random() * 200; // Spread across X
    cloud.position.y = 28 + Math.random() * 15;  // RAISED height variation further (28-43)
    cloud.position.z = -50 + Math.random() * 100; // Depth variation

    cloud.rotation.y = Math.random() * Math.PI; // Slight random rotation

    scene.add(cloud);
    clouds.push(cloud);
}

// ** GLTF Model Loading REMOVED **
// const loader = new GLTFLoader(); ...

// --- Placeholder Bouquet REMOVED ---
// let bouquet = new THREE.Group(); ...

animate(); // Start the animation loop

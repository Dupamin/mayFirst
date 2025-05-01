import * as THREE from 'three';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'; // REMOVED
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'; // REMOVED
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // ADDED for GLB loading
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'; // ADDED for controls

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xade0ff, 10, 80); // Add subtle fog matching sky gradient

// Add visual debugging aids // REMOVED
// const axesHelper = new THREE.AxesHelper(10); // RGB corresponds to XYZ // REMOVED
// scene.add(axesHelper); // REMOVED

// const gridHelper = new THREE.GridHelper(50, 50); // REMOVED
// scene.add(gridHelper); // REMOVED

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
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
renderer.setClearColor(0x87CEEB, 1); // Set explicit background color
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
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2); // Slightly less intense
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Keep intensity for now
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

// Get reference to HTML message element // REMOVED
// const messageElement = document.getElementById('message');

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    // const elapsedTime = clock.elapsedTime; // No longer used

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
        cloud.position.x += deltaTime * 0.5; // Adjust speed as needed
        // Wrap clouds around
        if (cloud.position.x > 100) {
             cloud.position.x = -100;
             // Optionally randomize Y and Z again for variation
             cloud.position.y = 15 + Math.random() * 10;
             cloud.position.z = -50 + Math.random() * 100;
        }
    });


    renderer.render(scene, camera);
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

    // --- Add Fallen Petals --- ADDED
    const petalCount = 200;
    const petalSpreadRadius = 6; // How far petals spread from the trunk
    const petalGeometry = new THREE.PlaneGeometry(0.1, 0.1); // Small plane for petal
    const petalMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFB6C1, // LightPink 
        side: THREE.DoubleSide,
        transparent: true, // Make slightly transparent if desired
        opacity: 0.9
    });

    for (let i = 0; i < petalCount; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);

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
    }
    // --- End Fallen Petals ---

    // REMOVED: camera.lookAt(treeObject.position); -- we're setting this at the start now
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

const numClouds = 35; // INCREASED number of clouds
for (let i = 0; i < numClouds; i++) {
    const cloudGeometry = new THREE.PlaneGeometry(10 + Math.random() * 10, 5 + Math.random() * 5); // Random size
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

    cloud.position.x = -100 + Math.random() * 200; // Spread across X
    cloud.position.y = 25 + Math.random() * 15;  // RAISED height variation (25-40)
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

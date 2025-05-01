import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'; // ADDED for OBJ loading
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'; // ADDED for MTL loading
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // REMOVED

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
camera.position.set(-8, 4, 12); // Adjusted position: closer, slightly lower
camera.lookAt(-15, 2, 4); // Adjusted lookAt: focus slightly higher on the tree area

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
    const elapsedTime = clock.elapsedTime;

    // Animate Bouquet // REMOVED section
    // if (!bouquetArrived) { ... }

    // Show HTML text once bouquet arrived // REMOVED section
    // if (bouquetArrived && !elementsAdded) { ... }

    // Gentle hover for arrived bouquet // REMOVED section
    // if (bouquetArrived && bouquet) { ... }

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
grassTexture.repeat.set(20, 20);

const groundMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.9,
    metalness: 0.1
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0; // Set ground level to y=0
ground.receiveShadow = true;
scene.add(ground);

// Sun Object (Visual)
const sunGeometry = new THREE.SphereGeometry(2, 32, 32); // Slightly larger sun
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00, fog: false });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.copy(dirLight.position).normalize().multiplyScalar(100); // Place far away in light direction
scene.add(sunMesh);


// --- Tree Model Loading ---
const mtlLoader = new MTLLoader();
mtlLoader.setPath('/models/'); 

// Fallback function to create a simple tree if model loading fails
function createSimpleTree() {
    console.log("Creating fallback tree");
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Leaves/Blossoms (several spheres arranged in a tree shape)
    const blossomMaterial = new THREE.MeshStandardMaterial({ color: 0xFFB7C5, roughness: 0.7 });
    
    // Different sizes and positions for the foliage
    const blossomPositions = [
        { x: 0, y: 5.5, z: 0, r: 2.5 },
        { x: 1.5, y: 4.5, z: 0, r: 1.8 },
        { x: -1.5, y: 4.5, z: 0, r: 1.8 },
        { x: 0, y: 4.5, z: 1.5, r: 1.8 },
        { x: 0, y: 4.5, z: -1.5, r: 1.8 },
        { x: 2, y: 3, z: 0, r: 1.5 },
        { x: -2, y: 3, z: 0, r: 1.5 },
        { x: 0, y: 3, z: 2, r: 1.5 },
        { x: 0, y: 3, z: -2, r: 1.5 }
    ];
    
    blossomPositions.forEach(pos => {
        const blossomGeometry = new THREE.SphereGeometry(pos.r, 16, 16);
        const blossom = new THREE.Mesh(blossomGeometry, blossomMaterial);
        blossom.position.set(pos.x, pos.y, pos.z);
        blossom.castShadow = true;
        blossom.receiveShadow = true;
        treeGroup.add(blossom);
    });
    
    treeGroup.position.set(-15, 0, 4); // Set base Y to ground level (0)
    // REMOVED Raycasting for simple tree Y position, assuming flat ground at y=0
    // const raycaster = new THREE.Raycaster();
    // raycaster.set(new THREE.Vector3(treeGroup.position.x, 10, treeGroup.position.z), new THREE.Vector3(0, -1, 0));
    // const intersects = raycaster.intersectObject(ground);
    // if (intersects.length > 0) {
    //     treeGroup.position.y = intersects[0].point.y;
    // }

    scene.add(treeGroup);
    return treeGroup;
}

// Try to load the tree model, with better error handling
try {
    mtlLoader.setMaterialOptions({ 
        ignoreZeroRGBs: true, // Helps with some MTL issues
        side: THREE.DoubleSide // Allow materials to be visible from both sides
    });

    mtlLoader.load('Tree 1.mtl', function(materials) {
        materials.preload();
        console.log("MTL loaded successfully");
        
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('/models/');
        
        objLoader.load('Tree 1.obj', function(object) {
            console.log("Tree model loaded with MTL");
            setupTree(object);
        }, onProgress, function(error) {
            console.error("Error loading OBJ file:", error);
            createSimpleTree();
        });
    }, function(error) {
        console.log("MTL loading failed, trying OBJ directly:", error);
        const objLoader = new OBJLoader();
        objLoader.setPath('/models/');
        objLoader.load('Tree 1.obj', function(object) {
            console.log("Tree model loaded (OBJ only)");
            // Apply custom materials for a cherry blossom tree
            object.traverse(function(child) {
                if (child.isMesh) {
                    // Detect parts of the tree by geometry or name
                    const isLeaf = child.name.toLowerCase().includes('leaf') || 
                                child.name.toLowerCase().includes('blossom') ||
                                child.geometry.attributes.position.count > 1000; // Leaves often have more vertices
                    
                    if (isLeaf) {
                        // Pink blossom color for leaves
                        child.material = new THREE.MeshStandardMaterial({ 
                            color: 0xFFB7C5, // Light pink for cherry blossoms
                            roughness: 0.8,
                            metalness: 0.0
                        });
                    } else {
                        // Brown bark color for trunk/branches
                        child.material = new THREE.MeshStandardMaterial({ 
                            color: 0x8B4513, // Brown for trunk
                            roughness: 0.9,
                            metalness: 0.0
                        });
                    }
                }
            });
            setupTree(object);
        }, onProgress, function(error) {
            console.error("Failed to load both MTL and OBJ:", error);
            createSimpleTree();
        });
    });
} catch (e) {
    console.error("Exception during tree loading:", e);
    createSimpleTree();
}

function setupTree(treeObject) {
    treeObject.scale.set(2.5, 2.5, 2.5);
    treeObject.position.set(-15, 0, 4); // Place tree base at y=0

    // Find the ground height at the tree's X/Z position // REMOVED - assuming flat ground at y=0
    // const raycaster = new THREE.Raycaster();
    // raycaster.set(new THREE.Vector3(treeObject.position.x, 10, treeObject.position.z), new THREE.Vector3(0, -1, 0));
    // const intersects = raycaster.intersectObject(ground);
    // if (intersects.length > 0) {
    //     treeObject.position.y = intersects[0].point.y;
    // } else {
    //     console.warn("Could not find ground height for tree, using default Y.");
    //     treeObject.position.y = -1; // This was the old default, now it's 0
    // }

    treeObject.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    scene.add(treeObject);
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

const numClouds = 15;
for (let i = 0; i < numClouds; i++) {
    const cloudGeometry = new THREE.PlaneGeometry(10 + Math.random() * 10, 5 + Math.random() * 5); // Random size
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

    cloud.position.x = -100 + Math.random() * 200; // Spread across X
    cloud.position.y = 15 + Math.random() * 10;  // Height variation
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

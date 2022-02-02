import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui'

// Models
let mixer;
const loader = new GLTFLoader();
loader.load('models/mine_scene7/scene.gltf', function (gltf) {
    gltf.scene.traverse( function ( object ) {

        if ( object.isMesh ) {
            object.castShadow = true
            object.receiveShadow = true
            if ( !object.material.depthWrite && !object.name.includes("Water")){
                object.material.depthWrite = true
            }
            if ( object.name.includes("Seagrass") || object.name.includes("Kelp") || object.name === ("grass")||object.name === ("clouds")){
                object.material.alphaTest = 0.5
            }
        }
    })
    scene.add(gltf.scene)
    const model = gltf.scene
    mixer = new THREE.AnimationMixer(model)
    const clips = gltf.animations
    clips.forEach(function(clip){
        const action = mixer.clipAction(clip)
        console.log('dando play na animação ', action)
        action.play()
    })
})

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Objects
const geometry = new THREE.TorusGeometry( .7, .2, 16, 100 );

// Materials
const material = new THREE.MeshStandardMaterial()
material.metalness = 0.7
material.roughness = 0.2
material.color = new THREE.Color(0xff0000)

material.opacity = 0.2;


// Mesh
const donut = new THREE.Mesh(geometry,material)
donut.castShadow = true
//scene.add(donut)

// Lights
const hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
scene.add( hemisphereLight );

const directionalLight = new THREE.PointLight( 0xffffff, 5 );
directionalLight.position.set(4,35,-4)
directionalLight.castShadow = true
directionalLight.shadow.bias = -0.0004
scene.add( directionalLight );
const directionalLightHelper = new THREE.PointLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)

// GUI
const light1 = gui.addFolder('Light 1')
light1.add(directionalLight.position, 'x').min(-100).max(100).step(1)
light1.add(directionalLight.position, 'y').min(-100).max(100).step(1)
light1.add(directionalLight.position, 'z').min(-100).max(100).step(1)
light1.add(directionalLight, 'intensity').min(1).max(10).step(1)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 50
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
})
renderer.shadowMap.enabled = true

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    //donut.rotation.y = 2 * elapsedTime

    // Update Orbital Controls
    controls.update()

    // Render
    if (mixer){
        mixer.update(clock.getDelta())
    }
    
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


// Models
let composer;
let ssrPass, selects = [];
let mixer_scene, mixer_sun_moon, mixer_dolphin;
const params = {
    exposure: 0.7,
    bloomStrength: 0.159,
    bloomThreshold: 0,
    bloomRadius: 0.5
};
const loader = new GLTFLoader();
loader.load('models/mine_scene7/scene.gltf', function (gltf) {
    selects.push(gltf.scene.children[18].children[0])

    gltf.scene.traverse( function ( object ) {

        if ( object.isMesh ) {
            object.frustumCulled = false
            object.castShadow = true
            object.receiveShadow = true
            if (object.name === ("clouds")){
                object.receiveShadow = false
                object.material = new THREE.MeshBasicMaterial()
            }
            if (object.name.includes("Water")){

                const waterTex = object.material.map

                object.material = new THREE.MeshPhysicalMaterial({
                    map: waterTex,
                    clearcoat:1,
                    transparent: true,
                    side: 2,
                })
                object.castShadow = false
            }
            if (!object.name.includes("Water") && object.material.transparent) {
                object.material.transparent = false
                object.material.alphaTest = 0.5
            }
            if ( !object.material.depthWrite && !object.name.includes("Water")){
                object.material.depthWrite = true
            }
            if ( object.name.includes("Seagrass") || object.name.includes("Kelp") || object.name === ("grass")){
                object.material.alphaTest = 0.5
            }
        }
    })
    scene.add(gltf.scene)

    /*const model = gltf.scene
    mixer_scene = new THREE.AnimationMixer(model)
    const clips = gltf.animations
    clips.forEach(function(clip){
        const action = mixer_scene.clipAction(clip)
        action.play()
    })*/
})

loader.load('models/sun_moon/sun_moon.glb', function (gltf) {
    gltf.scene.traverse( function ( object ) {
        if (object.isMesh){
            const tex = object.material.emissiveMap
            object.material.map = tex
        }
    })
    scene.add(gltf.scene)
    const model = gltf.scene
    mixer_dolphin = new THREE.AnimationMixer(model)
    const clips = gltf.animations
    clips.forEach(function(clip){
        const action = mixer_dolphin.clipAction(clip)
        action.play()
    })
})

loader.load('models/dolphin/dolphin.glb', function (gltf) {
    gltf.scene.traverse( function ( object ) {
        if (object.isMesh){
            object.frustumCulled = false
            object.castShadow = true
        }
    })
    scene.add(gltf.scene)
    const model = gltf.scene
    mixer_sun_moon = new THREE.AnimationMixer(model)
    const clips = gltf.animations
    clips.forEach(function(clip){
        const action = mixer_sun_moon.clipAction(clip)
        action.play()
    })
})

// Debug
const gui = new dat.GUI()

gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
    renderer.toneMappingExposure = Math.pow( value, 4.0 );
} );

gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
    bloomPass.threshold = Number( value );
} );

gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
    bloomPass.strength = Number( value );
} );

gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
    bloomPass.radius = Number( value );
} );



// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 550)
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
    antialias: true
})
renderer.shadowMap.enabled = true

renderer.setClearColor( 0x8caaff, 1);
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;

composer = new EffectComposer( renderer );

ssrPass = new SSRPass( {
    renderer,
    scene,
    camera,
    fresnel: true,
    distanceAttenuation: true,
    width: innerWidth,
    height: innerHeight,
    selects: selects
} );
composer.addPass( renderScene );
//composer.addPass( ssrPass );
composer.addPass( bloomPass );

composer.addPass( new ShaderPass( GammaCorrectionShader ) );


/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () =>
{
    const elaspsedTime = clock.elapsedTime

    // Update Orbital Controls
    controls.update()

    // Render
    if (mixer_scene){
        mixer_scene.update(clock.getDelta())
    }
    if (mixer_sun_moon){
        mixer_sun_moon.update(clock.getDelta())
    }

    /*
    if (elaspsedTime>5){
        renderer.setClearColor( 0xffffff, 1);
    }*/

    composer.render();

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
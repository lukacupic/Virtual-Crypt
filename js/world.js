import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/FirstPersonControls.js';
import { TransformControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/TransformControls.js';
import { RectAreaLightHelper } from 'https://unpkg.com/three@0.141.0/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'https://unpkg.com/three@0.141.0/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { clamp } from "./utils.js"

class FirstPersonController {

  static KEYS = {
    forward: 87, // W
    left: 65,    // A
    back: 83,    // S
    right: 68    // D
  };

  constructor() {
    this.initialize();
  }

  initialize() {
    this.current = {
      leftButton: false,
      rightButton: false,
      mouseX: 0,
      mouseY: 0,
      mouseXDelta: 0,
      mouseYDelta: 0
    };
    this.previous = null;
    this.keys = {};

    document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
  }

  onMouseMove(e) {
    this.current.mouseX = e.pageX - window.innerWidth / 2;
    this.current.mouseY = e.pageY - window.innerHeight / 2;

    if (this.previous === null) {
      this.previous = { ...this.current };
    }

    this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
    this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
  }

  onKeyDown(e) {
    this.keys[e.keyCode] = true;
  }

  onKeyUp(e) {
    this.keys[e.keyCode] = false;
  }

  isMovingForward() {
    return this.keys[FirstPersonController.KEYS.forward];
  }

  isMovingBackward() {
    return this.keys[FirstPersonController.KEYS.back];
  }

  isMovingLeftward() {
    return this.keys[FirstPersonController.KEYS.left];
  }

  isMovingRightward() {
    return this.keys[FirstPersonController.KEYS.right];
  }

  update() {
    if (this.previous !== null) {
      this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
      this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;

      this.previous = { ...this.current };
    }
  }
}

class FirstPersonCamera {

  constructor(camera, position) {
    this.camera = camera;
    this.input = new FirstPersonController();
    this.rotation = new THREE.Quaternion();
    this.translation = position;
    this.phi = 0;
    this.phiSpeed = 8;
    this.theta = 0;
    this.thetaSpeed = 5;
  }

  // http://gcctech.org/csc/javascript/javascript_keycodes.htm
  update(timeElapsed) {
    this.updateRotation(timeElapsed);
    this.updateTranslation(timeElapsed);
    this.updateCamera(timeElapsed);
    this.input.update(timeElapsed);
  }

  updateRotation() {
    const xh = this.input.current.mouseXDelta / window.innerWidth;
    const yh = this.input.current.mouseYDelta / window.innerHeight;

    this.phi += -xh * this.phiSpeed;
    this.theta = clamp(this.theta + -yh * this.thetaSpeed, -Math.PI / 3, Math.PI / 3);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);

    const q = new THREE.Quaternion();
    q.multiply(qx);
    q.multiply(qz);

    this.rotation.copy(q);
  }

  updateTranslation(timeElapsed) {
    const forwardVelocity = (this.input.isMovingForward() ? 1 : 0) + (this.input.isMovingBackward() ? -1 : 0);
    const strafeVelocity = (this.input.isMovingLeftward() ? 1 : 0) + (this.input.isMovingRightward() ? -1 : 0);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(qx);
    forward.multiplyScalar(forwardVelocity * timeElapsed * 10);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(qx);
    left.multiplyScalar(strafeVelocity * timeElapsed * 10);

    this.translation.add(forward);
    this.translation.add(left);
  }

  updateCamera() {
    this.camera.quaternion.copy(this.rotation);
    this.camera.position.copy(this.translation);
  }
}

class World {

  constructor() {
    this.initialize();
  }

  initialize() {
    this.loadingManager = this.initializeLoadingManager();
    this.renderer = this.initializeRenderer();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.lights = this.initializeLights();
    this.initializeWorld();

    this.onWindowResize();

    this.clock = new THREE.Clock();
  }

  async init() {
    const model = this.loadModel('/assets/models/church.glb');
  }

  initializeLoadingManager() {
    const manager = new THREE.LoadingManager();

    manager.onStart = function (url, itemsLoaded, itemsTotal) {
    };

    manager.onLoad = function () {
      const loadingScreen = document.getElementById('loading-screen');
      loadingScreen.classList.add('fade-out');
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    };

    manager.onError = function (url) {
      console.log('There was an error loading ' + url);
    };

    return manager;
  }

  initializeRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: false });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    return renderer;
  }

  loadSkydome() {
    let loader = new THREE.CubeTextureLoader(this.loadingManager);

    const texture = loader.load([
      '/assets/skybox/posx.jpg',
      '/assets/skybox/negx.jpg',
      '/assets/skybox/posy.jpg',
      '/assets/skybox/negy.jpg',
      '/assets/skybox/posz.jpg',
      '/assets/skybox/negz.jpg',
    ]);

    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  loadFloor(texturePath) {
    const mapLoader = new THREE.TextureLoader(this.loadingManager);
    const checkerboard = mapLoader.load(texturePath);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    checkerboard.anisotropy = maxAnisotropy;
    checkerboard.wrapS = THREE.RepeatWrapping;
    checkerboard.wrapT = THREE.RepeatWrapping;
    checkerboard.repeat.set(256, 256);
    checkerboard.encoding = THREE.sRGBEncoding;

    const floorMaterial = new THREE.MeshStandardMaterial({ map: checkerboard });
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    const floorGeometry = new THREE.PlaneBufferGeometry(1000, 1000, 10, 10);

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;

    return floor;
  }

  async loadModel() {
    const gltf = await new GLTFLoader(this.loadingManager).loadAsync('/assets/models/church.glb');

    const mesh = gltf.scene;

    const s = 0.225;
    mesh.scale.set(s, s, s);
    mesh.position.y = -10;

    gltf.scene.traverse(function (object) {
      if (object.isMesh) {
        object.castShadow = true;
      }
    });

    this.scene.add(mesh);
    return mesh;
  }

  initializeScene() {
    const scene = new THREE.Scene();

    scene.background = this.loadSkydome();
    scene.fog = new THREE.Fog(scene.background, 1, 100);

    const floor = this.loadFloor('/assets/checkerboard.jpg');
    scene.add(floor);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;

    return new THREE.PerspectiveCamera(fov, aspect, near, far);
  }

  initializeLights() {
    const light = new THREE.AmbientLight(0xf5ffbd, 0.5);
    this.scene.add(light);

    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0xf9ffbd, 1);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 4);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(- 1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    this.scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 100;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;


    let bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);
    let bulbLight = new THREE.PointLight(0xffee88, 100, 20, 2);

    let bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000
    });
    bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 2, 0);
    bulbLight.castShadow = true;
    this.scene.add(bulbLight);
  }

  initializeWorld() {
    this.fpsCamera = new FirstPersonCamera(this.camera, new THREE.Vector3(0, 2, 20));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  raf() {
    requestAnimationFrame((t) => {
      this.step_();
      this.renderer.autoClear = true;
      this.renderer.render(this.scene, this.camera);
      this.renderer.autoClear = false;
      this.raf();
    });
  }

  step_() {
    this.fpsCamera.update(this.clock.getDelta());
  }
}


// let _APP = null;

// window.addEventListener('DOMContentLoaded', () => {
//   _APP = new World();
// });

async function main() {
  const world = new World();

  await world.init();

  world.raf();
}

main();
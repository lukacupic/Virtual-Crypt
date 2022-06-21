import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/FirstPersonControls.js';
import { TransformControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/TransformControls.js';

class FirstPersonInputController {

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
        this.previousKeys = {};

        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    }

    onMouseMove(e) {
        this.current.mouseX = e.pageX - window.innerWidth / 2;
        this.current.mouseY = e.pageY - window.innerHeight / 2;

        if (this.previous === null) {
            this.previous = {...this.current};
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

    update() {
      this.previous = {...this.current};
    }
}

class FirstPersonCamera {

    constructor(camera) {
        this.camera = camera;
        this.input = new FirstPersonInputController();
        this.rotation = new THREE.Quaternion();
        this.translation = new THREE.Vector3();
        this.phi = 0;
        this.phiSpeed = 8;
        this.theta = 0;
        this.thetaSpeed = 5;
        this.headBobActive = false;
        this.headBobTimer = 0;

        this.KEYS = {
          forward: 87,
          left: 65,
          back: 83,
          right: 68
        };
    }

    // http://gcctech.org/csc/javascript/javascript_keycodes.htm
    update(timeElapsed) {
      this.updateRotation(timeElapsed);
      this.updateCamera(timeElapsed);
      this.updateTranslation(timeElapsed);
      this.updateHeadBob(timeElapsed);
      this.input.update(timeElapsed);
    }

    updateRotation(timeElapsed) {
      const xh = this.input.current.mouseXDelta / window.innerWidth;
      const yh = this.input.current.mouseYDelta / window.innerHeight;

      this.phi += -xh * this.phiSpeed;
      this.theta = this.clamp(this.theta + -yh * this.thetaSpeed, -Math.PI / 3, Math.PI / 3);

      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
      const qz = new THREE.Quaternion();
      qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);

      const q = new THREE.Quaternion();
      q.multiply(qx);
      q.multiply(qz);

      this.rotation.copy(q);
    }

    updateCamera() {
      this.camera.quaternion.copy(this.rotation);
      this.camera.position.copy(this.translation);
      this.camera.position.y += Math.sin(this.headBobTimer * 10) * 0.05;
  
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.rotation);
  
      const dir = forward.clone();
  
      forward.multiplyScalar(100);
      forward.add(this.translation);
    }

    updateTranslation(timeElapsed) {
      const forwardVelocity = (this.input.keys[this.KEYS.forward] ? 1 : 0) + (this.input.keys[this.KEYS.back] ? -1 : 0);
      const strafeVelocity = (this.input.keys[this.KEYS.left] ? 1 : 0) + (this.input.keys[this.KEYS.right] ? -1 : 0);

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

      if (forwardVelocity != 0 || strafeVelocity != 0) {
        this.headBobActive = true;
      }
    }

    updateHeadBob(timeElapsed) {
      if (this.headBobActive) {
        const wavelength = Math.PI;
        const nextStep = 1 + Math.floor(((this.headBobTimer + 0.000001) * 10) / wavelength);
        const nextStepTime = nextStep * wavelength / 10;
        this.headBobTimer = Math.min(this.headBobTimer + timeElapsed, nextStepTime);
  
        if (this.headBobTimer == nextStepTime) {
          this.headBobActive = false;
        }
      }
    }

    clamp(number, min, max) {
      return Math.max(min, Math.min(number, max));
    }
}

const renderer = new THREE.WebGLRenderer({
  antialias: false,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;

const width = window.innerWidth;
const height = window.innerHeight;
renderer.setSize (width, height);
document.body.appendChild (renderer.domElement);

const scene = new THREE.Scene();

var light = new THREE.AmbientLight(0x404040);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

// const controls = new OrbitControls (camera, renderer.domElement);
// const controls = new FirstPersonControls(camera, renderer.domElement);
// controls.movementSpeed = 100;
// controls.lookSpeed = 0.05;
// controls.noFly = true;
// controls.constrainVertical = true;
// controls.verticalMin = 1;
// controls.verticalMax = 3;
// controls.enableDamping = false;

const fov = 60;
const aspect = 1920 / 1080;
const near = 1.0;
const far = 1000.0;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const fpsCamera = new FirstPersonCamera(camera);

const gridXZ = new THREE.GridHelper(5000, 20);
scene.add(gridXZ);

const loader = new GLTFLoader();
loader.load('/assets/models/church.glb', function (gltf) {
  const model = gltf.scene;
  model.position.set(0, 0, 0);
  scene.add(model);

}, undefined, function (error) {
  console.error(error);
});

var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

//   controls.update(clock.getDelta());
  fpsCamera.update(clock.getDelta());
  renderer.render(scene, camera);
};

animate();
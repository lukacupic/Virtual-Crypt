import * as Three from "three";

import { GLTFLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js";
import Stats from "https://unpkg.com/three@0.141.0/examples/jsm/libs/stats.module";

import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";

class World {
  constructor() {
    this.context = document;

    this.loader = this.initializeLoader();
    this.renderer = this.initializeRenderer();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    this.audio = this.initializeAudio();
    this.clock = this.initializeClock();

    const stats = Stats();
    this.context.body.appendChild(stats.dom);
    this.stats = stats;

    this.onWindowResize();
  }

  async initialize() {
    const glass = this.loader.loadGlass("/assets/models/crypt-glass.glb");
    const model = this.loader.loadModel("/assets/models/crypt.glb");
  }

  initializeLoader() {
    return new Loader(this.context);
  }

  initializeRenderer() {
    const renderer = new Three.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = Three.sRGBEncoding;
    renderer.toneMapping = Three.ReinhardToneMapping;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = Three.PCFSoftShadowMap;

    this.context.body.appendChild(renderer.domElement);

    return renderer;
  }

  initializeScene() {
    const scene = new Three.Scene();
    scene.fog = new Three.Fog(scene.background, 1, 250);

    const floor = this.loader.loadFloor("/assets/textures/floor.jpg");
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;

    floor.castShadow = false;
    floor.receiveShadow = true;

    scene.add(floor);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 750.0;

    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);
    camera.rotation.order = "YXZ";

    camera.position.x = -13;
    camera.position.y = 3;
    camera.position.z = -70;

    return camera;
  }

  initializeControls() {
    return new FirstPersonController(this.camera, this.context, 45);
  }

  initializeLights() {
    return new LightManager(this.scene);
  }

  initializeAudio() {
    const audioManager = new AudioManager(this.camera);
    // audioManager.play();

    return audioManager;
  }

  initializeClock() {
    return new Three.Clock();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame((t) => {
      const delta = this.clock.getDelta();

      this.controls.update(delta);
      this.renderer.render(this.scene, this.camera);
      this.animate();

      this.stats.update();
    });
  }
}

async function main() {
  const world = new World();
  await world.initialize();
  world.animate();
}
main();

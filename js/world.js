/* ThreeJS */
import * as THREE from "three";

/* Utility */
import { Reflector } from "https://unpkg.com/three@0.143.0/examples/jsm/objects/Reflector.js";
import Stats from "https://unpkg.com/three@0.143.0/examples/jsm/libs/stats.module";

import { CSS2DRenderer } from "./lib/CSS2DRenderer.js";

/* Custom */
import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";
import { VideoManager } from "./video.js";
import { SaintManager } from "./saints.js";

import { RGBELoader } from "https://unpkg.com/three@0.143.0/examples/jsm/loaders/RGBELoader.js";

class World {
  constructor() {
    this.context = document;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer = this.initializeRenderer();
    this.textRenderer = this.initializeTextRenderer();
    this.saintManager = this.initializeSaintManager();
    this.loader = this.initializeLoader();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    this.audio = this.initializeAudio();
    this.video = this.initializeVideo();
    this.clock = this.initializeClock();

    window.addEventListener("resize", () => {
      this.onWindowResize();
    });

    this.fps = 30;
    this.fpsInterval = 1000 / this.fps;
    this.then = window.performance.now();
    this.startTime = this.then;
  }

  initializeRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.5;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.context.body.appendChild(renderer.domElement);

    return renderer;
  }

  initializeTextRenderer() {
    const textRenderer = new CSS2DRenderer();

    textRenderer.setSize(this.width, this.height);
    textRenderer.domElement.style.position = "absolute";
    textRenderer.domElement.style.top = "0px";
    this.context.body.appendChild(textRenderer.domElement);

    return textRenderer;
  }

  initializeSaintManager() {
    return new SaintManager(this.context);
  }

  initializeLoader() {
    return new Loader(
      this,
      this.saintManager,
      this.renderer.capabilities.getMaxAnisotropy(),
      this.video
    );
  }

  initializeScene() {
    const scene = new THREE.Scene();

    new RGBELoader()
      .setPath("assets/textures/")
      .load("environment.hdr", (texture) => {
        // scene.background = 0x000000;
        // scene.fog = new THREE.Fog(scene.background, 1, 100);

        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
      });

    const planeGeo = new THREE.PlaneGeometry(500, 500);
    const groundMirror = new Reflector(planeGeo, {
      clipBias: 0.0003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: "#292929",
    });
    groundMirror.rotateX(-Math.PI / 2);
    groundMirror.opacity = 0.2;
    scene.add(groundMirror);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = this.width / this.height;
    const near = 1.0;
    const far = 200.0;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.rotation.order = "YXZ";

    return camera;
  }

  initializeControls() {
    return new FirstPersonController(
      this.camera,
      this.context,
      this.loader,
      this.saintManager,
      8.0
    );
  }

  initializeLights() {
    return new LightManager(this.scene);
  }

  initializeAudio() {
    const audioManager = new AudioManager(this.camera);
    return audioManager;
  }

  initializeClock() {
    return new THREE.Clock();
  }

  initializeVideo() {
    return new VideoManager(this.scene, this.controls, this.context);
  }

  onWindowResize() {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame((t) => {
      this.now = t;
      this.elapsed = this.now - this.then;

      if (this.elapsed > this.fpsInterval) {
        this.then = this.now - (this.elapsed % this.fpsInterval);

        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);
      }

      this.animate();
    });
  }
}

async function main() {
  const world = new World();
  await world.loader.loadModels();
  world.renderer.compile(world.scene, world.camera);
  world.animate();
}
main();

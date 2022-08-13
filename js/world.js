import * as Three from "three";

import Stats from "https://unpkg.com/three@0.141.0/examples/jsm/libs/stats.module";

import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";

import { EffectComposer } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/RenderPass.js";

class World {
  constructor() {
    this.context = document;

    this.renderer = this.initializeRenderer();
    this.loader = this.initializeLoader();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.composer = this.initializeComposer();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    // this.audio = this.initializeAudio();
    this.clock = this.initializeClock();

    const stats = Stats();
    const panels = [0, 1, 2];
    Array.from(stats.dom.children).forEach((child, index) => {
      child.style.display = panels.includes(index) ? "inline-block" : "none";
    });
    this.context.body.appendChild(stats.dom);
    this.stats = stats;

    window.addEventListener("resize", () => {
      this.onWindowResize();
    });
  }

  initializeRenderer() {
    const renderer = new Three.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = Three.sRGBEncoding;
    renderer.toneMapping = Three.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.5;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = Three.PCFSoftShadowMap;

    renderer.colorManagement = true;

    this.context.body.appendChild(renderer.domElement);

    return renderer;
  }

  initializeLoader() {
    return new Loader(this, this.renderer.capabilities.getMaxAnisotropy());
  }

  initializeScene() {
    const scene = new Three.Scene();
    scene.background = new Three.Color(0x000000);

    scene.fog = new Three.Fog(scene.background, 1, 250);

    const floor = this.loader.loadFloor("/assets/textures/marble.jpg");
    floor.position.set(0, 0, 0);
    floor.rotation.x = -Math.PI / 2;

    floor.receiveShadow = true;

    scene.add(floor);

    // const carpet = this.loader.loadCarpet("/assets/textures/carpet.jpg");
    // carpet.receiveShadow = true;
    // carpet.rotation.x = -Math.PI / 2;
    // carpet.position.set(-13, 0.05, 0);

    // carpet.receiveShadow = true;

    // scene.add(carpet);

    // const carpet2 = this.loader.loadCarpet2("/assets/textures/carpet.jpg");
    // carpet2.receiveShadow = true;
    // carpet2.rotation.x = -Math.PI / 2;
    // carpet2.position.set(0, 0.05, -80.75);

    // carpet2.receiveShadow = true;

    // scene.add(carpet2);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 300.0;

    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);
    camera.rotation.order = "YXZ";

    return camera;
  }

  initializeComposer() {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));

    return composer;
  }

  initializeControls() {
    return new FirstPersonController(this.camera, this.context, 15);
  }

  initializeLights() {
    return new LightManager(this.scene);
  }

  initializeAudio() {
    const audioManager = new AudioManager(this.camera);
    audioManager.play();

    return audioManager;
  }

  initializeClock() {
    return new Three.Clock();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame((t) => {
      const delta = this.clock.getDelta();

      this.controls.update(delta);
      this.composer.render();
      this.animate();

      this.stats.update();

      // console.log("Scene polycount:", this.renderer.info.render.triangles);
      // console.log("Active Drawcalls:", this.renderer.info.render.calls);
      // console.log("Textures in Memory", this.renderer.info.memory.textures);
      // console.log("Geometries in Memory", this.renderer.info.memory.geometries);
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

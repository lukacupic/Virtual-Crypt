import * as THREE from "three";

import Stats from "https://unpkg.com/three@0.141.0/examples/jsm/libs/stats.module";

import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";

import { RGBELoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/RenderPass.js";
import { Reflector } from "https://unpkg.com/three@0.141.0/examples/jsm/objects/Reflector.js";

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
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.3;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.context.body.appendChild(renderer.domElement);

    return renderer;
  }

  initializeLoader() {
    return new Loader(this, this.renderer.capabilities.getMaxAnisotropy());
  }

  initializeScene() {
    const scene = new THREE.Scene();
    scene.background = "#000000";
    scene.fog = new THREE.Fog(scene.background, 1, 200);

    new RGBELoader().load(
      "/assets/textures/castle_zavelstein_cellar_2k",
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;
        scene.environment = texture;
      }
    );

    const planeGeo = new THREE.PlaneGeometry(500, 500);
    const groundMirror = new Reflector(planeGeo, {
      clipBias: 0.0003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: "#0d0d0d",
    });
    groundMirror.rotateX(-Math.PI / 2);
    scene.add(groundMirror);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 300.0;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
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
    return new THREE.Clock();
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

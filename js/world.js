import * as Three from "three";

import Stats from "https://unpkg.com/three@0.141.0/examples/jsm/libs/stats.module";
import { GUI } from "https://unpkg.com/three@0.141.0/examples/jsm/libs/lil-gui.module.min.js";

import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";

import { EffectComposer } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "https://unpkg.com/three@0.141.0/examples/jsm/postprocessing/SSAOPass.js";

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
    this.gui = this.initializeGUI();
    this.clock = this.initializeClock();

    const stats = Stats();
    const panels = [0, 1, 2]; // 0: fps, 1: ms, 2: mb
    Array.from(stats.dom.children).forEach((child, index) => {
      child.style.display = panels.includes(index) ? "inline-block" : "none";
    });
    this.context.body.appendChild(stats.dom);
    this.stats = stats;

    this.onWindowResize();
  }

  async initialize() {
    this.loader.loadPhysicalModel("/assets/models/crypt-glass-optimized.glb");
    this.loader.loadVisualModel("/assets/models/crypt-optimized.glb");
  }

  initializeRenderer() {
    const renderer = new Three.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio * 0.9);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = Three.sRGBEncoding;
    renderer.toneMapping = Three.ReinhardToneMapping;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = Three.PCFSoftShadowMap;

    this.context.body.appendChild(renderer.domElement);

    return renderer;
  }

  initializeLoader() {
    return new Loader(this, this.renderer.capabilities.getMaxAnisotropy());
  }

  initializeScene() {
    const scene = new Three.Scene();
    scene.background = new Three.Color(0x000000);

    // scene.fog = new Three.Fog(scene.background, 1, 250);

    const floor = this.loader.loadFloor("/assets/textures/floor.jpg");
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;

    floor.castShadow = false;
    floor.receiveShadow = true;

    scene.add(floor);

    // carpet

    const carpet = this.loader.loadCarpet("/assets/textures/carpet.jpg");
    carpet.receiveShadow = true;
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(-13, 0.05, 0);

    carpet.castShadow = false;
    carpet.receiveShadow = true;

    scene.add(carpet);

    // carpet 2

    const carpet2 = this.loader.loadCarpet2("/assets/textures/carpet.jpg");
    carpet2.receiveShadow = true;
    carpet2.rotation.x = -Math.PI / 2;
    carpet2.position.set(0, 0.05, -80.75);

    carpet2.castShadow = false;
    carpet2.receiveShadow = true;

    scene.add(carpet2);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 300.0;

    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);
    camera.rotation.order = "YXZ";

    camera.position.x = 0;
    camera.position.y = 3;
    camera.position.z = -70;

    return camera;
  }

  initializeComposer() {
    // const composer = new EffectComposer(this.renderer);
    // composer.addPass(new RenderPass(this.scene, this.camera));
    // const ssaoPass = new SSAOPass(
    //   this.scene,
    //   this.camera,
    //   window.innerWidth,
    //   window.innerHeight
    // );
    // this.ssaoPass = ssaoPass;
    // ssaoPass.kernelRadius = 4;
    // composer.addPass(ssaoPass);
    // return composer;
  }

  initializeControls() {
    return new FirstPersonController(this.camera, this.context, 45);
  }

  initializeLights() {
    return new LightManager(this.scene);
  }

  initializeAudio() {
    const audioManager = new AudioManager(this.camera);
    audioManager.play();

    return audioManager;
  }

  initializeGUI() {
    // const gui = new GUI();
    // gui
    //   .add(this.ssaoPass, "output", {
    //     Default: SSAOPass.OUTPUT.Default,
    //     "SSAO Only": SSAOPass.OUTPUT.SSAO,
    //     "SSAO Only + Blur": SSAOPass.OUTPUT.Blur,
    //     Beauty: SSAOPass.OUTPUT.Beauty,
    //     Depth: SSAOPass.OUTPUT.Depth,
    //     Normal: SSAOPass.OUTPUT.Normal,
    //   })
    //   .onChange((value) => {
    //     this.ssaoPass.output = parseInt(value);
    //   });
    // gui.add(this.ssaoPass, "kernelRadius").min(0).max(32);
    // gui.add(this.ssaoPass, "minDistance").min(0.001).max(0.02);
    // gui.add(this.ssaoPass, "maxDistance").min(0.01).max(0.3);
    // return gui;
  }

  initializeClock() {
    return new Three.Clock();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame((t) => {
      const delta = this.clock.getDelta();

      this.controls.update(delta);
      // this.composer.render();
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

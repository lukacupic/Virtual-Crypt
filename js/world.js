/* ThreeJS */
import * as THREE from "three";

/* Postprocessing */
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  NormalPass,
  ShaderPass,
  DepthDownsamplingPass,
  SMAAImageLoader,
  SMAAEffect,
  SSAOEffect,
  TextureEffect,
  SMAAPreset,
  EdgeDetectionMode,
  BlendFunction,
  ColorChannel,
  DepthOfFieldEffect,
  DepthEffect,
  KernelSize,
  VignetteEffect,
  CopyMaterial,
  PredicationMode,
  SelectiveBloomEffect,
} from "./lib/postprocessing.js";

/* SSR */
import { SSREffect } from "./lib/screen-space-reflections.js";
import { SSRDebugGUI } from "./SSRDebugGUI.js";
import { Pane } from "./lib/tweakpane.js";
import { GUI } from "./lib/dat.gui.js";

/* Utility */
import { Reflector } from "https://unpkg.com/three@0.143.0/examples/jsm/objects/Reflector.js";
import Stats from "https://unpkg.com/three@0.143.0/examples/jsm/libs/stats.module";

import { CSS2DRenderer, CSS2DObject } from "./lib/CSS2DRenderer.js";

/* Custom */
import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";
import { VideoManager } from "./video.js";

class World {
  constructor() {
    this.context = document;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer = this.initializeRenderer();
    this.textRenderer = this.initializeTextRenderer();
    this.loader = this.initializeLoader();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.composer = this.initializeComposer();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    this.audio = this.initializeAudio();
    this.video = this.initializeVideo();
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
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.5;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

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

  initializeLoader() {
    return new Loader(this, this.renderer.capabilities.getMaxAnisotropy());
  }

  initializeScene() {
    const scene = new THREE.Scene();

    scene.background = "#000000";
    scene.fog = new THREE.Fog(scene.background, 1, 190);

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

  load() {
    const assets = {};
    const loadingManager = new THREE.LoadingManager();
    const smaaImageLoader = new SMAAImageLoader(loadingManager);

    return new Promise((resolve, reject) => {
      if (assets.size === 0) {
        smaaImageLoader.load(([search, area]) => {
          assets.set("smaa-search", search);
          assets.set("smaa-area", area);
        });
      } else {
        resolve();
      }
    });
  }

  initializeComposer() {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));

    // composer.addPass(this.createSSRPass());
    this.createAAPass(composer);

    return composer;
  }

  createSSRPass() {
    const options = {
      intensity: 1.0,
      exponent: 8.0,
      distance: 10.0,
      fade: 0.1,
      roughnessFade: 0.0,
      thickness: 0.0,
      ior: 1.03,

      maxRoughness: 0.0,
      maxDepthDifference: 10.0,

      blend: 1.0,
      correction: 1.0,
      correctionRadius: 1,

      blur: 1.0,
      blurKernel: 5,
      blurSharpness: 100,

      jitter: 0.75,
      jitterRoughness: 0.0,

      steps: 1,
      refineSteps: 2,
      missedRays: true,

      useNormalMap: true,
      useRoughnessMap: true,
      resolutionScale: 1,
      velocityResolutionScale: 1,
    };

    const ssrEffect = new SSREffect(this.scene, this.camera, options);
    // const gui = new SSRDebugGUI(ssrEffect, options);
    return new EffectPass(this.camera, ssrEffect);
  }

  createAAPass(composer) {
    const assets = this.load();
    const smaaEffect = new SMAAEffect(
      assets["smaa-search"],
      assets["smaa-area"],
      SMAAPreset.HIGH,
      EdgeDetectionMode.COLOR
    );

    smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.02);
    smaaEffect.edgeDetectionMaterial.setPredicationMode(PredicationMode.DEPTH);
    smaaEffect.edgeDetectionMaterial.setPredicationThreshold(0.002);
    smaaEffect.edgeDetectionMaterial.setPredicationScale(1.0);

    const edgesTextureEffect = new TextureEffect({
      blendFunction: BlendFunction.SKIP,
      texture: smaaEffect.renderTargetEdges.texture,
    });

    const weightsTextureEffect = new TextureEffect({
      blendFunction: BlendFunction.SKIP,
      texture: smaaEffect.renderTargetWeights.texture,
    });

    const effectPass = new EffectPass(
      this.camera,
      smaaEffect,
      edgesTextureEffect,
      weightsTextureEffect
    );

    this.smaaEffect = smaaEffect;
    this.edgesTextureEffect = edgesTextureEffect;
    this.weightsTextureEffect = weightsTextureEffect;
    this.effectPass = effectPass;

    composer.multisampling = 4;

    composer.addPass(effectPass);
  }

  initializeControls() {
    return new FirstPersonController(
      this.camera,
      this.context,
      this.loader,
      8.0
    );
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

  initializeVideo() {
    const videoManager = new VideoManager(
      this.scene,
      this.controls,
      this.width,
      this.height,
      this.context
    );
    videoManager.play();

    return videoManager;
  }

  onWindowResize() {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.textRenderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame((t) => {
      const delta = this.clock.getDelta();

      this.controls.update(delta);
      this.composer.render();
      this.textRenderer.render(this.scene, this.camera);
      this.stats.update();

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

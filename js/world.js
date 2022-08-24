/* ThreeJS */
import * as THREE from "three";

/* Postprocessing */
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  NormalPass,
  DepthDownsamplingPass,
  SMAAImageLoader,
  SMAAEffect,
  SSAOEffect,
  TextureEffect,
  SMAAPreset,
  EdgeDetectionMode,
  BlendFunction,
  ColorChannel,
} from "./lib/postprocessing.js";

/* SSR */
import { SSREffect } from "./lib/screen-space-reflections.js";
import { SSRDebugGUI } from "./SSRDebugGUI.js";
import { Pane } from "./lib/tweakpane.js";
import { GUI } from "./lib/dat.gui.js";

/* Utility */
import { Reflector } from "https://unpkg.com/three@0.143.0/examples/jsm/objects/Reflector.js";
import Stats from "https://unpkg.com/three@0.143.0/examples/jsm/libs/stats.module";

/* Custom */
import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { AudioManager } from "./audio.js";
import { Loader } from "./loader.js";

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
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.5;

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
    scene.fog = new THREE.Fog(scene.background, 1, 225);

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
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 300.0;

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

    return assets;
  }

  initializeComposer() {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));

    // composer.addPass(this.createSSRPass());
    composer.addPass(this.createSSAOPass(composer));

    return composer;
  }

  createSSRPass() {
    const options = {
      intensity: 1.0,
      exponent: 8.0,
      distance: 10.0,
      fade: 2.5,
      roughnessFade: 0.0,
      thickness: 0.0,
      ior: 1.7,

      maxRoughness: 0.0,
      maxDepthDifference: 100.0,

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
    return new EffectPass(this.camera, ssrEffect);
  }

  createSSAOPass(composer) {
    const normalPass = new NormalPass(this.scene, this.camera);
    const depthDownsamplingPass = new DepthDownsamplingPass({
      normalBuffer: normalPass.texture,
      resolutionScale: 0.5,
    });

    const capabilities = this.renderer.capabilities;
    const normalDepthBuffer = capabilities.isWebGL2
      ? depthDownsamplingPass.texture
      : null;

    const assets = this.load();

    const smaaEffect = new SMAAEffect(
      assets["smaa-search"],
      assets["smaa-area"],
      SMAAPreset.HIGH,
      EdgeDetectionMode.DEPTH
    );

    smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.01);

    const ssaoOptions = {
      resolutionScale: 0.25,
      blendFunction: BlendFunction.MULTIPLY,
      distanceScaling: true,
      depthAwareUpsampling: true,
      samples: 11,
      rings: 7,
      radius: 0.085,
      distanceThreshold: 0.97, // Render up to a distance of ~20 world units
      distanceFalloff: 0.03, // with an additional ~2.5 units of falloff.
      rangeThreshold: 0.0005, // Occlusion proximity of ~0.3 world units
      rangeFalloff: 0.001, // with ~0.1 units of falloff.
      minRadiusScale: 0.33,
      intensity: 4,
      bias: 0,
      fade: 0,
      luminanceInfluence: 0,
      color: null,
    };
    const ssaoEffect = new SSAOEffect(
      this.camera,
      normalPass.texture,
      ssaoOptions
    );

    const textureEffect = new TextureEffect({
      blendFunction: BlendFunction.SKIP,
      texture: depthDownsamplingPass.texture,
    });

    const effectPass = new EffectPass(
      this.camera,
      smaaEffect,
      ssaoEffect,
      textureEffect
    );

    composer.addPass(normalPass);

    if (capabilities.isWebGL2) {
      composer.addPass(depthDownsamplingPass);
    } else {
      console.log(
        "WebGL 2 not supported, falling back to naive depth downsampling"
      );
    }

    const color = new THREE.Color();

    const blendMode = ssaoEffect.blendMode;
    const uniforms = ssaoEffect.ssaoMaterial.uniforms;

    const RenderMode = {
      DEFAULT: 0,
      NORMALS: 1,
      DEPTH: 2,
    };

    const params = {
      distance: {
        threshold: uniforms.distanceCutoff.value.x,
        falloff:
          uniforms.distanceCutoff.value.y - uniforms.distanceCutoff.value.x,
      },
      proximity: {
        threshold: uniforms.proximityCutoff.value.x,
        falloff:
          uniforms.proximityCutoff.value.y - uniforms.proximityCutoff.value.x,
      },
      upsampling: {
        enabled: ssaoEffect.defines.has("DEPTH_AWARE_UPSAMPLING"),
        threshold: Number(ssaoEffect.defines.get("THRESHOLD")),
      },
      distanceScaling: {
        enabled: ssaoEffect.distanceScaling,
        "min scale": uniforms.minRadiusScale.value,
      },
      "lum influence": ssaoEffect.uniforms.get("luminanceInfluence").value,
      intensity: uniforms.intensity.value,
      bias: uniforms.bias.value,
      fade: uniforms.fade.value,
      "render mode": RenderMode.DEFAULT,
      resolution: ssaoEffect.resolution.scale,
      color: 0x000000,
      opacity: blendMode.opacity.value,
      "blend mode": blendMode.blendFunction,
    };
    function toggleRenderMode() {
      const mode = Number(params["render mode"]);

      if (mode === RenderMode.DEPTH) {
        textureEffect.setTextureSwizzleRGBA(ColorChannel.ALPHA);
      } else if (mode === RenderMode.NORMALS) {
        textureEffect.setTextureSwizzleRGBA(
          ColorChannel.RED,
          ColorChannel.GREEN,
          ColorChannel.BLUE,
          ColorChannel.ALPHA
        );
      }

      textureEffect.blendMode.setBlendFunction(
        mode !== RenderMode.DEFAULT ? BlendFunction.NORMAL : BlendFunction.SKIP
      );

      effectPass.encodeOutput = mode === RenderMode.DEFAULT;
    }

    const menu = new GUI();

    if (capabilities.isWebGL2) {
      menu.add(params, "render mode", RenderMode).onChange(toggleRenderMode);
    }

    menu.add(params, "resolution", 0.25, 1.0, 0.25).onChange((value) => {
      ssaoEffect.resolution.scale = value;
      depthDownsamplingPass.resolution.scale = value;
    });

    menu.add(ssaoEffect, "samples", 1, 32, 1);
    menu.add(ssaoEffect, "rings", 1, 16, 1);
    menu.add(ssaoEffect, "radius", 1e-6, 1.0, 0.001);

    let f = menu.addFolder("Distance Scaling");

    f.add(params.distanceScaling, "enabled").onChange((value) => {
      ssaoEffect.distanceScaling = value;
    });

    f.add(params.distanceScaling, "min scale", 0.0, 10.0, 0.001).onChange(
      (value) => {
        uniforms.minRadiusScale.value = value;
      }
    );

    if (capabilities.isWebGL2) {
      f = menu.addFolder("Depth-Aware Upsampling");

      f.add(params.upsampling, "enabled").onChange((value) => {
        ssaoEffect.depthAwareUpsampling = value;
      });

      f.add(params.upsampling, "threshold", 0.0, 10.0, 0.001).onChange(
        (value) => {
          // Note: This threshold is not really supposed to be changed.
          ssaoEffect.defines.set("THRESHOLD", value.toFixed(3));
          effectPass.recompile();
        }
      );
    }

    f = menu.addFolder("Distance Cutoff");

    f.add(params.distance, "threshold", 0.0, 1.0, 0.0001).onChange((value) => {
      ssaoEffect.setDistanceCutoff(value, params.distance.falloff);
    });

    f.add(params.distance, "falloff", 0.0, 1.0, 0.0001).onChange((value) => {
      ssaoEffect.setDistanceCutoff(params.distance.threshold, value);
    });

    f = menu.addFolder("Proximity Cutoff");

    f.add(params.proximity, "threshold", 0.0, 1, 0.0001).onChange((value) => {
      ssaoEffect.setProximityCutoff(value, params.proximity.falloff);
    });

    f.add(params.proximity, "falloff", 0.0, 1, 0.0001).onChange((value) => {
      ssaoEffect.setProximityCutoff(params.proximity.threshold, value);
    });

    menu.add(params, "bias", 0.0, 10, 0.001).onChange((value) => {
      uniforms.bias.value = value;
    });

    menu.add(params, "fade", 0.0, 10.0, 0.001).onChange((value) => {
      uniforms.fade.value = value;
    });

    menu.add(params, "lum influence", 0.0, 10.0, 0.001).onChange((value) => {
      ssaoEffect.uniforms.get("luminanceInfluence").value = value;
    });

    menu.add(params, "intensity", 1.0, 10.0, 0.01).onChange((value) => {
      uniforms.intensity.value = value;
    });

    menu.addColor(params, "color").onChange((value) => {
      ssaoEffect.color =
        value === 0x000000 ? null : color.setHex(value).convertSRGBToLinear();
    });

    menu.add(params, "opacity", 0.0, 1.0, 0.001).onChange((value) => {
      blendMode.opacity.value = value;
    });

    menu.add(params, "blend mode", BlendFunction).onChange((value) => {
      blendMode.setBlendFunction(Number(value));
    });

    if (window.innerWidth < 720) {
      menu.close();
    }

    return effectPass;
  }

  initializeControls() {
    return new FirstPersonController(this.camera, this.context, 12);
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

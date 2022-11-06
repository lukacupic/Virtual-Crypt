/* ThreeJS */
import * as THREE from "three";

/* Utility */
import { Reflector } from "https://unpkg.com/three@0.143.0/examples/jsm/objects/Reflector.js";
import Stats from "https://unpkg.com/three@0.143.0/examples/jsm/libs/stats.module";

/* Custom */
import { FirstPersonController } from "./controller.js";
import { LightManager } from "./lights.js";
import { Loader } from "./loader.js";

class World {
  constructor() {
    this.context = document;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer = this.initializeRenderer();
    this.loader = this.initializeLoader();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    this.clock = this.initializeClock();

    document.getElementById("blocker").style.display = "block";
    this.controls.setControlsPosition();
    this.controls.enableMovement(true);

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
      antialias: false,
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

  initializeLoader() {
    return new Loader(this, this.renderer.capabilities.getMaxAnisotropy());
  }

  initializeScene() {
    const scene = new THREE.Scene();

    // scene.background = "#000000";
    // scene.fog = new THREE.Fog(scene.background, 1, 190);

    // const planeGeo = new THREE.PlaneGeometry(500, 500);
    // const groundMirror = new Reflector(planeGeo, {
    //   clipBias: 0.0003,
    //   textureWidth: 1024,
    //   textureHeight: 1024,
    //   color: "#292929",
    // });
    // groundMirror.rotateX(-Math.PI / 2);
    // groundMirror.opacity = 0.2;
    // scene.add(groundMirror);

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
      8.0
    );
  }

  initializeLights() {
    return new LightManager(this.scene);
  }

  initializeClock() {
    return new THREE.Clock();
  }

  onWindowResize() {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame((t) => {
      const delta = this.clock.getDelta();

      this.controls.update(delta);
      this.renderer.render(this.scene, this.camera);
      this.stats.update();

      console.log(this.renderer.info.render.calls);

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

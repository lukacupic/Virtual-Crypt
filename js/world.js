import * as Three from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js";
import { Octree } from "https://unpkg.com/three@0.141.0/examples/jsm/math/Octree.js";
import { Capsule } from "https://unpkg.com/three@0.141.0/examples/jsm/math/Capsule.js";
import { FirstPersonController } from "./controller.js";

class World {
  constructor() {
    this.loadingManager = this.initializeLoadingManager();
    this.renderer = this.initializeRenderer();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    this.audioListener = this.initializeAudioListener();
    this.clock = this.initializeClock();

    this.worldOctree = new Octree();
    this.playerCollider = new Capsule(
      new Three.Vector3(0, 0.35, 0),
      new Three.Vector3(0, 1, 0),
      0.35
    );

    this.onWindowResize();
  }

  async initialize() {
    const model = this.loadModel("/assets/models/crypt-glass.glb");
  }

  initializeLoadingManager() {
    const manager = new Three.LoadingManager();

    manager.onStart = function (url, itemsLoaded, itemsTotal) {};

    manager.onLoad = function () {
      const loadingScreen = document.getElementById("loading-screen");
      loadingScreen.classList.add("fade-out");

      loadingScreen.style.pointerEvents = "none";
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {};

    manager.onError = function (url) {
      console.log("There was an error loading " + url);
    };

    return manager;
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

    document.body.appendChild(renderer.domElement);

    return renderer;
  }

  loadSkydome() {
    let loader = new Three.CubeTextureLoader(this.loadingManager);

    const texture = loader.load([
      "/assets/skybox/posx.bmp",
      "/assets/skybox/negx.bmp",
      "/assets/skybox/posy.bmp",
      "/assets/skybox/negy.bmp",
      "/assets/skybox/posz.bmp",
      "/assets/skybox/negz.bmp",
    ]);

    texture.encoding = Three.sRGBEncoding;
    return texture;
  }

  loadFloor(texturePath) {
    const textureLoader = new Three.TextureLoader(this.loadingManager);
    const floorTexture = textureLoader.load(texturePath);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    floorTexture.anisotropy = maxAnisotropy;
    floorTexture.encoding = Three.sRGBEncoding;
    floorTexture.wrapS = Three.RepeatWrapping;
    floorTexture.wrapT = Three.RepeatWrapping;
    floorTexture.repeat.set(256, 256);

    const floorMaterial = new Three.MeshStandardMaterial({ map: floorTexture });
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    const floorGeometry = new Three.PlaneBufferGeometry(1000, 1000, 10, 10);

    return new Three.Mesh(floorGeometry, floorMaterial);
  }

  async loadModel(modelPath) {
    const model = await new GLTFLoader(this.loadingManager).loadAsync(
      modelPath
    );

    let mesh = model.scene;
    mesh.position.y = 0;

    const s = 0.4;
    mesh.scale.set(s, s, s);

    model.scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // node.material.wireframe = true;
      }
    });

    this.worldOctree.fromGraphNode(mesh);
    this.scene.add(mesh);

    return mesh;
  }

  initializeGround() {
    const floor = this.loadFloor("/assets/textures/floor.jpg");
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;

    floor.castShadow = false;
    floor.receiveShadow = true;

    return floor;
  }

  initializeScene() {
    const scene = new Three.Scene();

    scene.background = this.loadSkydome();
    scene.fog = new Three.Fog(scene.background, 1, 500);

    const floor = this.initializeGround();
    scene.add(floor);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;

    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);
    camera.position.x = -13;
    camera.position.y = 3;
    camera.position.z = -70;

    return camera;
  }

  initializeControls() {
    return new FirstPersonController(this.camera, document, 12.0);
  }

  createAmbientLight() {
    return new Three.AmbientLight(0xf5ffbd, 0.01);
  }

  createHemisphereLight() {
    return new Three.HemisphereLight(0xffffbb, 0xf9ffbd, 0.5);
  }

  createDirectionalLight() {
    const directionalLight = new Three.DirectionalLight(0xffffff, 3);

    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 2, -1);
    directionalLight.position.multiplyScalar(30);

    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    const d = 100;

    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.bias = -0.00004;

    directionalLight.target.updateMatrixWorld();

    return directionalLight;
  }

  createPointLight1() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-13.1, 10, -45);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight2() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-13.1, 10, 4);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight3() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-13.1, 10, -116.75);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight4() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-49, 8, -81);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight5() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(23.75, 10, -81);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  initializeLights() {
    this.scene.add(this.createAmbientLight());
    this.scene.add(this.createHemisphereLight());
    // this.scene.add(this.createDirectionalLight());
    this.scene.add(this.createPointLight1());
    this.scene.add(this.createPointLight2());
    this.scene.add(this.createPointLight3());
    this.scene.add(this.createPointLight4());
    this.scene.add(this.createPointLight5());
  }

  initializeAudioListener() {
    const listener = new Three.AudioListener();
    this.camera.add(listener);

    const sound = new Three.Audio(listener);

    const audioLoader = new Three.AudioLoader();
    audioLoader.load("/assets/sounds/choir.ogg", function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.25);
      // sound.play();
    });
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
    });
  }
}

async function main() {
  const world = new World();
  await world.initialize();
  world.animate();
}
main();

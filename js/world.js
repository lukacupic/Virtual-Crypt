import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/PointerLockControls.js';

class World {

  constructor() {
    this.loadingManager = this.initializeLoadingManager();
    this.renderer = this.initializeRenderer();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onWindowResize);
  }

  async initialize() {
    const model = this.loadModel('/assets/models/church.glb');
  }

  initializeLoadingManager() {
    const manager = new THREE.LoadingManager();

    manager.onStart = function (url, itemsLoaded, itemsTotal) {
    };

    manager.onLoad = function () {
      const loadingScreen = document.getElementById('loading-screen');
      loadingScreen.classList.add('fade-out');
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    };

    manager.onError = function (url) {
      console.log('There was an error loading ' + url);
    };

    return manager;
  }

  initializeRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: false });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    return renderer;
  }

  loadSkydome() {
    let loader = new THREE.CubeTextureLoader(this.loadingManager);

    const texture = loader.load([
      '/assets/skybox/posx.jpg',
      '/assets/skybox/negx.jpg',
      '/assets/skybox/posy.jpg',
      '/assets/skybox/negy.jpg',
      '/assets/skybox/posz.jpg',
      '/assets/skybox/negz.jpg',
    ]);

    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  loadFloor(texturePath) {
    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    const floorTexture = textureLoader.load(texturePath);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    floorTexture.anisotropy = maxAnisotropy;
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(256, 256);
    floorTexture.encoding = THREE.sRGBEncoding;

    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    const floorGeometry = new THREE.PlaneBufferGeometry(1000, 1000, 10, 10);

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;

    return floor;
  }

  async loadModel() {
    const model = await new GLTFLoader(this.loadingManager).loadAsync('/assets/models/church.glb');
    const mesh = model.scene;

    const s = 0.225;
    mesh.scale.set(s, s, s);
    mesh.position.y = -10;

    model.scene.traverse(function (object) {
      if (object.isMesh) {
        object.castShadow = true;
      }
    });

    this.scene.add(mesh);
    return mesh;
  }

  initializeScene() {
    const scene = new THREE.Scene();

    scene.background = this.loadSkydome();
    scene.fog = new THREE.Fog(scene.background, 1, 500);

    const floor = this.loadFloor('/assets/floor.jpg');
    scene.add(floor);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.y = 2;

    return camera;
  }

  initializeControls() {
    const controls = new PointerLockControls(this.camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
      controls.lock();
    });

    controls.addEventListener('lock', function () {
      instructions.style.display = 'none';
      blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
      blocker.style.display = 'block';
      instructions.style.display = '';
    });

    const onKeyDown = function (event) {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;

        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
      }
    };

    const onKeyUp = function (event) {
      switch (event.code) {

        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;

        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    this.scene.add(controls.getObject());

    return controls;
  }

  createAmbientLight() {
    return new THREE.AmbientLight(0xf5ffbd, 0.5);
  }

  createHemisphereLight() {
    return new THREE.HemisphereLight(0xffffbb, 0xf9ffbd, 1);
  }

  createDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 4);

    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(- 1, 1.75, 1);
    directionalLight.position.multiplyScalar(30);

    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

    const d = 100;

    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.bias = - 0.0001;

    return directionalLight;
  }

  createPointLight() {
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);

    const bulbMaterial = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000
    });

    const bulbLight = new THREE.PointLight(0xffee88, 100, 20, 2);
    bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(0, 2, 0);
    bulbLight.castShadow = true;

    return bulbLight;
  }

  initializeLights() {
    this.scene.add(this.createAmbientLight());
    this.scene.add(this.createHemisphereLight());
    this.scene.add(this.createDirectionalLight());
    this.scene.add(this.createPointLight());
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame((t) => {
      if (this.controls.isLocked === true) {
        const delta = this.clock.getDelta();

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 400.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 400.0 * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.renderer.render(this.scene, this.camera);
      }
    });
  }
}

async function main() {
  const world = new World();

  await world.initialize();

  world.animate();
}

main();
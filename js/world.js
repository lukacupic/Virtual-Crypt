import * as Three from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js";
import { FirstPersonController } from "./controller.js";
import { PhysicsManager } from "./physics.js";

class RigidBody {
  constructor() {}

  setRestitution(val) {
    this.body.setRestitution(val);
  }

  setFriction(val) {
    this.body.setFriction(val);
  }

  setRollingFriction(val) {
    this.body.setRollingFriction(val);
  }

  createBox(mass, pos, quat, size) {
    this.transform = new Ammo.btTransform();
    this.transform.setIdentity();
    this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    this.motionState = new Ammo.btDefaultMotionState(this.transform);

    const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    this.shape = new Ammo.btBoxShape(btSize);
    this.shape.setMargin(0.05);

    this.inertia = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
      this.shape.calculateLocalInertia(mass, this.inertia);
    }

    this.info = new Ammo.btRigidBodyConstructionInfo(
      mass,
      this.motionState,
      this.shape,
      this.inertia
    );
    this.body = new Ammo.btRigidBody(this.info);

    Ammo.destroy(btSize);
  }

  createObject(mass, geometry, position, quaternion) {
    this.transform = new Ammo.btTransform();
    this.transform.setIdentity();
    this.transform.setOrigin(
      new Ammo.btVector3(position.x, position.y, position.z)
    );
    this.transform.setRotation(
      new Ammo.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
    );
    this.motionState = new Ammo.btDefaultMotionState(this.transform);

    this.shape = new Ammo.btConvexHullShape();

    this.vectA = new Ammo.btVector3(0, 0, 0);
    this.vectB = new Ammo.btVector3(0, 0, 0);
    this.vectC = new Ammo.btVector3(0, 0, 0);

    this.verticesPos = geometry.getAttribute("position").array;
    this.triangles = [];
    for (let i = 0; i < this.verticesPos.length; i += 3) {
      this.triangles.push({
        x: this.verticesPos[i],
        y: this.verticesPos[i + 1],
        z: this.verticesPos[i + 2],
      });
    }

    for (let i = 0; i < this.triangles.length - 3; i += 3) {
      this.vectA.setX(this.triangles[i].x);
      this.vectA.setY(this.triangles[i].y);
      this.vectA.setZ(this.triangles[i].z);
      this.shape.addPoint(this.vectA, true);

      this.vectB.setX(this.triangles[i + 1].x);
      this.vectB.setY(this.triangles[i + 1].y);
      this.vectB.setZ(this.triangles[i + 1].z);
      this.shape.addPoint(this.vectB, true);

      this.vectC.setX(this.triangles[i + 2].x);
      this.vectC.setY(this.triangles[i + 2].y);
      this.vectC.setZ(this.triangles[i + 2].z);
      this.shape.addPoint(this.vectC, true);
    }

    this.shape.setMargin(0.05);

    this.inertia = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
      this.shape.calculateLocalInertia(mass, this.inertia);
    }

    this.info = new Ammo.btRigidBodyConstructionInfo(
      mass,
      this.motionState,
      this.shape,
      this.inertia
    );

    this.body = new Ammo.btRigidBody(this.info);

    Ammo.destroy(this.vectA);
    Ammo.destroy(this.vectB);
    Ammo.destroy(this.vectC);
  }
}

class World {
  constructor() {
    this.physicsManager = this.initializePhysicsManager();
    this.loadingManager = this.initializeLoadingManager();
    this.renderer = this.initializeRenderer();
    this.scene = this.initializeScene();
    this.camera = this.initializeCamera();
    this.controls = this.initializeControls();
    this.lights = this.initializeLights();
    this.clock = this.initializeClock();

    this.onWindowResize();
  }

  async initialize() {
    // const model = this.loadModel("/assets/models/church-alpha.glb");
    const model = this.loadModel("/assets/models/flamingo.glb");
  }

  initializePhysicsManager() {
    return new PhysicsManager();
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
    const renderer = new Three.WebGLRenderer({ antialias: false });

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

    const floorGeometry = new Three.PlaneBufferGeometry(100, 100, 10, 10);

    return new Three.Mesh(floorGeometry, floorMaterial);
  }

  async loadModel(modelPath) {
    const model = await new GLTFLoader(this.loadingManager).loadAsync(
      modelPath
    );
    let mesh = model.scene;
    mesh.position.y = 100;

    const s = 0.25;
    mesh.children[0].geometry.scale(s, s, s);

    model.scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const rbModel = new RigidBody();
    const modelMass = 1;
    rbModel.createObject(
      modelMass,
      model.scene.children[0].geometry,
      mesh.position,
      mesh.quaternion
    );

    rbModel.setRestitution(0.2);
    rbModel.setFriction(1);
    rbModel.setRollingFriction(5);

    this.physicsManager.addRigidBody(mesh, rbModel, modelMass);
    this.scene.add(mesh);

    return mesh;
  }

  initializeGround() {
    const floor = this.loadFloor("/assets/textures/floor.jpg");
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;

    // create ghost (invisible) floor mesh for the physics world
    const ghostFloor = new Three.Mesh(
      new Three.BoxGeometry(1000, 1, 1000),
      new Three.MeshStandardMaterial({ color: 0x404040 })
    );
    ghostFloor.castShadow = false;
    ghostFloor.receiveShadow = true;

    const floorMass = 0;
    const rbFloor = new RigidBody();
    rbFloor.createBox(
      floorMass,
      ghostFloor.position,
      ghostFloor.quaternion,
      new Three.Vector3(1000, 0, 1000)
    );
    rbFloor.setRestitution(0.99);

    return [floor, rbFloor, floorMass];
  }

  initializeBox() {
    const boxMesh = new Three.Mesh(
      new Three.BoxGeometry(4, 4, 4),
      new Three.MeshStandardMaterial({ color: 0x808080 })
    );

    boxMesh.position.set(0, 40, 0);
    boxMesh.rotateX(Math.PI / 3);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;

    const rbBox = new RigidBody();
    const boxMass = 5;
    rbBox.createBox(
      boxMass,
      boxMesh.position,
      boxMesh.quaternion,
      new Three.Vector3(4, 4, 4)
    );

    rbBox.setRestitution(0.2);
    rbBox.setFriction(1);
    rbBox.setRollingFriction(5);

    return [boxMesh, rbBox, boxMass];
  }

  initializeScene() {
    const scene = new Three.Scene();

    scene.background = this.loadSkydome();
    scene.fog = new Three.Fog(scene.background, 1, 500);

    const [floor, rbFloor, floorMass] = this.initializeGround();
    this.physicsManager.addRigidBody(floor, rbFloor, floorMass);
    scene.add(floor);

    const [boxMesh, rbBox, boxMass] = this.initializeBox();
    this.physicsManager.addRigidBody(boxMesh, rbBox, boxMass);
    scene.add(boxMesh);

    return scene;
  }

  initializeCamera() {
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;

    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);
    camera.position.x = 30;
    camera.position.y = 3;
    camera.position.z = 30;

    const Y_AXIS = new Three.Vector3(0, 1, 0);
    camera.rotateOnAxis(Y_AXIS, Math.PI / 4);

    return camera;
  }

  initializeControls() {
    return new FirstPersonController(this.camera, document, 15.0);
  }

  createAmbientLight() {
    return new Three.AmbientLight(0xf5ffbd, 0.5);
  }

  createHemisphereLight() {
    return new Three.HemisphereLight(0xffffbb, 0xf9ffbd, 1);
  }

  createDirectionalLight() {
    const directionalLight = new Three.DirectionalLight(0xffffff, 4);

    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 2, -1);
    directionalLight.position.multiplyScalar(30);

    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

    const d = 100;

    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.bias = -0.0001;

    return directionalLight;
  }

  createPointLight() {
    const bulbGeometry = new Three.SphereGeometry(0.02, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 100, 20, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
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

      this.physicsManager.update(delta);
      this.controls.update(delta);
      this.renderer.render(this.scene, this.camera);
      this.animate();
    });
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  Ammo().then(async (lib) => {
    Ammo = lib;
    let world = new World();
    await world.initialize();

    world.animate();
  });
});

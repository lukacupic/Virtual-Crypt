import * as Three from "three";

import { GLTFLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js";

export class Loader {
  constructor(world, anisotropy) {
    this.world = world;
    this.manager = this.initialize(world.context);
  }

  initialize(document) {
    const manager = new Three.LoadingManager();

    manager.onStart = (url, itemsLoaded, itemsTotal) => {};

    manager.onLoad = () => {
      const loadingScreen = document.getElementById("loading-screen");
      loadingScreen.classList.add("fade-out");

      loadingScreen.style.pointerEvents = "none";
    };

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {};

    manager.onError = (url) => {
      console.log("There was an error loading " + url);
    };

    return manager;
  }

  loadFloor(path) {
    const textureLoader = new Three.TextureLoader(this.manager);
    const floorTexture = textureLoader.load(path);

    const maxAnisotropy = this.anisotropy;
    floorTexture.anisotropy = maxAnisotropy;
    floorTexture.encoding = Three.sRGBEncoding;
    floorTexture.wrapS = Three.RepeatWrapping;
    floorTexture.wrapT = Three.RepeatWrapping;
    floorTexture.repeat.set(128, 128);

    const floorMaterial = new Three.MeshStandardMaterial({ map: floorTexture });
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    const floorGeometry = new Three.PlaneBufferGeometry(500, 500);

    return new Three.Mesh(floorGeometry, floorMaterial);
  }

  loadCarpet(path) {
    const textureLoader = new Three.TextureLoader(this.manager);
    const carpetTexture = textureLoader.load(path);

    carpetTexture.anisotropy = this.anisotropy;
    carpetTexture.encoding = Three.sRGBEncoding;
    carpetTexture.wrapS = Three.RepeatWrapping;
    carpetTexture.wrapT = Three.RepeatWrapping;
    carpetTexture.repeat.set(4, 128);

    const carpetMaterial = new Three.MeshStandardMaterial({
      map: carpetTexture,
    });
    carpetMaterial.color.setHSL(0.095, 1, 0.75);

    const carpetGeometry = new Three.PlaneBufferGeometry(5, 300);

    return new Three.Mesh(carpetGeometry, carpetMaterial);
  }

  async loadPhysicalModel(modelPath, x = 0, y = 0, z = 0) {
    const mesh = await this.loadVisualModel(modelPath, x, y, z);

    this.world.controls.worldOctree.fromGraphNode(mesh);

    return mesh;
  }

  loadCarpet2(path) {
    const textureLoader = new Three.TextureLoader(this.manager);
    const carpetTexture = textureLoader.load(path);

    carpetTexture.anisotropy = this.anisotropy;
    carpetTexture.encoding = Three.sRGBEncoding;
    carpetTexture.wrapS = Three.RepeatWrapping;
    carpetTexture.wrapT = Three.RepeatWrapping;
    carpetTexture.repeat.set(128, 4);

    const carpetMaterial = new Three.MeshStandardMaterial({
      map: carpetTexture,
    });
    carpetMaterial.color.setHSL(0.095, 1, 0.75);

    const carpetGeometry = new Three.PlaneBufferGeometry(300, 5);

    return new Three.Mesh(carpetGeometry, carpetMaterial);
  }

  async loadPhysicalModel(modelPath, x = 0, y = 0, z = 0) {
    const mesh = await this.loadVisualModel(modelPath, x, y, z);

    this.world.controls.worldOctree.fromGraphNode(mesh);

    return mesh;
  }

  async loadVisualModel(modelPath, x = 0, y = 0, z = 0) {
    const model = await new GLTFLoader(this.manager).loadAsync(modelPath);

    let mesh = model.scene;
    mesh.position.set(x, y, z);

    const s = 0.4;
    mesh.scale.set(s, s, s);

    model.scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // node.material.wireframe = true;

        if (node.material.map) {
          node.material.map.anisotropy = this.anisotropy;
        }
      }
    });

    this.world.scene.add(mesh);

    return mesh;
  }
}

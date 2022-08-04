import * as Three from "three";

import { GLTFLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader.js";
import { TextureLoader } from "three";

export class Loader {
  constructor(world, anisotropy) {
    this.world = world;
    this.manager = this.initialize(world.context);
    this.textureLoader = new TextureLoader(this.manager);
    this.anisotropy = anisotropy;
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

  loadTexture(path, repeatX, repeatY) {
    const texture = this.textureLoader.load(path);

    texture.anisotropy = this.anisotropy;
    texture.encoding = Three.sRGBEncoding;
    texture.wrapS = Three.RepeatWrapping;
    texture.wrapT = Three.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);

    return texture;
  }

  loadFloor(path) {
    const floorTexture = this.loadTexture(path, 128, 128);

    const floorMaterial = new Three.MeshStandardMaterial({ map: floorTexture });
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    const floorGeometry = new Three.PlaneBufferGeometry(500, 500);

    return new Three.Mesh(floorGeometry, floorMaterial);
  }

  loadCarpet(path) {
    const carpetTexture = this.loadTexture(path, 4, 128);

    const carpetMaterial = new Three.MeshStandardMaterial({
      map: carpetTexture,
    });
    carpetMaterial.color.setHSL(0.095, 1, 0.75);

    const carpetGeometry = new Three.PlaneBufferGeometry(10, 300);

    return new Three.Mesh(carpetGeometry, carpetMaterial);
  }

  loadCarpet2(path) {
    const carpetTexture = this.loadTexture(path, 128, 4);

    const carpetMaterial = new Three.MeshStandardMaterial({
      map: carpetTexture,
    });
    carpetMaterial.color.setHSL(0.095, 1, 0.75);

    const carpetGeometry = new Three.PlaneBufferGeometry(300, 7);

    return new Three.Mesh(carpetGeometry, carpetMaterial);
  }

  async loadPhysicalModel(modelPath, x = 0, y = 0, z = 0, scale = 1) {
    const mesh = await this.loadVisualModel(modelPath, x, y, z, scale);

    this.world.controls.worldOctree.fromGraphNode(mesh);

    return mesh;
  }

  async loadVisualModel(modelPath, x = 0, y = 0, z = 0, scale = 1) {
    const model = await new GLTFLoader(this.manager).loadAsync(modelPath);

    let mesh = model.scene;
    mesh.position.set(x, y, z);

    mesh.scale.set(scale, scale, scale);

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

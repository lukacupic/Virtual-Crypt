import * as THREE from "three";

import { LightManager } from "./lights.js";

import { GLTFLoader } from "https://unpkg.com/three@0.143.0/examples/jsm/loaders/GLTFLoader.js";

export class Loader {
  constructor(world, anisotropy) {
    this.world = world;
    this.manager = this.initialize(world.context);

    this.gltfLoader = new GLTFLoader(this.manager);

    this.anisotropy = anisotropy;
  }

  initialize(document) {
    const manager = new THREE.LoadingManager();

    manager.onStart = (url, itemsLoaded, itemsTotal) => {};

    manager.onLoad = () => {
      // const loadingScreen = document.getElementById("loading-screen");
      // loadingScreen.classList.add("fade-out");
      // loadingScreen.style.pointerEvents = "none";
    };

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      // const progressBar = document.getElementById("progress-bar");
      // progressBar.value = (itemsLoaded / itemsTotal) * 100;
    };

    manager.onError = (url) => {};

    return manager;
  }

  async loadModels() {
    // this.loadPhysicalModel("/assets/models/glassc.glb", [], [], 0.4);
    this.loadVisualModel("/assets/models/crypt.glb", [], [], 0.4);
  }

  async loadPhysicalModel(modelPath, position, rotation, scale = 1) {
    const mesh = await this.loadVisualModel(
      modelPath,
      position,
      rotation,
      scale
    );

    this.world.controls.worldOctree.fromGraphNode(mesh);

    return mesh;
  }

  async loadVisualModel(modelPath, position, rotation, scale) {
    const model = await this.gltfLoader.loadAsync(modelPath);

    let mesh = model.scene;
    mesh.position.set(position[0] || 0, position[1] || 0, position[2] || 0);

    mesh.rotateX(rotation[0] || 0);
    mesh.rotateY(rotation[1] || 0);
    mesh.rotateZ(rotation[2] || 0);

    mesh.scale.set(scale || 1, scale || 1, scale || 1);

    mesh.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // node.material.wireframe = true;

        if (node.material.map) {
          node.material.map.anisotropy = this.anisotropy;
        }
      } else if (node.isLight) {
        LightManager.configureLight(node);
      }
    });

    this.world.scene.add(mesh);

    return mesh;
  }
}

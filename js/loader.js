import * as THREE from "three";

import { LightManager } from "./lights.js";

import { GLTFLoader } from "./lib/GLTFLoader.js";

export class Loader {
  constructor(world, anisotropy) {
    this.world = world;
    this.manager = this.initialize(world.context);
    this.gltfLoader = new GLTFLoader(this.manager);
    this.anisotropy = anisotropy;
    this.saints = new Map();
  }

  initialize(document) {
    const manager = new THREE.LoadingManager();

    manager.onStart = (url, itemsLoaded, itemsTotal) => {};

    manager.onLoad = () => {
      // const loadingScreen = document.getElementById("loading-screen");
      // loadingScreen.classList.add("fade-out");
      // loadingScreen.style.pointerEvents = "none";
    };

    manager.onError = (url) => {};

    return manager;
  }

  async loadModels() {
    // this.loadPhysicalModel("/assets/models/glassc.glb", [], [], 0.4);
    this.loadVisualModel("/assets/models/crypt.glb", [], [], 0.4);
  }

  /*
   * Checks if the given object/mesh is a saint.
   */
  isSaint(object) {
    let name = object.name;
    return name.startsWith("Sactus") || name.startsWith("Sacta");
  }

  /*
   * Saves the given saint object into the map of saints.
   * This map is used for checking the distance between them and the camera
   * for displaying information on each saint.
   */
  async saveToSaints(mesh) {
    let name = mesh.name;

    mesh.infoText = "Test " + name;
    this.saints.set(name, mesh);

    let position = new THREE.Vector3();
    mesh.getWorldPosition(position);
    mesh.worldPosition = position;
  }

  /*
   * Returns the map of all saints' objects.
   */
  getSaints() {
    return this.saints;
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

    mesh.layers.enableAll();

    mesh.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.material.map) {
          object.material.map.anisotropy = this.anisotropy;
        }

        if (this.isSaint(object)) {
          this.saveToSaints(object);
        }
      } else if (object.isLight) {
        LightManager.configureLight(object);
      }
    });

    this.world.scene.add(mesh);

    return mesh;
  }
}

import * as THREE from "three";

import { LightManager } from "./lights.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.143.0/examples/jsm/loaders/RGBELoader.js";

export class Loader {
  constructor(world, anisotropy) {
    this.world = world;
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.anisotropy = anisotropy;
  }

  async loadModels() {
    // this.loadPhysicalModel("/assets/models/world.glb", [], [], 0.4);
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

    mesh.layers.enableAll();

    mesh.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.material.map) {
          object.material.map.anisotropy = this.anisotropy;
          object.material.flatShading = true;
        }
      } else if (object.isLight) {
        LightManager.configureLight(object);
      }
    });

    this.world.scene.add(mesh);

    return mesh;
  }
}

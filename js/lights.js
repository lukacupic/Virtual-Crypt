import * as THREE from "three";

export class LightManager {
  constructor(scene) {
    this.scene = scene;

    this.initialize(scene);
  }

  initialize(scene) {
    scene.add(this.createAmbientLight());
    // scene.add(this.createHemisphereLight());
  }

  createAmbientLight() {
    return new THREE.AmbientLight(0xffffff, 0.05);
  }
}

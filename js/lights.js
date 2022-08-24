import * as THREE from "three";

export class LightManager {
  constructor(scene) {
    this.scene = scene;

    this.initialize(scene);
  }

  initialize(scene) {
    scene.add(this.createAmbientLight());
    scene.add(this.createHemisphereLight());
  }

  createAmbientLight() {
    return new THREE.AmbientLight("#f2e4a2", 0.5);
  }

  createHemisphereLight() {
    return new THREE.HemisphereLight(
      "#f2e4a2", // ceiling color
      "#3b3b3b", // ground color
      0.5
    );
  }

  static configurePointLight(pointLight) {
    // small chamber light
    if (this.isWhite(pointLight.color)) {
      pointLight.intensity = 100;
      pointLight.distance = 3;
      pointLight.decay = 2;

      // large ceiling light
    } else {
      pointLight.intensity = 500;
      pointLight.distance = 50;
      pointLight.decay = 2;
    }
  }

  static isWhite(color) {
    return ((color.r == color.g) == color.b) == 1;
  }
}

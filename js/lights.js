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
    return new THREE.AmbientLight("#f2e4a2", 1);
  }

  createHemisphereLight() {
    return new THREE.HemisphereLight(
      "#f2e4a2", // ceiling color
      "#3b3b3b", // ground color
      0.5
    );
  }

  static configureLight(light) {
    light.shadow.autoUpdate = false;

    // chamber light
    console.log(light.color);
    if (this.isWhite(light.color)) {
      light.intensity = 10;

      // large ceiling light
    } else {
      light.intensity = 2500;
      light.distance = 50;
      light.decay = 2;
    }
  }

  static isWhite(color) {
    return ((color.r == color.g) == color.b) == 1;
  }
}

import * as THREE from "three";

export class LightManager {
  constructor(scene) {
    this.scene = scene;

    this.initialize(scene);
  }

  initialize(scene) {
    scene.add(this.createAmbientLight());
    scene.add(this.createHemisphereLight());
    scene.add(this.createDirectionalLight());
  }

  createAmbientLight() {
    return new THREE.AmbientLight("#fcfbd2", 0.5);
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
    if (this.isWhite(light.color)) {
      light.intensity = 20;

      // large ceiling light
    } else {
      light.intensity = 2500;
      light.distance = 50;
      light.decay = 2;
    }
  }

  createDirectionalLight() {
    const light = new THREE.DirectionalLight("#3d91ff", 20);
    light.position.set(0, 1, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;

    this.scene.add(light);

    return light;
  }

  static isWhite(color) {
    return ((color.r == color.g) == color.b) == 1;
  }
}

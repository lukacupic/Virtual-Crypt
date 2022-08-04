import * as Three from "three";

export class LightManager {
  constructor(scene) {
    this.scene = scene;

    this.initialize(scene);
  }

  initialize(scene) {
    scene.add(this.createAmbientLight());
    // scene.add(this.createHemisphereLight());

    const pointLights = this.createPointLights([
      { x: -13.1, y: 10.0, z: -116.76 },
      { x: -49.5, y: 10.0, z: -81 },
      { x: +23.0, y: 10.0, z: -81 },
      { x: -13.1, y: 10.0, z: -44.5 },
      { x: -13.1, y: 10.0, z: +4.0 },
      { x: -13.1, y: 10.0, z: +95.0 },
    ]);

    scene.add(...pointLights);
  }

  createAmbientLight() {
    return new Three.AmbientLight(0xf5ffbd, 0.005);
  }

  createPointLights(positions) {
    const pointLightColor = 0xffee96;
    const pointLightIntensity = 90;
    const pointLightDistance = 40;
    const pointLightDecay = 2;

    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    let bulbs = positions.map((p) => {
      const bulbLight = new Three.PointLight(
        pointLightColor,
        pointLightIntensity,
        pointLightDistance,
        pointLightDecay
      );

      bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
      bulbLight.position.set(p.x, p.y, p.z);
      bulbLight.castShadow = true;
      bulbLight.shadow.bias = -0.5;
      bulbLight.shadow.autoUpdate = false;

      return bulbLight;
    });

    return bulbs;
  }
}

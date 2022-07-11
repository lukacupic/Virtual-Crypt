import * as Three from "three";

export class LightManager {
  constructor(scene) {
    this.scene = scene;

    this.initialize(scene);
  }

  initialize(scene) {
    scene.add(this.createAmbientLight());
    // scene.add(this.createHemisphereLight());
    // scene.add(this.createDirectionalLight());

    const pointLights = this.createPointLights([
      { x: -13.1, y: 10.0, z: -116.76 },
      { x: -49.0, y: 10.0, z: -81.0 },
      { x: +23.6, y: 10.0, z: -81.0 },
      { x: -13.1, y: 10.0, z: -40.0 },
      { x: -13.1, y: 10.0, z: +4.0 },
      { x: -13.1, y: 10.0, z: +95.0 },
    ]);

    scene.add(...pointLights);
  }

  createAmbientLight() {
    return new Three.AmbientLight(0xf5ffbd, 0.01);
  }

  createHemisphereLight() {
    return new Three.HemisphereLight(0xffffbb, 0xf9ffbd, 0.5);
  }

  createDirectionalLight() {
    const directionalLight = new Three.DirectionalLight(0xffffff, 3);

    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 2, -1);
    directionalLight.position.multiplyScalar(30);

    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.autoUpdate = false;

    const d = 100;

    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.bias = -0.00004;

    directionalLight.target.updateMatrixWorld();

    return directionalLight;
  }

  createPointLights(positions) {
    const pointLightColor = 0xffee96;
    const pointLightIntensity = 80;
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

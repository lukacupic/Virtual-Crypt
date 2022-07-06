import * as Three from "three";

export class LightManager {
  constructor(scene) {
    this.initialize(scene);
  }

  initialize(scene) {
    scene.add(this.createAmbientLight());
    // scene.add(this.createHemisphereLight());
    // scene.add(this.createDirectionalLight());
    scene.add(this.createPointLight1());
    scene.add(this.createPointLight2());
    scene.add(this.createPointLight3());
    scene.add(this.createPointLight4());
    scene.add(this.createPointLight5());
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

  createPointLight1() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-13.1, 10, -45);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight2() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-13.1, 10, 4);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight3() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-13.1, 10, -116.75);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight4() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(-49, 8, -81);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }

  createPointLight5() {
    const bulbGeometry = new Three.SphereGeometry(0.0, 16, 8);

    const bulbMaterial = new Three.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000,
    });

    const bulbLight = new Three.PointLight(0xffee88, 80, 40, 2);
    bulbLight.add(new Three.Mesh(bulbGeometry, bulbMaterial));
    bulbLight.position.set(23.75, 10, -81);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.5;

    return bulbLight;
  }
}

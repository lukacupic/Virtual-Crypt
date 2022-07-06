import * as Three from "three";

export class Loader {
  constructor(document) {
    this.manager = this.initialize(document);
  }

  initialize(document) {
    const manager = new Three.LoadingManager();

    manager.onStart = (url, itemsLoaded, itemsTotal) => {};

    manager.onLoad = () => {
      const loadingScreen = document.getElementById("loading-screen");
      loadingScreen.classList.add("fade-out");

      loadingScreen.style.pointerEvents = "none";
    };

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {};

    manager.onError = (url) => {
      console.log("There was an error loading " + url);
    };

    return manager;
  }

  loadFloor(texturePath) {
    const textureLoader = new Three.TextureLoader(this.getLoader());
    const floorTexture = textureLoader.load(texturePath);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    floorTexture.anisotropy = maxAnisotropy;
    floorTexture.encoding = Three.sRGBEncoding;
    floorTexture.wrapS = Three.RepeatWrapping;
    floorTexture.wrapT = Three.RepeatWrapping;
    floorTexture.repeat.set(128, 128);

    const floorMaterial = new Three.MeshStandardMaterial({ map: floorTexture });
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    const floorGeometry = new Three.PlaneBufferGeometry(500, 500);

    return new Three.Mesh(floorGeometry, floorMaterial);
  }

  async loadGlass(glassPath) {
    const model = await new GLTFLoader(this.getLoader()).loadAsync(glassPath);

    let mesh = model.scene;
    mesh.position.y = 0;

    const s = 0.4;
    mesh.scale.set(s, s, s);

    model.scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // node.material.wireframe = true;

        if (node.material.map) {
          node.material.map.anisotropy =
            this.renderer.capabilities.getMaxAnisotropy();
        }
      }
    });

    this.controls.worldOctree.fromGraphNode(mesh);
    this.scene.add(mesh);

    return mesh;
  }

  async loadModel(modelPath) {
    const model = await new GLTFLoader(this.loader.getLoader()).loadAsync(
      modelPath
    );

    let mesh = model.scene;
    mesh.position.y = 0;

    const s = 0.4;
    mesh.scale.set(s, s, s);

    model.scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        if (node.material.map) {
          node.material.map.anisotropy =
            this.renderer.capabilities.getMaxAnisotropy();
        }
      }
    });

    this.scene.add(mesh);

    return mesh;
  }

  getLoader() {
    return this.manager;
  }
}

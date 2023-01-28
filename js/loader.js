import * as THREE from "three";

import { LightManager } from "./lights.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";

export class Loader {
  constructor(world, saintManager, anisotropy) {
    this.world = world;
    this.saintManager = saintManager;
    this.anisotropy = anisotropy;

    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progressBar = document.getElementById("progress-bar");
      const percentage = ((100 * itemsLoaded) / itemsTotal).toFixed(0);
      progressBar.innerText = `Učitavanje... (${percentage}%)`;
    };

    loadingManager.onLoad = () => {
      const progressBar = document.getElementById("progress-bar");
      progressBar.innerText = `Kliknite za nastavak`;

      document.body.addEventListener("mousedown", startOnMouseClick);

      function startOnMouseClick() {
        document.body.removeEventListener("mousedown", startOnMouseClick);

        const loadingScreen = document.getElementById("loading-screen");
        loadingScreen.style.animation = "none";

        window.requestAnimationFrame(() => {
          loadingScreen.style.animation = "fade-loading-screen 5s";
          loadingScreen.style.animationDelay = "5s";
          loadingScreen.style.animationFillMode = "forwards";
        });

        const titleElement = document.getElementById("title");
        titleElement.style.animation = "none";
        window.requestAnimationFrame(() => {
          titleElement.style.animation = "fade-out-intro-text 3s";
          titleElement.style.animationDelay = "0s";
          titleElement.style.animationFillMode = "forwards";
        });

        world.video.play();
        world.audio.play();
      }
    };

    this.gltfLoader = new GLTFLoader(loadingManager);
  }

  async loadModels() {
    this.loadPhysicalModel("/assets/models/walls.glb", [], [], 0.4);
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
        }

        if (this.saintManager.isSaint(object)) {
          object.material.lightMapIntensity = 10;
          this.saintManager.saveToSaints(object);
        }
      } else if (object.isLight) {
        LightManager.configureLight(object);
      }
    });

    this.world.scene.add(mesh);

    return mesh;
  }
}

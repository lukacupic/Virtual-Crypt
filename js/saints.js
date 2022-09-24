import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "./lib/CSS2DRenderer.js";

export class SaintManager {
  constructor(context) {
    this.context = context;
    this.saints = new Map();
    this.saintNearby = null;
    this.infoElement = context.getElementById("info");
    this.infoElementMain = context.getElementById("info-main");
  }

  saveToSaints(mesh) {
    let name = mesh.name;

    if (name.includes("Paulus")) {
      mesh.infoText =
        "Sveti Pavao nadbiskup Carigradski (+350.) rođen je u Solunu. Tajnik je nadbiskupa u Carigradu. Teolog je na Nicejskom koncilu 325. Proganjan i ubijen 350. Tijelo mu je 391. godine preneseno u katedralu Svete Sofije koja je preimenovana u katedralu svetog Pavla mučenika.";
    } else {
      mesh.infoText = "Test " + name;
    }

    this.saints.set(name, mesh);

    let position = new THREE.Vector3();
    mesh.getWorldPosition(position);
    mesh.worldPosition = position;
  }

  checkDistanceToSaints(player) {
    console.log("kikiki");
    let saints = this.saints;
    if (saints == null) return;

    for (const saint of saints.values()) {
      let distance = player.distanceTo(saint.worldPosition);
      if (distance < 5) {
        this.infoElement.style.visibility = "visible";
        this.infoElementMain.style.visibility = "visible";
        this.saintNearby = saint;

        return;
      }
    }

    this.infoElement.style.visibility = "hidden";
    this.infoElementMain.style.visibility = "hidden";
    this.infoElementMain.innerHTML = "";
    this.saintNearby = null;
  }

  displayText() {
    this.infoElementMain.innerHTML = this.saintNearby.infoText;
  }

  isSaint(object) {
    let name = object.name;
    return name.startsWith("Sactus") || name.startsWith("Sacta");
  }

  getSaintNearby() {
    return this.saintNearby;
  }

  getSaints() {
    return this.saints;
  }
}

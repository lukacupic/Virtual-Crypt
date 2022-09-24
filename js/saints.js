import * as THREE from "three";

export class SaintManager {
  constructor(context) {
    this.context = context;
    this.saints = new Map();
    this.saintNearby;
    this.saintsInfo;
    this.infoElement = context.getElementById("info");
    this.infoElementMain = context.getElementById("info-main");
  }

  saveToSaints(mesh) {
    let name = mesh.name;

    if (name.includes("Paulus")) {
      mesh.infoText = "saintrr";
    } else {
      mesh.infoText = "pdsapdapsdpsadspa";
    }

    this.saints.set(name, mesh);

    let position = new THREE.Vector3();
    mesh.getWorldPosition(position);
    mesh.worldPosition = position;
  }

  checkDistanceToSaints(player) {
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

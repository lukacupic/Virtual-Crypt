import * as THREE from "three";
import { Octree } from "https://unpkg.com/three@0.143.0/examples/jsm/math/Octree.js";
import { Capsule } from "https://unpkg.com/three@0.143.0/examples/jsm/math/Capsule.js";
import { CSS2DRenderer, CSS2DObject } from "./lib/CSS2DRenderer.js";

class CameraController {
  constructor(camera, document) {
    this.camera = camera;
    this.document = document;

    this.cameraTarget = new THREE.Vector3();
    this.cameraRotation = new THREE.Vector3();

    this.canMove = false;

    this.document.addEventListener("mousedown", () => {
      if (this.canMove) {
        this.document.body.requestPointerLock();
      }
    });

    this.document.addEventListener("mousemove", (event) => {
      if (
        this.canMove &&
        this.document.pointerLockElement === this.document.body
      ) {
        this.updateRotation(event);
      }
    });
  }

  enableMovement(boolean) {
    this.canMove = boolean;
  }

  updateRotation(event) {
    let factor = 3000;
    this.cameraTarget.x -= event.movementY / factor;
    this.cameraTarget.y -= event.movementX / factor;
  }

  updatePosition(playerPosition) {
    this.camera.position.copy(playerPosition);
  }

  lerpCamera() {
    this.cameraRotation.x = this.camera.rotation.x;
    this.cameraRotation.y = this.camera.rotation.y;

    this.cameraRotation.lerp(this.cameraTarget, 0.1);

    this.camera.rotation.x = this.cameraRotation.x;
    this.camera.rotation.y = this.cameraRotation.y;
  }

  getWorldDirection(direction) {
    this.camera.getWorldDirection(direction);
  }

  up() {
    return this.camera.up;
  }
}

export class FirstPersonController {
  constructor(camera, document, loader, speed) {
    this.cameraController = new CameraController(camera, document);
    this.loader = loader;
    this.document = document;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = speed;

    this.worldOctree = new Octree();

    this.radius = 1.5;

    this.introPosition = new THREE.Vector3(-13, 1, -1000);
    this.controlsPosition = new THREE.Vector3(-13, 1, -70);

    this.setIntroPosition();

    this.keyStates = {};

    this.canMove = false;

    this.saintNearby = null;

    this.document.addEventListener("keydown", (event) => {
      if (this.canMove) {
        this.keyStates[event.code] = true;
      }
    });

    this.document.addEventListener("keyup", (event) => {
      if (this.canMove) {
        this.keyStates[event.code] = false;
      }
    });

    this.blocker = this.document.getElementById("blocker");
    this.instructions = this.document.getElementById("instructions");

    if ("onpointerlockchange" in this.document) {
      this.document.addEventListener("pointerlockchange", () => {
        this.addPointerLock();
      });
    } else if ("onmozpointerlockchange" in this.document) {
      this.document.addEventListener("mozpointerlockchange", () => {
        this.addPointerLock();
      });
    }
  }

  checkDistanceToSaints() {
    let player = this.playerCollider.end;

    let saints = this.loader.getSaints();
    if (saints == null) return;

    const infoElement = this.document.getElementById("info");

    for (const saint of saints.values()) {
      let distance = player.distanceTo(saint.worldPosition);
      if (distance < 5) {
        infoElement.style.display = "block";
        this.saintNearby = saint;

        return;
      }
    }

    infoElement.style.display = "none";
    this.saintNearby = null;
  }

  enableMovement(boolean) {
    this.canMove = boolean;
    this.cameraController.enableMovement(boolean);
  }

  setIntroPosition() {
    this.setPosition(this.introPosition);
  }

  setControlsPosition() {
    this.setPosition(this.controlsPosition);
  }

  setPosition(position) {
    this.playerCollider = new Capsule(
      new THREE.Vector3(position.x, position.y + 0.25, position.z),
      new THREE.Vector3(position.x, position.y + 3.0, position.z),
      this.radius
    );

    this.position = position;
  }

  addPointerLock() {
    if (
      !!this.document.pointerLockElement ||
      !!this.document.mozPointerLockElement
    ) {
      this.blocker.style.display = "none";
      this.instructions.style.display = "none";
    } else {
      this.blocker.style.display = "block";
      this.instructions.style.display = "";
    }
  }

  getForwardVector() {
    this.cameraController.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();

    return this.direction;
  }

  getSideVector() {
    this.cameraController.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    this.direction.cross(this.cameraController.up());

    return this.direction;
  }

  updatePlayer(delta) {
    let damping = 1.5 * (Math.exp(-4 * delta) - 1);
    this.velocity.addScaledVector(this.velocity, damping);

    const deltaPosition = this.velocity.clone().multiplyScalar(delta);
    this.playerCollider.translate(deltaPosition);

    this.playerCollisions();

    this.cameraController.updatePosition(this.playerCollider.end);
  }

  playerCollisions() {
    const collision = this.worldOctree.capsuleIntersect(this.playerCollider);

    if (collision) {
      const collisionVector = collision.normal.multiplyScalar(collision.depth);
      collisionVector.setY(0);

      this.playerCollider.start.add(collisionVector);
      this.playerCollider.end.add(collisionVector);
    }
  }

  updateControls(delta) {
    const speedDelta = delta * this.speed * 4.0;

    if (this.keyStates["KeyW"] || this.keyStates["ArrowUp"]) {
      this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
    }

    if (this.keyStates["KeyS"] || this.keyStates["ArrowDown"]) {
      this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
    }

    if (this.keyStates["KeyA"] || this.keyStates["ArrowLeft"]) {
      this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
    }

    if (this.keyStates["KeyD"] || this.keyStates["ArrowRight"]) {
      this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
    }

    if (this.keyStates["KeyI"] && this.saintNearby) {
      const earthDiv = document.createElement("div");
      earthDiv.className = "label";
      earthDiv.textContent = this.saintNearby.infoText;
      earthDiv.style.marginTop = "-1em";

      const earthLabel = new CSS2DObject(earthDiv);
      earthLabel.position.set(0, 1, 0);
      this.saintNearby.add(earthLabel);
      earthLabel.layers.set(0);
    }
  }

  update(delta) {
    this.updateControls(delta);
    this.updatePlayer(delta);
    this.checkDistanceToSaints();
    this.cameraController.lerpCamera();
  }
}

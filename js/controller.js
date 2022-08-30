import * as THREE from "three";
import { Octree } from "https://unpkg.com/three@0.143.0/examples/jsm/math/Octree.js";
import { Capsule } from "https://unpkg.com/three@0.143.0/examples/jsm/math/Capsule.js";

class CameraController {
  constructor(camera, document) {
    this.camera = camera;
    this.document = document;
    this.menu = document.getElementById("menu");

    this.cameraTarget = new THREE.Vector3();
    this.cameraRotation = new THREE.Vector3();

    this.menu.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });

    this.document.addEventListener("mousedown", () => {
      this.document.body.requestPointerLock();
    });

    this.document.addEventListener("mousemove", (event) => {
      if (this.document.pointerLockElement === this.document.body) {
        this.updateRotation(event);
      }
    });
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
  constructor(camera, speed, document) {
    this.cameraController = new CameraController(camera, document);
    this.document = document;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = speed;

    this.worldOctree = new Octree();

    this.playerX = -13;
    this.playerY = 1;
    this.playerZ = 150;

    this.radius = 1.5;

    this.playerCollider = new Capsule(
      new THREE.Vector3(this.playerX, this.playerY + 0.25, this.playerZ),
      new THREE.Vector3(this.playerX, this.playerY + 3.0, this.playerZ),
      this.radius
    );

    this.keyStates = {};

    this.document.addEventListener("keydown", (event) => {
      this.keyStates[event.code] = true;
    });

    this.document.addEventListener("keyup", (event) => {
      this.keyStates[event.code] = false;
    });

    this.blocker = this.document.getElementById("blocker");
    this.instructions = this.document.getElementById("instructions");
    this.menu = this.document.getElementById("instructions");

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
  }

  update(delta) {
    this.updateControls(delta);
    this.updatePlayer(delta);
    this.cameraController.lerpCamera();
  }
}

import * as THREE from "three";
import { Octree } from "https://unpkg.com/three@0.143.0/examples/jsm/math/Octree.js";
import { Capsule } from "https://unpkg.com/three@0.143.0/examples/jsm/math/Capsule.js";

export class FirstPersonController {
  constructor(camera, document, speed) {
    this.camera = camera;
    this.document = document;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = speed;

    this.worldOctree = new Octree();

    this.playerX = -13;
    this.playerY = 1;
    this.playerZ = -60;

    this.radius = 1.5;

    this.playerCollider = new Capsule(
      new THREE.Vector3(this.playerX, this.playerY + 0.25, this.playerZ),
      new THREE.Vector3(this.playerX, this.playerY + 3.0, this.playerZ),
      this.radius
    );

    this.keyStates = {};

    this.blocker = this.document.getElementById("blocker");
    this.instructions = this.document.getElementById("instructions");

    this.document.addEventListener("keydown", (event) => {
      this.keyStates[event.code] = true;
    });

    this.document.addEventListener("keyup", (event) => {
      this.keyStates[event.code] = false;
    });

    this.document.addEventListener("mousedown", () => {
      this.document.body.requestPointerLock();
    });

    this.document.body.addEventListener("mousemove", (event) => {
      if (this.document.pointerLockElement === this.document.body) {
        let factor = 2000;
        this.camera.rotation.y -= event.movementX / factor;
        this.camera.rotation.x -= event.movementY / factor;
      }
    });

    if ("onpointerlockchange" in this.document) {
      this.document.addEventListener("pointerlockchange", (event) => {
        if (
          !!this.document.pointerLockElement ||
          !!this.document.mozPointerLockElement
        ) {
          this.instructions.style.display = "none";
          this.blocker.style.display = "none";
        } else {
          this.blocker.style.display = "block";
          this.instructions.style.display = "";
        }
      });
    } else if ("onmozpointerlockchange" in this.document) {
      this.document.addEventListener("mozpointerlockchange", (event) => {
        if (
          !!this.document.pointerLockElement ||
          !!this.document.mozPointerLockElement
        ) {
          this.instructions.style.display = "none";
          this.blocker.style.display = "none";
        } else {
          this.blocker.style.display = "block";
          this.instructions.style.display = "";
        }
      });
    }
  }

  getForwardVector() {
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();

    return this.direction;
  }

  getSideVector() {
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    this.direction.cross(this.camera.up);

    return this.direction;
  }

  updatePlayer(delta) {
    let damping = 1.5 * (Math.exp(-4 * delta) - 1);
    this.velocity.addScaledVector(this.velocity, damping);

    const deltaPosition = this.velocity.clone().multiplyScalar(delta);
    this.playerCollider.translate(deltaPosition);

    this.playerCollisions();

    this.camera.position.copy(this.playerCollider.end);
  }

  playerCollisions() {
    const collision = this.worldOctree.capsuleIntersect(this.playerCollider);

    if (collision) {
      const collisionVector = collision.normal.multiplyScalar(collision.depth);
      collisionVector.setY(0); // don't allow player to move up or down

      this.playerCollider.start.add(collisionVector);
      this.playerCollider.end.add(collisionVector);
    }
  }

  updateControls(delta) {
    const speedDelta = delta * this.speed * 4.0;

    if (this.keyStates["KeyW"]) {
      this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
    }

    if (this.keyStates["KeyS"]) {
      this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
    }

    if (this.keyStates["KeyA"]) {
      this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
    }

    if (this.keyStates["KeyD"]) {
      this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
    }
  }

  update(delta) {
    this.updateControls(delta);
    this.updatePlayer(delta);
  }
}

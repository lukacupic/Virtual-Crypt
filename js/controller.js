import * as Three from "three";
import { Octree } from "https://unpkg.com/three@0.141.0/examples/jsm/math/Octree.js";
import { Capsule } from "https://unpkg.com/three@0.141.0/examples/jsm/math/Capsule.js";

export class FirstPersonController {
  constructor(camera, document, speed) {
    this.camera = camera;
    this.document = document;

    this.velocity = new Three.Vector3();
    this.direction = new Three.Vector3();
    this.speed = speed;

    this.worldOctree = new Octree();
    this.playerCollider = new Capsule(
      new Three.Vector3(0, 0.35, 0),
      new Three.Vector3(0, 3, 0),
      1.75
    );

    this.playerOnFloor = false;

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
        this.camera.rotation.y -= event.movementX / 750;
        this.camera.rotation.x -= event.movementY / 750;
      }
    });

    if ("onpointerlockchange" in this.document) {
      this.document.addEventListener("pointerlockchange", (event) => {
        console.log(this.document);
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
        console.log(this.document);
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

  playerCollisions() {
    const result = this.worldOctree.capsuleIntersect(this.playerCollider);

    this.playerOnFloor = false;

    if (result) {
      this.playerOnFloor = result.normal.y > 0;

      if (!this.playerOnFloor) {
        this.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.velocity)
        );
      }

      this.playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
  }

  updatePlayer(delta) {
    let damping = Math.exp(-4 * delta) - 1;

    if (!this.playerOnFloor) {
      // this.velocity.y -= this.GRAVITY * delta;
    } else {
      damping *= 1.25;
    }

    this.velocity.addScaledVector(this.velocity, damping);

    const deltaPosition = this.velocity.clone().multiplyScalar(delta);
    this.playerCollider.translate(deltaPosition);

    this.playerCollisions();

    this.camera.position.copy(this.playerCollider.end);
  }

  controls(delta) {
    const speedDelta = delta * this.speed;

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
    this.controls(delta);
    this.updatePlayer(delta);
  }
}

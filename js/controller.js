import * as THREE from 'three';
import { PointerLockControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/PointerLockControls.js';

export class FirstPersonController {

  constructor(camera, document, speed) {
    this.camera = camera;
    this.document = document;
    this.speed = speed;
    this.controls = this.initializeControls();

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;
  }

  initializeControls() {
    const controls = new PointerLockControls(this.camera, this.document.body);

    const blocker = this.document.getElementById('blocker');
    const instructions = this.document.getElementById('instructions');

    instructions.addEventListener('click', function () {
      controls.lock();
    });

    controls.addEventListener('lock', function () {
      instructions.style.display = 'none';
      blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
      blocker.style.display = 'block';
      instructions.style.display = '';
    });

    const onKeyDown = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;

        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;

        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };

    this.document.addEventListener('keydown', onKeyDown);
    this.document.addEventListener('keyup', onKeyUp);

    return controls;
  }

  update(delta) {
    if (this.controls.isLocked === false) return;

    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 10 * this.speed * delta;
    if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 10 * this.speed * delta;

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);
  }
}
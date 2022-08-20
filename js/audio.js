import * as THREE from "three";

export class AudioManager {
  constructor(camera) {
    this.loader = new THREE.AudioLoader();
    this.listener = new THREE.AudioListener();
    this.sound = new THREE.Audio(this.listener);

    camera.add(this.listener);
  }

  play() {
    this.loader.load("/assets/sounds/choir.ogg", (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0.25);
      this.sound.play();
    });
  }
}

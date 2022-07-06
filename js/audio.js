import * as Three from "three";

export class AudioManager {
  constructor(camera) {
    this.loader = new Three.AudioLoader();
    this.listener = new Three.AudioListener();
    this.sound = new Three.Audio(this.listener);

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

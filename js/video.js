import * as THREE from "three";

export class VideoManager {
  constructor(scene, controls, document) {
    this.scene = scene;
    this.controls = controls;

    this.video = document.getElementById("video");
    this.video.addEventListener("ended", () => {
      this.videoEndListener();
    });
  }

  videoEndListener() {
    // remove the video
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.video.style.display = "none";

    // remove the loading screen
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.animation = "none";
    window.requestAnimationFrame(() => {
      loadingScreen.style.animation = "fade-loading-screen 5s";
      loadingScreen.style.animationFillMode = "forwards";
    });

    // show the instructions text
    document.getElementById("blocker").style.display = "block";

    // enable controls
    this.controls.setControlsPosition();
    this.controls.enableMovement(true);
  }

  play() {
    this.video.play();
  }
}

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

    // show first text after video
    const titleNext = document.getElementById("title-next");
    titleNext.style.animation = "none";
    window.requestAnimationFrame(() => {
      titleNext.style.animation = "fade-intro-text-long 30s";
      titleNext.style.animationDelay = "0s";
      titleNext.style.animationFillMode = "forwards";
    });

    // show second text after video
    const titleNextNext = document.getElementById("title-next-next");
    titleNextNext.style.animation = "none";
    window.requestAnimationFrame(() => {
      titleNextNext.style.animation = "fade-intro-text-long 30s";
      titleNextNext.style.animationDelay = "31s";
      titleNextNext.style.animationFillMode = "forwards";
    });

    // remove the loading screen
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.animation = "none";
    window.requestAnimationFrame(() => {
      loadingScreen.style.animation = "fade-loading-screen 5s";
      loadingScreen.style.animationDelay = "62s";
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

import * as THREE from "three";

export class VideoManager {
  constructor(scene, controls, width, height, document) {
    this.scene = scene;
    this.controls = controls;
    this.width = width;
    this.height = height;

    this.video = document.getElementById("video");
    this.video.addEventListener("ended", () => {
      this.videoEndListener();
    });

    this.initialize();
  }

  initialize() {
    let texture = new THREE.VideoTexture(this.video);
    texture.encoding = THREE.sRGBEncoding;

    const xsize = 10;
    const ysize = xsize / (this.width / this.height);
    const geometry = new THREE.PlaneGeometry(xsize, ysize);

    const material = new THREE.MeshLambertMaterial({
      map: texture,
    });

    let mesh = new THREE.Mesh(geometry, material);

    const controlsPosition = this.controls.position;
    mesh.position.setX(controlsPosition.x);
    mesh.position.setY(controlsPosition.y + 1.1 * (ysize / 2));
    mesh.position.setZ(controlsPosition.z - 6);

    this.scene.add(mesh);
  }

  videoEndListener() {
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

  testtt() {
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

class PlacedModel {
  constructor(type, x, y, z, model) {
    this.type = type;
    this.pos = createVector(x, y, z);
    this.model = model;
    this.rotation = 0;
    this.floatOffset = random(0, TWO_PI);
    this.scale = 1.5;
    this.birthTime = millis();
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    let floatY = sin(frameCount * 0.02 + this.floatOffset) * 15;
    translate(0, floatY, 0);
    this.rotation += 0.01;
    rotateY(this.rotation);
    if (this.type === "heart") {
      specularMaterial(220, 20, 60);
      shininess(25);
      emissiveMaterial(50, 5, 15);
    } else if (this.type === "brain") {
      specularMaterial(255, 182, 193);
      shininess(20);
      emissiveMaterial(30, 20, 25);
    }
    scale(this.scale);
    model(this.model);
    this.drawSpawnParticles();

    pop();
  }

  drawSpawnParticles() {
    let age = millis() - this.birthTime;
    if (age < 1000) {
      push();
      let alpha = map(age, 0, 1000, 255, 0);
      fill(255, 255, 255, alpha);
      noStroke();

      for (let i = 0; i < 5; i++) {
        let angle = (TWO_PI / 5) * i;
        let radius = map(age, 0, 1000, 10, 50);
        let px = cos(angle) * radius;
        let py = sin(angle) * radius;
        circle(px, py, 5);
      }
      pop();
    }
  }
}

let heartModel, brainModel;
let placedModels = [];
let currentModel = "heart";

let heartBtn, brainBtn, undoBtn, resetBtn, soundBtn;
let tapSound;
let soundEnabled = true;
let gridVisible = true;
let audioReady = false;

function preload() {
  heartModel = loadModel("heart.obj", true);
  brainModel = loadModel("brain.obj", true);
  tapSound = loadSound(
    "tap-sound.mp3",
    () => {
      audioReady = true;
    },
    () => {
      audioReady = false;
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(DEGREES);
  setupButtons();
  setupAudio();
}

function setupButtons() {
  heartBtn = createButton("Heart");
  heartBtn.position(20, 20);
  styleButton(heartBtn);
  heartBtn.mousePressed(() => {
    currentModel = "heart";
    updateButtonHighlight();
  });

  brainBtn = createButton("Brain");
  brainBtn.position(140, 20);
  styleButton(brainBtn);
  brainBtn.mousePressed(() => {
    currentModel = "brain";
    updateButtonHighlight();
  });

  undoBtn = createButton("Undo");
  undoBtn.position(260, 20);
  styleButton(undoBtn);
  undoBtn.mousePressed(() => {
    if (placedModels.length > 0) {
      placedModels.pop();
    }
  });

  resetBtn = createButton("Reset");
  resetBtn.position(380, 20);
  styleButton(resetBtn);
  resetBtn.mousePressed(() => {
    placedModels = [];
  });

  soundBtn = createButton("Sound");
  soundBtn.position(500, 20);
  styleButton(soundBtn);
  soundBtn.mousePressed(() => {
    soundEnabled = !soundEnabled;
    soundBtn.html(soundEnabled ? "Sound" : "Mute");
  });

  let gridBtn = createButton("Grid");
  gridBtn.position(620, 20);
  styleButton(gridBtn);
  gridBtn.mousePressed(() => {
    gridVisible = !gridVisible;
    gridBtn.html(gridVisible ? "Grid" : "No Grid");
  });

  updateButtonHighlight();
}

function styleButton(btn) {
  btn.style("padding", "12px 24px");
  btn.style("font-size", "14px");
  btn.style("font-weight", "500");
  btn.style("border", "1px solid rgba(255, 255, 255, 0.2)");
  btn.style("border-radius", "6px");
  btn.style("background", "rgba(255, 255, 255, 0.08)");
  btn.style("color", "#ffffff");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 0.2s ease");
  btn.style("backdrop-filter", "blur(10px)");

  btn.mouseOver(() => {
    btn.style("background", "rgba(255, 255, 255, 0.15)");
    btn.style("border-color", "rgba(255, 255, 255, 0.3)");
  });

  btn.mouseOut(() => {
    btn.style("background", "rgba(255, 255, 255, 0.08)");
    btn.style("border-color", "rgba(255, 255, 255, 0.2)");
  });
}

function updateButtonHighlight() {
  heartBtn.style("background", "rgba(255, 255, 255, 0.08)");
  heartBtn.style("border-color", "rgba(255, 255, 255, 0.2)");
  brainBtn.style("background", "rgba(255, 255, 255, 0.08)");
  brainBtn.style("border-color", "rgba(255, 255, 255, 0.2)");

  // Highlight selected button
  if (currentModel === "heart") {
    heartBtn.style("background", "rgba(255, 255, 255, 0.2)");
    heartBtn.style("border-color", "rgba(255, 255, 255, 0.5)");
  } else if (currentModel === "brain") {
    brainBtn.style("background", "rgba(255, 255, 255, 0.2)");
    brainBtn.style("border-color", "rgba(255, 255, 255, 0.5)");
  }
}

function setupAudio() {
  if (audioReady && tapSound.isLoaded()) {
    tapSound.setVolume(0.6);
  }
}

function draw() {
  background(30, 30, 40);
  ambientLight(60, 60, 80);
  directionalLight(255, 255, 240, 0.5, 0.5, -1);
  pointLight(255, 200, 200, 300, -200, 200);
  pointLight(200, 200, 255, -300, -200, 200);
  pointLight(200, 200, 200, 0, 300, 100);
  let locX = mouseX - width / 2;
  let locY = mouseY - height / 2;
  spotLight(255, 255, 255, locX, locY, 400, 0, 0, -1, PI / 4, 10);
  orbitControl();
  if (gridVisible) {
    drawGrid();
  }
  for (let obj of placedModels) {
    obj.display();
  }
  if (placedModels.length === 0) {
    showInstructions();
  }

  drawStats();
}

function drawGrid() {
  push();
  rotateX(90);
  stroke(60, 60, 80, 150);
  strokeWeight(1);
  noFill();
  for (let i = -400; i <= 400; i += 50) {
    line(i, -400, 0, i, 400, 0);
    line(-400, i, 0, 400, i, 0);
  }
  stroke(100, 100, 150, 200);
  strokeWeight(2);
  line(-400, 0, 0, 400, 0, 0);
  line(0, -400, 0, 0, 400, 0);

  pop();
}

function mouseClicked() {
  if (audioReady && !tapSound.isPlaying()) {
    userStartAudio();
  }

  if (mouseY < 80) {
    return;
  }
  let x = mouseX - width / 2;
  let y = mouseY - height / 2;
  let z = 0;
  let selectedModel = currentModel === "heart" ? heartModel : brainModel;
  let newModel = new PlacedModel(currentModel, x, y, z, selectedModel);
  placedModels.push(newModel);

  if (soundEnabled && audioReady && tapSound.isLoaded()) {
    tapSound.play();
  }
}

// ========== KEYBOARD SHORTCUTS  ==========
function keyPressed() {
  // H = Heart
  if (key === "h" || key === "H") {
    currentModel = "heart";
    updateButtonHighlight();
  }

  // B = Brain
  if (key === "b" || key === "B") {
    currentModel = "brain";
    updateButtonHighlight();
  }

  // U = Undo
  if (key === "u" || key === "U") {
    if (placedModels.length > 0) {
      placedModels.pop();
    }
  }

  // R = Reset
  if (key === "r" || key === "R") {
    placedModels = [];
  }

  // G = Toggle Grid
  if (key === "g" || key === "G") {
    gridVisible = !gridVisible;
  }

  // S = Toggle Sound
  if (key === "s" || key === "S") {
    soundEnabled = !soundEnabled;
    soundBtn.html(soundEnabled ? "Sound" : "Mute");
  }
}

function showInstructions() {
  push();
  fill(255, 255, 255, 230);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  text("Click screen to place organ", 0, -50);
  textSize(18);
  text("Select model from buttons above", 0, 0);
  textSize(14);
  text("Drag to rotate • Scroll to zoom", 0, 40);
  text("Keyboard: H=Heart, B=Brain, U=Undo, R=Reset", 0, 70);
  pop();
}

function drawStats() {
  push();
  translate(-width / 2 + 15, -height / 2 + 100, 0);

  fill(255, 255, 255, 180);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(13);

  text(`FPS: ${floor(frameRate())}`, 0, 0);
  text(`Models: ${placedModels.length}`, 0, 18);
  text(`Selected: ${currentModel.toUpperCase()}`, 0, 36);

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

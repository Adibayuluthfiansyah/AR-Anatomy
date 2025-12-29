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
    
    let floatY = sin(frameCount * 0.03 + this.floatOffset) * 20;
    translate(0, floatY, 0);
    
    this.rotation += 0.02;
    rotateY(this.rotation);
    
    if (this.type === "brain") {
      rotateX(-90);
      let wobble = sin(frameCount * 0.04 + this.floatOffset) * 3;
      rotateZ(wobble);
    }
    
    if (this.type === "heart") {
      let pulse = sin(frameCount * 0.08) * 0.1;
      scale(this.scale + pulse);
      specularMaterial(220, 20, 60);
      shininess(25);
      emissiveMaterial(50, 5, 15);
    } else if (this.type === "brain") {
      scale(this.scale);
      specularMaterial(255, 182, 193);
      shininess(20);
      emissiveMaterial(30, 20, 25);
    }
    
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

let heartBtn, brainBtn, undoBtn, resetBtn, soundBtn, gridBtn, saveBtn, loadBtn;
let tapSound;
let soundEnabled = true;
let gridVisible = true;
let audioReady = false;
let modelsLoaded = false;
let loadError = null;

function preload() {
  heartModel = loadModel(
    "heart.obj",
    true,
    () => {},
    () => {
      loadError = "Failed to load heart.obj";
    }
  );
  brainModel = loadModel(
    "brain.obj",
    true,
    () => {
      modelsLoaded = true;
    },
    () => {
      loadError = "Failed to load brain.obj";
    }
  );
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
  let isMobile = windowWidth < 768;
  let buttonSize = isMobile ? "10px 16px" : "12px 24px";
  let fontSize = isMobile ? "12px" : "14px";
  let positions = isMobile
    ? {
        heart: { x: 10, y: 10 },
        brain: { x: 90, y: 10 },
        undo: { x: 170, y: 10 },
        save: { x: 250, y: 10 },
        reset: { x: 10, y: 55 },
        sound: { x: 90, y: 55 },
        grid: { x: 170, y: 55 },
        load: { x: 250, y: 55 },
      }
    : {
        heart: { x: 20, y: 20 },
        brain: { x: 120, y: 20 },
        undo: { x: 220, y: 20 },
        reset: { x: 320, y: 20 },
        sound: { x: 420, y: 20 },
        grid: { x: 520, y: 20 },
        save: { x: 620, y: 20 },
        load: { x: 720, y: 20 },
      };

  heartBtn = createButton("Heart");
  heartBtn.position(positions.heart.x, positions.heart.y);
  styleButton(heartBtn, buttonSize, fontSize);
  heartBtn.mousePressed(() => {
    currentModel = "heart";
    updateButtonHighlight();
  });

  brainBtn = createButton("Brain");
  brainBtn.position(positions.brain.x, positions.brain.y);
  styleButton(brainBtn, buttonSize, fontSize);
  brainBtn.mousePressed(() => {
    currentModel = "brain";
    updateButtonHighlight();
  });

  undoBtn = createButton("Undo");
  undoBtn.position(positions.undo.x, positions.undo.y);
  styleButton(undoBtn, buttonSize, fontSize);
  undoBtn.mousePressed(() => {
    if (placedModels.length > 0) {
      placedModels.pop();
    }
  });

  resetBtn = createButton("Reset");
  resetBtn.position(positions.reset.x, positions.reset.y);
  styleButton(resetBtn, buttonSize, fontSize);
  resetBtn.mousePressed(() => {
    placedModels = [];
  });

  soundBtn = createButton("Sound");
  soundBtn.position(positions.sound.x, positions.sound.y);
  styleButton(soundBtn, buttonSize, fontSize);
  soundBtn.mousePressed(() => {
    soundEnabled = !soundEnabled;
    soundBtn.html(soundEnabled ? "Sound" : "Mute");
  });

  gridBtn = createButton("Grid");
  gridBtn.position(positions.grid.x, positions.grid.y);
  styleButton(gridBtn, buttonSize, fontSize);
  gridBtn.mousePressed(() => {
    gridVisible = !gridVisible;
    gridBtn.html(gridVisible ? "Grid" : "No Grid");
  });

  saveBtn = createButton("Save");
  saveBtn.position(positions.save.x, positions.save.y);
  styleButton(saveBtn, buttonSize, fontSize);
  saveBtn.mousePressed(() => {
    saveScene();
  });

  loadBtn = createButton("Load");
  loadBtn.position(positions.load.x, positions.load.y);
  styleButton(loadBtn, buttonSize, fontSize);
  loadBtn.mousePressed(() => {
    loadScene();
  });

  updateButtonHighlight();
}

function styleButton(btn, padding = "12px 24px", fontSize = "14px") {
  btn.style("padding", padding);
  btn.style("font-size", fontSize);
  btn.style("font-weight", "500");
  btn.style("border", "1px solid rgba(255, 255, 255, 0.2)");
  btn.style("border-radius", "6px");
  btn.style("background", "rgba(255, 255, 255, 0.08)");
  btn.style("color", "#ffffff");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 0.2s ease");
  btn.style("backdrop-filter", "blur(10px)");
  btn.style("white-space", "nowrap");

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
  
  if (loadError) {
    showError(loadError);
    return;
  }
  
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

  let buttonAreaHeight = windowWidth < 768 ? 110 : 80;

  if (mouseY < buttonAreaHeight) {
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

function keyPressed() {
  if (key === "h" || key === "H") {
    currentModel = "heart";
    updateButtonHighlight();
  }

  if (key === "b" || key === "B") {
    currentModel = "brain";
    updateButtonHighlight();
  }

  if (key === "u" || key === "U") {
    if (placedModels.length > 0) {
      placedModels.pop();
    }
  }

  if (key === "r" || key === "R") {
    placedModels = [];
  }

  if (key === "g" || key === "G") {
    gridVisible = !gridVisible;
  }

  if (key === "s" || key === "S") {
    soundEnabled = !soundEnabled;
    soundBtn.html(soundEnabled ? "Sound" : "Mute");
  }
  
  if (key === "?" || key === "/") {
    let hints = document.getElementById("keyboard-hints");
    if (hints.classList.contains("show")) {
      hints.classList.remove("show");
    } else {
      hints.classList.add("show");
    }
  }
}

function showInstructions() {
  push();
  fill(255, 255, 255, 230);
  noStroke();
  textAlign(CENTER, CENTER);

  let isMobile = windowWidth < 768;
  let mainSize = isMobile ? 18 : 28;
  let subSize = isMobile ? 14 : 18;
  let smallSize = isMobile ? 11 : 14;

  textSize(mainSize);
  text(isMobile ? "Tap to place organ" : "Click screen to place organ", 0, -50);
  textSize(subSize);
  text("Select model from buttons above", 0, 0);
  textSize(smallSize);
  text(isMobile ? "Drag to rotate" : "Drag to rotate • Scroll to zoom", 0, 40);

  if (!isMobile) {
    text("Keyboard: H=Heart, B=Brain, U=Undo, R=Reset", 0, 70);
  }
  pop();
}

function drawStats() {
  push();

  let isMobile = windowWidth < 768;
  let statsX = isMobile ? -width / 2 + 10 : -width / 2 + 15;
  let statsY = isMobile ? -height / 2 + 120 : -height / 2 + 100;
  let textSizeVal = isMobile ? 11 : 13;

  translate(statsX, statsY, 0);

  fill(255, 255, 255, 180);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(textSizeVal);

  text(`FPS: ${floor(frameRate())}`, 0, 0);
  text(`Models: ${placedModels.length}`, 0, 18);
  text(`Selected: ${currentModel.toUpperCase()}`, 0, 36);

  pop();
}

function showError(message) {
  push();
  fill(255, 100, 100);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(24);
  text("Error Loading Assets", 0, -40);
  textSize(16);
  fill(255, 255, 255, 200);
  text(message, 0, 0);
  textSize(14);
  text("Please check if all files are in the same directory", 0, 40);
  pop();
}

function saveScene() {
  if (placedModels.length === 0) {
    return;
  }
  let sceneData = placedModels.map(model => ({
    type: model.type,
    x: model.pos.x,
    y: model.pos.y,
    z: model.pos.z,
    rotation: model.rotation,
    scale: model.scale
  }));
  localStorage.setItem('anatomyScene', JSON.stringify(sceneData));
  saveBtn.html("Saved!");
  setTimeout(() => {
    saveBtn.html("Save");
  }, 2000);
}

function loadScene() {
  let savedData = localStorage.getItem('anatomyScene');
  if (!savedData) {
    return;
  }
  try {
    let sceneData = JSON.parse(savedData);
    placedModels = [];
    for (let data of sceneData) {
      let selectedModel = data.type === "heart" ? heartModel : brainModel;
      let newModel = new PlacedModel(data.type, data.x, data.y, data.z, selectedModel);
      newModel.rotation = data.rotation;
      newModel.scale = data.scale;
      placedModels.push(newModel);
    }
    if (loadBtn) {
      loadBtn.html("Loaded!");
      setTimeout(() => {
        loadBtn.html("Load");
      }, 2000);
    }
  } catch (e) {
    if (loadBtn) {
      loadBtn.html("Error!");
      setTimeout(() => {
        loadBtn.html("Load");
      }, 2000);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  let isMobile = windowWidth < 768;
  let buttonSize = isMobile ? "10px 16px" : "12px 24px";
  let fontSize = isMobile ? "12px" : "14px";

  let positions = isMobile
    ? {
        heart: { x: 10, y: 10 },
        brain: { x: 90, y: 10 },
        undo: { x: 170, y: 10 },
        save: { x: 250, y: 10 },
        reset: { x: 10, y: 55 },
        sound: { x: 90, y: 55 },
        grid: { x: 170, y: 55 },
        load: { x: 250, y: 55 },
      }
    : {
        heart: { x: 20, y: 20 },
        brain: { x: 120, y: 20 },
        undo: { x: 220, y: 20 },
        reset: { x: 320, y: 20 },
        sound: { x: 420, y: 20 },
        grid: { x: 520, y: 20 },
        save: { x: 620, y: 20 },
        load: { x: 720, y: 20 },
      };

  heartBtn.position(positions.heart.x, positions.heart.y);
  heartBtn.style("padding", buttonSize);
  heartBtn.style("font-size", fontSize);

  brainBtn.position(positions.brain.x, positions.brain.y);
  brainBtn.style("padding", buttonSize);
  brainBtn.style("font-size", fontSize);

  undoBtn.position(positions.undo.x, positions.undo.y);
  undoBtn.style("padding", buttonSize);
  undoBtn.style("font-size", fontSize);

  resetBtn.position(positions.reset.x, positions.reset.y);
  resetBtn.style("padding", buttonSize);
  resetBtn.style("font-size", fontSize);

  soundBtn.position(positions.sound.x, positions.sound.y);
  soundBtn.style("padding", buttonSize);
  soundBtn.style("font-size", fontSize);

  gridBtn.position(positions.grid.x, positions.grid.y);
  gridBtn.style("padding", buttonSize);
  gridBtn.style("font-size", fontSize);

  saveBtn.position(positions.save.x, positions.save.y);
  saveBtn.style("padding", buttonSize);
  saveBtn.style("font-size", fontSize);

  loadBtn.position(positions.load.x, positions.load.y);
  loadBtn.style("padding", buttonSize);
  loadBtn.style("font-size", fontSize);
}

/*
===
Simple Teachable Machine (gif output) Demo
Nov 2017:
Original version by @yining1023
Feb 2018:
Sound output added by @achimkoh
===
*/



let knn;
let video;
let isPredicting = false;
let prevIsPredicting = false;
let exampleCounts = new Array(2).fill(0);
let timers = new Array(2);

let predictimer;
let outputSrc;
let updateGifIndex;
let uploadBtn;

const msgArray = ['A', 'B'];
let gifSrcs = ['uparrow.png', 'downarrow.png'];
let soundfiles = [];
let outputGif = true;
let outputSound = false;

var paddleA, paddleB, ball, wallTop, wallBottom, speed;
var MAX_SPEED = 3;
let CHANGE_SPEED = 5;

let s1 = function ( sketch ) {
 
  sketch.setup = function() {
    sketch.preload()
    sketch.createCanvas(320, 240).parent('canvasContainerInput');
    // createCanvas(320, 240).parent("canvasContainerOutput");
    sketch.background(0);
    video = sketch.createCapture(sketch.VIDEO);
    video.size(227, 227);
    video.hide();
    uploadBtn = sketch.createFileInput(sketch.imageUpload);
    uploadBtn.id('uploadbtn');
    uploadBtn.hide();
  
    // Train buttons
    msgArray.forEach((id, index) => {
      let button = sketch.select('#button' + id);
      button.mousePressed(() => {
        
        if (timers[index]) clearInterval(timers[index]);
        timers[index] = setInterval(() => { sketch.train(index); }, 100);
      });
      button.mouseReleased(() => {
        if (timers[index]) {
          clearInterval(timers[index]);
          sketch.updateExampleCounts();
        }
      });
    });
  
    // Reset buttons
    msgArray.forEach((id, index) => {
      let button = sketch.select('#reset' + id);
      button.mousePressed(() => {
        sketch.clearClass(index);
        sketch.updateExampleCounts();
      });
    });
  
    // Initiate the behavior of GIF/Sound output toggle controls
    let labels = sketch.selectAll("label");
    labels.forEach( (e) => { e.mouseClicked(toggleOutput); 
                             // Same behavior also for each radio input tied with the label; otherwise behavior tends to break after first toggle
                             e.elt.control.onclick=toggleOutput; } );
  }
  
  sketch.draw = function draw() {
    sketch.background(0);
    sketch.push(); // flip video direction so it works like a mirror
      sketch.translate(sketch.width, 0);
      sketch.scale(-1, 1);
      sketch.image(video, 0, 0, sketch.width, sketch.height);
    sketch.pop();
  }
  
  sketch.preload = function() {
    // Initialize the KNN method.
    knn = new ml5.KNNImageClassifier(sketch.modelLoaded, 3, 1);
  }
   
  // A function to be called when the model has been loaded
  sketch.modelLoaded = function() {
    //select('#loading').html('Model loaded!');
  }
  
  // Train the Classifier on a frame from the video.
  sketch.train = function(category) {
    knn.addImage(video.elt, category);
  }
  
  // Predict the current frame.
  sketch.predict=function() {
    knn.predict(video.elt, sketch.gotResults);
  }
  
  // Show the results
  sketch.gotResults = function(results) {
    if (results.classIndex < 0) return;
    sketch.updateConfidence(results.confidences);
    sketch.updateGif(results);
    //updateSound(results);
    if (isPredicting) predictimer = setTimeout(() => sketch.predict(), 50);
  }
  
  sketch.updateConfidence = function(confidences) {
    for (let j = 0; j < msgArray.length; j++) {
      sketch.select('#progress-text' + msgArray[j]).html( confidences[j] * 100 + ' %');
      sketch.select('#progress-bar' + msgArray[j]).style('width', confidences[j] * 100 + '%');
    }
  }
  
  // Clear the data in one class
  sketch.clearClass = function(classIndex) {
    knn.clearClass(classIndex);
  }
  
  sketch.updateGif = function(results) {
    // Display different gifs
    if (results.classIndex < 0) return;
    updateGame(results.classIndex);
    // if (outputSrc !== gifSrcs[results.classIndex]) {
    //   outputSrc = gifSrcs[results.classIndex];
    //   sketch.select('#output').elt.src = outputSrc;
    // }
  }
  
  sketch.updateExampleCounts = function() {
    let counts = knn.getClassExampleCount();
    exampleCounts = counts.slice(0, 2);
    exampleCounts.forEach((count, index) => {
      sketch.select('#example' + msgArray[index]).html(count + ' EXAMPLES');
    });
  
    sketch.updateIsPredicting();
  }

  sketch.updateIsPredicting = function() {
  prevIsPredicting = isPredicting;
  isPredicting = exampleCounts.some(e => e > 0);
  if (prevIsPredicting !== isPredicting) {
    if (isPredicting) {
      sketch.predict();
    } else {
      clearTimeout(predictimer);
      sketch.resetResult();
    }
  }
}
  
  sketch.updateGifIndex = function() {
    prevIsPredicting = isPredicting;
    isPredicting = exampleCounts.some(e => e > 0);
    if (prevIsPredicting !== isPredicting) {
      if (isPredicting) {
        sketch.predict();
      } else {
        clearTimeout(predictimer);
        resetResult();
      }
    }
  }
  
  sketch.resetResult = function() {
    sketch.select('#output').elt.src = 'default.png';
    sketch.updateConfidence(exampleCounts);
  }
  
  sketch.uploadGif = function(index) {
    updateGifIndex = index;
    uploadBtn.elt.click();
  }
  
  sketch.imageUpload = function(file) {
    gifSrcs[updateGifIndex] = file.data;
    sketch.select('#img' + msgArray[updateGifIndex]).elt.src = file.data;
    sketch.select('#output').elt.src = file.data;
  }
  
  
  sketch.toggleOutput = function() {
    let radio, gifDisplay, soundDisplay;
    if (this.tagName == "LABEL") radio = this.control; else radio = this;
    if (radio.id === "option-gif") {
      gifDisplay = "block";
      soundDisplay = "none";
      outputGif = true;
      outputSound = false;
    } else {
      gifDisplay = "none";
      soundDisplay = "block";        
      outputGif = false;
      outputSound = true;
    }
    sketch.select("#gif-output").style("display", gifDisplay);
  }
}

let s2 = function ( sketch ) {

  sketch.setup = function() {
    //createCanvas(800, 400);
    sketch.createCanvas(320, 240).parent("canvasContainerOutput");
    //frameRate(6);
    
    speed = 0;

    paddleA = sketch.createSprite(30, sketch.height/2, 10, 50);
    paddleA.immovable = true;
  
    paddleB = sketch.createSprite(sketch.width-28, sketch.height/2, 10, 50);
    paddleB.immovable = true;
  
    wallTop = sketch.createSprite(sketch.width/2, -30/2, sketch.width, 30);
    wallTop.immovable = true;
  
    wallBottom = sketch.createSprite(sketch.width/2, sketch.height+30/2, sketch.width, 30);
    wallBottom.immovable = true;
  
    ball = sketch.createSprite(sketch.width/2, sketch.height/2, 10, 10);
    ball.maxSpeed = MAX_SPEED;
  
    paddleA.shapeColor = paddleB.shapeColor = ball.shapeColor = sketch.color(255, 255, 255);
  
    ball.setSpeed(MAX_SPEED, -180);
  };
  
  sketch.changePosition = function(speedParam) {
      speed = speedParam;
  }

  sketch.draw = function() {
    sketch.background(0);
    
    paddleA.position.y += speed;
    paddleA.position.y = sketch.constrain(paddleA.position.y, paddleA.height/2, sketch.height-paddleA.height/2);
    paddleB.position.y = sketch.constrain(paddleA.position.y, paddleA.height/2, sketch.height-paddleA.height/2);
  
    ball.bounce(wallTop);
    ball.bounce(wallBottom);
  
    var swing;
    if(ball.bounce(paddleA)) {
      swing = (ball.position.y-paddleA.position.y)/3;
      ball.setSpeed(MAX_SPEED, ball.getDirection()+swing);
    }
  
    if(ball.bounce(paddleB)) {
      swing = (ball.position.y-paddleB.position.y)/3;
      ball.setSpeed(MAX_SPEED, ball.getDirection()-swing);
    }
  
    if(ball.position.x<0) {
      ball.position.x = sketch.width/2;
      ball.position.y = sketch.height/2;
      ball.setSpeed(MAX_SPEED, 0);
    }
  
    if(ball.position.x>sketch.width) {
      ball.position.x = sketch.width/2;
      ball.position.y = sketch.height/2;
      ball.setSpeed(MAX_SPEED, 180);
    }
  
    sketch.drawSprites();
  
  };
};

let inputSketch = new p5(s1);
let outputSketch = new p5(s2);

function updateGame(classIndex) {
  if (classIndex === 0){
    outputSketch.changePosition(CHANGE_SPEED);
  }
  else if (classIndex === 1) {
    outputSketch.changePosition(-CHANGE_SPEED);
  }  
}
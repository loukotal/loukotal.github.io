EMOTIONS = {
    // 0: "😡",
    // 1: "🤢",
    // 2: "😱",
    0: "😀",
    1: "😞",
    // 5: "😲",
    2: "😐"
}
function preprocess(imgData) {
return tf.tidy(() => {
  //convert to a tensor 
  let tensor = tf.browser.fromPixels(imgData, numChannels = 1)
  
  //resize 
  const resized = tf.image.resizeBilinear(tensor, [48, 48]).toFloat()
  
  //normalize 
  const offset = tf.scalar(255.0);
  const normalized = tf.scalar(1.0).sub(resized.div(offset));

  //We add a dimension to get a batch shape 
  const batched = normalized.expandDims(0)
  return batched
})
}

function cropFace(rect) {
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  
      var x = rect.x
      var y = rect.y;
      var w = rect.width;
      var h = rect.height;

      var w_w = video.width;
      var w_h = video.height;
      var video_w = video.videoWidth;
      var video_h = video.videoHeight;

      var ratio = video_w / w_w;
      //console.log(ratio);

      context.drawImage(video, x*ratio, y*ratio, w * ratio, h * ratio, 0, 0, 48, 48);

      //Convert Image to Greyscale
      var imageData = context.getImageData(0, 0, 48, 48);
      // context.drawImage(video, x*ratio, y*ratio, w_w * ratio, w_h * ratio, 0, 0, 48, 48);
      var data = imageData.data;
      for (var i = 0; i < data.length; i += 4) {
          var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i]     = avg; // red
          data[i + 1] = avg; // green
          data[i + 2] = avg; // blue
      }
      // context.putImageData(imageData, x*ratio, y*ratio);
      
      return imageData;
  }

window.onload = async function() {
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var tracker = new tracking.ObjectTracker('face');
  var model = await tf.loadLayersModel("model/model_3.json");
  var emoji_p = document.getElementById("emoji");
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);
  tracking.track('#video', tracker, { camera: true , fps: 10});
  tracker.on('track', function(event) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    event.data.forEach(function(rect) {
      context.strokeStyle = '#a64ceb';
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.font = '11px Helvetica';
      context.fillStyle = "#fff";
      context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
      context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
      imgData = cropFace(rect);

      prediction = model.predict(preprocess(imgData)).dataSync();
      max_index = prediction.indexOf(Math.max(...prediction));
    emoji_p.textContent = EMOTIONS[max_index]
    });
    
  });

};
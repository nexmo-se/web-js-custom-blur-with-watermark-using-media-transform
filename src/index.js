// import the required packages

import {
  MediaProcessor,
  MediaProcessorConnector,
} from "@vonage/media-processor";
import OT from "@opentok/client";
import qrCode from "./transformers/add-qr-code";
import Watermark from "./transformers/watermark";
import Blur from "./transformers/blur-transformer";

var publisherProperties = {
  width: "100%",
  height: "100%",
  insertMode: "append",
};
const publisher = OT.initPublisher("publisher", publisherProperties, () => {
  console.log("Publisher initialized");
});

// Watermark Code

let watermarkImage = null;

document
  .getElementById("blur-watermark-image")
  .addEventListener("change", function () {
    const file = this.files[0];
    watermarkImage = new Image();
    // Create object URL
    const objectURL = URL.createObjectURL(file);
    // Use object URL as img source
    watermarkImage.src = objectURL;
    // Don't forget to revoke the object URL after the image has been loaded
    watermarkImage.onload = function () {
      URL.revokeObjectURL(objectURL);
    };
  });

// We need to flip the image horizontally because the publisher is flipped to avoid mirror effect
const flipImage = (srcImage) => {
  const outputImage = document.createElement("canvas");
  outputImage.width = srcImage.naturalWidth;
  outputImage.height = srcImage.naturalHeight;

  const ctx = outputImage.getContext("2d");

  // Flip the image by scaling negatively to the left
  ctx.scale(-1, 1);

  // Draw the image on the canvas
  // Starts at [-width, 0] because the flip scaled negatively
  ctx.drawImage(srcImage, -outputImage.width, 0);
  const targetImage = new Image();
  targetImage.src = outputImage.toDataURL();
  return targetImage;
};


const applyBlurWatermark = () => {
  if (!watermarkImage) {
    console.log("No watermark image selected");
    return;
  }
  const position = document.getElementById("blur-watermark-position").value;
  const mediaProcessor = new MediaProcessor();
  const transformers = [new Blur(), new Watermark(flipImage(watermarkImage), position)];
  mediaProcessor.setTransformers(transformers);
  const connector = new MediaProcessorConnector(mediaProcessor);
  publisher.setVideoMediaProcessorConnector(connector);
};

document.getElementById("apply-btn").addEventListener("click", function () {
  applyBlurWatermark();
});

document.getElementById("clear-btn").addEventListener("click", function () {
  publisher.setVideoMediaProcessorConnector(null);
});

// I need to create a web page where you can upload an image and it will be shown on the video stream.
// Same for the QR Code, you can set a link and it will be shown on the video stream.
// The added value is not the transformer per se, but the fact that you can use it in a video stream.

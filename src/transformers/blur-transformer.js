import '@tensorflow/tfjs-core/dist/tf-core.min.js'
import '@tensorflow/tfjs-backend-webgl/dist/tf-backend-webgl.min.js'
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@mediapipe/selfie_segmentation/selfie_segmentation.js'

export default class Transformer {
  constructor() {
    
    this.canvas_ = null;
    this.ctx_ = null;    
  }

  //NOTE on solutionPath
  //this is the mediapipe selfie segmentation solution bundle
  //You can use the ones available in this cdn https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation
  //or copy the files from "node_modules/@mediapipe/selfie-segmentation" after you "npm install node_modules/@mediapipe"
  async start() {
    this.segmenterConfig = {
      runtime: 'mediapipe',
      solutionPath: 'selfie_segmentation/'
    };
    this.segmenter = await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,  this.segmenterConfig);
    this.canvas_ = new OffscreenCanvas(1, 1);
    console.log(this.canvas_)
    this.ctx_ = this.canvas_.getContext('2d', { alpha: false, desynchronized: true });
    if (!this.ctx_) {
      throw new Error('Unable to create CanvasRenderingContext2D');
    }
  }

  async transform(frame, controller) {
    const canvas_out = new OffscreenCanvas(1, 1);
    this.canvas_.width = frame.displayWidth;
    this.canvas_.height = frame.displayHeight;
    const timestamp = frame.timestamp;

    this.ctx_.drawImage(frame, 0, 0);
    frame.close();

    const segmentation = await this.segmenter.segmentPeople(this.canvas_);

    const foregroundThreshold = 0.5;
    const backgroundBlurAmount = 10;
    const edgeBlurAmount = 3;
    const flipHorizontal = false;

    
    // // Draw the image with the background blurred onto the canvas. The edge between
    // // the person and blurred background is blurred by 3 pixels.
    await bodySegmentation.drawBokehEffect(
        canvas_out, this.canvas_, segmentation, foregroundThreshold, backgroundBlurAmount,
        edgeBlurAmount, flipHorizontal);

    controller.enqueue(new VideoFrame(canvas_out, { timestamp, alpha: 'discard' }));
  }

  flush() {
    console.log('canvas transformer flush');
  }
}
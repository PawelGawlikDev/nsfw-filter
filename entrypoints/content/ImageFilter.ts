import { ImageProcessingQueue } from "./ImageProcessingQueue";

/**
 * IImageFilter interface defines the structure for the ImageFilter class.
 * It includes a method to analyze an image and apply necessary filters.
 */
export type IImageFilter = {
  /**
   * Analyzes an image and applies a filter based on the image's src attribute and size.
   * @param image - The image element to analyze.
   * @param srcAttribute - Flag to indicate whether the analysis is due to a src attribute change (default is false).
   */
  analyzeImage: (image: HTMLImageElement, srcAttribute: boolean) => void;
};

/**
 * ImageFilter class processes images by analyzing their attributes and size,
 * applying filters such as hiding and blurring images based on their content.
 * It works with an image processing queue for sequential processing.
 */
export class ImageFilter implements IImageFilter {
  private readonly MIN_IMAGE_SIZE: number;
  private queue: ImageProcessingQueue;

  /**
   * Constructor to initialize the ImageFilter class with default values.
   */
  constructor() {
    this.MIN_IMAGE_SIZE = 41; // Minimum image size to be processed
    this.queue = new ImageProcessingQueue(); // Queue for processing images sequentially
  }

  /**
   * Analyzes an image based on its size and src attribute.
   * If the image meets the conditions (size, valid src), it will be hidden and added to the processing queue.
   * @param image - The image element to analyze.
   * @param srcAttribute - A flag indicating if the analysis is due to a src attribute change (default is false).
   */
  public analyzeImage(
    image: HTMLImageElement,
    srcAttribute: boolean = false
  ): void {
    // Conditions to check if the image should be processed
    if (
      (srcAttribute || image.dataset.nsfwFilterStatus === undefined) &&
      image.src.length > 0 &&
      ((image.width > this.MIN_IMAGE_SIZE &&
        image.height > this.MIN_IMAGE_SIZE) ||
        image.height === 0 ||
        image.width === 0)
    ) {
      // Hide the image while processing
      this.hideImage(image);
      image.dataset.nsfwFilterStatus = "processing"; // Mark the image as being processed
      this.queue.enqueue(image); // Add to the queue for processing
    }
  }

  /**
   * Hides the image element by setting its visibility and hidden properties.
   * @param image - The image element to hide.
   */
  private hideImage(image: HTMLImageElement): void {
    if (image.parentNode?.nodeName === "BODY") image.hidden = true; // Hide in the body

    image.style.visibility = "hidden"; // Hide visibility while processing
  }
}

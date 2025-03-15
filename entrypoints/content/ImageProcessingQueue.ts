import { LRUCache } from "./Cache";

/**
 * Type definition for an image processing task.
 * Includes the image to be processed and a resolve function to manage async operations.
 */
type ImageTask = {
  image: HTMLImageElement;
  resolve: (value?: void | PromiseLike<void>) => void;
};

/**
 * ImageProcessingQueue class manages a queue of images to be processed sequentially.
 * It handles cache checks, image processing, and applying filters based on the results.
 * This class ensures that image processing tasks are completed one by one to prevent race conditions.
 */
export class ImageProcessingQueue {
  private queue: ImageTask[] = []; // Queue to store image tasks
  private isProcessing = false; // Flag to check if an image is currently being processed
  private cache: LRUCache<string, boolean>; // Cache to store processed image data (e.g., NSFW status)

  /**
   * Constructor to initialize the ImageProcessingQueue with an optional cache size.
   * @param cacheSize - Size of the cache for storing processed image data (default is 100).
   */
  constructor(cacheSize: number = 100) {
    this.cache = new LRUCache<string, boolean>(cacheSize); // Initialize cache with size
  }

  /**
   * Enqueues an image for processing.
   * This method returns a promise that resolves once the image has been processed.
   * @param image - The image element to be processed.
   * @returns A promise that resolves once the image processing is complete.
   */
  enqueue(image: HTMLImageElement): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ image, resolve }); // Add the image task to the queue
      this.processNext(); // Start processing if not already processing
    });
  }

  /**
   * Makes the image visible again after processing.
   * @param image - The image element to make visible.
   */
  private showImage(image: HTMLImageElement): void {
    if (image.parentNode?.nodeName === "BODY") image.hidden = false; // Show the image in the body

    image.style.visibility = "visible"; // Set visibility to visible
  }

  /**
   * Processes the next image in the queue.
   * This method ensures that only one image is processed at a time.
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return; // Return if already processing or queue is empty

    this.isProcessing = true; // Set flag to prevent multiple processes at the same time

    const { image, resolve } = this.queue.shift()!; // Get the next image task

    try {
      const src = image.src; // Get the image source URL

      // Check cache before processing
      if (this.cache.has(src)) {
        const isNSFW = this.cache.get(src) as boolean; // Get NSFW status from cache

        this.applyFilter(image, isNSFW); // Apply the filter based on cache
      } else {
        await this.processImage(image); // Process the image if not cached
      }
    } finally {
      resolve(); // Resolve the promise when done
      this.isProcessing = false; // Reset processing flag
      this.processNext(); // Process the next image in the queue
    }
  }

  /**
   * Processes an image by sending a request for analysis.
   * @param image - The image element to process.
   * @returns A promise that resolves once the image has been processed.
   */
  private async processImage(image: HTMLImageElement): Promise<void> {
    return new Promise((resolve) => {
      // Send message to background script for image analysis
      chrome.runtime.sendMessage(
        { type: "ANALYZE", data: image.src },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "[QUEUE] Error in message response:",
              chrome.runtime.lastError
            );

            return resolve();
          }

          if (response && typeof response.isNSFW !== "undefined") {
            const isNSFW = response.isNSFW; // Get NSFW status from the response

            this.cache.set(image.src, isNSFW); // Cache the result
            this.applyFilter(image, isNSFW); // Apply the appropriate filter
          } else {
            console.error("[QUEUE] No valid response received.");
          }

          resolve(); // Resolve when done
        }
      );
    });
  }

  /**
   * Applies a filter to the image based on whether it is NSFW or safe for work (SFW).
   * @param image - The image element to apply the filter to.
   * @param isNSFW - A flag indicating if the image is NSFW.
   */
  private applyFilter(image: HTMLImageElement, isNSFW: boolean): void {
    if (isNSFW) {
      image.style.filter = "blur(25px)"; // Apply a blur filter for NSFW content
      image.dataset.nsfwFilterStatus = "nsfw"; // Mark the image as NSFW
    } else {
      image.dataset.nsfwFilterStatus = "sfw"; // Mark the image as SFW
    }

    this.showImage(image); // Make the image visible again
  }
}

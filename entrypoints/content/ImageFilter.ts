export type IImageFilter = {
  analyzeImage: (image: HTMLImageElement, srcAttribute: boolean) => void;
};

import { ImageProcessingQueue } from "./ImageProcessingQueue";

export class ImageFilter {
  private readonly MIN_IMAGE_SIZE = 41;
  private queue: ImageProcessingQueue;
  private observer: IntersectionObserver;

  constructor() {
    this.queue = new ImageProcessingQueue();

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.queue.enqueue(entry.target as HTMLImageElement, true); // Priorytetowy obraz
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
    );
  }

  analyzeImage(image: HTMLImageElement, srcAttribute: boolean = false): void {
    if (
      (srcAttribute || image.dataset.nsfwFilterStatus === undefined) &&
      image.src.length > 0 &&
      (image.width > this.MIN_IMAGE_SIZE || image.height > this.MIN_IMAGE_SIZE)
    ) {
      this.hideImage(image);
      image.dataset.nsfwFilterStatus = "processing";

      this.observer.observe(image);
      this.queue.enqueue(image, false);
    }
  }

  private hideImage(image: HTMLImageElement): void {
    image.hidden = true;
    image.style.visibility = "hidden";
  }
}

import { LRUCache } from "./Cache";

type ImageTask = {
  image: HTMLImageElement;
  resolve: () => void;
};

export class ImageProcessingQueue {
  private highPriorityQueue: ImageTask[] = [];
  private lowPriorityQueue: ImageTask[] = [];
  private processingCount = 0;
  private readonly MAX_CONCURRENT_TASKS = 3;
  private cache: LRUCache<string, boolean>;

  constructor(cacheSize = 100) {
    this.cache = new LRUCache<string, boolean>(cacheSize);
  }

  enqueue(
    image: HTMLImageElement,
    highPriority: boolean = false
  ): Promise<void> {
    return new Promise((resolve) => {
      const queue = highPriority
        ? this.highPriorityQueue
        : this.lowPriorityQueue;

      queue.push({ image, resolve });

      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processingCount >= this.MAX_CONCURRENT_TASKS) return;

    const task =
      this.highPriorityQueue.shift() || this.lowPriorityQueue.shift();

    if (!task) return;

    this.processingCount++;

    try {
      const { image, resolve } = task;
      const src = image.src;
      const isNSFW = this.cache.get(src);

      if (isNSFW !== undefined) {
        this.applyFilter(image, isNSFW);
      } else {
        await this.processImage(image);
      }

      resolve();
    } finally {
      this.processingCount--;
      this.processNext();
    }
  }

  private async processImage(image: HTMLImageElement): Promise<void> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "ANALYZE", data: image.src },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("[QUEUE] Error:", chrome.runtime.lastError);
          } else if (response?.isNSFW !== undefined) {
            this.cache.set(image.src, response.isNSFW);
            this.applyFilter(image, response.isNSFW);
          } else {
            console.error("[QUEUE] Invalid response.");
          }

          resolve();
        }
      );
    });
  }

  private applyFilter(image: HTMLImageElement, isNSFW: boolean): void {
    image.style.filter = isNSFW ? "blur(25px)" : "";
    image.dataset.nsfwFilterStatus = isNSFW ? "nsfw" : "sfw";
    image.hidden = false;
    image.style.visibility = "visible";
  }
}

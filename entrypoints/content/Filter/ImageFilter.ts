import * as nsfw from "nsfwjs";

import { Logger } from "@/utils/Logger";
import { LRUCache } from "../LRUCache";

type imageFilterSettingsType = {
  filterEffect: "blur" | "hide" | "grayscale";
};

export type IImageFilter = {
  analyzeImage: (image: HTMLImageElement, srcAttribute: boolean) => void;
  setSettings: (settings: imageFilterSettingsType) => void;
};

export class ImageFilter implements IImageFilter {
  private readonly MIN_IMAGE_SIZE: number;
  private settings: imageFilterSettingsType;
  private model: nsfw.NSFWJS | null = null;
  private cache: LRUCache<string, boolean>;
  private logger: Logger;

  constructor() {
    this.MIN_IMAGE_SIZE = 41;
    this.settings = { filterEffect: "blur" };
    this.logger = new Logger();
    this.cache = new LRUCache<string, boolean>(100);

    nsfw
      .load()
      .then((loadedModel) => {
        this.model = loadedModel;
        this.logger.log("[NSFW-Filter] Model loaded");
      })
      .catch((error) => {
        this.logger.log(`[NSFW-Filter] Failed to load NSFW model: ${error}`);
      });
  }

  public setSettings(settings: imageFilterSettingsType): void {
    this.settings = settings;
  }

  public analyzeImage(
    image: HTMLImageElement,
    srcAttribute: boolean = false
  ): void {
    if (
      (srcAttribute || image.dataset.nsfwFilterStatus === undefined) &&
      image.src.length > 0 &&
      ((image.width > this.MIN_IMAGE_SIZE &&
        image.height > this.MIN_IMAGE_SIZE) ||
        image.height === 0 ||
        image.width === 0)
    ) {
      image.dataset.nsfwFilterStatus = "processing";
      this._analyzeImage(image);
    }
  }

  private async _analyzeImage(image: HTMLImageElement): Promise<void> {
    this.hideImage(image);
    if (this.cache.has(image.src)) {
      const isNSFW = this.cache.get(image.src) as boolean;
      this.applyFilter(image, isNSFW as boolean);
      return;
    }
    try {
      const nsfwResult = await this.classifyImage(image);
      const isNSFW = nsfwResult && nsfwResult.probability > 0.4;
      this.applyFilter(image, isNSFW as boolean);
    } catch (error) {
      this.logger.error(`[NSFW-Filter] Image classification failed: ${error}`);
      this.showImage(image);
    }
  }

  private async classifyImage(
    image: HTMLImageElement
  ): Promise<{ className: string; probability: number } | null> {
    if (!this.model) {
      console.warn("[NSFW-Filter] Model not loaded yet");
      return null;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.src;

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const predictions = await this.model!.classify(img);
          const nsfwPrediction = predictions.find(
            (p) => p.className === "Porn" || p.className === "Sexy"
          );

          if (nsfwPrediction) {
            resolve(nsfwPrediction);
          } else {
            resolve({ className: "SFW", probability: 0 });
          }
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    });
  }

  private applyFilter(image: HTMLImageElement, isNSFW: boolean): void {
    if (isNSFW) {
      if (this.settings.filterEffect === "blur") {
        image.style.filter = "blur(25px)";
      } else if (this.settings.filterEffect === "grayscale") {
        image.style.filter = "grayscale(1)";
      } else {
        image.hidden = true;
      }

      image.dataset.nsfwFilterStatus = "nsfw";
    } else {
      image.dataset.nsfwFilterStatus = "sfw";
    }

    this.showImage(image);
  }

  private hideImage(image: HTMLImageElement): void {
    if (image.parentNode?.nodeName === "BODY") image.hidden = true;
    image.style.visibility = "hidden";
  }

  private showImage(image: HTMLImageElement): void {
    if (image.parentNode?.nodeName === "BODY") image.hidden = false;
    image.style.visibility = "visible";
  }
}

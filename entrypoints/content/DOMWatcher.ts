// Highly sensitive code, make sure that you know what you're doing
// https://stackoverflow.com/a/39332340/10432429

import { IImageFilter } from "./ImageFilter";

/**
 * IDOMWatcher interface defines the structure for the DOMWatcher class.
 * It includes a method to start observing DOM changes.
 */
export type IDOMWatcher = {
  /**
   * Start observing the DOM for changes.
   */
  watch: () => void;
};

/**
 * DOMWatcher class observes changes in the DOM and performs actions based on mutations.
 * Specifically, it looks for new images added to the DOM and checks for changes to image attributes.
 * This class is designed to work with an image filter to analyze images as they appear or change in the DOM.
 */
export class DOMWatcher implements IDOMWatcher {
  private readonly observer: MutationObserver;
  private readonly imageFilter: IImageFilter;

  /**
   * Constructor to initialize the DOMWatcher class.
   * @param imageFilter - The image filter instance used to analyze images in the DOM.
   */
  constructor(imageFilter: IImageFilter) {
    this.imageFilter = imageFilter;
    this.observer = new MutationObserver(this.callback.bind(this));
  }

  /**
   * Start observing the DOM for changes.
   * The observer is configured to watch for child node additions, attribute changes, and specific image mutations.
   */
  public watch(): void {
    this.observer.observe(document, DOMWatcher.getConfig());
  }

  /**
   * Callback method for handling observed mutations in the DOM.
   * It processes changes based on the mutation type.
   * @param mutationsList - List of mutation records representing the changes detected.
   */
  private callback(mutationsList: MutationRecord[]): void {
    // Loop through all mutations and process them
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i];

      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // If new nodes are added, find and analyze all images in the added nodes
        this.findAndCheckAllImages(mutation.target as Element);
      } else if (mutation.type === "attributes") {
        // If an attribute has changed, specifically check if the image's src attribute changed
        this.checkAttributeMutation(mutation);
      }
    }
  }

  /**
   * Find all images within the provided element and analyze them using the image filter.
   * This method checks all images in newly added elements in the DOM.
   * @param element - The DOM element to check for images.
   */
  private findAndCheckAllImages(element: Element): void {
    // Get all image elements inside the given DOM element
    const images = element.getElementsByTagName("img");

    // Loop through each image and analyze it
    for (let i = 0; i < images.length; i++) {
      this.imageFilter.analyzeImage(images[i], false);
    }
  }

  /**
   * Check if a mutation is related to an image's src attribute and analyze the image if it is.
   * @param mutation - The mutation record containing information about the changed attribute.
   */
  private checkAttributeMutation(mutation: MutationRecord): void {
    // Only handle mutations on image elements
    if ((mutation.target as HTMLImageElement).nodeName === "IMG") {
      // Analyze the image, and determine if the change was related to the src attribute
      this.imageFilter.analyzeImage(
        mutation.target as HTMLImageElement,
        mutation.attributeName === "src"
      );
    }
  }

  /**
   * Get the configuration object for the MutationObserver.
   * This configuration specifies which types of mutations to observe and which attributes to track.
   * @returns The configuration object for the MutationObserver.
   */
  private static getConfig(): MutationObserverInit {
    return {
      characterData: false, // Don't track text node changes
      subtree: true, // Observe all descendant elements
      childList: true, // Observe additions/removals of child nodes
      attributes: true, // Observe changes to attributes
      attributeFilter: ["src"] // Specifically track changes to the 'src' attribute of images
    };
  }
}

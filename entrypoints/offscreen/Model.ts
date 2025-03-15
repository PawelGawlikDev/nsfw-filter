import { NSFWJS, type PredictionType } from "nsfwjs";
import { ILogger } from "@/utils/Logger";

/**
 * ModelSettings defines configuration settings for the model.
 * Currently, only the filterStrictness parameter is available.
 */
export type ModelSettings = {
  filterStrictness: number;
};

/**
 * IModel interface defines the structure for the Model class.
 * It includes methods to set settings and make image predictions.
 */
type IModel = {
  /**
   * Predict if an image is NSFW based on the model's classification.
   * @param image - The image to predict on.
   * @param url - The URL of the image for logging purposes.
   * @returns A promise that resolves to a boolean indicating if the image is NSFW.
   */
  predictImage: (image: HTMLImageElement, url: string) => Promise<boolean>;

  /**
   * Set the model settings, including filter strictness.
   * @param settings - The settings to apply to the model.
   */
  setSettings: (settings: ModelSettings) => void;
};

/**
 * Model class uses the NSFWJS model to predict whether an image is NSFW.
 * It filters predictions based on configured strictness settings.
 */
export class Model implements IModel {
  private readonly model: NSFWJS;
  private readonly logger: ILogger;

  private readonly FILTER_LIST: Set<string>;
  private readonly firstFilterPercentages: Map<string, number>;
  private readonly secondFilterPercentages: Map<string, number>;

  /**
   * Constructor to initialize the Model class with a specific model, logger, and settings.
   * @param model - The NSFWJS model used for classification.
   * @param logger - Logger instance for logging predictions.
   * @param settings - Settings to configure the model's behavior.
   */
  constructor(model: NSFWJS, logger: ILogger, settings: ModelSettings) {
    this.model = model;
    this.logger = logger;

    this.logger.log("Model is loaded");

    this.FILTER_LIST = new Set(["Hentai", "Porn", "Sexy"]);

    this.firstFilterPercentages = new Map();
    this.secondFilterPercentages = new Map();

    this.setSettings(settings);
  }

  /**
   * Set the model's filter settings based on the provided configuration.
   * @param settings - Configuration object containing filter strictness.
   */
  public setSettings(settings: ModelSettings): void {
    const { filterStrictness } = settings;

    this.firstFilterPercentages.clear();
    this.secondFilterPercentages.clear();

    // Configure filter percentages based on strictness
    for (const className of this.FILTER_LIST.values()) {
      this.firstFilterPercentages.set(
        className,
        Model.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 100,
          minValue: className === "Porn" ? 40 : 60
        })
      );
    }

    for (const className of this.FILTER_LIST.values()) {
      this.secondFilterPercentages.set(
        className,
        Model.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 50,
          minValue: className === "Porn" ? 15 : 25
        })
      );
    }
  }

  /**
   * Predict if an image is NSFW based on the model's classification results.
   * It logs the result if logging is enabled.
   * @param image - The image to classify.
   * @param url - The URL of the image for logging purposes.
   * @returns A promise that resolves to a boolean indicating if the image is NSFW.
   */
  public async predictImage(
    image: HTMLImageElement,
    url: string
  ): Promise<boolean> {
    if (this.logger.status) {
      const start = new Date().getTime();

      const prediction = await this.model.classify(image, 2);
      const { result, className, probability } =
        this.handlePrediction(prediction);

      const end = new Date().getTime();

      this.logger.log(
        `IMG prediction (${
          end - start
        } ms) is ${className} ${probability} for ${url}`
      );

      return result;
    } else {
      const prediction = await this.model.classify(image, 2);

      return this.handlePrediction(prediction).result;
    }
  }

  /**
   * Handle the model's prediction and apply filtering thresholds.
   * @param prediction - The prediction result from the model.
   * @returns An object containing the prediction result, class name, and probability.
   */
  private handlePrediction(prediction: PredictionType[]): {
    result: boolean;
    className: string;
    probability: number;
  } {
    const [
      { className: cn1, probability: pb1 },
      { className: cn2, probability: pb2 }
    ] = prediction;

    const result1 =
      this.FILTER_LIST.has(cn1) &&
      pb1 > (this.firstFilterPercentages.get(cn1) as number);

    if (result1) return { result: result1, className: cn1, probability: pb1 };

    const result2 =
      this.FILTER_LIST.has(cn2) &&
      pb2 > (this.secondFilterPercentages.get(cn2) as number);

    if (result2) return { result: result2, className: cn2, probability: pb2 };

    return { result: false, className: cn1, probability: pb1 };
  }

  /**
   * Calculate the filter threshold based on strictness values.
   * @param value - The strictness level.
   * @param minValue - The minimum threshold for a specific class.
   * @param maxValue - The maximum threshold for a specific class.
   * @returns A filtered value based on the strictness settings.
   */
  public static handleFilterStrictness({
    value,
    minValue,
    maxValue
  }: {
    value: number;
    minValue: number;
    maxValue: number;
  }): number {
    const MIN = minValue;
    const MAX = maxValue;

    const calc = (value: number): number => {
      if (value <= 1) return MAX;
      else if (value >= 100) return MIN;
      else {
        const coefficient = value / 100;

        return coefficient;
      }
    };

    return Math.round(calc(value) * 100) / 100;
  }
}

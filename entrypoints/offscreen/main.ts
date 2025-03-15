import * as nsfw from "nsfwjs";
import { Logger } from "@/utils/Logger";
import { Model } from "./Model";
import { prod } from "@/utils/env";

let model: Model | null = null;
const logger = new Logger();

if (!prod) {
  logger.enable();
}

nsfw
  .load("../models/", { type: "graph" })
  .then((loadedModel) => {
    model = new Model(loadedModel, logger, { filterStrictness: 40 });
    model.setSettings({ filterStrictness: 40 });
  })
  .catch((error) => {
    console.error(`[NSFW-Filter] Failed to load NSFW model: ${error}`);
  });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "ANALYZE") {
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.src = message.data;

    img.onload = async () => {
      try {
        const isNSFW = await model?.predictImage(img, message.data);

        sendResponse({ imageUrl: message.data, isNSFW });
      } catch (error) {
        console.error("[NSFW-Filter] Error analyzing image:", error);
        sendResponse(null);
      }
    };

    img.onerror = () => {
      console.error("[NSFW-Filter] Failed to load image for analysis");
      sendResponse(null);
    };

    return true;
  }
});

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
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      if (response !== undefined) {
        model = new Model(loadedModel, logger, { filterStrictness: response });
        model.setSettings({ filterStrictness: response });
      } else {
        console.error("[NSFW-Filter] Failed to get strictness settings.");
      }
    });
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

  if (message.type === "UPDATE_STRICTNESS") {
    if (model) {
      model.setSettings({ filterStrictness: message.value });

      logger.log(`[NSFW-Filter] Updated filter strictness to ${message.value}`);
    } else {
      logger.log("[NSFW-Filter] Model not initialized yet.");
    }

    return true;
  }
});

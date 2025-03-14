import { DOMWatcher } from "./DOMWatcher/DOMWatcher";
import { ImageFilter } from "./Filter/ImageFilter";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  allFrames: true,
  runAt: "document_start",
  main() {
    const init = (): void => {
      const imageFilter = new ImageFilter();
      const domWatcher = new DOMWatcher(imageFilter);
      domWatcher.watch();
    };

    // Ignore iframes, https://stackoverflow.com/a/326076/10432429
    if (window.self === window.top) init();
  },
});

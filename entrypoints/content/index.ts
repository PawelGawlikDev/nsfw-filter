import { DOMWatcher } from "./DOMWatcher";
import { ImageFilter } from "./ImageFilter";

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

    // Ignore iframes
    if (window.self === window.top) init();
  }
});

export default defineBackground(() => {
  (async () => {
    const contexts: chrome.runtime.ContextFilter[] =
      await chrome.runtime.getContexts({
        contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
      });

    if (contexts.length === 0) {
      browser.offscreen.createDocument({
        url: "/offscreen.html",
        reasons: ["DOM_SCRAPING"],
        justification: "Image classification required"
      });
    }
  })();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_SETTINGS") {
      filterStrictness.getValue().then((value) => {
        sendResponse(value ?? 50);
      });

      return true;
    }
  });
});

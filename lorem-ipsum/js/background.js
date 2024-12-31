browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: "contextMenu",
      title: "Insert LoremIpsum",
      contexts: ["editable"]
    });
  });
  
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "contextMenu") {
      // Send the clicked element's information to the content script
      browser.tabs.sendMessage(tab.id, { action: "showPopup" });
    }
  });
  
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "generateTestCase",
        title: "Generate Test Case",
        contexts: ["selection"],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "generateTestCase" && info.selectionText) {
        console.log('Sending message to content script');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log('test')
            const activeTab = tabs[0]
            chrome.tabs.sendMessage(activeTab.id!, { action: "getSelectedText" });
        })
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showTestCase") {
        const gptGeneratedTestCase = request.testCase;
        console.log(gptGeneratedTestCase);

        // Store the test case in the local storage
        chrome.storage.local.set({ testCase: gptGeneratedTestCase });
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "generateTestCase",
        title: "Generate Test Case",
        contexts: ["selection"],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "generateTestCase" && info.selectionText) {
        // due to info.selectionText is plain text. new line will become two white space. So we turned it back.
        const defectDescription = info.selectionText.replace(/ {2}/g, '\n');
        chrome.storage.local.set({ "defectDescription": defectDescription });
        chrome.storage.local.get(["prompt"], (data) => {
            const prompt = data.prompt;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0]
                // send message to content script to generate test case
                chrome.tabs.sendMessage(activeTab.id!, { action: "generateTestCase", prompt, defectDescription });
            });
        });
    }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showTestCase") {
        const gptGeneratedTestCase = request.testCase;
        async () => {
            // Store the test case in the local storage
            await chrome.storage.local.set({ testCase: gptGeneratedTestCase });
        }
    }
});
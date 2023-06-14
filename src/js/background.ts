export {};

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
                chrome.storage.local.set({ "isLoading": true });
            });
        });
    }
});


chrome.runtime.onMessage.addListener((request: { action: string, testCase: string }) => {
    if (request.action === "showTestCase") {
        const gptGeneratedTestCase = request.testCase;
        async () => {
            // Store the test case in the local storage
            await chrome.storage.local.set({ testCase: gptGeneratedTestCase });
        }
    }
});

chrome.runtime.onMessage.addListener(
    (request: { action: string, prompt: string, defectDescription: string }, sender: any, sendResponse: any) => {
      if (request.action === "generateTestCase") {
        const prompt = request.prompt;
        const defectDescription = request.defectDescription;
        fetch("http://127.0.0.1:5000/generate_test_case", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: prompt, defectDescription: defectDescription }),
        })
          .then((response) => response.json())
          .then((data) => {
            chrome.storage.local.set({ "testCase": data.test_steps });
            chrome.storage.local.set({ "isLoading": false });
            // Send a message to the background script to update the popup
            chrome.runtime.sendMessage({
              action: "testCaseGenerated",
              testCase: data.test_steps,
            });
          })
          .catch((error) => {
            console.error("Error fetching test case:", error);
          });
      }
    }
  );
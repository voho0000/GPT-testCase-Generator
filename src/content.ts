chrome.runtime.onMessage.addListener(
  (request: { action: string, prompt: string, defectDescription: string }, sender: any, sendResponse: any) => {
    if (request.action === "generateTestCase") {
      const prompt = request.prompt;
      const defectDescription = request.defectDescription;
      //https://35.212.234.39:5000
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

chrome.runtime.onMessage.addListener(
    (request: { action: string }, sender: any, sendResponse: any) => {
      if (request.action === "getSelectedText") {
        const selectedText = window.getSelection()!.toString();
        fetch("http://127.0.0.1:5000/generate_test_case", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ defect_description: selectedText }),
        })
          .then((response) => response.json())
          .then((data) => {
            // Store the received test case in the local storage
            chrome.storage.local.set({ testCase: data.test_steps });
  
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
  
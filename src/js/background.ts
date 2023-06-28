export {};

// add contextMenus event listener (selected text)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateTestCase",
    title: "Generate Test Case",
    contexts: ["selection"],
  });
});


// trigger generate test case
function generateTestCase(action:string) {
  chrome.storage.sync.set({ "isLoading": true });
  let prompt, defectDescription, model: string, temperature: number, endpoint: string, source, apiKey: string, testCases:string;
  let content;
  let headers;
  chrome.storage.sync.get(
    {
      prompt: '',
      defectDescription: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      endpoint: '',
      source: 'openai',
    },
    (data) => {
      ({ source, model, prompt, defectDescription, endpoint } = data);
      temperature = Number(data.temperature);
      let fullPrompt:string;
      if (source == 'openai') {
        // for 追問功能 use, in dev
        if (action=='generateMore'){
          fullPrompt = prompt + '\n' + defectDescription;
        }else{
          fullPrompt = prompt + '\n' + defectDescription;
        }
        chrome.storage.sync.get(["openaiApiKey"], (data) => {
          if (data.openaiApiKey) {
            apiKey = data.openaiApiKey;
          }
          content = {
            "model": model,
            "messages": [
              { "role": "system", "content": "You are a helpful assistant." },
              { "role": "user", "content": fullPrompt }
            ],
            //"max_tokens": max_tokens,
            "temperature": temperature
          };
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify(content)
          })
            .then(response => response.json())
            .then(data => {
              const test_steps = data['choices'][0]['message']['content'].trim();
              chrome.storage.sync.set({ "generatedText": test_steps });
              chrome.storage.sync.set({ "isLoading": false });
              chrome.runtime.sendMessage({ action: 'updateTestCase', testCase: test_steps });
            })
            .catch((error) => {
              console.error("Error fetching test case:", error);
            });
        });
      } else if (source == 'azure') {
        // for 追問功能 use, in dev
        if (action=='generateMore'){
          fullPrompt = prompt + '\n' + defectDescription;
        }else{
          fullPrompt = prompt + '\n' + defectDescription;
        }
        chrome.storage.sync.get(["azureApiKey"], (data) => {
          if (data.azureApiKey) {
            apiKey = data.azureApiKey;
          }
          // check endpoint url format
          if (!endpoint.endsWith('/')) {
            endpoint += '/';
          }
          content = {
            "messages": [
              { "role": "system", "content": "You are a helpful assistant." },
              { "role": "user", "content": fullPrompt }
            ],
            //"max_tokens": max_tokens,
            "temperature": temperature
          };
          headers = {
            'Content-Type': 'application/json',
            'api-key': apiKey
          };

          // check model name format
          if (model == 'gpt-3.5-turbo') {
            model = 'gpt-35-turbo'
          }

          const realEndpoint = `${endpoint}openai/deployments/${model}/chat/completions?api-version=2023-03-15-preview`;
          fetch(realEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(content)
          })
            .then(response => response.json())
            .then(data => {
              const test_steps = data['choices'][0]['message']['content'].trim();
              chrome.storage.sync.set({ "generatedText": test_steps });
              chrome.storage.sync.set({ "isLoading": false });
              chrome.runtime.sendMessage({ action: 'updateTestCase', testCase: test_steps });
            })
            .catch((error) => {
              console.error("Error fetching test case:", error);
            });
        });
      }
    }
  );
}

// listen to context menu click
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "generateTestCase" && info.selectionText) {
    const defectDescription = info.selectionText.replace(/ {2}/g, '\n');
    chrome.storage.sync.set({ "defectDescription": defectDescription });
    chrome.runtime.sendMessage({ action: 'updateDefect', defectDescription: defectDescription });
    generateTestCase('generate')
  }
});

// listen to message from popup.vue
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'generate') {
    generateTestCase('generate')
  }
  if (message.action === 'generateMore'){
    generateTestCase('generateMore')
  }
});

// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

document.addEventListener('DOMContentLoaded', function () {
  const temperatureInput = document.querySelector('#temperature') as HTMLInputElement;
  const saveButton = document.querySelector('#saveButton') as HTMLButtonElement;
  const sourceSelect = document.querySelector('#source') as HTMLSelectElement;
  const endpointContainer = document.querySelector('#endpointContainer') as HTMLDivElement;
  const azureApiKeyInput = document.querySelector('#azureApiKey') as HTMLInputElement;
  const openaiApiKeyInput = document.querySelector('#openaiApiKey') as HTMLInputElement;
  const azureApiKeyToggle = document.querySelector('#azureApiKeyToggle') as HTMLSpanElement;
  const openaiApiKeyToggle = document.querySelector('#openaiApiKeyToggle') as HTMLSpanElement;
  const asanaApiKeyToggle = document.querySelector('#asanaApiKeyToggle') as HTMLSpanElement;
  const azureApiKeyLabel = document.querySelector('#azureApiKeyLabel') as HTMLLabelElement;
  const openaiApiKeyLabel = document.querySelector('#openaiApiKeyLabel') as HTMLLabelElement;
  const asanaApiKeyInput = document.querySelector('#asanaApiKey') as HTMLInputElement; // Add reference to the Asana API key input field
  const modelSelect = document.querySelector('#model') as HTMLSelectElement;
  const defaultPromptTextarea = document.querySelector('#defaultPrompt') as HTMLTextAreaElement; // Add reference to the default prompt textarea


  function saveOptions() {
    const temperature = temperatureInput.value;
    const model = modelSelect.value;
    const source = sourceSelect.value;
    const endpoint = (document.querySelector('#endpoint') as HTMLInputElement).value;
    const azureApiKey = azureApiKeyInput.value;
    const openaiApiKey = openaiApiKeyInput.value;
    const asanaApiKey = asanaApiKeyInput.value;
    const defaultPrompt = defaultPromptTextarea.value;
    if (source === 'openai') {
      chrome.storage.sync.set(
        { temperature, model, source, openaiApiKey, asanaApiKey, defaultPrompt },
        () => {
          const status = document.getElementById('status');
          if (status) {
            status.textContent = 'Options saved.';
            setTimeout(() => {
              status.textContent = '';
            }, 750);
          }
        }
      );
    } else if (source === 'azure') {
      chrome.storage.sync.set(
        { temperature, model, source, endpoint, azureApiKey, asanaApiKey, defaultPrompt },
        () => {
          const status = document.getElementById('status');
          if (status) {
            status.textContent = 'Options saved.';
            setTimeout(() => {
              status.textContent = '';
            }, 750);
          }
        }
      );
    }
  }

  function restoreOptions() {
    chrome.storage.sync.get(
      {
        temperature: '0.5',
        model: 'gpt-3.5-turbo',
        source: 'openai',
        endpoint: '',
        azureApiKey: '',
        openaiApiKey: '',
        asanaApiKey: '',
        defaultPrompt: '我是一位測試工程師，請用繁體中文回答問題，利用以下缺陷描述來產出之後在進行手動測試時能涵蓋到此缺陷測試的測試案例，需去除使用者的可識別資訊，預期結果為正常結果，若有附上PRD，還需要增加能涵蓋PRD的使用情境的測試案例，若無附上則不用，產生的測試案例需要包含名稱, 前置條件, 測試步驟, 預期結果'
      },
      function (data) {
        temperatureInput.value = data.temperature;
        document.querySelector('#temperatureValue')!.textContent = temperatureInput.value;

        (document.querySelector('#model') as HTMLSelectElement).value = data.model;
        sourceSelect.value = data.source;
        (document.querySelector('#endpoint') as HTMLInputElement).value = data.endpoint;
        azureApiKeyInput.value = data.azureApiKey;
        openaiApiKeyInput.value = data.openaiApiKey;
        asanaApiKeyInput.value = data.asanaApiKey;
        defaultPromptTextarea.value = data.defaultPrompt; // Set the value of the default prompt textarea

        toggleEndpointField(data.source);
        toggleApiKeyFields(data.source);
      }
    );
  }

  function toggleEndpointField(source: string) {
    // Get the OpenAI exclusive options
    const openaiOptions = document.querySelectorAll<HTMLOptionElement>('.openai');

    if (source === 'openai') {
      endpointContainer.style.display = 'none';

      if (modelSelect.value.startsWith('gpt-4')) {
        modelSelect.value = 'gpt-3.5-turbo-0613';
      }

      // Hide Azure exclusive options and show OpenAI exclusive options
      for (let i = 0; i < modelSelect.options.length; i++) {
        const option = modelSelect.options[i];
        if (option.value.startsWith('gpt-4')) {
          option.hidden = true;
        }
      }

      // Show OpenAI exclusive options
      openaiOptions.forEach(option => {
        option.hidden = false;
      });
    } else {
      endpointContainer.style.display = 'block';

      if (modelSelect.value.endsWith('16k') || modelSelect.value.endsWith('0613')) {
        modelSelect.value = 'gpt-4';
      }


      // Show Azure exclusive options and hide OpenAI exclusive options
      for (let i = 0; i < modelSelect.options.length; i++) {
        const option = modelSelect.options[i];
        if (option.value.startsWith('gpt-4')) {
          option.hidden = false;
        }
      }

      // Hide OpenAI exclusive options
      openaiOptions.forEach(option => {
        option.hidden = true;
      });
    }
  }


  function toggleApiKeyFields(source: string) {
    if (source === 'openai') {
      azureApiKeyLabel.style.display = 'none';
      azureApiKeyInput.style.display = 'none';
      azureApiKeyToggle.style.display = 'none';

      openaiApiKeyLabel.style.display = 'block';
      openaiApiKeyInput.style.display = 'block';
      openaiApiKeyToggle.style.display = 'block';
    } else if (source === 'azure') {
      azureApiKeyLabel.style.display = 'block';
      azureApiKeyInput.style.display = 'block';
      azureApiKeyToggle.style.display = 'block';

      openaiApiKeyLabel.style.display = 'none';
      openaiApiKeyInput.style.display = 'none';
      openaiApiKeyToggle.style.display = 'none';
    }
  }

  function togglePasswordVisibility(input: HTMLInputElement, toggle: HTMLSpanElement) {
    toggle.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = 'hide';
      } else {
        input.type = 'password';
        toggle.textContent = 'show';
      }
    });
  }

  // Display the temperature value
  temperatureInput.addEventListener('input', () => {
    document.querySelector('#temperatureValue')!.textContent = temperatureInput.value;
  });

  // Set up the submit event listener for the save button
  saveButton.addEventListener('click', saveOptions);

  // Set up the change event listener for the source select
  sourceSelect.addEventListener('change', () => {
    const source = sourceSelect.value;
    toggleEndpointField(source);
    toggleApiKeyFields(source);
  });

  // Set up toggle for Azure API Key
  togglePasswordVisibility(azureApiKeyInput, azureApiKeyToggle);

  // Set up toggle for OpenAI API Key
  togglePasswordVisibility(openaiApiKeyInput, openaiApiKeyToggle);

  // Set up toggle for Asana API Key
  togglePasswordVisibility(asanaApiKeyInput, asanaApiKeyToggle);

  restoreOptions();
});

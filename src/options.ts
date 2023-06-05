document.addEventListener('DOMContentLoaded', function () {
  const temperatureInput = document.querySelector('#temperature') as HTMLInputElement;
  const saveButton = document.querySelector('#saveButton') as HTMLButtonElement;
  const sourceSelect = document.querySelector('#source') as HTMLSelectElement;
  const endpointContainer = document.querySelector('#endpointContainer') as HTMLDivElement;
  const azureApiKeyInput = document.querySelector('#azureApiKey') as HTMLInputElement;
  const openaiApiKeyInput = document.querySelector('#openaiApiKey') as HTMLInputElement;
  const azureApiKeyToggle = document.querySelector('#azureApiKeyToggle') as HTMLSpanElement;
  const openaiApiKeyToggle = document.querySelector('#openaiApiKeyToggle') as HTMLSpanElement;
  const azureApiKeyLabel = document.querySelector('#azureApiKeyLabel') as HTMLLabelElement;
  const openaiApiKeyLabel = document.querySelector('#openaiApiKeyLabel') as HTMLLabelElement;
  const modelSelect = document.querySelector('#model') as HTMLSelectElement;


  function saveOptions() {
    const temperature = temperatureInput.value;
    const model = modelSelect.value;
    const source = sourceSelect.value;
    const endpoint = (document.querySelector('#endpoint') as HTMLInputElement).value;
    const azureApiKey = azureApiKeyInput.value;
    const openaiApiKey = openaiApiKeyInput.value;

    if (source === 'openai') {
      chrome.storage.sync.set(
        { temperature, model, source, openaiApiKey },
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
        { temperature, model, source, endpoint, azureApiKey },
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
      { temperature: '', model: '', source: 'openai', endpoint: '', azureApiKey: '', openaiApiKey: '' },
      function (data) {
        temperatureInput.value = data.temperature;
        document.querySelector('#temperatureValue')!.textContent = temperatureInput.value;

        (document.querySelector('#model') as HTMLSelectElement).value = data.model;
        sourceSelect.value = data.source;
        (document.querySelector('#endpoint') as HTMLInputElement).value = data.endpoint;
        azureApiKeyInput.value = data.azureApiKey;
        openaiApiKeyInput.value = data.openaiApiKey;

        console.log("azureApiKey:", data.azureApiKey);
        console.log("openaiApiKey:", data.openaiApiKey);

        toggleEndpointField(data.source);
        toggleApiKeyFields(data.source);
      }
    );
  }

  function toggleEndpointField(source: string) {
    if (source === 'openai') {
      endpointContainer.style.display = 'none';
      // If OpenAI is selected, set the model select element to gpt-3.5-turbo and disable it
      modelSelect.value = 'gpt-3.5-turbo';
      modelSelect.disabled = true;
    } else {
      endpointContainer.style.display = 'block';
      // If Azure is selected, enable the model select element
      modelSelect.disabled = false;
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

  restoreOptions();
});

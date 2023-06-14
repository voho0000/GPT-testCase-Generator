<template>
    <div id="app">
        <h1>GPT Test Case Generator</h1>
        <div class="settings-button-container">
            <button class="settings-button" @click="openOptionsPage">
                <font-awesome-icon icon="cog" />
            </button>
        </div>
        <Navigation :current-tab="currentTab" @change-tab="changeTab" />
        <div v-if="currentTab === 'Popup'">
            <div>
                <div class="button-select-container">
                    <div class="item-container">
                        <label >Prompt:</label>
                    </div>
                    <div class="button-container">
                        <button @click="resetPrompt" class="reset-button">Reset</button>
                        <select v-model="selectedTemplate" @change="applyTemplate" class="template-select">
                            <option value="">Prompt</option>
                            <option v-for="template in promptTemplates" :key="template.id" :value="template.id.toString()">
                                {{ template.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div>
                    <textarea v-model="prompt" class="textarea" rows="6"></textarea>
                </div>
            </div>
            <div>
                <div class="item-container">
                    <label>Defect Description:</label>
                </div>
                <div>
                    <textarea v-model="defectDescription" class="textarea" rows="8"></textarea>
                </div>
            </div>
            <div class="token-count">
                <!--make the Note next line-->
                <p>Token Count: {{ tokenCount }} <br>
                    Note: This token count is specific to GPT-3, just for reference.
                </p> <!-- Display the token count -->
                <p>Model: {{ model }}, Source: {{ source }}, temperature: {{ temperature }} </p>
            </div>
            <div>
                <div class="item-container">
                    <label>Generated Test Case:</label>
                </div>
                <div>
                    <textarea v-model="testCase" class="textarea" rows="11"></textarea>
                </div>
            </div>
            <div v-if="isLoading" class="spinner-container">
                <div class="spinner"></div>
                <p>Generating test case...</p>
            </div>
            <div v-else></div> <!-- Properly closed div for v-else -->
            <div class="button-container">
                <button type="button" @click="clearLocalStorage">Clear</button>
                <button @click="get_ticket">Get a Asana ticket</button>
                <button @click="generate" :disabled="isLoading">Generate</button>
            </div>
        </div>
        <Form v-else-if="currentTab === 'PopupTaskForm'" :testCase="testCase" :main_ticket="mainTicket" />
        <Prompt v-else-if="currentTab === 'Prompt'" />
    </div>
</template>
  
<script lang="ts">

/// <reference types="chrome" />

import Navigation from "./Navigation.vue";
import Form from "./Form.vue";
import Prompt from "./Prompt.vue";
import { defineComponent, ref, onMounted, watch } from "vue";
import axios from 'axios';
import { encode } from '@nem035/gpt-3-encoder';

interface Template {
    id: number;
    name: string;
    content: string;
}

export default defineComponent({
    components: {
        Navigation,
        Form,
        Prompt,
    },
    setup() {
        const isLoading = ref(false);

        const currentTab = ref<string>("Popup");

        function changeTab(newTab: string) {
            currentTab.value = newTab;
            chrome.storage.sync.get(["templates"], (data) => {
                if (data.templates) {
                    promptTemplates.value = Object.values(data.templates);
                }
            });
        }


        const defaultPrompt = ref<string>("");
        const prompt = ref<string>("");
        const defectDescription = ref<string>('');
        const testCase = ref<string>("");
        const mainTicket = ref<string>("");
        const selectedTemplate = ref<string>("");
        const promptTemplates = ref<Template[]>([]);

        const tokenCount = ref<number>(0);

        const model = ref<string>('gpt-3.5-turbo');
        const temperature = ref<number>(0.5);
        const endpoint = ref<string>('');
        const source = ref<string>('openai');
        const apiKey = ref<string>('');


        onMounted(() => {
            chrome.storage.sync.get(
                {
                    isLoading: false,
                    prompt: '',
                    defectDescription: '',
                    testCase: '',
                    templates: null,
                    model: 'gpt-3.5-turbo',
                    temperature: 0.5,
                    endpoint: '',
                    source: 'openai',
                    defaultPrompt: '',
                },
                (data) => {
                    isLoading.value = data.isLoading;
                    prompt.value = data.prompt;
                    defectDescription.value = data.defectDescription;
                    testCase.value = data.testCase;
                    promptTemplates.value = data.templates ? Object.values(data.templates) : [];
                    model.value = data.model;
                    temperature.value = Number(data.temperature);
                    endpoint.value = data.endpoint;
                    source.value = data.source;
                    defaultPrompt.value = data.defaultPrompt;
                    if (source.value == 'openai') {
                        chrome.storage.sync.get(["openaiApiKey"], (data) => {
                            if (data.openaiApiKey) {
                                apiKey.value = data.openaiApiKey;
                            }
                        });
                    } else if (source.value == 'azure') {
                        chrome.storage.sync.get(["azureApiKey"], (data) => {
                            if (data.azureApiKey) {
                                apiKey.value = data.azureApiKey;
                            }
                        });
                    }
                }
            );
        });



        function applyTemplate() {
            const template = promptTemplates.value.find(t => t.id.toString() === selectedTemplate.value);
            if (template) {
                prompt.value = template.content;
            }
        };

        function resetPrompt() {
            prompt.value = defaultPrompt.value;
            selectedTemplate.value = "";
            chrome.storage.sync.set({ "prompt": defaultPrompt });
        }



        function generate() {
            isLoading.value = true;
            chrome.storage.sync.set({ "isLoading": true });

            // Combine prompt and defectDescription
            const full_prompt = `${prompt.value || ''} *** ${defectDescription.value || ''} ***`;
            // Define whether to use GPT4
            const useGPT4 = false;
            console.log(full_prompt);

            const encoded = encode(full_prompt);
            console.log('Number of tokens: ', encoded.length);

            let data;
            let headers;
            //const max_tokens = 4096;

            if (source.value == 'openai') {
                console.log(apiKey.value);
                data = {
                    "model": model.value,
                    "messages": [
                        { "role": "system", "content": "You are a helpful assistant." },
                        { "role": "user", "content": full_prompt }
                    ],
                    //"max_tokens": max_tokens,
                    "temperature": temperature.value
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey.value}`
                };
                axios.post("https://api.openai.com/v1/chat/completions", data, { headers })
                    .then(response => {
                        const test_steps = response.data['choices'][0]['message']['content'].trim();
                        console.log(response);
                        chrome.storage.sync.set({ "testCase": test_steps });
                        chrome.storage.sync.set({ "isLoading": false });
                        testCase.value = test_steps;
                        isLoading.value = false;
                    })
                    .catch((error) => {
                        console.error("Error fetching test case:", error);
                    });
            } else if (source.value == 'azure') {
                console.log(apiKey.value);
                data = {
                    "messages": [
                        { "role": "system", "content": "You are a helpful assistant." },
                        { "role": "user", "content": full_prompt }
                    ],
                    //"max_tokens": max_tokens,
                    "temperature": temperature.value
                };
                headers = {
                    'Content-Type': 'application/json',
                    'api-key': apiKey.value
                };

                // check endpoint url format
                if (!endpoint.value.endsWith('/')) {
                    endpoint.value += '/';
                }

                // check model name format
                if (model.value == 'gpt-3.5-turbo') {
                    model.value = 'gpt-35-turbo'
                }

                const realEndpoint = `${endpoint.value}openai/deployments/${model.value}/chat/completions?api-version=2023-03-15-preview`;
                console.log(realEndpoint);
                axios.post(realEndpoint,
                    data, { headers })
                    .then(response => {
                        const test_steps = response.data['choices'][0]['message']['content'].trim();
                        console.log(response);
                        chrome.storage.sync.set({ "testCase": test_steps });
                        chrome.storage.sync.set({ "isLoading": false });
                        testCase.value = test_steps;
                        isLoading.value = false;
                    })
                    .catch((error) => {
                        console.error("Error fetching test case:", error);
                    });
            }

            // Set a timeout of 5 minutes (300000 milliseconds)
            const timeout = 300000;
            setTimeout(() => {
                // Timeout logic: enable the button again after 3 minutes
                isLoading.value = false;
            }, timeout);
        }


        function clearLocalStorage() {
            chrome.storage.sync.remove('defectDescription');
            chrome.storage.sync.remove('testCase');
            chrome.storage.sync.set({ "isLoading": false });
            defaultValue();
        }

        function defaultValue() {
            defectDescription.value = '';
            testCase.value = '';
            isLoading.value = false;
        }

        function extractTaskId(url: string): string | null {
            // Regular expression to match either pattern
            //const taskIdRegex = /\/(\d+)(?:\/[a-zA-Z])?(?:\/?)$/;
            let match = url.match(/child=(\d+)|\/(\d+)\/f|\/(\d+)$/);
            const taskId = match ? match[1] || match[2] || match[3] : null;

            return taskId
        }

        function get_ticket() {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                const url = activeTab.url;
                mainTicket.value = url || "";
                console.log(mainTicket.value);
                chrome.storage.sync.set({ "mainTicket": mainTicket.value });
                if (mainTicket.value.includes("asana")) {
                    const taskGid = extractTaskId(mainTicket.value);
                    console.log(taskGid);
                    const asanaApiKey = import.meta.env.VITE_ASANA_API_KEY;
                    axios.get(`https://app.asana.com/api/1.0/tasks/${taskGid}`, {
                        headers: {
                            'Authorization': `Bearer ${asanaApiKey}`,
                        },
                    })
                        .then(response => {
                            const task = response.data.data;
                            const permanentLink = task.permalink_url;
                            const taskDescription = task.notes;
                            mainTicket.value = permanentLink;
                            if (!defectDescription.value || defectDescription.value.trim() === '') {
                                defectDescription.value = taskDescription;
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            });
        }

        function openOptionsPage() {
            chrome.runtime.openOptionsPage();
            window.close(); // Close the popup after opening the options page
        }


        // update prompt value when value changes
        watch(prompt, (newValue) => {
            // Save the updated prompt value to sync storage
            chrome.storage.sync.set({ "prompt": newValue });
        });

        // update defectDescription value when value changes
        watch(defectDescription, (newValue) => {
            // Save the updated defectDescription value to sync storage
            chrome.storage.sync.set({ "defectDescription": newValue });
        });

        watch(defectDescription, (newValue) => {
            // Save the updated defectDescription value to sync storage
            chrome.storage.sync.set({ "defectDescription": newValue });
        });

        // update defectDescription value when value changes
        watch(testCase, (newValue) => {
            // Save the updated defectDescription value to sync storage
            chrome.storage.sync.set({ "testCase": newValue }, () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError)
                }
            }
            );
        });

        watch([prompt, defectDescription], ([newPrompt, newDefectDescription]) => {
            const fullPrompt = `${newPrompt || ''} *** ${newDefectDescription || ''} ***`;
            const encoded = encode(fullPrompt);
            tokenCount.value = encoded.length;
        });

        return {
            currentTab,
            changeTab,
            mainTicket,
            tokenCount,
            model,
            temperature,
            endpoint,
            source,
            prompt, defectDescription, testCase, resetPrompt, generate, get_ticket,
            clearLocalStorage, isLoading,
            promptTemplates,
            selectedTemplate,
            applyTemplate,
            openOptionsPage
        };
    },
});
</script>
<style scoped>
.textarea {
    width: 100%;
    white-space: pre-line;
    word-wrap: break-word;
}

.button-container {
    display: flex;
    justify-content: space-between;
}

.spinner {
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
    border-radius: 50%;
    border-style: solid;
    border-top-width: 2px;
    border-right-width: 2px;
    border-bottom-width: 2px;
    border-left-width: 4px;
    height: 20px;
    width: 20px;
}

.spinner-container {
    display: flex;
    align-items: center;
    /* center vertically */
    justify-content: center;
    /* center horizontally */
}

.button-select-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.item-container {
    flex-grow: 1;
    text-align: left;
}

.template-select {
    /* Add styling to the select element */
    padding: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-left: 10px;
    /* Add margin-left to create spacing between the Reset button and Select */
}

.reset-button {
    /* Add styling to the Reset button */
    padding: 4px 8px;
    margin: 0;
    /* Reset the default margin */
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.settings-button-container {
    position: absolute;
    top: 10px;
    right: 10px;
}

.settings-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
}

.settings-button i {
    color: #000000;
}

.settings-button:hover i {
    color: darkblue;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
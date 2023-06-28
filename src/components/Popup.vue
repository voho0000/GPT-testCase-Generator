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
                <div>
                    <p>Model: {{ model }}, Source: {{ source }}, temperature: {{ temperature }} </p>
                </div>
                <div class="button-select-container">
                    <div class="item-container">
                        <label>Prompt:</label>
                    </div>
                    <div class="button-container">
                        <button @click="resetPrompt" class="reset-button">Default</button>
                        <select v-model="selectedTemplate" @change="applyTemplate" class="template-select">
                            <option value="">Prompt</option>
                            <option v-for="template in promptTemplates" :key="template.id" :value="template.id.toString()">
                                {{ template.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div>
                    <textarea v-model="prompt" class="textarea" rows="3"></textarea>
                </div>
            </div>

            <!-- Defect Description Section -->
            <div>
                <div class="item-container">
                    <label>Defect Description:</label>
                </div>
                <div>
                    <textarea v-model="defectDescription" class="textarea" rows="4"></textarea>
                </div>
            </div>

            <!-- Token Count Section -->
            <div class="token-count">
                <!--make the Note next line-->
                <p>Token Count: {{ tokenCount }} (for reference only) <br>
                </p> <!-- Display the token count -->
            </div>

            <!-- Generated Test Case Section -->
            <div>
                <div class="item-container">
                    <label>Generated Test Case:</label>
                </div>
                <div>
                    <textarea v-model="generatedText" class="textarea" rows="11"></textarea>
                </div>
            </div>

            <!-- Loading Spinner Section -->
            <div v-if="isLoading" class="spinner-container">
                <div class="spinner"></div>
                <p>Generating test case...</p>
            </div>
            <div v-else></div> <!-- Properly closed div for v-else -->

            <!-- Sticky Buttons Section -->
            <div class="sticky-buttons">
                <div class="button-container">
                    <button type="button" @click="clearLocalStorage">Clear</button>
                    <button @click="get_ticket">Get a Asana task</button>
                    <button @click="openInNewTab">Open in New Tab</button>
                    <button @click="generate" :disabled="isLoading">Generate</button>
                </div>
            </div>
        </div>

        <!-- Form Section -->
        <Form v-else-if="currentTab === 'PopupTaskForm'" :testCase="generatedText" :main_ticket="mainTicket" />

        <!-- Prompt Section -->
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
            // Change the current tab
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
        const generatedText = ref<string>("");
        const mainTicket = ref<string>("");
        const selectedTemplate = ref<string>("");
        const promptTemplates = ref<Template[]>([]);

        const tokenCount = ref<number>(0);

        const model = ref<string>('gpt-3.5-turbo');
        const temperature = ref<number>(0.5);
        const endpoint = ref<string>('');
        const source = ref<string>('openai');
        const apiKey = ref<string>('');

        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            // get the message from background script and update the testcase
            if (message.action === 'updateTestCase') {
                // Update the testCase value based on the received message
                generatedText.value = message.testCase;
                isLoading.value = false;
            }
        });

        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            // get the message from background script and update the defect description
            if (message.action === 'updateDefect') {
                // Update the testCase value based on the received message
                defectDescription.value = message.defectDescription;
            }
        });

        onMounted(() => {
            // Get the stored values from the chrome storage
            chrome.storage.sync.get(
                {
                    isLoading: false,
                    prompt: '',
                    defectDescription: '',
                    generatedText: '',
                    templates: null,
                    model: 'gpt-3.5-turbo',
                    temperature: 0.5,
                    endpoint: '',
                    source: 'openai',
                    defaultPrompt: '我是一位測試工程師，請用繁體中文回答問題，利用以下缺陷描述來產出之後在進行手動測試時能涵蓋到此缺陷測試的測試案例，需去除使用者的可識別資訊，預期結果為正常結果，若有附上PRD，還需要增加能涵蓋PRD的使用情境的測試案例，若無附上則不用，產生的測試案例需要包含名稱, 前置條件, 測試步驟, 預期結果',
                },
                (data) => {
                    isLoading.value = data.isLoading;
                    prompt.value = data.prompt;
                    defectDescription.value = data.defectDescription;
                    generatedText.value = data.generatedText;
                    promptTemplates.value = data.templates ? Object.values(data.templates) : [];
                    model.value = data.model;
                    temperature.value = Number(data.temperature);
                    endpoint.value = data.endpoint;
                    source.value = data.source;
                    defaultPrompt.value = data.defaultPrompt;
                    if (source.value == 'openai') {
                        // Get the stored OpenAI API key
                        chrome.storage.sync.get(["openaiApiKey"], (data) => {
                            if (data.openaiApiKey) {
                                apiKey.value = data.openaiApiKey;
                            }
                        });
                    } else if (source.value == 'azure') {
                        // Get the stored Azure API key
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
            // Apply the selected template to the prompt
            const template = promptTemplates.value.find(t => t.id.toString() === selectedTemplate.value);
            if (template) {
                prompt.value = template.content;
            }
        };

        function resetPrompt() {
            // Reset the prompt to the default prompt
            prompt.value = defaultPrompt.value;
            selectedTemplate.value = "";
            chrome.storage.sync.set({ "prompt": defaultPrompt });
        }


        function generate() {
            // trigger generate test case event
            isLoading.value = true;
            // Send a message to the background script to generate the test case
            chrome.runtime.sendMessage({
                action: 'generate',
            });
            // *** TODO: error handling
            // Set a timeout of 5 minutes (300000 milliseconds)
            const timeout = 300000;
            setTimeout(() => {
                // Timeout logic: enable the button again after 3 minutes
                isLoading.value = false;
                chrome.storage.sync.set({ "isLoading": false });
            }, timeout);
        }


        function clearLocalStorage() {
            // Clear the local storage
            chrome.storage.sync.remove('defectDescription');
            chrome.storage.sync.remove('generatedText');
            chrome.storage.sync.set({ "isLoading": false });
            defaultValue();
        }

        function defaultValue() {
            // Set the default values for the variables
            defectDescription.value = '';
            generatedText.value = '';
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
            // Get the asana ticket from the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                const url = activeTab.url;
                mainTicket.value = url || "";
                if (mainTicket.value.includes("asana")) {
                    // Extract the task id from the url
                    const taskGid = extractTaskId(mainTicket.value);
                    // Get the asana API key from the chrome storage
                    chrome.storage.sync.get(['asanaApiKey'], (data) => {
                        const asanaApiKey = data.asanaApiKey;
                        // Get the task details from the asana API
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
                                chrome.storage.sync.set({ "mainTicket": permanentLink });
                                defectDescription.value = taskDescription;
                            })
                            .catch(error => {
                                console.log(error);
                            });
                    })
                }
            });
        }

        function openOptionsPage() {
            // open the options page
            chrome.runtime.openOptionsPage();
            window.close(); // Close the popup after opening the options page
        }

        function openInNewTab() {
            // open the popup page in a new tab
            chrome.tabs.create({ url: 'popupPage.html' });
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
        watch(generatedText, (newValue) => {
            // Save the updated defectDescription value to sync storage
            chrome.storage.sync.set({ "generatedText": newValue }, () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError)
                }
            }
            );
        });

        // for token count use
        watch([prompt, defectDescription], ([newPrompt, newDefectDescription]) => {
            const fullPrompt = `${newPrompt || ''}\n${newDefectDescription || ''}`;
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
            prompt, defectDescription, generatedText, testCase,
            resetPrompt, generate, get_ticket,
            clearLocalStorage, isLoading,
            promptTemplates,
            selectedTemplate,
            applyTemplate,
            openOptionsPage,
            openInNewTab
        };
    },
});
</script>
<style scoped>
#app {
    width: 100%;
    max-width: 800px;
    /* Set the maximum width to 600px */
    margin: 0 auto;
    /* Center the content */
}

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

.sticky-buttons {
    position: sticky;
    bottom: 0;
    background-color: white;
    padding: 10px;
    border-top: 1px solid #ccc;
    z-index: 1;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
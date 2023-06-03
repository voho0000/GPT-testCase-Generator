<template>
    <div id="app">
        <h1>GPT Test Case Generator</h1>
        <Navigation :current-tab="currentTab" @change-tab="changeTab" />
        <div v-if="currentTab === 'Popup'">
            <div>
                <div class="button-select-container">
                    <div class="item-container">
                        <label>Prompt:</label>
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
                    <label >Defect Description:</label>
                </div>
                <div>
                    <textarea v-model="defectDescription" class="textarea" rows="8"></textarea>
                </div>
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


        const defaultPrompt = "我是一位測試工程師，請用繁體中文回答問題，利用以下缺陷描述來產出之後在進行手動測試時能涵蓋到此缺陷測試的測試案例，需去除使用者的可識別資訊，預期結果為正常結果，若有附上PRD，還需要增加能涵蓋PRD的使用情境的測試案例，若無附上則不用，產生的測試案例需要包含Name, Pre-Condition, Test Step, Expected Result ";
        const prompt = ref(defaultPrompt);
        const defectDescription = ref('');
        const testCase = ref("");
        const mainTicket = ref("");
        const selectedTemplate = ref<string>("");
        const promptTemplates = ref<Template[]>([]);



        onMounted(() => {
            // Read isLoading from localStorage and update the value of isLoading
            chrome.storage.sync.get(["isLoading"], (data) => {
                isLoading.value = data.isLoading || false;
            });

            chrome.storage.sync.get("prompt", (data) => {
                if (data.prompt) {
                    prompt.value = data.prompt;
                } else {
                    prompt.value = ''
                }
            });

            chrome.storage.sync.get("defectDescription", (data) => {
                if (data.defectDescription) {
                    defectDescription.value = data.defectDescription;
                } else {
                    defectDescription.value = ''
                }
            });

            chrome.storage.sync.get("testCase", (data) => {
                if (data.testCase) {
                    testCase.value = data.testCase;
                } else {
                    testCase.value = ''
                }
            });

            chrome.storage.sync.get(["templates"], (data) => {
                if (data.templates) {
                    promptTemplates.value = Object.values(data.templates);
                }
            });

        });

        function applyTemplate() {
            const template = promptTemplates.value.find(t => t.id.toString() === selectedTemplate.value);
            if (template) {
                prompt.value = template.content;
            }
        };

        function resetPrompt() {
            prompt.value = defaultPrompt;
            selectedTemplate.value = "";
            chrome.storage.sync.set({ "prompt": defaultPrompt });
        }



        function generate() {
            isLoading.value = true;
            chrome.storage.sync.set({ "isLoading": true });

            // Combine prompt and defectDescription
            const full_prompt = `${prompt.value || ''} *** ${defectDescription.value || ''} ***`;
            // Define whether to use GPT4
            const useGPT4 = true;

            let data;
            let headers;
            let apiKey;
            const max_tokens = 2000;
            console.log(max_tokens);
            const temperature = 0.5;

            if (useGPT4) {
                apiKey = import.meta.env.VITE_AZURE_API_KEY;
                data = {
                    "messages": [
                        { "role": "system", "content": "You are a helpful assistant." },
                        { "role": "user", "content": full_prompt }
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature
                };
                headers = {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                };
                axios.post("https://user1-create-gpt.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-03-15-preview",
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
            } else {
                apiKey = import.meta.env.VITE_OPENAI_API_KEY;
                data = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        { "role": "system", "content": "You are a helpful assistant." },
                        { "role": "user", "content": full_prompt }
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                axios.post("https://api.openai.com/v1/chat/completions", data, { headers })
                    .then(response => {
                        const test_steps = response.data['choices'][0]['message']['content'].trim();
                        console.log(response);
                        chrome.storage.sync.set({ "testCase": test_steps });
                        chrome.storage.sync.set({ "isLoading": false });
                        testCase.value = test_steps;
                        isLoading.value = false;
                        console.log(isLoading.value);
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
            chrome.storage.sync.remove('prompt');
            chrome.storage.sync.remove('defectDescription');
            chrome.storage.sync.remove('testCase');
            chrome.storage.sync.set({ "isLoading": false });
            defaultValue();
        }

        function defaultValue() {
            prompt.value = '';
            defectDescription.value = '';
            testCase.value = '';
            isLoading.value = false;
        }

        function extractTaskId(url: string): string | null {
            // Regular expression to match either pattern
            //const taskIdRegex = /\/(\d+)(?:\/[a-zA-Z])?(?:\/?)$/;
            let match = url.match(/child=(\d+)|\/(\d+)\/f|\/(\d+)$/);
            const taskId  = match ? match[1] || match[2] || match[3] : null;

            return taskId
        }

        function get_ticket() {
            console.log("get ticket hit!")
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

        return {
            currentTab,
            changeTab,
            mainTicket,
            prompt, defectDescription, testCase, resetPrompt, generate, get_ticket,
            clearLocalStorage, isLoading,
            promptTemplates,
            selectedTemplate,
            applyTemplate,
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
  margin-left: 10px; /* Add margin-left to create spacing between the Reset button and Select */
}

.reset-button {
  /* Add styling to the Reset button */
  padding: 4px 8px;
  margin: 0; /* Reset the default margin */
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
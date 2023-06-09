<template>
    <div id="app">
        <h1>GPT Test Case Generator</h1>
        <Navigation :current-tab="currentTab" @change-tab="changeTab" />
        <div v-if="currentTab === 'Popup'">
            <div>
                <div>
                    <label>Prompt:</label>
                    <button @click="resetPrompt">Reset</button>
                </div>
                <div>
                    <textarea v-model="prompt" class="textarea" rows="5"></textarea>
                </div>
            </div>
            <div>
                <div>
                    <label>Defect Description:</label>
                </div>
                <div>
                    <textarea v-model="defectDescription" class="textarea" rows="8"></textarea>
                </div>
            </div>
            <div>
                <div>
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
        <Form v-else :testCase="testCase" :main_ticket="mainTicket" />
    </div>
</template>
  
<script lang="ts">

/// <reference types="chrome" />

import Navigation from "./Navigation.vue";
import Form from "./Form.vue";
import { defineComponent, ref, onMounted, watch } from "vue";
import axios from 'axios';


export default defineComponent({
    components: {
        Navigation,
        Form,
    },
    setup() {
        const isLoading = ref(false);

        const currentTab = ref<string>("Popup");

        function changeTab(newTab: string) {
            currentTab.value = newTab;
        }


        const defaultPrompt = "我是一位測試工程師，請用繁體中文回答問題，利用以下缺陷描述來產出之後在進行手動測試時能涵蓋到此缺陷測試的測試案例，需去除使用者的可識別資訊，預期結果為正常結果，產生的測試案例需要包含Name, Pre-Condition, Test Step, Expected Result ";
        const prompt = ref(defaultPrompt);
        const defectDescription = ref('');
        const testCase = ref("");
        const mainTicket = ref("");


        function updateTestCase(testCaseData: string) {
            testCase.value = testCaseData;
        }

        onMounted(() => {
            chrome.runtime.onMessage.addListener((request: { action: string; testCase: string }, sender: any, sendResponse: any) => {
                if (request.action === "testCaseGenerated") {
                    updateTestCase(request.testCase!);
                    // Set isLoading to false and save it in localStorage
                    isLoading.value = false;
                }
            });

            // Read isLoading from localStorage and update the value of isLoading
            chrome.storage.local.get(["isLoading"], (data) => {
                isLoading.value = data.isLoading || false;
            });

            chrome.storage.local.get("prompt", (data) => {
                if (data.prompt) {
                    prompt.value = data.prompt;
                } else {
                    prompt.value = ''
                }
            });

            chrome.storage.local.get("defectDescription", (data) => {
                if (data.defectDescription) {
                    defectDescription.value = data.defectDescription;
                } else {
                    defectDescription.value = ''
                }
            });

            chrome.storage.local.get("testCase", (data) => {
                if (data.testCase) {
                    testCase.value = data.testCase;
                } else {
                    testCase.value = ''
                }
            });
        });

        function resetPrompt() {
            prompt.value = defaultPrompt;
            chrome.storage.local.set({ "prompt": defaultPrompt });
        }

        function generate() {
            // Send a message to the content script with the prompt and defect description
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id!, {
                    action: "generateTestCase",
                    prompt: prompt.value,
                    defectDescription: defectDescription.value,
                });
                isLoading.value = true;
                chrome.storage.local.set({ "isLoading": true });
            });
        }

        function clearLocalStorage() {
            chrome.storage.local.remove('prompt');
            chrome.storage.local.remove('defectDescription');
            chrome.storage.local.remove('testCase');
            chrome.storage.local.set({ "isLoading": false });
            defaultValue();
            isLoading.value = false;
        }

        function defaultValue() {
            prompt.value = '';
            defectDescription.value = '';
            testCase.value = '';
        }

        function extractTaskId(url: string): string | null {
            // Regular expression to match either pattern
            const taskIdRegex = /(?:child=|\/0\/\d+\/)(\d+)/;
            const match = url.match(taskIdRegex);

            if (match && match[1]) {
                return match[1];
            } else {
                return null;
            }
        }


        function get_ticket() {
            console.log("get ticket hit!")
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                const url = activeTab.url;
                mainTicket.value = url || "";
                chrome.storage.local.set({ "mainTicket": mainTicket.value });
                if (mainTicket.value.includes("asana")) {
                    const taskGid = extractTaskId(mainTicket.value);
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
            // Save the updated prompt value to local storage
            chrome.storage.local.set({ "prompt": newValue });
        });

        // update defectDescription value when value changes
        watch(defectDescription, (newValue) => {
            // Save the updated defectDescription value to local storage
            chrome.storage.local.set({ "defectDescription": newValue });
        });

        // update defectDescription value when value changes
        watch(testCase, (newValue) => {
            // Save the updated defectDescription value to local storage
            chrome.storage.local.set({ "testCase": newValue }, () => {
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
            clearLocalStorage, isLoading
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


@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
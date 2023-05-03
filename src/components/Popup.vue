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
                    <textarea v-model="prompt" class="textarea" rows="4"></textarea>
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
            <div class="button-container">
                <button @click="get_ticket">Get a Asana ticket</button>
                <button @click="generate" class="generate-button">Generate</button>
            </div>
        </div>
        <Form v-else :testCase="testCase" :main_ticket="mainTicket"/>
    </div>
</template>
  
<script lang="ts">

/// <reference types="chrome" />

import Navigation from "./Navigation.vue";
import Form from "./Form.vue";
import { defineComponent, ref, onMounted, watch } from "vue";

export default defineComponent({
    components: {
        Navigation,
        Form,
    },
    setup() {
        const currentTab = ref<string>("Popup");

        function changeTab(newTab: string) {
            currentTab.value = newTab;
        }


        const defaultPrompt = "我是一位測試工程師，請用繁體中文回答問題，利用以下缺陷描述產出對應的測試案例，需要包含Name, Pre-Condition, Test Step, Expected Result ";
        const prompt = ref("我是一位測試工程師，請用繁體中文回答問題，利用以下缺陷描述產出對應的測試案例，需要包含Name, Pre-Condition, Test Step, Expected Result ");
        const defectDescription = ref('');
        const testCase = ref("");
        const mainTicket = ref("");


        function updateTestCase(testCaseData: string) {
            testCase.value = testCaseData;
        }

        onMounted(() => {
            chrome.runtime.onMessage.addListener((request: { action: string; testCase: string }, sender: any, sendResponse: any) => {
                if (request.action === "testCaseGenerated") {
                    updateTestCase(request.testCase);
                }
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
            });
        }

        function get_ticket() {
            console.log("get ticket hit!")
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                const url = activeTab.url;
                mainTicket.value = url||"";
                console.log(mainTicket.value)
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
            prompt, defectDescription, testCase, resetPrompt, generate, get_ticket
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
</style>
<template>
    <div id="task-form">
        <div v-if="testCases.length > 1">
            <button v-for="(test, index) in testCases" :key="index" @click="selectTestCase(index)"
                :class="{ 'active-button': index === selectedTestCase, 'test-case-button': true }">
                Test Case {{ index + 1 }}
            </button>
        </div>
        <form @submit.prevent="createTask">
            <div class="form-field">
                <div>
                    <label for="name">Name:<span class="required-star">*</span></label>
                </div>
                <div>
                    <textarea id="name" v-model="name" required></textarea>
                </div>
            </div>
            <div class="form-field">
                <label for="case-suite">Case Suite:<span class="required-star">*</span></label>
                <Multiselect v-model="caseSuite" required mode="tags" placeholder="Select options" :searchable="true"
                    :close-on-select="false" :options="caseSuiteOptions" />

            </div>
            <div class="form-field">
                <label for="manual-test-coverage">Manual Test Coverage: <span class="required-star">*</span></label>
                <select id="manual-test-coverage" v-model="manualTestCoverage" required>
                    <option disabled value="">Please select one</option>
                    <option v-for="option in manualTestCoverageOptions" :key="option" :value="option">{{ option }}
                    </option>
                </select>
            </div>
            <div class="form-field">
                <div>
                    <label for="pre-condition">Pre-Condition:</label>
                </div>
                <div>
                    <textarea id="pre-condition" v-model="preCondition" rows="3"></textarea>
                </div>
            </div>
            <div class="form-field">
                <div>
                    <label for="test-step">Test Step:<span class="required-star">*</span></label>
                </div>
                <div>
                    <textarea id="test-step" v-model="testStep" rows="7" required></textarea>
                </div>
            </div>
            <div class="form-field">
                <div>
                    <label for="expected-result">Expected Result:<span class="required-star">*</span></label>
                </div>
                <div>
                    <textarea id="expected-result" v-model="expectedResult" rows="7" required></textarea>
                </div>
            </div>
            <div class="form-field">
                <label for="manual-test-environment">Manual Test Environment:</label>
                <select id="manual-test-environment" v-model="manualTestEnvironment">
                    <option disabled value="">Please select one</option>
                    <option v-for="option in manualTestEnvironmentOptions" :key="option" :value="option">{{ option }}
                    </option>
                </select>
            </div>
            <div class="form-field">
                <label for="case-source">Case Source:</label>
                <select id="case-source" v-model="caseSource">
                    <option disabled value="">Please select one</option>
                    <option v-for="option in caseSourceOptions" :key="option" :value="option">{{ option }}</option>
                </select>
            </div>
            <div class="form-field">
                <label for="main-ticket">Main Ticket: </label>
                <input id="main-ticket" type="url" v-model="mainTicket" placeholder="asana defect task url" />
            </div>
            <div class="form-field">
                <label for="generated-by">Generated By:</label>
                <select id="generated-by" v-model="generatedBy">
                    <option disabled value="">Please select one</option>
                    <option v-for="option in generatedByOptions" :key="option" :value="option">{{ option }}</option>
                </select>
            </div>
            <div v-if="isCreateLoading" class="spinner-container">
                <div class="spinner"></div>
                <p>Creating asana ticket...</p>
            </div>
            <div v-else></div> <!-- Properly closed div for v-else -->
            <div class="button-container">
                <button type="button" @click="clearLocalStorage">Clear</button>
                <button type="submit" :disabled="isCreateLoading">Create</button>
            </div>
            <div>
                <label for="taskUrl">Created Task URL:</label>
                <a :href="taskUrl" target="_blank" v-if="taskUrl">link</a>
            </div>
        </form>
    </div>
</template>
  
<script lang="ts">
/// <reference types="chrome" />


import { defineComponent, ref, watch, onMounted } from 'vue';
import Multiselect from '@vueform/multiselect'
import axios from 'axios';
import Navigation from "./Navigation.vue";
import { caseSuiteOptions, manualTestCoverageOptions, manualTestEnvironmentOptions, caseSourceOptions, generatedByOptions } from './options';



export default defineComponent({
    components: {
        Multiselect,
        Navigation,
    },
    props: {
        testCase: {
            type: String,
            default: '',
        },
        main_ticket: {
            type: String,
            default: '',
        },
        currentTab: String,
    },
    setup(props) {
        const isCreateLoading = ref(false);

        const caseSuite = ref([]);
        const manualTestCoverage = ref('Partial');
        const name = ref('');
        const preCondition = ref('');
        const testStep = ref('');
        const expectedResult = ref('');
        const manualTestEnvironment = ref('STAGE');
        const caseSource = ref('Defect');
        const mainTicket = ref(props.main_ticket);
        const generatedBy = ref('gpt-3.5-turbo');


        const taskUrl = ref<string | null>('');

        interface TestCase {
            name: string;
            preCondition: string;
            testStep: string;
            expectedResult: string;
        }

        const selectedTestCase = ref<number>(0);
        const testCases = ref<TestCase[]>([]);

        const inputText = props.testCase;


        onMounted(() => {
            chrome.storage.local.get("taskUrl", (data) => {
                if (data.taskUrl) {
                    taskUrl.value = data.taskUrl;
                } else {
                    taskUrl.value = ''
                }
            });

            // load saved form data from chrome.storage.local on component mount
            chrome.storage.local.get(["formData"], (result) => {
                if (result.formData) {
                    console.log("I am using formData");
                    //const formData = result.formData || {};
                    const formData = JSON.parse(result.formData) || {};
                    name.value = formData.name;
                    caseSuite.value = Array.isArray(formData.caseSuite) ? formData.caseSuite : [];
                    manualTestCoverage.value = formData.manualTestCoverage;
                    preCondition.value = formData.preCondition;
                    testStep.value = formData.testStep;
                    expectedResult.value = formData.expectedResult;
                    manualTestEnvironment.value = formData.manualTestEnvironment;
                    caseSource.value = formData.caseSource;
                    mainTicket.value = formData.mainTicket || props.main_ticket;
                    generatedBy.value = formData.generatedBy;
                    getTestCase();
                    if (preCondition.value == '') {
                        // if no formData, extract test case to fill the test case related fields
                        selectTestCase(0);
                    }
                } else {

                }

            });

        });

        function getTestCase() {
            if (inputText.includes("Name:") || inputText.includes("Name：")) {
                const splitText = inputText.split(/(?:Name[:：])/).slice(1);
                if (splitText.length > 0) {
                    testCases.value = splitText.map(testCaseText => {
                        const preConditionSplit = testCaseText.split(/(?:Pre-Condition[:：])/);
                        const testStepSplit = preConditionSplit[1].split(/(?:Test Step[:：])/);
                        const expectedResultSplit = testStepSplit[1].split(/(?:Expected Result[:：])/);

                        return {
                            name: preConditionSplit[0].trim(),
                            preCondition: testStepSplit[0].trim(),
                            testStep: expectedResultSplit[0].trim(),
                            expectedResult: expectedResultSplit[1].split(/(?:測試案例\d+[:：])/)[0].trim()
                        };
                    });
                } else {
                    // Handle the case when there's no match found
                }
            }
        }

        function selectTestCase(index: number) {
            selectedTestCase.value = index;
            const testCase = testCases.value[index];
            if (testCase) {
                name.value = testCase.name;
                preCondition.value = testCase.preCondition;
                testStep.value = testCase.testStep;
                expectedResult.value = testCase.expectedResult;
            }

        }


        function createTask() {
            // Implement the logic for creating a task using the form data
            chrome.storage.local.get("formData", (data) => {
                if (data.formData) {
                    const formDataString = data.formData;
                    console.log(formDataString);
                    if (formDataString) {
                        const formData = JSON.parse(formDataString);
                        console.log(formData);
                        isCreateLoading.value = true;
                        axios.post('http://127.0.0.1:5000/create_task', formData)
                            .then(response => {
                                // Handle response from server
                                console.log(response.data);
                                if (response.data.task_url) {
                                    taskUrl.value = response.data.task_url;
                                    chrome.storage.local.set({ taskUrl: taskUrl.value });
                                    isCreateLoading.value = false;
                                } else {
                                    console.log('no created task url')
                                };
                            })
                            .catch(error => {
                                // Handle error
                                console.log(error);
                            });
                    } else {
                        console.error("No formData found in localStorage");
                    };
                }
            });

        }
        function clearLocalStorage() {
            chrome.storage.local.remove('taskUrl')
            chrome.storage.local.remove('formData')
            taskUrl.value = null;
            defaultValue();
        }

        function defaultValue() {
            name.value = '';
            caseSuite.value = [];
            manualTestCoverage.value = 'Partial';
            preCondition.value = '';
            testStep.value = '';
            expectedResult.value = '';
            manualTestEnvironment.value = 'STAGE';
            caseSource.value = 'Defect';
            mainTicket.value = '';
            generatedBy.value = 'gpt-3.5-turbo';
        }

        // Watch for changes to reactive properties and update formData real time
        watch([name, caseSuite, manualTestCoverage, preCondition, testStep, expectedResult, manualTestEnvironment, caseSource, mainTicket, generatedBy], () => {
            const updatedFormData = {
                name: name.value,
                caseSuite: caseSuite.value,
                manualTestCoverage: manualTestCoverage.value,
                preCondition: preCondition.value,
                testStep: testStep.value,
                expectedResult: expectedResult.value,
                manualTestEnvironment: manualTestEnvironment.value,
                caseSource: caseSource.value,
                mainTicket: mainTicket.value,
                generatedBy: generatedBy.value,
            };
            chrome.storage.local.set({ formData: JSON.stringify(updatedFormData) });
            console.log('new data set');
        });

        // Watch the taskUrl property for changes and update localStorage
        watch(taskUrl, (newValue) => {
            chrome.storage.local.set({ taskUrl: newValue || '' });
        });

        return {
            name,
            caseSuite,
            manualTestCoverage,
            preCondition,
            expectedResult,
            testStep,
            manualTestEnvironment,
            caseSource,
            mainTicket,
            generatedBy,
            caseSuiteOptions,
            manualTestCoverageOptions,
            manualTestEnvironmentOptions,
            caseSourceOptions,
            generatedByOptions,
            createTask,
            taskUrl,
            clearLocalStorage,
            selectedTestCase,
            testCases,
            selectTestCase,
            isCreateLoading
        };
    }
})

</script>
<style scoped>
textarea {
    width: 100%;
    white-space: pre-line;
    word-wrap: break-word;
}

input {
    width: 100%;
}

.form-field {
    padding-bottom: 10px;
}

.button-container {
    display: flex;
    justify-content: space-between;
}

.required-star {
    color: red;
    margin-left: 2px;
}

.active-button {
    /* Set your desired color for the active button */
    background-color: #007bff;
    /* Change this to your desired color */
    color: white;
    /* Change this to your desired text color */
}

.test-case-button {
    margin-top: 10px;
    /* Change this value as per your needs */
}
</style>
<style src="@vueform/multiselect/themes/default.css"></style>

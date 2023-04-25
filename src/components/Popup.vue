<template>
    <div>
        <h1>GPT Test Case Generator</h1>
        <div>
            <div>
                <label>Prompt:</label>
            </div>
            <div>
                <textarea v-model="prompt" class="textarea" rows="3"></textarea>
            </div>
        </div>
        <div>
            <div>
                <label>Defect Description:</label>
            </div>
            <div>
                <textarea v-model="defectDescription" class="textarea" rows="5"></textarea>
            </div>
        </div>
        <div>
            <div>
                <label>Generated Test Case:</label>
            </div>
            <div>
                <textarea v-model="generatedTestCase" class="textarea" rows="10"></textarea>
            </div>
        </div>
        <div class="button-container">
            <button @click="save">Save</button>
            <button @click="generate" class="generate-button">Generate</button>
        </div>
    </div>
</template>
  
<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
    setup() {
        const prompt = ref("Default prompt text");
        const defectDescription = ref("");
        const generatedTestCase = ref("");

        function generate() {
            // Handle generation of test case
        }

        function save() {
            // Handle saving of JSON file
        }

        return { prompt, defectDescription, generatedTestCase, generate, save };
    },
});
</script>
<style scoped>
.textarea {
    width: 100%;
}

.button-container {
    display: flex;
    justify-content: space-between;
}
</style>
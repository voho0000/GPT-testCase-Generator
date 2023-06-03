<template>
    <div class="prompt-container">
        <h2>Prompt Manager</h2>
        <div class="template-container" v-for="template in templates" :key="template.id">
            <div v-if="template.isEditing" class="template-content">
                <label>
                    Template Name
                    <input type="text" v-model="template.name" placeholder="Template Name" @change="saveTemplates"
                        class="input-field" />
                </label>
                <label>
                    Template Content
                    <textarea v-model="template.content" placeholder="Template Content" @change="saveTemplates"
                        class="text-area"></textarea>
                </label>
                <p v-if="hasDuplicateName(template)" class="error-message">Template name must be unique.</p>
            </div>
            <div v-else class="template-content">
                <p class="template-name">{{ template.name }}</p>
            </div>
            <div class="template-actions">
                <button @click="toggleEdit(template)" class="edit-button" :disabled="isSaveDisabled">{{
                    template.isEditing ? 'Save' : 'Edit'
                }}</button>
                <button @click="deleteTemplate(template.id)" class="delete-button">Delete</button>
            </div>
        </div>
        <button @click="addTemplate" class="add-button">Add New Template</button>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';

interface Template {
    id: number;
    name: string;
    content: string;
    isEditing: boolean; // Add the isEditing property
}

export default defineComponent({
    setup() {
        let templates = ref<Array<Template>>([]);

        onMounted(async () => {
            // Load templates from sync storage
            await new Promise<void>((resolve, reject) => {
                chrome.storage.sync.get(["templates"], (data) => {
                    if (data.templates) {
                        // Convert the data object into an array
                        templates.value = Object.values(data.templates) as Template[];
                    } else {
                        templates.value = [];  // Ensure templates.value is always an array
                    }
                    resolve();
                });
            });
        });


        const saveTemplates = async () => {
            // Save templates to sync storage
            await new Promise<void>((resolve) => {
                chrome.storage.sync.set({ "templates": templates.value }, resolve);
            });
        };

        const addTemplate = async () => {
            const newId = templates.value.length > 0 ? Math.max(...templates.value.map(t => t.id)) + 1 : 1;
            templates.value.push({ id: newId, name: "", content: "", isEditing: true });
            await saveTemplates();
        };

        const deleteTemplate = async (id: number) => {
            templates.value = templates.value.filter(t => t.id !== id);
            await saveTemplates();
        };

        const toggleEdit = (template: Template) => {
            template.isEditing = !template.isEditing;
            if (!template.isEditing) {
                template.name = template.name.substring(0, 15);
                saveTemplates(); // save the changes if the user finishes editing
            }
        };

        const hasDuplicateName = (template: Template) => {
            const duplicateTemplates = templates.value.filter(t => t.name === template.name && t.id !== template.id);
            return duplicateTemplates.length > 0;
        };

        const isSaveDisabled = computed(() => {
            const editingTemplate = templates.value.find(t => t.isEditing);
            return editingTemplate && hasDuplicateName(editingTemplate);
        });

        return { templates, addTemplate, deleteTemplate, saveTemplates, toggleEdit, hasDuplicateName, isSaveDisabled };
    },
});
</script>

<style scoped>
.prompt-container {
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
}

.template-container {
    margin-bottom: 1rem;
}

.input-field {
    display: block;
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    box-sizing: border-box;
}

.text-area {
    display: block;
    width: 100%;
    height: 100px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    box-sizing: border-box;
}

.delete-button {
    display: block;
    padding: 0.5rem 1rem;
    background-color: #ff4d4f;
    color: #fff;
    border: none;
    cursor: pointer;
    text-align: center;
}

.add-button {
    display: block;
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: #fff;
    border: none;
    cursor: pointer;
    text-align: center;
}

.template-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.template-content {
    flex-grow: 1;
}

.template-actions {
    display: flex;
    gap: 1rem;
}

.template-name {
    margin: 0;
    padding: 0.5rem;
    font-weight: bold;
}

.disabled {
    opacity: 0.5;
    pointer-events: none;
}

.error-message {
    color: red;
    font-size: 0.8rem;
    margin-top: 0.5rem;
}
</style>
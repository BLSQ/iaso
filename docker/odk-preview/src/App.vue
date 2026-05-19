<template>
    <div v-if="loading" class="loading">Loading form...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <OdkPreview
        v-else-if="formXml"
        :form-xml="formXml"
        :submit-disabled-message="submitDisabledMessage"
        :on-submit="handleSubmit"
    />
    <div v-else class="loading">Waiting for form data...</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import OdkPreview from './OdkPreview.vue';
import './previewStyles.css';

const formXml = ref(null);
const loading = ref(false);
const error = ref(null);
const submitDisabledMessage = ref(
    'Form submission from the preview is not available yet. This feature is under development.',
);

const handleSubmit = data => {
    window.parent.postMessage({ type: 'odk-submit', data }, '*');
};

const loadFormFromUrl = async url => {
    loading.value = true;
    error.value = null;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch form: ${response.status}`);
        }
        formXml.value = await response.text();
    } catch (e) {
        error.value = `Failed to load form: ${e.message}`;
    } finally {
        loading.value = false;
    }
};

const loadFormFromXml = (xml, tooltipMessage) => {
    if (tooltipMessage) {
        submitDisabledMessage.value = tooltipMessage;
    }
    formXml.value = xml;
    loading.value = false;
    error.value = null;
};

const handleMessage = event => {
    if (event.data?.type === 'load-form-url') {
        loadFormFromUrl(event.data.url);
    } else if (event.data?.type === 'load-form-xml') {
        loadFormFromXml(event.data.xml, event.data.submitDisabledMessage);
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    const url = new URLSearchParams(window.location.search).get('url');
    if (url) {
        loadFormFromUrl(url);
    }
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

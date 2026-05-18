<template>
    <div v-if="loading" class="loading">Loading form...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <OdkWebForm
        v-else-if="formXml"
        :form-xml="formXml"
        :fetch-form-attachment="fetchAttachment"
        @submit="handleSubmit"
    />
    <div v-else class="loading">Waiting for form data...</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { OdkWebForm } from '@getodk/web-forms';

const formXml = ref(null);
const loading = ref(false);
const error = ref(null);
const submitTooltip = ref(
    'Form submission from the preview is not available yet. This feature is under development.',
);

const setSubmitTooltip = message => {
    submitTooltip.value = message;
    document.documentElement.style.setProperty(
        '--preview-submit-tooltip',
        `"${message.replace(/"/g, '\\"')}"`,
    );
};

const fetchAttachment = async url => {
    const response = await fetch(url);
    return new Blob([await response.arrayBuffer()]);
};

const handleSubmit = data => {
    // Send submission data back to parent via postMessage
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
        setSubmitTooltip(tooltipMessage);
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
    setSubmitTooltip(submitTooltip.value);
    window.addEventListener('message', handleMessage);

    // Check URL params for initial form load
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    if (url) {
        loadFormFromUrl(url);
    }
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<style>
/* Always disabled; tooltip on hover (message via --preview-submit-tooltip from FormPreview) */
.odk-form .form-wrapper .footer {
    position: relative;
    cursor: not-allowed;
}

.odk-form .form-wrapper .footer button {
    opacity: 0.45;
    pointer-events: none;
}

.odk-form .form-wrapper .footer:hover::after {
    content: var(--preview-submit-tooltip);
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    z-index: 1000;
    max-width: 280px;
    padding: 6px 10px;
    border-radius: 4px;
    background: #333;
    color: #fff;
    font-size: 0.75rem;
    line-height: 1.4;
    text-align: center;
    white-space: normal;
    pointer-events: none;
}

.powered-by-wrapper {
    display: none !important;
}
</style>

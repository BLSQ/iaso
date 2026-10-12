<template>
    <div v-if="loading" class="loading">Loading form...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <OdkWebForm
        v-else-if="formXml"
        :form-xml="formXml"
        :fetch-form-attachment="fetchAttachment"
        :intent-handler="intentHandler"
        :barcode-handler="barcodeHandler"
        @submit="handleSubmit"
    />
    <div v-else class="loading">Waiting for form data...</div>
    <!-- in place of the "Powered by" logo of web-forms: the credit, in words (Apache-2.0, no trademark use) -->
    <p v-if="formXml && !loading && !error" class="credit">
        Form displayed with
        <a href="https://github.com/getodk/web-forms" target="_blank" rel="noopener noreferrer">ODK Web Forms</a>,
        developed by
        <a href="https://getodk.org" target="_blank" rel="noopener noreferrer">Get ODK</a>
    </p>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { OdkWebForm } from '@getodk/web-forms';

const formXml = ref(null);
// the parent page answers the external app questions (`intent`) and scans the barcodes when it says so; else they
// can't be launched, and barcodes are typed
const intentHandler = ref(undefined);
const barcodeHandler = ref(undefined);
const pendingRequests = new Map();
let lastRequestId = 0;

// a request to the parent page (`odk-intent`, `odk-barcode`), answered by an `odk-host-result` of the same id
const askParent = type => request =>
    new Promise((resolve, reject) => {
        lastRequestId += 1;
        pendingRequests.set(lastRequestId, { resolve, reject });
        window.parent.postMessage({ type, id: lastRequestId, request: { ...request } }, '*');
    });

const loading = ref(false);
const error = ref(null);
const submitTooltip = ref(
    'Form submission from the preview is not available yet. This feature is under development.',
);

const setSubmitTooltip = message => {
    submitTooltip.value = message;
    document.documentElement.style.setProperty(
        '--preview-submit-tooltip',
        JSON.stringify(message),
    );
};

const fetchAttachment = async url => {
    const response = await fetch(url);
    return new Blob([await response.arrayBuffer()]);
};

// The submission back to the parent (the scenario editor): its status and the instance XML as text - the payload's
// FormData can't be posted.
const handleSubmit = async payload => {
    const formData = Array.isArray(payload?.data) ? payload.data[0] : payload?.data;
    const file = formData?.get?.('xml_submission_file');
    const xml = file ? await file.text() : null;
    window.parent.postMessage({ type: 'odk-submit', status: payload?.status, xml }, '*');
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

const loadFormFromXml = (xml, tooltipMessage, intents, barcodes) => {
    intentHandler.value = intents ? askParent('odk-intent') : undefined;
    barcodeHandler.value = barcodes ? askParent('odk-barcode') : undefined;
    // a preview without submission (Form AI) says why; without a message, submitting is allowed (scenario editor)
    document.documentElement.classList.toggle('submit-disabled', Boolean(tooltipMessage));
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
        loadFormFromXml(
            event.data.xml,
            event.data.submitDisabledMessage,
            event.data.intents,
            event.data.barcodes,
        );
    } else if (event.data?.type === 'odk-host-result' && pendingRequests.has(event.data.id)) {
        const { resolve, reject } = pendingRequests.get(event.data.id);
        pendingRequests.delete(event.data.id);
        if (event.data.error) {
            reject(new Error(event.data.error));
        } else {
            resolve(event.data.result ?? null);
        }
    }
};

onMounted(() => {
    document.documentElement.classList.add('submit-disabled');
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
.odk-form .powered-by-wrapper .anchor {
    display: none;
}

/* a discreet credit: light grey, small */
.credit {
    margin: 0 0 12px;
    text-align: center;
    font-size: 0.7rem;
    color: #9ca3af;
}

.credit a {
    color: inherit;
    text-decoration: none;
}

.credit a:hover {
    text-decoration: underline;
}

/* Disabled when the parent gives a reason; tooltip on hover (message via --preview-submit-tooltip from FormPreview) */
.submit-disabled .odk-form .form-wrapper .footer {
    position: relative;
    cursor: not-allowed;
}

.submit-disabled .odk-form .form-wrapper .footer button {
    opacity: 0.45;
    pointer-events: none;
}

.submit-disabled .odk-form .form-wrapper .footer:hover::after {
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
</style>

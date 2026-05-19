<template>
    <div class="odk-preview-root">
        <OdkWebForm
            :form-xml="formXml"
            :fetch-form-attachment="fetchAttachment"
            @submit="handleSubmit"
        />
    </div>
</template>

<script setup>
import { watch } from 'vue';
import { OdkWebForm } from '@getodk/web-forms';

const props = defineProps({
    formXml: {
        type: String,
        required: true,
    },
    submitDisabledMessage: {
        type: String,
        default: '',
    },
    onSubmit: {
        type: Function,
        default: undefined,
    },
});

const setSubmitTooltip = message => {
    if (!message) {
        return;
    }
    document.documentElement.style.setProperty(
        '--preview-submit-tooltip',
        JSON.stringify(message),
    );
};

watch(
    () => props.submitDisabledMessage,
    message => {
        setSubmitTooltip(message);
    },
    { immediate: true },
);

const fetchAttachment = async url => {
    const response = await fetch(url);
    return new Blob([await response.arrayBuffer()]);
};

const handleSubmit = data => {
    props.onSubmit?.(data);
};
</script>

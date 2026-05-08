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

const fetchAttachment = async (url) => {
  const response = await fetch(url);
  return new Blob([await response.arrayBuffer()]);
};

const handleSubmit = (data) => {
  // Send submission data back to parent via postMessage
  window.parent.postMessage({ type: 'odk-submit', data }, '*');
};

const loadFormFromUrl = async (url) => {
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

const loadFormFromXml = (xml) => {
  formXml.value = xml;
  loading.value = false;
  error.value = null;
};

// Listen for messages from parent iframe
const handleMessage = (event) => {
  if (event.data?.type === 'load-form-url') {
    loadFormFromUrl(event.data.url);
  } else if (event.data?.type === 'load-form-xml') {
    loadFormFromXml(event.data.xml);
  }
};

onMounted(() => {
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

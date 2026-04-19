import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Form Copilot',
        id: 'iaso.formCopilot.title',
    },
    placeholder: {
        defaultMessage: 'Describe the form you want to create...',
        id: 'iaso.formCopilot.placeholder',
    },
    send: {
        defaultMessage: 'Send',
        id: 'iaso.formCopilot.send',
    },
    downloadXlsForm: {
        defaultMessage: 'Download XLSForm',
        id: 'iaso.formCopilot.downloadXlsForm',
    },
    previewPlaceholder: {
        defaultMessage: 'Form preview will appear here once generated',
        id: 'iaso.formCopilot.previewPlaceholder',
    },
    errorGenerating: {
        defaultMessage: 'Error generating form. Please try again.',
        id: 'iaso.formCopilot.errorGenerating',
    },
    selectForm: {
        defaultMessage: 'Load existing form',
        id: 'iaso.formCopilot.selectForm',
    },
    loadForm: {
        defaultMessage: 'Load',
        id: 'iaso.formCopilot.loadForm',
    },
    saveAsNewVersion: {
        defaultMessage: 'Save as new version',
        id: 'iaso.formCopilot.saveAsNewVersion',
    },
    formLoaded: {
        defaultMessage:
            'Form "{formName}" (v{versionId}) loaded. You can now ask me to modify it.',
        id: 'iaso.formCopilot.formLoaded',
    },
    versionSaved: {
        defaultMessage: 'Saved as new version!',
        id: 'iaso.formCopilot.versionSaved',
    },
    newForm: {
        defaultMessage: 'New form',
        id: 'iaso.formCopilot.newForm',
    },
    saveAsNewForm: {
        defaultMessage: 'Save as new form',
        id: 'iaso.formCopilot.saveAsNewForm',
    },
    formName: {
        defaultMessage: 'Form name',
        id: 'iaso.formCopilot.formName',
    },
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.formCopilot.projects',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.formCopilot.cancel',
    },
    save: {
        defaultMessage: 'Save',
        id: 'iaso.formCopilot.save',
    },
    editProperties: {
        defaultMessage: 'Edit properties',
        id: 'iaso.formCopilot.editProperties',
    },
    saveForm: {
        defaultMessage: 'Save form',
        id: 'iaso.formCopilot.saveForm',
    },
    saveNewVersionOf: {
        defaultMessage: 'Save a new version of',
        id: 'iaso.formCopilot.saveNewVersionOf',
    },
    formOdkId: {
        defaultMessage: 'Form ID (ODK)',
        id: 'iaso.formCopilot.formOdkId',
    },
    formOdkIdHelp: {
        defaultMessage:
            'Unique identifier for the form (lowercase, underscores). Leave empty to auto-generate from the XLS.',
        id: 'iaso.formCopilot.formOdkIdHelp',
    },
});

export default MESSAGES;

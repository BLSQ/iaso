import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    aiBadge: {
        defaultMessage: 'AI',
        id: 'iaso.formAI.aiBadge',
    },
    brandName: {
        defaultMessage: 'FormAI',
        id: 'iaso.formAI.brandName',
    },
    title: {
        defaultMessage: 'Form AI',
        id: 'iaso.formAI.title',
    },
    panelSubtitle: {
        defaultMessage: 'Describe your changes',
        id: 'iaso.formAI.panelSubtitle',
    },
    emptyStateTitle: {
        defaultMessage: 'Describe your form',
        id: 'iaso.formAI.emptyStateTitle',
    },
    emptyStateDescription: {
        defaultMessage:
            'Write the fields and questions to collect below — FormAI builds it for you.',
        id: 'iaso.formAI.emptyStateDescription',
    },
    exampleStock: {
        defaultMessage:
            'A stock tracking form with date, product and quantity',
        id: 'iaso.formAI.exampleStock',
    },
    exampleSurvey: {
        defaultMessage: 'A household survey with GPS and photo',
        id: 'iaso.formAI.exampleSurvey',
    },
    placeholder: {
        defaultMessage: 'Describe the form you want to create...',
        id: 'iaso.formAI.placeholder',
    },
    send: {
        defaultMessage: 'Send',
        id: 'iaso.formAI.send',
    },
    downloadXlsForm: {
        defaultMessage: 'XLSForm',
        id: 'iaso.formAI.downloadXlsForm',
    },
    previewPlaceholder: {
        defaultMessage: 'Form preview will appear here once generated',
        id: 'iaso.formAI.previewPlaceholder',
    },
    previewSubmitUnavailable: {
        defaultMessage:
            'Form submission from the preview is not available yet. This feature is under development.',
        id: 'iaso.formAI.previewSubmitUnavailable',
    },
    errorGenerating: {
        defaultMessage: 'Error generating form. Please try again.',
        id: 'iaso.formAI.errorGenerating',
    },
    selectForm: {
        defaultMessage: 'Load existing form',
        id: 'iaso.formAI.selectForm',
    },
    loadForm: {
        defaultMessage: 'Load',
        id: 'iaso.formAI.loadForm',
    },
    saveAsNewVersion: {
        defaultMessage: 'Save as new version',
        id: 'iaso.formAI.saveAsNewVersion',
    },
    formLoaded: {
        defaultMessage:
            'Form "{formName}" (v{versionId}) loaded. You can now ask me to modify it.',
        id: 'iaso.formAI.formLoaded',
    },
    versionSaved: {
        defaultMessage: 'Saved as new version!',
        id: 'iaso.formAI.versionSaved',
    },
    newForm: {
        defaultMessage: 'New form',
        id: 'iaso.formAI.newForm',
    },
    saveAsNewForm: {
        defaultMessage: 'Save as new form',
        id: 'iaso.formAI.saveAsNewForm',
    },
    formName: {
        defaultMessage: 'Form name',
        id: 'iaso.formAI.formName',
    },
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.formAI.projects',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.formAI.cancel',
    },
    save: {
        defaultMessage: 'Save',
        id: 'iaso.formAI.save',
    },
    editProperties: {
        defaultMessage: 'Properties',
        id: 'iaso.formAI.editProperties',
    },
    saveForm: {
        defaultMessage: 'Save',
        id: 'iaso.formAI.saveForm',
    },
    saveNewVersionOf: {
        defaultMessage: 'Save a new version of',
        id: 'iaso.formAI.saveNewVersionOf',
    },
    formOdkId: {
        defaultMessage: 'Form ID (ODK)',
        id: 'iaso.formAI.formOdkId',
    },
    formOdkIdHelp: {
        defaultMessage:
            'Unique identifier for the form (lowercase, underscores). Leave empty to auto-generate from the XLS.',
        id: 'iaso.formAI.formOdkIdHelp',
    },
});

export default MESSAGES;

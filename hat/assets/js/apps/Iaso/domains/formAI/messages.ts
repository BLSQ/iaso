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
        defaultMessage: 'A stock tracking form with date, product and quantity',
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
    previewWelcomeTitle: {
        defaultMessage: 'Create a form from scratch',
        id: 'iaso.formAI.previewWelcomeTitle',
    },
    previewWelcomeDescription: {
        defaultMessage:
            'No existing form required. Describe what you want to collect in natural language — FormAI generates it for you, ready to preview and save.',
        id: 'iaso.formAI.previewWelcomeDescription',
    },
    previewWelcomeStep1: {
        defaultMessage:
            'Describe your form in the field on the left — the questions and response types you need.',
        id: 'iaso.formAI.previewWelcomeStep1',
    },
    previewWelcomeStep2: {
        defaultMessage:
            'FormAI generates it instantly and shows a live preview right here.',
        id: 'iaso.formAI.previewWelcomeStep2',
    },
    previewWelcomeStep3: {
        defaultMessage:
            'Refine with follow-up messages, then save it to your IASO account.',
        id: 'iaso.formAI.previewWelcomeStep3',
    },
    previewWelcomeFooter: {
        defaultMessage:
            'Or select an existing form from the menu above to edit it.',
        id: 'iaso.formAI.previewWelcomeFooter',
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
    formCreated: {
        defaultMessage: 'Created form "{formName}"',
        id: 'iaso.formAI.formCreated',
    },
    loadFormUserContext: {
        defaultMessage:
            // eslint-disable-next-line max-len
            'I\'m loading an existing form called "{formName}" (ODK form_id: "{formOdkId}", version: "{versionId}"). Here is its current XLSForm structure in JSON:\n\n{formJson}\n\nPlease remember this form structure. When I ask you to modify it, return the COMPLETE updated form in the standard JSON format.',
        id: 'iaso.formAI.loadFormUserContext',
    },
    loadFormAssistantContext: {
        defaultMessage:
            'I\'ve loaded the form "{formName}" (version {versionId}). I can see its complete structure with all questions, choices, and settings. What changes would you like me to make?',
        id: 'iaso.formAI.loadFormAssistantContext',
    },
    versionSaved: {
        defaultMessage: 'Saved as new version!',
        id: 'iaso.formAI.versionSaved',
    },
    versionSavedAs: {
        defaultMessage: 'Saved as version {versionId}',
        id: 'iaso.formAI.versionSavedAs',
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

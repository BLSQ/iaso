import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    updatedAt: {
        defaultMessage: 'Updated',
        id: 'iaso.label.updated_at',
    },
    createdAt: {
        id: 'iaso.label.created',
        defaultMessage: 'Creation',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    create: {
        defaultMessage: 'Create',
        id: 'iaso.label.create',
    },
    requiredField: {
        id: 'iaso.polio.validation.fieldRequired',
        defaultMessage: 'This field is required',
    },
    performanceThresholds: {
        id: 'iaso.polio.label.performanceThresholds',
        defaultMessage: 'Performance Thresholds',
    },
    failThreshold: {
        id: 'iaso.polio.label.failThreshold',
        defaultMessage: 'Failure Threshold',
    },
    warningThreshold: {
        id: 'iaso.polio.label.warningThreshold',
        defaultMessage: 'Warning Threshold',
    },
    successThreshold: {
        id: 'iaso.polio.label.successThreshold',
        defaultMessage: 'Success Threshold',
    },
    indicator: {
        id: 'iaso.polio.label.indicator',
        defaultMessage: 'Indicator',
    },
    deletePerformanceThreshold: {
        id: 'iaso.polio.deletePerformanceThreshold.delete',
        defaultMessage: 'Delete Performance Threshold: {name}',
    },
    average: {
        id: 'iaso.polio.average',
        defaultMessage: 'Average',
    },
});

export default MESSAGES;

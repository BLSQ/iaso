import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    performanceDashboard: {
        id: 'iaso.polio.performanceDashboard',
        defaultMessage: 'Performance Dashboard',
    },
    country: {
        id: 'iaso.polio.table.label.country',
        defaultMessage: 'Country',
    },
    countryBlock: {
        defaultMessage: 'Country block',
        id: 'iaso.polio.label.countryBlock',
    },
    date: {
        id: 'iaso.polio.form.label.date',
        defaultMessage: 'Date',
    },
    status: {
        id: 'iaso.polio.table.label.status',
        defaultMessage: 'Status',
    },
    antigen: {
        id: 'iaso.polio.antigen',
        defaultMessage: 'Vaccine',
    },
    createdAt: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    updatedAt: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Actions',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    deletePerformance: {
        id: 'iaso.polio.performance.delete',
        defaultMessage: 'Delete Performance Data: {name}',
    },
    deletePerformanceWarning: {
        id: 'iaso.polio.performance.deleteWarning',
        defaultMessage: 'Are you sure you want to delete this entry?',
    },
    invalidDate: {
        id: 'iaso.polio.validation.invalidDate',
        defaultMessage: 'Invalid date',
    },
    requiredField: {
        id: 'iaso.polio.validation.fieldRequired',
        defaultMessage: 'This field is required',
    },
    editPerformance: {
        id: 'iaso.polio.performance.edit',
        defaultMessage: 'Edit Performance Data',
    },
    addPerformance: {
        id: 'iaso.polio.performance.add',
        defaultMessage: 'Add Performance Data',
    },
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    yes: {
        id: 'iaso.label.yes',
        defaultMessage: 'Yes',
    },
    no: {
        id: 'iaso.label.no',
        defaultMessage: 'No',
    },
    draft: {
        id: 'iaso.polio.performance.status.draft',
        defaultMessage: 'Draft',
    },
    commented: {
        id: 'iaso.polio.performance.status.commented',
        defaultMessage: 'Commented',
    },
    final: {
        id: 'iaso.polio.performance.status.final',
        defaultMessage: 'Final',
    },
    deleteText: {
        id: 'iaso.label.deleteText',
        defaultMessage: 'This operation cannot be undone.',
    },
});

export default MESSAGES;

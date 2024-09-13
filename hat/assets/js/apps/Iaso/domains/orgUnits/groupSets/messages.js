import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Actions',
    },
    created_at: {
        id: 'iaso.label.created_at',
        defaultMessage: 'Created',
    },
    updated_at: {
        id: 'iaso.label.updated_at',
        defaultMessage: 'Updated',
    },
    name: {
        id: 'iaso.label.name',
        defaultMessage: 'Name',
    },
    search: {
        id: 'iaso.search',
        defaultMessage: 'Search',
    },
    sourceVersion: {
        id: 'iaso.dataSources.dataSourceVersion',
        defaultMessage: 'Source version',
    },
    source_ref: {
        defaultMessage: 'Source ref',
        id: 'iaso.orgUnits.sourceRef',
    },
    projects: {
        id: 'iaso.label.projects',
        defaultMessage: 'Projects',
    },
    groups: {
        id: 'iaso.label.groups',
        defaultMessage: 'Groups',
    },
    groupSet: {
        id: 'iaso.label.groupSet',
        defaultMessage: 'Group Set',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    deleteError: {
        id: 'iaso.snackBar.deleteEntityError',
        defaultMessage: 'An error occurred while deleting entity',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    group_belonging: {
        id: 'iaso.groupsets.groupBelonging',
        defaultMessage: 'Groups belonging',
    },
    validationFieldRequired: {
        id: 'iaso.groupsets.validation.field_required',
        defaultMessage: 'This field is required',
    },
});

export default MESSAGES;

import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
    actions: {
        defaultMessage: 'Actions',
        id: 'iaso.label.actions',
    },
    dataSources: {
        defaultMessage: 'Data Sources',
        id: 'iaso.label.dataSources',
    },
    dataSourceName: {
        defaultMessage: 'Data Source name',
        id: 'iaso.dataSources.name',
    },
    dataSourceDescription: {
        defaultMessage: 'Description',
        id: 'iaso.dataSources.description',
    },
    dataSourceReadOnly: {
        defaultMessage: 'Read Only',
        id: 'iaso.dataSources.dataSourceReadOnly',
    },
    projects: {
        id: 'iaso.label.projects',
        defaultMessage: 'Projects',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    add: {
        id: 'iaso.label.add',
        defaultMessage: 'Add',
    },
    createDataSource: {
        defaultMessage: 'Create data sources',
        id: 'iaso.dataSources.create',
    },
    updateDataSource: {
        defaultMessage: 'Update data sources',
        id: 'iaso.dataSources.update',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    defaultSource: {
        id: 'iaso.dataSources.default',
        defaultMessage: 'Default source',
    },
    defaultVersion: {
        id: 'iaso.dataSources.defaultVersion',
        defaultMessage: 'Default version',
    },
    dhisName: {
        id: 'iaso.dataSources.dhisName',
        defaultMessage: 'DHIS name',
    },
    dhisUrl: {
        id: 'iaso.dataSources.dhisUrl',
        defaultMessage: 'DHIS url',
    },
    dhisLogin: {
        id: 'iaso.dataSources.dhisLogin',
        defaultMessage: 'DHIS login',
    },
    dhisPassword: {
        id: 'iaso.dataSources.dhisPassword',
        defaultMessage: 'DHIS password',
    },
    dataSourceVersion: {
        id: 'iaso.dataSources.dataSourceVersion',
        defaultMessage: 'Source version',
    },
    continueOnError: {
        id: 'iaso.dataSources.continueOnError',
        defaultMessage: 'Continue on error',
    },
    validateStatus: {
        id: 'iaso.dataSources.validateStatus',
        defaultMessage: 'Validate status',
    },
    // TODO remove + remove from json
    makeDefaultSource: {
        id: 'iaso.dataSources.makeDefaultSource',
        defaultMessage: 'Make default data source',
    },
    goToCurrentTask: {
        id: 'iaso.dataSources.goToCurrentTask',
        defaultMessage: 'Go to current task when done',
    },
    launch: {
        id: 'iaso.label.launch',
        defaultMessage: 'Launch',
    },
    addTask: {
        id: 'iaso.dataSources.addTask',
        defaultMessage: 'Add task',
    },
    useDefaultDhisSettings: {
        id: 'iaso.dataSources.useDefaultDhisSettings',
        defaultMessage: 'Use default DHIS settings',
    },
});

export default MESSAGES;

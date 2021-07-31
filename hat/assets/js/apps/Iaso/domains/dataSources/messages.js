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

    goToCurrentTask: {
        id: 'iaso.dataSources.goToCurrentTask',
        defaultMessage: 'Launch and show task',
    },
    launch: {
        id: 'iaso.label.launch',
        defaultMessage: 'Launch',
    },
    importFromDhis2: {
        id: 'iaso.dataSources.importFromDhis2',
        defaultMessage: 'Import from DHIS2',
    },
    useDefaultDhisSettings: {
        id: 'iaso.dataSources.useDefaultDhisSettings',
        defaultMessage: 'Use default DHIS settings',
    },
    emptyProjectsError: {
        id: 'iaso.datasources.emptyProjectsError',
        defaultMessage: 'Please choose at least one project',
    },
    addTaskTitle: {
        id: 'iaso.datasources.addAskTitle',
        defaultMessage: '{title} - Source: {source} - Version: {version}',
    },
    gpkgFormFile: {
        id: 'iaso.datasources.label.gpkgFormFile',
        defaultMessage: 'Choose file',
    },
    versionNumber: {
        id: 'iaso.datasources.label.versionNumber',
        defaultMessage: 'Version',
    },
    project: {
        id: 'iaso.datasources.label.project',
        defaultMessage: 'Project',
    },
    geoPkgTitle: {
        id: 'iaso.datasources.label.geoPkgTitle',
        defaultMessage: 'Import from GeoPackage',
    },
    importGeoPkg: {
        id: 'iaso.datasources.geoPkg',
        defaultMessage: 'Import GeoPackage',
    },
    versions: {
        id: 'iaso.datasources.version',
        defaultMessage: 'Versions',
    },
});

export default MESSAGES;

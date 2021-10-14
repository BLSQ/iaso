import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
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
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
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
    updateFromDhis2: {
        id: 'iaso.dataSources.updateFromDhis2',
        defaultMessage: 'Update version from DHIS2',
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
    gpkgChooseFile: {
        id: 'iaso.datasources.gpkg.chooseFile',
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
    gpkgTitle: {
        id: 'iaso.datasources.gpkg.title',
        defaultMessage: 'Import from GeoPackage',
    },
    gpkgTooltip: {
        id: 'iaso.datasources.gpkg.tooltip',
        defaultMessage: 'Import from a GeoPackage file',
    },
    versions: {
        id: 'iaso.datasources.version',
        defaultMessage: 'Versions',
    },
    exportDataSource: {
        id: 'iaso.datasources.exportDataSource',
        defaultMessage: 'Export data source: {dataSourceName}',
    },
    name: {
        id: 'iaso.datasources.options.label.name',
        defaultMessage: 'Name',
    },
    parent: {
        id: 'iaso.datasources.options.label.parent',
        defaultMessage: 'Parent',
    },
    groups: {
        id: 'iaso.datasources.options.label.groups',
        defaultMessage: 'Groups',
    },
    geometry: {
        id: 'iaso.datasources.options.label.geometry',
        defaultMessage: 'Geometry',
    },
    version: {
        id: 'iaso.datasources.options.label.version',
        defaultMessage: 'Version',
    },
    dhis2ExportSure: {
        id: 'iaso.datasources.title.dhis2ExportSure',
        defaultMessage: 'Are you sure? \n' +
          'This might make a lot of changes in DHIS2.',
    },
    default: {
        id: 'iaso.datasources.options.label.default',
        defaultMessage: 'default',
    },
    selectTopOrgUnit: {
        id: 'iaso.datasources.label.selectTopOrgUnit',
        defaultMessage: 'Please select top org unit',
    },
    export: {
        id: 'iaso.datasources.button.label.export',
        defaultMessage: 'Export',
    },
    csvPreview: {
        id: 'iaso.datasources.button.label.csvPreview',
        defaultMessage: 'Preview',
    },
    orgUnitTypes: {
        id: 'iaso.datasources.label.orgUnitTypes',
        defaultMessage: 'OrgUnit types',
    },
    status: {
        id: 'iaso.datasources.label.status',
        defaultMessage: 'Status',
    },
    fieldsToExport: {
        id: 'iaso.datasources.label.fieldsToExport',
        defaultMessage: 'Fields to export',
    },
    datasourceSource: {
        id: 'iaso.datasources.label.datasourceSource',
        defaultMessage: 'Version',
    },
    credentials: {
        id: 'iaso.datasources.label.credentials',
        defaultMessage: 'Credentials',
    },
    exportTitle: {
        id: 'iaso.datasources.title.export',
        defaultMessage: 'Org units to export',
    },
    sourceDataSource: {
        id: 'iaso.datasources.title.sourceDataSource',
        defaultMessage: 'Version to compare with to generate export',
    },
    compareAndExport: {
        id: 'iaso.datasources.tooltip.compareAndExport',
        defaultMessage: 'Compare data sources and export to DHIS2',
    },
    credentialsForExport: {
        id: 'iaso.datasources.credentialsForExport',
        defaultMessage: 'Export to:',
    },
    noCredentialsForExport: {
        id: 'iaso.datasources.noCredentialsForExport',
        defaultMessage: 'Please configure DHIS2 on source to enable export',
    },
});

export default MESSAGES;

import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    actions: {
        defaultMessage: 'Action(s)',
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
    search: {
        id: 'iaso.search',
        defaultMessage: 'Search',
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
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
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
    dhis2ServerConnectionError: {
        id: 'iaso.dataSources.dhis2ServerConnectionError',
        defaultMessage: 'Could not connect to server, check the address.',
    },
    notDefinedDhis2ConnectionError: {
        id: 'iaso.dataSources.notDefinedDhis2ConnectionError',
        defaultMessage: 'Not defined dhis2 connection error.',
    },
    dhis2InvalideUserOrPasswordError: {
        id: 'iaso.dataSources.dhis2InvalideUserOrPasswordError',
        defaultMessage: 'Invalid user or password.',
    },
    dhis2PasswordBlankError: {
        id: 'iaso.dataSources.dhis2PasswordBlankError',
        defaultMessage: 'This field may not be blank.',
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
        id: 'iaso.label.goToCurrentTask',
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
    compareDataSource: {
        id: 'iaso.datasources.compareDataSource',
        defaultMessage: 'Compare data source: {dataSourceName}',
    },
    name: {
        id: 'iaso.datasources.options.label.name',
        defaultMessage: 'Name',
    },
    code: {
        id: 'iaso.datasources.options.label.code',
        defaultMessage: 'Code',
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
    exportTitle: {
        id: 'iaso.datasources.title.exportTitle',
        defaultMessage: 'Are you sure?',
    },
    syncTitle: {
        id: 'iaso.datasources.title.syncTitle',
        defaultMessage: 'Synchronize data sources',
    },
    dhis2ExportMessage: {
        id: 'iaso.datasources.title.dhis2ExportMessage',
        defaultMessage: 'This might make a lot of changes in DHIS2.',
    },
    syncMessage: {
        id: 'iaso.datasources.title.syncMessage',
        defaultMessage:
            'This might create a lot of changes requests to align the two versions. This dialog will stay frozen until the preview is done. Geometry and code will not be synchronized.',
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
    syncPreview: {
        id: 'iaso.datasources.button.label.syncPreview',
        defaultMessage: 'Preview change request(s)',
    },
    orgUnitTypes: {
        id: 'iaso.datasources.label.orgUnitTypes',
        defaultMessage: 'Org Unit Types',
    },
    status: {
        id: 'iaso.datasources.label.status',
        defaultMessage: 'Status',
    },
    group: {
        id: 'iaso.datasources.label.groups',
        defaultMessage: 'Group',
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
    origin: {
        id: 'iaso.datasources.title.origin',
        defaultMessage: 'Origin',
    },
    target: {
        id: 'iaso.datasources.title.target',
        defaultMessage: 'Target',
    },
    compare: {
        id: 'iaso.datasources.tooltip.compare',
        defaultMessage: 'Compare/Synchronize data sources',
    },
    credentialsForExport: {
        id: 'iaso.datasources.credentialsForExport',
        defaultMessage: 'Export to:',
    },
    noCredentialsForExport: {
        id: 'iaso.datasources.noCredentialsForExport',
        defaultMessage: 'Please configure DHIS2 on source to enable export',
    },
    copyVersion: {
        id: 'iaso.datasources.copyVersion',
        defaultMessage: 'Copy source version',
    },
    copy: {
        id: 'iaso.datasources.button.label.copy',
        defaultMessage: 'Copy',
    },
    copyVersionWithName: {
        id: 'iaso.datasources.title.copyVersionWithName',
        defaultMessage: 'Copy {sourceName} version {versionNumber} ?',
    },
    copiedVersion: {
        id: 'iaso.datasources.message.copiedVersion',
        defaultMessage: '{sourceName} - version {versionNumber} ',
    },
    willBeCopied: {
        id: 'iaso.datasources.message.willBeCopied',
        defaultMessage: 'will be copied to ',
    },

    copyToSourceWithVersion: {
        id: 'iaso.datasources.message.copyToSourceWithVersion',
        defaultMessage: '{sourceName} - version {versionNumber}',
    },
    overwriteWarning: {
        id: 'iaso.datasources.message.overwriteWarning',
        defaultMessage:
            'Warning: if a version with the selected number already exists, it will be overwritten',
    },
    nextVersion: {
        id: 'iaso.datasources.label.nextVersion',
        defaultMessage: 'Next version',
    },
    destinationVersion: {
        id: 'iaso.datasources.label.destinationVersion',
        defaultMessage: 'Destination version',
    },
    destinationSource: {
        id: 'iaso.datasources.label.destinationSource',
        defaultMessage: 'Destination source',
    },
    chooseVersionNumber: {
        id: 'iaso.datasources.label.chooseVersionNumber',
        defaultMessage: 'Choose version number',
    },
    editSourceVersion: {
        id: 'iaso.datasources.label.editSourceVersion',
        defaultMessage: 'Edit source version',
    },
    copyVersionSuccessMessage: {
        defaultMessage: 'The task has been created',
        id: 'iaso.snackBar.copyVersionSuccessMessage',
    },
    copyVersionErrorMessage: {
        defaultMessage: 'An error occurred while creating the task',
        id: 'iaso.snackBar.copyVersionErrorMessage',
    },
    importFromDhis2Success: {
        defaultMessage: 'Import from DHIS2 was planned with success',
        id: 'iaso.snackBar.importFromDhis2Success',
    },
    importFromDhis2Error: {
        defaultMessage: 'An error occurred while importing from DHIS2',
        id: 'iaso.snackBar.importFromDhis2Error',
    },
    exportToDhis2Success: {
        defaultMessage: 'Export to DHIS2 was planned with success',
        id: 'iaso.snackBar.exportToDhis2Success',
    },
    exportToDhis2Error: {
        defaultMessage: 'An error occurred while exporting to DHIS2',
        id: 'iaso.snackBar.exportToDhis2Error',
    },
    importGpkgSuccess: {
        defaultMessage: 'Import of gpkg file was planned with success',
        id: 'iaso.snackBar.importGpkgSuccess',
    },
    importGpkgError: {
        defaultMessage: 'An error occurred while importing the gpkg file',
        id: 'iaso.snackBar.importGpkgError',
    },
    checkDhis2Success: {
        defaultMessage: 'Connection to server ok',
        id: 'iaso.dataSources.checkDHIS2.success',
    },
    checkDhis2Error: {
        defaultMessage: 'Connection Error check settings',
        id: 'iaso.dataSources.checkDHIS2.error',
    },
    newEmptyVersionSavedSuccess: {
        defaultMessage: 'New empty version saved successfully',
        id: 'iaso.snackBar.newEmptyVersionSavedSuccess',
    },
    newEmptyVersionError: {
        defaultMessage:
            'An error occurred while creating the new empty version',
        id: 'iaso.snackBar.newEmptyVersionError',
    },
    newEmptyVersion: {
        defaultMessage: 'Create a new empty version',
        id: 'iaso.sourceVersion.label.createNewEmptyVersion',
    },
    newEmptyVersionDescription: {
        defaultMessage: 'It will directly create a new empty version.',
        id: 'iaso.sourceVersion.label.createEmptyVersionDescription',
    },
    viewDataSource: {
        id: 'iaso.dataSources.viewDataSource',
        defaultMessage: 'View data source',
    },
    dataSourceDetailsTitle: {
        id: 'iaso.dataSources.dataSourceDetailsTitle',
        defaultMessage: 'Data source',
    },
    dataSourceInformationTitle: {
        id: 'iaso.dataSources.dataSourceInformations',
        defaultMessage: 'Data source informations',
    },
    dataSourceVersionTitle: {
        id: 'iaso.dataSources.versionOnSourceTitle',
        defaultMessage: 'Versions',
    },
    dataSourceNoVersion: {
        id: 'iaso.dataSources.dataSourceNoVersion',
        defaultMessage: 'This datasource is empty, there are no versions',
    },
    dataSourceVersionSortingWarn: {
        id: 'iaso.dataSources.dataSourceVersionSortingWarn',
        defaultMessage:
            'Sort error, there must be a wrong parameter. Received: {sortBy}, {sortFocus}. Expected a combination of asc|desc and number|org_units_count',
    },
    openingDate: {
        id: 'iaso.orgUnits.openingDate',
        defaultMessage: 'Opening date',
    },
    closingDate: {
        id: 'iaso.orgUnits.closingDate',
        defaultMessage: 'Closing date',
    },
    number: {
        id: 'iaso.versionsDialog.label.number',
        defaultMessage: 'Number',
    },
    createdAt: {
        id: 'iaso.versionsDialog.label.createdAt',
        defaultMessage: 'Created',
    },
    updatedAt: {
        id: 'iaso.versionsDialog.label.updatedAt',
        defaultMessage: 'Updated',
    },
    description: {
        id: 'iaso.versionsDialog.label.description',
        defaultMessage: 'Description',
    },
    orgUnits: {
        id: 'iaso.label.orgUnit',
        defaultMessage: 'Org units',
    },
    readOnly: {
        id: 'iaso.dataSources.dataSourceReadOnly',
        defaultMessage: 'Read Only',
    },
    validate: {
        defaultMessage: 'Validate',
        id: 'iaso.label.validate',
    },
    sync: {
        id: 'iaso.datasources.label.sync',
        defaultMessage: 'Synchronize',
    },
    syncMessageDisabled: {
        id: 'iaso.datasources.syncMessageDisabled',
        defaultMessage:
            'Please select a version of same data source to enable sync',
    },
    exportMessageDisabled: {
        id: 'iaso.datasources.exportMessageDisabled',
        defaultMessage:
            'Please select a data source with DHIS2 credentials to enable export',
    },
    syncName: {
        id: 'iaso.datasources.syncName',
        defaultMessage: 'Synchronization name',
    },
    syncTooltip: {
        id: 'iaso.datasources.syncTooltip',
        defaultMessage:
            'You need to give a name and see the preview to launch the synchronization.',
    },
    count_create: {
        id: 'iaso.datasources.count_create',
        defaultMessage: 'Org unit(s) to create',
    },
    count_update: {
        id: 'iaso.datasources.count_update',
        defaultMessage: 'Org unit(s) to update',
    },
    syncNameInfos: {
        id: 'iaso.datasources.syncNameInfos',
        defaultMessage: 'Used to find linked changed requests',
    },
    pleaseSelectVersionFirst: {
        id: 'iaso.datasources.pleaseSelectVersionFirst',
        defaultMessage: 'Please select a data source version first',
    },
});

export default MESSAGES;

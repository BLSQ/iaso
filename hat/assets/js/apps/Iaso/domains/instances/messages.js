import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Record(s) for the form',
        id: 'iaso.instance.form',
    },
    forceExport: {
        id: 'iaso.instances.forceExport',
        defaultMessage: 'Force Export',
    },
    export: {
        defaultMessage: 'Export',
        id: 'iaso.label.export',
    },
    reAssignInstance: {
        defaultMessage: 'Re-assign instance',
        id: 'iaso.label.reAssignInstance',
    },
    reAssignInstanceAction: {
        defaultMessage: 'Re-assign',
        id: 'iaso.label.reAssignInstanceAction',
    },
    list: {
        defaultMessage: 'List',
        id: 'iaso.label.list',
    },
    groups: {
        defaultMessage: 'Groups',
        id: 'iaso.label.groups',
    },
    map: {
        defaultMessage: 'Map',
        id: 'iaso.label.map',
    },
    version: {
        defaultMessage: 'Version',
        id: 'iaso.label.version',
    },
    downloadXml: {
        id: 'iaso.label.downloadXml',
        defaultMessage: 'Download XML',
    },
    viewOrgUnit: {
        id: 'iaso.label.viewOrgUnit',
        defaultMessage: 'View Org Unit',
    },
    dhis2Mappings: {
        id: 'iaso.label.dhis2Mappings',
        defaultMessage: 'DHIS mappings',
    },
    field: {
        id: 'iaso.label.field',
        defaultMessage: 'Field',
    },
    key: {
        id: 'iaso.label.key',
        defaultMessage: 'Key',
    },
    value: {
        id: 'iaso.label.value',
        defaultMessage: 'Value',
    },
    view: {
        id: 'iaso.label.view',
        defaultMessage: 'View',
    },
    type: {
        id: 'iaso.label.type',
        defaultMessage: 'Type',
    },
    ok: {
        id: 'iaso.label.ok',
        defaultMessage: 'Ok',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    device: {
        id: 'iaso.instance.device',
        defaultMessage: 'IMEI device',
    },
    device_id: {
        id: 'iaso.instance.device',
        defaultMessage: 'IMEI device',
    },
    coordinate: {
        id: 'iaso.instance.coordinate',
        defaultMessage: 'Coordinates',
    },
    created_at: {
        id: 'iaso.instance.created_at',
        defaultMessage: 'Created at',
    },
    updated_at: {
        id: 'iaso.instance.updated_at',
        defaultMessage: 'Updated at',
    },
    files: {
        id: 'iaso.instance.files',
        defaultMessage: 'Files',
    },
    source_ref: {
        id: 'iaso.label.source_ref',
        defaultMessage: 'Source Reference',
    },
    latitude: {
        id: 'iaso.label.latitude',
        defaultMessage: 'Latitude',
    },
    longitude: {
        id: 'iaso.label.longitude',
        defaultMessage: 'Longitude',
    },
    associate: {
        id: 'iaso.label.useOrgUnitLocation.btn',
        defaultMessage: 'Use this location',
    },
    question: {
        id: 'iaso.label.useOrgUnitLocation.question',
        defaultMessage:
            'Are you sure you want to use this location for the current org unit ?',
    },
    message: {
        id: 'iaso.label.useOrgUnitLocation.message',
        defaultMessage: "Don't forget to save",
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    org_unit: {
        defaultMessage: 'Org unit',
        id: 'iaso.instance.org_unit',
    },
    selectedOrgUnit: {
        id: 'iaso.instance.selectedOrgUnit',
        defaultMessage: 'Selected Org unit',
    },
    period: {
        defaultMessage: 'Period',
        id: 'iaso.instance.period',
    },
    file: {
        defaultMessage: 'File',
        id: 'iaso.instance.file',
    },
    infos: {
        defaultMessage: 'Informations',
        id: 'iaso.instance.infos',
    },
    form: {
        defaultMessage: 'Form',
        id: 'iaso.instance.formShort',
    },
    location: {
        defaultMessage: 'Location',
        id: 'iaso.map.location',
    },
    exportRequest: {
        defaultMessage: 'Export requests',
        id: 'iaso.label.exportRequests',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    uuid: {
        defaultMessage: 'Uuid',
        id: 'iaso.label.uuid',
    },
    status: {
        defaultMessage: 'status',
        id: 'iaso.label.instanceStatus',
    },
    ready: {
        defaultMessage: 'ready',
        id: 'iaso.label.instanceStatus.readySingle',
    },
    error: {
        defaultMessage: 'error',
        id: 'iaso.label.instanceStatus.errorSingle',
    },
    duplicated: {
        defaultMessage: 'duplicated',
        id: 'iaso.label.instanceStatus.duplicatedSingle',
    },
    exported: {
        defaultMessage: 'exported',
        id: 'iaso.label.instanceStatus.exportedSingle',
    },
    exportRequests: {
        defaultMessage: 'Export requests',
        id: 'iaso.label.exportRequests',
    },
    exportStatus: {
        defaultMessage: 'Status',
        id: 'iaso.exportRequest.Status',
    },
    lastExportSuccessAt: {
        defaultMessage: 'Last export success at',
        id: 'iaso.exportRequest.last_export_success_at',
    },
    launcher: {
        defaultMessage: 'Exported by',
        id: 'iaso.exportRequest.launcher',
    },
    lastErrorMessage: {
        defaultMessage: 'Last error message',
        id: 'iaso.exportRequest.last_error_message',
    },
    when: {
        defaultMessage: 'When',
        id: 'iaso.exporStatus.createdAt',
    },
    warningSoftDeleted: {
        defaultMessage:
            "This instance has been soft-deleted and won't appear in instance search or completeness counts.",
        id: 'iaso.instance.warningSoftDeleted',
    },
    warningSoftDeletedExport: {
        defaultMessage:
            "If this instance was exported, this doesn't mean these data has been deleted from dhis2.",
        id: 'iaso.instance.warningSoftDeletedExport',
    },
    warningSoftDeletedDerived: {
        defaultMessage:
            'If this form generates other derived instances, they might not be updated either.',
        id: 'iaso.instance.warningSoftDeletedDerived',
    },
    images: {
        defaultMessage: 'Images',
        id: 'iaso.label.images',
    },
    videos: {
        defaultMessage: 'Videos',
        id: 'iaso.label.videos',
    },
    documents: {
        defaultMessage: 'Documents',
        id: 'iaso.label.documents',
    },
    others: {
        defaultMessage: 'Others',
        id: 'iaso.label.others',
    },
    missingFile: {
        defaultMessage: 'Cannot find an instance with a file',
        id: 'iaso.instance.missingFile',
    },
    instanceDeleteAction: {
        defaultMessage: 'Delete instance',
        id: 'iaso.instance.instanceDeleteAction',
    },
    instanceRestoreAction: {
        defaultMessage: 'Restore instance',
        id: 'iaso.instance.instanceRestoreAction',
    },
    instanceEditAction: {
        defaultMessage: 'Edit any answer in Enketo',
        id: 'iaso.instance.instanceEditAction',
    },
    instanceReAssignAction: {
        defaultMessage: 'Edit orgUnit or period',
        id: 'iaso.instance.instanceReAssignAction',
    },
    instanceExportAction: {
        defaultMessage: 'Export instance',
        id: 'iaso.instance.instanceExportAction',
    },
    see: {
        defaultMessage: 'See',
        id: 'iaso.label.see',
    },
    instanceCreateAction: {
        defaultMessage: 'Create instance',
        id: 'iaso.instance.instanceCreateAction',
    },
    instanceCreationDialogTitle: {
        defaultMessage: 'Create instance',
        id: 'iaso.instance.instanceCreationDialogTitle',
    },
    deleteInstance: {
        defaultMessage: 'Delete isntance(s)',
        id: 'iaso.instance.delete',
    },
    deleteInstanceCount: {
        defaultMessage: 'Delete {count} isntance(s)',
        id: 'iaso.instance.deleteCount',
    },
    deleteWarning: {
        id: 'iaso.users.dialog.deleteUserTitle',
        defaultMessage: 'This operation cannot be undone.',
    },
});

export default MESSAGES;

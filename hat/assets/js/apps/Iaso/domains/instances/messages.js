

import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    type: {
        id: 'iaso.label.type',
        defaultMessage: 'Type',
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
        defaultMessage: 'Are you sure you want to use this location for the current org unit ?',
    },
    message: {
        id: 'iaso.label.useOrgUnitLocation.message',
        defaultMessage: 'Don\'t forget to save',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.labels.actions',
    },
    org_unit: {
        defaultMessage: 'Org unit',
        id: 'iaso.instance.org_unit',
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
        defaultMessage: 'This instance has been soft-deleted and won\'t appear in instance search or completeness counts.',
        id: 'iaso.instance.warningSoftDeleted',
    },
    warningSoftDeletedExport: {
        defaultMessage: 'If this instance was exported, this doesn\'t mean these data has been deleted from dhis2.',
        id: 'iaso.instance.warningSoftDeletedExport',
    },
    warningSoftDeletedDerived: {
        defaultMessage: 'If this form generates other derived instances, they might not be updated either.',
        id: 'iaso.instance.warningSoftDeletedDerived',
    },
    instanceDeleteAction: {
        defaultMessage: 'Delete instance',
        id: 'iaso.instance.instanceDeleteAction',
    },
    instanceEditAction: {
        defaultMessage: 'Edit any answers in Enketo',
        id: 'iaso.instance.instanceEditAction',
    },
    instanceReAssignAction: {
        defaultMessage: 'Edit orgUnit or period',
        id: 'iaso.instance.instanceReAssignAction',
    }


});

export default MESSAGES;

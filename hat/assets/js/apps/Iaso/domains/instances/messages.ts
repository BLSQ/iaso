import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Submissions for the form',
        id: 'iaso.instance.formSubmissions',
    },
    titleMulti: {
        defaultMessage: 'Form submissions',
        id: 'iaso.forms.hasInstances',
    },
    forceExport: {
        id: 'iaso.instances.forceExport',
        defaultMessage: 'Force Export',
    },
    export: {
        defaultMessage: 'Export',
        id: 'iaso.label.export',
    },
    exportSelection: {
        defaultMessage: 'Export {count} submissions ',
        id: 'iaso.label.exportSelection',
    },
    reAssignInstance: {
        defaultMessage: 'Re-assign instance',
        id: 'iaso.label.reAssignInstance',
    },
    reAssignInstanceAction: {
        defaultMessage: 'Re-assign',
        id: 'iaso.label.reAssignInstanceAction',
    },
    with: {
        id: 'iaso.label.with',
        defaultMessage: 'With',
    },
    without: {
        id: 'iaso.label.without',
        defaultMessage: 'Without',
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
    linkOrgUnitReferenceSubmission: {
        id: 'iaso.label.linkOrgUnitReferenceSubmission',
        defaultMessage: 'Link reference submission to org unit',
    },
    linkOffOrgUnitReferenceSubmission: {
        id: 'iaso.label.linkOffOrgUnitReferenceSubmission',
        defaultMessage: 'Unlink reference submission from orgUnit',
    },
    linkUnlinkReferenceSubmissionsToOrgUnits: {
        defaultMessage:
            'link or unlink reference submissions to/from org units',
        id: 'iaso.label.linkUnlinkReferenceSubmissionsToOrgUnits',
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
        defaultMessage: 'OK',
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
        defaultMessage: 'Created in Iaso',
    },
    updated_at: {
        id: 'iaso.instance.last_sync_at',
        defaultMessage: 'Updated',
    },
    source_created_at: {
        id: 'iaso.instance.source_created_at',
        defaultMessage: 'Created on device',
    },
    last_modified_by: {
        id: 'iaso.instance.last_modified_by',
        defaultMessage: 'Modified by',
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
    submission: {
        defaultMessage: 'Submission',
        id: 'iaso.instance.titleSingle',
    },
    form: {
        defaultMessage: 'Form',
        id: 'iaso.instance.formShort',
    },
    form_name: {
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
    pushGpsToOrgUnits: {
        defaultMessage: 'Push GPS from submissions to Org units',
        id: 'iaso.label.pushGpsToOrgUnits',
    },
    pushGpsWarningMessage: {
        defaultMessage:
            'You are about to push the locations of {submissionCount} submission(s) to {orgUnitCount} Org unit(s)',
        id: 'iaso.instance.pushGpsWarningMessage',
    },
    noGpsForSomeInstaces: {
        defaultMessage:
            "Some instances don't have locations. Nothing will be applied for those OrgUnits.",
        id: 'iaso.instance.noGpsForSomeInstaces',
    },
    someOrgUnitsHasAlreadyGps: {
        defaultMessage:
            'Some OrgUnits already have GPS coordinates. Do you want to proceed and overwrite them?',
        id: 'iaso.instance.someOrgUnitsHasAlreadyGps',
    },
    pushGpsTaskPlanned: {
        defaultMessage:
            'Push GPS from submissions to Org units was planned with success',
        id: 'iaso.snackBar.pushGpsTaskPlanned',
    },
    pushGpsTaskError: {
        defaultMessage:
            'An error occurred while pushing GPS from submissions to Org units',
        id: 'iaso.snackBar.pushGpsTaskError',
    },
    referenceInstanceLinkTaskPlanned: {
        defaultMessage:
            'Bulk reference submissions link or unlink to/from Org units was planned with success.',
        id: 'iaso.snackBar.referenceInstanceLinkTaskPlanned',
    },
    referenceInstanceLinkTaskError: {
        defaultMessage:
            'An error occurred while linking or unlinking to/from Org units.',
        id: 'iaso.snackBar.referenceInstanceLinkTaskError',
    },
    multipleInstancesOneOrgUnitWarningMessage: {
        defaultMessage: 'Multiple submissions are using the same org unit',
        id: 'iaso.instance.multipleInstancesOneOrgUnitWarningMessage',
    },
    multipleReferenceInstancesOneOrgUnitWarningMessage: {
        defaultMessage:
            'Multiple reference submissions are using the same org units and same forms',
        id: 'iaso.instance.multipleReferenceInstancesOneOrgUnitWarningMessage',
    },
    noReferenceSubmissionsWarningMessage: {
        defaultMessage:
            '{selectedSubmissionsCount} selected submissions cannot become reference submissions (their form is not configured as a reference form for their respective org unit type)',
        id: 'iaso.instance.noReferenceSubmissionsWarningMessage',
    },
    linkReferenceSubmissionsConfirmMessage: {
        defaultMessage:
            'You selected {unLinkedCount} standard submissions. Please check this checkbox in order to link them to their respective org unit as a reference submission.',
        id: 'iaso.instance.linkReferenceSubmissionsConfirmMessage',
    },
    unLinkReferenceSubmissionsConfirmMessage: {
        defaultMessage:
            'You selected {linkedCount} reference submissions. Please check this checkbox in order to unlink them from their respective org unit and make them become standard submissions.',
        id: 'iaso.instance.unLinkReferenceSubmissionsConfirmMessage',
    },
    approveAllWarningsMessage: {
        defaultMessage:
            'All warnings must be approved before launching the locations push.',
        id: 'iaso.instance.approveAllWarningsMessage',
    },
    seeAll: {
        defaultMessage: 'See all',
        id: 'iaso.label.seeAll',
    },
    approve: {
        defaultMessage: 'Approve',
        id: 'iaso.label.approve',
    },
    launch: {
        id: 'iaso.label.launch',
        defaultMessage: 'Launch',
    },
    goToCurrentTask: {
        id: 'iaso.label.goToCurrentTask',
        defaultMessage: 'Launch and show task',
    },
    compare: {
        defaultMessage: 'Compare',
        id: 'iaso.label.compare',
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
        defaultMessage: 'Ready',
        id: 'iaso.label.instanceStatus.readyMulti',
    },
    error: {
        defaultMessage: 'Error',
        id: 'iaso.label.instanceStatus.errorSingleCap',
    },
    duplicated: {
        defaultMessage: 'Error (duplicated)',
        id: 'iaso.label.instanceStatus.duplicatedMulti',
    },
    exported: {
        defaultMessage: 'Exported',
        id: 'iaso.label.instanceStatus.exportedMulti',
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
    docs: {
        defaultMessage: 'Docs',
        id: 'iaso.label.docs',
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
        defaultMessage: 'Edit the answers in Enketo',
        id: 'iaso.instance.instanceEditAction',
    },
    instanceReAssignAction: {
        defaultMessage: 'Edit attached OrgUnit or period',
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
        defaultMessage: 'Create submission',
        id: 'iaso.instance.instanceCreateAction',
    },
    instanceCreationDialogTitle: {
        defaultMessage: 'Create submission',
        id: 'iaso.instance.instanceCreationDialogTitle',
    },
    deleteInstance: {
        defaultMessage: 'Delete instance(s)',
        id: 'iaso.instance.delete',
    },
    unDeleteInstance: {
        defaultMessage: 'Mark instance(s) as not deleted',
        id: 'iaso.instance.undelete',
    },
    deleteInstanceCount: {
        defaultMessage: 'Delete {count} instance(s)',
        id: 'iaso.instance.deleteCount',
    },
    unDeleteInstanceCount: {
        defaultMessage: 'Mark {count} instance(s) as not deleted',
        id: 'iaso.instance.unDeleteCount',
    },
    deleteInstanceWarning: {
        id: 'iaso.instance.deleteInstanceWarning',
        defaultMessage: 'This operation cannot be undone.',
    },
    noOrgUnitType: {
        id: 'iaso.instance.label.noOrgUnitType',
        defaultMessage: 'OrgUnit type not specified',
    },
    instanceHeaderTooltip: {
        id: 'iaso.instance.table.label.instanceHeaderTooltip',
        defaultMessage: 'Label: {label} - Name: {key}',
    },
    locationLimit: {
        id: 'iaso.map.locationLimit',
        defaultMessage: 'Map results limit',
    },
    creationDateFrom: {
        id: 'iaso.label.creationDateFrom',
        defaultMessage: 'Creation until',
    },
    creationDateTo: {
        id: 'iaso.label.creationDateTo',
        defaultMessage: 'Creation from',
    },
    periodType: {
        id: 'iaso.label.periodType',
        defaultMessage: 'Period type',
    },
    forms: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    textSearch: {
        id: 'iaso.forms.textSearch',
        defaultMessage: 'Text search',
    },
    deviceOwnership: {
        id: 'iaso.forms.deviceOwnership',
        defaultMessage: 'Device ownership',
    },
    showAdvancedSettings: {
        id: 'iaso.form.label.showAdvancedSettings',
        defaultMessage: 'Show advanced settings',
    },
    hideAdvancedSettings: {
        id: 'iaso.form.label.hideAdvancedSettings',
        defaultMessage: 'Hide advanced settings',
    },
    modificationDateFrom: {
        id: 'iaso.instances.modificationDateFrom',
        defineMessage: 'Modification date from',
    },
    modificationDateTo: {
        id: 'iaso.instances.modificationDateTo',
        defineMessage: 'Modification date to',
    },
    sentDateFrom: {
        id: 'iaso.instances.sentDateFrom',
        defineMessage: 'Sent date from',
    },
    sentDateTo: {
        id: 'iaso.instances.sentDateTo',
        defineMessage: 'Sent date to',
    },
    clear: {
        id: 'iaso.label.clear',
        defaultMessage: 'Clear',
    },
    showDeleted: {
        id: 'iaso.instances.showDeleted',
        defaultMessage: 'Show deleted',
    },
    org_unit_type_id: {
        id: 'iaso.forms.org_unit_type_id',
        defaultMessage: 'Org unit type',
    },
    startPeriod: {
        id: 'iaso.periods.start',
        defaultMessage: 'Start period',
    },
    endPeriod: {
        id: 'iaso.periods.end',
        defaultMessage: 'End period',
    },
    periodError: {
        id: 'iaso.formversions.chronologicalPeriodError',
        defaultMessage: 'Start period should be before end period',
    },
    restricted_results_by_orgunits: {
        id: 'iaso.restricted_results_by_orgunits',
        defaultMessage:
            'Your user can only see submissions for the following orgunits: ',
    },
    linkOrgUnitToInstanceReferenceWarning: {
        id: 'iaso.instance.linkOrgUnitToInstanceReferenceWarning',
        defaultMessage: 'This operation can still be undone',
    },
    linkOrgUnitToInstanceReferenceTitle: {
        id: 'iaso.instance.dialog.linkOrgUnitToInstanceReferenceTitle',
        defaultMessage:
            'Are you sure you want to link this submission to the orgUnit as a reference one ?',
    },
    linkOffOrgUnitToInstanceReferenceTitle: {
        id: 'iaso.instance.dialog.linkOffOrgUnitToInstanceReferenceTitle',
        defaultMessage:
            'Are you sure you want to unlink this reference submission from the orgUnit ?',
    },
    lockActionTooltip: {
        id: 'iaso.instance.lockActionTooltip',
        defaultMessage: 'Lock the instance',
    },
    lockAction: {
        id: 'iaso.instance.lockAction',
        defaultMessage: 'Lock the instance?',
    },
    removeLockAction: {
        id: 'iaso.instance.removeLockAction',
        defaultMessage: 'Open this lock',
    },
    lockedCanModify: {
        id: 'iaso.instance.dialog.lockedCanModify',
        defaultMessage:
            'Instance modification is locked for some users however you have the right to modify still modify it',
    },
    lockedCannotModify: {
        id: 'iaso.instance.dialog.lockedCannotModify',
        defaultMessage:
            'There is a lock on the instance and you cannot modify it',
    },
    lockSuccess: {
        id: 'iaso.instance.dialog.lockSuccess',
        defaultMessage: 'Lock added on the instance',
    },
    lockOpened: {
        id: 'iaso.instance.dialog.lockOpened',
        defaultMessage: 'This lock has been opened',
    },
    lockActionDescription: {
        id: 'iaso.instance.dialog.lockActionDescription',
        defaultMessage:
            'This will preventing modification on the instance by any user having lower access than you.',
    },
    lockActionExistingLockDescription: {
        id: 'iaso.instance.dialog.lockActionExistingLockDescription',
        defaultMessage:
            'This submission is already locked by one or mocked locks, locking again will add a supplementary lock.' +
            ' Use the unlock action in the lock table on the bottom right to remove the lock on the submission',
    },
    patchInstanceSuccesfull: {
        id: 'iaso.instance.patchInstanceSuccesfull',
        defaultMessage: 'Submission saved successfully',
    },
    patchInstanceError: {
        id: 'iaso.instance.patchInstanceError',
        defaultMessage: 'An error occurred while saving submission',
    },
    instanceLocks: {
        id: 'iaso.label.instanceLocks',
        defaultMessage: 'Instance locks',
    },
    lockAuthorLabel: {
        id: 'iaso.instance.lockAuthorLabel',
        defaultMessage: 'Author',
    },
    lockTopOrgUnitLabel: {
        id: 'iaso.instance.lockTopOrgUnitLabel',
        defaultMessage: 'High level org unit',
    },
    lockStatusLabel: {
        id: 'iaso.instance.lockStatusLabel',
        defaultMessage: 'Status',
    },
    lockedTitle: {
        id: 'iaso.instance.lockedTitle',
        defaultMessage: 'Locked',
    },
    unlockedTitle: {
        id: 'iaso.instance.unlockedTitle',
        defaultMessage: 'Unlocked',
    },
    NoLocksHistory: {
        defaultMessage: 'There is no locks History',
        id: 'iaso.instance.NoLocksHistory',
    },
    history: {
        id: 'iaso.label.history',
        defaultMessage: 'History',
    },
    onlyOneExistingVersion: {
        id: 'iaso.label.onlyOneExisitingVersion',
        defaultMessagbe: 'Only one existing version',
    },
    seeAllVersions: {
        id: 'iaso.label.seeAllVersions',
        defaultMessage: 'See all versions',
    },
    editLocationWithInstanceGps: {
        id: 'iaso.instances.editLocationWithInstanceGps',
        defaultMessage: 'Push GPS from submission',
    },
    editGpsFromInstanceTitle: {
        id: 'iaso.instance.dialog.editGpsFromInstanceTitle',
        defaultMessage:
            'Are you sure you want to apply GPS from submission into org unit. ?',
    },
    confirmApplyFormGpsToOrgUnit: {
        id: 'iaso.label.confirmApplyFormGpsToOrgUnit',
        defaultMessage: 'Apply directly gps from form to org unit',
    },
    editGpsFromInstanceWarning: {
        id: 'iaso.instance.editGpsFromInstanceWarning',
        defaultMessage: 'This operation can still be undone',
    },
    queryBuilder: {
        id: 'iaso.instance.queryBuilder',
        defaultMessage: 'Search in submitted fields',
    },
    initialPeriodError: {
        id: 'iaso.instance.initialPeriodError',
        defaultMessage: 'Current period on submission is invalid: {period}',
    },
    disableColumnSelectionMessage: {
        id: 'iaso.instance.disableColumnSelectionMessage',
        defaultMessage: 'Apply search to be able to select visible columns',
    },
    altitude: {
        id: 'iaso.label.altitude',
        defaultMessage: 'Altitude',
    },
    accuracy: {
        id: 'iaso.label.accuracy',
        defaultMessage: 'Accuracy',
    },
    fromOrgUnit: {
        id: 'iaso.label.fromOrgunit',
        defaultMessage: '(from Org Unit)',
    },
    created_by: {
        id: 'iaso.label.created_by',
        defaultMessage: 'Created  by',
    },
    planning: {
        id: 'iaso.label.planning',
        defaultMessage: 'Planning',
    },
    created_by__username: {
        id: 'iaso.instances.label.created_by__username',
        defaultMessage: 'Created by',
    },
    user: {
        id: 'iaso.label.user',
        defaultMessage: 'User',
    },
    formSubmissionLinkLabel: {
        id: 'iaso.label.formSubmissionLinkLabel',
        defaultMessage: 'Link to form submission',
    },
    filterParam: {
        id: 'iaso.submissions.filterParam',
        defaultMessage: 'Select a form to enable data download',
    },
    searchSubmissionFormsParamsInfo: {
        id: 'iaso.submissions.searchSubmissionFormsParamsInfo',
        defaultMessage:
            'Select one form to enable search using form submitted fields',
    },
    entityInfo: {
        defaultMessage: 'Entity information',
        id: 'iaso.entities.label.entityInfo',
    },
    projects: {
        id: 'iaso.label.projects',
        defaultMessage: 'Projects',
    },
    project_name: {
        id: 'iaso.label.project',
        defaultMessage: 'Project',
    },
    org_unit_type_name: {
        id: 'iaso.instance.org_unit_type_name',
        defaultMessage: 'Org unit type',
    },
    org_unit_name: {
        id: 'iaso.instance.org_unit',
        defaultMessage: 'Org unit',
    },
    parent: {
        id: 'iaso.label.parent',
        defaultMessage: 'Parent',
    },
    changeRequests: {
        defaultMessage: 'Change requests',
        id: 'iaso.label.changeRequests',
    },
    new: {
        defaultMessage: 'New',
        id: 'iaso.forms.newCap',
    },
    rejected: {
        defaultMessage: 'Rejected',
        id: 'iaso.forms.rejectedCap',
    },
    approved: {
        defaultMessage: 'Approved',
        id: 'iaso.label.approved',
    },
    disabledReason: {
        defaultMessage:
            'Change request is not available as submission is deleted',
        id: 'iaso.instances.disabledReason',
    },
    close: {
        defaultMessage: 'Close',
        id: 'blsq.buttons.label.close',
    },
    searchParams: {
        defaultMessage:
            'Use prefix “ids:” for internal submissions ID search. You can also search multiple IDs at once, separated by a comma or a space. E.g. “ids: 123456, 654321” or “ids: 123456 654321”',
        id: 'iaso.instances.searchParams',
    },
    orgunitreferenceinstance: {
        id: 'iaso.label.orgunitreferenceinstance',
        defaultMessage: 'Reference submission',
    },
    searchToSeeSubmissions: {
        id: 'iaso.forms.searchToSeeSubmissions',
        defaultMessage: 'Click "Search" button to see submissions',
    },
});

export default MESSAGES;

import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    pages: {
        defaultMessage: 'Pages',
        id: 'iaso.pages.title',
    },
    detailTitle: {
        defaultMessage: 'Form',
        id: 'iaso.instance.formShort',
    },
    statsTitle: {
        defaultMessage: 'Form Stats',
        id: 'iaso.forms.stats.title',
    },
    createForm: {
        defaultMessage: 'Create form',
        id: 'iaso.forms.create',
    },
    createFormVersion: {
        defaultMessage: 'Create version',
        id: 'iaso.formversions.create',
    },
    noForm: {
        defaultMessage: 'No form',
        id: 'iaso.orgUnits.forms.noData',
    },
    addForm: {
        id: 'iaso.orgUnits.addForm',
        defaultMessage: 'Add form',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    name: {
        id: 'iaso.forms.name',
        defaultMessage: 'Name',
    },
    org_unit_type_id: {
        id: 'iaso.forms.org_unit_type_id',
        defaultMessage: 'Org unit type',
    },
    sourceorigin: {
        id: 'iaso.label.sourceorigin',
        defaultMessage: 'Origin source',
    },
    source: {
        id: 'iaso.forms.source',
        defaultMessage: 'Source',
    },
    parent: {
        defaultMessage: 'Parent(s)',
        id: 'iaso.orgUnits.parentsMulti',
    },
    level: {
        id: 'iaso.forms.level',
        defaultMessage: 'Level',
    },
    source_ref: {
        id: 'iaso.forms.source_ref',
        defaultMessage: 'External reference',
    },
    viewInstances: {
        id: 'iaso.forms.viewInstances',
        defaultMessage: 'View submission(s)',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    update: {
        id: 'iaso.forms.update',
        defaultMessage: 'Update form',
    },
    deleted_at: {
        id: 'iaso.forms.deleted_at',
        defaultMessage: 'Deleted',
    },
    updateFormVersion: {
        id: 'iaso.formversions.update',
        defaultMessage: 'Update version {version_id}',
    },
    dhis2Mappings: {
        id: 'iaso.label.dhis2Mappings',
        defaultMessage: 'DHIS mappings',
    },
    deleteFormTitle: {
        id: 'iaso.forms.dialog.deleteFormTitle',
        defaultMessage: 'Are you sure you want to delete this form?',
    },
    deleteFormText: {
        id: 'iaso.forms.dialog.deleteFormText',
        defaultMessage: 'This operation cannot be undone.',
    },
    restoreFormTooltip: {
        defaultMessage: 'Restore form',
        id: 'iaso.forms.restore.tooltip',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
    latest_version_files: {
        defaultMessage: 'Latest version',
        id: 'iaso.forms.latest_version_files',
    },
    form_id: {
        defaultMessage: 'Form id',
        id: 'iaso.forms.form_id',
    },
    type: {
        defaultMessage: 'Type',
        id: 'iaso.forms.type',
    },
    records: {
        defaultMessage: 'Submissions',
        id: 'iaso.forms.records',
    },
    instance_updated_at: {
        id: 'iaso.forms.instance_updated_at',
        defaultMessage: 'Last submission',
    },
    updated_at: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    subSource: {
        id: 'iaso.forms.subSource',
        defaultMessage: 'Sub-Source',
    },
    snis: {
        id: 'iaso.forms.source.snis',
        defaultMessage: 'SNIS',
    },
    ucla: {
        id: 'iaso.forms.source.ucla',
        defaultMessage: 'UCLA',
    },
    pnltha: {
        id: 'iaso.forms.source.pnltha',
        defaultMessage: 'PNLTHA',
    },
    derivated: {
        id: 'iaso.forms.source.derivated',
        defaultMessage: 'Derivated from actual data',
    },
    aliases: {
        id: 'iaso.forms.aliases',
        defaultMessage: 'Aliases',
    },
    status: {
        id: 'iaso.forms.status',
        defaultMessage: 'Status',
    },
    validationStatus: {
        id: 'iaso.forms.validationStatus',
        defaultMessage: 'Validation status',
    },
    showDeleted: {
        id: 'iaso.forms.showDeleted',
        defaultMessage: 'Show deleted',
    },
    hasInstances: {
        id: 'iaso.forms.hasInstances',
        defaultMessage: 'Form submissions',
    },
    yes: {
        id: 'iaso.forms.yes',
        defaultMessage: 'Yes',
    },
    no: {
        id: 'iaso.forms.no',
        defaultMessage: 'No',
    },
    validated: {
        id: 'iaso.forms.validated',
        defaultMessage: 'Validated',
    },
    rejected: {
        id: 'iaso.forms.rejectedCap',
        defaultMessage: 'Rejected',
    },
    notValidated: {
        id: 'iaso.forms.notValidated',
        defaultMessage: 'Not validated',
    },
    both: {
        id: 'iaso.forms.both',
        defaultMessage: 'Validated and not validated',
    },
    all: {
        id: 'iaso.forms.all',
        defaultMessage: 'All',
    },
    new: {
        id: 'iaso.forms.newCap',
        defaultMessage: 'New',
    },
    Prov: {
        id: 'iaso.province',
        defaultMessage: 'Province',
    },
    ZS: {
        id: 'iaso.zone',
        defaultMessage: 'Health zone',
    },
    AS: {
        id: 'iaso.area',
        defaultMessage: 'Health area',
    },
    'Hosp.': {
        id: 'iaso.hospital',
        defaultMessage: 'Hospital',
    },
    CDS: {
        id: 'iaso.CDS',
        defaultMessage: 'Health centre',
    },
    SSC: {
        id: 'iaso.SSC',
        defaultMessage: 'Community Health Site',
    },
    with: {
        id: 'iaso.label.with',
        defaultMessage: 'With',
    },
    without: {
        id: 'iaso.label.without',
        defaultMessage: 'Without',
    },
    duplicates: {
        id: 'iaso.label.duplicates',
        defaultMessage: 'Duplicates',
    },
    device: {
        id: 'iaso.forms.device',
        defaultMessage: 'Device',
    },
    deviceOwnership: {
        id: 'iaso.forms.deviceOwnership',
        defaultMessage: 'Device ownership',
    },
    validator: {
        id: 'iaso.label.validator',
        defaultMessage: 'Validator',
    },
    algo: {
        id: 'iaso.label.algorithm',
        defaultMessage: 'Algorithm',
    },
    algoRun: {
        id: 'iaso.label.algorithmsRuns',
        defaultMessage: 'Algorithms runs',
    },
    score: {
        id: 'iaso.label.similarity_score',
        defaultMessage: 'Similarity score',
    },
    locationLimit: {
        id: 'iaso.map.locationLimit',
        defaultMessage: 'Map results limit',
    },
    short_name: {
        id: 'iaso.orgUnits.shortName',
        defaultMessage: 'Short name',
    },
    parent_name: {
        id: 'iaso.orgUnits.parent_name',
        defaultMessage: 'Parent name',
    },
    org_unit_type_name: {
        id: 'iaso.orgUnits.orgUnitsTypes',
        defaultMessage: 'Organisation unit type',
    },
    latitude: {
        id: 'iaso.label.latitude',
        defaultMessage: 'Latitude',
    },
    longitude: {
        id: 'iaso.label.longitude',
        defaultMessage: 'Longitude',
    },
    geo_json: {
        id: 'iaso.label.geo_json',
        defaultMessage: 'Geo json shape',
    },
    profile: {
        id: 'iaso.label.user',
        defaultMessage: 'User',
    },
    version: {
        id: 'iaso.label.version',
        defaultMessage: 'Version',
    },
    versions: {
        id: 'iaso.label.versions',
        defaultMessage: 'Versions',
    },
    catchment: {
        id: 'iaso.label.catchment',
        defaultMessage: 'Catchment',
    },
    simplified_geom: {
        id: 'iaso.forms.shape',
        defaultMessage: 'Shape',
    },
    group: {
        id: 'iaso.label.group',
        defaultMessage: 'Group',
    },
    groups: {
        id: 'iaso.label.groups',
        defaultMessage: 'Groups',
    },
    periods: {
        id: 'iaso.label.periods',
        defaultMessage: 'Periods',
    },
    year: {
        id: 'iaso.label.year',
        defaultMessage: 'Years',
    },
    quarter: {
        id: 'iaso.label.quarter',
        defaultMessage: 'Quarter',
    },
    month: {
        id: 'iaso.label.month',
        defaultMessage: 'Month',
    },
    six_month: {
        id: 'iaso.label.six_month',
        defaultMessage: 'Semester',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    xls_form_file: {
        id: 'iaso.label.xls_form_file',
        defaultMessage: 'XLSForm file',
    },
    periodType: {
        id: 'iaso.label.periodType',
        defaultMessage: 'Period type',
    },
    periodsBeforeAllowed: {
        id: 'iaso.label.periodsBeforeAllowed',
        defaultMessage: 'Allowed periods before',
    },
    periodsAfterAllowed: {
        id: 'iaso.label.periodsAfterAllowed',
        defaultMessage: 'Allowed periods after',
    },
    singlePerPeriod: {
        id: 'iaso.label.singlePerPeriod',
        defaultMessage: 'Single per period',
    },
    projects: {
        id: 'iaso.label.projects',
        defaultMessage: 'Projects',
    },
    shape: {
        id: 'iaso.forms.shape',
        defaultMessage: 'Shape',
    },
    location: {
        id: 'iaso.forms.location',
        defaultMessage: 'Location',
    },
    orgUnitsTypes: {
        id: 'iaso.label.orgUnitsTypes',
        defaultMessage: 'Org unit types',
    },
    deviceField: {
        id: 'iaso.label.deviceField',
        defaultMessage: 'Device field',
    },
    locationField: {
        id: 'iaso.label.locationField',
        defaultMessage: 'Location field',
    },
    derived: {
        id: 'iaso.label.derived',
        defaultMessage: 'Deduced from another form',
    },
    displayPassword: {
        id: 'iaso.label.displayPassword',
        defaultMessage: 'Display the pasword',
    },
    noOptions: {
        id: 'iaso.label.noOptions',
        defaultMessage: 'No result found',
    },
    planning: {
        id: 'iaso.label.planning',
        defaultMessage: 'Planning',
    },
    textSearch: {
        id: 'iaso.forms.textSearch',
        defaultMessage: 'Text search',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.label.search',
    },
    from: {
        id: 'iaso.label.from',
        defaultMessage: 'From',
    },
    to: {
        id: 'iaso.label.to',
        defaultMessage: 'to',
    },
    onlyDirectChildren: {
        id: 'iaso.orgUnits.onlyDirectChildren',
        defaultMessage: 'Only Direct children',
    },
    launcher: {
        defaultMessage: 'Launcher',
        id: 'iaso.label.launcher',
    },
    sourceoriginversion: {
        id: 'iaso.label.sourceoriginversion',
        defaultMessage: 'Origin source version',
    },
    sourcedestination: {
        id: 'iaso.label.sourcedestination',
        defaultMessage: 'Destination source',
    },
    sourcedestinationversion: {
        id: 'iaso.label.sourcedestinationversion',
        defaultMessage: 'Destination source version',
    },
    startPeriod: {
        id: 'iaso.label.startPeriod',
        defaultMessage: 'Start period',
    },
    endPeriod: {
        id: 'iaso.label.endPeriod',
        defaultMessage: 'end period',
    },
    singlePerPeriodSelect: {
        id: 'iaso.form.label.singlePerPeriodSelect',
        defaultMessage: 'Please select an answer',
    },
    fields: {
        id: 'iaso.form.label.fields',
        defaultMessage: 'Default fields to display',
    },
    showAdvancedSettings: {
        id: 'iaso.form.label.showAdvancedSettings',
        defaultMessage: 'Show advanced settings',
    },
    hideAdvancedSettings: {
        id: 'iaso.form.label.hideAdvancedSettings',
        defaultMessage: 'Hide advanced settings',
    },
    withShape: {
        id: 'iaso.label.withShape',
        defaultMessage: 'With territory only',
    },
    withLocation: {
        id: 'iaso.label.withLocation',
        defaultMessage: 'With point only',
    },
    anyGeography: {
        id: 'iaso.label.anyGeography',
        defaultMessage: 'With point or territory',
    },
    geographicalData: {
        id: 'iaso.label.geographicalData',
        defaultMessage: 'Geographical data',
    },
    noGeographicalData: {
        id: 'iaso.label.noGeographicalData',
        defaultMessage: 'Without geography',
    },
    validateXlsForm: {
        id: 'iaso.label.validateXLSForm',
        defaultMessage: 'Validate your Form beforehand using the ',
    },
    validateXLSFormLink: {
        id: 'iaso.label.validateXLSFormLink',
        defaultMessage: 'online tool',
    },
    sources: {
        id: 'iaso.label.sources',
        defaultMessage: 'Sources',
    },
    noSources: {
        id: 'iaso.orgUnits.sources.noData',
        defaultMessage: 'No source',
    },
    addSource: {
        id: 'iaso.orgUnits.addSource',
        defaultMessage: 'Add source',
    },
    sourcesHelperText: {
        id: 'iaso.orgUnits.sourcesHelperText',
        defaultMessage: 'Linked org units',
    },
    formsHelperText: {
        id: 'iaso.orgUnits.formsHelperText',
        defaultMessage: 'Form submissions',
    },
    downloadXml: {
        id: 'iaso.label.downloadXml',
        defaultMessage: 'Download XML',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    forbiddenChars: {
        id: 'iaso.label.forbiddenChars',
        defaultMessage: 'Forbidden characters: "&", "/","?"," "" " and "%"',
    },
    formChangeLog: {
        id: 'iaso.form.label.formChangeLog',
        defaultMessage: 'Link to changes log',
    },
    attachments: {
        id: 'iaso.form.attachments',
        defaultMessage: 'Attachments',
    },
    attachment: {
        id: 'iaso.form.attachment',
        defaultMessage: 'Attachment',
    },
    file: {
        id: 'iaso.instance.file',
        defaultMessage: 'File',
    },
    deleteAttachment: {
        id: 'iaso.label.deleteAttachment',
        defaultMessage: 'Delete attachment : {attachmentName}',
    },
    deleteWarning: {
        id: 'iaso.label.deleteWarning',
        defaultMessage: 'Are you sure you want to delete {name}?',
    },
    download: {
        id: 'iaso.label.download',
        defaultMessage: 'Download',
    },
    confirm: {
        id: 'iaso.mappings.confirm',
        defaultMessage: 'Confirm',
    },
    addUpdate: {
        id: 'iaso.form.addUpdate',
        defaultMessage: 'Add / Update',
    },
    attachmentModalTitle: {
        id: 'iaso.attachments.attachmentModalTitle',
        defaultMessage: 'Upload file',
    },
    attachmentModalContent: {
        id: 'iaso.attachments.attachmentModalContent',
        defaultMessage:
            'If a file with the same name already exists, it will be overridden. Once a file is overridden, it cannot be recovered',
    },
    uploadError: {
        id: 'iaso.attachments.uploadError',
        defaultMessage: 'Error uploading file',
    },
    uploadSuccess: {
        id: 'iaso.attachments.uploadSuccess',
        defaultMessage: 'File uploaded successfully',
    },
    addSubmissionForForm: {
        id: 'iaso.forms.addSubmissionForForm',
        defaultMessage: 'Add a submission for this form',
    },
    instanceCreationDialogTitle: {
        defaultMessage: 'Create submission',
        id: 'iaso.instance.instanceCreationDialogTitle',
    },
    geom: {
        id: 'iaso.forms.geom',
        defaultMessage: 'Coordinates',
    },
    path: {
        id: 'iaso.forms.path',
        defaultMessage: 'Path',
    },
    custom: {
        id: 'iaso.forms.custom',
        defaultMessage: 'Custom',
    },
    creator: {
        id: 'iaso.forms.creator',
        defaultMessage: 'Creator',
    },
    geom_ref: {
        id: 'iaso.forms.geom_ref',
        defaultMessage: 'Reference coordinates',
    },
    gps_source: {
        id: 'iaso.forms.gps_source',
        defaultMessage: 'Gps source',
    },
    sub_source: {
        id: 'iaso.forms.sub_source',
        defaultMessage: 'Sub source',
    },
    org_unit_type: {
        id: 'iaso.forms.org_unit_type',
        defaultMessage: 'Organisation unit type',
    },
    validation_status: {
        id: 'iaso.forms.validation_status',
        defaultMessage: 'Status',
    },
});

export default MESSAGES;

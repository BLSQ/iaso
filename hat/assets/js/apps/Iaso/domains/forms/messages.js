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
        defaultMessage: 'Created at',
    },
    update: {
        id: 'iaso.forms.update',
        defaultMessage: 'Update form',
    },
    deleted_at: {
        id: 'iaso.forms.deleted_at',
        defaultMessage: 'Deleted at',
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
        defaultMessage: 'Record(s)',
        id: 'iaso.forms.records',
    },
    instance_updated_at: {
        id: 'iaso.forms.instance_updated_at',
        defaultMessage: 'Last submission',
    },
    updated_at: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated at',
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
    showDeleted: {
        id: 'iaso.forms.showDeleted',
        defaultMessage: 'Show deleted',
    },
    hasInstances: {
        id: 'iaso.forms.hasInstances',
        defaultMessage: 'Forms',
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
        id: 'iaso.forms.rejected',
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
        id: 'iaso.forms.new',
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
    shape: {
        id: 'iaso.forms.shape',
        defaultMessage: 'Shape',
    },
    location: {
        id: 'iaso.forms.location',
        defaultMessage: 'Location',
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
    orgUnitsTypes: {
        id: 'iaso.label.orgUnitsTypes',
        defaultMessage: 'Organisation unit types',
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
        defaultMessage: 'No results found',
    },
    textSearch: {
        id: 'iaso.forms.textSearch',
        defaultMessage: 'Text search',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.label.search',
    },
    selectParentOrgUnit: {
        defaultMessage: 'Select parent Org Unit',
        id: 'iaso.label.selectParentOrgUnit',
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
});

export default MESSAGES;

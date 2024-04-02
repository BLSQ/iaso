import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    view: {
        defaultMessage: 'View',
        id: 'iaso.label.view',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    version: {
        defaultMessage: 'Version',
        id: 'iaso.label.version',
    },
    type: {
        defaultMessage: 'Type',
        id: 'iaso.label.type',
    },
    mappedQuestions: {
        defaultMessage: 'Mapped questions',
        id: 'iaso.mappings.mapped_questions',
    },
    totalQuestions: {
        defaultMessage: 'Total questions',
        id: 'iaso.mappings.total_questions',
    },
    coverage: {
        defaultMessage: 'Coverage',
        id: 'iaso.mappings.coverage',
    },
    updatedAt: {
        defaultMessage: 'Updated',
        id: 'iaso.label.updated_at',
    },
    dhis2Mappings: {
        defaultMessage: 'DHIS mappings',
        id: 'iaso.label.dhis2Mappings',
    },
    mappingType: {
        id: 'iaso.mapping.mappingType',
        defaultMessage: 'Mapping type',
    },
    event: {
        defaultMessage: 'Event',
        id: 'iaso.label.mappingType.event',
    },
    aggregate: {
        defaultMessage: 'Aggregate',
        id: 'iaso.label.mappingType.aggregate',
    },
    eventTracker: {
        defaultMessage: 'Event Tracker',
        id: 'iaso.label.mappingType.eventTracker',
    },
    add: {
        defaultMessage: 'Add',
        id: 'iaso.label.add',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.label.cancel',
    },
    createMapping: {
        id: 'iaso.mappings.create',
        defaultMessage: 'Create Mapping',
    },
    trackerEntityIdentifier: {
        id: 'iaso.mappings.trackerEntityIdentifier',
        defaultMessage: 'Tracked entity identitifier',
    },
    currentMapping: {
        id: 'iaso.mappings.currentMapping',
        defaultMessage: 'Current mapping',
    },
    removeMapping: {
        id: 'iaso.mappings.removeMapping',
        defaultMessage: 'Remove mapping',
    },
    willNeverMap: {
        id: 'iaso.mappings.willNeverMap',
        defaultMessage: 'Will never map',
    },
    neverMapAlert: {
        id: 'iaso.mappings.neverMapAlert',
        defaultMessage:
            'This question is considered to be never mapped but you can{breakLine}change your mind',
    },
    changeMapping: {
        id: 'iaso.mappings.changeMapping',
        defaultMessage: 'Change the mapping to existing one :',
    },
    searchDataElement: {
        id: 'iaso.mappings.label.searchDataElement',
        defaultMessage:
            'Search for data element (and combo) by name, code or id',
    },
    useInstanceProperty: {
        id: 'iaso.mappings.useInstanceProperty',
        defaultMessage: 'Use instance property to fill in this answer',
    },
    proposedNewOne: {
        id: 'iaso.mappings.proposedNewOne',
        defaultMessage: 'Proposed new one :',
    },
    confirm: {
        id: 'iaso.mappings.confirm',
        defaultMessage: 'Confirm',
    },
    loading: {
        id: 'iaso.mappings.label.loading',
        defaultMessage: 'Loading',
    },
    mapping: {
        id: 'iaso.mappings.label.mapping',
        defaultMessage: 'Mapping: {name}, {id} - {type}',
    },
    searchTrackedEntity: {
        id: 'iaso.mappings.label.searchTrackedEntity',
        defaultMessage: 'Search for tracked entity type attribute',
    },
    searchTracker: {
        id: 'iaso.mappings.label.searchTracker',
        defaultMessage:
            'Search for tracker data element (and combo) by name, code or id',
    },
    source: {
        id: 'iaso.mappings.label.source',
        defaultMessage: 'Source',
    },
    formVersion: {
        id: 'iaso.mappings.label.formVersion',
        defaultMessage: 'Form version',
    },
    dataset: {
        id: 'iaso.mappings.label.dataset',
        defaultMessage: 'Dataset',
    },
    program: {
        id: 'iaso.mappings.label.program',
        defaultMessage: 'Program',
    },
    relationshipType: {
        id: 'iaso.mappings.label.relationshipType',
        defaultMessage: 'Relationship type',
    },
    atLeastAMapping: {
        id: 'iaso.mappings.label.atLeastAMapping',
        defaultMessage: 'at least a mapping',
    },
    noMapping: {
        id: 'iaso.mappings.label.noMapping',
        defaultMessage: 'no mapping',
    },
    duplicateMappingAlert: {
        id: 'iaso.mappings.label.duplicateMappingAlert',
        defaultMessage: 'Duplicate mapping ! Will be used in both {duplicates}',
    },
    proposedNewMapping: {
        id: 'iaso.mappings.label.proposedNewMapping',
        defaultMessage: 'Proposed new mapping',
    },
    hesabuHint: {
        id: 'iaso.mappings.label.hesabuHint',
        defaultMessage: 'Hesabu hint, this element is used by',
    },
    options: {
        id: 'iaso.mappings.label.options',
        defaultMessage: 'Options :',
    },
    useValueFromForm: {
        id: 'iaso.mappings.label.useValueFromForm',
        defaultMessage: "Use the value from the form's answer",
    },
    instanceOrgUnit: {
        id: 'iaso.mappings.label.instanceOrgUnit',
        defaultMessage: 'Instance orgunit',
    },
    trackedEntityAttribute: {
        id: 'iaso.mappings.label.trackedEntityAttribute',
        defaultMessage: 'Tracked Entity Attribute',
    },
    programDataElement: {
        id: 'iaso.mappings.label.programDataElement',
        defaultMessage: 'Program data element',
    },
    eventDateSource: {
        id : 'iaso.mappings.label.eventDateSource',
        defaultMessage: "Event date source"
    },
    fromSubmissionCreatedAt: {
        id : 'iaso.mappings.label.fromSubmissionCreatedAt',
        defaultMessage: "from submission's created at"
    },
    fromSubmissionPeriod: {
        id : 'iaso.mappings.label.fromSubmissionPeriod',
        defaultMessage: "from submission's period"
    },
    generalHint: {
        id: "iaso.mappings.label.generalHint",
        defaultMessage: "Click in the tree on the left to map questions to dhis2 data elements or verify their aggregations."
    },
    generalTitle: {
        id: "iaso.mappings.label.generalTitle",
        defaultMessage: "General informations"
    }
});

export default MESSAGES;

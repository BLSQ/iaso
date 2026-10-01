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
        defaultMessage: 'DHIS2 mappings',
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
        id: 'iaso.mappings.label.eventDateSource',
        defaultMessage: 'Event date source',
    },
    fromSubmissionCreatedAt: {
        id: 'iaso.mappings.label.fromSubmissionCreatedAt',
        defaultMessage: "from submission's created at",
    },
    fromSubmissionPeriod: {
        id: 'iaso.mappings.label.fromSubmissionPeriod',
        defaultMessage: "from submission's period",
    },
    generalHint: {
        id: 'iaso.mappings.label.generalHint',
        defaultMessage:
            'Click in the tree on the left to map questions to dhis2 data elements or verify their aggregations.',
    },
    generalTitle: {
        id: 'iaso.mappings.label.generalTitle',
        defaultMessage: 'General informations',
    },
    update: {
        id: 'iaso.mappings.label.update',
        defaultMessage: 'Update',
    },
    orgUnitsTypes: {
        id: 'iaso.label.orgUnitsTypes',
        defaultMessage: 'Org unit types',
    },
    projects: {
        id: 'iaso.label.projects',
        defaultMessage: 'Projects',
    },
    forms: {
        id: 'iaso.label.forms',
        defaultMessage: 'Forms',
    },
    search: {
        id: 'iaso.search',
        defaultMessage: 'Search',
    },
    startTypingDataset: {
        id: 'iaso.mappings.startTypingDataset',
        defaultMessage: 'Start typing to search by dataset name in dhis2',
    },
    startTypingFormVersion: {
        id: 'iaso.mappings.startTypingFormVersion',
        defaultMessage: "Start typing to search by form's name or version id",
    },
    importMappings: {
        id: 'iaso.mappings.import.title',
        defaultMessage: 'Import mappings',
    },
    exportMappings: {
        id: 'iaso.mappings.export',
        defaultMessage: 'Export mappings',
    },
    undoImport: {
        id: 'iaso.mappings.import.undo',
        defaultMessage: 'Undo import',
    },
    importUndone: {
        id: 'iaso.mappings.import.undone',
        defaultMessage: 'Import undone',
    },
    importPickSource: {
        id: 'iaso.mappings.import.pickSource',
        defaultMessage:
            'Pick the mappings to reuse. Nothing is applied until you confirm.',
    },
    importVersionTitle: {
        id: 'iaso.mappings.import.versionTitle',
        defaultMessage: 'Version {versionId}',
    },
    importOtherFormTitle: {
        id: 'iaso.mappings.import.otherFormTitle',
        defaultMessage: '{formName} - {versionId}',
    },
    importSameFormMeta: {
        id: 'iaso.mappings.import.sameFormMeta',
        defaultMessage: 'Same form, last updated {date}',
    },
    importOtherFormDatasetMeta: {
        id: 'iaso.mappings.import.otherFormDatasetMeta',
        defaultMessage: 'Another form, same DHIS2 dataset, last updated {date}',
    },
    importOtherFormProgramMeta: {
        id: 'iaso.mappings.import.otherFormProgramMeta',
        defaultMessage: 'Another form, same DHIS2 program, last updated {date}',
    },
    importFileMeta: {
        id: 'iaso.mappings.import.fileMeta',
        defaultMessage: 'Exported from {formName} - {versionId}',
    },
    importMappingsCount: {
        id: 'iaso.mappings.import.mappingsCount',
        defaultMessage: '{count} mappings',
    },
    importMatchCount: {
        id: 'iaso.mappings.import.matchCount',
        defaultMessage: '{matching} / {total} match this version',
    },
    importNoSource: {
        id: 'iaso.mappings.import.noSource',
        defaultMessage:
            'No other mapping version uses this data source with the same DHIS2 dataset or program.',
    },
    importFromFile: {
        id: 'iaso.mappings.import.fromFile',
        defaultMessage:
            'Or import a mapping export (.json), for example from another account.',
    },
    chooseFile: {
        id: 'iaso.mappings.import.chooseFile',
        defaultMessage: 'Choose a file',
    },
    importInvalidJson: {
        id: 'iaso.mappings.import.invalidJson',
        defaultMessage: 'This file is not valid JSON.',
    },
    importInvalidFormat: {
        id: 'iaso.mappings.import.invalidFormat',
        defaultMessage: 'This file is not a mapping export.',
    },
    importMappingTypeMismatch: {
        id: 'iaso.mappings.import.mappingTypeMismatch',
        defaultMessage: 'This export was made for another mapping type.',
    },
    compare: {
        id: 'iaso.label.compare',
        defaultMessage: 'Compare',
    },
    back: {
        id: 'iaso.label.back',
        defaultMessage: 'Back',
    },
    applyChanges: {
        id: 'iaso.mappings.import.applyChanges',
        defaultMessage: 'Apply {count} changes',
    },
    compareLabel: {
        id: 'iaso.mappings.import.compareLabel',
        defaultMessage:
            'Comparing {source} with version {versionId}. Nothing is applied until you confirm.',
    },
    bucketConflict: {
        id: 'iaso.mappings.import.bucket.conflict',
        defaultMessage: 'Conflicts ({count})',
    },
    bucketAdd: {
        id: 'iaso.mappings.import.bucket.add',
        defaultMessage: 'To add ({count})',
    },
    bucketIdentical: {
        id: 'iaso.mappings.import.bucket.identical',
        defaultMessage: 'Identical ({count})',
    },
    bucketDropped: {
        id: 'iaso.mappings.import.bucket.dropped',
        defaultMessage: 'Dropped ({count})',
    },
    resolveAllConflicts: {
        id: 'iaso.mappings.import.resolveAllConflicts',
        defaultMessage: 'Resolve all conflicts:',
    },
    keepEverywhere: {
        id: 'iaso.mappings.import.keepEverywhere',
        defaultMessage: 'Keep current everywhere',
    },
    overwriteEverywhere: {
        id: 'iaso.mappings.import.overwriteEverywhere',
        defaultMessage: 'Overwrite everywhere',
    },
    allAdditions: {
        id: 'iaso.mappings.import.allAdditions',
        defaultMessage: 'All additions:',
    },
    addAll: {
        id: 'iaso.mappings.import.addAll',
        defaultMessage: 'Add all',
    },
    skipAll: {
        id: 'iaso.mappings.import.skipAll',
        defaultMessage: 'Skip all',
    },
    identicalHint: {
        id: 'iaso.mappings.import.identicalHint',
        defaultMessage: 'Same DHIS2 target on both sides. Nothing to resolve.',
    },
    droppedHint: {
        id: 'iaso.mappings.import.droppedHint',
        defaultMessage:
            'These mappings cannot be imported: the question does not exist in this version, or the mapping is not valid for this mapping type.',
    },
    question: {
        id: 'iaso.label.question',
        defaultMessage: 'Question',
    },
    incomingMapping: {
        id: 'iaso.mappings.import.incomingMapping',
        defaultMessage: 'Incoming mapping',
    },
    decision: {
        id: 'iaso.mappings.import.decision',
        defaultMessage: 'Decision',
    },
    keep: {
        id: 'iaso.mappings.import.keep',
        defaultMessage: 'Keep',
    },
    overwrite: {
        id: 'iaso.mappings.import.overwrite',
        defaultMessage: 'Overwrite',
    },
    skip: {
        id: 'iaso.mappings.import.skip',
        defaultMessage: 'Skip',
    },
    noChange: {
        id: 'iaso.mappings.import.noChange',
        defaultMessage: 'No change',
    },
    notImportable: {
        id: 'iaso.mappings.import.notImportable',
        defaultMessage: 'Not importable',
    },
    questionAbsent: {
        id: 'iaso.mappings.import.questionAbsent',
        defaultMessage: 'Question absent from version {versionId}',
    },
    markedNeverMapped: {
        id: 'iaso.mappings.import.markedNeverMapped',
        defaultMessage: 'Marked as never mapped',
    },
    importSummary: {
        id: 'iaso.mappings.import.summary',
        defaultMessage:
            '{added} to add, {overwritten} to overwrite, {ignored} not imported',
    },
    importDone: {
        id: 'iaso.mappings.import.done',
        defaultMessage:
            '{added} mappings added, {overwritten} overwritten, {kept} kept, {ignored} not imported',
    },
    importInvalidMapping: {
        id: 'iaso.mappings.import.invalidMapping',
        defaultMessage: 'Not valid for a {type} mapping',
    },
    importNoValidMapping: {
        id: 'iaso.mappings.import.noValidMapping',
        defaultMessage:
            'This file contains no mapping valid for a {type} mapping.',
    },
    importOtherDataset: {
        id: 'iaso.mappings.import.otherDataset',
        defaultMessage:
            'This export was made for another DHIS2 dataset ({name}). Check that its data elements belong to this one.',
    },
    importOtherProgram: {
        id: 'iaso.mappings.import.otherProgram',
        defaultMessage:
            'This export was made for another DHIS2 program ({name}). Check that its data elements belong to this one.',
    },
});

export default MESSAGES;

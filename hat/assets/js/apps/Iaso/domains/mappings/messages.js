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
});

export default MESSAGES;

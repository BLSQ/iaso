import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    duplicates: {
        id: 'iaso.label.duplicates',
        defaultMessage: 'Duplicates',
    },
    similarityScore: {
        id: 'iaso.label.similarity_score',
        defaultMessage: 'Similarity score',
    },
    form: {
        id: 'iaso.instance.formShort',
        defaultMessage: 'Form',
    },
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Action(s)',
    },
    alreadyMerged: {
        id: 'iaso.label.alreadyMerged',
        defaultMessage: 'Already merged',
    },
    alreadyIgnored: {
        id: 'iaso.label.alreadyIgnored',
        defaultMessage: 'Already ignored',
    },
    seeDetails: {
        id: 'iaso.label.seeDetails',
        defaultMessage: 'See details',
    },
    comparedFields: {
        id: 'iaso.label.comparedFields',
        defaultMessage: 'Compared fields',
    },
    fields: {
        id: 'iaso.label.fields',
        defaultMessage: 'Fields',
    },
    entityA: {
        id: 'iaso.label.entityA',
        defaultMessage: 'Entity A',
    },
    entityB: {
        id: 'iaso.label.entityB',
        defaultMessage: 'Entity B',
    },
    search: {
        id: 'iaso.search',
        defaultMessage: 'Search',
    },
    entityTypes: {
        id: 'iaso.entityTypes.title',
        defaultMessage: 'Entity types',
    },
    startDatefrom: {
        id: 'iaso.label.startDatefrom',
        defaultMessage: 'Start date from',
    },
    endDateUntil: {
        id: 'iaso.label.endDateUntil',
        defaultMessage: 'End date until',
    },
    submitterTeam: {
        id: 'iaso.label.submitterTeam',
        defaultMessage: 'Submitter team',
    },
    submitter: {
        id: 'iaso.label.submitter',
        defaultMessage: 'Submitter',
    },
    location: {
        id: 'iaso.forms.location',
        defaultMessage: 'Location',
    },
    showUnmatchedOnly: {
        id: 'iaso.label.showUnmatchedOnly',
        defaultMessage: 'Show unmatched fields only',
    },
    showIgnored: {
        id: 'iaso.label.showIgnored',
        defaultMessage: 'Show ignored',
    },
    showMerged: {
        id: 'iaso.label.showMerged',
        defaultMessage: 'Show merged',
    },
    algorithm: {
        id: 'iaso.label.algorithm',
        defaultMessage: 'Algorithm',
    },
    similarity: {
        id: 'iaso.label.similarity_score',
        defaultMessage: 'Similarity score',
    },
    finalValue: {
        id: 'iaso.label.finalValue',
        defaultMessage: 'Final value',
    },
    field: {
        id: 'iaso.label.field',
        defaultMessage: 'Field',
    },
    entities: {
        id: 'iaso.entities.title',
        defaultMessage: 'Entities',
    },
    algorithmRuns: {
        id: 'iaso.label.algorithmsRuns',
        defaultMessage: 'Algorithms runs',
    },
    algorithmsUsed: {
        id: 'iaso.label.algorithmsUsed',
        defaultMessage: 'Algorithms used',
    },
    unmatchedRemaining: {
        id: 'iaso.label.unmatchedRemaining',
        defaultMessage: 'Unmatched fields remaining',
    },
    compareDuplicates: {
        id: 'iaso.label.compareDuplicates',
        defaultMessage: 'Compare duplicates',
    },
    takeValuesFromA: {
        id: 'iaso.label.entities.takeValuesFromA',
        defaultMessage: 'Take all values from A',
    },
    takeValuesFromB: {
        id: 'iaso.label.entities.takeValuesFromB',
        defaultMessage: 'Take all values from B',
    },
    softDeleteA: {
        id: 'iaso.label.entities.deleteA',
        defaultMessage: 'Delete entity A',
    },
    softDeleteB: {
        id: 'iaso.label.entities.deleteB',
        defaultMessage: 'Delete entity B',
    },
    ignore: {
        id: 'iaso.label.ignore',
        defaultMessage: 'Ignore',
    },
    merge: {
        id: 'iaso.label.merge',
        defaultMessage: 'Merge',
    },
    reset: {
        id: 'iaso.storages.reset',
        defaultMessage: 'Reset',
    },
    submissionTitle: {
        defaultMessage: 'Submission',
        id: 'iaso.instance.titleSingle',
    },
    noSubmissionFound: {
        defaultMessage: 'No submission found',
        id: 'iaso.entity.label.noSubmissionFound',
    },
    submissionsForEntity: {
        defaultMessage: 'Submissions for entity {entity}',
        id: 'iaso.entity.label.submissionsForEntity',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    finished_at: {
        id: 'iaso.label.finished_at',
        defaultMessage: 'Finished at',
    },
    parameters: {
        id: 'iaso.label.parameters',
        defaultMessage: 'Parameters',
    },
    addParameters: {
        id: 'iaso.label.addParameters',
        defaultMessage: 'Add parameters',
    },
    removeParameter: {
        id: 'iaso.label.removeParameter',
        defaultMessage: 'Remove parameter',
    },
    parameterValue: {
        id: 'iaso.label.parameterValue',
        defaultMessage: 'Parameter Value',
    },
    entityType: {
        id: 'iaso.entityTypes.label',
        defaultMessage: 'Entity type',
    },
    latestAnalysis: {
        defaultMessage: 'Latest analysis completed: {finishedAt}',
        id: 'iaso.duplicate.latestAnalysis',
    },
    launchAnalysis: {
        defaultMessage: 'Launch analysis',
        id: 'iaso.duplicate.launchAnalysis',
    },
    relaunchAnalysis: {
        defaultMessage: 'Relaunch Analysis',
        id: 'iaso.duplicate.relaunchAnalysis',
    },
    noAnalysis: {
        defaultMessage: 'No analysis found',
        id: 'iaso.duplicate.noAnalysis',
    },
    analysisBusy: {
        defaultMessage: 'Analysis in progress',
        id: 'iaso.duplicate.analysisBusy',
    },
    confirm: {
        defaultMessage: 'Confirm',
        id: 'iaso.label.confirm',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.label.cancel',
    },
    messageErrorMissingFields: {
        defaultMessage:
            'No fields to analyse. You can set them up in the entities types page',
        id: 'iaso.duplicate.messageErrorMissingFields',
    },
});

export default MESSAGES;

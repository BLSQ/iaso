import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Submission',
        id: 'iaso.instance.duplicate',
    },
    submissionTitle: {
        defaultMessage: 'Submission',
        id: 'iaso.instance.titleSingle',
    },
    viewSubmissionDetails: {
        defaultMessage: 'View submission details',
        id: 'iaso.instance.details',
    },
    
    instanceLogsTitle: {
        id: 'iaso.instance.logs',
        defaultMessage: 'Compare all versions',
    },
    instanceLogsVersionA: {
        id: 'iaso.instance.logs.versionA',
        defaultMessage: 'Version A',
    },
    instanceLogsVersionB: {
        id: 'iaso.instance.logs.versionB',
        defaultMessage: 'Version B',
    },
    infos: {
        defaultMessage: 'Informations',
        id: 'iaso.instance.infos',
    },
    label: {
        defaultMessage: 'Label',
        id: 'iaso.label.label',
    },
    location: {
        defaultMessage: 'Location',
        id: 'iaso.map.location',
    },
    form: {
        defaultMessage: 'Form',
        id: 'iaso.instance.formShort',
    },
    downloadXml: {
        id: 'iaso.label.downloadXml',
        defaultMessage: 'Download XML',
    },
    error: {
        id: 'iaso.instance.error',
        defaultMessage: 'Cannot find a submission with this Id',
    },
    errorLog: {
        id: 'iaso.instance.logs.error',
        defaultMessage: 'Cannot find log with this Id',
    },
    last_modified_by: {
        id: 'iaso.instance.last_modified_by',
        defaultMessage: 'Modified by',
    },
    org_unit: {
        defaultMessage: 'Org unit',
        id: 'iaso.instance.org_unit',
    },
    period: {
        defaultMessage: 'Period',
        id: 'iaso.instance.period',
    },
    fetchLogUserError: {
        defaultMessage: 'User not found',
        id: 'iaso.snackBar.fetchInstanceLogUser',
    },
    fetchLogDetailError: {
        defaultMessage: 'An error occurred while fetching log details',
        id: 'iaso.snackBar.fetchingLogDetailError',
    },
});

export default MESSAGES;

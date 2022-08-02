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
});

export default MESSAGES;

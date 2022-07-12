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
        defaultMessage: 'Historique de la soumission',
    },
    instanceLogsDate: {
        id: 'iaso.instance.logs.date',
        defaultMessage: 'Date of submission',
    },
    infos: {
        defaultMessage: 'Informations',
        id: 'iaso.instance.infos',
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

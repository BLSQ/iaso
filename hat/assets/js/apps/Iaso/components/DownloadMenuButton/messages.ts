import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    download: {
        id: 'iaso.label.download',
        defaultMessage: 'Download',
    },
    preparing: {
        id: 'iaso.label.downloadPreparing',
        defaultMessage:
            'Preparing the file, this can take a while for big exports…',
    },
    downloadingPercent: {
        id: 'iaso.label.downloadingPercent',
        defaultMessage: 'Downloading: {percent}%',
    },
    downloadingSize: {
        id: 'iaso.label.downloadingSize',
        defaultMessage: 'Downloading: {size} MB',
    },
    parquetSimplifiedGeom: {
        id: 'iaso.label.parquetSimplifiedGeom',
        defaultMessage: 'Parquet (with simplified geometry)',
    },
});

export default MESSAGES;

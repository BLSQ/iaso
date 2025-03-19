import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    document: {
        id: 'iaso.label.document',
        defaultMessage: 'Document',
    },
    close: {
        defaultMessage: 'Close',
        id: 'blsq.buttons.label.close',
    },
    download: {
        defaultMessage: 'Download',
        id: 'iaso.label.download',
    },
    pageInfo: {
        defaultMessage: 'Page {current} of {total}',
        id: 'iaso.label.pageInfo',
    },
    fileScanResultSafe: {
        defaultMessage: 'This file is safe, no threat detected.',
        id: 'iaso.label.fileScanResultSafe',
    },
    fileScanResultInfected: {
        defaultMessage:
            'This file contains a virus or malware. Preview and download are unavailable.',
        id: 'iaso.label.fileScanResultInfected',
    },
    fileScanResultPending: {
        defaultMessage:
            'This file has not been scanned for viruses. Download it at your own risk.',
        id: 'iaso.label.fileScanResultPending',
    },
    fileScanResultError: {
        defaultMessage:
            'There was an error while scanning this file for viruses. Download it at your own risk.',
        id: 'iaso.label.fileScanResultError',
    },
    fileScanTimestamp: {
        defaultMessage: 'Scanned on {datetime}',
        id: 'iaso.label.fileScanTimestamp',
    },
});

export default MESSAGES;

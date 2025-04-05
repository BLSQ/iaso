import { useSafeIntl } from 'bluesquare-components';
import {
    fileScanResultError,
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import MESSAGES from './messages';

export const useFileScanHeaderText = (
    scanResult: string | undefined,
): string => {
    const { formatMessage } = useSafeIntl();

    if (scanResult === fileScanResultInfected) {
        return formatMessage(MESSAGES.fileScanResultInfected);
    }
    if (scanResult === fileScanResultClean) {
        return formatMessage(MESSAGES.fileScanResultSafe);
    }
    if (scanResult === fileScanResultError) {
        return formatMessage(MESSAGES.fileScanResultError);
    }
    return formatMessage(MESSAGES.fileScanResultPending);
};

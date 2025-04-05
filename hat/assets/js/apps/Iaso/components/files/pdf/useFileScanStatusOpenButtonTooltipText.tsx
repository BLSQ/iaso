import { useSafeIntl } from 'bluesquare-components';
import {
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import MESSAGES from './messages';

export const useFileScanStatusOpenButtonTooltipText = (
    scanResult: string | undefined,
): string => {
    const { formatMessage } = useSafeIntl();

    if (scanResult === fileScanResultClean) {
        return formatMessage(MESSAGES.fileScanSafeIconTooltip);
    }
    if (scanResult === fileScanResultInfected) {
        return formatMessage(MESSAGES.fileScanInfectedIconTooltip);
    }
    return formatMessage(MESSAGES.fileScanPendingIconTooltip);
};

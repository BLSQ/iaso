// import { useSafeIntl } from 'bluesquare-components';
import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../messages';

export const useGetFileTypes = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'VRF,PRE_ALERT,FORM_A',
                label: formatMessage(MESSAGES.all),
            },
            {
                value: 'VRF',
                label: formatMessage(MESSAGES.vrf),
            },
            {
                value: 'PRE_ALERT',
                label: formatMessage(MESSAGES.preAlerts),
            },
            {
                value: 'FORM_A',
                label: formatMessage(MESSAGES.formA),
            },
        ],
        [formatMessage],
    );
};

export const useGetReportFileTypes = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'INCIDENT,DESTRUCTION',
                label: formatMessage(MESSAGES.all),
            },
            {
                value: 'INCIDENT',
                label: formatMessage(MESSAGES.incidentReports),
            },
            {
                value: 'DESTRUCTION',
                label: formatMessage(MESSAGES.destructionReports),
            },
        ],
        [formatMessage],
    );
};

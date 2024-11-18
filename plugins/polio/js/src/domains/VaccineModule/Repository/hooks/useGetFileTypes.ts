// import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const useGetFileTypes = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'VRF,PRE_ALERT,FORM_A,INCIDENT,DESTRUCTION',
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

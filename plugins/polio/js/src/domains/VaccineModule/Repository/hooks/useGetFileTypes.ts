// import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
// import MESSAGES from '../messages';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const useGetFileTypes = (): DropdownOptions<string>[] => {
    // const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'VRF,PRE_ALERT,FORM_A,INCIDENT,DESTRUCTION',
                label: 'All',
            },
            {
                value: 'VRF',
                label: 'Vaccine Request Form',
            },
            {
                value: 'PRE_ALERT',
                label: 'Pre-alert',
            },
            {
                value: 'FORM_A',
                label: 'Form A',
            },
            {
                value: 'INCIDENT',
                label: 'Incident report',
            },
            {
                value: 'DESTRUCTION',
                label: 'Destruction report',
            },
        ],
        [],
    );
};

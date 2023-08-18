import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../../../../constants/messages';

export const useNopv2AuthTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.country),
                // id: 'country__name',
                accessor: 'country.name',
                sortable: true,
            },
            // {
            //     Header: formatMessage(MESSAGES.country),
            //     // id: 'country__name',
            //     accessor: 'country__name',
            //     sortable: true,
            // },
        ];
    }, [formatMessage]);
};
